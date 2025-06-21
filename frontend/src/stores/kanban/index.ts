/**
 * Kanban Stores Module - Main export file
 * 
 * Provides a unified interface for all kanban-related stores and utilities.
 * This module exports all store hooks, utilities, and types for easy consumption.
 */

// Store exports
export * from './kanban-board-store'
export * from './matter-data-store'
export * from './search-store'
export * from './ui-preferences-store'
export * from './real-time-store'

// Utility exports
export * from './kanban-ssr-utils'
export * from './kanban-demo-data'

// Re-export types from the main types file
export type {
    MatterCard,
    KanbanBoard,
    FilterOptions,
    SortOptions,
    ViewPreferences,
    BoardMetrics,
    MatterStatus,
    MatterPriority
} from '@/components/kanban/types'

// Unified store interface for advanced usage
import { useKanbanBoardStore } from './kanban-board-store'
import { useMatterDataStore } from './matter-data-store'
import { useSearchStore } from './search-store'
import { useUIPreferencesStore } from './ui-preferences-store'
import { useRealTimeStore } from './real-time-store'

/**
 * Combined store interface for applications that need access to all stores
 * This is useful for complex operations that span multiple store domains
 */
export interface KanbanStoresInterface {
    board: typeof useKanbanBoardStore
    matterData: typeof useMatterDataStore
    search: typeof useSearchStore
    uiPreferences: typeof useUIPreferencesStore
    realTime: typeof useRealTimeStore
}

/**
 * Access all kanban stores through a single interface
 * Useful for testing, debugging, or complex operations
 */
export const useKanbanStores = (): KanbanStoresInterface => ({
    board: useKanbanBoardStore,
    matterData: useMatterDataStore,
    search: useSearchStore,
    uiPreferences: useUIPreferencesStore,
    realTime: useRealTimeStore
})

/**
 * Combined state selector for getting all store states at once
 * Use sparingly as it will cause re-renders when any store updates
 */
export const useAllKanbanStates = () => ({
    board: useKanbanBoardStore.getState(),
    matterData: useMatterDataStore.getState(),
    search: useSearchStore.getState(),
    uiPreferences: useUIPreferencesStore.getState(),
    realTime: useRealTimeStore.getState()
})

/**
 * Combined actions selector for getting all store actions at once
 * Useful for components that need to perform operations across multiple stores
 */
export const useAllKanbanActions = () => ({
    board: {
        initializeBoard: useKanbanBoardStore.getState().initializeBoard,
        setDragContext: useKanbanBoardStore.getState().setDragContext,
        updateBoard: useKanbanBoardStore.getState().updateBoard,
        getBoardId: useKanbanBoardStore.getState().getBoardId
    },
    matterData: {
        fetchMatters: useMatterDataStore.getState().fetchMatters,
        addMatter: useMatterDataStore.getState().addMatter,
        updateMatter: useMatterDataStore.getState().updateMatter,
        deleteMatter: useMatterDataStore.getState().deleteMatter,
        moveMatter: useMatterDataStore.getState().moveMatter,
        setFilters: useMatterDataStore.getState().setFilters,
        setSorting: useMatterDataStore.getState().setSorting
    },
    search: {
        performSearch: useSearchStore.getState().performSearch,
        clearSearch: useSearchStore.getState().clearSearch,
        getSuggestions: useSearchStore.getState().getSuggestions
    },
    uiPreferences: {
        updateViewPreferences: useUIPreferencesStore.getState().updateViewPreferences,
        setTheme: useUIPreferencesStore.getState().setTheme,
        toggleSidebar: useUIPreferencesStore.getState().toggleSidebar
    },
    realTime: {
        startPolling: useRealTimeStore.getState().startPolling,
        stopPolling: useRealTimeStore.getState().stopPolling,
        performSync: useRealTimeStore.getState().performSync
    }
})

/**
 * Initialize all kanban stores with default or provided data
 * Useful for application startup or testing scenarios
 */
export const initializeKanbanStores = (options?: {
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

    // Initialize board store
    useKanbanBoardStore.getState().initializeBoard(
        demoData ? kanbanDemoData.data.matters : []
    )

    // Load demo data if requested
    if (demoData) {
        const matters = kanbanDemoData.data.matters
        useMatterDataStore.setState({ matters })
        useUIPreferencesStore.getState().updateBoardMetrics(kanbanDemoData.data.metrics)
    }

    // Start real-time features if enabled
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

/**
 * Reset all kanban stores to their initial state
 * Useful for testing or when switching between different contexts
 */
export const resetKanbanStores = () => {
    // Reset board store
    useKanbanBoardStore.setState({
        board: null,
        dragContext: {
            activeId: null,
            overId: null,
            isDragging: false
        }
    })

    // Reset matter data store
    useMatterDataStore.setState({
        matters: [],
        isLoading: false,
        error: null,
        lastRefresh: new Date(),
        filters: DEFAULT_FILTERS,
        sorting: DEFAULT_SORTING
    })

    // Reset search store
    useSearchStore.getState().clearSearch()

    // Reset UI preferences to defaults
    useUIPreferencesStore.getState().resetViewPreferences()

    // Stop real-time features
    useRealTimeStore.getState().stopPolling()
    useRealTimeStore.getState().clearOfflineQueue()
}

// Import utilities for re-export
import { kanbanSSRUtils } from './kanban-ssr-utils'
import { kanbanDemoData } from './kanban-demo-data'
import { DEFAULT_FILTERS, DEFAULT_SORTING } from '@/components/kanban/constants'

// Export utilities for convenience
export { kanbanSSRUtils, kanbanDemoData }

/**
 * Development utilities for debugging and testing
 */
export const devUtils = {
    /**
     * Get current state of all stores for debugging
     */
    getDebugInfo: () => ({
        board: useKanbanBoardStore.getState(),
        matterData: useMatterDataStore.getState(),
        search: useSearchStore.getState(),
        uiPreferences: useUIPreferencesStore.getState(),
        realTime: useRealTimeStore.getState(),
        timestamp: new Date().toISOString()
    }),

    /**
     * Load demo data into stores
     */
    loadDemoData: () => {
        const matters = kanbanDemoData.data.matters
        useMatterDataStore.setState({ matters })
        useKanbanBoardStore.getState().initializeBoard(matters)
        useUIPreferencesStore.getState().updateBoardMetrics(kanbanDemoData.data.metrics)
    },

    /**
     * Generate and load random data for testing
     */
    loadRandomData: (count: number = 10) => {
        const matters = kanbanDemoData.generators.generateRandomMatters(count)
        useMatterDataStore.setState({ matters })
        useKanbanBoardStore.getState().initializeBoard(matters)
    },

    /**
     * Simulate real-time updates for testing
     */
    simulateRealTimeUpdate: () => {
        const store = useMatterDataStore.getState()
        if (store.matters.length > 0) {
            const randomMatter = store.matters[Math.floor(Math.random() * store.matters.length)]
            store.updateMatter(randomMatter.id, {
                updatedAt: new Date().toISOString(),
                notes: `Updated at ${new Date().toLocaleTimeString()}`
            })
        }
    }
}

// Default export
export default {
    stores: useKanbanStores,
    actions: useAllKanbanActions,
    states: useAllKanbanStates,
    initialize: initializeKanbanStores,
    reset: resetKanbanStores,
    utils: {
        ssr: kanbanSSRUtils,
        demo: kanbanDemoData,
        dev: devUtils
    }
}