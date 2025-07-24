import { ref, computed, watch } from 'vue'

export type SearchMode = 'fuzzy' | 'exact' | 'field'

export interface SearchSuggestion {
  id: string
  value: string
  field?: string
  type: 'case' | 'client' | 'lawyer' | 'tag' | 'field'
  label: string
  description?: string
  count?: number
}

export interface SearchHistory {
  id: string
  query: string
  timestamp: number
  resultCount?: number
  mode: SearchMode
}

interface SearchPerformanceMetrics {
  queryTime: number
  resultCount: number
  suggestionsTime: number
  cacheHit: boolean
}

const STORAGE_KEY = 'search-history'
const MAX_HISTORY_SIZE = 50
const DEBOUNCE_DELAY = 300
const MIN_QUERY_LENGTH = 2

/**
 * Advanced search composable with type-ahead suggestions, search modes, and history
 * Supports fuzzy search, exact matching, and field-specific queries
 */
export function useAdvancedSearch() {
  const isClient = process.client
  
  // Search state
  const query = ref('')
  const searchMode = ref<SearchMode>('fuzzy')
  const isSearching = ref(false)
  const searchHistory = ref<SearchHistory[]>([])
  const suggestions = ref<SearchSuggestion[]>([])
  const selectedSuggestionIndex = ref(-1)
  const showSuggestions = ref(false)
  const searchMetrics = ref<SearchPerformanceMetrics | null>(null)
  
  // Debouncing
  const searchTimer = ref<NodeJS.Timeout | null>(null)
  
  // Suggestion cache
  const suggestionCache = new Map<string, { suggestions: SearchSuggestion[], timestamp: number }>()
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Mock data for type-ahead suggestions (in production, this would come from APIs)
  const mockSuggestions: SearchSuggestion[] = [
    // Case numbers
    { id: 'case-1', value: 'CC-2024-001', type: 'case', label: 'CC-2024-001', description: 'Corporate Merger Case' },
    { id: 'case-2', value: 'ED-2024-002', type: 'case', label: 'ED-2024-002', description: 'Employment Dispute' },
    { id: 'case-3', value: 'RE-2024-003', type: 'case', label: 'RE-2024-003', description: 'Real Estate Transaction' },
    
    // Client names
    { id: 'client-1', value: 'ABC Corporation', type: 'client', label: 'ABC Corporation', count: 12 },
    { id: 'client-2', value: 'John Doe', type: 'client', label: 'John Doe', count: 3 },
    { id: 'client-3', value: 'Property Holdings LLC', type: 'client', label: 'Property Holdings LLC', count: 8 },
    { id: 'client-4', value: 'Tech Solutions Inc', type: 'client', label: 'Tech Solutions Inc', count: 5 },
    
    // Lawyer names
    { id: 'lawyer-1', value: 'Takeshi Yamamoto', type: 'lawyer', label: 'Takeshi Yamamoto', description: 'Corporate Law' },
    { id: 'lawyer-2', value: 'Kenji Nakamura', type: 'lawyer', label: 'Kenji Nakamura', description: 'Litigation' },
    { id: 'lawyer-3', value: 'Hiroshi Tanaka', type: 'lawyer', label: 'Hiroshi Tanaka', description: 'Family Law' },
    
    // Tags
    { id: 'tag-1', value: 'corporate', type: 'tag', label: 'corporate', count: 25 },
    { id: 'tag-2', value: 'litigation', type: 'tag', label: 'litigation', count: 18 },
    { id: 'tag-3', value: 'high-priority', type: 'tag', label: 'high-priority', count: 12 },
    { id: 'tag-4', value: 'merger', type: 'tag', label: 'merger', count: 8 },
    { id: 'tag-5', value: 'employment', type: 'tag', label: 'employment', count: 15 },
    
    // Field search patterns
    { id: 'field-1', value: 'case:', type: 'field', label: 'case:', description: 'Search by case number' },
    { id: 'field-2', value: 'client:', type: 'field', label: 'client:', description: 'Search by client name' },
    { id: 'field-3', value: 'lawyer:', type: 'field', label: 'lawyer:', description: 'Search by assigned lawyer' },
    { id: 'field-4', value: 'status:', type: 'field', label: 'status:', description: 'Search by status' },
    { id: 'field-5', value: 'priority:', type: 'field', label: 'priority:', description: 'Search by priority' },
    { id: 'field-6', value: 'tag:', type: 'field', label: 'tag:', description: 'Search by tags' }
  ]

  // Field search patterns
  const fieldPatterns = {
    case: /^case:\s*(.+)/i,
    client: /^client:\s*(.+)/i,
    lawyer: /^lawyer:\s*(.+)/i,
    status: /^status:\s*(.+)/i,
    priority: /^priority:\s*(.+)/i,
    tag: /^tag:\s*(.+)/i
  }

  // Computed properties
  const hasQuery = computed(() => query.value.trim().length >= MIN_QUERY_LENGTH)
  const isFieldSearch = computed(() => {
    const q = query.value.trim()
    return Object.values(fieldPatterns).some(pattern => pattern.test(q))
  })
  
  const parsedFieldSearch = computed(() => {
    const q = query.value.trim()
    for (const [field, pattern] of Object.entries(fieldPatterns)) {
      const match = q.match(pattern)
      if (match) {
        return {
          field,
          value: match[1].trim()
        }
      }
    }
    return null
  })

  const recentSearches = computed(() => 
    searchHistory.value
      .slice(0, 10)
      .map(history => ({
        id: `history-${history.id}`,
        value: history.query,
        type: 'field' as const,
        label: history.query,
        description: `${history.resultCount || 0} results • ${new Date(history.timestamp).toLocaleDateString()}`
      }))
  )

  /**
   * Load search history from localStorage
   */
  const loadSearchHistory = () => {
    if (!isClient) return
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        searchHistory.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }

  /**
   * Save search history to localStorage
   */
  const saveSearchHistory = () => {
    if (!isClient) return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searchHistory.value))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }

  /**
   * Add search to history
   */
  const addToHistory = (searchQuery: string, resultCount?: number) => {
    // Don't add empty queries or duplicates
    if (!searchQuery.trim()) return
    
    // Remove existing entry for same query
    searchHistory.value = searchHistory.value.filter(h => h.query !== searchQuery)
    
    // Add new entry at the beginning
    searchHistory.value.unshift({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      query: searchQuery,
      timestamp: Date.now(),
      resultCount,
      mode: searchMode.value
    })
    
    // Limit history size
    if (searchHistory.value.length > MAX_HISTORY_SIZE) {
      searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY_SIZE)
    }
    
    saveSearchHistory()
  }

  /**
   * Clear search history
   */
  const clearHistory = () => {
    searchHistory.value = []
    saveSearchHistory()
  }

  /**
   * Generate fuzzy search suggestions
   */
  const getFuzzySuggestions = (searchQuery: string): SearchSuggestion[] => {
    const queryLower = searchQuery.toLowerCase()
    
    return mockSuggestions
      .filter(suggestion => {
        // Simple fuzzy matching - contains query characters in order
        const labelLower = suggestion.label.toLowerCase()
        let queryIndex = 0
        
        for (let i = 0; i < labelLower.length && queryIndex < queryLower.length; i++) {
          if (labelLower[i] === queryLower[queryIndex]) {
            queryIndex++
          }
        }
        
        return queryIndex === queryLower.length
      })
      .slice(0, 8) // Limit suggestions
  }

  /**
   * Generate exact search suggestions
   */
  const getExactSuggestions = (searchQuery: string): SearchSuggestion[] => {
    const queryLower = searchQuery.toLowerCase()
    
    return mockSuggestions
      .filter(suggestion => 
        suggestion.label.toLowerCase().includes(queryLower) ||
        suggestion.value.toLowerCase().includes(queryLower)
      )
      .slice(0, 8)
  }

  /**
   * Generate field-specific suggestions
   */
  const getFieldSuggestions = (searchQuery: string): SearchSuggestion[] => {
    const queryLower = searchQuery.toLowerCase()
    
    // If query starts with a field pattern, show field-specific suggestions
    const fieldMatch = parsedFieldSearch.value
    if (fieldMatch) {
      const fieldType = fieldMatch.field as keyof typeof fieldPatterns
      return mockSuggestions
        .filter(suggestion => suggestion.type === fieldType)
        .filter(suggestion => 
          suggestion.label.toLowerCase().includes(fieldMatch.value.toLowerCase())
        )
        .slice(0, 8)
    }
    
    // Otherwise, show field pattern suggestions
    return mockSuggestions
      .filter(suggestion => suggestion.type === 'field')
      .filter(suggestion => 
        suggestion.value.toLowerCase().includes(queryLower)
      )
  }

  /**
   * Get suggestions with caching
   */
  const getSuggestions = async (searchQuery: string): Promise<SearchSuggestion[]> => {
    const cacheKey = `${searchMode.value}-${searchQuery.toLowerCase()}`
    const cached = suggestionCache.get(cacheKey)
    
    // Check cache
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.suggestions
    }
    
    const startTime = performance.now()
    let results: SearchSuggestion[] = []
    
    // Generate suggestions based on search mode
    switch (searchMode.value) {
      case 'fuzzy':
        results = getFuzzySuggestions(searchQuery)
        break
      case 'exact':
        results = getExactSuggestions(searchQuery)
        break
      case 'field':
        results = getFieldSuggestions(searchQuery)
        break
    }
    
    // Add recent searches if query is short
    if (searchQuery.length < 4 && recentSearches.value.length > 0) {
      results = [...recentSearches.value.slice(0, 3), ...results]
    }
    
    const suggestionsTime = performance.now() - startTime
    
    // Update metrics
    searchMetrics.value = {
      queryTime: 0, // This would be set by the actual search
      resultCount: results.length,
      suggestionsTime,
      cacheHit: false
    }
    
    // Cache results
    suggestionCache.set(cacheKey, { suggestions: results, timestamp: Date.now() })
    
    return results
  }

  /**
   * Debounced search with suggestions
   */
  const performSearch = async (searchQuery: string) => {
    if (searchTimer.value) {
      clearTimeout(searchTimer.value)
    }
    
    searchTimer.value = setTimeout(async () => {
      if (searchQuery.trim().length < MIN_QUERY_LENGTH) {
        suggestions.value = []
        showSuggestions.value = false
        return
      }
      
      isSearching.value = true
      
      try {
        suggestions.value = await getSuggestions(searchQuery)
        showSuggestions.value = suggestions.value.length > 0
        selectedSuggestionIndex.value = -1
      } catch (error) {
        console.error('Search failed:', error)
        suggestions.value = []
        showSuggestions.value = false
      } finally {
        isSearching.value = false
      }
    }, DEBOUNCE_DELAY)
  }

  /**
   * Handle keyboard navigation
   */
  const handleKeydown = (event: KeyboardEvent) => {
    if (!showSuggestions.value || suggestions.value.length === 0) return false
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedSuggestionIndex.value = Math.min(
          selectedSuggestionIndex.value + 1,
          suggestions.value.length - 1
        )
        return true
        
      case 'ArrowUp':
        event.preventDefault()
        selectedSuggestionIndex.value = Math.max(
          selectedSuggestionIndex.value - 1,
          -1
        )
        return true
        
      case 'Enter':
        event.preventDefault()
        if (selectedSuggestionIndex.value >= 0) {
          const suggestion = suggestions.value[selectedSuggestionIndex.value]
          selectSuggestion(suggestion)
        } else {
          executeSearch(query.value)
        }
        return true
        
      case 'Escape':
        event.preventDefault()
        hideSuggestions()
        return true
        
      default:
        return false
    }
  }

  /**
   * Select a suggestion
   */
  const selectSuggestion = (suggestion: SearchSuggestion) => {
    query.value = suggestion.value
    hideSuggestions()
    executeSearch(suggestion.value)
  }

  /**
   * Execute search and add to history
   */
  const executeSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return
    
    hideSuggestions()
    addToHistory(trimmedQuery)
    
    // This would trigger the actual search in the parent component
    return {
      query: trimmedQuery,
      mode: searchMode.value,
      parsedField: parsedFieldSearch.value
    }
  }

  /**
   * Hide suggestions
   */
  const hideSuggestions = () => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }

  /**
   * Toggle search mode
   */
  const toggleSearchMode = () => {
    const modes: SearchMode[] = ['fuzzy', 'exact', 'field']
    const currentIndex = modes.indexOf(searchMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    searchMode.value = modes[nextIndex]
    
    // Re-trigger search with new mode
    if (hasQuery.value) {
      performSearch(query.value)
    }
  }

  /**
   * Get search mode description
   */
  const getSearchModeDescription = (mode: SearchMode) => {
    switch (mode) {
      case 'fuzzy':
        return 'Smart search - finds partial matches'
      case 'exact':
        return 'Exact search - finds exact text matches'
      case 'field':
        return 'Field search - use "field:value" syntax'
      default:
        return ''
    }
  }

  // Watch query changes
  watch(query, (newQuery) => {
    if (newQuery.trim().length >= MIN_QUERY_LENGTH) {
      performSearch(newQuery)
    } else {
      hideSuggestions()
    }
  })

  // Initialize
  if (isClient) {
    loadSearchHistory()
  }

  return {
    // State
    query,
    searchMode,
    isSearching,
    suggestions,
    selectedSuggestionIndex,
    showSuggestions,
    searchHistory,
    searchMetrics,
    
    // Computed
    hasQuery,
    isFieldSearch,
    parsedFieldSearch,
    recentSearches,
    
    // Methods
    performSearch,
    executeSearch,
    selectSuggestion,
    hideSuggestions,
    handleKeydown,
    toggleSearchMode,
    addToHistory,
    clearHistory,
    getSearchModeDescription,
    
    // Utils
    getSuggestions
  }
}