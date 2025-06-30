// GET /api/memos/search/suggestions - Search suggestions API endpoint for T04_S13

import type { MemoSearchSuggestion } from '~/types/memo'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchTerm = (query.q as string) || ''
  
  if (!searchTerm || searchTerm.length < 2) {
    return { suggestions: [] }
  }
  
  // Mock suggestions - in real implementation, this would query the database
  const mockSuggestions: MemoSearchSuggestion[] = [
    // Recipients
    {
      id: 'rec-1',
      type: 'recipient',
      value: 'Acme Corporation',
      count: 12,
      highlight: searchTerm
    },
    {
      id: 'rec-2',
      type: 'recipient',
      value: 'Tech Startup Inc.',
      count: 8,
      highlight: searchTerm
    },
    {
      id: 'rec-3',
      type: 'recipient',
      value: 'District Court',
      count: 15,
      highlight: searchTerm
    },
    {
      id: 'rec-4',
      type: 'recipient',
      value: 'Smith & Associates',
      count: 6,
      highlight: searchTerm
    },
    // Tags
    {
      id: 'tag-1',
      type: 'tag',
      value: 'urgent',
      count: 23,
      highlight: searchTerm
    },
    {
      id: 'tag-2',
      type: 'tag',
      value: 'contract',
      count: 45,
      highlight: searchTerm
    },
    {
      id: 'tag-3',
      type: 'tag',
      value: 'review',
      count: 34,
      highlight: searchTerm
    },
    {
      id: 'tag-4',
      type: 'tag',
      value: 'filing',
      count: 19,
      highlight: searchTerm
    },
    // Cases
    {
      id: 'case-1',
      type: 'case',
      value: 'CASE-2024-001',
      count: 7,
      highlight: searchTerm
    },
    {
      id: 'case-2',
      type: 'case',
      value: 'CASE-2024-002',
      count: 5,
      highlight: searchTerm
    },
    {
      id: 'case-3',
      type: 'case',
      value: 'CASE-2024-003',
      count: 9,
      highlight: searchTerm
    },
    // Subjects
    {
      id: 'subj-1',
      type: 'subject',
      value: 'Contract Review',
      count: 18,
      highlight: searchTerm
    },
    {
      id: 'subj-2',
      type: 'subject',
      value: 'Legal Opinion',
      count: 12,
      highlight: searchTerm
    },
    {
      id: 'subj-3',
      type: 'subject',
      value: 'Motion to Dismiss',
      count: 8,
      highlight: searchTerm
    },
    {
      id: 'subj-4',
      type: 'subject',
      value: 'Settlement Proposal',
      count: 6,
      highlight: searchTerm
    }
  ]
  
  // Filter suggestions based on search term
  const searchLower = searchTerm.toLowerCase()
  const filteredSuggestions = mockSuggestions.filter(suggestion =>
    suggestion.value.toLowerCase().includes(searchLower)
  )
  
  // Sort by count (descending) and limit to top 10
  const sortedSuggestions = filteredSuggestions
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Add highlighting information
  const suggestionsWithHighlight = sortedSuggestions.map(suggestion => ({
    ...suggestion,
    highlight: searchTerm
  }))
  
  return {
    suggestions: suggestionsWithHighlight
  }
})