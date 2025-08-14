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
      
      <!-- Expense Data Table -->
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
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-section">
      <ExpensePagination
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        @update:page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpense, IExpenseFilter, IExpenseSummary, IExpenseFilters } from '~/types/expense'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Icon } from '#components'
import ExpenseFilters from '~/components/expenses/ExpenseFilters.vue'
import ExpenseDataTable from '~/components/expenses/ExpenseDataTable.vue'
import ExpensePagination from '~/components/expenses/ExpensePagination.vue'
import ExpenseEmptyState from '~/components/expenses/states/ExpenseEmptyState.vue'
import FilterStatistics from '~/components/expenses/filters/FilterStatistics.vue'
import { mockExpenseDataService } from '~/services/mockExpenseDataService'
import { useDebounceFn } from '@vueuse/core'

// Meta and SEO
definePageMeta({
  title: 'expense.navigation.title',
  middleware: ['auth']
})

// Composables
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Reactive state
const filters = ref<IExpenseFilters>({})
const expenses = ref<IExpense[]>([])
const selectedExpenses = ref<Set<string>>(new Set())
const expenseSummary = ref<IExpenseSummary>()
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

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
    netBalance: filteredExpenses.reduce((sum: number, e: IExpense) => sum + e.balance, 0)
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
  currentPage.value = parseInt(route.query.page as string) || 1
  pageSize.value = parseInt(route.query.pageSize as string) || 20
})

// Event handlers - Debounced for better performance
const handleFilterChange = useDebounceFn((newFilters: IExpenseFilter) => {
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
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
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
      totalExpense: 0,
      balance: 0,
      count: 0,
      categories: [],
      period: {
        startDate: filters.value.startDate || '',
        endDate: filters.value.endDate || ''
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