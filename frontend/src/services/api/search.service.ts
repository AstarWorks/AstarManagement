/**
 * Search API service for T02_S03 Advanced Search Implementation
 * 
 * Provides search functionality including:
 * - Full-text search with highlighting
 * - Search suggestions/autocomplete
 * - Advanced search with query parsing
 * - Result ranking and relevance scoring
 */

import { apiClient } from './client'
import { PagedResponse } from './types'

// Search result types
export interface MatterSearchResult {
  id: string
  caseNumber: string
  title: string
  clientName: string
  status: string
  priority: string
  highlights: Record<string, string[]>
  relevanceScore: number
  assignedLawyerName?: string
  filingDate?: string
  createdAt: string
}

export interface SearchSuggestion {
  value: string
  type: 'CASE_NUMBER' | 'TITLE' | 'CLIENT_NAME' | 'DESCRIPTION'
  count: number
}

export type SearchType = 'FULL_TEXT' | 'BASIC' | 'ADVANCED'

// Search request parameters
export interface SearchMatterParams {
  query: string
  searchType?: SearchType
  page?: number
  size?: number
}

export interface SearchSuggestionsParams {
  query: string
  limit?: number
}

/**
 * Search matters using full-text search with highlighting.
 */
export async function searchMatters(params: SearchMatterParams): Promise<PagedResponse<MatterSearchResult>> {
  const searchParams = new URLSearchParams({
    query: params.query,
    searchType: params.searchType || 'FULL_TEXT',
    page: (params.page || 0).toString(),
    size: (params.size || 20).toString()
  })

  const response = await apiClient.get<PagedResponse<MatterSearchResult>>(
    `/api/v1/matters/search?${searchParams.toString()}`
  )
  
  return response.data
}

/**
 * Get search suggestions for autocomplete functionality.
 */
export async function getSearchSuggestions(params: SearchSuggestionsParams): Promise<SearchSuggestion[]> {
  const searchParams = new URLSearchParams({
    query: params.query,
    limit: (params.limit || 10).toString()
  })

  const response = await apiClient.get<SearchSuggestion[]>(
    `/api/v1/matters/search/suggestions?${searchParams.toString()}`
  )
  
  return response.data
}

/**
 * Highlight search terms in text.
 * 
 * @param text The text to highlight
 * @param terms The search terms to highlight
 * @param className CSS class for highlighted terms
 * @returns Text with highlighted terms
 */
export function highlightSearchTerms(
  text: string, 
  terms: string[], 
  className: string = 'bg-yellow-200'
): string {
  if (!terms.length || !text) {
    return text
  }

  let highlightedText = text
  
  terms.forEach(term => {
    if (term.trim()) {
      const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
      highlightedText = highlightedText.replace(
        regex, 
        `<span class="${className}">$1</span>`
      )
    }
  })
  
  return highlightedText
}

/**
 * Extract search terms from a query string.
 * Handles quoted phrases and basic parsing.
 */
export function extractSearchTerms(query: string): string[] {
  const terms: string[] = []
  
  // Handle quoted phrases
  const quoteMatches = query.match(/"([^"]+)"/g)
  if (quoteMatches) {
    quoteMatches.forEach(match => {
      terms.push(match.replace(/"/g, ''))
    })
  }
  
  // Remove quoted phrases from query and split remaining terms
  let remainingQuery = query.replace(/"[^"]+"/g, '')
  const simpleTerms = remainingQuery
    .split(/\s+/)
    .filter(term => term.trim() && !['AND', 'OR', 'NOT'].includes(term.toUpperCase()))
  
  terms.push(...simpleTerms)
  
  return terms.filter(term => term.length > 0)
}

/**
 * Escape special regex characters in search terms.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Format search suggestion for display.
 */
export function formatSearchSuggestion(suggestion: SearchSuggestion): string {
  const typeLabels = {
    CASE_NUMBER: 'Case',
    TITLE: 'Title',
    CLIENT_NAME: 'Client',
    DESCRIPTION: 'Description'
  }
  
  const typeLabel = typeLabels[suggestion.type] || suggestion.type
  return `${suggestion.value} (${typeLabel}, ${suggestion.count} result${suggestion.count !== 1 ? 's' : ''})`
}

/**
 * Build search query with advanced operators.
 */
export function buildAdvancedQuery(params: {
  terms: string[]
  exactPhrase?: string
  fieldFilters?: Record<string, string>
  excludeTerms?: string[]
}): string {
  const parts: string[] = []
  
  // Add regular terms
  if (params.terms.length > 0) {
    parts.push(params.terms.join(' '))
  }
  
  // Add exact phrase
  if (params.exactPhrase) {
    parts.push(`"${params.exactPhrase}"`)
  }
  
  // Add field filters
  if (params.fieldFilters) {
    Object.entries(params.fieldFilters).forEach(([field, value]) => {
      parts.push(`${field}:${value}`)
    })
  }
  
  // Add exclude terms
  if (params.excludeTerms) {
    params.excludeTerms.forEach(term => {
      parts.push(`-${term}`)
    })
  }
  
  return parts.join(' ')
}