import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '../search'
import type { Matter, SearchFilters } from '../search'

// Mock $fetch
const mockFetch = vi.fn()
globalThis.$fetch = mockFetch

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock matter data
const mockMatters: Matter[] = [
  {
    id: 'matter-1',
    caseNumber: '2025-CV-0001',
    title: 'Contract Dispute Case',
    description: 'A complex contract dispute involving multiple parties',
    clientName: 'ABC Corporation',
    status: 'INTAKE',
    priority: 'HIGH',
    assignedLawyer: { id: 'lawyer-1', name: 'John Doe', initials: 'JD' },
    dueDate: '2025-02-01T00:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    relatedDocuments: 5,
    tags: ['contract', 'dispute', 'commercial']
  },
  {
    id: 'matter-2',
    caseNumber: '2025-CV-0002',
    title: 'Employment Law Matter',
    description: 'Wrongful termination claim',
    clientName: 'Jane Smith',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assignedLawyer: { id: 'lawyer-2', name: 'Sarah Wilson', initials: 'SW' },
    dueDate: '2025-01-25T00:00:00Z',
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-16T00:00:00Z',
    relatedDocuments: 3,
    tags: ['employment', 'termination']
  }
]

describe('Search Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useSearchStore()
      
      expect(store.filters.query).toBe('')
      expect(store.filters.statuses).toEqual([])
      expect(store.filters.priorities).toEqual([])
      expect(store.filters.lawyers).toEqual([])
      expect(store.filters.showClosed).toBe(true)
      expect(store.isSearching).toBe(false)
      expect(store.searchResults).toBeNull()
      expect(store.searchHistory).toEqual([])
    })
  })

  describe('Filter Management', () => {
    it('should update filters', () => {
      const store = useSearchStore()
      
      const newFilters: Partial<SearchFilters> = {
        query: 'contract',
        statuses: ['INTAKE', 'IN_PROGRESS'],
        priorities: ['HIGH'],
        lawyers: ['lawyer-1']
      }
      
      store.updateFilters(newFilters)
      
      expect(store.filters.query).toBe('contract')
      expect(store.filters.statuses).toEqual(['INTAKE', 'IN_PROGRESS'])
      expect(store.filters.priorities).toEqual(['HIGH'])
      expect(store.filters.lawyers).toEqual(['lawyer-1'])
    })

    it('should reset filters', () => {
      const store = useSearchStore()
      
      // Set some filters
      store.updateFilters({
        query: 'test',
        statuses: ['INTAKE'],
        showClosed: false
      })
      
      // Reset
      store.resetFilters()
      
      expect(store.filters.query).toBe('')
      expect(store.filters.statuses).toEqual([])
      expect(store.filters.showClosed).toBe(true)
    })

    it('should detect active search', () => {
      const store = useSearchStore()
      
      expect(store.hasActiveSearch).toBe(false)
      
      store.updateFilters({ query: 'test' })
      expect(store.hasActiveSearch).toBe(true)
      
      store.updateFilters({ query: '', statuses: ['INTAKE'] })
      expect(store.hasActiveSearch).toBe(true)
      
      store.resetFilters()
      expect(store.hasActiveSearch).toBe(false)
    })
  })

  describe('Search Operations', () => {
    it('should perform basic search', async () => {
      const store = useSearchStore()
      
      mockFetch.mockResolvedValueOnce({
        matters: [mockMatters[0]],
        total: 1,
        facets: {
          statuses: [{ value: 'INTAKE', count: 1 }],
          priorities: [{ value: 'HIGH', count: 1 }],
          lawyers: [{ value: 'lawyer-1', count: 1 }]
        },
        suggestions: [],
        executionTime: 15
      })
      
      store.updateFilters({ query: 'contract' })
      await store.performSearch()
      
      expect(store.searchResults?.matters).toHaveLength(1)
      expect(store.searchResults?.total).toBe(1)
      expect(store.isSearching).toBe(false)
      expect(mockFetch).toHaveBeenCalledWith('/api/search/matters', {
        method: 'POST',
        body: {
          query: 'contract',
          filters: {
            statuses: [],
            priorities: [],
            lawyers: [],
            showClosed: true
          },
          options: {
            fuzzy: true,
            highlight: true,
            facets: true,
            suggestions: true
          }
        }
      })
    })

    it('should handle search with filters', async () => {
      const store = useSearchStore()
      
      mockFetch.mockResolvedValueOnce({
        matters: mockMatters,
        total: 2,
        facets: {},
        suggestions: [],
        executionTime: 25
      })
      
      store.updateFilters({
        query: 'contract',
        statuses: ['INTAKE'],
        priorities: ['HIGH', 'MEDIUM'],
        lawyers: ['lawyer-1']
      })
      
      await store.performSearch()
      
      expect(mockFetch).toHaveBeenCalledWith('/api/search/matters', {
        method: 'POST',
        body: {
          query: 'contract',
          filters: {
            statuses: ['INTAKE'],
            priorities: ['HIGH', 'MEDIUM'],
            lawyers: ['lawyer-1'],
            showClosed: true
          },
          options: {
            fuzzy: true,
            highlight: true,
            facets: true,
            suggestions: true
          }
        }
      })
    })

    it('should handle search error', async () => {
      const store = useSearchStore()
      const error = new Error('Search failed')
      mockFetch.mockRejectedValueOnce(error)
      
      store.updateFilters({ query: 'test' })
      
      await expect(store.performSearch()).rejects.toThrow('Search failed')
      expect(store.isSearching).toBe(false)
      expect(store.error).toBe('Search failed')
    })

    it('should clear search', () => {
      const store = useSearchStore()
      
      // Set search state
      store.searchResults = {
        matters: mockMatters,
        total: 2,
        facets: {},
        suggestions: [],
        executionTime: 10
      }
      store.updateFilters({ query: 'test' })
      
      store.clearSearch()
      
      expect(store.searchResults).toBeNull()
      expect(store.filters.query).toBe('')
      expect(store.hasActiveSearch).toBe(false)
    })
  })

  describe('Search History', () => {
    it('should add search to history', () => {
      const store = useSearchStore()
      
      store.updateFilters({ query: 'contract dispute' })
      store.addToHistory()
      
      expect(store.searchHistory).toHaveLength(1)
      expect(store.searchHistory[0].query).toBe('contract dispute')
      expect(store.searchHistory[0].timestamp).toBeInstanceOf(Date)
    })

    it('should not add duplicate searches to history', () => {
      const store = useSearchStore()
      
      store.updateFilters({ query: 'contract' })
      store.addToHistory()
      store.addToHistory() // Same search again
      
      expect(store.searchHistory).toHaveLength(1)
    })

    it('should limit search history size', () => {
      const store = useSearchStore()
      
      // Add 12 searches (more than the 10 limit)
      for (let i = 0; i < 12; i++) {
        store.updateFilters({ query: `search ${i}` })
        store.addToHistory()
      }
      
      expect(store.searchHistory).toHaveLength(10)
      expect(store.searchHistory[0].query).toBe('search 11') // Most recent first
    })

    it('should clear search history', () => {
      const store = useSearchStore()
      
      store.updateFilters({ query: 'test' })
      store.addToHistory()
      expect(store.searchHistory).toHaveLength(1)
      
      store.clearHistory()
      expect(store.searchHistory).toHaveLength(0)
    })
  })

  describe('Saved Searches', () => {
    it('should save current search', () => {
      const store = useSearchStore()
      
      store.updateFilters({
        query: 'contract',
        statuses: ['INTAKE'],
        priorities: ['HIGH']
      })
      
      store.saveSearch('Contract Cases', 'All high priority contract cases in intake')
      
      expect(store.savedSearches).toHaveLength(1)
      expect(store.savedSearches[0].name).toBe('Contract Cases')
      expect(store.savedSearches[0].filters.query).toBe('contract')
    })

    it('should load saved search', () => {
      const store = useSearchStore()
      
      // First save a search
      store.updateFilters({ query: 'contract', statuses: ['INTAKE'] })
      store.saveSearch('Contract Cases')
      
      // Clear filters
      store.resetFilters()
      expect(store.filters.query).toBe('')
      
      // Load saved search
      store.loadSavedSearch('Contract Cases')
      
      expect(store.filters.query).toBe('contract')
      expect(store.filters.statuses).toEqual(['INTAKE'])
    })

    it('should delete saved search', () => {
      const store = useSearchStore()
      
      store.updateFilters({ query: 'test' })
      store.saveSearch('Test Search')
      expect(store.savedSearches).toHaveLength(1)
      
      store.deleteSavedSearch('Test Search')
      expect(store.savedSearches).toHaveLength(0)
    })

    it('should not overwrite existing saved search name', () => {
      const store = useSearchStore()
      
      store.updateFilters({ query: 'first' })
      store.saveSearch('Test Search')
      
      store.updateFilters({ query: 'second' })
      store.saveSearch('Test Search') // Same name
      
      expect(store.savedSearches).toHaveLength(1)
      expect(store.savedSearches[0].filters.query).toBe('second') // Should update
    })
  })

  describe('Search Suggestions', () => {
    it('should provide search suggestions', () => {
      const store = useSearchStore()
      
      // Add some history
      store.updateFilters({ query: 'contract dispute' })
      store.addToHistory()
      store.updateFilters({ query: 'contract review' })
      store.addToHistory()
      store.updateFilters({ query: 'employment law' })
      store.addToHistory()
      
      const suggestions = store.getSearchSuggestions('con')
      
      expect(suggestions).toEqual(['contract dispute', 'contract review'])
    })

    it('should include saved searches in suggestions', () => {
      const store = useSearchStore()
      
      store.updateFilters({ query: 'contract cases' })
      store.saveSearch('Contract Cases')
      
      const suggestions = store.getSearchSuggestions('contract')
      
      expect(suggestions).toContain('contract cases')
    })

    it('should limit suggestion count', () => {
      const store = useSearchStore()
      
      // Add many searches with similar prefixes
      for (let i = 0; i < 10; i++) {
        store.updateFilters({ query: `test search ${i}` })
        store.addToHistory()
      }
      
      const suggestions = store.getSearchSuggestions('test')
      
      expect(suggestions.length).toBeLessThanOrEqual(5) // Default limit
    })
  })

  describe('Facet Analysis', () => {
    beforeEach(() => {
      const store = useSearchStore()
      store.searchResults = {
        matters: mockMatters,
        total: 2,
        facets: {
          statuses: [
            { value: 'INTAKE', count: 1 },
            { value: 'IN_PROGRESS', count: 1 }
          ],
          priorities: [
            { value: 'HIGH', count: 1 },
            { value: 'MEDIUM', count: 1 }
          ],
          lawyers: [
            { value: 'lawyer-1', count: 1 },
            { value: 'lawyer-2', count: 1 }
          ]
        },
        suggestions: [],
        executionTime: 15
      }
    })

    it('should get available filter values', () => {
      const store = useSearchStore()
      
      expect(store.getAvailableStatuses()).toEqual(['INTAKE', 'IN_PROGRESS'])
      expect(store.getAvailablePriorities()).toEqual(['HIGH', 'MEDIUM'])
      expect(store.getAvailableLawyers()).toEqual(['lawyer-1', 'lawyer-2'])
    })

    it('should get filter counts', () => {
      const store = useSearchStore()
      
      expect(store.getStatusCount('INTAKE')).toBe(1)
      expect(store.getPriorityCount('HIGH')).toBe(1)
      expect(store.getLawyerCount('lawyer-1')).toBe(1)
      expect(store.getStatusCount('NONEXISTENT')).toBe(0)
    })
  })

  describe('Persistence', () => {
    it('should load saved searches from localStorage', () => {
      const savedData = JSON.stringify([
        {
          name: 'Saved Search',
          filters: { query: 'test', statuses: ['INTAKE'] },
          description: 'Test search',
          createdAt: new Date().toISOString()
        }
      ])
      
      localStorageMock.getItem.mockReturnValue(savedData)
      
      const store = useSearchStore()
      store.loadSavedSearches()
      
      expect(store.savedSearches).toHaveLength(1)
      expect(store.savedSearches[0].name).toBe('Saved Search')
    })

    it('should persist saved searches to localStorage', () => {
      const store = useSearchStore()
      
      store.updateFilters({ query: 'test' })
      store.saveSearch('Test Search')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kanban-saved-searches',
        expect.stringContaining('Test Search')
      )
    })

    it('should handle localStorage errors gracefully', () => {
      const store = useSearchStore()
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // Should not throw
      expect(() => store.loadSavedSearches()).not.toThrow()
      expect(store.savedSearches).toEqual([])
    })
  })

  describe('Performance', () => {
    it('should track search execution time', async () => {
      const store = useSearchStore()
      
      mockFetch.mockResolvedValueOnce({
        matters: mockMatters,
        total: 2,
        facets: {},
        suggestions: [],
        executionTime: 50
      })
      
      store.updateFilters({ query: 'test' })
      await store.performSearch()
      
      expect(store.searchResults?.executionTime).toBe(50)
    })

    it('should provide performance metrics', () => {
      const store = useSearchStore()
      
      // Simulate search history with execution times
      store.searchResults = {
        matters: mockMatters,
        total: 2,
        facets: {},
        suggestions: [],
        executionTime: 25
      }
      
      const metrics = store.getPerformanceMetrics()
      expect(metrics.lastSearchTime).toBe(25)
      expect(metrics.averageSearchTime).toBe(25)
      expect(metrics.totalSearches).toBe(1)
    })
  })
})