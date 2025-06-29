<template>
  <div class="pdf-viewer flex flex-col h-full" ref="viewerContainer">
    <!-- Toolbar -->
    <PdfViewerToolbar
      v-model:current-page="currentPage"
      v-model:scale="scale"
      :total-pages="totalPages"
      :loading="loading"
      :error="error"
      :min-scale="MIN_SCALE"
      :max-scale="MAX_SCALE"
      :keyboard-shortcuts="keyboardShortcuts"
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
    />
    
    <!-- PDF Content Container -->
    <div 
      class="pdf-container flex-1 overflow-auto bg-muted/20"
      ref="pdfContainer"
      @wheel="handleWheel"
      @keydown="handleKeydown"
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
    
    <!-- Fullscreen overlay -->
    <div
      v-if="isFullscreen"
      class="fixed inset-0 z-50 bg-background"
      @keydown.esc="exitFullscreen"
    >
      <BasicPdfViewer
        :src="src"
        :keyboard-shortcuts="keyboardShortcuts"
        :enable-text-layer="enableTextLayer"
        :view-mode="viewMode"
        @exit-fullscreen="exitFullscreen"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useResizeObserver, useEventListener } from '@vueuse/core'
import { usePdfViewer } from '~/composables/usePdfViewer'
import { FileText, AlertTriangle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import PdfViewerToolbar from './PdfViewerToolbar.vue'

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
}

interface Emits {
  (e: 'load', document: any): void
  (e: 'error', error: string): void
  (e: 'page-change', page: number): void
  (e: 'scale-change', scale: number): void
  (e: 'exit-fullscreen'): void
}

const props = withDefaults(defineProps<Props>(), {
  initialScale: 1,
  initialPage: 1,
  keyboardShortcuts: true,
  enableTextLayer: false,
  viewMode: 'single',
  showPageNumbers: true,
  autoLoad: true
})

const emit = defineEmits<Emits>()

// PDF viewer composable
const {
  pdfDocument,
  loading,
  error,
  currentPage,
  scale,
  totalPages,
  visiblePages,
  loadDocument,
  renderPage,
  goToPage,
  nextPage,
  previousPage,
  zoomIn,
  zoomOut,
  setScale,
  zoomToFit,
  zoomToWidth,
  clearInvisibleCanvases,
  destroy,
  MIN_SCALE,
  MAX_SCALE
} = usePdfViewer()

// Template refs
const viewerContainer = ref<HTMLElement>()
const pdfContainer = ref<HTMLElement>()

// Canvas and text layer refs
const canvasRefs = ref<Record<number, HTMLCanvasElement>>({})
const textLayerRefs = ref<Record<number, HTMLElement>>({})

// Viewer state
const isFullscreen = ref(false)
const rotation = ref(0)

// Set canvas ref
const setCanvasRef = (el: HTMLCanvasElement | null, pageNumber: number) => {
  if (el) {
    canvasRefs.value[pageNumber] = el
    // Render page when canvas is available
    nextTick(() => renderPageOnCanvas(pageNumber))
  } else {
    delete canvasRefs.value[pageNumber]
  }
}

// Set text layer ref
const setTextLayerRef = (el: HTMLElement | null, pageNumber: number) => {
  if (el) {
    textLayerRefs.value[pageNumber] = el
  } else {
    delete textLayerRefs.value[pageNumber]
  }
}

// Render page on canvas
const renderPageOnCanvas = async (pageNumber: number) => {
  const canvas = canvasRefs.value[pageNumber]
  if (!canvas || loading.value || !pdfDocument.value) return

  try {
    await renderPage(pageNumber, canvas, {
      scale: scale.value,
      rotation: rotation.value,
      enableTextLayer: props.enableTextLayer
    })
  } catch (err) {
    console.error(`Failed to render page ${pageNumber}:`, err)
  }
}

// Load PDF document
const loadPdf = async () => {
  if (!props.src) return

  try {
    const pdf = await loadDocument(props.src)
    emit('load', pdf)
    
    // Set initial page
    if (props.initialPage > 0 && props.initialPage <= totalPages.value) {
      goToPage(props.initialPage)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF'
    emit('error', errorMessage)
  }
}

// Retry loading
const retryLoad = () => {
  loadPdf()
}

// Zoom operations
const handleZoomFit = () => {
  if (!pdfContainer.value) return
  const rect = pdfContainer.value.getBoundingClientRect()
  zoomToFit(rect.width - 32, rect.height - 32) // Account for padding
}

const handleZoomWidth = () => {
  if (!pdfContainer.value) return
  const rect = pdfContainer.value.getBoundingClientRect()
  zoomToWidth(rect.width - 32) // Account for padding
}

const handleZoomActual = () => {
  setScale(1.0)
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
  isFullscreen.value = !isFullscreen.value
}

const exitFullscreen = () => {
  isFullscreen.value = false
  emit('exit-fullscreen')
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
    case 'Escape':
      if (isFullscreen.value) {
        handleKey(exitFullscreen)
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

// Watch for scale changes and re-render
watch(scale, () => {
  clearInvisibleCanvases()
  visiblePages.value.forEach(pageNumber => {
    renderPageOnCanvas(pageNumber)
  })
  emit('scale-change', scale.value)
})

// Watch for page changes
watch(currentPage, (newPage) => {
  emit('page-change', newPage)
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

// Cleanup on unmount
onUnmounted(() => {
  destroy()
})

// Watch src changes
watch(() => props.src, (newSrc) => {
  if (newSrc && props.autoLoad) {
    loadPdf()
  }
})

// Keyboard shortcut help
useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === '?' && props.keyboardShortcuts) {
    // This will be handled by the toolbar component
  }
})
</script>

<style scoped>
/* PDF viewer container */
.pdf-viewer {
  @apply relative bg-background;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .pdf-pages-container {
    @apply px-2;
  }
  
  .pdf-page {
    @apply w-full;
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
  .pdf-page {
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
}
</style>