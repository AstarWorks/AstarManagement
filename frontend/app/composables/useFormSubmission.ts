/**
 * Form Submission Composable
 * Simple over Easy: Generic form submission with loading/error states
 * Reusable across all forms in the application
 */

export interface UseFormSubmissionOptions<T = any> {
  /** Whether to enable optimistic updates */
  enableOptimistic?: boolean
  /** Whether to auto-reset form on success */
  autoResetOnSuccess?: boolean
  /** Custom success message */
  successMessage?: string
  /** Custom error handler */
  onError?: (error: any) => void
  /** Custom success handler */
  onSuccess?: (data: T) => void
}

export interface UseFormSubmissionReturn<T = any> {
  /** Whether form is currently submitting */
  isSubmitting: Ref<boolean>
  /** Current submission error */
  submissionError: Ref<string | null>
  /** Last successful submission result */
  lastResult: Ref<T | null>
  /** Submit function */
  submit: (submitFn: () => Promise<T>) => Promise<void>
  /** Clear error state */
  clearError: () => void
  /** Reset submission state */
  reset: () => void
}

/**
 * Generic form submission composable
 */
export const useFormSubmission = <T = any>(
  options: UseFormSubmissionOptions<T> = {}
): UseFormSubmissionReturn<T> => {
  const {
    enableOptimistic = false,
    autoResetOnSuccess = false,
    successMessage,
    onError,
    onSuccess
  } = options

  // Reactive state
  const isSubmitting = ref(false)
  const submissionError = ref<string | null>(null)
  const lastResult = ref<T | null>(null)

  // Clear error state
  const clearError = () => {
    submissionError.value = null
  }

  // Reset all submission state
  const reset = () => {
    isSubmitting.value = false
    submissionError.value = null
    lastResult.value = null
  }

  // Main submission function
  const submit = async (submitFn: () => Promise<T>) => {
    try {
      // Clear previous errors
      clearError()
      
      // Set loading state
      isSubmitting.value = true

      // Execute submission function
      const result = await submitFn()

      // Store successful result
      lastResult.value = result

      // Call success handler
      if (onSuccess) {
        onSuccess(result)
      }

      // Show success message if provided
      if (successMessage) {
        // Integration point for toast notifications
        console.log('[Success]', successMessage)
      }

    } catch (error: any) {
      // Handle submission error
      const errorMessage = error?.message || 'An unexpected error occurred'
      submissionError.value = errorMessage

      // Call error handler
      if (onError) {
        onError(error)
      } else {
        // Default error logging
        console.error('[Form Submission Error]', error)
      }

    } finally {
      // Always clear loading state
      isSubmitting.value = false
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    reset()
  })

  return {
    isSubmitting,
    submissionError,
    lastResult: lastResult as Ref<T | null>,
    submit,
    clearError,
    reset,
  }
}