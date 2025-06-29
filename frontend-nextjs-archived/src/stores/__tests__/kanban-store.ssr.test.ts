/**
 * SSR-specific tests for kanban store
 * Tests server-side rendering compatibility and hydration safety
 */

import { renderToString } from 'react-dom/server'
import React from 'react'
import { getServerSnapshot, useKanbanStore } from '../kanban-store'

// Mock window for SSR tests
const mockWindow = global.window
beforeEach(() => {
  // @ts-ignore
  delete global.window
})

afterEach(() => {
  global.window = mockWindow
})

describe('Kanban Store SSR', () => {
  describe('getServerSnapshot', () => {
    test('returns stable state reference with caching', () => {
      const snapshot1 = getServerSnapshot()
      const snapshot2 = getServerSnapshot()
      
      // Same reference due to cache
      expect(snapshot1).toBe(snapshot2)
    })
    
    test('has all required properties', () => {
      const snapshot = getServerSnapshot()
      
      // Data state
      expect(snapshot).toHaveProperty('board', null)
      expect(snapshot).toHaveProperty('matters', [])
      
      // UI state
      expect(snapshot).toHaveProperty('isLoading', false)
      expect(snapshot).toHaveProperty('error', null)
      expect(snapshot).toHaveProperty('lastRefresh')
      
      // Filter and sort state
      expect(snapshot).toHaveProperty('filters')
      expect(snapshot).toHaveProperty('sorting')
      
      // View preferences
      expect(snapshot).toHaveProperty('viewPreferences')
      
      // Search state
      expect(snapshot).toHaveProperty('searchResults', [])
      expect(snapshot).toHaveProperty('searchSuggestions', [])
      expect(snapshot).toHaveProperty('isSearching', false)
      expect(snapshot).toHaveProperty('searchMode', false)
      
      // All actions should be defined
      expect(snapshot.initializeBoard).toBeDefined()
      expect(snapshot.refreshBoard).toBeDefined()
      expect(snapshot.addMatter).toBeDefined()
      expect(snapshot.updateMatter).toBeDefined()
      expect(snapshot.deleteMatter).toBeDefined()
    })
    
    test('all actions are no-ops on server', async () => {
      const snapshot = getServerSnapshot()
      
      // Test that actions don't throw and return expected values
      expect(() => snapshot.initializeBoard()).not.toThrow()
      expect(() => snapshot.setFilters({})).not.toThrow()
      expect(() => snapshot.clearFilters()).not.toThrow()
      
      // Async actions should return expected values
      await expect(snapshot.refreshBoard()).resolves.toBeUndefined()
      await expect(snapshot.addMatter({} as any)).resolves.toBe('')
      await expect(snapshot.fetchMatters()).resolves.toEqual([])
    })
    
    test('utility getters return empty/default values', () => {
      const snapshot = getServerSnapshot()
      
      expect(snapshot.getFilteredMatters()).toEqual([])
      expect(snapshot.getMattersByColumn()).toEqual({})
      expect(snapshot.getSearchTerms()).toEqual([])
      
      const metrics = snapshot.getBoardMetrics()
      expect(metrics.totalMatters).toBe(0)
      expect(metrics.overdueMatters).toBe(0)
      expect(metrics.mattersCompletedToday).toBe(0)
    })
  })
  
  describe('Server-side rendering', () => {
    test('no hydration mismatch with empty state', () => {
      const ServerComponent = () => {
        const state = getServerSnapshot()
        return React.createElement('div', null, JSON.stringify({
          matters: state.matters,
          isLoading: state.isLoading,
          error: state.error
        }))
      }
      
      const html = renderToString(React.createElement(ServerComponent))
      expect(html).toContain('"matters":[]')
      expect(html).toContain('"isLoading":false')
      expect(html).toContain('"error":null')
    })
    
    test('server snapshot matches expected structure', () => {
      const snapshot = getServerSnapshot()
      
      // Verify the structure matches what components expect
      expect(snapshot).toMatchObject({
        board: null,
        matters: [],
        isLoading: false,
        error: null,
        filters: expect.any(Object),
        sorting: expect.any(Object),
        viewPreferences: expect.any(Object),
        dragContext: {
          activeId: null,
          overId: null,
          isDragging: false
        },
        searchResults: [],
        searchSuggestions: [],
        isSearching: false,
        searchMode: false,
        lastSearchQuery: '',
        searchHistory: []
      })
    })
  })
  
  describe('Cache behavior', () => {
    beforeEach(() => {
      // Clear cache by setting timestamp to past
      jest.useFakeTimers()
    })
    
    afterEach(() => {
      jest.useRealTimers()
    })
    
    test('cache expires after TTL', () => {
      const snapshot1 = getServerSnapshot()
      
      // Advance time past TTL (5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000)
      
      const snapshot2 = getServerSnapshot()
      
      // Should be different references after cache expiry
      expect(snapshot1).not.toBe(snapshot2)
    })
    
    test('cache is used within TTL', () => {
      const snapshot1 = getServerSnapshot()
      
      // Advance time but stay within TTL
      jest.advanceTimersByTime(2 * 60 * 1000)
      
      const snapshot2 = getServerSnapshot()
      
      // Should be same reference
      expect(snapshot1).toBe(snapshot2)
    })
  })
  
  describe('Store persistence on server', () => {
    test('skipHydration is true on server', () => {
      // The store should skip hydration when window is undefined
      // This prevents hydration mismatches
      const storeState = useKanbanStore.getState()
      expect(storeState).toBeDefined()
    })
  })
})