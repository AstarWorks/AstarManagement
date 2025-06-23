import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { Matter, MatterStatus, MatterPriority } from '~/types/kanban'

export interface MatterState {
  matters: Matter[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  pendingOperations: Set<string>
  optimisticUpdates: Map<string, Matter>
}

export interface ConflictResolution {
  strategy: 'server-wins' | 'client-wins' | 'merge' | 'user-prompt'
  preserveLocalChanges: boolean
}

export const useMatterStore = defineStore('kanban-matters', () => {
  // State
  const matters = ref<Matter[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  const pendingOperations = ref(new Set<string>())
  const optimisticUpdates = ref(new Map<string, Matter>())
  
  // Optimistic update helper
  const performOptimisticUpdate = async <T>(
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    rollback: () => void,
    operationId?: string
  ): Promise<T> => {
    if (operationId) {
      pendingOperations.value.add(operationId)
    }
    
    // Apply optimistic update immediately
    optimisticUpdate()
    
    try {
      const result = await operation()
      
      // Clear any temporary optimistic state on success
      if (operationId) {
        optimisticUpdates.value.delete(operationId)
      }
      
      return result
    } catch (err) {
      // Rollback optimistic changes on failure
      rollback()
      
      if (operationId) {
        optimisticUpdates.value.delete(operationId)
      }
      
      throw err
    } finally {
      if (operationId) {
        pendingOperations.value.delete(operationId)
      }
    }
  }

  // CRUD Operations
  const loadMatters = async (force = false) => {
    if (isLoading.value && !force) return
    
    isLoading.value = true
    error.value = null
    
    try {
      // TODO: Replace with actual API call
      // const response = await $fetch<Matter[]>('/api/matters')
      // matters.value = response
      
      // For now, load demo data
      matters.value = generateDemoMatters()
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load matters'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createMatter = async (matterData: Omit<Matter, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tempId = `temp-${Date.now()}`
    const newMatter: Matter = {
      ...matterData,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return performOptimisticUpdate(
      async () => {
        // TODO: API call to create matter
        // const response = await $fetch<Matter>('/api/matters', {
        //   method: 'POST',
        //   body: matterData
        // })
        
        // Simulate API response
        const createdMatter = {
          ...newMatter,
          id: `matter-${Date.now()}` // Replace temp ID with real ID
        }
        
        // Update the matter with real ID
        const index = matters.value.findIndex(m => m.id === tempId)
        if (index !== -1) {
          matters.value[index] = createdMatter
        }
        
        return createdMatter
      },
      () => {
        // Optimistic: Add matter immediately
        matters.value.push(newMatter)
        optimisticUpdates.value.set(tempId, newMatter)
      },
      () => {
        // Rollback: Remove the optimistically added matter
        const index = matters.value.findIndex(m => m.id === tempId)
        if (index !== -1) {
          matters.value.splice(index, 1)
        }
      },
      tempId
    )
  }

  const updateMatter = async (id: string, updates: Partial<Matter>) => {
    const index = matters.value.findIndex(m => m.id === id)
    if (index === -1) {
      throw new Error(`Matter with id ${id} not found`)
    }

    const originalMatter = { ...matters.value[index] }
    const updatedMatter = {
      ...originalMatter,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return performOptimisticUpdate(
      async () => {
        // TODO: API call to update matter
        // const response = await $fetch<Matter>(`/api/matters/${id}`, {
        //   method: 'PATCH',
        //   body: updates
        // })
        // return response
        
        // Simulate API response
        await new Promise(resolve => setTimeout(resolve, 300))
        return updatedMatter
      },
      () => {
        // Optimistic: Update matter immediately
        matters.value[index] = updatedMatter
        optimisticUpdates.value.set(id, updatedMatter)
      },
      () => {
        // Rollback: Restore original matter
        matters.value[index] = originalMatter
      },
      id
    )
  }

  const deleteMatter = async (id: string) => {
    const index = matters.value.findIndex(m => m.id === id)
    if (index === -1) {
      throw new Error(`Matter with id ${id} not found`)
    }

    const deletedMatter = { ...matters.value[index] }

    return performOptimisticUpdate(
      async () => {
        // TODO: API call to delete matter
        // await $fetch(`/api/matters/${id}`, { method: 'DELETE' })
        
        // Simulate API response
        await new Promise(resolve => setTimeout(resolve, 200))
        return true
      },
      () => {
        // Optimistic: Remove matter immediately
        matters.value.splice(index, 1)
      },
      () => {
        // Rollback: Restore deleted matter
        matters.value.splice(index, 0, deletedMatter)
      },
      id
    )
  }

  const moveMatter = async (matterId: string, newStatus: MatterStatus, newIndex?: number) => {
    const matter = matters.value.find(m => m.id === matterId)
    if (!matter) {
      throw new Error(`Matter with id ${matterId} not found`)
    }

    const originalStatus = matter.status
    const originalIndex = matters.value.indexOf(matter)

    return updateMatter(matterId, {
      status: newStatus,
      statusUpdatedAt: new Date().toISOString(),
      ...(newIndex !== undefined && { sortOrder: newIndex })
    })
  }

  const batchUpdateMatters = async (updates: Array<{ id: string; data: Partial<Matter> }>) => {
    const originalMatters = new Map(matters.value.map(m => [m.id, { ...m }]))
    const batchId = `batch-${Date.now()}`

    return performOptimisticUpdate(
      async () => {
        // TODO: API call for batch update
        // const response = await $fetch('/api/matters/batch', {
        //   method: 'PATCH',
        //   body: { updates }
        // })
        
        // Simulate batch API response
        await new Promise(resolve => setTimeout(resolve, 500))
        return updates.map(update => ({
          ...originalMatters.get(update.id)!,
          ...update.data,
          updatedAt: new Date().toISOString()
        }))
      },
      () => {
        // Optimistic: Apply all updates immediately
        updates.forEach(({ id, data }) => {
          const index = matters.value.findIndex(m => m.id === id)
          if (index !== -1) {
            matters.value[index] = {
              ...matters.value[index],
              ...data,
              updatedAt: new Date().toISOString()
            }
          }
        })
      },
      () => {
        // Rollback: Restore all original matters
        updates.forEach(({ id }) => {
          const index = matters.value.findIndex(m => m.id === id)
          const original = originalMatters.get(id)
          if (index !== -1 && original) {
            matters.value[index] = original
          }
        })
      },
      batchId
    )
  }

  // Card operations for compatibility with real-time updates
  const cards = computed(() => matters.value)
  
  const addCard = async (card: Matter) => {
    // If card already exists, update it
    const existingIndex = matters.value.findIndex(m => m.id === card.id)
    if (existingIndex !== -1) {
      matters.value[existingIndex] = card
    } else {
      matters.value.push(card)
    }
  }
  
  const updateCard = async (cardId: string, updates: Partial<Matter>) => {
    const index = matters.value.findIndex(m => m.id === cardId)
    if (index !== -1) {
      matters.value[index] = {
        ...matters.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }
  
  const removeCard = async (cardId: string) => {
    const index = matters.value.findIndex(m => m.id === cardId)
    if (index !== -1) {
      matters.value.splice(index, 1)
    }
  }
  
  const moveCard = async (cardId: string, fromColumn: string, toColumn: string, newIndex?: number) => {
    const matter = matters.value.find(m => m.id === cardId)
    if (matter) {
      matter.status = toColumn as MatterStatus
      matter.updatedAt = new Date().toISOString()
      if (newIndex !== undefined) {
        matter.sortOrder = newIndex
      }
    }
  }

  // Conflict Resolution
  const handleConflictResolution = (
    localMatters: Matter[],
    serverMatters: Matter[],
    lastSyncTime: Date | null,
    resolution: ConflictResolution = { strategy: 'server-wins', preserveLocalChanges: true }
  ) => {
    const conflicts: Array<{ local: Matter; server: Matter; type: 'update' | 'delete' }> = []
    
    // Detect conflicts
    const serverMap = new Map(serverMatters.map(m => [m.id, m]))
    const localMap = new Map(localMatters.map(m => [m.id, m]))
    
    localMatters.forEach(localMatter => {
      const serverMatter = serverMap.get(localMatter.id)
      
      if (!serverMatter) {
        // Matter was deleted on server
        conflicts.push({ local: localMatter, server: serverMatter!, type: 'delete' })
      } else if (
        lastSyncTime && 
        new Date(localMatter.updatedAt) > lastSyncTime &&
        new Date(serverMatter.updatedAt) > lastSyncTime
      ) {
        // Both local and server have updates since last sync
        conflicts.push({ local: localMatter, server: serverMatter, type: 'update' })
      }
    })
    
    // Apply resolution strategy
    switch (resolution.strategy) {
      case 'server-wins':
        matters.value = serverMatters
        break
        
      case 'client-wins':
        // Keep local changes, but merge any new server matters
        const localIds = new Set(localMatters.map(m => m.id))
        const newServerMatters = serverMatters.filter(m => !localIds.has(m.id))
        matters.value = [...localMatters, ...newServerMatters]
        break
        
      case 'merge':
        // Attempt to merge conflicts intelligently
        const mergedMatters = new Map<string, Matter>()
        
        // Start with server state
        serverMatters.forEach(matter => mergedMatters.set(matter.id, matter))
        
        // Apply local changes that don't conflict
        localMatters.forEach(localMatter => {
          const serverMatter = serverMap.get(localMatter.id)
          if (!serverMatter || new Date(localMatter.updatedAt) > new Date(serverMatter.updatedAt)) {
            mergedMatters.set(localMatter.id, localMatter)
          }
        })
        
        matters.value = Array.from(mergedMatters.values())
        break
        
      case 'user-prompt':
        // Return conflicts for user resolution
        return { conflicts, resolved: false }
    }
    
    lastUpdated.value = new Date()
    return { conflicts, resolved: true }
  }

  // Getters
  const mattersByStatus = computed(() => {
    const grouped: Record<MatterStatus, Matter[]> = {} as Record<MatterStatus, Matter[]>
    
    matters.value.forEach(matter => {
      if (!grouped[matter.status]) {
        grouped[matter.status] = []
      }
      grouped[matter.status].push(matter)
    })
    
    return grouped
  })

  const getMatterById = computed(() => {
    return (id: string) => matters.value.find(m => m.id === id)
  })

  const getMattersByLawyer = computed(() => {
    return (lawyerId: string) => 
      matters.value.filter(m => m.assignedLawyer?.id === lawyerId)
  })

  const getMattersByPriority = computed(() => {
    return (priority: MatterPriority) => 
      matters.value.filter(m => m.priority === priority)
  })

  const getOverdueMatters = computed(() => {
    const now = new Date()
    return matters.value.filter(m => 
      m.dueDate && new Date(m.dueDate) < now && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(m.status)
    )
  })

  const isPending = computed(() => {
    return (matterId: string) => pendingOperations.value.has(matterId)
  })

  const hasOptimisticUpdate = computed(() => {
    return (matterId: string) => optimisticUpdates.value.has(matterId)
  })

  const matterCount = computed(() => matters.value.length)
  const loadingStatus = computed(() => ({ isLoading: isLoading.value, error: error.value }))

  return {
    // State (readonly)
    matters: readonly(matters),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),
    pendingOperations: readonly(pendingOperations),
    
    // Actions
    loadMatters,
    createMatter,
    updateMatter,
    deleteMatter,
    moveMatter,
    batchUpdateMatters,
    handleConflictResolution,
    
    // Card operations (for real-time updates compatibility)
    cards,
    addCard,
    updateCard,
    removeCard,
    moveCard,
    
    // Getters
    mattersByStatus,
    getMatterById,
    getMattersByLawyer,
    getMattersByPriority,
    getOverdueMatters,
    isPending,
    hasOptimisticUpdate,
    matterCount,
    loadingStatus
  }
})

// Demo data generator (enhanced from original)
function generateDemoMatters(): Matter[] {
  const statuses: MatterStatus[] = ['INTAKE', 'INITIAL_REVIEW', 'FILED', 'DISCOVERY', 'TRIAL_PREP', 'TRIAL', 'SETTLEMENT', 'COMPLETED', 'CLOSED']
  const priorities: MatterPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  const lawyers = [
    { id: 'lawyer1', name: 'Sarah Johnson', initials: 'SJ' },
    { id: 'lawyer2', name: 'Michael Brown', initials: 'MB' },
    { id: 'lawyer3', name: 'Emily Chen', initials: 'EC' },
    { id: 'lawyer4', name: 'David Wilson', initials: 'DW' }
  ]
  const clerks = [
    { id: 'clerk1', name: 'Alice Cooper', initials: 'AC' },
    { id: 'clerk2', name: 'Bob Smith', initials: 'BS' }
  ]
  const clients = ['ABC Corporation', 'XYZ Ltd.', 'Smith Family Trust', 'Johnson Holdings', 'Tech Startup Inc.']
  
  return Array.from({ length: 25 }, (_, i) => ({
    id: `matter-${i + 1}`,
    caseNumber: `2025-CV-${String(i + 1).padStart(4, '0')}`,
    title: `Legal Matter ${i + 1}`,
    description: `Detailed description for legal matter ${i + 1}`,
    clientName: clients[i % clients.length],
    opponentName: i % 2 === 0 ? `Defendant Corp ${i}` : undefined,
    assignedLawyer: lawyers[i % lawyers.length],
    assignedClerk: i % 3 === 0 ? clerks[i % clerks.length] : undefined,
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    dueDate: new Date(Date.now() + (i - 12) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * i * 60 * 60 * 1000).toISOString(),
    statusUpdatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    statusDuration: Math.floor(Math.random() * 30) + 1,
    relatedDocuments: Math.floor(Math.random() * 10) + 1,
    tags: i % 3 === 0 ? ['contract', 'review'] : i % 4 === 0 ? ['litigation', 'urgent'] : undefined
  }))
}