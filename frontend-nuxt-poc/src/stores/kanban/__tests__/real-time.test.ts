import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRealTimeStore } from '../real-time'
import type { ConflictEvent, RealTimeEvent } from '../real-time'

// Mock $fetch
const mockFetch = vi.fn()
globalThis.$fetch = mockFetch

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.({} as Event)
    }, 10)
  }

  send(data: string) {
    // Mock send functionality
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({} as CloseEvent)
  }
}

globalThis.WebSocket = MockWebSocket as any

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock matter store
const mockMatterStore = {
  updateMatter: vi.fn(),
  matters: []
}

vi.mock('../matters', () => ({
  useMatterStore: () => mockMatterStore
}))

describe('Real-Time Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useRealTimeStore()
      
      expect(store.syncStatus.status).toBe('idle')
      expect(store.syncStatus.lastSyncTime).toBeNull()
      expect(store.syncStatus.errorMessage).toBeNull()
      expect(store.networkStatus.isOnline).toBe(true)
      expect(store.conflictQueue).toEqual([])
      expect(store.realtimeEvents).toEqual([])
      expect(store.activeUsers).toEqual([])
    })
  })

  describe('Network Status', () => {
    it('should detect online status', () => {
      const store = useRealTimeStore()
      
      expect(store.isOnline).toBe(true)
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false })
      store.updateNetworkStatus()
      
      expect(store.networkStatus.isOnline).toBe(false)
      expect(store.isOnline).toBe(false)
    })

    it('should detect connection quality', () => {
      const store = useRealTimeStore()
      
      // Mock connection with 4G
      const mockConnection = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false
      }
      
      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        writable: true
      })
      
      store.updateNetworkStatus()
      
      expect(store.connectionQuality).toBe('excellent')
      expect(store.networkStatus.effectiveType).toBe('4g')
      expect(store.networkStatus.downlink).toBe(10)
      expect(store.networkStatus.rtt).toBe(50)
    })
  })

  describe('Sync Operations', () => {
    it('should sync with server successfully', async () => {
      const store = useRealTimeStore()
      mockFetch.mockResolvedValueOnce({ success: true })
      
      const result = await store.syncWithServer()
      
      expect(result).toBe(true)
      expect(store.syncStatus.status).toBe('idle')
      expect(store.syncStatus.lastSyncTime).toBeInstanceOf(Date)
      expect(store.syncStatus.errorMessage).toBeNull()
    })

    it('should handle sync errors', async () => {
      const store = useRealTimeStore()
      const error = new Error('Sync failed')
      mockFetch.mockRejectedValueOnce(error)
      
      const result = await store.syncWithServer()
      
      expect(result).toBe(false)
      expect(store.syncStatus.status).toBe('error')
      expect(store.syncStatus.errorMessage).toBe('Sync failed')
      expect(store.syncStatus.retryCount).toBe(1)
    })

    it('should not sync when already syncing', async () => {
      const store = useRealTimeStore()
      
      // Start first sync
      const promise1 = store.syncWithServer()
      
      // Try to start second sync immediately
      const result2 = await store.syncWithServer()
      
      expect(result2).toBe(false) // Should not start second sync
      
      // Complete first sync
      mockFetch.mockResolvedValueOnce({ success: true })
      await promise1
    })

    it('should not sync when offline', async () => {
      const store = useRealTimeStore()
      
      // Go offline
      Object.defineProperty(navigator, 'onLine', { value: false })
      store.updateNetworkStatus()
      
      const result = await store.syncWithServer()
      
      expect(result).toBe(false)
      expect(store.syncStatus.status).toBe('offline')
    })

    it('should force sync even when already syncing', async () => {
      const store = useRealTimeStore()
      
      // Start sync and immediately force another
      mockFetch.mockResolvedValueOnce({ success: true })
      const promise1 = store.syncWithServer()
      
      mockFetch.mockResolvedValueOnce({ success: true })
      const result2 = await store.syncWithServer(true) // Force sync
      
      expect(result2).toBe(true)
      
      await promise1
    })
  })

  describe('Polling', () => {
    it('should start polling', () => {
      const store = useRealTimeStore()
      
      store.startPolling(1000) // 1 second for testing
      
      expect(store.pollingInterval).toBeTruthy()
    })

    it('should stop polling', () => {
      const store = useRealTimeStore()
      
      store.startPolling(1000)
      expect(store.pollingInterval).toBeTruthy()
      
      store.stopPolling()
      expect(store.pollingInterval).toBeNull()
    })

    it('should poll at specified interval', async () => {
      const store = useRealTimeStore()
      const syncSpy = vi.spyOn(store, 'syncWithServer')
      syncSpy.mockResolvedValue(true)
      
      store.startPolling(100) // 100ms for testing
      
      // Wait for multiple poll cycles
      await vi.advanceTimersByTime(250)
      
      expect(syncSpy).toHaveBeenCalledTimes(2) // Should have been called twice
      
      store.stopPolling()
    })

    it('should not poll when offline', async () => {
      const store = useRealTimeStore()
      const syncSpy = vi.spyOn(store, 'syncWithServer')
      
      // Go offline
      Object.defineProperty(navigator, 'onLine', { value: false })
      store.updateNetworkStatus()
      
      store.startPolling(100)
      await vi.advanceTimersByTime(200)
      
      expect(syncSpy).not.toHaveBeenCalled()
      
      store.stopPolling()
    })
  })

  describe('WebSocket Connection', () => {
    it('should connect WebSocket', async () => {
      const store = useRealTimeStore()
      
      store.connectWebSocket()
      
      // Wait for connection to open
      await vi.advanceTimersByTime(20)
      
      expect(store.websocketConnection).toBeTruthy()
    })

    it('should disconnect WebSocket', () => {
      const store = useRealTimeStore()
      
      store.connectWebSocket()
      expect(store.websocketConnection).toBeTruthy()
      
      store.disconnectWebSocket()
      expect(store.websocketConnection).toBeNull()
    })

    it('should handle WebSocket messages', async () => {
      const store = useRealTimeStore()
      
      store.connectWebSocket()
      await vi.advanceTimersByTime(20)
      
      const mockEvent = {
        id: 'event-1',
        type: 'matter_updated',
        data: { id: 'matter-1', title: 'Updated Title' },
        userId: 'user-1',
        timestamp: new Date().toISOString()
      }
      
      // Simulate receiving message
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(mockEvent)
      })
      
      store.websocketConnection!.onmessage!(messageEvent)
      
      expect(store.realtimeEvents).toHaveLength(1)
      expect(store.realtimeEvents[0].type).toBe('matter_updated')
    })

    it('should handle user join events', async () => {
      const store = useRealTimeStore()
      
      store.connectWebSocket()
      await vi.advanceTimersByTime(20)
      
      const joinEvent = {
        id: 'event-1',
        type: 'user_joined',
        data: { id: 'user-2', name: 'Jane Doe', avatar: 'avatar.jpg' },
        userId: 'user-2',
        timestamp: new Date().toISOString()
      }
      
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(joinEvent)
      })
      
      store.websocketConnection!.onmessage!(messageEvent)
      
      expect(store.activeUsers).toHaveLength(1)
      expect(store.activeUsers[0].name).toBe('Jane Doe')
    })

    it('should handle user leave events', async () => {
      const store = useRealTimeStore()
      
      // Add user first
      store.activeUsers.push({
        id: 'user-2',
        name: 'Jane Doe',
        lastSeen: new Date()
      })
      
      store.connectWebSocket()
      await vi.advanceTimersByTime(20)
      
      const leaveEvent = {
        id: 'event-1',
        type: 'user_left',
        data: { id: 'user-2' },
        userId: 'user-2',
        timestamp: new Date().toISOString()
      }
      
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(leaveEvent)
      })
      
      store.websocketConnection!.onmessage!(messageEvent)
      
      expect(store.activeUsers).toHaveLength(0)
    })
  })

  describe('Conflict Resolution', () => {
    it('should detect conflicts', () => {
      const store = useRealTimeStore()
      
      const mockMatters = [
        {
          id: 'matter-1',
          title: 'Test Matter',
          updatedAt: new Date().toISOString()
        }
      ]
      
      const lastSyncTime = new Date(Date.now() - 10000) // 10 seconds ago
      
      // Mock random to always return conflict for testing
      vi.spyOn(Math, 'random').mockReturnValue(0.05) // Below 0.1 threshold
      
      const conflicts = store.detectConflicts(mockMatters as any, lastSyncTime)
      
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('matter_updated')
      expect(conflicts[0].localData?.id).toBe('matter-1')
    })

    it('should resolve conflicts with server wins strategy', async () => {
      const store = useRealTimeStore()
      
      const conflict: ConflictEvent = {
        id: 'conflict-1',
        type: 'matter_updated',
        localData: { id: 'matter-1', title: 'Local Version' } as any,
        serverData: { id: 'matter-1', title: 'Server Version' } as any,
        timestamp: new Date(),
        resolved: false
      }
      
      store.conflictQueue.push(conflict)
      
      await store.resolveConflict('conflict-1', 'server')
      
      expect(mockMatterStore.updateMatter).toHaveBeenCalledWith(
        'matter-1',
        { id: 'matter-1', title: 'Server Version' }
      )
      expect(conflict.resolved).toBe(true)
    })

    it('should resolve conflicts with local wins strategy', async () => {
      const store = useRealTimeStore()
      
      const conflict: ConflictEvent = {
        id: 'conflict-1',
        type: 'matter_updated',
        localData: { id: 'matter-1', title: 'Local Version' } as any,
        serverData: { id: 'matter-1', title: 'Server Version' } as any,
        timestamp: new Date(),
        resolved: false
      }
      
      store.conflictQueue.push(conflict)
      
      await store.resolveConflict('conflict-1', 'local')
      
      expect(mockMatterStore.updateMatter).toHaveBeenCalledWith(
        'matter-1',
        { id: 'matter-1', title: 'Local Version' }
      )
    })

    it('should resolve conflicts with merge strategy', async () => {
      const store = useRealTimeStore()
      
      const conflict: ConflictEvent = {
        id: 'conflict-1',
        type: 'matter_updated',
        localData: { 
          id: 'matter-1', 
          title: 'Local Title',
          description: 'Local Description'
        } as any,
        serverData: { 
          id: 'matter-1', 
          title: 'Server Title',
          priority: 'HIGH'
        } as any,
        timestamp: new Date(),
        resolved: false
      }
      
      store.conflictQueue.push(conflict)
      
      await store.resolveConflict('conflict-1', 'merge')
      
      expect(mockMatterStore.updateMatter).toHaveBeenCalledWith(
        'matter-1',
        expect.objectContaining({
          id: 'matter-1',
          title: 'Local Title', // Local takes precedence in merge
          priority: 'HIGH', // Server-only field preserved
          updatedAt: expect.any(String)
        })
      )
    })

    it('should clear conflict queue', () => {
      const store = useRealTimeStore()
      
      store.conflictQueue.push({
        id: 'conflict-1',
        type: 'matter_updated',
        localData: null,
        serverData: null,
        timestamp: new Date(),
        resolved: false
      })
      
      expect(store.conflictQueue).toHaveLength(1)
      
      store.clearConflictQueue()
      expect(store.conflictQueue).toHaveLength(0)
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed syncs with exponential backoff', async () => {
      const store = useRealTimeStore()
      
      const error = new Error('Sync failed')
      mockFetch.mockRejectedValueOnce(error)
      
      await store.syncWithServer()
      
      expect(store.syncStatus.retryCount).toBe(1)
      expect(store.syncStatus.nextRetryTime).toBeInstanceOf(Date)
      
      // Check that retry is scheduled
      expect(store.retryTimeout).toBeTruthy()
    })

    it('should stop retrying after max attempts', async () => {
      const store = useRealTimeStore()
      
      // Set retry count to max
      store.syncStatus.retryCount = 5 // Max retries
      
      const error = new Error('Sync failed')
      mockFetch.mockRejectedValueOnce(error)
      
      await store.syncWithServer()
      
      expect(store.syncStatus.retryCount).toBe(6) // Incremented but no more retries
      expect(store.retryTimeout).toBeNull() // No retry scheduled
    })

    it('should reset retry count on successful sync', async () => {
      const store = useRealTimeStore()
      
      // Simulate previous failed attempts
      store.syncStatus.retryCount = 3
      
      mockFetch.mockResolvedValueOnce({ success: true })
      
      await store.syncWithServer()
      
      expect(store.syncStatus.retryCount).toBe(0)
      expect(store.syncStatus.nextRetryTime).toBeNull()
    })
  })

  describe('Event Management', () => {
    it('should limit realtime events history', async () => {
      const store = useRealTimeStore()
      
      store.connectWebSocket()
      await vi.advanceTimersByTime(20)
      
      // Add 105 events (more than the 100 limit)
      for (let i = 0; i < 105; i++) {
        const event = {
          id: `event-${i}`,
          type: 'matter_updated',
          data: { id: `matter-${i}` },
          userId: 'user-1',
          timestamp: new Date().toISOString()
        }
        
        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify(event)
        })
        
        store.websocketConnection!.onmessage!(messageEvent)
      }
      
      expect(store.realtimeEvents).toHaveLength(100) // Should be limited to 100
    })

    it('should get recent events sorted by timestamp', () => {
      const store = useRealTimeStore()
      
      const now = Date.now()
      
      // Add events with different timestamps
      store.realtimeEvents.push(
        {
          id: 'event-1',
          type: 'matter_updated',
          data: {},
          userId: 'user-1',
          timestamp: new Date(now - 2000),
          acknowledged: true
        },
        {
          id: 'event-2',
          type: 'matter_created',
          data: {},
          userId: 'user-1',
          timestamp: new Date(now - 1000),
          acknowledged: true
        },
        {
          id: 'event-3',
          type: 'matter_deleted',
          data: {},
          userId: 'user-1',
          timestamp: new Date(now),
          acknowledged: true
        }
      )
      
      const recent = store.recentEvents
      
      expect(recent).toHaveLength(3)
      expect(recent[0].id).toBe('event-3') // Most recent first
      expect(recent[1].id).toBe('event-2')
      expect(recent[2].id).toBe('event-1')
    })
  })

  describe('Computed Properties', () => {
    it('should calculate last sync status correctly', () => {
      const store = useRealTimeStore()
      
      expect(store.lastSyncStatus).toBe('Never synced')
      
      // Set last sync time to 5 minutes ago
      store.syncStatus.lastSyncTime = new Date(Date.now() - 5 * 60 * 1000)
      expect(store.lastSyncStatus).toBe('5 minutes ago')
      
      // Set to 2 hours ago
      store.syncStatus.lastSyncTime = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(store.lastSyncStatus).toBe('2 hours ago')
      
      // Set to 3 days ago
      store.syncStatus.lastSyncTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(store.lastSyncStatus).toBe('3 days ago')
    })

    it('should detect conflicts correctly', () => {
      const store = useRealTimeStore()
      
      expect(store.hasConflicts).toBe(false)
      
      store.conflictQueue.push({
        id: 'conflict-1',
        type: 'matter_updated',
        localData: null,
        serverData: null,
        timestamp: new Date(),
        resolved: false
      })
      
      expect(store.hasConflicts).toBe(true)
      
      const unresolved = store.unresolvedConflicts
      expect(unresolved).toHaveLength(1)
    })

    it('should determine connection quality correctly', () => {
      const store = useRealTimeStore()
      
      // Offline
      Object.defineProperty(navigator, 'onLine', { value: false })
      store.updateNetworkStatus()
      expect(store.connectionQuality).toBe('offline')
      
      // Back online with 4G
      Object.defineProperty(navigator, 'onLine', { value: true })
      store.networkStatus.effectiveType = '4g'
      expect(store.connectionQuality).toBe('excellent')
      
      // 3G connection
      store.networkStatus.effectiveType = '3g'
      expect(store.connectionQuality).toBe('good')
      
      // 2G connection
      store.networkStatus.effectiveType = '2g'
      expect(store.connectionQuality).toBe('poor')
      
      // Unknown connection
      store.networkStatus.effectiveType = null
      expect(store.connectionQuality).toBe('unknown')
    })
  })
})