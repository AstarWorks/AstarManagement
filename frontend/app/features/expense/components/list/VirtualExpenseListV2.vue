<template>
  <div 
    ref="containerRef"
    class="virtual-expense-list relative"
    :style="{ height: `${containerHeight}px`, overflow: 'auto' }"
    @scroll="handleScroll"
  >
    <!-- Loading state -->
    <div v-if="loading && expenses.length === 0" class="absolute inset-0">
      <slot name="loading">
        <ExpenseListSkeleton 
          :item-count="Math.ceil(containerHeight / itemHeight)"
          :show-header="false"
          :show-pagination="false"
        />
      </slot>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!loading && expenses.length === 0" class="flex items-center justify-center h-full">
      <slot name="empty">
        <ExpenseEmptyState 
          @create="emit('createExpense')"
          @import="emit('importExpenses')"
          @help="emit('showHelp')"
        />
      </slot>
    </div>

    <!-- Error state -->
    <div v-else-if="errorState.isError.value" class="flex items-center justify-center h-full p-4">
      <slot name="error">
        <Alert variant="destructive" class="max-w-md">
          <Icon name="lucide:alert-circle" class="h-4 w-4" />
          <AlertTitle>{{ $t('expense.list.error.title') }}</AlertTitle>
          <AlertDescription>
            {{ $t('expense.list.error.description') }}
          </AlertDescription>
          <div class="mt-3 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              @click="handleRetry"
            >
              {{ $t('common.error.retry') }}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              @click="emit('refresh')"
            >
              {{ $t('common.refresh') }}
            </Button>
          </div>
        </Alert>
      </slot>
    </div>

    <!-- Virtual scrolling content -->
    <div 
      v-else
      class="relative w-full"
      :style="{
        height: `${virtualList.virtualizer.value.getTotalSize()}px`
      }"
    >
      <div
        class="absolute top-0 left-0 w-full"
        :style="{
          transform: `translateY(${virtualList.virtualizer.value.getVirtualItems()[0]?.start ?? 0}px)`
        }"
      >
        <div
          v-for="virtualItem in virtualList.virtualizer.value.getVirtualItems()"
          :key="String(virtualItem.key)"
          :data-index="virtualItem.index"
          class="virtual-item"
          :style="{
            height: `${virtualItem.size}px`
          }"
        >
          <template v-if="expenses[virtualItem.index]">
            <ExpenseListItem
              :expense="expenses[virtualItem.index]!"
              :index="virtualItem.index"
              :selected="expenseBehavior.computed.isExpenseSelected(expenses[virtualItem.index]!.id)"
              @select="expenseBehavior.handlers.handleSelect"
              @edit="expenseBehavior.handlers.handleEdit"
              @view="expenseBehavior.handlers.handleView"
              @delete="expenseBehavior.handlers.handleDelete"
              @duplicate="expenseBehavior.handlers.handleDuplicate"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Loading overlay for subsequent loads -->
    <div 
      v-if="loading && expenses.length > 0" 
      class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
    >
      <div class="flex items-center gap-2">
        <Icon name="lucide:loader" class="w-4 h-4 animate-spin" />
        <span>{{ $t('common.loading') }}</span>
      </div>
    </div>

    <!-- Performance metrics (development only) -->
    <div 
      v-if="showPerformanceMetrics"
      class="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded-md p-2 text-xs font-mono"
    >
      <div>Items: {{ virtualList.metrics.startIndex.value }}-{{ virtualList.metrics.endIndex.value }} / {{ virtualList.metrics.totalCount.value }}</div>
      <div v-if="virtualList.metrics.isScrolling.value">Scrolling...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import type { IExpense } from '@expense/types/expense'
import { useExpenseListBehavior } from '@expense/composables/list/useExpenseListBehavior'
import { 
  useVirtualExpenseList, 
  useExpenseListError,
  useExpenseListScroll 
} from '@expense/composables/list/useVirtualExpenseList'
import ExpenseListItem from './ExpenseListItem.vue'
import ExpenseEmptyState from '../shared/states/ExpenseEmptyState.vue'
import ExpenseListSkeleton from '../shared/states/ExpenseListSkeleton.vue'
import { Button } from '@ui/button'
import { Alert, AlertDescription, AlertTitle } from '@ui/alert'
import { Icon } from '#components'

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
  /** Show performance metrics in development */
  showPerformanceMetrics?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => [],
  itemHeight: 80,
  containerHeight: 400,
  overscan: 5,
  loading: false,
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

// Container ref for virtual scrolling
const containerRef = ref<HTMLElement>()

// Virtual list using @tanstack/vue-virtual
const virtualList = useVirtualExpenseList({
  expenses: toRef(props, 'expenses'),
  itemHeight: props.itemHeight,
  overscan: props.overscan,
  containerRef
})

// Error handling
const errorState = useExpenseListError()

// Scroll handling with throttling
const { handleScroll } = useExpenseListScroll((data) => {
  emit('scroll', data)
})

// Expense list behavior
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

// Handle retry
const handleRetry = () => {
  errorState.clearError()
  emit('retry')
}

// Expose methods for parent components
defineExpose({
  scrollToExpense: virtualList.scrollToExpense,
  scrollToIndex: virtualList.scrollToIndex,
  scrollToTop: virtualList.scrollToTop,
  scrollToBottom: virtualList.scrollToBottom,
  clearError: errorState.clearError
})
</script>

<style scoped>
.virtual-expense-list {
  @apply w-full relative;
}

.virtual-item {
  @apply w-full;
}

/* Smooth scrolling */
.virtual-expense-list {
  scroll-behavior: smooth;
}

/* Hide scrollbar in production for cleaner look */
.virtual-expense-list::-webkit-scrollbar {
  @apply w-2;
}

.virtual-expense-list::-webkit-scrollbar-track {
  @apply bg-muted;
}

.virtual-expense-list::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/20 rounded-full;
}

.virtual-expense-list::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/30;
}
</style>