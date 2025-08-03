/**
 * Enhanced Case Drag & Drop Composable using VueUse
 * Provides a more declarative approach to drag and drop functionality
 */

import { ref, computed } from 'vue'
import { useDraggable, useDropZone } from '@vueuse/core'
import type { CaseStatus } from '~/types/case'
import { isValidTransition } from '~/config/kanbanStatusConfig'

export interface IDragDropOptions {
  onStatusUpdate: (caseId: string, newStatus: CaseStatus, oldStatus: CaseStatus) => Promise<boolean>
}

export function useCaseDragDropEnhanced(options?: IDragDropOptions) {
  const { t } = useI18n()
  
  // Drag state
  const draggedCase = ref<{ id: string; status: CaseStatus } | null>(null)
  const loadingCaseIds = ref(new Set<string>())
  const dragError = ref<string | null>(null)
  
  // Create draggable for a case card
  function createCaseDraggable(el: Ref<HTMLElement | null>, caseId: string, status: CaseStatus) {
    const { isDragging } = useDraggable(el, {
      onStart: () => {
        draggedCase.value = { id: caseId, status }
        dragError.value = null
      },
      onEnd: () => {
        draggedCase.value = null
      }
    })
    
    return {
      isDragging,
      isLoading: computed(() => loadingCaseIds.value.has(caseId))
    }
  }
  
  // Create drop zone for a kanban column
  function createColumnDropZone(el: Ref<HTMLElement | null>, targetStatus: CaseStatus) {
    const canDrop = computed(() => {
      if (!draggedCase.value) return false
      return isValidTransition(draggedCase.value.status, targetStatus)
    })
    
    const { isOverDropZone } = useDropZone(el, {
      onDrop: async (data) => {
        if (!data || !options?.onStatusUpdate) return
        
        // Since VueUse doesn't support dragData, we use our own state
        if (!draggedCase.value) return
        
        const caseId = draggedCase.value.id
        const fromStatus = draggedCase.value.status
        
        // Validation
        if (fromStatus === targetStatus) {
          console.log(t('cases.dragDrop.sameColumn'))
          return
        }
        
        if (!isValidTransition(fromStatus, targetStatus)) {
          dragError.value = t('cases.dragDrop.transitionNotAllowed', {
            from: t(`cases.status.${fromStatus}`),
            to: t(`cases.status.${targetStatus}`)
          })
          return
        }
        
        // Execute update
        try {
          loadingCaseIds.value.add(caseId)
          const success = await options.onStatusUpdate(caseId, targetStatus, fromStatus)
          
          if (!success) {
            dragError.value = t('cases.dragDrop.moveError')
          }
        } catch (error) {
          dragError.value = t('cases.dragDrop.moveError')
          console.error('Drag and drop failed:', error)
        } finally {
          setTimeout(() => {
            loadingCaseIds.value.delete(caseId)
          }, 500)
        }
      }
    })
    
    return {
      isOverDropZone,
      canDrop,
      dropZoneClasses: computed(() => ({
        'border-2 border-dashed': isOverDropZone.value,
        'border-primary': isOverDropZone.value && canDrop.value,
        'border-destructive': isOverDropZone.value && !canDrop.value,
        'bg-primary/5': isOverDropZone.value && canDrop.value,
        'bg-destructive/5': isOverDropZone.value && !canDrop.value
      }))
    }
  }
  
  // Utility functions
  const clearError = () => {
    dragError.value = null
  }
  
  const reset = () => {
    draggedCase.value = null
    loadingCaseIds.value.clear()
    dragError.value = null
  }
  
  return {
    // State
    draggedCase: readonly(draggedCase),
    dragError: readonly(dragError),
    
    // Factory functions
    createCaseDraggable,
    createColumnDropZone,
    
    // Utilities
    clearError,
    reset,
    isCaseLoading: (caseId: string) => loadingCaseIds.value.has(caseId)
  }
}