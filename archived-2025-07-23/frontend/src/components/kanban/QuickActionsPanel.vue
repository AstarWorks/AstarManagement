<!--
  Quick Actions Panel Component
  
  Floating action panel for bulk operations on selected matters.
  Provides quick access to common actions like archive, assign, priority change.
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Archive, 
  UserPlus, 
  AlertTriangle, 
  Download, 
  Copy, 
  Trash2,
  MoreHorizontal,
  X
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Separator } from '~/components/ui/separator'

interface Props {
  selectedCount: number
  isProcessing?: boolean
  showAdvancedActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false,
  showAdvancedActions: true
})

const emit = defineEmits<{
  'archive-selected': []
  'priority-change': [priority: string]
  'assign-lawyer': [lawyerId: string]
  'export-selected': []
  'duplicate-selected': []
  'delete-selected': []
  'clear-selection': []
  'more-actions': [action: string]
}>()

// Local state
const isExpanded = ref(false)

// Computed properties
const panelLabel = computed(() => 
  `${props.selectedCount} matter${props.selectedCount === 1 ? '' : 's'} selected`
)

const quickActions = computed(() => [
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    variant: 'outline' as const,
    description: 'Archive selected matters',
    shortcut: 'A'
  },
  {
    id: 'assign',
    label: 'Assign',
    icon: UserPlus,
    variant: 'outline' as const,
    description: 'Assign to lawyer',
    shortcut: 'L'
  },
  {
    id: 'priority',
    label: 'Priority',
    icon: AlertTriangle,
    variant: 'outline' as const,
    description: 'Change priority',
    shortcut: 'P'
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    variant: 'outline' as const,
    description: 'Export to CSV/PDF',
    shortcut: 'E'
  }
])

const advancedActions = computed(() => [
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: Copy,
    description: 'Create copies of selected matters'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    description: 'Permanently delete selected matters',
    variant: 'destructive' as const
  }
])

// Methods
const handleAction = (actionId: string) => {
  if (props.isProcessing) return

  switch (actionId) {
    case 'archive':
      emit('archive-selected')
      break
    case 'assign':
      emit('assign-lawyer', 'select-lawyer') // Trigger lawyer selection
      break
    case 'priority':
      emit('priority-change', 'select-priority') // Trigger priority selection
      break
    case 'export':
      emit('export-selected')
      break
    case 'duplicate':
      emit('duplicate-selected')
      break
    case 'delete':
      emit('delete-selected')
      break
    default:
      emit('more-actions', actionId)
  }
}

const handleClearSelection = () => {
  emit('clear-selection')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.isProcessing) return

  // Handle keyboard shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'a':
        if (event.shiftKey) {
          event.preventDefault()
          handleAction('archive')
        }
        break
      case 'l':
        event.preventDefault()
        handleAction('assign')
        break
      case 'p':
        event.preventDefault()
        handleAction('priority')
        break
      case 'e':
        event.preventDefault()
        handleAction('export')
        break
    }
  }
}

// Register keyboard shortcuts
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- Floating Actions Panel -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 transform translate-y-4"
    enter-to-class="opacity-100 transform translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 transform translate-y-0"
    leave-to-class="opacity-0 transform translate-y-4"
  >
    <div 
      class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      role="toolbar"
      :aria-label="panelLabel"
    >
      <div class="bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 max-w-2xl">
        <!-- Panel Header -->
        <div class="flex items-center justify-between gap-4 mb-3">
          <div class="flex items-center gap-2">
            <Badge variant="secondary" class="font-medium">
              {{ selectedCount }}
            </Badge>
            <span class="text-sm font-medium">
              {{ selectedCount === 1 ? 'matter' : 'matters' }} selected
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            @click="handleClearSelection"
            :disabled="isProcessing"
            aria-label="Clear selection"
            class="h-8 w-8 p-0"
          >
            <X class="w-4 h-4" />
          </Button>
        </div>

        <!-- Quick Actions -->
        <div class="flex items-center gap-2 flex-wrap">
          <Button
            v-for="action in quickActions"
            :key="action.id"
            :variant="action.variant"
            size="sm"
            @click="handleAction(action.id)"
            :disabled="isProcessing"
            :title="`${action.description} (Ctrl+${action.shortcut})`"
            class="flex items-center gap-2 h-9"
          >
            <component :is="action.icon" class="w-4 h-4" />
            <span class="hidden sm:inline">{{ action.label }}</span>
          </Button>

          <!-- More Actions Dropdown -->
          <DropdownMenu v-if="showAdvancedActions">
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                :disabled="isProcessing"
                class="h-9 px-3"
                aria-label="More actions"
              >
                <MoreHorizontal class="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="center" class="w-48">
              <DropdownMenuItem
                v-for="action in advancedActions"
                :key="action.id"
                @click="handleAction(action.id)"
                :class="action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''"
              >
                <component :is="action.icon" class="w-4 h-4 mr-2" />
                {{ action.label }}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem @click="handleAction('select-all-page')">
                Select All on Page
              </DropdownMenuItem>
              
              <DropdownMenuItem @click="handleAction('select-all-status')">
                Select All in Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- Processing Indicator -->
        <div 
          v-if="isProcessing"
          class="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground"
        >
          <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Processing {{ selectedCount }} matter{{ selectedCount === 1 ? '' : 's' }}...</span>
        </div>

        <!-- Keyboard Shortcuts Hint -->
        <div class="mt-3 pt-3 border-t text-xs text-muted-foreground">
          <div class="flex flex-wrap gap-x-4 gap-y-1">
            <span>Shortcuts:</span>
            <span><kbd class="kbd">Ctrl+Shift+A</kbd> Archive</span>
            <span><kbd class="kbd">Ctrl+L</kbd> Assign</span>
            <span><kbd class="kbd">Ctrl+P</kbd> Priority</span>
            <span><kbd class="kbd">Ctrl+E</kbd> Export</span>
            <span><kbd class="kbd">Esc</kbd> Clear</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Keyboard key styling */
.kbd {
  @apply inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-muted border border-border;
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Panel backdrop */
.bg-card\/95 {
  background-color: hsl(var(--card) / 0.95);
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .fixed.bottom-6 {
    @apply bottom-4 left-4 right-4 transform-none translate-x-0;
  }
  
  .max-w-2xl {
    @apply max-w-none;
  }
  
  /* Hide keyboard shortcuts on mobile */
  .border-t + .text-xs {
    @apply hidden;
  }
  
  /* Reduce padding on mobile */
  .p-3 {
    @apply p-2;
  }
  
  /* Stack actions vertically on very small screens */
  @media (max-width: 480px) {
    .flex.gap-2.flex-wrap {
      @apply flex-col gap-2;
    }
    
    .flex.items-center.gap-2.h-9 {
      @apply justify-center;
    }
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .bg-card\/95 {
    @apply bg-card;
  }
  
  .border {
    @apply border-2;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .transition-all,
  .animate-spin {
    @apply transition-none;
    animation: none;
  }
}

/* Focus styles for accessibility */
.button:focus-visible {
  @apply ring-2 ring-ring ring-offset-2;
}

/* Ensure proper stacking */
.z-50 {
  z-index: 50;
}

/* Shadow for depth */
.shadow-lg {
  box-shadow: 
    0 10px 15px -3px rgb(0 0 0 / 0.1), 
    0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* Backdrop blur fallback */
@supports not (backdrop-filter: blur(12px)) {
  .backdrop-blur-sm {
    @apply bg-card;
  }
}
</style>