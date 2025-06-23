<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import type { KanbanColumn, MatterCard, ViewPreferences, MatterStatus } from '~/types/kanban'
import { Badge } from '~/components/ui/badge'
import MatterCardComponent from './MatterCard.vue'
import { DEFAULT_VIEW_PREFERENCES } from '~/constants/kanban'
import { useKanbanDragDrop } from '~/composables/useKanbanDragDrop'
import { useTouchGestures } from '~/composables/useTouchGestures'

interface Props {
  column: KanbanColumn
  matters?: MatterCard[]
  showJapanese?: boolean
  viewPreferences?: ViewPreferences
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  matters: () => [],
  showJapanese: true,
  viewPreferences: () => DEFAULT_VIEW_PREFERENCES,
  className: ''
})

const emit = defineEmits<{
  headerClick: [column: KanbanColumn]
  matterClick: [matter: MatterCard]
  matterEdit: [matter: MatterCard]
  'update:matters': [matters: MatterCard[]]
  'matter-moved': [matter: MatterCard, fromStatus: MatterStatus, toStatus: MatterStatus]
  'keyboard-navigation': [direction: 'up' | 'down' | 'left' | 'right', matter: MatterCard]
}>()

// Drag and drop functionality
const { canAcceptDrop, onDragStart, onDragEnd, onDragChange, isColumnDragTarget } = useKanbanDragDrop()
const { getSortableConfig } = useTouchGestures()

// Get the first status from the column for validation
const columnStatus = computed(() => props.column.status[0])

// Computed properties
const columnTitle = computed(() => 
  props.showJapanese ? props.column.titleJa : props.column.title
)

const matterCount = computed(() => props.matters.length)

const columnClasses = computed(() => [
  'kanban-column',
  props.className,
  props.column.color,
  {
    'drag-over': isColumnDragTarget(props.column.id)
  }
])

// Reactive matters list for v-model
const matters = computed({
  get: () => props.matters,
  set: (value) => emit('update:matters', value)
})

// Methods
const handleHeaderClick = () => {
  emit('headerClick', props.column)
}

const handleMatterClick = (matter: MatterCard) => {
  emit('matterClick', matter)
}

const handleMatterEdit = (matter: MatterCard) => {
  emit('matterEdit', matter)
}

// Drag and drop event handlers
const handleDragChange = (event: any) => {
  const result = onDragChange(event, columnStatus.value)
  
  if (result?.type === 'status_change') {
    emit('matter-moved', result.matter, result.fromStatus, result.toStatus)
  }
}

// Custom drop validation
const handleCanAcceptDrop = (to: any, from: any, dragEl: any): boolean => {
  return canAcceptDrop(to, from, dragEl)
}

// Get sortable configuration with touch support
const sortableConfig = getSortableConfig()

// Keyboard navigation for accessibility
const handleKeyboardNavigation = (event: KeyboardEvent, matter: MatterCard, index: number) => {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      if (index > 0) {
        // Focus previous matter card
        const previousCard = event.currentTarget?.parentElement?.previousElementSibling?.querySelector('[tabindex]') as HTMLElement
        previousCard?.focus()
      }
      emit('keyboard-navigation', 'up', matter)
      break
      
    case 'ArrowDown':
      event.preventDefault()
      if (index < props.matters.length - 1) {
        // Focus next matter card
        const nextCard = event.currentTarget?.parentElement?.nextElementSibling?.querySelector('[tabindex]') as HTMLElement
        nextCard?.focus()
      }
      emit('keyboard-navigation', 'down', matter)
      break
      
    case 'ArrowLeft':
      event.preventDefault()
      emit('keyboard-navigation', 'left', matter)
      break
      
    case 'ArrowRight':
      event.preventDefault()
      emit('keyboard-navigation', 'right', matter)
      break
      
    case 'Enter':
    case ' ':
      event.preventDefault()
      handleMatterClick(matter)
      break
  }
}
</script>

<template>
  <div :class="columnClasses" :data-column-id="column.id">
    <!-- Column Header -->
    <header 
      class="column-header"
      :id="`column-header-${column.id}`"
      @click="handleHeaderClick"
    >
      <div class="header-content">
        <h2 class="column-title">
          {{ columnTitle }}
        </h2>
        <Badge 
          variant="secondary" 
          class="matter-count"
          :aria-label="`${matterCount} matters in ${columnTitle}`"
        >
          {{ matterCount }}
        </Badge>
      </div>
    </header>

    <!-- Column Body with Drag & Drop -->
    <div class="column-body" :data-testid="`column-${column.id}`">
      <!-- Draggable Matter Cards -->
      <draggable
        v-model="matters"
        :group="{ name: 'kanban', pull: true, put: handleCanAcceptDrop }"
        v-bind="sortableConfig"
        :data-status="columnStatus"
        class="matters-container"
        tag="div"
        item-key="id"
        @start="onDragStart"
        @end="onDragEnd"
        @change="handleDragChange"
      >
        <template #item="{ element: matter, index }">
          <div class="matter-item">
            <MatterCardComponent
              :matter="matter"
              :viewPreferences="viewPreferences"
              @click="handleMatterClick"
              @edit="handleMatterEdit"
              @keydown="(event: KeyboardEvent) => handleKeyboardNavigation(event, matter, index)"
              :tabindex="0"
            />
          </div>
        </template>
        
        <!-- Empty State Template -->
        <template #footer>
          <div 
            v-if="matters.length === 0"
            class="empty-state"
            :aria-label="`No matters in ${columnTitle}`"
          >
            <div class="empty-content">
              <div class="empty-icon">📋</div>
              <div class="empty-text">No matters</div>
              <div class="empty-hint">Drag matters here</div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<style scoped>
/* Column container */
.kanban-column {
  --column-width: 320px;
  --column-gap: 1rem;
  --animation-duration: 150ms;
  
  @apply flex flex-col h-full border border-gray-200 rounded-lg bg-white;
  @apply min-h-0; /* Allow column to shrink */
  width: var(--column-width);
  max-height: calc(100vh - 200px);
}

/* Column header */
.column-header {
  @apply flex-shrink-0 p-3 border-b border-gray-200 cursor-pointer;
  @apply hover:bg-gray-50 transition-colors;
}

.header-content {
  @apply flex items-center justify-between;
}

.column-title {
  @apply text-sm font-semibold text-gray-900 truncate;
  @apply mr-2; /* Space for badge */
}

.matter-count {
  @apply text-xs font-medium flex-shrink-0;
}

/* Column body */
.column-body {
  @apply flex-1 overflow-hidden;
}

/* Draggable container */
.matters-container {
  @apply h-full p-3 overflow-y-auto;
  min-height: 200px;
}

/* Matter item wrapper */
.matter-item {
  @apply mb-3;
}

/* Drag-and-drop visual states */
.kanban-column :deep(.drag-ghost) {
  opacity: 0.5;
  transform: scale(0.95);
  transition: transform var(--animation-duration) ease;
}

.kanban-column :deep(.drag-chosen) {
  cursor: grabbing !important;
  z-index: 1000;
}

.kanban-column :deep(.drag-active) {
  transform: rotate(2deg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

.kanban-column :deep(.drag-fallback) {
  cursor: grabbing !important;
  background: hsl(var(--card));
  border: 2px dashed hsl(var(--primary));
  border-radius: var(--radius);
}

/* Column drag over state */
.kanban-column.drag-over {
  background: hsl(var(--primary) / 0.05);
  border-color: hsl(var(--primary));
}

/* Empty state */
.empty-state {
  @apply flex items-center justify-center py-8;
  min-height: 120px;
}

.empty-content {
  @apply text-center;
}

.empty-icon {
  @apply text-2xl mb-2 opacity-50;
}

.empty-text {
  @apply text-sm text-gray-500 mb-1;
}

.empty-hint {
  @apply text-xs text-gray-400;
}

/* Performance optimizations */
.kanban-column * {
  transform: translateZ(0); /* Enable hardware acceleration */
}

/* Mobile-specific optimizations */
@media (max-width: 768px) {
  .kanban-column {
    --column-width: 280px;
    touch-action: pan-y; /* Allow vertical scrolling */
  }
  
  .matters-container {
    -webkit-overflow-scrolling: touch;
    padding-bottom: 80px; /* Extra space for mobile navigation */
  }
}

/* Tablet adjustments */
@media (max-width: 1024px) {
  .kanban-column {
    --column-width: 300px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .kanban-column {
    border-width: 2px;
  }
  
  .kanban-column.drag-over {
    border-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .kanban-column :deep(.drag-ghost),
  .kanban-column :deep(.drag-active) {
    transition: none !important;
    transform: none !important;
  }
}

/* Prevent text selection during drag */
:global(.dragging) {
  user-select: none;
  -webkit-user-select: none;
}

/* Text truncation utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>