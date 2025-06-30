import { ref, computed, watch, type Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'

export interface FormHistoryEntry {
  data: Record<string, any>
  timestamp: number
  action?: string
  fieldChanged?: string
}

export interface FormStateManagerOptions {
  autoSaveDelay?: number
  maxHistorySize?: number
  onAutoSave?: (data: Record<string, any>) => Promise<void>
  onHistoryChange?: (entry: FormHistoryEntry) => void
  enableAutoSave?: boolean
}

export interface FormProgress {
  totalFields: number
  filledFields: number
  requiredFields: number
  filledRequiredFields: number
  percentage: number
}

/**
 * Composable for advanced form state management with auto-save and undo/redo
 */
export function useFormStateManager(
  initialData: Record<string, any> = {},
  options: FormStateManagerOptions = {}
) {
  const {
    autoSaveDelay = 2000,
    maxHistorySize = 50,
    onAutoSave,
    onHistoryChange,
    enableAutoSave = true
  } = options

  // Form data state
  const formData = ref<Record<string, any>>({ ...initialData })
  const originalData = ref<Record<string, any>>({ ...initialData })

  // History management
  const history = ref<FormHistoryEntry[]>([])
  const historyIndex = ref(-1)
  const isUndoing = ref(false)
  const isRedoing = ref(false)

  // Form state flags
  const isDirty = ref(false)
  const isSaving = ref(false)
  const lastSaved = ref<Date | null>(null)
  const lastError = ref<Error | null>(null)

  // Track field changes
  const changedFields = ref<Set<string>>(new Set())
  const touchedFields = ref<Set<string>>(new Set())

  /**
   * Save current state to history
   */
  const saveToHistory = (action?: string, fieldChanged?: string) => {
    if (isUndoing.value || isRedoing.value) {
      return
    }

    const entry: FormHistoryEntry = {
      data: JSON.parse(JSON.stringify(formData.value)),
      timestamp: Date.now(),
      action,
      fieldChanged
    }

    // Remove any entries after current index (when undoing then making changes)
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Add new entry
    history.value.push(entry)
    historyIndex.value = history.value.length - 1

    // Limit history size
    if (history.value.length > maxHistorySize) {
      const removeCount = history.value.length - maxHistorySize
      history.value = history.value.slice(removeCount)
      historyIndex.value = Math.max(0, historyIndex.value - removeCount)
    }

    // Notify listener
    onHistoryChange?.(entry)
  }

  /**
   * Update a single field
   */
  const updateField = (fieldName: string, value: any) => {
    const oldValue = formData.value[fieldName]
    if (oldValue === value) {
      return
    }

    // Save to history before change
    saveToHistory(`Update ${fieldName}`, fieldName)

    // Update data
    formData.value[fieldName] = value
    changedFields.value.add(fieldName)
    touchedFields.value.add(fieldName)
    isDirty.value = true
  }

  /**
   * Update multiple fields at once
   */
  const updateFields = (updates: Record<string, any>) => {
    const hasChanges = Object.entries(updates).some(
      ([key, value]) => formData.value[key] !== value
    )

    if (!hasChanges) {
      return
    }

    // Save to history before changes
    saveToHistory('Batch update')

    // Update data
    Object.entries(updates).forEach(([key, value]) => {
      formData.value[key] = value
      changedFields.value.add(key)
      touchedFields.value.add(key)
    })

    isDirty.value = true
  }

  /**
   * Mark field as touched
   */
  const touchField = (fieldName: string) => {
    touchedFields.value.add(fieldName)
  }

  /**
   * Check if field has been touched
   */
  const isFieldTouched = (fieldName: string): boolean => {
    return touchedFields.value.has(fieldName)
  }

  /**
   * Check if field has been changed
   */
  const isFieldChanged = (fieldName: string): boolean => {
    return changedFields.value.has(fieldName)
  }

  /**
   * Undo last change
   */
  const undo = () => {
    if (!canUndo.value) {
      return
    }

    isUndoing.value = true
    historyIndex.value--
    const previousState = history.value[historyIndex.value]
    
    if (previousState) {
      formData.value = JSON.parse(JSON.stringify(previousState.data))
      isDirty.value = true
    }

    isUndoing.value = false
  }

  /**
   * Redo last undone change
   */
  const redo = () => {
    if (!canRedo.value) {
      return
    }

    isRedoing.value = true
    historyIndex.value++
    const nextState = history.value[historyIndex.value]
    
    if (nextState) {
      formData.value = JSON.parse(JSON.stringify(nextState.data))
      isDirty.value = true
    }

    isRedoing.value = false
  }

  /**
   * Reset form to initial state
   */
  const reset = (newInitialData?: Record<string, any>) => {
    if (newInitialData) {
      originalData.value = { ...newInitialData }
      formData.value = { ...newInitialData }
    } else {
      formData.value = { ...originalData.value }
    }

    // Clear tracking
    changedFields.value.clear()
    touchedFields.value.clear()
    isDirty.value = false
    lastError.value = null

    // Reset history
    history.value = []
    historyIndex.value = -1
    saveToHistory('Reset')
  }

  /**
   * Save form data
   */
  const save = async () => {
    if (!onAutoSave || isSaving.value) {
      return
    }

    isSaving.value = true
    lastError.value = null

    try {
      await onAutoSave(formData.value)
      lastSaved.value = new Date()
      isDirty.value = false
      changedFields.value.clear()
      originalData.value = { ...formData.value }
    } catch (error) {
      lastError.value = error instanceof Error ? error : new Error('Save failed')
      throw error
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Get form progress
   */
  const getProgress = (requiredFieldNames: string[] = []): FormProgress => {
    const allFields = Object.keys(formData.value)
    const filledFields = allFields.filter(key => {
      const value = formData.value[key]
      return value !== null && value !== undefined && value !== ''
    })

    const filledRequiredFields = requiredFieldNames.filter(key => {
      const value = formData.value[key]
      return value !== null && value !== undefined && value !== ''
    })

    const totalFields = allFields.length
    const filledCount = filledFields.length
    const percentage = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0

    return {
      totalFields,
      filledFields: filledCount,
      requiredFields: requiredFieldNames.length,
      filledRequiredFields: filledRequiredFields.length,
      percentage
    }
  }

  /**
   * Get changed values
   */
  const getChangedValues = (): Record<string, any> => {
    const changes: Record<string, any> = {}
    
    changedFields.value.forEach(field => {
      if (formData.value[field] !== originalData.value[field]) {
        changes[field] = formData.value[field]
      }
    })

    return changes
  }

  // Computed properties
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  const hasChanges = computed(() => isDirty.value && changedFields.value.size > 0)

  // Auto-save functionality
  const { pause: pauseAutoSave, resume: resumeAutoSave, isActive: isAutoSaveActive } = watchDebounced(
    formData,
    async () => {
      if (isDirty.value && enableAutoSave && onAutoSave && !isUndoing.value && !isRedoing.value) {
        try {
          await save()
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    { 
      debounce: autoSaveDelay, 
      deep: true,
      immediate: false
    }
  )

  // Initialize with first history entry
  saveToHistory('Initialize')

  return {
    // State
    formData: formData as Ref<Record<string, any>>,
    isDirty: computed(() => isDirty.value),
    isSaving: computed(() => isSaving.value),
    lastSaved: computed(() => lastSaved.value),
    lastError: computed(() => lastError.value),
    changedFields: computed(() => new Set(changedFields.value)),
    touchedFields: computed(() => new Set(touchedFields.value)),

    // History
    history: computed(() => [...history.value]),
    historyIndex: computed(() => historyIndex.value),
    canUndo,
    canRedo,
    hasChanges,

    // Methods
    updateField,
    updateFields,
    touchField,
    isFieldTouched,
    isFieldChanged,
    undo,
    redo,
    reset,
    save,
    getProgress,
    getChangedValues,

    // Auto-save control
    pauseAutoSave,
    resumeAutoSave,
    isAutoSaveActive
  }
}