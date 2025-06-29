import { ref, nextTick, computed } from 'vue'
import type { AdvancedDataTableColumn } from '~/components/matter/DataTableAdvanced.vue'

export interface EditableCell {
  rowId: string
  columnKey: string
  originalValue: any
  editValue: any
  isValid: boolean
  error?: string
}

export interface InlineEditOptions {
  validateOnChange?: boolean
  saveOnBlur?: boolean
  cancelOnEscape?: boolean
  allowedColumns?: string[]
  validator?: (value: any, column: AdvancedDataTableColumn<any>, row: any) => Promise<string | null>
}

export function useInlineEdit<T>(
  data: Ref<T[]>,
  columns: Ref<AdvancedDataTableColumn<T>[]>,
  getRowId: (row: T) => string,
  options: InlineEditOptions = {}
) {
  const {
    validateOnChange = true,
    saveOnBlur = true,
    cancelOnEscape = true,
    allowedColumns = [],
    validator
  } = options

  // State
  const editingCells = ref<Map<string, EditableCell>>(new Map())
  const isEditing = ref(false)
  const activeCell = ref<string | null>(null)

  // Helper to generate cell key
  const getCellKey = (rowId: string, columnKey: string): string => 
    `${rowId}-${columnKey}`

  // Get row by ID
  const getRowById = (rowId: string): T | undefined =>
    data.value.find(row => getRowId(row) === rowId)

  // Get column by key
  const getColumnByKey = (columnKey: string): AdvancedDataTableColumn<T> | undefined =>
    columns.value.find(col => String(col.key) === columnKey)

  // Check if cell is editable
  const isCellEditable = (rowId: string, columnKey: string): boolean => {
    const column = getColumnByKey(columnKey)
    if (!column?.editable) return false
    
    if (allowedColumns.length > 0 && !allowedColumns.includes(columnKey)) {
      return false
    }

    return true
  }

  // Check if cell is currently being edited
  const isCellEditing = (rowId: string, columnKey: string): boolean => {
    const cellKey = getCellKey(rowId, columnKey)
    return editingCells.value.has(cellKey)
  }

  // Get current edit value for a cell
  const getCellEditValue = (rowId: string, columnKey: string): any => {
    const cellKey = getCellKey(rowId, columnKey)
    const editCell = editingCells.value.get(cellKey)
    return editCell?.editValue
  }

  // Get current display value for a cell
  const getCellValue = (row: T, columnKey: string): any => {
    const rowId = getRowId(row)
    const cellKey = getCellKey(rowId, columnKey)
    const editCell = editingCells.value.get(cellKey)
    
    if (editCell) {
      return editCell.editValue
    }

    // Get value from nested path
    return columnKey.split('.').reduce((obj, key) => obj?.[key], row as any)
  }

  // Validate cell value
  const validateCell = async (
    rowId: string,
    columnKey: string,
    value: any
  ): Promise<string | null> => {
    const column = getColumnByKey(columnKey)
    const row = getRowById(rowId)
    
    if (!column || !row) return 'Invalid cell reference'

    // Column-specific validation
    if (column.validator) {
      try {
        const isValid = await column.validator(value, row)
        if (typeof isValid === 'string') return isValid
        if (!isValid) return 'Invalid value'
      } catch (error) {
        return error instanceof Error ? error.message : 'Validation error'
      }
    }

    // Global validator
    if (validator) {
      try {
        return await validator(value, column, row)
      } catch (error) {
        return error instanceof Error ? error.message : 'Validation error'
      }
    }

    // Basic type validation
    if (column.type) {
      switch (column.type) {
        case 'number':
          if (value !== '' && value !== null && isNaN(Number(value))) {
            return 'Must be a valid number'
          }
          break
        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Must be a valid email address'
          }
          break
        case 'url':
          if (value) {
            try {
              new URL(value)
            } catch {
              return 'Must be a valid URL'
            }
          }
          break
      }
    }

    // Required field validation
    if (column.required && (value === '' || value === null || value === undefined)) {
      return 'This field is required'
    }

    return null
  }

  // Start editing a cell
  const startEdit = async (rowId: string, columnKey: string): Promise<boolean> => {
    if (!isCellEditable(rowId, columnKey)) return false

    const row = getRowById(rowId)
    if (!row) return false

    const currentValue = getCellValue(row, columnKey)
    const cellKey = getCellKey(rowId, columnKey)

    const editableCell: EditableCell = {
      rowId,
      columnKey,
      originalValue: currentValue,
      editValue: currentValue,
      isValid: true
    }

    editingCells.value.set(cellKey, editableCell)
    isEditing.value = true
    activeCell.value = cellKey

    // Focus the input element
    await nextTick()
    const inputElement = document.querySelector(`[data-cell-key="${cellKey}"]`) as HTMLInputElement
    if (inputElement) {
      inputElement.focus()
      inputElement.select()
    }

    return true
  }

  // Update cell value during editing
  const updateCellValue = async (
    rowId: string, 
    columnKey: string, 
    value: any
  ): Promise<void> => {
    const cellKey = getCellKey(rowId, columnKey)
    const editCell = editingCells.value.get(cellKey)
    
    if (!editCell) return

    editCell.editValue = value

    if (validateOnChange) {
      const error = await validateCell(rowId, columnKey, value)
      editCell.isValid = !error
      editCell.error = error || undefined
    }

    editingCells.value.set(cellKey, editCell)
  }

  // Save cell changes
  const saveCell = async (rowId: string, columnKey: string): Promise<boolean> => {
    const cellKey = getCellKey(rowId, columnKey)
    const editCell = editingCells.value.get(cellKey)
    
    if (!editCell) return false

    // Validate before saving
    const error = await validateCell(rowId, columnKey, editCell.editValue)
    if (error) {
      editCell.isValid = false
      editCell.error = error
      editingCells.value.set(cellKey, editCell)
      return false
    }

    // Emit the save event with the new value
    const row = getRowById(rowId)
    if (row) {
      // Here you would emit an event to the parent component
      // emit('cell:edit', row, columnKey, editCell.editValue)
      
      // For now, we'll update the data directly (this should be handled by parent)
      const keys = columnKey.split('.')
      let target = row as any
      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]]
      }
      target[keys[keys.length - 1]] = editCell.editValue
    }

    // Remove from editing state
    editingCells.value.delete(cellKey)
    
    if (editingCells.value.size === 0) {
      isEditing.value = false
      activeCell.value = null
    }

    return true
  }

  // Cancel cell editing
  const cancelEdit = (rowId: string, columnKey: string): void => {
    const cellKey = getCellKey(rowId, columnKey)
    editingCells.value.delete(cellKey)
    
    if (editingCells.value.size === 0) {
      isEditing.value = false
      activeCell.value = null
    }
  }

  // Cancel all edits
  const cancelAllEdits = (): void => {
    editingCells.value.clear()
    isEditing.value = false
    activeCell.value = null
  }

  // Save all pending edits
  const saveAllEdits = async (): Promise<boolean> => {
    const results = await Promise.all(
      Array.from(editingCells.value.keys()).map(cellKey => {
        const [rowId, columnKey] = cellKey.split('-')
        return saveCell(rowId, columnKey)
      })
    )

    return results.every(result => result)
  }

  // Handle keyboard events
  const handleKeyDown = async (
    event: KeyboardEvent,
    rowId: string,
    columnKey: string
  ): Promise<void> => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        const saved = await saveCell(rowId, columnKey)
        if (saved) {
          // Move to next row in same column
          const currentRowIndex = data.value.findIndex(row => getRowId(row) === rowId)
          const nextRow = data.value[currentRowIndex + 1]
          if (nextRow && isCellEditable(getRowId(nextRow), columnKey)) {
            await startEdit(getRowId(nextRow), columnKey)
          }
        }
        break

      case 'Escape':
        if (cancelOnEscape) {
          event.preventDefault()
          cancelEdit(rowId, columnKey)
        }
        break

      case 'Tab':
        event.preventDefault()
        const tabSaved = await saveCell(rowId, columnKey)
        if (tabSaved) {
          // Move to next editable column
          const currentColumnIndex = columns.value.findIndex(col => String(col.key) === columnKey)
          const nextColumn = columns.value[currentColumnIndex + 1]
          if (nextColumn && isCellEditable(rowId, String(nextColumn.key))) {
            await startEdit(rowId, String(nextColumn.key))
          }
        }
        break
    }
  }

  // Handle blur events
  const handleBlur = async (rowId: string, columnKey: string): Promise<void> => {
    if (saveOnBlur) {
      await saveCell(rowId, columnKey)
    }
  }

  // Double-click to start editing
  const handleDoubleClick = async (rowId: string, columnKey: string): Promise<void> => {
    await startEdit(rowId, columnKey)
  }

  // Get editing state for a cell
  const getCellEditState = (rowId: string, columnKey: string) => {
    const cellKey = getCellKey(rowId, columnKey)
    const editCell = editingCells.value.get(cellKey)
    
    return {
      isEditing: !!editCell,
      isValid: editCell?.isValid ?? true,
      error: editCell?.error,
      originalValue: editCell?.originalValue,
      editValue: editCell?.editValue,
      hasChanges: editCell ? editCell.editValue !== editCell.originalValue : false
    }
  }

  // Check if there are any pending changes
  const hasPendingChanges = computed(() => editingCells.value.size > 0)

  // Get all pending changes
  const getPendingChanges = computed(() => {
    const changes: Array<{
      rowId: string
      columnKey: string
      originalValue: any
      newValue: any
      isValid: boolean
      error?: string
    }> = []

    editingCells.value.forEach((editCell, cellKey) => {
      if (editCell.editValue !== editCell.originalValue) {
        changes.push({
          rowId: editCell.rowId,
          columnKey: editCell.columnKey,
          originalValue: editCell.originalValue,
          newValue: editCell.editValue,
          isValid: editCell.isValid,
          error: editCell.error
        })
      }
    })

    return changes
  })

  return {
    // State
    isEditing: readonly(isEditing),
    activeCell: readonly(activeCell),
    hasPendingChanges,
    getPendingChanges,

    // Methods
    isCellEditable,
    isCellEditing,
    getCellValue,
    getCellEditValue,
    getCellEditState,
    startEdit,
    updateCellValue,
    saveCell,
    cancelEdit,
    cancelAllEdits,
    saveAllEdits,
    validateCell,

    // Event handlers
    handleKeyDown,
    handleBlur,
    handleDoubleClick
  }
}