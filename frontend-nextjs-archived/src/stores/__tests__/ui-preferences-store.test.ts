/**
 * Tests for ui-preferences-store
 * Tests view preferences, layout state, persistence, and theme management
 */

import { renderHook, act } from '@testing-library/react'
import { 
    useUIPreferencesStore,
    useViewPreferences,
    useBoardMetrics,
    useLayoutState,
    useDisplaySettings,
    useThemeSettings,
    useColumnSettings,
    useUIPreferencesActions,
    getUIPreferencesServerSnapshot
} from '../kanban/ui-preferences-store'
import { DEFAULT_VIEW_PREFERENCES } from '@/components/kanban/constants'

describe('UIPreferencesStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useUIPreferencesStore.setState({
            viewPreferences: DEFAULT_VIEW_PREFERENCES,
            boardMetrics: {
                totalMatters: 0,
                activeMatters: 0,
                completedMatters: 0,
                overdueMatters: 0,
                averageCompletionTime: 0,
                matterstByStatus: {},
                mattersByPriority: {},
                mattersByAssigned: {},
                recentActivity: []
            },
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
            columnWidths: {
                'DRAFT': 320,
                'IN_PROGRESS': 320,
                'UNDER_REVIEW': 320,
                'AWAITING_CLIENT': 320,
                'COMPLETED': 320,
                'ON_HOLD': 320,
                'CLOSED': 320
            }
        })
    })

    describe('Initial state', () => {
        test('has correct initial state', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            expect(result.current).toMatchObject({
                viewPreferences: DEFAULT_VIEW_PREFERENCES,
                sidebarCollapsed: false,
                filtersPanelOpen: false,
                detailsPanelOpen: false,
                compactMode: false,
                showCardDetails: true,
                showAssignees: true,
                showDueDates: true,
                theme: 'system',
                density: 'comfortable'
            })
        })
    })

    describe('View preferences', () => {
        test('updateViewPreferences merges preferences', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.updateViewPreferences({
                    showEmptyColumns: false,
                    autoRefresh: true
                })
            })

            expect(result.current.viewPreferences).toMatchObject({
                ...DEFAULT_VIEW_PREFERENCES,
                showEmptyColumns: false,
                autoRefresh: true
            })
        })

        test('resetViewPreferences restores defaults', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            // Change preferences first
            act(() => {
                result.current.updateViewPreferences({
                    showEmptyColumns: false,
                    autoRefresh: true
                })
            })

            act(() => {
                result.current.resetViewPreferences()
            })

            expect(result.current.viewPreferences).toEqual(DEFAULT_VIEW_PREFERENCES)
        })
    })

    describe('Layout actions', () => {
        test('toggleSidebar changes collapsed state', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.toggleSidebar()
            })

            expect(result.current.sidebarCollapsed).toBe(true)

            act(() => {
                result.current.toggleSidebar()
            })

            expect(result.current.sidebarCollapsed).toBe(false)
        })

        test('setSidebarCollapsed sets explicit state', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.setSidebarCollapsed(true)
            })

            expect(result.current.sidebarCollapsed).toBe(true)
        })

        test('toggleFiltersPanel changes panel state', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.toggleFiltersPanel()
            })

            expect(result.current.filtersPanelOpen).toBe(true)
        })

        test('toggleDetailsPanel changes panel state', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.toggleDetailsPanel()
            })

            expect(result.current.detailsPanelOpen).toBe(true)
        })
    })

    describe('Display settings', () => {
        test('setCompactMode changes compact mode', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.setCompactMode(true)
            })

            expect(result.current.compactMode).toBe(true)
        })

        test('toggleCardDetails changes card details visibility', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.toggleCardDetails()
            })

            expect(result.current.showCardDetails).toBe(false)
        })

        test('toggleAssignees changes assignee visibility', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.toggleAssignees()
            })

            expect(result.current.showAssignees).toBe(false)
        })

        test('toggleDueDates changes due date visibility', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.toggleDueDates()
            })

            expect(result.current.showDueDates).toBe(false)
        })
    })

    describe('Theme settings', () => {
        test('setTheme changes theme', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.setTheme('dark')
            })

            expect(result.current.theme).toBe('dark')
        })

        test('setDensity changes density', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.setDensity('compact')
            })

            expect(result.current.density).toBe('compact')
        })
    })

    describe('Column settings', () => {
        test('setVisibleColumns updates visible columns', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            const newColumns = ['DRAFT', 'IN_PROGRESS', 'COMPLETED']
            
            act(() => {
                result.current.setVisibleColumns(newColumns)
            })

            expect(result.current.visibleColumns).toEqual(newColumns)
        })

        test('setColumnWidth updates column width within bounds', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.setColumnWidth('DRAFT', 400)
            })

            expect(result.current.columnWidths['DRAFT']).toBe(400)
        })

        test('setColumnWidth enforces minimum width', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.setColumnWidth('DRAFT', 100) // Below minimum
            })

            expect(result.current.columnWidths['DRAFT']).toBe(250)
        })

        test('setColumnWidth enforces maximum width', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            act(() => {
                result.current.setColumnWidth('DRAFT', 600) // Above maximum
            })

            expect(result.current.columnWidths['DRAFT']).toBe(500)
        })

        test('resetColumnWidths restores defaults', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            // Change widths first
            act(() => {
                result.current.setColumnWidth('DRAFT', 400)
                result.current.setColumnWidth('IN_PROGRESS', 450)
            })

            act(() => {
                result.current.resetColumnWidths()
            })

            expect(result.current.columnWidths['DRAFT']).toBe(320)
            expect(result.current.columnWidths['IN_PROGRESS']).toBe(320)
        })
    })

    describe('Board metrics', () => {
        test('updateBoardMetrics merges metrics', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            const newMetrics = {
                totalMatters: 10,
                activeMatters: 8,
                completedMatters: 2
            }
            
            act(() => {
                result.current.updateBoardMetrics(newMetrics)
            })

            expect(result.current.boardMetrics).toMatchObject(newMetrics)
        })
    })

    describe('Export/Import preferences', () => {
        test('exportPreferences returns JSON string', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            // Set some preferences
            act(() => {
                result.current.setTheme('dark')
                result.current.setCompactMode(true)
            })

            const exported = result.current.exportPreferences()
            const parsed = JSON.parse(exported)
            
            expect(parsed.theme).toBe('dark')
            expect(parsed.compactMode).toBe(true)
        })

        test('importPreferences applies valid preferences', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            const preferences = JSON.stringify({
                theme: 'light',
                compactMode: true,
                sidebarCollapsed: true,
                density: 'compact'
            })

            act(() => {
                result.current.importPreferences(preferences)
            })

            expect(result.current.theme).toBe('light')
            expect(result.current.compactMode).toBe(true)
            expect(result.current.sidebarCollapsed).toBe(true)
            expect(result.current.density).toBe('compact')
        })

        test('importPreferences handles invalid JSON', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            expect(() => {
                result.current.importPreferences('invalid json')
            }).toThrow('Invalid preferences format')
        })

        test('importPreferences validates preference types', () => {
            const { result } = renderHook(() => useUIPreferencesStore())
            
            const preferences = JSON.stringify({
                theme: 'invalid-theme', // Invalid value
                compactMode: 'not-boolean', // Invalid type
                validProperty: true
            })

            act(() => {
                result.current.importPreferences(preferences)
            })

            // Should not apply invalid values
            expect(result.current.theme).toBe('system') // Original value
            expect(result.current.compactMode).toBe(false) // Original value
        })
    })

    describe('Selector hooks', () => {
        test('selector hooks return correct values', () => {
            const { result: viewResult } = renderHook(() => useViewPreferences())
            const { result: metricsResult } = renderHook(() => useBoardMetrics())
            const { result: layoutResult } = renderHook(() => useLayoutState())
            const { result: displayResult } = renderHook(() => useDisplaySettings())
            const { result: themeResult } = renderHook(() => useThemeSettings())
            const { result: columnResult } = renderHook(() => useColumnSettings())

            expect(viewResult.current).toEqual(DEFAULT_VIEW_PREFERENCES)
            expect(metricsResult.current).toMatchObject({
                totalMatters: 0,
                activeMatters: 0
            })
            expect(layoutResult.current).toMatchObject({
                sidebarCollapsed: false,
                filtersPanelOpen: false,
                detailsPanelOpen: false
            })
            expect(displayResult.current).toMatchObject({
                compactMode: false,
                showCardDetails: true,
                showAssignees: true,
                showDueDates: true
            })
            expect(themeResult.current).toMatchObject({
                theme: 'system',
                density: 'comfortable'
            })
            expect(columnResult.current).toMatchObject({
                visibleColumns: expect.any(Array),
                columnWidths: expect.any(Object)
            })
        })
    })

    describe('SSR compatibility', () => {
        test('getUIPreferencesServerSnapshot returns correct initial state', () => {
            const snapshot = getUIPreferencesServerSnapshot()
            
            expect(snapshot).toMatchObject({
                viewPreferences: DEFAULT_VIEW_PREFERENCES,
                sidebarCollapsed: false,
                filtersPanelOpen: false,
                detailsPanelOpen: false,
                compactMode: false,
                showCardDetails: true,
                showAssignees: true,
                showDueDates: true,
                theme: 'system',
                density: 'comfortable',
                visibleColumns: expect.any(Array),
                columnWidths: expect.any(Object),
                updateViewPreferences: expect.any(Function),
                setTheme: expect.any(Function),
                exportPreferences: expect.any(Function),
                importPreferences: expect.any(Function)
            })
        })

        test('server snapshot actions are no-ops', () => {
            const snapshot = getUIPreferencesServerSnapshot()
            
            // Should not throw
            expect(() => snapshot.updateViewPreferences({})).not.toThrow()
            expect(() => snapshot.setTheme('dark')).not.toThrow()
            expect(() => snapshot.toggleSidebar()).not.toThrow()
            expect(snapshot.exportPreferences()).toBe('')
            expect(() => snapshot.importPreferences('test')).not.toThrow()
        })
    })
})