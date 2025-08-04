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
      <!-- Placeholder for ExpenseFilters component -->
      <Card>
        <CardContent class="p-4">
          <div class="text-muted-foreground">
            {{ t('common.loading') }}... (ExpenseFilters component)
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Summary Section -->
    <div class="summary-section mb-6">
      <!-- Placeholder for ExpenseSummary component -->
      <Card>
        <CardContent class="p-4">
          <div class="text-muted-foreground">
            {{ t('common.loading') }}... (ExpenseSummary component)
          </div>
        </CardContent>
      </Card>
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
      <div v-else>
        <!-- Placeholder for ExpenseList component -->
        <Card>
          <CardContent class="p-4">
            <div class="text-muted-foreground">
              {{ t('common.loading') }}... (ExpenseList component)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-section">
      <!-- Placeholder for Pagination component -->
      <div class="flex justify-center">
        <div class="text-muted-foreground">
          {{ t('common.loading') }}... (Pagination component)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpenseFilter, IExpenseList, IExpenseSummary } from '~/types/expense'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Icon } from '#components'

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
const expenses = ref<IExpenseList>({ 
  items: [], 
  total: 0, 
  offset: 0, 
  limit: 20, 
  hasMore: false 
})
const expenseSummary = ref<IExpenseSummary>()
const currentPage = ref(1)
const perPage = ref(20)

// Loading states
const listLoading = ref(false)
const summaryLoading = ref(false)
const listError = ref<string>()

// Sync filters with query parameters
watchEffect(() => {
  filters.value = {
    startDate: route.query.startDate as string,
    endDate: route.query.endDate as string,
    category: route.query.category as string,
    caseId: route.query.caseId as string,
    tagIds: Array.isArray(route.query.tagIds) 
      ? route.query.tagIds as string[]
      : route.query.tagIds 
        ? [route.query.tagIds as string] 
        : undefined,
    sortBy: (route.query.sortBy as 'date' | 'category' | 'description' | 'balance') || 'date',
    sortOrder: (route.query.sortOrder as 'ASC' | 'DESC') || 'DESC'
  }
  currentPage.value = parseInt(route.query.page as string) || 1
})

// Event handlers
const _handleFiltersApply = (newFilters: IExpenseFilter) => {
  const query = { ...newFilters, page: '1' }
  router.push({ query })
}

const _handleFiltersReset = () => {
  router.push({ query: {} })
}

const _handleExpenseEdit = (expenseId: string) => {
  router.push(`/expenses/${expenseId}/edit`)
}

const _handleExpenseView = (expenseId: string) => {
  router.push(`/expenses/${expenseId}`)
}

const _handleExpenseDelete = async (expenseId: string) => {
  // Delete logic will be implemented when we have the service
  console.log('Delete expense:', expenseId)
}

const _handlePageChange = (page: number) => {
  const query = { ...route.query, page: page.toString() }
  router.push({ query })
}

// Load data functions
const loadExpenses = async () => {
  listLoading.value = true
  listError.value = undefined
  
  try {
    // Mock data loading - will be replaced with service calls
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For now, just set some mock data
    expenses.value = {
      items: [],
      total: 0,
      offset: (currentPage.value - 1) * perPage.value,
      limit: perPage.value,
      hasMore: false
    }
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