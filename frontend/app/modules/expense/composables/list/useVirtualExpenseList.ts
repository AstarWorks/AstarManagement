import { ref, computed, type Ref } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useThrottleFn, useAsyncState } from '@vueuse/core'
import type {IExpense} from "~/modules/expense/types/expense";

export interface IVirtualExpenseListOptions {
  /** Array of expenses to display */
  expenses: Ref<IExpense[]>
  /** Height of each expense item in pixels */
  itemHeight?: number
  /** Number of items to render outside visible area */
  overscan?: number
  /** Container element ref */
  containerRef: Ref<HTMLElement | undefined>
  /** Get unique key for each expense */
  getKey?: (expense: IExpense, index: number) => string
}

export interface IVirtualExpenseListReturn {
  /** Virtual list instance from @tanstack/vue-virtual */
  virtualizer: ReturnType<typeof useVirtualizer<Element, Element>>
  /** Currently visible expenses */
  visibleExpenses: ComputedRef<IExpense[]>
  /** Scroll to specific expense by ID */
  scrollToExpense: (expenseId: string) => void
  /** Scroll to specific index */
  scrollToIndex: (index: number) => void
  /** Scroll to top */
  scrollToTop: () => void
  /** Scroll to bottom */
  scrollToBottom: () => void
  /** Metrics for performance monitoring */
  metrics: {
    totalCount: Ref<number>
    startIndex: Ref<number>
    endIndex: Ref<number>
    isScrolling: Ref<boolean>
  }
}

/**
 * Composable for virtualized expense list using @tanstack/vue-virtual
 * Provides efficient scrolling for large datasets with better performance
 */
export function useVirtualExpenseList(
  options: IVirtualExpenseListOptions
): IVirtualExpenseListReturn {
  const {
    expenses,
    itemHeight = 80,
    overscan = 5,
    containerRef,
    getKey = (expense) => expense.id
  } = options

  // Create virtualizer instance
  const virtualizer = useVirtualizer({
    count: expenses.value.length,
    getScrollElement: () => containerRef.value ?? null,
    estimateSize: () => itemHeight,
    overscan,
    getItemKey: (index) => {
      const expense = expenses.value[index]
      return expense ? getKey(expense, index) : `index-${index}`
    }
  })

  // Get visible expenses
  const visibleExpenses = computed(() => {
    const items = virtualizer.value?.getVirtualItems() || []
    return items.map((item) => expenses.value[item.index]).filter(Boolean) as IExpense[]
  })

  // Scroll to specific expense
  const scrollToExpense = (expenseId: string) => {
    const index = expenses.value.findIndex(expense => expense.id === expenseId)
    if (index !== -1) {
      virtualizer.value.scrollToIndex(index, {
        align: 'center',
        behavior: 'smooth'
      })
    }
  }

  // Scroll helpers
  const scrollToIndex = (index: number) => {
    virtualizer.value.scrollToIndex(index, {
      align: 'center',
      behavior: 'smooth'
    })
  }

  const scrollToTop = () => {
    virtualizer.value.scrollToIndex(0, {
      align: 'start',
      behavior: 'smooth'
    })
  }

  const scrollToBottom = () => {
    const lastIndex = expenses.value.length - 1
    if (lastIndex >= 0) {
      virtualizer.value.scrollToIndex(lastIndex, {
        align: 'end',
        behavior: 'smooth'
      })
    }
  }

  // Metrics for performance monitoring
  const metrics = {
    totalCount: computed(() => expenses.value.length),
    startIndex: computed(() => {
      const items = virtualizer.value?.getVirtualItems() || []
      return items.length > 0 ? items[0]!.index : 0
    }),
    endIndex: computed(() => {
      const items = virtualizer.value?.getVirtualItems() || []
      return items.length > 0 ? items[items.length - 1]!.index : 0
    }),
    isScrolling: computed(() => virtualizer.value?.isScrolling || false)
  }

  return {
    virtualizer: virtualizer as unknown as ReturnType<typeof useVirtualizer<Element, Element>>,
    visibleExpenses,
    scrollToExpense,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    metrics
  }
}

/**
 * Hook for handling expense list errors with VueUse
 */
export function useExpenseListError() {
  const error = ref<Error | null>(null)
  const isError = computed(() => error.value !== null)

  const setError = (err: Error) => {
    error.value = err
  }

  const clearError = () => {
    error.value = null
  }

  const { execute: retry } = useAsyncState(
    async () => {
      clearError()
      // Retry logic will be implemented by parent component
      return true
    },
    false,
    {
      immediate: false,
      resetOnExecute: false
    }
  )

  return {
    error,
    isError,
    setError,
    clearError,
    retry
  }
}

/**
 * Hook for handling expense list scroll events with throttling
 */
export function useExpenseListScroll(
  onScroll?: (data: { scrollTop: number; scrollLeft: number }) => void
) {
  const handleScroll = useThrottleFn((event: Event) => {
    const target = event.target as HTMLElement
    if (target && onScroll) {
      onScroll({
        scrollTop: target.scrollTop,
        scrollLeft: target.scrollLeft
      })
    }
  }, 100)

  return {
    handleScroll
  }
}