/**
 * Case Filtering Composable
 * Handles all filtering and search logic for cases
 */

import { ref, computed } from 'vue'
import type { ICase, ICaseFilters } from '@case/types/case'

export function useCaseFilters(cases: Ref<ICase[]>) {
  // VueUse for better state management
  const filters = useLocalStorage<ICaseFilters>('kanban-filters', {
    search: '',
    clientType: 'all',
    priority: 'all',
    assignedLawyer: 'all',
    tags: [],
    dateRange: null
  })

  // Debounced search for better performance
  const searchInput = ref('')
  const debouncedSearch = refDebounced(searchInput, 300)
  
  // Sync debounced search with filters
  watch(debouncedSearch, (newValue) => {
    filters.value.search = newValue
  })

  // Computed filtered cases
  const filteredCases = computed(() => {
    let result = cases.value

    // Apply search filter
    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase()
      result = result.filter(case_ =>
        case_.title.toLowerCase().includes(searchTerm) ||
        case_.caseNumber.toLowerCase().includes(searchTerm) ||
        case_.client.name.toLowerCase().includes(searchTerm)
      )
    }

    // Apply client type filter
    if (filters.value.clientType !== 'all') {
      result = result.filter(case_ => case_.client.type === filters.value.clientType)
    }

    // Apply priority filter
    if (filters.value.priority !== 'all') {
      result = result.filter(case_ => case_.priority === filters.value.priority)
    }

    // Apply assigned lawyer filter
    if (filters.value.assignedLawyer !== 'all') {
      result = result.filter(case_ => case_.assignedLawyer === filters.value.assignedLawyer)
    }

    // Apply tag filter
    if (filters.value.tags.length > 0) {
      result = result.filter(case_ =>
        filters.value.tags.some(tag => case_.tags.includes(tag))
      )
    }

    // Apply date range filter
    if (filters.value.dateRange) {
      const { start, end } = filters.value.dateRange
      result = result.filter(case_ => {
        const dueDate = new Date(case_.dueDate)
        const startDate = start ? new Date(start) : null
        const endDate = end ? new Date(end) : null
        
        if (startDate && dueDate < startDate) return false
        if (endDate && dueDate > endDate) return false
        
        return true
      })
    }

    return result
  })

  // Filter statistics
  const filterStats = computed(() => {
    const total = cases.value.length
    const filtered = filteredCases.value.length
    const percentage = total > 0 ? Math.round((filtered / total) * 100) : 0
    
    return {
      total,
      filtered,
      percentage,
      isFiltered: filtered !== total
    }
  })

  // Active filters summary
  const activeFilters = computed(() => {
    const active: Array<{key: string, label: string, value: string}> = []
    
    if (filters.value.search) {
      active.push({
        key: 'search',
        label: 'matter.filters.activeFilters.search',
        value: filters.value.search
      })
    }
    
    if (filters.value.clientType !== 'all') {
      active.push({
        key: 'clientType',
        label: 'matter.filters.activeFilters.clientType',
        value: filters.value.clientType
      })
    }
    
    if (filters.value.priority !== 'all') {
      active.push({
        key: 'priority',
        label: 'matter.filters.activeFilters.priority',
        value: filters.value.priority
      })
    }
    
    if (filters.value.assignedLawyer !== 'all') {
      active.push({
        key: 'assignedLawyer',
        label: 'matter.filters.activeFilters.assignedLawyer',
        value: filters.value.assignedLawyer
      })
    }
    
    if (filters.value.tags.length > 0) {
      active.push({
        key: 'tags',
        label: 'matter.filters.activeFilters.tags',
        value: filters.value.tags.join(', ')
      })
    }
    
    return active
  })

  // Get unique values for filter options
  const filterOptions = computed(() => {
    const allCases = cases.value
    
    return {
      assignedLawyers: [...new Set(allCases.map(c => c.assignedLawyer))],
      tags: [...new Set(allCases.flatMap(c => c.tags))],
      clientTypes: ['individual', 'corporate'] as const,
      priorities: ['high', 'medium', 'low'] as const
    }
  })

  // Filter actions
  const applyFilters = (newFilters: ICaseFilters) => {
    filters.value = { ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      search: '',
      clientType: 'all',
      priority: 'all',
      assignedLawyer: 'all',
      tags: [],
      dateRange: null
    }
    searchInput.value = ''
  }

  const removeFilter = (filterKey: keyof ICaseFilters) => {
    switch (filterKey) {
      case 'search':
        filters.value.search = ''
        searchInput.value = ''
        break
      case 'clientType':
        filters.value.clientType = 'all'
        break
      case 'priority':
        filters.value.priority = 'all'
        break
      case 'assignedLawyer':
        filters.value.assignedLawyer = 'all'
        break
      case 'tags':
        filters.value.tags = []
        break
      case 'dateRange':
        filters.value.dateRange = null
        break
      default:
        console.warn(`Unknown filter key: ${filterKey}`)
        break
    }
  }

  const hasActiveFilters = computed(() => {
    return activeFilters.value.length > 0
  })

  // Filter cases by status (for kanban columns)
  const getCasesByStatus = (status: ICase['status']) => {
    return filteredCases.value.filter(case_ => case_.status === status)
  }

  // Search functionality
  const searchResults = computed(() => {
    if (!filters.value.search) return []
    
    return filteredCases.value.slice(0, 10) // Limit results for performance
  })

  return {
    // State
    filters,
    searchInput,
    
    // Computed
    filteredCases,
    filterStats,
    activeFilters,
    filterOptions,
    hasActiveFilters,
    searchResults,
    
    // Methods
    applyFilters,
    resetFilters,
    removeFilter,
    getCasesByStatus
  }
}