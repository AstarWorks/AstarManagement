import { ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { FilterState, Priority, MatterStatus } from '~/types/matter'

export const useFilterPersistence = (persistenceKey = 'kanban-filters') => {
  // Default filter state
  const defaultFilters: FilterState = {
    searchQuery: '',
    selectedLawyers: [],
    selectedPriorities: [],
    selectedStatuses: [],
    showClosed: true,
    searchMode: 'fuzzy'
  }

  // Persisted filters with localStorage
  const persistedFilters = useLocalStorage<FilterState>(persistenceKey, defaultFilters, {
    serializer: {
      read: (value: any) => {
        try {
          if (typeof value === 'string') {
            const parsed = JSON.parse(value)
            // Ensure all required fields are present with defaults
            return {
              ...defaultFilters,
              ...parsed,
              // Ensure date objects are properly deserialized
              dateRange: parsed.dateRange ? {
                start: new Date(parsed.dateRange.start),
                end: new Date(parsed.dateRange.end)
              } : undefined
            }
          }
          return value
        } catch (error) {
          console.warn('Failed to parse persisted filters:', error)
          return defaultFilters
        }
      },
      write: (value: any) => {
        try {
          return JSON.stringify(value, (key, val) => {
            // Serialize dates as ISO strings
            if (val instanceof Date) {
              return val.toISOString()
            }
            return val
          })
        } catch (error) {
          console.warn('Failed to serialize filters:', error)
          return JSON.stringify(defaultFilters)
        }
      }
    }
  })

  // Local reactive state for form inputs
  const currentFilters = ref<FilterState>({ ...persistedFilters.value })

  // Filter history for undo/redo functionality
  const filterHistory = useLocalStorage<FilterState[]>(`${persistenceKey}-history`, [], {
    serializer: {
      read: (value: any) => {
        try {
          return typeof value === 'string' ? JSON.parse(value) : value || []
        } catch {
          return []
        }
      },
      write: (value: any) => JSON.stringify(value)
    }
  })

  const historyIndex = ref(filterHistory.value.length - 1)

  // Watch for changes and persist
  watch(
    currentFilters,
    (newFilters) => {
      persistedFilters.value = { ...newFilters }
      
      // Add to history if it's a meaningful change
      if (hasSignificantChange(newFilters)) {
        addToHistory(newFilters)
      }
    },
    { deep: true }
  )

  // Check if the change is significant enough to add to history
  const hasSignificantChange = (newFilters: FilterState): boolean => {
    const lastFilter = filterHistory.value[filterHistory.value.length - 1]
    if (!lastFilter) return true
    
    // Check if any meaningful field has changed
    return (
      lastFilter.searchQuery !== newFilters.searchQuery ||
      lastFilter.selectedLawyers.length !== newFilters.selectedLawyers.length ||
      lastFilter.selectedPriorities.length !== newFilters.selectedPriorities.length ||
      lastFilter.selectedStatuses.length !== newFilters.selectedStatuses.length ||
      lastFilter.showClosed !== newFilters.showClosed ||
      lastFilter.searchMode !== newFilters.searchMode
    )
  }

  // Add filter state to history
  const addToHistory = (filters: FilterState) => {
    const newHistory = [...filterHistory.value]
    
    // Remove any entries after current index (for redo scenarios)
    if (historyIndex.value < newHistory.length - 1) {
      newHistory.splice(historyIndex.value + 1)
    }
    
    // Add new filter state
    newHistory.push({ ...filters })
    
    // Limit history size
    if (newHistory.length > 20) {
      newHistory.shift()
    } else {
      historyIndex.value = newHistory.length - 1
    }
    
    filterHistory.value = newHistory
  }

  // Load filters from persistence
  const loadFilters = (): FilterState => {
    return { ...persistedFilters.value }
  }

  // Save current filters to persistence
  const saveFilters = (filters: FilterState) => {
    currentFilters.value = { ...filters }
  }

  // Reset filters to default state
  const resetFilters = () => {
    const resetState = { ...defaultFilters }
    currentFilters.value = resetState
    addToHistory(resetState)
  }

  // Clear all filters but maintain persistence
  const clearFilters = () => {
    resetFilters()
  }

  // Apply specific filter updates
  const updateFilters = (updates: Partial<FilterState>) => {
    currentFilters.value = {
      ...currentFilters.value,
      ...updates
    }
  }

  // Undo last filter change
  const undoFilter = (): boolean => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      currentFilters.value = { ...filterHistory.value[historyIndex.value] }
      return true
    }
    return false
  }

  // Redo filter change
  const redoFilter = (): boolean => {
    if (historyIndex.value < filterHistory.value.length - 1) {
      historyIndex.value++
      currentFilters.value = { ...filterHistory.value[historyIndex.value] }
      return true
    }
    return false
  }

  // Check if undo is available
  const canUndo = ref(false)
  const canRedo = ref(false)

  watch(historyIndex, (index) => {
    canUndo.value = index > 0
    canRedo.value = index < filterHistory.value.length - 1
  }, { immediate: true })

  // Filter presets management
  const presets = useLocalStorage<Record<string, FilterState>>(`${persistenceKey}-presets`, {})

  // Save current filters as a preset
  const savePreset = (name: string, filters?: FilterState) => {
    const filtersToSave = filters || currentFilters.value
    presets.value = {
      ...presets.value,
      [name]: { ...filtersToSave }
    }
  }

  // Load a preset
  const loadPreset = (name: string): boolean => {
    const preset = presets.value[name]
    if (preset) {
      currentFilters.value = { ...preset }
      return true
    }
    return false
  }

  // Delete a preset
  const deletePreset = (name: string) => {
    const newPresets = { ...presets.value }
    delete newPresets[name]
    presets.value = newPresets
  }

  // Get available preset names
  const getPresetNames = (): string[] => {
    return Object.keys(presets.value)
  }

  // Export filters for sharing
  const exportFilters = (filters?: FilterState): string => {
    const filtersToExport = filters || currentFilters.value
    return btoa(JSON.stringify(filtersToExport))
  }

  // Import filters from shared string
  const importFilters = (encodedFilters: string): boolean => {
    try {
      const decoded = atob(encodedFilters)
      const imported = JSON.parse(decoded) as FilterState
      
      // Validate imported filters
      if (isValidFilterState(imported)) {
        currentFilters.value = { ...defaultFilters, ...imported }
        return true
      }
    } catch (error) {
      console.warn('Failed to import filters:', error)
    }
    return false
  }

  // Validate filter state structure
  const isValidFilterState = (filters: any): filters is FilterState => {
    return (
      typeof filters === 'object' &&
      typeof filters.searchQuery === 'string' &&
      Array.isArray(filters.selectedLawyers) &&
      Array.isArray(filters.selectedPriorities) &&
      Array.isArray(filters.selectedStatuses) &&
      typeof filters.showClosed === 'boolean' &&
      ['fuzzy', 'exact', 'field'].includes(filters.searchMode)
    )
  }

  // Quick filter toggles
  const toggleLawyer = (lawyerId: string) => {
    const lawyers = [...currentFilters.value.selectedLawyers]
    const index = lawyers.indexOf(lawyerId)
    
    if (index >= 0) {
      lawyers.splice(index, 1)
    } else {
      lawyers.push(lawyerId)
    }
    
    updateFilters({ selectedLawyers: lawyers })
  }

  const togglePriority = (priority: Priority) => {
    const priorities = [...currentFilters.value.selectedPriorities]
    const index = priorities.indexOf(priority)
    
    if (index >= 0) {
      priorities.splice(index, 1)
    } else {
      priorities.push(priority)
    }
    
    updateFilters({ selectedPriorities: priorities })
  }

  const toggleStatus = (status: MatterStatus) => {
    const statuses = [...currentFilters.value.selectedStatuses]
    const index = statuses.indexOf(status)
    
    if (index >= 0) {
      statuses.splice(index, 1)
    } else {
      statuses.push(status)
    }
    
    updateFilters({ selectedStatuses: statuses })
  }

  return {
    // State
    currentFilters,
    persistedFilters,
    filterHistory,
    canUndo,
    canRedo,
    presets,
    
    // Actions
    loadFilters,
    saveFilters,
    resetFilters,
    clearFilters,
    updateFilters,
    undoFilter,
    redoFilter,
    
    // Preset management
    savePreset,
    loadPreset,
    deletePreset,
    getPresetNames,
    
    // Import/Export
    exportFilters,
    importFilters,
    
    // Quick toggles
    toggleLawyer,
    togglePriority,
    toggleStatus
  }
}