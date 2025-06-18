/**
 * Progressive Loading System for Aster Management Frontend
 * Implements intelligent resource loading based on priority and user interaction
 */

import React from 'react'

interface LoadingPriority {
  immediate: number // 0-100ms
  high: number      // 100-500ms  
  normal: number    // 500-1000ms
  low: number       // 1000ms+
  idle: number      // When browser is idle
}

interface ResourceConfig {
  url: string
  priority: keyof LoadingPriority
  preload?: boolean
  condition?: () => boolean
  onLoad?: () => void
  onError?: (error: Error) => void
}

interface ProgressiveLoadingState {
  loadedResources: Set<string>
  loadingResources: Set<string>
  failedResources: Set<string>
  totalResources: number
  loadingProgress: number
}

class ProgressiveLoader {
  private static instance: ProgressiveLoader | null = null
  
  private loadingQueue: Map<keyof LoadingPriority, ResourceConfig[]> = new Map()
  private state: ProgressiveLoadingState = {
    loadedResources: new Set(),
    loadingResources: new Set(),
    failedResources: new Set(),
    totalResources: 0,
    loadingProgress: 0
  }
  
  private priorities: LoadingPriority = {
    immediate: 0,
    high: 100,
    normal: 500, 
    low: 1000,
    idle: 2000
  }

  private callbacks: Set<(state: ProgressiveLoadingState) => void> = new Set()
  private abortController: AbortController = new AbortController()

  private constructor() {
    this.initializeQueues()
    this.setupIdleCallback()
  }

  static getInstance(): ProgressiveLoader {
    if (!ProgressiveLoader.instance) {
      ProgressiveLoader.instance = new ProgressiveLoader()
    }
    return ProgressiveLoader.instance
  }

  /**
   * Add a resource to the loading queue
   */
  addResource(config: ResourceConfig): void {
    const queue = this.loadingQueue.get(config.priority) || []
    queue.push(config)
    this.loadingQueue.set(config.priority, queue)
    this.state.totalResources++
    this.updateProgress()
  }

  /**
   * Start loading resources based on priority
   */
  async startLoading(): Promise<void> {
    console.log('🚀 Starting progressive loading...')
    
    // Load immediate priority first
    await this.processPriorityQueue('immediate')
    
    // Schedule other priorities with delays
    setTimeout(() => this.processPriorityQueue('high'), this.priorities.high)
    setTimeout(() => this.processPriorityQueue('normal'), this.priorities.normal)
    setTimeout(() => this.processPriorityQueue('low'), this.priorities.low)
    
    // Idle loading will be handled by requestIdleCallback
  }

  /**
   * Process a priority queue
   */
  private async processPriorityQueue(priority: keyof LoadingPriority): Promise<void> {
    const queue = this.loadingQueue.get(priority) || []
    if (queue.length === 0) return

    console.log(`📦 Loading ${priority} priority resources (${queue.length} items)`)

    const loadPromises = queue.map(config => this.loadResource(config))
    
    try {
      await Promise.allSettled(loadPromises)
    } catch (error) {
      console.error(`❌ Error in ${priority} priority loading:`, error)
    }

    // Clear the processed queue
    this.loadingQueue.set(priority, [])
  }

  /**
   * Load an individual resource
   */
  private async loadResource(config: ResourceConfig): Promise<void> {
    // Check condition if provided
    if (config.condition && !config.condition()) {
      return
    }

    this.state.loadingResources.add(config.url)
    this.notifySubscribers()

    try {
      const startTime = performance.now()

      // Choose loading strategy based on resource type
      await this.loadByType(config)

      const loadTime = performance.now() - startTime
      console.log(`✅ Loaded ${config.url} in ${loadTime.toFixed(2)}ms`)

      this.state.loadedResources.add(config.url)
      this.state.loadingResources.delete(config.url)
      
      config.onLoad?.()
      
    } catch (error) {
      console.error(`❌ Failed to load ${config.url}:`, error)
      
      this.state.failedResources.add(config.url)
      this.state.loadingResources.delete(config.url)
      
      config.onError?.(error as Error)
    }

    this.updateProgress()
    this.notifySubscribers()
  }

  /**
   * Load resource based on its type
   */
  private async loadByType(config: ResourceConfig): Promise<void> {
    const url = config.url
    
    // JavaScript modules
    if (url.includes('.js') || url.startsWith('/_next/static/chunks/')) {
      return this.loadScript(url, config.preload)
    }
    
    // CSS stylesheets  
    if (url.includes('.css')) {
      return this.loadStylesheet(url, config.preload)
    }
    
    // Images
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return this.loadImage(url, config.preload)
    }
    
    // Fonts
    if (url.match(/\.(woff|woff2|ttf|otf)$/i)) {
      return this.loadFont(url, config.preload)
    }
    
    // Generic resource (fetch)
    return this.loadGeneric(url, config.preload)
  }

  /**
   * Load JavaScript with optional preload
   */
  private async loadScript(url: string, preload?: boolean): Promise<void> {
    if (preload) {
      this.addPreloadLink(url, 'script')
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = url
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`))
      document.head.appendChild(script)
    })
  }

  /**
   * Load CSS with optional preload
   */
  private async loadStylesheet(url: string, preload?: boolean): Promise<void> {
    if (preload) {
      this.addPreloadLink(url, 'style')
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`))
      document.head.appendChild(link)
    })
  }

  /**
   * Load image with optional preload
   */
  private async loadImage(url: string, preload?: boolean): Promise<void> {
    if (preload) {
      this.addPreloadLink(url, 'image')
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  }

  /**
   * Load font with preload
   */
  private async loadFont(url: string, preload?: boolean): Promise<void> {
    if (preload) {
      this.addPreloadLink(url, 'font', { crossorigin: 'anonymous' })
    }

    // Use CSS Font Loading API if available
    if ('fonts' in document) {
      const fontFace = new FontFace('preloaded-font', `url(${url})`)
      await fontFace.load()
      document.fonts.add(fontFace)
    } else {
      // Fallback to CSS loading
      return this.loadStylesheet(`data:text/css,@font-face{font-family:preloaded-font;src:url(${url})}`)
    }
  }

  /**
   * Load generic resource with fetch
   */
  private async loadGeneric(url: string, preload?: boolean): Promise<void> {
    if (preload) {
      this.addPreloadLink(url, 'fetch')
    }

    const response = await fetch(url, { 
      signal: this.abortController.signal 
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  /**
   * Add preload link to document head
   */
  private addPreloadLink(
    url: string, 
    type: string, 
    attributes: Record<string, string> = {}
  ): void {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = type
    
    Object.entries(attributes).forEach(([key, value]) => {
      link.setAttribute(key, value)
    })
    
    document.head.appendChild(link)
  }

  /**
   * Setup idle callback for low-priority loading
   */
  private setupIdleCallback(): void {
    if ('requestIdleCallback' in window) {
      const processIdleQueue = (deadline: IdleDeadline) => {
        while (deadline.timeRemaining() > 0 && this.loadingQueue.get('idle')?.length) {
          const queue = this.loadingQueue.get('idle') || []
          const config = queue.shift()
          if (config) {
            this.loadResource(config)
          }
        }

        // Schedule next idle callback if there are more resources
        if ((this.loadingQueue.get('idle')?.length || 0) > 0) {
          requestIdleCallback(processIdleQueue)
        }
      }

      requestIdleCallback(processIdleQueue)
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.processPriorityQueue('idle'), this.priorities.idle)
    }
  }

  /**
   * Initialize loading queues
   */
  private initializeQueues(): void {
    Object.keys(this.priorities).forEach(priority => {
      this.loadingQueue.set(priority as keyof LoadingPriority, [])
    })
  }

  /**
   * Update loading progress
   */
  private updateProgress(): void {
    const loaded = this.state.loadedResources.size + this.state.failedResources.size
    this.state.loadingProgress = this.state.totalResources > 0 
      ? Math.round((loaded / this.state.totalResources) * 100)
      : 0
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(callback: (state: ProgressiveLoadingState) => void): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(): void {
    this.callbacks.forEach(callback => callback({ ...this.state }))
  }

  /**
   * Get current loading state
   */
  getState(): ProgressiveLoadingState {
    return { ...this.state }
  }

  /**
   * Cancel all pending loads
   */
  cancelLoading(): void {
    this.abortController.abort()
    this.abortController = new AbortController()
    
    // Clear all queues
    Object.keys(this.priorities).forEach(priority => {
      this.loadingQueue.set(priority as keyof LoadingPriority, [])
    })
  }

  /**
   * Reset loader state
   */
  reset(): void {
    this.cancelLoading()
    this.state = {
      loadedResources: new Set(),
      loadingResources: new Set(),
      failedResources: new Set(),
      totalResources: 0,
      loadingProgress: 0
    }
    this.initializeQueues()
    this.notifySubscribers()
  }
}

// React hook for using progressive loader
export function useProgressiveLoader() {
  const [state, setState] = React.useState<ProgressiveLoadingState>(() => 
    ProgressiveLoader.getInstance().getState()
  )

  React.useEffect(() => {
    const loader = ProgressiveLoader.getInstance()
    return loader.subscribe(setState)
  }, [])

  const addResource = React.useCallback((config: ResourceConfig) => {
    ProgressiveLoader.getInstance().addResource(config)
  }, [])

  const startLoading = React.useCallback(() => {
    return ProgressiveLoader.getInstance().startLoading()
  }, [])

  const cancelLoading = React.useCallback(() => {
    ProgressiveLoader.getInstance().cancelLoading()
  }, [])

  const reset = React.useCallback(() => {
    ProgressiveLoader.getInstance().reset()
  }, [])

  return {
    ...state,
    addResource,
    startLoading,
    cancelLoading,
    reset
  }
}

// Utility functions for common loading patterns
export const loadingPatterns = {
  /**
   * Load critical above-the-fold resources immediately
   */
  loadCriticalResources(resources: string[]): void {
    const loader = ProgressiveLoader.getInstance()
    resources.forEach(url => {
      loader.addResource({
        url,
        priority: 'immediate',
        preload: true
      })
    })
  },

  /**
   * Load component dependencies when needed
   */
  loadComponentDependencies(componentName: string, dependencies: string[]): void {
    const loader = ProgressiveLoader.getInstance()
    dependencies.forEach(url => {
      loader.addResource({
        url,
        priority: 'high',
        preload: true,
        condition: () => {
          // Only load if component is likely to be used
          return document.querySelector(`[data-component="${componentName}"]`) !== null
        }
      })
    })
  },

  /**
   * Preload next route resources
   */
  preloadRoute(routePath: string, resources: string[]): void {
    const loader = ProgressiveLoader.getInstance()
    resources.forEach(url => {
      loader.addResource({
        url,
        priority: 'normal',
        preload: true,
        condition: () => window.location.pathname !== routePath
      })
    })
  },

  /**
   * Load resources during idle time
   */
  loadDuringIdle(resources: string[]): void {
    const loader = ProgressiveLoader.getInstance()
    resources.forEach(url => {
      loader.addResource({
        url,
        priority: 'idle'
      })
    })
  }
}

export default ProgressiveLoader