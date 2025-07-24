import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIPreferencesStore } from '../ui-preferences'
import type { ViewPreferences, LayoutPreferences, UIState } from '../ui-preferences'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('UI Preferences Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Initial State', () => {
    it('should have correct default view preferences', () => {
      const store = useUIPreferencesStore()
      
      expect(store.viewPreferences.cardView).toBe('detailed')
      expect(store.viewPreferences.groupBy).toBe('status')
      expect(store.viewPreferences.sortBy).toBe('priority')
      expect(store.viewPreferences.sortOrder).toBe('desc')
      expect(store.viewPreferences.showAvatar).toBe(true)
      expect(store.viewPreferences.showDueDate).toBe(true)
      expect(store.viewPreferences.showTags).toBe(true)
      expect(store.viewPreferences.showPriority).toBe(true)
      expect(store.viewPreferences.compactMode).toBe(false)
    })

    it('should have correct default layout preferences', () => {
      const store = useUIPreferencesStore()
      
      expect(store.layoutPreferences.sidebarCollapsed).toBe(false)
      expect(store.layoutPreferences.sidebarWidth).toBe(280)
      expect(store.layoutPreferences.columnWidth).toBe(320)
      expect(store.layoutPreferences.showColumnHeaders).toBe(true)
      expect(store.layoutPreferences.showStatusCounts).toBe(true)
      expect(store.layoutPreferences.enableAnimations).toBe(true)
    })

    it('should have correct default UI state', () => {
      const store = useUIPreferencesStore()
      
      expect(store.uiState.theme).toBe('system')
      expect(store.uiState.isDark).toBe(false)
      expect(store.uiState.isLoading).toBe(false)
      expect(store.uiState.activeModal).toBeNull()
      expect(store.uiState.notifications).toEqual([])
    })

    it('should have correct default panel states', () => {
      const store = useUIPreferencesStore()
      
      expect(store.panelStates.sidebar).toBe(true)
      expect(store.panelStates.search).toBe(false)
      expect(store.panelStates.filters).toBe(false)
      expect(store.panelStates.details).toBe(false)
    })
  })

  describe('View Preferences', () => {
    it('should update view preferences', () => {
      const store = useUIPreferencesStore()
      
      const updates: Partial<ViewPreferences> = {
        cardView: 'compact',
        groupBy: 'priority',
        sortBy: 'dueDate',
        compactMode: true
      }
      
      store.updateViewPreferences(updates)
      
      expect(store.viewPreferences.cardView).toBe('compact')
      expect(store.viewPreferences.groupBy).toBe('priority')
      expect(store.viewPreferences.sortBy).toBe('dueDate')
      expect(store.viewPreferences.compactMode).toBe(true)
    })

    it('should toggle compact mode', () => {
      const store = useUIPreferencesStore()
      
      expect(store.viewPreferences.compactMode).toBe(false)
      
      store.toggleCompactMode()
      expect(store.viewPreferences.compactMode).toBe(true)
      
      store.toggleCompactMode()
      expect(store.viewPreferences.compactMode).toBe(false)
    })

    it('should reset view preferences', () => {
      const store = useUIPreferencesStore()
      
      // Modify preferences
      store.updateViewPreferences({
        cardView: 'compact',
        groupBy: 'priority',
        compactMode: true
      })
      
      // Reset
      store.resetViewPreferences()
      
      expect(store.viewPreferences.cardView).toBe('detailed')
      expect(store.viewPreferences.groupBy).toBe('status')
      expect(store.viewPreferences.compactMode).toBe(false)
    })
  })

  describe('Layout Preferences', () => {
    it('should update layout preferences', () => {
      const store = useUIPreferencesStore()
      
      const updates: Partial<LayoutPreferences> = {
        sidebarWidth: 300,
        columnWidth: 350,
        showColumnHeaders: false,
        enableAnimations: false
      }
      
      store.updateLayoutPreferences(updates)
      
      expect(store.layoutPreferences.sidebarWidth).toBe(300)
      expect(store.layoutPreferences.columnWidth).toBe(350)
      expect(store.layoutPreferences.showColumnHeaders).toBe(false)
      expect(store.layoutPreferences.enableAnimations).toBe(false)
    })

    it('should toggle sidebar', () => {
      const store = useUIPreferencesStore()
      
      expect(store.layoutPreferences.sidebarCollapsed).toBe(false)
      
      store.toggleSidebar()
      expect(store.layoutPreferences.sidebarCollapsed).toBe(true)
      
      store.toggleSidebar()
      expect(store.layoutPreferences.sidebarCollapsed).toBe(false)
    })

    it('should set sidebar width within bounds', () => {
      const store = useUIPreferencesStore()
      
      // Normal width
      store.setSidebarWidth(350)
      expect(store.layoutPreferences.sidebarWidth).toBe(350)
      
      // Below minimum
      store.setSidebarWidth(100)
      expect(store.layoutPreferences.sidebarWidth).toBe(200) // Minimum
      
      // Above maximum
      store.setSidebarWidth(600)
      expect(store.layoutPreferences.sidebarWidth).toBe(500) // Maximum
    })

    it('should set column width within bounds', () => {
      const store = useUIPreferencesStore()
      
      // Normal width
      store.setColumnWidth(400)
      expect(store.layoutPreferences.columnWidth).toBe(400)
      
      // Below minimum
      store.setColumnWidth(200)
      expect(store.layoutPreferences.columnWidth).toBe(280) // Minimum
      
      // Above maximum
      store.setColumnWidth(600)
      expect(store.layoutPreferences.columnWidth).toBe(500) // Maximum
    })

    it('should reset layout preferences', () => {
      const store = useUIPreferencesStore()
      
      // Modify preferences
      store.updateLayoutPreferences({
        sidebarWidth: 400,
        columnWidth: 400,
        sidebarCollapsed: true
      })
      
      // Reset
      store.resetLayoutPreferences()
      
      expect(store.layoutPreferences.sidebarWidth).toBe(280)
      expect(store.layoutPreferences.columnWidth).toBe(320)
      expect(store.layoutPreferences.sidebarCollapsed).toBe(false)
    })
  })

  describe('Theme Management', () => {
    it('should set theme', () => {
      const store = useUIPreferencesStore()
      
      store.setTheme('dark')
      expect(store.uiState.theme).toBe('dark')
      expect(store.uiState.isDark).toBe(true)
      
      store.setTheme('light')
      expect(store.uiState.theme).toBe('light')
      expect(store.uiState.isDark).toBe(false)
    })

    it('should toggle dark mode', () => {
      const store = useUIPreferencesStore()
      
      expect(store.uiState.isDark).toBe(false)
      
      store.toggleDarkMode()
      expect(store.uiState.isDark).toBe(true)
      expect(store.uiState.theme).toBe('dark')
      
      store.toggleDarkMode()
      expect(store.uiState.isDark).toBe(false)
      expect(store.uiState.theme).toBe('light')
    })

    it('should handle system theme preference', () => {
      const store = useUIPreferencesStore()
      
      // Mock system preference as dark
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      store.setTheme('system')
      expect(store.uiState.theme).toBe('system')
      expect(store.uiState.isDark).toBe(true) // Based on system preference
    })
  })

  describe('Panel States', () => {
    it('should toggle panels', () => {
      const store = useUIPreferencesStore()
      
      expect(store.panelStates.search).toBe(false)
      
      store.toggleSearchPanel()
      expect(store.panelStates.search).toBe(true)
      
      store.toggleSearchPanel()
      expect(store.panelStates.search).toBe(false)
    })

    it('should toggle filters panel', () => {
      const store = useUIPreferencesStore()
      
      expect(store.panelStates.filters).toBe(false)
      
      store.toggleFiltersPanel()
      expect(store.panelStates.filters).toBe(true)
      
      store.toggleFiltersPanel()
      expect(store.panelStates.filters).toBe(false)
    })

    it('should toggle details panel', () => {
      const store = useUIPreferencesStore()
      
      expect(store.panelStates.details).toBe(false)
      
      store.toggleDetailsPanel()
      expect(store.panelStates.details).toBe(true)
      
      store.toggleDetailsPanel()
      expect(store.panelStates.details).toBe(false)
    })

    it('should update UI state', () => {
      const store = useUIPreferencesStore()
      
      const updates: Partial<UIState> = {
        isLoading: true,
        activeModal: 'settings'
      }
      
      store.updateUIState(updates)
      
      expect(store.uiState.isLoading).toBe(true)
      expect(store.uiState.activeModal).toBe('settings')
    })
  })

  describe('Notifications', () => {
    it('should add notification', () => {
      const store = useUIPreferencesStore()
      
      store.addNotification({
        id: 'test-1',
        type: 'success',
        title: 'Success',
        message: 'Operation completed'
      })
      
      expect(store.uiState.notifications).toHaveLength(1)
      expect(store.uiState.notifications[0].title).toBe('Success')
    })

    it('should remove notification', () => {
      const store = useUIPreferencesStore()
      
      store.addNotification({
        id: 'test-1',
        type: 'info',
        title: 'Info',
        message: 'Information message'
      })
      
      expect(store.uiState.notifications).toHaveLength(1)
      
      store.removeNotification('test-1')
      expect(store.uiState.notifications).toHaveLength(0)
    })

    it('should clear all notifications', () => {
      const store = useUIPreferencesStore()
      
      store.addNotification({
        id: 'test-1',
        type: 'info',
        title: 'Info 1',
        message: 'Message 1'
      })
      
      store.addNotification({
        id: 'test-2',
        type: 'warning',
        title: 'Warning',
        message: 'Warning message'
      })
      
      expect(store.uiState.notifications).toHaveLength(2)
      
      store.clearNotifications()
      expect(store.uiState.notifications).toHaveLength(0)
    })

    it('should auto-remove notifications with timeout', async () => {
      const store = useUIPreferencesStore()
      
      store.addNotification({
        id: 'test-1',
        type: 'success',
        title: 'Success',
        message: 'Will auto-remove',
        timeout: 100 // Short timeout for testing
      })
      
      expect(store.uiState.notifications).toHaveLength(1)
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(store.uiState.notifications).toHaveLength(0)
    })
  })

  describe('Accessibility', () => {
    it('should update accessibility preferences', () => {
      const store = useUIPreferencesStore()
      
      store.updateAccessibilityPreferences({
        reduceMotion: true,
        highContrast: true,
        screenReader: true,
        keyboardNavigation: true
      })
      
      expect(store.accessibilityPreferences.reduceMotion).toBe(true)
      expect(store.accessibilityPreferences.highContrast).toBe(true)
      expect(store.accessibilityPreferences.screenReader).toBe(true)
      expect(store.accessibilityPreferences.keyboardNavigation).toBe(true)
    })

    it('should respect reduced motion preference', () => {
      const store = useUIPreferencesStore()
      
      // Enable reduced motion
      store.updateAccessibilityPreferences({ reduceMotion: true })
      
      // Layout animations should be disabled
      expect(store.layoutPreferences.enableAnimations).toBe(false)
    })
  })

  describe('Presets', () => {
    it('should apply compact preset', () => {
      const store = useUIPreferencesStore()
      
      store.applyPreset('compact')
      
      expect(store.viewPreferences.cardView).toBe('compact')
      expect(store.viewPreferences.compactMode).toBe(true)
      expect(store.layoutPreferences.columnWidth).toBe(280)
    })

    it('should apply detailed preset', () => {
      const store = useUIPreferencesStore()
      
      store.applyPreset('detailed')
      
      expect(store.viewPreferences.cardView).toBe('detailed')
      expect(store.viewPreferences.compactMode).toBe(false)
      expect(store.layoutPreferences.columnWidth).toBe(380)
    })

    it('should apply mobile preset', () => {
      const store = useUIPreferencesStore()
      
      store.applyPreset('mobile')
      
      expect(store.viewPreferences.cardView).toBe('compact')
      expect(store.layoutPreferences.sidebarCollapsed).toBe(true)
      expect(store.layoutPreferences.columnWidth).toBe(320)
    })

    it('should apply accessibility preset', () => {
      const store = useUIPreferencesStore()
      
      store.applyPreset('accessibility')
      
      expect(store.accessibilityPreferences.highContrast).toBe(true)
      expect(store.accessibilityPreferences.reduceMotion).toBe(true)
      expect(store.layoutPreferences.enableAnimations).toBe(false)
    })
  })

  describe('Persistence', () => {
    it('should save preferences to localStorage', () => {
      const store = useUIPreferencesStore()
      
      store.updateViewPreferences({ cardView: 'compact' })
      store.savePreferences()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kanban-ui-preferences',
        expect.stringContaining('"cardView":"compact"')
      )
    })

    it('should load preferences from localStorage', () => {
      const savedPrefs = {
        viewPreferences: { cardView: 'compact', groupBy: 'priority' },
        layoutPreferences: { sidebarWidth: 350 },
        uiState: { theme: 'dark' }
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPrefs))
      
      const store = useUIPreferencesStore()
      store.loadPreferences()
      
      expect(store.viewPreferences.cardView).toBe('compact')
      expect(store.viewPreferences.groupBy).toBe('priority')
      expect(store.layoutPreferences.sidebarWidth).toBe(350)
      expect(store.uiState.theme).toBe('dark')
    })

    it('should handle localStorage load errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const store = useUIPreferencesStore()
      
      // Should not throw
      expect(() => store.loadPreferences()).not.toThrow()
      
      // Should maintain default preferences
      expect(store.viewPreferences.cardView).toBe('detailed')
    })

    it('should export preferences', () => {
      const store = useUIPreferencesStore()
      
      store.updateViewPreferences({ cardView: 'compact' })
      store.updateLayoutPreferences({ sidebarWidth: 350 })
      
      const exported = store.exportPreferences()
      
      expect(exported.viewPreferences.cardView).toBe('compact')
      expect(exported.layoutPreferences.sidebarWidth).toBe(350)
      expect(exported.version).toBe('1.0')
      expect(exported.exportedAt).toBeInstanceOf(Date)
    })

    it('should import preferences', () => {
      const store = useUIPreferencesStore()
      
      const importData = {
        version: '1.0',
        viewPreferences: { cardView: 'compact' as const },
        layoutPreferences: { sidebarWidth: 400 },
        uiState: { theme: 'dark' as const },
        exportedAt: new Date()
      }
      
      store.importPreferences(importData)
      
      expect(store.viewPreferences.cardView).toBe('compact')
      expect(store.layoutPreferences.sidebarWidth).toBe(400)
      expect(store.uiState.theme).toBe('dark')
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt to mobile viewport', () => {
      const store = useUIPreferencesStore()
      
      store.handleViewportChange({ width: 640, height: 800, isMobile: true })
      
      expect(store.layoutPreferences.sidebarCollapsed).toBe(true)
      expect(store.viewPreferences.compactMode).toBe(true)
    })

    it('should adapt to desktop viewport', () => {
      const store = useUIPreferencesStore()
      
      // First simulate mobile
      store.handleViewportChange({ width: 640, height: 800, isMobile: true })
      
      // Then switch to desktop
      store.handleViewportChange({ width: 1200, height: 800, isMobile: false })
      
      expect(store.layoutPreferences.sidebarCollapsed).toBe(false)
      expect(store.viewPreferences.compactMode).toBe(false)
    })
  })
})