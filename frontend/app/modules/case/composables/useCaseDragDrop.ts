/**
 * Case Drag & Drop Composable
 * Handles kanban drag and drop functionality with validation and error handling
 */

import { ref, readonly, computed } from 'vue'
import { isValidTransition } from '~/modules/case/config/kanbanStatusConfig'
import { useI18n } from 'vue-i18n'
import type {CaseStatus} from "~/modules/case/types/case";

export function useCaseDragDrop() {
  const { t } = useI18n()
  
  // Drag state management
  const isDragging = ref(false)
  const draggedCaseId = ref<string | null>(null)
  const draggedFromStatus = ref<CaseStatus | null>(null)
  const hoveredColumn = ref<CaseStatus | null>(null)
  
  // Loading states for optimistic updates
  const loadingCaseIds = ref(new Set<string>())
  
  // Error handling
  const dragError = ref<string | null>(null)

  // VueUse for toast notifications (if available)
  // const toast = useToast() // Uncomment when toast system is available

  // Drag event handlers
  const handleDragStart = (caseId: string, currentStatus: CaseStatus) => {
    isDragging.value = true
    draggedCaseId.value = caseId
    draggedFromStatus.value = currentStatus
    dragError.value = null
    
    console.log(t('cases.dragDrop.dragStarted', { caseId, status: t(`cases.status.${currentStatus}`) }))
  }

  const handleDragEnd = () => {
    isDragging.value = false
    draggedCaseId.value = null
    draggedFromStatus.value = null
    hoveredColumn.value = null
    
    console.log(t('cases.dragDrop.dragEnded'))
  }

  const handleDragEnter = (targetStatus: CaseStatus) => {
    if (isDragging.value && draggedFromStatus.value) {
      hoveredColumn.value = targetStatus
      
      // Visual feedback for invalid transitions
      if (!isValidTransition(draggedFromStatus.value, targetStatus)) {
        console.warn(t('cases.dragDrop.invalidTransition', {
          from: t(`cases.status.${draggedFromStatus.value}`),
          to: t(`cases.status.${targetStatus}`)
        }))
      }
    }
  }

  const handleDragLeave = () => {
    hoveredColumn.value = null
  }

  // Drop validation and execution
  const handleDrop = async (
    targetStatus: CaseStatus,
    onStatusUpdate: (caseId: string, newStatus: CaseStatus, oldStatus: CaseStatus) => Promise<boolean>
  ) => {
    if (!isDragging.value || !draggedCaseId.value || !draggedFromStatus.value) {
      return false
    }

    const caseId = draggedCaseId.value
    const fromStatus = draggedFromStatus.value
    
    // Reset drag state
    handleDragEnd()

    // Don't move if dropping in the same column
    if (fromStatus === targetStatus) {
      console.log(t('cases.dragDrop.sameColumn'))
      return false
    }

    // Validate transition
    if (!isValidTransition(fromStatus, targetStatus)) {
      dragError.value = t('cases.dragDrop.transitionNotAllowed', {
        from: t(`cases.status.${fromStatus}`),
        to: t(`cases.status.${targetStatus}`)
      })
      
      // Show error notification
      // toast?.error(dragError.value)
      console.error(dragError.value)
      return false
    }

    try {
      // Add to loading state for UI feedback
      loadingCaseIds.value.add(caseId)
      
      // Execute the status update
      const success = await onStatusUpdate(caseId, targetStatus, fromStatus)
      
      if (success) {
        console.log(t('cases.dragDrop.moveSuccess', {
          caseId,
          from: t(`cases.status.${fromStatus}`),
          to: t(`cases.status.${targetStatus}`)
        }))
        
        // Show success notification
        // toast?.success(t('cases.dragDrop.moveSuccess', { ... }))
      }
      
      return success
    } catch (error) {
      dragError.value = t('cases.dragDrop.moveError')
      console.error('Drag and drop failed:', error)
      
      // Show error notification
      // toast?.error(dragError.value)
      return false
    } finally {
      // Remove from loading state
      setTimeout(() => {
        loadingCaseIds.value.delete(caseId)
      }, 500) // Short delay for visual feedback
    }
  }

  // Utility functions
  const canDropInColumn = (targetStatus: CaseStatus): boolean => {
    if (!draggedFromStatus.value) return false
    return isValidTransition(draggedFromStatus.value, targetStatus)
  }

  const isColumnHighlighted = (status: CaseStatus): boolean => {
    return hoveredColumn.value === status
  }

  const isCaseLoading = (caseId: string): boolean => {
    return loadingCaseIds.value.has(caseId)
  }

  const clearError = () => {
    dragError.value = null
  }

  // Reset all drag state (useful for cleanup)
  const resetDragState = () => {
    isDragging.value = false
    draggedCaseId.value = null
    draggedFromStatus.value = null
    hoveredColumn.value = null
    loadingCaseIds.value.clear()
    dragError.value = null
  }

  return {
    // State
    isDragging: readonly(isDragging),
    draggedCaseId: readonly(draggedCaseId),
    draggedFromStatus: readonly(draggedFromStatus),
    hoveredColumn: readonly(hoveredColumn),
    loadingCaseIds: readonly(loadingCaseIds),
    dragError: readonly(dragError),
    
    // Event handlers
    handleDragStart,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    
    // Utilities
    canDropInColumn,
    isColumnHighlighted,
    isCaseLoading,
    clearError,
    resetDragState
  }
}

// Additional helper composable for drag & drop animations
export function useDragDropAnimations() {
  const dragCardClasses = computed(() => [
    'transition-all duration-200 ease-in-out',
    'hover:scale-[1.02] hover:shadow-md',
    'cursor-move'
  ])

  const dropZoneClasses = computed(() => [
    'transition-all duration-300 ease-in-out',
    'border-2 border-dashed',
    'animate-pulse'
  ])

  const ghostCardClasses = computed(() => [
    'opacity-50',
    'bg-primary/10',
    'border-2 border-dashed border-primary',
    'rotate-1',
    'animate-pulse'
  ])

  return {
    dragCardClasses,
    dropZoneClasses,
    ghostCardClasses
  }
}