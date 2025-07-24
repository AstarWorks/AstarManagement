/**
 * Offline/Online State Integration Tests
 * 
 * @description Tests application behavior during network state transitions,
 * offline data persistence, and sync mechanisms when connection is restored
 * @author Claude
 * @created 2025-06-26
 * @task T02_S09 - Integration Testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mountWithQuery, createMockMatter, waitForAsync, findByTestId } from '@/test/utils'
import { setActivePinia, createPinia } from 'pinia'
import { QueryClient } from '@tanstack/vue-query'
import { nextTick } from 'vue'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'
import { useKanbanStore } from '@/stores/kanban'
import { useMatterStore } from '@/stores/kanban/matters'
import { useOfflineStore } from '@/stores/offline'

// Mock network state
let mockOnlineState = true
const mockNavigator = {
  onLine: mockOnlineState
}

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
})

// Mock IndexedDB for offline storage
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
}

global.indexedDB = mockIndexedDB as any

// Mock service worker for background sync
const mockServiceWorker = {
  register: vi.fn().mockResolvedValue({
    sync: {
      register: vi.fn()
    }
  }),
  ready: Promise.resolve({
    sync: {
      register: vi.fn()
    }
  })
}

Object.defineProperty(window, 'navigator', {
  value: {
    ...mockNavigator,
    serviceWorker: mockServiceWorker
  },
  writable: true
})

describe('Offline/Online Integration', () => {
  let pinia: any
  let queryClient: QueryClient

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          networkMode: 'offlineFirst' // Enable offline-first behavior
        },
        mutations: { 
          retry: false,
          networkMode: 'offlineFirst'
        }
      }
    })

    // Reset network state
    mockOnlineState = true
    mockNavigator.onLine = true
    
    // Mock successful API responses by default
    global.$fetch = vi.fn().mockResolvedValue([])
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  // Helper to simulate network state change
  const setNetworkState = (online: boolean) => {
    mockOnlineState = online
    mockNavigator.onLine = online
    
    // Dispatch online/offline events
    const event = new Event(online ? 'online' : 'offline')
    window.dispatchEvent(event)
  }

  describe('Network State Detection', () => {
    it('should detect initial online state', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      await waitForAsync(wrapper)

      const offlineStore = useOfflineStore()
      expect(offlineStore.isOnline).toBe(true)
      
      const networkIndicator = findByTestId(wrapper, 'network-status')
      expect(networkIndicator.text()).toContain('Online')
    })

    it('should detect network state changes', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const offlineStore = useOfflineStore()

      // Go offline
      setNetworkState(false)
      await nextTick()

      expect(offlineStore.isOnline).toBe(false)
      
      const networkIndicator = findByTestId(wrapper, 'network-status')
      expect(networkIndicator.text()).toContain('Offline')

      // Go back online
      setNetworkState(true)
      await nextTick()

      expect(offlineStore.isOnline).toBe(true)
      expect(networkIndicator.text()).toContain('Online')
    })

    it('should show offline notification when connection is lost', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      
      setNetworkState(false)
      await nextTick()

      const offlineNotification = findByTestId(wrapper, 'offline-notification')
      expect(offlineNotification.exists()).toBe(true)
      expect(offlineNotification.text()).toContain('You are offline')
    })
  })

  describe('Offline Data Persistence', () => {
    it('should persist data to local storage when offline', async () => {
      const matters = [
        createMockMatter({ id: 'matter-1', title: 'Offline Matter' })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const offlineStore = useOfflineStore()
      const matterStore = useMatterStore()

      // Go offline
      setNetworkState(false)
      await nextTick()

      // Create new matter while offline
      const newMatter = createMockMatter({ 
        id: 'offline-matter', 
        title: 'Created Offline'
      })
      
      await matterStore.createMatterOffline(newMatter)

      // Verify matter is stored locally
      expect(offlineStore.pendingOperations).toHaveLength(1)
      expect(offlineStore.pendingOperations[0].type).toBe('create_matter')
      expect(offlineStore.pendingOperations[0].data).toEqual(newMatter)
    })

    it('should update matters optimistically while offline', async () => {
      const matters = [
        createMockMatter({ id: 'matter-1', title: 'Original Title' })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const matterStore = useMatterStore()
      const offlineStore = useOfflineStore()

      // Go offline
      setNetworkState(false)
      await nextTick()

      // Update matter while offline
      await matterStore.updateMatterOffline('matter-1', { 
        title: 'Updated Offline' 
      })

      // Verify optimistic update applied
      const updatedMatter = matterStore.getMatterById('matter-1')
      expect(updatedMatter?.title).toBe('Updated Offline')

      // Verify operation queued for sync
      expect(offlineStore.pendingOperations).toHaveLength(1)
      expect(offlineStore.pendingOperations[0].type).toBe('update_matter')
    })

    it('should prevent data loss during offline operations', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const offlineStore = useOfflineStore()

      // Go offline
      setNetworkState(false)
      await nextTick()

      // Perform multiple operations
      const operations = [
        { type: 'create_matter', data: createMockMatter({ id: 'new-1' }) },
        { type: 'update_matter', data: { id: 'existing-1', title: 'Updated' } },
        { type: 'delete_matter', data: { id: 'old-1' } }
      ]

      for (const op of operations) {
        offlineStore.queueOperation(op)
      }

      // Simulate page refresh (component unmount/mount)
      wrapper.unmount()
      const newWrapper = mountWithQuery(KanbanBoard)
      await waitForAsync(newWrapper)

      const newOfflineStore = useOfflineStore()
      
      // Verify operations persisted across component lifecycle
      expect(newOfflineStore.pendingOperations).toHaveLength(3)
    })
  })

  describe('Synchronization on Reconnection', () => {
    it('should sync pending operations when going back online', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const offlineStore = useOfflineStore()
      const matterStore = useMatterStore()

      // Setup offline operations
      setNetworkState(false)
      await nextTick()

      const newMatter = createMockMatter({ id: 'sync-matter' })
      await matterStore.createMatterOffline(newMatter)

      expect(offlineStore.pendingOperations).toHaveLength(1)

      // Mock successful sync API calls
      global.$fetch = vi.fn()
        .mockResolvedValueOnce(newMatter) // Create matter response

      // Go back online
      setNetworkState(true)
      await nextTick()

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify operation was synced and removed from queue
      expect(offlineStore.pendingOperations).toHaveLength(0)
      expect(global.$fetch).toHaveBeenCalledWith('/api/matters', {
        method: 'POST',
        body: newMatter
      })
    })

    it('should handle sync conflicts gracefully', async () => {
      const matters = [
        createMockMatter({ 
          id: 'conflict-matter', 
          title: 'Original',
          version: 1
        })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const offlineStore = useOfflineStore()
      const matterStore = useMatterStore()

      // Go offline and update
      setNetworkState(false)
      await matterStore.updateMatterOffline('conflict-matter', { 
        title: 'Offline Update'
      })

      // Mock server returning conflicting version
      global.$fetch = vi.fn().mockRejectedValueOnce({
        status: 409,
        data: {
          conflict: true,
          serverVersion: {
            id: 'conflict-matter',
            title: 'Server Update',
            version: 2
          }
        }
      })

      // Go back online
      setNetworkState(true)
      await nextTick()

      // Wait for conflict resolution
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify conflict was handled
      expect(offlineStore.conflictedOperations).toHaveLength(1)
      
      const conflictNotification = findByTestId(wrapper, 'sync-conflict-notification')
      expect(conflictNotification.exists()).toBe(true)
    })

    it('should retry failed sync operations with exponential backoff', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const offlineStore = useOfflineStore()

      // Queue operation while offline
      setNetworkState(false)
      offlineStore.queueOperation({
        type: 'create_matter',
        data: createMockMatter({ id: 'retry-matter' })
      })

      // Mock API failures followed by success
      global.$fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Server Error'))
        .mockRejectedValueOnce(new Error('Server Error'))
        .mockResolvedValueOnce({ success: true })

      // Go back online
      setNetworkState(true)
      await nextTick()

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify operation eventually succeeded
      expect(global.$fetch).toHaveBeenCalledTimes(3)
      expect(offlineStore.pendingOperations).toHaveLength(0)
    })
  })

  describe('Offline UI Behavior', () => {
    it('should disable certain actions while offline', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      
      // Go offline
      setNetworkState(false)
      await nextTick()

      // Check that certain buttons are disabled
      const deleteButton = findByTestId(wrapper, 'delete-matter-button')
      const exportButton = findByTestId(wrapper, 'export-data-button')
      
      expect(deleteButton.element.disabled).toBe(true)
      expect(exportButton.element.disabled).toBe(true)
    })

    it('should show offline indicators on modified items', async () => {
      const matters = [
        createMockMatter({ id: 'matter-1', title: 'Original' })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const matterStore = useMatterStore()

      // Go offline and update
      setNetworkState(false)
      await matterStore.updateMatterOffline('matter-1', { 
        title: 'Modified Offline'
      })

      await nextTick()

      // Verify offline indicator is shown
      const matterCard = findByTestId(wrapper, 'matter-card-matter-1')
      const offlineIndicator = matterCard.find('[data-testid="offline-indicator"]')
      
      expect(offlineIndicator.exists()).toBe(true)
      expect(offlineIndicator.attributes('title')).toContain('Modified offline')
    })

    it('should show sync progress during reconnection', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const offlineStore = useOfflineStore()

      // Queue multiple operations
      setNetworkState(false)
      for (let i = 0; i < 5; i++) {
        offlineStore.queueOperation({
          type: 'create_matter',
          data: createMockMatter({ id: `matter-${i}` })
        })
      }

      // Mock slow API responses
      global.$fetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      // Go back online
      setNetworkState(true)
      await nextTick()

      // Verify sync progress is shown
      const syncProgress = findByTestId(wrapper, 'sync-progress')
      expect(syncProgress.exists()).toBe(true)
      expect(syncProgress.text()).toContain('Syncing')

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 600))

      // Verify progress indicator is hidden
      expect(findByTestId(wrapper, 'sync-progress').exists()).toBe(false)
    })
  })

  describe('Cache Management in Offline Mode', () => {
    it('should serve cached data when offline', async () => {
      const matters = [
        createMockMatter({ id: 'cached-matter', title: 'Cached Data' })
      ]

      // Pre-populate cache
      queryClient.setQueryData(['matters'], matters)

      const wrapper = mountWithQuery(KanbanBoard)
      const matterStore = useMatterStore()

      // Go offline
      setNetworkState(false)
      global.$fetch = vi.fn().mockRejectedValue(new Error('Network Error'))

      // Load matters (should use cache)
      await matterStore.loadMatters()

      // Verify cached data is used
      expect(matterStore.matters).toEqual(matters)
      expect(global.$fetch).not.toHaveBeenCalled()
    })

    it('should update cache with offline changes', async () => {
      const matters = [
        createMockMatter({ id: 'cache-matter', title: 'Original' })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const matterStore = useMatterStore()

      // Go offline and update
      setNetworkState(false)
      await matterStore.updateMatterOffline('cache-matter', { 
        title: 'Updated Offline'
      })

      // Verify cache reflects offline changes
      const cachedData = queryClient.getQueryData(['matters']) as any[]
      const updatedMatter = cachedData.find(m => m.id === 'cache-matter')
      expect(updatedMatter.title).toBe('Updated Offline')
    })

    it('should merge server data with offline changes on reconnection', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const matterStore = useMatterStore()

      // Start with cached data
      const cachedMatters = [
        createMockMatter({ id: 'merge-matter', title: 'Cached', priority: 'MEDIUM' })
      ]
      queryClient.setQueryData(['matters'], cachedMatters)

      // Go offline and modify
      setNetworkState(false)
      await matterStore.updateMatterOffline('merge-matter', { 
        priority: 'HIGH' // Only change priority offline
      })

      // Mock server returning updated data (different field)
      const serverMatters = [
        createMockMatter({ 
          id: 'merge-matter', 
          title: 'Server Updated Title', // Server changed title
          priority: 'MEDIUM', // Server has old priority
          description: 'New description' // Server added description
        })
      ]

      global.$fetch = vi.fn().mockResolvedValue(serverMatters)

      // Go back online
      setNetworkState(true)
      await nextTick()

      // Wait for merge
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify merged result
      const finalMatter = matterStore.getMatterById('merge-matter')
      expect(finalMatter?.title).toBe('Server Updated Title') // Server wins
      expect(finalMatter?.priority).toBe('HIGH') // Offline change preserved
      expect(finalMatter?.description).toBe('New description') // Server addition preserved
    })
  })
})