import { defineStore } from 'pinia'
import { ref, computed, readonly, watch } from 'vue'
import { debounce } from 'lodash-es'
import type { Matter, MatterStatus, MatterPriority } from '~/types/kanban'
import { useMatterStore } from './matters'

export interface SearchFilters {
  query: string
  statuses: MatterStatus[]
  priorities: MatterPriority[]
  lawyers: string[]
  clients: string[]
  tags: string[]
  dateRange: {
    from: string | null
    to: string | null
    field: 'createdAt' | 'updatedAt' | 'dueDate'
  } | null
  showClosed: boolean
}

export interface SearchSuggestion {
  id: string
  type: 'matter' | 'client' | 'lawyer' | 'tag' | 'case_number'
  text: string
  subtitle?: string
  count?: number
}

export interface SearchResult {
  matters: Matter[]
  totalCount: number
  facets: {
    statuses: Array<{ status: MatterStatus; count: number }>
    priorities: Array<{ priority: MatterPriority; count: number }>
    lawyers: Array<{ lawyer: string; count: number }>
    clients: Array<{ client: string; count: number }>
    tags: Array<{ tag: string; count: number }>
  }
  executionTime: number
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  statuses: [],
  priorities: [],
  lawyers: [],
  clients: [],
  tags: [],
  dateRange: null,
  showClosed: true
}

export const useSearchStore = defineStore('kanban-search', () => {
  // State
  const filters = ref<SearchFilters>({ ...DEFAULT_FILTERS })
  const searchResults = ref<SearchResult | null>(null)
  const searchHistory = ref<string[]>([])
  const searchSuggestions = ref<SearchSuggestion[]>([])
  const isSearching = ref(false)
  const searchError = ref<string | null>(null)
  const lastSearchTime = ref<Date | null>(null)
  const searchCache = ref(new Map<string, SearchResult>())
  
  // Advanced search state
  const isAdvancedSearchOpen = ref(false)
  const savedSearches = ref<Array<{ id: string; name: string; filters: SearchFilters }>>([])
  const quickFilters = ref<Array<{ id: string; label: string; filters: Partial<SearchFilters> }>>([
    { id: 'overdue', label: 'Overdue', filters: { dateRange: { from: null, to: new Date().toISOString().split('T')[0], field: 'dueDate' } } },
    { id: 'high-priority', label: 'High Priority', filters: { priorities: ['HIGH', 'URGENT'] } },
    { id: 'active', label: 'Active', filters: { statuses: ['IN_PROGRESS', 'REVIEW', 'WAITING_CLIENT'] } },
    { id: 'recent', label: 'Recent', filters: { dateRange: { from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], to: null, field: 'createdAt' } } }
  ])

  // Search execution with caching
  const executeSearch = async (searchFilters: SearchFilters, useCache = true): Promise<SearchResult> => {
    const cacheKey = JSON.stringify(searchFilters)
    
    // Check cache first
    if (useCache && searchCache.value.has(cacheKey)) {
      return searchCache.value.get(cacheKey)!
    }

    const startTime = performance.now()
    
    try {
      // TODO: Replace with actual API call
      // const response = await $fetch<SearchResult>('/api/search/matters', {
      //   method: 'POST',
      //   body: searchFilters
      // })
      
      // Simulate API search
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
      
      const result = performClientSideSearch(searchFilters)
      const executionTime = performance.now() - startTime
      
      const searchResult: SearchResult = {
        ...result,
        executionTime
      }
      
      // Cache result
      searchCache.value.set(cacheKey, searchResult)
      
      // Limit cache size
      if (searchCache.value.size > 50) {
        const firstKey = searchCache.value.keys().next().value
        if (firstKey) {
          searchCache.value.delete(firstKey)
        }
      }
      
      return searchResult
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Client-side search implementation (for demo)
  const performClientSideSearch = (searchFilters: SearchFilters): Omit<SearchResult, 'executionTime'> => {
    // Get matters from matter store
    const { matters } = useMatterStore()
    let filteredMatters = [...matters]

    // Apply text search
    if (searchFilters.query.trim()) {
      const query = searchFilters.query.toLowerCase()
      filteredMatters = filteredMatters.filter(matter => {
        const searchableText = [
          matter.title,
          matter.caseNumber,
          matter.clientName,
          matter.opponentName,
          matter.description,
          typeof matter.assignedLawyer === 'string' ? matter.assignedLawyer : (matter.assignedLawyer as any)?.name,
          typeof matter.assignedClerk === 'string' ? matter.assignedClerk : (matter.assignedClerk as any)?.name,
          ...(matter.tags || [])
        ].filter(Boolean).join(' ').toLowerCase()
        
        return searchableText.includes(query)
      })
    }

    // Apply status filters
    if (searchFilters.statuses.length > 0) {
      filteredMatters = filteredMatters.filter(matter => 
        searchFilters.statuses.includes(matter.status)
      )
    }

    // Apply priority filters
    if (searchFilters.priorities.length > 0) {
      filteredMatters = filteredMatters.filter(matter =>
        searchFilters.priorities.includes(matter.priority)
      )
    }

    // Apply lawyer filters
    if (searchFilters.lawyers.length > 0) {
      filteredMatters = filteredMatters.filter(matter =>
        matter.assignedLawyer && typeof matter.assignedLawyer === 'object' && searchFilters.lawyers.includes(matter.assignedLawyer.id)
      )
    }

    // Apply client filters
    if (searchFilters.clients.length > 0) {
      filteredMatters = filteredMatters.filter(matter =>
        searchFilters.clients.includes(matter.clientName)
      )
    }

    // Apply tag filters
    if (searchFilters.tags.length > 0) {
      filteredMatters = filteredMatters.filter(matter =>
        matter.tags && searchFilters.tags.some(tag => matter.tags!.includes(tag))
      )
    }

    // Apply date range filters
    if (searchFilters.dateRange) {
      const { from, to, field } = searchFilters.dateRange
      filteredMatters = filteredMatters.filter(matter => {
        const dateValue = matter[field]
        if (!dateValue) return false
        
        const matterDate = new Date(dateValue)
        
        if (from && matterDate < new Date(from)) return false
        if (to && matterDate > new Date(to)) return false
        
        return true
      })
    }

    // Apply closed filter
    if (!searchFilters.showClosed) {
      filteredMatters = filteredMatters.filter(matter =>
        !['COMPLETED', 'CLOSED', 'CANCELLED', 'ARCHIVED'].includes(matter.status)
      )
    }

    // Generate facets
    const facets = {
      statuses: generateFacetCounts(filteredMatters, 'status'),
      priorities: generateFacetCounts(filteredMatters, 'priority'),
      lawyers: filteredMatters
        .filter(m => m.assignedLawyer)
        .reduce((acc, m) => {
          const lawyer = typeof m.assignedLawyer === 'string' ? m.assignedLawyer : m.assignedLawyer!.name
          acc[lawyer] = (acc[lawyer] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      clients: generateFacetCounts(filteredMatters, 'clientName'),
      tags: filteredMatters
        .flatMap(m => m.tags || [])
        .reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1
          return acc
        }, {} as Record<string, number>)
    }

    return {
      matters: filteredMatters,
      totalCount: filteredMatters.length,
      facets: {
        statuses: Object.entries(facets.statuses).map(([status, count]) => ({ status: status as MatterStatus, count: count as number })),
        priorities: Object.entries(facets.priorities).map(([priority, count]) => ({ priority: priority as MatterPriority, count: count as number })),
        lawyers: Object.entries(facets.lawyers).map(([lawyer, count]) => ({ lawyer, count: count as number })),
        clients: Object.entries(facets.clients).map(([client, count]) => ({ client, count: count as number })),
        tags: Object.entries(facets.tags).map(([tag, count]) => ({ tag, count: count as number }))
      }
    }
  }

  const generateFacetCounts = (matters: Matter[], field: keyof Matter): Record<string, number> => {
    return matters.reduce((acc, matter) => {
      const value = matter[field] as string
      if (value) {
        acc[value] = (acc[value] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  }

  // Debounced search function
  const debouncedSearch = debounce(async (searchFilters: SearchFilters) => {
    if (!hasActiveFilters(searchFilters)) {
      searchResults.value = null
      return
    }

    isSearching.value = true
    searchError.value = null

    try {
      const result = await executeSearch(searchFilters)
      searchResults.value = result
      lastSearchTime.value = new Date()

      // Add to search history if there's a query
      if (searchFilters.query.trim() && !searchHistory.value.includes(searchFilters.query)) {
        searchHistory.value.unshift(searchFilters.query)
        if (searchHistory.value.length > 20) {
          searchHistory.value = searchHistory.value.slice(0, 20)
        }
      }
    } catch (error) {
      searchError.value = error instanceof Error ? error.message : 'Search failed'
    } finally {
      isSearching.value = false
    }
  }, 300)

  // Search suggestions
  const generateSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
    if (!query.trim() || query.length < 2) return []

    const { matters } = useMatterStore()
    const suggestions: SearchSuggestion[] = []
    const lowercaseQuery = query.toLowerCase()

    // Matter title suggestions
    matters
      .filter((m: Matter) => m.title.toLowerCase().includes(lowercaseQuery))
      .slice(0, 5)
      .forEach((matter: Matter) => {
        suggestions.push({
          id: `matter-${matter.id}`,
          type: 'matter',
          text: matter.title,
          subtitle: matter.caseNumber
        })
      })

    // Client suggestions
    const clients = [...new Set(matters.map((m: Matter) => m.clientName))]
      .filter((client: string) => client.toLowerCase().includes(lowercaseQuery))
      .slice(0, 3)
    
    clients.forEach((client: string) => {
      const count = matters.filter((m: Matter) => m.clientName === client).length
      suggestions.push({
        id: `client-${client}`,
        type: 'client',
        text: client,
        count
      })
    })

    // Lawyer suggestions
    const lawyers = [...new Set(matters.filter((m: Matter) => m.assignedLawyer).map((m: Matter) => 
      typeof m.assignedLawyer === 'string' ? m.assignedLawyer : m.assignedLawyer!.name
    ))]
      .filter((lawyer: string) => lawyer.toLowerCase().includes(lowercaseQuery))
      .slice(0, 3)
    
    lawyers.forEach((lawyer: string) => {
      const count = matters.filter((m: Matter) => {
        const lawyerName = typeof m.assignedLawyer === 'string' ? m.assignedLawyer : m.assignedLawyer?.name
        return lawyerName === lawyer
      }).length
      suggestions.push({
        id: `lawyer-${lawyer}`,
        type: 'lawyer',
        text: lawyer,
        count
      })
    })

    // Case number suggestions
    matters
      .filter((m: Matter) => m.caseNumber.toLowerCase().includes(lowercaseQuery))
      .slice(0, 3)
      .forEach((matter: Matter) => {
        suggestions.push({
          id: `case-${matter.id}`,
          type: 'case_number',
          text: matter.caseNumber,
          subtitle: matter.title
        })
      })

    return suggestions
  }

  // Actions
  const performSearch = (newFilters?: Partial<SearchFilters>) => {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }
    debouncedSearch(filters.value)
  }

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
    performSearch()
  }

  const clearSearch = () => {
    filters.value = { ...DEFAULT_FILTERS }
    searchResults.value = null
    searchError.value = null
    isSearching.value = false
  }

  const clearSearchHistory = () => {
    searchHistory.value = []
  }

  const removeFromHistory = (query: string) => {
    const index = searchHistory.value.indexOf(query)
    if (index !== -1) {
      searchHistory.value.splice(index, 1)
    }
  }

  const toggleAdvancedSearch = () => {
    isAdvancedSearchOpen.value = !isAdvancedSearchOpen.value
  }

  const applyQuickFilter = (filterId: string) => {
    const quickFilter = quickFilters.value.find(f => f.id === filterId)
    if (quickFilter) {
      updateFilters(quickFilter.filters)
    }
  }

  const saveSearch = (name: string) => {
    const searchId = `search-${Date.now()}`
    savedSearches.value.push({
      id: searchId,
      name,
      filters: { ...filters.value }
    })
  }

  const loadSavedSearch = (searchId: string) => {
    const savedSearch = savedSearches.value.find(s => s.id === searchId)
    if (savedSearch) {
      filters.value = { ...savedSearch.filters }
      performSearch()
    }
  }

  const deleteSavedSearch = (searchId: string) => {
    const index = savedSearches.value.findIndex(s => s.id === searchId)
    if (index !== -1) {
      savedSearches.value.splice(index, 1)
    }
  }

  // Auto-suggest on query change
  const debouncedGenerateSuggestions = debounce(async (query: string) => {
    if (query.trim().length >= 2) {
      searchSuggestions.value = await generateSuggestions(query)
    } else {
      searchSuggestions.value = []
    }
  }, 150)

  watch(
    () => filters.value.query,
    (newQuery) => {
      debouncedGenerateSuggestions(newQuery)
    }
  )

  // Helper functions
  const hasActiveFilters = (searchFilters: SearchFilters): boolean => {
    return !!(
      searchFilters.query.trim() ||
      searchFilters.statuses.length > 0 ||
      searchFilters.priorities.length > 0 ||
      searchFilters.lawyers.length > 0 ||
      searchFilters.clients.length > 0 ||
      searchFilters.tags.length > 0 ||
      searchFilters.dateRange ||
      !searchFilters.showClosed
    )
  }

  // Getters
  const hasActiveSearch = computed(() => hasActiveFilters(filters.value))
  const hasResults = computed(() => searchResults.value && searchResults.value.totalCount > 0)
  const resultCount = computed(() => searchResults.value?.totalCount || 0)
  const searchFacets = computed(() => searchResults.value?.facets)
  const isAdvancedFilterActive = computed(() => {
    const { query, ...otherFilters } = filters.value
    return hasActiveFilters({ query: '', ...otherFilters })
  })

  return {
    // State (readonly)
    filters: readonly(filters),
    searchResults: readonly(searchResults),
    searchHistory: readonly(searchHistory),
    searchSuggestions: readonly(searchSuggestions),
    isSearching: readonly(isSearching),
    searchError: readonly(searchError),
    lastSearchTime: readonly(lastSearchTime),
    isAdvancedSearchOpen: readonly(isAdvancedSearchOpen),
    savedSearches: readonly(savedSearches),
    quickFilters: readonly(quickFilters),

    // Actions
    performSearch,
    updateFilters,
    clearSearch,
    clearSearchHistory,
    removeFromHistory,
    toggleAdvancedSearch,
    applyQuickFilter,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    generateSuggestions,

    // Getters
    hasActiveSearch,
    hasResults,
    resultCount,
    searchFacets,
    isAdvancedFilterActive
  }
})