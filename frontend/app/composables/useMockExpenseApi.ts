import { mockExpenseDataService } from '~/services/mockExpenseDataService'
import type { 
  IExpense, 
  IExpenseList, 
  IExpenseFilter,
  ICreateExpenseRequest,
  IUpdateExpenseRequest,
  IExpenseSummary,
  IExpenseStatsResponse
} from '~/types/expense'

/**
 * Mock-aware API composable for expense management development
 * Provides additional debugging and development utilities
 */
export const useMockExpenseApi = () => {
  // Standard API methods that work with both mock and real APIs
  const fetchExpenses = async (filter: IExpenseFilter = {}): Promise<IExpenseList> => {
    console.log('[useMockExpenseApi] Fetching expenses with filter:', filter)
    
    const params = new URLSearchParams()
    
    if (filter.offset !== undefined) params.set('offset', filter.offset.toString())
    if (filter.limit !== undefined) params.set('limit', filter.limit.toString())
    if (filter.startDate) params.set('startDate', filter.startDate)
    if (filter.endDate) params.set('endDate', filter.endDate)
    if (filter.category) params.set('category', filter.category)
    if (filter.caseId) params.set('caseId', filter.caseId)
    if (filter.searchQuery) params.set('searchQuery', filter.searchQuery)
    if (filter.sortBy) params.set('sortBy', filter.sortBy)
    if (filter.sortOrder) params.set('sortOrder', filter.sortOrder)
    if (filter.tagIds) params.set('tagIds', filter.tagIds.join(','))
    
    const url = `/api/v1/expenses${params.toString() ? '?' + params.toString() : ''}`
    
    return await $fetch<IExpenseList>(url)
  }
  
  const fetchExpense = async (id: string): Promise<IExpense> => {
    console.log(`[useMockExpenseApi] Fetching expense ${id}`)
    return await $fetch<IExpense>(`/api/v1/expenses/${id}`)
  }
  
  const createExpense = async (data: ICreateExpenseRequest): Promise<IExpense> => {
    console.log('[useMockExpenseApi] Creating expense:', data)
    return await $fetch<IExpense>('/api/v1/expenses', {
      method: 'POST',
      body: data
    })
  }
  
  const updateExpense = async (id: string, data: IUpdateExpenseRequest): Promise<IExpense> => {
    console.log(`[useMockExpenseApi] Updating expense ${id}:`, data)
    return await $fetch<IExpense>(`/api/v1/expenses/${id}`, {
      method: 'PUT',
      body: data
    })
  }
  
  const deleteExpense = async (id: string): Promise<void> => {
    console.log(`[useMockExpenseApi] Deleting expense ${id}`)
    await $fetch(`/api/v1/expenses/${id}`, {
      method: 'DELETE'
    })
  }
  
  const fetchExpenseSummary = async (startDate?: string, endDate?: string): Promise<IExpenseSummary> => {
    console.log('[useMockExpenseApi] Fetching expense summary')
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    
    const url = `/api/v1/expenses/summary${params.toString() ? '?' + params.toString() : ''}`
    return await $fetch<IExpenseSummary>(url)
  }
  
  const fetchExpenseStats = async (startDate?: string, endDate?: string): Promise<IExpenseStatsResponse> => {
    console.log('[useMockExpenseApi] Fetching expense statistics')
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    
    const url = `/api/v1/expenses/stats${params.toString() ? '?' + params.toString() : ''}`
    return await $fetch<IExpenseStatsResponse>(url)
  }
  
  // Development-only utilities (only available in development mode)
  const devUtils = import.meta.dev ? {
    /**
     * Reset mock database to initial state
     */
    resetMockData: async () => {
      console.log('[useMockExpenseApi] Resetting mock data')
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(100)
    },
    
    /**
     * Seed mock database with specific number of expenses
     */
    seedMockData: async (count: number = 100) => {
      console.log(`[useMockExpenseApi] Seeding mock data with ${count} expenses`)
      await mockExpenseDataService.seedDatabase(count)
    },
    
    /**
     * Generate specific expense types for testing
     */
    generateTestExpenses: () => {
      console.log('[useMockExpenseApi] Generating test expenses')
      return {
        transportation: mockExpenseDataService.generateTransportationExpense(),
        stampFee: mockExpenseDataService.generateStampFeeExpense(),
        copyFee: mockExpenseDataService.generateCopyFeeExpense(),
        postage: mockExpenseDataService.generatePostageExpense(),
        other: mockExpenseDataService.generateOtherExpense()
      }
    },
    
    /**
     * Get direct access to mock data service for debugging
     */
    getMockService: () => mockExpenseDataService,
    
    /**
     * Log current mock data statistics
     */
    logMockStats: () => {
      const expenses = mockExpenseDataService.getExpenses()
      console.log('[useMockExpenseApi] Mock Data Statistics:', {
        totalExpenses: expenses.total,
        categories: expenses.items.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      })
    }
  } : undefined
  
  return {
    // Standard API methods
    fetchExpenses,
    fetchExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchExpenseSummary,
    fetchExpenseStats,
    
    // Development utilities (only in dev mode)
    devUtils
  }
}

/**
 * Development-only composable for direct mock data management
 * Only available in development mode
 */
export const useMockDataManager = () => {
  if (!import.meta.dev) {
    console.warn('[useMockDataManager] This composable is only available in development mode')
    return null
  }
  
  const isVisible = ref(false)
  const isLoading = ref(false)
  
  const toggleVisibility = () => {
    isVisible.value = !isVisible.value
  }
  
  const resetData = async () => {
    isLoading.value = true
    try {
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(100)
      console.log('[useMockDataManager] Mock data reset completed')
    } finally {
      isLoading.value = false
    }
  }
  
  const seedData = async (count: number) => {
    isLoading.value = true
    try {
      await mockExpenseDataService.seedDatabase(count)
      console.log(`[useMockDataManager] Seeded ${count} expenses`)
    } finally {
      isLoading.value = false
    }
  }
  
  const getStats = () => {
    const expenses = mockExpenseDataService.getExpenses()
    return {
      total: expenses.total,
      categories: expenses.items.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
  
  return {
    isVisible: readonly(isVisible),
    isLoading: readonly(isLoading),
    toggleVisibility,
    resetData,
    seedData,
    getStats
  }
}