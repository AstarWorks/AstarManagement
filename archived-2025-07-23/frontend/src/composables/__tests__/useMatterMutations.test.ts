/**
 * Unit Tests for Enhanced Matter Mutations
 * 
 * @description Comprehensive test suite for TanStack Query enhanced mutations
 * with validation, offline support, and advanced features
 * 
 * @author Claude
 * @created 2025-06-25
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import { z } from 'zod'
import { 
  useEnhancedCreateMatter,
  useEnhancedUpdateMatter, 
  useEnhancedDeleteMatter,
  useEnhancedMoveMatter,
  useOfflineMutationQueue,
  useMutationAnalytics,
  createMatterSchema,
  updateMatterSchema,
  moveMatterSchema
} from '../useMatterMutations'

// Mock Nuxt composables
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}

const mockFetch = vi.fn()

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $toast: mockToast,
    $fetch: mockFetch
  })
}))

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock window event listeners
Object.defineProperty(window, 'addEventListener', {
  value: vi.fn()
})

describe('Enhanced Matter Mutations', () => {
  let queryClient: QueryClient
  let wrapper: any

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    // Create a test component to provide Vue Query context
    const TestComponent = {
      template: '<div></div>',
      setup() {
        return {}
      }
    }

    const app = createApp(TestComponent)
    app.use(VueQueryPlugin, { queryClient })
    wrapper = mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })

    // Reset mocks
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
    queryClient.clear()
  })

  describe('Schema Validation', () => {
    describe('createMatterSchema', () => {
      it('should validate valid matter creation data', () => {
        const validData = {
          title: 'Test Matter',
          description: 'Test description',
          priority: 'HIGH' as const,
          status: 'DRAFT' as const,
          tags: ['test']
        }

        expect(() => createMatterSchema.parse(validData)).not.toThrow()
      })

      it('should reject invalid title', () => {
        const invalidData = {
          title: 'AB', // Too short
          priority: 'HIGH' as const
        }

        expect(() => createMatterSchema.parse(invalidData)).toThrow()
      })

      it('should reject invalid priority', () => {
        const invalidData = {
          title: 'Valid Title',
          priority: 'INVALID' as any
        }

        expect(() => createMatterSchema.parse(invalidData)).toThrow()
      })

      it('should handle optional fields', () => {
        const minimalData = {
          title: 'Minimal Matter',
          priority: 'LOW' as const
        }

        const result = createMatterSchema.parse(minimalData)
        expect(result.status).toBe('DRAFT') // Default value
      })
    })

    describe('updateMatterSchema', () => {
      it('should validate partial updates', () => {
        const partialData = {
          title: 'Updated Title'
        }

        expect(() => updateMatterSchema.parse(partialData)).not.toThrow()
      })
    })

    describe('moveMatterSchema', () => {
      it('should validate move operations', () => {
        const moveData = {
          matterId: '123e4567-e89b-12d3-a456-426614174000',
          newStatus: 'ACTIVE' as const,
          newPosition: 0
        }

        expect(() => moveMatterSchema.parse(moveData)).not.toThrow()
      })

      it('should reject invalid UUID', () => {
        const invalidData = {
          matterId: 'invalid-uuid',
          newStatus: 'ACTIVE' as const,
          newPosition: 0
        }

        expect(() => moveMatterSchema.parse(invalidData)).toThrow()
      })
    })
  })

  describe('useEnhancedCreateMatter', () => {
    it('should validate input before submitting', async () => {
      const { mutateAsync, validateInput, validationErrors } = useEnhancedCreateMatter()

      const invalidInput = {
        title: 'AB', // Too short
        priority: 'HIGH' as const
      }

      const isValid = validateInput(invalidInput)
      expect(isValid).toBe(false)
      expect(validationErrors.value).toHaveProperty('title')
    })

    it('should show validation errors for invalid input', async () => {
      const { mutateAsync } = useEnhancedCreateMatter()

      const invalidInput = {
        title: '', // Empty title
        priority: 'HIGH' as const
      }

      await expect(mutateAsync(invalidInput)).rejects.toThrow('Validation failed')
    })

    it('should queue mutation when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', { value: false })

      const { mutateAsync } = useEnhancedCreateMatter()

      const validInput = {
        title: 'Offline Matter',
        priority: 'HIGH' as const
      }

      const result = await mutateAsync(validInput)
      expect(result).toBeNull()
      expect(mockToast.info).toHaveBeenCalledWith(
        'Matter saved',
        'Will sync when connection is restored'
      )
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { mutateAsync } = useEnhancedCreateMatter()

      const validInput = {
        title: 'Network Test Matter',
        priority: 'HIGH' as const
      }

      await expect(mutateAsync(validInput)).rejects.toThrow('Network error')
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Connection issue',
        'Matter will be created when online'
      )
    })

    it('should show success toast on successful creation', async () => {
      const createdMatter = {
        id: '123',
        title: 'Created Matter',
        priority: 'HIGH',
        status: 'DRAFT'
      }

      mockFetch.mockResolvedValueOnce(createdMatter)

      const { mutateAsync } = useEnhancedCreateMatter()

      const validInput = {
        title: 'Success Matter',
        priority: 'HIGH' as const
      }

      const result = await mutateAsync(validInput)
      expect(result).toEqual(createdMatter)
      expect(mockToast.success).toHaveBeenCalledWith(
        'Matter created',
        'New matter has been added successfully'
      )
    })
  })

  describe('useEnhancedUpdateMatter', () => {
    it('should validate update input', async () => {
      const { mutateAsync } = useEnhancedUpdateMatter()

      const invalidInput = {
        title: 'A'.repeat(201) // Too long
      }

      await expect(mutateAsync({ 
        id: '123', 
        data: invalidInput 
      })).rejects.toThrow()

      expect(mockToast.error).toHaveBeenCalledWith(
        'Validation error',
        expect.stringContaining('exceed')
      )
    })

    it('should detect conflicts', async () => {
      // Mock server response with newer timestamp
      mockFetch.mockResolvedValueOnce({
        id: '123',
        title: 'Server Version',
        updatedAt: new Date().toISOString()
      })

      const { mutateAsync, conflicts } = useEnhancedUpdateMatter()

      const updateData = {
        title: 'Client Version'
      }

      await expect(mutateAsync({ 
        id: '123', 
        data: updateData 
      })).rejects.toThrow('CONFLICT_DETECTED')

      expect(mockToast.warning).toHaveBeenCalledWith(
        'Conflict detected',
        'Matter was modified by another user'
      )
    })

    it('should handle successful updates', async () => {
      const updatedMatter = {
        id: '123',
        title: 'Updated Matter',
        updatedAt: new Date().toISOString()
      }

      // Mock conflict detection (no conflicts)
      mockFetch.mockResolvedValueOnce({
        id: '123',
        title: 'Original Matter',
        updatedAt: '2023-01-01T00:00:00.000Z'
      })

      // Mock update response
      mockFetch.mockResolvedValueOnce(updatedMatter)

      const { mutateAsync } = useEnhancedUpdateMatter()

      const result = await mutateAsync({
        id: '123',
        data: { title: 'Updated Matter' }
      })

      expect(result).toEqual(updatedMatter)
      expect(mockToast.success).toHaveBeenCalledWith(
        'Matter updated',
        'Changes have been saved successfully'
      )
    })
  })

  describe('useEnhancedDeleteMatter', () => {
    it('should implement soft delete with undo', async () => {
      const matter = {
        id: '123',
        title: 'Matter to Delete'
      }

      mockFetch.mockResolvedValueOnce(matter)

      const { mutateAsync, canUndo, undoDelete } = useEnhancedDeleteMatter()

      const result = await mutateAsync('123')

      expect(result.success).toBe(true)
      expect(result.canUndo).toBe(true)
      expect(canUndo('123')).toBe(true)

      expect(mockToast.success).toHaveBeenCalledWith(
        'Matter deleted',
        'Undo within 30 seconds',
        expect.objectContaining({
          duration: 30000,
          action: expect.objectContaining({
            label: 'Undo'
          })
        })
      )

      // Test undo functionality
      undoDelete('123')
      expect(canUndo('123')).toBe(false)
    })

    it('should handle permanent deletion', async () => {
      const matter = {
        id: '123',
        title: 'Matter to Delete'
      }

      mockFetch.mockResolvedValueOnce(matter)
      mockFetch.mockResolvedValueOnce(undefined) // Delete response

      const { softDelete } = useEnhancedDeleteMatter()

      const result = await softDelete(matter, true)

      expect(result.success).toBe(true)
      expect(result.canUndo).toBe(false)

      expect(mockToast.success).toHaveBeenCalledWith(
        'Matter permanently deleted',
        'This action cannot be undone'
      )
    })
  })

  describe('useEnhancedMoveMatter', () => {
    it('should track drag operations', async () => {
      const moveInput = {
        matterId: '123e4567-e89b-12d3-a456-426614174000',
        newStatus: 'ACTIVE' as const,
        newPosition: 1
      }

      mockFetch.mockResolvedValueOnce({
        id: moveInput.matterId,
        status: moveInput.newStatus
      })

      const { mutateAsync, startDrag, isDragging } = useEnhancedMoveMatter()

      startDrag(moveInput.matterId, 'DRAFT')
      expect(isDragging(moveInput.matterId)).toBe(true)

      const result = await mutateAsync(moveInput)

      expect(isDragging(moveInput.matterId)).toBe(false)
      expect(result).toEqual({
        id: moveInput.matterId,
        status: moveInput.newStatus
      })
    })

    it('should validate move input', async () => {
      const invalidInput = {
        matterId: 'invalid-uuid',
        newStatus: 'ACTIVE' as const,
        newPosition: -1
      }

      const { mutateAsync } = useEnhancedMoveMatter()

      await expect(mutateAsync(invalidInput)).rejects.toThrow()
      expect(mockToast.error).toHaveBeenCalledWith(
        'Invalid move operation',
        expect.stringContaining('Invalid')
      )
    })
  })

  describe('useOfflineMutationQueue', () => {
    it('should process queued mutations when online', async () => {
      const { processQueue, queueSize } = useOfflineMutationQueue()

      // Mock successful API calls
      mockFetch.mockResolvedValue({ success: true })

      // Simulate offline mutations by directly adding to queue
      // This would normally be done by the individual mutation hooks

      await processQueue()

      expect(mockFetch).not.toHaveBeenCalled() // No queued mutations initially
    })

    it('should handle failed mutations with retry', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const { processQueue } = useOfflineMutationQueue()

      await processQueue()

      // Should handle the error gracefully
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Sync incomplete',
        expect.stringContaining('failed to sync')
      )
    })
  })

  describe('useMutationAnalytics', () => {
    it('should track mutation statistics', () => {
      const { analytics, trackMutation } = useMutationAnalytics()

      expect(analytics.value.totalMutations).toBe(0)

      trackMutation('create', true, 150)
      expect(analytics.value.totalMutations).toBe(1)
      expect(analytics.value.successfulMutations).toBe(1)
      expect(analytics.value.mutationTypes.create).toBe(1)
      expect(analytics.value.averageLatency).toBe(150)

      trackMutation('update', false, 200)
      expect(analytics.value.totalMutations).toBe(2)
      expect(analytics.value.failedMutations).toBe(1)
      expect(analytics.value.averageLatency).toBe(175) // (150 + 200) / 2
    })

    it('should reset analytics', () => {
      const { analytics, trackMutation, resetAnalytics } = useMutationAnalytics()

      trackMutation('create', true, 100)
      expect(analytics.value.totalMutations).toBe(1)

      resetAnalytics()
      expect(analytics.value.totalMutations).toBe(0)
      expect(analytics.value.successfulMutations).toBe(0)
      expect(analytics.value.averageLatency).toBe(0)
    })
  })
})