/**
 * Enhanced Kanban Drag-Drop with TanStack Query Integration
 * 
 * @description Extends the original useKanbanDragDrop composable with 
 * TanStack Query mutations for optimistic updates and enhanced performance
 * 
 * @author Claude
 * @created 2025-06-25
 */

import { ref, computed, readonly, watch } from 'vue'
import type { MatterCard, MatterStatus } from '~/types/kanban'
import { MATTER_STATUS_TRANSITIONS } from '~/constants/kanban'
import { useAccessibility } from '~/composables/useAccessibility'
import { useKanbanMutations, type KanbanMoveMatterInput } from './useKanbanMutations'
import { useKanbanPerformanceMonitor } from './useKanbanPerformance'

/**
 * Enhanced drag operation tracking
 */
interface EnhancedDragOperation {
  matter: MatterCard
  startTime: Date
  startStatus: MatterStatus
  startPosition: number
  isProcessing: boolean
  hasError: boolean
  errorMessage?: string
}

/**
 * Enhanced Kanban drag-drop with TanStack Query mutations
 * Provides all original functionality plus optimistic updates and performance tracking
 */
export function useKanbanDragDropEnhanced() {
  // Original drag-drop state
  const draggedMatter = ref<MatterCard | null>(null)
  const dragOverColumn = ref<string | null>(null)
  const isDragging = ref(false)
  
  // Enhanced state for mutation tracking
  const activeDragOperations = ref<Map<string, EnhancedDragOperation>>(new Map())
  const performanceMetrics = ref({
    averageDragTime: 0,
    successRate: 0,
    totalOperations: 0,
    failedOperations: 0
  })
  
  // Accessibility announcements
  const { announceUpdate } = useAccessibility()
  
  // TanStack Query mutations
  const kanbanMutations = useKanbanMutations()
  
  // Performance monitoring
  const performanceMonitor = useKanbanPerformanceMonitor()
  
  /**
   * Enhanced validation with transition tracking
   */
  const canDropInColumn = (matter: MatterCard, targetStatus: MatterStatus): boolean => {
    const allowedTransitions = MATTER_STATUS_TRANSITIONS[matter.status] || []
    const canTransition = allowedTransitions.includes(targetStatus)
    
    // Log invalid transitions for debugging
    if (!canTransition) {
      console.warn(`Invalid transition: ${matter.status} → ${targetStatus}`, {
        matterId: matter.id,
        allowedTransitions
      })
    }
    
    return canTransition
  }
  
  /**
   * Get available status transitions for a matter
   */
  const getAvailableStatuses = (currentStatus: MatterStatus): MatterStatus[] => {
    return MATTER_STATUS_TRANSITIONS[currentStatus] || []
  }
  
  /**
   * Enhanced drag start with mutation tracking and performance monitoring
   */
  const onDragStart = performanceMonitor.optimizedDragStart((event: any) => {
    const matter = event.item._underlying_vm_ as MatterCard
    if (!matter) return
    
    draggedMatter.value = matter
    isDragging.value = true
    
    // Start tracking enhanced drag operation
    const operation: EnhancedDragOperation = {
      matter,
      startTime: new Date(),
      startStatus: matter.status as MatterStatus,
      startPosition: matter.position || 0,
      isProcessing: false,
      hasError: false
    }
    
    activeDragOperations.value.set(matter.id, operation)
    
    // Start mutation tracking
    kanbanMutations.startDragOperation(matter)
    
    // Add global dragging state for styling
    document.body.classList.add('dragging')
    
    // Accessibility announcement
    announceUpdate(`Started dragging matter ${matter.caseNumber}: ${matter.title}`)
    
    // Add dragging state to the element
    event.item.classList.add('matter-dragging')
    
    console.debug('Enhanced drag started:', {
      matterId: matter.id,
      startStatus: matter.status,
      startPosition: matter.position
    })
    
    // Start performance monitoring during drag
    performanceMonitor.startMonitoring()
  })
  
  /**
   * Enhanced drag end with performance tracking
   */
  const onDragEnd = performanceMonitor.optimizedDragEnd((event: any) => {
    const matter = draggedMatter.value
    if (!matter) return
    
    const operation = activeDragOperations.value.get(matter.id)
    const duration = operation ? Date.now() - operation.startTime.getTime() : 0
    
    // Clean up visual state
    draggedMatter.value = null
    dragOverColumn.value = null
    isDragging.value = false
    
    // Remove global dragging state
    document.body.classList.remove('dragging')
    
    // Remove dragging state from element
    event.item.classList.remove('matter-dragging')
    
    // Update performance metrics
    if (operation && !operation.isProcessing) {
      updatePerformanceMetrics(duration, !operation.hasError)
    }
    
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
    
    console.debug('Enhanced drag ended:', {
      matterId: matter.id,
      duration,
      success: operation ? !operation.hasError : false
    })
    
    // Record performance metrics
    performanceMonitor.recordDragLatency(duration)
  })
  
  /**
   * Enhanced drag change with TanStack Query mutations
   */
  const onDragChange = async (event: any, targetStatus: MatterStatus) => {
    if (event.added) {
      const matter = event.added.element as MatterCard
      const newPosition = event.added.newIndex
      
      // Validate the status transition
      if (!canDropInColumn(matter, targetStatus)) {
        console.warn(`Invalid status transition: ${matter.status} -> ${targetStatus}`)
        
        // Show user feedback for invalid transition
        const { $toast } = useNuxtApp()
        $toast.warning(
          'Invalid move', 
          `Cannot move matter from ${matter.status.toLowerCase()} to ${targetStatus.toLowerCase()}`
        )
        
        return false
      }
      
      // Get the drag operation
      const operation = activeDragOperations.value.get(matter.id)
      if (!operation) {
        console.error('No drag operation found for matter:', matter.id)
        return false
      }
      
      // Mark operation as processing
      operation.isProcessing = true
      
      try {
        // Track mutation performance
        const mutationStartTime = performance.now()
        
        // Execute the enhanced mutation with optimistic updates
        const result = await kanbanMutations.onDragChangeWithMutation(event, targetStatus)
        
        // Record mutation latency
        const mutationLatency = performance.now() - mutationStartTime
        performanceMonitor.recordMutationLatency(mutationLatency)
        
        if (result?.success) {
          // Update operation state
          operation.hasError = false
          
          return {
            type: 'status_change',
            matter: result.matter,
            fromStatus: matter.status,
            toStatus: targetStatus,
            success: true,
            optimistic: true // Indicates this was an optimistic update
          }
        } else {
          // Handle mutation failure
          operation.hasError = true
          operation.errorMessage = result?.error || 'Unknown error'
          
          return false
        }
      } catch (error) {
        // Handle unexpected errors
        operation.hasError = true
        operation.errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        console.error('Drag change mutation failed:', error)
        return false
      } finally {
        operation.isProcessing = false
      }
    }
    
    if (event.moved) {
      // Handle reordering within same column
      const matter = event.moved.element as MatterCard
      
      try {
        await kanbanMutations.reorderMatter({
          matterId: matter.id,
          newPosition: event.moved.newIndex,
          oldPosition: event.moved.oldIndex,
          status: matter.status as MatterStatus
        })
        
        return {
          type: 'reorder',
          matter: event.moved.element,
          oldIndex: event.moved.oldIndex,
          newIndex: event.moved.newIndex,
          success: true,
          optimistic: true
        }
      } catch (error) {
        console.error('Reorder mutation failed:', error)
        return false
      }
    }
    
    return null
  }
  
  /**
   * Enhanced drop validation with mutation state awareness
   */
  const canAcceptDrop = (to: any, from: any, dragEl: any): boolean => {
    if (!draggedMatter.value) return false
    
    const targetStatus = to.dataset.status as MatterStatus
    const matter = draggedMatter.value
    
    // Check if matter is currently processing a mutation
    if (kanbanMutations.isMatterPending(matter.id)) {
      return false
    }
    
    // Check basic transition validity
    return canDropInColumn(matter, targetStatus)
  }
  
  /**
   * Handle drag over event for visual feedback
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
   */
  const isMatterDragging = (matter: MatterCard): boolean => {
    return draggedMatter.value?.id === matter.id
  }
  
  /**
   * Check if a matter is currently processing a mutation
   */
  const isMatterProcessing = (matter: MatterCard): boolean => {
    const operation = activeDragOperations.value.get(matter.id)
    return operation?.isProcessing || kanbanMutations.isMatterPending(matter.id)
  }
  
  /**
   * Check if a column is currently being dragged over
   */
  const isColumnDragTarget = (columnId: string): boolean => {
    return dragOverColumn.value === columnId
  }
  
  /**
   * Get drag operation details for a matter
   */
  const getDragOperation = (matterId: string): EnhancedDragOperation | undefined => {
    return activeDragOperations.value.get(matterId)
  }
  
  /**
   * Update performance metrics
   */
  const updatePerformanceMetrics = (duration: number, success: boolean) => {
    const metrics = performanceMetrics.value
    metrics.totalOperations++
    
    if (!success) {
      metrics.failedOperations++
    }
    
    // Update average drag time using exponential moving average
    const alpha = 0.1 // Smoothing factor
    if (metrics.averageDragTime === 0) {
      metrics.averageDragTime = duration
    } else {
      metrics.averageDragTime = alpha * duration + (1 - alpha) * metrics.averageDragTime
    }
    
    // Update success rate
    metrics.successRate = ((metrics.totalOperations - metrics.failedOperations) / metrics.totalOperations) * 100
  }
  
  /**
   * Reset performance metrics
   */
  const resetPerformanceMetrics = () => {
    performanceMetrics.value = {
      averageDragTime: 0,
      successRate: 0,
      totalOperations: 0,
      failedOperations: 0
    }
  }
  
  /**
   * Clean up completed operations
   */
  const cleanupCompletedOperations = () => {
    const now = Date.now()
    const maxAge = 30000 // 30 seconds
    
    activeDragOperations.value.forEach((operation, matterId) => {
      if (!operation.isProcessing && (now - operation.startTime.getTime()) > maxAge) {
        activeDragOperations.value.delete(matterId)
      }
    })
  }
  
  // Auto-cleanup completed operations
  watch(isDragging, (dragging) => {
    if (!dragging) {
      setTimeout(cleanupCompletedOperations, 5000) // Cleanup after 5 seconds
    }
  })
  
  // Computed properties
  const activeOperationsCount = computed(() => activeDragOperations.value.size)
  const isAnyMutationPending = computed(() => kanbanMutations.isAnyMutationPending.value)
  const averageDragTime = computed(() => Math.round(performanceMetrics.value.averageDragTime))
  const successRate = computed(() => Math.round(performanceMetrics.value.successRate * 10) / 10)
  
  // Performance monitoring data
  const currentFps = computed(() => performanceMonitor.metrics.value.fps)
  const performanceScore = computed(() => performanceMonitor.performanceScore.value)
  const performanceWarnings = computed(() => performanceMonitor.performanceWarnings.value)
  
  return {
    // Original drag-drop state (readonly for external use)
    draggedMatter: readonly(draggedMatter),
    dragOverColumn: readonly(dragOverColumn),
    isDragging: readonly(isDragging),
    
    // Enhanced state
    activeOperationsCount,
    isAnyMutationPending,
    performanceMetrics: readonly(performanceMetrics),
    averageDragTime,
    successRate,
    
    // Performance monitoring
    currentFps,
    performanceScore,
    performanceWarnings,
    performanceMonitor: {
      startMonitoring: performanceMonitor.startMonitoring,
      stopMonitoring: performanceMonitor.stopMonitoring,
      isMonitoring: performanceMonitor.isMonitoring
    },
    
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
    isMatterProcessing,
    isColumnDragTarget,
    getDragOperation,
    
    // Performance utilities
    resetPerformanceMetrics,
    cleanupCompletedOperations,
    
    // Mutation state from kanbanMutations
    isMatterPending: kanbanMutations.isMatterPending,
    statusChangeError: kanbanMutations.statusChangeError,
    reorderError: kanbanMutations.reorderError
  }
}