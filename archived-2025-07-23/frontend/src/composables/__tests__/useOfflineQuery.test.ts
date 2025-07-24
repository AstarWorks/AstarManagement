/**
 * Offline Query Tests
 * 
 * @description Test suite for offline query functionality including
 * persistence, network detection, and data freshness.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useOfflineQuery, prefetchForOffline, clearAllOfflineCache } from '../useOfflineQuery'
import { QueryClient } from '@tanstack/vue-query'
import { waitFor } from '@testing-library/vue'

// Mock VueUse online status
const mockIsOnline = ref(true)
vi.mock('@vueuse/core', () => ({
  useOnline: () => mockIsOnline,
  useIntervalFn: vi.fn()
}))

// Mock IndexedDB persister
vi.mock('~/utils/offline/indexeddb-persister', () => ({
  createIndexedDBPersister: vi.fn(() => ({
    persistClient: vi.fn(),
    restoreClient: vi.fn(),
    removeClient: vi.fn()
  })),
  isIndexedDBAvailable: vi.fn(() => true)
}))

// Mock TanStack Query
let mockQueryClient: QueryClient
vi.mock('@tanstack/vue-query', async () => {
  const actual = await vi.importActual('@tanstack/vue-query')
  return {
    ...actual,
    useQueryClient: () => mockQueryClient,
    useQuery: vi.fn((options) => {
      const data = ref(undefined)
      const error = ref(null)
      const isLoading = ref(true)
      const isError = ref(false)
      const isSuccess = ref(false)
      const isPending = ref(true)
      const isStale = ref(false)
      const isFetching = ref(false)
      
      // Simulate query execution
      Promise.resolve()
        .then(async () => {
          try {
            const result = await options.queryFn()
            data.value = result
            isSuccess.value = true
            isError.value = false
          } catch (err) {
            error.value = err
            isError.value = true
            isSuccess.value = false
          } finally {
            isLoading.value = false
            isPending.value = false
          }
        })
      
      return {
        data,
        error,
        isLoading,
        isError,
        isSuccess,
        isPending,
        isStale,
        isFetching,
        refetch: vi.fn()
      }
    })
  }
})

describe('useOfflineQuery', () => {
  beforeEach(() => {
    mockQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    mockIsOnline.value = true
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Basic Functionality', () => {
    it('should execute query when online', async () => {
      const mockData = { id: 1, title: 'Test Matter' }
      const queryFn = vi.fn().mockResolvedValue(mockData)
      
      const { data, isOffline, isFromCache } = useOfflineQuery(
        ['test-query'],
        queryFn
      )
      
      await waitFor(() => {
        expect(queryFn).toHaveBeenCalled()
        expect(data.value).toEqual(mockData)
        expect(isOffline.value).toBe(false)
        expect(isFromCache.value).toBe(false)
      })
    })
    
    it('should return cached data when offline', async () => {
      const mockData = { id: 1, title: 'Cached Matter' }
      const queryFn = vi.fn().mockRejectedValue(new Error('Network error'))
      
      // Mock cached data
      vi.spyOn(mockQueryClient, 'getQueryData').mockReturnValue(mockData)
      
      // Go offline
      mockIsOnline.value = false
      
      const { data, isOffline, isFromCache } = useOfflineQuery(
        ['test-query'],
        queryFn
      )
      
      await waitFor(() => {
        expect(isOffline.value).toBe(true)
        expect(isFromCache.value).toBe(true)
        expect(data.value).toEqual(mockData)
      })
    })
    
    it('should use fallback data when offline and no cache', async () => {
      const fallbackData = { id: 0, title: 'Fallback Matter' }
      const queryFn = vi.fn().mockRejectedValue(new Error('Network error'))
      
      // No cached data
      vi.spyOn(mockQueryClient, 'getQueryData').mockReturnValue(undefined)
      
      // Go offline
      mockIsOnline.value = false
      
      const { data, isFromCache } = useOfflineQuery(
        ['test-query'],
        queryFn,
        { offlineFallback: fallbackData }
      )
      
      await waitFor(() => {
        expect(isFromCache.value).toBe(true)
        expect(data.value).toEqual(fallbackData)
      })
    })
  })
  
  describe('Data Freshness', () => {
    it('should track data freshness correctly', async () => {
      const mockData = { id: 1, title: 'Test Matter' }
      const queryFn = vi.fn().mockResolvedValue(mockData)
      
      const { dataFreshness, lastSyncTime } = useOfflineQuery(
        ['test-query'],
        queryFn,
        { showFreshness: true }
      )
      
      await waitFor(() => {
        expect(lastSyncTime.value).toBeGreaterThan(0)
        expect(dataFreshness.value).toBe('fresh')
      })
    })
  })
  
  describe('Network Status Changes', () => {
    it('should refetch when coming back online', async () => {
      const mockData = { id: 1, title: 'Test Matter' }
      const queryFn = vi.fn().mockResolvedValue(mockData)
      const refetchMock = vi.fn()
      
      // Start offline
      mockIsOnline.value = false
      
      // Mock the query with refetch
      const mockUseQuery = vi.mocked(await import('@tanstack/vue-query')).useQuery
      mockUseQuery.mockReturnValue({
        data: ref(mockData),
        error: ref(null),
        isLoading: ref(false),
        isError: ref(false),
        isSuccess: ref(true),
        isPending: ref(false),
        isStale: ref(true),
        isFetching: ref(false),
        refetch: refetchMock
      } as any)
      
      useOfflineQuery(['test-query'], queryFn)
      
      // Go back online
      mockIsOnline.value = true
      
      await waitFor(() => {
        expect(refetchMock).toHaveBeenCalled()
      })
    })
  })
  
  describe('Manual Operations', () => {
    it('should sync manually when online', async () => {
      const mockData = { id: 1, title: 'Test Matter' }
      const queryFn = vi.fn().mockResolvedValue(mockData)
      const refetchMock = vi.fn().mockResolvedValue({ data: mockData })
      
      const mockUseQuery = vi.mocked(await import('@tanstack/vue-query')).useQuery
      mockUseQuery.mockReturnValue({
        data: ref(mockData),
        error: ref(null),
        isLoading: ref(false),
        isError: ref(false),
        isSuccess: ref(true),
        isPending: ref(false),
        isStale: ref(false),
        isFetching: ref(false),
        refetch: refetchMock
      } as any)
      
      const { syncNow } = useOfflineQuery(['test-query'], queryFn)
      
      await syncNow()
      
      expect(refetchMock).toHaveBeenCalled()
    })
    
    it('should throw error when syncing offline', async () => {
      const queryFn = vi.fn()
      mockIsOnline.value = false
      
      const { syncNow } = useOfflineQuery(['test-query'], queryFn)
      
      await expect(syncNow()).rejects.toThrow('Cannot sync while offline')
    })
    
    it('should clear cache', async () => {
      const queryFn = vi.fn()
      const removeQueriesMock = vi.fn()
      
      vi.spyOn(mockQueryClient, 'removeQueries').mockImplementation(removeQueriesMock)
      
      const { clearCache } = useOfflineQuery(['test-query'], queryFn)
      
      await clearCache()
      
      expect(removeQueriesMock).toHaveBeenCalledWith({ queryKey: ['test-query'] })
    })
  })
})

describe('Offline Utilities', () => {
  describe('prefetchForOffline', () => {
    it('should prefetch multiple queries', async () => {
      const prefetchQueryMock = vi.fn()
      vi.spyOn(mockQueryClient, 'prefetchQuery').mockImplementation(prefetchQueryMock)
      
      const queries = [
        {
          queryKey: ['matters'],
          queryFn: () => Promise.resolve([{ id: 1 }])
        },
        {
          queryKey: ['documents'],
          queryFn: () => Promise.resolve([{ id: 2 }])
        }
      ]
      
      await prefetchForOffline(queries)
      
      expect(prefetchQueryMock).toHaveBeenCalledTimes(2)
      expect(prefetchQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['matters']
        })
      )
      expect(prefetchQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['documents']
        })
      )
    })
  })
  
  describe('clearAllOfflineCache', () => {
    it('should clear all cache', async () => {
      const clearMock = vi.fn()
      vi.spyOn(mockQueryClient, 'clear').mockImplementation(clearMock)
      
      await clearAllOfflineCache()
      
      expect(clearMock).toHaveBeenCalled()
    })
  })
})