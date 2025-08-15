<!--
  Case Card Container - Simple over Easy
  Orchestrates the composition of case card components with clear separation of concerns
-->
<template>
  <div
    ref="elementRef"
    :class="wrapperClasses"
    :role="interactive ? 'button' : undefined"
    :tabindex="interactive ? 0 : undefined"
    :aria-label="cardAriaLabel"
    :aria-described-by="`case-${caseData.id}-description`"
    :aria-disabled="!interactive"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
    @keydown.space.prevent="handleCardClick"
  >
    <div class="relative">
      <ErrorBoundary :error="dragDrop.dragError.value" class="m-4 mt-0">
        <!-- Draggable version -->
        <template v-if="draggable && interactive">
          <CaseCardDraggable
            :case-data="caseData"
            :interactive="interactive"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
          >
            <CaseCardView
              :case-data="caseData"
              :view-mode="viewMode"
              :is-dragging="Boolean(dragDrop.isDragging.value)"
            >
              <template v-if="showQuickActions" #actions>
                <CaseCardActions
                  @edit="$emit('edit', caseData)"
                  @duplicate="$emit('duplicate', caseData)"
                  @delete="$emit('delete', caseData)"
                />
              </template>
            </CaseCardView>
            <LoadingOverlay :loading="isCurrentlyLoading" />
          </CaseCardDraggable>
        </template>
        
        <!-- Non-draggable version -->
        <template v-else>
          <CaseCardView
            :case-data="caseData"
            :view-mode="viewMode"
            :is-dragging="false"
          >
            <template v-if="showQuickActions" #actions>
              <CaseCardActions
                @edit="$emit('edit', caseData)"
                @duplicate="$emit('duplicate', caseData)"
                @delete="$emit('delete', caseData)"
              />
            </template>
          </CaseCardView>
          <LoadingOverlay :loading="isCurrentlyLoading" />
        </template>
      </ErrorBoundary>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ICase } from '@/features/case/types/case'
import { useCaseDragDrop } from '@/features/case/composables/useCaseDragDrop'
import LoadingOverlay from '@/shared/components/states/LoadingOverlay.vue'
import ErrorBoundary from '@/shared/components/ErrorBoundary.vue'
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

// Element reference
const elementRef = ref<HTMLElement>()

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

const wrapperClasses = computed(() => [
  'cursor-pointer select-none transition-all duration-200',
  {
    'hover:shadow-md': props.interactive,
    'opacity-50 cursor-not-allowed': !props.interactive
  }
])

// Event handlers
const handleCardClick = () => {
  if (props.interactive) {
    emit('clicked', props.caseData)
  }
}

const handleDragStart = () => {
  emit('dragStart', props.caseData)
}

const handleDragEnd = () => {
  emit('dragEnd', props.caseData)
}
</script>