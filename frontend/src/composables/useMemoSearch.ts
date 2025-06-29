// Advanced memo search composable for T04_S13

import { ref, computed, watch } from 'vue'
import { debounce } from 'lodash-es'
import type { MemoSearchSuggestion } from '~/types/memo'

export interface SearchFieldConfig {
  field: string
  operator: string
  example: string
  description: string
}

export function useMemoSearch() {
  const searchQuery = ref('')
  const searchMode = ref<'simple' | 'advanced'>('simple')
  const suggestions = ref<MemoSearchSuggestion[]>([])
  const showSuggestions = ref(false)
  const isSearching = ref(false)

  // Search field configurations
  const searchFields: SearchFieldConfig[] = [
    {
      field: 'recipient',
      operator: ':',
      example: 'recipient:john.doe@example.com',
      description: 'Search by recipient name or email'
    },
    {
      field: 'status',
      operator: ':',
      example: 'status:sent',
      description: 'Filter by memo status (draft, sent, read, archived)'
    },
    {
      field: 'priority',
      operator: ':',
      example: 'priority:high',
      description: 'Filter by priority level'
    },
    {
      field: 'date',
      operator: '>',
      example: 'date:>2024-01-01',
      description: 'Filter by date (>, <, >=, <=, =)'
    },
    {
      field: 'tag',
      operator: ':',
      example: 'tag:urgent',
      description: 'Search by tags'
    },
    {
      field: 'case',
      operator: ':',
      example: 'case:CASE-2024-001',
      description: 'Filter by case number'
    },
    {
      field: 'attachments',
      operator: ':',
      example: 'attachments:true',
      description: 'Filter memos with/without attachments'
    }
  ]

  // Parse advanced search query
  const parseSearchQuery = (query: string) => {
    const filters: Record<string, any> = {}
    const parts = query.split(/\s+/)
    
    for (const part of parts) {
      // Check for field:value patterns
      const fieldMatch = part.match(/^(\w+):(.+)$/)
      if (fieldMatch) {
        const [, field, value] = fieldMatch
        
        // Handle different field types
        switch (field) {
          case 'status':
          case 'priority':
          case 'tag':
            if (!filters[field]) filters[field] = []
            filters[field].push(value)
            break
          case 'date':
            // Handle date operators (>, <, >=, <=, =)
            const dateMatch = value.match(/^([><=]+)?(.+)$/)
            if (dateMatch) {
              const [, operator = '=', dateValue] = dateMatch
              filters.dateFilter = { operator, value: dateValue }
            }
            break
          case 'attachments':
            filters.hasAttachments = value.toLowerCase() === 'true'
            break
          default:
            filters[field] = value
        }
      } else {
        // Regular search term
        if (!filters.search) filters.search = []
        filters.search.push(part)
      }
    }
    
    // Join search terms
    if (filters.search) {
      filters.search = filters.search.join(' ')
    }
    
    return filters
  }

  // Generate search suggestions
  const generateSuggestions = async (query: string): Promise<MemoSearchSuggestion[]> => {
    if (!query || query.length < 2) return []
    
    // Mock suggestions - in real app, this would call an API
    const mockSuggestions: MemoSearchSuggestion[] = [
      {
        id: '1',
        type: 'recipient',
        value: 'john.doe@example.com',
        count: 5,
        highlight: query
      },
      {
        id: '2',
        type: 'tag',
        value: 'urgent',
        count: 12,
        highlight: query
      },
      {
        id: '3',
        type: 'case',
        value: 'CASE-2024-001',
        count: 3,
        highlight: query
      },
      {
        id: '4',
        type: 'subject',
        value: 'Contract Review',
        count: 8,
        highlight: query
      }
    ]
    
    return mockSuggestions.filter(s => 
      s.value.toLowerCase().includes(query.toLowerCase())
    )
  }

  // Debounced search function
  const debouncedSearch = debounce(async (query: string) => {
    if (!query) {
      suggestions.value = []
      showSuggestions.value = false
      return
    }
    
    isSearching.value = true
    try {
      suggestions.value = await generateSuggestions(query)
      showSuggestions.value = suggestions.value.length > 0
    } catch (error) {
      console.error('Search suggestions error:', error)
      suggestions.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)

  // Watch search query changes
  watch(searchQuery, (newQuery) => {
    debouncedSearch(newQuery)
  })

  // Parsed filters computed property
  const parsedFilters = computed(() => {
    if (searchMode.value === 'simple') {
      return { search: searchQuery.value }
    }
    return parseSearchQuery(searchQuery.value)
  })

  // Search helpers for UI
  const getFieldSuggestions = (field: string) => {
    return suggestions.value.filter(s => s.type === field)
  }

  const insertSearchField = (field: SearchFieldConfig) => {
    const currentQuery = searchQuery.value
    const newTerm = field.example
    
    if (currentQuery) {
      searchQuery.value = `${currentQuery} ${newTerm}`
    } else {
      searchQuery.value = newTerm
    }
  }

  const selectSuggestion = (suggestion: MemoSearchSuggestion) => {
    const currentQuery = searchQuery.value
    const fieldPrefix = `${suggestion.type}:`
    
    // Replace or add the field value
    if (currentQuery.includes(fieldPrefix)) {
      const regex = new RegExp(`${fieldPrefix}\\S+`, 'g')
      searchQuery.value = currentQuery.replace(regex, `${fieldPrefix}${suggestion.value}`)
    } else {
      searchQuery.value = currentQuery ? 
        `${currentQuery} ${fieldPrefix}${suggestion.value}` : 
        `${fieldPrefix}${suggestion.value}`
    }
    
    showSuggestions.value = false
  }

  const clearSearch = () => {
    searchQuery.value = ''
    suggestions.value = []
    showSuggestions.value = false
  }

  const toggleSearchMode = () => {
    searchMode.value = searchMode.value === 'simple' ? 'advanced' : 'simple'
    if (searchMode.value === 'simple') {
      // Clear advanced syntax when switching to simple mode
      const parsed = parseSearchQuery(searchQuery.value)
      searchQuery.value = parsed.search || ''
    }
  }

  return {
    searchQuery,
    searchMode,
    suggestions,
    showSuggestions,
    isSearching,
    searchFields,
    parsedFilters,
    generateSuggestions,
    getFieldSuggestions,
    insertSearchField,
    selectSuggestion,
    clearSearch,
    toggleSearchMode,
    parseSearchQuery
  }
}