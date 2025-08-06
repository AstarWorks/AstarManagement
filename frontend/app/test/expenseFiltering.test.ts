import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useExpenseFilters } from '~/composables/useExpenseFilters'
import { mockExpenseDataService } from '~/services/mockExpenseDataService'
import type { IExpense, IExpenseFilter } from '~/types/expense'

// Mock the router composables
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn()
}

const mockRoute = {
  path: '/expenses',
  query: {},
  params: {}
}

vi.mock('#app', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Expense Filtering Integration Tests', () => {
  let testExpenses: IExpense[]

  beforeEach(async () => {
    // Reset mock service
    await mockExpenseDataService.resetDatabase()
    await mockExpenseDataService.seedDatabase(50)
    
    // Get test data
    const expenseList = mockExpenseDataService.getExpenses({ limit: 50 })
    testExpenses = expenseList.items

    // Clear mocks
    vi.clearAllMocks()
    mockRoute.query = {}
  })

  describe('useExpenseFilters Composable', () => {
    it('should initialize with empty filters', () => {
      const { filters, hasActiveFilters, activeFilterCount } = useExpenseFilters()
      
      expect(filters.value).toEqual({})
      expect(hasActiveFilters.value).toBe(false)
      expect(activeFilterCount.value).toBe(0)
    })

    it('should apply date range filters correctly', () => {
      const onFiltersChange = vi.fn()
      const { filters, applyDatePreset } = useExpenseFilters(
        {},
        { onFiltersChange, debounceMs: 0 }
      )

      applyDatePreset('thisMonth')

      expect(filters.value.startDate).toBeDefined()
      expect(filters.value.endDate).toBeDefined()
      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String)
        })
      )
    })

    it('should validate filter inputs correctly', () => {
      const { validateFilters } = useExpenseFilters()

      // Test valid filters
      const validFilters: IExpenseFilter = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        minAmount: 100,
        maxAmount: 1000
      }
      expect(validateFilters(validFilters)).toEqual([])

      // Test invalid date range
      const invalidDateFilters: IExpenseFilter = {
        startDate: '2024-12-31',
        endDate: '2024-01-01'
      }
      const dateErrors = validateFilters(invalidDateFilters)
      expect(dateErrors).toContain('開始日は終了日より前である必要があります')

      // Test invalid amount range
      const invalidAmountFilters: IExpenseFilter = {
        minAmount: 1000,
        maxAmount: 100
      }
      const amountErrors = validateFilters(invalidAmountFilters)
      expect(amountErrors).toContain('最小金額は最大金額より少ない必要があります')

      // Test negative amounts
      const negativeAmountFilters: IExpenseFilter = {
        minAmount: -100
      }
      const negativeErrors = validateFilters(negativeAmountFilters)
      expect(negativeErrors).toContain('最小金額は0以上である必要があります')
    })

    it('should calculate filter statistics correctly', () => {
      const { calculateFilterStats } = useExpenseFilters()

      const stats = calculateFilterStats(testExpenses)

      expect(stats.totalMatched).toBe(testExpenses.length)
      expect(stats.totalIncome).toBeGreaterThanOrEqual(0)
      expect(stats.totalExpense).toBeGreaterThanOrEqual(0)
      expect(stats.netBalance).toBe(stats.totalIncome - stats.totalExpense)
      expect(stats.categoryBreakdown).toBeInstanceOf(Array)
      expect(stats.categoryBreakdown.length).toBeGreaterThan(0)
    })

    it('should perform client-side filtering correctly', () => {
      const { filterExpensesLocally } = useExpenseFilters()

      // Test category filter
      const categoryFilter: IExpenseFilter = { category: '交通費' }
      const categoryFiltered = filterExpensesLocally(testExpenses, categoryFilter)
      expect(categoryFiltered.every(expense => expense.category === '交通費')).toBe(true)

      // Test date range filter
      const dateFilter: IExpenseFilter = {
        startDate: '2024-06-01',
        endDate: '2024-06-30'
      }
      const dateFiltered = filterExpensesLocally(testExpenses, dateFilter)
      expect(dateFiltered.every(expense => 
        expense.date >= '2024-06-01' && expense.date <= '2024-06-30'
      )).toBe(true)

      // Test search filter
      const searchFilter: IExpenseFilter = { searchQuery: '移動' }
      const searchFiltered = filterExpensesLocally(testExpenses, searchFilter)
      expect(searchFiltered.every(expense => 
        expense.description.includes('移動') || 
        (expense.memo && expense.memo.includes('移動'))
      )).toBe(true)

      // Test amount range filter
      const amountFilter: IExpenseFilter = { minAmount: 1000, maxAmount: 2000 }
      const amountFiltered = filterExpensesLocally(testExpenses, amountFilter)
      expect(amountFiltered.every(expense => 
        expense.expenseAmount >= 1000 && expense.expenseAmount <= 2000
      )).toBe(true)

      // Test balance type filter
      const positiveBalanceFilter: IExpenseFilter = { balanceType: 'positive' }
      const positiveFiltered = filterExpensesLocally(testExpenses, positiveBalanceFilter)
      expect(positiveFiltered.every(expense => expense.balance > 0)).toBe(true)

      const negativeBalanceFilter: IExpenseFilter = { balanceType: 'negative' }
      const negativeFiltered = filterExpensesLocally(testExpenses, negativeBalanceFilter)
      expect(negativeFiltered.every(expense => expense.balance < 0)).toBe(true)

      const zeroBalanceFilter: IExpenseFilter = { balanceType: 'zero' }
      const zeroFiltered = filterExpensesLocally(testExpenses, zeroBalanceFilter)
      expect(zeroFiltered.every(expense => expense.balance === 0)).toBe(true)
    })

    it('should clear individual filters correctly', () => {
      const onFiltersChange = vi.fn()
      const { filters, clearFilter, hasActiveFilters } = useExpenseFilters(
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          category: '交通費',
          searchQuery: 'test'
        },
        { onFiltersChange, debounceMs: 0 }
      )

      expect(hasActiveFilters.value).toBe(true)

      // Clear date range
      clearFilter('dateRange')
      expect(filters.value.startDate).toBeUndefined()
      expect(filters.value.endDate).toBeUndefined()

      // Clear category
      clearFilter('category')
      expect(filters.value.category).toBeUndefined()

      // Clear search
      clearFilter('searchQuery')
      expect(filters.value.searchQuery).toBeUndefined()

      expect(hasActiveFilters.value).toBe(false)
    })

    it('should generate active filter summary correctly', () => {
      const { activeFilterSummary } = useExpenseFilters({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        category: '交通費',
        searchQuery: 'テスト',
        minAmount: 100,
        maxAmount: 1000
      })

      const summary = activeFilterSummary.value
      expect(summary).toContain(
        expect.objectContaining({ key: 'dateRange' })
      )
      expect(summary).toContain(
        expect.objectContaining({ key: 'category', label: 'カテゴリ: 交通費' })
      )
      expect(summary).toContain(
        expect.objectContaining({ key: 'searchQuery', label: '検索: "テスト"' })
      )
      expect(summary).toContain(
        expect.objectContaining({ key: 'amountRange', label: '金額: 100円 - 1,000円' })
      )
    })

    it('should handle URL synchronization', () => {
      mockRoute.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        category: '交通費'
      }

      const { filters, syncFiltersToUrl } = useExpenseFilters(
        {},
        { enableUrlSync: true }
      )

      // Test loading from URL
      expect(filters.value.startDate).toBe('2024-01-01')
      expect(filters.value.endDate).toBe('2024-01-31')
      expect(filters.value.category).toBe('交通費')

      // Test syncing to URL (need to modify through internal ref)
      const internalFilters = filters as any
      internalFilters.value.searchQuery = 'テスト'
      syncFiltersToUrl()

      expect(mockRouter.push).toHaveBeenCalledWith({
        path: '/expenses',
        query: expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          category: '交通費',
          searchQuery: 'テスト'
        })
      })
    })

    it('should handle local storage persistence', () => {
      const storageKey = 'test-expense-filters'
      const initialFilters = { category: '交通費' }

      // Mock localStorage.getItem to return stored filters
      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialFilters))

      const { filters, saveFiltersToStorage } = useExpenseFilters(
        {},
        { enableLocalStorage: true, storageKey }
      )

      // Test loading from storage
      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey)

      // Test saving to storage
      const internalFilters = filters as any
      internalFilters.value.searchQuery = 'テスト'
      saveFiltersToStorage()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        storageKey,
        JSON.stringify(filters.value)
      )
    })
  })

  describe('Date Preset Functionality', () => {
    it('should generate correct date ranges for presets', () => {
      const { datePresets } = useExpenseFilters()

      // Test thisMonth preset
      const thisMonth = datePresets.find(p => p.key === 'thisMonth')
      expect(thisMonth).toBeDefined()

      const thisMonthRange = thisMonth!.getValue()
      const now = new Date()
      const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0]
      const expectedEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split('T')[0]

      expect(thisMonthRange.startDate).toBe(expectedStart)
      expect(thisMonthRange.endDate).toBe(expectedEnd)

      // Test thisYear preset
      const thisYear = datePresets.find(p => p.key === 'thisYear')
      expect(thisYear).toBeDefined()

      const thisYearRange = thisYear!.getValue()
      const expectedYearStart = new Date(now.getFullYear(), 0, 1)
        .toISOString().split('T')[0]
      const expectedYearEnd = new Date(now.getFullYear(), 11, 31)
        .toISOString().split('T')[0]

      expect(thisYearRange.startDate).toBe(expectedYearStart)
      expect(thisYearRange.endDate).toBe(expectedYearEnd)
    })

    it('should correctly identify active presets', () => {
      const { isPresetActive, applyDatePreset } = useExpenseFilters()

      // Apply a preset
      applyDatePreset('thisMonth')

      // Check if preset is active
      expect(isPresetActive('thisMonth')).toBe(true)
      expect(isPresetActive('lastMonth')).toBe(false)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => 
        mockExpenseDataService.generateExpense({ id: `expense-${i}` })
      )

      const { filterExpensesLocally } = useExpenseFilters()

      const startTime = performance.now()
      const filtered = filterExpensesLocally(largeDataset, { category: '交通費' })
      const endTime = performance.now()

      // Should complete within reasonable time (100ms for 10k items)
      expect(endTime - startTime).toBeLessThan(100)
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every(expense => expense.category === '交通費')).toBe(true)
    })

    it('should handle empty datasets gracefully', () => {
      const { filterExpensesLocally, calculateFilterStats } = useExpenseFilters()

      const emptyFiltered = filterExpensesLocally([], { category: '交通費' })
      expect(emptyFiltered).toEqual([])

      const emptyStats = calculateFilterStats([])
      expect(emptyStats.totalMatched).toBe(0)
      expect(emptyStats.totalIncome).toBe(0)
      expect(emptyStats.totalExpense).toBe(0)
      expect(emptyStats.netBalance).toBe(0)
      expect(emptyStats.categoryBreakdown).toEqual([])
    })

    it('should handle invalid filter values gracefully', () => {
      const { filterExpensesLocally } = useExpenseFilters()

      // Test with undefined/null values
      const invalidFilters: IExpenseFilter = {
        startDate: undefined,
        endDate: null as any,
        category: '',
        searchQuery: undefined,
        minAmount: NaN,
        maxAmount: undefined
      }

      const filtered = filterExpensesLocally(testExpenses, invalidFilters)
      expect(filtered).toEqual(testExpenses) // Should return all items when filters are invalid
    })

    it('should debounce filter changes correctly', () => {
      return new Promise<void>((done) => {
        const onFiltersChange = vi.fn()
        const { filters, debouncedApply } = useExpenseFilters(
          {},
          { onFiltersChange, debounceMs: 50 }
        )

        // Make multiple rapid changes (using internal ref access)
        const internalFilters = filters as any
        internalFilters.value.category = '交通費'
        debouncedApply()
        internalFilters.value.searchQuery = 'テスト'
        debouncedApply()
        internalFilters.value.minAmount = 100
        debouncedApply()

        // Should not be called immediately
        expect(onFiltersChange).not.toHaveBeenCalled()

        // Should be called after debounce period
        setTimeout(() => {
          expect(onFiltersChange).toHaveBeenCalledTimes(1)
          expect(onFiltersChange).toHaveBeenCalledWith(
            expect.objectContaining({
              category: '交通費',
              searchQuery: 'テスト',
              minAmount: 100
            })
          )
          done()
        }, 100)
      })
    })
  })

  describe('Complex Filter Combinations', () => {
    it('should handle multiple filters simultaneously', () => {
      const { filterExpensesLocally } = useExpenseFilters()

      const complexFilter: IExpenseFilter = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        category: '交通費',
        minAmount: 500,
        maxAmount: 2000,
        balanceType: 'negative'
      }

      const filtered = filterExpensesLocally(testExpenses, complexFilter)

      expect(filtered.every(expense => 
        expense.date >= '2024-01-01' &&
        expense.date <= '2024-12-31' &&
        expense.category === '交通費' &&
        expense.expenseAmount >= 500 &&
        expense.expenseAmount <= 2000 &&
        expense.balance < 0
      )).toBe(true)
    })

    it('should maintain filter state consistency', () => {
      const { filters, applyDatePreset, clearFilter, resetFilters } = useExpenseFilters()

      // Apply multiple filters
      applyDatePreset('thisMonth')
      const internalFilters = filters as any
      internalFilters.value.category = '交通費'
      internalFilters.value.searchQuery = 'テスト'

      // Clear one filter
      clearFilter('category')
      expect(filters.value.category).toBeUndefined()
      expect(filters.value.startDate).toBeDefined()
      expect(filters.value.searchQuery).toBe('テスト')

      // Reset all filters
      resetFilters()
      expect(filters.value).toEqual({})
    })
  })
})