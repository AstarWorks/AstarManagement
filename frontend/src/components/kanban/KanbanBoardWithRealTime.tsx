/**
 * Enhanced Kanban board with real-time updates
 * 
 * @description Wraps the existing KanbanBoard component with real-time
 * polling functionality and sync status indicators. Provides seamless
 * integration of live data updates without disrupting user interactions.
 * 
 * @example
 * ```tsx
 * <KanbanBoardWithRealTime
 *   board={board}
 *   currentUser={currentUser}
 *   onMatterUpdate={(matter) => console.log('Updated:', matter)}
 * />
 * ```
 */

'use client'

import React from 'react'
import { KanbanBoard } from './KanbanBoard'
import { SyncStatusIndicator } from './SyncStatusIndicator'
import { usePollingUpdates } from '@/hooks/use-polling-updates'
import { useKanbanStore } from '@/stores/kanban-store'
import type { KanbanBoardProps } from './types'

interface KanbanBoardWithRealTimeProps extends KanbanBoardProps {
  pollingConfig?: {
    interval?: number
    enabled?: boolean
    pauseOnInteraction?: boolean
  }
}

/**
 * Kanban board component enhanced with real-time updates
 */
export function KanbanBoardWithRealTime({
  pollingConfig = {},
  ...boardProps
}: KanbanBoardWithRealTimeProps) {
  // Store selectors
  const { 
    pollingEnabled, 
    lastSyncTime,
    isDragging 
  } = useKanbanStore()
  
  const boardActions = useKanbanStore((state) => ({
    setPollingEnabled: state.setPollingEnabled
  }))

  // Real-time polling hook
  const {
    isPolling,
    isEnabled,
    connectionStatus,
    errorCount,
    nextRetryIn,
    refresh,
    togglePolling
  } = usePollingUpdates({
    interval: pollingConfig.interval || 30000,
    enabled: pollingConfig.enabled ?? true,
    pauseOnInteraction: pollingConfig.pauseOnInteraction ?? true
  })

  /**
   * Enhanced board props with real-time indicators
   */
  const enhancedBoardProps = {
    ...boardProps,
    // Inject sync status into the board header
    renderHeaderExtras: () => (
      <div className="flex items-center gap-4">
        {/* Original stats */}
        <div className="text-sm text-muted-foreground">
          {boardProps.board.matters.length} matters
        </div>

        {/* Sync status indicator */}
        <SyncStatusIndicator
          connectionStatus={connectionStatus}
          lastUpdate={lastSyncTime}
          isPolling={isPolling}
          isEnabled={isEnabled && pollingEnabled}
          errorCount={errorCount}
          nextRetryIn={nextRetryIn}
          onRefresh={refresh}
          onToggle={togglePolling}
          className="border-l pl-4"
        />
      </div>
    )
  }

  return <KanbanBoard {...enhancedBoardProps} />
}

/**
 * Wrapper component for backward compatibility
 */
export function EnhancedKanbanBoard(props: KanbanBoardWithRealTimeProps) {
  return <KanbanBoardWithRealTime {...props} />
}