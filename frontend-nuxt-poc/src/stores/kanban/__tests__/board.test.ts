import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBoardStore } from '../board'
import type { KanbanColumn, DragContext } from '../board'

describe('Board Store', () => {
  let store: ReturnType<typeof useBoardStore>
  
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    store = useBoardStore()
    store.resetStore() // Reset to clean state
  })

  describe('Initial State', () => {
    it('should have default board configuration', () => {
      expect(store.board.id).toBe('default-board')
      expect(store.board.title).toBe('Matter Management Board')
      expect(store.columns).toHaveLength(7)
      expect(store.dragContext.isDragging).toBe(false)
    })

    it('should have correct default columns', () => {
      const store = useBoardStore()
      const expectedStatuses = ['INTAKE', 'INITIAL_REVIEW', 'IN_PROGRESS', 'REVIEW', 'WAITING_CLIENT', 'READY_FILING', 'CLOSED']
      
      store.columns.forEach((column, index) => {
        expect(column.status).toBe(expectedStatuses[index])
        expect(column.visible).toBe(true)
        expect(column.acceptsDrop).toBe(true)
      })
    })
  })

  describe('Board Initialization', () => {
    it('should initialize with custom board config', () => {
      const store = useBoardStore()
      const customConfig = {
        id: 'custom-board',
        title: 'Custom Board',
        description: 'A custom board for testing'
      }

      store.initializeBoard(customConfig)

      expect(store.board.id).toBe('custom-board')
      expect(store.board.title).toBe('Custom Board')
      expect(store.board.description).toBe('A custom board for testing')
    })

    it('should reset to default config when no config provided', () => {
      const store = useBoardStore()
      
      // First customize
      store.initializeBoard({ id: 'custom', title: 'Custom' })
      expect(store.board.id).toBe('custom')
      
      // Then reset
      store.initializeBoard()
      expect(store.board.id).toBe('default-board')
      expect(store.board.title).toBe('Matter Management Board')
    })
  })

  describe('Column Management', () => {
    it('should update column visibility', () => {
      const store = useBoardStore()
      
      store.updateColumn('INTAKE', { visible: false })
      
      const intakeColumn = store.columns.find(c => c.status === 'INTAKE')
      expect(intakeColumn?.visible).toBe(false)
    })

    it('should update column properties', () => {
      const store = useBoardStore()
      
      store.updateColumn('IN_PROGRESS', {
        title: 'Active Cases',
        maxItems: 10,
        acceptsDrop: false
      })
      
      const column = store.columns.find(c => c.status === 'IN_PROGRESS')
      expect(column?.title).toBe('Active Cases')
      expect(column?.maxItems).toBe(10)
      expect(column?.acceptsDrop).toBe(false)
    })

    it('should not update non-existent column', () => {
      const store = useBoardStore()
      const originalColumns = [...store.columns]
      
      store.updateColumn('NON_EXISTENT', { title: 'Test' })
      
      expect(store.columns).toEqual(originalColumns)
    })
  })

  describe('Drag and Drop Operations', () => {
    it('should start drag operation', () => {
      const store = useBoardStore()
      const mockItem = { id: 'matter-1', type: 'matter' }
      
      store.startDrag(mockItem, 'IN_PROGRESS')
      
      expect(store.dragContext.isDragging).toBe(true)
      expect(store.dragContext.activeId).toBe('matter-1')
      expect(store.dragContext.draggedItem).toEqual(mockItem)
      expect(store.dragContext.dragStartTime).toBeInstanceOf(Date)
    })

    it('should update drag over state', () => {
      const store = useBoardStore()
      
      store.startDrag({ id: 'matter-1', type: 'matter' }, 'IN_PROGRESS')
      store.updateDragOver('REVIEW')
      
      expect(store.dragContext.overId).toBe('REVIEW')
    })

    it('should end drag operation', () => {
      const store = useBoardStore()
      
      // Start drag
      store.startDrag({ id: 'matter-1', type: 'matter' }, 'IN_PROGRESS')
      expect(store.dragContext.isDragging).toBe(true)
      
      // End drag
      store.endDrag()
      
      expect(store.dragContext.isDragging).toBe(false)
      expect(store.dragContext.activeId).toBeNull()
      expect(store.dragContext.overId).toBeNull()
      expect(store.dragContext.draggedItem).toBeNull()
      expect(store.dragContext.dragStartTime).toBeNull()
    })

    it('should calculate drag duration', () => {
      const store = useBoardStore()
      
      const startTime = new Date('2023-01-01T10:00:00Z')
      const startDrag = vi.spyOn(store, 'startDrag')
      
      // Manually set drag context for testing
      store.updateDragContext({
        activeId: 'matter-1',
        isDragging: true,
        draggedItem: { id: 'matter-1', type: 'matter' },
        dragStartTime: startTime,
        dragPreview: null,
        overId: null
      })
      
      // Mock Date.now to return time 2 seconds later
      const mockNow = vi.spyOn(Date, 'now')
      mockNow.mockReturnValue(startTime.getTime() + 2000)
      
      expect(store.dragDuration).toBe(2000)
      
      mockNow.mockRestore()
    })
  })

  describe('Computed Properties', () => {
    it('should calculate visible columns correctly', () => {
      // Reset store to ensure clean state
      store.resetStore()
      
      // Initially all columns should be visible
      expect(store.visibleColumns).toHaveLength(7)
      
      // Hide a column
      store.updateColumn('INTAKE', { visible: false })
      expect(store.visibleColumns).toHaveLength(6)
      expect(store.visibleColumns.find(c => c.status === 'INTAKE')).toBeUndefined()
    })

    it('should track active drop zones during drag', () => {
      const store = useBoardStore()
      
      // No drag active
      expect(store.activeDropZones).toHaveLength(0)
      
      // Start drag
      store.startDrag({ id: 'matter-1', type: 'matter' }, 'IN_PROGRESS')
      
      // All columns that accept drops should be active
      const acceptingColumns = store.columns.filter(c => c.acceptsDrop)
      expect(store.activeDropZones).toHaveLength(acceptingColumns.length)
    })

    it('should provide correct drag state', () => {
      const store = useBoardStore()
      
      expect(store.isDragging).toBe(false)
      
      store.startDrag({ id: 'matter-1', type: 'matter' }, 'IN_PROGRESS')
      expect(store.isDragging).toBe(true)
      
      store.endDrag()
      expect(store.isDragging).toBe(false)
    })
  })

  describe('Column Order Management', () => {
    it('should reorder columns', () => {
      const store = useBoardStore()
      const originalOrder = store.columns.map(c => c.status)
      
      store.reorderColumns(['REVIEW', 'INTAKE', 'IN_PROGRESS', 'INITIAL_REVIEW', 'WAITING_CLIENT', 'READY_FILING', 'CLOSED'])
      
      expect(store.columns[0].status).toBe('REVIEW')
      expect(store.columns[1].status).toBe('INTAKE')
      expect(store.columns.map(c => c.status)).not.toEqual(originalOrder)
    })

    it('should not reorder with invalid statuses', () => {
      const store = useBoardStore()
      const originalOrder = store.columns.map(c => c.status)
      
      store.reorderColumns(['INVALID', 'INTAKE'])
      
      // Should remain unchanged
      expect(store.columns.map(c => c.status)).toEqual(originalOrder)
    })
  })

  describe('Board Validation', () => {
    it('should validate column drop acceptance', () => {
      const store = useBoardStore()
      
      expect(store.canAcceptDrop('INTAKE')).toBe(true)
      
      // Disable drop acceptance
      store.updateColumn('INTAKE', { acceptsDrop: false })
      expect(store.canAcceptDrop('INTAKE')).toBe(false)
    })

    it('should validate column item limits', () => {
      // Reset to clean state
      store.resetStore()
      
      // Set max items for a column
      store.updateColumn('IN_PROGRESS', { maxItems: 2, currentItemCount: 1 })
      
      expect(store.canAcceptDrop('IN_PROGRESS')).toBe(true)
      
      // Reach the limit
      store.updateColumn('IN_PROGRESS', { currentItemCount: 2 })
      expect(store.canAcceptDrop('IN_PROGRESS')).toBe(false)
    })

    it('should check if column exists', () => {
      const store = useBoardStore()
      
      expect(store.hasColumn('INTAKE')).toBe(true)
      expect(store.hasColumn('NON_EXISTENT')).toBe(false)
    })
  })
})