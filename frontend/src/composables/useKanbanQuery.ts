/**
 * TanStack Query Composables for Kanban Board
 * 
 * @description Specialized query hooks for Kanban board functionality,
 * providing optimized data fetching and real-time synchronization
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import type { Matter, MatterStatus, MatterFilters, QueryError, PaginatedResponse } from '~/types/query'
import type { KanbanColumn, MatterCard } from '~/types/kanban'
import { queryKeys } from '~/types/query'
import { QUERY_CONFIGS } from '~/config/tanstack-query'
import { DEFAULT_KANBAN_COLUMNS } from '~/constants/kanban'
import { useMattersQuery } from './useMattersQuery'

/**
 * Transform Matter to MatterCard for Kanban display
 */
function transformToMatterCard(matter: Matter): MatterCard {
  // Handle assignedLawyer which can be string or LawyerInfo
  let assignedLawyerInfo = undefined
  if (matter.assignedLawyer) {
    if (typeof matter.assignedLawyer === 'string') {
      // Convert string to the expected object format
      assignedLawyerInfo = {
        id: matter.assignedLawyer,
        name: matter.assignedLawyer,
        initials: matter.assignedLawyer.substring(0, 2).toUpperCase()
      }
    } else {
      // It's already a LawyerInfo object
      assignedLawyerInfo = {
        id: matter.assignedLawyer.id,
        name: matter.assignedLawyer.name,
        initials: matter.assignedLawyer.initials
      }
    }
  }
  
  // Handle assignedClerk similarly
  let assignedClerkInfo = undefined
  if (matter.assignedClerk) {
    if (typeof matter.assignedClerk === 'string') {
      // Convert string to the expected object format
      assignedClerkInfo = {
        id: matter.assignedClerk,
        name: matter.assignedClerk,
        initials: matter.assignedClerk.substring(0, 2).toUpperCase()
      }
    } else {
      // It's already a LawyerInfo object
      assignedClerkInfo = {
        id: matter.assignedClerk.id,
        name: matter.assignedClerk.name,
        initials: matter.assignedClerk.initials
      }
    }
  }
  
  return {
    id: matter.id,
    caseNumber: matter.caseNumber,
    title: matter.title,
    clientName: matter.clientName,
    assignedLawyer: assignedLawyerInfo,
    priority: matter.priority,
    status: matter.status,
    dueDate: matter.dueDate,
    tags: matter.tags || [],
    position: 0, // Default position since Matter doesn't have this field
    createdAt: matter.createdAt,
    updatedAt: matter.updatedAt,
    // Copy over optional fields if they exist
    description: matter.description,
    opponentName: matter.opponentName,
    assignedClerk: assignedClerkInfo,
    statusDuration: matter.statusDuration,
    isOverdue: matter.isOverdue,
    relatedDocuments: Array.isArray(matter.relatedDocuments) ? matter.relatedDocuments.length : (matter.relatedDocuments || 0),
    searchHighlights: matter.searchHighlights as Record<string, string[]> | undefined,
    relevanceScore: matter.relevanceScore
  }
}

/**
 * Hook for fetching matters organized for Kanban display
 * 
 * @param filters - Optional filters to apply
 * @param options - Additional query options
 * @returns Kanban-optimized query result
 */
export function useKanbanMattersQuery(
  filters?: MaybeRef<MatterFilters>,
  options?: Partial<UseQueryOptions<PaginatedResponse<Matter> | Matter[], QueryError>>
) {
  // Use the base matters query with Kanban-specific configuration
  const mattersQuery = useMattersQuery(filters, {
    ...QUERY_CONFIGS.realtime,
    refetchInterval: 30000, // More frequent updates for Kanban
    ...options as any // Type assertion needed due to select transform
  })
  
  // Transform matters to MatterCards
  const matterCards = computed(() => {
    const data = mattersQuery.data.value
    if (!data) return []
    
    // Handle both PaginatedResponse and array formats
    const matters = 'data' in data ? data.data : (data as unknown as Matter[])
    return matters.map(transformToMatterCard)
  })
  
  // Group matters by status for Kanban columns
  const mattersByStatus = computed(() => {
    const grouped: Record<string, MatterCard[]> = {}
    
    // Initialize all columns by their ID
    DEFAULT_KANBAN_COLUMNS.forEach(column => {
      grouped[column.id] = []
    })
    
    // Group matter cards by their status, mapping to column IDs
    matterCards.value.forEach(card => {
      // Find the column that matches this matter's status
      const column = DEFAULT_KANBAN_COLUMNS.find(col => col.status === card.status)
      if (column && grouped[column.id]) {
        grouped[column.id].push(card)
      }
    })
    
    // Sort by position within each column
    Object.keys(grouped).forEach(columnId => {
      grouped[columnId].sort((a, b) => 
        (a.position || 0) - (b.position || 0)
      )
    })
    
    return grouped
  })
  
  // Get columns with counts for display
  const columnsWithCounts = computed(() => {
    return DEFAULT_KANBAN_COLUMNS.map(column => ({
      ...column,
      count: mattersByStatus.value[column.id]?.length || 0
    }))
  })
  
  return {
    // Original query data
    ...mattersQuery,
    
    // Kanban-specific data
    matterCards,
    mattersByStatus,
    columnsWithCounts,
    
    // Helper functions
    getMattersByColumn: (columnId: string) => 
      mattersByStatus.value[columnId] || [],
    
    getTotalCount: () => matterCards.value.length,
    
    getColumnCount: (columnId: string) => 
      mattersByStatus.value[columnId]?.length || 0
  }
}

/**
 * Hook for real-time Kanban updates using TanStack Query
 * 
 * @param options - Query options
 * @returns Real-time sync status and controls
 */
export function useKanbanRealTimeQuery(
  options?: Partial<UseQueryOptions<{ connected: boolean; lastUpdate: string; pendingUpdates: number }, QueryError>>
) {
  const queryClient = useQueryClient()
  
  // Query for real-time updates
  const realtimeQuery = useQuery({
    queryKey: ['kanban', 'realtime', 'status'] as const,
    queryFn: async () => {
      // This would connect to your WebSocket or SSE endpoint
      // For now, return a status object
      return {
        connected: true,
        lastUpdate: new Date().toISOString(),
        pendingUpdates: 0
      }
    },
    ...QUERY_CONFIGS.realtime,
    refetchInterval: 5000, // Check connection status every 5 seconds
    ...options
  } as UseQueryOptions<{ connected: boolean; lastUpdate: string; pendingUpdates: number }, QueryError>)
  
  // Utility to manually sync data
  const syncNow = async () => {
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.lists(),
      refetchType: 'active'
    })
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.statusCounts(),
      refetchType: 'active'
    })
  }
  
  // Subscribe to real-time updates
  const subscribeToUpdates = (callback: (update: any) => void) => {
    // This would set up WebSocket listeners
    // For now, return a mock unsubscribe function
    return () => {
      // Cleanup logic
    }
  }
  
  return {
    ...realtimeQuery,
    isConnected: computed(() => realtimeQuery.data.value?.connected || false),
    lastUpdate: computed(() => realtimeQuery.data.value?.lastUpdate),
    pendingUpdates: computed(() => realtimeQuery.data.value?.pendingUpdates || 0),
    syncNow,
    subscribeToUpdates
  }
}

/**
 * Hook for Kanban column management with TanStack Query
 * 
 * @param matters - Reactive matters array
 * @returns Column data and utilities
 */
export function useKanbanColumnsQuery(matters: MaybeRef<MatterCard[]>) {
  const mattersRef = computed(() => unref(matters))
  
  // Group matters by column
  const mattersByColumn = computed(() => {
    const grouped: Record<string, MatterCard[]> = {}
    
    // Initialize all columns
    DEFAULT_KANBAN_COLUMNS.forEach(column => {
      grouped[column.id] = []
    })
    
    // Group matters by their status, mapping to column IDs
    mattersRef.value.forEach(matter => {
      // Find the column that matches this matter's status
      const column = DEFAULT_KANBAN_COLUMNS.find(col => col.status === matter.status)
      if (column && grouped[column.id]) {
        grouped[column.id].push(matter)
      }
    })
    
    // Sort by position
    Object.keys(grouped).forEach(columnId => {
      grouped[columnId].sort((a, b) => (a.position || 0) - (b.position || 0))
    })
    
    return grouped
  })
  
  // Get columns with counts
  const columnsWithCounts = computed(() => {
    return DEFAULT_KANBAN_COLUMNS.map(column => ({
      ...column,
      count: mattersByColumn.value[column.id]?.length || 0,
      matters: mattersByColumn.value[column.id] || []
    }))
  })
  
  // Get available columns for a matter based on transitions
  const getAvailableColumns = (matterId: string) => {
    const matter = mattersRef.value.find(m => m.id === matterId)
    if (!matter) return []
    
    // This would check transition rules
    // For now, return all columns
    return DEFAULT_KANBAN_COLUMNS
  }
  
  return {
    mattersByColumn,
    columnsWithCounts,
    getAvailableColumns,
    totalMatters: computed(() => mattersRef.value.length)
  }
}

/**
 * Hook for prefetching Kanban data
 * Useful for improving perceived performance
 */
export function usePrefetchKanbanData() {
  const queryClient = useQueryClient()
  const { $fetch } = useNuxtApp()
  
  const prefetchAll = async () => {
    // Prefetch matters list
    await queryClient.prefetchQuery({
      queryKey: queryKeys.lists(),
      queryFn: () => $fetch('/api/matters'),
      ...QUERY_CONFIGS.matters
    })
    
    // Prefetch status counts
    await queryClient.prefetchQuery({
      queryKey: queryKeys.statusCounts(),
      queryFn: () => $fetch('/api/matters/status-counts'),
      ...QUERY_CONFIGS.realtime
    })
  }
  
  const prefetchColumn = async (status: MatterStatus) => {
    await queryClient.prefetchQuery({
      queryKey: [...queryKeys.lists(), { status }],
      queryFn: () => $fetch(`/api/matters?status=${status}`),
      ...QUERY_CONFIGS.matters
    })
  }
  
  return {
    prefetchAll,
    prefetchColumn
  }
}

/**
 * Hook for Kanban board search with TanStack Query
 */
export function useKanbanSearchQuery(
  searchQuery: MaybeRef<string>,
  options?: Partial<UseQueryOptions<MatterCard[], QueryError>>
) {
  const { $fetch } = useNuxtApp()
  
  return useQuery({
    queryKey: computed(() => ['kanban', 'search', unref(searchQuery)]),
    queryFn: async (): Promise<MatterCard[]> => {
      const query = unref(searchQuery)
      const matters = await $fetch<Matter[]>(`/api/matters/search?q=${encodeURIComponent(query)}`)
      return matters.map(transformToMatterCard)
    },
    enabled: computed(() => {
      const query = unref(searchQuery)
      return !!(query && query.trim().length >= 2)
    }),
    ...QUERY_CONFIGS.search,
    ...options
  } as UseQueryOptions<MatterCard[], QueryError>)
}