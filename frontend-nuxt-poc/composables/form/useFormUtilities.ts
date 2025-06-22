import { ref, computed, watch } from 'vue'
import type { FormInstance } from './useForm'

/**
 * Dirty state tracking options
 */
export interface DirtyStateOptions {
  /** Whether to track field-level dirty state */
  trackFields?: boolean
  /** Callback when dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void
  /** Custom comparison function */
  compareValues?: (a: any, b: any) => boolean
}

/**
 * Submission state interface
 */
export interface SubmissionState {
  /** Whether form is currently submitting */
  isSubmitting: boolean
  /** Number of submission attempts */
  submitCount: number
  /** Whether last submission was successful */
  lastSubmissionSuccess?: boolean
  /** Last submission error */
  lastSubmissionError?: string
  /** Timestamp of last submission */
  lastSubmissionTime?: Date
}

/**
 * Form reset options
 */
export interface FormResetOptions {
  /** Whether to show confirmation dialog */
  confirm?: boolean
  /** Custom confirmation message */
  confirmMessage?: string
  /** Values to reset to (if different from initial) */
  resetTo?: any
  /** Whether to reset validation state */
  resetValidation?: boolean
}

/**
 * Form utilities composable
 * 
 * Provides additional utilities for form management including
 * dirty state tracking, submission state, and reset functionality.
 */
export function useFormUtilities<T = any>(form: FormInstance<any>) {
  // Dirty state tracking
  const initialValues = ref<T>(form.values.value)
  const dirtyFields = ref<Set<string>>(new Set())

  // Submission state
  const submissionState = ref<SubmissionState>({
    isSubmitting: false,
    submitCount: 0
  })

  // Enhanced dirty state tracking
  const setupDirtyTracking = (options: DirtyStateOptions = {}) => {
    const {
      trackFields = true,
      onDirtyChange,
      compareValues = (a, b) => JSON.stringify(a) === JSON.stringify(b)
    } = options

    // Track overall dirty state
    const isDirty = computed(() => {
      return !compareValues(form.values.value, initialValues.value)
    })

    // Track field-level dirty state
    if (trackFields) {
      watch(
        () => form.values.value,
        (newValues, oldValues) => {
          if (!oldValues) return

          Object.keys(newValues).forEach(key => {
            const isFieldDirty = !compareValues(newValues[key], initialValues.value[key])
            
            if (isFieldDirty) {
              dirtyFields.value.add(key)
            } else {
              dirtyFields.value.delete(key)
            }
          })
        },
        { deep: true }
      )
    }

    // Notify when dirty state changes
    if (onDirtyChange) {
      watch(isDirty, onDirtyChange)
    }

    return {
      isDirty: readonly(isDirty),
      dirtyFields: readonly(dirtyFields),
      isFieldDirty: (fieldName: string) => dirtyFields.value.has(fieldName),
      markFieldClean: (fieldName: string) => dirtyFields.value.delete(fieldName),
      markFieldDirty: (fieldName: string) => dirtyFields.value.add(fieldName)
    }
  }

  // Enhanced submission handling
  const setupSubmissionTracking = () => {
    const submit = async (
      submitHandler: (values: T) => Promise<void>,
      options: {
        onStart?: () => void
        onSuccess?: (values: T) => void
        onError?: (error: Error) => void
        onFinally?: () => void
      } = {}
    ) => {
      if (submissionState.value.isSubmitting) {
        throw new Error('Form is already being submitted')
      }

      submissionState.value.isSubmitting = true
      submissionState.value.submitCount++
      submissionState.value.lastSubmissionTime = new Date()

      try {
        options.onStart?.()

        await submitHandler(form.values.value)

        submissionState.value.lastSubmissionSuccess = true
        submissionState.value.lastSubmissionError = undefined

        options.onSuccess?.(form.values.value)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Submission failed'
        
        submissionState.value.lastSubmissionSuccess = false
        submissionState.value.lastSubmissionError = errorMessage

        options.onError?.(error instanceof Error ? error : new Error(errorMessage))
        throw error
      } finally {
        submissionState.value.isSubmitting = false
        options.onFinally?.()
      }
    }

    const retrySubmission = async (submitHandler: (values: T) => Promise<void>) => {
      if (!submissionState.value.lastSubmissionError) {
        throw new Error('No previous submission error to retry')
      }

      return submit(submitHandler)
    }

    return {
      submit,
      retrySubmission,
      submissionState: readonly(submissionState),
      isSubmitting: readonly(computed(() => submissionState.value.isSubmitting)),
      submitCount: readonly(computed(() => submissionState.value.submitCount)),
      hasSubmissionError: readonly(computed(() => !!submissionState.value.lastSubmissionError)),
      lastSubmissionError: readonly(computed(() => submissionState.value.lastSubmissionError)),
      lastSubmissionSuccess: readonly(computed(() => submissionState.value.lastSubmissionSuccess))
    }
  }

  // Enhanced reset functionality
  const setupResetHandling = () => {
    const confirmReset = async (message: string = 'Are you sure you want to reset the form? All changes will be lost.'): Promise<boolean> => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.confirm) {
          resolve(window.confirm(message))
        } else {
          // Fallback for SSR or when confirm is not available
          resolve(true)
        }
      })
    }

    const resetForm = async (options: FormResetOptions = {}) => {
      const {
        confirm = false,
        confirmMessage,
        resetTo,
        resetValidation = true
      } = options

      // Show confirmation if requested
      if (confirm) {
        const shouldReset = await confirmReset(confirmMessage)
        if (!shouldReset) return false
      }

      // Reset form values
      const valuesToReset = resetTo || initialValues.value
      form.setValues(valuesToReset)

      // Reset validation state
      if (resetValidation) {
        form.clearErrors()
      }

      // Clear dirty tracking
      dirtyFields.value.clear()

      // Reset submission state
      submissionState.value = {
        isSubmitting: false,
        submitCount: 0,
        lastSubmissionSuccess: undefined,
        lastSubmissionError: undefined,
        lastSubmissionTime: undefined
      }

      return true
    }

    const resetToInitial = () => resetForm({ resetTo: initialValues.value })

    const setInitialValues = (values: T) => {
      initialValues.value = values
    }

    return {
      resetForm,
      resetToInitial,
      setInitialValues,
      confirmReset
    }
  }

  // Error recovery patterns
  const setupErrorRecovery = () => {
    const recoverFromError = (fieldName?: string) => {
      if (fieldName) {
        // Clear specific field error
        form.clearErrors()
        dirtyFields.value.delete(fieldName)
      } else {
        // Clear all errors and reset dirty state
        form.clearErrors()
        dirtyFields.value.clear()
      }
    }

    const retryValidation = async (fieldName?: string) => {
      if (fieldName) {
        return await form.validateField(fieldName)
      } else {
        return await form.validate()
      }
    }

    return {
      recoverFromError,
      retryValidation
    }
  }

  // Form analytics
  const setupAnalytics = () => {
    const analytics = ref({
      timeToFirstInteraction: null as Date | null,
      timeToCompletion: null as Date | null,
      fieldInteractions: new Map<string, number>(),
      validationErrors: new Map<string, number>(),
      totalValidationErrors: 0
    })

    const startTime = new Date()

    // Track first interaction
    const trackFirstInteraction = () => {
      if (!analytics.value.timeToFirstInteraction) {
        analytics.value.timeToFirstInteraction = new Date()
      }
    }

    // Track field interactions
    const trackFieldInteraction = (fieldName: string) => {
      trackFirstInteraction()
      
      const current = analytics.value.fieldInteractions.get(fieldName) || 0
      analytics.value.fieldInteractions.set(fieldName, current + 1)
    }

    // Track validation errors
    const trackValidationError = (fieldName: string) => {
      const current = analytics.value.validationErrors.get(fieldName) || 0
      analytics.value.validationErrors.set(fieldName, current + 1)
      analytics.value.totalValidationErrors++
    }

    // Track completion
    const trackCompletion = () => {
      analytics.value.timeToCompletion = new Date()
    }

    // Get analytics summary
    const getAnalyticsSummary = () => {
      const now = new Date()
      return {
        totalTime: analytics.value.timeToCompletion 
          ? analytics.value.timeToCompletion.getTime() - startTime.getTime()
          : now.getTime() - startTime.getTime(),
        timeToFirstInteraction: analytics.value.timeToFirstInteraction
          ? analytics.value.timeToFirstInteraction.getTime() - startTime.getTime()
          : null,
        fieldInteractions: Object.fromEntries(analytics.value.fieldInteractions),
        validationErrors: Object.fromEntries(analytics.value.validationErrors),
        totalValidationErrors: analytics.value.totalValidationErrors,
        mostInteractedField: [...analytics.value.fieldInteractions.entries()]
          .sort(([,a], [,b]) => b - a)[0]?.[0],
        mostErrorProneField: [...analytics.value.validationErrors.entries()]
          .sort(([,a], [,b]) => b - a)[0]?.[0]
      }
    }

    return {
      analytics: readonly(analytics),
      trackFirstInteraction,
      trackFieldInteraction,
      trackValidationError,
      trackCompletion,
      getAnalyticsSummary
    }
  }

  return {
    setupDirtyTracking,
    setupSubmissionTracking,
    setupResetHandling,
    setupErrorRecovery,
    setupAnalytics
  }
}

/**
 * Type for the return value of useFormUtilities
 */
export type FormUtilitiesInstance = ReturnType<typeof useFormUtilities>