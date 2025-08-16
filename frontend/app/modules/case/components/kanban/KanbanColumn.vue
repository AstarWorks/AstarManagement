<template>
  <div
    v-motion
    :initial="{ opacity: 0, scale: 0.95 }"
    :enter="{ opacity: 1, scale: 1, transition: { duration: 400 } }"
    :hover="!isDragOver ? { scale: 1.01, transition: { duration: 150 } } : {}"
    class="kanban-column flex flex-col h-full min-w-[280px] max-w-[320px] min-h-[500px] md:min-w-[280px] md:max-w-[320px] transition-all duration-200 ease-in-out"
    :class="{ 
      'scale-102 animate-pulse': isDragOver,
      'hover:shadow-lg': !isDragOver
    }"
    style="height: calc(100vh - 250px);"
    @drop="handleDrop"
    @dragover.prevent
    @dragenter.prevent
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  >
    <!-- Column Header -->
    <KanbanColumnHeader
      :status="status"
      :case-count="cases.length"
      @settings-clicked="handleColumnSettings"
    />

    <!-- Column Content -->
    <KanbanColumnContent
      :status="status"
      :cases="localCases"
      :is-loading="isLoading"
      :loading-case-ids="loadingCaseIds"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
      @case-move="handleCaseMove"
      @case-clicked="$emit('caseClicked', $event)"
      @update:cases="localCases = $event"
    />

    <!-- Drop Zone Indicator -->
    <KanbanDropZone
      :is-visible="isDragOver && draggedCaseStatus !== status.key"
      :status-title="status.title"
    />

    <!-- Add Case Button -->
    <KanbanColumnFooter @add-case-clicked="handleAddCase" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ICase, CaseStatus } from '~/modules/case/types/case'
import KanbanColumnHeader from './KanbanColumnHeader.vue'
import KanbanColumnContent from './KanbanColumnContent.vue'
import KanbanDropZone from './KanbanDropZone.vue'
import KanbanColumnFooter from './KanbanColumnFooter.vue'

interface StatusColumn {
  key: CaseStatus
  title: string
  description: string
  color: string
  headerColor: string
}

interface Props {
  status: StatusColumn
  cases: ICase[]
  isLoading?: boolean
}

interface Emits {
  (e: 'caseMoved', caseId: string, newStatus: CaseStatus, oldStatus: CaseStatus): void
  (e: 'caseClicked', caseData: ICase): void
  (e: 'addCase', status: CaseStatus): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

// Composables
const { t: _t } = useI18n()

// Reactive state
const isDragOver = ref(false)
const draggedCaseStatus = ref<CaseStatus | null>(null)
const loadingCaseIds = ref(new Set<string>())
const localCases = ref<ICase[]>([...props.cases])

// Methods
const handleDragStart = (event: DragEvent | unknown) => {
  console.log('Drag started:', event)
  isDragOver.value = true
}

const handleDragEnd = (event: DragEvent | unknown) => {
  console.log('Drag ended:', event)
  isDragOver.value = false
}

interface SortableEvent {
  added?: {
    element: ICase
    newIndex: number
  }
}

const handleCaseMove = (event: SortableEvent | unknown) => {
  const sortableEvent = event as SortableEvent
  if (sortableEvent.added) {
    const { element: case_, newIndex: _newIndex } = sortableEvent.added
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
@media (max-width: 768px) {
  .kanban-column {
    min-width: 100% !important;
    max-width: none !important;
    height: auto !important;
    min-height: 300px !important;
  }
}

/* アクセシビリティ: アニメーション削減設定 */
@media (prefers-reduced-motion: reduce) {
  .kanban-column * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>