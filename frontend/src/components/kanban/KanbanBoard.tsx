"use client"

import React from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { MatterCard } from './MatterCard'
import { KanbanBoardProps, MatterCard as MatterCardType } from './types'
import { BOARD_CONFIG } from './constants'
import { cn } from '@/lib/utils'

export function KanbanBoard({
  board,
  actions,
  filters,
  sorting,
  viewPreferences,
  dragContext,
  currentUser,
  onColumnCollapse,
  className
}: KanbanBoardProps) {
  // onMatterClick and onMatterEdit are available in props but not used in demo
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
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

  const handleDragStart = () => {
    // Handle drag start logic here if needed
  }

  const handleDragOver = () => {
    // Handle drag over logic here if needed
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

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
    if (matter.status !== newStatus) {
      try {
        await actions.moveMatter(matterId, newStatus, targetColumn.id)
      } catch (error) {
        console.error('Failed to move matter:', error)
        // Could show error toast here
      }
    }
  }

  const activeMatter = dragContext.activeId 
    ? board.matters.find(m => m.id === dragContext.activeId)
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
              <div className="text-sm text-muted-foreground">
                {filteredMatters.length} of {board.matters.length} matters
              </div>
              {viewPreferences.autoRefresh && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Auto-refresh
                </div>
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
              className="transform rotate-3 shadow-lg"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}