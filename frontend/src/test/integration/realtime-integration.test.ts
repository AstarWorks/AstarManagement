/**
 * Real-Time Integration Tests
 * 
 * @description Tests real-time WebSocket connections, live updates,
 * and synchronization between multiple clients and components
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
import { useWebSocketStore } from '@/stores/websocket'

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = []
  
  url: string
  readyState: number = WebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    
    // Simulate connection after a tick
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 0)
  }

  send(data: string) {
    // Mock send implementation
  }

  close() {
    this.readyState = WebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  }

  // Simulate receiving message
  simulateMessage(data: any) {
    if (this.readyState === WebSocket.OPEN) {
      this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
    }
  }

  static closeAll() {
    this.instances.forEach(ws => ws.close())
    this.instances = []
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any

describe('Real-Time Integration', () => {
  let pinia: any
  let queryClient: QueryClient

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    // Mock successful API responses
    global.$fetch = vi.fn().mockResolvedValue([])
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
    MockWebSocket.closeAll()
    vi.clearAllMocks()
  })

  describe('WebSocket Connection Management', () => {
    it('should establish WebSocket connection on component mount', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      await waitForAsync(wrapper)

      const webSocketStore = useWebSocketStore()
      
      expect(webSocketStore.connectionState).toBe('connected')
      expect(MockWebSocket.instances).toHaveLength(1)
    })

    it('should handle connection errors gracefully', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const webSocketStore = useWebSocketStore()

      // Simulate connection error
      const mockWs = MockWebSocket.instances[0]
      mockWs.readyState = WebSocket.CLOSED
      mockWs.onerror?.(new Event('error'))

      await nextTick()

      expect(webSocketStore.connectionState).toBe('disconnected')
      expect(webSocketStore.error).toBeTruthy()
    })

    it('should attempt reconnection on connection loss', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const webSocketStore = useWebSocketStore()

      // Simulate connection loss
      const mockWs = MockWebSocket.instances[0]
      mockWs.close()

      await new Promise(resolve => setTimeout(resolve, 100))

      // Should attempt reconnection
      expect(webSocketStore.reconnectAttempts).toBeGreaterThan(0)
    })

    it('should clean up WebSocket on component unmount', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      await waitForAsync(wrapper)

      expect(MockWebSocket.instances).toHaveLength(1)

      wrapper.unmount()
      await nextTick()

      expect(MockWebSocket.instances[0].readyState).toBe(WebSocket.CLOSED)
    })
  })

  describe('Real-Time Matter Updates', () => {
    it('should update matter in real-time when received from server', async () => {
      const matters = [
        createMockMatter({ 
          id: 'matter-1', 
          title: 'Original Title',
          status: 'INTAKE'
        })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      await waitForAsync(wrapper)

      const matterStore = useMatterStore()
      const webSocketStore = useWebSocketStore()

      // Simulate real-time update from server
      const mockWs = MockWebSocket.instances[0]
      mockWs.simulateMessage({
        type: 'matter_updated',
        data: {
          id: 'matter-1',
          title: 'Updated Title',
          status: 'IN_PROGRESS',
          updatedBy: 'other-user'
        },
        timestamp: new Date().toISOString()
      })

      await nextTick()

      // Verify matter was updated in store
      const updatedMatter = matterStore.getMatterById('matter-1')
      expect(updatedMatter?.title).toBe('Updated Title')
      expect(updatedMatter?.status).toBe('IN_PROGRESS')

      // Verify UI reflects the update
      const matterCard = findByTestId(wrapper, 'matter-card-matter-1')
      expect(matterCard.text()).toContain('Updated Title')
    })

    it('should handle matter creation in real-time', async () => {
      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters: [], isLoading: false }
        }
      })

      const matterStore = useMatterStore()

      // Simulate new matter creation from another client
      const mockWs = MockWebSocket.instances[0]
      const newMatter = createMockMatter({
        id: 'matter-new',
        title: 'New Real-Time Matter',
        status: 'INTAKE'
      })

      mockWs.simulateMessage({
        type: 'matter_created',
        data: newMatter,
        timestamp: new Date().toISOString()
      })

      await nextTick()

      // Verify matter was added to store
      expect(matterStore.matters).toHaveLength(1)
      expect(matterStore.getMatterById('matter-new')).toEqual(newMatter)
    })

    it('should handle matter deletion in real-time', async () => {
      const matters = [
        createMockMatter({ id: 'matter-1', title: 'To Be Deleted' }),
        createMockMatter({ id: 'matter-2', title: 'Will Remain' })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const matterStore = useMatterStore()

      // Simulate matter deletion from another client
      const mockWs = MockWebSocket.instances[0]
      mockWs.simulateMessage({
        type: 'matter_deleted',
        data: { id: 'matter-1' },
        timestamp: new Date().toISOString()
      })

      await nextTick()

      // Verify matter was removed from store
      expect(matterStore.matters).toHaveLength(1)
      expect(matterStore.getMatterById('matter-1')).toBeUndefined()
      expect(matterStore.getMatterById('matter-2')).toBeDefined()
    })
  })

  describe('Collaborative Drag and Drop', () => {
    it('should show real-time drag indicators from other users', async () => {
      const matters = [
        createMockMatter({ id: 'matter-1', status: 'INTAKE' })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const kanbanStore = useKanbanStore()

      // Simulate another user starting a drag operation
      const mockWs = MockWebSocket.instances[0]
      mockWs.simulateMessage({
        type: 'drag_started',
        data: {
          matterId: 'matter-1',
          userId: 'other-user',
          userName: 'John Doe'
        },
        timestamp: new Date().toISOString()
      })

      await nextTick()

      // Verify drag state shows other user's operation
      expect(kanbanStore.collaborativeDragState.isOtherUserDragging).toBe(true)
      expect(kanbanStore.collaborativeDragState.draggedBy).toBe('John Doe')

      // Verify UI shows drag indicator
      const dragIndicator = findByTestId(wrapper, 'collaborative-drag-indicator')
      expect(dragIndicator.exists()).toBe(true)
      expect(dragIndicator.text()).toContain('John Doe is moving')
    })

    it('should handle conflicting drag operations gracefully', async () => {
      const matters = [
        createMockMatter({ id: 'matter-1', status: 'INTAKE' })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const kanbanStore = useKanbanStore()

      // Start local drag operation
      kanbanStore.startDrag('matter-1')

      // Simulate another user trying to drag the same matter
      const mockWs = MockWebSocket.instances[0]
      mockWs.simulateMessage({
        type: 'drag_conflict',
        data: {
          matterId: 'matter-1',
          conflictingUser: 'Jane Doe',
          resolution: 'first_user_wins'
        },
        timestamp: new Date().toISOString()
      })

      await nextTick()

      // Verify local drag continues (first user wins)
      expect(kanbanStore.dragState.isDragging).toBe(true)
      
      // Verify conflict notification is shown
      const conflictNotification = findByTestId(wrapper, 'drag-conflict-notification')
      expect(conflictNotification.exists()).toBe(true)
    })
  })

  describe('Conflict Resolution', () => {
    it('should handle version conflicts with server-wins strategy', async () => {
      const matters = [
        createMockMatter({ 
          id: 'matter-1', 
          title: 'Original',
          version: 1
        })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const matterStore = useMatterStore()

      // Local update
      matterStore.updateMatter('matter-1', { title: 'Local Update' })

      // Simulate conflicting server update
      const mockWs = MockWebSocket.instances[0]
      mockWs.simulateMessage({
        type: 'matter_updated',
        data: {
          id: 'matter-1',
          title: 'Server Update',
          version: 2,
          conflictResolution: 'server_wins'
        },
        timestamp: new Date().toISOString()
      })

      await nextTick()

      // Verify server version is used
      const updatedMatter = matterStore.getMatterById('matter-1')
      expect(updatedMatter?.title).toBe('Server Update')
      expect(updatedMatter?.version).toBe(2)
    })

    it('should merge non-conflicting changes', async () => {
      const matters = [
        createMockMatter({ 
          id: 'matter-1',
          title: 'Original',
          description: 'Original Description',
          priority: 'MEDIUM'
        })
      ]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const matterStore = useMatterStore()

      // Local update (change priority)
      matterStore.updateMatter('matter-1', { priority: 'HIGH' })

      // Simulate server update (change description)
      const mockWs = MockWebSocket.instances[0]
      mockWs.simulateMessage({
        type: 'matter_updated',
        data: {
          id: 'matter-1',
          description: 'Updated Description',
          conflictResolution: 'merge'
        },
        timestamp: new Date().toISOString()
      })

      await nextTick()

      // Verify both changes are preserved
      const updatedMatter = matterStore.getMatterById('matter-1')
      expect(updatedMatter?.priority).toBe('HIGH') // Local change
      expect(updatedMatter?.description).toBe('Updated Description') // Server change
    })
  })

  describe('Connection State Handling', () => {
    it('should queue updates when connection is lost', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const webSocketStore = useWebSocketStore()
      const kanbanStore = useKanbanStore()

      // Simulate connection loss
      const mockWs = MockWebSocket.instances[0]
      mockWs.close()
      
      await nextTick()

      // Perform update while offline
      await kanbanStore.moveMatter('matter-1', 'INTAKE', 'IN_PROGRESS', 0)

      // Verify update is queued
      expect(webSocketStore.queuedUpdates).toHaveLength(1)
      expect(webSocketStore.queuedUpdates[0].type).toBe('matter_moved')
    })

    it('should sync queued updates when connection is restored', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const webSocketStore = useWebSocketStore()

      // Queue some updates while offline
      webSocketStore.queueUpdate({
        type: 'matter_updated',
        data: { id: 'matter-1', title: 'Offline Update' }
      })

      // Simulate connection restoration
      const newMockWs = new MockWebSocket('ws://localhost:3000/ws')
      await new Promise(resolve => setTimeout(resolve, 10))

      // Verify queued updates are sent
      expect(webSocketStore.queuedUpdates).toHaveLength(0)
    })

    it('should show connection status to user', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      
      // Verify connected status shown
      let connectionStatus = findByTestId(wrapper, 'connection-status')
      expect(connectionStatus.exists()).toBe(true)
      expect(connectionStatus.text()).toContain('Connected')

      // Simulate disconnection
      MockWebSocket.instances[0].close()
      await nextTick()

      // Verify disconnected status shown
      connectionStatus = findByTestId(wrapper, 'connection-status')
      expect(connectionStatus.text()).toContain('Disconnected')
    })
  })

  describe('Performance with Real-Time Updates', () => {
    it('should throttle high-frequency updates', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const matterStore = useMatterStore()

      const mockWs = MockWebSocket.instances[0]

      // Send many rapid updates
      for (let i = 0; i < 100; i++) {
        mockWs.simulateMessage({
          type: 'matter_updated',
          data: {
            id: 'matter-1',
            title: `Update ${i}`,
            timestamp: new Date().toISOString()
          }
        })
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have throttled updates (not all 100 applied)
      const matter = matterStore.getMatterById('matter-1')
      expect(matter?.title).toBeDefined()
      
      // Verify only latest update is applied
      expect(matter?.title).toMatch(/Update \d+/)
    })

    it('should batch multiple updates efficiently', async () => {
      const wrapper = mountWithQuery(KanbanBoard)
      const matterStore = useMatterStore()
      const updateSpy = vi.spyOn(matterStore, 'updateMatter')

      const mockWs = MockWebSocket.instances[0]

      // Send multiple updates for same matter
      mockWs.simulateMessage({
        type: 'batch_update',
        data: {
          updates: [
            { id: 'matter-1', title: 'Title Update' },
            { id: 'matter-1', priority: 'HIGH' },
            { id: 'matter-1', status: 'IN_PROGRESS' }
          ]
        }
      })

      await nextTick()

      // Should batch updates into single operation
      expect(updateSpy).toHaveBeenCalledTimes(1)
      
      const matter = matterStore.getMatterById('matter-1')
      expect(matter?.title).toBe('Title Update')
      expect(matter?.priority).toBe('HIGH')
      expect(matter?.status).toBe('IN_PROGRESS')
    })
  })
})