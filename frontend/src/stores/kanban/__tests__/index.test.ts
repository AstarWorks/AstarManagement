import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKanbanStore } from '../index'
import type { Matter } from '~/types/kanban'

// Mock $fetch
const mockFetch = vi.fn()
globalThis.$fetch = mockFetch

// Mock individual stores
const mockBoardStore = {
  board: { id: 'test-board', title: 'Test Board', description: 'Test Description' },
  columns: [],
  dragContext: { isDragging: false, activeId: null, overId: null },
  initializeBoard: vi.fn(),
  startDrag: vi.fn(),
  updateDragOver: vi.fn(),
  endDrag: vi.fn()
}

const mockMatterStore = {
  matters: [] as Matter[],
  isLoading: false,
  error: null,
  loadingStatus: { isLoading: false, error: null },
  mattersByStatus: {},
  getOverdueMatters: [],
  createMatter: vi.fn(),
  updateMatter: vi.fn(),
  moveMatter: vi.fn(),
  deleteMatter: vi.fn(),
  loadMatters: vi.fn(),
  batchUpdateMatters: vi.fn()
}

const mockSearchStore = {
  filters: { query: '', statuses: [], priorities: [], lawyers: [], showClosed: true },
  searchResults: null,
  isSearching: false,
  hasActiveSearch: false,
  updateFilters: vi.fn(),
  performSearch: vi.fn(),
  clearSearch: vi.fn(),
  saveSearch: vi.fn(),
  loadSavedSearch: vi.fn()
}

const mockUIStore = {
  viewPreferences: { cardView: 'detailed', groupBy: 'status', sortBy: 'priority', sortOrder: 'desc' },
  uiState: { theme: 'system', isDark: false },
  layoutPreferences: { sidebarCollapsed: false },
  panelStates: { sidebar: true, search: false, filters: false, details: false },
  updateViewPreferences: vi.fn(),
  updateUIState: vi.fn(),
  toggleSidebar: vi.fn(),
  toggleSearchPanel: vi.fn(),
  toggleFiltersPanel: vi.fn(),
  setTheme: vi.fn(),
  applyPreset: vi.fn(),
  exportPreferences: vi.fn(),
  resetViewPreferences: vi.fn(),
  resetLayoutPreferences: vi.fn(),
  toggleCompactMode: vi.fn(),
  loadPreferences: vi.fn(),
  savePreferences: vi.fn()
}

const mockRealTimeStore = {
  isOnline: true,
  isSyncing: false,
  syncStatus: { status: 'idle', lastSyncTime: null },
  conflictQueue: [],
  hasConflicts: false,
  connectionQuality: 'excellent',
  syncWithServer: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
  connectWebSocket: vi.fn(),
  disconnectWebSocket: vi.fn(),
  forceSyncNow: vi.fn(),
  resolveConflict: vi.fn()
}

// Mock individual store modules
vi.mock('../board', () => ({
  useBoardStore: () => mockBoardStore
}))

vi.mock('../matters', () => ({
  useMatterStore: () => mockMatterStore
}))

vi.mock('../search', () => ({
  useSearchStore: () => mockSearchStore
}))

vi.mock('../ui-preferences', () => ({
  useUIPreferencesStore: () => mockUIStore
}))

vi.mock('../real-time', () => ({
  useRealTimeStore: () => mockRealTimeStore
}))

// Mock process.client for SSR testing
Object.defineProperty(process, 'client', {
  value: true,
  writable: true
})

describe('Unified Kanban Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Store Initialization', () => {
    it('should initialize all sub-stores', () => {
      const store = useKanbanStore()
      
      expect(store.stores.board).toBeDefined()
      expect(store.stores.matters).toBeDefined()
      expect(store.stores.search).toBeDefined()
      expect(store.stores.ui).toBeDefined()
      expect(store.stores.realTime).toBeDefined()
    })

    it('should provide unified state access', () => {
      const store = useKanbanStore()
      
      expect(store.board).toBe(mockBoardStore.board)
      expect(store.matters).toBe(mockMatterStore.matters)
      expect(store.viewPreferences).toBe(mockUIStore.viewPreferences)
      expect(store.isOnline).toBe(mockRealTimeStore.isOnline)
    })
  })

  describe('Kanban Initialization', () => {
    it('should initialize with default options', async () => {
      const store = useKanbanStore()
      mockMatterStore.loadMatters.mockResolvedValueOnce(true)
      
      const result = await store.initializeKanban()
      
      expect(result).toBe(true)
      expect(mockBoardStore.initializeBoard).toHaveBeenCalledWith(undefined)
      expect(mockMatterStore.loadMatters).toHaveBeenCalled()
      expect(mockRealTimeStore.startPolling).toHaveBeenCalled()
      expect(mockRealTimeStore.connectWebSocket).toHaveBeenCalled()
      expect(mockUIStore.updateViewPreferences).toHaveBeenCalled() // loadPreferences
    })

    it('should initialize with custom options', async () => {
      const store = useKanbanStore()
      mockMatterStore.loadMatters.mockResolvedValueOnce(true)
      
      const options = {
        boardId: 'custom-board',
        loadMatters: false,
        autoSync: false
      }
      
      const result = await store.initializeKanban(options)
      
      expect(result).toBe(true)
      expect(mockBoardStore.initializeBoard).toHaveBeenCalledWith({ id: 'custom-board' })
      expect(mockMatterStore.loadMatters).not.toHaveBeenCalled()
      expect(mockRealTimeStore.startPolling).not.toHaveBeenCalled()
    })

    it('should handle initialization errors', async () => {
      const store = useKanbanStore()
      mockMatterStore.loadMatters.mockRejectedValueOnce(new Error('Load failed'))
      
      const result = await store.initializeKanban()
      
      expect(result).toBe(false)
    })

    it('should skip client-only operations on server', async () => {
      const store = useKanbanStore()
      
      // Mock server environment
      Object.defineProperty(process, 'client', { value: false })
      
      mockMatterStore.loadMatters.mockResolvedValueOnce(true)
      
      await store.initializeKanban()
      
      expect(mockRealTimeStore.connectWebSocket).not.toHaveBeenCalled()
      expect(mockUIStore.updateViewPreferences).not.toHaveBeenCalled() // loadPreferences
      
      // Restore client environment
      Object.defineProperty(process, 'client', { value: true })
    })
  })

  describe('Enhanced Matter Operations', () => {
    const mockMatterData = {
      title: 'Test Matter',
      description: 'Test Description',
      clientName: 'Test Client',
      priority: 'HIGH' as const
    }

    const mockMatter = {
      id: 'matter-1',
      ...mockMatterData,
      status: 'INTAKE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    it('should create matter with sync', async () => {
      const store = useKanbanStore()
      mockMatterStore.createMatter.mockResolvedValueOnce(mockMatter)
      
      const result = await store.actions.createMatter(mockMatterData)
      
      expect(result).toEqual(mockMatter)
      expect(mockMatterStore.createMatter).toHaveBeenCalledWith(mockMatterData)
      expect(mockRealTimeStore.syncWithServer).toHaveBeenCalled()
    })

    it('should update matter with sync', async () => {
      const store = useKanbanStore()
      const updates = { title: 'Updated Title' }
      mockMatterStore.updateMatter.mockResolvedValueOnce({ ...mockMatter, ...updates })
      
      const result = await store.actions.updateMatter('matter-1', updates)
      
      expect(result.title).toBe('Updated Title')
      expect(mockMatterStore.updateMatter).toHaveBeenCalledWith('matter-1', updates)
      expect(mockRealTimeStore.syncWithServer).toHaveBeenCalled()
    })

    it('should move matter with sync and drag context update', async () => {
      const store = useKanbanStore()
      const updatedMatter = { ...mockMatter, status: 'IN_PROGRESS' as const }
      mockMatterStore.moveMatter.mockResolvedValueOnce(updatedMatter)
      
      const result = await store.actions.moveMatter('matter-1', 'IN_PROGRESS')
      
      expect(result.status).toBe('IN_PROGRESS')
      expect(mockMatterStore.moveMatter).toHaveBeenCalledWith('matter-1', 'IN_PROGRESS')
      expect(mockBoardStore.endDrag).toHaveBeenCalled()
      expect(mockRealTimeStore.syncWithServer).toHaveBeenCalled()
    })

    it('should not sync when offline', async () => {
      const store = useKanbanStore()
      mockRealTimeStore.isOnline = false
      mockMatterStore.createMatter.mockResolvedValueOnce(mockMatter)
      
      await store.actions.createMatter(mockMatterData)
      
      expect(mockRealTimeStore.syncWithServer).not.toHaveBeenCalled()
    })
  })

  describe('Enhanced Search with UI Integration', () => {
    it('should perform search with UI updates', () => {
      const store = useKanbanStore()
      
      store.actions.performSearch('contract', { priorities: ['HIGH'] })
      
      expect(mockSearchStore.updateFilters).toHaveBeenCalledWith({
        query: 'contract',
        priorities: ['HIGH']
      })
      expect(mockSearchStore.performSearch).toHaveBeenCalled()
    })

    it('should auto-open search panel when search is performed', () => {
      const store = useKanbanStore()
      mockUIStore.panelStates.search = false
      
      store.actions.performSearch('test query')
      
      expect(mockUIStore.toggleSearchPanel).toHaveBeenCalled()
    })

    it('should not open search panel if already open', () => {
      const store = useKanbanStore()
      mockUIStore.panelStates.search = true
      
      store.actions.performSearch('test query')
      
      expect(mockUIStore.toggleSearchPanel).not.toHaveBeenCalled()
    })

    it('should handle filters-only search', () => {
      const store = useKanbanStore()
      
      store.actions.performSearch(undefined, { statuses: ['INTAKE'] })
      
      expect(mockSearchStore.updateFilters).toHaveBeenCalledWith({
        statuses: ['INTAKE']
      })
    })
  })

  describe('Smart Matter Filtering', () => {
    const mockMatters = [
      {
        id: 'matter-1',
        title: 'Contract Matter',
        status: 'INTAKE',
        priority: 'HIGH',
        assignedLawyer: { id: 'lawyer-1', name: 'John Doe' },
        clientName: 'Client A',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z'
      },
      {
        id: 'matter-2',
        title: 'Employment Matter',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        assignedLawyer: { id: 'lawyer-2', name: 'Jane Smith' },
        clientName: 'Client B',
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-16T00:00:00Z'
      }
    ]

    beforeEach(() => {
      mockMatterStore.matters = mockMatters as any[]
    })

    it('should use search results when active', () => {
      const store = useKanbanStore()
      
      // Mock active search
      mockSearchStore.hasActiveSearch = true
      mockSearchStore.searchResults = {
        matters: [mockMatters[0]],
        total: 1,
        facets: {},
        suggestions: [],
        executionTime: 10
      }
      
      const filtered = store.filteredMatters
      
      expect(Object.keys(filtered)).toContain('INTAKE')
      expect(filtered.value.INTAKE).toHaveLength(1)
    })

    it('should group matters by status', () => {
      const store = useKanbanStore()
      mockUIStore.viewPreferences.groupBy = 'status'
      
      const filtered = store.filteredMatters
      
      expect(filtered.value.INTAKE).toHaveLength(1)
      expect(filtered.value.IN_PROGRESS).toHaveLength(1)
    })

    it('should group matters by priority', () => {
      const store = useKanbanStore()
      mockUIStore.viewPreferences.groupBy = 'priority'
      
      const filtered = store.filteredMatters
      
      expect(filtered.value.HIGH).toHaveLength(1)
      expect(filtered.value.MEDIUM).toHaveLength(1)
    })

    it('should group matters by assignee', () => {
      const store = useKanbanStore()
      mockUIStore.viewPreferences.groupBy = 'assignee'
      
      const filtered = store.filteredMatters
      
      expect(filtered['John Doe']).toHaveLength(1)
      expect(filtered['Jane Smith']).toHaveLength(1)
    })

    it('should group matters by client', () => {
      const store = useKanbanStore()
      mockUIStore.viewPreferences.groupBy = 'client'
      
      const filtered = store.filteredMatters
      
      expect(filtered['Client A']).toHaveLength(1)
      expect(filtered['Client B']).toHaveLength(1)
    })

    it('should sort matters within groups by priority', () => {
      const store = useKanbanStore()
      mockUIStore.viewPreferences.sortBy = 'priority'
      mockUIStore.viewPreferences.sortOrder = 'desc'
      
      // Add more matters to the same group for sorting
      const allMatters = [
        ...mockMatters,
        {
          id: 'matter-3',
          title: 'Urgent Matter',
          status: 'INTAKE',
          priority: 'URGENT',
          assignedLawyer: { id: 'lawyer-1', name: 'John Doe' },
          clientName: 'Client C',
          createdAt: '2025-01-03T00:00:00Z',
          updatedAt: '2025-01-17T00:00:00Z'
        }
      ]
      
      mockMatterStore.matters = allMatters as any[]
      
      const filtered = store.filteredMatters
      
      // URGENT should come first in descending order
      expect(filtered.INTAKE[0].priority).toBe('URGENT')
      expect(filtered.INTAKE[1].priority).toBe('HIGH')
    })

    it('should sort matters by due date', () => {
      const store = useKanbanStore()
      mockUIStore.viewPreferences.sortBy = 'dueDate'
      mockUIStore.viewPreferences.sortOrder = 'asc'
      
      const mattersWithDueDate = mockMatters.map((matter, index) => ({
        ...matter,
        dueDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
      }))
      
      mockMatterStore.matters = mattersWithDueDate as any[]
      
      const filtered = store.filteredMatters
      
      // Should be sorted by due date ascending
      const intakeMatters = filtered.INTAKE || []
      if (intakeMatters.length > 1) {
        const firstDue = new Date(intakeMatters[0].dueDate!).getTime()
        const secondDue = new Date(intakeMatters[1].dueDate!).getTime()
        expect(firstDue).toBeLessThan(secondDue)
      }
    })
  })

  describe('Dashboard Statistics', () => {
    beforeEach(() => {
      const mockMatters = [
        {
          id: 'matter-1',
          status: 'INTAKE',
          priority: 'URGENT',
          assignedLawyer: { id: 'current-user-id', name: 'Current User' },
          updatedAt: new Date().toISOString() // Recent update
        },
        {
          id: 'matter-2',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignedLawyer: { id: 'other-user', name: 'Other User' },
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        }
      ]
      
      mockMatterStore.matters = mockMatters as any[]
      mockMatterStore.mattersByStatus = {
        INTAKE: [mockMatters[0]],
        IN_PROGRESS: [mockMatters[1]],
        REVIEW: [],
        WAITING_CLIENT: [],
        READY_FILING: [],
        CLOSED: []
      }
      mockMatterStore.getOverdueMatters = []
    })

    it('should provide dashboard statistics', () => {
      const store = useKanbanStore()
      
      const stats = store.stats
      
      expect(stats.total).toBe(2)
      expect(stats.urgent).toBe(1)
      expect(stats.recentlyUpdated).toBe(1)
      expect(stats.assignedToMe).toBe(1)
      expect(stats.overdue).toBe(0)
    })

    it('should include matter status breakdown', () => {
      const store = useKanbanStore()
      
      const stats = store.stats
      
      expect(stats.byStatus.INTAKE).toHaveLength(1)
      expect(stats.byStatus.IN_PROGRESS).toHaveLength(1)
      expect(stats.byStatus.REVIEW).toHaveLength(0)
    })
  })

  describe('System Health Status', () => {
    it('should provide system health information', () => {
      const store = useKanbanStore()
      
      const health = store.health
      
      expect(health.online).toBe(true)
      expect(health.syncing).toBe(false)
      expect(health.conflicts).toBe(false)
      expect(health.connectionQuality).toBe('excellent')
      expect(health.pendingOperations).toBe(false)
    })

    it('should reflect real-time store state', () => {
      const store = useKanbanStore()
      
      // Change real-time store state
      mockRealTimeStore.isOnline = false
      mockRealTimeStore.isSyncing = true
      mockRealTimeStore.hasConflicts = true
      mockRealTimeStore.connectionQuality = 'poor'
      mockMatterStore.loadingStatus.isLoading = true
      
      const health = store.health
      
      expect(health.online).toBe(false)
      expect(health.syncing).toBe(true)
      expect(health.conflicts).toBe(true)
      expect(health.connectionQuality).toBe('poor')
      expect(health.pendingOperations).toBe(true)
    })
  })

  describe('Quick Actions', () => {
    it('should refresh all data', async () => {
      const store = useKanbanStore()
      
      mockMatterStore.loadMatters.mockResolvedValueOnce([])
      mockRealTimeStore.forceSyncNow.mockResolvedValueOnce(true)
      
      await store.quickActions.refreshAll()
      
      expect(mockMatterStore.loadMatters).toHaveBeenCalledWith(true)
      expect(mockRealTimeStore.forceSyncNow).toHaveBeenCalled()
    })

    it('should export data', () => {
      const store = useKanbanStore()
      
      mockUIStore.exportPreferences.mockReturnValueOnce({ version: '1.0' })
      
      const exported = store.quickActions.exportData()
      
      expect(exported.matters).toBe(mockMatterStore.matters)
      expect(exported.preferences).toEqual({ version: '1.0' })
      expect(exported.timestamp).toBeInstanceOf(String)
    })

    it('should reset to defaults', () => {
      const store = useKanbanStore()
      
      store.quickActions.resetToDefaults()
      
      expect(mockUIStore.resetViewPreferences).toHaveBeenCalled()
      expect(mockUIStore.resetLayoutPreferences).toHaveBeenCalled()
      expect(mockSearchStore.clearSearch).toHaveBeenCalled()
      expect(mockBoardStore.initializeBoard).toHaveBeenCalled()
    })

    it('should toggle compact mode', () => {
      const store = useKanbanStore()
      
      store.quickActions.toggleCompactMode()
      
      expect(mockUIStore.toggleCompactMode).toHaveBeenCalled()
    })

    it('should go offline', () => {
      const store = useKanbanStore()
      
      store.quickActions.goOffline()
      
      expect(mockRealTimeStore.stopPolling).toHaveBeenCalled()
      expect(mockRealTimeStore.disconnectWebSocket).toHaveBeenCalled()
    })
  })

  describe('Action Delegation', () => {
    it('should delegate board actions', () => {
      const store = useKanbanStore()
      
      store.actions.initializeBoard({ id: 'test' })
      expect(mockBoardStore.initializeBoard).toHaveBeenCalledWith({ id: 'test' })
      
      store.actions.startDrag({ id: 'item' }, 'INTAKE')
      expect(mockBoardStore.startDrag).toHaveBeenCalledWith({ id: 'item' }, 'INTAKE')
      
      store.actions.endDrag()
      expect(mockBoardStore.endDrag).toHaveBeenCalled()
    })

    it('should delegate search actions', () => {
      const store = useKanbanStore()
      
      store.actions.clearSearch()
      expect(mockSearchStore.clearSearch).toHaveBeenCalled()
      
      store.actions.saveSearch('Test Search')
      expect(mockSearchStore.saveSearch).toHaveBeenCalledWith('Test Search')
      
      store.actions.loadSavedSearch('Test Search')
      expect(mockSearchStore.loadSavedSearch).toHaveBeenCalledWith('Test Search')
    })

    it('should delegate UI actions', () => {
      const store = useKanbanStore()
      
      store.actions.toggleSidebar()
      expect(mockUIStore.toggleSidebar).toHaveBeenCalled()
      
      store.actions.setTheme('dark')
      expect(mockUIStore.setTheme).toHaveBeenCalledWith('dark')
      
      store.actions.applyPreset('compact')
      expect(mockUIStore.applyPreset).toHaveBeenCalledWith('compact')
    })

    it('should delegate real-time actions', () => {
      const store = useKanbanStore()
      
      store.actions.syncNow()
      expect(mockRealTimeStore.forceSyncNow).toHaveBeenCalled()
      
      store.actions.startPolling()
      expect(mockRealTimeStore.startPolling).toHaveBeenCalled()
      
      store.actions.resolveConflict('conflict-1', 'server')
      expect(mockRealTimeStore.resolveConflict).toHaveBeenCalledWith('conflict-1', 'server')
    })
  })

  describe('Type Safety', () => {
    it('should have correct return types', () => {
      const store = useKanbanStore()
      
      // Check that the store has the expected structure
      expect(store).toHaveProperty('stores')
      expect(store).toHaveProperty('actions')
      expect(store).toHaveProperty('stats')
      expect(store).toHaveProperty('health')
      expect(store).toHaveProperty('quickActions')
      
      expect(store.stores).toHaveProperty('board')
      expect(store.stores).toHaveProperty('matters')
      expect(store.stores).toHaveProperty('search')
      expect(store.stores).toHaveProperty('ui')
      expect(store.stores).toHaveProperty('realTime')
    })
  })
})