import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ExpenseDataTableContainer from './ExpenseDataTableContainer.vue'
import type { IExpenseWithBalance, IExpenseCase } from '@expense/types/expense'

// interface IUnusedExtendedExpense extends IExpenseWithBalance {
//   case?: IExpenseCase
// }

// Mock child components
vi.mock('./ExpenseTableToolbar.vue', () => ({
  default: {
    name: 'ExpenseTableToolbar',
    template: '<div class="mock-toolbar"></div>'
  }
}))

vi.mock('./ExpenseTableHeader.vue', () => ({
  default: {
    name: 'ExpenseTableHeader',
    template: '<thead class="mock-header"><tr><th>Mock Header</th></tr></thead>'
  }
}))

vi.mock('./ExpenseTableRow.vue', () => ({
  default: {
    name: 'ExpenseTableRow',
    template: '<tr class="mock-row"><td>{{ expense.id }}</td></tr>',
    props: ['expense', 'isSelected', 'isColumnVisible']
  }
}))

vi.mock('./ExpenseTableEmpty.vue', () => ({
  default: {
    name: 'ExpenseTableEmpty',
    template: '<div class="mock-empty">No expenses</div>'
  }
}))

// Mock composables
vi.mock('@shared/composables/table/useTableSelection', () => ({
  useTableSelection: vi.fn(() => ({
    selectedIds: { value: [] },
    selectedCount: { value: 0 },
    isAllSelected: { value: false },
    isPartiallySelected: { value: false },
    isSelected: vi.fn(() => false),
    toggleSelection: vi.fn(),
    toggleSelectAll: vi.fn()
  }))
}))

vi.mock('@shared/composables/table/useTableSorting', () => ({
  useTableSorting: vi.fn(() => ({
    isSortedBy: vi.fn(() => false),
    getSortIcon: vi.fn(() => 'sort'),
    getSortableHeaderClass: vi.fn(() => 'sortable'),
    handleSort: vi.fn()
  }))
}))

vi.mock('@shared/composables/table/useTableColumns', () => ({
  useTableColumns: vi.fn(() => ({
    columnConfig: [],
    visibleColumns: [
      { key: 'date', label: 'expense.table.columns.date' },
      { key: 'description', label: 'expense.table.columns.description' }
    ],
    isColumnVisible: vi.fn(() => true),
    toggleColumn: vi.fn()
  }))
}))

vi.mock('@expense/composables/shared/useExpenseFormatters', () => ({
  useExpenseFormatters: vi.fn(() => ({
    formatCurrency: vi.fn((amount: number) => `¥${amount}`),
    formatDate: vi.fn((date: string) => new Date(date).toLocaleDateString()),
    getCategoryBadgeClass: vi.fn(() => 'badge-class')
  }))
}))

// Mock i18n
const mockT = vi.fn((key: string) => key)
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT
  })
}))

describe('ExpenseDataTableContainer', () => {
  const createMockExpense = (id: string): IExpenseWithBalance & { case?: IExpenseCase } => ({
    id,
    date: '2024-01-15',
    description: `Expense ${id}`,
    category: 'transportation',
    expenseAmount: 1000,
    incomeAmount: 0,
    balance: -1000,
    memo: `Memo for ${id}`,
    attachmentIds: [],
    tagIds: [],
    tags: [],
    caseId: 'case-1',
    case: { id: 'case-1', name: 'Case 1', clientName: 'Client 1', status: 'active' as const },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: 'user-1',
    tenantId: 'tenant-1'
  })

  const defaultProps = {
    expenses: [],
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC' as const,
    selectedIds: [],
    pageSize: 20,
    currentPage: 1,
    totalItems: 0
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the component with table structure', () => {
      const wrapper = mount(ExpenseDataTableContainer, {
        props: defaultProps,
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      expect(wrapper.find('.expense-data-table').exists()).toBe(true)
      expect(wrapper.find('.table-container').exists()).toBe(true)
      expect(wrapper.find('.mobile-view').exists()).toBe(true)
    })

    it('should render expense rows when data is provided', async () => {
      const expenses = [
        createMockExpense('1'),
        createMockExpense('2'),
        createMockExpense('3')
      ]

      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      await nextTick()
      
      const rows = wrapper.findAll('.mock-row')
      expect(rows).toHaveLength(3)
    })

    it('should show loading skeletons when loading prop is true', async () => {
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          loading: true,
          pageSize: 5
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: { template: '<div class="skeleton"></div>' },
            Badge: true,
            Checkbox: true
          }
        }
      })

      await nextTick()
      
      const skeletons = wrapper.findAll('.skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should show empty state when no expenses', async () => {
      const wrapper = mount(ExpenseDataTableContainer, {
        props: defaultProps,
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      await nextTick()
      
      expect(wrapper.find('.mock-empty').exists()).toBe(true)
    })
  })

  describe('Selection functionality', () => {
    it('should emit selectionChange when selection changes', async () => {
      const expenses = [createMockExpense('1')]
      
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      // Trigger selection through the composable mock
      const { useTableSelection } = await import('@shared/composables/table/useTableSelection')
      const mockUseTableSelection = vi.mocked(useTableSelection)
      
      // Get the emit function passed to the composable
      const calls = mockUseTableSelection.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      
      const emitFn = calls[0]?.[2]
      if (emitFn) {
        emitFn('update:selectedIds', ['1'])
        await nextTick()
        
        expect(wrapper.emitted('selectionChange')).toBeTruthy()
        expect(wrapper.emitted('selectionChange')?.[0]).toEqual([['1']])
      }
    })
  })

  describe('Sorting functionality', () => {
    it('should emit sortChange when sort is triggered', async () => {
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses: [createMockExpense('1')]
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      // Get the sort handler from the composable mock
      const { useTableSorting } = await import('@shared/composables/table/useTableSorting')
      const mockUseTableSorting = vi.mocked(useTableSorting)
      
      const calls = mockUseTableSorting.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      
      const emitFn = calls[0]?.[1]
      if (emitFn) {
        emitFn('sortChange', { sortBy: 'date', sortOrder: 'ASC' })
        await nextTick()
        
        expect(wrapper.emitted('sortChange')).toBeTruthy()
        expect(wrapper.emitted('sortChange')?.[0]).toEqual([
          { sortBy: 'date', sortOrder: 'ASC' }
        ])
      }
    })
  })

  describe('Row interactions', () => {
    it('should emit rowClick when row is clicked', async () => {
      const expense = createMockExpense('1')
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses: [expense]
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      // Find and trigger the ExpenseTableRow component
      const row = wrapper.findComponent({ name: 'ExpenseTableRow' })
      row.vm.$emit('click', expense)
      
      await nextTick()
      
      expect(wrapper.emitted('rowClick')).toBeTruthy()
      expect(wrapper.emitted('rowClick')?.[0]).toEqual([expense])
    })

    it('should emit view event when view action is triggered', async () => {
      const expense = createMockExpense('1')
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses: [expense]
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      const row = wrapper.findComponent({ name: 'ExpenseTableRow' })
      row.vm.$emit('view', expense)
      
      await nextTick()
      
      expect(wrapper.emitted('view')).toBeTruthy()
      expect(wrapper.emitted('view')?.[0]).toEqual([expense])
    })

    it('should emit edit event when edit action is triggered', async () => {
      const expense = createMockExpense('1')
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses: [expense]
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      const row = wrapper.findComponent({ name: 'ExpenseTableRow' })
      row.vm.$emit('edit', expense)
      
      await nextTick()
      
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')?.[0]).toEqual([expense])
    })

    it('should emit delete event when delete action is triggered', async () => {
      const expense = createMockExpense('1')
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses: [expense]
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      const row = wrapper.findComponent({ name: 'ExpenseTableRow' })
      row.vm.$emit('delete', expense)
      
      await nextTick()
      
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')?.[0]).toEqual([expense])
    })
  })

  describe('Pagination', () => {
    it('should calculate pagination info correctly', () => {
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          currentPage: 2,
          pageSize: 10,
          totalItems: 45
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      // Access the computed property through the component instance
      const vm = wrapper.vm as any
      expect(vm.paginationInfo).toBe('11-20 / 45 件')
    })

    it('should handle last page pagination correctly', () => {
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          currentPage: 5,
          pageSize: 10,
          totalItems: 45
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      const vm = wrapper.vm as any
      expect(vm.paginationInfo).toBe('41-45 / 45 件')
    })
  })

  describe('Bulk operations', () => {
    it('should emit bulkEdit event with selected expenses', async () => {
      const expenses = [
        createMockExpense('1'),
        createMockExpense('2')
      ]

      // Mock the selection composable to return selected IDs
      const { useTableSelection } = await import('@shared/composables/table/useTableSelection')
      vi.mocked(useTableSelection).mockReturnValue({
        selectedIds: { value: ['1', '2'] },
        selectedCount: { value: 2 },
        isAllSelected: { value: true },
        isPartiallySelected: { value: false },
        isSelected: vi.fn((id) => ['1', '2'].includes(id)),
        toggleSelection: vi.fn(),
        toggleSelectAll: vi.fn()
      } as any)

      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses,
          selectedIds: ['1', '2']
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      // Simulate toolbar bulk edit action
      const toolbar = wrapper.findComponent({ name: 'ExpenseTableToolbar' })
      toolbar.vm.$emit('bulkEdit')
      
      await nextTick()
      
      expect(wrapper.emitted('bulkEdit')).toBeTruthy()
      expect(wrapper.emitted('bulkEdit')?.[0]).toEqual([expenses])
    })

    it('should emit bulkDelete event with selected expenses', async () => {
      const expenses = [
        createMockExpense('1'),
        createMockExpense('2')
      ]

      // Mock the selection composable
      const { useTableSelection } = await import('@shared/composables/table/useTableSelection')
      vi.mocked(useTableSelection).mockReturnValue({
        selectedIds: { value: ['1'] },
        selectedCount: { value: 1 },
        isAllSelected: { value: false },
        isPartiallySelected: { value: true },
        isSelected: vi.fn((id) => id === '1'),
        toggleSelection: vi.fn(),
        toggleSelectAll: vi.fn()
      } as any)

      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses,
          selectedIds: ['1']
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: true,
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      const toolbar = wrapper.findComponent({ name: 'ExpenseTableToolbar' })
      toolbar.vm.$emit('bulkDelete')
      
      await nextTick()
      
      expect(wrapper.emitted('bulkDelete')).toBeTruthy()
      const emittedExpenses = wrapper.emitted('bulkDelete')?.[0]?.[0] as (IExpenseWithBalance & { case?: IExpenseCase })[]
      expect(emittedExpenses).toHaveLength(1)
      expect(emittedExpenses[0]?.id).toBe('1')
    })
  })

  describe('Mobile view', () => {
    it('should render mobile cards on small screens', () => {
      const expenses = [
        createMockExpense('1'),
        createMockExpense('2')
      ]

      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: { template: '<div class="card"><slot /></div>' },
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      const mobileView = wrapper.find('.mobile-view')
      expect(mobileView.exists()).toBe(true)
      
      const cards = mobileView.findAll('.card')
      expect(cards).toHaveLength(2)
    })

    it('should emit rowClick from mobile card click', async () => {
      const expense = createMockExpense('1')
      const wrapper = mount(ExpenseDataTableContainer, {
        props: {
          ...defaultProps,
          expenses: [expense]
        },
        global: {
          stubs: {
            Icon: true,
            Table: true,
            TableBody: true,
            TableCell: true,
            TableRow: true,
            Card: { template: '<div class="card" @click="$emit(\'click\')"><slot /></div>' },
            Skeleton: true,
            Badge: true,
            Checkbox: true
          }
        }
      })

      const card = wrapper.find('.mobile-view .card')
      await card.trigger('click')
      
      expect(wrapper.emitted('rowClick')).toBeTruthy()
      expect(wrapper.emitted('rowClick')?.[0]).toEqual([expense])
    })
  })
})