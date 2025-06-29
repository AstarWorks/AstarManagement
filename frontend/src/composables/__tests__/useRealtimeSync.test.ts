/**
 * Realtime Sync Tests
 * 
 * @description Tests for WebSocket-based real-time synchronization with
 * automatic reconnection and message queuing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useRealtimeSync } from '../useRealtimeSync'
import { useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '~/types/query'

// Mock modules
vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn()
}))

// Mock WebSocket connection
const mockWebSocket = {
  on: vi.fn(),
  off: vi.fn(),
  send: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  isConnected: { value: false }
}

vi.mock('../useWebSocketConnection', () => ({
  useWebSocketConnection: vi.fn(() => mockWebSocket)
}))

describe('useRealtimeSync', () => {
  let mockQueryClient: any
  let eventHandlers: Record<string, Function[]> = {}
  
  beforeEach(() => {
    // Reset event handlers
    eventHandlers = {}
    
    // Mock query client
    mockQueryClient = {
      setQueryData: vi.fn(),
      removeQueries: vi.fn(),
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
      getQueryData: vi.fn(),
      getQueryCache: vi.fn(() => ({
        getAll: vi.fn(() => [
          { state: { dataUpdatedAt: Date.now() - 5000 } },
          { state: { dataUpdatedAt: Date.now() - 10000 } }
        ])
      }))
    }
    
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient)
    
    // Mock WebSocket event handling
    mockWebSocket.on.mockImplementation((event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = []
      }
      eventHandlers[event].push(handler)
    })
    
    // Helper to trigger events
    ;(global as any).triggerWSEvent = (event: string, data?: any) => {
      eventHandlers[event]?.forEach(handler => handler(data))
    }
  })
  
  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    delete (global as any).triggerWSEvent
  })
  
  describe('Connection Management', () => {
    it('should initialize in disconnected state', () => {
      const { connectionState, isConnected } = useRealtimeSync()
      
      expect(connectionState.value.status).toBe('disconnected')
      expect(isConnected.value).toBe(false)
    })
    
    it('should connect when requested', () => {
      const { connect } = useRealtimeSync()
      
      connect()
      
      expect(mockWebSocket.on).toHaveBeenCalledWith('connected', expect.any(Function))
      expect(mockWebSocket.on).toHaveBeenCalledWith('disconnected', expect.any(Function))
      expect(mockWebSocket.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function))
    })
    
    it('should update state on successful connection', () => {
      const { connect, connectionState } = useRealtimeSync()
      
      connect()
      ;(global as any).triggerWSEvent('connected')
      
      expect(connectionState.value).toMatchObject({
        status: 'connected',
        reconnectAttempts: 0,
        lastConnectedAt: expect.any(Number)
      })
    })
    
    it('should handle disconnection', () => {
      const { connect, connectionState } = useRealtimeSync()
      
      connect()
      ;(global as any).triggerWSEvent('connected')
      ;(global as any).triggerWSEvent('disconnected')
      
      expect(connectionState.value).toMatchObject({
        status: 'disconnected',
        lastDisconnectedAt: expect.any(Number)
      })
    })
    
    it('should handle connection errors', () => {
      const { connect, connectionState } = useRealtimeSync()
      
      const error = new Error('Connection failed')
      connect()
      ;(global as any).triggerWSEvent('error', error)
      
      expect(connectionState.value).toMatchObject({
        status: 'error',
        lastError: error
      })
    })
  })
  
  describe('Automatic Reconnection', () => {
    it('should attempt reconnection after disconnect', async () => {
      vi.useFakeTimers()
      const { connect } = useRealtimeSync()
      
      connect()
      ;(global as any).triggerWSEvent('connected')
      ;(global as any).triggerWSEvent('disconnected')
      
      // Advance timers to trigger reconnection
      vi.advanceTimersByTime(2000)
      
      // Should attempt to reconnect
      expect(mockWebSocket.on).toHaveBeenCalledTimes(8) // 2 connects * 4 events each
      
      vi.useRealTimers()
    })
    
    it('should use exponential backoff for reconnection', async () => {
      vi.useFakeTimers()
      const { connect, connectionState } = useRealtimeSync()
      
      connect()
      
      // Simulate multiple failed connections
      for (let i = 0; i < 3; i++) {
        ;(global as any).triggerWSEvent('disconnected')
        vi.advanceTimersByTime(Math.pow(1.5, i) * 1000 + 1000) // backoff + jitter
      }
      
      expect(connectionState.value.reconnectAttempts).toBe(3)
      
      vi.useRealTimers()
    })
    
    it('should stop reconnecting after max attempts', async () => {
      vi.useFakeTimers()
      const { connect, connectionState } = useRealtimeSync()
      
      connect()
      
      // Simulate max failed connections
      for (let i = 0; i < 11; i++) {
        ;(global as any).triggerWSEvent('disconnected')
        vi.advanceTimersByTime(30000) // max delay
      }
      
      expect(connectionState.value.reconnectAttempts).toBe(10)
      
      vi.useRealTimers()
    })
  })
  
  describe('Message Handling', () => {
    it('should handle matter created messages', () => {
      const { connect } = useRealtimeSync()
      const matter = { id: '123', title: 'Test Matter' }
      
      connect()
      ;(global as any).triggerWSEvent('message', {
        type: 'matter:created',
        payload: matter
      })
      
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        queryKeys.matters.detail('123'),
        matter
      )
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeys.matters.all
      })
    })
    
    it('should handle matter updated messages', () => {
      const { connect } = useRealtimeSync()
      const matter = { id: '123', title: 'Updated Matter' }
      
      connect()
      ;(global as any).triggerWSEvent('message', {
        type: 'matter:updated',
        payload: matter
      })
      
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        queryKeys.matters.detail('123'),
        matter
      )
    })
    
    it('should handle matter deleted messages', () => {
      const { connect } = useRealtimeSync()
      
      connect()
      ;(global as any).triggerWSEvent('message', {
        type: 'matter:deleted',
        payload: { id: '123' }
      })
      
      expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: queryKeys.matters.detail('123')
      })
    })
    
    it('should handle kanban move messages', () => {
      const { connect } = useRealtimeSync()
      
      mockQueryClient.getQueryData.mockReturnValue({
        id: '123',
        title: 'Test Matter',
        status: 'new'
      })
      
      connect()
      ;(global as any).triggerWSEvent('message', {
        type: 'kanban:moved',
        payload: {
          matterId: '123',
          fromStatus: 'new',
          toStatus: 'in_progress',
          position: 0
        }
      })
      
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        queryKeys.matters.detail('123'),
        expect.objectContaining({
          status: 'in_progress'
        })
      )
    })
    
    it('should handle batch sync responses', () => {
      const { connect } = useRealtimeSync()
      
      connect()
      ;(global as any).triggerWSEvent('message', {
        type: 'sync:response',
        payload: {
          updates: [
            { type: 'matter:updated', payload: { id: '1' } },
            { type: 'matter:updated', payload: { id: '2' } }
          ]
        }
      })
      
      expect(mockQueryClient.setQueryData).toHaveBeenCalledTimes(2)
    })
  })
  
  describe('Message Queuing', () => {
    it('should queue messages when offline', () => {
      const { send, queuedMessages } = useRealtimeSync()
      
      // Not connected yet
      send({ type: 'test', payload: {} })
      
      expect(queuedMessages.value).toBe(1)
      expect(mockWebSocket.send).not.toHaveBeenCalled()
    })
    
    it('should process queued messages on connection', () => {
      const { connect, send } = useRealtimeSync()
      
      // Queue messages while disconnected
      send({ type: 'test1', payload: {} })
      send({ type: 'test2', payload: {} })
      
      connect()
      ;(global as any).triggerWSEvent('connected')
      
      // Should send queued messages
      expect(mockWebSocket.send).toHaveBeenCalledTimes(3) // 2 queued + 1 sync request
    })
    
    it('should limit queue size', () => {
      const { send, queuedMessages } = useRealtimeSync()
      
      // Queue more than max messages
      for (let i = 0; i < 150; i++) {
        send({ type: 'test', payload: { i } })
      }
      
      expect(queuedMessages.value).toBe(100) // max queue size
    })
  })
  
  describe('Heartbeat & Latency', () => {
    it('should send heartbeat pings', async () => {
      vi.useFakeTimers()
      const { connect } = useRealtimeSync()
      
      connect()
      ;(global as any).triggerWSEvent('connected')
      
      // Advance time to trigger heartbeat
      vi.advanceTimersByTime(30000)
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ping',
          payload: expect.objectContaining({
            timestamp: expect.any(Number)
          })
        })
      )
      
      vi.useRealTimers()
    })
    
    it('should calculate latency from pong responses', () => {
      const { connect, latency } = useRealtimeSync()
      
      connect()
      ;(global as any).triggerWSEvent('connected')
      
      const pingTime = Date.now() - 50
      ;(global as any).triggerWSEvent('message', {
        type: 'pong',
        payload: { timestamp: pingTime }
      })
      
      expect(latency.value).toBeGreaterThanOrEqual(50)
      expect(latency.value).toBeLessThan(100)
    })
  })
  
  describe('Performance Metrics', () => {
    it('should track message count', () => {
      const { connect, messageCount } = useRealtimeSync()
      
      connect()
      
      for (let i = 0; i < 5; i++) {
        ;(global as any).triggerWSEvent('message', {
          type: 'test',
          payload: {}
        })
      }
      
      expect(messageCount.value).toBe(5)
    })
    
    it('should calculate messages per minute', async () => {
      vi.useFakeTimers()
      const { connect, messagesPerMinute } = useRealtimeSync()
      
      connect()
      
      // Send messages
      for (let i = 0; i < 10; i++) {
        ;(global as any).triggerWSEvent('message', {
          type: 'test',
          payload: {}
        })
      }
      
      // Advance time to trigger rate calculation
      vi.advanceTimersByTime(5000)
      
      expect(messagesPerMinute.value).toBe(10)
      
      vi.useRealTimers()
    })
    
    it('should provide connection info', () => {
      const { connect, getConnectionInfo } = useRealtimeSync()
      
      connect()
      ;(global as any).triggerWSEvent('connected')
      
      const info = getConnectionInfo()
      
      expect(info).toMatchObject({
        status: 'connected',
        reconnectAttempts: 0,
        latency: null,
        messageRate: 0,
        queueSize: 0
      })
    })
  })
  
  describe('Cleanup', () => {
    it('should disconnect on unmount', () => {
      const { connect, disconnect } = useRealtimeSync()
      
      connect()
      disconnect()
      
      expect(mockWebSocket.disconnect).toHaveBeenCalled()
    })
  })
})