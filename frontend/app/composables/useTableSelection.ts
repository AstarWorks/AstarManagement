import { computed, ref, type Ref } from 'vue'
import { useVModel } from '@vueuse/core'
import { z } from 'zod'

/**
 * Zod schema for selection state validation
 */
const selectionSchema = z.array(z.string())

/**
 * Generic table selection composable
 * Following Simple over Easy principle with explicit state modeling
 */
export function useTableSelection<T extends { id: string }>(
  items: Ref<T[]>,
  initialSelected: string[] = [],
  emit?: (event: 'update:selectedIds', value: string[]) => void
) {
  // Validate initial selection
  const validatedInitial = selectionSchema.parse(initialSelected)
  
  // Selection state management
  const selectedIds = ref<string[]>(validatedInitial)

  // Computed properties for selection states
  const selectedItems = computed(() => 
    items.value.filter(item => selectedIds.value.includes(item.id))
  )

  const selectedCount = computed(() => selectedIds.value.length)

  const isAllSelected = computed(() => 
    items.value.length > 0 && selectedIds.value.length === items.value.length
  )

  const isPartiallySelected = computed(() => 
    selectedIds.value.length > 0 && selectedIds.value.length < items.value.length
  )

  const hasSelection = computed(() => selectedIds.value.length > 0)

  /**
   * Check if specific item is selected
   */
  const isSelected = (itemId: string): boolean => {
    return selectedIds.value.includes(itemId)
  }

  /**
   * Toggle selection for a specific item
   * Simple over Easy: Clear logic without complex state management
   */
  const toggleSelection = (itemId: string) => {
    const index = selectedIds.value.indexOf(itemId)
    
    if (index > -1) {
      // Remove from selection
      selectedIds.value.splice(index, 1)
    } else {
      // Add to selection
      selectedIds.value.push(itemId)
    }

    // Emit update if handler provided
    if (emit) {
      emit('update:selectedIds', selectedIds.value)
    }
  }

  /**
   * Select all items
   */
  const selectAll = () => {
    selectedIds.value = items.value.map(item => item.id)
    
    if (emit) {
      emit('update:selectedIds', selectedIds.value)
    }
  }

  /**
   * Clear all selections
   */
  const clearSelection = () => {
    selectedIds.value = []
    
    if (emit) {
      emit('update:selectedIds', selectedIds.value)
    }
  }

  /**
   * Toggle select all (select all if none selected, clear if all selected)
   */
  const toggleSelectAll = () => {
    if (isAllSelected.value) {
      clearSelection()
    } else {
      selectAll()
    }
  }

  /**
   * Select multiple items by IDs
   */
  const selectItems = (itemIds: string[]) => {
    const validIds = selectionSchema.parse(itemIds)
    const availableIds = items.value.map(item => item.id)
    
    // Only select items that actually exist in the current items list
    selectedIds.value = validIds.filter(id => availableIds.includes(id))
    
    if (emit) {
      emit('update:selectedIds', selectedIds.value)
    }
  }

  /**
   * Remove specific items from selection
   */
  const deselectItems = (itemIds: string[]) => {
    const validIds = selectionSchema.parse(itemIds)
    selectedIds.value = selectedIds.value.filter(id => !validIds.includes(id))
    
    if (emit) {
      emit('update:selectedIds', selectedIds.value)
    }
  }

  /**
   * Get selection statistics
   */
  const getSelectionStats = () => ({
    total: items.value.length,
    selected: selectedIds.value.length,
    unselected: items.value.length - selectedIds.value.length,
    percentage: items.value.length > 0 
      ? Math.round((selectedIds.value.length / items.value.length) * 100) 
      : 0
  })

  return {
    // State
    selectedIds,
    selectedItems,
    
    // Computed
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    hasSelection,
    
    // Methods
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    selectItems,
    deselectItems,
    getSelectionStats
  }
}

/**
 * Specialized version for expense table with built-in v-model support
 */
export function useExpenseTableSelection(
  expenses: Ref<Array<{ id: string; [key: string]: unknown }>>,
  props: { selectedIds?: string[] },
  emit: (event: 'update:selectedIds', value: string[]) => void
) {
  const selectedIds = useVModel(props, 'selectedIds', emit, {
    defaultValue: []
  })

  return useTableSelection(expenses, selectedIds.value, 
    (event, value) => emit('update:selectedIds', value)
  )
}