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
          :expenses="expenses"
          :loading="listLoading"
          :selected="selectedExpenses"
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
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpense, IExpenseFilter, IExpenseSummary } from '~/types/expense'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Icon } from '#components'
import ExpenseFilters from '~/components/expenses/ExpenseFilters.vue'
import ExpenseDataTable from '~/components/expenses/ExpenseDataTable.vue'
import ExpensePagination from '~/components/expenses/ExpensePagination.vue'
import ExpenseEmptyState from '~/components/expenses/states/ExpenseEmptyState.vue'
import FilterStatistics from '~/components/expenses/filters/FilterStatistics.vue'
import { mockExpenseDataService } from '~/services/mockExpenseDataService'

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
const filters = ref<IExpenseFilter>({})
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

// Computed properties
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => 
    value !== undefined && value !== null && value !== '' && 
    (!Array.isArray(value) || value.length > 0)
  )
})

const filterStats = computed(() => ({
  totalMatched: totalItems.value,
  totalIncome: expenses.value.reduce((sum, e) => sum + e.incomeAmount, 0),
  totalExpense: expenses.value.reduce((sum, e) => sum + e.expenseAmount, 0),
  netBalance: expenses.value.reduce((sum, e) => sum + e.balance, 0)
}))

// Sync filters with query parameters
watchEffect(() => {
  filters.value = {
    startDate: route.query.startDate as string,
    endDate: route.query.endDate as string,
    category: route.query.category as string,
    caseId: route.query.caseId as string,
    searchQuery: route.query.q as string,
    tagIds: Array.isArray(route.query.tagIds) 
      ? route.query.tagIds as string[]
      : route.query.tagIds 
        ? [route.query.tagIds as string] 
        : undefined,
    sortBy: (route.query.sortBy as 'date' | 'category' | 'description' | 'balance') || 'date',
    sortOrder: (route.query.sortOrder as 'ASC' | 'DESC') || 'DESC'
  }
  currentPage.value = parseInt(route.query.page as string) || 1
  pageSize.value = parseInt(route.query.pageSize as string) || 20
})

// Event handlers
const handleFilterChange = (newFilters: IExpenseFilter) => {
  // Convert filter values to strings for URL query parameters
  const query: Record<string, string> = { page: '1' }
  
  Object.entries(newFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        query[key] = value.join(',')
      } else {
        query[key] = String(value)
      }
    }
  })
  
  router.push({ query })
}

const clearFilters = () => {
  router.push({ query: {} })
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