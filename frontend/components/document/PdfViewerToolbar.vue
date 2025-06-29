<template>
  <div class="pdf-toolbar bg-background border-b p-2 flex items-center gap-4 sticky top-0 z-10">
    <!-- Page Navigation -->
    <div class="toolbar-group flex items-center gap-2">
      <Button 
        size="icon" 
        variant="outline"
        @click="$emit('previous-page')" 
        :disabled="currentPage === 1 || loading"
        :title="keyboardShortcuts ? 'Previous page (←)' : 'Previous page'"
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>
      
      <div class="page-input-group flex items-center gap-1">
        <Input
          :model-value="currentPage"
          @update:model-value="handlePageChange"
          @keydown.enter="handlePageSubmit"
          type="number"
          :min="1"
          :max="totalPages"
          class="w-16 text-center"
          :disabled="loading"
          :title="keyboardShortcuts ? 'Go to page (Ctrl+G)' : 'Current page'"
        />
        <span class="text-sm text-muted-foreground">/ {{ totalPages || '...' }}</span>
      </div>
      
      <Button 
        size="icon" 
        variant="outline"
        @click="$emit('next-page')" 
        :disabled="currentPage === totalPages || loading"
        :title="keyboardShortcuts ? 'Next page (→)' : 'Next page'"
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
        :disabled="loading || scale <= minScale"
        :title="keyboardShortcuts ? 'Zoom out (-)' : 'Zoom out'"
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
        :disabled="loading || scale >= maxScale"
        :title="keyboardShortcuts ? 'Zoom in (+)' : 'Zoom in'"
      >
        <ZoomIn class="h-4 w-4" />
      </Button>
    </div>
    
    <!-- Document Actions -->
    <div class="toolbar-group flex items-center gap-2">
      <Button
        size="icon"
        variant="outline"
        @click="$emit('rotate-clockwise')"
        :disabled="loading"
        title="Rotate clockwise"
      >
        <RotateCw class="h-4 w-4" />
      </Button>
      
      <Button
        size="icon"
        variant="outline"
        @click="$emit('toggle-fullscreen')"
        :disabled="loading"
        :title="keyboardShortcuts ? 'Fullscreen (F)' : 'Fullscreen'"
      >
        <Maximize2 class="h-4 w-4" />
      </Button>
    </div>
    
    <!-- Document Info -->
    <div class="toolbar-group flex-1 text-sm text-muted-foreground">
      <span v-if="loading" class="flex items-center gap-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        Loading...
      </span>
      <span v-else-if="error" class="text-destructive">{{ error }}</span>
      <span v-else-if="totalPages" class="hidden sm:inline">
        {{ totalPages }} page{{ totalPages !== 1 ? 's' : '' }} • {{ Math.round(scale * 100) }}%
      </span>
    </div>
    
    <!-- Keyboard Shortcuts Toggle -->
    <div class="toolbar-group">
      <Button
        size="icon"
        variant="ghost"
        @click="showKeyboardHelp = !showKeyboardHelp"
        :title="keyboardShortcuts ? 'Keyboard shortcuts (?)' : 'Keyboard shortcuts'"
      >
        <HelpCircle class="h-4 w-4" />
      </Button>
    </div>
  </div>
  
  <!-- Keyboard Shortcuts Help -->
  <div 
    v-if="showKeyboardHelp" 
    class="absolute top-full left-0 right-0 bg-background border-b shadow-lg p-4 z-20"
  >
    <div class="max-w-4xl mx-auto">
      <h3 class="font-semibold mb-3">Keyboard Shortcuts</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <strong>Navigation</strong>
          <ul class="mt-1 space-y-1">
            <li><kbd>←</kbd> Previous page</li>
            <li><kbd>→</kbd> Next page</li>
            <li><kbd>Home</kbd> First page</li>
            <li><kbd>End</kbd> Last page</li>
            <li><kbd>Ctrl+G</kbd> Go to page</li>
          </ul>
        </div>
        <div>
          <strong>Zoom</strong>
          <ul class="mt-1 space-y-1">
            <li><kbd>+</kbd> Zoom in</li>
            <li><kbd>-</kbd> Zoom out</li>
            <li><kbd>0</kbd> Reset zoom</li>
            <li><kbd>1</kbd> 100% zoom</li>
            <li><kbd>2</kbd> Fit to width</li>
          </ul>
        </div>
        <div>
          <strong>Other</strong>
          <ul class="mt-1 space-y-1">
            <li><kbd>F</kbd> Fullscreen</li>
            <li><kbd>R</kbd> Rotate</li>
            <li><kbd>?</kbd> Show help</li>
            <li><kbd>Esc</kbd> Close help</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  HelpCircle 
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  currentPage: number
  scale: number
  totalPages: number
  loading: boolean
  error?: string | null
  minScale?: number
  maxScale?: number
  keyboardShortcuts?: boolean
}

interface Emits {
  (e: 'update:currentPage', value: number): void
  (e: 'update:scale', value: number): void
  (e: 'previous-page'): void
  (e: 'next-page'): void
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'zoom-fit'): void
  (e: 'zoom-width'): void
  (e: 'zoom-actual'): void
  (e: 'rotate-clockwise'): void
  (e: 'toggle-fullscreen'): void
  (e: 'go-to-page', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
  keyboardShortcuts: true,
  minScale: 0.25,
  maxScale: 5.0
})

const emit = defineEmits<Emits>()

// Local state
const showKeyboardHelp = ref(false)
const pageInputValue = ref<string>('')

// Computed properties
const scaleDisplay = computed(() => {
  if (props.scale === 1) return 'auto'
  return Math.round(props.scale * 100).toString()
})

// Event handlers
const handlePageChange = (value: string | number) => {
  const page = typeof value === 'string' ? parseInt(value) : value
  
  // Validate page number
  if (isNaN(page) || page < 1 || page > props.totalPages) {
    return
  }
  
  emit('update:currentPage', page)
  emit('go-to-page', page)
}

const handlePageSubmit = (event: Event) => {
  const target = event.target as HTMLInputElement
  handlePageChange(target.value)
  target.blur() // Remove focus after submission
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
      if (!isNaN(scale) && scale >= props.minScale && scale <= props.maxScale) {
        emit('update:scale', scale)
      }
  }
}
</script>

<style scoped>
/* Keyboard shortcut styling */
kbd {
  @apply px-1.5 py-0.5 text-xs font-medium text-muted-foreground bg-muted border border-border rounded;
}

/* Toolbar responsive behavior */
.toolbar-group {
  @apply flex items-center gap-2;
}

/* Hide less important items on small screens */
@media (max-width: 640px) {
  .toolbar-group:nth-child(4) {
    @apply hidden;
  }
}

@media (max-width: 480px) {
  .toolbar-group:nth-child(3) {
    @apply hidden;
  }
  
  .page-input-group {
    @apply gap-1;
  }
  
  .page-input-group input {
    @apply w-12;
  }
}

/* Smooth transitions */
.pdf-toolbar {
  transition: background-color 0.2s ease;
}

/* Loading spinner animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Focus styles for accessibility */
.pdf-toolbar button:focus-visible,
.pdf-toolbar input:focus-visible,
.pdf-toolbar [role="combobox"]:focus-visible {
  @apply outline-2 outline-ring outline-offset-2;
}

/* Help panel animation */
.keyboard-help-enter-active,
.keyboard-help-leave-active {
  transition: all 0.2s ease;
}

.keyboard-help-enter-from,
.keyboard-help-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>