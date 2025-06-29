"use client"

import React from 'react'
import {useDroppable} from '@dnd-kit/core'
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable'
import {ChevronDown, ChevronRight} from 'lucide-react'
import {MatterCard} from './MatterCard'
import {KanbanEmptyState} from './KanbanEmptyState'
import {KanbanColumnProps, MatterCard as MatterCardType} from './types'
import {COLUMN_ICONS} from './constants'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'
import {CardSkeletonGroup} from '@/components/ui/skeleton/CardSkeleton'
import {useLoadingState} from '@/stores/kanban-store'

// Import icon components dynamically
const getColumnIcon = (iconName: string) => {
    const icons = {
        MessageCircle: () => <div className="w-4 h-4 rounded-full bg-blue-500"/>,
        FileText: () => <div className="w-4 h-4 rounded bg-yellow-500"/>,
        Eye: () => <div className="w-4 h-4 rounded-full bg-purple-500"/>,
        Send: () => <div className="w-4 h-4 bg-green-500" style={{clipPath: 'polygon(0 50%, 100% 0, 100% 100%)'}}/>,
        Clock: () => <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-orange-300"/>,
        Timer: () => <div className="w-4 h-4 rounded bg-indigo-500"/>,
        CheckCircle: () => <div className="w-4 h-4 rounded-full bg-gray-500"/>
    }

    const IconComponent = icons[iconName as keyof typeof icons]
    return IconComponent ? IconComponent() : <div className="w-4 h-4 rounded bg-gray-400"/>
}

export const KanbanColumn = React.memo(function KanbanColumn({
                                                                 column,
                                                                 matters,
                                                                 isDragging,
                                                                 onToggleCollapse,
                                                                 viewPreferences,
                                                                 currentUser,
                                                                 className,
                                                                 ...props
                                                             }: KanbanColumnProps & React.HTMLAttributes<HTMLDivElement>) {
    // Get loading state from store
    const {isLoading} = useLoadingState()
    const {
        isOver: isOverDroppable,
        setNodeRef: setDroppableRef
    } = useDroppable({
        id: column.id
    })

    // Use the prop directly instead of maintaining local state
    const isCollapsed = column.isCollapsed || false

    const handleToggleCollapse = React.useCallback(() => {
        const newCollapsed = !isCollapsed
        onToggleCollapse?.(newCollapsed)
    }, [isCollapsed, onToggleCollapse])

    // Removed unused ariaLabel variable

    // Stable matter IDs calculation - only recalculate when matters array changes
    const matterIds = React.useMemo(() => {
        return matters.map(matter => matter.id)
    }, [matters])

    // Use matters directly - no need for additional memoization that creates circular dependencies
    const stableMatters = matters

    // Calculate column statistics - memoized to prevent re-renders
    const {overdueCount, highPriorityCount} = React.useMemo(() => {
        const overdue = matters.filter(matter => matter.isOverdue).length
        const highPriority = matters.filter(matter =>
            matter.priority === 'HIGH' || matter.priority === 'URGENT'
        ).length
        return {overdueCount: overdue, highPriorityCount: highPriority}
    }, [matters])

    // Memoized render function for matters to prevent recreation
    const renderMatterCard = React.useCallback((matter: MatterCardType) => (
        <MatterCard
            key={matter.id}
            matter={matter}
            viewPreferences={viewPreferences}
            currentUser={currentUser}
            className="mb-2 last:mb-0"
        />
    ), [viewPreferences, currentUser])

    return (
        <div
            ref={setDroppableRef}
            className={cn(
                "flex flex-col h-full bg-card rounded-lg border shadow-sm",
                "transition-all duration-200",
                column.color,
                isOverDroppable && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50 border-blue-300",
                isDragging && "opacity-50",
                isCollapsed && "w-16",
                className
            )}
            {...props}
        >
            {/* Column Header */}
            <div className="flex-shrink-0 p-4 border-b bg-card/50 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggleCollapse}
                            className="p-1 h-6 w-6 hover:bg-background/80"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-4 w-4"/>
                            ) : (
                                <ChevronDown className="h-4 w-4"/>
                            )}
                        </Button>

                        {!isCollapsed && (
                            <>
                                <div className="flex items-center gap-2 min-w-0">
                                    {getColumnIcon(COLUMN_ICONS[column.id as keyof typeof COLUMN_ICONS] || 'FileText')}
                                    <h3 className="font-medium text-sm text-foreground truncate">
                                        {column.title}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-1 ml-auto">
                                    <Badge variant="secondary" className="text-xs">
                                        {stableMatters.length}
                                    </Badge>

                                    {overdueCount > 0 && (
                                        <Badge variant="destructive" className="text-xs">
                                            {overdueCount}
                                        </Badge>
                                    )}

                                    {highPriorityCount > 0 && (
                                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                            {highPriorityCount}
                                        </Badge>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Column subtitle/status list */}
                {!isCollapsed && (
                    <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                            {column.status.map((status) => (
                                <Badge
                                    key={status}
                                    variant="outline"
                                    className="text-xs font-normal"
                                >
                                    {status.replace('_', ' ').toLowerCase()}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Column Content */}
            {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                    {isLoading && stableMatters.length === 0 ? (
                        // Show skeleton loading for empty columns during load
                        <div className="p-2">
                            <CardSkeletonGroup
                                count={3}
                                cardSize={viewPreferences.cardSize}
                                showPriority={viewPreferences.showPriority}
                                showDueDates={viewPreferences.showDueDates}
                                showAvatars={viewPreferences.showAvatars}
                            />
                        </div>
                    ) : stableMatters.length === 0 ? (
                        <KanbanEmptyState
                            column={column}
                            className="p-4"
                        />
                    ) : (
                        <div className="h-full overflow-y-auto p-2 space-y-2">
                            <SortableContext
                                items={matterIds}
                                strategy={verticalListSortingStrategy}
                            >
                                {stableMatters.map(renderMatterCard)}
                            </SortableContext>

                            {/* Show additional skeleton cards if still loading more data */}
                            {isLoading && (
                                <div className="pt-2">
                                    <CardSkeletonGroup
                                        count={2}
                                        cardSize={viewPreferences.cardSize}
                                        showPriority={viewPreferences.showPriority}
                                        showDueDates={viewPreferences.showDueDates}
                                        showAvatars={viewPreferences.showAvatars}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Collapsed State Preview */}
            {isCollapsed && (
                <div className="flex-1 p-2">
                    <div className="text-center">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                            {stableMatters.length}
                        </div>
                        {stableMatters.slice(0, 3).map((matter) => (
                            <div
                                key={matter.id}
                                className="w-8 h-1 bg-primary/20 rounded mb-1"
                                style={{
                                    backgroundColor: matter.priority === 'URGENT' ? '#ef4444' :
                                        matter.priority === 'HIGH' ? '#f97316' :
                                            matter.priority === 'MEDIUM' ? '#3b82f6' : '#6b7280'
                                }}
                            />
                        ))}
                        {stableMatters.length > 3 && (
                            <div className="text-xs text-muted-foreground mt-1">
                                +{stableMatters.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
})