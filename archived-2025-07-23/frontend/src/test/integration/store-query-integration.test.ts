/**
 * Store and TanStack Query Integration Tests
 * 
 * @description Tests the integration between Pinia stores and TanStack Query,
 * including cache synchronization, optimistic updates, and error handling
 * @author Claude
 * @created 2025-06-26
 * @task T02_S09 - Integration Testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp, nextTick } from 'vue'
import { mountWithQuery, createMockMatter, waitForAsync } from '@/test/utils'
import { useMatterStore } from '@/stores/kanban/matters'
import { useKanbanStore } from '@/stores/kanban'
import { useMattersQuery } from '@/composables/useMattersQuery'

describe('Store and Query Integration', () => {
  let pinia: any
  let queryClient: QueryClient
  let app: any

  beforeEach(() => {
    // Setup Pinia
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Setup QueryClient
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    // Setup Vue app with plugins
    app = createApp({})
    app.use(pinia)
    app.use(VueQueryPlugin, { queryClient })

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
    app.unmount()
    vi.clearAllMocks()
  })

  describe('Store-Query Cache Synchronization', () => {
    it('should sync store state with query cache', async () => {
      const mockMatters = [
        createMockMatter({ id: 'matter-1', title: 'Test Matter 1' }),
        createMockMatter({ id: 'matter-2', title: 'Test Matter 2' })
      ]

      // Mock successful API response
      global.$fetch = vi.fn().mockResolvedValue(mockMatters)

      // Create test component that uses both store and query
      const TestComponent = {
        setup() {
          const store = useMatterStore()
          const { data, isLoading } = useMattersQuery()
          return { store, data, isLoading }
        },
        template: '<div>Test</div>'
      }

      const wrapper = mountWithQuery(TestComponent)
      await waitForAsync(wrapper)

      // Verify both store and query have the data
      expect(wrapper.vm.store.matters).toEqual(mockMatters)
      expect(wrapper.vm.data).toEqual(mockMatters)
    })

    it('should update query cache when store is modified', async () => {
      const store = useMatterStore()
      const matter = createMockMatter({ id: 'matter-1' })

      // Add matter to store
      store.addMatter(matter)

      // Verify query cache is updated
      const cachedData = queryClient.getQueryData(['matters'])
      expect(cachedData).toContain(matter)
    })

    it('should invalidate queries when store performs mutations', async () => {
      const store = useMatterStore()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      // Perform store mutation
      await store.updateMatter('matter-1', { status: 'COMPLETED' })

      // Verify queries are invalidated
      expect(invalidateSpy).toHaveBeenCalledWith(['matters'])
    })
  })

  describe('Optimistic Updates Integration', () => {
    it('should handle optimistic updates with rollback on error', async () => {
      const store = useMatterStore()
      const matter = createMockMatter({ id: 'matter-1', status: 'INTAKE' })
      
      // Initialize store with matter
      store.setMatters([matter])

      // Mock API failure
      global.$fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      // Attempt optimistic update
      const updatePromise = store.updateMatterOptimistic('matter-1', { status: 'COMPLETED' })

      // Verify optimistic update applied immediately
      expect(store.getMatterById('matter-1')?.status).toBe('COMPLETED')

      // Wait for promise to resolve/reject
      await expect(updatePromise).rejects.toThrow('Network error')

      // Verify rollback occurred
      expect(store.getMatterById('matter-1')?.status).toBe('INTAKE')
    })

    it('should sync optimistic updates with query cache', async () => {
      const store = useMatterStore()
      const matter = createMockMatter({ id: 'matter-1', title: 'Original Title' })

      // Setup initial data in both store and cache
      store.setMatters([matter])
      queryClient.setQueryData(['matters'], [matter])

      // Mock successful API response
      const updatedMatter = { ...matter, title: 'Updated Title' }
      global.$fetch = vi.fn().mockResolvedValue(updatedMatter)

      // Perform optimistic update
      await store.updateMatterOptimistic('matter-1', { title: 'Updated Title' })

      // Verify both store and cache are updated
      expect(store.getMatterById('matter-1')?.title).toBe('Updated Title')
      const cachedData = queryClient.getQueryData(['matters']) as any[]
      expect(cachedData.find(m => m.id === 'matter-1')?.title).toBe('Updated Title')
    })
  })

  describe('Error Handling Integration', () => {
    it('should propagate errors from query to store', async () => {
      const store = useMatterStore()
      
      // Mock API error
      global.$fetch = vi.fn().mockRejectedValue(new Error('Server error'))

      // Attempt to load matters
      await expect(store.loadMatters()).rejects.toThrow('Server error')

      // Verify error state is set in store
      expect(store.error).toBe('Failed to load matters')
      expect(store.isLoading).toBe(false)
    })

    it('should handle concurrent error scenarios', async () => {
      const store = useMatterStore()
      
      // Mock different errors for different operations
      global.$fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Load error'))
        .mockRejectedValueOnce(new Error('Update error'))

      // Attempt concurrent operations
      const loadPromise = store.loadMatters().catch(e => e)
      const updatePromise = store.updateMatter('matter-1', { status: 'COMPLETED' }).catch(e => e)

      const [loadResult, updateResult] = await Promise.all([loadPromise, updatePromise])

      // Verify both errors are handled appropriately
      expect(loadResult).toBeInstanceOf(Error)
      expect(updateResult).toBeInstanceOf(Error)
      expect(store.error).toBeTruthy()
    })

    it('should recover from error states', async () => {
      const store = useMatterStore()
      
      // Set error state
      store.error = 'Previous error'
      store.isLoading = false

      // Mock successful recovery
      const mockMatters = [createMockMatter()]
      global.$fetch = vi.fn().mockResolvedValue(mockMatters)

      // Attempt recovery operation
      await store.loadMatters()

      // Verify error state is cleared
      expect(store.error).toBeNull()
      expect(store.matters).toEqual(mockMatters)
    })
  })

  describe('Cross-Store Integration', () => {
    it('should coordinate between multiple stores', async () => {
      const matterStore = useMatterStore()
      const kanbanStore = useKanbanStore()

      const matter = createMockMatter({ id: 'matter-1', status: 'INTAKE' })

      // Add matter to matter store
      matterStore.addMatter(matter)

      // Move matter in kanban store
      kanbanStore.moveMatter('matter-1', 'INTAKE', 'IN_PROGRESS', 0)

      // Verify matter is updated in matter store
      expect(matterStore.getMatterById('matter-1')?.status).toBe('IN_PROGRESS')
    })

    it('should handle store dependency chains', async () => {
      const matterStore = useMatterStore()
      const kanbanStore = useKanbanStore()

      // Mock successful API responses
      const matters = [
        createMockMatter({ id: 'matter-1', status: 'INTAKE' }),
        createMockMatter({ id: 'matter-2', status: 'IN_PROGRESS' })
      ]
      global.$fetch = vi.fn().mockResolvedValue(matters)

      // Load matters (should trigger kanban store updates)
      await matterStore.loadMatters()

      // Verify kanban store reflects the data
      expect(kanbanStore.getMattersByStatus('INTAKE')).toHaveLength(1)
      expect(kanbanStore.getMattersByStatus('IN_PROGRESS')).toHaveLength(1)
    })
  })

  describe('Real-time Integration', () => {
    it('should handle real-time updates affecting multiple stores', async () => {
      const matterStore = useMatterStore()
      const kanbanStore = useKanbanStore()

      const matter = createMockMatter({ id: 'matter-1', status: 'INTAKE' })
      matterStore.setMatters([matter])

      // Simulate real-time update
      const realtimeUpdate = {
        type: 'matter_updated',
        data: {
          id: 'matter-1',
          status: 'COMPLETED',
          updatedAt: new Date().toISOString()
        }
      }

      // Process real-time update
      matterStore.handleRealtimeUpdate(realtimeUpdate)

      // Verify both stores are updated
      expect(matterStore.getMatterById('matter-1')?.status).toBe('COMPLETED')
      expect(kanbanStore.getMattersByStatus('COMPLETED')).toHaveLength(1)
      expect(kanbanStore.getMattersByStatus('INTAKE')).toHaveLength(0)
    })

    it('should handle conflicting real-time updates', async () => {
      const store = useMatterStore()
      const matter = createMockMatter({ 
        id: 'matter-1', 
        status: 'INTAKE',
        version: 1 
      })
      store.setMatters([matter])

      // Simulate conflicting updates (out of order)
      const olderUpdate = {
        type: 'matter_updated',
        data: { id: 'matter-1', status: 'IN_PROGRESS', version: 2 }
      }
      const newerUpdate = {
        type: 'matter_updated',
        data: { id: 'matter-1', status: 'COMPLETED', version: 3 }
      }

      // Process newer update first
      store.handleRealtimeUpdate(newerUpdate)
      expect(store.getMatterById('matter-1')?.status).toBe('COMPLETED')

      // Process older update (should be ignored)
      store.handleRealtimeUpdate(olderUpdate)
      expect(store.getMatterById('matter-1')?.status).toBe('COMPLETED') // Should remain unchanged
    })
  })

  describe('Performance Integration', () => {
    it('should batch multiple updates efficiently', async () => {
      const store = useMatterStore()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      // Perform multiple updates
      store.addMatter(createMockMatter({ id: 'matter-1' }))
      store.addMatter(createMockMatter({ id: 'matter-2' }))
      store.addMatter(createMockMatter({ id: 'matter-3' }))

      // Wait for batch processing
      await nextTick()

      // Verify invalidation was batched (should be called once, not three times)
      expect(invalidateSpy).toHaveBeenCalledTimes(1)
    })

    it('should handle large datasets efficiently', async () => {
      const store = useMatterStore()
      
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        createMockMatter({ id: `matter-${i}` })
      )

      const startTime = performance.now()
      
      // Set large dataset
      store.setMatters(largeDataset)
      
      const endTime = performance.now()
      
      // Verify operation completed in reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      expect(store.matters).toHaveLength(1000)
    })
  })

  describe('Cache Management Integration', () => {
    it('should properly manage cache lifecycles', async () => {
      const store = useMatterStore()
      
      // Setup initial data
      const matters = [createMockMatter({ id: 'matter-1' })]
      store.setMatters(matters)
      queryClient.setQueryData(['matters'], matters)

      // Clear store (simulating component unmount)
      store.$reset()

      // Verify cache is maintained (for potential reuse)
      const cachedData = queryClient.getQueryData(['matters'])
      expect(cachedData).toEqual(matters)
    })

    it('should handle cache invalidation cascades', async () => {
      const store = useMatterStore()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      // Setup related queries in cache
      queryClient.setQueryData(['matters'], [])
      queryClient.setQueryData(['matters', 'stats'], {})
      queryClient.setQueryData(['matters', 'search'], [])

      // Trigger update that should invalidate related queries
      await store.updateMatter('matter-1', { status: 'COMPLETED' })

      // Verify cascade invalidation
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['matters'] })
    })
  })
})