import { ref, watch, computed } from 'vue'
import type { FilterState, FilterValue } from '~/components/matter/filters/FilterConfig'

const STORAGE_KEY = 'matter-filters'
const STORAGE_VERSION = '1.0'

interface PersistedFilterState {
  version: string
  timestamp: number
  filters: FilterState
}

/**
 * Composable for persisting matter filter state to localStorage
 * Provides automatic save/restore with version management and expiration
 */
export function useMatterFilterPersistence() {
  const isClient = process.client
  
  // Default filter state
  const defaultState: FilterState = {
    filters: [],
    quickSearch: '',
    sortBy: 'createdAt',
    sortDirection: 'desc'
  }

  // Current filter state
  const filterState = ref<FilterState>({ ...defaultState })
  
  // Persistence settings
  const persistenceEnabled = ref(true)
  const autoSave = ref(true)
  const expireAfterDays = ref(30)

  /**
   * Serialize filter state for storage
   */
  const serializeState = (state: FilterState): string => {
    const persistedState: PersistedFilterState = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      filters: {
        ...state,
        // Convert Date objects to ISO strings for serialization
        filters: state.filters.map(filter => ({
          ...filter,
          value: filter.value instanceof Date 
            ? filter.value.toISOString()
            : Array.isArray(filter.value) && filter.value.some(v => v instanceof Date)
            ? filter.value.map(v => v instanceof Date ? v.toISOString() : v)
            : filter.value
        }))
      }
    }
    
    return JSON.stringify(persistedState)
  }

  /**
   * Deserialize filter state from storage
   */
  const deserializeState = (data: string): FilterState | null => {
    try {
      const parsed: PersistedFilterState = JSON.parse(data)
      
      // Check version compatibility
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Filter state version mismatch, ignoring stored state')
        return null
      }
      
      // Check expiration
      const daysSinceStored = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24)
      if (daysSinceStored > expireAfterDays.value) {
        console.log('Filter state expired, using defaults')
        return null
      }
      
      // Restore Date objects
      const restoredState: FilterState = {
        ...parsed.filters,
        filters: parsed.filters.filters.map(filter => ({
          ...filter,
          value: 
            // Handle date range arrays
            Array.isArray(filter.value) && filter.value.length === 2 && 
            typeof filter.value[0] === 'string' && typeof filter.value[1] === 'string' &&
            (filter.field === 'dueDate' || filter.field === 'createdAt')
              ? [new Date(filter.value[0]), new Date(filter.value[1])]
            // Handle single date strings
            : typeof filter.value === 'string' && 
              (filter.field === 'dueDate' || filter.field === 'createdAt')
              ? new Date(filter.value)
            : filter.value
        }))
      }
      
      return restoredState
    } catch (error) {
      console.error('Failed to deserialize filter state:', error)
      return null
    }
  }

  /**
   * Save current filter state to localStorage
   */
  const saveToStorage = () => {
    if (!isClient || !persistenceEnabled.value) return
    
    try {
      const serialized = serializeState(filterState.value)
      localStorage.setItem(STORAGE_KEY, serialized)
    } catch (error) {
      console.error('Failed to save filter state:', error)
    }
  }

  /**
   * Load filter state from localStorage
   */
  const loadFromStorage = (): FilterState => {
    if (!isClient || !persistenceEnabled.value) return { ...defaultState }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return { ...defaultState }
      
      const restored = deserializeState(stored)
      return restored || { ...defaultState }
    } catch (error) {
      console.error('Failed to load filter state:', error)
      return { ...defaultState }
    }
  }

  /**
   * Clear stored filter state
   */
  const clearStorage = () => {
    if (!isClient) return
    
    try {
      localStorage.removeItem(STORAGE_KEY)
      filterState.value = { ...defaultState }
    } catch (error) {
      console.error('Failed to clear filter state:', error)
    }
  }

  /**
   * Reset to default state (but keep persistence settings)
   */
  const resetToDefaults = () => {
    filterState.value = { ...defaultState }
    if (autoSave.value) {
      saveToStorage()
    }
  }

  /**
   * Update filter state (with optional immediate save)
   */
  const updateFilterState = (newState: FilterState, saveImmediately = false) => {
    filterState.value = newState
    
    if (saveImmediately || autoSave.value) {
      saveToStorage()
    }
  }

  /**
   * Add a single filter
   */
  const addFilter = (filter: FilterValue) => {
    // Remove existing filter for the same field
    const existingIndex = filterState.value.filters.findIndex(f => f.field === filter.field)
    if (existingIndex >= 0) {
      filterState.value.filters.splice(existingIndex, 1)
    }
    
    // Add new filter
    filterState.value.filters.push(filter)
    
    if (autoSave.value) {
      saveToStorage()
    }
  }

  /**
   * Remove a filter by field
   */
  const removeFilter = (field: string) => {
    filterState.value.filters = filterState.value.filters.filter(f => f.field !== field)
    
    if (autoSave.value) {
      saveToStorage()
    }
  }

  /**
   * Clear all filters but keep search and sort
   */
  const clearFilters = () => {
    filterState.value.filters = []
    
    if (autoSave.value) {
      saveToStorage()
    }
  }

  // Computed properties
  const hasActiveFilters = computed(() => 
    filterState.value.filters.length > 0 || !!filterState.value.quickSearch
  )

  const activeFilterCount = computed(() => 
    filterState.value.filters.length + (filterState.value.quickSearch ? 1 : 0)
  )

  const isDefaultState = computed(() => {
    return JSON.stringify(filterState.value) === JSON.stringify(defaultState)
  })

  // Watch for changes and auto-save
  if (isClient && autoSave.value) {
    watch(filterState, () => {
      if (persistenceEnabled.value) {
        saveToStorage()
      }
    }, { deep: true })
  }

  // Initialize state on creation (client-side only)
  if (isClient) {
    const stored = loadFromStorage()
    filterState.value = stored
  }

  return {
    // State
    filterState,
    persistenceEnabled,
    autoSave,
    expireAfterDays,
    
    // Computed
    hasActiveFilters,
    activeFilterCount,
    isDefaultState,
    
    // Methods
    saveToStorage,
    loadFromStorage,
    clearStorage,
    resetToDefaults,
    updateFilterState,
    addFilter,
    removeFilter,
    clearFilters,
    
    // Utils
    serializeState,
    deserializeState
  }
}