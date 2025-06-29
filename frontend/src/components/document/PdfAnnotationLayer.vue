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
      :class="[
        `annotation-${annotation.type}`, 
        { 'selected': selectedAnnotation?.id === annotation.id }
      ]"
      :style="getAnnotationStyle(annotation)"
      @click="selectAnnotation(annotation)"
    >
      <!-- Highlight overlay -->
      <div 
        v-if="annotation.type === 'highlight'" 
        class="highlight-overlay"
        :style="{ backgroundColor: annotation.color || '#FBBF24' }"
      />
      
      <!-- Note marker with popup -->
      <div v-if="annotation.type === 'note'" class="note-marker">
        <MessageSquare class="h-4 w-4" />
        
        <!-- Note popup -->
        <div 
          v-if="selectedAnnotation?.id === annotation.id"
          class="note-popup"
          @click.stop
        >
          <div class="note-content">
            <Textarea
              v-model="annotation.content"
              placeholder="Add your note..."
              class="min-h-[100px] resize-none"
              @blur="saveAnnotation(annotation)"
              @keydown.esc="selectAnnotation(null)"
            />
            <div class="note-actions">
              <Button 
                size="sm" 
                @click="saveAnnotation(annotation)"
                :disabled="!annotation.content?.trim()"
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                @click="deleteAnnotation(annotation)"
              >
                Delete
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                @click="selectAnnotation(null)"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Drawing annotation (future enhancement) -->
      <div v-if="annotation.type === 'drawing'" class="drawing-overlay">
        <!-- SVG path for drawing would go here -->
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
import { ref, computed, watch, nextTick } from 'vue'
import { MessageSquare } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import type { PdfAnnotation, AnnotationType } from '~/types/pdf-annotations'

interface Props {
  page: number
  scale: number
  annotations: PdfAnnotation[]
  annotationMode: AnnotationType | null
  annotationType: AnnotationType
  selectedAnnotation: PdfAnnotation | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addAnnotation: [annotation: Omit<PdfAnnotation, 'id' | 'createdAt' | 'createdBy'>]
  updateAnnotation: [annotation: PdfAnnotation]
  deleteAnnotation: [annotation: PdfAnnotation]
  selectAnnotation: [annotation: PdfAnnotation | null]
}>()

// Local state for annotation creation
const activeAnnotation = ref<Partial<PdfAnnotation> | null>(null)
const isCreating = ref(false)
const startPosition = ref<{ x: number; y: number } | null>(null)

// Get annotations for current page
const pageAnnotations = computed(() => 
  props.annotations.filter(a => a.page === props.page)
)

// Calculate annotation position and size styles
const getAnnotationStyle = (annotation: Partial<PdfAnnotation>): Record<string, string> => {
  if (!annotation.coordinates) return {}
  
  const { x, y, width = 0, height = 0 } = annotation.coordinates
  
  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: width > 0 ? `${width}px` : 'auto',
    height: height > 0 ? `${height}px` : 'auto'
  }
}

// Get pointer position relative to the annotation layer
const getRelativePosition = (event: MouseEvent | TouchEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY
  
  return {
    x: (clientX - rect.left) / props.scale,
    y: (clientY - rect.top) / props.scale
  }
}

// Start creating annotation
const startAnnotation = (event: MouseEvent | TouchEvent) => {
  if (!props.annotationMode) return
  
  event.preventDefault()
  event.stopPropagation()
  
  const position = getRelativePosition(event)
  startPosition.value = position
  
  activeAnnotation.value = {
    type: props.annotationType,
    page: props.page,
    coordinates: { 
      x: position.x, 
      y: position.y, 
      width: 0, 
      height: 0 
    }
  }
  
  isCreating.value = true
}

// Update annotation during creation
const updateAnnotation = (event: MouseEvent | TouchEvent) => {
  if (!isCreating.value || !activeAnnotation.value || !startPosition.value) return
  
  event.preventDefault()
  event.stopPropagation()
  
  const currentPosition = getRelativePosition(event)
  const startPos = startPosition.value
  
  // Calculate bounding box
  const minX = Math.min(startPos.x, currentPosition.x)
  const minY = Math.min(startPos.y, currentPosition.y)
  const maxX = Math.max(startPos.x, currentPosition.x)
  const maxY = Math.max(startPos.y, currentPosition.y)
  
  activeAnnotation.value.coordinates = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

// Complete annotation creation
const endAnnotation = async () => {
  if (!isCreating.value || !activeAnnotation.value) return
  
  const { width = 0, height = 0 } = activeAnnotation.value.coordinates || {}
  
  // Different minimum size requirements for different annotation types
  const minSize = props.annotationType === 'note' ? 5 : 10
  
  if (width >= minSize && height >= minSize) {
    // For notes, we need to create the annotation first, then show the editor
    if (props.annotationType === 'note') {
      activeAnnotation.value.content = ''
    }
    
    emit('addAnnotation', activeAnnotation.value as Omit<PdfAnnotation, 'id' | 'createdAt' | 'createdBy'>)
    
    // For notes, auto-select the new annotation to show the editor
    if (props.annotationType === 'note') {
      await nextTick()
      // Find the newly created annotation (it should be the last one for this page)
      const newAnnotation = pageAnnotations.value[pageAnnotations.value.length - 1]
      if (newAnnotation) {
        selectAnnotation(newAnnotation)
      }
    }
  }
  
  // Reset creation state
  activeAnnotation.value = null
  isCreating.value = false
  startPosition.value = null
}

// Select annotation
const selectAnnotation = (annotation: PdfAnnotation | null) => {
  emit('selectAnnotation', annotation)
}

// Save annotation changes
const saveAnnotation = (annotation: PdfAnnotation) => {
  if (annotation.type === 'note' && (!annotation.content || !annotation.content.trim())) {
    return
  }
  
  emit('updateAnnotation', annotation)
}

// Delete annotation
const deleteAnnotation = (annotation: PdfAnnotation) => {
  if (confirm('Are you sure you want to delete this annotation?')) {
    emit('deleteAnnotation', annotation)
  }
}

// Handle click outside to deselect
const handleOutsideClick = (event: Event) => {
  // Only deselect if clicking on the annotation layer itself
  if (event.target === event.currentTarget) {
    selectAnnotation(null)
  }
}

// Watch for annotation mode changes to clear selection
watch(() => props.annotationMode, (newMode) => {
  if (!newMode) {
    selectAnnotation(null)
  }
})
</script>

<style scoped>
.annotation-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  cursor: crosshair;
}

.annotation-layer[style*="pointer-events: none"] {
  cursor: default;
}

/* Annotation styles */
.pdf-annotation {
  position: absolute;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 2px;
}

.pdf-annotation:hover {
  transform: scale(1.02);
  z-index: 20;
}

.pdf-annotation.selected {
  z-index: 25;
  box-shadow: 0 0 0 2px hsl(var(--ring));
}

/* Highlight annotation */
.annotation-highlight {
  border: 2px solid transparent;
}

.annotation-highlight.selected {
  border-color: rgba(59, 130, 246, 0.6);
}

.highlight-overlay {
  width: 100%;
  height: 100%;
  background-color: rgba(251, 191, 36, 0.3);
  border-radius: 2px;
}

/* Note annotation */
.annotation-note {
  width: 24px;
  height: 24px;
}

.note-marker {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #F59E0B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
}

.note-marker:hover {
  background-color: #D97706;
}

.note-popup {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  min-width: 280px;
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

.note-popup::after {
  content: '';
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid hsl(var(--background));
}

.note-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.note-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Drawing annotation (placeholder) */
.annotation-drawing {
  border: 2px solid transparent;
}

.annotation-drawing.selected {
  border-color: rgba(59, 130, 246, 0.6);
}

.drawing-overlay {
  width: 100%;
  height: 100%;
  border: 1px dashed #6B7280;
  border-radius: 2px;
  background: rgba(107, 114, 128, 0.1);
}

/* Annotation preview (during creation) */
.annotation-preview {
  position: absolute;
  pointer-events: none;
  opacity: 0.7;
  z-index: 15;
}

.preview-highlight {
  background-color: rgba(251, 191, 36, 0.3);
  border: 2px dashed rgba(251, 191, 36, 0.8);
  border-radius: 2px;
}

.preview-note {
  width: 24px;
  height: 24px;
  background-color: #F59E0B;
  border-radius: 50%;
  border: 2px dashed #D97706;
}

.preview-drawing {
  border: 2px dashed #6B7280;
  border-radius: 2px;
  background: rgba(107, 114, 128, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .note-popup {
    min-width: 250px;
    max-width: 90vw;
  }
  
  .note-actions {
    flex-direction: column;
  }
  
  .note-actions button {
    width: 100%;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .note-marker {
    border-color: hsl(var(--background));
  }
  
  .note-popup {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .pdf-annotation {
    border-width: 3px;
  }
  
  .note-marker {
    border-width: 3px;
  }
  
  .note-popup {
    border-width: 2px;
  }
}
</style>