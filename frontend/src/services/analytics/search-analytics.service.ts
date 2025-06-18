/**
 * Search Analytics Service for T02_S03 Advanced Search Implementation
 * 
 * Tracks search queries, click-through rates, and performance metrics
 * for improving search functionality over time.
 */

export interface SearchAnalyticsEvent {
  type: 'search_query' | 'search_click' | 'search_suggestion_click' | 'search_clear'
  query?: string
  resultId?: string
  position?: number
  timestamp: string
  sessionId: string
  userId?: string
  searchType?: string
  resultsCount?: number
  responseTime?: number
}

export interface SearchMetrics {
  totalQueries: number
  uniqueQueries: number
  averageResponseTime: number
  clickThroughRate: number
  popularQueries: Array<{ query: string; count: number }>
  zeroResultQueries: Array<{ query: string; count: number }>
}

class SearchAnalyticsService {
  private sessionId: string
  private events: SearchAnalyticsEvent[] = []
  private readonly STORAGE_KEY = 'search_analytics_events'
  private readonly MAX_STORED_EVENTS = 1000

  constructor() {
    this.sessionId = this.generateSessionId()
    this.loadStoredEvents()
  }

  /**
   * Track a search query.
   */
  trackSearchQuery(params: {
    query: string
    searchType?: string
    resultsCount?: number
    responseTime?: number
    userId?: string
  }): void {
    const event: SearchAnalyticsEvent = {
      type: 'search_query',
      query: params.query,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: params.userId,
      searchType: params.searchType,
      resultsCount: params.resultsCount,
      responseTime: params.responseTime
    }

    this.addEvent(event)
  }

  /**
   * Track when a user clicks on a search result.
   */
  trackSearchClick(params: {
    query: string
    resultId: string
    position: number
    userId?: string
  }): void {
    const event: SearchAnalyticsEvent = {
      type: 'search_click',
      query: params.query,
      resultId: params.resultId,
      position: params.position,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: params.userId
    }

    this.addEvent(event)
  }

  /**
   * Track when a user clicks on a search suggestion.
   */
  trackSuggestionClick(params: {
    query: string
    selectedSuggestion: string
    position: number
    userId?: string
  }): void {
    const event: SearchAnalyticsEvent = {
      type: 'search_suggestion_click',
      query: params.selectedSuggestion,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: params.userId,
      position: params.position
    }

    this.addEvent(event)
  }

  /**
   * Track when a user clears their search.
   */
  trackSearchClear(params: {
    query: string
    userId?: string
  }): void {
    const event: SearchAnalyticsEvent = {
      type: 'search_clear',
      query: params.query,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: params.userId
    }

    this.addEvent(event)
  }

  /**
   * Get search metrics for analysis.
   */
  getSearchMetrics(timeframe?: { start: Date; end: Date }): SearchMetrics {
    let events = this.events

    // Filter by timeframe if provided
    if (timeframe) {
      events = events.filter(event => {
        const eventTime = new Date(event.timestamp)
        return eventTime >= timeframe.start && eventTime <= timeframe.end
      })
    }

    const searchQueries = events.filter(e => e.type === 'search_query')
    const searchClicks = events.filter(e => e.type === 'search_click')

    // Calculate metrics
    const totalQueries = searchQueries.length
    const uniqueQueries = new Set(searchQueries.map(e => e.query)).size
    
    const responseTimesWithValues = searchQueries
      .map(e => e.responseTime)
      .filter((time): time is number => time !== undefined)
    const averageResponseTime = responseTimesWithValues.length > 0
      ? responseTimesWithValues.reduce((sum, time) => sum + time, 0) / responseTimesWithValues.length
      : 0

    // Calculate click-through rate
    const queriesWithResults = searchQueries.filter(e => (e.resultsCount || 0) > 0)
    const clickThroughRate = queriesWithResults.length > 0
      ? searchClicks.length / queriesWithResults.length
      : 0

    // Popular queries
    const queryCount = new Map<string, number>()
    searchQueries.forEach(event => {
      if (event.query) {
        queryCount.set(event.query, (queryCount.get(event.query) || 0) + 1)
      }
    })
    
    const popularQueries = Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Zero result queries
    const zeroResultQueries = searchQueries
      .filter(e => e.resultsCount === 0)
      .reduce((acc, event) => {
        if (event.query) {
          const existing = acc.find(item => item.query === event.query)
          if (existing) {
            existing.count++
          } else {
            acc.push({ query: event.query, count: 1 })
          }
        }
        return acc
      }, [] as Array<{ query: string; count: number }>)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalQueries,
      uniqueQueries,
      averageResponseTime: Math.round(averageResponseTime),
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
      popularQueries,
      zeroResultQueries
    }
  }

  /**
   * Export analytics data for analysis.
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp',
        'type',
        'query',
        'resultId',
        'position',
        'sessionId',
        'userId',
        'searchType',
        'resultsCount',
        'responseTime'
      ]

      const csvData = [
        headers.join(','),
        ...this.events.map(event => [
          event.timestamp,
          event.type,
          event.query || '',
          event.resultId || '',
          event.position || '',
          event.sessionId,
          event.userId || '',
          event.searchType || '',
          event.resultsCount || '',
          event.responseTime || ''
        ].map(field => `"${field}"`).join(','))
      ]

      return csvData.join('\n')
    }

    return JSON.stringify(this.events, null, 2)
  }

  /**
   * Clear all analytics data.
   */
  clearData(): void {
    this.events = []
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * Get events for debugging.
   */
  getEvents(): SearchAnalyticsEvent[] {
    return [...this.events]
  }

  private addEvent(event: SearchAnalyticsEvent): void {
    this.events.push(event)
    
    // Trim events if we have too many
    if (this.events.length > this.MAX_STORED_EVENTS) {
      this.events = this.events.slice(-this.MAX_STORED_EVENTS)
    }
    
    this.saveEvents()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.events = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load stored search analytics events:', error)
      this.events = []
    }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events))
    } catch (error) {
      console.warn('Failed to save search analytics events:', error)
    }
  }
}

// Export singleton instance
export const searchAnalytics = new SearchAnalyticsService()

// Hook for React components
export function useSearchAnalytics() {
  return {
    trackSearchQuery: searchAnalytics.trackSearchQuery.bind(searchAnalytics),
    trackSearchClick: searchAnalytics.trackSearchClick.bind(searchAnalytics),
    trackSuggestionClick: searchAnalytics.trackSuggestionClick.bind(searchAnalytics),
    trackSearchClear: searchAnalytics.trackSearchClear.bind(searchAnalytics),
    getMetrics: searchAnalytics.getSearchMetrics.bind(searchAnalytics),
    exportData: searchAnalytics.exportData.bind(searchAnalytics),
    clearData: searchAnalytics.clearData.bind(searchAnalytics)
  }
}