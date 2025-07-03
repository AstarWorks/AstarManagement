import { ref, reactive, computed, nextTick, readonly } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { Matter } from '~/types/matter'

interface EditState {
  rowId: string
  columnId: string
  originalValue: any
  currentValue: any
  isDirty: boolean
  isSaving: boolean
  error?: string
}

interface EditHistory {
  rowId: string
  columnId: string
  oldValue: any
  newValue: any
  timestamp: number
}

export function useInlineEdit() {
  // Current editing state
  const editingCell = ref<{ row: string; column: string } | null>(null)
  const editStates = reactive<Record<string, EditState>>({})
  const editHistory = ref<EditHistory[]>([])
  const historyIndex = ref(-1)

  // Computed helpers
  const hasActiveEdit = computed(() => editingCell.value !== null)
  const canUndo = computed(() => historyIndex.value >= 0)
  const canRedo = computed(() => historyIndex.value < editHistory.value.length - 1)

  // Get edit state for a cell
  const getEditState = (rowId: string, columnId: string) => {
    const key = `${rowId}-${columnId}`
    return editStates[key]
  }

  // Start editing a cell
  const startEdit = (rowId: string, columnId: string, initialValue: any) => {
    // Cancel any existing edit
    if (editingCell.value) {
      cancelEdit()
    }

    const key = `${rowId}-${columnId}`
    editingCell.value = { row: rowId, column: columnId }
    
    editStates[key] = {
      rowId,
      columnId,
      originalValue: initialValue,
      currentValue: initialValue,
      isDirty: false,
      isSaving: false
    }

    return nextTick()
  }

  // Update the current edit value
  const updateEditValue = (rowId: string, columnId: string, value: any) => {
    const key = `${rowId}-${columnId}`
    const state = editStates[key]
    
    if (state) {
      state.currentValue = value
      state.isDirty = value !== state.originalValue
      state.error = undefined
    }
  }

  // Validate a field value
  const validateValue = async (field: string, value: any): Promise<string | null> => {
    switch (field) {
      case 'title':
        if (!value || typeof value !== 'string') return 'Title is required'
        if (value.trim().length < 3) return 'Title must be at least 3 characters'
        if (value.length > 100) return 'Title cannot exceed 100 characters'
        break
        
      case 'caseNumber':
        if (!value || typeof value !== 'string') return 'Case number is required'
        if (!/^[A-Z0-9-]+$/.test(value)) return 'Case number can only contain letters, numbers, and hyphens'
        break
        
      case 'clientName':
        if (!value || typeof value !== 'string') return 'Client name is required'
        if (value.trim().length === 0) return 'Client name cannot be empty'
        break
        
      case 'status':
        const validStatuses = ['INTAKE', 'INITIAL_REVIEW', 'IN_PROGRESS', 'REVIEW', 'WAITING_CLIENT', 'READY_FILING', 'CLOSED']
        if (!validStatuses.includes(value)) return 'Invalid status value'
        break
        
      case 'priority':
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        if (!validPriorities.includes(value)) return 'Invalid priority value'
        break
        
      case 'dueDate':
        if (value && isNaN(new Date(value).getTime())) return 'Invalid date format'
        break
    }
    
    return null
  }

  // Save the current edit
  const saveEdit = async (
    onSave: (rowId: string, columnId: string, value: any) => Promise<void>
  ): Promise<boolean> => {
    if (!editingCell.value) return false

    const { row: rowId, column: columnId } = editingCell.value
    const key = `${rowId}-${columnId}`
    const state = editStates[key]

    if (!state || !state.isDirty) {
      cancelEdit()
      return true
    }

    // Validate the value
    const validationError = await validateValue(columnId, state.currentValue)
    if (validationError) {
      state.error = validationError
      return false
    }

    state.isSaving = true
    state.error = undefined

    try {
      await onSave(rowId, columnId, state.currentValue)
      
      // Add to history for undo/redo
      const historyEntry: EditHistory = {
        rowId,
        columnId,
        oldValue: state.originalValue,
        newValue: state.currentValue,
        timestamp: Date.now()
      }
      
      // Truncate history if we're not at the end
      if (historyIndex.value < editHistory.value.length - 1) {
        editHistory.value = editHistory.value.slice(0, historyIndex.value + 1)
      }
      
      editHistory.value.push(historyEntry)
      historyIndex.value = editHistory.value.length - 1
      
      // Keep history manageable
      if (editHistory.value.length > 50) {
        editHistory.value = editHistory.value.slice(-50)
        historyIndex.value = editHistory.value.length - 1
      }

      // Clear edit state
      delete editStates[key]
      editingCell.value = null
      
      return true
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Save failed'
      return false
    } finally {
      state.isSaving = false
    }
  }

  // Cancel the current edit
  const cancelEdit = () => {
    if (editingCell.value) {
      const key = `${editingCell.value.row}-${editingCell.value.column}`
      delete editStates[key]
      editingCell.value = null
    }
  }

  // Undo the last action
  const undo = async (
    onSave: (rowId: string, columnId: string, value: any) => Promise<void>
  ): Promise<boolean> => {
    if (!canUndo.value) return false

    const entry = editHistory.value[historyIndex.value]
    if (!entry) return false

    try {
      await onSave(entry.rowId, entry.columnId, entry.oldValue)
      historyIndex.value--
      return true
    } catch (error) {
      console.error('Undo failed:', error)
      return false
    }
  }

  // Redo the next action
  const redo = async (
    onSave: (rowId: string, columnId: string, value: any) => Promise<void>
  ): Promise<boolean> => {
    if (!canRedo.value) return false

    const entry = editHistory.value[historyIndex.value + 1]
    if (!entry) return false

    try {
      await onSave(entry.rowId, entry.columnId, entry.newValue)
      historyIndex.value++
      return true
    } catch (error) {
      console.error('Redo failed:', error)
      return false
    }
  }

  // Clear all edit history
  const clearHistory = () => {
    editHistory.value = []
    historyIndex.value = -1
  }

  // Get cell edit status
  const isEditing = (rowId: string, columnId: string) => {
    return editingCell.value?.row === rowId && editingCell.value?.column === columnId
  }

  const isSaving = (rowId: string, columnId: string) => {
    const state = getEditState(rowId, columnId)
    return state?.isSaving || false
  }

  const getError = (rowId: string, columnId: string) => {
    const state = getEditState(rowId, columnId)
    return state?.error
  }

  const isDirty = (rowId: string, columnId: string) => {
    const state = getEditState(rowId, columnId)
    return state?.isDirty || false
  }

  // Keyboard handlers
  const handleKeydown = (
    event: KeyboardEvent,
    onSave: (rowId: string, columnId: string, value: any) => Promise<void>,
    onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void
  ) => {
    // Handle undo/redo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault()
      if (event.shiftKey) {
        redo(onSave)
      } else {
        undo(onSave)
      }
      return
    }

    // Handle save/cancel
    if (editingCell.value) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          cancelEdit()
          break
        case 'Enter':
          event.preventDefault()
          saveEdit(onSave).then((success) => {
            if (success && onNavigate) {
              onNavigate(event.shiftKey ? 'up' : 'down')
            }
          })
          break
        case 'Tab':
          event.preventDefault()
          saveEdit(onSave).then((success) => {
            if (success && onNavigate) {
              onNavigate(event.shiftKey ? 'left' : 'right')
            }
          })
          break
      }
    }
  }

  // Auto-save with debouncing
  const createDebouncedSave = (
    onSave: (rowId: string, columnId: string, value: any) => Promise<void>,
    delay = 2000
  ) => {
    const debouncedSave = async (rowId: string, columnId: string) => {
      const state = getEditState(rowId, columnId)
      if (!state || !state.isDirty) return

      // Don't auto-save if there's a validation error
      const validationError = await validateValue(columnId, state.currentValue)
      if (validationError) return

      state.isSaving = true
      try {
        await onSave(rowId, columnId, state.currentValue)
        state.originalValue = state.currentValue
        state.isDirty = false
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Auto-save failed'
      } finally {
        state.isSaving = false
      }
    }

    // Return a debounced version
    return watchDebounced(
      () => Object.values(editStates).filter(state => state.isDirty),
      (dirtyStates) => {
        dirtyStates.forEach(state => {
          debouncedSave(state.rowId, state.columnId)
        })
      },
      { debounce: delay, deep: true }
    )
  }

  return {
    // State
    editingCell: readonly(editingCell),
    hasActiveEdit,
    canUndo,
    canRedo,
    
    // Methods
    startEdit,
    updateEditValue,
    saveEdit,
    cancelEdit,
    undo,
    redo,
    clearHistory,
    
    // Helpers
    getEditState,
    isEditing,
    isSaving,
    getError,
    isDirty,
    validateValue,
    
    // Event handlers
    handleKeydown,
    createDebouncedSave
  }
}