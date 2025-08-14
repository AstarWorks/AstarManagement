<template>
  <div class="expense-list-page">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 class="text-2xl font-bold">{{ t('expense.list.title') }}</h1>
        <div class="flex flex-wrap gap-2">
          <NuxtLink 
            to="/expenses/new" 
            class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Icon name="lucide:plus-circle" class="w-4 h-4 mr-2" />
            {{ t('expense.actions.create') }}
          </NuxtLink>
          <NuxtLink 
            to="/expenses/import" 
            class="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            <Icon name="lucide:upload" class="w-4 h-4 mr-2" />
            {{ t('expense.actions.import') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-section mb-6">
      <ExpenseFilters 
        v-model="filters"
        :loading="listLoading"
        @update:model-value="handleFilterChange"
      />
    </div>

    <!-- Summary Section -->
    <div v-if="expenses.length > 0" class="summary-section mb-6">
      <FilterStatistics 
        :stats="filterStats"
        :loading="listLoading"
      />
    </div>

    <!-- Expense List -->
    <div class="expense-list-section mb-6">
      <!-- Loading State -->
      <div v-if="listLoading" class="flex justify-center py-8">
        <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <!-- Error State -->
      <div v-else-if="listError" class="text-center py-8">
        <Card class="bg-destructive/10">
          <CardContent class="p-6">
            <Icon name="lucide:alert-circle" class="w-12 h-12 text-destructive mx-auto mb-4" />
            <p class="text-destructive">{{ listError }}</p>
            <Button variant="outline" class="mt-4" @click="loadExpenses">
              {{ t('common.retry') }}
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Expense List Content -->
      <div v-else-if="expenses.length === 0">
        <ExpenseEmptyState 
          :has-filters="hasActiveFilters"
          @create-new="router.push('/expenses/new')"
          @clear-filters="clearFilters"
        />
      </div>
      
      <!-- Expense Data Table with integrated pagination -->
      <div v-else>
        <ExpenseDataTable
          ref="expenseTableRef"
          :expenses="expenses"
          :loading="listLoading"
          :selected="selectedExpenses"
          :filters="filters"
          :global-filter="filters.searchTerm || ''"
          @update:selected="selectedExpenses = $event"
          @edit="(expense) => router.push(`/expenses/${expense.id}/edit`)"
          @view="(expense) => router.push(`/expenses/${expense.id}`)"
          @delete="handleDelete"
        />
        
        <!-- Manual Pagination Controls -->
        <div v-if="totalItems > 0" class="mt-4 border-t pt-4">
          <div class="flex items-center justify-between px-2">
            <div class="flex-1 text-sm text-muted-foreground">
              {{ getPaginationInfo(totalItems).startItem }}-{{ getPaginationInfo(totalItems).endItem }} of {{ totalItems }} items
            </div>
            <div class="flex items-center space-x-6 lg:space-x-8">
              <div class="flex items-center space-x-2">
                <p class="text-sm font-medium">Rows per page</p>
                <select
                  :value="currentPageSize"
                  class="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
                  @change="onPaginationChange({ ...pagination, pageSize: Number(($event.target as HTMLSelectElement)?.value), pageIndex: 0 })"
                >
                  <option v-for="size in [10, 20, 30, 50, 100]" :key="size" :value="size">
                    {{ size }}
                  </option>
                </select>
              </div>
              <div class="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {{ currentPage }} of {{ totalPages }}
              </div>
              <div class="flex items-center space-x-2">
                <Button
                  variant="outline"
                  class="h-8 w-8 p-0"
                  :disabled="!getPaginationInfo(totalItems).hasPreviousPage"
                  @click="onPaginationChange({ ...pagination, pageIndex: 0 })"
                >
                  <Icon name="lucide:chevrons-left" class="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  class="h-8 w-8 p-0"
                  :disabled="!getPaginationInfo(totalItems).hasPreviousPage"
                  @click="onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex - 1 })"
                >
                  <Icon name="lucide:chevron-left" class="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  class="h-8 w-8 p-0"
                  :disabled="!getPaginationInfo(totalItems).hasNextPage"
                  @click="onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex + 1 })"
                >
                  <Icon name="lucide:chevron-right" class="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  class="h-8 w-8 p-0"
                  :disabled="!getPaginationInfo(totalItems).hasNextPage"
                  @click="onPaginationChange({ ...pagination, pageIndex: totalPages - 1 })"
                >
                  <Icon name="lucide:chevrons-right" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpense, IExpenseSummary, IExpenseFilters } from '~/types/expense'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Icon } from '#components'
import ExpenseFilters from '~/components/expenses/ExpenseFilters.vue'
import ExpenseDataTable from '~/components/expenses/ExpenseDataTable.vue'
import ExpenseEmptyState from '~/components/expenses/states/ExpenseEmptyState.vue'
import FilterStatistics from '~/components/expenses/filters/FilterStatistics.vue'

import { mockExpenseDataService } from '~/services/mockExpenseDataService'
import { useDebounceFn } from '@vueuse/core'
import { useTablePagination } from '~/composables/useTablePagination'

// Meta and SEO
definePageMeta({
  title: 'expense.navigation.title',
  middleware: ['auth']
})

// Composables
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Pagination state management
const {
  pagination,
  currentPage,
  currentPageSize,
  onPaginationChange,
  getPaginationInfo
} = useTablePagination({
  pageSize: 20,
  syncWithUrl: true,
  manualPagination: true
})

// Reactive state
const filters = ref<IExpenseFilters>({})
const expenses = ref<IExpense[]>([])
const selectedExpenses = ref<Set<string>>(new Set())
const expenseSummary = ref<IExpenseSummary>()
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / currentPageSize.value))

// Handle pagination changes from TanStackTable
const _handlePaginationChange = onPaginationChange

// Loading states
const listLoading = ref(false)
const summaryLoading = ref(false)
const listError = ref<string>()

// Table reference for accessing filtered results
const expenseTableRef = ref()

// Computed properties
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => 
    value !== undefined && value !== null && value !== '' && 
    (!Array.isArray(value) || value.length > 0)
  )
})

const filterStats = computed(() => {
  // Get filtered results from TanStackTable if available, otherwise use all expenses
  const filteredExpenses = expenseTableRef.value?.table?.getFilteredRowModel()?.rows?.map((row: { original: IExpense }) => row.original) || expenses.value
  
  return {
    totalMatched: filteredExpenses.length,
    totalIncome: filteredExpenses.reduce((sum: number, e: IExpense) => sum + e.incomeAmount, 0),
    totalExpense: filteredExpenses.reduce((sum: number, e: IExpense) => sum + e.expenseAmount, 0),
    netBalance: filteredExpenses.reduce((sum: number, e: IExpense) => sum + (e.incomeAmount - e.expenseAmount), 0)
  }
})

// Sync filters with query parameters
watchEffect(() => {
  filters.value = {
    dateFrom: route.query.startDate as string,
    dateTo: route.query.endDate as string,
    categories: route.query.category ? [route.query.category as string] : undefined,
    caseIds: route.query.caseId ? [route.query.caseId as string] : undefined,
    searchTerm: route.query.q as string,
    tagIds: Array.isArray(route.query.tagIds) 
      ? route.query.tagIds as string[]
      : route.query.tagIds 
        ? [route.query.tagIds as string] 
        : undefined,
    amountMin: route.query.amountMin ? Number(route.query.amountMin) : undefined,
    amountMax: route.query.amountMax ? Number(route.query.amountMax) : undefined,
  }
})

// Event handlers - Debounced for better performance
const handleFilterChange = useDebounceFn((newFilters: IExpenseFilters) => {
  // Convert filter values to strings for URL query parameters
  const query: Record<string, string> = { page: '1' }
  
  if (newFilters.dateFrom) query.startDate = newFilters.dateFrom
  if (newFilters.dateTo) query.endDate = newFilters.dateTo
  if (newFilters.categories?.length) query.category = newFilters.categories[0] // Take first for simplicity
  if (newFilters.caseIds?.length) query.caseId = newFilters.caseIds[0] // Take first for simplicity
  if (newFilters.searchTerm) query.q = newFilters.searchTerm
  if (newFilters.tagIds?.length) query.tagIds = newFilters.tagIds.join(',')
  if (newFilters.amountMin !== undefined) query.amountMin = String(newFilters.amountMin)
  if (newFilters.amountMax !== undefined) query.amountMax = String(newFilters.amountMax)
  query.pageSize = String(currentPageSize.value) // Preserve page size
  
  router.push({ query })
}, 300)

const clearFilters = () => {
  // Reset URL parameters
  router.push({ query: {} })
  // Reset TanStackTable filters
  if (expenseTableRef.value?.resetTableFilters) {
    expenseTableRef.value.resetTableFilters()
  }
}

const handleDelete = async (expense: IExpense) => {
  // Delete logic will be implemented when we have the service
  console.log('Delete expense:', expense.id)
}

// Load data functions
const loadExpenses = async () => {
  listLoading.value = true
  listError.value = undefined
  
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Get data from mock service
    const result = mockExpenseDataService.getExpenses({
      ...filters.value,
      offset: pagination.value.pageIndex * pagination.value.pageSize,
      limit: pagination.value.pageSize
    })
    
    expenses.value = result.items
    totalItems.value = result.total
  } catch (error) {
    listError.value = t('expense.errors.loadFailed')
    console.error('Failed to load expenses:', error)
  } finally {
    listLoading.value = false
  }
}

const loadSummary = async () => {
  summaryLoading.value = true
  
  try {
    // Mock data loading - will be replaced with service calls
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // For now, just set some mock data
    expenseSummary.value = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      count: 0,
      categories: [],
      period: {
        startDate: filters.value.dateFrom || '',
        endDate: filters.value.dateTo || ''
      }
    }
  } catch (error) {
    console.error('Failed to load summary:', error)
  } finally {
    summaryLoading.value = false
  }
}

// Initialize mock data on first load
onMounted(async () => {
  // Seed mock data if empty
  if (mockExpenseDataService.getExpenses().total === 0) {
    await mockExpenseDataService.seedDatabase(100)
  }
})

// Load data on component mount and filter changes
watchEffect(async () => {
  await Promise.all([
    loadExpenses(),
    loadSummary()
  ])
})

// SEO
useSeoMeta({
  title: t('expense.navigation.title'),
  description: t('expense.list.description')
})
</script>

<style scoped>
.expense-list-page {
  @apply container mx-auto px-4 py-6;
}

.page-header {
  @apply border-b pb-4;
}

@media (max-width: 640px) {
  .expense-list-page {
    @apply px-2 py-4;
  }
}
</style>