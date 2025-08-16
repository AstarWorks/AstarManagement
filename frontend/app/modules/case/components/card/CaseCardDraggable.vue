<template>
  <div ref="draggableRef" :class="draggableClasses">
    <CaseCardInteractive
      :case-data="caseData"
      :view-mode="viewMode"
      :interactive="interactive"
      :show-quick-actions="showQuickActions"
      :is-loading="isLoading || isCardLoading"
      @clicked="$emit('clicked', caseData)"
      @edit="$emit('edit', caseData)"
      @duplicate="$emit('duplicate', caseData)"
      @delete="$emit('delete', caseData)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDraggable } from '@vueuse/core'
import {useCaseDragDrop} from "~/modules/case/composables/useCaseDragDrop";
import type {ICase} from "~/modules/case/types/case";

interface Props {
  caseData: ICase
  viewMode?: 'minimal' | 'compact' | 'detailed'
  interactive?: boolean
  showQuickActions?: boolean
  isLoading?: boolean
  onDragStart?: (caseId: string, status: string) => void
  onDragEnd?: () => void
}

interface Emits {
  (e: 'clicked' | 'edit' | 'duplicate' | 'delete', caseData: ICase): void
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'compact',
  interactive: true,
  showQuickActions: true,
  isLoading: false
})

defineEmits<Emits>()

// Draggable setup using VueUse
const draggableRef = ref<HTMLElement>()
const dragDrop = useCaseDragDrop()

const { isDragging, style: _style } = useDraggable(draggableRef, {
  disabled: computed(() => !props.interactive),
  onStart: () => {
    props.onDragStart?.(props.caseData.id, props.caseData.status)
    dragDrop.handleDragStart(props.caseData.id, props.caseData.status)
  },
  onEnd: () => {
    props.onDragEnd?.()
    dragDrop.handleDragEnd()
  }
})

// Computed properties
const isCardLoading = computed(() => 
  dragDrop.isCaseLoading(props.caseData.id)
)

const draggableClasses = computed(() => ({
  'opacity-50': isDragging.value,
  'cursor-move': props.interactive && !isDragging.value,
  'cursor-grabbing': isDragging.value,
  'transition-opacity': true
}))
</script>

<style scoped>
/* Dragging visual feedback */
[draggable="true"]:active {
  cursor: grabbing;
}

/* Smooth transitions */
.transition-opacity {
  transition: opacity 0.2s ease-in-out;
}
</style>