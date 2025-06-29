import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { Matter, FilterState, ViewPreferences, MatterStatus } from '~/types/matter'
import { useKanbanStore as useModularKanbanStore } from './kanban/index'

// Legacy store for backward compatibility
// TODO: Remove after migration to modular stores is complete
export const useKanbanStore = defineStore('kanban', () => {
  // Delegate to the new modular store system
  const modularStore = useModularKanbanStore()
  
  // Legacy API compatibility layer
  const matters = computed(() => modularStore.matters)
  const isLoading = computed(() => modularStore.stores.matters.isLoading)
  const error = computed(() => modularStore.stores.matters.error)
  
  // Map old filter structure to new search structure
  const filters = computed({
    get: () => {
      const searchFilters = modularStore.stores.search.filters
      return {
        searchQuery: searchFilters.query,
        selectedLawyers: searchFilters.lawyers,
        selectedPriorities: searchFilters.priorities,
        selectedStatuses: searchFilters.statuses,
        showClosed: searchFilters.showClosed
      }
    },
    set: (newFilters: FilterState) => {
      modularStore.stores.search.updateFilters({
        query: newFilters.searchQuery,
        lawyers: newFilters.selectedLawyers,
        priorities: newFilters.selectedPriorities,
        statuses: newFilters.selectedStatuses,
        showClosed: newFilters.showClosed
      })
    }
  })
  
  const viewPreferences = computed({
    get: () => modularStore.viewPreferences,
    set: (prefs: ViewPreferences) => {
      modularStore.actions.updateViewPreferences(prefs)
    }
  })

  // Legacy computed properties with delegation to new stores
  const filteredMatters = computed(() => {
    // Use the new modular search system
    if (modularStore.stores.search.hasActiveSearch && modularStore.stores.search.searchResults) {
      return modularStore.stores.search.searchResults.matters
    }
    return modularStore.matters
  })

  const mattersByStatus = computed(() => modularStore.mattersByStatus)

  // Legacy actions with delegation to new stores
  const setFilters = (newFilters: Partial<FilterState>) => {
    modularStore.stores.search.updateFilters({
      query: newFilters.searchQuery || '',
      lawyers: newFilters.selectedLawyers || [],
      priorities: newFilters.selectedPriorities || [],
      statuses: newFilters.selectedStatuses || [],
      showClosed: newFilters.showClosed ?? true
    })
  }

  const setViewPreferences = (newPrefs: Partial<ViewPreferences>) => {
    modularStore.actions.updateViewPreferences(newPrefs)
  }

  const updateMatter = async (id: string, updates: Partial<Matter>) => {
    return await modularStore.actions.updateMatter(id, updates)
  }

  const moveMatter = async (matterId: string, newStatus: MatterStatus) => {
    return await modularStore.actions.moveMatter(matterId, newStatus)
  }

  const loadMatters = async () => {
    return await modularStore.actions.loadMatters()
  }

  return {
    // State (delegated to modular stores)
    matters,
    filters,
    viewPreferences,
    isLoading,
    error,
    
    // Getters (delegated to modular stores)
    filteredMatters,
    mattersByStatus,
    
    // Actions (delegated to modular stores)
    setFilters,
    setViewPreferences,
    updateMatter,
    moveMatter,
    loadMatters,
    
    // New modular store access for migration
    _modularStore: modularStore
  }
})