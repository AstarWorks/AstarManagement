/**
 * Tests for search-store
 * Tests search functionality, suggestions, analytics, and history management
 */

import { renderHook, act } from '@testing-library/react'
import { 
    useSearchStore,
    useSearchQuery,
    useSearchResults,
    useSearchLoading,
    useSearchError,
    useSearchSuggestions,
    useSearchHistory,
    useSearchTerms,
    useSearchActions,
    getSearchServerSnapshot
} from '../kanban/search-store'

// Mock API modules
jest.mock('@/services/api/search.service', () => ({
    searchMatters: jest.fn(),
    getSearchSuggestions: jest.fn(),
    extractSearchTerms: jest.fn()
}))

jest.mock('@/services/analytics/search-analytics.service', () => ({
    searchAnalytics: {
        trackSearch: jest.fn()
    }
}))

jest.mock('@/services/error/error.handler', () => ({
    handleApiError: jest.fn((error) => ({
        type: 'SEARCH_ERROR',
        message: error.message || 'Search Error',
        timestamp: new Date()
    }))
}))

// Mock search results
const mockSearchResults = [
    {
        id: 'matter-1',
        caseNumber: '2025-CV-0001',
        title: 'Contract Dispute',
        clientName: 'Alpha Corp',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        filingDate: '2025-01-01',
        assignedLawyerName: 'Alice Johnson',
        createdAt: '2025-01-01T00:00:00Z',
        highlights: ['Contract', 'Alpha'],
        relevanceScore: 0.95
    },
    {
        id: 'matter-2',
        caseNumber: '2025-PI-0001',
        title: 'Personal Injury',
        clientName: 'John Doe',
        status: 'DRAFT',
        priority: 'MEDIUM',
        filingDate: '2025-01-15',
        assignedLawyerName: 'Charlie Brown',
        createdAt: '2025-01-15T00:00:00Z',
        highlights: ['Personal', 'Injury'],
        relevanceScore: 0.75
    }
]

const mockSuggestions = [
    {
        id: 'suggestion-1',
        text: 'contract dispute',
        type: 'MATTER_TITLE' as const,
        score: 0.9,
        metadata: { matterCount: 5 }
    },
    {
        id: 'suggestion-2',
        text: 'Alpha Corp',
        type: 'CLIENT_NAME' as const,
        score: 0.8,
        metadata: { matterCount: 3 }
    }
]

describe('SearchStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useSearchStore.setState({
            searchQuery: '',
            searchResults: [],
            isSearching: false,
            searchError: null,
            suggestions: [],
            isFetchingSuggestions: false,
            searchHistory: [],
            maxHistorySize: 10,
            searchTerms: [],
            searchType: 'FUZZY',
            lastSearchTime: null,
            searchCount: 0
        })
        
        // Clear all mocks
        jest.clearAllMocks()
    })

    describe('Initial state', () => {
        test('has correct initial state', () => {
            const { result } = renderHook(() => useSearchStore())
            
            expect(result.current).toMatchObject({
                searchQuery: '',
                searchResults: [],
                isSearching: false,
                searchError: null,
                suggestions: [],
                isFetchingSuggestions: false,
                searchHistory: [],
                searchTerms: [],
                searchType: 'FUZZY',
                lastSearchTime: null,
                searchCount: 0
            })
        })
    })

    describe('Search operations', () => {
        test('performSearch updates state correctly', async () => {
            const mockSearchMatters = require('@/services/api/search.service').searchMatters
            const mockExtractSearchTerms = require('@/services/api/search.service').extractSearchTerms
            
            mockSearchMatters.mockResolvedValue({ content: mockSearchResults })
            mockExtractSearchTerms.mockReturnValue(['contract', 'dispute'])

            const { result } = renderHook(() => useSearchStore())
            
            await act(async () => {
                await result.current.performSearch('contract dispute')
            })

            expect(result.current.searchQuery).toBe('contract dispute')
            expect(result.current.searchResults).toHaveLength(2)
            expect(result.current.searchTerms).toEqual(['contract', 'dispute'])
            expect(result.current.isSearching).toBe(false)
            expect(result.current.searchCount).toBe(1)
            expect(result.current.lastSearchTime).toBeInstanceOf(Date)
        })

        test('performSearch handles empty query', async () => {
            const { result } = renderHook(() => useSearchStore())
            
            await act(async () => {
                await result.current.performSearch('')
            })

            expect(result.current.searchQuery).toBe('')
            expect(result.current.searchResults).toEqual([])
            expect(result.current.searchTerms).toEqual([])
        })

        test('performSearch handles whitespace-only query', async () => {
            const { result } = renderHook(() => useSearchStore())
            
            await act(async () => {
                await result.current.performSearch('   ')
            })

            expect(result.current.searchQuery).toBe('')
            expect(result.current.searchResults).toEqual([])
        })

        test('performSearch handles errors correctly', async () => {
            const mockSearchMatters = require('@/services/api/search.service').searchMatters
            mockSearchMatters.mockRejectedValue(new Error('Search failed'))

            const { result } = renderHook(() => useSearchStore())
            
            await act(async () => {
                try {
                    await result.current.performSearch('test query')
                } catch (error) {
                    // Expected to throw
                }
            })

            expect(result.current.isSearching).toBe(false)
            expect(result.current.searchError).toMatchObject({
                type: 'SEARCH_ERROR',
                message: 'Search failed'
            })
        })

        test('performSearch with different search type', async () => {
            const mockSearchMatters = require('@/services/api/search.service').searchMatters
            mockSearchMatters.mockResolvedValue({ content: [] })

            const { result } = renderHook(() => useSearchStore())
            
            await act(async () => {
                await result.current.performSearch('test', 'EXACT')
            })

            expect(result.current.searchType).toBe('EXACT')
            expect(mockSearchMatters).toHaveBeenCalledWith({
                query: 'test',
                type: 'EXACT',
                page: 0,
                size: 50
            })
        })

        test('clearSearch resets search state', () => {
            const { result } = renderHook(() => useSearchStore())
            
            // Set some search state
            act(() => {
                useSearchStore.setState({
                    searchQuery: 'test',
                    searchResults: mockSearchResults.map(r => ({ ...r } as any)),
                    searchTerms: ['test'],
                    searchError: { type: 'ERROR', message: 'Error', timestamp: new Date() } as any
                })
            })

            act(() => {
                result.current.clearSearch()
            })

            expect(result.current.searchQuery).toBe('')
            expect(result.current.searchResults).toEqual([])
            expect(result.current.searchTerms).toEqual([])
            expect(result.current.searchError).toBeNull()
            expect(result.current.isSearching).toBe(false)
        })
    })

    describe('Suggestions', () => {
        test('getSuggestions fetches and updates suggestions', async () => {
            const mockGetSearchSuggestions = require('@/services/api/search.service').getSearchSuggestions
            mockGetSearchSuggestions.mockResolvedValue(mockSuggestions)

            const { result } = renderHook(() => useSearchStore())
            
            await act(async () => {
                await result.current.getSuggestions('contract')
            })

            expect(result.current.suggestions).toEqual(mockSuggestions)
            expect(result.current.isFetchingSuggestions).toBe(false)
        })

        test('getSuggestions ignores short queries', async () => {
            const { result } = renderHook(() => useSearchStore())
            
            await act(async () => {
                await result.current.getSuggestions('a')
            })

            expect(result.current.suggestions).toEqual([])
        })

        test('getSuggestions handles errors gracefully', async () => {
            const mockGetSearchSuggestions = require('@/services/api/search.service').getSearchSuggestions
            mockGetSearchSuggestions.mockRejectedValue(new Error('Suggestions failed'))

            // Mock console.warn to avoid noise in tests
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            const { result } = renderHook(() => useSearchStore())
            
            await act(async () => {
                await result.current.getSuggestions('test')
            })

            expect(result.current.suggestions).toEqual([])
            expect(result.current.isFetchingSuggestions).toBe(false)
            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch search suggestions:', expect.any(Error))
            
            consoleSpy.mockRestore()
        })

        test('clearSuggestions resets suggestions state', () => {
            const { result } = renderHook(() => useSearchStore())
            
            // Set suggestions
            act(() => {
                useSearchStore.setState({
                    suggestions: mockSuggestions,
                    isFetchingSuggestions: true
                })
            })

            act(() => {
                result.current.clearSuggestions()
            })

            expect(result.current.suggestions).toEqual([])
            expect(result.current.isFetchingSuggestions).toBe(false)
        })
    })

    describe('Search history', () => {
        test('addToHistory adds query to beginning of history', () => {
            const { result } = renderHook(() => useSearchStore())
            
            act(() => {
                result.current.addToHistory('first query')
                result.current.addToHistory('second query')
            })

            expect(result.current.searchHistory).toEqual(['second query', 'first query'])
        })

        test('addToHistory removes duplicates', () => {
            const { result } = renderHook(() => useSearchStore())
            
            act(() => {
                result.current.addToHistory('test query')
                result.current.addToHistory('another query')
                result.current.addToHistory('test query') // Duplicate
            })

            expect(result.current.searchHistory).toEqual(['test query', 'another query'])
        })

        test('addToHistory respects max history size', () => {
            const { result } = renderHook(() => useSearchStore())
            
            // Set small max size for testing
            act(() => {
                useSearchStore.setState({ maxHistorySize: 3 })
            })

            act(() => {
                result.current.addToHistory('query 1')
                result.current.addToHistory('query 2')
                result.current.addToHistory('query 3')
                result.current.addToHistory('query 4')
            })

            expect(result.current.searchHistory).toHaveLength(3)
            expect(result.current.searchHistory).toEqual(['query 4', 'query 3', 'query 2'])
        })

        test('addToHistory ignores empty queries', () => {
            const { result } = renderHook(() => useSearchStore())
            
            act(() => {
                result.current.addToHistory('')
                result.current.addToHistory('   ')
            })

            expect(result.current.searchHistory).toEqual([])
        })

        test('removeFromHistory removes specific query', () => {
            const { result } = renderHook(() => useSearchStore())
            
            act(() => {
                result.current.addToHistory('query 1')
                result.current.addToHistory('query 2')
                result.current.addToHistory('query 3')
            })

            act(() => {
                result.current.removeFromHistory('query 2')
            })

            expect(result.current.searchHistory).toEqual(['query 3', 'query 1'])
        })

        test('clearHistory removes all history', () => {
            const { result } = renderHook(() => useSearchStore())
            
            act(() => {
                result.current.addToHistory('query 1')
                result.current.addToHistory('query 2')
            })

            act(() => {
                result.current.clearHistory()
            })

            expect(result.current.searchHistory).toEqual([])
        })
    })

    describe('Analytics', () => {
        test('trackSearch calls analytics service', () => {
            const mockTrackSearch = require('@/services/analytics/search-analytics.service').searchAnalytics.trackSearch
            const { result } = renderHook(() => useSearchStore())
            
            act(() => {
                result.current.trackSearch('test query', 5)
            })

            expect(mockTrackSearch).toHaveBeenCalledWith({
                query: 'test query',
                resultCount: 5,
                timestamp: expect.any(Date),
                searchType: 'FUZZY'
            })
        })

        test('getSearchAnalytics returns current analytics', () => {
            const { result } = renderHook(() => useSearchStore())
            
            // Set some state
            act(() => {
                useSearchStore.setState({
                    searchCount: 5,
                    searchTerms: ['test', 'query'],
                    searchResults: mockSearchResults.map(r => ({ ...r } as any)),
                    lastSearchTime: new Date('2025-01-01')
                })
            })

            const analytics = result.current.getSearchAnalytics()
            
            expect(analytics).toEqual({
                totalSearches: 5,
                commonTerms: ['test', 'query'],
                averageResultCount: 2,
                lastSearchTime: new Date('2025-01-01')
            })
        })
    })

    describe('Error handling', () => {
        test('setSearchError updates error state', () => {
            const { result } = renderHook(() => useSearchStore())
            const error = { type: 'TEST_ERROR', message: 'Test error', timestamp: new Date() }
            
            act(() => {
                result.current.setSearchError(error as any)
            })

            expect(result.current.searchError).toEqual(error)
        })

        test('clearSearchError resets error state', () => {
            const { result } = renderHook(() => useSearchStore())
            
            // Set error first
            act(() => {
                result.current.setSearchError({ type: 'ERROR', message: 'Error', timestamp: new Date() } as any)
            })

            act(() => {
                result.current.clearSearchError()
            })

            expect(result.current.searchError).toBeNull()
        })
    })

    describe('Selector hooks', () => {
        test('useSearchQuery returns search query', () => {
            const { result: selectorResult } = renderHook(() => useSearchQuery())
            
            act(() => {
                useSearchStore.setState({ searchQuery: 'test query' })
            })

            expect(selectorResult.current).toBe('test query')
        })

        test('useSearchResults returns search results', () => {
            const { result: selectorResult } = renderHook(() => useSearchResults())
            const results = mockSearchResults.map(r => ({ ...r } as any))
            
            act(() => {
                useSearchStore.setState({ searchResults: results })
            })

            expect(selectorResult.current).toEqual(results)
        })

        test('useSearchLoading returns loading state', () => {
            const { result: selectorResult } = renderHook(() => useSearchLoading())
            
            act(() => {
                useSearchStore.setState({
                    isSearching: true,
                    isFetchingSuggestions: false
                })
            })

            expect(selectorResult.current).toEqual({
                isSearching: true,
                isFetchingSuggestions: false
            })
        })

        test('useSearchActions returns action functions', () => {
            const { result } = renderHook(() => useSearchActions())
            
            expect(result.current).toMatchObject({
                performSearch: expect.any(Function),
                clearSearch: expect.any(Function),
                getSuggestions: expect.any(Function),
                clearSuggestions: expect.any(Function),
                addToHistory: expect.any(Function),
                clearHistory: expect.any(Function),
                removeFromHistory: expect.any(Function),
                trackSearch: expect.any(Function),
                getSearchAnalytics: expect.any(Function),
                setSearchError: expect.any(Function),
                clearSearchError: expect.any(Function)
            })
        })
    })

    describe('SSR compatibility', () => {
        test('getSearchServerSnapshot returns correct initial state', () => {
            const snapshot = getSearchServerSnapshot()
            
            expect(snapshot).toMatchObject({
                searchQuery: '',
                searchResults: [],
                isSearching: false,
                searchError: null,
                suggestions: [],
                isFetchingSuggestions: false,
                searchHistory: [],
                maxHistorySize: 10,
                searchTerms: [],
                searchType: 'FUZZY',
                lastSearchTime: null,
                searchCount: 0,
                performSearch: expect.any(Function),
                clearSearch: expect.any(Function),
                getSuggestions: expect.any(Function),
                getSearchAnalytics: expect.any(Function)
            })
        })

        test('server snapshot actions are no-ops', async () => {
            const snapshot = getSearchServerSnapshot()
            
            // Should not throw and return expected values
            expect(await snapshot.performSearch('test')).toEqual([])
            expect(await snapshot.getSuggestions('test')).toEqual([])
            
            const analytics = snapshot.getSearchAnalytics()
            expect(analytics.totalSearches).toBe(0)
            expect(analytics.commonTerms).toEqual([])
            expect(analytics.averageResultCount).toBe(0)
            expect(analytics.lastSearchTime).toBeNull()
        })
    })
})