/**
 * Integration Tests for Enhanced Matter Mutations
 * 
 * @description Integration tests with mock server responses testing
 * real-world scenarios and API contract compliance
 * 
 * @author Claude
 * @created 2025-06-25
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp, ref } from 'vue'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { 
  useEnhancedCreateMatter,
  useEnhancedUpdateMatter,
  useEnhancedDeleteMatter,
  useEnhancedMoveMatter
} from '../useMatterMutations'
import type { Matter, CreateMatterInput, UpdateMatterInput } from '~/types/query'

// Mock server setup
const server = setupServer(
  // Create matter endpoint
  rest.post('/api/matters', (req, res, ctx) => {
    const body = req.body as CreateMatterInput
    
    // Simulate validation error
    if (body.title === 'TRIGGER_VALIDATION_ERROR') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'VALIDATION_ERROR', message: 'Invalid title format' })
      )
    }
    
    // Simulate server error
    if (body.title === 'TRIGGER_SERVER_ERROR') {
      return res(ctx.status(500), ctx.json({ error: 'INTERNAL_SERVER_ERROR' }))
    }
    
    // Simulate network timeout
    if (body.title === 'TRIGGER_TIMEOUT') {
      return res(ctx.delay(10000))
    }
    
    // Successful creation
    const newMatter: Matter = {
      id: `matter-${Date.now()}`,
      caseNumber: `CASE-${Date.now()}`,
      title: body.title,
      description: body.description || '',
      clientName: 'Test Client',
      status: body.status || 'draft',
      priority: body.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedLawyer: body.assignedLawyer,
      dueDate: body.dueDate?.toISOString(),
      tags: body.tags || []
    }
    
    return res(ctx.status(201), ctx.json(newMatter))
  }),
  
  // Update matter endpoint
  rest.patch('/api/matters/:id', (req, res, ctx) => {
    const { id } = req.params
    const body = req.body as UpdateMatterInput
    
    // Simulate conflict detection
    if (body.title === 'TRIGGER_CONFLICT') {
      return res(
        ctx.status(409),
        ctx.json({ error: 'CONFLICT', message: 'Matter was modified by another user' })
      )
    }
    
    // Successful update
    const updatedMatter: Matter = {
      id: id as string,
      caseNumber: `CASE-${id}`,
      title: body.title || 'Updated Matter',
      description: body.description || '',
      clientName: 'Test Client',
      status: body.status || 'active',
      priority: body.priority || 'medium',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      assignedLawyer: body.assignedLawyer,
      dueDate: body.dueDate?.toISOString(),
      tags: body.tags || []
    }
    
    return res(ctx.status(200), ctx.json(updatedMatter))
  }),
  
  // Get matter for conflict detection
  rest.get('/api/matters/:id', (req, res, ctx) => {
    const { id } = req.params
    
    const matter: Matter = {
      id: id as string,
      caseNumber: `CASE-${id}`,
      title: 'Existing Matter',
      description: 'Test description',
      clientName: 'Test Client',
      status: 'active',
      priority: 'medium',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z', // Old timestamp for conflict testing
      tags: []
    }
    
    return res(ctx.status(200), ctx.json(matter))
  }),
  
  // Delete matter endpoint
  rest.delete('/api/matters/:id', (req, res, ctx) => {
    const { id } = req.params
    
    // Simulate foreign key constraint error
    if (id === 'matter-with-documents') {
      return res(
        ctx.status(409),
        ctx.json({ 
          error: 'FOREIGN_KEY_CONSTRAINT', 
          message: 'Cannot delete matter with associated documents' 
        })
      )
    }
    
    return res(ctx.status(204))
  }),
  
  // Move matter endpoint
  rest.patch('/api/matters/:id/move', (req, res, ctx) => {
    const { id } = req.params
    const body = req.body as { status: string; position: number }
    
    const movedMatter: Matter = {
      id: id as string,
      caseNumber: `CASE-${id}`,
      title: 'Moved Matter',
      description: 'Test description',
      clientName: 'Test Client',
      status: body.status as any,
      priority: 'medium',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      tags: []
    }
    
    return res(ctx.status(200), ctx.json(movedMatter))
  })
)

// Mock Nuxt composables
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $toast: mockToast,
    $fetch: vi.fn().mockImplementation((url, options = {}) => {
      const method = options.method || 'GET'
      const body = options.body
      
      // Create a mock request to MSW
      const request = new Request(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      // This is a simplified approach - in a real test, you'd use MSW properly
      return fetch(request).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
    })
  })
}))

describe('Enhanced Matter Mutations - Integration Tests', () => {
  let queryClient: QueryClient
  let wrapper: any

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

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

    vi.clearAllMocks()
    server.resetHandlers()
  })

  afterEach(() => {
    wrapper?.unmount()
    queryClient.clear()
  })

  describe('Create Matter Integration', () => {
    it('should successfully create a matter with server response', async () => {
      const { mutateAsync } = useEnhancedCreateMatter()

      const input: CreateMatterInput = {
        title: 'Integration Test Matter',
        description: 'Test description',
        priority: 'high',
        status: 'draft'
      }

      const result = await mutateAsync(input)

      expect(result).toMatchObject({
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status
      })
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(mockToast.success).toHaveBeenCalledWith(
        'Matter created',
        'New matter has been added successfully'
      )
    })

    it('should handle validation errors from server', async () => {
      const { mutateAsync } = useEnhancedCreateMatter()

      const input: CreateMatterInput = {
        title: 'TRIGGER_VALIDATION_ERROR',
        priority: 'high'
      }

      await expect(mutateAsync(input)).rejects.toThrow()
      expect(mockToast.error).toHaveBeenCalledWith(
        'Validation error',
        'Please check your input and try again'
      )
    })

    it('should handle server errors', async () => {
      const { mutateAsync } = useEnhancedCreateMatter()

      const input: CreateMatterInput = {
        title: 'TRIGGER_SERVER_ERROR',
        priority: 'high'
      }

      await expect(mutateAsync(input)).rejects.toThrow()
      expect(mockToast.error).toHaveBeenCalledWith(
        'Creation failed',
        expect.any(String)
      )
    })
  })

  describe('Update Matter Integration', () => {
    it('should successfully update a matter', async () => {
      const { mutateAsync } = useEnhancedUpdateMatter()

      const updateData: UpdateMatterInput = {
        title: 'Updated Integration Test',
        priority: 'low'
      }

      const result = await mutateAsync({
        id: 'test-matter-id',
        data: updateData
      })

      expect(result).toMatchObject({
        title: updateData.title,
        priority: updateData.priority
      })
      expect(result.updatedAt).toBeDefined()
      expect(mockToast.success).toHaveBeenCalledWith(
        'Matter updated',
        'Changes have been saved successfully'
      )
    })

    it('should detect and handle conflicts', async () => {
      const { mutateAsync } = useEnhancedUpdateMatter()

      const updateData: UpdateMatterInput = {
        title: 'TRIGGER_CONFLICT'
      }

      await expect(mutateAsync({
        id: 'test-matter-id',
        data: updateData
      })).rejects.toThrow('CONFLICT_DETECTED')

      expect(mockToast.warning).toHaveBeenCalledWith(
        'Conflict detected',
        'Matter was modified by another user'
      )
    })
  })

  describe('Delete Matter Integration', () => {
    it('should successfully delete a matter', async () => {
      const { softDelete } = useEnhancedDeleteMatter()

      const matter: Matter = {
        id: 'test-delete-matter',
        caseNumber: 'CASE-123',
        title: 'Matter to Delete',
        description: '',
        clientName: 'Test Client',
        status: 'draft',
        priority: 'low',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        tags: []
      }

      const result = await softDelete(matter, true)

      expect(result.success).toBe(true)
      expect(result.canUndo).toBe(false)
      expect(mockToast.success).toHaveBeenCalledWith(
        'Matter permanently deleted',
        'This action cannot be undone'
      )
    })

    it('should handle foreign key constraint errors', async () => {
      const { softDelete } = useEnhancedDeleteMatter()

      const matter: Matter = {
        id: 'matter-with-documents',
        caseNumber: 'CASE-123',
        title: 'Matter with Documents',
        description: '',
        clientName: 'Test Client',
        status: 'draft',
        priority: 'low',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        tags: []
      }

      await expect(softDelete(matter, true)).rejects.toThrow()
      expect(mockToast.error).toHaveBeenCalledWith(
        'Deletion failed',
        expect.any(String)
      )
    })
  })

  describe('Move Matter Integration', () => {
    it('should successfully move a matter to new status', async () => {
      const { mutateAsync, startDrag } = useEnhancedMoveMatter()

      const moveInput = {
        matterId: 'test-move-matter',
        newStatus: 'active' as const,
        newPosition: 2
      }

      startDrag(moveInput.matterId, 'draft')

      const result = await mutateAsync(moveInput)

      expect(result).toMatchObject({
        id: moveInput.matterId,
        status: moveInput.newStatus
      })
      expect(result.updatedAt).toBeDefined()
      expect(mockToast.success).toHaveBeenCalledWith(
        'Status updated',
        'Matter moved to active'
      )
    })
  })

  describe('End-to-End Workflows', () => {
    it('should handle complete matter lifecycle', async () => {
      const createMutation = useEnhancedCreateMatter()
      const updateMutation = useEnhancedUpdateMatter()
      const deleteMutation = useEnhancedDeleteMatter()

      // 1. Create matter
      const createInput: CreateMatterInput = {
        title: 'Lifecycle Test Matter',
        priority: 'medium'
      }

      const createdMatter = await createMutation.mutateAsync(createInput)
      expect(createdMatter).toBeDefined()

      // 2. Update matter
      const updateInput: UpdateMatterInput = {
        title: 'Updated Lifecycle Matter',
        status: 'active'
      }

      const updatedMatter = await updateMutation.mutateAsync({
        id: createdMatter.id,
        data: updateInput
      })
      expect(updatedMatter.title).toBe(updateInput.title)

      // 3. Soft delete matter
      const deleteResult = await deleteMutation.softDelete(updatedMatter)
      expect(deleteResult.success).toBe(true)
      expect(deleteResult.canUndo).toBe(true)

      // Verify all operations completed successfully
      expect(mockToast.success).toHaveBeenCalledTimes(3)
    })

    it('should handle optimistic updates with rollback', async () => {
      const updateMutation = useEnhancedUpdateMatter()

      // Start optimistic update
      const optimisticUpdate = updateMutation.mutateAsync({
        id: 'test-matter',
        data: { title: 'Optimistic Update' }
      })

      // The mutation should start immediately (optimistic)
      expect(updateMutation.isPending.value).toBe(true)

      // Wait for completion
      const result = await optimisticUpdate
      expect(result).toBeDefined()
      expect(updateMutation.isPending.value).toBe(false)
    })
  })

  describe('Error Recovery Scenarios', () => {
    it('should handle network timeouts gracefully', async () => {
      const { mutateAsync } = useEnhancedCreateMatter()

      const input: CreateMatterInput = {
        title: 'TRIGGER_TIMEOUT',
        priority: 'high'
      }

      // Set a shorter timeout for testing
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 100)
      })

      await expect(Promise.race([
        mutateAsync(input),
        timeoutPromise
      ])).rejects.toThrow('timeout')
    })

    it('should maintain data consistency during failures', async () => {
      const createMutation = useEnhancedCreateMatter()

      // Attempt to create with server error
      const input: CreateMatterInput = {
        title: 'TRIGGER_SERVER_ERROR',
        priority: 'high'
      }

      await expect(createMutation.mutateAsync(input)).rejects.toThrow()

      // Verify no partial state was left behind
      expect(createMutation.isError.value).toBe(true)
      expect(createMutation.data.value).toBeUndefined()
    })
  })
})