/**
 * Kanban Store - Backward Compatibility Layer
 * 
 * This file now serves as a backward compatibility layer that re-exports
 * functionality from the new modular store architecture. All existing
 * component imports will continue to work without any changes.
 * 
 * The actual implementation has been split into focused modules:
 * - kanban-board-store.ts: Board state and drag/drop
 * - matter-data-store.ts: CRUD operations and data management
 * - search-store.ts: Search functionality and analytics
 * - ui-preferences-store.ts: View preferences and persistence
 * - real-time-store.ts: Polling and sync features
 * 
 * @deprecated Consider importing from specific stores for better tree-shaking
 */

// Import stores for backward compatibility
import {
    useKanbanBoardStore,
    useBoard,
    useDragContext,
    useBoardActions as useBoardActionsFromBoardStore,
    getBoardServerSnapshot
} from './kanban/kanban-board-store'
import {
    useMatterDataStore,
    useMatters,
    useFilteredMatters,
    useMattersByColumn,
    useFilters,
    useSorting,
    useLoadingState as useMatterLoadingState,
    useMatterActions
} from './kanban/matter-data-store'
import {
    useSearchStore,
    useSearchQuery,
    useSearchResults,
    useSearchLoading,
    useSearchError,
    useSearchSuggestions,
    useSearchHistory,
    useSearchTerms,
    useSearchState,
    useSearchActions
} from './kanban/search-store'
import {
    useUIPreferencesStore,
    useViewPreferences,
    useBoardMetrics,
    useLayoutState,
    useDisplaySettings,
    useThemeSettings,
    useColumnSettings,
    useUIPreferencesActions
} from './kanban/ui-preferences-store'
import {
    useRealTimeStore,
    useSyncStatus,
    useConnectionStatus,
    usePollingStatus,
    useAutoRefreshStatus,
    useOfflineQueue,
    useRealTimeActions
} from './kanban/real-time-store'

// Re-export all functionality from modular stores (excluding conflicting exports)
export { 
    useMatterDataStore,
    useMatters,
    useFilteredMatters,
    useMattersByColumn,
    useFilters,
    useSorting,
    useLoadingState as useMatterLoadingState,
    useMatterActions,
    getMatterDataServerSnapshot
} from './kanban/matter-data-store'
export * from './kanban/search-store'
export * from './kanban/ui-preferences-store'
export * from './kanban/real-time-store'

// Re-export utilities and demo data
export * from './kanban/kanban-ssr-utils'
export * from './kanban/kanban-demo-data'

// Backward compatibility: Combined loading state hook
function useLoadingState() {
    const matterLoading = useMatterLoadingState()
    const searchLoading = useSearchLoading()
    const syncStatus = useSyncStatus()
    
    return {
        // Matter data loading state
        isLoading: matterLoading.isLoading,
        error: matterLoading.error,
        lastRefresh: matterLoading.lastRefresh,
        
        // Search loading state
        isSearching: searchLoading.isSearching,
        isFetchingSuggestions: searchLoading.isFetchingSuggestions,
        
        // Sync loading state
        syncInProgress: syncStatus.syncInProgress,
        isOnline: syncStatus.isOnline,
        lastSyncTime: syncStatus.lastSyncTime
    }
}

// Backward compatibility: Combined board actions
function useBoardActions() {
    const boardActions = useBoardActionsFromBoardStore()
    const matterActions = useMatterActions()
    const searchActions = useSearchActions()
    const uiActions = useUIPreferencesActions()
    const realTimeActions = useRealTimeActions()
    
    return {
        // Board actions
        ...boardActions,
        
        // Matter actions
        ...matterActions,
        
        // Search actions (includes performSearch, getSuggestions, exitSearchMode)
        ...searchActions,
        
        // UI actions
        ...uiActions,
        
        // Real-time actions
        ...realTimeActions,
        
        // Additional combined actions for backward compatibility
        refreshBoard: async () => {
            const matterDataStore = useMatterDataStore.getState()
            return matterDataStore.fetchMatters()
        }
    }
}

// Export the hooks
export { useLoadingState, useBoardActions }

// Backward compatibility: Legacy combined store interface
// This maintains the original store interface for components that used the monolithic store
export const useKanbanStore = () => {
    // Get individual store states
    const boardState = useKanbanBoardStore()
    const matterDataState = useMatterDataStore()
    const searchState = useSearchStore()
    const uiPreferencesState = useUIPreferencesStore()
    const realTimeState = useRealTimeStore()
    
    // Return combined state and actions for backward compatibility
    return {
        // Combined state
        ...boardState,
        ...matterDataState,
        ...searchState,
        ...uiPreferencesState,
        ...realTimeState,
        
        // Legacy computed properties for backward compatibility
        get currentBoard() {
            return boardState.board
        },
        
        get currentMatters() {
            return matterDataState.matters
        },
        
        get filteredMatters() {
            return matterDataState.getFilteredMatters()
        },
        
        get mattersByColumn() {
            return matterDataState.getMattersByColumn()
        },
        
        get searchResults() {
            return searchState.searchResults
        },
        
        get isSearchActive() {
            return searchState.searchQuery.length > 0
        }
    }
}

// Re-export board state hooks (from kanban-board-store) that weren't exported above
export {
    useKanbanBoardStore,
    useBoard,
    useDragContext,
    getBoardServerSnapshot
}

// Legacy server snapshot for SSR compatibility
// This maintains the original server snapshot interface
export const getServerSnapshot = () => {
    const boardSnapshot = useKanbanBoardStore.getState()
    const matterDataSnapshot = useMatterDataStore.getState()
    const searchSnapshot = useSearchStore.getState()
    const uiPreferencesSnapshot = useUIPreferencesStore.getState()
    const realTimeSnapshot = useRealTimeStore.getState()
    
    return {
        ...boardSnapshot,
        ...matterDataSnapshot,
        ...searchSnapshot,
        ...uiPreferencesSnapshot,
        ...realTimeSnapshot
    }
}

// Legacy initialization function
export const initializeKanbanStore = (options?: {
    boardId?: string
    userId?: string
    enableRealTime?: boolean
    demoData?: boolean
}) => {
    const {
        boardId = 'main-board',
        userId = 'default-user',
        enableRealTime = true,
        demoData = false
    } = options || {}

    // Initialize individual stores
    useKanbanBoardStore.getState().initializeBoard()
    
    if (demoData) {
        // Load demo data if requested
        const { kanbanDemoData } = require('./kanban/kanban-demo-data')
        const matters = kanbanDemoData.data.matters
        useMatterDataStore.setState({ matters })
        useUIPreferencesStore.getState().updateBoardMetrics(kanbanDemoData.data.metrics)
    }

    if (enableRealTime) {
        useRealTimeStore.getState().enableAutoRefresh()
    }

    return {
        boardId,
        userId,
        initialized: true,
        demoData,
        realTimeEnabled: enableRealTime
    }
}

// Export type for backward compatibility
export type KanbanStoreState = ReturnType<typeof useKanbanStore>

// Export commonly used selector hooks for backward compatibility
export const useKanbanSelector = <T>(selector: (state: KanbanStoreState) => T): T => {
    const state = useKanbanStore()
    return selector(state)
}

// Default export for backward compatibility
export default useKanbanStore