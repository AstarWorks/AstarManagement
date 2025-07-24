import { ref, computed, watch } from 'vue'
import type { FilterState, FilterValue } from '~/components/matter/filters/FilterConfig'

interface FilterHistoryEntry {
  id: string
  timestamp: number
  state: FilterState
  action: string
  description: string
}

interface FilterCommand {
  execute: () => void
  undo: () => void
  description: string
}

const MAX_HISTORY_SIZE = 20
const DEBOUNCE_DELAY = 500 // ms to debounce rapid changes

/**
 * Composable for managing filter state history with undo/redo functionality
 * Uses command pattern for atomic operations with proper state management
 */
export function useFilterHistory() {
  // History stacks
  const undoStack = ref<FilterHistoryEntry[]>([])
  const redoStack = ref<FilterHistoryEntry[]>([])
  const currentState = ref<FilterState>({
    filters: [],
    quickSearch: '',
    sortBy: 'createdAt',
    sortDirection: 'desc'
  })

  // Debouncing state
  const pendingState = ref<FilterState | null>(null)
  const debounceTimer = ref<NodeJS.Timeout | null>(null)

  // Computed properties
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)
  const historySize = computed(() => undoStack.value.length + redoStack.value.length)

  /**
   * Generate unique ID for history entries
   */
  const generateEntryId = (): string => {
    return `history-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  }

  /**
   * Deep clone filter state to prevent reference issues
   */
  const cloneFilterState = (state: FilterState): FilterState => {
    return {
      filters: state.filters.map(filter => ({ ...filter })),
      quickSearch: state.quickSearch || '',
      activePreset: state.activePreset,
      sortBy: state.sortBy || 'createdAt',
      sortDirection: state.sortDirection || 'desc'
    }
  }

  /**
   * Compare two filter states for equality
   */
  const areStatesEqual = (state1: FilterState, state2: FilterState): boolean => {
    if (state1.quickSearch !== state2.quickSearch) return false
    if (state1.activePreset !== state2.activePreset) return false
    if (state1.sortBy !== state2.sortBy) return false
    if (state1.sortDirection !== state2.sortDirection) return false
    
    if (state1.filters.length !== state2.filters.length) return false
    
    // Compare filters (order-independent)
    const filters1 = [...state1.filters].sort((a, b) => `${a.field}-${a.operator}`.localeCompare(`${b.field}-${b.operator}`))
    const filters2 = [...state2.filters].sort((a, b) => `${a.field}-${a.operator}`.localeCompare(`${b.field}-${b.operator}`))
    
    return filters1.every((filter1, index) => {
      const filter2 = filters2[index]
      return filter1.field === filter2.field &&
             filter1.operator === filter2.operator &&
             JSON.stringify(filter1.value) === JSON.stringify(filter2.value)
    })
  }

  /**
   * Add entry to undo stack and clear redo stack
   */
  const addToHistory = (state: FilterState, action: string, description: string) => {
    // Don't add if state hasn't changed
    if (undoStack.value.length > 0) {
      const lastEntry = undoStack.value[undoStack.value.length - 1]
      if (areStatesEqual(lastEntry.state, state)) {
        return
      }
    }

    const entry: FilterHistoryEntry = {
      id: generateEntryId(),
      timestamp: Date.now(),
      state: cloneFilterState(state),
      action,
      description
    }

    undoStack.value.push(entry)
    
    // Limit history size
    if (undoStack.value.length > MAX_HISTORY_SIZE) {
      undoStack.value.shift()
    }
    
    // Clear redo stack when new action is performed
    redoStack.value = []
  }

  /**
   * Execute a filter command with automatic history tracking
   */
  const executeCommand = (command: FilterCommand) => {
    const previousState = cloneFilterState(currentState.value)
    
    try {
      command.execute()
      addToHistory(previousState, 'execute', command.description)
    } catch (error) {
      console.error('Failed to execute filter command:', error)
      // Restore previous state if execution fails
      currentState.value = previousState
    }
  }

  /**
   * Update filter state with debouncing and history tracking
   */
  const updateState = (
    newState: FilterState, 
    description: string = 'Filter changed',
    immediate: boolean = false
  ) => {
    if (immediate) {
      // Immediate update (e.g., preset application, undo/redo)
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value)
        debounceTimer.value = null
      }
      
      if (!areStatesEqual(currentState.value, newState)) {
        addToHistory(currentState.value, 'update', description)
        currentState.value = cloneFilterState(newState)
      }
    } else {
      // Debounced update (e.g., typing in search, filter changes)
      pendingState.value = cloneFilterState(newState)
      
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value)
      }
      
      debounceTimer.value = setTimeout(() => {
        if (pendingState.value && !areStatesEqual(currentState.value, pendingState.value)) {
          addToHistory(currentState.value, 'update', description)
          currentState.value = cloneFilterState(pendingState.value)
        }
        pendingState.value = null
        debounceTimer.value = null
      }, DEBOUNCE_DELAY)
    }
  }

  /**
   * Undo last action
   */
  const undo = (): FilterState | null => {
    if (!canUndo.value) return null
    
    const currentEntry: FilterHistoryEntry = {
      id: generateEntryId(),
      timestamp: Date.now(),
      state: cloneFilterState(currentState.value),
      action: 'current',
      description: 'Current state'
    }
    
    const lastEntry = undoStack.value.pop()!
    redoStack.value.push(currentEntry)
    
    currentState.value = cloneFilterState(lastEntry.state)
    return currentState.value
  }

  /**
   * Redo last undone action
   */
  const redo = (): FilterState | null => {
    if (!canRedo.value) return null
    
    const currentEntry: FilterHistoryEntry = {
      id: generateEntryId(),
      timestamp: Date.now(),
      state: cloneFilterState(currentState.value),
      action: 'current',
      description: 'Current state'
    }
    
    const redoEntry = redoStack.value.pop()!
    undoStack.value.push(currentEntry)
    
    currentState.value = cloneFilterState(redoEntry.state)
    return currentState.value
  }

  /**
   * Clear all history
   */
  const clearHistory = () => {
    undoStack.value = []
    redoStack.value = []
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
      debounceTimer.value = null
    }
    pendingState.value = null
  }

  /**
   * Get history summary for debugging/UI
   */
  const getHistorySummary = () => {
    return {
      undoCount: undoStack.value.length,
      redoCount: redoStack.value.length,
      canUndo: canUndo.value,
      canRedo: canRedo.value,
      lastAction: undoStack.value.length > 0 ? undoStack.value[undoStack.value.length - 1].description : null,
      recentActions: undoStack.value.slice(-5).map(entry => ({
        description: entry.description,
        timestamp: new Date(entry.timestamp).toLocaleTimeString(),
        filterCount: entry.state.filters.length
      }))
    }
  }

  /**
   * Specific filter manipulation commands
   */
  const commands = {
    addFilter: (filter: FilterValue): FilterCommand => ({
      execute: () => {
        const newFilters = currentState.value.filters.filter(f => f.field !== filter.field)
        newFilters.push(filter)
        currentState.value = {
          ...currentState.value,
          filters: newFilters
        }
      },
      undo: () => {
        currentState.value = {
          ...currentState.value,
          filters: currentState.value.filters.filter(f => f.field !== filter.field)
        }
      },
      description: `Add ${filter.field} filter`
    }),

    removeFilter: (field: string): FilterCommand => {
      const existingFilter = currentState.value.filters.find(f => f.field === field)
      return {
        execute: () => {
          currentState.value = {
            ...currentState.value,
            filters: currentState.value.filters.filter(f => f.field !== field)
          }
        },
        undo: () => {
          if (existingFilter) {
            currentState.value = {
              ...currentState.value,
              filters: [...currentState.value.filters, existingFilter]
            }
          }
        },
        description: `Remove ${field} filter`
      }
    },

    clearAllFilters: (): FilterCommand => {
      const currentFilters = [...currentState.value.filters]
      const currentSearch = currentState.value.quickSearch
      return {
        execute: () => {
          currentState.value = {
            ...currentState.value,
            filters: [],
            quickSearch: ''
          }
        },
        undo: () => {
          currentState.value = {
            ...currentState.value,
            filters: currentFilters,
            quickSearch: currentSearch || ''
          }
        },
        description: 'Clear all filters'
      }
    },

    updateQuickSearch: (searchTerm: string): FilterCommand => {
      const previousSearch = currentState.value.quickSearch
      return {
        execute: () => {
          currentState.value = {
            ...currentState.value,
            quickSearch: searchTerm
          }
        },
        undo: () => {
          currentState.value = {
            ...currentState.value,
            quickSearch: previousSearch || ''
          }
        },
        description: searchTerm ? `Search: "${searchTerm}"` : 'Clear search'
      }
    },

    applyPreset: (preset: { name: string; filters: FilterValue[] }): FilterCommand => {
      const previousState = cloneFilterState(currentState.value)
      return {
        execute: () => {
          currentState.value = {
            ...currentState.value,
            filters: [...preset.filters],
            activePreset: preset.name
          }
        },
        undo: () => {
          currentState.value = previousState
        },
        description: `Apply preset: ${preset.name}`
      }
    }
  }

  /**
   * Keyboard shortcut handling
   */
  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      undo()
      return true
    }
    
    if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault()
      redo()
      return true
    }
    
    return false
  }

  return {
    // State
    currentState,
    canUndo,
    canRedo,
    historySize,
    
    // Methods
    updateState,
    undo,
    redo,
    clearHistory,
    executeCommand,
    getHistorySummary,
    handleKeyboardShortcut,
    
    // Commands
    commands,
    
    // Utils
    areStatesEqual,
    cloneFilterState
  }
}