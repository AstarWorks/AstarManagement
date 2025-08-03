<!--
  Case Card Container - Simple over Easy
  Orchestrates the composition of case card components with clear separation of concerns
-->
<template>
  <InteractiveWrapper
    :interactive="interactive"
    :aria-label="cardAriaLabel"
    :aria-described-by="`case-${caseData.id}-description`"
    @click="$emit('clicked', caseData)"
  >
    <!-- Use existing CaseCardDraggable for drag functionality -->
    <CaseCardDraggable
      v-if="draggable && interactive"
      :case-data="caseData"
      :interactive="interactive"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
    >
      <CaseCardContent />
    </CaseCardDraggable>
    
    <!-- Non-draggable version -->
    <CaseCardContent v-else />
  </InteractiveWrapper>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import type {  ICase  } from '~/types/case'
import { useCaseDragDrop } from '~/composables/useCaseDragDrop'
import InteractiveWrapper from './wrappers/InteractiveWrapper.vue'
import LoadingOverlay from './wrappers/LoadingOverlay.vue'
import ErrorBoundary from './wrappers/ErrorBoundary.vue'
import CaseCardView from './CaseCardView.vue'
import CaseCardActions from './CaseCardActions.vue'
import CaseCardDraggable from './CaseCardDraggable.vue'

interface Props {
  caseData: ICase
  viewMode?: 'minimal' | 'compact' | 'detailed'
  interactive?: boolean
  draggable?: boolean
  showQuickActions?: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'clicked' | 'edit' | 'duplicate' | 'delete' | 'dragStart' | 'dragEnd', caseData: ICase): void
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'compact',
  interactive: true,
  draggable: true,
  showQuickActions: true,
  isLoading: false
})

const emit = defineEmits<Emits>()

// Composables
const { t } = useI18n()
const dragDrop = useCaseDragDrop()

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

// Event handlers
const handleDragStart = () => {
  emit('dragStart', props.caseData)
}

const handleDragEnd = () => {
  emit('dragEnd', props.caseData)
}

// Define CaseCardContent as a nested component for cleaner composition
const CaseCardContent = defineComponent({
  name: 'CaseCardContent',
  setup() {
    return () => h('div', { class: 'relative' }, [
      // Error boundary wrapper
      h(ErrorBoundary, {
        error: dragDrop.dragError.value,
        class: 'm-4 mt-0'
      }, {
        default: () => [
          // Main card view
          h(CaseCardView, {
            caseData: props.caseData,
            viewMode: props.viewMode,
            isDragging: Boolean(dragDrop.isDragging.value)
          }, {
            // Actions slot
            actions: () => props.showQuickActions ? h(CaseCardActions, {
              onEdit: () => emit('edit', props.caseData),
              onDuplicate: () => emit('duplicate', props.caseData),
              onDelete: () => emit('delete', props.caseData)
            }) : null
          }),
          
          // Loading overlay
          h(LoadingOverlay, {
            loading: isCurrentlyLoading.value
          })
        ]
      })
    ])
  }
})
</script>