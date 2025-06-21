/**
 * Offline mode detection and notification component
 * 
 * @description Monitors online/offline status and provides appropriate
 * messaging and error handling for offline scenarios. Integrates with
 * service worker and error handling systems.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useKanbanStore } from '@/stores/kanban-store'
import { createUIError, ErrorType, ErrorAction } from '@/services/error/error.handler'

interface OfflineDetectorProps {
  children: React.ReactNode
  showOfflineBanner?: boolean
  enableQueueing?: boolean
}

/**
 * Component that detects offline status and manages offline behavior
 */
export function OfflineDetector({ 
  children, 
  showOfflineBanner = true,
  enableQueueing = true 
}: OfflineDetectorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const [offlineQueue, setOfflineQueue] = useState<Array<{ action: string; data: unknown; timestamp: Date }>>([])
  const setError = useKanbanStore((state) => state.setError)
  const refreshBoard = useKanbanStore((state) => state.refreshBoard)

  // Check initial online status
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }
  }, [])

  // Handle online/offline events
  const handleOnline = useCallback(() => {
    setIsOnline(true)
    
    if (wasOffline) {
      setWasOffline(false)
      
      // Show reconnection success
      toast.success('Back online', {
        description: 'Connection restored. Syncing data...',
        icon: <Wifi className="size-4" />,
        duration: 3000
      })

      // Process offline queue if enabled
      if (enableQueueing && offlineQueue.length > 0) {
        toast.info(`Processing ${offlineQueue.length} queued actions...`, {
          icon: <RefreshCw className="size-4" />,
          duration: 2000
        })
        
        // TODO: Process queued actions
        setOfflineQueue([])
      }

      // Refresh data
      refreshBoard().catch((error) => {
        console.error('Failed to refresh after reconnection:', error)
      })
    }
  }, [wasOffline, enableQueueing, offlineQueue.length, refreshBoard])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(true)
    
    // Show offline notification
    toast.warning('You are offline', {
      description: 'Some features may be limited. Changes will be synced when you reconnect.',
      icon: <WifiOff className="size-4" />,
      duration: 5000
    })

    // Set offline error in store
    const offlineError = createUIError(
      'You are currently offline',
      ErrorType.NETWORK,
      ErrorAction.RETRY
    )
    setError(offlineError)
  }, [setError])

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Function to queue actions when offline
  // TODO: Implement offline action queuing when needed
  // const queueOfflineAction = useCallback((action: string, data: unknown) => {
  //   if (!isOnline && enableQueueing) {
  //     setOfflineQueue(prev => [...prev, {
  //       action,
  //       data,
  //       timestamp: new Date()
  //     }])
  //     
  //     toast.info('Action queued', {
  //       description: 'This action will be processed when you reconnect.',
  //       duration: 2000
  //     })
  //     
  //     return true // Indicates action was queued
  //   }
  //   return false // Indicates action should proceed normally
  // }, [isOnline, enableQueueing])

  return (
    <>
      {children}
      
      {/* Offline status banner */}
      {showOfflineBanner && !isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white text-center py-2 px-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            <CloudOff className="size-4" />
            <span>You are offline. Some features are limited.</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-2 h-6 text-xs border-white/20 bg-white/10 hover:bg-white/20"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="size-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Offline queue status */}
      {enableQueueing && offlineQueue.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <CloudOff className="size-4" />
                <span>{offlineQueue.length} actions queued</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

/**
 * Hook to access offline detection state and utilities
 */
export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline
  }
}

/**
 * Hook to handle offline-aware API calls
 */
export function useOfflineAwareAction() {
  const { isOffline } = useOfflineDetection()

  const executeAction = useCallback(async <T,>(
    action: () => Promise<T>,
    options: {
      offlineMessage?: string
      skipOfflineCheck?: boolean
    } = {}
  ): Promise<T> => {
    if (isOffline && !options.skipOfflineCheck) {
      const message = options.offlineMessage || 'This action requires an internet connection'
      
      toast.warning('Offline', {
        description: message,
        icon: <WifiOff className="size-4" />,
        duration: 4000
      })
      
      throw new Error(message)
    }

    return action()
  }, [isOffline])

  return {
    executeAction,
    isOffline
  }
}

/**
 * Component wrapper that shows offline state for specific components
 */
export function OfflineWrapper({ 
  children, 
  fallback,
  showOfflineOnly = false
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  showOfflineOnly?: boolean
}) {
  const { isOffline } = useOfflineDetection()

  if (showOfflineOnly && !isOffline) {
    return null
  }

  if (isOffline && fallback) {
    return <>{fallback}</>
  }

  return (
    <div className={cn(isOffline && 'opacity-50 pointer-events-none')}>
      {children}
    </div>
  )
}