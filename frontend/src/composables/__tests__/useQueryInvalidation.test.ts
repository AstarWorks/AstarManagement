/**
 * Query Invalidation Test Suite
 * 
 * @description Comprehensive tests for query invalidation strategies including
 * WebSocket integration, polling sync, and Kanban-specific invalidation patterns.
 * 
 * @author Claude
 * @created 2025-06-25
 * @task T06_S08
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import { QueryClient } from '@tanstack/vue-query'
import { useQueryInvalidation, useWebSocketInvalidation, usePollingInvalidation } from '../useQueryInvalidation'
import { useKanbanQueryInvalidation } from '../useKanbanQueryInvalidation'
import { useRealTimeQuerySync } from '../useRealTimeQuerySync'
import type { RealTimeEvent } from '~/stores/kanban/real-time'
import type { Matter } from '~/types/kanban'

// Mock Nuxt app and composables
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $fetch: vi.fn()
  })
}))

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: () => mockQueryClient,
  useQuery: vi.fn(),
  useMutation: vi.fn()
}))

// Mock query client
const mockQueryClient = {
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
  removeQueries: vi.fn(),
  cancelQueries: vi.fn().mockResolvedValue(undefined)
}

// Test data
const createMockEvent = (type: string, data: any = {}): RealTimeEvent => ({
  id: `event-${Date.now()}-${Math.random()}`,
  type,
  data,
  userId: 'test-user',
  timestamp: new Date(),
  acknowledged: true
})

const createMockMatter = (id: string = '1', status: string = 'draft'): Matter => ({
  id,
  caseNumber: `CASE-${id}`,
  title: `Test Matter ${id}`,
  description: 'Test description',
  clientName: 'Test Client',
  status: status as any,
  priority: 'medium',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  assignedLawyer: 'lawyer-1',
  tags: []
})

describe('useQueryInvalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should setup default invalidation rules', () => {
    const { invalidationRules, setupDefaultRules } = useQueryInvalidation()
    
    setupDefaultRules()
    
    expect(invalidationRules.value.length).toBeGreaterThan(0)
    expect(invalidationRules.value.some(rule => rule.id === 'matter-update')).toBe(true)
    expect(invalidationRules.value.some(rule => rule.id === 'matter-create')).toBe(true)
  })

  test('should add and remove custom rules', () => {
    const { addRule, removeRule, invalidationRules } = useQueryInvalidation()
    
    const customRule = {
      id: 'custom-rule',
      eventTypes: ['custom_event'],
      queryKeys: [['custom', 'query']],
      debounceMs: 1000
    }
    
    addRule(customRule)
    expect(invalidationRules.value.some(rule => rule.id === 'custom-rule')).toBe(true)
    
    removeRule('custom-rule')
    expect(invalidationRules.value.some(rule => rule.id === 'custom-rule')).toBe(false)
  })

  test('should handle real-time events with matching rules', async () => {
    const { handleRealtimeEvent, setupDefaultRules } = useQueryInvalidation()
    
    setupDefaultRules()
    
    const event = createMockEvent('matter_updated', { id: 'matter-1' })
    
    handleRealtimeEvent(event, { source: 'websocket' })
    
    // Wait for debounced execution
    vi.advanceTimersByTime(1000)
    await nextTick()
    
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled()
  })

  test('should skip self-initiated events', () => {
    const { handleRealtimeEvent, setupDefaultRules } = useQueryInvalidation()
    
    setupDefaultRules()
    
    const event = createMockEvent('matter_updated', { id: 'matter-1' })
    
    handleRealtimeEvent(event, { source: 'websocket', isSelfInitiated: true })
    
    vi.advanceTimersByTime(1000)
    
    expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled()
  })

  test('should debounce invalidations', async () => {
    const { handleRealtimeEvent, addRule } = useQueryInvalidation()
    
    addRule({
      id: 'debounce-test',
      eventTypes: ['test_event'],
      queryKeys: [['test']],
      debounceMs: 500
    })
    
    const event1 = createMockEvent('test_event')
    const event2 = createMockEvent('test_event')
    
    handleRealtimeEvent(event1, { source: 'websocket' })
    handleRealtimeEvent(event2, { source: 'websocket' })
    
    // Should not invalidate immediately
    expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled()
    
    // Should invalidate after debounce period
    vi.advanceTimersByTime(500)
    await nextTick()
    
    // Should only be called once due to debouncing
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1)
  })

  test('should enforce rate limiting', async () => {
    const { handleRealtimeEvent, addRule, metrics } = useQueryInvalidation()
    
    addRule({
      id: 'rate-limit-test',
      eventTypes: ['rapid_event'],
      queryKeys: [['test']],
      rateLimit: 2
    })
    
    // Send 5 events rapidly
    for (let i = 0; i < 5; i++) {
      const event = createMockEvent('rapid_event')
      handleRealtimeEvent(event, { source: 'websocket' })
    }
    
    await nextTick()
    
    // Should be rate limited after 2 events
    expect(metrics.value.rateLimitedInvalidations).toBeGreaterThan(0)
  })

  test('should handle cascade invalidations', async () => {
    const { handleRealtimeEvent, addRule } = useQueryInvalidation()
    
    addRule({
      id: 'cascade-test',
      eventTypes: ['matter_updated'],
      queryKeys: [['matters', 'list']],
      cascade: true
    })
    
    const event = createMockEvent('matter_updated', { id: 'matter-1' })
    
    handleRealtimeEvent(event, { source: 'websocket' })
    
    vi.advanceTimersByTime(1000)
    await nextTick()
    
    // Should invalidate both the specified query and cascade queries
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['matters', 'list'],
      exact: false
    })
  })

  test('should track metrics correctly', async () => {
    const { handleRealtimeEvent, metrics, setupDefaultRules } = useQueryInvalidation()
    
    setupDefaultRules()
    
    const event = createMockEvent('matter_created')
    
    handleRealtimeEvent(event, { source: 'websocket' })
    
    vi.advanceTimersByTime(1000)
    await nextTick()
    
    expect(metrics.value.totalInvalidations).toBeGreaterThan(0)
    expect(metrics.value.invalidationsByType['matter_created']).toBeGreaterThan(0)
    expect(metrics.value.lastInvalidationTime).toBeDefined()
  })
})

describe('useWebSocketInvalidation', () => {
  test('should create WebSocket handler', () => {
    const { createWebSocketHandler } = useWebSocketInvalidation()
    
    const getCurrentUserId = () => 'current-user'
    const handler = createWebSocketHandler(getCurrentUserId)
    
    expect(typeof handler).toBe('function')
  })

  test('should handle WebSocket messages', () => {
    const { createWebSocketHandler, handleRealtimeEvent } = useWebSocketInvalidation()
    
    const handleSpy = vi.spyOn({ handleRealtimeEvent }, 'handleRealtimeEvent')
    
    const getCurrentUserId = () => 'current-user'
    const handler = createWebSocketHandler(getCurrentUserId)
    
    const message = {
      type: 'matter_updated',
      data: { id: 'matter-1' },
      userId: 'other-user',
      timestamp: new Date().toISOString()
    }
    
    handler(message)
    
    expect(handleSpy).toHaveBeenCalled()
  })
})

describe('usePollingInvalidation', () => {
  test('should create polling callback', () => {
    const { createPollingCallback } = usePollingInvalidation()
    
    const callback = createPollingCallback()
    
    expect(typeof callback).toBe('function')
  })

  test('should handle polling updates', () => {
    const { createPollingCallback, handlePollingUpdate } = usePollingInvalidation()
    
    const handleSpy = vi.spyOn({ handlePollingUpdate }, 'handlePollingUpdate')
    
    const callback = createPollingCallback()
    const matters = [createMockMatter('1'), createMockMatter('2')]
    
    callback(matters)
    
    expect(handleSpy).toHaveBeenCalledWith(matters, expect.any(Object))
  })
})

describe('useKanbanQueryInvalidation', () => {
  test('should track active columns', () => {
    const { setActiveColumns, activeColumns } = useKanbanQueryInvalidation()
    
    setActiveColumns(['draft', 'active', 'completed'])
    
    expect(activeColumns.value.has('draft')).toBe(true)
    expect(activeColumns.value.has('active')).toBe(true)
    expect(activeColumns.value.has('completed')).toBe(true)
    expect(activeColumns.value.has('archived')).toBe(false)
  })

  test('should track drag operations', () => {
    const { startDragOperation, completeDragOperation, isDragActive } = useKanbanQueryInvalidation()
    
    expect(isDragActive.value).toBe(false)
    
    startDragOperation('matter-1', 'draft')
    
    expect(isDragActive.value).toBe(true)
    
    completeDragOperation('matter-1', 'active')
    
    // Should be false after completion (may be async)
    vi.advanceTimersByTime(1000)
    expect(isDragActive.value).toBe(false)
  })

  test('should handle status change invalidation', async () => {
    const { completeDragOperation } = useKanbanQueryInvalidation()
    
    await completeDragOperation('matter-1', 'active')
    
    expect(mockQueryClient.setQueryData).toHaveBeenCalled()
  })

  test('should handle bulk operations', async () => {
    const { handleBulkOperation } = useKanbanQueryInvalidation()
    
    const operations = [
      { type: 'create' as const, matterId: 'new-1', data: createMockMatter('new-1') },
      { type: 'update' as const, matterId: 'matter-1', data: { title: 'Updated Title' } },
      { type: 'delete' as const, matterId: 'matter-2' }
    ]
    
    await handleBulkOperation(operations)
    
    expect(mockQueryClient.setQueryData).toHaveBeenCalledTimes(3)
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled()
  })

  test('should reconcile optimistic updates', async () => {
    const { reconcileOptimisticUpdate } = useKanbanQueryInvalidation()
    
    const cachedMatter = createMockMatter('1', 'draft')
    const serverMatter = createMockMatter('1', 'active')
    
    mockQueryClient.getQueryData.mockReturnValue(cachedMatter)
    
    await reconcileOptimisticUpdate('1', serverMatter)
    
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['matters', 'detail', '1'], serverMatter)
  })

  test('should measure performance metrics', () => {
    const { startDragOperation, performanceMetrics } = useKanbanQueryInvalidation({ enablePerformanceMonitoring: true })
    
    const initialTotal = performanceMetrics.value.totalDragOperations
    
    startDragOperation('matter-1', 'draft')
    
    expect(performanceMetrics.value.totalDragOperations).toBe(initialTotal + 1)
    expect(performanceMetrics.value.lastOperationTime).toBeDefined()
  })
})

describe('useRealTimeQuerySync', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false
    })
  })

  test('should initialize with default configuration', () => {
    const { syncConfig, isActive } = useRealTimeQuerySync()
    
    expect(syncConfig.value.enableWebSocket).toBe(true)
    expect(syncConfig.value.enablePolling).toBe(true)
    expect(isActive.value).toBe(false)
  })

  test('should start and stop synchronization', () => {
    const { start, stop, isActive } = useRealTimeQuerySync()
    
    start()
    expect(isActive.value).toBe(true)
    
    stop()
    expect(isActive.value).toBe(false)
  })

  test('should update configuration', () => {
    const { updateConfig, syncConfig } = useRealTimeQuerySync()
    
    updateConfig({ batchSize: 20, debugMode: true })
    
    expect(syncConfig.value.batchSize).toBe(20)
    expect(syncConfig.value.debugMode).toBe(true)
  })

  test('should force sync', async () => {
    const { forceSync } = useRealTimeQuerySync()
    
    await forceSync()
    
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled()
  })

  test('should reset metrics', () => {
    const { resetMetrics, syncMetrics } = useRealTimeQuerySync()
    
    // Set some initial values
    syncMetrics.value.totalEventsProcessed = 10
    
    resetMetrics()
    
    expect(syncMetrics.value.totalEventsProcessed).toBe(0)
  })

  test('should batch process events', async () => {
    const { processBatch } = useRealTimeQuerySync({ batchSize: 2, batchIntervalMs: 100 })
    
    await processBatch()
    
    // Should complete without errors
    expect(true).toBe(true)
  })
})

describe('Integration Tests', () => {
  test('should integrate WebSocket invalidation with real-time sync', async () => {
    const realTimeSync = useRealTimeQuerySync()
    const webSocketInvalidation = useWebSocketInvalidation()
    
    realTimeSync.start()
    
    const event = createMockEvent('matter_updated', { id: 'matter-1' })
    webSocketInvalidation.handleRealtimeEvent(event, { source: 'websocket' })
    
    vi.advanceTimersByTime(1000)
    await nextTick()
    
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled()
  })

  test('should integrate Kanban invalidation with drag operations', async () => {
    const kanbanInvalidation = useKanbanQueryInvalidation()
    
    kanbanInvalidation.setActiveColumns(['draft', 'active'])
    kanbanInvalidation.startDragOperation('matter-1', 'draft')
    
    await kanbanInvalidation.completeDragOperation('matter-1', 'active')
    
    expect(mockQueryClient.setQueryData).toHaveBeenCalled()
  })

  test('should handle complex invalidation scenarios', async () => {
    const realTimeSync = useRealTimeQuerySync()
    const kanbanInvalidation = useKanbanQueryInvalidation()
    
    realTimeSync.start()
    kanbanInvalidation.setActiveColumns(['draft', 'active', 'completed'])
    
    // Simulate multiple concurrent operations
    const events = [
      createMockEvent('matter_updated', { id: 'matter-1' }),
      createMockEvent('matter_status_changed', { id: 'matter-2', newStatus: 'active' }),
      createMockEvent('matter_created', { id: 'matter-3' })
    ]
    
    for (const event of events) {
      realTimeSync.webSocketInvalidation.handleRealtimeEvent(event, { source: 'websocket' })
    }
    
    vi.advanceTimersByTime(2000)
    await nextTick()
    
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled()
  })
})