"use client"

import React from 'react'
import { KanbanBoardContainer } from '@/components/kanban'
import { useKanbanStore, useBoardActions, useBoardMetrics, useLoadingState } from '@/stores/kanban-store'
import { demoCurrentUser, demoMatters } from '@/lib/demo-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Filter, Settings, Plus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export default function KanbanDemoPage() {
  // Initialize store with demo data on mount
  React.useEffect(() => {
    const initializeBoard = useKanbanStore.getState().initializeBoard
    initializeBoard(demoMatters)
  }, [])

  // Store state and actions
  const { refreshBoard } = useBoardActions()
  const metrics = useBoardMetrics()
  const { isLoading, lastRefresh } = useLoadingState()

  // Calculate demo statistics from metrics
  const stats = React.useMemo(() => ({
    total: metrics.totalMatters,
    overdue: metrics.overdueMatters,
    highPriority: (metrics.mattersByPriority.HIGH || 0) + (metrics.mattersByPriority.URGENT || 0),
    completed: metrics.mattersCompletedToday
  }), [metrics])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Demo Header */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Kanban Board Demo
              </h1>
              <p className="text-sm text-muted-foreground">
                Interactive demonstration of the Aster Management Kanban board
              </p>
            </div>
            
            {/* Demo Controls */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshBoard()}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh board data</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filter options (demo)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Board settings (demo)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Matter
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create new matter (demo)</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Demo Stats */}
          <div className="flex items-center gap-4 mt-3">
            <Badge variant="secondary" className="gap-1">
              <span className="font-medium">{stats.total}</span>
              <span className="text-muted-foreground">Total</span>
            </Badge>
            
            {stats.overdue > 0 && (
              <Badge variant="destructive" className="gap-1">
                <span className="font-medium">{stats.overdue}</span>
                <span>Overdue</span>
              </Badge>
            )}
            
            {stats.highPriority > 0 && (
              <Badge variant="outline" className="gap-1 border-orange-300 text-orange-700">
                <span className="font-medium">{stats.highPriority}</span>
                <span>High Priority</span>
              </Badge>
            )}
            
            <Badge variant="outline" className="gap-1 border-green-300 text-green-700">
              <span className="font-medium">{stats.completed}</span>
              <span>Completed</span>
            </Badge>

            <div className="ml-auto text-xs text-muted-foreground">
              Demo Mode • Drag matters between columns to test functionality
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoardContainer
          currentUser={demoCurrentUser}
          onColumnCollapse={(columnId, collapsed) => {
            console.log(`🗂️ Column ${columnId} ${collapsed ? 'collapsed' : 'expanded'}`)
          }}
          className="h-full"
        />
      </div>

      {/* Demo Footer */}
      <div className="flex-shrink-0 border-t bg-muted/30 px-4 py-2">
        <div className="container mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>
              <span>
                Built with Next.js 15, TypeScript, shadcn/ui, @dnd-kit
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Open browser console to see action logs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}