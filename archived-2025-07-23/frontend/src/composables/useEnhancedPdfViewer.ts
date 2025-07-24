import { ref, readonly, computed, watch, onUnmounted } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { useAdvancedPdfStreaming } from './useAdvancedPdfStreaming'
import { useAdvancedVirtualScrolling } from './useAdvancedVirtualScrolling'
import { useMobilePerformanceOptimization } from './useMobilePerformanceOptimization'
import { usePdfPerformanceMonitoring } from './usePdfPerformanceMonitoring'

export interface EnhancedPdfPage {
  pageNumber: number
  canvas?: HTMLCanvasElement
  rendered: boolean
  lastAccessed: number
  renderTime: number
  visible: boolean
}

export interface EnhancedPdfViewerState {
  totalPages: number
  currentPage: number
  scale: number
  loading: boolean
  error: string | null
  performanceScore: number
  memoryUsage: number
  frameRate: number
}

export interface EnhancedRenderOptions {
  scale?: number
  rotation?: number
  enableTextLayer?: boolean
  quality?: 'low' | 'medium' | 'high'
  priorityRender?: boolean
  backgroundRender?: boolean
}

export interface ViewportUpdateResult {
  visiblePages: number[]
  renderedPages: number[]
  cleanedPages: number[]
  memoryUsed: number
}

const DEFAULT_SCALE = 1.0
const MIN_SCALE = 0.25
const MAX_SCALE = 5.0

/**
 * Enhanced PDF Viewer Composable
 * 
 * Provides a high-performance PDF viewer with advanced streaming,
 * memory management, mobile optimization, and performance monitoring.
 * 
 * Features:
 * - Advanced chunked streaming for large documents
 * - Virtual scrolling with intelligent memory management
 * - Mobile-optimized touch and gesture handling
 * - Real-time performance monitoring and alerting
 * - Adaptive quality based on device capabilities
 * - Network-aware streaming and caching
 */
export function useEnhancedPdfViewer() {
  // Initialize performance composables
  const streamingService = useAdvancedPdfStreaming()
  const virtualScrolling = useAdvancedVirtualScrolling()
  const mobileOptimization = useMobilePerformanceOptimization()
  const performanceMonitor = usePdfPerformanceMonitoring()

  // Core PDF state
  const pdfDocument = ref<PDFDocumentProxy | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Viewer state
  const currentPage = ref(1)
  const scale = ref(DEFAULT_SCALE)
  const totalPages = ref(0)
  const rotation = ref(0)
  
  // Enhanced page management
  const enhancedPages = ref<Map<number, EnhancedPdfPage>>(new Map())
  const renderQueue = ref<Set<number>>(new Set())
  const preloadQueue = ref<Set<number>>(new Set())
  
  // Performance state
  const isOptimized = ref(true)
  const adaptiveQuality = ref<'low' | 'medium' | 'high'>('high')

  // Computed properties
  const isLoading = computed(() => loading.value || streamingService.isLoading.value)
  const hasError = computed(() => !!error.value)
  const canGoNext = computed(() => currentPage.value < totalPages.value)
  const canGoPrevious = computed(() => currentPage.value > 1)
  
  const enhancedState = computed((): EnhancedPdfViewerState => ({
    totalPages: totalPages.value,
    currentPage: currentPage.value,
    scale: scale.value,
    loading: isLoading.value,
    error: error.value,
    performanceScore: performanceMonitor.overallPerformanceScore.value,
    memoryUsage: virtualScrolling.getCurrentMemoryUsage(),
    frameRate: performanceMonitor.realTimeMetrics.value.currentFrameRate
  }))

  const visiblePageNumbers = computed(() => {
    return Array.from(virtualScrolling.visiblePages.value.keys())
  })

  /**
   * Load PDF document with enhanced streaming
   */
  const loadDocument = async (src: string | Uint8Array): Promise<PDFDocumentProxy> => {
    return performanceMonitor.measurePerformance('initialLoad', async () => {
      loading.value = true
      error.value = null
      
      try {
        // Clear previous state
        await clearDocument()
        
        let pdf: PDFDocumentProxy

        if (typeof src === 'string') {
          // Use advanced streaming for URLs
          pdf = await streamingService.loadDocumentWithAdvancedStreaming(src, {
            progressCallback: (loaded, total, metrics) => {
              // Update progress and metrics
              if (metrics) {
                performanceMonitor.recordUserInteraction('loadProgress', { loaded, total })
              }
            },
            qualityCallback: (quality) => {
              console.debug('Network quality detected:', quality)
              adaptStreamingQuality(quality)
            },
            errorCallback: (error) => {
              console.error('Streaming error:', error)
              // Fallback to standard loading if streaming fails
            }
          })
        } else {
          // Use standard loading for binary data
          const loadingTask = pdfjsLib.getDocument({
            data: src,
            cMapUrl: '/cmaps/',
            cMapPacked: true,
            enableXfa: true,
            verbosity: pdfjsLib.VerbosityLevel.ERRORS
          })
          pdf = await loadingTask.promise
        }
        
        pdfDocument.value = pdf
        totalPages.value = pdf.numPages
        
        // Initialize performance monitoring
        performanceMonitor.updatePageMetrics(currentPage.value, [currentPage.value])
        
        // Adapt quality based on device capabilities
        await adaptToDeviceCapabilities()
        
        return pdf
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF'
        error.value = errorMessage
        console.error('Enhanced PDF loading error:', err)
        throw err
      } finally {
        loading.value = false
      }
    })
  }

  /**
   * Adapt streaming quality based on network conditions
   */
  const adaptStreamingQuality = (networkQuality: any) => {
    const config = streamingService.streamingConfig.value
    
    if (networkQuality.effectiveType === '2g' || networkQuality.saveData) {
      adaptiveQuality.value = 'low'
      virtualScrolling.updateVirtualConfig({
        bufferSize: 5,
        renderAhead: 1,
        renderBehind: 1
      })
    } else if (networkQuality.effectiveType === '3g') {
      adaptiveQuality.value = 'medium'
    } else {
      adaptiveQuality.value = 'high'
    }
  }

  /**
   * Adapt performance based on device capabilities
   */
  const adaptToDeviceCapabilities = async () => {
    const capabilities = await mobileOptimization.detectDeviceCapabilities()
    const profile = mobileOptimization.performanceProfile.value

    // Update virtual scrolling config based on device
    if (capabilities.isMobile) {
      virtualScrolling.updateVirtualConfig({
        bufferSize: profile.renderQuality === 'low' ? 3 : 5,
        renderAhead: 2,
        renderBehind: 1,
        memoryLimit: 30 * 1024 * 1024 // 30MB for mobile
      })
    }

    // Update performance thresholds
    performanceMonitor.updatePerformanceThresholds({
      maxInitialLoadTime: capabilities.isMobile ? 2000 : 1000,
      maxMemoryUsage: capabilities.isMobile ? 30 * 1024 * 1024 : 50 * 1024 * 1024,
      minFrameRate: profile.frameRate
    })
  }

  /**
   * Enhanced page rendering with performance optimization
   */
  const renderPage = async (
    pageNumber: number,
    canvas: HTMLCanvasElement,
    options: EnhancedRenderOptions = {}
  ): Promise<void> => {
    if (!pdfDocument.value) {
      throw new Error('No PDF document loaded')
    }

    return performanceMonitor.measurePerformance('pageRender', async () => {
      const page = await pdfDocument.value!.getPage(pageNumber)
      const viewport = page.getViewport({ 
        scale: options.scale || scale.value, 
        rotation: options.rotation || rotation.value 
      })

      // Adapt canvas size based on quality setting
      const qualityMultiplier = getQualityMultiplier()
      canvas.width = viewport.width * qualityMultiplier
      canvas.height = viewport.height * qualityMultiplier
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`

      const context = canvas.getContext('2d')!
      context.scale(qualityMultiplier, qualityMultiplier)

      // Configure render context based on device capabilities
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enableWebGL: !mobileOptimization.deviceCapabilities.value.isMobile,
        renderInteractiveForms: true
      }

      await page.render(renderContext).promise

      // Add to virtual scrolling manager
      const renderTime = performance.now()
      virtualScrolling.addRenderedPage(pageNumber, canvas, renderTime)

      // Update enhanced pages tracking
      enhancedPages.value.set(pageNumber, {
        pageNumber,
        canvas,
        rendered: true,
        lastAccessed: Date.now(),
        renderTime,
        visible: true
      })

      // Record performance metrics
      performanceMonitor.recordUserInteraction('pageRendered', { pageNumber, renderTime })

    }, { pageNumber })
  }

  /**
   * Get quality multiplier based on current settings
   */
  const getQualityMultiplier = (): number => {
    const devicePixelRatio = window.devicePixelRatio || 1
    
    switch (adaptiveQuality.value) {
      case 'low':
        return Math.min(devicePixelRatio, 1)
      case 'medium':
        return Math.min(devicePixelRatio, 1.5)
      case 'high':
      default:
        return devicePixelRatio
    }
  }

  /**
   * Update viewport with enhanced virtual scrolling
   */
  const updateViewport = (
    scrollTop: number, 
    viewportHeight: number
  ): ViewportUpdateResult => {
    const result = virtualScrolling.updateVisiblePages(scrollTop, viewportHeight, totalPages.value)
    
    // Update performance monitoring
    performanceMonitor.updatePageMetrics(currentPage.value, result.viewportInfo.visibleStartPage <= currentPage.value && currentPage.value <= result.viewportInfo.visibleEndPage ? [currentPage.value] : [])
    
    // Queue pages for rendering
    result.pagesToRender.forEach(pageNumber => {
      if (!virtualScrolling.getRenderedPage(pageNumber)) {
        renderQueue.value.add(pageNumber)
      }
    })

    // Process render queue
    processRenderQueue()

    return {
      visiblePages: result.pagesToRender,
      renderedPages: Array.from(virtualScrolling.visiblePages.value.keys()),
      cleanedPages: [],
      memoryUsed: virtualScrolling.getCurrentMemoryUsage()
    }
  }

  /**
   * Process the render queue efficiently
   */
  const processRenderQueue = async () => {
    if (renderQueue.value.size === 0) return

    const canvas = virtualScrolling.acquireCanvas(800, 1200) // Default size
    const pageNumber = Array.from(renderQueue.value)[0]
    renderQueue.value.delete(pageNumber)

    try {
      await renderPage(pageNumber, canvas, {
        quality: adaptiveQuality.value,
        backgroundRender: true
      })
    } catch (error) {
      console.error(`Failed to render page ${pageNumber}:`, error)
      virtualScrolling.releaseCanvas(canvas)
    }

    // Continue processing queue
    if (renderQueue.value.size > 0) {
      requestAnimationFrame(processRenderQueue)
    }
  }

  /**
   * Navigate to specific page with performance tracking
   */
  const goToPage = async (pageNumber: number): Promise<void> => {
    if (pageNumber < 1 || pageNumber > totalPages.value) {
      throw new Error('Invalid page number')
    }

    return performanceMonitor.measurePerformance('pageNavigation', async () => {
      currentPage.value = pageNumber
      performanceMonitor.recordUserInteraction('pageNavigation', { pageNumber })
      
      // Update virtual scrolling to ensure page is rendered
      const scrollTop = (pageNumber - 1) * virtualScrolling.virtualConfig.value.pageHeight
      updateViewport(scrollTop, window.innerHeight)
    })
  }

  /**
   * Handle optimized touch events
   */
  const handleTouchEvent = (event: TouchEvent): boolean => {
    performanceMonitor.recordUserInteraction('touch', { 
      touches: event.touches.length,
      type: event.type 
    })
    
    return mobileOptimization.optimizeTouchHandling(event)
  }

  /**
   * Handle zoom with performance optimization
   */
  const setScale = async (newScale: number): Promise<void> => {
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))
    
    return performanceMonitor.measurePerformance('zoom', async () => {
      scale.value = clampedScale
      
      // Clear rendered pages to re-render at new scale
      virtualScrolling.clearAllPages()
      enhancedPages.value.clear()
      
      // Update virtual scrolling configuration for new scale
      const newPageHeight = 1200 * clampedScale
      virtualScrolling.updateVirtualConfig({ pageHeight: newPageHeight })
      
      performanceMonitor.recordUserInteraction('zoom', { scale: clampedScale })
    })
  }

  /**
   * Clear document and reset state
   */
  const clearDocument = async (): Promise<void> => {
    if (pdfDocument.value) {
      await pdfDocument.value.destroy()
    }
    
    pdfDocument.value = null
    totalPages.value = 0
    currentPage.value = 1
    error.value = null
    
    virtualScrolling.clearAllPages()
    enhancedPages.value.clear()
    renderQueue.value.clear()
    preloadQueue.value.clear()
    
    streamingService.cancelLoading()
  }

  /**
   * Get comprehensive performance metrics
   */
  const getPerformanceReport = () => {
    return {
      viewer: enhancedState.value,
      streaming: streamingService.performanceMetrics.value,
      virtualScrolling: virtualScrolling.memoryStats.value,
      mobile: mobileOptimization.getTouchMetrics(),
      monitoring: performanceMonitor.getPerformanceSummary(),
      network: streamingService.connectionStatus.value
    }
  }

  // Watch for performance issues and adapt
  watch(
    () => performanceMonitor.hasPerformanceIssues.value,
    (hasIssues) => {
      if (hasIssues) {
        console.warn('Performance issues detected, adapting quality')
        if (adaptiveQuality.value === 'high') {
          adaptiveQuality.value = 'medium'
        } else if (adaptiveQuality.value === 'medium') {
          adaptiveQuality.value = 'low'
        }
      }
    }
  )

  // Cleanup on unmount
  onUnmounted(async () => {
    await clearDocument()
  })

  return {
    // Core state
    enhancedState,
    isLoading,
    hasError,
    canGoNext,
    canGoPrevious,
    
    // Document operations
    loadDocument,
    clearDocument,
    
    // Page management
    renderPage,
    goToPage,
    currentPage: readonly(currentPage),
    totalPages: readonly(totalPages),
    visiblePageNumbers,
    
    // Viewport and scrolling
    updateViewport,
    
    // Interaction handling
    handleTouchEvent,
    setScale,
    scale: readonly(scale),
    
    // Performance
    getPerformanceReport,
    adaptiveQuality: readonly(adaptiveQuality),
    isOptimized: readonly(isOptimized),
    
    // Sub-composables for advanced features
    streaming: streamingService,
    virtualScrolling,
    mobileOptimization,
    performanceMonitor
  }
}