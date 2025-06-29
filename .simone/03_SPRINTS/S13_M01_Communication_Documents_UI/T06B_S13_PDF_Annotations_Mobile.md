---
task_id: T06B_S13
title: PDF Annotations and Mobile Features - Advanced viewer capabilities
status: planned
complexity: Medium
estimated_hours: 12
actual_hours: 0
assigned_to: ""
dependencies:
  - T06A_S13_Basic_PDF_Viewer
tags:
  - pdf-viewer
  - annotations
  - mobile-gestures
  - fullscreen
created_at: 2025-01-29T10:00:00Z
updated_at: 2025-01-29T10:00:00Z
---

# Task: PDF Annotations and Mobile Features - Advanced viewer capabilities

## Description
Extend the basic PDF viewer with advanced features including annotation capabilities (highlights, text notes), mobile touch gestures (pinch zoom, swipe navigation), fullscreen mode, and mobile-optimized UI controls. This task builds upon the foundational PDF viewer to provide a complete document interaction experience.

## Acceptance Criteria
- [ ] Basic annotations (highlight, text notes) can be added and saved
- [ ] Touch gestures (pinch zoom, swipe) work on mobile devices
- [ ] Full-screen mode toggles correctly with proper UI adjustments
- [ ] Mobile-specific controls overlay works seamlessly
- [ ] Annotation persistence and synchronization implemented
- [ ] Haptic feedback for mobile interactions
- [ ] Mobile UI adapts to safe areas (notches, home indicators)
- [ ] Annotation editing and deletion capabilities
- [ ] Smooth gesture animations and transitions
- [ ] Accessibility support for screen readers with annotations

## Technical Specifications

### Touch Gesture Integration

```typescript
// composables/usePdfGestures.ts
import { useTouchGestures } from '~/composables/useTouchGestures'

export function usePdfGestures(container: Ref<HTMLElement>) {
  const { 
    pinchScale, 
    dragOffset, 
    swipeDirection,
    isGesturing,
    gestureEnd 
  } = useTouchGestures(container, {
    enableHapticFeedback: true,
    preventDefaultTouch: true,
    pinchThreshold: 0.1,
    swipeThreshold: 50
  })
  
  const baseScale = ref(1)
  const currentScale = ref(1)
  const panOffset = ref({ x: 0, y: 0 })
  
  // Pinch to zoom with momentum
  watch(pinchScale, (scale) => {
    if (scale !== 1) {
      currentScale.value = Math.max(0.5, Math.min(3, baseScale.value * scale))
    }
  })
  
  // Handle gesture end - commit scale changes
  watch(gestureEnd, () => {
    if (pinchScale.value !== 1) {
      baseScale.value = currentScale.value
      // Emit scale change to parent component
      emit('scale-changed', currentScale.value)
    }
  })
  
  // Swipe for page navigation with haptic feedback
  watch(swipeDirection, (direction) => {
    if (direction === 'left') {
      navigator.vibrate?.(10) // Subtle haptic
      emit('next-page')
    }
    if (direction === 'right') {
      navigator.vibrate?.(10)
      emit('prev-page')
    }
  })
  
  // Pan for document positioning
  watch(dragOffset, (offset) => {
    if (!isGesturing.value) return
    panOffset.value = {
      x: offset.x,
      y: offset.y
    }
  })
  
  return {
    currentScale: readonly(currentScale),
    panOffset: readonly(panOffset),
    isGesturing: readonly(isGesturing)
  }
}
```

### Annotation System Architecture

```vue
<!-- components/document/PdfAnnotationLayer.vue -->
<template>
  <div 
    class="annotation-layer"
    :style="{ 
      transform: `scale(${scale})`,
      pointerEvents: annotationMode ? 'auto' : 'none'
    }"
    @mousedown="startAnnotation"
    @mousemove="updateAnnotation"
    @mouseup="endAnnotation"
    @touchstart="startAnnotation"
    @touchmove="updateAnnotation"
    @touchend="endAnnotation"
  >
    <!-- Existing annotations -->
    <div
      v-for="annotation in pageAnnotations"
      :key="annotation.id"
      class="pdf-annotation"
      :class="[`annotation-${annotation.type}`, { 'selected': selectedAnnotation?.id === annotation.id }]"
      :style="getAnnotationStyle(annotation)"
      @click="selectAnnotation(annotation)"
    >
      <div v-if="annotation.type === 'highlight'" class="highlight-overlay" />
      
      <div v-if="annotation.type === 'note'" class="note-marker">
        <MessageSquare class="h-4 w-4" />
        
        <!-- Note popup -->
        <div 
          v-if="selectedAnnotation?.id === annotation.id"
          class="note-popup"
        >
          <div class="note-content">
            <Textarea
              v-model="annotation.content"
              placeholder="Add your note..."
              class="min-h-[100px]"
              @blur="saveAnnotation(annotation)"
            />
            <div class="note-actions">
              <Button size="sm" @click="saveAnnotation(annotation)">
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                @click="deleteAnnotation(annotation)"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Active annotation being created -->
    <div
      v-if="activeAnnotation"
      class="annotation-preview"
      :class="`preview-${annotationType}`"
      :style="getAnnotationStyle(activeAnnotation)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PdfAnnotation, AnnotationType } from '~/types/pdf-annotations'

interface Props {
  page: number
  scale: number
  annotations: PdfAnnotation[]
  annotationMode: boolean
  annotationType: AnnotationType
}

const props = defineProps<Props>()
const emit = defineEmits<{
  addAnnotation: [annotation: Omit<PdfAnnotation, 'id' | 'createdAt' | 'createdBy'>]
  updateAnnotation: [annotation: PdfAnnotation]
  deleteAnnotation: [annotation: PdfAnnotation]
  selectAnnotation: [annotation: PdfAnnotation | null]
}>()

const selectedAnnotation = ref<PdfAnnotation | null>(null)
const activeAnnotation = ref<Partial<PdfAnnotation> | null>(null)
const isCreating = ref(false)

const pageAnnotations = computed(() => 
  props.annotations.filter(a => a.page === props.page)
)

const startAnnotation = (event: MouseEvent | TouchEvent) => {
  if (!props.annotationMode) return
  
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  const x = (clientX - rect.left) / props.scale
  const y = (clientY - rect.top) / props.scale
  
  activeAnnotation.value = {
    type: props.annotationType,
    page: props.page,
    coordinates: { x, y, width: 0, height: 0 }
  }
  
  isCreating.value = true
}

const updateAnnotation = (event: MouseEvent | TouchEvent) => {
  if (!isCreating.value || !activeAnnotation.value) return
  
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  const x = (clientX - rect.left) / props.scale
  const y = (clientY - rect.top) / props.scale
  
  const startX = activeAnnotation.value.coordinates!.x
  const startY = activeAnnotation.value.coordinates!.y
  
  activeAnnotation.value.coordinates = {
    x: Math.min(startX, x),
    y: Math.min(startY, y),
    width: Math.abs(x - startX),
    height: Math.abs(y - startY)
  }
}

const endAnnotation = () => {
  if (!isCreating.value || !activeAnnotation.value) return
  
  const { width = 0, height = 0 } = activeAnnotation.value.coordinates || {}
  
  // Only create annotation if it has meaningful size
  if (width > 5 && height > 5) {
    emit('addAnnotation', activeAnnotation.value as Omit<PdfAnnotation, 'id' | 'createdAt' | 'createdBy'>)
  }
  
  activeAnnotation.value = null
  isCreating.value = false
}
</script>

<style scoped>
.annotation-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.pdf-annotation {
  position: absolute;
  cursor: pointer;
  transition: all 0.2s ease;
}

.annotation-highlight {
  background-color: rgba(255, 235, 59, 0.3);
  border: 2px solid transparent;
}

.annotation-highlight.selected {
  border-color: rgba(255, 235, 59, 0.8);
}

.annotation-note {
  width: 24px;
  height: 24px;
}

.note-marker {
  position: relative;
  background-color: #fbbf24;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.note-popup {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  background: white;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  min-width: 250px;
  margin-top: 8px;
}

.note-popup::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid hsl(var(--border));
}

.note-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: flex-end;
}

.annotation-preview {
  position: absolute;
  pointer-events: none;
  opacity: 0.7;
}

.preview-highlight {
  background-color: rgba(255, 235, 59, 0.3);
  border: 2px dashed rgba(255, 235, 59, 0.8);
}

.preview-note {
  width: 24px;
  height: 24px;
  background-color: #fbbf24;
  border-radius: 50%;
  border: 2px dashed #f59e0b;
}
</style>
```

### Mobile Controls Component

```vue
<!-- components/document/PdfMobileControls.vue -->
<template>
  <div 
    class="pdf-mobile-controls"
    :class="{ 
      'safe-area-bottom': isIOS,
      'hidden': !showControls && !isControlsLocked
    }"
  >
    <!-- Main Controls Row -->
    <div class="controls-row">
      <Button 
        size="lg" 
        variant="ghost" 
        @click="$emit('prev-page')"
        :disabled="currentPage === 1"
        class="control-button"
      >
        <ChevronLeft class="h-6 w-6" />
      </Button>
      
      <div class="page-indicator">
        <span class="text-lg font-medium">
          {{ currentPage }} / {{ totalPages }}
        </span>
      </div>
      
      <Button 
        size="lg" 
        variant="ghost" 
        @click="$emit('next-page')"
        :disabled="currentPage === totalPages"
        class="control-button"
      >
        <ChevronRight class="h-6 w-6" />
      </Button>
    </div>
    
    <!-- Zoom Slider -->
    <div class="zoom-slider" v-if="showZoomSlider">
      <Button size="icon" variant="ghost" @click="$emit('zoom-out')">
        <ZoomOut class="h-4 w-4" />
      </Button>
      
      <Slider
        :model-value="[zoomLevel]"
        @update:model-value="handleZoomChange"
        :min="50"
        :max="200"
        :step="10"
        class="flex-1 mx-4"
      />
      
      <span class="zoom-label">{{ zoomLevel }}%</span>
      
      <Button size="icon" variant="ghost" @click="$emit('zoom-in')">
        <ZoomIn class="h-4 w-4" />
      </Button>
    </div>
    
    <!-- Annotation Tools -->
    <div class="annotation-tools" v-if="showAnnotationTools">
      <Button
        variant="ghost"
        size="sm"
        @click="toggleAnnotationMode('highlight')"
        :class="{ 'bg-accent': annotationMode === 'highlight' }"
      >
        <Highlighter class="h-4 w-4 mr-2" />
        Highlight
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        @click="toggleAnnotationMode('note')"
        :class="{ 'bg-accent': annotationMode === 'note' }"
      >
        <MessageSquare class="h-4 w-4 mr-2" />
        Note
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        @click="toggleAnnotationMode(null)"
        :class="{ 'bg-accent': !annotationMode }"
      >
        <Hand class="h-4 w-4 mr-2" />
        Pan
      </Button>
    </div>
    
    <!-- Control Toggle -->
    <Button
      class="controls-toggle"
      size="icon"
      variant="ghost"
      @click="toggleControlsLock"
    >
      <Lock v-if="isControlsLocked" class="h-4 w-4" />
      <Unlock v-else class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDevicesList } from '@vueuse/core'

interface Props {
  currentPage: number
  totalPages: number
  zoomLevel: number
  annotationMode: string | null
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showControls: true
})

const emit = defineEmits<{
  'prev-page': []
  'next-page': []
  'zoom-in': []
  'zoom-out': []
  'zoom-change': [level: number]
  'toggle-annotation': [mode: string | null]
}>()

const isControlsLocked = ref(false)
const showZoomSlider = ref(false)
const showAnnotationTools = ref(false)

// Detect iOS for safe area handling
const isIOS = computed(() => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
})

const handleZoomChange = (values: number[]) => {
  emit('zoom-change', values[0])
}

const toggleAnnotationMode = (mode: string | null) => {
  emit('toggle-annotation', mode)
}

const toggleControlsLock = () => {
  isControlsLocked.value = !isControlsLocked.value
}

// Auto-hide controls after 3 seconds of inactivity
let hideTimeout: NodeJS.Timeout | null = null

const resetHideTimeout = () => {
  if (hideTimeout) clearTimeout(hideTimeout)
  if (!isControlsLocked.value) {
    hideTimeout = setTimeout(() => {
      showZoomSlider.value = false
      showAnnotationTools.value = false
    }, 3000)
  }
}

onMounted(() => {
  resetHideTimeout()
})
</script>

<style scoped>
.pdf-mobile-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  color: white;
  padding: 1rem;
  transition: transform 0.3s ease;
  z-index: 50;
}

.pdf-mobile-controls.hidden {
  transform: translateY(100%);
}

.safe-area-bottom {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.control-button {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.zoom-slider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius);
}

.zoom-label {
  min-width: 40px;
  text-align: center;
  font-size: 0.875rem;
}

.annotation-tools {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.annotation-tools .bg-accent {
  background-color: rgba(59, 130, 246, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.5);
}

.controls-toggle {
  position: absolute;
  top: -50px;
  right: 1rem;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

/* Slider component override for dark theme */
:deep(.slider-track) {
  background-color: rgba(255, 255, 255, 0.2);
}

:deep(.slider-range) {
  background-color: rgba(59, 130, 246, 0.8);
}

:deep(.slider-thumb) {
  background-color: white;
  border: 2px solid rgba(59, 130, 246, 0.8);
}
</style>
```

### Fullscreen Mode Implementation

```typescript
// composables/usePdfFullscreen.ts
import { useFullscreen } from '@vueuse/core'

export function usePdfFullscreen(target: Ref<HTMLElement | undefined>) {
  const { isFullscreen, toggle, exit } = useFullscreen(target)
  
  const enterFullscreen = async () => {
    try {
      await toggle()
      // Lock orientation to landscape on mobile
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape').catch(() => {
          // Orientation lock failed, continue anyway
        })
      }
    } catch (error) {
      console.warn('Failed to enter fullscreen:', error)
    }
  }
  
  const exitFullscreen = async () => {
    try {
      await exit()
      // Unlock orientation
      if (screen.orientation?.unlock) {
        screen.orientation.unlock()
      }
    } catch (error) {
      console.warn('Failed to exit fullscreen:', error)
    }
  }
  
  // Handle fullscreen change events
  const handleFullscreenChange = () => {
    if (!isFullscreen.value) {
      // Cleanup when exiting fullscreen
      if (screen.orientation?.unlock) {
        screen.orientation.unlock()
      }
    }
  }
  
  onMounted(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
  })
  
  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  })
  
  return {
    isFullscreen: readonly(isFullscreen),
    enterFullscreen,
    exitFullscreen,
    toggle
  }
}
```

### Annotation Data Types

```typescript
// types/pdf-annotations.ts
export type AnnotationType = 'highlight' | 'note' | 'drawing'

export interface PdfAnnotation {
  id: string
  type: AnnotationType
  page: number
  coordinates: {
    x: number
    y: number
    width?: number
    height?: number
  }
  content?: string
  color?: string
  createdAt: Date
  createdBy: string
  updatedAt?: Date
  updatedBy?: string
}

export interface AnnotationStore {
  annotations: PdfAnnotation[]
  selectedAnnotation: PdfAnnotation | null
  annotationMode: AnnotationType | null
}

// composables/usePdfAnnotations.ts
export function usePdfAnnotations(documentId: string) {
  const annotations = ref<PdfAnnotation[]>([])
  const selectedAnnotation = ref<PdfAnnotation | null>(null)
  
  const addAnnotation = async (annotation: Omit<PdfAnnotation, 'id' | 'createdAt' | 'createdBy'>) => {
    const newAnnotation: PdfAnnotation = {
      ...annotation,
      id: generateId(),
      createdAt: new Date(),
      createdBy: currentUser.value.id
    }
    
    annotations.value.push(newAnnotation)
    await saveAnnotation(newAnnotation)
    return newAnnotation
  }
  
  const updateAnnotation = async (annotation: PdfAnnotation) => {
    const index = annotations.value.findIndex(a => a.id === annotation.id)
    if (index !== -1) {
      annotations.value[index] = {
        ...annotation,
        updatedAt: new Date(),
        updatedBy: currentUser.value.id
      }
      await saveAnnotation(annotations.value[index])
    }
  }
  
  const deleteAnnotation = async (annotation: PdfAnnotation) => {
    const index = annotations.value.findIndex(a => a.id === annotation.id)
    if (index !== -1) {
      annotations.value.splice(index, 1)
      await removeAnnotation(annotation.id)
    }
  }
  
  const saveAnnotation = async (annotation: PdfAnnotation) => {
    // API call to save annotation
    await $fetch(`/api/documents/${documentId}/annotations`, {
      method: 'POST',
      body: annotation
    })
  }
  
  const removeAnnotation = async (annotationId: string) => {
    // API call to remove annotation
    await $fetch(`/api/documents/${documentId}/annotations/${annotationId}`, {
      method: 'DELETE'
    })
  }
  
  const loadAnnotations = async () => {
    try {
      annotations.value = await $fetch(`/api/documents/${documentId}/annotations`)
    } catch (error) {
      console.error('Failed to load annotations:', error)
    }
  }
  
  return {
    annotations: readonly(annotations),
    selectedAnnotation: readonly(selectedAnnotation),
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    loadAnnotations
  }
}
```

## Implementation Steps

1. **Touch Gesture Integration** (3h)
   - Integrate existing touch gesture composable
   - Implement pinch to zoom with momentum
   - Add swipe navigation with haptic feedback
   - Create smooth gesture animations

2. **Annotation System Core** (4h)
   - Build annotation layer component
   - Implement highlight creation and selection
   - Add text note functionality with popups
   - Create annotation persistence API integration

3. **Mobile Controls and UI** (3h)
   - Build mobile control overlay
   - Implement auto-hide/show logic
   - Add safe area support for iOS devices
   - Create annotation tool toggles

4. **Fullscreen Mode** (2h)
   - Implement fullscreen functionality
   - Add orientation lock for mobile
   - Handle fullscreen state changes
   - Update UI for fullscreen mode

## Testing Requirements

- Touch gesture testing on various mobile devices
- Annotation creation and persistence tests
- Fullscreen mode functionality across browsers
- Mobile UI responsiveness and safe area handling
- Performance testing with annotation-heavy documents

## Dependencies

- T06A_S13_Basic_PDF_Viewer (completed basic viewer)
- Existing useTouchGestures composable
- @vueuse/core for fullscreen functionality
- API endpoints for annotation persistence

## Potential Challenges

- Touch gesture conflicts with browser native gestures
- Annotation positioning accuracy across different scales
- Performance impact of annotation rendering
- Cross-device annotation synchronization
- iOS Safari fullscreen limitations

## Success Metrics

- Smooth 60fps touch gestures on mobile devices
- Annotation accuracy within 2px of intended position
- Sub-200ms response time for annotation operations
- Zero conflicts with native browser gestures
- Seamless fullscreen transitions

## Future Enhancements

- Drawing/freehand annotation support
- Collaborative real-time annotations
- Voice notes attached to annotations
- Advanced annotation filtering and search
- Annotation export to PDF

## References

- [Touch Events Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Fullscreen API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [iOS Safari Specifics](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)