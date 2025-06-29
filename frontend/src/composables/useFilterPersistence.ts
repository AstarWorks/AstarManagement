import { ref, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LocationQueryValue } from 'vue-router'
import type { FilterState, FilterValue, FilterPreset } from '~/components/matter/filters/FilterConfig'

export interface FilterPersistenceOptions {
  /** Key for localStorage persistence */
  storageKey?: string
  /** Enable URL synchronization */
  syncWithUrl?: boolean
  /** URL parameter prefix */
  urlPrefix?: string
  /** Enable localStorage persistence */
  persistToStorage?: boolean
  /** Debounce time for URL updates (ms) */
  urlUpdateDebounce?: number
  /** Enable cross-tab synchronization */
  crossTabSync?: boolean
}

export function useFilterPersistence(options: FilterPersistenceOptions = {}) {
  const {
    storageKey = 'filters',
    syncWithUrl = true,
    urlPrefix = 'f_',
    persistToStorage = true,
    urlUpdateDebounce = 300,
    crossTabSync = true
  } = options

  const route = useRoute()
  const router = useRouter()

  // Filter state
  const filterState = ref<FilterState>({
    filters: [],
    quickSearch: '',
    activePreset: undefined,
    sortBy: undefined,
    sortDirection: 'asc'
  })

  // Saved presets
  const savedPresets = ref<FilterPreset[]>([])

  // Loading state
  const isLoading = ref(false)

  // URL update timeout
  let urlUpdateTimeout: NodeJS.Timeout | null = null

  /**
   * Serialize filter state to URL-safe format
   */
  const serializeFilters = (filters: FilterValue[]): string => {
    if (filters.length === 0) return ''
    
    try {
      const serialized = filters.map(filter => ({
        f: filter.field,
        o: filter.operator,
        v: filter.value
      }))
      return btoa(JSON.stringify(serialized))
    } catch (error) {
      console.warn('Failed to serialize filters:', error)
      return ''
    }
  }

  /**
   * Deserialize filters from URL format
   */
  const deserializeFilters = (serialized: string): FilterValue[] => {
    if (!serialized) return []
    
    try {
      const decoded = atob(serialized)
      const parsed = JSON.parse(decoded)
      
      return parsed.map((item: any) => ({
        field: item.f,
        operator: item.o,
        value: item.v
      }))
    } catch (error) {
      console.warn('Failed to deserialize filters:', error)
      return []
    }
  }

  /**
   * Load filters from URL parameters
   */
  const loadFromUrl = (): Partial<FilterState> => {
    if (!syncWithUrl) return {}

    const query = route.query
    const state: Partial<FilterState> = {}

    // Load filters
    const filtersParam = query[`${urlPrefix}filters`] as string
    if (filtersParam) {
      state.filters = deserializeFilters(filtersParam)
    }

    // Load quick search
    const quickSearchParam = query[`${urlPrefix}q`] as string
    if (quickSearchParam) {
      state.quickSearch = quickSearchParam
    }

    // Load active preset
    const presetParam = query[`${urlPrefix}preset`] as string
    if (presetParam) {
      state.activePreset = presetParam
    }

    // Load sort
    const sortByParam = query[`${urlPrefix}sort`] as string
    const sortDirParam = query[`${urlPrefix}dir`] as string
    if (sortByParam) {
      state.sortBy = sortByParam
      state.sortDirection = sortDirParam === 'desc' ? 'desc' : 'asc'
    }

    return state
  }

  /**
   * Save filters to URL parameters
   */
  const saveToUrl = (state: FilterState): void => {
    if (!syncWithUrl) return

    const query = { ...route.query }

    // Update filters
    if (state.filters && state.filters.length > 0) {
      query[`${urlPrefix}filters`] = serializeFilters(state.filters)
    } else {
      delete query[`${urlPrefix}filters`]
    }

    // Update quick search
    if (state.quickSearch) {
      query[`${urlPrefix}q`] = state.quickSearch
    } else {
      delete query[`${urlPrefix}q`]
    }

    // Update active preset
    if (state.activePreset) {
      query[`${urlPrefix}preset`] = state.activePreset
    } else {
      delete query[`${urlPrefix}preset`]
    }

    // Update sort
    if (state.sortBy) {
      query[`${urlPrefix}sort`] = state.sortBy
      query[`${urlPrefix}dir`] = state.sortDirection || 'asc'
    } else {
      delete query[`${urlPrefix}sort`]
      delete query[`${urlPrefix}dir`]
    }

    // Update URL without navigation
    router.replace({ query }).catch(() => {
      // Ignore navigation errors (e.g., duplicate navigation)
    })
  }

  /**
   * Load filters from localStorage
   */
  const loadFromStorage = (): Partial<FilterState> => {
    if (!persistToStorage || typeof window === 'undefined') return {}

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error)
    }

    return {}
  }

  /**
   * Save filters to localStorage
   */
  const saveToStorage = (state: FilterState): void => {
    if (!persistToStorage || typeof window === 'undefined') return

    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error)
    }
  }

  /**
   * Load saved presets from localStorage
   */
  const loadPresets = (): FilterPreset[] => {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(`${storageKey}-presets`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load presets from localStorage:', error)
    }

    return []
  }

  /**
   * Save presets to localStorage
   */
  const savePresets = (presets: FilterPreset[]): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(`${storageKey}-presets`, JSON.stringify(presets))
    } catch (error) {
      console.warn('Failed to save presets to localStorage:', error)
    }
  }

  /**
   * Initialize filter state from URL and storage
   */
  const initializeFilters = async (): Promise<void> => {
    isLoading.value = true

    try {
      // Load saved presets
      savedPresets.value = loadPresets()

      // Priority: URL > localStorage
      const urlState = loadFromUrl()
      const storageState = loadFromStorage()

      // Merge states (URL takes precedence)
      const initialState: FilterState = {
        filters: urlState.filters || storageState.filters || [],
        quickSearch: urlState.quickSearch || storageState.quickSearch || '',
        activePreset: urlState.activePreset || storageState.activePreset,
        sortBy: urlState.sortBy || storageState.sortBy,
        sortDirection: urlState.sortDirection || storageState.sortDirection || 'asc'
      }

      filterState.value = initialState

      // If we loaded from storage but not URL, update URL
      if (Object.keys(urlState).length === 0 && Object.keys(storageState).length > 0) {
        await nextTick()
        saveToUrl(initialState)
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update filter state
   */
  const updateFilters = (newState: Partial<FilterState>): void => {
    filterState.value = {
      ...filterState.value,
      ...newState
    }
  }

  /**
   * Clear all filters
   */
  const clearFilters = (): void => {
    filterState.value = {
      filters: [],
      quickSearch: '',
      activePreset: undefined,
      sortBy: undefined,
      sortDirection: 'asc'
    }
  }

  /**
   * Save current state as preset
   */
  const saveAsPreset = (name: string, description?: string): FilterPreset => {
    const preset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      description,
      filters: [...filterState.value.filters],
      createdAt: new Date().toISOString(),
      isDefault: false
    }

    savedPresets.value.push(preset)
    savePresets(savedPresets.value)

    return preset
  }

  /**
   * Apply a preset
   */
  const applyPreset = (preset: FilterPreset): void => {
    updateFilters({
      filters: [...preset.filters],
      activePreset: preset.id,
      quickSearch: '', // Reset quick search when applying preset
      sortBy: filterState.value.sortBy, // Keep current sort
      sortDirection: filterState.value.sortDirection
    })
  }

  /**
   * Delete a preset
   */
  const deletePreset = (presetId: string): void => {
    savedPresets.value = savedPresets.value.filter(p => p.id !== presetId)
    savePresets(savedPresets.value)

    // Clear active preset if it was deleted
    if (filterState.value.activePreset === presetId) {
      updateFilters({ activePreset: undefined })
    }
  }

  /**
   * Generate shareable URL
   */
  const getShareableUrl = (): string => {
    if (typeof window === 'undefined') return ''
    
    const url = new URL(window.location.href)
    const state = filterState.value

    // Clear existing filter params
    Object.keys(url.searchParams).forEach(key => {
      if (key.startsWith(urlPrefix)) {
        url.searchParams.delete(key)
      }
    })

    // Add current filter state
    if (state.filters.length > 0) {
      url.searchParams.set(`${urlPrefix}filters`, serializeFilters(state.filters))
    }
    if (state.quickSearch) {
      url.searchParams.set(`${urlPrefix}q`, state.quickSearch)
    }
    if (state.activePreset) {
      url.searchParams.set(`${urlPrefix}preset`, state.activePreset)
    }
    if (state.sortBy) {
      url.searchParams.set(`${urlPrefix}sort`, state.sortBy)
      url.searchParams.set(`${urlPrefix}dir`, state.sortDirection || 'asc')
    }

    return url.toString()
  }

  // Watch for filter state changes and persist
  watch(filterState, (newState) => {
    // Debounced URL update
    if (urlUpdateTimeout) {
      clearTimeout(urlUpdateTimeout)
    }
    urlUpdateTimeout = setTimeout(() => {
      saveToUrl(newState)
    }, urlUpdateDebounce)

    // Immediate storage update
    saveToStorage(newState)
  }, { deep: true })

  // Cross-tab synchronization
  if (crossTabSync && typeof window !== 'undefined') {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue)
          filterState.value = newState
        } catch (error) {
          console.warn('Failed to sync filters across tabs:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Cleanup on unmount would be handled by the component
  }

  // Computed properties
  const hasActiveFilters = computed(() => 
    filterState.value.filters.length > 0 || 
    (filterState.value.quickSearch && filterState.value.quickSearch.length > 0)
  )

  const activePreset = computed(() => 
    savedPresets.value.find(p => p.id === filterState.value.activePreset)
  )

  return {
    // State
    filterState: readonly(filterState),
    savedPresets: readonly(savedPresets),
    isLoading: readonly(isLoading),

    // Computed
    hasActiveFilters,
    activePreset,

    // Methods
    initializeFilters,
    updateFilters,
    clearFilters,
    saveAsPreset,
    applyPreset,
    deletePreset,
    getShareableUrl,

    // For manual persistence control
    saveToUrl: () => saveToUrl(filterState.value),
    loadFromUrl,
    saveToStorage: () => saveToStorage(filterState.value),
    loadFromStorage
  }
}