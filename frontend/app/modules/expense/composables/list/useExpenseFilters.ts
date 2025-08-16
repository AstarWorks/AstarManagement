import { ref, computed, watch, readonly } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { IExpenseFilters, IExpense } from '~/modules/expense/types'

interface IExpenseFilterOptions {
  debounceMs?: number
  onFiltersChange?: (filters: IExpenseFilters) => void
  enableUrlSync?: boolean
  enableLocalStorage?: boolean
  storageKey?: string
}

interface IDatePreset {
  key: string
  label: string
  getValue: () => { dateFrom: string; dateTo: string }
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
  initialFilters: IExpenseFilters = {},
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
  const filters = ref<IExpenseFilters>({ ...initialFilters })
  const isLoading = ref(false)
  const lastAppliedFilters = ref<IExpenseFilters>({})

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
        return { dateFrom: today, dateTo: today }
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
          dateFrom: monday.toISOString().split('T')[0]!,
          dateTo: sunday.toISOString().split('T')[0]!
        }
      }
    },
    {
      key: 'thisMonth',
      label: '今月',
      getValue: () => {
        const now = new Date()
        return {
          dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]!,
          dateTo: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]!
        }
      }
    },
    {
      key: 'lastMonth',
      label: '前月',
      getValue: () => {
        const now = new Date()
        return {
          dateFrom: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]!,
          dateTo: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]!
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
          dateFrom: new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]!,
          dateTo: new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0]!
        }
      }
    },
    {
      key: 'thisYear',
      label: '今年',
      getValue: () => {
        const now = new Date()
        return {
          dateFrom: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]!,
          dateTo: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]!
        }
      }
    },
    {
      key: 'lastYear',
      label: '昨年',
      getValue: () => {
        const now = new Date()
        return {
          dateFrom: new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0]!,
          dateTo: new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0]!
        }
      }
    }
  ]

  // Computed properties
  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.dateFrom ||
      filters.value.dateTo ||
      filters.value.categories?.length ||
      filters.value.caseIds?.length ||
      filters.value.tagIds?.length ||
      filters.value.searchTerm ||
      filters.value.amountMin ||
      filters.value.amountMax
    )
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.dateFrom || filters.value.dateTo) count++
    if (filters.value.categories?.length) count++
    if (filters.value.caseIds?.length) count++
    if (filters.value.tagIds?.length) count++
    if (filters.value.searchTerm) count++
    if (filters.value.amountMin || filters.value.amountMax) count++
    return count
  })

  const activeFilterSummary = computed(() => {
    const summary = []
    
    if (filters.value.dateFrom && filters.value.dateTo) {
      const preset = datePresets.find(p => {
        const range = p.getValue()
        return range.dateFrom === filters.value.dateFrom && range.dateTo === filters.value.dateTo
      })
      
      summary.push({
        key: 'dateRange',
        label: preset?.label || `${formatDate(filters.value.dateFrom)} - ${formatDate(filters.value.dateTo)}`
      })
    } else if (filters.value.dateFrom) {
      summary.push({
        key: 'dateFrom',
        label: `開始: ${formatDate(filters.value.dateFrom)}`
      })
    } else if (filters.value.dateTo) {
      summary.push({
        key: 'dateTo',
        label: `終了: ${formatDate(filters.value.dateTo)}`
      })
    }
    
    if (filters.value.categories?.length) {
      summary.push({
        key: 'categories',
        label: `カテゴリ: ${filters.value.categories.join(', ')}`
      })
    }
    
    if (filters.value.searchTerm) {
      summary.push({
        key: 'searchTerm',
        label: `検索: "${filters.value.searchTerm}"`
      })
    }
    
    if (filters.value.amountMin || filters.value.amountMax) {
      const min = filters.value.amountMin ? `${Number(filters.value.amountMin).toLocaleString()}円` : ''
      const max = filters.value.amountMax ? `${Number(filters.value.amountMax).toLocaleString()}円` : ''
      summary.push({
        key: 'amountRange',
        label: `金額: ${min}${min && max ? ' - ' : ''}${max}`
      })
    }
    
    if (filters.value.caseIds?.length) {
      summary.push({
        key: 'caseIds',
        label: `案件: ${filters.value.caseIds.length}個選択`
      })
    }
    
    if (filters.value.tagIds?.length) {
      summary.push({
        key: 'tagIds',
        label: `タグ: ${filters.value.tagIds.length}個選択`
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

  const clearFilter = (filterKey: keyof IExpenseFilters | string) => {
    switch (filterKey) {
      case 'dateRange':
      case 'dateFrom':
      case 'dateTo':
        filters.value.dateFrom = undefined
        filters.value.dateTo = undefined
        break
      case 'searchTerm':
        filters.value.searchTerm = undefined
        break
      case 'categories':
        filters.value.categories = undefined
        break
      case 'caseIds':
        filters.value.caseIds = undefined
        break
      case 'tagIds':
        filters.value.tagIds = undefined
        break
      case 'amountRange':
      case 'amountMin':
      case 'amountMax':
        filters.value.amountMin = undefined
        filters.value.amountMax = undefined
        break
      default:
        if (filterKey in filters.value) {
          const typedKey = filterKey as keyof IExpenseFilters
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
      filters.value.dateFrom = range.dateFrom
      filters.value.dateTo = range.dateTo
      debouncedApply()
    }
  }

  const isPresetActive = (presetKey: string): boolean => {
    const preset = datePresets.find(p => p.key === presetKey)
    if (!preset) return false
    
    const range = preset.getValue()
    return filters.value.dateFrom === range.dateFrom && 
           filters.value.dateTo === range.dateTo
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
    const urlFilters: IExpenseFilters = {}

    if (query.dateFrom) urlFilters.dateFrom = String(query.dateFrom)
    if (query.dateTo) urlFilters.dateTo = String(query.dateTo)
    if (query.searchTerm) urlFilters.searchTerm = String(query.searchTerm)
    if (query.amountMin) urlFilters.amountMin = Number(query.amountMin)
    if (query.amountMax) urlFilters.amountMax = Number(query.amountMax)
    
    if (query.categories) {
      const categories = String(query.categories).split(',').filter(Boolean)
      if (categories.length > 0) {
        urlFilters.categories = categories
      }
    }
    
    if (query.caseIds) {
      const caseIds = String(query.caseIds).split(',').filter(Boolean)
      if (caseIds.length > 0) {
        urlFilters.caseIds = caseIds
      }
    }
    
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
        const parsedFilters = JSON.parse(stored) as IExpenseFilters
        filters.value = { ...parsedFilters }
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error)
    }
  }

  // Filter validation
  const validateFilters = (filterValues: IExpenseFilters): string[] => {
    const errors: string[] = []
    
    if (filterValues.dateFrom && filterValues.dateTo) {
      if (new Date(filterValues.dateFrom) > new Date(filterValues.dateTo)) {
        errors.push('開始日は終了日より前である必要があります')
      }
    }
    
    if (filterValues.amountMin && filterValues.amountMax) {
      if (filterValues.amountMin > filterValues.amountMax) {
        errors.push('最小金額は最大金額より少ない必要があります')
      }
    }
    
    if (filterValues.amountMin && filterValues.amountMin < 0) {
      errors.push('最小金額は0以上である必要があります')
    }
    
    if (filterValues.amountMax && filterValues.amountMax < 0) {
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
  const filterExpensesLocally = (expenses: IExpense[], filterValues: IExpenseFilters = filters.value): IExpense[] => {
    return expenses.filter(expense => {
      // Date range filter
      if (filterValues.dateFrom && expense.date < filterValues.dateFrom) return false
      if (filterValues.dateTo && expense.date > filterValues.dateTo) return false
      
      // Category filter
      if (filterValues.categories?.length) {
        if (!filterValues.categories.includes(expense.category)) return false
      }
      
      // Case filter
      if (filterValues.caseIds?.length) {
        if (!expense.caseId || !filterValues.caseIds.includes(expense.caseId)) return false
      }
      
      // Search query filter
      if (filterValues.searchTerm) {
        const query = filterValues.searchTerm.toLowerCase()
        const matchesDescription = expense.description.toLowerCase().includes(query)
        const matchesMemo = expense.memo?.toLowerCase().includes(query)
        if (!matchesDescription && !matchesMemo) return false
      }
      
      // Amount range filter
      if (filterValues.amountMin && expense.expenseAmount < filterValues.amountMin) return false
      if (filterValues.amountMax && expense.expenseAmount > filterValues.amountMax) return false
      
      // Tag filter
      if (filterValues.tagIds?.length) {
        const expenseTagIds = expense.tagIds || []
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