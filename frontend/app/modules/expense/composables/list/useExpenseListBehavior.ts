import { computed } from 'vue'
import type { IExpense } from '~/modules/expense/types'

// Type-safe emit interface for expense list behavior
export interface IExpenseListBehaviorEmits {
  select: (data: { expenseId: string; selected: boolean }) => void
  edit: (expense: IExpense) => void
  view: (expense: IExpense) => void
  delete: (expense: IExpense) => void
  duplicate: (expense: IExpense) => void
  scroll: (data: { scrollTop: number; scrollLeft: number }) => void
  visibleRangeChange: (data: { startIndex: number; endIndex: number }) => void
  retry: () => void
  refresh: () => void
}

export interface IExpenseListBehaviorOptions {
  /** Currently selected expense IDs */
  selectedIds: string[]
  /** Whether the list is in loading state */
  loading: boolean
}

export interface IExpenseListBehaviorReturn {
  /** Event handlers for expense list actions */
  handlers: {
    handleSelect: (data: { expenseId: string; selected: boolean }) => void
    handleEdit: (expense: IExpense) => void
    handleView: (expense: IExpense) => void
    handleDelete: (expense: IExpense) => void
    handleDuplicate: (expense: IExpense) => void
    handleScroll: (data: { scrollTop: number; scrollLeft: number }) => void
    handleVisibleRangeChange: (data: { startIndex: number; endIndex: number }) => void
  }
  /** Computed properties for expense list state */
  computed: {
    /** Whether an expense is selected */
    isExpenseSelected: (expenseId: string) => boolean
    /** Whether the list has any selections */
    hasSelections: boolean
    /** Count of selected expenses */
    selectedCount: number
  }
}

/**
 * Composable for expense list behavior and business logic
 * Handles expense-specific actions and state management
 */
export function useExpenseListBehavior(
  options: IExpenseListBehaviorOptions,
  emit: IExpenseListBehaviorEmits
): IExpenseListBehaviorReturn {
  
  // Event handlers - delegate to parent through emits
  const handleSelect = (data: { expenseId: string; selected: boolean }) => {
    emit.select(data)
  }

  const handleEdit = (expense: IExpense) => {
    emit.edit(expense)
  }

  const handleView = (expense: IExpense) => {
    emit.view(expense)
  }

  const handleDelete = (expense: IExpense) => {
    emit.delete(expense)
  }

  const handleDuplicate = (expense: IExpense) => {
    emit.duplicate(expense)
  }

  const handleScroll = (data: { scrollTop: number; scrollLeft: number }) => {
    emit.scroll(data)
  }

  const handleVisibleRangeChange = (data: { startIndex: number; endIndex: number }) => {
    emit.visibleRangeChange(data)
  }

  // Computed properties for selection state
  const isExpenseSelected = (expenseId: string): boolean => {
    return options.selectedIds.includes(expenseId)
  }

  const hasSelections = computed(() => options.selectedIds.length > 0)
  const selectedCount = computed(() => options.selectedIds.length)

  return {
    handlers: {
      handleSelect,
      handleEdit,
      handleView,
      handleDelete,
      handleDuplicate,
      handleScroll,
      handleVisibleRangeChange
    },
    computed: {
      isExpenseSelected,
      hasSelections: hasSelections.value,
      selectedCount: selectedCount.value
    }
  }
}

/**
 * Utility function to find expense by ID
 */
export function findExpenseById(expenses: IExpense[], expenseId: string): IExpense | undefined {
  return expenses.find(expense => expense.id === expenseId)
}

/**
 * Utility function to scroll to specific expense
 */
export function createExpenseScrollHelper(
  expenses: IExpense[],
  scrollToIndex: (index: number) => void
) {
  return {
    scrollToExpense: (expenseId: string) => {
      const index = expenses.findIndex(expense => expense.id === expenseId)
      if (index !== -1) {
        scrollToIndex(index)
      }
    }
  }
}