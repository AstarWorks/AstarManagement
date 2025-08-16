<template>
  <div
    class="cursor-pointer select-none"
    :class="{ 'hover:shadow-md': interactive }"
    :draggable="interactive"
    :aria-label="cardAriaLabel"
    :aria-describedby="`case-${caseData.id}-description`"
    role="button"
    tabindex="0"
    @click="handleClick"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <CaseCardView
      :case-data="caseData"
      :view-mode="viewMode"
      :is-loading="isCurrentlyLoading"
      :is-dragging="Boolean(dragDrop.isDragging.value)"
    >
      <!-- Actions slot -->
      <template #actions>
        <CaseCardActions
          v-if="showQuickActions"
          v-memo="[showQuickActions]"
          @edit="$emit('edit', caseData)"
          @duplicate="$emit('duplicate', caseData)"
          @delete="$emit('delete', caseData)"
        />
      </template>

      <!-- Error slot -->
      <template #error>
        <Alert v-if="dragDrop.dragError.value" variant="destructive" class="m-4 mt-0">
          <Icon name="lucide:alert-triangle" class="h-4 w-4" />
          <AlertDescription>{{ dragDrop.dragError.value }}</AlertDescription>
        </Alert>
      </template>

      <!-- Loading slot -->
      <template #loading>
        <div
          v-if="isCurrentlyLoading"
          class="absolute inset-0 bg-card/50 backdrop-blur-sm rounded-lg flex items-center justify-center"
        >
          <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-primary" />
        </div>
      </template>
    </CaseCardView>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {  ICase  } from '~/modules/case/types/case'
import { useCaseDragDrop } from '~/modules/case/composables/useCaseDragDrop'
import { Alert, AlertDescription } from '~/foundation/components/ui/alert'

interface Props {
  caseData: ICase
  viewMode?: 'minimal' | 'compact' | 'detailed'
  interactive?: boolean
  showQuickActions?: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'clicked' | 'edit' | 'duplicate' | 'delete', caseData: ICase): void
  (e: 'dragStart' | 'dragEnd', event: DragEvent, caseData: ICase): void
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'compact',
  interactive: true,
  showQuickActions: true,
  isLoading: false
})

const emit = defineEmits<Emits>()

// Use drag drop composable
const dragDrop = useCaseDragDrop()

// i18n
const { t } = useI18n()

// Event handlers
const handleClick = () => {
  if (props.interactive) {
    emit('clicked', props.caseData)
  }
}

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

// Computed properties
const cardAriaLabel = computed(() => 
  t('cases.card.ariaLabel', { 
    title: props.caseData.title, 
    client: props.caseData.client.name 
  })
)

const isCurrentlyLoading = computed(() => 
  props.isLoading || dragDrop.isCaseLoading(props.caseData.id)
)
</script>

<style scoped>
.case-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

div:hover .case-actions {
  opacity: 1;
}

@media (max-width: theme('screens.md')) {
  .case-actions {
    @apply opacity-100; /* Always visible on mobile */
  }
}
</style>