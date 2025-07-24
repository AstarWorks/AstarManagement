import { ref, computed, readonly } from 'vue'
import type { MatterCard, MatterStatus } from '~/types/kanban'
import { MATTER_STATUS_TRANSITIONS } from '~/constants/kanban'
import { useAccessibility } from '~/composables/useAccessibility'

/**
 * Composable for handling Kanban drag-and-drop operations
 * Provides state management, validation, and event handlers for matter card dragging
 */
export function useKanbanDragDrop() {
  // Reactive state
  const draggedMatter = ref<MatterCard | null>(null)
  const dragOverColumn = ref<string | null>(null)
  const isDragging = ref(false)

  // Accessibility announcements
  const { announceUpdate } = useAccessibility()

  /**
   * Check if a matter can be dropped in a target column
   * @param matter - The matter being dragged
   * @param targetStatus - The target column status
   * @returns boolean indicating if drop is allowed
   */
  const canDropInColumn = (matter: MatterCard, targetStatus: MatterStatus): boolean => {
    const allowedTransitions = MATTER_STATUS_TRANSITIONS[matter.status] || []
    return allowedTransitions.includes(targetStatus)
  }

  /**
   * Get available status transitions for a matter
   * @param currentStatus - Current matter status
   * @returns Array of allowed target statuses
   */
  const getAvailableStatuses = (currentStatus: MatterStatus): MatterStatus[] => {
    return MATTER_STATUS_TRANSITIONS[currentStatus] || []
  }

  /**
   * Handle drag start event
   * @param event - Sortable drag start event
   */
  const onDragStart = (event: any) => {
    const matter = event.item._underlying_vm_ as MatterCard
    draggedMatter.value = matter
    isDragging.value = true
    
    // Add global dragging state for styling
    document.body.classList.add('dragging')
    
    // Accessibility announcement
    announceUpdate(`Started dragging matter ${matter.caseNumber}: ${matter.title}`)
    
    // Add dragging state to the element
    event.item.classList.add('matter-dragging')
  }

  /**
   * Handle drag end event
   * @param event - Sortable drag end event
   */
  const onDragEnd = (event: any) => {
    const matter = draggedMatter.value
    
    // Clean up state
    draggedMatter.value = null
    dragOverColumn.value = null
    isDragging.value = false
    
    // Remove global dragging state
    document.body.classList.remove('dragging')
    
    // Remove dragging state from element
    event.item.classList.remove('matter-dragging')
    
    // Accessibility announcement
    if (matter) {
      const success = event.from !== event.to
      if (success) {
        const newStatus = event.to.dataset.status
        announceUpdate(`Moved matter ${matter.caseNumber} to ${newStatus} column`)
      } else {
        announceUpdate(`Cancelled dragging matter ${matter.caseNumber}`)
      }
    }
  }

  /**
   * Handle drag change event (when matter is actually moved)
   * @param event - Sortable change event
   * @param targetStatus - Target column status
   */
  const onDragChange = (event: any, targetStatus: MatterStatus) => {
    if (event.added) {
      const matter = event.added.element as MatterCard
      
      // Validate the status transition
      if (!canDropInColumn(matter, targetStatus)) {
        // This shouldn't happen if validation is properly implemented
        console.warn(`Invalid status transition: ${matter.status} -> ${targetStatus}`)
        return false
      }
      
      // Emit status change event (handled by parent component)
      return {
        type: 'status_change',
        matter,
        fromStatus: matter.status,
        toStatus: targetStatus
      }
    }
    
    if (event.moved) {
      // Handle reordering within same column if needed
      return {
        type: 'reorder',
        matter: event.moved.element,
        oldIndex: event.moved.oldIndex,
        newIndex: event.moved.newIndex
      }
    }
    
    return null
  }

  /**
   * Validate if a drop target is valid
   * @param to - Target element
   * @param from - Source element
   * @param dragEl - Dragged element
   * @returns boolean indicating if drop is valid
   */
  const canAcceptDrop = (to: any, from: any, dragEl: any): boolean => {
    if (!draggedMatter.value) return false
    
    const targetStatus = to.dataset.status as MatterStatus
    return canDropInColumn(draggedMatter.value, targetStatus)
  }

  /**
   * Handle drag over event for visual feedback
   * @param columnId - Column being dragged over
   */
  const onDragOver = (columnId: string) => {
    dragOverColumn.value = columnId
  }

  /**
   * Handle drag leave event
   */
  const onDragLeave = () => {
    dragOverColumn.value = null
  }

  /**
   * Check if a matter is currently being dragged
   * @param matter - Matter to check
   * @returns boolean indicating if matter is being dragged
   */
  const isMatterDragging = (matter: MatterCard): boolean => {
    return draggedMatter.value?.id === matter.id
  }

  /**
   * Check if a column is currently being dragged over
   * @param columnId - Column ID to check
   * @returns boolean indicating if column is drag target
   */
  const isColumnDragTarget = (columnId: string): boolean => {
    return dragOverColumn.value === columnId
  }

  return {
    // Reactive state (readonly)
    draggedMatter: readonly(draggedMatter),
    dragOverColumn: readonly(dragOverColumn),
    isDragging: readonly(isDragging),
    
    // Validation functions
    canDropInColumn,
    getAvailableStatuses,
    canAcceptDrop,
    
    // Event handlers
    onDragStart,
    onDragEnd,
    onDragChange,
    onDragOver,
    onDragLeave,
    
    // Helper functions
    isMatterDragging,
    isColumnDragTarget
  }
}