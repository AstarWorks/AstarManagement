<!--
  Enhanced Kanban Board with Advanced Drag-Drop Mutations
  
  @description Kanban board component with multi-select, batch operations,
  real-time sync, and advanced drag-drop mutation capabilities.
  
  @author Claude
  @created 2025-06-26
  @task T12_S08 - Drag & Drop Mutations
-->

<template>
  <div class="kanban-board-enhanced">
    <!-- Header with controls -->
    <div class="kanban-header">
      <div class="kanban-title">
        <h2>Legal Matter Board</h2>
        <div class="connection-status">
          <ConnectionStatus 
            :is-connected="syncState.isConnected"
            :has-conflicts="hasConflicts"
            :queued-operations="queuedOperations"
          />
        </div>
      </div>
      
      <!-- Multi-select controls -->
      <div v-if="isMultiSelectMode" class="multi-select-controls">
        <div class="selection-info">
          <Badge variant="secondary">
            {{ selectedMatters.size }} selected
          </Badge>
        </div>
        
        <div class="selection-actions">
          <Button 
            variant="outline" 
            size="sm"
            @click="handleBatchStatusChange"
            :disabled="isDragOperationPending"
          >
            <Icon name="move" class="w-4 h-4 mr-1" />
            Move Selected
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            @click="clearSelection"
          >
            <Icon name="x" class="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>
      
      <!-- Performance metrics (dev mode) -->
      <div v-if="showPerformanceMetrics" class="performance-metrics">
        <PerformanceIndicator 
          :metrics="performanceMetrics"
          :is-moving="isDragOperationPending"
        />
      </div>
    </div>

    <!-- Conflict resolution panel -->
    <ConflictResolutionPanel
      v-if="hasConflicts"
      :conflicts="activeConflicts"
      @resolve="handleConflictResolution"
      class="mb-4"
    />

    <!-- Collaborator presence indicators -->
    <CollaboratorPresence
      v-if="collaborators.length > 0"
      :collaborators="collaborators"
      class="mb-4"
    />

    <!-- Kanban columns -->
    <div 
      class="kanban-columns"
      :class="{ 
        'multi-select-active': isMultiSelectMode,
        'drag-in-progress': isDragging || isDragOperationPending
      }"
    >
      <KanbanColumnEnhanced
        v-for="column in columns"
        :key="column.id"
        :column="column"
        :matters="getColumnMatters(column.status)"
        :is-drop-target="dragOverColumn === column.id"
        :selected-matters="selectedMatters"
        :is-multi-select-mode="isMultiSelectMode"
        :collaborators="getColumnCollaborators(column.status)"
        @matter-select="toggleMatterSelection"
        @matter-drag-start="handleDragStart"
        @matter-drag-end="handleDragEnd"
        @matter-drop="handleDrop"
        @column-drop="handleColumnDrop"
        @select-all="handleSelectAll"
        @clear-selection="clearSelection"
      />
    </div>

    <!-- Loading overlay for batch operations -->
    <div 
      v-if="isBatchMoving" 
      class="batch-operation-overlay"
    >
      <div class="batch-operation-content">
        <div class="loading-spinner" />
        <p>Processing {{ selectedMatters.size }} matters...</p>
        <div class="operation-progress">
          <Progress :value="batchProgress" class="w-full" />
        </div>
      </div>
    </div>

    <!-- Status change modal for batch operations -->
    <StatusChangeModal
      v-model:open="showStatusModal"
      :selected-count="selectedMatters.size"
      :allowed-statuses="getAllowedBatchStatuses()"
      @confirm="executeBatchStatusChange"
      @cancel="showStatusModal = false"
    />

    <!-- Quick actions panel -->
    <QuickActionsPanel
      v-if="selectedMatters.size > 0"
      :selected-count="selectedMatters.size"
      :is-processing="isDragOperationPending"
      @archive-selected="handleBatchArchive"
      @priority-change="handleBatchPriorityChange"
      @assign-lawyer="handleBatchAssign"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { MatterCard, MatterStatus, KanbanColumn } from '~/types/kanban'
import { useKanbanDragDropMutations } from '~/composables/useKanbanDragDropMutations'
import { useKanbanRealTimeSync } from '~/composables/useKanbanRealTimeSync'
import { useMattersQuery } from '~/composables/useMattersQuery'
import { useAccessibility } from '~/composables/useAccessibility'
import { calculateBatchPositions } from '~/utils/positionManager'

// Props
interface Props {
  showPerformanceMetrics?: boolean
  enableMultiSelect?: boolean
  enableRealTimeSync?: boolean
  columns?: KanbanColumn[]
}

const props = withDefaults(defineProps<Props>(), {
  showPerformanceMetrics: false,
  enableMultiSelect: true,
  enableRealTimeSync: true,
  columns: () => [
    { id: 'draft', title: 'Draft', status: 'DRAFT', color: 'gray' },
    { id: 'active', title: 'Active', status: 'ACTIVE', color: 'blue' },
    { id: 'review', title: 'Review', status: 'REVIEW', color: 'yellow' },
    { id: 'completed', title: 'Completed', status: 'COMPLETED', color: 'green' },
    { id: 'archived', title: 'Archived', status: 'ARCHIVED', color: 'gray' }
  ]
})

// Composables
const { $toast } = useNuxtApp()
const { data: mattersData, isLoading } = useMattersQuery()
const { announceUpdate } = useAccessibility()

const {
  moveMatterMutation,
  batchMoveMutation,
  onDragStart: handleMutationDragStart,
  onDragEnd: handleMutationDragEnd,
  selectedMatters,
  isMultiSelectMode,
  toggleMatterSelection,
  selectAll,
  clearSelection,
  performanceMetrics,
  isMoving,
  isBatchMoving,
  isDragOperationPending
} = useKanbanDragDropMutations()

const {
  syncState,
  hasConflicts,
  activeConflicts,
  collaborators,
  queuedOperations,
  updatePresence
} = useKanbanRealTimeSync({
  conflictResolution: 'server_wins',
  enablePresence: props.enableRealTimeSync,
  enableLocking: false
})

// Local state
const showStatusModal = ref(false)
const dragOverColumn = ref<string | null>(null)
const batchProgress = ref(0)
const isDragging = ref(false)

// Computed properties
const matters = computed(() => mattersData.value?.data || [])

const getColumnMatters = (status: MatterStatus) => {
  return matters.value
    .filter(matter => matter.status === status)
    .sort((a, b) => a.position - b.position)
}

const getColumnCollaborators = (status: MatterStatus) => {
  return collaborators.value.filter(c => c.activeArea === status)
}

const getAllowedBatchStatuses = () => {
  // Calculate allowed statuses for all selected matters
  const selectedMattersList = matters.value.filter(m => selectedMatters.value.has(m.id))
  
  if (selectedMattersList.length === 0) return []
  
  // Find common allowed transitions
  const allowedTransitions = selectedMattersList.reduce((common, matter) => {
    const matterTransitions = getStatusTransitions(matter.status)
    return common.length === 0 ? matterTransitions : common.filter(s => matterTransitions.includes(s))
  }, [] as MatterStatus[])
  
  return allowedTransitions
}

// Drag and drop handlers
const handleDragStart = (event: DragEvent, matter: MatterCard) => {
  isDragging.value = true
  handleMutationDragStart(event, matter)
  
  // Update presence
  updatePresence(matter.status, matter.id)
  
  // Announce drag start
  announceUpdate(`Started dragging ${matter.caseNumber}`)
}

const handleDragEnd = async (event: DragEvent, targetStatus: MatterStatus, targetIndex: number) => {
  try {
    await handleMutationDragEnd(event, targetStatus, targetIndex)
  } finally {
    isDragging.value = false
    dragOverColumn.value = null
    
    // Clear presence
    updatePresence(null)
  }
}

const handleDrop = async (matter: MatterCard, targetStatus: MatterStatus, targetIndex: number) => {
  if (!validateDrop(matter, targetStatus)) {
    $toast.warning('Invalid drop', 'This status transition is not allowed')
    return
  }

  try {
    // Update presence to show activity in target column
    updatePresence(targetStatus)
    
    if (isMultiSelectMode.value && selectedMatters.value.size > 1) {
      await handleBatchMove(targetStatus, targetIndex)
    } else {
      // Single matter move is handled by the mutation composable
    }
  } catch (error) {
    console.error('Drop operation failed:', error)
    $toast.error('Move failed', 'Could not move the matter')
  }
}

const handleColumnDrop = (columnId: string) => {
  dragOverColumn.value = columnId
}

// Multi-select operations
const handleSelectAll = (columnMatters: MatterCard[]) => {
  selectAll(columnMatters)
  announceUpdate(`Selected ${columnMatters.length} matters`)
}

const handleBatchStatusChange = () => {
  if (selectedMatters.value.size === 0) return
  showStatusModal.value = true
}

const executeBatchStatusChange = async (targetStatus: MatterStatus) => {
  showStatusModal.value = false
  
  try {
    const selectedMattersList = matters.value.filter(m => selectedMatters.value.has(m.id))
    const operations = selectedMattersList.map((matter, index) => ({
      matterId: matter.id,
      fromStatus: matter.status,
      toStatus: targetStatus,
      fromIndex: matter.position,
      toIndex: index, // Sequential placement
      matter
    }))

    batchProgress.value = 0
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      batchProgress.value = Math.min(batchProgress.value + 10, 90)
    }, 100)

    await batchMoveMutation.mutateAsync({
      operations,
      userId: 'current-user', // TODO: Get from auth
      timestamp: new Date().toISOString()
    })

    clearInterval(progressInterval)
    batchProgress.value = 100
    
    // Clear selection after successful batch operation
    setTimeout(() => {
      clearSelection()
      batchProgress.value = 0
    }, 500)

    announceUpdate(`Moved ${operations.length} matters to ${targetStatus}`)
    
  } catch (error) {
    console.error('Batch status change failed:', error)
    batchProgress.value = 0
  }
}

const handleBatchMove = async (targetStatus: MatterStatus, targetIndex: number) => {
  const selectedMattersList = matters.value.filter(m => selectedMatters.value.has(m.id))
  
  const operations = selectedMattersList.map((matter, index) => ({
    matterId: matter.id,
    fromStatus: matter.status,
    toStatus: targetStatus,
    fromIndex: matter.position,
    toIndex: targetIndex + index,
    matter
  }))

  await batchMoveMutation.mutateAsync({
    operations,
    userId: 'current-user',
    timestamp: new Date().toISOString()
  })
}

// Batch operations
const handleBatchArchive = async () => {
  await executeBatchStatusChange('ARCHIVED')
}

const handleBatchPriorityChange = async (priority: string) => {
  // TODO: Implement batch priority change
  $toast.info('Feature coming soon', 'Batch priority change will be available soon')
}

const handleBatchAssign = async (lawyerId: string) => {
  // TODO: Implement batch assignment
  $toast.info('Feature coming soon', 'Batch assignment will be available soon')
}

// Conflict resolution
const handleConflictResolution = async (conflictId: string, strategy: string) => {
  // TODO: Implement conflict resolution UI
  $toast.info('Conflict resolved', `Applied ${strategy} strategy`)
}

// Validation
const validateDrop = (matter: MatterCard, targetStatus: MatterStatus): boolean => {
  const allowedStatuses = getStatusTransitions(matter.status)
  return allowedStatuses.includes(targetStatus)
}

const getStatusTransitions = (status: MatterStatus): MatterStatus[] => {
  const transitions: Record<MatterStatus, MatterStatus[]> = {
    'DRAFT': ['ACTIVE', 'ARCHIVED'],
    'ACTIVE': ['REVIEW', 'COMPLETED', 'ARCHIVED'],
    'REVIEW': ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
    'COMPLETED': ['ACTIVE', 'ARCHIVED'],
    'ARCHIVED': ['DRAFT', 'ACTIVE']
  }
  
  return transitions[status] || []
}

// Keyboard shortcuts
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'a':
        event.preventDefault()
        selectAll(matters.value)
        break
      case 'Escape':
        clearSelection()
        break
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})

// Watch for real-time updates
watch(syncState, (newState) => {
  if (newState.isConnected && queuedOperations.value > 0) {
    $toast.info('Syncing', `Processing ${queuedOperations.value} pending changes`)
  }
}, { deep: true })
</script>

<style scoped>
.kanban-board-enhanced {
  @apply relative w-full h-full;
}

.kanban-header {
  @apply flex items-center justify-between mb-6 p-4 bg-card rounded-lg border;
}

.kanban-title {
  @apply flex items-center gap-4;
}

.kanban-title h2 {
  @apply text-2xl font-semibold text-foreground;
}

.connection-status {
  @apply flex items-center gap-2;
}

.multi-select-controls {
  @apply flex items-center gap-4;
}

.selection-info {
  @apply flex items-center gap-2;
}

.selection-actions {
  @apply flex items-center gap-2;
}

.performance-metrics {
  @apply text-xs text-muted-foreground;
}

.kanban-columns {
  @apply flex gap-6 overflow-x-auto pb-4;
  min-height: 60vh;
}

.kanban-columns.multi-select-active {
  @apply ring-2 ring-primary/20 rounded-lg;
}

.kanban-columns.drag-in-progress {
  @apply bg-muted/20;
}

.batch-operation-overlay {
  @apply fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center;
}

.batch-operation-content {
  @apply bg-card p-6 rounded-lg border shadow-lg max-w-sm w-full mx-4;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4;
}

.operation-progress {
  @apply mt-4;
}

/* Responsive design */
@media (max-width: 768px) {
  .kanban-header {
    @apply flex-col gap-4 items-start;
  }
  
  .multi-select-controls {
    @apply w-full justify-between;
  }
  
  .kanban-columns {
    @apply flex-col gap-4;
  }
}

/* Accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    @apply animate-none;
  }
  
  .kanban-columns.drag-in-progress {
    @apply transition-none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .kanban-header {
    @apply border-2 border-foreground;
  }
  
  .batch-operation-overlay {
    @apply bg-background;
  }
}
</style>