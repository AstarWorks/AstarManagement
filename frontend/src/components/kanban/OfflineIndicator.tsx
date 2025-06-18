/**
 * Offline Status Indicator for Mobile
 * 
 * @description Shows offline/online status and sync queue information
 * for mobile Kanban board users.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { useServiceWorker } from '@/lib/service-worker'

interface OfflineIndicatorProps {
  className?: string
  position?: 'top' | 'bottom'
  compact?: boolean
}

/**
 * Offline Status Indicator Component
 */
export function OfflineIndicator({ 
  className, 
  position = 'top',
  compact = false 
}: OfflineIndicatorProps) {
  const { isOnline, queueCount, hasUpdate } = useServiceWorker()
  const [showDetails, setShowDetails] = React.useState(false)

  // Auto-hide after some time when online
  React.useEffect(() => {
    if (isOnline && showDetails) {
      const timer = setTimeout(() => setShowDetails(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, showDetails])

  // Show details when going offline or when there's a queue
  React.useEffect(() => {
    if (!isOnline || queueCount > 0) {
      setShowDetails(true)
    }
  }, [isOnline, queueCount])

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs",
        isOnline ? "text-green-600" : "text-orange-600",
        className
      )}>
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {queueCount > 0 && (
          <span className="bg-orange-100 text-orange-800 px-1 rounded text-xs">
            {queueCount}
          </span>
        )}
      </div>
    )
  }

  if (!showDetails && isOnline && queueCount === 0 && !hasUpdate) {
    return null
  }

  return (
    <div className={cn(
      "fixed left-1/2 transform -translate-x-1/2 z-50",
      "bg-background border rounded-lg shadow-lg max-w-sm w-full mx-4",
      "transition-all duration-300 ease-in-out",
      position === 'top' ? "top-4" : "bottom-4",
      className
    )}>
      <div className="p-3">
        {/* Online/Offline Status */}
        <div className="flex items-center gap-2 mb-2">
          {isOnline ? (
            <>
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Online</span>
              </div>
              {queueCount === 0 && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </>
          ) : (
            <div className="flex items-center gap-1 text-orange-600">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Offline</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setShowDetails(false)}
            className="ml-auto text-muted-foreground hover:text-foreground p-1"
          >
            ×
          </button>
        </div>

        {/* Queue Status */}
        {queueCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span>
              {queueCount} action{queueCount !== 1 ? 's' : ''} queued for sync
            </span>
          </div>
        )}

        {/* Update Available */}
        {hasUpdate && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <AlertCircle className="h-4 w-4" />
            <span>App update available</span>
          </div>
        )}

        {/* Offline Message */}
        {!isOnline && (
          <div className="text-xs text-muted-foreground mt-2">
            Your changes will sync when you're back online
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Simple connection status for header/footer
 */
export function ConnectionStatus({ className }: { className?: string }) {
  const { isOnline, queueCount } = useServiceWorker()

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs",
      isOnline ? "text-green-600" : "text-orange-600",
      className
    )}>
      {isOnline ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
      {queueCount > 0 && (
        <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full text-xs ml-1">
          {queueCount}
        </span>
      )}
    </div>
  )
}