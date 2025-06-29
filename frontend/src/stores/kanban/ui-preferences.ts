import { defineStore } from 'pinia'
import { ref, computed, readonly, watch, nextTick } from 'vue'
import type { ViewPreferences } from '~/types/kanban'

export interface UIState {
  sidebarOpen: boolean
  searchPanelOpen: boolean
  filtersPanelOpen: boolean
  settingsPanelOpen: boolean
  mobileMenuOpen: boolean
  notificationsPanelOpen: boolean
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'ja'
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    screenReaderOptimized: boolean
    fontSize: 'small' | 'medium' | 'large'
  }
}

export interface LayoutPreferences {
  columnsPerRow: number
  columnWidth: 'narrow' | 'normal' | 'wide'
  showColumnHeaders: boolean
  showColumnCounts: boolean
  enableColumnReordering: boolean
  enableColumnCollapsing: boolean
  compactMode: boolean
  fullWidth: boolean
  showQuickActions: boolean
}

const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
  cardSize: 'normal',
  showAvatars: true,
  showDueDates: true,
  showPriority: true,
  showTags: true,
  groupBy: 'status',
  sortBy: 'priority',
  sortOrder: 'desc'
}

const DEFAULT_UI_STATE: UIState = {
  sidebarOpen: true,
  searchPanelOpen: false,
  filtersPanelOpen: false,
  settingsPanelOpen: false,
  mobileMenuOpen: false,
  notificationsPanelOpen: false,
  theme: 'system',
  language: 'en',
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    fontSize: 'medium'
  }
}

const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferences = {
  columnsPerRow: 5,
  columnWidth: 'normal',
  showColumnHeaders: true,
  showColumnCounts: true,
  enableColumnReordering: true,
  enableColumnCollapsing: false,
  compactMode: false,
  fullWidth: false,
  showQuickActions: true
}

export const useUIPreferencesStore = defineStore('kanban-ui-preferences', () => {
  // State
  const viewPreferences = ref<ViewPreferences>({ ...DEFAULT_VIEW_PREFERENCES })
  const uiState = ref<UIState>({ ...DEFAULT_UI_STATE })
  const layoutPreferences = ref<LayoutPreferences>({ ...DEFAULT_LAYOUT_PREFERENCES })
  
  // Persistence keys
  const STORAGE_KEYS = {
    VIEW_PREFERENCES: 'kanban-view-preferences',
    UI_STATE: 'kanban-ui-state',
    LAYOUT_PREFERENCES: 'kanban-layout-preferences'
  } as const

  // Persistence helpers
  const saveToStorage = (key: string, data: any) => {
    if (process.client) {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error)
      }
    }
  }

  const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    if (!process.client) return defaultValue
    
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Ensure all default properties exist in case of schema changes
        return { ...defaultValue, ...parsed }
      }
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error)
    }
    return defaultValue
  }

  // Load preferences from localStorage
  const loadPreferences = () => {
    viewPreferences.value = loadFromStorage(STORAGE_KEYS.VIEW_PREFERENCES, DEFAULT_VIEW_PREFERENCES)
    uiState.value = loadFromStorage(STORAGE_KEYS.UI_STATE, DEFAULT_UI_STATE)
    layoutPreferences.value = loadFromStorage(STORAGE_KEYS.LAYOUT_PREFERENCES, DEFAULT_LAYOUT_PREFERENCES)
  }

  // Save individual preference sections
  const saveViewPreferences = () => {
    saveToStorage(STORAGE_KEYS.VIEW_PREFERENCES, viewPreferences.value)
  }

  const saveUIState = () => {
    // Don't persist temporary UI states like mobile menu
    const { mobileMenuOpen, notificationsPanelOpen, ...persistentState } = uiState.value
    saveToStorage(STORAGE_KEYS.UI_STATE, persistentState)
  }

  const saveLayoutPreferences = () => {
    saveToStorage(STORAGE_KEYS.LAYOUT_PREFERENCES, layoutPreferences.value)
  }

  // Auto-save watchers with debouncing
  watch(
    viewPreferences,
    () => {
      nextTick(() => saveViewPreferences())
    },
    { deep: true }
  )

  watch(
    uiState,
    () => {
      nextTick(() => saveUIState())
    },
    { deep: true }
  )

  watch(
    layoutPreferences,
    () => {
      nextTick(() => saveLayoutPreferences())
    },
    { deep: true }
  )

  // Actions - View Preferences
  const updateViewPreferences = (updates: Partial<ViewPreferences>) => {
    viewPreferences.value = { ...viewPreferences.value, ...updates }
  }

  const resetViewPreferences = () => {
    viewPreferences.value = { ...DEFAULT_VIEW_PREFERENCES }
  }

  const toggleCardSize = () => {
    const sizes: ViewPreferences['cardSize'][] = ['compact', 'normal', 'detailed']
    const currentIndex = sizes.indexOf(viewPreferences.value.cardSize)
    const nextIndex = (currentIndex + 1) % sizes.length
    updateViewPreferences({ cardSize: sizes[nextIndex] })
  }

  const toggleGroupBy = () => {
    const options: ViewPreferences['groupBy'][] = ['status', 'priority', 'lawyer', 'none']
    const currentIndex = options.indexOf(viewPreferences.value.groupBy)
    const nextIndex = (currentIndex + 1) % options.length
    updateViewPreferences({ groupBy: options[nextIndex] })
  }

  // Actions - UI State
  const updateUIState = (updates: Partial<UIState>) => {
    uiState.value = { ...uiState.value, ...updates }
  }

  const toggleSidebar = () => {
    updateUIState({ sidebarOpen: !uiState.value.sidebarOpen })
  }

  const toggleSearchPanel = () => {
    updateUIState({ searchPanelOpen: !uiState.value.searchPanelOpen })
  }

  const toggleFiltersPanel = () => {
    updateUIState({ filtersPanelOpen: !uiState.value.filtersPanelOpen })
  }

  const toggleSettingsPanel = () => {
    updateUIState({ settingsPanelOpen: !uiState.value.settingsPanelOpen })
  }

  const toggleMobileMenu = () => {
    updateUIState({ mobileMenuOpen: !uiState.value.mobileMenuOpen })
  }

  const toggleNotificationsPanel = () => {
    updateUIState({ notificationsPanelOpen: !uiState.value.notificationsPanelOpen })
  }

  const closeAllPanels = () => {
    updateUIState({
      searchPanelOpen: false,
      filtersPanelOpen: false,
      settingsPanelOpen: false,
      mobileMenuOpen: false,
      notificationsPanelOpen: false
    })
  }

  const setTheme = (theme: UIState['theme']) => {
    updateUIState({ theme })
    
    // Apply theme to document
    if (process.client) {
      const root = document.documentElement
      
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
      } else {
        root.classList.toggle('dark', theme === 'dark')
      }
    }
  }

  const setLanguage = (language: UIState['language']) => {
    updateUIState({ language })
    
    // Apply language to document
    if (process.client) {
      document.documentElement.lang = language
    }
  }

  const updateAccessibility = (updates: Partial<UIState['accessibility']>) => {
    uiState.value.accessibility = { ...uiState.value.accessibility, ...updates }
    
    // Apply accessibility settings to document
    if (process.client) {
      const root = document.documentElement
      
      if (updates.highContrast !== undefined) {
        root.classList.toggle('high-contrast', updates.highContrast)
      }
      
      if (updates.reducedMotion !== undefined) {
        root.classList.toggle('reduce-motion', updates.reducedMotion)
      }
      
      if (updates.fontSize) {
        root.classList.remove('font-small', 'font-medium', 'font-large')
        root.classList.add(`font-${updates.fontSize}`)
      }
    }
  }

  // Actions - Layout Preferences
  const updateLayoutPreferences = (updates: Partial<LayoutPreferences>) => {
    layoutPreferences.value = { ...layoutPreferences.value, ...updates }
  }

  const resetLayoutPreferences = () => {
    layoutPreferences.value = { ...DEFAULT_LAYOUT_PREFERENCES }
  }

  const adjustColumnsPerRow = (delta: number) => {
    const newValue = Math.max(1, Math.min(8, layoutPreferences.value.columnsPerRow + delta))
    updateLayoutPreferences({ columnsPerRow: newValue })
  }

  const toggleColumnWidth = () => {
    const widths: LayoutPreferences['columnWidth'][] = ['narrow', 'normal', 'wide']
    const currentIndex = widths.indexOf(layoutPreferences.value.columnWidth)
    const nextIndex = (currentIndex + 1) % widths.length
    updateLayoutPreferences({ columnWidth: widths[nextIndex] })
  }

  const toggleCompactMode = () => {
    const compact = !layoutPreferences.value.compactMode
    updateLayoutPreferences({ compactMode: compact })
    
    // Also update view preferences for consistency
    if (compact) {
      updateViewPreferences({ cardSize: 'compact' })
    }
  }

  const toggleFullWidth = () => {
    updateLayoutPreferences({ fullWidth: !layoutPreferences.value.fullWidth })
  }

  // Preset configurations
  const applyPreset = (preset: 'minimal' | 'detailed' | 'compact' | 'spacious') => {
    switch (preset) {
      case 'minimal':
        updateViewPreferences({
          cardSize: 'compact',
          showAvatars: false,
          showTags: false,
          showPriority: true,
          showDueDates: true
        })
        updateLayoutPreferences({
          compactMode: true,
          showColumnHeaders: true,
          showColumnCounts: false,
          columnWidth: 'narrow'
        })
        break
        
      case 'detailed':
        updateViewPreferences({
          cardSize: 'detailed',
          showAvatars: true,
          showTags: true,
          showPriority: true,
          showDueDates: true
        })
        updateLayoutPreferences({
          compactMode: false,
          showColumnHeaders: true,
          showColumnCounts: true,
          columnWidth: 'wide'
        })
        break
        
      case 'compact':
        updateViewPreferences({
          cardSize: 'compact',
          showAvatars: true,
          showTags: false,
          showPriority: true,
          showDueDates: true
        })
        updateLayoutPreferences({
          compactMode: true,
          columnsPerRow: 6,
          columnWidth: 'narrow'
        })
        break
        
      case 'spacious':
        updateViewPreferences({
          cardSize: 'normal',
          showAvatars: true,
          showTags: true,
          showPriority: true,
          showDueDates: true
        })
        updateLayoutPreferences({
          compactMode: false,
          columnsPerRow: 3,
          columnWidth: 'wide',
          fullWidth: true
        })
        break
    }
  }

  // Responsive utilities
  const getResponsiveColumnCount = computed(() => {
    if (!process.client) return layoutPreferences.value.columnsPerRow
    
    const width = window.innerWidth
    const baseColumns = layoutPreferences.value.columnsPerRow
    
    if (width < 640) return Math.min(2, baseColumns) // Mobile
    if (width < 1024) return Math.min(3, baseColumns) // Tablet
    if (width < 1536) return Math.min(4, baseColumns) // Desktop
    return baseColumns // Large desktop
  })

  // Computed getters
  const isDarkMode = computed(() => {
    if (uiState.value.theme === 'system') {
      return process.client ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
    }
    return uiState.value.theme === 'dark'
  })

  const isCompactLayout = computed(() => {
    return layoutPreferences.value.compactMode || viewPreferences.value.cardSize === 'compact'
  })

  const currentLanguage = computed(() => uiState.value.language)

  const accessibilitySettings = computed(() => uiState.value.accessibility)

  const panelStates = computed(() => ({
    sidebar: uiState.value.sidebarOpen,
    search: uiState.value.searchPanelOpen,
    filters: uiState.value.filtersPanelOpen,
    settings: uiState.value.settingsPanelOpen,
    mobile: uiState.value.mobileMenuOpen,
    notifications: uiState.value.notificationsPanelOpen
  }))

  const hasOpenPanels = computed(() => {
    const { sidebar, ...panels } = panelStates.value
    return Object.values(panels).some(Boolean)
  })

  // Export all data for backup/restore
  const exportPreferences = () => {
    return {
      viewPreferences: viewPreferences.value,
      uiState: uiState.value,
      layoutPreferences: layoutPreferences.value,
      exportedAt: new Date().toISOString()
    }
  }

  const importPreferences = (data: ReturnType<typeof exportPreferences>) => {
    if (data.viewPreferences) {
      viewPreferences.value = { ...DEFAULT_VIEW_PREFERENCES, ...data.viewPreferences }
    }
    if (data.uiState) {
      uiState.value = { ...DEFAULT_UI_STATE, ...data.uiState }
    }
    if (data.layoutPreferences) {
      layoutPreferences.value = { ...DEFAULT_LAYOUT_PREFERENCES, ...data.layoutPreferences }
    }
  }

  // Initialize on client-side
  if (process.client) {
    loadPreferences()
    
    // Apply initial theme and accessibility settings
    nextTick(() => {
      setTheme(uiState.value.theme)
      setLanguage(uiState.value.language)
      updateAccessibility(uiState.value.accessibility)
    })
  }

  return {
    // State (readonly)
    viewPreferences: readonly(viewPreferences),
    uiState: readonly(uiState),
    layoutPreferences: readonly(layoutPreferences),

    // Actions - View Preferences
    updateViewPreferences,
    resetViewPreferences,
    toggleCardSize,
    toggleGroupBy,

    // Actions - UI State
    updateUIState,
    toggleSidebar,
    toggleSearchPanel,
    toggleFiltersPanel,
    toggleSettingsPanel,
    toggleMobileMenu,
    toggleNotificationsPanel,
    closeAllPanels,
    setTheme,
    setLanguage,
    updateAccessibility,

    // Actions - Layout Preferences
    updateLayoutPreferences,
    resetLayoutPreferences,
    adjustColumnsPerRow,
    toggleColumnWidth,
    toggleCompactMode,
    toggleFullWidth,

    // Presets and utilities
    applyPreset,
    loadPreferences,
    exportPreferences,
    importPreferences,

    // Getters
    isDarkMode,
    isCompactLayout,
    currentLanguage,
    accessibilitySettings,
    panelStates,
    hasOpenPanels,
    getResponsiveColumnCount
  }
})