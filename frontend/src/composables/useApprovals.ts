/**
 * Approval Workflow Composables
 * 
 * @description Composables for managing expense approval workflows,
 * including approval queues, bulk operations, and workflow management.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T07_S14 - Approval Workflow System
 */

import { computed, unref, type MaybeRef } from 'vue'
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery 
} from '@tanstack/vue-query'
import type {
  ApprovalQueueItem,
  ApprovalQueueParams,
  ApprovalQueueResponse,
  ApprovalDecision,
  BulkApprovalRequest,
  BulkApprovalResult,
  ApprovalStatistics,
  ApprovalDelegation,
  ApprovalRule,
  ApprovalNotification,
  ApprovalPermissions
} from '~/types/approval'

// Query Keys
export const approvalQueryKeys = {
  all: ['approvals'] as const,
  queues: () => [...approvalQueryKeys.all, 'queue'] as const,
  queue: (params: ApprovalQueueParams) => [...approvalQueryKeys.queues(), params] as const,
  statistics: () => [...approvalQueryKeys.all, 'statistics'] as const,
  rules: () => [...approvalQueryKeys.all, 'rules'] as const,
  delegations: () => [...approvalQueryKeys.all, 'delegations'] as const,
  notifications: () => [...approvalQueryKeys.all, 'notifications'] as const,
  permissions: (userId: string) => [...approvalQueryKeys.all, 'permissions', userId] as const
}

// Core Approval Queue Queries
export function useApprovalQueueQuery(params: MaybeRef<ApprovalQueueParams>) {
  return useQuery({
    queryKey: computed(() => approvalQueryKeys.queue(unref(params))),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      const currentParams = unref(params)
      
      // Add pagination
      if (currentParams.page) searchParams.set('page', currentParams.page.toString())
      if (currentParams.limit) searchParams.set('limit', currentParams.limit.toString())
      
      // Add sorting
      if (currentParams.sortBy) searchParams.set('sortBy', currentParams.sortBy)
      if (currentParams.sortOrder) searchParams.set('sortOrder', currentParams.sortOrder)
      
      // Add filters
      if (currentParams.status?.length) {
        searchParams.set('status', currentParams.status.join(','))
      }
      if (currentParams.expenseType?.length) {
        searchParams.set('expenseType', currentParams.expenseType.join(','))
      }
      if (currentParams.priority?.length) {
        searchParams.set('priority', currentParams.priority.join(','))
      }
      if (currentParams.matterId) {
        searchParams.set('matterId', currentParams.matterId)
      }
      if (currentParams.submitterId) {
        searchParams.set('submitterId', currentParams.submitterId)
      }
      if (currentParams.isUrgent !== undefined) {
        searchParams.set('isUrgent', currentParams.isUrgent.toString())
      }
      if (currentParams.daysPendingMin) {
        searchParams.set('daysPendingMin', currentParams.daysPendingMin.toString())
      }
      if (currentParams.daysPendingMax) {
        searchParams.set('daysPendingMax', currentParams.daysPendingMax.toString())
      }
      if (currentParams.dateRange) {
        searchParams.set('startDate', currentParams.dateRange.start.toISOString())
        searchParams.set('endDate', currentParams.dateRange.end.toISOString())
      }
      if (currentParams.amountRange) {
        searchParams.set('minAmount', currentParams.amountRange.min.toString())
        searchParams.set('maxAmount', currentParams.amountRange.max.toString())
      }
      
      const response = await $fetch<ApprovalQueueResponse>('/api/approvals/queue', {
        params: Object.fromEntries(searchParams)
      })
      
      return response
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true
  })
}

export function useApprovalStatisticsQuery() {
  return useQuery({
    queryKey: approvalQueryKeys.statistics(),
    queryFn: async () => {
      const response = await $fetch<{ data: ApprovalStatistics }>('/api/approvals/statistics')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 2 * 60 * 1000 // Auto-refresh every 2 minutes
  })
}

export function useApprovalRulesQuery() {
  return useQuery({
    queryKey: approvalQueryKeys.rules(),
    queryFn: async () => {
      const response = await $fetch<{ data: ApprovalRule[] }>('/api/approvals/rules')
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  })
}

export function useApprovalDelegationsQuery(userId?: string) {
  return useQuery({
    queryKey: computed(() => [...approvalQueryKeys.delegations(), userId]),
    queryFn: async () => {
      const params = userId ? { userId } : {}
      const response = await $fetch<{ data: ApprovalDelegation[] }>('/api/approvals/delegations', {
        params
      })
      return response.data
    },
    enabled: computed(() => !!userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  })
}

export function useApprovalNotificationsQuery(userId: string) {
  return useQuery({
    queryKey: computed(() => [...approvalQueryKeys.notifications(), userId]),
    queryFn: async () => {
      const response = await $fetch<{ data: ApprovalNotification[] }>(`/api/approvals/notifications`, {
        params: { userId }
      })
      return response.data
    },
    enabled: computed(() => !!userId),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000 // Auto-refresh notifications every minute
  })
}

export function useApprovalPermissionsQuery(userId: string) {
  return useQuery({
    queryKey: computed(() => approvalQueryKeys.permissions(userId)),
    queryFn: async () => {
      const response = await $fetch<{ data: ApprovalPermissions }>(`/api/approvals/permissions/${userId}`)
      return response.data
    },
    enabled: computed(() => !!userId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  })
}

// Approval Mutations
export function useApprovalMutations() {
  const queryClient = useQueryClient()
  
  const approveExpense = useMutation({
    mutationFn: async ({ expenseId, decision }: { expenseId: string; decision: ApprovalDecision }) => {
      const response = await $fetch<{ data: ApprovalQueueItem }>(`/api/expenses/${expenseId}/approve`, {
        method: 'POST',
        body: decision
      })
      return response.data
    },
    onMutate: async ({ expenseId, decision }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: approvalQueryKeys.queues() })
      
      // Snapshot previous value
      const previousQueues = queryClient.getQueriesData({ queryKey: approvalQueryKeys.queues() })
      
      // Optimistically update queue
      queryClient.setQueriesData(
        { queryKey: approvalQueryKeys.queues() },
        (old: ApprovalQueueResponse | undefined) => {
          if (!old) return old
          
          return {
            ...old,
            data: old.data.map(item => 
              item.id === expenseId 
                ? { 
                    ...item, 
                    approvalStatus: decision.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
                    approvedAt: new Date(),
                    approvedBy: decision.approverId
                  }
                : item
            ),
            summary: {
              ...old.summary,
              totalPending: Math.max(0, old.summary.totalPending - 1)
            }
          }
        }
      )
      
      return { previousQueues }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQueues) {
        context.previousQueues.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSuccess: (approvedExpense) => {
      // Update caches
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.queues() })
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.statistics() })
      
      // Update individual expense cache if it exists
      queryClient.setQueryData(
        ['expenses', 'detail', approvedExpense.id],
        approvedExpense
      )
    }
  })
  
  const bulkApproveExpenses = useMutation({
    mutationFn: async (request: BulkApprovalRequest) => {
      const response = await $fetch<BulkApprovalResult>('/api/approvals/bulk-approve', {
        method: 'POST',
        body: request
      })
      return response
    },
    onSuccess: (result, variables) => {
      // Invalidate all approval-related queries
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.queues() })
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.statistics() })
      
      // Update individual expense caches
      result.successful.forEach(expenseId => {
        queryClient.setQueryData(['expenses', 'detail', expenseId], (old: any) => ({
          ...old,
          approvalStatus: variables.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          approvedAt: new Date()
        }))
      })
    }
  })
  
  const delegateApproval = useMutation({
    mutationFn: async ({ 
      expenseId, 
      delegateeId, 
      reason 
    }: { 
      expenseId: string
      delegateeId: string
      reason: string 
    }) => {
      const response = await $fetch<{ data: ApprovalQueueItem }>(`/api/expenses/${expenseId}/delegate`, {
        method: 'POST',
        body: { delegateeId, reason }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.queues() })
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.delegations() })
    }
  })
  
  const escalateApproval = useMutation({
    mutationFn: async ({ 
      expenseId, 
      escalateTo, 
      reason 
    }: { 
      expenseId: string
      escalateTo: string[]
      reason: string 
    }) => {
      const response = await $fetch<{ data: ApprovalQueueItem }>(`/api/expenses/${expenseId}/escalate`, {
        method: 'POST',
        body: { escalateTo, reason }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.queues() })
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.statistics() })
    }
  })
  
  return {
    approveExpense,
    bulkApproveExpenses,
    delegateApproval,
    escalateApproval
  }
}

// Delegation Mutations
export function useDelegationMutations() {
  const queryClient = useQueryClient()
  
  const createDelegation = useMutation({
    mutationFn: async (delegation: Omit<ApprovalDelegation, 'id' | 'createdAt' | 'delegator' | 'delegatee'>) => {
      const response = await $fetch<{ data: ApprovalDelegation }>('/api/approvals/delegations', {
        method: 'POST',
        body: delegation
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.delegations() })
    }
  })
  
  const updateDelegation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Partial<ApprovalDelegation> 
    }) => {
      const response = await $fetch<{ data: ApprovalDelegation }>(`/api/approvals/delegations/${id}`, {
        method: 'PATCH',
        body: updates
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.delegations() })
    }
  })
  
  const deleteDelegation = useMutation({
    mutationFn: async (id: string) => {
      await $fetch(`/api/approvals/delegations/${id}`, {
        method: 'DELETE'
      })
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalQueryKeys.delegations() })
    }
  })
  
  return {
    createDelegation,
    updateDelegation,
    deleteDelegation
  }
}

// Notification Mutations
export function useNotificationMutations() {
  const queryClient = useQueryClient()
  
  const markNotificationRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await $fetch<{ data: ApprovalNotification }>(`/api/approvals/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      return response.data
    },
    onSuccess: (updatedNotification) => {
      // Update notifications cache
      queryClient.setQueryData(
        [...approvalQueryKeys.notifications(), updatedNotification.recipientId],
        (old: ApprovalNotification[] | undefined) => {
          if (!old) return old
          return old.map(notification => 
            notification.id === updatedNotification.id 
              ? updatedNotification 
              : notification
          )
        }
      )
    }
  })
  
  const markAllNotificationsRead = useMutation({
    mutationFn: async (userId: string) => {
      await $fetch(`/api/approvals/notifications/mark-all-read`, {
        method: 'POST',
        body: { userId }
      })
      return userId
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ 
        queryKey: [...approvalQueryKeys.notifications(), userId] 
      })
    }
  })
  
  return {
    markNotificationRead,
    markAllNotificationsRead
  }
}

// Convenience Composables
export function useApprovalQueue(params: MaybeRef<ApprovalQueueParams>) {
  const query = useApprovalQueueQuery(params)
  const mutations = useApprovalMutations()
  const statistics = useApprovalStatisticsQuery()
  
  return {
    // Query data
    queue: computed(() => query.data.value?.data || []),
    pagination: computed(() => query.data.value?.pagination),
    summary: computed(() => query.data.value?.summary),
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    
    // Statistics
    statistics: statistics.data,
    isLoadingStats: statistics.isPending,
    
    // Mutations
    approveExpense: mutations.approveExpense.mutateAsync,
    bulkApproveExpenses: mutations.bulkApproveExpenses.mutateAsync,
    delegateApproval: mutations.delegateApproval.mutateAsync,
    escalateApproval: mutations.escalateApproval.mutateAsync,
    
    // Mutation states
    isApproving: mutations.approveExpense.isPending,
    isBulkApproving: mutations.bulkApproveExpenses.isPending,
    isDelegating: mutations.delegateApproval.isPending,
    isEscalating: mutations.escalateApproval.isPending
  }
}

export function useApprovalWorkflow(userId: string) {
  const permissions = useApprovalPermissionsQuery(userId)
  const delegations = useApprovalDelegationsQuery(userId)
  const notifications = useApprovalNotificationsQuery(userId)
  const delegationMutations = useDelegationMutations()
  const notificationMutations = useNotificationMutations()
  
  return {
    // Permissions
    permissions: permissions.data,
    isLoadingPermissions: permissions.isPending,
    
    // Delegations
    delegations: delegations.data,
    isLoadingDelegations: delegations.isPending,
    
    // Notifications
    notifications: notifications.data,
    unreadCount: computed(() => 
      notifications.data.value?.filter(n => !n.isRead).length || 0
    ),
    urgentCount: computed(() =>
      notifications.data.value?.filter(n => !n.isRead && n.priority === 'high').length || 0
    ),
    isLoadingNotifications: notifications.isPending,
    
    // Delegation actions
    createDelegation: delegationMutations.createDelegation.mutateAsync,
    updateDelegation: delegationMutations.updateDelegation.mutateAsync,
    deleteDelegation: delegationMutations.deleteDelegation.mutateAsync,
    
    // Notification actions
    markNotificationRead: notificationMutations.markNotificationRead.mutateAsync,
    markAllNotificationsRead: notificationMutations.markAllNotificationsRead.mutateAsync,
    
    // Helper functions
    canApprove: (expense: ApprovalQueueItem) => {
      const perms = permissions.data.value
      if (!perms?.canApprove) return false
      
      // Check amount limits
      if (perms.maxApprovalAmount && expense.amount > perms.maxApprovalAmount) {
        return false
      }
      
      // Check expense types
      if (perms.allowedExpenseTypes?.length && 
          !perms.allowedExpenseTypes.includes(expense.expenseType)) {
        return false
      }
      
      // Can't approve own expenses
      if (expense.createdBy === userId) return false
      
      return true
    },
    
    canDelegate: (expense: ApprovalQueueItem) => {
      return permissions.data.value?.canDelegate && expense.createdBy !== userId
    },
    
    canEscalate: (expense: ApprovalQueueItem) => {
      return permissions.data.value?.canEscalate && expense.daysPending >= 2
    }
  }
}