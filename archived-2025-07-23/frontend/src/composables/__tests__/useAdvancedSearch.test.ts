import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useAdvancedSearch } from '../useAdvancedSearch'
import type { Matter, SearchSuggestion } from '~/types/matter'
import type { MatterStatus, MatterPriority } from '~/types/kanban'

// Mock VueUse composables
const mockWatchDebounced = vi.fn()
const mockUseMagicKeys = vi.fn(() => ({
  ArrowDown: { value: false },
  ArrowUp: { value: false },
  Enter: { value: false },
  Escape: { value: false }
}))
const mockWhenever = vi.fn()

vi.mock('@vueuse/core', () => ({
  watchDebounced: mockWatchDebounced,
  useMagicKeys: mockUseMagicKeys,
  whenever: mockWhenever
}))

// Sample test data
const sampleMatters: Matter[] = [
  {
    id: '1',
    caseNumber: 'CASE-001',
    title: 'Contract Dispute - ABC Corp',
    description: 'Commercial contract dispute involving payment terms',
    clientName: 'ABC Corporation',
    opponentName: 'XYZ Company',
    assignedLawyer: 'John Smith',
    status: 'IN_PROGRESS' as MatterStatus,
    priority: 'HIGH' as MatterPriority,
    dueDate: '2024-01-15',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
    tags: ['commercial', 'contract', 'dispute']
  },
  {
    id: '2',
    caseNumber: 'CASE-002',
    title: 'Personal Injury - Road Accident',
    description: 'Motor vehicle accident resulting in personal injury',
    clientName: 'Jane Doe',
    opponentName: 'Insurance Company',
    assignedLawyer: 'Sarah Johnson',
    status: 'INTAKE' as MatterStatus,
    priority: 'MEDIUM' as MatterPriority,
    dueDate: '2024-01-20',
    createdAt: '2024-01-05T09:00:00Z',
    updatedAt: '2024-01-08T11:15:00Z',
    tags: ['personal-injury', 'accident']
  },
  {
    id: '3',
    caseNumber: 'CASE-003',
    title: 'Employment Dispute - Termination',
    description: 'Wrongful termination case',
    clientName: 'Robert Brown',
    opponentName: 'Corporate Inc',
    assignedLawyer: 'John Smith',
    status: 'REVIEW' as MatterStatus,
    priority: 'LOW' as MatterPriority,
    dueDate: '2024-02-01',
    createdAt: '2024-01-12T14:00:00Z',
    updatedAt: '2024-01-15T09:45:00Z',
    tags: ['employment', 'termination']
  }
]

describe('useAdvancedSearch', () => {
  let searchComposable: ReturnType<typeof useAdvancedSearch>

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockImplementation(() => 1000)
    
    searchComposable = useAdvancedSearch()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(searchComposable.searchQuery.value).toBe('')
      expect(searchComposable.searchResults.value).toEqual([])
      expect(searchComposable.suggestions.value).toEqual([])
      expect(searchComposable.isSearching.value).toBe(false)
      expect(searchComposable.searchMode.value).toBe('fuzzy')
      expect(searchComposable.showSuggestions.value).toBe(false)
      expect(searchComposable.selectedSuggestionIndex.value).toBe(-1)
    })

    it('should initialize search statistics', () => {
      expect(searchComposable.searchStats.value.totalQueries).toBe(0)
      expect(searchComposable.searchStats.value.averageQueryTime).toBe(0)
      expect(searchComposable.searchStats.value.lastQueryTime).toBe(0)
    })
  })

  describe('Search Query Parsing', () => {
    it('should parse field-specific search queries', () => {
      const query = 'case:CASE-001 client:"ABC Corporation" lawyer:Smith status:active'
      const parsed = searchComposable.parseSearchQuery(query)
      
      expect(parsed.fields.case).toEqual(['CASE-001'])
      expect(parsed.fields.client).toEqual(['ABC Corporation'])
      expect(parsed.fields.lawyer).toEqual(['Smith'])
      expect(parsed.fields.status).toEqual(['active'])
    })

    it('should handle mixed field and free text search', () => {
      const query = 'contract case:CASE-001 dispute'
      const parsed = searchComposable.parseSearchQuery(query)
      
      expect(parsed.fields.case).toEqual(['CASE-001'])
      expect(parsed.freeText).toBe('contract  dispute')
    })

    it('should handle quotes in field values', () => {
      const query = 'client:"ABC Corporation" lawyer:"John Smith"'
      const parsed = searchComposable.parseSearchQuery(query)
      
      expect(parsed.fields.client).toEqual(['ABC Corporation'])
      expect(parsed.fields.lawyer).toEqual(['John Smith'])
    })

    it('should handle empty or invalid queries', () => {
      const parsed = searchComposable.parseSearchQuery('')
      
      expect(parsed.fields).toEqual({})
      expect(parsed.freeText).toBe('')
    })
  })

  describe('Fuzzy Search', () => {
    it('should perform fuzzy search and return matching matters', async () => {
      const results = await searchComposable.performSearch('contract', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('1')
      expect(results[0].title).toContain('Contract')
    })

    it('should match partial words in fuzzy search', async () => {
      const results = await searchComposable.performSearch('corp', sampleMatters)
      
      expect(results).toHaveLength(2) // ABC Corporation and Corporate Inc
      expect(results.some(r => r.clientName === 'ABC Corporation')).toBe(true)
      expect(results.some(r => r.opponentName === 'Corporate Inc')).toBe(true)
    })

    it('should be case insensitive', async () => {
      const results = await searchComposable.performSearch('ABC', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].clientName).toBe('ABC Corporation')
    })

    it('should search across multiple fields', async () => {
      const results = await searchComposable.performSearch('john', sampleMatters)
      
      expect(results).toHaveLength(2) // Two matters assigned to John Smith
      expect(results.every(r => r.assignedLawyer === 'John Smith')).toBe(true)
    })

    it('should search in tags', async () => {
      const results = await searchComposable.performSearch('commercial', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].tags).toContain('commercial')
    })
  })

  describe('Exact Search', () => {
    it('should perform exact search with quotes', async () => {
      searchComposable.setSearchMode('exact')
      const results = await searchComposable.performSearch('"Contract Dispute"', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].title).toContain('Contract Dispute')
    })

    it('should not match partial phrases in exact search', async () => {
      searchComposable.setSearchMode('exact')
      const results = await searchComposable.performSearch('"Contract ABC"', sampleMatters)
      
      expect(results).toHaveLength(0)
    })

    it('should handle exact search without quotes', async () => {
      searchComposable.setSearchMode('exact')
      const results = await searchComposable.performSearch('ABC Corporation', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].clientName).toBe('ABC Corporation')
    })
  })

  describe('Field Search', () => {
    it('should search by case number field', async () => {
      searchComposable.setSearchMode('field')
      const results = await searchComposable.performSearch('case:CASE-001', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].caseNumber).toBe('CASE-001')
    })

    it('should search by client field', async () => {
      searchComposable.setSearchMode('field')
      const results = await searchComposable.performSearch('client:ABC', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].clientName).toBe('ABC Corporation')
    })

    it('should search by lawyer field', async () => {
      searchComposable.setSearchMode('field')
      const results = await searchComposable.performSearch('lawyer:John', sampleMatters)
      
      expect(results).toHaveLength(2)
      expect(results.every(r => r.assignedLawyer === 'John Smith')).toBe(true)
    })

    it('should search by status field', async () => {
      searchComposable.setSearchMode('field')
      const results = await searchComposable.performSearch('status:new', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].status).toBe('new')
    })

    it('should search by priority field', async () => {
      searchComposable.setSearchMode('field')
      const results = await searchComposable.performSearch('priority:high', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].priority).toBe('high')
    })

    it('should search by tag field', async () => {
      searchComposable.setSearchMode('field')
      const results = await searchComposable.performSearch('tag:commercial', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].tags).toContain('commercial')
    })

    it('should combine field search with free text', async () => {
      searchComposable.setSearchMode('field')
      const results = await searchComposable.performSearch('case:CASE-001 dispute', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].caseNumber).toBe('CASE-001')
      expect(results[0].title).toContain('Dispute')
    })

    it('should handle multiple field conditions', async () => {
      searchComposable.setSearchMode('field')
      const results = await searchComposable.performSearch('lawyer:John priority:high', sampleMatters)
      
      expect(results).toHaveLength(1)
      expect(results[0].assignedLawyer).toBe('John Smith')
      expect(results[0].priority).toBe('high')
    })
  })

  describe('Search Suggestions', () => {
    it('should generate suggestions for case numbers', async () => {
      const suggestions = await searchComposable.generateSuggestions('CASE', sampleMatters)
      
      expect(suggestions).toHaveLength(3)
      expect(suggestions.every(s => s.type === 'case')).toBe(true)
      expect(suggestions.every(s => s.value.startsWith('CASE-'))).toBe(true)
    })

    it('should generate suggestions for client names', async () => {
      const suggestions = await searchComposable.generateSuggestions('ABC', sampleMatters)
      
      const clientSuggestions = suggestions.filter(s => s.type === 'client')
      expect(clientSuggestions).toHaveLength(1)
      expect(clientSuggestions[0].value).toBe('ABC Corporation')
      expect(clientSuggestions[0].count).toBe(1)
    })

    it('should generate suggestions for lawyers', async () => {
      const suggestions = await searchComposable.generateSuggestions('john', sampleMatters)
      
      const lawyerSuggestions = suggestions.filter(s => s.type === 'lawyer')
      expect(lawyerSuggestions).toHaveLength(1)
      expect(lawyerSuggestions[0].value).toBe('John Smith')
      expect(lawyerSuggestions[0].count).toBe(2)
    })

    it('should generate suggestions for tags', async () => {
      const suggestions = await searchComposable.generateSuggestions('comm', sampleMatters)
      
      const tagSuggestions = suggestions.filter(s => s.type === 'tag')
      expect(tagSuggestions).toHaveLength(1)
      expect(tagSuggestions[0].value).toBe('commercial')
    })

    it('should limit suggestions to 10 items', async () => {
      // Create a lot of matters with similar names
      const manyMatters = Array.from({ length: 20 }, (_, i) => ({
        ...sampleMatters[0],
        id: `${i}`,
        caseNumber: `TEST-${i.toString().padStart(3, '0')}`,
        title: `Test Case ${i}`
      }))
      
      const suggestions = await searchComposable.generateSuggestions('TEST', manyMatters)
      expect(suggestions.length).toBeLessThanOrEqual(10)
    })

    it('should sort suggestions by count and name', async () => {
      const suggestions = await searchComposable.generateSuggestions('john', sampleMatters)
      
      // John Smith appears in 2 matters, should have count 2
      const johnSuggestion = suggestions.find(s => s.value === 'John Smith')
      expect(johnSuggestion?.count).toBe(2)
    })

    it('should return empty array for short queries', async () => {
      const suggestions = await searchComposable.generateSuggestions('a', sampleMatters)
      expect(suggestions).toEqual([])
    })

    it('should return empty array for empty query', async () => {
      const suggestions = await searchComposable.generateSuggestions('', sampleMatters)
      expect(suggestions).toEqual([])
    })
  })

  describe('Search Statistics', () => {
    it('should track search performance statistics', async () => {
      // Mock performance.now to return different values
      let callCount = 0
      vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++
        return callCount * 100 // 100ms, 200ms, etc.
      })
      
      await searchComposable.performSearch('test', sampleMatters)
      
      expect(searchComposable.searchStats.value.totalQueries).toBe(1)
      expect(searchComposable.searchStats.value.lastQueryTime).toBe(100)
      expect(searchComposable.searchStats.value.averageQueryTime).toBe(100)
    })

    it('should calculate rolling average query time', async () => {
      let callCount = 0
      vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++
        return callCount * 100
      })
      
      // First search takes 100ms
      await searchComposable.performSearch('test1', sampleMatters)
      
      // Reset call count for second search
      callCount = 0
      // Second search takes 200ms
      await searchComposable.performSearch('test2', sampleMatters)
      
      expect(searchComposable.searchStats.value.totalQueries).toBe(2)
      expect(searchComposable.searchStats.value.averageQueryTime).toBe(150) // (100 + 200) / 2
    })
  })

  describe('Search Mode Management', () => {
    it('should change search mode', () => {
      searchComposable.setSearchMode('exact')
      expect(searchComposable.searchMode.value).toBe('exact')
      
      searchComposable.setSearchMode('field')
      expect(searchComposable.searchMode.value).toBe('field')
    })

    it('should have correct computed mode checks', () => {
      searchComposable.setSearchMode('fuzzy')
      expect(searchComposable.isFuzzySearch.value).toBe(true)
      expect(searchComposable.isExactSearch.value).toBe(false)
      expect(searchComposable.isFieldSearch.value).toBe(false)
      
      searchComposable.setSearchMode('exact')
      expect(searchComposable.isFuzzySearch.value).toBe(false)
      expect(searchComposable.isExactSearch.value).toBe(true)
      expect(searchComposable.isFieldSearch.value).toBe(false)
      
      searchComposable.setSearchMode('field')
      expect(searchComposable.isFuzzySearch.value).toBe(false)
      expect(searchComposable.isExactSearch.value).toBe(false)
      expect(searchComposable.isFieldSearch.value).toBe(true)
    })
  })

  describe('Suggestion Selection', () => {
    it('should select suggestion and update search query', async () => {
      const suggestion: SearchSuggestion = {
        id: 'test-suggestion',
        value: 'Test Value',
        type: 'client',
        count: 1
      }
      
      searchComposable.selectSuggestion(suggestion)
      
      expect(searchComposable.searchQuery.value).toBe('Test Value')
      expect(searchComposable.showSuggestions.value).toBe(false)
    })
  })

  describe('Clear Search', () => {
    it('should clear all search-related state', () => {
      // Set some values first
      searchComposable.searchQuery.value = 'test query'
      searchComposable.searchResults.value = sampleMatters
      searchComposable.suggestions.value = [
        { id: '1', value: 'test', type: 'client', count: 1 }
      ]
      searchComposable.showSuggestions.value = true
      searchComposable.selectedSuggestionIndex.value = 0
      
      searchComposable.clearSearch()
      
      expect(searchComposable.searchQuery.value).toBe('')
      expect(searchComposable.searchResults.value).toEqual([])
      expect(searchComposable.suggestions.value).toEqual([])
      expect(searchComposable.showSuggestions.value).toBe(false)
      expect(searchComposable.selectedSuggestionIndex.value).toBe(-1)
    })
  })

  describe('Computed Properties', () => {
    it('should compute hasActiveSearch correctly', () => {
      expect(searchComposable.hasActiveSearch.value).toBe(false)
      
      searchComposable.searchQuery.value = 'test'
      expect(searchComposable.hasActiveSearch.value).toBe(true)
      
      searchComposable.searchQuery.value = ''
      expect(searchComposable.hasActiveSearch.value).toBe(false)
    })

    it('should compute hasResults correctly', () => {
      expect(searchComposable.hasResults.value).toBe(false)
      
      searchComposable.searchResults.value = sampleMatters
      expect(searchComposable.hasResults.value).toBe(true)
      
      searchComposable.searchResults.value = []
      expect(searchComposable.hasResults.value).toBe(false)
    })
  })

  describe('Hide Suggestions', () => {
    it('should hide suggestions and reset selection index', () => {
      searchComposable.showSuggestions.value = true
      searchComposable.selectedSuggestionIndex.value = 2
      
      searchComposable.hideSuggestions()
      
      expect(searchComposable.showSuggestions.value).toBe(false)
      expect(searchComposable.selectedSuggestionIndex.value).toBe(-1)
    })
  })

  describe('Error Handling', () => {
    it('should handle empty matters array gracefully', async () => {
      const results = await searchComposable.performSearch('test', [])
      expect(results).toEqual([])
    })

    it('should handle undefined fields gracefully', async () => {
      const matterWithUndefined = {
        ...sampleMatters[0],
        description: undefined,
        assignedLawyer: undefined,
        tags: undefined
      }
      
      const results = await searchComposable.performSearch('test', [matterWithUndefined])
      expect(results).toEqual([])
    })
  })
})