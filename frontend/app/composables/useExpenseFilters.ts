import { ref, computed, watch, readonly } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { IExpenseFilter, IExpense } from '~/types/expense'

interface IExpenseFilterOptions {
  debounceMs?: number
  onFiltersChange?: (filters: IExpenseFilter) => void
  enableUrlSync?: boolean
  enableLocalStorage?: boolean
  storageKey?: string
}

interface IDatePreset {
  key: string
  label: string
  getValue: () => { startDate: string; endDate: string }
}

interface IFilterStats {
  totalMatched: number
  totalIncome: number
  totalExpense: number
  netBalance: number
  categoryBreakdown: Array<{
    category: string
    count: number
    totalAmount: number
  }>
}

export function useExpenseFilters(
  initialFilters: IExpenseFilter = {},
  options: IExpenseFilterOptions = {}
) {
  const {
    debounceMs = 300,
    onFiltersChange,
    enableUrlSync = true,
    enableLocalStorage = false,
    storageKey = 'expense-filters'
  } = options

  // Core state
  const filters = ref<IExpenseFilter>({ ...initialFilters })
  const isLoading = ref(false)
  const lastAppliedFilters = ref<IExpenseFilter>({})

  // Router and route (only if URL sync is enabled)
  const route = enableUrlSync ? useRoute() : null
  const router = enableUrlSync ? useRouter() : null

  // Date presets
  const datePresets: IDatePreset[] = [
    {
      key: 'today',
      label: '今日',
      getValue: () => {
        const today = new Date().toISOString().split('T')[0]!
        return { startDate: today, endDate: today }
      }
    },
    {
      key: 'thisWeek',
      label: '今週',
      getValue: () => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const monday = new Date(now.setDate(diff))
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        
        return {
          startDate: monday.toISOString().split('T')[0]!,
          endDate: sunday.toISOString().split('T')[0]!
        }
      }
    },
    {
      key: 'thisMonth',
      label: '今月',
      getValue: () => {
        const now = new Date()
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]!,
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]!
        }
      }
    },
    {
      key: 'lastMonth',
      label: '前月',
      getValue: () => {
        const now = new Date()
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]!,
          endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]!
        }
      }
    },
    {
      key: 'thisQuarter',
      label: '今四半期',
      getValue: () => {
        const now = new Date()
        const quarter = Math.floor(now.getMonth() / 3)
        return {
          startDate: new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]!,
          endDate: new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0]!
        }
      }
    },
    {
      key: 'thisYear',
      label: '今年',
      getValue: () => {
        const now = new Date()
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]!,
          endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]!
        }
      }
    },
    {
      key: 'lastYear',
      label: '昨年',
      getValue: () => {
        const now = new Date()
        return {
          startDate: new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0]!,
          endDate: new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0]!
        }
      }
    }
  ]

  // Computed properties
  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.startDate ||
      filters.value.endDate ||
      filters.value.category ||
      filters.value.caseId ||
      filters.value.tagIds?.length ||
      filters.value.searchQuery ||
      filters.value.minAmount ||
      filters.value.maxAmount ||
      (filters.value.balanceType && filters.value.balanceType !== 'all') ||
      filters.value.hasMemo ||
      filters.value.hasAttachments
    )
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.startDate || filters.value.endDate) count++
    if (filters.value.category) count++
    if (filters.value.caseId) count++
    if (filters.value.tagIds?.length) count++
    if (filters.value.searchQuery) count++
    if (filters.value.minAmount || filters.value.maxAmount) count++
    if (filters.value.balanceType && filters.value.balanceType !== 'all') count++
    if (filters.value.hasMemo) count++
    if (filters.value.hasAttachments) count++
    return count
  })

  const activeFilterSummary = computed(() => {
    const summary = []
    
    if (filters.value.startDate && filters.value.endDate) {
      const preset = datePresets.find(p => {
        const range = p.getValue()
        return range.startDate === filters.value.startDate && range.endDate === filters.value.endDate
      })
      
      summary.push({
        key: 'dateRange',
        label: preset?.label || `${formatDate(filters.value.startDate)} - ${formatDate(filters.value.endDate)}`
      })
    } else if (filters.value.startDate) {
      summary.push({
        key: 'startDate',
        label: `開始: ${formatDate(filters.value.startDate)}`
      })
    } else if (filters.value.endDate) {
      summary.push({
        key: 'endDate',
        label: `終了: ${formatDate(filters.value.endDate)}`
      })
    }
    
    if (filters.value.category) {
      summary.push({
        key: 'category',
        label: `カテゴリ: ${filters.value.category}`
      })
    }
    
    if (filters.value.searchQuery) {
      summary.push({
        key: 'searchQuery',
        label: `検索: "${filters.value.searchQuery}"`
      })
    }
    
    if (filters.value.minAmount || filters.value.maxAmount) {
      const min = filters.value.minAmount ? `${Number(filters.value.minAmount).toLocaleString()}円` : ''
      const max = filters.value.maxAmount ? `${Number(filters.value.maxAmount).toLocaleString()}円` : ''
      summary.push({
        key: 'amountRange',
        label: `金額: ${min}${min && max ? ' - ' : ''}${max}`
      })
    }
    
    if (filters.value.caseId) {
      summary.push({
        key: 'caseId',
        label: `案件: ${filters.value.caseId}`
      })
    }
    
    if (filters.value.tagIds?.length) {
      summary.push({
        key: 'tagIds',
        label: `タグ: ${filters.value.tagIds.length}個選択`
      })
    }
    
    if (filters.value.balanceType && filters.value.balanceType !== 'all') {
      const typeLabels: Record<string, string> = {
        positive: '収入',
        negative: '支出',
        zero: '収支0'
      }
      summary.push({
        key: 'balanceType',
        label: `収支: ${typeLabels[filters.value.balanceType] || filters.value.balanceType}`
      })
    }
    
    if (filters.value.hasMemo) {
      summary.push({
        key: 'hasMemo',
        label: 'メモあり'
      })
    }
    
    if (filters.value.hasAttachments) {
      summary.push({
        key: 'hasAttachments',
        label: '添付ファイルあり'
      })
    }
    
    return summary
  })

  // Debounced filter application
  const debouncedApply = useDebounceFn(() => {
    applyFilters()
  }, debounceMs)

  // Core methods
  const applyFilters = () => {
    lastAppliedFilters.value = { ...filters.value }
    
    if (onFiltersChange) {
      onFiltersChange(filters.value)
    }
    
    if (enableUrlSync) {
      syncFiltersToUrl()
    }
    
    if (enableLocalStorage) {
      saveFiltersToStorage()
    }
  }

  const resetFilters = () => {
    filters.value = {}
    debouncedApply()
  }

  const clearFilter = (filterKey: keyof IExpenseFilter | string) => {
    switch (filterKey) {
      case 'dateRange':
      case 'startDate':
      case 'endDate':
        filters.value.startDate = undefined
        filters.value.endDate = undefined
        break
      case 'searchQuery':
        filters.value.searchQuery = undefined
        break
      case 'category':
        filters.value.category = undefined
        break
      case 'caseId':
        filters.value.caseId = undefined
        break
      case 'tagIds':
        filters.value.tagIds = undefined
        break
      case 'amountRange':
        filters.value.minAmount = undefined
        filters.value.maxAmount = undefined
        break
      case 'balanceType':
        filters.value.balanceType = undefined
        break
      case 'hasMemo':
        filters.value.hasMemo = undefined
        break
      case 'hasAttachments':
        filters.value.hasAttachments = undefined
        break
      default:
        if (filterKey in filters.value) {
          const typedKey = filterKey as keyof IExpenseFilter
          // Type-safe undefined assignment
          ;(filters.value as Record<string, unknown>)[typedKey] = undefined
        }
    }
    debouncedApply()
  }

  // Date preset methods
  const applyDatePreset = (presetKey: string) => {
    const preset = datePresets.find(p => p.key === presetKey)
    if (preset) {
      const range = preset.getValue()
      filters.value.startDate = range.startDate
      filters.value.endDate = range.endDate
      debouncedApply()
    }
  }

  const isPresetActive = (presetKey: string): boolean => {
    const preset = datePresets.find(p => p.key === presetKey)
    if (!preset) return false
    
    const range = preset.getValue()
    return filters.value.startDate === range.startDate && 
           filters.value.endDate === range.endDate
  }

  // URL synchronization
  const syncFiltersToUrl = () => {
    if (!router || !route) return

    const query = Object.entries(filters.value).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          acc[key] = value.join(',')
        } else if (!Array.isArray(value)) {
          acc[key] = String(value)
        }
      }
      return acc
    }, {} as Record<string, string>)

    router.push({ 
      path: route.path,
      query 
    })
  }

  const loadFiltersFromUrl = () => {
    if (!route) return

    const query = route.query
    const urlFilters: IExpenseFilter = {}

    if (query.startDate) urlFilters.startDate = String(query.startDate)
    if (query.endDate) urlFilters.endDate = String(query.endDate)
    if (query.category) urlFilters.category = String(query.category)
    if (query.caseId) urlFilters.caseId = String(query.caseId)
    if (query.searchQuery) urlFilters.searchQuery = String(query.searchQuery)
    if (query.sortBy) urlFilters.sortBy = String(query.sortBy) as 'date' | 'category' | 'description' | 'balance' | 'amount'
    if (query.sortOrder) urlFilters.sortOrder = String(query.sortOrder) as 'ASC' | 'DESC'
    if (query.minAmount) urlFilters.minAmount = Number(query.minAmount)
    if (query.maxAmount) urlFilters.maxAmount = Number(query.maxAmount)
    if (query.balanceType) urlFilters.balanceType = String(query.balanceType)
    if (query.hasMemo) urlFilters.hasMemo = query.hasMemo === 'true'
    if (query.hasAttachments) urlFilters.hasAttachments = query.hasAttachments === 'true'
    
    if (query.tagIds) {
      const tagIds = String(query.tagIds).split(',').filter(Boolean)
      if (tagIds.length > 0) {
        urlFilters.tagIds = tagIds
      }
    }

    filters.value = { ...urlFilters }
  }

  // Local storage methods
  const saveFiltersToStorage = () => {
    if (!enableLocalStorage) return
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters.value))
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error)
    }
  }

  const loadFiltersFromStorage = () => {
    if (!enableLocalStorage) return
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsedFilters = JSON.parse(stored) as IExpenseFilter
        filters.value = { ...parsedFilters }
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error)
    }
  }

  // Filter validation
  const validateFilters = (filterValues: IExpenseFilter): string[] => {
    const errors: string[] = []
    
    if (filterValues.startDate && filterValues.endDate) {
      if (new Date(filterValues.startDate) > new Date(filterValues.endDate)) {
        errors.push('開始日は終了日より前である必要があります')
      }
    }
    
    if (filterValues.minAmount && filterValues.maxAmount) {
      if (filterValues.minAmount > filterValues.maxAmount) {
        errors.push('最小金額は最大金額より少ない必要があります')
      }
    }
    
    if (filterValues.minAmount && filterValues.minAmount < 0) {
      errors.push('最小金額は0以上である必要があります')
    }
    
    if (filterValues.maxAmount && filterValues.maxAmount < 0) {
      errors.push('最大金額は0以上である必要があります')
    }
    
    return errors
  }

  // Statistics calculation
  const calculateFilterStats = (expenses: IExpense[]): IFilterStats => {
    const totalIncome = expenses.reduce((sum, expense) => sum + expense.incomeAmount, 0)
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.expenseAmount, 0)
    const netBalance = totalIncome - totalExpense

    // Category breakdown
    const categoryMap = new Map<string, { count: number; totalAmount: number }>()
    expenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { count: 0, totalAmount: 0 }
      categoryMap.set(expense.category, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + expense.expenseAmount
      })
    })

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      totalAmount: data.totalAmount
    }))

    return {
      totalMatched: expenses.length,
      totalIncome,
      totalExpense,
      netBalance,
      categoryBreakdown
    }
  }

  // Client-side filtering (for when using mock data)
  const filterExpensesLocally = (expenses: IExpense[], filterValues: IExpenseFilter = filters.value): IExpense[] => {
    return expenses.filter(expense => {
      // Date range filter
      if (filterValues.startDate && expense.date < filterValues.startDate) return false
      if (filterValues.endDate && expense.date > filterValues.endDate) return false
      
      // Category filter
      if (filterValues.category && expense.category !== filterValues.category) return false
      
      // Case filter
      if (filterValues.caseId && expense.caseId !== filterValues.caseId) return false
      
      // Search query filter
      if (filterValues.searchQuery) {
        const query = filterValues.searchQuery.toLowerCase()
        const matchesDescription = expense.description.toLowerCase().includes(query)
        const matchesMemo = expense.memo?.toLowerCase().includes(query)
        if (!matchesDescription && !matchesMemo) return false
      }
      
      // Amount range filter
      if (filterValues.minAmount && expense.expenseAmount < filterValues.minAmount) return false
      if (filterValues.maxAmount && expense.expenseAmount > filterValues.maxAmount) return false
      
      // Balance type filter
      if (filterValues.balanceType && filterValues.balanceType !== 'all') {
        switch (filterValues.balanceType) {
          case 'positive':
            if (expense.balance <= 0) return false
            break
          case 'negative':
            if (expense.balance >= 0) return false
            break
          case 'zero':
            if (expense.balance !== 0) return false
            break
          default:
            // Handle unknown balance types gracefully
            break
        }
      }
      
      // Memo filter
      if (filterValues.hasMemo && !expense.memo) return false
      
      // Attachments filter
      if (filterValues.hasAttachments && (!expense.attachments || expense.attachments.length === 0)) return false
      
      // Tag filter
      if (filterValues.tagIds?.length) {
        const expenseTagIds = expense.tags.map(tag => tag.id)
        if (!filterValues.tagIds.some(tagId => expenseTagIds.includes(tagId))) return false
      }
      
      return true
    })
  }

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Initialize
  const initialize = () => {
    if (enableUrlSync && route) {
      loadFiltersFromUrl()
    } else if (enableLocalStorage) {
      loadFiltersFromStorage()
    }
  }

  // Watch for URL changes
  if (enableUrlSync && route) {
    watch(
      () => route.query,
      () => {
        loadFiltersFromUrl()
      },
      { immediate: true }
    )
  }

  // Initialize on mount
  initialize()

  return {
    // State
    filters: readonly(filters),
    isLoading: readonly(isLoading),
    lastAppliedFilters: readonly(lastAppliedFilters),
    
    // Computed
    hasActiveFilters,
    activeFilterCount,
    activeFilterSummary,
    datePresets,
    
    // Methods
    applyFilters,
    resetFilters,
    clearFilter,
    applyDatePreset,
    isPresetActive,
    validateFilters,
    calculateFilterStats,
    filterExpensesLocally,
    debouncedApply,
    
    // Storage methods
    saveFiltersToStorage,
    loadFiltersFromStorage,
    syncFiltersToUrl,
    loadFiltersFromUrl
  }
}