"use client"

import React from 'react'
import { KanbanBoard } from './KanbanBoard'
import { 
  useBoard, 
  useFilters, 
  useSorting, 
  useViewPreferences, 
  useDragContext, 
  useBoardActions 
} from '@/stores/kanban-store'
import { UserRole, BoardActions } from './types'
import { DEFAULT_COLUMNS } from './constants'

interface KanbanBoardContainerProps {
  currentUser: {
    id: string
    name: string
    role: UserRole
    avatar?: string
  }
  onMatterClick?: (matter: import('./types').MatterCard) => void
  onMatterEdit?: (matter: import('./types').MatterCard) => void
  onColumnCollapse?: (columnId: string, collapsed: boolean) => void
  className?: string
}

/**
 * Container component that connects the KanbanBoard to Zustand store
 * Handles all state management and provides a clean interface for the board
 */
export function KanbanBoardContainer({
  currentUser,
  onMatterClick,
  onMatterEdit,
  onColumnCollapse,
  className
}: KanbanBoardContainerProps) {
  // Store selectors
  const board = useBoard()
  const filters = useFilters()
  const sorting = useSorting()
  const viewPreferences = useViewPreferences()
  const dragContext = useDragContext()
  
  // Store actions
  const {
    moveMatter,
    updateMatter,
    refreshBoard,
    setFilters,
    setSorting,
    clearFilters,
    setViewPreferences,
    toggleColumn,
    reorderColumns,
    startAutoRefresh,
    stopAutoRefresh
  } = useBoardActions()

  // Create board actions object that matches the interface
  const boardActions: BoardActions = React.useMemo(() => ({
    // Matter operations
    moveMatter: async (matterId: string, newStatus, newColumnId: string) => {
      await moveMatter(matterId, newStatus, newColumnId)
    },
    
    updateMatter: async (matterId: string, updates) => {
      await updateMatter(matterId, updates)
    },
    
    refreshBoard: async () => {
      await refreshBoard()
    },
    
    // Filter and sort
    setFilters: (newFilters) => {
      setFilters(newFilters)
    },
    
    setSorting: (newSorting) => {
      setSorting(newSorting)
    },
    
    clearFilters: () => {
      clearFilters()
    },
    
    // View preferences
    setViewPreferences: (preferences) => {
      setViewPreferences(preferences)
    },
    
    toggleColumn: (columnId: string) => {
      toggleColumn(columnId)
    },
    
    reorderColumns: (columnOrder: string[]) => {
      reorderColumns(columnOrder)
    },
    
    // Real-time updates
    startAutoRefresh: () => {
      startAutoRefresh()
    },
    
    stopAutoRefresh: () => {
      stopAutoRefresh()
    }
  }), [
    moveMatter,
    updateMatter, 
    refreshBoard,
    setFilters,
    setSorting,
    clearFilters,
    setViewPreferences,
    toggleColumn,
    reorderColumns,
    startAutoRefresh,
    stopAutoRefresh
  ])

  // Provide default board if none exists
  const boardData = board || {
    id: 'default-board',
    title: 'Kanban Board',
    columns: DEFAULT_COLUMNS,
    matters: [],
    lastUpdated: new Date().toISOString()
  }

  return (
    <KanbanBoard
      board={boardData}
      actions={boardActions}
      filters={filters}
      sorting={sorting}
      viewPreferences={viewPreferences}
      dragContext={dragContext}
      currentUser={currentUser}
      onMatterClick={onMatterClick}
      onMatterEdit={onMatterEdit}
      onColumnCollapse={onColumnCollapse}
      className={className}
    />
  )
}