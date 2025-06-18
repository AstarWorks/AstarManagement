/**
 * SearchHighlight component for T02_S03 Advanced Search Implementation
 * 
 * Displays text with highlighted search terms.
 * Handles highlighting from backend search results and client-side highlighting.
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SearchHighlightProps {
  text: string
  highlights?: string[]
  searchTerms?: string[]
  className?: string
  highlightClassName?: string
  maxLength?: number
}

/**
 * Component that highlights search terms in text.
 * Supports both backend-provided highlights and client-side term highlighting.
 */
export function SearchHighlight({
  text,
  highlights = [],
  searchTerms = [],
  className,
  highlightClassName = 'bg-yellow-200 px-1 rounded',
  maxLength
}: SearchHighlightProps) {
  // Truncate text if maxLength is specified
  const displayText = maxLength && text.length > maxLength 
    ? `${text.slice(0, maxLength)}...` 
    : text

  // If we have backend highlights, use those
  if (highlights.length > 0) {
    return (
      <span className={className}>
        {highlights.map((highlight, index) => (
          <span key={index}>
            {index > 0 && '... '}
            <span 
              dangerouslySetInnerHTML={{ 
                __html: highlight.replace(/<b>/g, `<mark class="${highlightClassName}">`).replace(/<\/b>/g, '</mark>') 
              }} 
            />
            {index < highlights.length - 1 && ' ...'}
          </span>
        ))}
      </span>
    )
  }

  // Otherwise, highlight search terms client-side
  if (searchTerms.length > 0) {
    let highlightedText = displayText

    searchTerms.forEach(term => {
      if (term.trim()) {
        const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
        highlightedText = highlightedText.replace(
          regex,
          `<mark class="${highlightClassName}">$1</mark>`
        )
      }
    })

    return (
      <span 
        className={className}
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
    )
  }

  // No highlighting needed
  return <span className={className}>{displayText}</span>
}

/**
 * MultiFieldHighlight component for highlighting across multiple fields.
 */
interface MultiFieldHighlightProps {
  fields: Array<{
    label: string
    value: string
    highlights?: string[]
  }>
  searchTerms?: string[]
  className?: string
  fieldClassName?: string
  highlightClassName?: string
}

export function MultiFieldHighlight({
  fields,
  searchTerms = [],
  className,
  fieldClassName = 'text-sm',
  highlightClassName = 'bg-yellow-200 px-1 rounded'
}: MultiFieldHighlightProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {fields.map((field, index) => (
        <div key={index} className={fieldClassName}>
          <span className="font-medium text-gray-600">{field.label}: </span>
          <SearchHighlight
            text={field.value}
            highlights={field.highlights}
            searchTerms={searchTerms}
            highlightClassName={highlightClassName}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * SearchResultSnippet component for showing contextual snippets.
 */
interface SearchResultSnippetProps {
  text: string
  searchTerms: string[]
  maxLength?: number
  contextLength?: number
  className?: string
  highlightClassName?: string
}

export function SearchResultSnippet({
  text,
  searchTerms,
  maxLength = 200,
  contextLength = 50,
  className,
  highlightClassName = 'bg-yellow-200 px-1 rounded font-medium'
}: SearchResultSnippetProps) {
  if (!text || searchTerms.length === 0) {
    return <span className={className}>{text}</span>
  }

  // Find the first occurrence of any search term
  let firstMatchIndex = -1
  let matchedTerm = ''

  for (const term of searchTerms) {
    const index = text.toLowerCase().indexOf(term.toLowerCase())
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index
      matchedTerm = term
    }
  }

  if (firstMatchIndex === -1) {
    // No matches found, return truncated text
    return (
      <span className={className}>
        {text.length > maxLength ? `${text.slice(0, maxLength)}...` : text}
      </span>
    )
  }

  // Calculate snippet boundaries
  const start = Math.max(0, firstMatchIndex - contextLength)
  const end = Math.min(text.length, start + maxLength)
  
  let snippet = text.slice(start, end)
  
  // Add ellipsis if we're not at the beginning/end
  if (start > 0) snippet = `...${snippet}`
  if (end < text.length) snippet = `${snippet}...`

  // Highlight all search terms in the snippet
  let highlightedSnippet = snippet
  searchTerms.forEach(term => {
    if (term.trim()) {
      const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
      highlightedSnippet = highlightedSnippet.replace(
        regex,
        `<mark class="${highlightClassName}">$1</mark>`
      )
    }
  })

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
    />
  )
}

/**
 * Escape special regex characters in search terms.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Hook for extracting search terms from query.
 */
export function useSearchTerms(query: string): string[] {
  return React.useMemo(() => {
    if (!query) return []
    
    const terms: string[] = []
    
    // Handle quoted phrases
    const quoteMatches = query.match(/"([^"]+)"/g)
    if (quoteMatches) {
      quoteMatches.forEach(match => {
        terms.push(match.replace(/"/g, ''))
      })
    }
    
    // Remove quoted phrases and split remaining terms
    let remainingQuery = query.replace(/"[^"]+"/g, '')
    const simpleTerms = remainingQuery
      .split(/\s+/)
      .filter(term => term.trim() && !['AND', 'OR', 'NOT'].includes(term.toUpperCase()))
    
    terms.push(...simpleTerms)
    
    return terms.filter(term => term.length > 1) // Filter out single characters
  }, [query])
}