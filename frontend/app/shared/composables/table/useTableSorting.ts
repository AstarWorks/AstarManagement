import { computed, ref } from 'vue'
import { useVModel } from '@vueuse/core'
import { z } from 'zod'

/**
 * Zod schemas for sort configuration validation
 */
const sortOrderSchema = z.enum(['ASC', 'DESC'])
const sortConfigSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: sortOrderSchema.default('ASC')
})

export type SortOrder = z.infer<typeof sortOrderSchema>
export type SortConfig = z.infer<typeof sortConfigSchema>

/**
 * Table sorting composable
 * Provides sorting state management with type safety
 */
export function useTableSorting(
  initialConfig: SortConfig = { sortOrder: 'ASC' },
  emit?: (event: 'sortChange', value: SortConfig) => void
) {
  // Validate initial configuration
  const validatedConfig = sortConfigSchema.parse(initialConfig)
  
  // Sort state
  const sortBy = ref<string | undefined>(validatedConfig.sortBy)
  const sortOrder = ref<SortOrder>(validatedConfig.sortOrder)

  // Computed sort configuration
  const sortConfig = computed<SortConfig>(() => ({
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  }))

  /**
   * Check if a column is currently being sorted
   */
  const isSortedBy = (columnKey: string): boolean => {
    return sortBy.value === columnKey
  }

  /**
   * Get sort icon name for a column
   */
  const getSortIcon = (columnKey: string): string => {
    if (!isSortedBy(columnKey)) {
      return 'lucide:chevrons-up-down' // neutral state
    }
    
    return sortOrder.value === 'ASC' 
      ? 'lucide:chevron-up' 
      : 'lucide:chevron-down'
  }

  /**
   * Get CSS classes for sortable column headers
   */
  const getSortableHeaderClass = (columnKey: string, isSortable: boolean = true): string => {
    const baseClass = 'select-none'
    
    if (!isSortable) return baseClass
    
    const sortableClass = 'cursor-pointer hover:bg-muted/50 transition-colors'
    const activeClass = isSortedBy(columnKey) ? 'bg-muted/30' : ''
    
    return [baseClass, sortableClass, activeClass].filter(Boolean).join(' ')
  }

  /**
   * Handle column sort with toggle behavior
   * Simple over Easy: Clear toggle logic
   */
  const handleSort = (columnKey: string, isSortable: boolean = true) => {
    if (!isSortable) return

    let newSortOrder: SortOrder = 'ASC'
    
    if (sortBy.value === columnKey) {
      // Toggle sort order for same column
      newSortOrder = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
    } else {
      // New column, start with ASC
      newSortOrder = 'ASC'
    }

    // Update state
    sortBy.value = columnKey
    sortOrder.value = newSortOrder

    // Emit change
    if (emit) {
      emit('sortChange', sortConfig.value)
    }
  }

  /**
   * Set sort configuration directly
   */
  const setSortConfig = (config: Partial<SortConfig>) => {
    const validatedConfig = sortConfigSchema.parse({
      ...sortConfig.value,
      ...config
    })

    sortBy.value = validatedConfig.sortBy
    sortOrder.value = validatedConfig.sortOrder

    if (emit) {
      emit('sortChange', sortConfig.value)
    }
  }

  /**
   * Clear sorting
   */
  const clearSort = () => {
    sortBy.value = undefined
    sortOrder.value = 'ASC'

    if (emit) {
      emit('sortChange', sortConfig.value)
    }
  }

  /**
   * Client-side sorting function for arrays
   * Generic utility for local sorting
   */
  const sortItems = <T>(
    items: T[], 
    getSortValue: (item: T, sortKey: string) => unknown,
    currentSortBy?: string,
    currentSortOrder?: SortOrder
  ): T[] => {
    const activeSortBy = currentSortBy || sortBy.value
    const activeSortOrder = currentSortOrder || sortOrder.value

    if (!activeSortBy) return items

    return [...items].sort((a, b) => {
      const aValue = getSortValue(a, activeSortBy)
      const bValue = getSortValue(b, activeSortBy)

      // Handle null/undefined values
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return 1
      if (bValue === null) return -1

      let comparison = 0
      
      // Type-safe comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        // Fallback to string comparison
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return activeSortOrder === 'DESC' ? -comparison : comparison
    })
  }

  return {
    // State
    sortBy,
    sortOrder,
    sortConfig,

    // Methods
    isSortedBy,
    getSortIcon,
    getSortableHeaderClass,
    handleSort,
    setSortConfig,
    clearSort,
    sortItems
  }
}

/**
 * Specialized version for expense table with v-model support
 */
export function useExpenseTableSorting(
  props: { sortBy?: string; sortOrder?: SortOrder },
  emit: (event: 'sortChange', value: SortConfig) => void
) {
  const sortBy = useVModel(props, 'sortBy', emit)
  const sortOrder = useVModel(props, 'sortOrder', emit, { defaultValue: 'ASC' as SortOrder })

  return useTableSorting(
    { sortBy: sortBy.value, sortOrder: sortOrder.value || 'ASC' },
    (event, value) => emit('sortChange', value)
  )
}