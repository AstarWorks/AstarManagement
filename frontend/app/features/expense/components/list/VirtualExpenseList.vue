<template>
  <VirtualList
    ref="virtualListRef"
    :items="expenses"
    :item-height="itemHeight"
    :container-height="containerHeight"
    :overscan="overscan"
    :loading="loading"
    :show-scroll-indicators="showScrollIndicators"
    :show-performance-metrics="showPerformanceMetrics"
    :get-item-key="getExpenseKey"
    @scroll="expenseBehavior.handlers.handleScroll"
    @visible-range-change="expenseBehavior.handlers.handleVisibleRangeChange"
  >
    <!-- Expense item slot -->
    <template #item="{ item: expense, index }">
      <ExpenseListItem
        :expense="expense"
        :index="index"
        :selected="expenseBehavior.computed.isExpenseSelected(expense.id)"
        @select="expenseBehavior.handlers.handleSelect"
        @edit="expenseBehavior.handlers.handleEdit"
        @view="expenseBehavior.handlers.handleView"
        @delete="expenseBehavior.handlers.handleDelete"
        @duplicate="expenseBehavior.handlers.handleDuplicate"
      />
    </template>
    
    <!-- Loading state slot -->
    <template #loading>
      <ExpenseListSkeleton 
        :item-count="Math.ceil(containerHeight / itemHeight)"
        :show-header="false"
        :show-pagination="false"
      />
    </template>
    
    <!-- Empty state slot -->
    <template #empty>
      <ExpenseEmptyState 
        @create="$emit('createExpense')"
        @import="$emit('importExpenses')"
        @help="$emit('showHelp')"
      />
    </template>
    
    <!-- Error state slot -->
    <template #error>
      <Alert variant="destructive" class="max-w-md mx-auto">
        <Icon name="lucide:alert-circle" class="h-4 w-4" />
        <AlertTitle>{{ $t('expense.list.error.title') }}</AlertTitle>
        <AlertDescription>
          {{ $t('expense.list.error.description') }}
        </AlertDescription>
        <div class="mt-3 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            @click="$emit('retry')"
          >
            {{ $t('common.error.retry') }}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            @click="$emit('refresh')"
          >
            {{ $t('common.refresh') }}
          </Button>
        </div>
      </Alert>
    </template>
  </VirtualList>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { IExpense } from '@expense/types/expense'
import { useExpenseListBehavior } from '@expense/composables/list/useExpenseListBehavior'
import VirtualList from '@ui/virtual-list/VirtualList.vue'
import ExpenseListItem from './ExpenseListItem.vue'
import ExpenseEmptyState from '../shared/states/ExpenseEmptyState.vue'
import ExpenseListSkeleton from '../shared/states/ExpenseListSkeleton.vue'
import { Button } from '@ui/button/index'
import { Alert, AlertDescription, AlertTitle } from '@ui/alert'

interface Props {
  /** Array of expenses to display */
  expenses: IExpense[]
  /** Currently selected expense IDs */
  selectedIds?: string[]
  /** Height of each expense item in pixels */
  itemHeight?: number
  /** Height of the container in pixels */
  containerHeight?: number
  /** Number of items to render outside visible area */
  overscan?: number
  /** Whether the list is in loading state */
  loading?: boolean
  /** Show scroll indicators */
  showScrollIndicators?: boolean
  /** Show performance metrics in development */
  showPerformanceMetrics?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => [],
  itemHeight: 80,
  containerHeight: 400,
  overscan: 5,
  loading: false,
  showScrollIndicators: true,
  showPerformanceMetrics: false
})

const emit = defineEmits<{
  'select': [data: { expenseId: string; selected: boolean }]
  'edit': [expense: IExpense]
  'view': [expense: IExpense]
  'delete': [expense: IExpense]
  'duplicate': [expense: IExpense]
  'createExpense': []
  'importExpenses': []
  'showHelp': []
  'retry': []
  'refresh': []
  'scroll': [data: { scrollTop: number; scrollLeft: number }]
  'visibleRangeChange': [data: { startIndex: number; endIndex: number }]
}>()

// Expense list behavior composable with type-safe emit
const expenseBehavior = useExpenseListBehavior(
  {
    selectedIds: props.selectedIds,
    loading: props.loading
  },
  {
    select: (data) => emit('select', data),
    edit: (expense) => emit('edit', expense),
    view: (expense) => emit('view', expense),
    delete: (expense) => emit('delete', expense),
    duplicate: (expense) => emit('duplicate', expense),
    scroll: (data) => emit('scroll', data),
    visibleRangeChange: (data) => emit('visibleRangeChange', data),
    retry: () => emit('retry'),
    refresh: () => emit('refresh')
  }
)

// Get unique key for each expense
const getExpenseKey = (expense: IExpense): string => {
  return expense.id
}

// Template ref to VirtualList component
const virtualListRef = ref<{ 
  scrollToIndex: (index: number) => void
  scrollToTop: () => void 
  scrollToBottom: () => void
  scrollBy: (delta: number) => void
  clearError: () => void
}>()

// Scroll to specific expense
const scrollToExpense = (expenseId: string) => {
  if (virtualListRef.value) {
    const index = props.expenses.findIndex(expense => expense.id === expenseId)
    if (index !== -1) {
      virtualListRef.value.scrollToIndex(index)
    }
  }
}

// Expose methods for parent components
defineExpose({
  scrollToExpense,
  scrollToIndex: (index: number) => virtualListRef.value?.scrollToIndex(index),
  scrollToTop: () => virtualListRef.value?.scrollToTop(),
  scrollToBottom: () => virtualListRef.value?.scrollToBottom(),
  scrollBy: (delta: number) => virtualListRef.value?.scrollBy(delta),
  clearError: () => virtualListRef.value?.clearError()
})
</script>

<style scoped>
/* All styling is now handled by the generic VirtualList component */
/* This component focuses purely on expense-specific composition */
</style>