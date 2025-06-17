/**
 * FilterBar component for T04_S02 Filters and Search Implementation
 * 
 * Implements comprehensive filtering for the Kanban board including:
 * - Debounced search by case number and title
 * - Multi-lawyer selection dropdown
 * - Priority multi-select checkboxes  
 * - Closed matters toggle switch
 * - Mobile-responsive collapsible layout
 * - Filter count badges and clear functionality
 * 
 * Uses exact FilterState interface as specified in T04_S02 requirements.
 */

'use client'

import React, { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react'

// UI Components
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Types and utilities
import { MatterPriority } from '@/components/kanban/types'
import { cn } from '@/lib/utils'
import { useKanbanStore, useFilters, useBoardActions, useMatters } from '@/stores/kanban-store'

// FilterState interface implementation for T04_S02
interface FilterBarProps {
  className?: string
}

export function FilterBar({ className }: FilterBarProps) {
  const filters = useFilters()
  const { setFilters, clearFilters } = useBoardActions()
  const matters = useMatters()
  
  // Local state for UI
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchValue, setSearchValue] = useState(filters.searchQuery || '')

  // Debounced search handler - 300ms delay as specified
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      setFilters({ searchQuery: value })
    },
    300
  )

  // Search input change handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  // Clear search
  const clearSearch = () => {
    setSearchValue('')
    setFilters({ searchQuery: '' })
  }

  // Multi-lawyer selection handler
  const handleLawyerSelection = (lawyerId: string) => {
    const currentLawyers = filters.selectedLawyers || []
    const newLawyers = currentLawyers.includes(lawyerId)
      ? currentLawyers.filter(id => id !== lawyerId)
      : [...currentLawyers, lawyerId]
    
    setFilters({ selectedLawyers: newLawyers })
  }

  // Priority multi-select handler
  const handlePriorityToggle = (priority: MatterPriority) => {
    const currentPriorities = filters.selectedPriorities || []
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority]
    
    setFilters({ selectedPriorities: newPriorities })
  }

  // Closed matters toggle handler
  const handleClosedToggle = (checked: boolean) => {
    setFilters({ showClosed: checked })
  }

  // Get unique lawyers from matters for dropdown
  const uniqueLawyers = React.useMemo(() => {
    const lawyerMap = new Map()
    matters.forEach(matter => {
      if (matter.assignedLawyer) {
        lawyerMap.set(matter.assignedLawyer.id, matter.assignedLawyer)
      }
    })
    return Array.from(lawyerMap.values())
  }, [matters])

  // Calculate active filter count
  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.searchQuery) count++
    if (filters.selectedLawyers && filters.selectedLawyers.length > 0) count++
    if (filters.selectedPriorities && filters.selectedPriorities.length > 0) count++
    if (!filters.showClosed) count++
    return count
  }, [filters])

  // Priority options
  const priorityOptions: MatterPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

  return (
    <div className={cn('bg-white border-b border-gray-200', className)}>
      <div className="px-4 py-3">
        {/* Header with filter toggle for mobile */}
        <div className="flex items-center justify-between mb-3 lg:hidden">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1"
          >
            {isCollapsed ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </Button>
        </div>

        {/* Filter content */}
        <div className={cn(
          'space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4',
          isCollapsed && 'hidden lg:flex'
        )}>
          {/* Search input */}
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search by case number or title..."
              value={searchValue}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          {/* Lawyer selection dropdown */}
          <div className="lg:w-48">
            <label className="block text-xs font-medium text-gray-700 mb-1 lg:hidden">
              Assigned Lawyers
            </label>
            <div className="space-y-2">
              {uniqueLawyers.map(lawyer => (
                <label
                  key={lawyer.id}
                  className="flex items-center space-x-2 text-sm"
                >
                  <Checkbox
                    checked={filters.selectedLawyers?.includes(lawyer.id) || false}
                    onCheckedChange={() => handleLawyerSelection(lawyer.id)}
                  />
                  <span className="text-gray-700">{lawyer.name}</span>
                </label>
              ))}
              {uniqueLawyers.length === 0 && (
                <div className="text-xs text-gray-500 italic">
                  No lawyers assigned to matters
                </div>
              )}
            </div>
          </div>

          {/* Priority multi-select */}
          <div className="lg:w-48">
            <label className="block text-xs font-medium text-gray-700 mb-1 lg:hidden">
              Priority Levels
            </label>
            <div className="space-y-2">
              {priorityOptions.map(priority => (
                <label
                  key={priority}
                  className="flex items-center space-x-2 text-sm"
                >
                  <Checkbox
                    checked={filters.selectedPriorities?.includes(priority) || false}
                    onCheckedChange={() => handlePriorityToggle(priority)}
                  />
                  <span className="text-gray-700">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Closed matters toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={filters.showClosed !== false}
              onCheckedChange={handleClosedToggle}
            />
            <label className="text-sm text-gray-700">
              Show closed matters
            </label>
          </div>

          {/* Clear filters and filter count */}
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <>
                <Badge variant="outline" className="text-xs">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-8"
                >
                  Clear all
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}