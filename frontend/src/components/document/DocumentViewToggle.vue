<template>
  <div class="document-view-toggle" role="radiogroup" aria-label="Document view mode">
    <div class="toggle-container">
      <Button
        variant="ghost"
        size="sm"
        :class="[
          'toggle-button',
          { 'active': modelValue === 'grid' }
        ]"
        @click="setViewMode('grid')"
        :aria-pressed="modelValue === 'grid'"
        :aria-label="'Grid view' + (modelValue === 'grid' ? ' (current)' : '')"
        role="radio"
      >
        <LayoutGrid class="h-4 w-4" />
        <span v-if="showLabels" class="ml-2">Grid</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        :class="[
          'toggle-button',
          { 'active': modelValue === 'list' }
        ]"
        @click="setViewMode('list')"
        :aria-pressed="modelValue === 'list'"
        :aria-label="'List view' + (modelValue === 'list' ? ' (current)' : '')"
        role="radio"
      >
        <List class="h-4 w-4" />
        <span v-if="showLabels" class="ml-2">List</span>
      </Button>
    </div>
    
    <!-- Keyboard shortcuts hint -->
    <div v-if="showShortcuts" class="shortcuts-hint">
      <span class="text-xs text-muted-foreground">
        <kbd class="kbd">G</kbd> Grid · <kbd class="kbd">L</kbd> List
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { LayoutGrid, List } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

interface Props {
  modelValue: 'grid' | 'list'
  showLabels?: boolean
  showShortcuts?: boolean
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: 'grid' | 'list'): void
  (e: 'change', value: 'grid' | 'list'): void
}

const props = withDefaults(defineProps<Props>(), {
  showLabels: false,
  showShortcuts: false,
  disabled: false
})

const emit = defineEmits<Emits>()

const setViewMode = (mode: 'grid' | 'list') => {
  if (props.disabled || mode === props.modelValue) return
  
  emit('update:modelValue', mode)
  emit('change', mode)
  
  // Announce change for screen readers
  const announcement = `Switched to ${mode} view`
  announceToScreenReader(announcement)
}

const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.style.position = 'absolute'
  announcement.style.left = '-10000px'
  announcement.style.width = '1px'
  announcement.style.height = '1px'
  announcement.style.overflow = 'hidden'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return
  
  // Only handle shortcuts if no input is focused
  if (document.activeElement?.tagName === 'INPUT' || 
      document.activeElement?.tagName === 'TEXTAREA') {
    return
  }
  
  switch (event.key.toLowerCase()) {
    case 'g':
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        setViewMode('grid')
      }
      break
    case 'l':
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        setViewMode('list')
      }
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.document-view-toggle {
  @apply flex items-center gap-2;
}

.toggle-container {
  @apply flex items-center bg-muted rounded-md p-1;
}

.toggle-button {
  @apply relative transition-all duration-200 ease-in-out;
  @apply hover:bg-background/80;
}

.toggle-button.active {
  @apply bg-background shadow-sm text-foreground;
}

.toggle-button:not(.active) {
  @apply text-muted-foreground;
}

.toggle-button:not(.active):hover {
  @apply text-foreground;
}

.shortcuts-hint {
  @apply hidden sm:flex items-center;
}

.kbd {
  @apply inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded;
}

/* Focus states for accessibility */
.toggle-button:focus-visible {
  @apply ring-2 ring-ring ring-offset-2 ring-offset-background;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .toggle-container {
    @apply border border-border;
  }
  
  .toggle-button.active {
    @apply border border-primary;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .toggle-button {
    transition: none;
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .toggle-button {
    @apply px-2 py-1;
  }
  
  .shortcuts-hint {
    @apply hidden;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .toggle-button {
    @apply min-h-[44px] min-w-[44px]; /* WCAG touch target size */
  }
}
</style>