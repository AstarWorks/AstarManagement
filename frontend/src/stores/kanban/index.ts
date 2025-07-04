import { computed } from 'vue'
import type { Matter } from '~/types/matter'
import { useBoardStore } from './board'
import { useMatterStore } from './matters'
import { useSearchStore } from './search'
import { useUIPreferencesStore } from './ui-preferences'
import { useRealTimeStore } from './real-time'

/**
 * Unified Kanban Store Composable
 * 
 * This composable provides a single interface to all Kanban-related stores,
 * combining their state and actions into a cohesive API. It follows the
 * composition pattern for better maintainability and type safety.
 */
export const useKanbanStore = () => {
  // Initialize all stores
  const boardStore = useBoardStore()
  const matterStore = useMatterStore()
  const searchStore = useSearchStore()
  const uiStore = useUIPreferencesStore()
  const realTimeStore = useRealTimeStore()

  // Combined initialization
  const initializeKanban = async (options?: {
    boardId?: string
    loadMatters?: boolean
    autoSync?: boolean
  }) => {
    const { boardId, loadMatters = true, autoSync = true } = options || {}
    
    try {
      // Initialize board
      boardStore.initializeBoard(boardId ? { id: boardId } : undefined)
      
      // Load matters if requested
      if (loadMatters) {
        await matterStore.loadMatters()
      }
      
      // Start real-time sync if requested
      if (autoSync && realTimeStore.isOnline) {
        realTimeStore.startPolling()
        if (process.client) {
          realTimeStore.connectWebSocket()
        }
      }
      
      // Load saved preferences
      if (process.client) {
        uiStore.loadPreferences()
      }
      
      return true
    } catch (error) {
      console.error('Failed to initialize Kanban:', error)
      return false
    }
  }

  // Enhanced matter operations with real-time sync
  const createMatterWithSync = async (matterData: Parameters<typeof matterStore.createMatter>[0]) => {
    const matter = await matterStore.createMatter(matterData)
    
    // Trigger sync if online
    if (realTimeStore.isOnline) {
      realTimeStore.syncWithServer()
    }
    
    return matter
  }

  const updateMatterWithSync = async (id: string, updates: Parameters<typeof matterStore.updateMatter>[1]) => {
    const matter = await matterStore.updateMatter(id, updates)
    
    // Trigger sync if online
    if (realTimeStore.isOnline) {
      realTimeStore.syncWithServer()
    }
    
    return matter
  }

  const moveMatterWithSync = async (matterId: string, newStatus: Parameters<typeof matterStore.moveMatter>[1]) => {
    const matter = await matterStore.moveMatter(matterId, newStatus)
    
    // Update drag context
    boardStore.endDrag()
    
    // Trigger sync if online
    if (realTimeStore.isOnline) {
      realTimeStore.syncWithServer()
    }
    
    return matter
  }

  // Enhanced search with UI integration
  const performSearchWithUI = (query?: string, filters?: Partial<Parameters<typeof searchStore.updateFilters>[0]>) => {
    if (query !== undefined) {
      searchStore.updateFilters({ query, ...filters })
    } else if (filters) {
      searchStore.updateFilters(filters)
    }
    
    searchStore.performSearch()
    
    // Auto-open search panel if not already open
    if (!uiStore.panelStates.search && (query || Object.keys(filters || {}).length > 0)) {
      uiStore.toggleSearchPanel()
    }
  }

  // Smart matter filtering based on UI preferences and search
  const getFilteredMatters = computed(() => {
    // Start with all matters
    let matters = matterStore.matters
    
    // Apply search results if active
    if (searchStore.hasActiveSearch && searchStore.searchResults) {
      matters = searchStore.searchResults.matters
    }
    
    // Apply UI preference filters
    const { viewPreferences } = uiStore
    
    // Group matters by the selected grouping (create mutable copy)
    const mutableMatters = [...matters]
    const grouped = mutableMatters.reduce((groups, matter) => {
      let groupKey: string
      
      switch (viewPreferences.groupBy) {
        case 'status':
          groupKey = matter.status
          break
        case 'priority':
          groupKey = matter.priority
          break
        case 'lawyer':
          groupKey = typeof matter.assignedLawyer === 'string' ? matter.assignedLawyer : matter.assignedLawyer?.name || 'Unassigned'
          break
        case 'none':
        default:
          groupKey = matter.status
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(matter)
      
      return groups
    }, {} as Record<string, Matter[]>)
    
    // Sort within each group
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a: Matter, b: Matter) => {
        const { sortBy, sortOrder } = viewPreferences
        let aValue: unknown, bValue: unknown
        
        switch (sortBy) {
          case 'priority':
            const priorityOrder: Record<string, number> = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
            aValue = priorityOrder[a.priority] || 0
            bValue = priorityOrder[b.priority] || 0
            break
          case 'dueDate':
            aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0
            bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0
            break
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
          case 'title':
            aValue = a.title.toLowerCase()
            bValue = b.title.toLowerCase()
            break
          default:
            aValue = a.priority
            bValue = b.priority
        }
        
        if (sortOrder === 'asc') {
          return (aValue as any) > (bValue as any) ? 1 : -1
        } else {
          return (aValue as any) < (bValue as any) ? 1 : -1
        }
      })
    })
    
    return grouped
  })

  // Dashboard statistics
  const getDashboardStats = computed(() => {
    const matters = matterStore.matters
    
    return {
      total: matters.length,
      byStatus: matterStore.mattersByStatus,
      overdue: matterStore.getOverdueMatters.length,
      urgent: matters.filter(m => m.priority === 'URGENT').length,
      recentlyUpdated: matters.filter(m => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return new Date(m.updatedAt) > dayAgo
      }).length,
      assignedToMe: matters.filter(m => {
        // TODO: Replace with actual current user check
        return typeof m.assignedLawyer === 'object' && m.assignedLawyer?.id === 'current-user-id'
      }).length
    }
  })

  // System health status
  const getSystemHealth = computed(() => {
    return {
      online: realTimeStore.isOnline,
      syncing: realTimeStore.isSyncing,
      lastSync: realTimeStore.lastSyncStatus,
      conflicts: realTimeStore.hasConflicts,
      connectionQuality: realTimeStore.connectionQuality,
      pendingOperations: matterStore.loadingStatus.isLoading
    }
  })

  // Quick actions
  const quickActions = {
    // Refresh everything
    refreshAll: async () => {
      await Promise.all([
        matterStore.loadMatters(true),
        realTimeStore.forceSyncNow()
      ])
    },
    
    // Export data
    exportData: () => {
      return {
        matters: matterStore.matters,
        preferences: uiStore.exportPreferences(),
        timestamp: new Date().toISOString()
      }
    },
    
    // Reset to defaults
    resetToDefaults: () => {
      uiStore.resetViewPreferences()
      uiStore.resetLayoutPreferences()
      searchStore.clearSearch()
      boardStore.initializeBoard()
    },
    
    // Toggle compact mode
    toggleCompactMode: () => {
      uiStore.toggleCompactMode()
    },
    
    // Emergency offline mode
    goOffline: () => {
      realTimeStore.stopPolling()
      realTimeStore.disconnectWebSocket()
    }
  }

  return {
    // Store instances (for direct access if needed)
    stores: {
      board: boardStore,
      matters: matterStore,
      search: searchStore,
      ui: uiStore,
      realTime: realTimeStore
    },

    // Initialization
    initializeKanban,

    // Board state
    board: boardStore.board,
    columns: boardStore.columns,
    dragContext: boardStore.dragContext,

    // Matter data
    matters: matterStore.matters,
    mattersByStatus: matterStore.mattersByStatus,
    filteredMatters: getFilteredMatters,
    isLoading: matterStore.loadingStatus,

    // Search state
    searchQuery: searchStore.filters,
    searchResults: searchStore.searchResults,
    isSearching: searchStore.isSearching,

    // UI state
    viewPreferences: uiStore.viewPreferences,
    uiState: uiStore.uiState,
    layoutPreferences: uiStore.layoutPreferences,
    panelStates: uiStore.panelStates,

    // Real-time state
    isOnline: realTimeStore.isOnline,
    syncStatus: realTimeStore.syncStatus,
    conflicts: realTimeStore.conflictQueue,

    // Enhanced actions
    actions: {
      // Board actions
      initializeBoard: boardStore.initializeBoard,
      startDrag: boardStore.startDrag,
      updateDragOver: boardStore.updateDragOver,
      endDrag: boardStore.endDrag,

      // Matter actions (with sync)
      createMatter: createMatterWithSync,
      updateMatter: updateMatterWithSync,
      moveMatter: moveMatterWithSync,
      deleteMatter: matterStore.deleteMatter,
      loadMatters: matterStore.loadMatters,
      batchUpdateMatters: matterStore.batchUpdateMatters,

      // Search actions
      performSearch: performSearchWithUI,
      clearSearch: searchStore.clearSearch,
      saveSearch: searchStore.saveSearch,
      loadSavedSearch: searchStore.loadSavedSearch,

      // UI actions
      updateViewPreferences: uiStore.updateViewPreferences,
      updateUIState: uiStore.updateUIState,
      toggleSidebar: uiStore.toggleSidebar,
      toggleSearchPanel: uiStore.toggleSearchPanel,
      toggleFiltersPanel: uiStore.toggleFiltersPanel,
      setTheme: uiStore.setTheme,
      applyPreset: uiStore.applyPreset,

      // Real-time actions
      syncNow: realTimeStore.forceSyncNow,
      startPolling: realTimeStore.startPolling,
      stopPolling: realTimeStore.stopPolling,
      resolveConflict: realTimeStore.resolveConflict
    },

    // Computed state
    stats: getDashboardStats,
    health: getSystemHealth,

    // Quick actions
    quickActions
  }
}

// Type exports for external use
export type KanbanStore = ReturnType<typeof useKanbanStore>
export type KanbanStoreActions = KanbanStore['actions']
export type KanbanStoreStats = KanbanStore['stats']
export type KanbanStoreHealth = KanbanStore['health']

// Re-export individual stores for direct access
export { useBoardStore } from './board'
export { useMatterStore } from './matters'
export { useSearchStore } from './search'
export { useUIPreferencesStore } from './ui-preferences'
export { useRealTimeStore } from './real-time'

// Re-export types
export type { DragContext } from './board'
export type { ConflictResolution } from './matters'
export type { SearchFilters, SearchResult } from './search'
export type { UIState, LayoutPreferences } from './ui-preferences'
export type { SyncStatus, ConflictEvent, NetworkStatus } from './real-time'