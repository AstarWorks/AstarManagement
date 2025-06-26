/**
 * Offline Mutation Queue Composable
 * 
 * @description Manages queued mutations when the application is offline.
 * Automatically syncs mutations when connection is restored, with retry logic
 * and conflict resolution for legal case management scenarios.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { ref, computed, watch } from 'vue'
import type { MutationKey, MutationOptions } from '@tanstack/vue-query'
import { useQueryClient, useMutation } from '@tanstack/vue-query'
import { useOnline } from '@vueuse/core'

/**
 * Queued mutation structure
 */
export interface QueuedMutation {
  id: string
  mutationKey: MutationKey
  mutationFn: (variables: any) => Promise<any>
  variables: any
  options?: MutationOptions<any, any, any>
  timestamp: number
  retryCount: number
  maxRetries: number
  status: 'pending' | 'syncing' | 'success' | 'failed'
  error?: Error
  conflictResolution?: 'client-wins' | 'server-wins' | 'merge'
}

/**
 * Mutation queue configuration
 */
export interface MutationQueueConfig {
  /** Maximum number of retries per mutation */
  maxRetries?: number
  /** Delay between retries in milliseconds */
  retryDelay?: number
  /** Maximum number of mutations to sync in parallel */
  maxConcurrent?: number
  /** Enable automatic sync when coming online */
  autoSync?: boolean
  /** Storage key for persisting queue */
  storageKey?: string
  /** Enable debug logging */
  debug?: boolean
  /** Callback when sync completes */
  onSyncComplete?: (results: SyncResult[]) => void
  /** Callback when sync fails */
  onSyncError?: (error: Error, mutation: QueuedMutation) => void
}

/**
 * Sync result for a single mutation
 */
export interface SyncResult {
  mutationId: string
  success: boolean
  data?: any
  error?: Error
  duration: number
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MutationQueueConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  maxConcurrent: 3,
  autoSync: true,
  storageKey: 'aster-offline-mutations',
  debug: process.env.NODE_ENV === 'development',
  onSyncComplete: () => {},
  onSyncError: () => {}
}

/**
 * Offline mutation queue composable
 */
export function useOfflineMutationQueue(userConfig: MutationQueueConfig = {}) {
  const config: Required<MutationQueueConfig> = {
    ...DEFAULT_CONFIG,
    ...userConfig
  }
  
  const queryClient = useQueryClient()
  const isOnline = useOnline()
  
  // Queue state
  const queue = ref<QueuedMutation[]>([])
  const isSyncing = ref(false)
  const syncProgress = ref({ current: 0, total: 0 })
  const lastSyncTime = ref<number | null>(null)
  const syncErrors = ref<Array<{ mutation: QueuedMutation; error: Error }>>([])
  
  // Computed state
  const pendingCount = computed(() => 
    queue.value.filter(m => m.status === 'pending').length
  )
  
  const failedCount = computed(() => 
    queue.value.filter(m => m.status === 'failed').length
  )
  
  const hasQueuedMutations = computed(() => queue.value.length > 0)
  
  const canSync = computed(() => 
    isOnline.value && !isSyncing.value && pendingCount.value > 0
  )
  
  /**
   * Load queue from storage
   */
  async function loadQueue(): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(config.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as QueuedMutation[]
        queue.value = parsed.map(m => ({
          ...m,
          // Restore functions from stored data
          mutationFn: () => Promise.reject(new Error('Function needs to be re-registered'))
        }))
        
        if (config.debug) {
          console.debug(`[MutationQueue] Loaded ${parsed.length} mutations from storage`)
        }
      }
    } catch (error) {
      console.error('[MutationQueue] Failed to load queue:', error)
    }
  }
  
  /**
   * Save queue to storage
   */
  async function saveQueue(): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      // Don't store function references
      const toStore = queue.value.map(m => ({
        ...m,
        mutationFn: undefined
      }))
      
      localStorage.setItem(config.storageKey, JSON.stringify(toStore))
    } catch (error) {
      console.error('[MutationQueue] Failed to save queue:', error)
    }
  }
  
  /**
   * Generate unique mutation ID
   */
  function generateMutationId(): string {
    return `mutation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Add mutation to queue
   */
  function queueMutation<TData = unknown, TError = unknown, TVariables = unknown>(
    mutationKey: MutationKey,
    mutationFn: (variables: TVariables) => Promise<TData>,
    variables: TVariables,
    options?: MutationOptions<TData, TError, TVariables>
  ): QueuedMutation {
    const mutation: QueuedMutation = {
      id: generateMutationId(),
      mutationKey,
      mutationFn: mutationFn as any,
      variables,
      options: options as any,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options?.retry === false ? 0 : config.maxRetries,
      status: 'pending',
      conflictResolution: 'server-wins'
    }
    
    queue.value.push(mutation)
    saveQueue()
    
    if (config.debug) {
      console.debug('[MutationQueue] Queued mutation:', {
        id: mutation.id,
        key: mutation.mutationKey,
        variables: mutation.variables
      })
    }
    
    // Try to sync immediately if online
    if (isOnline.value && config.autoSync) {
      syncQueue()
    }
    
    return mutation
  }
  
  /**
   * Remove mutation from queue
   */
  function removeMutation(mutationId: string): void {
    const index = queue.value.findIndex(m => m.id === mutationId)
    if (index !== -1) {
      queue.value.splice(index, 1)
      saveQueue()
      
      if (config.debug) {
        console.debug(`[MutationQueue] Removed mutation: ${mutationId}`)
      }
    }
  }
  
  /**
   * Retry a failed mutation
   */
  async function retryMutation(mutationId: string): Promise<void> {
    const mutation = queue.value.find(m => m.id === mutationId)
    if (!mutation || mutation.status === 'syncing') {
      return
    }
    
    mutation.status = 'pending'
    mutation.retryCount = 0
    await saveQueue()
    
    if (isOnline.value) {
      await syncQueue()
    }
  }
  
  /**
   * Clear all mutations from queue
   */
  function clearQueue(): void {
    queue.value = []
    syncErrors.value = []
    saveQueue()
    
    if (config.debug) {
      console.debug('[MutationQueue] Queue cleared')
    }
  }
  
  /**
   * Clear only failed mutations
   */
  function clearFailed(): void {
    queue.value = queue.value.filter(m => m.status !== 'failed')
    syncErrors.value = []
    saveQueue()
  }
  
  /**
   * Sync a single mutation
   */
  async function syncMutation(mutation: QueuedMutation): Promise<SyncResult> {
    const startTime = Date.now()
    
    try {
      mutation.status = 'syncing'
      
      // Execute the mutation
      const result = await mutation.mutationFn(mutation.variables)
      
      // Success - remove from queue
      mutation.status = 'success'
      removeMutation(mutation.id)
      
      // Invalidate related queries
      if (mutation.mutationKey) {
        await queryClient.invalidateQueries({ queryKey: mutation.mutationKey as any })
      }
      
      return {
        mutationId: mutation.id,
        success: true,
        data: result,
        duration: Date.now() - startTime
      }
      
    } catch (error) {
      mutation.retryCount++
      
      // Check if we should retry
      if (mutation.retryCount < mutation.maxRetries) {
        mutation.status = 'pending'
        
        if (config.debug) {
          console.debug(`[MutationQueue] Will retry mutation ${mutation.id} (attempt ${mutation.retryCount}/${mutation.maxRetries})`)
        }
      } else {
        mutation.status = 'failed'
        mutation.error = error as Error
        syncErrors.value.push({ mutation, error: error as Error })
        config.onSyncError(error as Error, mutation)
      }
      
      await saveQueue()
      
      return {
        mutationId: mutation.id,
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      }
    }
  }
  
  /**
   * Sync all pending mutations
   */
  async function syncQueue(): Promise<SyncResult[]> {
    if (!canSync.value) {
      return []
    }
    
    isSyncing.value = true
    syncErrors.value = []
    const results: SyncResult[] = []
    
    try {
      const pendingMutations = queue.value.filter(m => m.status === 'pending')
      syncProgress.value = { current: 0, total: pendingMutations.length }
      
      if (config.debug) {
        console.debug(`[MutationQueue] Starting sync of ${pendingMutations.length} mutations`)
      }
      
      // Process mutations in batches
      for (let i = 0; i < pendingMutations.length; i += config.maxConcurrent) {
        const batch = pendingMutations.slice(i, i + config.maxConcurrent)
        
        const batchResults = await Promise.all(
          batch.map(mutation => syncMutation(mutation))
        )
        
        results.push(...batchResults)
        syncProgress.value.current = Math.min(i + batch.length, pendingMutations.length)
        
        // Add delay between batches if configured
        if (i + config.maxConcurrent < pendingMutations.length && config.retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay))
        }
      }
      
      lastSyncTime.value = Date.now()
      config.onSyncComplete(results)
      
      if (config.debug) {
        const successful = results.filter(r => r.success).length
        console.debug(`[MutationQueue] Sync complete: ${successful}/${results.length} successful`)
      }
      
    } catch (error) {
      console.error('[MutationQueue] Sync failed:', error)
    } finally {
      isSyncing.value = false
      syncProgress.value = { current: 0, total: 0 }
    }
    
    return results
  }
  
  /**
   * Create a mutation hook that queues when offline
   */
  function createQueuedMutation<TData = unknown, TError = unknown, TVariables = unknown>(
    mutationKey: MutationKey,
    mutationFn: (variables: TVariables) => Promise<TData>,
    options?: MutationOptions<TData, TError, TVariables>
  ) {
    return useMutation({
      ...options,
      mutationKey,
      mutationFn: async (variables: TVariables) => {
        // If online, execute normally
        if (isOnline.value) {
          try {
            return await mutationFn(variables)
          } catch (error) {
            // If network error, queue it
            if (isNetworkError(error)) {
              queueMutation(mutationKey, mutationFn, variables, options)
              throw new Error('Mutation queued for offline sync')
            }
            throw error
          }
        }
        
        // If offline, queue it
        queueMutation(mutationKey, mutationFn, variables, options)
        throw new Error('Mutation queued for offline sync')
      }
    })
  }
  
  /**
   * Check if error is network-related
   */
  function isNetworkError(error: any): boolean {
    return error?.code === 'NETWORK_ERROR' || 
           error?.message?.includes('fetch failed') ||
           error?.message?.includes('NetworkError') ||
           !navigator.onLine
  }
  
  // Watch for online status changes
  watch(isOnline, (online) => {
    if (online && config.autoSync && pendingCount.value > 0) {
      if (config.debug) {
        console.debug('[MutationQueue] Coming online, starting auto-sync')
      }
      syncQueue()
    }
  })
  
  // Load queue on mount
  loadQueue()
  
  return {
    // State
    queue: computed(() => queue.value),
    isSyncing: computed(() => isSyncing.value),
    syncProgress: computed(() => syncProgress.value),
    pendingCount,
    failedCount,
    hasQueuedMutations,
    canSync,
    lastSyncTime: computed(() => lastSyncTime.value),
    syncErrors: computed(() => syncErrors.value),
    
    // Actions
    queueMutation,
    removeMutation,
    retryMutation,
    clearQueue,
    clearFailed,
    syncQueue,
    createQueuedMutation
  }
}

/**
 * Global offline mutation queue instance
 */
let globalQueue: ReturnType<typeof useOfflineMutationQueue> | null = null

/**
 * Get or create the global offline mutation queue
 */
export function useGlobalOfflineMutationQueue(config?: MutationQueueConfig) {
  if (!globalQueue) {
    globalQueue = useOfflineMutationQueue(config)
  }
  return globalQueue
}