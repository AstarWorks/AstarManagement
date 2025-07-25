<template>
  <div
    class="kanban-column flex flex-col h-full min-w-[280px] max-w-[320px]"
    :class="{ 'drag-over': isDragOver }"
    @drop="handleDrop"
    @dragover.prevent
    @dragenter.prevent
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  >
    <!-- Column Header -->
    <div
      class="column-header flex items-center justify-between p-4 rounded-t-lg border-b-2"
      :class="[status.headerColor, status.color]"
    >
      <div class="header-info flex-1">
        <h3 class="column-title text-lg font-semibold text-foreground">
          {{ status.title }}
        </h3>
        <p class="column-description text-sm text-muted-foreground">
          {{ status.description }}
        </p>
      </div>
      
      <div class="header-actions flex items-center gap-2">
        <div class="case-count bg-card/80 backdrop-blur-sm px-2 py-1 rounded-full">
          <span class="text-sm font-medium text-foreground">
            {{ cases.length }}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0 opacity-70 hover:opacity-100"
          @click="handleColumnSettings"
        >
          <Icon name="lucide:more-vertical" class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Column Content -->
    <div
      class="column-content flex-1 p-3 overflow-y-auto bg-background rounded-b-lg border-l-2 border-r-2 border-b-2"
      :class="status.color"
    >
      <!-- Loading State -->
      <div v-if="isLoading && cases.length === 0" class="loading-state">
        <div class="space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="animate-pulse bg-muted rounded-lg h-32"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="cases.length === 0"
        class="empty-state flex flex-col items-center justify-center h-32 text-center"
      >
        <Icon name="lucide:inbox" class="h-8 w-8 text-muted-foreground mb-2" />
        <p class="text-sm text-muted-foreground">
          {{ getEmptyStateMessage() }}
        </p>
      </div>

      <!-- Case Cards -->
      <div v-else class="cases-container">
        <draggable
          v-model="localCases"
          :group="{ name: 'cases', pull: true, put: true }"
          :sort="false"
          item-key="id"
          class="space-y-3 min-h-[100px]"
          ghost-class="ghost-card"
          chosen-class="chosen-card"
          drag-class="drag-card"
          @start="handleDragStart"
          @end="handleDragEnd"
          @change="handleCaseMove"
        >
          <template #item="{ element: case_ }">
            <CaseCard
              :case-data="case_"
              :is-loading="loadingCaseIds.has(case_.id)"
              class="case-card-item cursor-move"
              @clicked="$emit('caseClicked', case_)"
            />
          </template>
        </draggable>
      </div>

      <!-- Drop Zone Indicator -->
      <div
        v-if="isDragOver && draggedCaseStatus !== status.key"
        class="drop-zone-indicator mt-3 p-4 border-2 border-dashed border-primary bg-primary/5 rounded-lg text-center"
      >
        <Icon name="lucide:move" class="h-6 w-6 text-primary mx-auto mb-2" />
        <p class="text-sm text-primary font-medium">
          ここにドロップして「{{ status.title }}」に移動
        </p>
      </div>
    </div>

    <!-- Add Case Button -->
    <div class="column-footer p-3 border-t border-border">
      <Button
        variant="ghost"
        size="sm"
        class="w-full justify-start text-muted-foreground hover:text-foreground"
        @click="handleAddCase"
      >
        <Icon name="lucide:plus" class="h-4 w-4 mr-2" />
        案件を追加
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import type { Case, CaseStatus } from '~/types/case'

interface StatusColumn {
  key: CaseStatus
  title: string
  description: string
  color: string
  headerColor: string
}

interface Props {
  status: StatusColumn
  cases: Case[]
  isLoading?: boolean
}

interface Emits {
  (e: 'caseMoved', caseId: string, newStatus: CaseStatus, oldStatus: CaseStatus): void
  (e: 'caseClicked', caseData: Case): void
  (e: 'addCase', status: CaseStatus): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

// Reactive state
const isDragOver = ref(false)
const draggedCaseStatus = ref<CaseStatus | null>(null)
const loadingCaseIds = ref(new Set<string>())
const localCases = ref<Case[]>([...props.cases])

// Computed properties
const emptyStateMessages = computed(() => ({
  new: '新しい案件がありません',
  accepted: '受任中の案件がありません',
  investigation: '調査中の案件がありません',
  preparation: '準備中の案件がありません',
  negotiation: '交渉中の案件がありません',
  trial: '裁判中の案件がありません',
  completed: '完了した案件がありません'
}))

// Methods
const getEmptyStateMessage = () => {
  return emptyStateMessages.value[props.status.key] || '案件がありません'
}

const handleDragStart = (event: any) => {
  console.log('Drag started:', event)
  isDragOver.value = true
}

const handleDragEnd = (event: any) => {
  console.log('Drag ended:', event)
  isDragOver.value = false
}

const handleCaseMove = (event: any) => {
  if (event.added) {
    const { element: case_, newIndex } = event.added
    console.log(`Case ${case_.id} moved to ${props.status.key}`)
    
    // Add to loading state
    loadingCaseIds.value.add(case_.id)
    
    // Emit move event - we need to determine the old status
    // This will be handled by the parent component
    emit('caseMoved', case_.id, props.status.key, case_.status)
    
    // Remove from loading state after a delay
    setTimeout(() => {
      loadingCaseIds.value.delete(case_.id)
    }, 500)
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  
  const dragData = event.dataTransfer?.getData('application/json')
  if (dragData) {
    try {
      const { currentStatus } = JSON.parse(dragData)
      draggedCaseStatus.value = currentStatus
      isDragOver.value = true
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  
  // Only hide drop indicator if leaving the column entirely
  const rect = (event.currentTarget as Element).getBoundingClientRect()
  const { clientX, clientY } = event
  
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    isDragOver.value = false
    draggedCaseStatus.value = null
  }
}

const handleCaseDragStart = (event: DragEvent, case_: Case) => {
  // Set additional drag data if needed
  console.log('Drag started for case:', case_.id)
}

const handleCaseDragEnd = (event: DragEvent, case_: Case) => {
  // Cleanup after drag
  console.log('Drag ended for case:', case_.id)
}

const handleColumnSettings = () => {
  // Implement column settings (e.g., sort order, filters)
  console.log('Column settings for:', props.status.key)
}

const handleAddCase = () => {
  emit('addCase', props.status.key)
}

// Watch for props changes to sync local cases
watch(() => props.cases, (newCases) => {
  localCases.value = [...newCases]
}, { deep: true, immediate: true })
</script>

<style scoped>
.kanban-column {
  height: calc(100vh - 250px);
  min-height: 500px;
}

.column-content {
  max-height: calc(100vh - 350px);
  min-height: 400px;
}

.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-track {
  background: transparent;
}

.column-content::-webkit-scrollbar-thumb {
  background: rgb(229 231 235); /* border fallback */
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: rgb(107 114 128); /* muted-foreground fallback */
}

.drag-over {
  transform: scale(1.02);
  transition: transform 0.2s ease-in-out;
}

.drop-zone-indicator {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Drag and drop styles */
.ghost-card {
  opacity: 0.5;
  background: rgb(59 130 246 / 0.1); /* primary/10 fallback */
  border: 2px dashed rgb(59 130 246); /* primary fallback */
  transform: rotate(5deg);
}

.chosen-card {
  cursor: grabbing !important;
  transform: scale(1.05);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
  z-index: 999;
}

.drag-card {
  opacity: 0.8;
  transform: rotate(2deg);
}

/* Transition animations for case cards */
.case-card-enter-active,
.case-card-leave-active {
  transition: all 0.3s ease;
}

.case-card-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.case-card-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.case-card-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .kanban-column {
    min-width: 100%;
    max-width: none;
    height: auto;
    min-height: 300px;
  }
  
  .column-content {
    max-height: 400px;
    min-height: 200px;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>