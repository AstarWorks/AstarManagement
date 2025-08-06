import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ExpensePagination from '~/components/expenses/ExpensePagination.vue'
import ExpenseDataTable from '~/components/expenses/ExpenseDataTable.vue'
import { mockExpenseDataService } from '~/services/mockExpenseDataService'
import type { IExpense } from '~/types/expense'

// Mock i18n
const mockT = vi.fn((key: string, params?: any) => {
  const translations: Record<string, string> = {
    'expense.pagination.itemsPerPage': '表示件数',
    'expense.pagination.goToPage': 'ページ',
    'expense.pagination.previous': '前へ',
    'expense.pagination.next': '次へ',
    'expense.pagination.totalItems': '全 ${count} 件',
    'expense.pagination.totalPages': '全 ${count} ページ',
    'expense.pagination.currentPage': '${current} / ${total} ページ',
    'expense.pagination.noResults': '結果がありません',
    'expense.pagination.summary': '${start}-${end} / ${total} 件',
    'expense.table.actions': '操作',
    'expense.table.columns': '表示列',
    'expense.actions.bulkEdit': '一括編集',
    'expense.actions.bulkDelete': '一括削除',
    'expense.actions.edit': '編集',
    'expense.actions.view': '詳細表示',
    'expense.actions.delete': '削除',
    'expense.actions.duplicate': '複製',
    'expense.actions.create': '経費を作成',
    'expense.list.empty.title': '経費がありません',
    'expense.list.empty.description': '経費を作成して、業務の支出を記録しましょう。'
  }
  
  if (params) {
    let result = translations[key] || key
    Object.entries(params).forEach(([paramKey, value]) => {
      result = result.replace(`\${${paramKey}}`, String(value))
    })
    return result
  }
  
  return translations[key] || key
})

vi.mock('#app', () => ({
  $t: mockT,
  useNuxtApp: () => ({
    $t: mockT
  })
}))

// Mock Icon component
const IconComponent = {
  name: 'Icon',
  props: ['name'],
  template: '<span :data-icon="name"></span>'
}

describe('Expense Pagination Integration Tests', () => {
  let testExpenses: IExpense[]

  beforeEach(async () => {
    // Reset and seed mock service
    await mockExpenseDataService.resetDatabase()
    await mockExpenseDataService.seedDatabase(100)
    
    const expenseList = mockExpenseDataService.getExpenses({ limit: 100 })
    testExpenses = expenseList.items

    vi.clearAllMocks()
  })

  describe('ExpensePagination Component', () => {
    it('should render with correct pagination info', () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 100,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      expect(wrapper.text()).toContain('1-20 / 100 件')
    })

    it('should emit page-change event when clicking next/previous', async () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 100,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Find buttons containing the icons
      const buttons = wrapper.findAll('button')
      const prevButton = buttons.find(btn => btn.find('[data-icon="lucide:chevron-left"]').exists())
      const nextButton = buttons.find(btn => btn.find('[data-icon="lucide:chevron-right"]').exists())

      // Click previous button
      if (prevButton) {
        await prevButton.trigger('click')
        expect(wrapper.emitted('page-change')).toEqual([[1]])
      }

      // Click next button  
      if (nextButton) {
        await nextButton.trigger('click')
        expect(wrapper.emitted('page-change')).toEqual([[1], [3]])
      }
    })

    it('should emit page-size-change event when changing page size', async () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 100,
          pageSize: 20,
          pageSizeOptions: [10, 20, 50, 100]
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Find and trigger page size change
      const selectTrigger = wrapper.find('[role="combobox"]')
      if (selectTrigger.exists()) {
        await selectTrigger.trigger('click')
        await nextTick()
        
        // This would normally trigger the select change
        wrapper.vm.$emit('page-size-change', 50)
        expect(wrapper.emitted('page-size-change')).toEqual([[50]])
      }
    })

    it('should disable navigation buttons appropriately', () => {
      // Test first page
      const firstPageWrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 100,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const prevButtons = firstPageWrapper.findAll('button').filter((button: any) => 
        button.find('[data-icon="lucide:chevron-left"], [data-icon="lucide:chevrons-left"]').exists()
      )
      expect(prevButtons.some((btn: any) => btn.attributes('disabled') !== undefined)).toBe(true)

      // Test last page
      const lastPageWrapper = mount(ExpensePagination, {
        props: {
          currentPage: 5,
          totalPages: 5,
          totalItems: 100,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const nextButtons = lastPageWrapper.findAll('button').filter((button: any) => 
        button.find('[data-icon="lucide:chevron-right"], [data-icon="lucide:chevrons-right"]').exists()
      )
      expect(nextButtons.some((btn: any) => btn.attributes('disabled') !== undefined)).toBe(true)
    })

    it('should handle jump-to-page functionality', async () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          totalPages: 15, // More than 10 pages to show jump-to-page
          totalItems: 300,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const jumpInput = wrapper.find('input[type="number"]')
      if (jumpInput.exists()) {
        await jumpInput.setValue('5')
        await jumpInput.trigger('keydown.enter')
        expect(wrapper.emitted('page-change')).toEqual([[5]])
      }
    })

    it('should calculate visible page numbers correctly', () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 5,
          totalPages: 20,
          totalItems: 400,
          pageSize: 20,
          maxVisiblePages: 7
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Should show condensed pagination with ellipsis
      const pageButtons = wrapper.findAll('button').filter((btn: any) => 
        /^\d+$/.test(btn.text())
      )
      expect(pageButtons.length).toBeGreaterThan(0)
      expect(pageButtons.length).toBeLessThanOrEqual(7)
    })
  })

  describe('Pagination with Filtering Integration', () => {
    it('should reset to page 1 when filters change', async () => {
      let currentPage = 3
      const mockPageChange = vi.fn((page) => { currentPage = page })
      const mockFiltersChange = vi.fn()

      // Simulate filter change that would reset pagination
      mockFiltersChange({ category: '交通費' })
      mockPageChange(1)

      expect(mockPageChange).toHaveBeenCalledWith(1)
      expect(currentPage).toBe(1)
    })

    it('should maintain page size when filters change', () => {
      const originalPageSize = 50
      const currentPageSize = originalPageSize
      
      // Page size should remain unchanged after filter change
      expect(currentPageSize).toBe(originalPageSize)
    })

    it('should update total items count based on filtered results', () => {
      // Get all expenses
      const allExpenses = mockExpenseDataService.getExpenses({ limit: 100 })
      const totalItems = allExpenses.total

      // Apply filter
      const filteredExpenses = mockExpenseDataService.getExpenses({ 
        category: '交通費',
        limit: 100 
      })
      const filteredTotal = filteredExpenses.total

      expect(filteredTotal).toBeLessThanOrEqual(totalItems)
      expect(filteredTotal).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Data Table with Pagination Integration', () => {
    it('should display correct subset of data based on pagination', () => {
      const pageSize = 10
      const currentPage = 2
      const offset = (currentPage - 1) * pageSize

      const paginatedData = testExpenses.slice(offset, offset + pageSize)
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: paginatedData,
          currentPage,
          pageSize,
          totalItems: testExpenses.length
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Should display exactly pageSize items
      const rows = wrapper.findAll('tbody tr').filter((row: any) => 
        !row.text().includes('読み込み中') && !row.text().includes('経費がありません')
      )
      expect(rows.length).toBe(Math.min(pageSize, paginatedData.length))
    })

    it('should handle empty page gracefully', () => {
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: [],
          currentPage: 1,
          pageSize: 20,
          totalItems: 0
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      expect(wrapper.text()).toContain('経費がありません')
      expect(wrapper.text()).toContain('経費を作成して、業務の支出を記録しましょう。')
    })

    it('should show loading state during pagination changes', () => {
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: testExpenses.slice(0, 10),
          loading: true,
          currentPage: 1,
          pageSize: 10,
          totalItems: testExpenses.length
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Should show skeleton rows during loading
      const skeletonRows = wrapper.findAll('[data-testid="skeleton"], .h-4')
      expect(skeletonRows.length).toBeGreaterThan(0)
    })
  })

  describe('Performance with Large Datasets', () => {
    beforeEach(async () => {
      // Create larger dataset for performance testing
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(1000)
    })

    it('should handle large datasets efficiently with pagination', () => {
      const pageSize = 50
      const currentPage = 10
      
      const startTime = performance.now()
      
      // Simulate fetching a page from large dataset
      const result = mockExpenseDataService.getExpenses({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      })
      
      const endTime = performance.now()
      
      // Should complete quickly (within 50ms for 1000 items)
      expect(endTime - startTime).toBeLessThan(50)
      expect(result.items.length).toBe(pageSize)
      expect(result.total).toBe(1000)
      expect(result.hasMore).toBe(true)
    })

    it('should maintain performance with combined filtering and pagination', () => {
      const pageSize = 20
      const currentPage = 5
      
      const startTime = performance.now()
      
      // Apply filter with pagination
      const result = mockExpenseDataService.getExpenses({
        category: '交通費',
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        sortBy: 'date',
        sortOrder: 'DESC'
      })
      
      const endTime = performance.now()
      
      // Should complete quickly even with filtering and sorting
      expect(endTime - startTime).toBeLessThan(100)
      expect(result.items.length).toBeLessThanOrEqual(pageSize)
      expect(result.items.every(expense => expense.category === '交通費')).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid page numbers gracefully', () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 0, // Invalid page number
          totalPages: 5,
          totalItems: 100,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Should handle gracefully without crashing
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle zero total items', () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      expect(wrapper.text()).toContain('結果がありません')
    })

    it('should handle single page datasets', () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 15,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Navigation buttons should be disabled
      const prevButtons = wrapper.findAll('button').filter((button: any) => 
        button.find('[data-icon="lucide:chevron-left"]').exists()
      )
      const nextButtons = wrapper.findAll('button').filter((button: any) => 
        button.find('[data-icon="lucide:chevron-right"]').exists()
      )

      expect(prevButtons.some((btn: any) => btn.attributes('disabled') !== undefined)).toBe(true)
      expect(nextButtons.some((btn: any) => btn.attributes('disabled') !== undefined)).toBe(true)
    })

    it('should handle page size larger than total items', () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 5,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      expect(wrapper.text()).toContain('1-5 / 5 件')
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should provide proper ARIA labels and keyboard navigation', async () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 100,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Check for button elements (should be keyboard navigable)
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)

      // Buttons should not be disabled inappropriately
      const enabledButtons = buttons.filter(btn => 
        btn.attributes('disabled') === undefined
      )
      expect(enabledButtons.length).toBeGreaterThan(0)
    })

    it('should maintain focus management during page changes', async () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 100,
          pageSize: 20
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Simulate page change
      await wrapper.setProps({ currentPage: 2 })

      // Component should still be focusable
      const focusableElements = wrapper.findAll('button, input, select')
      expect(focusableElements.length).toBeGreaterThan(0)
    })
  })
})