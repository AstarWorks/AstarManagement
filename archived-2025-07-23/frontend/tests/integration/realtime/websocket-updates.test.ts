/**
 * Real-time WebSocket Updates Integration Tests
 * Tests WebSocket integration with component updates and store synchronization
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { 
  setupTestPinia, 
  createApiMock, 
  mockServerState,
  createWebSocketMock 
} from '../setup'

// Mock Real-time Component
const RealTimeComponent = defineComponent({
  setup() {
    const matters = ref(mockServerState.matters)
    const connectionStatus = ref('disconnected')
    const lastUpdate = ref(null)
    const updateQueue = ref([])
    
    let ws = null
    
    const connectWebSocket = () => {
      ws = createWebSocketMock()
      connectionStatus.value = 'connecting'
      
      // Simulate connection
      setTimeout(() => {
        connectionStatus.value = 'connected'
        ws.isConnected.mockReturnValue(true)
      }, 100)
      
      // Setup message handlers
      ws.on.mockImplementation((event, handler) => {
        if (event === 'matter:updated') {
          // Store handler for manual triggering in tests
          ws._matterUpdateHandler = handler
        } else if (event === 'matter:created') {
          ws._matterCreateHandler = handler
        } else if (event === 'matter:deleted') {
          ws._matterDeleteHandler = handler
        }
      })
      
      return ws
    }
    
    const disconnectWebSocket = () => {
      if (ws) {
        ws.disconnect()
        connectionStatus.value = 'disconnected'
        ws = null
      }
    }
    
    const handleMatterUpdate = (data) => {
      const { matterId, updates } = data
      const index = matters.value.findIndex(m => m.id === matterId)
      
      if (index !== -1) {
        matters.value[index] = { ...matters.value[index], ...updates }
        lastUpdate.value = {
          type: 'update',
          matterId,
          timestamp: new Date()
        }
      }
    }
    
    const handleMatterCreate = (data) => {
      matters.value.push(data.matter)
      lastUpdate.value = {
        type: 'create',
        matterId: data.matter.id,
        timestamp: new Date()
      }
    }
    
    const handleMatterDelete = (data) => {
      const index = matters.value.findIndex(m => m.id === data.matterId)
      if (index !== -1) {
        matters.value.splice(index, 1)
        lastUpdate.value = {
          type: 'delete',
          matterId: data.matterId,
          timestamp: new Date()
        }
      }
    }
    
    const processUpdateQueue = () => {
      while (updateQueue.value.length > 0) {
        const update = updateQueue.value.shift()
        switch (update.type) {
          case 'matter:updated':
            handleMatterUpdate(update.data)
            break
          case 'matter:created':
            handleMatterCreate(update.data)
            break
          case 'matter:deleted':
            handleMatterDelete(update.data)
            break
        }
      }
    }
    
    const queueUpdate = (type, data) => {
      updateQueue.value.push({ type, data })
      
      // Process queue on next tick to batch updates
      setTimeout(processUpdateQueue, 0)
    }
    
    onMounted(() => {
      const socket = connectWebSocket()
      
      // Expose trigger methods for testing
      window._triggerMatterUpdate = (data) => {
        if (socket._matterUpdateHandler) {
          socket._matterUpdateHandler(data)
        }
      }
      
      window._triggerMatterCreate = (data) => {
        if (socket._matterCreateHandler) {
          socket._matterCreateHandler(data)
        }
      }
      
      window._triggerMatterDelete = (data) => {
        if (socket._matterDeleteHandler) {
          socket._matterDeleteHandler(data)
        }
      }
    })
    
    onUnmounted(() => {
      disconnectWebSocket()
      delete window._triggerMatterUpdate
      delete window._triggerMatterCreate
      delete window._triggerMatterDelete
    })
    
    return {
      matters,
      connectionStatus,
      lastUpdate,
      updateQueue,
      connectWebSocket,
      disconnectWebSocket,
      handleMatterUpdate,
      handleMatterCreate,
      handleMatterDelete,
      queueUpdate
    }
  },
  template: `
    <div data-testid="realtime-component">
      <div data-testid="connection-status" :class="connectionStatus">
        Status: {{ connectionStatus }}
      </div>
      
      <div v-if="lastUpdate" data-testid="last-update">
        Last Update: {{ lastUpdate.type }} - {{ lastUpdate.matterId }} at {{ lastUpdate.timestamp }}
      </div>
      
      <div data-testid="update-queue-length">
        Queue: {{ updateQueue.length }}
      </div>
      
      <div data-testid="matters-list">
        <div 
          v-for="matter in matters"
          :key="matter.id"
          :data-testid="'matter-' + matter.id"
          class="matter-item"
        >
          <h3>{{ matter.title }}</h3>
          <span :data-testid="'status-' + matter.id">{{ matter.status }}</span>
          <span :data-testid="'priority-' + matter.id">{{ matter.priority }}</span>
        </div>
      </div>
    </div>
  `
})

describe('Real-time WebSocket Updates Integration', () => {
  let queryClient: QueryClient
  let apiMock: ReturnType<typeof createApiMock>
  
  beforeEach(() => {
    setupTestPinia()
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false }
      }
    })
    
    apiMock = createApiMock()
    global.$fetch = apiMock
    
    // Reset mock data
    mockServerState.matters = [
      {
        id: '1',
        title: 'Contract Review',
        status: 'draft',
        priority: 'medium',
        assigneeId: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        title: 'Legal Research',
        status: 'in-progress',
        priority: 'high',
        assigneeId: 'user-2',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      }
    ]
  })
  
  afterEach(() => {
    // Clean up global functions
    delete window._triggerMatterUpdate
    delete window._triggerMatterCreate
    delete window._triggerMatterDelete
  })
  
  it('should establish WebSocket connection on mount', async () => {
    const wrapper = mount(RealTimeComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })
    
    // Initial state should be disconnected
    const status = wrapper.find('[data-testid="connection-status"]')
    expect(status.text()).toBe('Status: disconnected')
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()
    
    expect(status.text()).toBe('Status: connected')
    expect(status.classes()).toContain('connected')
  })
  
  it('should handle matter status updates via WebSocket', async () => {
    const wrapper = mount(RealTimeComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()
    
    // Verify initial status
    const matter1Status = wrapper.find('[data-testid="status-1"]')
    expect(matter1Status.text()).toBe('draft')
    
    // Trigger WebSocket update
    window._triggerMatterUpdate({
      matterId: '1',
      updates: { status: 'completed' }
    })
    
    await wrapper.vm.$nextTick()
    
    // Status should be updated
    expect(matter1Status.text()).toBe('completed')
    
    // Last update should be recorded
    const lastUpdate = wrapper.find('[data-testid="last-update"]')
    expect(lastUpdate.text()).toContain('update - 1')
  })
  
  it('should handle new matter creation via WebSocket', async () => {
    const wrapper = mount(RealTimeComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()
    
    // Initially should have 2 matters
    const initialMatters = wrapper.findAll('.matter-item')
    expect(initialMatters).toHaveLength(2)
    
    // Trigger new matter creation
    window._triggerMatterCreate({
      matter: {
        id: '3',
        title: 'New Matter',
        status: 'draft',
        priority: 'low',
        assigneeId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
    
    await wrapper.vm.$nextTick()
    
    // Should now have 3 matters
    const updatedMatters = wrapper.findAll('.matter-item')
    expect(updatedMatters).toHaveLength(3)
    
    const newMatter = wrapper.find('[data-testid="matter-3"]')
    expect(newMatter.exists()).toBe(true)
    expect(newMatter.text()).toContain('New Matter')
  })
  
  it('should handle matter deletion via WebSocket', async () => {
    const wrapper = mount(RealTimeComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()
    
    // Initially should have 2 matters
    let matters = wrapper.findAll('.matter-item')
    expect(matters).toHaveLength(2)
    
    const matter1 = wrapper.find('[data-testid="matter-1"]')
    expect(matter1.exists()).toBe(true)
    
    // Trigger matter deletion
    window._triggerMatterDelete({
      matterId: '1'
    })
    
    await wrapper.vm.$nextTick()
    
    // Should now have 1 matter
    matters = wrapper.findAll('.matter-item')
    expect(matters).toHaveLength(1)
    
    expect(wrapper.find('[data-testid="matter-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="matter-2"]').exists()).toBe(true)
  })
  
  it('should handle multiple rapid updates correctly', async () => {
    const wrapper = mount(RealTimeComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()
    
    // Trigger multiple rapid updates
    window._triggerMatterUpdate({
      matterId: '1',
      updates: { status: 'in-progress' }
    })
    
    window._triggerMatterUpdate({
      matterId: '1',
      updates: { priority: 'high' }
    })
    
    window._triggerMatterUpdate({
      matterId: '1',
      updates: { status: 'completed' }
    })
    
    // Wait for all updates to process
    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()
    
    const matter1Status = wrapper.find('[data-testid="status-1"]')
    const matter1Priority = wrapper.find('[data-testid="priority-1"]')
    
    expect(matter1Status.text()).toBe('completed')
    expect(matter1Priority.text()).toBe('high')
  })
  
  it('should queue updates when processing', async () => {
    const wrapper = mount(RealTimeComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()
    
    // Trigger update using the queue method directly
    wrapper.vm.queueUpdate('matter:updated', {
      matterId: '1',
      updates: { status: 'completed' }
    })
    
    // Should initially show queued update
    const queueLength = wrapper.find('[data-testid="update-queue-length"]')
    expect(queueLength.text()).toBe('Queue: 1')
    
    // Wait for queue processing
    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()
    
    // Queue should be empty after processing
    expect(queueLength.text()).toBe('Queue: 0')
    
    // Update should be applied
    const matter1Status = wrapper.find('[data-testid="status-1"]')
    expect(matter1Status.text()).toBe('completed')
  })
  
  it('should handle WebSocket disconnection gracefully', async () => {
    const wrapper = mount(RealTimeComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()
    
    // Should be connected
    const status = wrapper.find('[data-testid="connection-status"]')
    expect(status.text()).toBe('Status: connected')
    
    // Disconnect
    wrapper.vm.disconnectWebSocket()
    await wrapper.vm.$nextTick()
    
    expect(status.text()).toBe('Status: disconnected')
  })
  
  it('should clean up WebSocket on component unmount', async () => {
    const wrapper = mount(RealTimeComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()
    
    // Verify global functions exist
    expect(typeof window._triggerMatterUpdate).toBe('function')
    
    // Unmount component
    wrapper.unmount()
    
    // Global functions should be cleaned up
    expect(window._triggerMatterUpdate).toBeUndefined()
    expect(window._triggerMatterCreate).toBeUndefined()
    expect(window._triggerMatterDelete).toBeUndefined()
  })
  
  it('should handle malformed WebSocket messages gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const wrapper = mount(RealTimeComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })
    
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()
    
    // Trigger update with missing data
    try {
      window._triggerMatterUpdate({
        matterId: 'nonexistent',
        updates: { status: 'completed' }
      })
      
      await wrapper.vm.$nextTick()
      
      // Should not crash, original matters should remain unchanged
      const matters = wrapper.findAll('.matter-item')
      expect(matters).toHaveLength(2)
    } catch (error) {
      // If there's an error, it should be handled gracefully
      expect(error).toBeUndefined()
    }
    
    consoleSpy.mockRestore()
  })
})