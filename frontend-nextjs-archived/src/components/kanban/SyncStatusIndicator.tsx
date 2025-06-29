/**
 * Sync status indicator for real-time updates
 * 
 * @description Shows the current synchronization status with visual indicators
 * for connected, syncing, disconnected, and error states. Provides user feedback
 * about data freshness and connection quality.
 * 
 * @example
 * ```tsx
 * <SyncStatusIndicator 
 *   status="connected"
 *   lastUpdate={new Date()}
 *   isPolling={true}
 *   onRefresh={() => refresh()}
 * />
 * ```
 */

import { formatDistanceToNow } from 'date-fns'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  Loader2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SyncStatusIndicatorProps {
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  lastUpdate: Date | null
  isPolling: boolean
  isEnabled: boolean
  errorCount?: number
  nextRetryIn?: number
  onRefresh?: () => void
  onToggle?: () => void
  className?: string
}

/**
 * Visual indicator component for real-time sync status
 */
export function SyncStatusIndicator({
  connectionStatus,
  lastUpdate,
  isPolling,
  isEnabled,
  errorCount = 0,
  nextRetryIn = 0,
  onRefresh,
  onToggle,
  className = ''
}: SyncStatusIndicatorProps) {
  
  /**
   * Get status configuration based on connection state
   */
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: isPolling ? Loader2 : CheckCircle2,
          iconClass: isPolling 
            ? 'text-blue-500 animate-spin' 
            : 'text-green-500',
          dotClass: 'bg-green-500 animate-pulse',
          label: isPolling ? 'Syncing...' : 'Connected',
          description: lastUpdate 
            ? `Last updated ${formatDistanceToNow(lastUpdate, { addSuffix: true })}`
            : 'Ready to sync'
        }
      
      case 'reconnecting':
        return {
          icon: RefreshCw,
          iconClass: 'text-yellow-500 animate-spin',
          dotClass: 'bg-yellow-500 animate-pulse',
          label: 'Reconnecting...',
          description: nextRetryIn > 0 
            ? `Retrying in ${Math.round(nextRetryIn)}s`
            : 'Attempting to reconnect'
        }
      
      case 'disconnected':
        return {
          icon: errorCount > 0 ? AlertTriangle : WifiOff,
          iconClass: errorCount > 0 ? 'text-red-500' : 'text-gray-400',
          dotClass: errorCount > 0 ? 'bg-red-500' : 'bg-gray-400',
          label: errorCount > 0 ? 'Connection Error' : 'Disconnected',
          description: errorCount > 0 
            ? `${errorCount} failed attempts`
            : 'Real-time updates disabled'
        }
      
      default:
        return {
          icon: WifiOff,
          iconClass: 'text-gray-400',
          dotClass: 'bg-gray-400',
          label: 'Unknown',
          description: 'Status unknown'
        }
    }
  }

  const status = getStatusConfig()
  const StatusIcon = status.icon

  /**
   * Format the detailed status message
   */
  const getDetailedStatus = () => {
    const parts = [status.description]
    
    if (!isEnabled) {
      parts.unshift('Real-time updates disabled')
    } else if (connectionStatus === 'connected' && !isPolling) {
      parts.push('Auto-sync active')
    }
    
    return parts.join(' • ')
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
        {/* Status indicator dot */}
        <div className={`w-2 h-2 rounded-full ${status.dotClass}`} />
        
        {/* Status icon and label */}
        <div className="flex items-center gap-1.5" title={getDetailedStatus()}>
          <StatusIcon className={`w-4 h-4 ${status.iconClass}`} />
          <span className="text-sm text-muted-foreground">
            {status.label}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Manual refresh button */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onRefresh}
              disabled={isPolling}
              title="Refresh now"
            >
              <RefreshCw className={`w-3 h-3 ${isPolling ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {/* Toggle auto-sync button */}
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onToggle}
              title={isEnabled ? 'Disable auto-sync' : 'Enable auto-sync'}
            >
              {isEnabled ? (
                <Wifi className="w-3 h-3 text-blue-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-gray-400" />
              )}
            </Button>
          )}
        </div>
      </div>
  )
}

/**
 * Compact version for minimal space usage
 */
export function SyncStatusIndicatorCompact({
  connectionStatus,
  isPolling,
  onRefresh,
  className = ''
}: Pick<SyncStatusIndicatorProps, 'connectionStatus' | 'isPolling' | 'onRefresh' | 'className'>) {
  const status = connectionStatus === 'connected' 
    ? (isPolling ? 'syncing' : 'connected')
    : connectionStatus

  const statusColors = {
    connected: 'bg-green-500',
    syncing: 'bg-blue-500',
    reconnecting: 'bg-yellow-500',
    disconnected: 'bg-red-500'
  }

  return (
    <button
      className={`w-2 h-2 rounded-full ${statusColors[status]} ${
        isPolling || status === 'reconnecting' ? 'animate-pulse' : ''
      } ${className}`}
      onClick={onRefresh}
      title={`${status}${onRefresh ? ' - Click to refresh' : ''}`}
    />
  )
}