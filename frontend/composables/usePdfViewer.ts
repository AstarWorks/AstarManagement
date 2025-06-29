import { ref, readonly, computed } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

export interface PdfPage {
  pageNumber: number
  canvas?: HTMLCanvasElement
  rendered: boolean
}

export interface PdfViewerState {
  totalPages: number
  currentPage: number
  scale: number
  loading: boolean
  error: string | null
}

export interface PdfRenderOptions {
  scale?: number
  rotation?: number
  enableTextLayer?: boolean
}

const RENDER_PAGES_BUFFER = 3
const DEFAULT_SCALE = 1.0
const MIN_SCALE = 0.25
const MAX_SCALE = 5.0

export function usePdfViewer() {
  // Core PDF state
  const pdfDocument = ref<PDFDocumentProxy | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Viewer state
  const currentPage = ref(1)
  const scale = ref(DEFAULT_SCALE)
  const totalPages = ref(0)
  const rotation = ref(0)
  
  // Performance tracking
  const renderedPages = ref<Set<number>>(new Set())
  const canvasRefs = ref<Record<number, HTMLCanvasElement>>({})
  
  // Computed properties
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const canGoNext = computed(() => currentPage.value < totalPages.value)
  const canGoPrevious = computed(() => currentPage.value > 1)
  
  // Calculate visible pages for virtual scrolling
  const visiblePages = computed(() => {
    if (!totalPages.value) return []
    
    const start = Math.max(1, currentPage.value - RENDER_PAGES_BUFFER)
    const end = Math.min(totalPages.value, currentPage.value + RENDER_PAGES_BUFFER)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })
  
  // Load PDF document
  const loadDocument = async (src: string | Uint8Array): Promise<PDFDocumentProxy> => {
    loading.value = true
    error.value = null
    
    try {
      // Clear previous state
      pdfDocument.value = null
      totalPages.value = 0
      currentPage.value = 1
      renderedPages.value.clear()
      canvasRefs.value = {}
      
      // Configure loading options
      const loadingTask = pdfjsLib.getDocument({
        url: typeof src === 'string' ? src : { data: src },
        cMapUrl: '/cmaps/',
        cMapPacked: true,
        enableXfa: true,
        verbosity: pdfjsLib.VerbosityLevel.ERRORS
      })
      
      // Load document
      const pdf = await loadingTask.promise
      pdfDocument.value = pdf
      totalPages.value = pdf.numPages
      
      return pdf
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF'
      error.value = errorMessage
      console.error('PDF loading error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Render a specific page
  const renderPage = async (
    pageNumber: number,
    canvas: HTMLCanvasElement,
    options: PdfRenderOptions = {}
  ): Promise<void> => {
    if (!pdfDocument.value) {
      throw new Error('No PDF document loaded')
    }
    
    if (pageNumber < 1 || pageNumber > totalPages.value) {
      throw new Error(`Invalid page number: ${pageNumber}`)
    }
    
    try {
      const page = await pdfDocument.value.getPage(pageNumber)
      const renderScale = options.scale ?? scale.value
      const renderRotation = options.rotation ?? rotation.value
      
      // Get viewport with rotation and scale
      const viewport = page.getViewport({ 
        scale: renderScale, 
        rotation: renderRotation 
      })
      
      // Set canvas dimensions
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      // Get 2D context
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas 2D context')
      }
      
      // Clear previous content
      context.clearRect(0, 0, canvas.width, canvas.height)
      
      // Render page
      const renderContext = {
        canvasContext: context,
        viewport,
        enableWebGL: false
      }
      
      await page.render(renderContext).promise
      
      // Mark page as rendered
      renderedPages.value.add(pageNumber)
      canvasRefs.value[pageNumber] = canvas
      
    } catch (err) {
      console.error(`Error rendering page ${pageNumber}:`, err)
      throw err
    }
  }
  
  // Navigation methods
  const goToPage = (pageNumber: number): boolean => {
    if (pageNumber < 1 || pageNumber > totalPages.value) {
      return false
    }
    currentPage.value = pageNumber
    return true
  }
  
  const nextPage = (): boolean => {
    if (!canGoNext.value) return false
    return goToPage(currentPage.value + 1)
  }
  
  const previousPage = (): boolean => {
    if (!canGoPrevious.value) return false
    return goToPage(currentPage.value - 1)
  }
  
  // Zoom methods
  const setScale = (newScale: number): void => {
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))
    scale.value = clampedScale
    
    // Clear rendered pages to force re-render at new scale
    renderedPages.value.clear()
  }
  
  const zoomIn = (): void => {
    setScale(scale.value * 1.25)
  }
  
  const zoomOut = (): void => {
    setScale(scale.value / 1.25)
  }
  
  const zoomToFit = (containerWidth: number, containerHeight: number): void => {
    if (!pdfDocument.value) return
    
    // Get first page to calculate dimensions
    pdfDocument.value.getPage(1).then((page) => {
      const viewport = page.getViewport({ scale: 1 })
      const scaleX = containerWidth / viewport.width
      const scaleY = containerHeight / viewport.height
      setScale(Math.min(scaleX, scaleY) * 0.9) // 90% of container
    })
  }
  
  const zoomToWidth = (containerWidth: number): void => {
    if (!pdfDocument.value) return
    
    pdfDocument.value.getPage(1).then((page) => {
      const viewport = page.getViewport({ scale: 1 })
      setScale((containerWidth / viewport.width) * 0.95) // 95% of container width
    })
  }
  
  // Memory management
  const clearInvisibleCanvases = (): void => {
    Object.entries(canvasRefs.value).forEach(([pageStr, canvas]) => {
      const pageNum = Number(pageStr)
      if (!visiblePages.value.includes(pageNum)) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        renderedPages.value.delete(pageNum)
      }
    })
  }
  
  // Get page info
  const getPageInfo = async (pageNumber: number) => {
    if (!pdfDocument.value) return null
    
    try {
      const page = await pdfDocument.value.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 1 })
      
      return {
        pageNumber,
        width: viewport.width,
        height: viewport.height,
        rotation: viewport.rotation
      }
    } catch (err) {
      console.error(`Error getting page ${pageNumber} info:`, err)
      return null
    }
  }
  
  // Text extraction (for search functionality)
  const extractPageText = async (pageNumber: number): Promise<string> => {
    if (!pdfDocument.value) return ''
    
    try {
      const page = await pdfDocument.value.getPage(pageNumber)
      const textContent = await page.getTextContent()
      return textContent.items
        .filter((item): item is any => 'str' in item)
        .map((item) => item.str)
        .join(' ')
    } catch (err) {
      console.error(`Error extracting text from page ${pageNumber}:`, err)
      return ''
    }
  }
  
  // Cleanup
  const destroy = (): void => {
    if (pdfDocument.value) {
      pdfDocument.value.destroy()
      pdfDocument.value = null
    }
    
    // Clear all state
    totalPages.value = 0
    currentPage.value = 1
    scale.value = DEFAULT_SCALE
    renderedPages.value.clear()
    canvasRefs.value = {}
    error.value = null
  }
  
  return {
    // State (readonly)
    pdfDocument: readonly(pdfDocument),
    loading: readonly(loading),
    error: readonly(error),
    currentPage: readonly(currentPage),
    scale: readonly(scale),
    totalPages: readonly(totalPages),
    rotation: readonly(rotation),
    
    // Computed
    isLoading,
    hasError,
    canGoNext,
    canGoPrevious,
    visiblePages,
    
    // Document operations
    loadDocument,
    destroy,
    
    // Page rendering
    renderPage,
    clearInvisibleCanvases,
    getPageInfo,
    extractPageText,
    
    // Navigation
    goToPage,
    nextPage,
    previousPage,
    
    // Zoom operations
    setScale,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToWidth,
    
    // Constants
    MIN_SCALE,
    MAX_SCALE,
    DEFAULT_SCALE
  }
}