/**
 * UI Preferences Store - View preferences and persistence
 * 
 * Handles view preferences, layout settings, and persistent user preferences
 * Separated from main kanban store for better modularity and testing
 */

import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
    ViewPreferences,
    BoardMetrics
} from '@/components/kanban/types'
import {
    DEFAULT_VIEW_PREFERENCES
} from '@/components/kanban/constants'

// UI preferences state interface
interface UIPreferencesState {
    // View preferences
    viewPreferences: ViewPreferences
    
    // Board metrics and analytics
    boardMetrics: BoardMetrics
    
    // Layout state
    sidebarCollapsed: boolean
    filtersPanelOpen: boolean
    detailsPanelOpen: boolean
    
    // Display options
    compactMode: boolean
    showCardDetails: boolean
    showAssignees: boolean
    showDueDates: boolean
    
    // Theme and appearance
    theme: 'light' | 'dark' | 'system'
    density: 'comfortable' | 'compact' | 'spacious'
    
    // Column display
    visibleColumns: string[]
    columnWidths: Record<string, number>
    
    // Actions
    updateViewPreferences: (preferences: Partial<ViewPreferences>) => void
    resetViewPreferences: () => void
    
    // Layout actions
    toggleSidebar: () => void
    toggleFiltersPanel: () => void
    toggleDetailsPanel: () => void
    setSidebarCollapsed: (collapsed: boolean) => void
    setFiltersPanelOpen: (open: boolean) => void
    setDetailsPanelOpen: (open: boolean) => void
    
    // Display actions
    setCompactMode: (compact: boolean) => void
    toggleCardDetails: () => void
    toggleAssignees: () => void
    toggleDueDates: () => void
    
    // Theme actions
    setTheme: (theme: 'light' | 'dark' | 'system') => void
    setDensity: (density: 'comfortable' | 'compact' | 'spacious') => void
    
    // Column actions
    setVisibleColumns: (columns: string[]) => void
    setColumnWidth: (columnId: string, width: number) => void
    resetColumnWidths: () => void
    
    // Metrics actions
    updateBoardMetrics: (metrics: Partial<BoardMetrics>) => void
    
    // Export/Import preferences
    exportPreferences: () => string
    importPreferences: (preferences: string) => void
}

// Default column widths
const DEFAULT_COLUMN_WIDTHS = {
    'DRAFT': 320,
    'IN_PROGRESS': 320,
    'UNDER_REVIEW': 320,
    'AWAITING_CLIENT': 320,
    'COMPLETED': 320,
    'ON_HOLD': 320,
    'CLOSED': 320
}

// Default board metrics
const DEFAULT_BOARD_METRICS: BoardMetrics = {
    totalMatters: 0,
    activeMatters: 0,
    completedMatters: 0,
    overdueMatters: 0,
    averageCompletionTime: 0,
    matterstByStatus: {},
    mattersByPriority: {},
    mattersByAssigned: {},
    recentActivity: []
}

// Create the UI preferences store with persistence
export const useUIPreferencesStore = create<UIPreferencesState>()(
    persist(
        subscribeWithSelector(
            immer((set, get) => ({
                // Initial state
                viewPreferences: DEFAULT_VIEW_PREFERENCES,
                boardMetrics: DEFAULT_BOARD_METRICS,
                sidebarCollapsed: false,
                filtersPanelOpen: false,
                detailsPanelOpen: false,
                compactMode: false,
                showCardDetails: true,
                showAssignees: true,
                showDueDates: true,
                theme: 'system',
                density: 'comfortable',
                visibleColumns: ['DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW', 'AWAITING_CLIENT', 'COMPLETED'],
                columnWidths: DEFAULT_COLUMN_WIDTHS,

                // View preferences actions
                updateViewPreferences: (preferences) => set((state) => {
                    state.viewPreferences = { ...state.viewPreferences, ...preferences }
                }),

                resetViewPreferences: () => set((state) => {
                    state.viewPreferences = DEFAULT_VIEW_PREFERENCES
                }),

                // Layout actions
                toggleSidebar: () => set((state) => {
                    state.sidebarCollapsed = !state.sidebarCollapsed
                }),

                toggleFiltersPanel: () => set((state) => {
                    state.filtersPanelOpen = !state.filtersPanelOpen
                }),

                toggleDetailsPanel: () => set((state) => {
                    state.detailsPanelOpen = !state.detailsPanelOpen
                }),

                setSidebarCollapsed: (collapsed) => set((state) => {
                    state.sidebarCollapsed = collapsed
                }),

                setFiltersPanelOpen: (open) => set((state) => {
                    state.filtersPanelOpen = open
                }),

                setDetailsPanelOpen: (open) => set((state) => {
                    state.detailsPanelOpen = open
                }),

                // Display actions
                setCompactMode: (compact) => set((state) => {
                    state.compactMode = compact
                }),

                toggleCardDetails: () => set((state) => {
                    state.showCardDetails = !state.showCardDetails
                }),

                toggleAssignees: () => set((state) => {
                    state.showAssignees = !state.showAssignees
                }),

                toggleDueDates: () => set((state) => {
                    state.showDueDates = !state.showDueDates
                }),

                // Theme actions
                setTheme: (theme) => set((state) => {
                    state.theme = theme
                }),

                setDensity: (density) => set((state) => {
                    state.density = density
                }),

                // Column actions
                setVisibleColumns: (columns) => set((state) => {
                    state.visibleColumns = columns
                }),

                setColumnWidth: (columnId, width) => set((state) => {
                    state.columnWidths[columnId] = Math.max(250, Math.min(500, width))
                }),

                resetColumnWidths: () => set((state) => {
                    state.columnWidths = DEFAULT_COLUMN_WIDTHS
                }),

                // Metrics actions
                updateBoardMetrics: (metrics) => set((state) => {
                    state.boardMetrics = { ...state.boardMetrics, ...metrics }
                }),

                // Export/Import preferences
                exportPreferences: () => {
                    const state = get()
                    const preferences = {
                        viewPreferences: state.viewPreferences,
                        sidebarCollapsed: state.sidebarCollapsed,
                        filtersPanelOpen: state.filtersPanelOpen,
                        detailsPanelOpen: state.detailsPanelOpen,
                        compactMode: state.compactMode,
                        showCardDetails: state.showCardDetails,
                        showAssignees: state.showAssignees,
                        showDueDates: state.showDueDates,
                        theme: state.theme,
                        density: state.density,
                        visibleColumns: state.visibleColumns,
                        columnWidths: state.columnWidths
                    }
                    return JSON.stringify(preferences, null, 2)
                },

                importPreferences: (preferencesJson) => {
                    try {
                        const preferences = JSON.parse(preferencesJson)
                        set((state) => {
                            // Safely merge preferences with validation
                            if (preferences.viewPreferences) {
                                state.viewPreferences = { ...state.viewPreferences, ...preferences.viewPreferences }
                            }
                            if (typeof preferences.sidebarCollapsed === 'boolean') {
                                state.sidebarCollapsed = preferences.sidebarCollapsed
                            }
                            if (typeof preferences.filtersPanelOpen === 'boolean') {
                                state.filtersPanelOpen = preferences.filtersPanelOpen
                            }
                            if (typeof preferences.detailsPanelOpen === 'boolean') {
                                state.detailsPanelOpen = preferences.detailsPanelOpen
                            }
                            if (typeof preferences.compactMode === 'boolean') {
                                state.compactMode = preferences.compactMode
                            }
                            if (typeof preferences.showCardDetails === 'boolean') {
                                state.showCardDetails = preferences.showCardDetails
                            }
                            if (typeof preferences.showAssignees === 'boolean') {  
                                state.showAssignees = preferences.showAssignees
                            }
                            if (typeof preferences.showDueDates === 'boolean') {
                                state.showDueDates = preferences.showDueDates
                            }
                            if (['light', 'dark', 'system'].includes(preferences.theme)) {
                                state.theme = preferences.theme
                            }
                            if (['comfortable', 'compact', 'spacious'].includes(preferences.density)) {
                                state.density = preferences.density
                            }
                            if (Array.isArray(preferences.visibleColumns)) {
                                state.visibleColumns = preferences.visibleColumns
                            }
                            if (preferences.columnWidths && typeof preferences.columnWidths === 'object') {
                                state.columnWidths = { ...state.columnWidths, ...preferences.columnWidths }
                            }
                        })
                    } catch (error) {
                        console.error('Failed to import preferences:', error)
                        throw new Error('Invalid preferences format')
                    }
                }
            }))
        ),
        {
            name: 'kanban-ui-preferences',
            partialize: (state) => ({
                viewPreferences: state.viewPreferences,
                sidebarCollapsed: state.sidebarCollapsed,
                compactMode: state.compactMode,
                showCardDetails: state.showCardDetails,
                showAssignees: state.showAssignees,
                showDueDates: state.showDueDates,
                theme: state.theme,
                density: state.density,
                visibleColumns: state.visibleColumns,
                columnWidths: state.columnWidths
            })
        }
    )
)

// Selector hooks for optimized re-renders
export const useViewPreferences = () => useUIPreferencesStore((state) => state.viewPreferences)
export const useBoardMetrics = () => useUIPreferencesStore((state) => state.boardMetrics)
export const useLayoutState = () => useUIPreferencesStore((state) => ({
    sidebarCollapsed: state.sidebarCollapsed,
    filtersPanelOpen: state.filtersPanelOpen,
    detailsPanelOpen: state.detailsPanelOpen
}))
export const useDisplaySettings = () => useUIPreferencesStore((state) => ({
    compactMode: state.compactMode,
    showCardDetails: state.showCardDetails,
    showAssignees: state.showAssignees,
    showDueDates: state.showDueDates
}))
export const useThemeSettings = () => useUIPreferencesStore((state) => ({
    theme: state.theme,
    density: state.density
}))
export const useColumnSettings = () => useUIPreferencesStore((state) => ({
    visibleColumns: state.visibleColumns,
    columnWidths: state.columnWidths
}))

export const useUIPreferencesActions = () => useUIPreferencesStore((state) => ({
    updateViewPreferences: state.updateViewPreferences,
    resetViewPreferences: state.resetViewPreferences,
    toggleSidebar: state.toggleSidebar,
    toggleFiltersPanel: state.toggleFiltersPanel,
    toggleDetailsPanel: state.toggleDetailsPanel,
    setSidebarCollapsed: state.setSidebarCollapsed,
    setFiltersPanelOpen: state.setFiltersPanelOpen,
    setDetailsPanelOpen: state.setDetailsPanelOpen,
    setCompactMode: state.setCompactMode,
    toggleCardDetails: state.toggleCardDetails,
    toggleAssignees: state.toggleAssignees,
    toggleDueDates: state.toggleDueDates,
    setTheme: state.setTheme,
    setDensity: state.setDensity,
    setVisibleColumns: state.setVisibleColumns,
    setColumnWidth: state.setColumnWidth,
    resetColumnWidths: state.resetColumnWidths,
    updateBoardMetrics: state.updateBoardMetrics,
    exportPreferences: state.exportPreferences,
    importPreferences: state.importPreferences
}))

// SSR-compatible server snapshot
const getServerSnapshot = (): UIPreferencesState => ({
    viewPreferences: DEFAULT_VIEW_PREFERENCES,
    boardMetrics: DEFAULT_BOARD_METRICS,
    sidebarCollapsed: false,
    filtersPanelOpen: false,
    detailsPanelOpen: false,
    compactMode: false,
    showCardDetails: true,
    showAssignees: true,
    showDueDates: true,
    theme: 'system',
    density: 'comfortable',
    visibleColumns: ['DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW', 'AWAITING_CLIENT', 'COMPLETED'],
    columnWidths: DEFAULT_COLUMN_WIDTHS,
    updateViewPreferences: () => {},
    resetViewPreferences: () => {},
    toggleSidebar: () => {},
    toggleFiltersPanel: () => {},
    toggleDetailsPanel: () => {},
    setSidebarCollapsed: () => {},
    setFiltersPanelOpen: () => {},
    setDetailsPanelOpen: () => {},
    setCompactMode: () => {},
    toggleCardDetails: () => {},
    toggleAssignees: () => {},
    toggleDueDates: () => {},
    setTheme: () => {},
    setDensity: () => {},
    setVisibleColumns: () => {},
    setColumnWidth: () => {},
    resetColumnWidths: () => {},
    updateBoardMetrics: () => {},
    exportPreferences: () => '',
    importPreferences: () => {}
})

export { getServerSnapshot as getUIPreferencesServerSnapshot }