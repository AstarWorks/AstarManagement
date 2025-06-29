"use client"

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { KanbanColumn } from './KanbanColumn'
import { MatterCard } from './MatterCard'
import { KanbanBoardProps, MatterCard as MatterCardType } from './types'
import { cn } from '@/lib/utils'
import { useKanbanStore } from '@/stores/kanban-store'
import { getMatters } from '@/services/api/matter.service'

/**
 * Virtualized Kanban Board with infinite scroll for performance optimization
 * Implements virtual scrolling to handle large datasets (1000+ matters) efficiently
 */

interface VirtualizedBoardProps extends Omit<KanbanBoardProps, 'board'> {
  pageSize?: number
  itemHeight?: number
  overscan?: number
  enableInfiniteScroll?: boolean
}

interface VirtualizedMattersByColumn {
  [columnId: string]: {
    items: MatterCardType[]
    hasNextPage: boolean
    isLoading: boolean
    totalCount: number
  }
}

export const VirtualizedBoard = React.memo(function VirtualizedBoard({
  filters,
  sorting,
  viewPreferences,
  currentUser,
  onColumnCollapse,
  renderHeaderExtras,
  className,
  pageSize = 20,
  itemHeight = 120,
  overscan = 5,
  enableInfiniteScroll = true,
  ...props
}: VirtualizedBoardProps) {
  // Local state for pagination
  const [mattersByColumn, setMattersByColumn] = useState<VirtualizedMattersByColumn>({})
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])
  
  // Store selectors
  const { board, viewPreferences: storeViewPrefs } = useKanbanStore((state) => ({
    board: state.board,
    viewPreferences: state.viewPreferences
  }))

  // Merge view preferences
  const finalViewPreferences = useMemo(() => ({
    ...storeViewPrefs,
    ...viewPreferences
  }), [storeViewPrefs, viewPreferences])

  // Calculate visible columns
  const columns = useMemo(() => {
    if (!board) return []
    return board.columns
      .filter(column => finalViewPreferences.columnsVisible.includes(column.id))
      .sort((a, b) => {
        const aIndex = finalViewPreferences.columnOrder.indexOf(a.id)
        const bIndex = finalViewPreferences.columnOrder.indexOf(b.id)
        return aIndex - bIndex
      })
  }, [board, finalViewPreferences.columnsVisible, finalViewPreferences.columnOrder])

  // Initialize column data
  useEffect(() => {
    const initialData: VirtualizedMattersByColumn = {}
    columns.forEach(column => {
      initialData[column.id] = {
        items: [],
        hasNextPage: true,
        isLoading: false,
        totalCount: 0
      }
    })
    setMattersByColumn(initialData)
    setVisibleColumns(columns.map(col => col.id))
  }, [columns])

  // Load items for a specific column
  const loadColumnItems = useCallback(async (
    columnId: string, 
    startIndex: number, 
    stopIndex: number
  ) => {
    const column = columns.find(col => col.id === columnId)
    if (!column) return

    // Set loading state
    setMattersByColumn(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        isLoading: true
      }
    }))

    try {
      const page = Math.floor(startIndex / pageSize)
      const size = Math.min(pageSize, stopIndex - startIndex + 1)

      // Build status filter for this column
      const statusFilter = column.status.length === 1 ? column.status[0] : undefined

      // Fetch paginated data
      const response = await getMatters(
        { 
          page, 
          size, 
          sort: `${sorting.field},${sorting.direction}` 
        },
        { 
          status: statusFilter,
          priority: filters.priorities?.[0],
          clientName: filters.search,
          assignedLawyer: filters.assignedLawyer
        }
      )

      const newItems = response.content.map(dto => ({
        id: dto.id,
        caseNumber: dto.caseNumber,
        title: dto.title,
        description: dto.description || '',
        clientName: dto.clientName,
        clientContact: dto.clientContact || '',
        opposingParty: dto.opposingParty || '',
        courtName: dto.courtName || '',
        status: dto.status,
        priority: dto.priority,
        filingDate: dto.filingDate || '',
        estimatedCompletionDate: dto.estimatedCompletionDate || '',
        assignedLawyerId: dto.assignedLawyerId || '',
        assignedLawyerName: dto.assignedLawyerName || '',
        assignedClerkId: dto.assignedClerkId || '',
        assignedClerkName: dto.assignedClerkName || '',
        notes: dto.notes || '',
        tags: dto.tags || [],
        isActive: dto.isActive,
        isOverdue: dto.isOverdue,
        isCompleted: dto.isCompleted,
        ageInDays: dto.ageInDays,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        createdBy: dto.createdBy,
        updatedBy: dto.updatedBy
      }))

      // Update column data
      setMattersByColumn(prev => {
        const existingItems = prev[columnId]?.items || []
        const updatedItems = [...existingItems]
        
        // Insert new items at the correct positions
        newItems.forEach((item, index) => {
          updatedItems[startIndex + index] = item
        })

        return {
          ...prev,
          [columnId]: {
            items: updatedItems,
            hasNextPage: response.page + 1 < response.totalPages,
            isLoading: false,
            totalCount: response.totalElements
          }
        }
      })

    } catch (error) {
      console.error(`Failed to load items for column ${columnId}:`, error)
      setMattersByColumn(prev => ({
        ...prev,
        [columnId]: {
          ...prev[columnId],
          isLoading: false
        }
      }))
    }
  }, [columns, pageSize, sorting, filters])

  // Check if item is loaded
  const isItemLoaded = useCallback((columnId: string, index: number) => {
    const columnData = mattersByColumn[columnId]
    return !!columnData?.items[index]
  }, [mattersByColumn])

  // Get item count for a column (including placeholders)
  const getItemCount = useCallback((columnId: string) => {
    const columnData = mattersByColumn[columnId]
    if (!columnData) return 0
    
    // If we have more items to load, add extra count for loading
    const loadedCount = columnData.items.filter(Boolean).length
    const hasMore = columnData.hasNextPage
    
    if (columnData.totalCount > 0) {
      return columnData.totalCount
    }
    
    return hasMore ? loadedCount + pageSize : loadedCount
  }, [mattersByColumn, pageSize])

  // Row renderer for virtual list
  const createRowRenderer = useCallback((columnId: string, virtualizer: any) => {
    return (virtualRow: any) => {
      const index = virtualRow.index
      const columnData = mattersByColumn[columnId]
      const matter = columnData?.items[index]

      return (
        <div
          key={virtualRow.key}
          data-index={index}
          ref={virtualizer.measureElement}
          className="p-2"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {!matter ? (
            <div className="bg-card border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ) : (
            <MatterCard
              matter={matter}
              viewPreferences={finalViewPreferences}
              currentUser={currentUser}
            />
          )}
        </div>
      )
    }
  }, [mattersByColumn, finalViewPreferences, currentUser])

  // Column renderer with virtualized list
  const renderVirtualizedColumn = useCallback((column: any) => {
    const columnId = column.id
    const itemCount = getItemCount(columnId)
    const parentRef = useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
      count: itemCount,
      getScrollElement: () => parentRef.current,
      estimateSize: () => itemHeight,
      overscan,
    })

    // Load more items when scrolling near the end
    useEffect(() => {
      const [lastItem] = [...virtualizer.getVirtualItems()].reverse()

      if (!lastItem) return

      if (
        enableInfiniteScroll &&
        lastItem.index >= itemCount - 1 &&
        mattersByColumn[columnId]?.hasNextPage &&
        !mattersByColumn[columnId]?.isLoading
      ) {
        loadColumnItems(columnId, itemCount, itemCount + pageSize)
      }
    }, [virtualizer.getVirtualItems(), itemCount, columnId, enableInfiniteScroll, loadColumnItems, pageSize])

    if (itemCount === 0) {
      return (
        <div key={columnId} className="flex-shrink-0 w-80 bg-background border rounded-lg">
          <div className="p-4 border-b">
            <h3 className="font-semibold">{column.title}</h3>
          </div>
          <div className="p-4 text-center text-muted-foreground">
            No matters in this column
          </div>
        </div>
      )
    }

    const rowRenderer = createRowRenderer(columnId, virtualizer)

    return (
      <div key={columnId} className="flex-shrink-0 w-80 bg-background border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-semibold">
            {column.title} ({itemCount})
          </h3>
        </div>
        <div
          ref={parentRef}
          className="h-96 overflow-auto"
          style={{ height: '384px' }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map(rowRenderer)}
          </div>
        </div>
      </div>
    )
  }, [
    getItemCount, 
    createRowRenderer, 
    itemHeight, 
    overscan,
    enableInfiniteScroll,
    mattersByColumn,
    loadColumnItems,
    pageSize
  ])

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 16) { // 60fps threshold
        console.warn(`VirtualizedBoard render took ${renderTime.toFixed(2)}ms (target: <16ms)`)
      } else {
        console.log(`✅ VirtualizedBoard render: ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  if (!board) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {/* Board Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {board.title} (Virtualized)
            </h1>
            <p className="text-sm text-muted-foreground">
              Performance optimized for large datasets
            </p>
          </div>
          <div className="flex items-center gap-4">
            {renderHeaderExtras ? renderHeaderExtras() : (
              <>
                <div className="text-sm text-muted-foreground">
                  {Object.values(mattersByColumn).reduce((total, col) => total + col.totalCount, 0)} total matters
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-4 p-4">
            {columns.map(renderVirtualizedColumn)}
          </div>
        </div>
      </div>
    </div>
  )
})

export default VirtualizedBoard