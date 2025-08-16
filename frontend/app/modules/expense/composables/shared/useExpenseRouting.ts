import type { IExpenseFilters } from '~/modules/expense/types'

export const useExpenseRouting = () => {
  const route = useRoute()
  const router = useRouter()

  const updateQuery = (updates: Record<string, string | string[] | undefined>) => {
    const query: Record<string, string | string[]> = {}
    
    // Copy existing query params
    Object.entries(route.query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query[key] = value as string | string[]
      }
    })
    
    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        query[key] = value
      }
    })
    
    // Filter out undefined or empty values
    const cleanQuery = Object.fromEntries(
      Object.entries(query).filter(([_, value]) => 
        value !== undefined && value !== '' && value !== null
      )
    )
    
    router.push({ query: cleanQuery })
  }

  const clearQuery = () => {
    router.push({ query: {} })
  }

  const getQueryFilters = (): IExpenseFilters => {
    return {
      dateFrom: route.query.dateFrom as string,
      dateTo: route.query.dateTo as string,
      searchTerm: route.query.searchTerm as string,
      amountMin: route.query.amountMin ? Number(route.query.amountMin) : undefined,
      amountMax: route.query.amountMax ? Number(route.query.amountMax) : undefined,
      categories: Array.isArray(route.query.categories) 
        ? route.query.categories as string[]
        : route.query.categories 
          ? [route.query.categories as string] 
          : undefined,
      caseIds: Array.isArray(route.query.caseIds) 
        ? route.query.caseIds as string[]
        : route.query.caseIds 
          ? [route.query.caseIds as string] 
          : undefined,
      tagIds: Array.isArray(route.query.tagIds) 
        ? route.query.tagIds as string[]
        : route.query.tagIds 
          ? [route.query.tagIds as string] 
          : undefined
    }
  }

  const getPagination = () => {
    return {
      page: parseInt(route.query.page as string) || 1,
      limit: parseInt(route.query.limit as string) || 20
    }
  }

  const setFilters = (filters: Partial<IExpenseFilters>) => {
    const query: Record<string, string | string[]> = {}
    
    // Copy existing query params
    Object.entries(route.query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query[key] = value as string | string[]
      }
    })
    
    // Update filter values  
    const updates: Record<string, string | string[]> = {}
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            updates[key] = value
          }
        } else {
          // Type-safe string conversion with validation
          const stringValue = typeof value === 'string' ? value : String(value)
          if (stringValue.trim()) {
            updates[key] = stringValue
          }
        }
      }
    })
    
    // Add existing query params that are not being updated
    Object.entries(query).forEach(([key, value]) => {
      if (!(key in filters) && value !== undefined) {
        updates[key] = value
      }
    })
    
    // Reset to page 1 when filters change
    updates.page = '1'
    
    const cleanQuery = updates
    
    router.push({ query: cleanQuery })
  }

  const setPagination = (page: number, limit?: number) => {
    const query: Record<string, string | string[]> = {}
    
    // Copy existing query params
    Object.entries(route.query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query[key] = value as string | string[]
      }
    })
    
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