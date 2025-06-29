<template>
  <div 
    class="pdf-mobile-controls"
    :class="{ 
      'safe-area-bottom': isIOS,
      'hidden': !showControls && !isControlsLocked,
      'locked': isControlsLocked
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
        <span class="sr-only">Previous page</span>
      </Button>
      
      <div class="page-indicator" @click="togglePageInput">
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
        <span class="sr-only">Next page</span>
      </Button>
    </div>
    
    <!-- Page Input (when enabled) -->
    <div v-if="showPageInput" class="page-input-section">
      <div class="page-input-wrapper">
        <label for="page-input" class="sr-only">Go to page</label>
        <Input
          id="page-input"
          v-model="pageInputValue"
          type="number"
          :min="1"
          :max="totalPages"
          class="page-input"
          placeholder="Page"
          @keydown.enter="goToPage"
          @blur="hidePageInput"
        />
        <Button size="sm" @click="goToPage">Go</Button>
      </div>
    </div>
    
    <!-- Zoom Slider -->
    <div class="zoom-section" v-if="showZoomSlider">
      <Button 
        size="icon" 
        variant="ghost" 
        @click="$emit('zoom-out')"
        :disabled="zoomLevel <= 50"
        class="zoom-button"
      >
        <ZoomOut class="h-4 w-4" />
        <span class="sr-only">Zoom out</span>
      </Button>
      
      <div class="zoom-slider-wrapper">
        <input
          type="range"
          :value="zoomLevel"
          @input="handleZoomSliderChange"
          min="50"
          max="200"
          step="10"
          class="zoom-slider"
          aria-label="Zoom level"
        />
      </div>
      
      <span class="zoom-label">{{ zoomLevel }}%</span>
      
      <Button 
        size="icon" 
        variant="ghost" 
        @click="$emit('zoom-in')"
        :disabled="zoomLevel >= 200"
        class="zoom-button"
      >
        <ZoomIn class="h-4 w-4" />
        <span class="sr-only">Zoom in</span>
      </Button>
    </div>
    
    <!-- Annotation Tools -->
    <div class="annotation-tools" v-if="showAnnotationTools">
      <Button
        variant="ghost"
        size="sm"
        @click="toggleAnnotationMode('highlight')"
        :class="{ 'active': annotationMode === 'highlight' }"
        class="annotation-button"
      >
        <Highlighter class="h-4 w-4 mr-2" />
        Highlight
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        @click="toggleAnnotationMode('note')"
        :class="{ 'active': annotationMode === 'note' }"
        class="annotation-button"
      >
        <MessageSquare class="h-4 w-4 mr-2" />
        Note
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        @click="toggleAnnotationMode(null)"
        :class="{ 'active': !annotationMode }"
        class="annotation-button"
      >
        <Hand class="h-4 w-4 mr-2" />
        Pan
      </Button>
    </div>
    
    <!-- Secondary Controls -->
    <div class="secondary-controls">
      <Button
        size="icon"
        variant="ghost"
        @click="toggleZoomSlider"
        :class="{ 'active': showZoomSlider }"
        class="secondary-button"
      >
        <ZoomIn class="h-4 w-4" />
        <span class="sr-only">Toggle zoom controls</span>
      </Button>
      
      <Button
        size="icon"
        variant="ghost"
        @click="toggleAnnotationTools"
        :class="{ 'active': showAnnotationTools }"
        class="secondary-button"
      >
        <Edit class="h-4 w-4" />
        <span class="sr-only">Toggle annotation tools</span>
      </Button>
      
      <Button
        size="icon"
        variant="ghost"
        @click="$emit('toggle-fullscreen')"
        class="secondary-button"
      >
        <Maximize class="h-4 w-4" />
        <span class="sr-only">Toggle fullscreen</span>
      </Button>
    </div>
    
    <!-- Control Toggle -->
    <Button
      class="controls-toggle"
      size="icon"
      variant="ghost"
      @click="toggleControlsLock"
      :title="isControlsLocked ? 'Unlock controls' : 'Lock controls'"
    >
      <Lock v-if="isControlsLocked" class="h-4 w-4" />
      <Unlock v-else class="h-4 w-4" />
      <span class="sr-only">
        {{ isControlsLocked ? 'Unlock controls' : 'Lock controls' }}
      </span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Highlighter,
  MessageSquare,
  Hand,
  Edit,
  Maximize,
  Lock,
  Unlock
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

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
  'go-to-page': [page: number]
  'zoom-in': []
  'zoom-out': []
  'zoom-change': [level: number]
  'toggle-annotation': [mode: string | null]
  'toggle-fullscreen': []
}>()

// Component state
const isControlsLocked = ref(false)
const showZoomSlider = ref(false)
const showAnnotationTools = ref(false)
const showPageInput = ref(false)
const pageInputValue = ref(props.currentPage.toString())

// Auto-hide timeout
let hideTimeout: NodeJS.Timeout | null = null

// Detect iOS for safe area handling
const isIOS = computed(() => {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
})

// Handle zoom slider changes
const handleZoomSliderChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const level = parseInt(target.value)
  emit('zoom-change', level)
}

// Toggle annotation mode
const toggleAnnotationMode = (mode: string | null) => {
  emit('toggle-annotation', mode)
}

// Toggle zoom slider visibility
const toggleZoomSlider = () => {
  showZoomSlider.value = !showZoomSlider.value
  if (showZoomSlider.value) {
    showAnnotationTools.value = false
  }
  resetHideTimeout()
}

// Toggle annotation tools visibility
const toggleAnnotationTools = () => {
  showAnnotationTools.value = !showAnnotationTools.value
  if (showAnnotationTools.value) {
    showZoomSlider.value = false
  }
  resetHideTimeout()
}

// Toggle page input
const togglePageInput = () => {
  showPageInput.value = !showPageInput.value
  if (showPageInput.value) {
    pageInputValue.value = props.currentPage.toString()
  }
}

// Hide page input
const hidePageInput = () => {
  showPageInput.value = false
}

// Go to specific page
const goToPage = () => {
  const page = parseInt(pageInputValue.value)
  if (page >= 1 && page <= props.totalPages) {
    emit('go-to-page', page)
  }
  hidePageInput()
}

// Toggle controls lock
const toggleControlsLock = () => {
  isControlsLocked.value = !isControlsLocked.value
  if (isControlsLocked.value) {
    clearHideTimeout()
  } else {
    resetHideTimeout()
  }
}

// Auto-hide controls after inactivity
const resetHideTimeout = () => {
  clearHideTimeout()
  if (!isControlsLocked.value) {
    hideTimeout = setTimeout(() => {
      showZoomSlider.value = false
      showAnnotationTools.value = false
      showPageInput.value = false
    }, 3000)
  }
}

const clearHideTimeout = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

// Touch interaction handling
const handleTouchStart = () => {
  resetHideTimeout()
}

// Lifecycle
onMounted(() => {
  resetHideTimeout()
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
})

onUnmounted(() => {
  clearHideTimeout()
  document.removeEventListener('touchstart', handleTouchStart)
})
</script>

<style scoped>
.pdf-mobile-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  color: white;
  padding: 1rem;
  transition: transform 0.3s ease;
  z-index: 50;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.pdf-mobile-controls.hidden {
  transform: translateY(100%);
}

.pdf-mobile-controls.locked {
  background: rgba(0, 0, 0, 0.9);
}

.safe-area-bottom {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

/* Main controls */
.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.control-button {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 3rem;
  min-height: 3rem;
}

.control-button:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: background-color 0.2s;
}

.page-indicator:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Page input */
.page-input-section {
  margin-bottom: 0.75rem;
}

.page-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.page-input {
  width: 80px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.page-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* Zoom controls */
.zoom-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius);
}

.zoom-button {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.zoom-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.zoom-slider-wrapper {
  flex: 1;
}

.zoom-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  appearance: none;
}

.zoom-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 2px solid rgba(59, 130, 246, 0.8);
  cursor: pointer;
}

.zoom-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 2px solid rgba(59, 130, 246, 0.8);
  cursor: pointer;
}

.zoom-label {
  min-width: 50px;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Annotation tools */
.annotation-tools {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius);
}

.annotation-button {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex: 1;
  min-width: 0;
}

.annotation-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.annotation-button.active {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
}

/* Secondary controls */
.secondary-controls {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.secondary-button {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.secondary-button.active {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
}

/* Controls toggle */
.controls-toggle {
  position: absolute;
  top: -50px;
  right: 1rem;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(5px);
}

.controls-toggle:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .pdf-mobile-controls {
    padding: 0.75rem;
  }
  
  .controls-row {
    margin-bottom: 0.5rem;
  }
  
  .annotation-tools {
    flex-direction: column;
  }
  
  .annotation-button {
    flex: none;
  }
  
  .zoom-section {
    padding: 0.5rem;
    gap: 0.75rem;
  }
}

@media (max-width: 360px) {
  .secondary-controls {
    flex-wrap: wrap;
  }
  
  .page-indicator {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .pdf-mobile-controls {
    background: rgba(0, 0, 0, 0.95);
    border-top-width: 2px;
  }
  
  .control-button,
  .annotation-button,
  .secondary-button {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pdf-mobile-controls {
    transition: none;
  }
  
  .control-button,
  .annotation-button,
  .secondary-button,
  .page-indicator {
    transition: none;
  }
}
</style>