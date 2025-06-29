import { ref, computed, watch, nextTick } from 'vue'
import { watchDebounced, useMagicKeys, whenever } from '@vueuse/core'
import type { Matter, SearchSuggestion, FilterState } from '~/types/matter'

export const useAdvancedSearch = () => {
  const searchQuery = ref('')
  const searchResults = ref<Matter[]>([])
  const suggestions = ref<SearchSuggestion[]>([])
  const isSearching = ref(false)
  const searchMode = ref<'fuzzy' | 'exact' | 'field'>('fuzzy')
  const showSuggestions = ref(false)
  const selectedSuggestionIndex = ref(-1)
  
  // Search statistics
  const searchStats = ref({
    totalQueries: 0,
    averageQueryTime: 0,
    lastQueryTime: 0
  })

  // Field search patterns for parsing advanced queries
  const fieldPatterns = {
    case: /case:(\S+)/gi,
    client: /client:("[^"]+"|[\w-]+)/gi,
    lawyer: /lawyer:("[^"]+"|[\w\s]+)/gi,
    status: /status:(\w+)/gi,
    priority: /priority:(\w+)/gi,
    tag: /tag:(\w+)/gi
  }

  // Parse field-specific search queries
  const parseSearchQuery = (query: string) => {
    const parsedQuery = {
      fields: {} as Record<string, string[]>,
      freeText: query
    }
    
    // Extract field queries
    Object.entries(fieldPatterns).forEach(([field, pattern]) => {
      const matches = Array.from(query.matchAll(pattern))
      if (matches.length > 0) {
        parsedQuery.fields[field] = matches.map(match => 
          match[1].replace(/"/g, '').trim()
        )
        // Remove field queries from free text
        parsedQuery.freeText = parsedQuery.freeText.replace(pattern, '').trim()
      }
    })
    
    return parsedQuery
  }

  // Fuzzy search matching
  const performFuzzySearch = async (query: string, matters: Matter[]): Promise<Matter[]> => {
    const startTime = performance.now()
    
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0)
    
    const results = matters.filter(matter => {
      const searchableText = [
        matter.title,
        matter.description,
        matter.clientName,
        matter.opponentName,
        matter.assignedLawyer,
        ...(matter.tags || [])
      ].join(' ').toLowerCase()
      
      return queryWords.some(word => 
        searchableText.includes(word) ||
        word.length > 2 && searchableText.includes(word.slice(0, -1)) // Partial match
      )
    })

    // Update search stats
    const queryTime = performance.now() - startTime
    updateSearchStats(queryTime)
    
    return results
  }

  // Exact search matching
  const performExactSearch = async (query: string, matters: Matter[]): Promise<Matter[]> => {
    const startTime = performance.now()
    
    const exactQuery = query.replace(/"/g, '').toLowerCase()
    
    const results = matters.filter(matter => {
      const searchableText = [
        matter.title,
        matter.description,
        matter.clientName,
        matter.opponentName,
        matter.assignedLawyer,
        ...(matter.tags || [])
      ].join(' ').toLowerCase()
      
      return searchableText.includes(exactQuery)
    })

    const queryTime = performance.now() - startTime
    updateSearchStats(queryTime)
    
    return results
  }

  // Field-specific search
  const performFieldSearch = async (query: string, matters: Matter[]): Promise<Matter[]> => {
    const startTime = performance.now()
    
    const parsedQuery = parseSearchQuery(query)
    
    const results = matters.filter(matter => {
      // Check field-specific matches
      for (const [field, values] of Object.entries(parsedQuery.fields)) {
        const fieldMatches = values.some(value => {
          switch (field) {
            case 'case':
              return matter.caseNumber.toLowerCase().includes(value.toLowerCase())
            case 'client':
              return matter.clientName.toLowerCase().includes(value.toLowerCase())
            case 'lawyer':
              const lawyerName = typeof matter.assignedLawyer === 'string' ? matter.assignedLawyer : matter.assignedLawyer?.name
              return lawyerName?.toLowerCase().includes(value.toLowerCase())
            case 'status':
              return matter.status.toLowerCase() === value.toLowerCase()
            case 'priority':
              return matter.priority.toLowerCase() === value.toLowerCase()
            case 'tag':
              return matter.tags?.some(tag => 
                tag.toLowerCase().includes(value.toLowerCase())
              )
            default:
              return false
          }
        })
        
        if (!fieldMatches) return false
      }
      
      // Check free text if present
      if (parsedQuery.freeText) {
        const freeTextMatches = [
          matter.title,
          matter.description,
          matter.clientName
        ].some(text => 
          text?.toLowerCase().includes(parsedQuery.freeText.toLowerCase())
        )
        
        if (!freeTextMatches) return false
      }
      
      return true
    })

    const queryTime = performance.now() - startTime
    updateSearchStats(queryTime)
    
    return results
  }

  // Update search statistics
  const updateSearchStats = (queryTime: number) => {
    searchStats.value.totalQueries++
    searchStats.value.lastQueryTime = queryTime
    
    // Calculate rolling average
    const { totalQueries, averageQueryTime } = searchStats.value
    searchStats.value.averageQueryTime = 
      (averageQueryTime * (totalQueries - 1) + queryTime) / totalQueries
  }

  // Main search execution
  const performSearch = async (query: string, matters: Matter[]): Promise<Matter[]> => {
    if (!query.trim()) {
      searchResults.value = []
      return []
    }

    isSearching.value = true
    
    try {
      let results: Matter[] = []
      
      if (searchMode.value === 'field' && query.includes(':')) {
        results = await performFieldSearch(query, matters)
      } else if (searchMode.value === 'exact' && query.startsWith('"')) {
        results = await performExactSearch(query, matters)
      } else {
        results = await performFuzzySearch(query, matters)
      }
      
      searchResults.value = results
      return results
    } finally {
      isSearching.value = false
    }
  }

  // Generate search suggestions
  const generateSuggestions = async (query: string, matters: Matter[]): Promise<SearchSuggestion[]> => {
    if (!query.trim() || query.length < 2) {
      return []
    }

    const queryLower = query.toLowerCase()
    const suggestionMap = new Map<string, SearchSuggestion>()

    // Collect suggestions from different sources
    matters.forEach(matter => {
      // Case numbers
      if (matter.caseNumber.toLowerCase().includes(queryLower)) {
        const key = `case-${matter.caseNumber}`
        suggestionMap.set(key, {
          id: key,
          value: matter.caseNumber,
          type: 'case',
          count: 1,
          category: 'Case Numbers'
        })
      }

      // Client names
      if (matter.clientName.toLowerCase().includes(queryLower)) {
        const key = `client-${matter.clientName}`
        const existing = suggestionMap.get(key)
        if (existing) {
          existing.count++
        } else {
          suggestionMap.set(key, {
            id: key,
            value: matter.clientName,
            type: 'client',
            count: 1,
            category: 'Clients'
          })
        }
      }

      // Lawyers
      const lawyerName = typeof matter.assignedLawyer === 'string' ? matter.assignedLawyer : matter.assignedLawyer?.name
      if (lawyerName?.toLowerCase().includes(queryLower)) {
        const key = `lawyer-${lawyerName}`
        const existing = suggestionMap.get(key)
        if (existing) {
          existing.count++
        } else {
          suggestionMap.set(key, {
            id: key,
            value: lawyerName,
            type: 'lawyer',
            count: 1,
            category: 'Lawyers'
          })
        }
      }

      // Tags
      matter.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          const key = `tag-${tag}`
          const existing = suggestionMap.get(key)
          if (existing) {
            existing.count++
          } else {
            suggestionMap.set(key, {
              id: key,
              value: tag,
              type: 'tag',
              count: 1,
              category: 'Tags'
            })
          }
        }
      })
    })

    // Convert to array and sort by relevance
    return Array.from(suggestionMap.values())
      .sort((a, b) => {
        // Sort by count (descending), then alphabetically
        if (a.count !== b.count) {
          return b.count - a.count
        }
        return a.value.localeCompare(b.value)
      })
      .slice(0, 10) // Limit to top 10 suggestions
  }

  // Debounced search execution
  watchDebounced(
    searchQuery,
    async (query) => {
      if (!query.trim()) {
        searchResults.value = []
        suggestions.value = []
        showSuggestions.value = false
        return
      }
      
      if (query.length >= 2) {
        // Get matters from store (this would be injected from parent)
        // For now, using empty array - parent component will handle this
        await performSearch(query, [])
      }
    },
    { debounce: 300 }
  )

  // Separate debounced suggestions
  watchDebounced(
    searchQuery,
    async (query) => {
      if (query.length >= 2) {
        suggestions.value = await generateSuggestions(query, [])
        showSuggestions.value = suggestions.value.length > 0
      } else {
        suggestions.value = []
        showSuggestions.value = false
      }
    },
    { debounce: 150 }
  )

  // Keyboard navigation for suggestions
  const { ArrowDown, ArrowUp, Enter, Escape } = useMagicKeys()
  
  whenever(ArrowDown, () => {
    if (showSuggestions.value && suggestions.value.length > 0) {
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        suggestions.value.length - 1
      )
    }
  })
  
  whenever(ArrowUp, () => {
    if (showSuggestions.value) {
      selectedSuggestionIndex.value = Math.max(
        selectedSuggestionIndex.value - 1,
        -1
      )
    }
  })
  
  whenever(Enter, () => {
    if (showSuggestions.value && selectedSuggestionIndex.value >= 0) {
      const selected = suggestions.value[selectedSuggestionIndex.value]
      selectSuggestion(selected)
    }
  })
  
  whenever(Escape, () => {
    hideSuggestions()
  })

  // Suggestion selection
  const selectSuggestion = (suggestion: SearchSuggestion) => {
    searchQuery.value = suggestion.value
    hideSuggestions()
    nextTick(() => {
      // Trigger search with the selected suggestion
      performSearch(suggestion.value, [])
    })
  }

  // Hide suggestions
  const hideSuggestions = () => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }

  // Clear search
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    suggestions.value = []
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }

  // Search mode helpers
  const setSearchMode = (mode: 'fuzzy' | 'exact' | 'field') => {
    searchMode.value = mode
    // Re-trigger search if there's a query
    if (searchQuery.value.trim()) {
      performSearch(searchQuery.value, [])
    }
  }

  // Computed properties
  const hasActiveSearch = computed(() => searchQuery.value.length > 0)
  const hasResults = computed(() => searchResults.value.length > 0)
  const isFieldSearch = computed(() => searchMode.value === 'field')
  const isExactSearch = computed(() => searchMode.value === 'exact')
  const isFuzzySearch = computed(() => searchMode.value === 'fuzzy')

  return {
    // State
    searchQuery,
    searchResults,
    suggestions,
    isSearching,
    searchMode,
    showSuggestions,
    selectedSuggestionIndex,
    searchStats,
    
    // Actions
    performSearch,
    generateSuggestions,
    selectSuggestion,
    hideSuggestions,
    clearSearch,
    setSearchMode,
    parseSearchQuery,
    
    // Computed
    hasActiveSearch,
    hasResults,
    isFieldSearch,
    isExactSearch,
    isFuzzySearch
  }
}