<template>
  <div 
    class="pdf-viewer flex flex-col h-full" 
    ref="viewerContainer"
    :class="{
      'fullscreen': isFullscreen,
      'mobile': isMobile,
      'gesturing': isGesturing,
      'annotation-mode': annotationMode
    }"
  >
    <!-- Desktop Toolbar -->
    <PdfViewerToolbar
      v-if="!isMobile || !isFullscreen"
      v-model:current-page="currentPage"
      v-model:scale="scale"
      :total-pages="totalPages"
      :loading="loading"
      :error="error"
      :min-scale="MIN_SCALE"
      :max-scale="MAX_SCALE"
      :keyboard-shortcuts="keyboardShortcuts"
      :enable-annotations="enableAnnotations"
      :annotation-mode="annotationMode"
      @previous-page="previousPage"
      @next-page="nextPage"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-fit="handleZoomFit"
      @zoom-width="handleZoomWidth"
      @zoom-actual="handleZoomActual"
      @rotate-clockwise="rotateClockwise"
      @toggle-fullscreen="toggleFullscreen"
      @go-to-page="goToPage"
      @toggle-annotation="(mode: string | null) => setAnnotationMode(mode as AnnotationType | null)"
    />
    
    <!-- PDF Content Container -->
    <div 
      class="pdf-container flex-1 overflow-auto bg-muted/20"
      ref="pdfContainer"
      @wheel="handleWheel"
      @keydown="handleKeydown"
      @scroll="handleScroll"
      tabindex="0"
      role="document"
      :aria-label="`PDF document with ${totalPages} pages, currently on page ${currentPage}`"
    >
      <!-- Loading State -->
      <div v-if="loading" class="pdf-loading flex flex-col items-center justify-center h-full p-8">
        <div class="space-y-4 w-full max-w-2xl">
          <Skeleton class="h-[600px] w-full" />
          <div class="flex items-center justify-center gap-2 text-muted-foreground">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <p>Loading PDF document...</p>
          </div>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="pdf-error flex items-center justify-center h-full p-8">
        <Alert variant="destructive" class="max-w-md">
          <AlertTriangle class="h-4 w-4" />
          <AlertTitle>Failed to load PDF</AlertTitle>
          <AlertDescription>
            {{ error }}
            <Button 
              variant="outline" 
              size="sm" 
              class="mt-2" 
              @click="retryLoad"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
      
      <!-- PDF Pages -->
      <div 
        v-else-if="totalPages > 0" 
        class="pdf-pages-container py-4"
        :class="viewMode === 'single' ? 'flex flex-col items-center' : 'grid grid-cols-1 gap-4'"
        :style="{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${gestureScale})`
        }"
      >
        <!-- Virtual scrolling container for performance -->
        <div
          v-for="pageNumber in visiblePages"
          :key="pageNumber"
          class="pdf-page-wrapper relative"
          :class="{
            'mb-4': viewMode === 'single',
            'shadow-lg': true
          }"
        >
          <!-- Page canvas -->
          <canvas
            :ref="el => setCanvasRef(el, pageNumber)"
            class="pdf-page border bg-white max-w-full"
            :class="{
              'ring-2 ring-primary': pageNumber === currentPage && viewMode === 'continuous'
            }"
            :data-page="pageNumber"
            :aria-label="`Page ${pageNumber} of ${totalPages}`"
            role="img"
          />
          
          <!-- Page number overlay -->
          <div 
            class="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs"
            :class="{ 'opacity-0': !showPageNumbers }"
          >
            {{ pageNumber }}
          </div>
          
          <!-- Text layer overlay (for text selection) -->
          <div
            v-if="enableTextLayer"
            :ref="el => setTextLayerRef(el, pageNumber)"
            class="pdf-text-layer absolute inset-0 pointer-events-auto"
            :data-page="pageNumber"
          />
          
          <!-- Annotation layer -->        
          <PdfAnnotationLayer
            v-if="enableAnnotations"
            :page="pageNumber"
            :scale="combinedScale"
            :annotations="annotations as any"
            :annotation-mode="annotationMode"
            :annotation-type="currentAnnotationType"
            :selected-annotation="selectedAnnotation"
            @add-annotation="addAnnotation"
            @update-annotation="updateAnnotation"
            @delete-annotation="deleteAnnotation"
            @select-annotation="selectAnnotation"
          />
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="pdf-empty flex items-center justify-center h-full p-8">
        <div class="text-center text-muted-foreground">
          <FileText class="h-12 w-12 mx-auto mb-4" />
          <h3 class="text-lg font-medium mb-2">No PDF loaded</h3>
          <p>Load a PDF document to start viewing</p>
        </div>
      </div>
    </div>
    
    <!-- Mobile Controls -->
    <PdfMobileControls
      v-if="enableMobileControls && isMobile"
      :current-page="currentPage"
      :total-pages="totalPages"
      :zoom-level="Math.round(combinedScale * 100)"
      :annotation-mode="annotationMode"
      :show-controls="!isFullscreen || isGesturing"
      @prev-page="previousPage"
      @next-page="nextPage"
      @go-to-page="goToPage"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-change="handleMobileZoomChange"
      @toggle-annotation="(mode: string | null) => setAnnotationMode(mode as AnnotationType | null)"
      @toggle-fullscreen="toggleFullscreen"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useResizeObserver, useEventListener, watchDebounced } from '@vueuse/core'
import { FileText, AlertTriangle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Components
import PdfViewerToolbar from './PdfViewerToolbar.vue'
import PdfAnnotationLayer from './PdfAnnotationLayer.vue'
import PdfMobileControls from './PdfMobileControls.vue'

// Composables
import { useEnhancedPdfViewer } from '~/composables/useEnhancedPdfViewer'
import { usePdfGestures } from '~/composables/usePdfGestures'
import { usePdfAnnotations } from '~/composables/usePdfAnnotations'
import { usePdfFullscreen } from '~/composables/usePdfFullscreen'
import { useIsMobile } from '~/composables/useIsMobile'

// Types
import type { AnnotationType } from '~/types/pdf-annotations'

export interface Props {
  /** PDF source - URL string or Uint8Array */
  src: string | Uint8Array
  /** Initial zoom scale */
  initialScale?: number
  /** Initial page number */
  initialPage?: number
  /** Enable keyboard shortcuts */
  keyboardShortcuts?: boolean
  /** Enable text layer for selection */
  enableTextLayer?: boolean
  /** View mode - single page or continuous */
  viewMode?: 'single' | 'continuous'
  /** Show page numbers overlay */
  showPageNumbers?: boolean
  /** Auto-load document on mount */
  autoLoad?: boolean
  /** Enable annotations */
  enableAnnotations?: boolean
  /** Enable mobile controls */
  enableMobileControls?: boolean
  /** Enable fullscreen functionality */
  enableFullscreen?: boolean
  /** Document ID for annotations */
  documentId?: string
}

interface Emits {
  (e: 'load', document: any): void
  (e: 'error', error: string): void
  (e: 'page-change', page: number): void
  (e: 'scale-change', scale: number): void
  (e: 'annotation-added', annotation: any): void
  (e: 'annotation-updated', annotation: any): void
  (e: 'annotation-deleted', annotation: any): void
  (e: 'fullscreen-change', isFullscreen: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  initialScale: 1,
  initialPage: 1,
  keyboardShortcuts: true,
  enableTextLayer: false,
  viewMode: 'single',
  showPageNumbers: true,
  autoLoad: true,
  enableAnnotations: true,
  enableMobileControls: true,
  enableFullscreen: true,
  documentId: () => `pdf-${Date.now()}`
})

const emit = defineEmits<Emits>()

// Mobile detection
const { isMobile } = useIsMobile()

// Enhanced PDF viewer composable with performance optimizations
const {
  enhancedState,
  isLoading,
  hasError,
  canGoNext,
  canGoPrevious,
  loadDocument,
  clearDocument,
  renderPage,
  goToPage,
  currentPage,
  totalPages,
  visiblePageNumbers,
  updateViewport,
  handleTouchEvent,
  setScale,
  scale,
  getPerformanceReport,
  adaptiveQuality,
  isOptimized,
  streaming,
  virtualScrolling,
  mobileOptimization,
  performanceMonitor
} = useEnhancedPdfViewer()

// Extract individual properties for backward compatibility
const loading = computed(() => isLoading.value)
const error = computed(() => enhancedState.value.error)
const visiblePages = computed(() => visiblePageNumbers.value)

// Zoom controls - use enhanced PDF viewer's built-in methods
const baseZoomIn = async () => {
  const newScale = Math.min(MAX_SCALE, scale.value * 1.25)
  await setScale(newScale)
}

const baseZoomOut = async () => {
  const newScale = Math.max(MIN_SCALE, scale.value / 1.25)
  await setScale(newScale)
}

// Navigation methods
const nextPage = async () => {
  if (canGoNext.value) {
    await goToPage(currentPage.value + 1)
  }
}

const previousPage = async () => {
  if (canGoPrevious.value) {
    await goToPage(currentPage.value - 1)
  }
}

// Zoom operations
const zoomToFit = () => {
  if (!pdfContainer.value) return
  const rect = pdfContainer.value.getBoundingClientRect()
  // Calculate fit scale based on container dimensions
  const fitScale = Math.min(
    (rect.width - 32) / 800, // Assume 800px default page width
    (rect.height - 32) / 1200 // Assume 1200px default page height
  )
  setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, fitScale)))
}

const zoomToWidth = () => {
  if (!pdfContainer.value) return
  const rect = pdfContainer.value.getBoundingClientRect()
  const widthScale = (rect.width - 32) / 800 // Assume 800px default page width
  setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, widthScale)))
}

// Memory management - use virtual scrolling cleanup
const clearInvisibleCanvases = () => {
  // Enhanced PDF viewer handles this automatically through virtual scrolling
  console.debug('Memory cleanup handled by virtual scrolling')
}

// Cleanup method
const destroy = async () => {
  await clearDocument()
}

// Scale limits (from enhanced viewer or defaults)
const MIN_SCALE = 0.25
const MAX_SCALE = 5.0

// Template refs
const viewerContainer = ref<HTMLElement | null>(null)
const pdfContainer = ref<HTMLElement | null>(null)

// Canvas and text layer refs
const canvasRefs = ref<Record<number, HTMLCanvasElement>>({})
const textLayerRefs = ref<Record<number, HTMLElement>>({})

// Viewer state
const rotation = ref(0)

// Touch gestures integration with enhanced mobile optimization
const {
  currentScale: gestureScale,
  panOffset,
  isGesturing,
  isPinching,
  setScale: setGestureScale,
  zoomIn: gestureZoomIn,
  zoomOut: gestureZoomOut
} = usePdfGestures(
  pdfContainer as Ref<HTMLElement | null>,
  {
    'scale-changed': handleGestureScaleChange,
    'next-page': nextPage,
    'prev-page': previousPage,
    'pan-changed': handlePanChange,
    'touch-event': (event: TouchEvent) => {
      // Forward touch events to enhanced PDF viewer for performance optimization
      return handleTouchEvent(event)
    }
  } as any
)

// Annotations integration
const {
  annotations,
  selectedAnnotation,
  annotationMode,
  getPageAnnotations,
  addAnnotation: addAnnotationToStore,
  updateAnnotation: updateAnnotationInStore,
  deleteAnnotation: deleteAnnotationFromStore,
  selectAnnotation,
  setAnnotationMode,
  loadAnnotations
} = usePdfAnnotations(props.documentId)

// Fullscreen integration  
const {
  isFullscreen,
  toggleFullscreen: toggleFS,
  isFullscreenSupported
} = usePdfFullscreen(viewerContainer)

// Current annotation type
const currentAnnotationType = ref<AnnotationType>('highlight')

// Combined scale for rendering
const combinedScale = computed(() => scale.value * gestureScale.value)

// Set canvas ref
const setCanvasRef = (el: any, pageNumber: number) => {
  const canvas = el as HTMLCanvasElement | null
  if (canvas) {
    canvasRefs.value[pageNumber] = canvas
    // Render page when canvas is available
    nextTick(() => renderPageOnCanvas(pageNumber))
  } else {
    delete canvasRefs.value[pageNumber]
  }
}

// Set text layer ref
const setTextLayerRef = (el: any, pageNumber: number) => {
  const element = el as HTMLElement | null
  if (element) {
    textLayerRefs.value[pageNumber] = element
  } else {
    delete textLayerRefs.value[pageNumber]
  }
}

// Enhanced page rendering with performance monitoring
const renderPageOnCanvas = async (pageNumber: number) => {
  const canvas = canvasRefs.value[pageNumber]
  if (!canvas || loading.value) return

  try {
    await renderPage(pageNumber, canvas, {
      scale: combinedScale.value,
      rotation: rotation.value,
      enableTextLayer: props.enableTextLayer,
      quality: adaptiveQuality.value,
      backgroundRender: !isGesturing.value
    })
    
    // Update performance metrics
    performanceMonitor.recordUserInteraction('pageRendered', { 
      pageNumber, 
      scale: combinedScale.value,
      quality: adaptiveQuality.value 
    })
  } catch (err) {
    console.error(`Failed to render page ${pageNumber}:`, err)
    performanceMonitor.recordUserInteraction('pageRenderError', { 
      pageNumber, 
      error: err instanceof Error ? err.message : String(err) 
    })
  }
}

// Virtual scrolling integration - update viewport when scrolling
const handleScroll = (event: Event) => {
  if (!pdfContainer.value) return
  
  const scrollTop = pdfContainer.value.scrollTop
  const viewportHeight = pdfContainer.value.clientHeight
  
  // Update enhanced PDF viewer's virtual scrolling
  const viewportResult = updateViewport(scrollTop, viewportHeight)
  
  // Update performance metrics
  performanceMonitor.updatePageMetrics(currentPage.value, viewportResult.visiblePages)
}

// Enhanced PDF document loading with performance monitoring
const loadPdf = async () => {
  if (!props.src) return

  try {
    // Start performance monitoring
    performanceMonitor.recordUserInteraction('loadStart', { src: typeof props.src })
    
    const pdf = await loadDocument(props.src)
    emit('load', pdf)
    
    // Load annotations if enabled
    if (props.enableAnnotations && props.documentId) {
      await loadAnnotations()
    }
    
    // Set initial page
    if (props.initialPage > 0 && props.initialPage <= totalPages.value) {
      await goToPage(props.initialPage)
    }
    
    // Log performance metrics after successful load
    const report = getPerformanceReport()
    console.debug('PDF loaded with performance metrics:', report)
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF'
    emit('error', errorMessage)
    
    // Record performance error
    performanceMonitor.recordUserInteraction('loadError', { 
      error: errorMessage,
      src: typeof props.src 
    })
  }
}

// Retry loading
const retryLoad = () => {
  loadPdf()
}

// Gesture event handlers
function handleGestureScaleChange(newScale: number) {
  // Gesture scale is managed by the composable
  // Re-rendering happens on gesture end
}

function handlePanChange(offset: { x: number; y: number }) {
  // Pan offset is handled by the gesture composable
}

// Zoom operations with gesture integration
const zoomIn = () => {
  if (isGesturing.value) {
    gestureZoomIn()
  } else {
    baseZoomIn()
  }
}

const zoomOut = () => {
  if (isGesturing.value) {
    gestureZoomOut()
  } else {
    baseZoomOut()
  }
}

// Mobile zoom handler
function handleMobileZoomChange(level: number) {
  const newScale = level / 100
  setScale(newScale)
  setGestureScale(newScale)
}

// Zoom operations
const handleZoomFit = () => {
  zoomToFit()
}

const handleZoomWidth = () => {
  zoomToWidth()
}

const handleZoomActual = () => {
  setScale(1.0)
  setGestureScale(1.0)
}

// Rotation
const rotateClockwise = () => {
  rotation.value = (rotation.value + 90) % 360
  // Re-render visible pages
  visiblePages.value.forEach(pageNumber => {
    renderPageOnCanvas(pageNumber)
  })
}

// Fullscreen
const toggleFullscreen = () => {
  if (props.enableFullscreen) {
    toggleFS()
  }
}

// Annotation handlers
const addAnnotation = async (annotationData: any) => {
  try {
    const annotation = await addAnnotationToStore(annotationData)
    emit('annotation-added', annotation)
  } catch (err) {
    console.error('Failed to add annotation:', err)
  }
}

const updateAnnotation = async (annotation: any) => {
  try {
    const updated = await updateAnnotationInStore(annotation.id, annotation)
    emit('annotation-updated', updated)
  } catch (err) {
    console.error('Failed to update annotation:', err)
  }
}

const deleteAnnotation = async (annotation: any) => {
  try {
    await deleteAnnotationFromStore(annotation.id)
    emit('annotation-deleted', annotation)
  } catch (err) {
    console.error('Failed to delete annotation:', err)
  }
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.keyboardShortcuts) return

  // Prevent default for handled keys
  const handleKey = (callback: () => void) => {
    event.preventDefault()
    callback()
  }

  switch (event.key) {
    case 'ArrowLeft':
      handleKey(previousPage)
      break
    case 'ArrowRight':
      handleKey(nextPage)
      break
    case 'Home':
      handleKey(() => goToPage(1))
      break
    case 'End':
      handleKey(() => goToPage(totalPages.value))
      break
    case '+':
    case '=':
      handleKey(zoomIn)
      break
    case '-':
      handleKey(zoomOut)
      break
    case '0':
      handleKey(handleZoomFit)
      break
    case '1':
      handleKey(handleZoomActual)
      break
    case '2':
      handleKey(handleZoomWidth)
      break
    case 'f':
    case 'F':
      handleKey(toggleFullscreen)
      break
    case 'r':
    case 'R':
      handleKey(rotateClockwise)
      break
    case 'h':
      if (props.enableAnnotations) {
        handleKey(() => setAnnotationMode(annotationMode.value === 'highlight' ? null : 'highlight'))
      }
      break
    case 'n':
      if (props.enableAnnotations) {
        handleKey(() => setAnnotationMode(annotationMode.value === 'note' ? null : 'note'))
      }
      break
    case 'Escape':
      if (selectedAnnotation.value) {
        handleKey(() => selectAnnotation(null))
      } else if (annotationMode.value) {
        handleKey(() => setAnnotationMode(null))
      } else if (isFullscreen.value) {
        handleKey(toggleFullscreen)
      }
      break
  }

  // Ctrl+G for go to page
  if (event.ctrlKey && event.key === 'g') {
    event.preventDefault()
    const page = prompt('Go to page:', currentPage.value.toString())
    if (page) {
      const pageNum = parseInt(page)
      if (pageNum >= 1 && pageNum <= totalPages.value) {
        goToPage(pageNum)
      }
    }
  }
}

// Mouse wheel zoom (with Ctrl)
const handleWheel = (event: WheelEvent) => {
  if (!event.ctrlKey && !event.metaKey) return

  event.preventDefault()
  
  const delta = event.deltaY
  if (delta < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

// Watch for scale changes and re-render with performance optimization
watch(scale, async () => {
  if (!isGesturing.value) {
    clearInvisibleCanvases()
    
    // Use performance-optimized rendering for all visible pages
    await Promise.all(
      visiblePages.value.map(pageNumber => renderPageOnCanvas(pageNumber))
    )
    
    emit('scale-change', scale.value)
    
    // Record scale change for performance monitoring
    performanceMonitor.recordUserInteraction('scaleChange', { 
      scale: scale.value,
      quality: adaptiveQuality.value 
    })
  }
})

// Watch for combined scale changes with optimized debouncing
watchDebounced(() => combinedScale.value, async () => {
  if (!isGesturing.value) {
    await nextTick()
    
    // Batch render visible pages for better performance
    const renderPromises = visiblePages.value.map(page => renderPageOnCanvas(page))
    await Promise.all(renderPromises)
    
    // Update virtual scrolling configuration if scale changed significantly
    if (pdfContainer.value) {
      const scrollTop = pdfContainer.value.scrollTop
      const viewportHeight = pdfContainer.value.clientHeight
      updateViewport(scrollTop, viewportHeight)
    }
  }
}, { debounce: 100 })

// Watch for gesture end to re-render at final scale with performance monitoring
watch(() => isGesturing.value, async (gesturing) => {
  if (!gesturing) {
    // Re-render all visible pages at final scale with performance tracking
    const startTime = performance.now()
    
    await nextTick()
    const renderPromises = visiblePages.value.map(page => renderPageOnCanvas(page))
    await Promise.all(renderPromises)
    
    const renderTime = performance.now() - startTime
    performanceMonitor.recordUserInteraction('gestureRenderComplete', { 
      renderTime,
      pageCount: visiblePages.value.length,
      finalScale: combinedScale.value
    })
  }
})

// Watch for annotation mode changes
watch(() => annotationMode.value, (mode) => {
  if (mode) {
    currentAnnotationType.value = mode
  }
})

// Watch for page changes
watch(currentPage, (newPage) => {
  emit('page-change', newPage)
})

// Watch for fullscreen changes
watch(isFullscreen, (fullscreen) => {
  emit('fullscreen-change', fullscreen)
})

// Watch for visible pages changes and render
watch(visiblePages, (newVisiblePages, oldVisiblePages) => {
  // Render newly visible pages
  const newPages = newVisiblePages.filter(page => !oldVisiblePages?.includes(page))
  newPages.forEach(pageNumber => {
    nextTick(() => renderPageOnCanvas(pageNumber))
  })
  
  // Clear invisible pages for memory management
  nextTick(clearInvisibleCanvases)
}, { deep: true })

// Resize observer to handle container size changes
useResizeObserver(pdfContainer, () => {
  // Re-render visible pages on container resize
  if (visiblePages.value.length > 0) {
    nextTick(() => {
      visiblePages.value.forEach(pageNumber => {
        renderPageOnCanvas(pageNumber)
      })
    })
  }
})

// Auto-load on mount
onMounted(() => {
  if (props.autoLoad && props.src) {
    loadPdf()
  }
  
  // Set initial scale
  if (props.initialScale !== 1) {
    setScale(props.initialScale)
  }
  
  // Focus container for keyboard navigation
  nextTick(() => {
    pdfContainer.value?.focus()
  })
})

// Enhanced cleanup on unmount with performance logging
onUnmounted(async () => {
  // Log final performance report before cleanup
  const finalReport = getPerformanceReport()
  console.debug('Final PDF viewer performance report:', finalReport)
  
  // Enhanced cleanup
  await destroy()
})

// Watch src changes
watch(() => props.src, (newSrc) => {
  if (newSrc && props.autoLoad) {
    loadPdf()
  }
})
</script>

<style scoped>
/* PDF viewer container */
.pdf-viewer {
  @apply relative bg-background;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.pdf-viewer.fullscreen {
  @apply fixed inset-0 z-50;
}

.pdf-viewer.mobile .pdf-container {
  @apply touch-pan-x touch-pan-y;
}

.pdf-viewer.gesturing {
  @apply select-none;
}

.pdf-viewer.annotation-mode .pdf-container {
  cursor: crosshair;
}

/* PDF container with custom scrollbars */
.pdf-container {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

.pdf-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.pdf-container::-webkit-scrollbar-track {
  background: transparent;
}

.pdf-container::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 4px;
}

.pdf-container::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--border) / 0.8);
}

/* PDF pages layout */
.pdf-pages-container {
  @apply px-4;
  min-height: 100%;
  transform-origin: center center;
  transition: transform 0.3s ease;
}

.pdf-viewer.gesturing .pdf-pages-container {
  transition: none;
}

/* Individual page styling */
.pdf-page {
  @apply block mx-auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}

.pdf-page:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Page wrapper */
.pdf-page-wrapper {
  @apply relative;
}

/* Text layer for selection */
.pdf-text-layer {
  @apply select-text;
  line-height: 1;
}

/* Loading animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Focus styles for accessibility */
.pdf-container:focus {
  @apply outline-none ring-2 ring-ring ring-offset-2;
}

/* Hide page numbers when not needed */
.pdf-page-wrapper:hover .absolute {
  @apply opacity-100;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .pdf-pages-container {
    @apply px-2;
  }
  
  .pdf-page {
    @apply w-full;
  }
  
  .pdf-viewer.fullscreen .pdf-pages-container {
    @apply px-1;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .pdf-page:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .pdf-container {
    -webkit-overflow-scrolling: touch;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .pdf-page {
    @apply border-2 border-border;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .pdf-page,
  .pdf-pages-container {
    transition: none;
  }
  
  .animate-spin {
    animation: none;
  }
}

/* Print styles */
@media print {
  .pdf-toolbar {
    @apply hidden;
  }
  
  .pdf-viewer {
    @apply h-auto;
  }
  
  .pdf-container {
    @apply overflow-visible h-auto;
  }
  
  .pdf-mobile-controls {
    @apply hidden;
  }
}
</style>