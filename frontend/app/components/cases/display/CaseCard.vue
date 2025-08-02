<template>
  <div
    class="case-card bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative select-none min-h-[180px] max-w-[280px] w-full"
    :class="cardClasses"
    :draggable="interactive"
    :aria-label="cardAriaLabel"
    :aria-describedby="cardId"
    role="button"
    tabindex="0"
    @click="$emit('clicked', caseData)"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @keydown.enter="$emit('clicked', caseData)"
    @keydown.space.prevent="$emit('clicked', caseData)"
  >
    <!-- Case Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            {{ caseData.caseNumber }}
          </span>
          <CasePriorityBadge :priority="caseData.priority" size="sm" />
        </div>
        <h3 
          :id="cardId"
          class="case-title text-sm font-semibold text-foreground line-clamp-2 leading-tight"
        >
          {{ caseData.title }}
        </h3>
      </div>
      
      <!-- Actions Component with lazy loading -->
      <CaseCardActions
        v-if="showQuickActions"
        v-memo="[showQuickActions]"
        @edit="$emit('edit', caseData)"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
      />
    </div>

    <!-- Client Information -->
    <div class="mb-3">
      <div class="flex items-center gap-2">
        <Icon 
          :name="caseData.client.type === 'individual' ? 'lucide:user' : 'lucide:building'" 
          class="h-4 w-4 text-muted-foreground flex-shrink-0" 
        />
        <span class="text-sm text-foreground truncate">
          {{ caseData.client.name }}
        </span>
        <ClientTypeBadge :type="caseData.client.type" size="xs" />
      </div>
    </div>

    <!-- Metadata Component with memoization -->
    <CaseCardMetadata 
      v-memo="[caseData.assignedLawyer, caseData.dueDate, caseData.tags, viewMode]"
      :case-data="caseData" 
      :view-mode="viewMode" 
    />

    <!-- Progress Indicator -->
    <div class="mt-3 pt-3 border-t border-border">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted-foreground">{{ $t('cases.card.progress') }}</span>
        <CaseProgressIndicator :status="caseData.status" size="sm" />
      </div>
    </div>

    <!-- Error Display -->
    <Alert v-if="dragDrop.dragError" variant="destructive" class="mt-2">
      <Icon name="lucide:alert-triangle" class="h-4 w-4" />
      <AlertDescription>{{ dragDrop.dragError }}</AlertDescription>
    </Alert>

    <!-- Loading Overlay with shadcn/ui -->
    <div
      v-if="isCurrentlyLoading"
      class="absolute inset-0 bg-card/50 backdrop-blur-sm rounded-lg flex items-center justify-center"
    >
      <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-primary" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Case } from '~/types/case'
import { Alert, AlertDescription } from '~/components/ui/alert'

interface Props {
  caseData: Case
  viewMode?: 'minimal' | 'compact' | 'detailed'
  interactive?: boolean
  showQuickActions?: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'clicked', caseData: Case): void
  (e: 'edit', caseData: Case): void
  (e: 'duplicate', caseData: Case): void
  (e: 'delete', caseData: Case): void
  (e: 'dragStart', event: DragEvent, caseData: Case): void
  (e: 'dragEnd', event: DragEvent, caseData: Case): void
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'compact',
  interactive: true,
  showQuickActions: true,
  isLoading: false
})

const emit = defineEmits<Emits>()

// Use drag drop composable for enhanced functionality  
const dragDrop = useCaseDragDrop()

// Simplified drag handlers using composable
const handleDragStart = (event: DragEvent) => {
  if (!props.interactive) return
  
  dragDrop.handleDragStart(props.caseData.id, props.caseData.status)
  
  // Set drag data for browser compatibility
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.caseData.id)
    event.dataTransfer.setData('application/json', JSON.stringify({
      caseId: props.caseData.id,
      currentStatus: props.caseData.status
    }))
  }
  
  emit('dragStart', event, props.caseData)
}

const handleDragEnd = (event: DragEvent) => {
  dragDrop.handleDragEnd()
  emit('dragEnd', event, props.caseData)
}

const handleDuplicate = () => {
  emit('duplicate', props.caseData)
}

const handleDelete = () => {
  emit('delete', props.caseData)
}

// Performance optimization: computed properties for template
const cardClasses = computed(() => [
  `priority-${props.caseData.priority}`,
  { 'opacity-50': props.isLoading || dragDrop.isCaseLoading(props.caseData.id) },
  { 'ring-2 ring-primary': dragDrop.isDragging }
])

const { t } = useI18n()
const cardAriaLabel = computed(() => 
  t('cases.card.ariaLabel', { 
    title: props.caseData.title, 
    client: props.caseData.client.name 
  })
)

const cardId = computed(() => `case-${props.caseData.id}-description`)

const isCurrentlyLoading = computed(() => 
  props.isLoading || dragDrop.isCaseLoading(props.caseData.id)
)
</script>

<style scoped>
.case-card:hover .case-actions {
  opacity: 1;
}

.case-card.priority-high {
  border-left: 4px solid rgb(239 68 68); /* red-500 fallback */
}

.case-card.priority-medium {
  border-left: 4px solid rgb(234 179 8); /* yellow-500 fallback */
}

.case-card.priority-low {
  border-left: 4px solid rgb(34 197 94); /* green-500 fallback */
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .case-card {
    min-height: 160px !important;
    max-width: none !important;
  }
  
  .case-actions {
    opacity: 1 !important; /* Always visible on mobile */
  }
}
</style>