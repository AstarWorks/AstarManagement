/**
 * Form Dirty State Tracking Composable
 * Provides granular field-level dirty state tracking for forms
 */

export interface IFieldState {
  isDirty: boolean
  originalValue: any
  currentValue: any
  hasValidationError: boolean
  touched: boolean
  lastModified?: Date
}

export interface IDirtyStateOptions {
  /** Whether to track field touch state */
  trackTouched?: boolean
  /** Whether to track modification timestamps */
  trackTimestamps?: boolean
  /** Custom equality checker */
  isEqual?: (a: any, b: any) => boolean
  /** Fields to ignore in dirty checking */
  ignoreFields?: string[]
}

export interface IDirtyStateReturn {
  /** Field states map */
  fieldStates: Ref<Record<string, IFieldState>>
  /** Global dirty state */
  isDirty: ComputedRef<boolean>
  /** Dirty fields list */
  dirtyFields: ComputedRef<string[]>
  /** Touched fields list */
  touchedFields: ComputedRef<string[]>
  /** Initialize field tracking */
  initializeField: (fieldName: string, initialValue: any) => void
  /** Update field value */
  updateField: (fieldName: string, newValue: any) => void
  /** Mark field as touched */
  touchField: (fieldName: string) => void
  /** Reset specific field */
  resetField: (fieldName: string) => void
  /** Reset all fields */
  resetAllFields: () => void
  /** Check if specific field is dirty */
  isFieldDirty: (fieldName: string) => boolean
  /** Get field's original value */
  getOriginalValue: (fieldName: string) => any
  /** Get changed values object */
  getChangedValues: () => Record<string, any>
}

/**
 * Composable for tracking form dirty state at field level
 */
export const useFormDirtyState = (options: IDirtyStateOptions = {}): IDirtyStateReturn => {
  const {
    trackTouched = true,
    trackTimestamps = true,
    isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b),
    ignoreFields = []
  } = options

  // Reactive state
  const fieldStates = ref<Record<string, IFieldState>>({})

  // Computed properties
  const isDirty = computed(() => {
    return Object.entries(fieldStates.value)
      .filter(([fieldName]) => !ignoreFields.includes(fieldName))
      .some(([_, state]) => state.isDirty)
  })

  const dirtyFields = computed(() => {
    return Object.entries(fieldStates.value)
      .filter(([fieldName, state]) => !ignoreFields.includes(fieldName) && state.isDirty)
      .map(([fieldName]) => fieldName)
  })

  const touchedFields = computed(() => {
    if (!trackTouched) return []
    return Object.entries(fieldStates.value)
      .filter(([_, state]) => state.touched)
      .map(([fieldName]) => fieldName)
  })

  // Initialize field tracking
  const initializeField = (fieldName: string, initialValue: any) => {
    fieldStates.value[fieldName] = {
      isDirty: false,
      originalValue: deepClone(initialValue),
      currentValue: deepClone(initialValue),
      hasValidationError: false,
      touched: false,
      lastModified: trackTimestamps ? new Date() : undefined
    }
  }

  // Update field value
  const updateField = (fieldName: string, newValue: any) => {
    if (!fieldStates.value[fieldName]) {
      initializeField(fieldName, newValue)
      return
    }

    const fieldState = fieldStates.value[fieldName]
    fieldState.currentValue = newValue
    fieldState.isDirty = !isEqual(fieldState.originalValue, newValue)
    
    if (trackTimestamps) {
      fieldState.lastModified = new Date()
    }

    // Trigger reactivity
    fieldStates.value = { ...fieldStates.value }
  }

  // Mark field as touched
  const touchField = (fieldName: string) => {
    if (!trackTouched || !fieldStates.value[fieldName]) return
    
    fieldStates.value[fieldName].touched = true
    // Trigger reactivity
    fieldStates.value = { ...fieldStates.value }
  }

  // Reset specific field
  const resetField = (fieldName: string) => {
    if (!fieldStates.value[fieldName]) return
    
    const fieldState = fieldStates.value[fieldName]
    fieldState.currentValue = deepClone(fieldState.originalValue)
    fieldState.isDirty = false
    fieldState.touched = false
    fieldState.hasValidationError = false
    
    if (trackTimestamps) {
      fieldState.lastModified = new Date()
    }
    
    // Trigger reactivity
    fieldStates.value = { ...fieldStates.value }
  }

  // Reset all fields
  const resetAllFields = () => {
    Object.keys(fieldStates.value).forEach(fieldName => {
      resetField(fieldName)
    })
  }

  // Check if specific field is dirty
  const isFieldDirty = (fieldName: string): boolean => {
    return fieldStates.value[fieldName]?.isDirty || false
  }

  // Get field's original value
  const getOriginalValue = (fieldName: string): any => {
    return fieldStates.value[fieldName]?.originalValue
  }

  // Get only changed values
  const getChangedValues = (): Record<string, any> => {
    const changes: Record<string, any> = {}
    
    Object.entries(fieldStates.value).forEach(([fieldName, state]) => {
      if (state.isDirty && !ignoreFields.includes(fieldName)) {
        changes[fieldName] = state.currentValue
      }
    })
    
    return changes
  }

  // Helper for field initialization from form libraries like VeeValidate (if needed)
  // const initializeFromFormValues = (formValues: Record<string, any>) => {
  //   Object.entries(formValues).forEach(([fieldName, value]) => {
  //     if (!fieldStates.value[fieldName]) {
  //       initializeField(fieldName, value)
  //     }
  //   })
  // }

  // Cleanup on unmount
  onUnmounted(() => {
    fieldStates.value = {}
  })

  return {
    fieldStates,
    isDirty,
    dirtyFields,
    touchedFields,
    initializeField,
    updateField,
    touchField,
    resetField,
    resetAllFields,
    isFieldDirty,
    getOriginalValue,
    getChangedValues
  }
}

/**
 * Helper function for deep cloning objects
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (obj instanceof Object) {
    const clonedObj = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}