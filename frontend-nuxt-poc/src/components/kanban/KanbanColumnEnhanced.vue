<!--
  Enhanced Kanban Column with Multi-select and Real-time Features
  
  @description Kanban column component with multi-select support,
  collaborator presence, and advanced drag-drop capabilities.
  
  @author Claude
  @created 2025-06-26
  @task T12_S08 - Drag & Drop Mutations
-->

<template>
  <div 
    class="kanban-column-enhanced"
    :class="columnClasses"
    :data-status="column.status"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- Column header -->
    <div class="column-header">
      <div class="column-title">
        <div class="status-indicator" :class="`status-${column.color}`" />
        <h3>{{ column.title }}</h3>
        <Badge variant="secondary" class="matter-count">
          {{ matters.length }}
        </Badge>
      </div>
      
      <!-- Collaborator avatars -->
      <div v-if="collaborators.length > 0" class="collaborator-avatars">
        <Avatar
          v-for="collaborator in collaborators.slice(0, 3)"
          :key="collaborator.userId"
          :class="`collaborator-avatar-${collaborator.color}`"
          size="sm"
        >
          <AvatarImage :src="collaborator.avatar" />
          <AvatarFallback>{{ collaborator.username.charAt(0) }}</AvatarFallback>
        </Avatar>
        
        <div v-if="collaborators.length > 3" class="additional-collaborators">
          +{{ collaborators.length - 3 }}
        </div>
      </div>
      
      <!-- Column actions -->
      <div class="column-actions">
        <Button
          v-if="isMultiSelectMode"
          variant="ghost"
          size="sm"
          @click="handleSelectAll"
          class="select-all-btn"
        >
          <Icon name="check-square" class="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          @click="toggleColumnCollapsed"
          class="collapse-btn"
        >
          <Icon :name="isCollapsed ? 'chevron-down' : 'chevron-up'" class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Matter list container -->
    <div 
      class="matters-container"
      :class="{ 
        'collapsed': isCollapsed,
        'drop-target': isDropTarget,
        'multi-select': isMultiSelectMode
      }"
    >
      <!-- Drop zone indicator -->
      <div v-if="isDropTarget" class="drop-zone-indicator">
        <div class="drop-zone-content">
          <Icon name="arrow-down" class="w-6 h-6" />
          <span>Drop here to move to {{ column.title }}</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="matters.length === 0 && !isCollapsed" class="empty-state">
        <Icon name="inbox" class="w-8 h-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">No matters in {{ column.title.toLowerCase() }}</p>
      </div>

      <!-- Matter cards -->
      <TransitionGroup
        v-else-if="!isCollapsed"
        name="matter"
        tag="div"
        class="matters-list"
      >
        <MatterCardEnhanced
          v-for="(matter, index) in visibleMatters"
          :key="matter.id"
          :matter="matter"
          :index="index"
          :is-selected="selectedMatters.has(matter.id)"
          :is-multi-select-mode="isMultiSelectMode"
          :collaborator-info="getMatterCollaborator(matter.id)"
          :show-position-indicator="showPositions"
          @select="$emit('matter-select', matter.id)"
          @drag-start="handleMatterDragStart"
          @drag-end="handleMatterDragEnd"
          @click="handleMatterClick"
          @contextmenu="handleMatterContextMenu"
          class="matter-card-item"
        />
      </TransitionGroup>

      <!-- Load more indicator for large columns -->
      <div 
        v-if="hasMoreMatters && !isCollapsed" 
        class="load-more-indicator"
        @click="loadMoreMatters"
      >
        <Button variant="ghost" size="sm" class="w-full">
          <Icon name="more-horizontal" class="w-4 h-4 mr-2" />
          Load {{ remainingMattersCount }} more matters
        </Button>
      </div>
    </div>

    <!-- Column statistics (when collapsed) -->
    <div v-if="isCollapsed" class="column-stats">
      <div class="stat-item">
        <span class="stat-label">Total:</span>
        <span class="stat-value">{{ matters.length }}</span>
      </div>
      <div v-if="selectedInColumn > 0" class="stat-item">
        <span class="stat-label">Selected:</span>
        <span class="stat-value">{{ selectedInColumn }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { MatterCard, KanbanColumn, MatterStatus } from '~/types/kanban'
import type { CollaboratorInfo } from '~/composables/useKanbanRealTimeSync'

// Props
interface Props {
  column: KanbanColumn
  matters: MatterCard[]
  isDropTarget?: boolean
  selectedMatters: Set<string>
  isMultiSelectMode?: boolean
  collaborators?: CollaboratorInfo[]
  showPositions?: boolean
  virtualScrolling?: boolean
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  isDropTarget: false,
  isMultiSelectMode: false,
  collaborators: () => [],
  showPositions: false,
  virtualScrolling: false,
  pageSize: 50
})

// Emits
const emit = defineEmits<{
  'matter-select': [matterId: string]
  'matter-drag-start': [event: DragEvent, matter: MatterCard]
  'matter-drag-end': [event: DragEvent, targetStatus: MatterStatus, targetIndex: number]
  'matter-drop': [matter: MatterCard, targetStatus: MatterStatus, targetIndex: number]
  'column-drop': [columnId: string]
  'select-all': [matters: MatterCard[]]
  'clear-selection': []
}>()

// Local state
const isCollapsed = ref(false)
const currentPage = ref(1)
const draggedMatter = ref<MatterCard | null>(null)

// Computed properties
const columnClasses = computed(() => [
  'kanban-column',
  `column-${props.column.status.toLowerCase()}`,
  {
    'drop-target': props.isDropTarget,
    'has-selection': selectedInColumn.value > 0,
    'collapsed': isCollapsed.value
  }
])

const visibleMatters = computed(() => {
  if (!props.virtualScrolling) return props.matters
  
  const endIndex = currentPage.value * props.pageSize
  return props.matters.slice(0, endIndex)
})

const hasMoreMatters = computed(() => {
  return props.virtualScrolling && props.matters.length > visibleMatters.value.length
})

const remainingMattersCount = computed(() => {
  return props.matters.length - visibleMatters.value.length
})

const selectedInColumn = computed(() => {
  return props.matters.filter(matter => props.selectedMatters.has(matter.id)).length
})

const getMatterCollaborator = (matterId: string) => {
  return props.collaborators.find(c => c.draggedMatter === matterId)
}

// Drag and drop handlers
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  emit('column-drop', props.column.id)
}

const handleDragLeave = () => {
  // Only emit if we're actually leaving the column
  setTimeout(() => {
    if (!props.isDropTarget) return
    emit('column-drop', '')
  }, 50)
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  if (!draggedMatter.value) return
  
  // Calculate drop index based on mouse position
  const dropIndex = calculateDropIndex(event.clientY)
  
  emit('matter-drop', draggedMatter.value, props.column.status, dropIndex)
  draggedMatter.value = null
}

const handleMatterDragStart = (event: DragEvent, matter: MatterCard) => {
  draggedMatter.value = matter
  emit('matter-drag-start', event, matter)
}

const handleMatterDragEnd = (event: DragEvent) => {
  const targetIndex = calculateDropIndex(event.clientY)
  emit('matter-drag-end', event, props.column.status, targetIndex)
  draggedMatter.value = null
}

// Matter interaction handlers
const handleMatterClick = (matter: MatterCard, event: MouseEvent) => {
  if (props.isMultiSelectMode) {
    if (event.ctrlKey || event.metaKey) {
      emit('matter-select', matter.id)
    } else if (event.shiftKey) {
      handleRangeSelect(matter)
    } else {
      // Single select in multi-select mode
      emit('matter-select', matter.id)
    }
  } else {
    // Navigate to matter detail
    navigateToMatter(matter.id)
  }
}

const handleMatterContextMenu = (matter: MatterCard, event: MouseEvent) => {
  event.preventDefault()
  // TODO: Show context menu with actions
}

const handleRangeSelect = (endMatter: MatterCard) => {
  // Find the range between last selected and current
  const lastSelected = Array.from(props.selectedMatters).pop()
  if (!lastSelected) {
    emit('matter-select', endMatter.id)
    return
  }
  
  const startIndex = props.matters.findIndex(m => m.id === lastSelected)
  const endIndex = props.matters.findIndex(m => m.id === endMatter.id)
  
  if (startIndex !== -1 && endIndex !== -1) {
    const rangeStart = Math.min(startIndex, endIndex)
    const rangeEnd = Math.max(startIndex, endIndex)
    
    for (let i = rangeStart; i <= rangeEnd; i++) {
      emit('matter-select', props.matters[i].id)
    }
  }
}

// Column actions
const handleSelectAll = () => {
  emit('select-all', props.matters)
}

const toggleColumnCollapsed = () => {
  isCollapsed.value = !isCollapsed.value
}

const loadMoreMatters = () => {
  currentPage.value++
}

// Utility functions
const calculateDropIndex = (mouseY: number): number => {
  const container = document.querySelector(`[data-status="${props.column.status}"] .matters-list`)
  if (!container) return 0
  
  const cards = container.querySelectorAll('.matter-card-item')
  let dropIndex = cards.length
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i] as HTMLElement
    const rect = card.getBoundingClientRect()
    const cardMiddle = rect.top + rect.height / 2
    
    if (mouseY < cardMiddle) {
      dropIndex = i
      break
    }
  }
  
  return dropIndex
}

const navigateToMatter = (matterId: string) => {
  // TODO: Navigate to matter detail page
  console.log('Navigate to matter:', matterId)
}

// Reset page when matters change
watch(() => props.matters.length, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.kanban-column-enhanced {
  @apply flex-shrink-0 w-80 bg-muted/30 rounded-lg border;
  min-height: 400px;
}

.column-header {
  @apply flex items-center justify-between p-4 border-b bg-card/50;
}

.column-title {
  @apply flex items-center gap-2;
}

.status-indicator {
  @apply w-3 h-3 rounded-full;
}

.status-indicator.status-gray { @apply bg-gray-500; }
.status-indicator.status-blue { @apply bg-blue-500; }
.status-indicator.status-yellow { @apply bg-yellow-500; }
.status-indicator.status-green { @apply bg-green-500; }

.column-title h3 {
  @apply font-semibold text-foreground;
}

.matter-count {
  @apply text-xs;
}

.collaborator-avatars {
  @apply flex items-center -space-x-2;
}

.additional-collaborators {
  @apply text-xs text-muted-foreground bg-muted rounded-full w-6 h-6 flex items-center justify-center;
}

.column-actions {
  @apply flex items-center gap-1;
}

.matters-container {
  @apply flex-1 p-2;
}

.matters-container.collapsed {
  @apply hidden;
}

.matters-container.drop-target {
  @apply bg-primary/10 ring-2 ring-primary/30;
}

.matters-container.multi-select {
  @apply bg-secondary/30;
}

.drop-zone-indicator {
  @apply absolute inset-0 flex items-center justify-center bg-primary/20 border-2 border-primary border-dashed rounded-lg;
}

.drop-zone-content {
  @apply flex flex-col items-center gap-2 text-primary;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-8 text-center;
}

.matters-list {
  @apply space-y-2;
}

.matter-card-item {
  @apply transition-all duration-200;
}

.load-more-indicator {
  @apply mt-4 pt-2 border-t;
}

.column-stats {
  @apply p-4 space-y-2 text-sm;
}

.stat-item {
  @apply flex justify-between;
}

.stat-label {
  @apply text-muted-foreground;
}

.stat-value {
  @apply font-medium;
}

/* Transitions */
.matter-enter-active,
.matter-leave-active {
  @apply transition-all duration-300;
}

.matter-enter-from {
  @apply opacity-0 translate-y-4 scale-95;
}

.matter-leave-to {
  @apply opacity-0 translate-y-4 scale-95;
}

.matter-move {
  @apply transition-transform duration-300;
}

/* Responsive design */
@media (max-width: 768px) {
  .kanban-column-enhanced {
    @apply w-full;
  }
  
  .column-header {
    @apply px-3 py-2;
  }
  
  .matters-container {
    @apply p-1;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .matter-enter-active,
  .matter-leave-active,
  .matter-move,
  .matter-card-item {
    @apply transition-none;
  }
}
</style>