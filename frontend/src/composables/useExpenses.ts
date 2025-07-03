/**
 * Expense Composables - TanStack Query Integration
 * 
 * @description Composables for expense management using TanStack Query
 * for server state management, caching, and optimistic updates.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T01_S14 + T07_S14 - Expense Entry Form + Approval Workflow
 */

import { computed, unref, type MaybeRef } from 'vue'
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery 
} from '@tanstack/vue-query'
import type { 
  Expense,
  ExpenseCreateInput,
  ExpenseUpdateInput,
  ExpenseListParams,
  ExpenseListResponse,
  ExpenseStatistics,
  ApprovalDecision,
  BulkApprovalRequest,
  BulkApprovalResult
} from '~/types/expense'

// Query Keys
export const expenseQueryKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseQueryKeys.all, 'list'] as const,
  list: (params: ExpenseListParams) => [...expenseQueryKeys.lists(), params] as const,
  details: () => [...expenseQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseQueryKeys.details(), id] as const,
  statistics: () => [...expenseQueryKeys.all, 'statistics'] as const,
  approvals: () => [...expenseQueryKeys.all, 'approvals'] as const,
  approvalQueue: (params: any) => [...expenseQueryKeys.approvals(), 'queue', params] as const
}

// Core Expense Queries
export function useExpensesQuery(params: MaybeRef<ExpenseListParams>) {
  return useQuery({
    queryKey: computed(() => expenseQueryKeys.list(unref(params))),
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
      if (currentParams.billable !== undefined) {
        searchParams.set('billable', currentParams.billable.toString())
      }
      if (currentParams.billed !== undefined) {
        searchParams.set('billed', currentParams.billed.toString())
      }
      if (currentParams.matterId) {
        searchParams.set('matterId', currentParams.matterId)
      }
      if (currentParams.searchQuery) {
        searchParams.set('q', currentParams.searchQuery)
      }
      if (currentParams.dateRange) {
        searchParams.set('startDate', currentParams.dateRange.start.toISOString())
        searchParams.set('endDate', currentParams.dateRange.end.toISOString())
      }
      if (currentParams.amountRange) {
        searchParams.set('minAmount', currentParams.amountRange.min.toString())
        searchParams.set('maxAmount', currentParams.amountRange.max.toString())
      }
      
      const response = await $fetch<ExpenseListResponse>('/api/expenses', {
        params: Object.fromEntries(searchParams)
      })
      
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true
  })
}

export function useExpenseQuery(id: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => expenseQueryKeys.detail(unref(id))),
    queryFn: async () => {
      const response = await $fetch<{ data: Expense }>(`/api/expenses/${unref(id)}`)
      return response.data
    },
    enabled: computed(() => !!unref(id)),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useExpenseStatisticsQuery() {
  return useQuery({
    queryKey: expenseQueryKeys.statistics(),
    queryFn: async () => {
      const response = await $fetch<{ data: ExpenseStatistics }>('/api/expenses/statistics')
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 5 * 60 * 1000 // Auto-refresh every 5 minutes
  })
}

// Infinite Query for Large Lists
export function useExpensesInfiniteQuery(baseParams: MaybeRef<Omit<ExpenseListParams, 'page'>>) {
  return useInfiniteQuery({
    queryKey: computed(() => [...expenseQueryKeys.lists(), 'infinite', unref(baseParams)]),
    queryFn: async ({ pageParam = 1 }) => {
      const params = { ...unref(baseParams), page: pageParam }
      const searchParams = new URLSearchParams()
      
      // Build search params (same logic as above)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.set(key, value.join(','))
          } else if (value instanceof Date) {
            searchParams.set(key, value.toISOString())
          } else {
            searchParams.set(key, value.toString())
          }
        }
      })
      
      const response = await $fetch<ExpenseListResponse>('/api/expenses', {
        params: Object.fromEntries(searchParams)
      })
      
      return response
    },
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination
      return page < pages ? page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000
  })
}

// Expense Mutations
export function useExpenseMutations() {
  const queryClient = useQueryClient()
  
  const createExpense = useMutation({
    mutationFn: async (data: ExpenseCreateInput) => {
      const formData = new FormData()
      
      // Add expense data
      formData.append('data', JSON.stringify({
        matterId: data.matterId,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        expenseDate: data.expenseDate.toISOString(),
        expenseType: data.expenseType,
        billable: data.billable,
        notes: data.notes
      }))
      
      // Add receipt file if provided
      if (data.receiptFile) {
        formData.append('receipt', data.receiptFile)
      }
      
      const response = await $fetch<{ data: Expense }>('/api/expenses', {
        method: 'POST',
        body: formData
      })
      
      return response.data
    },
    onSuccess: (newExpense) => {
      // Invalidate and refetch expense lists
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.statistics() })
      
      // Optimistically update the cache
      queryClient.setQueryData(
        expenseQueryKeys.detail(newExpense.id),
        newExpense
      )
    },
    onError: (error) => {
      console.error('Failed to create expense:', error)
    }
  })
  
  const updateExpense = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExpenseUpdateInput }) => {
      const formData = new FormData()
      
      // Add updated data (exclude receiptFile from JSON)
      const updateData = { ...data }
      delete updateData.receiptFile
      
      formData.append('data', JSON.stringify(updateData))
      
      // Add new receipt file if provided
      if (data.receiptFile) {
        formData.append('receipt', data.receiptFile)
      }
      
      const response = await $fetch<{ data: Expense }>(`/api/expenses/${id}`, {
        method: 'PATCH',
        body: formData
      })
      
      return response.data
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: expenseQueryKeys.detail(id) })
      
      // Snapshot previous value
      const previousExpense = queryClient.getQueryData(expenseQueryKeys.detail(id))
      
      // Optimistically update
      queryClient.setQueryData(expenseQueryKeys.detail(id), (old: Expense) => ({
        ...old,
        ...data,
        updatedAt: new Date()
      }))
      
      return { previousExpense }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousExpense) {
        queryClient.setQueryData(expenseQueryKeys.detail(id), context.previousExpense)
      }
    },
    onSuccess: (updatedExpense) => {
      // Update caches
      queryClient.setQueryData(expenseQueryKeys.detail(updatedExpense.id), updatedExpense)
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.statistics() })
    }
  })
  
  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      await $fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: expenseQueryKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.statistics() })
    }
  })
  
  return {
    createExpense,
    updateExpense,
    deleteExpense
  }
}

// Approval Mutations
export function useApprovalMutations() {
  const queryClient = useQueryClient()
  
  const approveExpense = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await $fetch<{ data: Expense }>(`/api/expenses/${id}/approve`, {
        method: 'POST',
        body: { decision: 'APPROVED', reason }
      })
      return response.data
    },
    onMutate: async ({ id }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: expenseQueryKeys.detail(id) })
      
      const previousExpense = queryClient.getQueryData(expenseQueryKeys.detail(id))
      
      queryClient.setQueryData(expenseQueryKeys.detail(id), (old: Expense) => ({
        ...old,
        approvalStatus: 'APPROVED',
        approvedAt: new Date()
      }))
      
      return { previousExpense }
    },
    onError: (err, { id }, context) => {
      if (context?.previousExpense) {
        queryClient.setQueryData(expenseQueryKeys.detail(id), context.previousExpense)
      }
    },
    onSuccess: (approvedExpense) => {
      queryClient.setQueryData(expenseQueryKeys.detail(approvedExpense.id), approvedExpense)
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.approvals() })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.statistics() })
    }
  })
  
  const rejectExpense = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await $fetch<{ data: Expense }>(`/api/expenses/${id}/approve`, {
        method: 'POST',
        body: { decision: 'REJECTED', reason }
      })
      return response.data
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: expenseQueryKeys.detail(id) })
      
      const previousExpense = queryClient.getQueryData(expenseQueryKeys.detail(id))
      
      queryClient.setQueryData(expenseQueryKeys.detail(id), (old: Expense) => ({
        ...old,
        approvalStatus: 'REJECTED',
        approvedAt: new Date()
      }))
      
      return { previousExpense }
    },
    onError: (err, { id }, context) => {
      if (context?.previousExpense) {
        queryClient.setQueryData(expenseQueryKeys.detail(id), context.previousExpense)
      }
    },
    onSuccess: (rejectedExpense) => {
      queryClient.setQueryData(expenseQueryKeys.detail(rejectedExpense.id), rejectedExpense)
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.approvals() })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.statistics() })
    }
  })
  
  const bulkApproveExpenses = useMutation({
    mutationFn: async (request: BulkApprovalRequest) => {
      const response = await $fetch<BulkApprovalResult>('/api/expenses/bulk-approve', {
        method: 'POST',
        body: request
      })
      return response
    },
    onSuccess: (result, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.approvals() })
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.statistics() })
      
      // Update individual expense caches
      result.successful.forEach(expenseId => {
        queryClient.setQueryData(expenseQueryKeys.detail(expenseId), (old: Expense) => ({
          ...old,
          approvalStatus: variables.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          approvedAt: new Date()
        }))
      })
    }
  })
  
  return {
    approveExpense,
    rejectExpense,
    bulkApproveExpenses
  }
}

// Convenience Composables
export function useExpense(id: MaybeRef<string>) {
  const query = useExpenseQuery(id)
  const mutations = useExpenseMutations()
  const approvalMutations = useApprovalMutations()
  
  return {
    // Query data
    expense: query.data,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    
    // Mutations
    updateExpense: mutations.updateExpense.mutateAsync,
    deleteExpense: mutations.deleteExpense.mutateAsync,
    approveExpense: approvalMutations.approveExpense.mutateAsync,
    rejectExpense: approvalMutations.rejectExpense.mutateAsync,
    
    // Mutation states
    isUpdating: mutations.updateExpense.isPending,
    isDeleting: mutations.deleteExpense.isPending,
    isApproving: approvalMutations.approveExpense.isPending,
    isRejecting: approvalMutations.rejectExpense.isPending
  }
}

export function useExpenses(params: MaybeRef<ExpenseListParams>) {
  const query = useExpensesQuery(params)
  const mutations = useExpenseMutations()
  const statistics = useExpenseStatisticsQuery()
  
  return {
    // Query data
    expenses: computed(() => query.data.value?.data || []),
    pagination: computed(() => query.data.value?.pagination),
    summary: computed(() => query.data.value?.summary),
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    
    // Statistics
    statistics: statistics.data,
    isLoadingStats: statistics.isPending,
    
    // Mutations
    createExpense: mutations.createExpense.mutateAsync,
    
    // Mutation states
    isCreating: mutations.createExpense.isPending
  }
}

// Real-time Updates
export function useExpenseRealTimeUpdates() {
  const queryClient = useQueryClient()
  
  // WebSocket or Server-Sent Events integration would go here
  const setupRealTimeUpdates = () => {
    // Example WebSocket setup
    // const ws = new WebSocket('/api/expenses/updates')
    // ws.onmessage = (event) => {
    //   const update = JSON.parse(event.data)
    //   if (update.type === 'expense_updated') {
    //     queryClient.invalidateQueries({ queryKey: expenseQueryKeys.detail(update.id) })
    //   }
    // }
  }
  
  return {
    setupRealTimeUpdates
  }
}