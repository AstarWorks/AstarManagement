"use client"

import React from 'react'
import { Plus, FileText } from 'lucide-react'
import { KanbanEmptyStateProps } from './types'
import { COLUMN_ICONS } from './constants'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Get column icon for empty state
const getColumnIcon = (columnId: string) => {
  const iconName = COLUMN_ICONS[columnId as keyof typeof COLUMN_ICONS] || 'FileText'
  
  // Simple icon mapping for empty states
  const icons = {
    MessageCircle: () => (
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-blue-500" />
      </div>
    ),
    FileText: () => (
      <div className="w-12 h-12 rounded bg-yellow-100 flex items-center justify-center">
        <FileText className="w-6 h-6 text-yellow-600" />
      </div>
    ),
    Eye: () => (
      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-purple-500" />
      </div>
    ),
    Send: () => (
      <div className="w-12 h-12 bg-green-100 flex items-center justify-center rounded">
        <div className="w-6 h-6 bg-green-500" style={{ clipPath: 'polygon(0 50%, 100% 0, 100% 100%)' }} />
      </div>
    ),
    Clock: () => (
      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-orange-300" />
      </div>
    ),
    Timer: () => (
      <div className="w-12 h-12 rounded bg-indigo-100 flex items-center justify-center">
        <div className="w-6 h-6 rounded bg-indigo-500" />
      </div>
    ),
    CheckCircle: () => (
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-gray-500" />
      </div>
    )
  }
  
  const IconComponent = icons[iconName as keyof typeof icons]
  return IconComponent ? IconComponent() : icons.FileText()
}

// Get appropriate message based on column type
const getEmptyMessage = (columnId: string, columnTitle: string) => {
  const messages = {
    'initial-consultation': {
      title: 'No new consultations',
      description: 'New client matters will appear here when they are created.'
    },
    'document-preparation': {
      title: 'No documents in preparation',
      description: 'Matters requiring document preparation will be shown here.'
    },
    'client-review': {
      title: 'No matters awaiting review',
      description: 'Documents ready for client review will appear here.'
    },
    'filed-submitted': {
      title: 'No filed matters',
      description: 'Filed documents and submitted matters will be tracked here.'
    },
    'in-progress': {
      title: 'No active matters',
      description: 'Matters currently in progress will be displayed here.'
    },
    'waiting-response': {
      title: 'No pending responses',
      description: 'Matters awaiting responses will be shown here.'
    },
    'closed': {
      title: 'No closed matters',
      description: 'Completed and settled matters will appear here.'
    }
  }
  
  return messages[columnId as keyof typeof messages] || {
    title: `No matters in ${columnTitle}`,
    description: 'Matters will appear here when they match the column status.'
  }
}

export function KanbanEmptyState({
  column,
  onCreateMatter,
  className,
  ...props
}: KanbanEmptyStateProps & React.HTMLAttributes<HTMLDivElement>) {
  const message = getEmptyMessage(column.id, column.title)
  
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 h-full min-h-[200px]",
        className
      )}
      {...props}
    >
      {/* Column Icon */}
      <div className="mb-4">
        {getColumnIcon(column.id)}
      </div>
      
      {/* Empty State Content */}
      <div className="space-y-2 mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          {message.title}
        </h3>
        <p className="text-xs text-muted-foreground/80 max-w-[200px] leading-relaxed">
          {message.description}
        </p>
      </div>
      
      {/* Action Button - Only show for columns where creating matters makes sense */}
      {onCreateMatter && (column.id === 'initial-consultation' || column.id === 'document-preparation') && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateMatter}
          className="text-xs h-8 gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Matter
        </Button>
      )}
      
      {/* Status indicators for different column types */}
      <div className="mt-4 flex flex-col gap-1">
        {column.status.map((status) => (
          <div
            key={status}
            className="text-xs text-muted-foreground/60 px-2 py-1 bg-muted/20 rounded"
          >
            {status.replace('_', ' ').toLowerCase()}
          </div>
        ))}
      </div>
    </div>
  )
}