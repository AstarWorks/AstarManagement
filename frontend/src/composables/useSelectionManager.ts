import { ref, computed, reactive, watch } from 'vue'
import type { Matter } from '~/types/matter'

export interface SelectionState {
  selectedIds: Set<string>
  lastSelectedId: string | null
  totalCount: number
  isSelectingAll: boolean
  selectAllState: 'none' | 'partial' | 'all'
}

export interface SelectionFilters {
  search?: string
  status?: string[]
  priority?: string[]
  assignee?: string[]
  dateRange?: {
    start: Date
    end: Date
    field: 'createdAt' | 'updatedAt' | 'dueDate'
  }
}

export function useSelectionManager(items: Ref<Matter[]>) {
  // Core selection state
  const state = reactive<SelectionState>({
    selectedIds: new Set<string>(),
    lastSelectedId: null,
    totalCount: 0,
    isSelectingAll: false,
    selectAllState: 'none'
  })

  // Persist selection across pagination and filtering
  const persistentSelection = ref<Set<string>>(new Set())
  const selectionFilters = ref<SelectionFilters>({})

  // Computed properties
  const selectedItems = computed(() => 
    items.value.filter(item => state.selectedIds.has(item.id))
  )

  const selectedCount = computed(() => state.selectedIds.size)

  const totalAvailableCount = computed(() => {
    // Count items that match current filters
    return items.value.length
  })

  const isAllSelected = computed(() => 
    state.selectAllState === 'all' && selectedCount.value > 0
  )

  const isPartialSelection = computed(() => 
    state.selectAllState === 'partial' && selectedCount.value > 0
  )

  const hasSelection = computed(() => selectedCount.value > 0)

  // Update selection state based on current items
  watch([items, () => state.selectedIds.size], () => {
    const currentlyVisible = items.value.filter(item => state.selectedIds.has(item.id)).length
    const totalVisible = items.value.length

    if (currentlyVisible === 0) {
      state.selectAllState = 'none'
    } else if (currentlyVisible === totalVisible && totalVisible > 0) {
      state.selectAllState = 'all'
    } else {
      state.selectAllState = 'partial'
    }

    state.totalCount = totalVisible
  }, { immediate: true })

  // Core selection methods
  const selectItem = (id: string) => {
    state.selectedIds.add(id)
    persistentSelection.value.add(id)
    state.lastSelectedId = id
  }

  const deselectItem = (id: string) => {
    state.selectedIds.delete(id)
    persistentSelection.value.delete(id)
    if (state.lastSelectedId === id) {
      state.lastSelectedId = null
    }
  }

  const toggleItem = (id: string) => {
    if (state.selectedIds.has(id)) {
      deselectItem(id)
    } else {
      selectItem(id)
    }
  }

  // Range selection with Shift+Click
  const selectRange = (targetId: string) => {
    if (!state.lastSelectedId) {
      selectItem(targetId)
      return
    }

    const currentIndex = items.value.findIndex(item => item.id === targetId)
    const lastIndex = items.value.findIndex(item => item.id === state.lastSelectedId)

    if (currentIndex === -1 || lastIndex === -1) {
      selectItem(targetId)
      return
    }

    const start = Math.min(currentIndex, lastIndex)
    const end = Math.max(currentIndex, lastIndex)

    for (let i = start; i <= end; i++) {
      selectItem(items.value[i].id)
    }
  }

  // Bulk selection methods
  const selectAll = () => {
    state.isSelectingAll = true
    items.value.forEach(item => {
      state.selectedIds.add(item.id)
      persistentSelection.value.add(item.id)
    })
    state.selectAllState = 'all'
    state.isSelectingAll = false
  }

  const selectNone = () => {
    state.selectedIds.clear()
    persistentSelection.value.clear()
    state.selectAllState = 'none'
    state.lastSelectedId = null
  }

  const selectInverse = () => {
    const newSelection = new Set<string>()
    items.value.forEach(item => {
      if (!state.selectedIds.has(item.id)) {
        newSelection.add(item.id)
        persistentSelection.value.add(item.id)
      } else {
        persistentSelection.value.delete(item.id)
      }
    })
    state.selectedIds = newSelection
    
    const selectedVisible = items.value.filter(item => newSelection.has(item.id)).length
    const totalVisible = items.value.length
    
    if (selectedVisible === 0) {
      state.selectAllState = 'none'
    } else if (selectedVisible === totalVisible) {
      state.selectAllState = 'all'
    } else {
      state.selectAllState = 'partial'
    }
  }

  // Filter-based selection
  const selectByFilter = (filterFn: (item: Matter) => boolean) => {
    items.value.forEach(item => {
      if (filterFn(item)) {
        selectItem(item.id)
      }
    })
  }

  const selectByStatus = (statuses: string[]) => {
    selectByFilter(item => statuses.includes(item.status))
  }

  const selectByPriority = (priorities: string[]) => {
    selectByFilter(item => priorities.includes(item.priority))
  }

  const selectByAssignee = (assigneeNames: string[]) => {
    selectByFilter(item => {
      const assigneeName = typeof item.assignedLawyer === 'string' 
        ? item.assignedLawyer 
        : item.assignedLawyer?.name || ''
      return assigneeNames.includes(assigneeName)
    })
  }

  // Persistence across navigation
  const restoreSelection = () => {
    state.selectedIds = new Set(persistentSelection.value)
  }

  const saveSelection = () => {
    // Save to localStorage for cross-session persistence
    const selectionData = {
      selectedIds: Array.from(persistentSelection.value),
      filters: selectionFilters.value,
      timestamp: Date.now()
    }
    localStorage.setItem('matter-selection', JSON.stringify(selectionData))
  }

  const loadSelection = () => {
    try {
      const saved = localStorage.getItem('matter-selection')
      if (saved) {
        const data = JSON.parse(saved)
        // Only restore if less than 1 hour old
        if (Date.now() - data.timestamp < 3600000) {
          persistentSelection.value = new Set(data.selectedIds)
          selectionFilters.value = data.filters || {}
          restoreSelection()
        }
      }
    } catch (error) {
      console.warn('Failed to load selection from localStorage:', error)
    }
  }

  const clearSavedSelection = () => {
    localStorage.removeItem('matter-selection')
    persistentSelection.value.clear()
    selectNone()
  }

  // Export selected items with metadata
  const getSelectionSummary = () => {
    const summary = {
      selectedCount: selectedCount.value,
      totalCount: totalAvailableCount.value,
      selectionPercentage: totalAvailableCount.value > 0 
        ? Math.round((selectedCount.value / totalAvailableCount.value) * 100) 
        : 0,
      selectedItems: selectedItems.value,
      hasSelection: hasSelection.value,
      isAllSelected: isAllSelected.value,
      isPartialSelection: isPartialSelection.value,
      filters: { ...selectionFilters.value },
      timestamp: new Date().toISOString()
    }
    return summary
  }

  // Initialize
  loadSelection()

  // Auto-save selection changes
  watch([() => state.selectedIds.size, selectionFilters], () => {
    saveSelection()
  }, { flush: 'post' })

  return {
    // State
    state: readonly(state),
    selectedItems,
    selectedCount,
    totalAvailableCount,
    hasSelection,
    isAllSelected,
    isPartialSelection,

    // Core methods
    selectItem,
    deselectItem,
    toggleItem,
    selectRange,

    // Bulk methods
    selectAll,
    selectNone,
    selectInverse,

    // Filter methods
    selectByFilter,
    selectByStatus,
    selectByPriority,
    selectByAssignee,

    // Persistence methods
    restoreSelection,
    saveSelection,
    loadSelection,
    clearSavedSelection,
    getSelectionSummary,

    // Filters
    selectionFilters
  }
}