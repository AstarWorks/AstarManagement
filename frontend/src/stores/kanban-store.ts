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
  MatterStatus,
  MatterPriority,
  BoardError,
  BoardMetrics
} from '@/components/kanban/types'
import { DEFAULT_COLUMNS, DEFAULT_VIEW_PREFERENCES, DEFAULT_FILTERS, DEFAULT_SORTING } from '@/components/kanban/constants'

// API simulation delay for realistic UX
const API_DELAY = 300

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
  
  // Actions
  // Board operations
  initializeBoard: (matters?: MatterCard[]) => void
  refreshBoard: () => Promise<void>
  
  // Matter operations
  addMatter: (matter: Omit<MatterCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateMatter: (matterId: string, updates: Partial<MatterCard>) => Promise<void>
  deleteMatter: (matterId: string) => Promise<void>
  moveMatter: (matterId: string, newStatus: MatterStatus, newColumnId: string) => Promise<void>
  
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
  
  // Error handling
  setError: (error: BoardError | null) => void
  clearError: () => void
  
  // Utility getters
  getFilteredMatters: () => MatterCard[]
  getBoardMetrics: () => BoardMetrics
  getMattersByColumn: () => Record<string, MatterCard[]>
}

// Mock API functions (replace with real API calls)
const mockAPI = {
  async fetchMatters(): Promise<MatterCard[]> {
    await new Promise(resolve => setTimeout(resolve, API_DELAY))
    // Return empty array - will be populated by demo data
    return []
  },
  
  async createMatter(matter: Omit<MatterCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<MatterCard> {
    await new Promise(resolve => setTimeout(resolve, API_DELAY))
    const now = new Date().toISOString()
    return {
      ...matter,
      id: `matter-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }
  },
  
  async updateMatter(): Promise<MatterCard> {
    await new Promise(resolve => setTimeout(resolve, API_DELAY))
    // Return updated matter - in real implementation, fetch from server
    throw new Error('Matter not found')
  },
  
  async deleteMatter(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, API_DELAY))
    // Delete matter on server
  },
  
  async moveMatter(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, API_DELAY))
    // Update matter status on server
  }
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
            const matters = await mockAPI.fetchMatters()
            
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
            set((state) => {
              state.error = {
                type: 'network',
                message: 'Failed to refresh board data',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                action: 'Try refreshing the page'
              }
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
            const newMatter = await mockAPI.createMatter(matterData)
            
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
            set((state) => {
              state.error = {
                type: 'server',
                message: 'Failed to create matter',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                action: 'Please try again'
              }
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
            await mockAPI.updateMatter()
            
            set((state) => {
              state.lastRefresh = new Date()
            })
          } catch (error) {
            // Rollback optimistic update
            set((state) => {
              const matterIndex = state.matters.findIndex(m => m.id === matterId)
              if (matterIndex !== -1) {
                state.matters[matterIndex] = originalMatter
              }
              state.error = {
                type: 'server',
                message: 'Failed to update matter',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                action: 'Changes have been reverted'
              }
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
            await mockAPI.deleteMatter()
            
            set((state) => {
              state.lastRefresh = new Date()
            })
          } catch (error) {
            // Rollback optimistic delete
            set((state) => {
              state.matters = originalMatters
              state.error = {
                type: 'server',
                message: 'Failed to delete matter',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                action: 'Matter has been restored'
              }
            })
            throw error
          }
        },

        moveMatter: async (matterId, newStatus) => {
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
            await mockAPI.moveMatter()
            
            set((state) => {
              state.lastRefresh = new Date()
            })
          } catch (error) {
            // Rollback optimistic move
            set((state) => {
              const matterIndex = state.matters.findIndex(m => m.id === matterId)
              if (matterIndex !== -1) {
                state.matters[matterIndex] = originalMatter
              }
              state.error = {
                type: 'server',
                message: 'Failed to move matter',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                action: 'Matter has been moved back'
              }
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
          const { matters, filters, sorting } = get()
          let filtered = [...matters]

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
        }
      }))
    ),
    {
      name: 'kanban-store',
      // Only persist view preferences
      partialize: (state) => ({
        viewPreferences: state.viewPreferences
      })
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
  clearError: state.clearError
}))