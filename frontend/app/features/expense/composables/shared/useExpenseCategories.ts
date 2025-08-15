import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Expense category interface
 */
interface IExpenseCategory {
  value: string
  labelKey: string
  color?: string
}

/**
 * Composable for expense category management
 * Following "Simple over Easy" principle with explicit state modeling
 */
export function useExpenseCategories() {
  const { t } = useI18n()

  // State - using explicit state modeling instead of union types
  const categories = ref<IExpenseCategory[]>([
    { value: 'travel', labelKey: 'expense.categories.travel' },
    { value: 'meal', labelKey: 'expense.categories.meal' },
    { value: 'office', labelKey: 'expense.categories.office' },
    { value: 'communication', labelKey: 'expense.categories.communication' },
    { value: 'other', labelKey: 'expense.categories.other' }
  ])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const categoryOptions = computed(() => 
    categories.value.map(category => ({
      value: category.value,
      label: t(category.labelKey)
    }))
  )

  // Methods
  const getCategoryLabel = (categoryValue: string): string => {
    const category = categories.value.find(c => c.value === categoryValue)
    return category ? t(category.labelKey) : categoryValue
  }

  const getCategoryByValue = (value: string): IExpenseCategory | undefined => {
    return categories.value.find(c => c.value === value)
  }

  const validateCategory = (categoryValue: string): boolean => {
    return categories.value.some(c => c.value === categoryValue)
  }

  // Future: Load categories from API
  const loadCategories = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await $fetch('/api/expenses/categories')
      // categories.value = response.data
      
      // For now, use static data
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load categories'
      console.error('Failed to load expense categories:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    categories: readonly(categories),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Computed
    categoryOptions,
    
    // Methods
    getCategoryLabel,
    getCategoryByValue,
    validateCategory,
    loadCategories
  }
}

// Export types for better type safety
export type { IExpenseCategory }