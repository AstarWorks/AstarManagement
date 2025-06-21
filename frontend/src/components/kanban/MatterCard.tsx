"use client"

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Clock, User, AlertTriangle, AlertCircle, Info, Minus } from 'lucide-react'
import { MatterCardProps } from './types'
import { PRIORITY_COLORS, STATUS_COLORS, ANIMATION_CONFIG } from './constants'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { format, isAfter, parseISO } from 'date-fns'
import { SearchHighlight } from '@/components/search/SearchHighlight'
// REMOVED: import { useKanbanStore } from '@/stores/kanban-store'

// Priority icon mapping
const getPriorityIcon = (priority: string) => {
  const icons = {
    URGENT: AlertTriangle,
    HIGH: AlertCircle,
    MEDIUM: Info,
    LOW: Minus
  }

  const IconComponent = icons[priority as keyof typeof icons] || Info
  return IconComponent
}

// Get initials from name
const getInitials = (name: string): string => {
  return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
}

// Format date for display
const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString)
    return format(date, 'MMM d')
  } catch {
    return 'Invalid date'
  }
}

// Check if date is overdue
const isOverdue = (dueDateString: string): boolean => {
  try {
    const dueDate = parseISO(dueDateString)
    const now = new Date()
    return isAfter(now, dueDate)
  } catch {
    return false
  }
}

export const MatterCard = React.memo(function MatterCard({
                                                           matter,
                                                           isDragging,
                                                           viewPreferences,
                                                           onClick,
                                                           className,
                                                           ...props
                                                         }: MatterCardProps & React.HTMLAttributes<HTMLDivElement>) {

  // COMPLETELY STATIC - NO STORE ACCESS AT ALL
  // Removed unused variables: searchMode, lastSearchQuery, searchTerms, showSearchHighlights

  // Memoize expensive computations
  const priorityConfig = React.useMemo(() => PRIORITY_COLORS[matter.priority], [matter.priority])
  const statusColor = React.useMemo(() => STATUS_COLORS[matter.status], [matter.status])
  const PriorityIcon = React.useMemo(() => getPriorityIcon(matter.priority), [matter.priority])

  // Check if matter is overdue - memoized
  const matterIsOverdue = React.useMemo(() =>
          matter.dueDate ? isOverdue(matter.dueDate) : false,
      [matter.dueDate]
  )

  // Determine card size based on view preferences - static mapping to avoid object creation
  const cardHeight = React.useMemo(() => {
    switch (viewPreferences.cardSize) {
      case 'compact': return 'h-20'
      case 'normal': return 'h-28'
      case 'detailed': return 'h-36'
      default: return 'h-28'
    }
  }, [viewPreferences.cardSize])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: matter.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || ANIMATION_CONFIG.cardHoverTransition,
    willChange: (isDragging || isSortableDragging) ? 'transform' : 'auto',
  }

  return (
      <Card
          ref={setNodeRef}
          style={style}
          className={cn(
              "cursor-pointer transition-all duration-150",
              "hover:shadow-md hover:scale-[1.02]",
              "border-l-4",
              priorityConfig.border,
              cardHeight,
              (isDragging || isSortableDragging) && "opacity-50 shadow-xl z-50 cursor-grabbing",
              !(isDragging || isSortableDragging) && "cursor-grab",
              matterIsOverdue && "ring-1 ring-red-200 bg-red-50/30",
              className
          )}
          onClick={onClick}
          {...attributes}
          {...listeners}
          {...props}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {showSearchHighlights ? (
                      <SearchHighlight
                          text={matter.title}
                          highlights={matter.searchHighlights?.title}
                          searchTerms={searchTerms}
                          maxLength={50}
                          highlightClassName="bg-yellow-200 px-1 rounded font-medium"
                      />
                  ) : (
                      matter.title
                  )}
                </h4>
                {viewPreferences.showPriority && (
                    <Badge
                        variant="secondary"
                        className={cn("text-xs", priorityConfig.badge)}
                    >
                      <PriorityIcon className="w-3 h-3 mr-1" />
                      {matter.priority}
                    </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">
                #{showSearchHighlights ? (
                  <SearchHighlight
                      text={matter.caseNumber}
                      highlights={matter.searchHighlights?.caseNumber}
                      searchTerms={searchTerms}
                      highlightClassName="bg-yellow-200 px-1 rounded"
                  />
              ) : (
                  matter.caseNumber
              )}
              </span>
                <Badge variant="outline" className={cn("text-xs", statusColor)}>
                  {matter.status.replace('_', ' ').toLowerCase()}
                </Badge>
              </div>
            </div>

            {/* Search relevance score or drag handle */}
            {showSearchHighlights && matter.relevanceScore ? (
                <div className="text-xs text-muted-foreground">
                  <Badge
                      variant="outline"
                      className="text-xs"
                  >
                    {Math.round(matter.relevanceScore * 100)}%
                  </Badge>
                </div>
            ) : (
                /* Drag handle indicator */
                <div className="flex flex-col gap-1 opacity-30 hover:opacity-60 transition-opacity">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* Client name */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="truncate">
              {showSearchHighlights ? (
                  <SearchHighlight
                      text={matter.clientName}
                      highlights={matter.searchHighlights?.clientName}
                      searchTerms={searchTerms}
                      maxLength={30}
                      highlightClassName="bg-yellow-200 px-1 rounded"
                  />
              ) : (
                  matter.clientName
              )}
            </span>
            </div>

            {/* Due date */}
            {viewPreferences.showDueDates && matter.dueDate && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3 h-3" />
                  <span className={cn(
                      "truncate",
                      matterIsOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                  )}>
                {formatDate(matter.dueDate)}
                    {matterIsOverdue && " (Overdue)"}
              </span>
                </div>
            )}

            {/* Status duration */}
            {viewPreferences.cardSize === 'detailed' && matter.statusDuration && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                {matter.statusDuration} day{matter.statusDuration !== 1 ? 's' : ''} in status
              </span>
                </div>
            )}

            {/* Last updated */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
              Updated {formatDate(matter.updatedAt)}
            </span>
            </div>

            {/* Assignees */}
            {viewPreferences.showAvatars && (
                <div className="flex items-center gap-2 mt-2">
                  {matter.assignedLawyer && (
                      <Avatar
                          className="w-6 h-6"
                      >
                        <AvatarImage src={matter.assignedLawyer.avatar} />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {getInitials(matter.assignedLawyer.name)}
                        </AvatarFallback>
                      </Avatar>
                  )}

                  {matter.assignedClerk && (
                      <Avatar
                          className="w-6 h-6"
                      >
                        <AvatarImage src={matter.assignedClerk.avatar} />
                        <AvatarFallback className="text-xs bg-green-100 text-green-700">
                          {getInitials(matter.assignedClerk.name)}
                        </AvatarFallback>
                      </Avatar>
                  )}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
  )
})