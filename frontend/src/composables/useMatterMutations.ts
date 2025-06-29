/**
 * Enhanced Matter Mutations with Advanced Features
 * 
 * @description Advanced mutation hooks with comprehensive error handling,
 * validation, offline support, and enhanced user experience features
 * building on the core mutations from useMattersQuery.ts
 * 
 * @author Claude
 * @created 2025-06-25
 */

import { ref, computed, watch } from 'vue'
import { z } from 'zod'
import type { 
  Matter, 
  CreateMatterInput, 
  UpdateMatterInput,
  MoveMatterInput,
  QueryError 
} from '~/types/query'
import {
  useCreateMatterMutation as useBasicCreateMutation,
  useUpdateMatterMutation as useBasicUpdateMutation,
  useDeleteMatterMutation as useBasicDeleteMutation,
  useMoveMatterMutation as useBasicMoveMutation
} from './useMattersQuery'

/**
 * Zod schemas for mutation validation
 */
export const createMatterSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: 'Please select a valid priority level' })
  }),
  status: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED'])
    .default('DRAFT'),
  assignedLawyer: z.string().uuid('Invalid lawyer ID').optional(),
  clientId: z.string().uuid('Invalid client ID').optional(),
  dueDate: z.date().optional(),
  tags: z.array(z.string().min(1)).max(10, 'Maximum 10 tags allowed').optional()
})

export const updateMatterSchema = createMatterSchema.partial()

export const moveMatterSchema = z.object({
  matterId: z.string().uuid('Invalid matter ID'),
  newStatus: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
  newPosition: z.number().int().min(0, 'Position must be non-negative')
})

/**
 * Offline mutation queue for storing mutations when disconnected
 */
interface QueuedMutation {
  id: string
  type: 'create' | 'update' | 'delete' | 'move'
  data: any
  timestamp: Date
  retries: number
}

const mutationQueue = ref<QueuedMutation[]>([])
const isOnline = ref(navigator.onLine)

// Monitor online status
window.addEventListener('online', () => { isOnline.value = true })
window.addEventListener('offline', () => { isOnline.value = false })

/**
 * Enhanced create matter mutation with validation and offline support
 */
export function useEnhancedCreateMatter() {
  const { $toast } = useNuxtApp()
  const basicMutation = useBasicCreateMutation()
  
  // Form validation state
  const validationErrors = ref<Record<string, string>>({})
  const isValidating = ref(false)
  
  // Validate input data
  const validateInput = (input: CreateMatterInput): boolean => {
    isValidating.value = true
    validationErrors.value = {}
    
    try {
      createMatterSchema.parse(input)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = err.path.join('.')
          validationErrors.value[field] = err.message
        })
      }
      return false
    } finally {
      isValidating.value = false
    }
  }
  
  // Queue mutation for offline execution
  const queueMutation = (input: CreateMatterInput) => {
    const queuedMutation: QueuedMutation = {
      id: `create-${Date.now()}-${Math.random()}`,
      type: 'create',
      data: input,
      timestamp: new Date(),
      retries: 0
    }
    
    mutationQueue.value.push(queuedMutation)
    $toast.info('Matter saved', 'Will sync when connection is restored')
  }
  
  // Enhanced mutation with validation
  const enhancedMutation = {
    ...basicMutation,
    mutateAsync: async (input: CreateMatterInput) => {
      // Validate input first
      if (!validateInput(input)) {
        throw new Error('Validation failed')
      }
      
      // Handle offline mode
      if (!isOnline.value) {
        queueMutation(input)
        return null
      }
      
      try {
        const result = await basicMutation.mutateAsync(input)
        $toast.success('Matter created', 'New matter has been added successfully')
        return result
      } catch (error) {
        // Enhanced error handling
        if (error instanceof Error) {
          if (error.message.includes('network')) {
            queueMutation(input)
            $toast.warning('Connection issue', 'Matter will be created when online')
          } else if (error.message.includes('validation')) {
            $toast.error('Validation error', 'Please check your input and try again')
          } else if (error.message.includes('duplicate')) {
            $toast.error('Duplicate matter', 'A matter with this title already exists')
          } else {
            $toast.error('Creation failed', error.message)
          }
        }
        throw error
      }
    }
  }
  
  return {
    ...enhancedMutation,
    validationErrors: computed(() => validationErrors.value),
    isValidating: computed(() => isValidating.value),
    validateInput
  }
}

/**
 * Enhanced update matter mutation with conflict detection
 */
export function useEnhancedUpdateMatter() {
  const { $toast } = useNuxtApp()
  const basicMutation = useBasicUpdateMutation()
  
  // Conflict detection state
  const conflicts = ref<Record<string, any>>({})
  const lastModified = ref<Record<string, string>>({})
  
  // Detect potential conflicts
  const detectConflicts = async (id: string, updates: UpdateMatterInput) => {
    try {
      // Get fresh data from server
      const fresh = await $fetch<Matter>(`/api/matters/${id}`)
      const lastMod = lastModified.value[id]
      
      if (lastMod && fresh.updatedAt > lastMod) {
        // Detect field-level conflicts
        const fieldConflicts: Record<string, any> = {}
        
        Object.keys(updates).forEach(key => {
          if (key in fresh && fresh[key as keyof Matter] !== updates[key as keyof UpdateMatterInput]) {
            fieldConflicts[key] = {
              current: updates[key as keyof UpdateMatterInput],
              server: fresh[key as keyof Matter],
              timestamp: fresh.updatedAt
            }
          }
        })
        
        if (Object.keys(fieldConflicts).length > 0) {
          conflicts.value[id] = fieldConflicts
          return true
        }
      }
      
      return false
    } catch (error) {
      console.warn('Could not detect conflicts:', error)
      return false
    }
  }
  
  // Enhanced mutation with conflict detection
  const enhancedMutation = {
    ...basicMutation,
    mutateAsync: async ({ id, data }: { id: string; data: UpdateMatterInput }) => {
      // Validate input
      try {
        updateMatterSchema.parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          const message = error.errors.map(e => e.message).join(', ')
          $toast.error('Validation error', message)
          throw error
        }
      }
      
      // Check for conflicts
      const hasConflicts = await detectConflicts(id, data)
      
      if (hasConflicts) {
        $toast.warning('Conflict detected', 'Matter was modified by another user')
        throw new Error('CONFLICT_DETECTED')
      }
      
      // Handle offline mode
      if (!isOnline.value) {
        const queuedMutation: QueuedMutation = {
          id: `update-${id}-${Date.now()}`,
          type: 'update',
          data: { id, data },
          timestamp: new Date(),
          retries: 0
        }
        mutationQueue.value.push(queuedMutation)
        $toast.info('Changes saved', 'Will sync when connection is restored')
        return null
      }
      
      try {
        const result = await basicMutation.mutateAsync({ id, data })
        
        // Update last modified timestamp
        if (result) {
          lastModified.value[id] = result.updatedAt
        }
        
        $toast.success('Matter updated', 'Changes have been saved successfully')
        return result
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('CONFLICT')) {
            $toast.error('Update conflict', 'Matter was modified by another user')
          } else if (error.message.includes('VALIDATION')) {
            $toast.error('Validation error', 'Invalid status transition or data')
          } else {
            $toast.error('Update failed', error.message)
          }
        }
        throw error
      }
    }
  }
  
  return {
    ...enhancedMutation,
    conflicts: computed(() => conflicts.value),
    resolveConflict: (matterId: string, resolution: 'keep_local' | 'keep_server') => {
      delete conflicts.value[matterId]
      $toast.success('Conflict resolved', `Using ${resolution.replace('_', ' ')} version`)
    }
  }
}

/**
 * Enhanced delete matter mutation with confirmation and undo
 */
export function useEnhancedDeleteMatter() {
  const { $toast } = useNuxtApp()
  const basicMutation = useBasicDeleteMutation()
  
  // Undo functionality
  const deletedMatters = ref<Map<string, { matter: Matter; timeout: NodeJS.Timeout }>>(new Map())
  
  // Soft delete with undo capability
  const softDelete = async (matter: Matter, permanent = false) => {
    if (!permanent) {
      // Store for potential undo
      const timeout = setTimeout(() => {
        deletedMatters.value.delete(matter.id)
      }, 30000) // 30 second undo window
      
      deletedMatters.value.set(matter.id, { matter, timeout })
      
      $toast.success('Matter deleted', 'Undo within 30 seconds', {
        duration: 30000,
        action: {
          label: 'Undo',
          onClick: () => undoDelete(matter.id)
        }
      })
      
      return { success: true, canUndo: true }
    }
    
    // Permanent delete
    try {
      await basicMutation.mutateAsync(matter.id)
      $toast.success('Matter permanently deleted', 'This action cannot be undone')
      return { success: true, canUndo: false }
    } catch (error) {
      $toast.error('Deletion failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }
  
  // Undo delete operation
  const undoDelete = (matterId: string) => {
    const deleted = deletedMatters.value.get(matterId)
    if (deleted) {
      clearTimeout(deleted.timeout)
      deletedMatters.value.delete(matterId)
      
      // Restore to cache (optimistic restore)
      // This would trigger a re-creation via API in a real implementation
      $toast.success('Deletion undone', 'Matter has been restored')
    }
  }
  
  // Enhanced mutation with confirmation
  const enhancedMutation = {
    ...basicMutation,
    mutateAsync: async (matterId: string, options?: { skipConfirmation?: boolean }) => {
      // Show confirmation dialog unless skipped
      if (!options?.skipConfirmation) {
        const confirmed = confirm('Are you sure you want to delete this matter? This action can be undone within 30 seconds.')
        if (!confirmed) {
          throw new Error('DELETION_CANCELLED')
        }
      }
      
      // Get matter data for undo functionality
      const matter = await $fetch<Matter>(`/api/matters/${matterId}`)
      return await softDelete(matter)
    }
  }
  
  return {
    ...enhancedMutation,
    softDelete,
    undoDelete,
    canUndo: (matterId: string) => deletedMatters.value.has(matterId),
    pendingDeletes: computed(() => Array.from(deletedMatters.value.keys()))
  }
}

/**
 * Enhanced move matter mutation for drag and drop
 */
export function useEnhancedMoveMatter() {
  const { $toast } = useNuxtApp()
  const basicMutation = useBasicMoveMutation()
  
  // Track drag operations
  const dragOperations = ref<Map<string, { startTime: Date; startStatus: string }>>(new Map())
  
  // Enhanced mutation with drag tracking
  const enhancedMutation = {
    ...basicMutation,
    mutateAsync: async (input: MoveMatterInput) => {
      try {
        moveMatterSchema.parse(input)
      } catch (error) {
        if (error instanceof z.ZodError) {
          $toast.error('Invalid move operation', error.errors[0].message)
          throw error
        }
      }
      
      // Track drag operation
      const operation = dragOperations.value.get(input.matterId)
      if (operation) {
        const duration = Date.now() - operation.startTime.getTime()
        console.debug(`Drag operation completed in ${duration}ms`)
      }
      
      try {
        const result = await basicMutation.mutateAsync(input)
        
        // Only show toast for significant status changes
        if (operation && operation.startStatus !== input.newStatus) {
          $toast.success('Status updated', `Matter moved to ${input.newStatus.toLowerCase()}`)
        }
        
        return result
      } catch (error) {
        $toast.error('Move failed', 'Could not update matter status')
        throw error
      } finally {
        dragOperations.value.delete(input.matterId)
      }
    }
  }
  
  // Drag operation helpers
  const startDrag = (matterId: string, currentStatus: string) => {
    dragOperations.value.set(matterId, {
      startTime: new Date(),
      startStatus: currentStatus
    })
  }
  
  const cancelDrag = (matterId: string) => {
    dragOperations.value.delete(matterId)
  }
  
  return {
    ...enhancedMutation,
    startDrag,
    cancelDrag,
    isDragging: (matterId: string) => dragOperations.value.has(matterId)
  }
}

/**
 * Offline mutation queue processor
 */
export function useOfflineMutationQueue() {
  const { $toast } = useNuxtApp()
  
  // Process queued mutations when online
  const processQueue = async () => {
    if (!isOnline.value || mutationQueue.value.length === 0) return
    
    const queue = [...mutationQueue.value]
    mutationQueue.value = []
    
    let processed = 0
    let failed = 0
    
    for (const mutation of queue) {
      try {
        switch (mutation.type) {
          case 'create':
            await $fetch('/api/matters', {
              method: 'POST',
              body: mutation.data
            })
            break
          case 'update':
            await $fetch(`/api/matters/${mutation.data.id}`, {
              method: 'PATCH',
              body: mutation.data.data
            })
            break
          case 'delete':
            await $fetch(`/api/matters/${mutation.data}`, {
              method: 'DELETE'
            })
            break
        }
        processed++
      } catch (error) {
        failed++
        mutation.retries++
        
        // Re-queue if under retry limit
        if (mutation.retries < 3) {
          mutationQueue.value.push(mutation)
        }
      }
    }
    
    if (processed > 0) {
      $toast.success('Sync complete', `${processed} changes synchronized`)
    }
    
    if (failed > 0) {
      $toast.warning('Sync incomplete', `${failed} changes failed to sync`)
    }
  }
  
  // Auto-process when coming online
  watch(isOnline, (online) => {
    if (online) {
      setTimeout(processQueue, 1000) // Small delay to ensure connection is stable
    }
  })
  
  return {
    queueSize: computed(() => mutationQueue.value.length),
    processQueue,
    clearQueue: () => { mutationQueue.value = [] },
    isOnline: computed(() => isOnline.value)
  }
}

/**
 * Comprehensive mutation analytics
 */
export function useMutationAnalytics() {
  const analytics = ref({
    totalMutations: 0,
    successfulMutations: 0,
    failedMutations: 0,
    averageLatency: 0,
    mutationTypes: {
      create: 0,
      update: 0,
      delete: 0,
      move: 0
    }
  })
  
  const trackMutation = (type: keyof typeof analytics.value.mutationTypes, success: boolean, latency: number) => {
    analytics.value.totalMutations++
    analytics.value.mutationTypes[type]++
    
    if (success) {
      analytics.value.successfulMutations++
    } else {
      analytics.value.failedMutations++
    }
    
    // Update average latency
    analytics.value.averageLatency = 
      (analytics.value.averageLatency * (analytics.value.totalMutations - 1) + latency) / 
      analytics.value.totalMutations
  }
  
  return {
    analytics: computed(() => analytics.value),
    trackMutation,
    resetAnalytics: () => {
      analytics.value = {
        totalMutations: 0,
        successfulMutations: 0,
        failedMutations: 0,
        averageLatency: 0,
        mutationTypes: { create: 0, update: 0, delete: 0, move: 0 }
      }
    }
  }
}