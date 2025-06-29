/**
 * Mobile-optimized Kanban Board Component
 * 
 * @description Provides mobile-first Kanban board experience with touch gestures,
 * swipe navigation, bottom sheet interactions, and responsive design optimizations.
 * Implements all T06_S02 mobile requirements for optimal mobile UX.
 */

"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Filter, MoreVertical, Plus } from 'lucide-react'

// Custom hooks
import { useBreakpoints } from '@/hooks/use-media-query'
import { useHorizontalSwipe } from '@/hooks/use-swipe'
import { useServiceWorker } from '@/lib/service-worker'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'

// Kanban Components
import { MatterCard } from './MatterCard'
import { FilterBar } from './FilterBar'
import { KanbanEmptyState } from './KanbanEmptyState'
import { OfflineIndicator, ConnectionStatus } from './OfflineIndicator'

// Types
import type { 
  KanbanBoardProps, 
  MatterCard as MatterCardType, 
  KanbanColumn 
} from './types'

interface MobileKanbanBoardProps extends Omit<KanbanBoardProps, 'dragContext'> {
  // Mobile-specific props
  enableSwipeNavigation?: boolean
  showColumnCount?: boolean
  compactCards?: boolean
}

/**
 * Mobile Navigation Header
 */
function MobileHeader({ 
  title, 
  activeColumn, 
  columns, 
  onColumnChange, 
  onFilterClick,
  matterCount 
}: {
  title: string
  activeColumn: string
  columns: KanbanColumn[]
  onColumnChange: (columnId: string) => void
  onFilterClick: () => void
  matterCount: number
}) {
  const currentColumnIndex = columns.findIndex(col => col.id === activeColumn)
  const canGoPrevious = currentColumnIndex > 0
  const canGoNext = currentColumnIndex < columns.length - 1

  const goToPrevious = React.useCallback(() => {
    if (canGoPrevious) {
      onColumnChange(columns[currentColumnIndex - 1].id)
    }
  }, [canGoPrevious, currentColumnIndex, columns, onColumnChange])

  const goToNext = React.useCallback(() => {
    if (canGoNext) {
      onColumnChange(columns[currentColumnIndex + 1].id)
    }
  }, [canGoNext, currentColumnIndex, columns, onColumnChange])

  const currentColumn = columns[currentColumnIndex]

  return (
    <div className="flex-shrink-0 border-b bg-background">
      {/* Title and Stats */}
      <div className="px-4 py-3 border-b">
        <h1 className="text-lg font-semibold truncate">{title}</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {matterCount} matters • {columns.length} columns
          </p>
          <ConnectionStatus />
        </div>
      </div>

      {/* Column Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <div className="text-sm font-medium">
            {currentColumn?.titleJa || currentColumn?.title}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentColumnIndex + 1} of {columns.length}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={!canGoNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onFilterClick}
          className="h-8 w-8 ml-2"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Mobile Column Tabs
 */
function MobileColumnTabs({ 
  columns, 
  activeColumn, 
  onColumnChange,
  mattersByColumn 
}: {
  columns: KanbanColumn[]
  activeColumn: string
  onColumnChange: (columnId: string) => void
  mattersByColumn: Record<string, MatterCardType[]>
}) {
  return (
    <div className="border-b bg-background">
      <div className="px-2 py-2 overflow-x-auto">
        <div className="flex gap-1 min-w-fit">
          {columns.map((column) => {
            const isActive = column.id === activeColumn
            const matterCount = mattersByColumn[column.id]?.length || 0
            
            return (
              <button
                key={column.id}
                onClick={() => onColumnChange(column.id)}
                className={cn(
                  "flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md",
                  "min-w-[44px] min-h-[44px] flex flex-col items-center justify-center",
                  "transition-colors duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span className="truncate max-w-16">
                  {column.titleJa || column.title}
                </span>
                <span className="text-xs opacity-70 mt-0.5">
                  {matterCount}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Bottom Sheet for Matter Actions
 */
function MatterActionSheet({ 
  matter, 
  isOpen, 
  onClose,
  onStatusChange 
}: {
  matter: MatterCardType | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (newStatus: string) => void
}) {
  if (!matter) return null

  const statusOptions = [
    { value: 'INTAKE', label: 'Intake' },
    { value: 'INITIAL_REVIEW', label: 'Initial Review' },
    { value: 'INVESTIGATION', label: 'Investigation' },
    { value: 'RESEARCH', label: 'Research' },
    { value: 'DRAFT_PLEADINGS', label: 'Draft Pleadings' },
    { value: 'FILED', label: 'Filed' },
    { value: 'DISCOVERY', label: 'Discovery' },
    { value: 'MEDIATION', label: 'Mediation' },
    { value: 'TRIAL_PREP', label: 'Trial Prep' },
    { value: 'TRIAL', label: 'Trial' },
    { value: 'SETTLEMENT', label: 'Settlement' },
    { value: 'CLOSED', label: 'Closed' }
  ]

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>Matter Actions</SheetTitle>
          <SheetClose />
        </SheetHeader>
        
        <div className="p-4 space-y-4">
          {/* Matter Info */}
          <div className="space-y-2">
            <h4 className="font-medium">{matter.title}</h4>
            <p className="text-sm text-muted-foreground">
              Case: {matter.caseNumber} • Client: {matter.clientName}
            </p>
          </div>

          {/* Quick Status Change */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium">Change Status</h5>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.filter(option => option.value !== matter.status).map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onStatusChange(option.value)
                    onClose()
                  }}
                  className="justify-start text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" className="flex-1">
              Edit Details
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View Documents
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Main Mobile Kanban Board Component
 */
export function KanbanBoardMobile({
  board,
  actions,
  filters,
  sorting,
  viewPreferences,
  currentUser,
  enableSwipeNavigation = true,
  showColumnCount = true,
  compactCards = true,
  className
}: MobileKanbanBoardProps) {
  const { isMobile } = useBreakpoints()
  const { isOnline, cacheMatters, queueRequest } = useServiceWorker()
  const [activeColumn, setActiveColumn] = React.useState<string>(board.columns[0]?.id || '')
  const [showFilters, setShowFilters] = React.useState<boolean>(false)
  const [selectedMatter, setSelectedMatter] = React.useState<MatterCardType | null>(null)

  // Filter and group matters
  const filteredMatters = React.useMemo(() => {
    let filtered = [...board.matters]

    // Apply search filter
    if (filters.searchQuery || filters.search) {
      const query = filters.searchQuery || filters.search || ''
      filtered = filtered.filter(matter => 
        matter.title.toLowerCase().includes(query.toLowerCase()) ||
        matter.caseNumber.toLowerCase().includes(query.toLowerCase()) ||
        matter.clientName.toLowerCase().includes(query.toLowerCase())
      )
    }

    // Apply priority filter
    const priorities = filters.selectedPriorities || filters.priorities || []
    if (priorities.length > 0) {
      filtered = filtered.filter(matter => 
        priorities.includes(matter.priority)
      )
    }

    return filtered
  }, [board.matters, filters])

  // Group matters by column
  const mattersByColumn = React.useMemo(() => {
    const groups: Record<string, MatterCardType[]> = {}
    
    board.columns.forEach(column => {
      groups[column.id] = []
    })

    filteredMatters.forEach(matter => {
      const column = board.columns.find(col => 
        col.status.includes(matter.status)
      )
      if (column) {
        groups[column.id].push(matter)
      }
    })

    return groups
  }, [filteredMatters, board.columns])

  // Swipe navigation
  const swipeHandlers = useHorizontalSwipe(
    // onSwipeLeft (next column)
    React.useCallback(() => {
      if (!enableSwipeNavigation) return
      const currentIndex = board.columns.findIndex(col => col.id === activeColumn)
      if (currentIndex < board.columns.length - 1) {
        setActiveColumn(board.columns[currentIndex + 1].id)
      }
    }, [enableSwipeNavigation, board.columns, activeColumn]),
    // onSwipeRight (previous column)
    React.useCallback(() => {
      if (!enableSwipeNavigation) return
      const currentIndex = board.columns.findIndex(col => col.id === activeColumn)
      if (currentIndex > 0) {
        setActiveColumn(board.columns[currentIndex - 1].id)
      }
    }, [enableSwipeNavigation, board.columns, activeColumn]),
    {
      delta: 50,
      preventDefaultTouchmoveEvent: true,
      trackMouse: false
    }
  )

  // Handle matter status change with offline support
  const handleStatusChange = React.useCallback(async (matterId: string, newStatus: string) => {
    const targetColumn = board.columns.find(col => col.status.includes(newStatus))
    if (targetColumn) {
      if (isOnline) {
        await actions.moveMatter(matterId, newStatus, targetColumn.id)
      } else {
        // Queue for offline sync
        await queueRequest(`/api/matters/${matterId}/status`, 'PUT', {
          status: newStatus,
          columnId: targetColumn.id
        })
        
        // Optimistic update for offline mode
        await actions.moveMatter(matterId, newStatus, targetColumn.id)
      }
    }
  }, [actions, board.columns, isOnline, queueRequest])

  // Cache matters for offline access when board data changes
  React.useEffect(() => {
    if (board.matters.length > 0) {
      cacheMatters(board.matters)
    }
  }, [board.matters, cacheMatters])

  // Get current column data
  const currentColumn = board.columns.find(col => col.id === activeColumn)
  const currentMatters = mattersByColumn[activeColumn] || []

  // Ensure we have a valid active column
  React.useEffect(() => {
    if (!activeColumn && board.columns.length > 0) {
      setActiveColumn(board.columns[0].id)
    }
  }, [activeColumn, board.columns])

  if (!isMobile) {
    // Return null or redirect to desktop version
    return null
  }

  return (
    <div className={cn("flex flex-col h-full w-full bg-background", className)}>
      {/* Mobile Header */}
      <MobileHeader
        title={board.title}
        activeColumn={activeColumn}
        columns={board.columns}
        onColumnChange={setActiveColumn}
        onFilterClick={() => setShowFilters(true)}
        matterCount={filteredMatters.length}
      />

      {/* Column Tabs */}
      <MobileColumnTabs
        columns={board.columns}
        activeColumn={activeColumn}
        onColumnChange={setActiveColumn}
        mattersByColumn={mattersByColumn}
      />

      {/* Main Content with Swipe Support */}
      <div className="flex-1 overflow-hidden relative" {...swipeHandlers}>
        <div className="h-full p-4">
          {currentColumn && (
            <div className="h-full flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">{currentColumn.titleJa}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentMatters.length} matters
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Matters List */}
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
                {currentMatters.length > 0 ? (
                  currentMatters.map((matter) => (
                    <div key={matter.id} className="relative">
                      <MatterCard
                        matter={matter}
                        viewPreferences={{
                          ...viewPreferences,
                          cardSize: compactCards ? 'compact' : 'normal'
                        }}
                        currentUser={currentUser}
                        onClick={() => setSelectedMatter(matter)}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      />
                      
                      {/* Action Button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 opacity-60 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedMatter(matter)
                        }}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <KanbanEmptyState
                    column={currentColumn}
                    onCreateMatter={() => {}}
                    className="mt-8"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Swipe Indicator (Optional) */}
        {enableSwipeNavigation && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1">
              {board.columns.map((column, index) => (
                <div
                  key={column.id}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    column.id === activeColumn 
                      ? "bg-primary" 
                      : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetClose />
          </SheetHeader>
          <div className="p-4">
            <FilterBar
              filters={filters}
              onFiltersChange={actions.setFilters}
              onClearFilters={actions.clearFilters}
              className="border-0 p-0"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Matter Action Sheet */}
      <MatterActionSheet
        matter={selectedMatter}
        isOpen={!!selectedMatter}
        onClose={() => setSelectedMatter(null)}
        onStatusChange={(newStatus) => {
          if (selectedMatter) {
            handleStatusChange(selectedMatter.id, newStatus)
          }
        }}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator position="top" />
    </div>
  )
}