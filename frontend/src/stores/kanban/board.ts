import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { KanbanColumn, MatterStatus } from '~/types/kanban'
import { DEFAULT_KANBAN_COLUMNS } from '~/constants/kanban'

export interface DragContext {
  activeId: string | null
  overId: string | null
  isDragging: boolean
  draggedItem: any | null
  dragStartTime: number | null
  dragPreview: HTMLElement | null
}

export const useBoardStore = defineStore('kanban-board', () => {
  // State
  const board = ref<any | null>(null)
  const columns = ref<KanbanColumn[]>([])
  
  // Initialize board on store creation
  const initializeDefaultBoard = () => {
    if (!board.value) {
      initializeBoard()
    }
  }
  
  const dragContext = ref<DragContext>({
    activeId: null,
    overId: null,
    isDragging: false,
    draggedItem: null,
    dragStartTime: null,
    dragPreview: null
  })

  // Actions
  const initializeBoard = (boardData?: Partial<any>) => {
    // Reset columns to fresh defaults (deep copy to avoid mutation)
    columns.value = DEFAULT_KANBAN_COLUMNS.map((col: any) => ({ ...col }))
    
    board.value = {
      id: boardData?.id || 'default-board',
      title: boardData?.title || 'Matter Management Board',
      description: boardData?.description || 'Kanban board for managing legal matters',
      columns: columns.value,
      settings: {
        allowReordering: true,
        autoSave: true,
        compactMode: false,
        showEmptyColumns: true,
        ...boardData?.settings
      },
      lastUpdated: new Date().toISOString(),
      version: 1,
      ...boardData
    }
  }

  const updateDragContext = (updates: Partial<DragContext>) => {
    dragContext.value = { 
      ...dragContext.value, 
      ...updates 
    }
  }

  const startDrag = (item: any, fromColumn?: string) => {
    updateDragContext({
      activeId: typeof item === 'string' ? item : item?.id,
      isDragging: true,
      draggedItem: item,
      dragStartTime: Date.now(),
      dragPreview: null
    })
    
    // Add global drag state to body for CSS targeting
    if (typeof document !== 'undefined') {
      document.body.classList.add('dragging')
    }
  }

  const updateDragOver = (overId: string | null) => {
    updateDragContext({ overId })
  }

  const endDrag = () => {
    const context = dragContext.value
    
    updateDragContext({
      activeId: null,
      overId: null,
      isDragging: false,
      draggedItem: null,
      dragStartTime: null,
      dragPreview: null
    })
    
    // Remove global drag state
    if (typeof document !== 'undefined') {
      document.body.classList.remove('dragging')
    }
    
    return context
  }

  const updateBoardSettings = (settings: Partial<any>) => {
    if (board.value) {
      board.value.settings = {
        ...board.value.settings,
        ...settings
      }
      board.value.lastUpdated = new Date().toISOString()
    }
  }

  const addColumn = (column: KanbanColumn) => {
    columns.value.push(column)
    if (board.value) {
      board.value.columns = columns.value
      board.value.lastUpdated = new Date().toISOString()
    }
  }

  const removeColumn = (columnId: string) => {
    const index = columns.value.findIndex(col => col.id === columnId)
    if (index !== -1) {
      columns.value.splice(index, 1)
      if (board.value) {
        board.value.columns = columns.value
        board.value.lastUpdated = new Date().toISOString()
      }
    }
  }

  const reorderColumns = (newOrder: MatterStatus[] | number[]) => {
    if (Array.isArray(newOrder) && typeof newOrder[0] === 'string') {
      // Reorder by status array
      const statusOrder = newOrder as MatterStatus[]
      const reorderedColumns: KanbanColumn[] = []
      
      statusOrder.forEach(status => {
        const column = columns.value.find(col => col.status === status)
        if (column) {
          reorderedColumns.push(column)
        }
      })
      
      // Only update if all statuses were found
      if (reorderedColumns.length === columns.value.length) {
        columns.value.splice(0, columns.value.length, ...reorderedColumns)
        
        if (board.value) {
          board.value.columns = columns.value
          board.value.lastUpdated = new Date().toISOString()
        }
      }
    } else {
      // Reorder by indices (original behavior)
      const [fromIndex, toIndex] = newOrder as number[]
      const column = columns.value.splice(fromIndex, 1)[0]
      columns.value.splice(toIndex, 0, column)
      
      if (board.value) {
        board.value.columns = columns.value
        board.value.lastUpdated = new Date().toISOString()
      }
    }
  }

  const updateColumn = (status: MatterStatus, updates: Partial<KanbanColumn>) => {
    const column = columns.value.find(col => col.status === status)
    if (column) {
      Object.assign(column, updates)
      if (board.value) {
        board.value.lastUpdated = new Date().toISOString()
      }
    }
  }

  const canAcceptDrop = (status: MatterStatus) => {
    const column = columns.value.find(col => col.status === status)
    if (!column || !column.acceptsDrop) return false
    
    const currentCount = column.currentItemCount ?? 0
    if (column.maxItems !== undefined && currentCount >= column.maxItems) {
      return false
    }
    
    return true
  }

  const hasColumn = (status: MatterStatus) => {
    return columns.value.some(col => col.status === status)
  }

  const resetStore = () => {
    board.value = null
    columns.value = []
    dragContext.value = {
      activeId: null,
      overId: null,
      isDragging: false,
      draggedItem: null,
      dragStartTime: null,
      dragPreview: null
    }
    initializeBoard()
  }

  // Getters
  const boardId = computed(() => board.value?.id)
  const boardTitle = computed(() => board.value?.title)
  const isDragging = computed(() => dragContext.value.isDragging)
  const draggedItemId = computed(() => dragContext.value.activeId)
  const dragOverColumnId = computed(() => dragContext.value.overId)
  
  const getColumnById = computed(() => {
    return (columnId: string) => columns.value.find(col => col.id === columnId)
  })
  
  const getColumnByStatus = computed(() => {
    return (status: MatterStatus) => 
      columns.value.find(col => col.status.includes(status))
  })
  
  const dragDuration = computed(() => {
    if (!dragContext.value.dragStartTime) return 0
    return Date.now() - dragContext.value.dragStartTime
  })

  const visibleColumns = computed(() => {
    return columns.value.filter(column => column.visible)
  })

  const activeDropZones = computed(() => {
    if (!dragContext.value.isDragging) return []
    return columns.value.filter(column => column.acceptsDrop)
  })

  const isValidDropTarget = computed(() => {
    return (targetColumnId: string) => {
      if (!dragContext.value.isDragging || !dragContext.value.draggedItem) {
        return false
      }
      
      const targetColumn = getColumnById.value(targetColumnId)
      if (!targetColumn) return false
      
      // Add business logic for valid drop targets
      // This could check matter status transitions, permissions, etc.
      return true
    }
  })

  // Initialize board on first access
  initializeDefaultBoard()

  return {
    // State (readonly)
    board: readonly(board),
    columns: readonly(columns),
    dragContext: readonly(dragContext),
    
    // Actions
    initializeBoard,
    updateDragContext,
    startDrag,
    updateDragOver,
    endDrag,
    updateBoardSettings,
    addColumn,
    removeColumn,
    reorderColumns,
    updateColumn,
    canAcceptDrop,
    hasColumn,
    resetStore,
    
    // Getters
    boardId,
    boardTitle,
    isDragging,
    draggedItemId,
    dragOverColumnId,
    getColumnById,
    getColumnByStatus,
    dragDuration,
    visibleColumns,
    activeDropZones,
    isValidDropTarget
  }
})