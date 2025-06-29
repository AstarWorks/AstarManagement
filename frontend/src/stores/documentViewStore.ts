import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { DocumentSortConfig, DocumentFilterConfig } from '~/types/document'

interface DocumentViewPreferences {
  viewMode: 'grid' | 'list'
  sortConfig: DocumentSortConfig
  filterConfig: DocumentFilterConfig
  gridColumns: number
  showFilters: boolean
  showBulkActions: boolean
  pageSize: number
}

const DEFAULT_PREFERENCES: DocumentViewPreferences = {
  viewMode: 'grid',
  sortConfig: {
    field: 'modifiedDate',
    direction: 'desc'
  },
  filterConfig: {
    fileTypes: [],
    dateRange: null,
    sizeRange: null,
    tags: []
  },
  gridColumns: 4,
  showFilters: false,
  showBulkActions: false,
  pageSize: 50
}

export const useDocumentViewStore = defineStore('document-view', () => {
  // Core preferences
  const viewMode = ref<'grid' | 'list'>(DEFAULT_PREFERENCES.viewMode)
  const sortConfig = ref<DocumentSortConfig>(DEFAULT_PREFERENCES.sortConfig)
  const filterConfig = ref<DocumentFilterConfig>(DEFAULT_PREFERENCES.filterConfig)
  const gridColumns = ref(DEFAULT_PREFERENCES.gridColumns)
  const showFilters = ref(DEFAULT_PREFERENCES.showFilters)
  const showBulkActions = ref(DEFAULT_PREFERENCES.showBulkActions)
  const pageSize = ref(DEFAULT_PREFERENCES.pageSize)

  // Persistence settings
  const storageKey = 'aster-document-view-preferences'

  // Load preferences from localStorage
  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const preferences = JSON.parse(stored) as Partial<DocumentViewPreferences>
        
        // Apply stored preferences with fallbacks
        viewMode.value = preferences.viewMode || DEFAULT_PREFERENCES.viewMode
        sortConfig.value = { ...DEFAULT_PREFERENCES.sortConfig, ...preferences.sortConfig }
        filterConfig.value = { ...DEFAULT_PREFERENCES.filterConfig, ...preferences.filterConfig }
        gridColumns.value = preferences.gridColumns || DEFAULT_PREFERENCES.gridColumns
        showFilters.value = preferences.showFilters ?? DEFAULT_PREFERENCES.showFilters
        showBulkActions.value = preferences.showBulkActions ?? DEFAULT_PREFERENCES.showBulkActions
        pageSize.value = preferences.pageSize || DEFAULT_PREFERENCES.pageSize
      }
    } catch (error) {
      console.warn('Failed to load document view preferences:', error)
      resetToDefaults()
    }
  }

  // Save preferences to localStorage
  const savePreferences = () => {
    try {
      const preferences: DocumentViewPreferences = {
        viewMode: viewMode.value,
        sortConfig: sortConfig.value,
        filterConfig: filterConfig.value,
        gridColumns: gridColumns.value,
        showFilters: showFilters.value,
        showBulkActions: showBulkActions.value,
        pageSize: pageSize.value
      }
      
      localStorage.setItem(storageKey, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save document view preferences:', error)
    }
  }

  // Reset to default preferences
  const resetToDefaults = () => {
    viewMode.value = DEFAULT_PREFERENCES.viewMode
    sortConfig.value = { ...DEFAULT_PREFERENCES.sortConfig }
    filterConfig.value = { ...DEFAULT_PREFERENCES.filterConfig }
    gridColumns.value = DEFAULT_PREFERENCES.gridColumns
    showFilters.value = DEFAULT_PREFERENCES.showFilters
    showBulkActions.value = DEFAULT_PREFERENCES.showBulkActions
    pageSize.value = DEFAULT_PREFERENCES.pageSize
  }

  // Action methods
  const setViewMode = (mode: 'grid' | 'list') => {
    viewMode.value = mode
  }

  const setSortConfig = (config: DocumentSortConfig) => {
    sortConfig.value = { ...config }
  }

  const setFilterConfig = (config: DocumentFilterConfig) => {
    filterConfig.value = { ...config }
  }

  const setGridColumns = (columns: number) => {
    // Constrain columns between 1 and 8
    gridColumns.value = Math.max(1, Math.min(8, columns))
  }

  const toggleFilters = () => {
    showFilters.value = !showFilters.value
  }

  const toggleBulkActions = () => {
    showBulkActions.value = !showBulkActions.value
  }

  const setPageSize = (size: number) => {
    // Common page sizes: 25, 50, 100, 200
    const validSizes = [25, 50, 100, 200]
    pageSize.value = validSizes.includes(size) ? size : 50
  }

  // Update sort field while preserving direction
  const updateSortField = (field: keyof DocumentSortConfig['field']) => {
    sortConfig.value = {
      ...sortConfig.value,
      field
    }
  }

  // Toggle sort direction for current field
  const toggleSortDirection = () => {
    sortConfig.value = {
      ...sortConfig.value,
      direction: sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
    }
  }

  // Clear all filters
  const clearAllFilters = () => {
    filterConfig.value = { ...DEFAULT_PREFERENCES.filterConfig }
  }

  // Add file type filter
  const addFileTypeFilter = (mimeType: string) => {
    if (!filterConfig.value.fileTypes.includes(mimeType)) {
      filterConfig.value.fileTypes.push(mimeType)
    }
  }

  // Remove file type filter
  const removeFileTypeFilter = (mimeType: string) => {
    const index = filterConfig.value.fileTypes.indexOf(mimeType)
    if (index !== -1) {
      filterConfig.value.fileTypes.splice(index, 1)
    }
  }

  // Add tag filter
  const addTagFilter = (tag: string) => {
    if (!filterConfig.value.tags.includes(tag)) {
      filterConfig.value.tags.push(tag)
    }
  }

  // Remove tag filter
  const removeTagFilter = (tag: string) => {
    const index = filterConfig.value.tags.indexOf(tag)
    if (index !== -1) {
      filterConfig.value.tags.splice(index, 1)
    }
  }

  // Set date range filter
  const setDateRangeFilter = (start: Date | null, end: Date | null) => {
    filterConfig.value.dateRange = start && end ? { start, end } : null
  }

  // Set size range filter
  const setSizeRangeFilter = (min: number | null, max: number | null) => {
    filterConfig.value.sizeRange = min !== null && max !== null ? { min, max } : null
  }

  // Computed properties
  const hasActiveFilters = computed(() => {
    return filterConfig.value.fileTypes.length > 0 ||
           filterConfig.value.dateRange !== null ||
           filterConfig.value.sizeRange !== null ||
           filterConfig.value.tags.length > 0
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (filterConfig.value.fileTypes.length > 0) count++
    if (filterConfig.value.dateRange) count++
    if (filterConfig.value.sizeRange) count++
    if (filterConfig.value.tags.length > 0) count++
    return count
  })

  // Responsive grid columns based on screen size
  const getResponsiveGridColumns = (screenWidth: number) => {
    if (screenWidth < 640) return 1      // Mobile: 1 column
    if (screenWidth < 768) return 2      // Small tablet: 2 columns
    if (screenWidth < 1024) return 3     // Tablet: 3 columns
    if (screenWidth < 1280) return 4     // Desktop: 4 columns
    return Math.min(gridColumns.value, 6) // Large desktop: up to 6 columns
  }

  // Watch for changes and persist to localStorage
  watch(
    [viewMode, sortConfig, filterConfig, gridColumns, showFilters, showBulkActions, pageSize],
    () => {
      savePreferences()
    },
    { deep: true }
  )

  // Initialize store
  if (process.client) {
    loadPreferences()
  }

  return {
    // State
    viewMode: readonly(viewMode),
    sortConfig: readonly(sortConfig),
    filterConfig: readonly(filterConfig),
    gridColumns: readonly(gridColumns),
    showFilters: readonly(showFilters),
    showBulkActions: readonly(showBulkActions),
    pageSize: readonly(pageSize),

    // Computed
    hasActiveFilters,
    activeFilterCount,

    // Actions
    setViewMode,
    setSortConfig,
    setFilterConfig,
    setGridColumns,
    toggleFilters,
    toggleBulkActions,
    setPageSize,
    updateSortField,
    toggleSortDirection,
    clearAllFilters,
    addFileTypeFilter,
    removeFileTypeFilter,
    addTagFilter,
    removeTagFilter,
    setDateRangeFilter,
    setSizeRangeFilter,
    getResponsiveGridColumns,
    resetToDefaults,
    loadPreferences,
    savePreferences
  }
})

// Export types for external use
export type { DocumentViewPreferences }