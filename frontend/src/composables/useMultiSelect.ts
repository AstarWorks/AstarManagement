/**
 * Multi-Select Composable for Kanban Board
 * 
 * @description Provides reusable multi-select functionality with keyboard navigation,
 * range selection, touch gestures, and accessibility features.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T10_S12 - Kanban Multi-Select and Bulk Operations
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useEventListener, useKeyModifier } from '@vueuse/core'
import type { MatterCard } from '~/types/kanban'
import { useAccessibility } from '~/composables/useAccessibility'

/**
 * Selection state interface
 */
export interface SelectionState {
  selectedIds: Set<string>
  lastSelectedId: string | null
  selectionMode: 'single' | 'range' | 'multiple'
  isActive: boolean
  anchor: string | null // For range selection
}

/**
 * Multi-select options
 */
export interface MultiSelectOptions {
  /** Allow multiple selection */
  multiple?: boolean
  /** Enable keyboard navigation */
  keyboardNavigation?: boolean
  /** Enable touch gestures */
  touchGestures?: boolean
  /** Maximum number of items that can be selected */
  maxSelection?: number
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<string>) => void
  /** Callback for range selection validation */
  onRangeValidation?: (startId: string, endId: string) => boolean
}

/**
 * Multi-select composable
 */
export function useMultiSelect(
  items: Ref<MatterCard[]>,
  options: MultiSelectOptions = {}
) {
  const {
    multiple = true,
    keyboardNavigation = true,
    touchGestures = true,
    maxSelection = 100,
    onSelectionChange,
    onRangeValidation
  } = options

  const { announceUpdate } = useAccessibility()

  // Selection state
  const state = ref<SelectionState>({
    selectedIds: new Set(),
    lastSelectedId: null,
    selectionMode: 'single',
    isActive: false,
    anchor: null
  })

  // Keyboard modifiers
  const ctrlPressed = useKeyModifier('Control')
  const metaPressed = useKeyModifier('Meta')
  const shiftPressed = useKeyModifier('Shift')

  // Computed properties
  const selectedItems = computed(() => 
    items.value.filter(item => state.value.selectedIds.has(item.id))
  )

  const isMultiSelectMode = computed(() => 
    state.value.selectedIds.size > 1
  )

  const selectedCount = computed(() => 
    state.value.selectedIds.size
  )

  const isAllSelected = computed(() => 
    items.value.length > 0 && state.value.selectedIds.size === items.value.length
  )

  const canSelectMore = computed(() => 
    state.value.selectedIds.size < maxSelection
  )

  /**
   * Check if an item is selected
   */
  const isSelected = (itemId: string): boolean => {
    return state.value.selectedIds.has(itemId)
  }

  /**
   * Get item index by ID
   */
  const getItemIndex = (itemId: string): number => {
    return items.value.findIndex(item => item.id === itemId)
  }

  /**
   * Get items between two indices (inclusive)
   */
  const getItemsInRange = (startIndex: number, endIndex: number): MatterCard[] => {
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    return items.value.slice(start, end + 1)
  }

  /**
   * Toggle single item selection
   */
  const toggleItem = (itemId: string): void => {
    if (!canSelectMore.value && !state.value.selectedIds.has(itemId)) {
      announceUpdate(`Cannot select more than ${maxSelection} items`)
      return
    }

    const wasSelected = state.value.selectedIds.has(itemId)
    
    if (wasSelected) {
      state.value.selectedIds.delete(itemId)
    } else {
      if (!multiple) {
        state.value.selectedIds.clear()
      }
      state.value.selectedIds.add(itemId)
    }

    state.value.lastSelectedId = itemId
    state.value.anchor = itemId
    state.value.selectionMode = multiple ? 'multiple' : 'single'
    state.value.isActive = state.value.selectedIds.size > 0

    // Announce change
    const item = items.value.find(i => i.id === itemId)
    if (item) {
      const action = wasSelected ? 'Deselected' : 'Selected'
      announceUpdate(`${action} matter ${item.caseNumber}: ${item.title}`)
    }

    onSelectionChange?.(state.value.selectedIds)
  }

  /**
   * Select range from anchor to target
   */
  const selectRange = (targetId: string): void => {
    if (!multiple || !state.value.anchor) {
      toggleItem(targetId)
      return
    }

    const anchorIndex = getItemIndex(state.value.anchor)
    const targetIndex = getItemIndex(targetId)

    if (anchorIndex === -1 || targetIndex === -1) return

    // Validate range if callback provided
    if (onRangeValidation && !onRangeValidation(state.value.anchor, targetId)) {
      announceUpdate('Range selection not allowed for these items')
      return
    }

    const rangeItems = getItemsInRange(anchorIndex, targetIndex)
    
    // Check if we can select all items in range
    const newSelections = rangeItems.filter(item => !state.value.selectedIds.has(item.id))
    if (state.value.selectedIds.size + newSelections.length > maxSelection) {
      announceUpdate(`Cannot select range: would exceed maximum of ${maxSelection} items`)
      return
    }

    // Clear current selection and select range
    state.value.selectedIds.clear()
    rangeItems.forEach(item => {
      state.value.selectedIds.add(item.id)
    })

    state.value.lastSelectedId = targetId
    state.value.selectionMode = 'range'
    state.value.isActive = true

    // Announce range selection
    announceUpdate(`Selected ${rangeItems.length} matters in range`)
    onSelectionChange?.(state.value.selectedIds)
  }

  /**
   * Handle item click with modifier keys
   */
  const handleItemClick = (itemId: string, event?: MouseEvent): void => {
    const isModifierPressed = ctrlPressed.value || metaPressed.value

    if (event && shiftPressed.value && multiple) {
      // Range selection
      selectRange(itemId)
    } else if (isModifierPressed && multiple) {
      // Toggle individual item
      toggleItem(itemId)
    } else {
      // Single selection (clear others)
      if (multiple && !isModifierPressed) {
        state.value.selectedIds.clear()
      }
      toggleItem(itemId)
    }
  }

  /**
   * Select all items
   */
  const selectAll = (): void => {
    if (items.value.length > maxSelection) {
      announceUpdate(`Cannot select all: maximum ${maxSelection} items allowed`)
      return
    }

    state.value.selectedIds.clear()
    items.value.forEach(item => {
      state.value.selectedIds.add(item.id)
    })

    state.value.selectionMode = 'multiple'
    state.value.isActive = true
    state.value.lastSelectedId = items.value[items.value.length - 1]?.id || null

    announceUpdate(`Selected all ${items.value.length} matters`)
    onSelectionChange?.(state.value.selectedIds)
  }

  /**
   * Clear all selections
   */
  const clearSelection = (): void => {
    const count = state.value.selectedIds.size
    state.value.selectedIds.clear()
    state.value.lastSelectedId = null
    state.value.anchor = null
    state.value.selectionMode = 'single'
    state.value.isActive = false

    if (count > 0) {
      announceUpdate(`Cleared selection of ${count} matters`)
      onSelectionChange?.(state.value.selectedIds)
    }
  }

  /**
   * Select items by predicate
   */
  const selectWhere = (predicate: (item: MatterCard) => boolean): void => {
    const matchingItems = items.value.filter(predicate)
    
    if (matchingItems.length > maxSelection) {
      announceUpdate(`Cannot select ${matchingItems.length} items: maximum ${maxSelection} allowed`)
      return
    }

    state.value.selectedIds.clear()
    matchingItems.forEach(item => {
      state.value.selectedIds.add(item.id)
    })

    state.value.selectionMode = 'multiple'
    state.value.isActive = matchingItems.length > 0

    announceUpdate(`Selected ${matchingItems.length} matters matching criteria`)
    onSelectionChange?.(state.value.selectedIds)
  }

  /**
   * Invert selection
   */
  const invertSelection = (): void => {
    const currentSelected = new Set(state.value.selectedIds)
    state.value.selectedIds.clear()

    items.value.forEach(item => {
      if (!currentSelected.has(item.id)) {
        state.value.selectedIds.add(item.id)
      }
    })

    if (state.value.selectedIds.size > maxSelection) {
      // Revert if too many items
      state.value.selectedIds = currentSelected
      announceUpdate(`Cannot invert selection: would exceed maximum of ${maxSelection} items`)
      return
    }

    state.value.selectionMode = 'multiple'
    state.value.isActive = state.value.selectedIds.size > 0

    announceUpdate(`Inverted selection: ${state.value.selectedIds.size} matters now selected`)
    onSelectionChange?.(state.value.selectedIds)
  }

  /**
   * Navigate selection with keyboard
   */
  const navigateSelection = (direction: 'up' | 'down' | 'home' | 'end'): void => {
    if (items.value.length === 0) return

    let targetIndex = 0
    const currentIndex = state.value.lastSelectedId 
      ? getItemIndex(state.value.lastSelectedId)
      : -1

    switch (direction) {
      case 'up':
        targetIndex = Math.max(0, currentIndex - 1)
        break
      case 'down':
        targetIndex = Math.min(items.value.length - 1, currentIndex + 1)
        break
      case 'home':
        targetIndex = 0
        break
      case 'end':
        targetIndex = items.value.length - 1
        break
    }

    const targetItem = items.value[targetIndex]
    if (targetItem) {
      if (shiftPressed.value && multiple) {
        selectRange(targetItem.id)
      } else {
        handleItemClick(targetItem.id)
      }

      // Scroll item into view
      nextTick(() => {
        const element = document.querySelector(`[data-matter-id="${targetItem.id}"]`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }

  /**
   * Keyboard event handler
   */
  const handleKeydown = (event: KeyboardEvent): void => {
    if (!keyboardNavigation || !state.value.isActive) return

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        navigateSelection('up')
        break
      case 'ArrowDown':
        event.preventDefault()
        navigateSelection('down')
        break
      case 'Home':
        event.preventDefault()
        navigateSelection('home')
        break
      case 'End':
        event.preventDefault()
        navigateSelection('end')
        break
      case ' ':
        event.preventDefault()
        if (state.value.lastSelectedId) {
          toggleItem(state.value.lastSelectedId)
        }
        break
      case 'Escape':
        clearSelection()
        break
      case 'a':
        if (ctrlPressed.value || metaPressed.value) {
          event.preventDefault()
          selectAll()
        }
        break
    }
  }

  /**
   * Touch gesture handling for mobile
   */
  const handleLongPress = (itemId: string): void => {
    if (!touchGestures) return

    // Long press starts multi-select mode
    if (!state.value.isActive) {
      toggleItem(itemId)
      announceUpdate('Multi-select mode activated. Tap additional items to select.')
    }
  }

  /**
   * Clean up selection state when items change
   */
  watch(items, (newItems) => {
    // Remove selections for items that no longer exist
    const existingIds = new Set(newItems.map(item => item.id))
    const validSelections = new Set(
      Array.from(state.value.selectedIds).filter(id => existingIds.has(id))
    )

    if (validSelections.size !== state.value.selectedIds.size) {
      state.value.selectedIds = validSelections
      state.value.isActive = validSelections.size > 0
      
      if (state.value.lastSelectedId && !existingIds.has(state.value.lastSelectedId)) {
        state.value.lastSelectedId = validSelections.size > 0 
          ? Array.from(validSelections)[0] 
          : null
      }

      onSelectionChange?.(state.value.selectedIds)
    }
  }, { deep: true })

  // Register keyboard event listener
  if (keyboardNavigation) {
    useEventListener('keydown', handleKeydown)
  }

  return {
    // State
    selectedIds: computed(() => state.value.selectedIds),
    selectedItems,
    selectedCount,
    isMultiSelectMode,
    isAllSelected,
    canSelectMore,
    selectionMode: computed(() => state.value.selectionMode),
    isActive: computed(() => state.value.isActive),

    // Selection methods
    isSelected,
    toggleItem,
    selectRange,
    handleItemClick,
    selectAll,
    clearSelection,
    selectWhere,
    invertSelection,

    // Navigation
    navigateSelection,

    // Touch gestures
    handleLongPress,

    // Utilities
    getItemIndex,
    getItemsInRange,

    // Raw state for advanced usage
    state: readonly(state)
  }
}

/**
 * Type for the return value of useMultiSelect
 */
export type MultiSelectInstance = ReturnType<typeof useMultiSelect>