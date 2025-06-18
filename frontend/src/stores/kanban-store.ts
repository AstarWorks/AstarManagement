/**
 * Zustand store for Kanban board state management
 * 
 * Provides comprehensive state management for the Kanban board including:
 * - Matter CRUD operations with optimistic updates
 * - Filter and sorting state
 * - View preferences with persistence
 * - Real-time updates and auto-refresh
 * - Error handling and loading states
 */

import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  MatterCard,
  KanbanBoard,
  FilterOptions,
  SortOptions,
  ViewPreferences,
  BoardMetrics
} from '@/components/kanban/types'
import { DEFAULT_COLUMNS, DEFAULT_VIEW_PREFERENCES, DEFAULT_FILTERS, DEFAULT_SORTING } from '@/components/kanban/constants'
import { 
  getMatters, 
  createMatter, 
  updateMatter, 
  deleteMatter, 
  updateMatterStatus,
  type MatterDto,
  type CreateMatterRequest,
  MatterStatus,
  MatterPriority 
} from '@/services/api/matter.service'
import { 
  searchMatters, 
  getSearchSuggestions, 
  extractSearchTerms,
  type MatterSearchResult, 
  type SearchSuggestion, 
  type SearchType 
} from '@/services/api/search.service'
import { searchAnalytics } from '@/services/analytics/search-analytics.service'
import { handleApiError, type BoardError } from '@/services/error/error.handler'


// DTO to UI model conversion functions
function convertSearchResultToCard(result: MatterSearchResult): MatterCard {
  return {
    id: result.id,
    caseNumber: result.caseNumber,
    title: result.title,
    description: '',
    clientName: result.clientName,
    clientContact: '',
    opposingParty: '',
    courtName: '',
    status: result.status as MatterStatus,
    priority: result.priority as MatterPriority,
    filingDate: result.filingDate || '',
    estimatedCompletionDate: '',
    assignedLawyerId: '',
    assignedLawyerName: result.assignedLawyerName || '',
    assignedClerkId: '',
    assignedClerkName: '',
    notes: '',
    tags: [],
    isActive: true,
    isOverdue: false,
    isCompleted: false,
    ageInDays: null,
    createdAt: result.createdAt,
    updatedAt: result.createdAt,
    createdBy: '',
    updatedBy: '',
    searchHighlights: result.highlights,
    relevanceScore: result.relevanceScore
  }
}

function convertMatterDtoToCard(dto: MatterDto): MatterCard {
  return {
    id: dto.id,
    caseNumber: dto.caseNumber,
    title: dto.title,
    description: dto.description || '',
    clientName: dto.clientName,
    clientContact: dto.clientContact || '',
    opposingParty: dto.opposingParty || '',
    courtName: dto.courtName || '',
    status: dto.status,
    priority: dto.priority,
    filingDate: dto.filingDate || '',
    estimatedCompletionDate: dto.estimatedCompletionDate || '',
    assignedLawyerId: dto.assignedLawyerId || '',
    assignedLawyerName: dto.assignedLawyerName || '',
    assignedClerkId: dto.assignedClerkId || '',
    assignedClerkName: dto.assignedClerkName || '',
    notes: dto.notes || '',
    tags: dto.tags || [],
    isActive: dto.isActive,
    isOverdue: dto.isOverdue,
    isCompleted: dto.isCompleted,
    ageInDays: dto.ageInDays,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    createdBy: dto.createdBy,
    updatedBy: dto.updatedBy
  }
}

function convertMatterCardToCreateRequest(matter: Omit<MatterCard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isActive' | 'isOverdue' | 'isCompleted' | 'ageInDays'>): CreateMatterRequest {
  return {
    caseNumber: matter.caseNumber,
    title: matter.title,
    description: matter.description || undefined,
    status: matter.status as MatterStatus,
    priority: matter.priority as MatterPriority,
    clientName: matter.clientName,
    clientContact: matter.clientContact || undefined,
    opposingParty: matter.opposingParty || undefined,
    courtName: matter.courtName || undefined,
    filingDate: matter.filingDate || undefined,
    estimatedCompletionDate: matter.estimatedCompletionDate || undefined,
    assignedLawyerId: matter.assignedLawyerId,
    assignedClerkId: matter.assignedClerkId || undefined,
    notes: matter.notes || undefined,
    tags: matter.tags
  }
}

// Store state interface
interface KanbanStoreState {
  // Data state
  board: KanbanBoard | null
  matters: MatterCard[]
  
  // UI state
  isLoading: boolean
  error: BoardError | null
  lastRefresh: Date
  
  // Filter and sort state
  filters: FilterOptions
  sorting: SortOptions
  
  // View preferences (persisted)
  viewPreferences: ViewPreferences
  
  // Drag state
  dragContext: {
    activeId: string | null
    overId: string | null
    isDragging: boolean
  }
  
  // Auto-refresh state
  autoRefreshInterval: NodeJS.Timeout | null
  
  // Real-time polling state
  pollingEnabled: boolean
  lastSyncTime: Date | null
  
  // Search state for T02_S03
  searchResults: MatterCard[]
  searchSuggestions: SearchSuggestion[]
  isSearching: boolean
  searchMode: boolean  // true when showing search results instead of normal board
  lastSearchQuery: string
  searchHistory: string[]
  
  // Actions
  // Board operations
  initializeBoard: (matters?: MatterCard[]) => void
  refreshBoard: () => Promise<void>
  
  // Matter operations
  addMatter: (matter: Omit<MatterCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateMatter: (matterId: string, updates: Partial<MatterCard>) => Promise<void>
  deleteMatter: (matterId: string) => Promise<void>
  moveMatter: (matterId: string, newStatus: MatterStatus, newColumnId: string) => Promise<void>
  updateMatterStatus: (matterId: string, statusUpdate: { status: MatterStatus; reason: string }) => Promise<void>
  
  // Filter and sort operations
  setFilters: (filters: Partial<FilterOptions>) => void
  clearFilters: () => void
  setSorting: (sorting: SortOptions) => void
  
  // View preferences
  setViewPreferences: (preferences: Partial<ViewPreferences>) => void
  toggleColumn: (columnId: string) => void
  reorderColumns: (columnOrder: string[]) => void
  
  // Drag operations
  setDragContext: (context: Partial<KanbanStoreState['dragContext']>) => void
  
  // Auto-refresh
  startAutoRefresh: () => void
  stopAutoRefresh: () => void
  
  // Real-time polling operations
  setPollingEnabled: (enabled: boolean) => void
  setLastSyncTime: (time: Date) => void
  applyBulkUpdate: (matters: MatterCard[]) => void
  fetchMatters: () => Promise<MatterCard[]>
  
  // Error handling
  setError: (error: BoardError | null) => void
  clearError: () => void
  
  // Search operations for T02_S03
  performSearch: (query: string, searchType?: SearchType) => Promise<void>
  getSuggestions: (query: string) => Promise<void>
  clearSearch: () => void
  exitSearchMode: () => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  
  // Utility getters
  getFilteredMatters: () => MatterCard[]
  getBoardMetrics: () => BoardMetrics
  getMattersByColumn: () => Record<string, MatterCard[]>
  getSearchTerms: () => string[]
}

// Server state cache for SSR support
let serverSnapshotCache: KanbanStoreState | null = null
let serverSnapshotTimestamp: number = 0
const SERVER_SNAPSHOT_TTL = 1000 * 60 * 5 // 5 minutes

// SSR detection utility
const isServer = typeof window === 'undefined'

// Get server snapshot with caching
const getServerSnapshot = (): KanbanStoreState => {
  // Return cached snapshot if valid
  if (serverSnapshotCache && 
      Date.now() - serverSnapshotTimestamp < SERVER_SNAPSHOT_TTL) {
    return serverSnapshotCache
  }

  // Create minimal server state
  const serverState: KanbanStoreState = {
    // Data state
    board: null,
    matters: [],
    
    // UI state
    isLoading: false,
    error: null,
    lastRefresh: new Date(),
    
    // Filter and sort state
    filters: DEFAULT_FILTERS,
    sorting: DEFAULT_SORTING,
    
    // View preferences (from persisted storage if available)
    viewPreferences: DEFAULT_VIEW_PREFERENCES,
    
    // Drag state
    dragContext: {
      activeId: null,
      overId: null,
      isDragging: false
    },
    
    // Auto-refresh state
    autoRefreshInterval: null,
    
    // Real-time polling state
    pollingEnabled: false,
    lastSyncTime: null,
    
    // Search state
    searchResults: [],
    searchSuggestions: [],
    isSearching: false,
    searchMode: false,
    lastSearchQuery: '',
    searchHistory: [],
    
    // Stub all actions with no-ops for server
    initializeBoard: () => {},
    refreshBoard: async () => {},
    addMatter: async () => '',
    updateMatter: async () => {},
    deleteMatter: async () => {},
    moveMatter: async () => {},
    updateMatterStatus: async () => {},
    setFilters: () => {},
    clearFilters: () => {},
    setSorting: () => {},
    setViewPreferences: () => {},
    toggleColumn: () => {},
    reorderColumns: () => {},
    setDragContext: () => {},
    startAutoRefresh: () => {},
    stopAutoRefresh: () => {},
    setPollingEnabled: () => {},
    setLastSyncTime: () => {},
    applyBulkUpdate: () => {},
    fetchMatters: async () => [],
    setError: () => {},
    clearError: () => {},
    performSearch: async () => {},
    getSuggestions: async () => {},
    clearSearch: () => {},
    exitSearchMode: () => {},
    addToSearchHistory: () => {},
    clearSearchHistory: () => {},
    getFilteredMatters: () => [],
    getBoardMetrics: () => ({
      totalMatters: 0,
      mattersByStatus: {},
      mattersByPriority: {},
      averageTimeInStatus: {},
      overdueMatters: 0,
      mattersCompletedToday: 0,
      lastRefresh: new Date().toISOString()
    }),
    getMattersByColumn: () => ({}),
    getSearchTerms: () => []
  }

  // Cache the snapshot
  serverSnapshotCache = serverState
  serverSnapshotTimestamp = Date.now()
  
  return serverState
}

// Create the store
export const useKanbanStore = create<KanbanStoreState>()(
  persist(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        board: null,
        matters: [],
        isLoading: false,
        error: null,
        lastRefresh: new Date(),
        filters: DEFAULT_FILTERS,
        sorting: DEFAULT_SORTING,
        viewPreferences: DEFAULT_VIEW_PREFERENCES,
        dragContext: {
          activeId: null,
          overId: null,
          isDragging: false
        },
        autoRefreshInterval: null,
        pollingEnabled: true,
        lastSyncTime: null,
        
        // Search state initialization
        searchResults: [],
        searchSuggestions: [],
        isSearching: false,
        searchMode: false,
        lastSearchQuery: '',
        searchHistory: [],

        // Board operations
        initializeBoard: (matters = []) => set((state) => {
          state.board = {
            id: 'main-board',
            title: 'Aster Management - Legal Matters',
            columns: DEFAULT_COLUMNS,
            matters,
            lastUpdated: new Date().toISOString()
          }
          state.matters = matters
          state.lastRefresh = new Date()
          state.error = null
        }),

        refreshBoard: async () => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            // Fetch matters from real API with pagination
            const response = await getMatters({ page: 0, size: 100, sort: 'createdAt,desc' })
            const matters = response.content.map(convertMatterDtoToCard)
            
            set((state) => {
              state.matters = matters
              state.lastRefresh = new Date()
              if (state.board) {
                state.board.lastUpdated = new Date().toISOString()
                state.board.matters = matters
              }
              state.isLoading = false
            })
          } catch (error) {
            const boardError = handleApiError(error)
            set((state) => {
              state.error = boardError
              state.isLoading = false
            })
          }
        },

        // Matter operations
        addMatter: async (matterData) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            // Convert UI model to API request format
            const createRequest = convertMatterCardToCreateRequest(matterData)
            
            // Create matter via API
            const createdMatterDto = await createMatter(createRequest)
            const newMatter = convertMatterDtoToCard(createdMatterDto)
            
            set((state) => {
              state.matters.push(newMatter)
              if (state.board) {
                state.board.matters = state.matters
                state.board.lastUpdated = new Date().toISOString()
              }
              state.lastRefresh = new Date()
              state.isLoading = false
            })

            return newMatter.id
          } catch (error) {
            const boardError = handleApiError(error)
            set((state) => {
              state.error = boardError
              state.isLoading = false
            })
            throw error
          }
        },

        updateMatter: async (matterId, updates) => {
          // Optimistic update
          const originalMatter = get().matters.find(m => m.id === matterId)
          if (!originalMatter) return

          set((state) => {
            const matterIndex = state.matters.findIndex(m => m.id === matterId)
            if (matterIndex !== -1) {
              state.matters[matterIndex] = {
                ...state.matters[matterIndex],
                ...updates,
                updatedAt: new Date().toISOString()
              }
              if (state.board) {
                state.board.matters = state.matters
                state.board.lastUpdated = new Date().toISOString()
              }
            }
          })

          try {
            // Update via API (convert updates to API format)
            const updateRequest = {
              title: updates.title || originalMatter.title,
              description: updates.description,
              clientName: updates.clientName || originalMatter.clientName,
              clientContact: updates.clientContact,
              opposingParty: updates.opposingParty,
              courtName: updates.courtName,
              filingDate: updates.filingDate,
              estimatedCompletionDate: updates.estimatedCompletionDate,
              priority: updates.priority as MatterPriority,
              assignedLawyerId: updates.assignedLawyerId,
              assignedClerkId: updates.assignedClerkId,
              notes: updates.notes,
              tags: updates.tags
            }
            
            const updatedMatterDto = await updateMatter(matterId, updateRequest)
            const updatedMatter = convertMatterDtoToCard(updatedMatterDto)
            
            set((state) => {
              const index = state.matters.findIndex(m => m.id === matterId)
              if (index !== -1) {
                state.matters[index] = updatedMatter
              }
              if (state.board) {
                state.board.matters = state.matters
                state.board.lastUpdated = new Date().toISOString()
              }
              state.lastRefresh = new Date()
            })
          } catch (error) {
            // Rollback optimistic update
            set((state) => {
              const matterIndex = state.matters.findIndex(m => m.id === matterId)
              if (matterIndex !== -1) {
                state.matters[matterIndex] = originalMatter
              }
              state.error = handleApiError(error)
            })
            throw error
          }
        },

        deleteMatter: async (matterId) => {
          // Optimistic delete
          const originalMatters = get().matters
          
          set((state) => {
            state.matters = state.matters.filter(m => m.id !== matterId)
            if (state.board) {
              state.board.matters = state.matters
              state.board.lastUpdated = new Date().toISOString()
            }
          })

          try {
            // Delete via API
            await deleteMatter(matterId)
            
            set((state) => {
              state.lastRefresh = new Date()
            })
          } catch (error) {
            // Rollback optimistic delete
            set((state) => {
              state.matters = originalMatters
              state.error = handleApiError(error)
            })
            throw error
          }
        },

        moveMatter: async (matterId, newStatus, newColumnId) => {
          // Optimistic move
          const originalMatter = get().matters.find(m => m.id === matterId)
          if (!originalMatter) return

          set((state) => {
            const matterIndex = state.matters.findIndex(m => m.id === matterId)
            if (matterIndex !== -1) {
              state.matters[matterIndex] = {
                ...state.matters[matterIndex],
                status: newStatus,
                updatedAt: new Date().toISOString()
              }
              if (state.board) {
                state.board.matters = state.matters
                state.board.lastUpdated = new Date().toISOString()
              }
            }
          })

          try {
            // Update status via API
            const updatedMatterDto = await updateMatterStatus(matterId, {
              status: newStatus as MatterStatus,
              comment: `Moved to ${newColumnId}`
            })
            const updatedMatter = convertMatterDtoToCard(updatedMatterDto)
            
            set((state) => {
              const index = state.matters.findIndex(m => m.id === matterId)
              if (index !== -1) {
                state.matters[index] = updatedMatter
              }
              if (state.board) {
                state.board.matters = state.matters
                state.board.lastUpdated = new Date().toISOString()
              }
              state.lastRefresh = new Date()
            })
          } catch (error) {
            // Rollback optimistic move
            set((state) => {
              const matterIndex = state.matters.findIndex(m => m.id === matterId)
              if (matterIndex !== -1) {
                state.matters[matterIndex] = originalMatter
              }
              state.error = handleApiError(error)
            })
            throw error
          }
        },

        updateMatterStatus: async (matterId, statusUpdate) => {
          // Optimistic update
          const originalMatter = get().matters.find(m => m.id === matterId)
          if (!originalMatter) return

          set((state) => {
            const matterIndex = state.matters.findIndex(m => m.id === matterId)
            if (matterIndex !== -1) {
              state.matters[matterIndex] = {
                ...state.matters[matterIndex],
                status: statusUpdate.status,
                updatedAt: new Date().toISOString()
              }
              if (state.board) {
                state.board.matters = state.matters
                state.board.lastUpdated = new Date().toISOString()
              }
            }
          })

          try {
            // Update status via API with reason
            const updatedMatterDto = await updateMatterStatus(matterId, {
              status: statusUpdate.status as MatterStatus,
              reason: statusUpdate.reason,
              comment: statusUpdate.reason // For audit trail
            })
            const updatedMatter = convertMatterDtoToCard(updatedMatterDto)
            
            set((state) => {
              const index = state.matters.findIndex(m => m.id === matterId)
              if (index !== -1) {
                state.matters[index] = updatedMatter
              }
              if (state.board) {
                state.board.matters = state.matters
                state.board.lastUpdated = new Date().toISOString()
              }
              state.lastRefresh = new Date()
            })
          } catch (error) {
            // Rollback optimistic update
            set((state) => {
              const matterIndex = state.matters.findIndex(m => m.id === matterId)
              if (matterIndex !== -1) {
                state.matters[matterIndex] = originalMatter
              }
              state.error = handleApiError(error)
            })
            throw error
          }
        },

        // Filter and sort operations
        setFilters: (newFilters) => set((state) => {
          state.filters = { ...state.filters, ...newFilters }
        }),

        clearFilters: () => set((state) => {
          state.filters = DEFAULT_FILTERS
        }),

        setSorting: (newSorting) => set((state) => {
          state.sorting = newSorting
        }),

        // View preferences
        setViewPreferences: (newPreferences) => set((state) => {
          state.viewPreferences = { ...state.viewPreferences, ...newPreferences }
        }),

        toggleColumn: (columnId) => set((state) => {
          const isVisible = state.viewPreferences.columnsVisible.includes(columnId)
          if (isVisible) {
            state.viewPreferences.columnsVisible = state.viewPreferences.columnsVisible.filter(id => id !== columnId)
          } else {
            state.viewPreferences.columnsVisible.push(columnId)
          }
        }),

        reorderColumns: (columnOrder) => set((state) => {
          state.viewPreferences.columnOrder = columnOrder
        }),

        // Drag operations
        setDragContext: (context) => set((state) => {
          state.dragContext = { ...state.dragContext, ...context }
        }),

        // Auto-refresh
        startAutoRefresh: () => {
          const { autoRefreshInterval, viewPreferences } = get()
          
          if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval)
          }

          const interval = setInterval(() => {
            get().refreshBoard()
          }, viewPreferences.refreshInterval * 1000)

          set((state) => {
            state.autoRefreshInterval = interval
            state.viewPreferences.autoRefresh = true
          })
        },

        stopAutoRefresh: () => {
          const { autoRefreshInterval } = get()
          
          if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval)
          }

          set((state) => {
            state.autoRefreshInterval = null
            state.viewPreferences.autoRefresh = false
          })
        },

        // Error handling
        setError: (error) => set((state) => {
          state.error = error
        }),

        clearError: () => set((state) => {
          state.error = null
        }),

        // Utility getters
        getFilteredMatters: () => {
          const { matters, filters, sorting, searchMode, searchResults } = get()
          
          // If in search mode, use search results instead of all matters
          let filtered = searchMode ? [...searchResults] : [...matters]

          // Apply search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            filtered = filtered.filter(matter => 
              matter.title.toLowerCase().includes(searchLower) ||
              matter.caseNumber.toLowerCase().includes(searchLower) ||
              matter.clientName.toLowerCase().includes(searchLower)
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
        },

        getBoardMetrics: () => {
          const { matters } = get()
          
          const metrics: BoardMetrics = {
            totalMatters: matters.length,
            mattersByStatus: {} as Record<MatterStatus, number>,
            mattersByPriority: {} as Record<MatterPriority, number>,
            averageTimeInStatus: {} as Record<MatterStatus, number>,
            overdueMatters: matters.filter(m => m.isOverdue).length,
            mattersCompletedToday: matters.filter(m => {
              const today = new Date().toDateString()
              const matterDate = new Date(m.updatedAt).toDateString()
              return (m.status === 'SETTLEMENT' || m.status === 'CLOSED') && matterDate === today
            }).length,
            lastRefresh: get().lastRefresh.toISOString()
          }

          // Count by status
          matters.forEach(matter => {
            metrics.mattersByStatus[matter.status] = (metrics.mattersByStatus[matter.status] || 0) + 1
          })

          // Count by priority
          matters.forEach(matter => {
            metrics.mattersByPriority[matter.priority] = (metrics.mattersByPriority[matter.priority] || 0) + 1
          })

          // Calculate average time in status
          const statusGroups = matters.reduce((acc, matter) => {
            if (!acc[matter.status]) acc[matter.status] = []
            acc[matter.status].push(matter.statusDuration || 0)
            return acc
          }, {} as Record<MatterStatus, number[]>)

          Object.entries(statusGroups).forEach(([status, durations]) => {
            const avg = durations.reduce((sum, duration) => sum + duration, 0) / durations.length
            metrics.averageTimeInStatus[status as MatterStatus] = Math.round(avg)
          })

          return metrics
        },

        getMattersByColumn: () => {
          const filteredMatters = get().getFilteredMatters()
          const columns = get().board?.columns || DEFAULT_COLUMNS
          const groups: Record<string, MatterCard[]> = {}
          
          // Initialize all columns
          columns.forEach(column => {
            groups[column.id] = []
          })

          // Group filtered matters by their column
          filteredMatters.forEach(matter => {
            const column = columns.find(col => 
              col.status.includes(matter.status)
            )
            if (column) {
              groups[column.id].push(matter)
            }
          })

          return groups
        },

        // Search operations for T02_S03
        performSearch: async (query, searchType = 'FULL_TEXT') => {
          if (!query.trim()) {
            set((state) => {
              state.searchMode = false
              state.searchResults = []
              state.lastSearchQuery = ''
            })
            return
          }

          const startTime = Date.now()
          set((state) => {
            state.isSearching = true
            state.error = null
          })

          try {
            const results = await searchMatters({
              query: query.trim(),
              searchType,
              page: 0,
              size: 100
            })

            const responseTime = Date.now() - startTime
            const searchResultCards = results.content.map(convertSearchResultToCard)

            set((state) => {
              state.searchResults = searchResultCards
              state.searchMode = true
              state.lastSearchQuery = query
              state.isSearching = false
            })

            // Track search analytics
            searchAnalytics.trackSearchQuery({
              query: query.trim(),
              searchType,
              resultsCount: results.content.length,
              responseTime
            })

            // Add to search history
            get().addToSearchHistory(query)

          } catch (error) {
            const responseTime = Date.now() - startTime
            const boardError = handleApiError(error)
            
            // Track failed search
            searchAnalytics.trackSearchQuery({
              query: query.trim(),
              searchType,
              resultsCount: 0,
              responseTime
            })

            set((state) => {
              state.error = boardError
              state.isSearching = false
              state.searchMode = false
            })
          }
        },

        getSuggestions: async (query) => {
          if (query.length < 2) {
            set((state) => {
              state.searchSuggestions = []
            })
            return
          }

          try {
            const suggestions = await getSearchSuggestions({ query, limit: 10 })
            set((state) => {
              state.searchSuggestions = suggestions
            })
          } catch (error) {
            console.error('Failed to get search suggestions:', error)
            set((state) => {
              state.searchSuggestions = []
            })
          }
        },

        clearSearch: () => set((state) => {
          state.searchResults = []
          state.searchSuggestions = []
          state.lastSearchQuery = ''
        }),

        exitSearchMode: () => set((state) => {
          state.searchMode = false
          state.searchResults = []
          state.searchSuggestions = []
          state.lastSearchQuery = ''
        }),

        addToSearchHistory: (query) => set((state) => {
          const trimmed = query.trim()
          if (trimmed && !state.searchHistory.includes(trimmed)) {
            state.searchHistory = [trimmed, ...state.searchHistory.slice(0, 9)] // Keep last 10
          }
        }),

        clearSearchHistory: () => set((state) => {
          state.searchHistory = []
        }),

        getSearchTerms: () => {
          const { lastSearchQuery } = get()
          return extractSearchTerms(lastSearchQuery)
        },

        // Real-time polling operations
        setPollingEnabled: (enabled) => set((state) => {
          state.pollingEnabled = enabled
        }),

        setLastSyncTime: (time) => set((state) => {
          state.lastSyncTime = time
        }),

        applyBulkUpdate: (newMatters) => set((state) => {
          state.matters = newMatters
          if (state.board) {
            state.board.matters = newMatters
            state.board.lastUpdated = new Date().toISOString()
          }
          state.lastRefresh = new Date()
        }),

        fetchMatters: async () => {
          try {
            const response = await getMatters({ page: 0, size: 100, sort: 'updatedAt,desc' })
            return response.content.map(convertMatterDtoToCard)
          } catch (error) {
            console.error('Failed to fetch matters:', error)
            throw error
          }
        }
      }))
    ),
    {
      name: 'kanban-store',
      // Only persist view preferences
      partialize: (state) => ({
        viewPreferences: state.viewPreferences
      }),
      // Skip persistence on server
      skipHydration: isServer
    }
  )
)

// Selector hooks for optimized re-renders
export const useBoard = () => useKanbanStore((state) => state.board)
export const useMatters = () => useKanbanStore((state) => state.matters)
export const useFilteredMatters = () => useKanbanStore((state) => state.getFilteredMatters())
export const useMattersByColumn = () => useKanbanStore((state) => state.getMattersByColumn())
export const useFilters = () => useKanbanStore((state) => state.filters)
export const useSorting = () => useKanbanStore((state) => state.sorting)
export const useViewPreferences = () => useKanbanStore((state) => state.viewPreferences)
export const useDragContext = () => useKanbanStore((state) => state.dragContext)
export const useLoadingState = () => useKanbanStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
  lastRefresh: state.lastRefresh
}))
export const useBoardMetrics = () => useKanbanStore((state) => state.getBoardMetrics())

// Search-related selector hooks for T02_S03
export const useSearchState = () => useKanbanStore((state) => ({
  searchResults: state.searchResults,
  searchSuggestions: state.searchSuggestions,
  isSearching: state.isSearching,
  searchMode: state.searchMode,
  lastSearchQuery: state.lastSearchQuery,
  searchHistory: state.searchHistory
}))
export const useSearchResults = () => useKanbanStore((state) => state.searchResults)
export const useSearchSuggestions = () => useKanbanStore((state) => state.searchSuggestions)
export const useSearchMode = () => useKanbanStore((state) => state.searchMode)
export const useSearchTerms = () => useKanbanStore((state) => state.getSearchTerms())

// Actions hooks
export const useBoardActions = () => useKanbanStore((state) => ({
  initializeBoard: state.initializeBoard,
  refreshBoard: state.refreshBoard,
  addMatter: state.addMatter,
  updateMatter: state.updateMatter,
  deleteMatter: state.deleteMatter,
  moveMatter: state.moveMatter,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  setSorting: state.setSorting,
  setViewPreferences: state.setViewPreferences,
  toggleColumn: state.toggleColumn,
  reorderColumns: state.reorderColumns,
  setDragContext: state.setDragContext,
  startAutoRefresh: state.startAutoRefresh,
  stopAutoRefresh: state.stopAutoRefresh,
  setError: state.setError,
  clearError: state.clearError,
  setPollingEnabled: state.setPollingEnabled,
  setLastSyncTime: state.setLastSyncTime,
  applyBulkUpdate: state.applyBulkUpdate,
  fetchMatters: state.fetchMatters,
  
  // Search actions for T02_S03
  performSearch: state.performSearch,
  getSuggestions: state.getSuggestions,
  clearSearch: state.clearSearch,
  exitSearchMode: state.exitSearchMode,
  addToSearchHistory: state.addToSearchHistory,
  clearSearchHistory: state.clearSearchHistory
}))

// Export getServerSnapshot for SSR usage
export { getServerSnapshot }

// Optional: Clean up server cache periodically on client
if (!isServer) {
  setInterval(() => {
    serverSnapshotCache = null
  }, SERVER_SNAPSHOT_TTL)
}