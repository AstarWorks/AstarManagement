import type { Meta, StoryObj } from '@storybook/vue3'
import ExpenseDataTableContainer from './ExpenseDataTableContainer.vue'
import type { IExpenseWithBalance, IExpenseCase } from '@expense/types/expense'
import { TagScope } from '@expense/types/expense'

interface IExtendedExpense extends IExpenseWithBalance {
  case?: IExpenseCase
}

// Generate sample expense data
const generateExpenses = (count: number): IExtendedExpense[] => {
  const categories = ['transportation', 'stampFees', 'copyFees', 'postage', 'other']
  const cases = [
    { id: 'case-1', name: '田中太郎 vs 山田花子' },
    { id: 'case-2', name: '株式会社ABC 契約書作成' },
    { id: 'case-3', name: '佐藤次郎 遺産相続' },
    { id: 'case-4', name: 'XYZ商事 債権回収' },
    { id: 'case-5', name: '鈴木一郎 離婚調停' }
  ]

  return Array.from({ length: count }, (_, i) => {
    const caseInfo = cases[i % cases.length]!
    const hasIncome = i % 5 === 0
    const expenseAmount = hasIncome ? 0 : Math.floor(Math.random() * 50000) + 500
    const incomeAmount = hasIncome ? Math.floor(Math.random() * 100000) + 10000 : 0

    return {
      id: `expense-${i + 1}`,
      date: new Date(2024, 0, (i % 28) + 1).toISOString().split('T')[0]!,
      description: `経費項目 ${i + 1} - ${hasIncome ? '入金' : categories[i % categories.length]}`,
      category: categories[i % categories.length]!,
      expenseAmount,
      incomeAmount,
      balance: incomeAmount - expenseAmount,
      memo: i % 3 === 0 ? `詳細メモ: ${i + 1}番目の経費に関する補足情報` : undefined,
      attachmentIds: i % 4 === 0 ? [`attachment-${i}`] : [],
      tagIds: i % 2 === 0 ? [`tag-${i}`] : [],
      tags: i % 2 === 0 ? [{ 
        id: `tag-${i}`, 
        tenantId: 'tenant-1',
        name: `タグ${i}`, 
        color: '#3B82F6',
        scope: TagScope.TENANT,
        usageCount: Math.floor(Math.random() * 10) + 1,
        createdAt: new Date(2024, 0, i + 1).toISOString(),
        createdBy: 'user-1'
      }] : [],
      caseId: caseInfo.id,
      case: { id: caseInfo.id, name: caseInfo.name, clientName: 'クライアント', status: 'active' as const },
      createdAt: new Date(2024, 0, i + 1).toISOString(),
      updatedAt: new Date(2024, 0, i + 1).toISOString(),
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
  })
}

const meta: Meta<typeof ExpenseDataTableContainer> = {
  title: 'Expense/Components/ExpenseDataTableContainer',
  component: ExpenseDataTableContainer,
  tags: ['autodocs'],
  argTypes: {
    expenses: {
      description: 'Array of expense records to display',
      control: { type: 'object' }
    },
    loading: {
      description: 'Whether the table is in loading state',
      control: { type: 'boolean' }
    },
    sortBy: {
      description: 'Current sort field',
      control: { type: 'select' },
      options: ['date', 'description', 'category', 'amount', 'balance']
    },
    sortOrder: {
      description: 'Sort direction',
      control: { type: 'select' },
      options: ['ASC', 'DESC']
    },
    selectedIds: {
      description: 'Array of selected expense IDs',
      control: { type: 'object' }
    },
    pageSize: {
      description: 'Number of items per page',
      control: { type: 'number' }
    },
    currentPage: {
      description: 'Current page number',
      control: { type: 'number' }
    },
    totalItems: {
      description: 'Total number of items',
      control: { type: 'number' }
    }
  },
  parameters: {
    layout: 'fullscreen'
  }
}

export default meta
type Story = StoryObj<typeof ExpenseDataTableContainer>

// Default story with sample data
export const Default: Story = {
  args: {
    expenses: generateExpenses(10),
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 20,
    currentPage: 1,
    totalItems: 10
  }
}

// Loading state story
export const Loading: Story = {
  args: {
    expenses: [],
    loading: true,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 20,
    currentPage: 1,
    totalItems: 0
  }
}

// Empty state story
export const Empty: Story = {
  args: {
    expenses: [],
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 20,
    currentPage: 1,
    totalItems: 0
  }
}

// With selected items
export const WithSelection: Story = {
  args: {
    expenses: generateExpenses(10),
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: ['expense-1', 'expense-3', 'expense-5'],
    pageSize: 20,
    currentPage: 1,
    totalItems: 10
  }
}

// Large dataset with pagination
export const LargeDataset: Story = {
  args: {
    expenses: generateExpenses(20),
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 20,
    currentPage: 3,
    totalItems: 150
  }
}

// Sorted by amount
export const SortedByAmount: Story = {
  args: {
    expenses: generateExpenses(10).sort((a, b) => b.balance - a.balance),
    loading: false,
    sortBy: 'balance',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 20,
    currentPage: 1,
    totalItems: 10
  }
}

// Mixed income and expenses
export const MixedTransactions: Story = {
  args: {
    expenses: generateExpenses(15).map((exp, i) => ({
      ...exp,
      incomeAmount: i % 3 === 0 ? Math.floor(Math.random() * 100000) + 10000 : 0,
      expenseAmount: i % 3 !== 0 ? Math.floor(Math.random() * 50000) + 500 : 0,
      balance: i % 3 === 0 
        ? Math.floor(Math.random() * 100000) + 10000 
        : -Math.floor(Math.random() * 50000) - 500
    })),
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 20,
    currentPage: 1,
    totalItems: 15
  }
}

// Mobile view simulation
export const MobileView: Story = {
  args: {
    expenses: generateExpenses(5),
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 10,
    currentPage: 1,
    totalItems: 5
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

// Interactive story with actions
export const Interactive: Story = {
  args: {
    expenses: generateExpenses(8),
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 20,
    currentPage: 1,
    totalItems: 8
  },
  render: (args) => ({
    components: { ExpenseDataTableContainer },
    setup() {
      return { args }
    },
    template: `
      <div class="p-4">
        <ExpenseDataTableContainer
          v-bind="args"
          @sortChange="handleSortChange"
          @selectionChange="handleSelectionChange"
          @rowClick="handleRowClick"
          @edit="handleEdit"
          @view="handleView"
          @delete="handleDelete"
          @duplicate="handleDuplicate"
          @bulkEdit="handleBulkEdit"
          @bulkDelete="handleBulkDelete"
          @createExpense="handleCreateExpense"
        />
      </div>
    `,
    methods: {
      handleSortChange(data: { sortBy: string; sortOrder: 'ASC' | 'DESC' }) {
        console.log('Sort changed:', data)
        alert(`Sort changed: ${data.sortBy} ${data.sortOrder}`)
      },
      handleSelectionChange(ids: string[]) {
        console.log('Selection changed:', ids)
      },
      handleRowClick(expense: IExtendedExpense) {
        console.log('Row clicked:', expense)
        alert(`Clicked: ${expense.description}`)
      },
      handleEdit(expense: IExtendedExpense) {
        console.log('Edit:', expense)
        alert(`Edit: ${expense.description}`)
      },
      handleView(expense: IExtendedExpense) {
        console.log('View:', expense)
        alert(`View: ${expense.description}`)
      },
      handleDelete(expense: IExtendedExpense) {
        console.log('Delete:', expense)
        alert(`Delete: ${expense.description}`)
      },
      handleDuplicate(expense: IExtendedExpense) {
        console.log('Duplicate:', expense)
        alert(`Duplicate: ${expense.description}`)
      },
      handleBulkEdit(expenses: IExtendedExpense[]) {
        console.log('Bulk edit:', expenses)
        alert(`Bulk edit ${expenses.length} items`)
      },
      handleBulkDelete(expenses: IExtendedExpense[]) {
        console.log('Bulk delete:', expenses)
        alert(`Bulk delete ${expenses.length} items`)
      },
      handleCreateExpense() {
        console.log('Create new expense')
        alert('Create new expense')
      }
    }
  })
}

// Performance test with large dataset
export const PerformanceTest: Story = {
  args: {
    expenses: generateExpenses(100),
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 50,
    currentPage: 1,
    totalItems: 1000
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance test with 100 visible items representing a 1000 item dataset'
      }
    }
  }
}

// All columns visible
export const AllColumnsVisible: Story = {
  args: {
    expenses: generateExpenses(5),
    loading: false,
    sortBy: 'date',
    sortOrder: 'DESC',
    selectedIds: [],
    pageSize: 20,
    currentPage: 1,
    totalItems: 5
  },
  parameters: {
    docs: {
      description: {
        story: 'All table columns are visible by default'
      }
    }
  }
}