---
task_id: T06A_S13
title: Basic PDF Viewer - PDF.js integration with core navigation
status: planned
complexity: Medium
estimated_hours: 12
actual_hours: 0
assigned_to: ""
dependencies:
  - T05_S13_Document_Upload
tags:
  - pdf-viewer
  - document-management
  - core-features
created_at: 2025-01-29T10:00:00Z
updated_at: 2025-01-29T10:00:00Z
---

# Task: Basic PDF Viewer - PDF.js integration with core navigation

## Description
Implement the foundational PDF viewer component using PDF.js for Vue with essential viewing features including document rendering, zoom controls, page navigation, and performance optimization for large documents. This task focuses on core viewing functionality without annotations or advanced mobile gestures.

## Acceptance Criteria
- [ ] PDF.js successfully integrated with Vue 3 component wrapper
- [ ] Viewer renders PDF documents with proper page layout
- [ ] Zoom controls (in/out/fit/actual size) work correctly
- [ ] Page navigation (next/prev/go to page) functions properly
- [ ] Text selection and copy functionality works
- [ ] Viewer handles large PDFs (100+ pages) without performance issues
- [ ] Loading states and error handling implemented
- [ ] Keyboard shortcuts for navigation work
- [ ] Viewer is fully responsive across devices
- [ ] Virtual scrolling implemented for performance with large documents

## Technical Specifications

### PDF.js Vue Integration

**Recommended Approach: Custom PDF.js Integration**
```typescript
// Direct PDF.js integration for maximum control
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
```

### Component Architecture

```vue
<!-- components/document/BasicPdfViewer.vue -->
<template>
  <div class="pdf-viewer" ref="viewerContainer">
    <!-- Toolbar -->
    <PdfViewerToolbar
      v-model:scale="scale"
      v-model:currentPage="currentPage"
      :totalPages="totalPages"
      :loading="loading"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-fit="zoomFit"
      @zoom-width="zoomWidth"
      @previous-page="previousPage"
      @next-page="nextPage"
      @go-to-page="goToPage"
    />
    
    <!-- PDF Canvas Container -->
    <div 
      class="pdf-container"
      ref="pdfContainer"
      @wheel="handleWheel"
      @keydown="handleKeydown"
      tabindex="0"
    >
      <div v-if="loading" class="pdf-loading">
        <Skeleton class="h-[800px] w-full" />
        <p class="text-center mt-4">Loading PDF...</p>
      </div>
      
      <div v-else-if="error" class="pdf-error">
        <Alert variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertTitle>Failed to load PDF</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </div>
      
      <canvas
        v-for="page in visiblePages"
        :key="page"
        :ref="el => canvasRefs[page] = el"
        class="pdf-page"
        :data-page="page"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { useVirtualList } from '@vueuse/core'
import { useResizeObserver } from '@vueuse/core'

// Performance optimization for large PDFs
const RENDER_PAGES_BUFFER = 3
const CANVAS_MEMORY_LIMIT = 50 // MB

interface Props {
  src: string
  initialScale?: number
  initialPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialScale: 1,
  initialPage: 1
})

// Component state
const viewerContainer = ref<HTMLElement>()
const pdfContainer = ref<HTMLElement>()
const canvasRefs = ref<Record<number, HTMLCanvasElement>>({})
const pdfDocument = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(props.initialPage)
const scale = ref(props.initialScale)
const totalPages = ref(0)

// Performance optimization: only render visible pages
const visiblePages = computed(() => {
  if (!totalPages.value) return []
  
  const start = Math.max(1, currentPage.value - RENDER_PAGES_BUFFER)
  const end = Math.min(totalPages.value, currentPage.value + RENDER_PAGES_BUFFER)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
</script>
```

### Performance Optimization Strategies

1. **Virtual Scrolling for Large PDFs**
   ```typescript
   // Only render visible pages + buffer
   const visiblePages = computed(() => {
     const start = Math.max(1, currentPage.value - RENDER_PAGES_BUFFER)
     const end = Math.min(totalPages.value, currentPage.value + RENDER_PAGES_BUFFER)
     return Array.from({ length: end - start + 1 }, (_, i) => start + i)
   })
   ```

2. **Canvas Memory Management**
   ```typescript
   // Clear canvases when not visible
   const clearInvisibleCanvases = () => {
     Object.entries(canvasRefs.value).forEach(([page, canvas]) => {
       if (!visiblePages.value.includes(Number(page))) {
         const ctx = canvas?.getContext('2d')
         if (ctx && canvas) {
           ctx.clearRect(0, 0, canvas.width, canvas.height)
         }
       }
     })
   }
   ```

3. **Web Worker for PDF Processing**
   ```typescript
   // Offload PDF operations to worker
   const loadPdf = async (url: string) => {
     const loadingTask = pdfjsLib.getDocument({
       url,
       cMapUrl: '/cmaps/',
       cMapPacked: true,
       enableXfa: true
     })
     
     const pdf = await loadingTask.promise
     return pdf
   }
   ```

### Toolbar Component

```vue
<!-- components/document/PdfViewerToolbar.vue -->
<template>
  <div class="pdf-toolbar bg-background border-b p-2 flex items-center gap-4">
    <!-- Page Navigation -->
    <div class="toolbar-group flex items-center gap-2">
      <Button 
        size="icon" 
        variant="outline"
        @click="$emit('previous-page')" 
        :disabled="modelValue === 1 || loading"
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>
      
      <div class="page-input-group flex items-center gap-1">
        <Input
          :model-value="modelValue"
          @update:model-value="handlePageChange"
          type="number"
          :min="1"
          :max="totalPages"
          class="w-16 text-center"
          :disabled="loading"
        />
        <span class="text-sm text-muted-foreground">/ {{ totalPages || '...' }}</span>
      </div>
      
      <Button 
        size="icon" 
        variant="outline"
        @click="$emit('next-page')" 
        :disabled="modelValue === totalPages || loading"
      >
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
    
    <!-- Zoom Controls -->
    <div class="toolbar-group flex items-center gap-2">
      <Button 
        size="icon" 
        variant="outline"
        @click="$emit('zoom-out')"
        :disabled="loading"
      >
        <ZoomOut class="h-4 w-4" />
      </Button>
      
      <Select 
        :model-value="scaleDisplay" 
        @update:model-value="handleScaleChange"
        :disabled="loading"
      >
        <SelectTrigger class="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto</SelectItem>
          <SelectItem value="page-fit">Page Fit</SelectItem>
          <SelectItem value="page-width">Page Width</SelectItem>
          <SelectItem value="50">50%</SelectItem>
          <SelectItem value="75">75%</SelectItem>
          <SelectItem value="100">100%</SelectItem>
          <SelectItem value="125">125%</SelectItem>
          <SelectItem value="150">150%</SelectItem>
          <SelectItem value="200">200%</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        size="icon" 
        variant="outline"
        @click="$emit('zoom-in')"
        :disabled="loading"
      >
        <ZoomIn class="h-4 w-4" />
      </Button>
    </div>
    
    <!-- Document Info -->
    <div class="toolbar-group flex-1 text-sm text-muted-foreground">
      <span v-if="loading">Loading...</span>
      <span v-else-if="totalPages">{{ totalPages }} pages</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: number
  scale: number
  totalPages: number
  loading: boolean
}

interface Emits {
  (e: 'update:modelValue', value: number): void
  (e: 'update:scale', value: number): void
  (e: 'previous-page'): void
  (e: 'next-page'): void
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'zoom-fit'): void
  (e: 'zoom-width'): void
  (e: 'go-to-page', page: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const scaleDisplay = computed(() => {
  return Math.round(props.scale * 100).toString()
})

const handlePageChange = (value: string | number) => {
  const page = typeof value === 'string' ? parseInt(value) : value
  if (page >= 1 && page <= props.totalPages) {
    emit('update:modelValue', page)
    emit('go-to-page', page)
  }
}

const handleScaleChange = (value: string) => {
  switch (value) {
    case 'auto':
      emit('zoom-fit')
      break
    case 'page-fit':
      emit('zoom-fit')
      break
    case 'page-width':
      emit('zoom-width')
      break
    default:
      const scale = parseInt(value) / 100
      emit('update:scale', scale)
  }
}
</script>
```

### Core PDF Processing Logic

```typescript
// composables/usePdfViewer.ts
export function usePdfViewer() {
  const pdfDocument = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const loadDocument = async (src: string) => {
    loading.value = true
    error.value = null
    
    try {
      const loadingTask = pdfjsLib.getDocument({
        url: src,
        cMapUrl: '/cmaps/',
        cMapPacked: true
      })
      
      pdfDocument.value = await loadingTask.promise
      return pdfDocument.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load PDF'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const renderPage = async (
    pageNumber: number, 
    canvas: HTMLCanvasElement, 
    scale: number = 1
  ) => {
    if (!pdfDocument.value) return
    
    const page = await pdfDocument.value.getPage(pageNumber)
    const viewport = page.getViewport({ scale })
    
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    const context = canvas.getContext('2d')
    const renderContext = {
      canvasContext: context,
      viewport
    }
    
    await page.render(renderContext).promise
  }
  
  return {
    pdfDocument: readonly(pdfDocument),
    loading: readonly(loading),
    error: readonly(error),
    loadDocument,
    renderPage
  }
}
```

## Implementation Steps

1. **PDF.js Setup and Basic Integration** (3h)
   - Install PDF.js and configure web worker
   - Create basic viewer component structure
   - Implement PDF loading with error handling
   - Add loading states and basic error display

2. **Page Rendering and Navigation** (4h)
   - Implement page rendering with canvas
   - Add page navigation (next/prev/go to page)
   - Create virtual scrolling for performance
   - Add keyboard navigation support

3. **Zoom Functionality** (3h)
   - Implement zoom in/out controls
   - Add fit-to-page and fit-to-width modes
   - Create zoom dropdown with preset values
   - Add mouse wheel zoom support

4. **Toolbar and Controls** (2h)
   - Build comprehensive toolbar component
   - Integrate all navigation and zoom controls
   - Add responsive toolbar layout
   - Implement keyboard shortcuts (arrows, +/-, etc.)

## Testing Requirements

- Unit tests for PDF loading and rendering logic
- Component tests for toolbar controls and navigation
- Integration tests for large PDF performance
- E2E tests for basic viewer workflows
- Cross-browser compatibility testing
- Performance testing with various PDF sizes

## Dependencies

- `pdfjs-dist`: Core PDF.js library
- `@vueuse/core`: For virtual scrolling and utilities
- shadcn-vue components for UI elements
- Existing error handling utilities

## Potential Challenges

- Memory management with large PDFs (100+ pages)
- Cross-browser PDF rendering consistency
- Performance optimization for virtual scrolling
- Proper canvas cleanup to prevent memory leaks
- Handling different PDF formats and edge cases

## Success Metrics

- PDF loads within 2 seconds for documents under 10MB
- Smooth scrolling and navigation with 60fps
- Memory usage stays under 100MB for 100+ page documents
- Zero memory leaks during extended usage
- Works across all major browsers (Chrome, Firefox, Safari, Edge)

## Next Steps

This task will be followed by:
- T06B_S13_PDF_Annotations_Mobile.md - Advanced features including annotations and mobile gestures

## References

- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [PDF.js Examples](https://mozilla.github.io/pdf.js/examples/)
- [Vue Performance Best Practices](https://vuejs.org/guide/best-practices/performance.html)