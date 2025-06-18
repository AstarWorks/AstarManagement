"use client"

import React from 'react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DEFAULT_COLUMNS, BOARD_CONFIG } from './constants'
import type { KanbanColumn } from './types'

// Foundational props - simple and focused
interface KanbanBoardFoundationProps {
  title?: string
  columns?: KanbanColumn[]
  className?: string
  showJapanese?: boolean
  children?: React.ReactNode
}

interface KanbanColumnFoundationProps {
  column: KanbanColumn
  showJapanese?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * Foundational Kanban Column Component
 * 
 * @description Renders a single column with header and content placeholder.
 * This is the basic building block for the Kanban board layout foundation.
 */
function KanbanColumnFoundation({ 
  column, 
  showJapanese = true,
  className,
  style 
}: KanbanColumnFoundationProps) {
  const displayTitle = showJapanese ? column.titleJa : column.title

  return (
    <Card 
      className={cn(
        "h-full flex flex-col",
        "border-muted bg-muted/50",
        column.color,
        className
      )}
      style={style}
    >
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          <span className="block">{displayTitle}</span>
          {showJapanese && (
            <span className="block text-xs opacity-70 mt-1">{column.title}</span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 pt-0">
        <div className="h-full min-h-[200px] space-y-3">
          {/* Placeholder for future content - foundational only */}
          <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed border-muted rounded-lg">
            <div className="mb-2 text-lg">📋</div>
            <div>Content area</div>
            <div className="text-xs mt-1">Ready for T02_S02 (Matter Cards)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Foundational Kanban Board Layout Component
 * 
 * @description Provides the core responsive layout structure for the Kanban board
 * with proper column arrangement and scrolling behavior. This component focuses
 * exclusively on foundational layout without advanced features like drag-and-drop,
 * filtering, or real-time updates (those belong to T03-T05).
 * 
 * @param props - Foundational component props
 * @returns JSX.Element - The foundational board layout
 * 
 * @example
 * ```tsx
 * <KanbanBoardFoundation 
 *   title="Matter Management Board"
 *   showJapanese={true}
 *   className="h-screen"
 * />
 * ```
 */
export function KanbanBoardFoundation({
  title = "Matter Management Board",
  columns = DEFAULT_COLUMNS,
  showJapanese = true,
  className,
  children
}: KanbanBoardFoundationProps) {
  const [activeTabIndex, setActiveTabIndex] = React.useState(0)

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {/* Board Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {columns.length} columns • Foundational layout (T01_S02)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Foundation Ready
          </div>
        </div>
      </div>

      {/* Desktop & Tablet Layout (>=768px) */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <ScrollArea className="w-full h-full">
          <div 
            className="flex h-full gap-4 p-4"
            style={{
              minWidth: `${columns.length * (BOARD_CONFIG.minColumnWidth + BOARD_CONFIG.columnGap)}px`
            }}
          >
            {columns.map((column) => (
              <KanbanColumnFoundation
                key={column.id}
                column={column}
                showJapanese={showJapanese}
                className="flex-shrink-0"
                style={{
                  width: `${BOARD_CONFIG.minColumnWidth}px`,
                  maxWidth: `${BOARD_CONFIG.maxColumnWidth}px`
                }}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Mobile Layout (<768px) - Single Column with Tabs */}
      <div className="md:hidden flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="flex-shrink-0 border-b bg-background">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex p-2 gap-1">
              {columns.map((column, index) => (
                <button
                  key={column.id}
                  onClick={() => setActiveTabIndex(index)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap",
                    "transition-colors duration-200",
                    index === activeTabIndex 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {showJapanese ? column.titleJa : column.title}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Active Column Content */}
        <div className="flex-1 p-4">
          {columns[activeTabIndex] && (
            <KanbanColumnFoundation
              column={columns[activeTabIndex]}
              showJapanese={showJapanese}
              className="h-full"
            />
          )}
        </div>
      </div>

      {/* Language Toggle (Demo) */}
      <div className="flex-shrink-0 p-2 border-t bg-muted/30">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Language:</span>
          <button 
            onClick={() => {}} 
            className="px-2 py-1 bg-background border rounded text-xs hover:bg-muted"
          >
            {showJapanese ? '日本語' : 'English'}
          </button>
          <span className="text-xs opacity-50">• Foundation T01_S02</span>
        </div>
      </div>

      {/* Custom children content if provided */}
      {children}
    </div>
  )
}

// Export types for external use
export type { KanbanBoardFoundationProps, KanbanColumnFoundationProps }