<template>
  <div class="expense-data-table">
    <!-- Table Toolbar -->
    <div class="table-toolbar flex justify-between items-center mb-4">
      <div class="table-actions flex items-center gap-2">
        <Button 
          v-if="selectedExpenses.length > 0"
          variant="outline" 
          size="sm"
          @click="handleBulkEdit"
        >
          <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
          {{ $t('expense.actions.bulkEdit') }} ({{ selectedExpenses.length }})
        </Button>
        <Button 
          v-if="selectedExpenses.length > 0"
          variant="outline" 
          size="sm"
          @click="handleBulkDelete"
        >
          <Icon name="lucide:trash" class="w-4 h-4 mr-2" />
          {{ $t('expense.actions.bulkDelete') }} ({{ selectedExpenses.length }})
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Icon name="lucide:columns" class="w-4 h-4 mr-2" />
              {{ $t('expense.table.columns') }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              v-for="column in columns"
              :key="column.key"
              :checked="column.visible"
              @update:checked="toggleColumn(column.key)"
            >
              {{ column.label }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div class="table-meta text-sm text-muted-foreground">
        {{ paginationInfo }}
      </div>
    </div>

    <!-- Main Table -->
    <div class="table-container border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-12">
              <Checkbox
                :checked="isAllSelected"
                :indeterminate="isPartiallySelected"
                @update:checked="toggleSelectAll"
              />
            </TableHead>
            <TableHead
              v-for="column in visibleColumns"
              :key="column.key"
              :class="getSortableHeaderClass(column)"
              @click="handleSort(column.key)"
            >
              <div class="flex items-center gap-2 cursor-pointer">
                {{ column.label }}
                <Icon
                  v-if="column.sortable && sortBy === column.key"
                  :name="sortOrder === 'ASC' ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                  class="w-4 h-4"
                />
                <Icon
                  v-else-if="column.sortable"
                  name="lucide:chevrons-up-down"
                  class="w-4 h-4 opacity-50"
                />
              </div>
            </TableHead>
            <TableHead class="w-20">{{ $t('expense.table.actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        
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
            <TableCell :colspan="visibleColumns.length + 2" class="text-center py-12">
              <div class="empty-state">
                <Icon name="lucide:receipt" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 class="text-lg font-medium mb-2">{{ $t('expense.list.empty.title') }}</h3>
                <p class="text-muted-foreground mb-4">
                  {{ $t('expense.list.empty.description') }}
                </p>
                <Button @click="$emit('createExpense')">
                  <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                  {{ $t('expense.actions.create') }}
                </Button>
              </div>
            </TableCell>
          </TableRow>
          
          <!-- Expense Rows -->
          <TableRow
            v-for="expense in expenses"
            :key="expense.id"
            :class="getRowClass(expense)"
            class="cursor-pointer hover:bg-muted/50"
            @click="handleRowClick(expense)"
          >
            <TableCell>
              <Checkbox
                :checked="isSelected(expense.id)"
                @update:checked="toggleSelection(expense.id)"
                @click.stop
              />
            </TableCell>
            <TableCell v-if="isColumnVisible('date')">
              <div class="font-mono text-sm">
                {{ formatDate(expense.date) }}
              </div>
            </TableCell>
            <TableCell v-if="isColumnVisible('category')">
              <Badge variant="outline" :class="getCategoryBadgeClass(expense.category)">
                {{ expense.category }}
              </Badge>
            </TableCell>
            <TableCell v-if="isColumnVisible('description')" class="max-w-xs">
              <div class="space-y-1">
                <div class="font-medium truncate" :title="expense.description">
                  {{ expense.description }}
                </div>
                <div v-if="expense.memo" class="text-xs text-muted-foreground truncate" :title="expense.memo">
                  {{ expense.memo }}
                </div>
              </div>
            </TableCell>
            <TableCell v-if="isColumnVisible('amount')" class="text-right">
              <div class="expense-amounts space-y-1">
                <div v-if="expense.incomeAmount > 0" class="text-green-600 font-mono text-sm">
                  +{{ formatCurrency(expense.incomeAmount) }}
                </div>
                <div v-if="expense.expenseAmount > 0" class="text-red-600 font-mono text-sm">
                  -{{ formatCurrency(expense.expenseAmount) }}
                </div>
              </div>
            </TableCell>
            <TableCell v-if="isColumnVisible('balance')" class="text-right font-mono">
              <span :class="getBalanceClass(expense.balance)">
                {{ formatCurrency(expense.balance) }}
              </span>
            </TableCell>
            <TableCell v-if="isColumnVisible('case')">
              <Badge 
                v-if="expense.caseId" 
                variant="secondary"
                class="text-xs"
              >
                {{ $t('expense.table.case') }}: {{ expense.caseId }}
              </Badge>
            </TableCell>
            <TableCell v-if="isColumnVisible('tags')">
              <div class="flex gap-1 flex-wrap">
                <Badge
                  v-for="tag in expense.tags.slice(0, 2)"
                  :key="tag.id"
                  variant="secondary"
                  class="text-xs"
                >
                  {{ tag.name }}
                </Badge>
                <Badge
                  v-if="expense.tags.length > 2"
                  variant="outline"
                  class="text-xs"
                >
                  +{{ expense.tags.length - 2 }}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="sm" @click.stop>
                    <Icon name="lucide:more-horizontal" class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="handleEdit(expense)">
                    <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
                    {{ $t('expense.actions.edit') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleView(expense)">
                    <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
                    {{ $t('expense.actions.view') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleDuplicate(expense)">
                    <Icon name="lucide:copy" class="w-4 h-4 mr-2" />
                    {{ $t('expense.actions.duplicate') }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive"
                    @click="handleDelete(expense)"
                  >
                    <Icon name="lucide:trash" class="w-4 h-4 mr-2" />
                    {{ $t('expense.actions.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
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
      <div v-else-if="expenses.length === 0" class="text-center py-12">
        <Icon name="lucide:receipt" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">{{ $t('expense.list.empty.title') }}</h3>
        <p class="text-muted-foreground mb-4">{{ $t('expense.list.empty.description') }}</p>
        <Button @click="$emit('createExpense')">
          <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
          {{ $t('expense.actions.create') }}
        </Button>
      </div>
      <div v-else class="space-y-4">
        <Card 
          v-for="expense in expenses" 
          :key="expense.id" 
          class="p-4 cursor-pointer hover:bg-muted/50"
          @click="handleRowClick(expense)"
        >
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
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm" @click.stop>
                  <Icon name="lucide:more-horizontal" class="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="handleEdit(expense)">
                  <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
                  {{ $t('expense.actions.edit') }}
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleView(expense)">
                  <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
                  {{ $t('expense.actions.view') }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="text-destructive"
                  @click="handleDelete(expense)"
                >
                  <Icon name="lucide:trash" class="w-4 h-4 mr-2" />
                  {{ $t('expense.actions.delete') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div class="space-y-2">
            <div class="font-medium">{{ expense.description }}</div>
            <div v-if="expense.memo" class="text-sm text-muted-foreground">{{ expense.memo }}</div>
            <div class="flex justify-between items-center">
              <div class="text-sm text-muted-foreground">{{ formatDate(expense.date) }}</div>
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
import { computed, ref } from 'vue'
import type { IExpense } from '~/types/expense'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'

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

interface Column {
  key: string
  label: string
  sortable: boolean
  visible: boolean
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

const emit = defineEmits<{
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
}>()

// Column configuration
const columns = ref<Column[]>([
  { key: 'date', label: '日付', sortable: true, visible: true },
  { key: 'category', label: 'カテゴリ', sortable: true, visible: true },
  { key: 'description', label: '説明', sortable: true, visible: true },
  { key: 'amount', label: '金額', sortable: true, visible: true },
  { key: 'balance', label: '残高', sortable: true, visible: true },
  { key: 'case', label: '案件', sortable: false, visible: false },
  { key: 'tags', label: 'タグ', sortable: false, visible: false },
])

// Computed properties
const visibleColumns = computed(() => columns.value.filter(col => col.visible))

const selectedExpenses = computed(() => 
  props.expenses.filter(expense => props.selectedIds.includes(expense.id))
)

const isAllSelected = computed(() => 
  props.expenses.length > 0 && props.selectedIds.length === props.expenses.length
)

const isPartiallySelected = computed(() => 
  props.selectedIds.length > 0 && props.selectedIds.length < props.expenses.length
)

const paginationInfo = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize + 1
  const end = Math.min(props.currentPage * props.pageSize, props.totalItems)
  return `${start}-${end} / ${props.totalItems} 件`
})

// Methods
const toggleColumn = (columnKey: string) => {
  const column = columns.value.find(col => col.key === columnKey)
  if (column) {
    column.visible = !column.visible
  }
}

const isColumnVisible = (columnKey: string) => {
  const column = columns.value.find(col => col.key === columnKey)
  return column?.visible ?? false
}

const getSortableHeaderClass = (column: Column) => {
  const baseClass = 'select-none'
  if (!column.sortable) return baseClass
  return `${baseClass} cursor-pointer hover:bg-muted/50`
}

const handleSort = (columnKey: string) => {
  const column = columns.value.find(col => col.key === columnKey)
  if (!column?.sortable) return

  let newSortOrder: 'ASC' | 'DESC' = 'ASC'
  if (props.sortBy === columnKey) {
    newSortOrder = props.sortOrder === 'ASC' ? 'DESC' : 'ASC'
  }

  emit('sortChange', { sortBy: columnKey, sortOrder: newSortOrder })
}

const isSelected = (expenseId: string) => {
  return props.selectedIds.includes(expenseId)
}

const toggleSelection = (expenseId: string) => {
  const newSelection = isSelected(expenseId)
    ? props.selectedIds.filter(id => id !== expenseId)
    : [...props.selectedIds, expenseId]
  
  emit('selectionChange', newSelection)
}

const toggleSelectAll = () => {
  const newSelection = isAllSelected.value 
    ? [] 
    : props.expenses.map(expense => expense.id)
  
  emit('selectionChange', newSelection)
}

const getRowClass = (expense: IExpense) => {
  const baseClass = 'transition-colors'
  return isSelected(expense.id) ? `${baseClass} bg-muted/30` : baseClass
}

const getCategoryBadgeClass = (category: string) => {
  const categoryClasses: Record<string, string> = {
    '交通費': 'border-blue-200 text-blue-700 bg-blue-50',
    '印紙代': 'border-red-200 text-red-700 bg-red-50',
    'コピー代': 'border-green-200 text-green-700 bg-green-50',
    '郵送料': 'border-yellow-200 text-yellow-700 bg-yellow-50',
    'その他': 'border-purple-200 text-purple-700 bg-purple-50'
  }
  return categoryClasses[category] || 'border-gray-200 text-gray-700 bg-gray-50'
}

const getBalanceClass = (balance: number) => {
  if (balance > 0) return 'text-green-600'
  if (balance < 0) return 'text-red-600'
  return 'text-muted-foreground'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount)
}

// Event handlers
const handleRowClick = (expense: IExpense) => {
  emit('rowClick', expense)
}

const handleEdit = (expense: IExpense) => {
  emit('edit', expense)
}

const handleView = (expense: IExpense) => {
  emit('view', expense)
}

const handleDelete = (expense: IExpense) => {
  emit('delete', expense)
}

const handleDuplicate = (expense: IExpense) => {
  emit('duplicate', expense)
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

.table-container .table {
  @apply hidden md:table;
}

@media (max-width: 768px) {
  .table-container {
    @apply hidden;
  }
}
</style>