/**
 * React Query error handling integration
 * 
 * @description Integrates error handling with @tanstack/react-query for
 * automatic retry logic, optimistic updates, and error recovery as specified
 * in the T05_S03 task requirements.
 */

import { QueryClient, QueryKey, MutationOptions, QueryOptions } from '@tanstack/react-query'
import { handleApiError, createUIError, ErrorType, ErrorAction, type BoardError } from '@/services/error/error.handler'
import { errorLoggingService } from '@/lib/error-logging'

/**
 * React Query error retry configuration
 */
export const getRetryConfig = (error: any): boolean | number => {
  const boardError = handleApiError(error)
  
  // Don't retry certain error types
  if (boardError.type === ErrorType.AUTHENTICATION || 
      boardError.type === ErrorType.AUTHORIZATION ||
      boardError.type === ErrorType.VALIDATION) {
    return false
  }
  
  // Retry network and server errors up to 3 times
  if (boardError.canRetry) {
    return 3
  }
  
  return false
}

/**
 * React Query retry delay with exponential backoff
 */
export const getRetryDelay = (attemptIndex: number): number => {
  // Exponential backoff: 1s, 2s, 4s
  return Math.min(1000 * Math.pow(2, attemptIndex), 10000)
}

/**
 * Global error handler for React Query
 */
export const queryErrorHandler = (error: any, query?: QueryKey) => {
  const boardError = handleApiError(error)
  
  // Log error with query context
  const logId = errorLoggingService.logError(
    boardError, 
    { 
      context: 'react-query',
      queryKey: query?.toString() 
    }
  )
  
  console.error(`Query error [${logId}]:`, {
    error: boardError,
    queryKey: query
  })
}

/**
 * Mutation error handler for React Query
 */
export const mutationErrorHandler = (error: any, variables?: any, context?: any) => {
  const boardError = handleApiError(error)
  
  // Log error with mutation context
  const logId = errorLoggingService.logError(
    boardError,
    {
      context: 'react-query-mutation',
      variables: JSON.stringify(variables),
      mutationContext: context
    }
  )
  
  console.error(`Mutation error [${logId}]:`, {
    error: boardError,
    variables,
    context
  })
}

/**
 * Enhanced QueryClient configuration with error handling
 */
export const createQueryClientWithErrorHandling = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: getRetryConfig,
        retryDelay: getRetryDelay,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes (was cacheTime)
        refetchOnWindowFocus: false,
        onError: queryErrorHandler
      },
      mutations: {
        retry: getRetryConfig,
        retryDelay: getRetryDelay,
        onError: mutationErrorHandler
      }
    }
  })
}

/**
 * Query options factory with standardized error handling
 */
export function createQueryOptions<TData = unknown, TError = any>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Partial<QueryOptions<TData, TError>>
): QueryOptions<TData, TError> {
  return {
    queryKey,
    queryFn,
    retry: getRetryConfig,
    retryDelay: getRetryDelay,
    onError: (error) => {
      queryErrorHandler(error, queryKey)
      options?.onError?.(error)
    },
    ...options
  }
}

/**
 * Mutation options factory with standardized error handling
 */
export function createMutationOptions<TData = unknown, TError = any, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Partial<MutationOptions<TData, TError, TVariables>>
): MutationOptions<TData, TError, TVariables> {
  return {
    mutationFn,
    retry: getRetryConfig,
    retryDelay: getRetryDelay,
    onError: (error, variables, context) => {
      mutationErrorHandler(error, variables, context)
      options?.onError?.(error, variables, context)
    },
    ...options
  }
}

/**
 * Optimistic update helper with error recovery
 */
export function createOptimisticMutation<TData, TVariables>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  mutationFn: (variables: TVariables) => Promise<TData>,
  optimisticUpdater: (variables: TVariables, oldData: any) => any
) {
  return {
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey)
      
      // Optimistically update
      queryClient.setQueryData(queryKey, (old: any) => 
        optimisticUpdater(variables, old)
      )
      
      // Return context with the snapshotted value
      return { previousData }
    },
    onError: (error: any, variables: TVariables, context: any) => {
      // Rollback to previous data
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      
      // Handle error
      mutationErrorHandler(error, variables, context)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    }
  }
}

/**
 * Network-aware query hook
 */
export function useNetworkAwareQuery<TData = unknown, TError = any>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Partial<QueryOptions<TData, TError>>
) {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  
  return {
    ...createQueryOptions(queryKey, queryFn, options),
    enabled: isOnline && (options?.enabled ?? true),
    onError: (error: TError) => {
      if (!isOnline) {
        const offlineError = createUIError(
          'You are currently offline. Please check your connection.',
          ErrorType.NETWORK,
          ErrorAction.RETRY
        )
        queryErrorHandler(offlineError, queryKey)
      } else {
        queryErrorHandler(error, queryKey)
      }
      options?.onError?.(error)
    }
  }
}