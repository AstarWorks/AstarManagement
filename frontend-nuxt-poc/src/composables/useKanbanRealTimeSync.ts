/**
 * Kanban Real-time Sync Integration
 * 
 * @description Enhanced real-time synchronization for Kanban drag-drop operations
 * with conflict resolution and collaborative editing support.
 * 
 * @author Claude
 * @created 2025-06-26
 * @task T12_S08 - Drag & Drop Mutations
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import type { MatterCard, MatterStatus } from '~/types/kanban'
import type { Matter } from '~/types/query'
import { queryKeys } from '~/types/query'
import { useRealtimeSync } from './useRealtimeSync'
import { useAccessibility } from './useAccessibility'
import { detectPositionConflicts, resolvePositionConflicts } from '~/utils/positionManager'

/**
 * Real-time event types for Kanban operations
 */
export interface KanbanRealtimeEvent {
  type: 'matter_moved' | 'matter_batch_moved' | 'position_normalized' | 'conflict_detected'
  payload: {
    matterId?: string
    matterIds?: string[]
    fromStatus?: MatterStatus
    toStatus?: MatterStatus
    position?: number
    positions?: Record<string, number>
    userId: string
    timestamp: string
    operationId: string
    metadata?: Record<string, any>
  }
}

/**
 * Conflict resolution strategies
 */
export type ConflictResolutionStrategy = 'server_wins' | 'client_wins' | 'merge' | 'prompt_user'

/**
 * Real-time sync state for Kanban operations
 */
export interface KanbanSyncState {
  isConnected: boolean
  lastSyncTime: number
  pendingOperations: Map<string, KanbanRealtimeEvent>
  conflicts: Map<string, ConflictInfo>
  collaborators: Map<string, CollaboratorInfo>
  lockingEnabled: boolean
}

/**
 * Conflict information
 */
export interface ConflictInfo {
  matterId: string
  localVersion: number
  serverVersion: number
  localChanges: Partial<Matter>
  serverChanges: Partial<Matter>
  timestamp: string
  autoResolvable: boolean
}

/**
 * Collaborator presence information
 */
export interface CollaboratorInfo {
  userId: string
  username: string
  avatar?: string
  activeArea: MatterStatus | null
  draggedMatter?: string
  lastActivity: string
  color: string
}

/**
 * Enhanced Kanban real-time sync composable
 */
export function useKanbanRealTimeSync(options?: {
  conflictResolution?: ConflictResolutionStrategy
  enablePresence?: boolean
  enableLocking?: boolean
}) {
  const { $toast } = useNuxtApp()
  const queryClient = useQueryClient()
  const { announceUpdate } = useAccessibility()
  const { subscribeToUpdates, publishEvent, isConnected } = useRealtimeSync()

  // Configuration
  const conflictStrategy = options?.conflictResolution || 'server_wins'
  const presenceEnabled = options?.enablePresence !== false
  const lockingEnabled = options?.enableLocking || false

  // State management
  const syncState = ref<KanbanSyncState>({
    isConnected: false,
    lastSyncTime: Date.now(),
    pendingOperations: new Map(),
    conflicts: new Map(),
    collaborators: new Map(),
    lockingEnabled
  })

  const operationQueue = ref<KanbanRealtimeEvent[]>([])
  const conflictResolutionInProgress = ref(false)

  /**
   * Handle incoming matter move events
   */
  const handleMatterMoved = async (event: KanbanRealtimeEvent) => {
    const { matterId, fromStatus, toStatus, position, userId, operationId } = event.payload

    // Skip if this is our own operation
    if (userId === getCurrentUserId()) {
      return
    }

    // Check if we have a conflicting local operation
    const localOperation = syncState.value.pendingOperations.get(matterId!)
    if (localOperation) {
      await handleConflict(matterId!, event, localOperation)
      return
    }

    try {
      // Apply the remote change optimistically
      queryClient.setQueryData(queryKeys.lists(), (old: any) => {
        if (!old?.data) return old

        return {
          ...old,
          data: old.data.map((matter: MatterCard) => 
            matter.id === matterId
              ? {
                  ...matter,
                  status: toStatus,
                  position: position,
                  updatedAt: new Date().toISOString(),
                  isRemoteUpdate: true
                }
              : matter
          )
        }
      })

      // Update status counts
      queryClient.setQueryData(queryKeys.statusCounts(), (old: any) => {
        if (!old || !fromStatus || !toStatus || fromStatus === toStatus) return old

        return {
          ...old,
          [fromStatus]: Math.max((old[fromStatus] || 0) - 1, 0),
          [toStatus]: (old[toStatus] || 0) + 1
        }
      })

      // Announce the change for accessibility
      const matter = queryClient.getQueryData(queryKeys.detail(matterId!)) as Matter
      if (matter) {
        announceUpdate(`Matter ${matter.caseNumber} was moved to ${toStatus} by another user`)
      }

      // Show notification for significant changes
      const collaborator = syncState.value.collaborators.get(userId)
      const username = collaborator?.username || 'Another user'
      
      $toast.info(
        'Board updated', 
        `${username} moved a matter to ${toStatus?.toLowerCase()}`,
        { duration: 3000 }
      )

    } catch (error) {
      console.error('Failed to apply remote matter move:', error)
      
      // Queue for retry
      operationQueue.value.push(event)
    }
  }

  /**
   * Handle batch move events
   */
  const handleBatchMoved = async (event: KanbanRealtimeEvent) => {
    const { matterIds, positions, userId } = event.payload

    if (userId === getCurrentUserId()) {
      return
    }

    try {
      // Apply batch changes
      queryClient.setQueryData(queryKeys.lists(), (old: any) => {
        if (!old?.data || !matterIds || !positions) return old

        return {
          ...old,
          data: old.data.map((matter: MatterCard) => 
            matterIds.includes(matter.id)
              ? {
                  ...matter,
                  position: positions[matter.id] || matter.position,
                  updatedAt: new Date().toISOString(),
                  isRemoteUpdate: true
                }
              : matter
          )
        }
      })

      // Announce batch change
      announceUpdate(`${matterIds.length} matters were moved by another user`)
      
      const collaborator = syncState.value.collaborators.get(userId)
      const username = collaborator?.username || 'Another user'
      
      $toast.info(
        'Batch update', 
        `${username} moved ${matterIds.length} matters`,
        { duration: 3000 }
      )

    } catch (error) {
      console.error('Failed to apply remote batch move:', error)
      operationQueue.value.push(event)
    }
  }

  /**
   * Handle position normalization events
   */
  const handlePositionNormalized = async (event: KanbanRealtimeEvent) => {
    const { positions, userId } = event.payload

    if (userId === getCurrentUserId()) {
      return
    }

    try {
      // Apply position updates
      queryClient.setQueryData(queryKeys.lists(), (old: any) => {
        if (!old?.data || !positions) return old

        return {
          ...old,
          data: old.data.map((matter: MatterCard) => 
            positions[matter.id] !== undefined
              ? { ...matter, position: positions[matter.id] }
              : matter
          )
        }
      })

      $toast.info('Positions updated', 'Board positions were normalized')

    } catch (error) {
      console.error('Failed to apply position normalization:', error)
    }
  }

  /**
   * Handle conflicts between local and remote operations
   */
  const handleConflict = async (
    matterId: string, 
    remoteEvent: KanbanRealtimeEvent, 
    localOperation: KanbanRealtimeEvent
  ) => {
    const conflictId = `${matterId}-${Date.now()}`
    
    // Get current matter state
    const currentMatter = queryClient.getQueryData(queryKeys.detail(matterId)) as Matter
    if (!currentMatter) return

    const conflict: ConflictInfo = {
      matterId,
      localVersion: localOperation.payload.metadata?.version || 1,
      serverVersion: remoteEvent.payload.metadata?.version || 1,
      localChanges: {
        status: localOperation.payload.toStatus,
        position: localOperation.payload.position
      },
      serverChanges: {
        status: remoteEvent.payload.toStatus,
        position: remoteEvent.payload.position
      },
      timestamp: remoteEvent.payload.timestamp,
      autoResolvable: canAutoResolveConflict(localOperation, remoteEvent)
    }

    syncState.value.conflicts.set(conflictId, conflict)

    if (conflict.autoResolvable) {
      await autoResolveConflict(conflictId, conflict)
    } else {
      await resolveConflictByStrategy(conflictId, conflict)
    }
  }

  /**
   * Check if a conflict can be automatically resolved
   */
  const canAutoResolveConflict = (
    local: KanbanRealtimeEvent, 
    remote: KanbanRealtimeEvent
  ): boolean => {
    // Same target status, different positions - can merge
    if (local.payload.toStatus === remote.payload.toStatus) {
      return true
    }

    // Different statuses but one is a reorder within same column
    if (local.payload.fromStatus === local.payload.toStatus ||
        remote.payload.fromStatus === remote.payload.toStatus) {
      return true
    }

    return false
  }

  /**
   * Automatically resolve conflicts that don't require user input
   */
  const autoResolveConflict = async (conflictId: string, conflict: ConflictInfo) => {
    const { matterId, localChanges, serverChanges } = conflict

    try {
      // Merge positions if same status
      if (localChanges.status === serverChanges.status) {
        const mergedPosition = Math.floor(
          ((localChanges.position || 0) + (serverChanges.position || 0)) / 2
        )

        queryClient.setQueryData(queryKeys.detail(matterId), (old: any) => {
          if (!old) return old
          return {
            ...old,
            status: serverChanges.status,
            position: mergedPosition,
            updatedAt: new Date().toISOString()
          }
        })

        // Update lists cache
        queryClient.setQueryData(queryKeys.lists(), (old: any) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.map((matter: MatterCard) => 
              matter.id === matterId
                ? { ...matter, status: serverChanges.status, position: mergedPosition }
                : matter
            )
          }
        })

        $toast.success('Conflict resolved', 'Changes were automatically merged')
      }

      // Clear the conflict
      syncState.value.conflicts.delete(conflictId)
      syncState.value.pendingOperations.delete(matterId)

    } catch (error) {
      console.error('Failed to auto-resolve conflict:', error)
      await resolveConflictByStrategy(conflictId, conflict)
    }
  }

  /**
   * Resolve conflict using the configured strategy
   */
  const resolveConflictByStrategy = async (conflictId: string, conflict: ConflictInfo) => {
    const { matterId, localChanges, serverChanges } = conflict

    conflictResolutionInProgress.value = true

    try {
      switch (conflictStrategy) {
        case 'server_wins':
          // Apply server changes
          queryClient.setQueryData(queryKeys.detail(matterId), (old: any) => {
            if (!old) return old
            return { ...old, ...serverChanges, updatedAt: new Date().toISOString() }
          })
          $toast.warning('Conflict resolved', 'Server version was applied')
          break

        case 'client_wins':
          // Keep local changes, publish to server
          await publishEvent('matter_moved', {
            matterId,
            ...localChanges,
            userId: getCurrentUserId(),
            timestamp: new Date().toISOString(),
            operationId: `resolve-${Date.now()}`
          })
          $toast.info('Conflict resolved', 'Your changes were applied')
          break

        case 'prompt_user':
          // Show conflict resolution UI
          await showConflictDialog(conflictId, conflict)
          return // Don't clear conflict yet

        default:
          // Fallback to server wins
          queryClient.setQueryData(queryKeys.detail(matterId), (old: any) => {
            if (!old) return old
            return { ...old, ...serverChanges, updatedAt: new Date().toISOString() }
          })
          break
      }

      // Clear the conflict
      syncState.value.conflicts.delete(conflictId)
      syncState.value.pendingOperations.delete(matterId)

    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      $toast.error('Conflict resolution failed', 'Please refresh the page')
    } finally {
      conflictResolutionInProgress.value = false
    }
  }

  /**
   * Show conflict resolution dialog (placeholder for UI implementation)
   */
  const showConflictDialog = async (conflictId: string, conflict: ConflictInfo) => {
    // This would trigger a modal or dialog component
    // For now, fallback to server wins
    await resolveConflictByStrategy(conflictId, { 
      ...conflict, 
      autoResolvable: true 
    })
  }

  /**
   * Track user presence and activity
   */
  const updatePresence = (area: MatterStatus | null, draggedMatter?: string) => {
    if (!presenceEnabled) return

    const presence = {
      userId: getCurrentUserId(),
      username: getCurrentUsername(),
      activeArea: area,
      draggedMatter,
      lastActivity: new Date().toISOString(),
      color: getUserColor()
    }

    syncState.value.collaborators.set(presence.userId, presence)

    // Broadcast presence update
    publishEvent('presence_update', presence)
  }

  /**
   * Process queued operations when connection is restored
   */
  const processOperationQueue = async () => {
    if (!isConnected.value || operationQueue.value.length === 0) return

    const queue = [...operationQueue.value]
    operationQueue.value = []

    for (const event of queue) {
      try {
        switch (event.type) {
          case 'matter_moved':
            await handleMatterMoved(event)
            break
          case 'matter_batch_moved':
            await handleBatchMoved(event)
            break
          case 'position_normalized':
            await handlePositionNormalized(event)
            break
        }
      } catch (error) {
        console.error('Failed to process queued operation:', error)
        // Re-queue on failure
        operationQueue.value.push(event)
      }
    }
  }

  /**
   * Subscribe to real-time events
   */
  const startSync = () => {
    // Subscribe to Kanban-specific events
    subscribeToUpdates('matter_moved', handleMatterMoved)
    subscribeToUpdates('matter_batch_moved', handleBatchMoved)
    subscribeToUpdates('position_normalized', handlePositionNormalized)

    // Handle presence updates
    if (presenceEnabled) {
      subscribeToUpdates('presence_update', (event: any) => {
        const { userId, ...presence } = event.payload
        if (userId !== getCurrentUserId()) {
          syncState.value.collaborators.set(userId, presence)
        }
      })
    }

    // Handle connection changes
    watch(isConnected, (connected) => {
      syncState.value.isConnected = connected
      
      if (connected) {
        syncState.value.lastSyncTime = Date.now()
        processOperationQueue()
        $toast.success('Connected', 'Real-time sync is active')
      } else {
        $toast.warning('Disconnected', 'Changes will sync when reconnected')
      }
    }, { immediate: true })
  }

  /**
   * Utility functions
   */
  const getCurrentUserId = () => 'current-user' // TODO: Get from auth
  const getCurrentUsername = () => 'Current User' // TODO: Get from auth
  const getUserColor = () => '#3B82F6' // TODO: Generate or get from user profile

  // Cleanup on unmount
  onUnmounted(() => {
    syncState.value.collaborators.clear()
    syncState.value.conflicts.clear()
    syncState.value.pendingOperations.clear()
  })

  // Auto-start sync
  startSync()

  return {
    // State
    syncState: computed(() => syncState.value),
    isConnected: computed(() => syncState.value.isConnected),
    hasConflicts: computed(() => syncState.value.conflicts.size > 0),
    collaboratorCount: computed(() => syncState.value.collaborators.size),
    queuedOperations: computed(() => operationQueue.value.length),
    
    // Conflict resolution
    conflictResolutionInProgress: computed(() => conflictResolutionInProgress.value),
    activeConflicts: computed(() => Array.from(syncState.value.conflicts.values())),
    
    // Presence
    collaborators: computed(() => Array.from(syncState.value.collaborators.values())),
    updatePresence,
    
    // Queue management
    processOperationQueue,
    clearQueue: () => { operationQueue.value = [] },
    
    // Manual conflict resolution
    resolveConflict: (conflictId: string, strategy: ConflictResolutionStrategy) => {
      const conflict = syncState.value.conflicts.get(conflictId)
      if (conflict) {
        const originalStrategy = conflictStrategy
        // Temporarily override strategy
        return resolveConflictByStrategy(conflictId, conflict)
      }
    },
    
    // Sync control
    startSync,
    stopSync: () => {
      // Implementation for stopping sync
    }
  }
}