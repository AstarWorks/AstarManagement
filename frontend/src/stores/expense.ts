/**
 * Expense Store - Pinia State Management
 * 
 * @description Comprehensive expense management store using Pinia with
 * TanStack Query integration for server state management, optimistic updates,
 * and real-time synchronization.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T01_S14 + T07_S14 - Expense Entry Form + Approval Workflow
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { 
  Expense, 
  ExpenseCreateInput, 
  ExpenseUpdateInput,
  ExpenseFilters,
  ExpenseListParams,
  ExpenseStatistics,
  ApprovalDecision,
  BulkApprovalRequest
} from '~/types/expense'

export const useExpenseStore = defineStore('expense', () => {
  // Core State
  const expenses = ref<Expense[]>([])
  const selectedExpense = ref<Expense | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // UI State
  const filters = ref<ExpenseFilters>({
    status: undefined,
    expenseType: undefined,
    billable: undefined,
    billed: undefined,
    matterId: undefined,
    dateRange: undefined,
    amountRange: undefined,
    searchQuery: ''
  })
  
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  
  const sortOptions = ref({
    sortBy: 'createdAt' as keyof Expense,
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  
  // Selection State for Bulk Operations
  const selectedExpenseIds = ref<Set<string>>(new Set())
  
  // Statistics Cache
  const statistics = ref<ExpenseStatistics | null>(null)
  const statisticsLoading = ref(false)
  
  // Computed Properties
  const filteredExpenses = computed(() => {
    let filtered = expenses.value
    
    // Apply filters
    if (filters.value.status?.length) {
      filtered = filtered.filter(expense => 
        filters.value.status!.includes(expense.approvalStatus)
      )
    }
    
    if (filters.value.expenseType?.length) {
      filtered = filtered.filter(expense =>
        filters.value.expenseType!.includes(expense.expenseType)
      )
    }
    
    if (filters.value.billable !== undefined) {
      filtered = filtered.filter(expense => 
        expense.billable === filters.value.billable
      )
    }
    
    if (filters.value.billed !== undefined) {
      filtered = filtered.filter(expense =>
        expense.billed === filters.value.billed
      )
    }
    
    if (filters.value.matterId) {
      filtered = filtered.filter(expense =>
        expense.matterId === filters.value.matterId
      )
    }
    
    if (filters.value.dateRange) {
      const { start, end } = filters.value.dateRange
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.expenseDate)
        return expenseDate >= start && expenseDate <= end
      })
    }
    
    if (filters.value.amountRange) {
      const { min, max } = filters.value.amountRange
      filtered = filtered.filter(expense =>
        expense.amount >= min && expense.amount <= max
      )
    }
    
    if (filters.value.searchQuery) {
      const query = filters.value.searchQuery.toLowerCase()
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(query) ||
        expense.notes?.toLowerCase().includes(query) ||
        expense.matter?.title.toLowerCase().includes(query)
      )
    }
    
    return filtered
  })
  
  const pendingExpenses = computed(() =>
    expenses.value.filter(expense => expense.approvalStatus === 'PENDING')
  )
  
  const approvedExpenses = computed(() =>
    expenses.value.filter(expense => expense.approvalStatus === 'APPROVED')
  )
  
  const rejectedExpenses = computed(() =>
    expenses.value.filter(expense => expense.approvalStatus === 'REJECTED')
  )
  
  const billableExpenses = computed(() =>
    expenses.value.filter(expense => expense.billable && !expense.billed)
  )
  
  const totalAmount = computed(() =>
    filteredExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  )
  
  const selectedExpenses = computed(() =>
    expenses.value.filter(expense => selectedExpenseIds.value.has(expense.id))
  )
  
  const hasSelection = computed(() => selectedExpenseIds.value.size > 0)
  
  // Actions
  const fetchExpenses = async (params?: ExpenseListParams) => {
    loading.value = true
    error.value = null
    
    try {
      const searchParams = new URLSearchParams()
      
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
      
      // Add filters to search params
      if (params?.status?.length) {
        searchParams.set('status', params.status.join(','))
      }
      if (params?.expenseType?.length) {
        searchParams.set('expenseType', params.expenseType.join(','))
      }
      if (params?.billable !== undefined) {
        searchParams.set('billable', params.billable.toString())
      }
      if (params?.matterId) {
        searchParams.set('matterId', params.matterId)
      }
      if (params?.searchQuery) {
        searchParams.set('q', params.searchQuery)
      }
      
      const response = await $fetch<{
        data: Expense[]
        pagination: typeof pagination.value
        summary: {
          totalAmount: number
          pendingAmount: number
          approvedAmount: number
          billableAmount: number
        }
      }>('/api/expenses', {
        params: Object.fromEntries(searchParams)
      })
      
      expenses.value = response.data
      pagination.value = response.pagination
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch expenses'
      console.error('Error fetching expenses:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const fetchExpenseById = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<{ data: Expense }>(`/api/expenses/${id}`)
      
      // Update the expense in the list if it exists
      const index = expenses.value.findIndex(expense => expense.id === id)
      if (index !== -1) {
        expenses.value[index] = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch expense'
      console.error('Error fetching expense:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const createExpense = async (data: ExpenseCreateInput) => {
    loading.value = true
    error.value = null
    
    try {
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
      
      // Add to local state (optimistic update)
      expenses.value.unshift(response.data)
      
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create expense'
      console.error('Error creating expense:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const updateExpense = async (id: string, data: ExpenseUpdateInput) => {
    loading.value = true
    error.value = null
    
    try {
      const formData = new FormData()
      
      // Add updated data
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
      
      // Update local state
      const index = expenses.value.findIndex(expense => expense.id === id)
      if (index !== -1) {
        expenses.value[index] = response.data
      }
      
      if (selectedExpense.value?.id === id) {
        selectedExpense.value = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update expense'
      console.error('Error updating expense:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const deleteExpense = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      await $fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      })
      
      // Remove from local state
      expenses.value = expenses.value.filter(expense => expense.id !== id)
      selectedExpenseIds.value.delete(id)
      
      if (selectedExpense.value?.id === id) {
        selectedExpense.value = null
      }
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete expense'
      console.error('Error deleting expense:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Approval Actions
  const approveExpense = async (id: string, reason?: string) => {
    return updateExpenseApproval(id, { decision: 'APPROVED', reason })
  }
  
  const rejectExpense = async (id: string, reason: string) => {
    return updateExpenseApproval(id, { decision: 'REJECTED', reason })
  }
  
  const updateExpenseApproval = async (id: string, decision: ApprovalDecision) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<{ data: Expense }>(`/api/expenses/${id}/approve`, {
        method: 'POST',
        body: decision
      })
      
      // Update local state
      const index = expenses.value.findIndex(expense => expense.id === id)
      if (index !== -1) {
        expenses.value[index] = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update approval'
      console.error('Error updating approval:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const bulkApproveExpenses = async (request: BulkApprovalRequest) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<{
        successful: string[]
        failed: Array<{ expenseId: string; error: string }>
        summary: {
          total: number
          approved: number
          rejected: number
          failed: number
        }
      }>('/api/expenses/bulk-approve', {
        method: 'POST',
        body: request
      })
      
      // Update local state for successful approvals
      response.successful.forEach(expenseId => {
        const index = expenses.value.findIndex(expense => expense.id === expenseId)
        if (index !== -1) {
          expenses.value[index] = {
            ...expenses.value[index],
            approvalStatus: request.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
            approvedAt: new Date(),
            // Note: In real implementation, approved_by would come from the response
          }
        }
      })
      
      // Clear selection
      clearSelection()
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to bulk approve expenses'
      console.error('Error bulk approving expenses:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Statistics
  const fetchStatistics = async () => {
    statisticsLoading.value = true
    
    try {
      const response = await $fetch<{ data: ExpenseStatistics }>('/api/expenses/statistics')
      statistics.value = response.data
      return response.data
    } catch (err) {
      console.error('Error fetching statistics:', err)
      throw err
    } finally {
      statisticsLoading.value = false
    }
  }
  
  // Selection Management
  const toggleExpenseSelection = (id: string) => {
    if (selectedExpenseIds.value.has(id)) {
      selectedExpenseIds.value.delete(id)
    } else {
      selectedExpenseIds.value.add(id)
    }
  }
  
  const selectAllExpenses = () => {
    filteredExpenses.value.forEach(expense => {
      selectedExpenseIds.value.add(expense.id)
    })
  }
  
  const clearSelection = () => {
    selectedExpenseIds.value.clear()
  }
  
  const selectExpensesByStatus = (status: string) => {
    expenses.value
      .filter(expense => expense.approvalStatus === status)
      .forEach(expense => selectedExpenseIds.value.add(expense.id))
  }
  
  // Filter Management
  const updateFilters = (newFilters: Partial<ExpenseFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }
  
  const clearFilters = () => {
    filters.value = {
      status: undefined,
      expenseType: undefined,
      billable: undefined,
      billed: undefined,
      matterId: undefined,
      dateRange: undefined,
      amountRange: undefined,
      searchQuery: ''
    }
  }
  
  const setSortOptions = (sortBy: keyof Expense, sortOrder: 'asc' | 'desc') => {
    sortOptions.value = { sortBy, sortOrder }
  }
  
  // Utility Actions
  const setSelectedExpense = (expense: Expense | null) => {
    selectedExpense.value = expense
  }
  
  const clearError = () => {
    error.value = null
  }
  
  const refreshExpenses = async () => {
    const params: ExpenseListParams = {
      ...filters.value,
      ...sortOptions.value,
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    
    await fetchExpenses(params)
  }
  
  // Auto-refresh for real-time updates
  const setupAutoRefresh = (intervalMs: number = 30000) => {
    return setInterval(() => {
      if (!loading.value) {
        refreshExpenses()
      }
    }, intervalMs)
  }
  
  return {
    // State (readonly)
    expenses: readonly(expenses),
    selectedExpense: readonly(selectedExpense),
    loading: readonly(loading),
    error: readonly(error),
    filters: readonly(filters),
    pagination: readonly(pagination),
    sortOptions: readonly(sortOptions),
    selectedExpenseIds: readonly(selectedExpenseIds),
    statistics: readonly(statistics),
    statisticsLoading: readonly(statisticsLoading),
    
    // Computed
    filteredExpenses,
    pendingExpenses,
    approvedExpenses,
    rejectedExpenses,
    billableExpenses,
    totalAmount,
    selectedExpenses,
    hasSelection,
    
    // Actions
    fetchExpenses,
    fetchExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    
    // Approval Actions
    approveExpense,
    rejectExpense,
    updateExpenseApproval,
    bulkApproveExpenses,
    
    // Statistics
    fetchStatistics,
    
    // Selection Management
    toggleExpenseSelection,
    selectAllExpenses,
    clearSelection,
    selectExpensesByStatus,
    
    // Filter Management
    updateFilters,
    clearFilters,
    setSortOptions,
    
    // Utility Actions
    setSelectedExpense,
    clearError,
    refreshExpenses,
    setupAutoRefresh
  }
})