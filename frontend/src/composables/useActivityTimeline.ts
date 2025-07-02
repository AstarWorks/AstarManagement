/**
 * Activity Timeline Composable
 * Handles data fetching, filtering, and real-time updates for matter activity timeline
 */

import { ref, computed, watch } from 'vue'
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import type { 
  Activity, 
  ActivityFilters, 
  ActivityResponse, 
  ActivityGroup,
  ActivityViewMode,
  ActivityExportOptions,
  ActivityType,
  DocumentActivity,
  CommunicationActivity,
  MatterActivity,
  TaskActivity,
  AuditActivity
} from '~/types/activity'

/**
 * Composable for managing activity timeline data and interactions
 */
export function useActivityTimeline(matterId: string) {
  // State
  const filters = ref<ActivityFilters>({})
  const viewMode = ref<ActivityViewMode>('detailed')
  const searchTerm = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Activity query with infinite scrolling
  const {
    data: activitiesData,
    isLoading: isLoadingActivities,
    error: activitiesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchActivities
  } = useInfiniteQuery({
    queryKey: ['activities', matterId, filters, searchTerm],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params = new URLSearchParams()
      params.append('matterId', matterId)
      
      if (pageParam) {
        params.append('cursor', pageParam)
      }
      
      if (filters.value.types?.length) {
        params.append('types', filters.value.types.join(','))
      }
      
      if (filters.value.actors?.length) {
        params.append('actors', filters.value.actors.join(','))
      }
      
      if (filters.value.dateRange) {
        params.append('fromDate', filters.value.dateRange.from.toISOString())
        params.append('toDate', filters.value.dateRange.to.toISOString())
      }
      
      if (searchTerm.value) {
        params.append('search', searchTerm.value)
      }
      
      const response = await $fetch<ActivityResponse>(`/api/matters/${matterId}/activities?${params}`)
      return response
    },
    getNextPageParam: (lastPage: ActivityResponse) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  })

  // Flatten all activities from paginated responses
  const activities = computed(() => {
    if (!activitiesData.value?.pages) return []
    return activitiesData.value.pages.flatMap(page => page.activities)
  })

  // Group activities by date for grouped view
  const groupedActivities = computed<ActivityGroup[]>(() => {
    if (viewMode.value !== 'grouped') return []
    
    const groups = new Map<string, Activity[]>()
    
    activities.value.forEach(activity => {
      const dateKey = new Date(activity.timestamp).toISOString().split('T')[0]
      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey)!.push(activity)
    })
    
    return Array.from(groups.entries())
      .map(([date, activities]) => ({
        date,
        activities: activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        totalCount: activities.length
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  // Total activity count
  const totalActivities = computed(() => {
    const firstPage = activitiesData.value?.pages?.[0] as ActivityResponse | undefined
    return firstPage?.totalCount ?? 0
  })

  // Loading states
  const loading = computed(() => isLoadingActivities.value || isLoading.value)

  // Error handling
  watch(activitiesError, (newError) => {
    if (newError) {
      error.value = newError.message || 'Failed to load activities'
    }
  })

  // Activity type filter methods
  const setTypeFilter = (types: ActivityType[]) => {
    filters.value = { ...filters.value, types }
  }

  const setActorFilter = (actors: string[]) => {
    filters.value = { ...filters.value, actors }
  }

  const setDateRangeFilter = (dateRange: { from: Date; to: Date } | undefined) => {
    filters.value = { ...filters.value, dateRange }
  }

  const clearFilters = () => {
    filters.value = {}
    searchTerm.value = ''
  }

  // Search functionality
  const setSearchTerm = (term: string) => {
    searchTerm.value = term
  }

  // View mode management
  const setViewMode = (mode: ActivityViewMode) => {
    viewMode.value = mode
  }

  // Load more activities (infinite scroll)
  const loadMore = async () => {
    if (hasNextPage.value && !isFetchingNextPage.value) {
      await fetchNextPage()
    }
  }

  // Refresh activities
  const refresh = async () => {
    await refetchActivities()
  }

  // Export activities
  const exportActivities = async (options: ActivityExportOptions) => {
    try {
      isLoading.value = true
      
      const response = await $fetch(`/api/matters/${matterId}/activities/export`, {
        method: 'POST',
        body: {
          ...options,
          filters: filters.value,
          searchTerm: searchTerm.value
        }
      })
      
      // Handle file download
      const blob = new Blob([response as string], { 
        type: options.format === 'pdf' ? 'application/pdf' : 
              options.format === 'csv' ? 'text/csv' : 
              'application/json'
      })
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `matter-${matterId}-activities.${options.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      error.value = 'Failed to export activities'
      console.error('Export error:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    // Data
    activities: readonly(activities),
    groupedActivities: readonly(groupedActivities),
    totalActivities: readonly(totalActivities),
    
    // State
    filters: readonly(filters),
    viewMode: readonly(viewMode),
    searchTerm: readonly(searchTerm),
    loading: readonly(loading),
    error: readonly(error),
    
    // Pagination
    hasNextPage: readonly(hasNextPage),
    isFetchingNextPage: readonly(isFetchingNextPage),
    
    // Methods
    setTypeFilter,
    setActorFilter,
    setDateRangeFilter,
    clearFilters,
    setSearchTerm,
    setViewMode,
    loadMore,
    refresh,
    exportActivities
  }
}

/**
 * Composable for managing real-time activity updates
 */
export function useActivityRealTime(matterId: string) {
  const { $websocket } = useNuxtApp()
  
  const connect = () => {
    if ($websocket) {
      $websocket.subscribe(`matter.${matterId}.activity`, (data: any) => {
        // Handle real-time activity updates
        console.log('Real-time activity update:', data)
        // This would trigger cache invalidation in TanStack Query
      })
    }
  }
  
  const disconnect = () => {
    if ($websocket) {
      $websocket.unsubscribe(`matter.${matterId}.activity`)
    }
  }
  
  return {
    connect,
    disconnect
  }
}

/**
 * Utility functions for activity timeline
 */
export const useActivityUtils = () => {
  const formatActivityTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    
    return new Date(timestamp).toLocaleDateString()
  }
  
  const getActivityDescription = (activity: Activity): string => {
    switch (activity.type) {
      case 'document_upload':
      case 'document_view':
      case 'document_download':
        return `${activity.type.split('_')[1]} document "${(activity as DocumentActivity).documentName}"`
      case 'communication_email':
        return `sent email "${(activity as CommunicationActivity).subject || 'No subject'}"`
      case 'communication_note':
        return `added note`
      case 'communication_call':
        return `made call (${(activity as CommunicationActivity).duration || 0} min)`
      case 'matter_created':
        return `created matter`
      case 'matter_updated':
        return `updated ${(activity as MatterActivity).fieldName || 'matter'}`
      case 'matter_status_changed':
        return `changed status from "${(activity as MatterActivity).oldValue}" to "${(activity as MatterActivity).newValue}"`
      case 'matter_assigned':
        return `assigned matter to ${(activity as MatterActivity).assignee?.name || 'someone'}`
      case 'task_created':
        return `created task "${(activity as TaskActivity).taskTitle}"`
      case 'task_completed':
        return `completed task "${(activity as TaskActivity).taskTitle}"`
      case 'audit_action':
        return `performed ${(activity as AuditActivity).action} on ${(activity as AuditActivity).entityType}`
      default:
        return activity.description
    }
  }
  
  const groupActivitiesByDate = (activities: Activity[]): ActivityGroup[] => {
    const groups = new Map<string, Activity[]>()
    
    activities.forEach(activity => {
      const dateKey = new Date(activity.timestamp).toISOString().split('T')[0]
      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey)!.push(activity)
    })
    
    return Array.from(groups.entries())
      .map(([date, activities]) => ({
        date,
        activities: activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        totalCount: activities.length
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
  
  return {
    formatActivityTimestamp,
    getActivityDescription,
    groupActivitiesByDate
  }
}