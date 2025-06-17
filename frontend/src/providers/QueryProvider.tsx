/**
 * React Query provider for server state management
 * 
 * @description Provides React Query context for data fetching, caching,
 * and synchronization. Configured for optimal performance with real-time
 * updates and error handling.
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

/**
 * React Query client configuration
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 30 seconds (half of polling interval)
        staleTime: 30 * 1000,
        // Cache time: 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Background refetch only when window is focused
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        retryDelay: 1000
      }
    }
  })
}

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * Query provider component
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable query client instance
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}