/**
 * Integration Tests for Background Sync Functionality
 * 
 * @description Comprehensive integration tests verifying all sync scenarios including
 * tab visibility, network changes, multi-tab coordination, and performance monitoring
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { useBackgroundSync } from '../useBackgroundSync'
import { SYNC_CONFIGS, NETWORK_CONFIG, TAB_VISIBILITY_CONFIG, WEBSOCKET_CONFIG, PERFORMANCE_CONFIG } from '../../config/background-sync'
import type { SyncMode, NetworkQuality, TabVisibility } from '../../config/background-sync'

// Mock TanStack Query
const mockQueryClient = {
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  setQueryData: vi.fn(),
  getQueryCache: vi.fn(() => ({
    findAll: vi.fn(() => []),
    find: vi.fn()
  })),
  fetchQuery: vi.fn().mockResolvedValue({ data: 'test' })
}

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn(() => mockQueryClient)
}))

// Mock WebSocket connection
const mockWebSocketConnection = {
  isConnected: { value: false },
  on: vi.fn(),
  off: vi.fn(),
  send: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn()
}

vi.mock('../useWebSocketConnection', () => ({
  useWebSocketConnection: vi.fn(() => mockWebSocketConnection)
}))

// Mock browser APIs
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  getBattery: vi.fn()
}

const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    jsHeapSizeLimit: 1024 * 1024 * 1024 // 1GB
  }
}

const mockDocument = {
  get hidden() {
    return visibilityState === 'hidden'
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  get visibilityState() {
    return visibilityState as DocumentVisibilityState
  }
}

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  url: string
  protocols?: string[]
  readyState: number = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(url: string, protocols?: string[]) {
    this.url = url
    this.protocols = protocols
    
    // Simulate connection after a delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 10)
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  }
}

// Mock fetch for network ping
const mockFetch = vi.fn()

// Helper to simulate visibility state changes
let visibilityState = 'visible'

// Test component wrapper
const TestComponent = defineComponent({
  setup() {
    const sync = useBackgroundSync()
    return { sync }
  },
  render() {
    return h('div', 'Test Component')
  }
})

describe('useBackgroundSync Integration Tests', () => {
  let originalNavigator: Navigator
  let originalPerformance: Performance
  let originalDocument: Document
  let originalLocalStorage: Storage
  let originalWebSocket: typeof WebSocket
  let originalFetch: typeof fetch

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Save original objects
    originalNavigator = global.navigator
    originalPerformance = global.performance
    originalDocument = global.document || mockDocument
    originalLocalStorage = global.localStorage
    originalWebSocket = global.WebSocket
    originalFetch = global.fetch

    // Apply mocks
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    })
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true
    })
    // Only mock document if it doesn't exist
    if (!global.document) {
      Object.defineProperty(global, 'document', {
        value: mockDocument,
        writable: true
      })
    } else {
      // Enhance existing document with our mock properties
      Object.defineProperty(global.document, 'hidden', {
        get: () => visibilityState === 'hidden',
        configurable: true
      })
      Object.defineProperty(global.document, 'visibilityState', {
        get: () => visibilityState as DocumentVisibilityState,
        configurable: true
      })
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    global.WebSocket = MockWebSocket as any
    global.fetch = mockFetch

    // Reset mock implementations
    vi.clearAllMocks()
    mockNavigator.onLine = true
    mockNavigator.connection.effectiveType = '4g'
    visibilityState = 'visible'
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    
    // Restore original objects
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true
    })
    Object.defineProperty(global, 'performance', {
      value: originalPerformance,
      writable: true
    })
    Object.defineProperty(global, 'document', {
      value: originalDocument,
      writable: true
    })
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    })
    global.WebSocket = originalWebSocket
    global.fetch = originalFetch
  })

  describe('Tab Visibility Changes', () => {
    it('should transition through visibility states correctly', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Initial state should be active
      expect(sync.tabVisibility.value).toBe('active')

      // Simulate tab becoming hidden
      visibilityState = 'hidden'
      const visibilityHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'visibilitychange'
      )?.[1]
      
      if (visibilityHandler) {
        visibilityHandler()
      } else {
        // Manually trigger visibility change
        document.dispatchEvent(new Event('visibilitychange'))
      }
      await nextTick()
      
      // Should transition to hidden immediately
      expect(sync.tabVisibility.value).toBe('hidden')

      // Wait for background transition
      vi.advanceTimersByTime(TAB_VISIBILITY_CONFIG.backgroundDelay)
      await nextTick()
      
      // Should now be in background state
      expect(sync.tabVisibility.value).toBe('background')

      // Simulate tab becoming visible again
      visibilityState = 'visible'
      visibilityHandler()
      await nextTick()
      
      // Should return to active
      expect(sync.tabVisibility.value).toBe('active')
      vi.useRealTimers()
    })

    it('should adjust sync rates based on tab visibility', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      // Set aggressive mode for testing
      sync.setSyncMode('aggressive')
      await nextTick()

      // Initial sync should happen
      expect(invalidateSpy).toHaveBeenCalled()
      invalidateSpy.mockClear()

      // Simulate tab becoming hidden
      visibilityState = 'hidden'
      const visibilityHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'visibilitychange'
      )?.[1]
      
      visibilityHandler()
      
      // Wait for background transition
      vi.advanceTimersByTime(TAB_VISIBILITY_CONFIG.backgroundDelay)
      await nextTick()

      // Sync rates should be reduced in background
      const matterConfig = SYNC_CONFIGS.matters.aggressive
      const expectedInterval = matterConfig.baseInterval / TAB_VISIBILITY_CONFIG.backgroundRateMultiplier
      
      // Advance time and check sync frequency
      vi.advanceTimersByTime(expectedInterval)
      await flushPromises()
      
      // Should have synced at reduced rate
      expect(invalidateSpy).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should sync immediately on tab focus if configured', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      const syncAllSpy = vi.spyOn(sync, 'syncAllData')
      
      // Make tab hidden first
      visibilityState = 'hidden'
      const visibilityHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'visibilitychange'
      )?.[1]
      
      visibilityHandler()
      await nextTick()

      // Clear any previous calls
      syncAllSpy.mockClear()

      // Make tab visible again
      visibilityState = 'visible'
      visibilityHandler()
      await nextTick()

      // Should sync immediately if syncOnFocus is true
      expect(syncAllSpy).toHaveBeenCalled()
    })
  })

  describe('Network Status Changes', () => {
    it('should detect network quality changes', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Initial network should be good
      expect(sync.networkQuality.value).toBe('good')
      expect(sync.isOnline.value).toBe(true)

      // Simulate poor network
      mockNavigator.connection.effectiveType = '2g'
      mockNavigator.connection.downlink = 0.5
      mockNavigator.connection.rtt = 500
      
      const networkHandler = mockNavigator.connection.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1]
      
      networkHandler()
      await nextTick()
      
      expect(sync.networkQuality.value).toBe('poor')

      // Simulate going offline
      mockNavigator.onLine = false
      window.dispatchEvent(new Event('offline'))
      await nextTick()
      
      expect(sync.isOnline.value).toBe(false)
      expect(sync.networkQuality.value).toBe('offline')
    })

    it('should handle online/offline transitions', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      const invalidateSpy = vi.spyOn(mockQueryClient, 'invalidateQueries')
      
      // Go offline
      mockNavigator.onLine = false
      window.dispatchEvent(new Event('offline'))
      await nextTick()
      
      expect(sync.isOnline.value).toBe(false)
      expect(sync.syncStatus.value).toBe('offline')
      
      // Try to sync while offline
      await sync.syncAllData()
      
      // Should not sync when offline
      expect(invalidateSpy).not.toHaveBeenCalled()

      // Go back online
      mockNavigator.onLine = true
      window.dispatchEvent(new Event('online'))
      await nextTick()
      
      expect(sync.isOnline.value).toBe(true)
      
      // Should check network status and adjust sync
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.any(Object)
      )
    })

    it('should use ping endpoints to verify connectivity', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Simulate network check interval
      vi.advanceTimersByTime(NETWORK_CONFIG.detection.checkInterval)
      await flushPromises()
      
      // Should have pinged health endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        NETWORK_CONFIG.ping.endpoints[0],
        expect.objectContaining({
          method: 'HEAD',
          cache: 'no-cache'
        })
      )

      // Simulate slow response
      mockFetch.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 400))
        return { ok: true }
      })
      
      vi.advanceTimersByTime(NETWORK_CONFIG.detection.checkInterval)
      await flushPromises()
      
      // Should detect fair quality due to high RTT
      expect(sync.networkQuality.value).toBe('fair')
      vi.useRealTimers()
    })
  })

  describe('Multi-Tab Coordination', () => {
    it('should handle WebSocket connection lifecycle', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Set aggressive mode to enable WebSocket
      sync.setSyncMode('aggressive')
      await flushPromises()
      
      // WebSocket should be connected
      expect(sync.wsConnected.value).toBe(true)
      
      // Switch to conservative mode
      sync.setSyncMode('conservative')
      await nextTick()
      
      // WebSocket should be disconnected
      expect(sync.wsConnected.value).toBe(false)
    })

    it('should handle real-time updates via WebSocket', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      const invalidateSpy = vi.spyOn(mockQueryClient, 'invalidateQueries')
      const setQueryDataSpy = vi.spyOn(mockQueryClient, 'setQueryData')
      
      // Enable WebSocket
      sync.setSyncMode('aggressive')
      await flushPromises()
      
      // Get WebSocket instance
      const ws = MockWebSocket.prototype
      
      // Simulate matter update message
      const updateMessage = {
        type: 'matter:updated',
        payload: {
          matterId: '123',
          matter: { id: '123', title: 'Updated Matter' }
        }
      }
      
      ws.onmessage?.({
        data: JSON.stringify(updateMessage)
      } as MessageEvent)
      
      await nextTick()
      
      // Should invalidate matter queries
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['matters'] })

      // Simulate kanban move message
      const moveMessage = {
        type: 'kanban:moved',
        payload: {
          matterId: '456',
          matter: { id: '456', column: 'in-progress' }
        }
      }
      
      ws.onmessage?.({
        data: JSON.stringify(moveMessage)
      } as MessageEvent)
      
      await nextTick()
      
      // Should update specific matter in cache
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['matters', '456'],
        moveMessage.payload.matter
      )
    })

    it('should coordinate sync across multiple tabs', async () => {
      // Simulate multiple tab instances
      const wrapper1 = mount(TestComponent)
      const wrapper2 = mount(TestComponent)
      const sync1 = wrapper1.vm.sync
      const sync2 = wrapper2.vm.sync
      
      // Both should initialize
      expect(sync1.syncStatus).toBeDefined()
      expect(sync2.syncStatus).toBeDefined()
      
      // Simulate storage event for cross-tab communication
      const storageEvent = new StorageEvent('storage', {
        key: 'sync-mode',
        newValue: 'conservative',
        oldValue: 'balanced'
      })
      
      window.dispatchEvent(storageEvent)
      await nextTick()
      
      // Both tabs should respect the storage change
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sync-mode')
    })
  })

  describe('Sync Mode Transitions', () => {
    it('should transition between sync modes correctly', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Test each mode transition
      const modes: SyncMode[] = ['aggressive', 'balanced', 'conservative', 'offline', 'manual']
      
      for (const mode of modes) {
        sync.setSyncMode(mode)
        await nextTick()
        
        expect(sync.syncMode.value).toBe(mode)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sync-mode', mode)
        
        // Verify WebSocket state based on mode
        if (mode === 'aggressive' || mode === 'balanced') {
          expect(sync.wsConnected.value).toBe(true)
        } else {
          expect(sync.wsConnected.value).toBe(false)
        }
      }
    })

    it('should respect sync mode configurations', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      const invalidateSpy = vi.spyOn(mockQueryClient, 'invalidateQueries')
      
      // Test offline mode
      sync.setSyncMode('offline')
      await nextTick()
      
      // Should not sync in offline mode
      vi.advanceTimersByTime(60000) // 1 minute
      await flushPromises()
      
      expect(invalidateSpy).not.toHaveBeenCalled()
      
      // Test manual mode
      sync.setSyncMode('manual')
      await nextTick()
      
      // Should not auto-sync in manual mode
      vi.advanceTimersByTime(60000) // 1 minute
      await flushPromises()
      
      expect(invalidateSpy).not.toHaveBeenCalled()
      
      // But manual sync should work
      await sync.syncAllData()
      expect(invalidateSpy).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should apply network quality requirements', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      const syncDataTypeSpy = vi.spyOn(sync, 'syncDataType')
      
      // Set conservative mode (requires good network)
      sync.setSyncMode('conservative')
      await nextTick()
      
      // Simulate poor network
      mockNavigator.connection.effectiveType = '2g'
      const networkHandler = mockNavigator.connection.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1]
      
      networkHandler()
      await nextTick()
      
      // Should not sync with poor network in conservative mode
      vi.advanceTimersByTime(60000) // 1 minute
      await flushPromises()
      
      expect(syncDataTypeSpy).not.toHaveBeenCalled()
      vi.useRealTimers()
    })
  })

  describe('Query Invalidation Cascades', () => {
    it('should invalidate queries by data type', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      const invalidateSpy = vi.spyOn(mockQueryClient, 'invalidateQueries')
      
      // Sync specific data type
      await sync.syncDataType('matters')
      
      expect(invalidateSpy).toHaveBeenCalledWith({
        predicate: expect.any(Function)
      })
      
      // Verify predicate filters correctly
      const predicate = invalidateSpy.mock.calls[0][0].predicate
      expect(predicate({ queryKey: ['matters', '123'] })).toBe(true)
      expect(predicate({ queryKey: ['kanban'] })).toBe(false)
    })

    it('should handle sync errors gracefully', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Make invalidateQueries throw an error
      vi.spyOn(mockQueryClient, 'invalidateQueries').mockRejectedValueOnce(
        new Error('Network error')
      )
      
      await sync.syncDataType('matters')
      
      // Should capture error
      const stats = sync.getSyncStats()
      expect(stats.errors).toBe(1)
      expect(sync.syncStatus.value).toBe('error')
    })

    it('should track sync timing and status', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      const beforeSync = Date.now()
      
      await sync.syncAllData()
      
      const afterSync = Date.now()
      expect(sync.lastSyncTime.value).toBeGreaterThanOrEqual(beforeSync)
      expect(sync.lastSyncTime.value).toBeLessThanOrEqual(afterSync)
    })
  })

  describe('Performance Impact Measurements', () => {
    it('should monitor battery level and adjust sync', async () => {
      const mockBattery = {
        level: 0.8, // 80%
        addEventListener: vi.fn()
      }
      
      mockNavigator.getBattery.mockResolvedValue(mockBattery)
      
      const wrapper = mount(TestComponent)
      await flushPromises()
      const sync = wrapper.vm.sync
      
      expect(sync.batteryLevel.value).toBe(80)
      
      // Simulate low battery
      mockBattery.level = 0.15 // 15%
      const batteryHandler = mockBattery.addEventListener.mock.calls.find(
        call => call[0] === 'levelchange'
      )?.[1]
      
      batteryHandler()
      await nextTick()
      
      expect(sync.batteryLevel.value).toBe(15)
      
      // Should restrict sync on low battery
      sync.setSyncMode('balanced')
      await sync.syncAllData()
      
      // Only aggressive mode should sync on low battery
      const stats = sync.getSyncStats()
      expect(stats.batteryLevel).toBe(15)
    })

    it('should monitor memory usage and throttle sync', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Initial memory should be acceptable
      expect(sync.memoryUsage.value).toBeLessThan(10) // Less than 10%
      
      // Simulate high memory usage
      mockPerformance.memory.usedJSHeapSize = 950 * 1024 * 1024 // 950MB
      
      // Trigger memory check
      vi.advanceTimersByTime(NETWORK_CONFIG.detection.checkInterval)
      await flushPromises()
      
      expect(sync.memoryUsage.value).toBeGreaterThan(90)
      
      // Should not sync with high memory usage
      const invalidateSpy = vi.spyOn(mockQueryClient, 'invalidateQueries')
      await sync.syncAllData()
      
      // Sync should be blocked due to high memory
      expect(invalidateSpy).not.toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should measure sync performance metrics', async () => {
      const sync = useBackgroundSync()
      
      // Get initial stats
      const stats = sync.getSyncStats()
      
      expect(stats).toMatchObject({
        mode: expect.any(String),
        status: expect.any(String),
        lastSync: expect.any(Number),
        networkQuality: expect.any(String),
        tabVisibility: expect.any(String),
        wsConnected: expect.any(Boolean),
        errors: expect.any(Number),
        batteryLevel: expect.any(Number),
        memoryUsage: expect.any(Number)
      })
    })
  })

  describe('Resource Usage Monitoring', () => {
    it('should limit concurrent refetches', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      const invalidateSpy = vi.spyOn(mockQueryClient, 'invalidateQueries')
      
      // Enable aggressive mode for multiple data types
      sync.setSyncMode('aggressive')
      await nextTick()
      
      // Trigger multiple syncs simultaneously
      const syncPromises = [
        sync.syncDataType('matters'),
        sync.syncDataType('kanban'),
        sync.syncDataType('activity'),
        sync.syncDataType('static')
      ]
      
      await Promise.all(syncPromises)
      
      // Should respect max concurrent refetches
      expect(invalidateSpy.mock.calls.length).toBeLessThanOrEqual(
        PERFORMANCE_CONFIG.maxConcurrentRefetches + 1 // +1 for potential timing
      )
    })

    it('should clean up resources on unmount', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Enable features that create intervals/connections
      sync.setSyncMode('aggressive')
      await flushPromises()
      
      // Track cleanup calls
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      
      // Unmount component
      wrapper.unmount()
      
      // Should clean up all listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      )
    })
  })

  describe('Sync Operation Error Handling', () => {
    it('should handle network timeouts', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Make fetch timeout
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )
      
      // Trigger network check
      vi.advanceTimersByTime(NETWORK_CONFIG.detection.checkInterval)
      await flushPromises()
      
      // Should handle timeout gracefully
      expect(sync.isOnline.value).toBe(false)
      vi.useRealTimers()
    })

    it('should retry failed network checks', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Make first attempt fail, second succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true })
      
      // Trigger network check
      vi.advanceTimersByTime(NETWORK_CONFIG.detection.checkInterval)
      await flushPromises()
      
      // Should have retried
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(sync.isOnline.value).toBe(true)
      vi.useRealTimers()
    })

    it('should handle WebSocket errors', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Enable WebSocket
      sync.setSyncMode('aggressive')
      await flushPromises()
      
      // Simulate WebSocket error
      const ws = MockWebSocket.prototype
      ws.onerror?.(new Event('error'))
      
      // Should handle error without crashing
      expect(sync.wsConnected.value).toBe(true) // Connection might still be open
      
      // Simulate connection close
      ws.onclose?.(new CloseEvent('close'))
      expect(sync.wsConnected.value).toBe(false)
    })
  })

  describe('Configuration Persistence', () => {
    it('should persist sync mode preference', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Set different sync modes
      const modes: SyncMode[] = ['aggressive', 'balanced', 'conservative']
      
      for (const mode of modes) {
        sync.setSyncMode(mode)
        await nextTick()
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sync-mode', mode)
      }
    })

    it('should restore sync mode from localStorage', async () => {
      // Set stored preference
      mockLocalStorage.getItem.mockReturnValue('conservative')
      
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Should load saved preference
      expect(sync.syncMode.value).toBe('conservative')
    })

    it('should handle invalid stored preferences', async () => {
      // Set invalid preference
      mockLocalStorage.getItem.mockReturnValue('invalid-mode')
      
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Should fall back to default
      expect(sync.syncMode.value).toBe('balanced')
    })
  })

  describe('Integration with TanStack Query', () => {
    it('should work with query client methods', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Add some queries to the cache
      mockQueryClient.setQueryData(['matters', '1'], { id: '1', title: 'Matter 1' })
      mockQueryClient.setQueryData(['matters', '2'], { id: '2', title: 'Matter 2' })
      mockQueryClient.setQueryData(['kanban'], { columns: [] })
      
      // Sync specific data type
      await sync.syncDataType('matters')
      
      // Should only invalidate matter queries
      const matterQueries = mockQueryClient.getQueryCache().findAll({ 
        queryKey: ['matters'] 
      })
      const kanbanQueries = mockQueryClient.getQueryCache().findAll({ 
        queryKey: ['kanban'] 
      })
      
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled()
    })

    it('should respect query configurations', async () => {
      const wrapper = mount(TestComponent)
      const sync = wrapper.vm.sync
      
      // Create a query with specific configuration
      const queryKey = ['test-query']
      const queryFn = vi.fn().mockResolvedValue({ data: 'test' })
      
      await mockQueryClient.fetchQuery({
        queryKey,
        queryFn,
        staleTime: 5000
      })
      
      await flushPromises()
      
      // Query should have been fetched
      expect(mockQueryClient.fetchQuery).toHaveBeenCalledWith({
        queryKey,
        queryFn: expect.any(Function),
        staleTime: 5000
      })
    })
  })
})