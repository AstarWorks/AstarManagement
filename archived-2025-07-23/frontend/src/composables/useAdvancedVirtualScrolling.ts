import { ref, readonly, computed, onUnmounted } from 'vue'
import type { PDFPageProxy } from 'pdfjs-dist'

export interface VirtualConfig {
  bufferSize: number
  renderAhead: number
  renderBehind: number
  cleanupThreshold: number
  memoryLimit: number
  pageHeight: number
  recycleCanvases: boolean
}

export interface RenderedPage {
  pageNumber: number
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  lastAccessed: number
  renderTime: number
  memorySize: number
  isVisible: boolean
}

export interface ViewportInfo {
  scrollTop: number
  viewportHeight: number
  totalHeight: number
  visibleStartPage: number
  visibleEndPage: number
}

export interface CanvasPool {
  available: HTMLCanvasElement[]
  inUse: Map<number, HTMLCanvasElement>
  maxSize: number
  totalCreated: number
}

export interface MemoryStats {
  pagesInMemory: number
  totalMemoryUsed: number
  canvasPoolSize: number
  lastCleanupTime: number
  cleanupCount: number
}

/**
 * Advanced Virtual Scrolling Composable for PDF Viewer
 * 
 * Provides memory-efficient virtual scrolling for large legal documents
 * with intelligent page management, canvas pooling, and automatic cleanup.
 * 
 * Features:
 * - Virtual scrolling for 2000+ page documents
 * - Intelligent canvas pooling and reuse
 * - Memory pressure detection and cleanup
 * - Predictive page loading based on scroll patterns
 * - Performance optimization for legal document characteristics
 */
export function useAdvancedVirtualScrolling() {
  // Configuration state
  const virtualConfig = ref<VirtualConfig>({
    bufferSize: 10, // Pages in memory
    renderAhead: 3, // Pages to render ahead
    renderBehind: 2, // Pages to keep behind
    cleanupThreshold: 50, // Cleanup after N pages
    memoryLimit: 50 * 1024 * 1024, // 50MB memory limit
    pageHeight: 1200, // Default page height in pixels
    recycleCanvases: true
  })

  // Page management state
  const visiblePages = ref<Map<number, RenderedPage>>(new Map())
  const pendingRenders = ref<Set<number>>(new Set())
  const scrollDirection = ref<'up' | 'down' | 'idle'>('idle')
  const lastScrollTop = ref(0)
  const scrollVelocity = ref(0)

  // Canvas pool for memory efficiency
  const canvasPool = ref<CanvasPool>({
    available: [],
    inUse: new Map(),
    maxSize: 20,
    totalCreated: 0
  })

  // Memory tracking
  const memoryStats = ref<MemoryStats>({
    pagesInMemory: 0,
    totalMemoryUsed: 0,
    canvasPoolSize: 0,
    lastCleanupTime: 0,
    cleanupCount: 0
  })

  // Performance tracking
  const lastFrameTime = ref(0)
  const frameRates = ref<number[]>([])

  /**
   * Create or reuse a canvas from the pool
   */
  const acquireCanvas = (width: number, height: number): HTMLCanvasElement => {
    let canvas: HTMLCanvasElement

    if (canvasPool.value.available.length > 0 && virtualConfig.value.recycleCanvases) {
      canvas = canvasPool.value.available.pop()!
      canvas.width = width
      canvas.height = height
    } else {
      canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvasPool.value.totalCreated++
    }

    return canvas
  }

  /**
   * Return a canvas to the pool for reuse
   */
  const releaseCanvas = (canvas: HTMLCanvasElement, pageNumber?: number) => {
    if (pageNumber !== undefined) {
      canvasPool.value.inUse.delete(pageNumber)
    }

    if (virtualConfig.value.recycleCanvases && canvasPool.value.available.length < canvasPool.value.maxSize) {
      // Clear canvas content
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      canvasPool.value.available.push(canvas)
    }

    updateMemoryStats()
  }

  /**
   * Calculate current memory usage
   */
  const getCurrentMemoryUsage = (): number => {
    let totalMemory = 0

    visiblePages.value.forEach(page => {
      // Estimate memory usage: width * height * 4 bytes per pixel (RGBA)
      totalMemory += page.canvas.width * page.canvas.height * 4
    })

    // Add canvas pool memory
    canvasPool.value.available.forEach(canvas => {
      totalMemory += canvas.width * canvas.height * 4
    })

    return totalMemory
  }

  /**
   * Update memory statistics
   */
  const updateMemoryStats = () => {
    memoryStats.value = {
      pagesInMemory: visiblePages.value.size,
      totalMemoryUsed: getCurrentMemoryUsage(),
      canvasPoolSize: canvasPool.value.available.length,
      lastCleanupTime: memoryStats.value.lastCleanupTime,
      cleanupCount: memoryStats.value.cleanupCount
    }
  }

  /**
   * Calculate optimal page range based on viewport and scroll behavior
   */
  const calculateOptimalPageRange = (
    startPage: number, 
    endPage: number, 
    config: VirtualConfig
  ): number[] => {
    const pagesToRender: number[] = []

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pagesToRender.push(i)
    }

    // Add buffer pages based on scroll direction
    if (scrollDirection.value === 'down' || scrollDirection.value === 'idle') {
      // Add pages ahead
      for (let i = endPage + 1; i <= endPage + config.renderAhead; i++) {
        pagesToRender.push(i)
      }
    }

    if (scrollDirection.value === 'up' || scrollDirection.value === 'idle') {
      // Add pages behind
      for (let i = startPage - config.renderBehind; i < startPage; i++) {
        if (i > 0) {
          pagesToRender.push(i)
        }
      }
    }

    // Predictive loading based on scroll velocity
    if (Math.abs(scrollVelocity.value) > 500) {
      const predictiveDistance = Math.min(Math.floor(scrollVelocity.value / 200), 5)
      if (scrollDirection.value === 'down') {
        for (let i = endPage + config.renderAhead + 1; i <= endPage + config.renderAhead + predictiveDistance; i++) {
          pagesToRender.push(i)
        }
      } else if (scrollDirection.value === 'up') {
        for (let i = startPage - config.renderBehind - predictiveDistance; i < startPage - config.renderBehind; i++) {
          if (i > 0) {
            pagesToRender.push(i)
          }
        }
      }
    }

    return Array.from(new Set(pagesToRender)).sort((a, b) => a - b)
  }

  /**
   * Identify pages for cleanup based on distance from viewport
   */
  const identifyPagesForCleanup = (
    currentPages: Map<number, RenderedPage>, 
    pagesToKeep: number[]
  ): number[] => {
    const pagesToCleanup: number[] = []
    const keepSet = new Set(pagesToKeep)

    currentPages.forEach((page, pageNumber) => {
      if (!keepSet.has(pageNumber)) {
        pagesToCleanup.push(pageNumber)
      }
    })

    // Sort by last accessed time (cleanup oldest first)
    pagesToCleanup.sort((a, b) => {
      const pageA = currentPages.get(a)
      const pageB = currentPages.get(b)
      return (pageA?.lastAccessed || 0) - (pageB?.lastAccessed || 0)
    })

    return pagesToCleanup
  }

  /**
   * Perform emergency cleanup when memory limit is exceeded
   */
  const performEmergencyCleanup = () => {
    console.warn('Performing emergency cleanup due to memory pressure')

    const currentTime = Date.now()
    const pagesArray = Array.from(visiblePages.value.entries())
    
    // Sort by last accessed time and remove oldest pages
    pagesArray.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
    
    const pagesToRemove = Math.ceil(pagesArray.length * 0.3) // Remove 30% of pages
    
    for (let i = 0; i < pagesToRemove && i < pagesArray.length; i++) {
      const [pageNumber, page] = pagesArray[i]
      releaseCanvas(page.canvas, pageNumber)
      visiblePages.value.delete(pageNumber)
    }

    memoryStats.value.lastCleanupTime = currentTime
    memoryStats.value.cleanupCount++
    updateMemoryStats()
  }

  /**
   * Calculate viewport information from scroll position
   */
  const calculateViewportInfo = (scrollTop: number, viewportHeight: number, totalPages: number): ViewportInfo => {
    const pageHeight = virtualConfig.value.pageHeight
    const totalHeight = totalPages * pageHeight

    const visibleStartPage = Math.max(1, Math.floor(scrollTop / pageHeight) + 1)
    const visibleEndPage = Math.min(totalPages, Math.ceil((scrollTop + viewportHeight) / pageHeight))

    return {
      scrollTop,
      viewportHeight,
      totalHeight,
      visibleStartPage,
      visibleEndPage
    }
  }

  /**
   * Update scroll metrics and direction
   */
  const updateScrollMetrics = (scrollTop: number) => {
    const currentTime = performance.now()
    const deltaY = scrollTop - lastScrollTop.value
    const deltaTime = currentTime - lastFrameTime.value

    if (deltaTime > 0) {
      scrollVelocity.value = Math.abs(deltaY) / deltaTime
      
      // Update scroll direction
      if (Math.abs(deltaY) > 5) {
        scrollDirection.value = deltaY > 0 ? 'down' : 'up'
      }

      // Track frame rate
      const frameRate = 1000 / deltaTime
      frameRates.value.push(frameRate)
      if (frameRates.value.length > 60) {
        frameRates.value = frameRates.value.slice(-60) // Keep last 60 frames
      }
    }

    lastScrollTop.value = scrollTop
    lastFrameTime.value = currentTime
  }

  /**
   * Main update function called on scroll
   */
  const updateVisiblePages = (scrollTop: number, viewportHeight: number, totalPages: number) => {
    updateScrollMetrics(scrollTop)

    const viewportInfo = calculateViewportInfo(scrollTop, viewportHeight, totalPages)
    const pagesToRender = calculateOptimalPageRange(
      viewportInfo.visibleStartPage,
      viewportInfo.visibleEndPage,
      virtualConfig.value
    )

    // Filter pages that are within valid range
    const validPagesToRender = pagesToRender.filter(pageNum => pageNum >= 1 && pageNum <= totalPages)
    
    // Identify pages to cleanup
    const pagesToCleanup = identifyPagesForCleanup(visiblePages.value, validPagesToRender)

    // Cleanup pages outside buffer
    pagesToCleanup.forEach(pageNum => {
      const page = visiblePages.value.get(pageNum)
      if (page) {
        releaseCanvas(page.canvas, pageNum)
        visiblePages.value.delete(pageNum)
      }
    })

    // Update visibility status for remaining pages
    visiblePages.value.forEach((page, pageNum) => {
      page.isVisible = pageNum >= viewportInfo.visibleStartPage && pageNum <= viewportInfo.visibleEndPage
      if (page.isVisible) {
        page.lastAccessed = Date.now()
      }
    })

    // Memory pressure check
    const currentMemory = getCurrentMemoryUsage()
    if (currentMemory > virtualConfig.value.memoryLimit) {
      performEmergencyCleanup()
    }

    updateMemoryStats()

    return {
      viewportInfo,
      pagesToRender: validPagesToRender,
      pagesCleanedUp: pagesToCleanup.length
    }
  }

  /**
   * Add a rendered page to the visible pages map
   */
  const addRenderedPage = (
    pageNumber: number,
    canvas: HTMLCanvasElement,
    renderTime: number
  ) => {
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to get canvas context')
    }

    const page: RenderedPage = {
      pageNumber,
      canvas,
      context,
      lastAccessed: Date.now(),
      renderTime,
      memorySize: canvas.width * canvas.height * 4,
      isVisible: false
    }

    visiblePages.value.set(pageNumber, page)
    canvasPool.value.inUse.set(pageNumber, canvas)
    updateMemoryStats()
  }

  /**
   * Get rendered page by number
   */
  const getRenderedPage = (pageNumber: number): RenderedPage | undefined => {
    const page = visiblePages.value.get(pageNumber)
    if (page) {
      page.lastAccessed = Date.now()
    }
    return page
  }

  /**
   * Clear all rendered pages and reset state
   */
  const clearAllPages = () => {
    visiblePages.value.forEach((page, pageNumber) => {
      releaseCanvas(page.canvas, pageNumber)
    })
    visiblePages.value.clear()
    pendingRenders.value.clear()
    updateMemoryStats()
  }

  /**
   * Update virtual scrolling configuration
   */
  const updateVirtualConfig = (newConfig: Partial<VirtualConfig>) => {
    virtualConfig.value = { ...virtualConfig.value, ...newConfig }
  }

  // Computed properties
  const averageFrameRate = computed(() => {
    if (frameRates.value.length === 0) return 60
    return frameRates.value.reduce((a, b) => a + b, 0) / frameRates.value.length
  })

  const memoryPressure = computed(() => {
    const currentMemory = getCurrentMemoryUsage()
    const limit = virtualConfig.value.memoryLimit
    return Math.min(currentMemory / limit, 1) * 100
  })

  const isMemoryPressureHigh = computed(() => memoryPressure.value > 80)

  // Cleanup on unmount
  onUnmounted(() => {
    clearAllPages()
  })

  return {
    // Configuration
    virtualConfig: readonly(virtualConfig),
    updateVirtualConfig,

    // Page management
    visiblePages: readonly(visiblePages),
    updateVisiblePages,
    addRenderedPage,
    getRenderedPage,
    clearAllPages,

    // Canvas pool
    acquireCanvas,
    releaseCanvas,

    // Memory management
    memoryStats: readonly(memoryStats),
    getCurrentMemoryUsage,
    performEmergencyCleanup,
    memoryPressure,
    isMemoryPressureHigh,

    // Performance metrics
    averageFrameRate,
    scrollDirection: readonly(scrollDirection),
    scrollVelocity: readonly(scrollVelocity)
  }
}