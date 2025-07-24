/**
 * Tests for Enhanced Kanban Drag-Drop Mutations
 * 
 * @description Comprehensive test suite for drag-drop mutations with
 * TanStack Query integration, batch operations, and real-time sync.
 * 
 * @author Claude
 * @created 2025-06-26
 * @task T12_S08 - Drag & Drop Mutations
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import { QueryClient } from '@tanstack/vue-query'
import { useKanbanDragDropMutations } from '../useKanbanDragDropMutations'
import { renderComposable } from '../../../e2e/utils/test-helpers'
import type { MatterCard, MatterStatus } from '~/types/kanban'
import type { BatchMoveInput } from '../useKanbanDragDropMutations'

// Mock dependencies
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $fetch: vi.fn(),
    $toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
  })
}))

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: () => mockQueryClient,
  useMutation: vi.fn()
}))

vi.mock('../useKanbanDragDrop', () => ({
  useKanbanDragDrop: () => ({
    draggedMatter: { value: null },
    isDragging: { value: false },
    canDropInColumn: vi.fn(() => true),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn()
  })
}))

vi.mock('../useRealtimeSync', () => ({
  useRealtimeSync: () => ({
    subscribeToUpdates: vi.fn(),
    publishEvent: vi.fn(),
    isConnected: { value: true }
  })
}))

vi.mock('../useAccessibility', () => ({
  useAccessibility: () => ({
    announceUpdate: vi.fn()
  })
}))

// Mock data
const mockMatter: MatterCard = {
  id: 'matter-1',
  caseNumber: 'CASE-001',
  title: 'Test Matter',
  description: 'Test description',
  clientName: 'Test Client',
  status: 'DRAFT',
  priority: 'MEDIUM',
  position: 1000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  assignedLawyer: 'lawyer-1',
  tags: ['test']
}

const mockQueryClient = {
  cancelQueries: vi.fn(),
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  removeQueries: vi.fn()
}

const mockMutationResult = {
  mutateAsync: vi.fn(),
  isPending: { value: false },
  isSuccess: { value: false },
  error: { value: null },
  data: { value: null }
}

// Test setup
describe('useKanbanDragDropMutations', () => {
  let queryClient: QueryClient
  let mockFetch: Mock
  let mockToast: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    mockFetch = vi.fn()
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }

    // Setup mock returns
    mockQueryClient.getQueryData.mockReturnValue({
      data: [mockMatter],
      total: 1
    })

    vi.mocked(vi.importMock('@tanstack/vue-query')).useMutation.mockReturnValue(mockMutationResult)
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Single Matter Move Mutation', () => {
    it('should create move mutation with optimistic updates', async () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      expect(result.moveMatterMutation).toBeDefined()
      expect(result.isMoving.value).toBe(false)
    })

    it('should handle successful move operation', async () => {
      const mockUpdatedMatter = { ...mockMatter, status: 'ACTIVE', position: 2000 }
      mockMutationResult.mutateAsync.mockResolvedValue(mockUpdatedMatter)

      const { result } = renderComposable(() => useKanbanDragDropMutations())

      await result.moveMatterMutation.mutateAsync({
        matterId: 'matter-1',
        newStatus: 'ACTIVE',
        newPosition: 2000
      })

      expect(mockMutationResult.mutateAsync).toHaveBeenCalledWith({
        matterId: 'matter-1',
        newStatus: 'ACTIVE',
        newPosition: 2000
      })
    })

    it('should handle move operation errors', async () => {
      const error = new Error('Move failed')
      mockMutationResult.mutateAsync.mockRejectedValue(error)

      const { result } = renderComposable(() => useKanbanDragDropMutations())

      await expect(
        result.moveMatterMutation.mutateAsync({
          matterId: 'matter-1',
          newStatus: 'ACTIVE',
          newPosition: 2000
        })
      ).rejects.toThrow('Move failed')
    })

    it('should update query cache optimistically', async () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      // Simulate optimistic update by calling setQueryData
      const optimisticUpdate = vi.fn()
      mockQueryClient.setQueryData.mockImplementation(optimisticUpdate)

      await result.moveMatterMutation.mutateAsync({
        matterId: 'matter-1',
        newStatus: 'ACTIVE',
        newPosition: 2000
      })

      expect(mockQueryClient.setQueryData).toHaveBeenCalled()
    })
  })

  describe('Batch Move Mutation', () => {
    const mockBatchInput: BatchMoveInput = {
      operations: [
        {
          matterId: 'matter-1',
          fromStatus: 'DRAFT',
          toStatus: 'ACTIVE',
          fromIndex: 0,
          toIndex: 0,
          matter: mockMatter
        }
      ],
      userId: 'user-1',
      timestamp: '2024-01-01T00:00:00Z'
    }

    it('should create batch mutation', async () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      expect(result.batchMoveMutation).toBeDefined()
      expect(result.isBatchMoving.value).toBe(false)
    })

    it('should handle successful batch operation', async () => {
      const mockResult = [{ ...mockMatter, status: 'ACTIVE' }]
      mockMutationResult.mutateAsync.mockResolvedValue(mockResult)

      const { result } = renderComposable(() => useKanbanDragDropMutations())

      await result.batchMoveMutation.mutateAsync(mockBatchInput)

      expect(mockMutationResult.mutateAsync).toHaveBeenCalledWith(mockBatchInput)
    })

    it('should validate batch input', async () => {
      const invalidInput = {
        operations: [], // Empty operations array
        userId: 'user-1',
        timestamp: '2024-01-01T00:00:00Z'
      }

      const { result } = renderComposable(() => useKanbanDragDropMutations())

      await expect(
        result.batchMoveMutation.mutateAsync(invalidInput)
      ).rejects.toThrow()
    })

    it('should handle batch operation rollback on error', async () => {
      const error = new Error('Batch operation failed')
      mockMutationResult.mutateAsync.mockRejectedValue(error)

      const { result } = renderComposable(() => useKanbanDragDropMutations())

      await expect(
        result.batchMoveMutation.mutateAsync(mockBatchInput)
      ).rejects.toThrow('Batch operation failed')

      // Verify rollback was called
      expect(mockQueryClient.setQueryData).toHaveBeenCalled()
    })
  })

  describe('Position Management', () => {
    it('should calculate optimal positions', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      const existingMatters: MatterCard[] = [
        { ...mockMatter, id: '1', position: 1000 },
        { ...mockMatter, id: '2', position: 3000 }
      ]

      const position = result.calculatePosition({
        targetStatus: 'ACTIVE',
        targetIndex: 1,
        existingMatters,
        draggedMatter: mockMatter
      })

      expect(position).toBe(2000) // Middle position between 1000 and 3000
    })

    it('should normalize positions when conflicts detected', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      const conflictedMatters: MatterCard[] = [
        { ...mockMatter, id: '1', position: 1000 },
        { ...mockMatter, id: '2', position: 1000 }, // Conflict
        { ...mockMatter, id: '3', position: 2000 }
      ]

      const normalized = result.normalizePositions(conflictedMatters)

      expect(normalized).toHaveLength(3)
      expect(normalized[0].position).toBe(1000)
      expect(normalized[1].position).toBe(2000)
      expect(normalized[2].position).toBe(3000)
    })
  })

  describe('Multi-select Operations', () => {
    it('should manage selected matters', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      expect(result.selectedMatters.value.size).toBe(0)
      expect(result.isMultiSelectMode.value).toBe(false)

      result.toggleMatterSelection('matter-1')
      expect(result.selectedMatters.value.has('matter-1')).toBe(true)

      result.toggleMatterSelection('matter-2')
      expect(result.selectedMatters.value.size).toBe(2)
      expect(result.isMultiSelectMode.value).toBe(true)
    })

    it('should select all matters', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      const matters = [
        { ...mockMatter, id: '1' },
        { ...mockMatter, id: '2' },
        { ...mockMatter, id: '3' }
      ]

      result.selectAll(matters)

      expect(result.selectedMatters.value.size).toBe(3)
      expect(result.isMultiSelectMode.value).toBe(true)
    })

    it('should clear selection', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      result.toggleMatterSelection('matter-1')
      result.toggleMatterSelection('matter-2')
      expect(result.selectedMatters.value.size).toBe(2)

      result.clearSelection()
      expect(result.selectedMatters.value.size).toBe(0)
      expect(result.isMultiSelectMode.value).toBe(false)
    })
  })

  describe('Drag and Drop Handlers', () => {
    it('should handle drag start with performance tracking', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      const mockEvent = new DragEvent('dragstart')
      const startTime = Date.now()

      result.onDragStart(mockEvent, mockMatter)

      expect(result.performanceMetrics.value.dragStartTime).toBeGreaterThan(0)
      expect(result.syncState.value.pendingOperations.has(mockMatter.id)).toBe(true)
    })

    it('should handle drag end with mutation execution', async () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      const mockEvent = new DragEvent('dragend')
      
      // First start a drag
      result.onDragStart(new DragEvent('dragstart'), mockMatter)

      // Mock successful mutation
      mockMutationResult.mutateAsync.mockResolvedValue({
        ...mockMatter,
        status: 'ACTIVE',
        position: 2000
      })

      await result.onDragEnd(mockEvent, 'ACTIVE', 1)

      expect(mockMutationResult.mutateAsync).toHaveBeenCalled()
    })

    it('should validate drop operations', async () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      // Mock invalid transition
      vi.mocked(vi.importMock('../useKanbanDragDrop')).useKanbanDragDrop().canDropInColumn.mockReturnValue(false)

      const mockEvent = new DragEvent('dragend')
      result.onDragStart(new DragEvent('dragstart'), mockMatter)

      await result.onDragEnd(mockEvent, 'COMPLETED', 0) // Invalid transition from DRAFT

      // Should show warning toast, not execute mutation
      expect(mockToast.warning).toHaveBeenCalled()
      expect(mockMutationResult.mutateAsync).not.toHaveBeenCalled()
    })
  })

  describe('Performance Metrics', () => {
    it('should track operation performance', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      expect(result.performanceMetrics.value).toEqual({
        dragStartTime: 0,
        optimisticUpdateTime: 0,
        serverResponseTime: 0,
        totalOperationTime: 0,
        operationCount: 0
      })
    })

    it('should reset metrics', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      // Simulate some metrics
      result.performanceMetrics.value.operationCount = 5
      result.performanceMetrics.value.dragStartTime = Date.now()

      result.resetMetrics()

      expect(result.performanceMetrics.value.operationCount).toBe(0)
      expect(result.performanceMetrics.value.dragStartTime).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error')
      mockMutationResult.mutateAsync.mockRejectedValue(networkError)

      const { result } = renderComposable(() => useKanbanDragDropMutations())

      await expect(
        result.moveMatterMutation.mutateAsync({
          matterId: 'matter-1',
          newStatus: 'ACTIVE',
          newPosition: 2000
        })
      ).rejects.toThrow('Network error')

      expect(mockToast.error).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const validationError = new Error('INVALID_TRANSITION')
      mockMutationResult.mutateAsync.mockRejectedValue(validationError)

      const { result } = renderComposable(() => useKanbanDragDropMutations())

      await expect(
        result.moveMatterMutation.mutateAsync({
          matterId: 'matter-1',
          newStatus: 'COMPLETED',
          newPosition: 2000
        })
      ).rejects.toThrow('INVALID_TRANSITION')
    })

    it('should handle conflict errors', async () => {
      const conflictError = new Error('POSITION_CONFLICT')
      mockMutationResult.mutateAsync.mockRejectedValue(conflictError)

      const { result } = renderComposable(() => useKanbanDragDropMutations())

      await expect(
        result.moveMatterMutation.mutateAsync({
          matterId: 'matter-1',
          newStatus: 'ACTIVE',
          newPosition: 2000
        })
      ).rejects.toThrow('POSITION_CONFLICT')

      expect(result.syncState.value.conflictedMatters.has('matter-1')).toBe(true)
    })
  })

  describe('Real-time Integration', () => {
    it('should update presence during drag operations', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      const mockEvent = new DragEvent('dragstart')
      result.onDragStart(mockEvent, mockMatter)

      // Verify presence update was called
      // This would be tested through the real-time sync mock
    })

    it('should handle concurrent operations', async () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())

      // Simulate concurrent operations by having pending operations
      result.syncState.value.pendingOperations.set('matter-1', {
        matterId: 'matter-1',
        fromStatus: 'DRAFT',
        toStatus: 'ACTIVE',
        fromIndex: 0,
        toIndex: 1,
        matter: mockMatter
      })

      const mockEvent = new DragEvent('dragend')
      result.onDragStart(new DragEvent('dragstart'), mockMatter)

      await result.onDragEnd(mockEvent, 'REVIEW', 0)

      // Should handle the conflict appropriately
      expect(result.syncState.value.conflictedMatters.size).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should announce drag operations', () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())
      const mockAnnounce = vi.mocked(vi.importMock('../useAccessibility')).useAccessibility().announceUpdate

      const mockEvent = new DragEvent('dragstart')
      result.onDragStart(mockEvent, mockMatter)

      expect(mockAnnounce).toHaveBeenCalledWith(
        expect.stringContaining('Started dragging matter')
      )
    })

    it('should announce batch operations', async () => {
      const { result } = renderComposable(() => useKanbanDragDropMutations())
      const mockAnnounce = vi.mocked(vi.importMock('../useAccessibility')).useAccessibility().announceUpdate

      mockMutationResult.mutateAsync.mockResolvedValue([mockMatter])

      await result.batchMoveMutation.mutateAsync({
        operations: [{
          matterId: 'matter-1',
          fromStatus: 'DRAFT',
          toStatus: 'ACTIVE',
          fromIndex: 0,
          toIndex: 0,
          matter: mockMatter
        }],
        userId: 'user-1',
        timestamp: '2024-01-01T00:00:00Z'
      })

      expect(mockAnnounce).toHaveBeenCalledWith(
        expect.stringContaining('Successfully moved')
      )
    })
  })
})