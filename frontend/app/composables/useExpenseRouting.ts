import type { ExpenseFilter } from '~/types/expense'

export const useExpenseRouting = () => {
  const route = useRoute()
  const router = useRouter()

  const updateQuery = (updates: Record<string, string | string[] | undefined>) => {
    const query = { ...route.query, ...updates }
    
    // Remove undefined or empty values
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '' || query[key] === null) {
        delete query[key]
      }
    })
    
    router.push({ query })
  }

  const clearQuery = () => {
    router.push({ query: {} })
  }

  const getQueryFilters = (): ExpenseFilter => {
    return {
      startDate: route.query.startDate as string,
      endDate: route.query.endDate as string,
      category: route.query.category as string,
      caseId: route.query.caseId as string,
      tagIds: Array.isArray(route.query.tagIds) 
        ? route.query.tagIds as string[]
        : route.query.tagIds 
          ? [route.query.tagIds as string] 
          : undefined,
      sortBy: (route.query.sortBy as 'date' | 'category' | 'description' | 'balance') || 'date',
      sortOrder: (route.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
      searchQuery: route.query.searchQuery as string
    }
  }

  const getPagination = () => {
    return {
      page: parseInt(route.query.page as string) || 1,
      limit: parseInt(route.query.limit as string) || 20
    }
  }

  const setFilters = (filters: Partial<ExpenseFilter>) => {
    const query: Record<string, string | string[] | undefined> = { ...route.query }
    
    // Update filter values
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        delete query[key]
      } else if (Array.isArray(value)) {
        query[key] = value.length > 0 ? value : undefined
      } else {
        query[key] = value
      }
    })
    
    // Reset to page 1 when filters change
    query.page = '1'
    
    router.push({ query })
  }

  const setPagination = (page: number, limit?: number) => {
    const query = { ...route.query }
    
    query.page = page.toString()
    if (limit) {
      query.limit = limit.toString()
    }
    
    router.push({ query })
  }

  const buildExpenseDetailUrl = (expenseId: string, action?: 'edit' | 'attachments') => {
    const basePath = `/expenses/${expenseId}`
    return action ? `${basePath}/${action}` : basePath
  }

  const navigateToExpense = (expenseId: string, action?: 'edit' | 'attachments') => {
    return navigateTo(buildExpenseDetailUrl(expenseId, action))
  }

  const navigateToNewExpense = () => {
    return navigateTo('/expenses/new')
  }

  const navigateToImport = () => {
    return navigateTo('/expenses/import')
  }

  const navigateToReports = (params?: { 
    period?: string, 
    groupBy?: string,
    startDate?: string,
    endDate?: string 
  }) => {
    const query: Record<string, string> = {}
    
    if (params?.period) query.period = params.period
    if (params?.groupBy) query.group_by = params.groupBy
    if (params?.startDate) query.start_date = params.startDate
    if (params?.endDate) query.end_date = params.endDate
    
    return navigateTo({ 
      path: '/expenses/reports',
      query 
    })
  }

  return {
    updateQuery,
    clearQuery,
    getQueryFilters,
    getPagination,
    setFilters,
    setPagination,
    buildExpenseDetailUrl,
    navigateToExpense,
    navigateToNewExpense,
    navigateToImport,
    navigateToReports
  }
}