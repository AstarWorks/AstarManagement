import { ref, readonly, type Ref } from 'vue'

export interface ILoadingState {
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<Error | null>>
  startLoading: () => void
  stopLoading: () => void
  setError: (error: Error | string) => void
  clearError: () => void
  withLoading: <T>(operation: () => Promise<T>) => Promise<T | null>
  reset: () => void
}

/**
 * Composable for managing loading states with error handling
 * 
 * @param initialState - Initial loading state (default: false)
 * @returns LoadingState object with reactive state and control methods
 */
export function useLoadingState(initialState = false): ILoadingState {
  const isLoading = ref(initialState)
  const error = ref<Error | null>(null)

  const startLoading = () => {
    isLoading.value = true
    error.value = null
  }

  const stopLoading = () => {
    isLoading.value = false
  }

  const setError = (err: Error | string) => {
    error.value = err instanceof Error ? err : new Error(err)
    isLoading.value = false
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    isLoading.value = false
    error.value = null
  }

  /**
   * Wraps an async operation with loading state management
   * 
   * @param operation - Async function to execute
   * @returns Result of the operation or null if error occurred
   */
  const withLoading = async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      startLoading()
      const result = await operation()
      stopLoading()
      return result
    } catch (err) {
      setError(err as Error)
      return null
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    startLoading,
    stopLoading,
    setError,
    clearError,
    withLoading,
    reset
  }
}

/**
 * Advanced loading state with retry mechanism and exponential backoff
 */
export interface IRetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  retryCondition?: (error: Error) => boolean
}

export function useLoadingStateWithRetry(
  initialState = false,
  retryOptions: IRetryOptions = {}
) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = () => true
  } = retryOptions

  const loadingState = useLoadingState(initialState)
  const retryCount = ref(0)
  const canRetry = computed(() => retryCount.value < maxRetries)

  const withRetry = async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    retryCount.value = 0

    const attemptOperation = async (): Promise<T | null> => {
      try {
        const result = await loadingState.withLoading(operation)
        retryCount.value = 0 // Reset on success
        return result
      } catch (err) {
        const error = err as Error
        
        if (
          retryCount.value < maxRetries &&
          retryCondition(error)
        ) {
          retryCount.value++
          
          // Calculate delay with exponential backoff
          const delay = Math.min(
            baseDelay * Math.pow(2, retryCount.value - 1),
            maxDelay
          )
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Retry the operation
          return attemptOperation()
        }
        
        throw error
      }
    }

    return attemptOperation()
  }

  return {
    ...loadingState,
    retryCount: readonly(retryCount),
    canRetry,
    withRetry
  }
}