"use client"

import React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { MatterCard } from './MatterCard'
import { KanbanBoardProps, MatterCard as MatterCardType } from './types'
import { BOARD_CONFIG } from './constants'
import { cn } from '@/lib/utils'

// Status transition validation - integrated with backend
const validateStatusTransition = async (
  currentStatus: string, 
  newStatus: string,
  matterId: string
): Promise<{ isValid: boolean; message?: string }> => {
  try {
    // In a real implementation, this would call the backend API
    // For now, we'll use the backend's validation logic from S01 sprint
    const response = await fetch(`/api/matters/${matterId}/validate-transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentStatus, newStatus })
    })
    
    if (!response.ok) {
      return { isValid: false, message: 'Unable to validate transition' }
    }
    
    const result = await response.json()
    return { isValid: result.valid, message: result.message }
  } catch (error) {
    // Fallback validation for development/demo mode
    console.warn('Backend validation unavailable, using fallback rules')
    return fallbackValidateTransition(currentStatus, newStatus)
  }
}

// Fallback validation rules (matches backend S01 implementation)
const fallbackValidateTransition = (
  currentStatus: string, 
  newStatus: string
): { isValid: boolean; message?: string } => {
  const validTransitions: Record<string, string[]> = {
    INTAKE: ['INITIAL_REVIEW', 'INVESTIGATION'],
    INITIAL_REVIEW: ['INVESTIGATION', 'RESEARCH', 'CLOSED'],
    INVESTIGATION: ['RESEARCH', 'DRAFT_PLEADINGS', 'CLOSED'],
    RESEARCH: ['DRAFT_PLEADINGS', 'FILED', 'CLOSED'],
    DRAFT_PLEADINGS: ['FILED', 'RESEARCH', 'CLOSED'],
    FILED: ['DISCOVERY', 'TRIAL_PREP', 'MEDIATION', 'CLOSED'],
    DISCOVERY: ['TRIAL_PREP', 'MEDIATION', 'SETTLEMENT', 'CLOSED'],
    MEDIATION: ['SETTLEMENT', 'TRIAL_PREP', 'CLOSED'],
    TRIAL_PREP: ['TRIAL', 'MEDIATION', 'SETTLEMENT', 'CLOSED'],
    TRIAL: ['SETTLEMENT', 'CLOSED'],
    SETTLEMENT: ['CLOSED'],
    CLOSED: [] // Cannot move from closed
  }
  
  const allowedTransitions = validTransitions[currentStatus] || []
  const isValid = allowedTransitions.includes(newStatus)
  
  return {
    isValid,
    message: isValid ? undefined : `Cannot transition from ${currentStatus} to ${newStatus}`
  }
}

// Status transitions that require confirmation
const CONFIRMATION_REQUIRED: Set<string> = new Set([
  'CLOSED', 'SETTLEMENT'
])

export const KanbanBoard = React.memo(function KanbanBoard({
  board,
  actions,
  filters,
  sorting,
  viewPreferences,
  dragContext,
  currentUser,
  onColumnCollapse,
  renderHeaderExtras,
  className
}: KanbanBoardProps) {
  // State for drag operations
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [overId, setOverId] = React.useState<string | null>(null)
  const [dragStartTime, setDragStartTime] = React.useState<number>(0)
  
  // State for confirmation dialog
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    isOpen: boolean
    matterId: string
    newStatus: string
    targetColumnId: string
    matterTitle: string
  } | null>(null)

  // onMatterClick and onMatterEdit are available in props but not used in demo
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Long press delay
        tolerance: 5, // Movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter and sort matters
  const filteredMatters = React.useMemo(() => {
    let filtered = [...board.matters]

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(matter => 
        matter.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
        matter.caseNumber.toLowerCase().includes(filters.search!.toLowerCase()) ||
        matter.clientName.toLowerCase().includes(filters.search!.toLowerCase())
      )
    }

    // Apply priority filter
    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter(matter => 
        filters.priorities!.includes(matter.priority)
      )
    }

    // Apply assigned lawyer filter
    if (filters.assignedLawyer) {
      filtered = filtered.filter(matter => 
        matter.assignedLawyer?.id === filters.assignedLawyer
      )
    }

    // Apply assigned clerk filter
    if (filters.assignedClerk) {
      filtered = filtered.filter(matter => 
        matter.assignedClerk?.id === filters.assignedClerk
      )
    }

    // Apply overdue filter
    if (filters.showOverdueOnly) {
      filtered = filtered.filter(matter => matter.isOverdue)
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(matter => {
        const matterDate = new Date(matter.createdAt)
        const startDate = new Date(filters.dateRange!.start)
        const endDate = new Date(filters.dateRange!.end)
        return matterDate >= startDate && matterDate <= endDate
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      switch (sorting.field) {
        case 'priority':
          const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31')
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31')
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'caseNumber':
          aValue = a.caseNumber.toLowerCase()
          bValue = b.caseNumber.toLowerCase()
          break
        default:
          return 0
      }

      if (sorting.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [board.matters, filters, sorting])

  // Group matters by column
  const mattersByColumn = React.useMemo(() => {
    const groups: Record<string, MatterCardType[]> = {}
    
    // Initialize all columns
    board.columns.forEach(column => {
      groups[column.id] = []
    })

    // Group filtered matters by their column
    filteredMatters.forEach(matter => {
      const column = board.columns.find(col => 
        col.status.includes(matter.status)
      )
      if (column) {
        groups[column.id].push(matter)
      }
    })

    return groups
  }, [filteredMatters, board.columns])

  // Get visible columns based on preferences
  const visibleColumns = React.useMemo(() => {
    return board.columns
      .filter(column => viewPreferences.columnsVisible.includes(column.id))
      .sort((a, b) => {
        const aIndex = viewPreferences.columnOrder.indexOf(a.id)
        const bIndex = viewPreferences.columnOrder.indexOf(b.id)
        return aIndex - bIndex
      })
  }, [board.columns, viewPreferences.columnsVisible, viewPreferences.columnOrder])

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setDragStartTime(performance.now())
    
    // Provide screen reader announcement
    const matter = board.matters.find(m => m.id === event.active.id)
    if (matter) {
      // Could add aria-live announcement here
      console.log(`Started dragging matter: ${matter.caseNumber} - ${matter.title}`)
    }
  }, [board.matters])

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    const { over } = event
    setOverId(over ? (over.id as string) : null)
  }, [])

  const handleDragEnd = React.useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    const dragEndTime = performance.now()
    const dragDuration = dragEndTime - dragStartTime

    // Reset drag state
    setActiveId(null)
    setOverId(null)
    setDragStartTime(0)

    // Performance check - drag start response time should be < 50ms
    if (dragDuration < 50) {
      console.log(`✅ Drag operation completed in ${dragDuration.toFixed(2)}ms`)
    } else {
      console.warn(`⚠️ Drag operation took ${dragDuration.toFixed(2)}ms (target: <50ms)`)
    }

    if (!over) return

    const matterId = active.id as string
    const overId = over.id as string

    // Find the target column
    const targetColumn = board.columns.find(col => col.id === overId)
    if (!targetColumn) return

    // Get the matter being moved
    const matter = board.matters.find(m => m.id === matterId)
    if (!matter) return

    // Determine the new status (use the first status from the target column)
    const newStatus = targetColumn.status[0]

    // Only move if the status is actually changing
    if (matter.status === newStatus) return

    // Validate transition with backend
    const currentStatus = matter.status
    const validation = await validateStatusTransition(currentStatus, newStatus, matterId)
    
    if (!validation.isValid) {
      console.warn(`Invalid transition from ${currentStatus} to ${newStatus}: ${validation.message}`)
      // Could show error toast here with validation.message
      return
    }

    // Check if confirmation is required
    if (CONFIRMATION_REQUIRED.has(newStatus)) {
      setConfirmationDialog({
        isOpen: true,
        matterId,
        newStatus,
        targetColumnId: targetColumn.id,
        matterTitle: matter.title
      })
      return
    }

    // Proceed with the move
    await executeMatterMove(matterId, newStatus, targetColumn.id)
  }, [board.matters, board.columns, dragStartTime])

  // Function to execute the actual matter move
  const executeMatterMove = React.useCallback(async (
    matterId: string, 
    newStatus: string, 
    targetColumnId: string
  ) => {
    const moveStartTime = performance.now()
    
    try {
      // Optimistic update
      await actions.moveMatter(matterId, newStatus, targetColumnId)
      
      const moveEndTime = performance.now()
      const moveDuration = moveEndTime - moveStartTime
      
      // Performance check - drop completion should be < 200ms
      if (moveDuration < 200) {
        console.log(`✅ Move operation completed in ${moveDuration.toFixed(2)}ms`)
      } else {
        console.warn(`⚠️ Move operation took ${moveDuration.toFixed(2)}ms (target: <200ms)`)
      }
      
      // Screen reader announcement
      const matter = board.matters.find(m => m.id === matterId)
      if (matter) {
        console.log(`Moved matter ${matter.caseNumber} to ${newStatus}`)
      }
    } catch (error) {
      console.error('Failed to move matter:', error)
      // Could show error toast here
      // Rollback would happen automatically via optimistic updates
    }
  }, [actions, board.matters])

  // Handle confirmation dialog
  const handleConfirmMove = React.useCallback(async () => {
    if (!confirmationDialog) return
    
    await executeMatterMove(
      confirmationDialog.matterId,
      confirmationDialog.newStatus,
      confirmationDialog.targetColumnId
    )
    
    setConfirmationDialog(null)
  }, [confirmationDialog, executeMatterMove])

  const handleCancelMove = React.useCallback(() => {
    setConfirmationDialog(null)
  }, [])

  const activeMatter = activeId 
    ? board.matters.find(m => m.id === activeId)
    : null

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Board Header */}
        <div className="flex-shrink-0 p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {board.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(board.lastUpdated).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {renderHeaderExtras ? renderHeaderExtras() : (
                <>
                  <div className="text-sm text-muted-foreground">
                    {filteredMatters.length} of {board.matters.length} matters
                  </div>
                  {viewPreferences.autoRefresh && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Auto-refresh
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Board Content */}
        <div className="flex-1 overflow-hidden">
          <div 
            className="h-full overflow-x-auto overflow-y-hidden"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgb(203 213 225) transparent'
            }}
          >
            <div 
              className="flex h-full gap-4 p-4"
              style={{
                minWidth: `${visibleColumns.length * (BOARD_CONFIG.minColumnWidth + BOARD_CONFIG.columnGap)}px`
              }}
            >
              {visibleColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  matters={mattersByColumn[column.id] || []}
                  viewPreferences={viewPreferences}
                  currentUser={currentUser}
                  onToggleCollapse={(collapsed) => 
                    onColumnCollapse?.(column.id, collapsed)
                  }
                  className="flex-shrink-0"
                  style={{
                    width: `${BOARD_CONFIG.minColumnWidth}px`,
                    maxWidth: `${BOARD_CONFIG.maxColumnWidth}px`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeMatter ? (
            <MatterCard
              matter={activeMatter}
              isDragging={true}
              viewPreferences={viewPreferences}
              currentUser={currentUser}
              className="transform rotate-3 shadow-lg opacity-60"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Confirmation Dialog */}
      {confirmationDialog?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Confirm Status Change</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to move "{confirmationDialog.matterTitle}" to{' '}
              <span className="font-medium">{confirmationDialog.newStatus.replace('_', ' ').toLowerCase()}</span>?
            </p>
            {confirmationDialog.newStatus === 'CLOSED' && (
              <p className="text-orange-600 text-sm mb-4">
                ⚠️ Closing a matter is a significant action that may require additional documentation.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelMove}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMove}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})