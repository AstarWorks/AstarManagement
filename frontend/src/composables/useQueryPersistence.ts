/**
 * Simple Query Persistence Utilities
 * 
 * @description Basic query persistence using localStorage for filter preferences
 * and simple caching patterns for T11_S08 Advanced Queries Search.
 * 
 * @author Claude
 * @created 2025-06-26
 * @updated 2025-06-26 (T11_S08 - Advanced Queries Search)
 */

import { ref, computed, toRaw } from 'vue'
import type { MatterFilters } from '~/types/query'

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

/**
 * Storage keys for localStorage
 */
const STORAGE_KEYS = {
  FILTER_PREFERENCES: 'aster-filter-preferences',
  SEARCH_HISTORY: 'aster-search-history'
} as const

/**
 * Check if localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = 'test'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// BASIC PERSISTENCE UTILITIES
// ============================================================================

/**
 * Simple localStorage wrapper with error handling
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const isSupported = ref(isLocalStorageAvailable())
  
  const storedValue = ref<T>(defaultValue)
  
  // Initialize value from localStorage
  if (isSupported.value) {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        storedValue.value = JSON.parse(item)
      }
    } catch (error) {
      console.warn(`Failed to parse localStorage item "${key}":`, error)
      storedValue.value = defaultValue
    }
  }
  
  const setValue = (value: T) => {
    storedValue.value = value
    
    if (isSupported.value) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to set localStorage item "${key}":`, error)
      }
    }
  }
  
  const removeValue = () => {
    storedValue.value = defaultValue
    
    if (isSupported.value) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove localStorage item "${key}":`, error)
      }
    }
  }
  
  return {
    value: storedValue,
    setValue,
    removeValue,
    isSupported
  }
}

// ============================================================================
// FILTER PREFERENCES
// ============================================================================

/**
 * Filter preferences persistence
 */
export function useFilterPersistence(userId: string) {
  const { $fetch } = useNuxtApp()
  
  const storageKey = `${STORAGE_KEYS.FILTER_PREFERENCES}-${userId}`
  const localStorage = useLocalStorage<MatterFilters>(storageKey, {
    search: '',
    status: '',
    priority: '',
    assigneeId: '',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    tags: []
  })
  
  /**
   * Save filter preferences locally and attempt server sync
   */
  const saveFilters = async (filters: MatterFilters, name = 'default') => {
    // Always save locally first
    localStorage.setValue(filters)
    
    // Attempt server sync (optional)
    try {
      await $fetch('/api/user/filter-preferences', {
        method: 'POST',
        body: {
          name,
          filters,
          isDefault: name === 'default'
        }
      })
    } catch (error) {
      console.warn('Failed to sync filter preferences to server:', error)
      // Continue with local storage only
    }
  }
  
  /**
   * Load filter preferences from local storage with server fallback
   */
  const loadFilters = async (name = 'default'): Promise<MatterFilters | null> => {
    // Try local storage first
    if (localStorage.value.value) {
      return localStorage.value.value
    }
    
    // Fallback to server if available
    try {
      const response = await $fetch<{ filters: MatterFilters }>('/api/user/filter-preferences', {
        query: { name }
      })
      
      // Cache server response locally
      if (response?.filters) {
        localStorage.setValue(response.filters)
        return response.filters
      }
    } catch (error) {
      console.warn('Failed to load filter preferences from server:', error)
    }
    
    return null
  }
  
  return {
    saveFilters,
    loadFilters,
    isSupported: localStorage.isSupported
  }
}

// ============================================================================
// SEARCH HISTORY
// ============================================================================

/**
 * Search history persistence
 */
export function useSearchHistory(maxEntries = 10) {
  const localStorage = useLocalStorage<string[]>(STORAGE_KEYS.SEARCH_HISTORY, [])
  
  /**
   * Add search term to history
   */
  const addSearch = (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return
    
    const currentHistory = localStorage.value.value
    const updatedHistory = [
      searchTerm,
      ...currentHistory.filter(term => term !== searchTerm)
    ].slice(0, maxEntries)
    
    localStorage.setValue(updatedHistory)
  }
  
  /**
   * Remove search term from history
   */
  const removeSearch = (searchTerm: string) => {
    const currentHistory = localStorage.value.value
    const updatedHistory = currentHistory.filter(term => term !== searchTerm)
    localStorage.setValue(updatedHistory)
  }
  
  /**
   * Clear all search history
   */
  const clearHistory = () => {
    localStorage.setValue([])
  }
  
  return {
    history: computed(() => localStorage.value.value),
    addSearch,
    removeSearch,
    clearHistory,
    isSupported: localStorage.isSupported
  }
}

// ============================================================================
// BASIC CACHE UTILITIES
// ============================================================================

/**
 * Simple query result caching for offline support
 */
export function useSimpleQueryCache<T>(cacheKey: string, maxAge = 5 * 60 * 1000) {
  interface CacheEntry<T> {
    data: T
    timestamp: number
    expires: number
  }
  
  const localStorage = useLocalStorage<CacheEntry<T> | null>(`cache-${cacheKey}`, null)
  
  /**
   * Set cached data
   */
  const setCache = (data: T) => {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expires: now + maxAge
    }
    localStorage.setValue(entry)
  }
  
  /**
   * Get cached data if not expired
   */
  const getCache = (): T | null => {
    const entry = localStorage.value.value
    
    if (!entry) return null
    
    const now = Date.now()
    if (now > entry.expires) {
      // Expired, remove from cache
      localStorage.removeValue()
      return null
    }
    
    return toRaw(entry.data) as T
  }
  
  /**
   * Check if cache has valid data
   */
  const hasValidCache = (): boolean => {
    const entry = localStorage.value.value
    if (!entry) return false
    
    return Date.now() <= entry.expires
  }
  
  return {
    setCache,
    getCache,
    hasValidCache,
    clearCache: localStorage.removeValue,
    isSupported: localStorage.isSupported
  }
}