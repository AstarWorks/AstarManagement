/**
 * Enhanced Form Submission Composable with Optimistic Updates
 * Simplified to work better with Vue's reactivity system
 */

export interface IOptimisticFormState {
  data: Record<string, any>
  originalData: Record<string, any>
  optimisticData?: Record<string, any>
  isDirty: boolean
  isSubmitting: boolean
  hasOptimisticUpdate: boolean
  conflictDetected: boolean
  version: number
}

export interface IConflictResolution<T> {
  type: 'version_mismatch' | 'concurrent_edit'
  localVersion: number
  serverVersion: number
  conflictingFields: string[]
  serverData: T
  localData: T
}

export interface IOptimisticSubmissionOptions<T> {
  /** Initial data for the form */
  initialData: T
  /** Version number for optimistic locking */
  version?: number
  /** Whether to enable optimistic updates */
  enableOptimistic?: boolean
  /** Custom conflict resolver */
  conflictResolver?: (conflict: IConflictResolution<T>) => Promise<T>
  /** Custom success handler */
  onSuccess?: (data: T) => void
  /** Custom error handler */
  onError?: (error: Error | unknown) => void
  /** Custom optimistic update handler */
  onOptimisticUpdate?: (data: T) => void
  /** Revert optimistic update handler */
  onOptimisticRevert?: () => void
}

export interface IOptimisticSubmissionReturn<T> {
  /** Form state with optimistic data */
  formState: Ref<IOptimisticFormState>
  /** Current form data (optimistic or real) */
  currentData: ComputedRef<T>
  /** Whether form has unsaved changes */
  isDirty: ComputedRef<boolean>
  /** Whether form is currently submitting */
  isSubmitting: ComputedRef<boolean>
  /** Whether there's an active optimistic update */
  hasOptimisticUpdate: ComputedRef<boolean>
  /** Current submission error */
  submissionError: Ref<string | null>
  /** Submit with optimistic updates */
  submitWithOptimistic: (submitFn: (data: T) => Promise<T>) => Promise<void>
  /** Update form data */
  updateFormData: (updates: Partial<T>) => void
  /** Reset form to original state */
  resetForm: () => void
  /** Clear error state */
  clearError: () => void
  /** Handle conflict resolution */
  resolveConflict: (serverData: T, serverVersion: number) => Promise<void>
}

/**
 * Enhanced form submission composable with optimistic updates
 */
export const useFormSubmissionOptimistic = <T extends Record<string, any>>(
  options: IOptimisticSubmissionOptions<T>
): IOptimisticSubmissionReturn<T> => {
  const {
    initialData,
    version = 1,
    enableOptimistic = true,
    conflictResolver,
    onSuccess,
    onError,
    onOptimisticUpdate,
    onOptimisticRevert
  } = options

  // Reactive state - simplified to avoid Vue type conflicts
  const formState = ref<IOptimisticFormState>({
    data: { ...initialData },
    originalData: { ...initialData },
    optimisticData: undefined,
    isDirty: false,
    isSubmitting: false,
    hasOptimisticUpdate: false,
    conflictDetected: false,
    version
  })

  const submissionError = ref<string | null>(null)

  // Computed properties
  const currentData = computed(() => 
    formState.value.hasOptimisticUpdate && formState.value.optimisticData
      ? formState.value.optimisticData as T
      : formState.value.data as T
  )

  const isDirty = computed(() => formState.value.isDirty)
  const isSubmitting = computed(() => formState.value.isSubmitting)
  const hasOptimisticUpdate = computed(() => formState.value.hasOptimisticUpdate)

  // Update form data
  const updateFormData = (updates: Partial<T>) => {
    formState.value.data = { ...formState.value.data, ...updates }
    formState.value.isDirty = JSON.stringify(formState.value.data) !== JSON.stringify(formState.value.originalData)
  }

  // Clear error state
  const clearError = () => {
    submissionError.value = null
  }

  // Reset form to original state
  const resetForm = () => {
    formState.value = {
      data: { ...formState.value.originalData },
      originalData: { ...formState.value.originalData },
      optimisticData: undefined,
      isDirty: false,
      isSubmitting: false,
      hasOptimisticUpdate: false,
      conflictDetected: false,
      version: formState.value.version
    }
    clearError()
  }

  // Submit with optimistic updates
  const submitWithOptimistic = async (submitFn: (data: T) => Promise<T>) => {
    try {
      clearError()
      formState.value.isSubmitting = true

      // Apply optimistic update immediately if enabled
      if (enableOptimistic) {
        formState.value.optimisticData = { ...formState.value.data }
        formState.value.hasOptimisticUpdate = true
        
        if (onOptimisticUpdate) {
          onOptimisticUpdate(formState.value.optimisticData as T)
        }
      }

      // Include version in submission for optimistic locking
      const dataWithVersion = {
        ...formState.value.data,
        version: formState.value.version
      } as unknown as T

      // Submit to server
      const result = await submitFn(dataWithVersion)

      // Success - replace optimistic with real data
      formState.value.data = { ...result }
      formState.value.originalData = { ...result }
      formState.value.optimisticData = undefined
      formState.value.hasOptimisticUpdate = false
      formState.value.isDirty = false
      formState.value.version = (result as any).version || formState.value.version + 1

      if (onSuccess) {
        onSuccess(result)
      }

    } catch (error: any) {
      // Revert optimistic update on error
      if (formState.value.hasOptimisticUpdate) {
        formState.value.optimisticData = undefined
        formState.value.hasOptimisticUpdate = false
        
        if (onOptimisticRevert) {
          onOptimisticRevert()
        }
      }

      // Handle version conflicts
      if (error.code === 'VERSION_CONFLICT' && error.serverData) {
        formState.value.conflictDetected = true
        await resolveConflict(error.serverData, error.serverVersion)
      } else {
        // Handle other errors
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        submissionError.value = errorMessage

        if (onError) {
          onError(error)
        } else {
          console.error('[Optimistic Form Submission Error]', error)
        }
      }

    } finally {
      formState.value.isSubmitting = false
    }
  }

  // Handle conflict resolution
  const resolveConflict = async (serverData: T, serverVersion: number) => {
    if (!conflictResolver) {
      // Default: use server data
      formState.value.data = { ...serverData }
      formState.value.originalData = { ...serverData }
      formState.value.version = serverVersion
      formState.value.conflictDetected = false
      formState.value.isDirty = false
      return
    }

    // Find conflicting fields
    const conflictingFields = Object.keys(formState.value.data).filter(key => 
      JSON.stringify(formState.value.data[key]) !== JSON.stringify((serverData as any)[key])
    )

    const conflict: IConflictResolution<T> = {
      type: 'version_mismatch',
      localVersion: formState.value.version,
      serverVersion,
      conflictingFields,
      serverData,
      localData: formState.value.data as T
    }

    try {
      const resolvedData = await conflictResolver(conflict)
      formState.value.data = { ...resolvedData }
      formState.value.originalData = { ...resolvedData }
      formState.value.version = serverVersion
      formState.value.conflictDetected = false
      formState.value.isDirty = false
    } catch (error) {
      submissionError.value = 'Failed to resolve conflict'
      console.error('[Conflict Resolution Error]', error)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (formState.value.hasOptimisticUpdate && onOptimisticRevert) {
      onOptimisticRevert()
    }
  })

  return {
    formState,
    currentData,
    isDirty,
    isSubmitting,
    hasOptimisticUpdate,
    submissionError,
    submitWithOptimistic,
    updateFormData,
    resetForm,
    clearError,
    resolveConflict
  }
}