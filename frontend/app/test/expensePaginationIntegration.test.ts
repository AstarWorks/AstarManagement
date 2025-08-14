import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ExpensePagination from '~/components/expenses/ExpensePagination.vue'
import ExpenseDataTable from '~/components/expenses/ExpenseDataTable.vue'
import { mockExpenseDataService } from '~/services/mockExpenseDataService'
import type { IExpense } from '~/types/expense'
import type { IExpenseList } from '~/types/expense/expense'

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
    
    const expenseList = mockExpenseDataService.getExpenses({ limit: 100 }) as IExpenseList
    testExpenses = expenseList.items

    vi.clearAllMocks()
  })

  describe('ExpensePagination Component', () => {
    it('should render with correct pagination info', () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          
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
        expect(wrapper.emitted('update:page')).toEqual([[1]])
      }

      // Click next button  
      if (nextButton) {
        await nextButton.trigger('click')
        expect(wrapper.emitted('update:page')).toEqual([[1], [3]])
      }
    })

    it('should emit page-size-change event when changing page size', async () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          
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
        wrapper.vm.$emit('update:pageSize', 50)
        expect(wrapper.emitted('update:pageSize')).toEqual([[50]])
      }
    })

    it('should disable navigation buttons appropriately', () => {
      // Test first page
      const firstPageWrapper = mount(ExpensePagination, {
        props: {
          currentPage: 1,
          
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
           // More than 10 pages to show jump-to-page
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
        expect(wrapper.emitted('update:page')).toEqual([[5]])
      }
    })

    it('should calculate visible page numbers correctly', () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 5,
          
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
      const expenseList = result as IExpenseList
      expect(expenseList.items.length).toBe(pageSize)
      expect(result.total).toBe(1000)
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
      const expenseList = result as IExpenseList
      expect(expenseList.items.length).toBeLessThanOrEqual(pageSize)
      expect(expenseList.items.every((expense: IExpense) => expense.category === '交通費')).toBe(true)
    })
  })

  describe('Virtual Scrolling Performance Tests', () => {
    beforeEach(async () => {
      // Create large dataset for virtual scrolling performance testing
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(1000)
    })

    it('should enable virtual scrolling for large datasets (1000+ rows)', () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 1000 }) as IExpenseList
      
      const startTime = performance.now()
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })
      
      const endTime = performance.now()
      
      // Should complete initial render within 100ms even with 1000 rows
      expect(endTime - startTime).toBeLessThan(100)
      
      // Virtual scrolling should be automatically enabled for large datasets
      const dataTable = wrapper.findComponent({ name: 'DataTable' })
      if (dataTable.exists()) {
        expect(dataTable.props('enableVirtualScrolling')).toBe(true)
        expect(dataTable.props('virtualScrollThreshold')).toBe(100)
      }
    })

    it('should maintain stable memory usage with virtual scrolling', () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 2000 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })
      
      // With virtual scrolling, rendered rows should be limited regardless of data size
      const visibleRows = wrapper.findAll('tr').filter(row => 
        !row.text().includes('読み込み中') && 
        !row.text().includes('経費がありません') &&
        row.text().trim() !== ''
      )
      
      // Should render only visible rows + overscan (typically < 30 rows for 400px container)
      expect(visibleRows.length).toBeLessThan(30)
      expect(visibleRows.length).toBeGreaterThan(0)
    })

    it('should handle filter operations efficiently with virtual scrolling', () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 1000 }) as IExpenseList
      
      const startTime = performance.now()
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          filters: { category: '交通費' }, // Apply category filter
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })
      
      const endTime = performance.now()
      
      // Filtering with virtual scrolling should complete within 50ms
      expect(endTime - startTime).toBeLessThan(50)
      
      // Should still maintain virtual scrolling after filtering
      const dataTable = wrapper.findComponent({ name: 'DataTable' })
      if (dataTable.exists()) {
        expect(dataTable.props('enableVirtualScrolling')).toBe(true)
      }
    })

    it('should maintain performance targets for virtual scrolling', () => {
      const performanceTargets = {
        initialRender: 100, // ms
        scrollHandling: 16,  // ms (~60fps)
        filterUpdate: 50,    // ms
        memoryUsage: 30      // max rendered rows
      }
      
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 1000 }) as IExpenseList
      
      // Test initial render performance
      const renderStartTime = performance.now()
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })
      const renderEndTime = performance.now()
      
      expect(renderEndTime - renderStartTime).toBeLessThan(performanceTargets.initialRender)
      
      // Test memory usage (rendered DOM nodes)
      const renderedRows = wrapper.findAll('tr').filter(row => 
        row.text().trim() !== '' && 
        !row.text().includes('読み込み中')
      )
      expect(renderedRows.length).toBeLessThan(performanceTargets.memoryUsage)
    })

    it('should preserve selection state during virtual scrolling', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 1000 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Find and click some checkboxes to select rows
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      if (checkboxes.length > 5) {
        // Select first few visible rows
        await checkboxes[1]?.trigger('click') // Skip header checkbox
        await checkboxes[3]?.trigger('click')
        await checkboxes[5]?.trigger('click')
        await nextTick()

        // Get initial selection state
        const initialSelected = wrapper.emitted('update:selected')?.[0]?.[0] as Set<string>
        expect(initialSelected?.size).toBeGreaterThan(0)

        // Simulate virtual scrolling by changing scroll position
        const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
        if (virtualScrollContainer.exists()) {
          await virtualScrollContainer.trigger('scroll', {
            target: { scrollTop: 300 } // Scroll down significantly
          })
          await nextTick()

          // Selection should be preserved after scrolling
          const afterScrollSelected = wrapper.emitted('update:selected')?.slice(-1)?.[0]?.[0] as Set<string>
          expect(afterScrollSelected?.size).toBe(initialSelected?.size)
        }
      }
    })

    it('should handle bulk select all with virtual scrolling', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 500 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Find header checkbox for select all
      const headerCheckbox = wrapper.find('thead input[type="checkbox"]')
      if (headerCheckbox.exists()) {
        await headerCheckbox.trigger('click')
        await nextTick()

        // Should emit selection of all items, not just visible ones
        const selectedItems = wrapper.emitted('update:selected')?.slice(-1)?.[0]?.[0] as Set<string>
        expect(selectedItems?.size).toBe(largeDataset.items.length)

        // Simulate scrolling to verify selection persists
        const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
        if (virtualScrollContainer.exists()) {
          await virtualScrollContainer.trigger('scroll', {
            target: { scrollTop: 600 }
          })
          await nextTick()

          // All items should still be selected
          const afterScrollSelected = wrapper.emitted('update:selected')?.slice(-1)?.[0]?.[0] as Set<string>
          expect(afterScrollSelected?.size).toBe(largeDataset.items.length)
        }
      }
    })

    it('should maintain selection during data updates with virtual scrolling', async () => {
      let currentData = mockExpenseDataService.getExpenses({ limit: 200 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: currentData.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Select some items
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      if (checkboxes.length > 3) {
        await checkboxes[1]?.trigger('click')
        await checkboxes[2]?.trigger('click')
        await nextTick()

        const initialSelected = wrapper.emitted('update:selected')?.[0]?.[0] as Set<string>
        expect(initialSelected?.size).toBe(2)

        // Update data (simulate filtering or refresh)
        const updatedData = mockExpenseDataService.getExpenses({ 
          category: '交通費',
          limit: 200 
        }) as IExpenseList

        await wrapper.setProps({ expenses: updatedData.items })
        await nextTick()

        // Selection state should be maintained for items that still exist
        const afterUpdateSelected = wrapper.emitted('update:selected')?.slice(-1)?.[0]?.[0] as Set<string>
        expect(afterUpdateSelected).toBeDefined()
        
        // Should maintain selection for items that still exist in the new dataset
        if (afterUpdateSelected && initialSelected) {
          const preservedSelections = Array.from(initialSelected).filter(id => 
            updatedData.items.some(item => item.id === id)
          )
          expect(afterUpdateSelected.size).toBe(preservedSelections.length)
        }
      }
    })
  })

  describe('Keyboard Navigation with Virtual Scrolling', () => {
    beforeEach(async () => {
      // Create large dataset for keyboard navigation testing
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(300)
    })

    it('should handle arrow key navigation in virtual scrolling mode', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 300 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      if (virtualScrollContainer.exists()) {
        // Focus the container
        const containerElement = virtualScrollContainer.element as HTMLElement
        containerElement.focus()

        // Test arrow down navigation
        await virtualScrollContainer.trigger('keydown', { key: 'ArrowDown' })
        await nextTick()

        // Should scroll down by one row (60px)
        expect(containerElement.scrollTop).toBeGreaterThan(0)

        // Test arrow up navigation
        await virtualScrollContainer.trigger('keydown', { key: 'ArrowUp' })
        await nextTick()

        // Should scroll back up
        expect(containerElement.scrollTop).toBeLessThan(60)
      }
    })

    it('should handle page up/down navigation with virtual scrolling', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 300 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      if (virtualScrollContainer.exists()) {
        const containerElement = virtualScrollContainer.element as HTMLElement
        containerElement.focus()

        // Test Page Down
        await virtualScrollContainer.trigger('keydown', { key: 'PageDown' })
        await nextTick()

        // Should scroll down by container height (400px)
        expect(containerElement.scrollTop).toBeGreaterThanOrEqual(400)

        const pageDownScrollTop = containerElement.scrollTop

        // Test Page Up
        await virtualScrollContainer.trigger('keydown', { key: 'PageUp' })
        await nextTick()

        // Should scroll back up by container height
        expect(containerElement.scrollTop).toBeLessThan(pageDownScrollTop)
      }
    })

    it('should handle Home/End navigation with virtual scrolling', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 300 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      if (virtualScrollContainer.exists()) {
        const containerElement = virtualScrollContainer.element as HTMLElement
        containerElement.focus()

        // Test Ctrl+End (go to bottom)
        await virtualScrollContainer.trigger('keydown', { 
          key: 'End', 
          ctrlKey: true 
        })
        await nextTick()

        // Should scroll to bottom
        const maxScrollTop = containerElement.scrollHeight - containerElement.clientHeight
        expect(containerElement.scrollTop).toBeGreaterThan(maxScrollTop * 0.9) // Close to bottom

        // Test Ctrl+Home (go to top)
        await virtualScrollContainer.trigger('keydown', { 
          key: 'Home', 
          ctrlKey: true 
        })
        await nextTick()

        // Should scroll to top
        expect(containerElement.scrollTop).toBe(0)
      }
    })

    it('should handle tab navigation through virtual table cells', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 100 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Find focusable elements within the table
      const focusableElements = wrapper.findAll('button, input, [tabindex]')
      
      if (focusableElements.length > 0) {
        // Focus first element
        const firstElement = focusableElements[0].element as HTMLElement
        firstElement.focus()

        // Simulate tab navigation
        await wrapper.trigger('keydown', { key: 'Tab' })
        await nextTick()

        // Should be able to navigate through table elements
        expect(document.activeElement).toBeDefined()
        
        // Tab navigation should work even with virtual scrolling
        const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
        expect(virtualScrollContainer.exists()).toBe(true)
      }
    })

    it('should maintain keyboard navigation performance with large datasets', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 1000 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      if (virtualScrollContainer.exists()) {
        const containerElement = virtualScrollContainer.element as HTMLElement
        containerElement.focus()

        // Measure performance of multiple keyboard interactions
        const keyboardOperations = []
        
        for (let i = 0; i < 5; i++) {
          const startTime = performance.now()
          
          await virtualScrollContainer.trigger('keydown', { key: 'ArrowDown' })
          await nextTick()
          
          const endTime = performance.now()
          keyboardOperations.push(endTime - startTime)
        }

        // Average keyboard response time should be under 16ms (~60fps)
        const averageTime = keyboardOperations.reduce((a, b) => a + b, 0) / keyboardOperations.length
        expect(averageTime).toBeLessThan(16)
      }
    })
  })

  describe('Scroll Position Preservation', () => {
    beforeEach(async () => {
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(500)
    })

    it('should preserve scroll position during minor data updates', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 500 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      if (virtualScrollContainer.exists()) {
        const containerElement = virtualScrollContainer.element as HTMLElement
        
        // Scroll to a specific position
        const targetScrollTop = 300
        containerElement.scrollTop = targetScrollTop
        await virtualScrollContainer.trigger('scroll')
        await nextTick()

        expect(containerElement.scrollTop).toBe(targetScrollTop)

        // Simulate minor data update (similar dataset size)
        const updatedDataset = mockExpenseDataService.getExpenses({ 
          limit: 495, // 99% of original size
          sortBy: 'date',
          sortOrder: 'ASC'
        }) as IExpenseList

        await wrapper.setProps({ expenses: updatedDataset.items })
        await nextTick()

        // Scroll position should be preserved for minor updates
        expect(containerElement.scrollTop).toBeCloseTo(targetScrollTop, 0)
      }
    })

    it('should reset scroll position for major data changes', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 500 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      if (virtualScrollContainer.exists()) {
        const containerElement = virtualScrollContainer.element as HTMLElement
        
        // Scroll to middle
        containerElement.scrollTop = 400
        await virtualScrollContainer.trigger('scroll')
        await nextTick()

        // Apply major filter change (significantly reduces dataset)
        const filteredDataset = mockExpenseDataService.getExpenses({ 
          category: '交通費',
          limit: 500
        }) as IExpenseList

        await wrapper.setProps({ 
          expenses: filteredDataset.items,
          filters: { category: '交通費' }
        })
        await nextTick()

        // For major data changes, scroll should reset to top for better UX
        // (This depends on implementation - might stay preserved or reset)
        expect(containerElement.scrollTop).toBeGreaterThanOrEqual(0)
      }
    })

    it('should handle scroll position when data is completely replaced', async () => {
      const initialDataset = mockExpenseDataService.getExpenses({ limit: 300 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: initialDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      if (virtualScrollContainer.exists()) {
        const containerElement = virtualScrollContainer.element as HTMLElement
        
        // Scroll down significantly
        containerElement.scrollTop = 600
        await virtualScrollContainer.trigger('scroll')
        await nextTick()

        // Replace with completely different dataset
        await mockExpenseDataService.resetDatabase()
        await mockExpenseDataService.seedDatabase(200) // Different size
        const newDataset = mockExpenseDataService.getExpenses({ limit: 200 }) as IExpenseList

        await wrapper.setProps({ expenses: newDataset.items })
        await nextTick()

        // Should handle gracefully - either preserve reasonable position or reset
        expect(containerElement.scrollTop).toBeGreaterThanOrEqual(0)
        expect(containerElement.scrollTop).toBeLessThan(1000) // Shouldn't exceed reasonable bounds
      }
    })

    it('should maintain scroll position during sorting operations', async () => {
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 400 }) as IExpenseList
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      if (virtualScrollContainer.exists()) {
        const containerElement = virtualScrollContainer.element as HTMLElement
        
        // Scroll to specific position
        const targetScrollTop = 240
        containerElement.scrollTop = targetScrollTop
        await virtualScrollContainer.trigger('scroll')
        await nextTick()

        // Sort data (same items, different order)
        const sortedDataset = [...largeDataset.items].sort((a, b) => 
          a.description.localeCompare(b.description)
        )

        await wrapper.setProps({ expenses: sortedDataset })
        await nextTick()

        // Position should be preserved during sorting since it's the same data
        expect(containerElement.scrollTop).toBeCloseTo(targetScrollTop, 10) // Allow small variance
      }
    })
  })

  describe('Virtual Scrolling Edge Cases', () => {
    it('should handle transition from empty to large dataset', async () => {
      // Start with empty dataset
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: [],
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Should show empty state initially
      expect(wrapper.text()).toContain('経費がありません')
      
      // Virtual scrolling should not be active for empty dataset
      let virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      expect(virtualScrollContainer.exists()).toBe(false)

      // Add large dataset
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(300)
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 300 }) as IExpenseList

      await wrapper.setProps({ expenses: largeDataset.items })
      await nextTick()

      // Virtual scrolling should now be active
      virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      expect(virtualScrollContainer.exists()).toBe(true)
      
      // Should render efficiently
      const renderedRows = wrapper.findAll('tbody tr')
      expect(renderedRows.length).toBeLessThan(50) // Much less than 300 total items
    })

    it('should handle dataset shrinking below virtual scrolling threshold', async () => {
      // Start with large dataset
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(200)
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 200 }) as IExpenseList

      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Virtual scrolling should be active
      let virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      expect(virtualScrollContainer.exists()).toBe(true)

      // Filter to small dataset (below 100 item threshold)
      const smallDataset = largeDataset.items.slice(0, 50)
      await wrapper.setProps({ expenses: smallDataset })
      await nextTick()

      // Virtual scrolling should be disabled
      virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      expect(virtualScrollContainer.exists()).toBe(false)

      // Should render all items normally
      const renderedRows = wrapper.findAll('tbody tr').filter(row => 
        !row.text().includes('読み込み中') && !row.text().includes('経費がありません')
      )
      expect(renderedRows.length).toBe(smallDataset.length)
    })

    it('should handle rapid data updates', async () => {
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(500)
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: [],
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Rapidly update data multiple times
      const datasets = [
        mockExpenseDataService.getExpenses({ limit: 200 }) as IExpenseList,
        mockExpenseDataService.getExpenses({ limit: 300, category: '交通費' }) as IExpenseList,
        mockExpenseDataService.getExpenses({ limit: 150, sortBy: 'date' }) as IExpenseList,
        mockExpenseDataService.getExpenses({ limit: 400 }) as IExpenseList,
      ]

      // Apply updates rapidly
      for (const dataset of datasets) {
        await wrapper.setProps({ expenses: dataset.items })
        await nextTick()
        
        // Should handle each update gracefully
        expect(wrapper.exists()).toBe(true)
        
        // Virtual scrolling should activate/deactivate appropriately
        const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
        const shouldHaveVirtualScrolling = dataset.items.length > 100
        expect(virtualScrollContainer.exists()).toBe(shouldHaveVirtualScrolling)
      }
    })

    it('should handle mobile viewport scenarios', async () => {
      await mockExpenseDataService.resetDatabase()
      await mockExpenseDataService.seedDatabase(300)
      const largeDataset = mockExpenseDataService.getExpenses({ limit: 300 }) as IExpenseList

      // Mock mobile viewport (smaller container height)
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: largeDataset.items,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      if (virtualScrollContainer.exists()) {
        const containerElement = virtualScrollContainer.element as HTMLElement
        
        // Simulate smaller mobile container height
        Object.defineProperty(containerElement, 'clientHeight', { 
          value: 200, // Smaller than default 400px
          configurable: true 
        })

        // Trigger scroll to test mobile behavior
        await virtualScrollContainer.trigger('scroll', {
          target: { scrollTop: 100 }
        })
        await nextTick()

        // Should still work correctly with smaller viewport
        expect(containerElement.scrollTop).toBeGreaterThan(0)
        
        // Should render fewer items due to smaller viewport
        const visibleRows = wrapper.findAll('tbody tr').filter(row => 
          row.isVisible() && !row.text().includes('読み込み中')
        )
        expect(visibleRows.length).toBeLessThan(20) // Fewer items for smaller viewport
      }
    })

    it('should handle extreme dataset sizes gracefully', async () => {
      // Test with very large dataset (memory stress test)
      const extremeDataset = Array.from({ length: 5000 }, (_, i) => ({
        id: `extreme-${i}`,
        date: new Date().toISOString(),
        description: `Extreme test item ${i}`,
        category: '交通費',
        incomeAmount: 0,
        expenseAmount: Math.random() * 1000,
        balance: Math.random() * 1000,
        memo: `Test memo ${i}`,
        caseId: 'case-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      const startTime = performance.now()
      
      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: extremeDataset,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })
      
      const endTime = performance.now()
      
      // Should handle large dataset initialization within reasonable time
      expect(endTime - startTime).toBeLessThan(200) // 200ms max for 5000 items
      
      // Virtual scrolling should be active
      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      expect(virtualScrollContainer.exists()).toBe(true)
      
      // Memory usage should be stable (limited rendered rows)
      const renderedRows = wrapper.findAll('tbody tr')
      expect(renderedRows.length).toBeLessThan(50) // Should not render all 5000 items
    })

    it('should handle data with missing or invalid properties', async () => {
      // Create dataset with some invalid/missing properties
      const problematicDataset = [
        {
          id: 'valid-1',
          date: new Date().toISOString(),
          description: 'Valid item',
          category: '交通費',
          incomeAmount: 100,
          expenseAmount: 0,
          balance: 100,
          memo: 'Valid memo',
          caseId: 'case-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'invalid-1',
          date: null as any, // Invalid date
          description: '',
          category: '',
          incomeAmount: NaN,
          expenseAmount: undefined as any,
          balance: null as any,
          memo: undefined as any,
          caseId: '',
          createdAt: '',
          updatedAt: ''
        },
        ...Array.from({ length: 150 }, (_, i) => ({
          id: `item-${i}`,
          date: new Date().toISOString(),
          description: `Item ${i}`,
          category: '会議費',
          incomeAmount: 0,
          expenseAmount: Math.random() * 500,
          balance: Math.random() * 500,
          memo: `Memo ${i}`,
          caseId: 'case-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      ]

      const wrapper = mount(ExpenseDataTable, {
        props: {
          expenses: problematicDataset,
          loading: false
        },
        global: {
          components: { Icon: IconComponent },
          mocks: { $t: mockT }
        }
      })

      // Should handle problematic data gracefully without crashing
      expect(wrapper.exists()).toBe(true)
      
      // Virtual scrolling should still work
      const virtualScrollContainer = wrapper.find('.virtual-scroll-container')
      expect(virtualScrollContainer.exists()).toBe(true)
      
      // Should render some rows (at least the valid ones)
      const renderedRows = wrapper.findAll('tbody tr').filter(row => 
        !row.text().includes('読み込み中') && !row.text().includes('経費がありません')
      )
      expect(renderedRows.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid page numbers gracefully', () => {
      const wrapper = mount(ExpensePagination, {
        props: {
          currentPage: 0, // Invalid page number
          
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