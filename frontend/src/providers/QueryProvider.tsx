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
import { createQueryClientWithErrorHandling } from '@/lib/error/query-error-handler'

/**
 * React Query client configuration with enhanced error handling
 */
function createQueryClient() {
  return createQueryClientWithErrorHandling()
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