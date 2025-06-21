/**
 * Search Store - Search state, suggestions, and analytics integration
 * 
 * Handles search functionality, suggestions, analytics tracking, and search history
 * Separated from main kanban store for better modularity and testing
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
    searchMatters,
    getSearchSuggestions,
    extractSearchTerms,
    type MatterSearchResult,
    type SearchSuggestion,
    type SearchType
} from '@/services/api/search.service'
import { searchAnalytics } from '@/services/analytics/search-analytics.service'
import { handleApiError, type BoardError } from '@/services/error/error.handler'
import { MatterCard } from '@/components/kanban/types'

// Search result conversion function
function convertSearchResultToCard(result: MatterSearchResult): MatterCard {
    return {
        id: result.id,
        caseNumber: result.caseNumber,
        title: result.title,
        description: '',
        clientName: result.clientName,
        clientContact: '',
        opposingParty: '',
        courtName: '',
        status: result.status as any,
        priority: result.priority as any,
        filingDate: result.filingDate || '',
        estimatedCompletionDate: '',
        assignedLawyerId: '',
        assignedLawyerName: result.assignedLawyerName || '',
        assignedClerkId: '',
        assignedClerkName: '',
        notes: '',
        tags: [],
        isActive: true,
        isOverdue: false,
        isCompleted: false,
        ageInDays: 0,
        createdAt: result.createdAt,
        updatedAt: result.createdAt,
        createdBy: '',
        updatedBy: '',
        searchHighlights: result.highlights,
        relevanceScore: result.relevanceScore
    }
}

// Search state interface
interface SearchState {
    // Search query and results
    searchQuery: string
    searchResults: MatterCard[]
    isSearching: boolean
    searchError: BoardError | null
    
    // Search suggestions
    suggestions: SearchSuggestion[]
    isFetchingSuggestions: boolean
    
    // Search history
    searchHistory: string[]
    maxHistorySize: number
    
    // Search analytics
    searchTerms: string[]
    searchType: SearchType
    lastSearchTime: Date | null
    searchCount: number
    
    // Search actions
    performSearch: (query: string, type?: SearchType) => Promise<MatterCard[]>
    clearSearch: () => void
    getSuggestions: (query: string) => Promise<SearchSuggestion[]>
    clearSuggestions: () => void
    
    // History management
    addToHistory: (query: string) => void
    clearHistory: () => void
    removeFromHistory: (query: string) => void
    
    // Analytics
    trackSearch: (query: string, resultCount: number) => void
    getSearchAnalytics: () => {
        totalSearches: number
        commonTerms: string[]
        averageResultCount: number
        lastSearchTime: Date | null
    }
    
    // Error handling
    setSearchError: (error: BoardError | null) => void
    clearSearchError: () => void
}

// Create the search store
export const useSearchStore = create<SearchState>()(
    subscribeWithSelector(
        immer((set, get) => ({
            // Initial state
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

            // Search operations
            performSearch: async (query, type = 'FUZZY') => {
                if (!query.trim()) {
                    get().clearSearch()
                    return []
                }

                set((state) => {
                    state.searchQuery = query
                    state.isSearching = true
                    state.searchError = null
                    state.searchType = type
                })

                try {
                    const results = await searchMatters({
                        query: query.trim(),
                        type,
                        page: 0,
                        size: 50
                    })

                    const searchResults = results.content.map(convertSearchResultToCard)
                    const extractedTerms = extractSearchTerms(query)

                    set((state) => {
                        state.searchResults = searchResults
                        state.searchTerms = extractedTerms
                        state.lastSearchTime = new Date()
                        state.searchCount += 1
                        state.isSearching = false
                    })

                    // Add to history and track analytics
                    get().addToHistory(query)
                    get().trackSearch(query, searchResults.length)

                    return searchResults
                } catch (error) {
                    const searchError = handleApiError(error)
                    set((state) => {
                        state.searchError = searchError
                        state.isSearching = false
                    })
                    throw error
                }
            },

            clearSearch: () => set((state) => {
                state.searchQuery = ''
                state.searchResults = []
                state.searchTerms = []
                state.searchError = null
                state.isSearching = false
            }),

            getSuggestions: async (query) => {
                if (!query.trim() || query.length < 2) {
                    set((state) => {
                        state.suggestions = []
                    })
                    return []
                }

                set((state) => {
                    state.isFetchingSuggestions = true
                })

                try {
                    const suggestions = await getSearchSuggestions(query.trim())
                    
                    set((state) => {
                        state.suggestions = suggestions
                        state.isFetchingSuggestions = false
                    })

                    return suggestions
                } catch (error) {
                    set((state) => {
                        state.suggestions = []
                        state.isFetchingSuggestions = false
                    })
                    console.warn('Failed to fetch search suggestions:', error)
                    return []
                }
            },

            clearSuggestions: () => set((state) => {
                state.suggestions = []
                state.isFetchingSuggestions = false
            }),

            // History management
            addToHistory: (query) => set((state) => {
                const trimmedQuery = query.trim()
                if (!trimmedQuery) return

                // Remove if already exists
                state.searchHistory = state.searchHistory.filter(h => h !== trimmedQuery)
                
                // Add to beginning
                state.searchHistory.unshift(trimmedQuery)
                
                // Limit size
                if (state.searchHistory.length > state.maxHistorySize) {
                    state.searchHistory = state.searchHistory.slice(0, state.maxHistorySize)
                }
            }),

            clearHistory: () => set((state) => {
                state.searchHistory = []
            }),

            removeFromHistory: (query) => set((state) => {
                state.searchHistory = state.searchHistory.filter(h => h !== query)
            }),

            // Analytics
            trackSearch: (query, resultCount) => {
                try {
                    searchAnalytics.trackSearch({
                        query,
                        resultCount,
                        timestamp: new Date(),
                        searchType: get().searchType
                    })
                } catch (error) {
                    console.warn('Failed to track search analytics:', error)
                }
            },

            getSearchAnalytics: () => {
                const state = get()
                return {
                    totalSearches: state.searchCount,
                    commonTerms: state.searchTerms,
                    averageResultCount: state.searchResults.length,
                    lastSearchTime: state.lastSearchTime
                }
            },

            // Error handling
            setSearchError: (error) => set((state) => {
                state.searchError = error
            }),

            clearSearchError: () => set((state) => {
                state.searchError = null
            })
        }))
    )
)

// Selector hooks for optimized re-renders
export const useSearchQuery = () => useSearchStore((state) => state.searchQuery)
export const useSearchResults = () => useSearchStore((state) => state.searchResults)
export const useSearchLoading = () => useSearchStore((state) => ({
    isSearching: state.isSearching,
    isFetchingSuggestions: state.isFetchingSuggestions
}))
export const useSearchError = () => useSearchStore((state) => state.searchError)
export const useSearchSuggestions = () => useSearchStore((state) => state.suggestions)
export const useSearchHistory = () => useSearchStore((state) => state.searchHistory)
export const useSearchTerms = () => useSearchStore((state) => state.searchTerms)

// Backward compatibility: Combined search state hook
export const useSearchState = () => useSearchStore((state) => ({
    searchMode: state.searchQuery.length > 0,
    isSearching: state.isSearching,
    searchSuggestions: state.suggestions,
    lastSearchQuery: state.searchQuery
}))

export const useSearchActions = () => useSearchStore((state) => ({
    performSearch: state.performSearch,
    clearSearch: state.clearSearch,
    getSuggestions: state.getSuggestions,
    clearSuggestions: state.clearSuggestions,
    addToHistory: state.addToHistory,
    clearHistory: state.clearHistory,
    removeFromHistory: state.removeFromHistory,
    trackSearch: state.trackSearch,
    getSearchAnalytics: state.getSearchAnalytics,
    setSearchError: state.setSearchError,
    clearSearchError: state.clearSearchError,
    // Backward compatibility alias
    exitSearchMode: state.clearSearch
}))

// SSR-compatible server snapshot
const getServerSnapshot = (): SearchState => ({
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
    performSearch: async () => [],
    clearSearch: () => {},
    getSuggestions: async () => [],
    clearSuggestions: () => {},
    addToHistory: () => {},
    clearHistory: () => {},
    removeFromHistory: () => {},
    trackSearch: () => {},
    getSearchAnalytics: () => ({
        totalSearches: 0,
        commonTerms: [],
        averageResultCount: 0,
        lastSearchTime: null
    }),
    setSearchError: () => {},
    clearSearchError: () => {}
})

export { getServerSnapshot as getSearchServerSnapshot }