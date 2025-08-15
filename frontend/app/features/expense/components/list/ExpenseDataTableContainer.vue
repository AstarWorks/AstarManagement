<template>
  <div class="expense-data-table">
    <!-- Error Alert -->
    <Alert v-if="hasError" variant="destructive" class="mb-4">
      <AlertDescription class="flex items-center justify-between">
        <span>{{ getUserFriendlyMessage() }}</span>
        <button 
          class="ml-4 text-sm underline hover:no-underline" 
          @click="clearError"
        >
          {{ t('common.dismiss') }}
        </button>
      </AlertDescription>
    </Alert>

    <!-- Table Toolbar -->
    <ExpenseTableToolbar
      :selected-count="selectedCount"
      :columns="columnConfig"
      :pagination-info="paginationInfo"
      @bulk-edit="handleBulkEdit"
      @bulk-delete="handleBulkDelete"
      @toggle-column="toggleColumn"
    />

    <!-- Main Table Container -->
    <div 
      class="table-container border rounded-lg"
      role="region"
      :aria-label="t('expense.table.ariaLabel')"
      aria-live="polite"
    >
      <Table
        role="table"
        :aria-rowcount="totalItems"
        :aria-label="t('expense.table.description', { count: expenses.length, total: totalItems })"
      >
        <ExpenseTableHeader
          :visible-columns="visibleColumns"
          :is-all-selected="isAllSelected"
          :is-partially-selected="isPartiallySelected"
          :is-sorted-by="isSortedBy"
          :get-sort-icon="getSortIcon"
          :get-sortable-header-class="getSortableHeaderClass"
          @toggle-select-all="toggleSelectAll"
          @sort="handleSort"
        />
        
        <TableBody role="rowgroup">
          <!-- Loading Skeleton -->
          <template v-if="loading">
            <TableRow 
              v-for="i in pageSize" 
              :key="`skeleton-${i}`"
              role="row"
              :aria-label="t('expense.accessibility.loading.row', { index: i })"
            >
              <TableCell 
                v-for="j in visibleColumns.length + 2" 
                :key="j"
                role="cell"
              >
                <Skeleton class="h-4 w-full" />
              </TableCell>
            </TableRow>
          </template>
          
          <!-- Empty State -->
          <TableRow 
            v-else-if="expenses.length === 0"
            role="row"
            :aria-label="t('expense.table.empty')"
          >
            <TableCell 
              :colspan="visibleColumns.length + 2" 
              class="p-0"
              role="cell"
            >
              <ExpenseTableEmpty @create="emit('createExpense')" />
            </TableCell>
          </TableRow>
          
          <!-- Expense Rows -->
          <ExpenseTableRow
            v-for="(expense, index) in expenses"
            :key="expense.id"
            :expense="expense"
            :is-selected="isSelected(expense.id)"
            :is-column-visible="isColumnVisible"
            role="row"
            :aria-rowindex="(currentPage - 1) * pageSize + index + 1"
            :aria-label="t('expense.row.ariaLabel', { 
              description: expense.description, 
              amount: formatCurrency(Math.abs(expense.balance)),
              type: expense.balance >= 0 ? t('expense.income') : t('expense.expense')
            })"
            @click="emit('rowClick', expense)"
            @toggle-selection="toggleSelection"
            @view="handleRowAction('view', expense)"
            @edit="handleRowAction('edit', expense)"
            @duplicate="handleRowAction('duplicate', expense)"
            @delete="handleRowAction('delete', expense)"
          />
        </TableBody>
      </Table>
    </div>

    <!-- Mobile Card View (responsive fallback) -->
    <ExpenseDataTableMobile
      :expenses="expenses"
      :loading="loading"
      :page-size="pageSize"
      :is-selected="isSelected"
      @row-click="emit('rowClick', $event)"
      @toggle-selection="toggleSelection"
      @view="handleRowAction('view', $event)"
      @edit="handleRowAction('edit', $event)"
      @delete="handleRowAction('delete', $event)"
      @duplicate="handleRowAction('duplicate', $event)"
      @create-expense="emit('createExpense')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IExpenseWithBalance, IExpenseCase } from '@expense/types/expense'
import type { TableColumn } from '@shared/composables/table/useTableColumns'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@ui/table'
import { Skeleton } from '@ui/skeleton'
import { Alert, AlertDescription } from '@ui/alert'

// Import specialized composables
import { useTableSelection } from '@shared/composables/table/useTableSelection'
import { useTableSorting } from '@shared/composables/table/useTableSorting'
import { useTableColumns } from '@shared/composables/table/useTableColumns'
import { useExpenseFormatters } from '@expense/composables/shared/useExpenseFormatters'
import { useErrorBoundary } from '@shared/composables/ui/useErrorBoundary'
import { useI18n } from 'vue-i18n'

// Import child components
import ExpenseTableToolbar from './ExpenseTableToolbar.vue'
import ExpenseTableHeader from './ExpenseTableHeader.vue'
import ExpenseTableRow from './ExpenseTableRow.vue'
import ExpenseTableEmpty from './ExpenseTableEmpty.vue'
import ExpenseDataTableMobile from './ExpenseDataTableMobile.vue'

interface IExtendedExpense extends IExpenseWithBalance {
  case?: IExpenseCase
}

interface Props {
  expenses: IExtendedExpense[]
  loading?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  selectedIds?: string[]
  pageSize?: number
  currentPage?: number
  totalItems?: number
}

interface Emits {
  'sortChange': [{ sortBy: string; sortOrder: 'ASC' | 'DESC' }]
  'selectionChange': [string[]]
  'rowClick': [IExtendedExpense]
  'edit': [IExtendedExpense]
  'view': [IExtendedExpense]
  'delete': [IExtendedExpense]
  'duplicate': [IExtendedExpense]
  'bulkEdit': [IExtendedExpense[]]
  'bulkDelete': [IExtendedExpense[]]
  'createExpense': []
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortBy: 'date',
  sortOrder: 'DESC',
  selectedIds: () => [],
  pageSize: 20,
  currentPage: 1,
  totalItems: 0
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Error boundary setup
const {
  hasError,
  clearError,
  withErrorBoundary,
  getUserFriendlyMessage
} = useErrorBoundary()

// Use specialized composables for state management
const expensesRef = computed(() => props.expenses)

const {
  selectedIds,
  selectedCount,
  isAllSelected,
  isPartiallySelected,
  isSelected,
  toggleSelection,
  toggleSelectAll
} = useTableSelection(expensesRef, props.selectedIds, 
  (event, value) => emit('selectionChange', value)
)

const {
  isSortedBy,
  getSortIcon,
  getSortableHeaderClass,
  handleSort: handleSortInternal
} = useTableSorting(
  { sortBy: props.sortBy, sortOrder: props.sortOrder },
  (_event, value) => {
    if (value.sortBy) {
      emit('sortChange', { sortBy: value.sortBy, sortOrder: value.sortOrder })
    }
  }
)

// Default column configuration for expense table
const defaultColumns: TableColumn[] = [
  { 
    key: 'date', 
    label: 'expense.table.columns.date', 
    visible: true, 
    sortable: true, 
    align: 'left',
    width: 120,
    minWidth: 100,
    resizable: true
  },
  { 
    key: 'description', 
    label: 'expense.table.columns.description', 
    visible: true, 
    sortable: true, 
    align: 'left',
    minWidth: 200,
    resizable: true
  },
  { 
    key: 'category', 
    label: 'expense.table.columns.category', 
    visible: true, 
    sortable: true, 
    align: 'left',
    width: 140,
    minWidth: 120,
    resizable: true
  },
  { 
    key: 'balance', 
    label: 'expense.table.columns.amount', 
    visible: true, 
    sortable: true, 
    align: 'right',
    width: 120,
    minWidth: 100,
    className: 'font-mono',
    resizable: true
  },
  { 
    key: 'caseId', 
    label: 'expense.table.columns.case', 
    visible: true, 
    sortable: false, 
    align: 'left',
    minWidth: 150,
    resizable: true
  },
  { 
    key: 'id', 
    label: 'expense.table.columns.actions', 
    visible: true, 
    sortable: false, 
    align: 'center',
    width: 100,
    className: 'actions-column',
    resizable: false
  }
]

const {
  columnConfig,
  visibleColumns,
  isColumnVisible,
  toggleColumn
} = useTableColumns(defaultColumns, 'expense-table-columns')

const {
  formatCurrency
} = useExpenseFormatters()

// Computed properties
const selectedExpenses = computed(() => 
  props.expenses.filter(expense => selectedIds.value.includes(expense.id))
)

const paginationInfo = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize + 1
  const end = Math.min(props.currentPage * props.pageSize, props.totalItems)
  return t('expense.pagination.info', { start, end, total: props.totalItems })
})

// Event handlers with error boundary
const handleSort = (columnKey: string) => {
  withErrorBoundary(() => {
    handleSortInternal(columnKey, true)
  })
}

const handleBulkEdit = () => {
  withErrorBoundary(() => {
    if (selectedExpenses.value.length === 0) {
      throw new Error(t('expense.errors.noItemsSelected'))
    }
    emit('bulkEdit', selectedExpenses.value)
  })
}

const handleBulkDelete = () => {
  withErrorBoundary(() => {
    if (selectedExpenses.value.length === 0) {
      throw new Error(t('expense.errors.noItemsSelected'))
    }
    emit('bulkDelete', selectedExpenses.value)
  })
}

const handleRowAction = (action: string, expense: IExtendedExpense) => {
  withErrorBoundary(() => {
    switch (action) {
      case 'view':
        emit('view', expense)
        break
      case 'edit':
        emit('edit', expense)
        break
      case 'delete':
        emit('delete', expense)
        break
      case 'duplicate':
        emit('duplicate', expense)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  })
}
</script>

<style scoped>
.table-container {
  @apply overflow-x-auto;
}

@media (max-width: 768px) {
  .table-container {
    @apply hidden;
  }
}
</style>