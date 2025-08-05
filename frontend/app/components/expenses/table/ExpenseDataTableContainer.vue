<template>
  <div class="expense-data-table">
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
    <div class="table-container border rounded-lg">
      <Table>
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
        
        <TableBody>
          <!-- Loading Skeleton -->
          <template v-if="loading">
            <TableRow v-for="i in pageSize" :key="`skeleton-${i}`">
              <TableCell v-for="j in visibleColumns.length + 2" :key="j">
                <Skeleton class="h-4 w-full" />
              </TableCell>
            </TableRow>
          </template>
          
          <!-- Empty State -->
          <TableRow v-else-if="expenses.length === 0">
            <TableCell :colspan="visibleColumns.length + 2" class="p-0">
              <ExpenseTableEmpty @create="emit('createExpense')" />
            </TableCell>
          </TableRow>
          
          <!-- Expense Rows -->
          <ExpenseTableRow
            v-for="expense in expenses"
            :key="expense.id"
            :expense="expense"
            :is-selected="isSelected(expense.id)"
            :is-column-visible="isColumnVisible"
            @click="emit('rowClick', expense)"
            @toggle-selection="toggleSelection"
            @view="emit('view', expense)"
            @edit="emit('edit', expense)"
            @duplicate="emit('duplicate', expense)"
            @delete="emit('delete', expense)"
          />
        </TableBody>
      </Table>
    </div>

    <!-- Mobile Card View (responsive fallback) -->
    <div class="mobile-view md:hidden">
      <div v-if="loading" class="space-y-4">
        <Card v-for="i in pageSize" :key="`mobile-skeleton-${i}`" class="p-4">
          <Skeleton class="h-4 w-3/4 mb-2" />
          <Skeleton class="h-3 w-1/2 mb-2" />
          <Skeleton class="h-3 w-full" />
        </Card>
      </div>
      
      <ExpenseTableEmpty 
        v-else-if="expenses.length === 0" 
        @create="emit('createExpense')" 
      />
      
      <div v-else class="space-y-4">
        <Card 
          v-for="expense in expenses" 
          :key="expense.id" 
          class="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          @click="emit('rowClick', expense)"
        >
          <!-- Mobile card content using formatters -->
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <Checkbox
                :checked="isSelected(expense.id)"
                @update:checked="toggleSelection(expense.id)"
                @click.stop
              />
              <Badge variant="outline" :class="getCategoryBadgeClass(expense.category)">
                {{ expense.category }}
              </Badge>
            </div>
            <!-- Mobile action menu would go here -->
          </div>
          
          <div class="space-y-2">
            <div class="font-medium">{{ expense.description }}</div>
            <div v-if="expense.memo" class="text-sm text-muted-foreground">
              {{ expense.memo }}
            </div>
            <div class="flex justify-between items-center">
              <div class="text-sm text-muted-foreground">
                {{ formatDate(expense.date) }}
              </div>
              <div class="text-right">
                <div v-if="expense.incomeAmount > 0" class="text-green-600 font-mono text-sm">
                  +{{ formatCurrency(expense.incomeAmount) }}
                </div>
                <div v-if="expense.expenseAmount > 0" class="text-red-600 font-mono text-sm">
                  -{{ formatCurrency(expense.expenseAmount) }}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IExpense } from '~/types/expense'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '~/components/ui/table'
import { Card } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'

// Import specialized composables
import { useTableSelection } from '~/composables/useTableSelection'
import { useTableSorting } from '~/composables/useTableSorting'
import { useExpenseTableColumns } from '~/composables/useTableColumns'
import { useExpenseFormatters } from '~/composables/useExpenseFormatters'

// Import child components
import ExpenseTableToolbar from './ExpenseTableToolbar.vue'
import ExpenseTableHeader from './ExpenseTableHeader.vue'
import ExpenseTableRow from './ExpenseTableRow.vue'
import ExpenseTableEmpty from './ExpenseTableEmpty.vue'

interface Props {
  expenses: IExpense[]
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
  'rowClick': [IExpense]
  'edit': [IExpense]
  'view': [IExpense]
  'delete': [IExpense]
  'duplicate': [IExpense]
  'bulkEdit': [IExpense[]]
  'bulkDelete': [IExpense[]]
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

const {
  columnConfig,
  visibleColumns,
  isColumnVisible,
  toggleColumn
} = useExpenseTableColumns()

const {
  formatCurrency,
  formatDate,
  getCategoryBadgeClass
} = useExpenseFormatters()

// Computed properties
const selectedExpenses = computed(() => 
  props.expenses.filter(expense => selectedIds.value.includes(expense.id))
)

const paginationInfo = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize + 1
  const end = Math.min(props.currentPage * props.pageSize, props.totalItems)
  return `${start}-${end} / ${props.totalItems} 件`
})

// Event handlers
const handleSort = (columnKey: string) => {
  handleSortInternal(columnKey, true)
}

const handleBulkEdit = () => {
  emit('bulkEdit', selectedExpenses.value)
}

const handleBulkDelete = () => {
  emit('bulkDelete', selectedExpenses.value)
}
</script>

<style scoped>
.table-container {
  @apply overflow-x-auto;
}

.mobile-view {
  @apply block md:hidden;
}

@media (max-width: 768px) {
  .table-container {
    @apply hidden;
  }
}
</style>