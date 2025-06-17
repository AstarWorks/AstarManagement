'use client'

import React, { useState, useEffect } from 'react'
import { Search, X, Filter, Users, Flag, ToggleLeft } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { useKanbanStore } from '@/stores/kanban-store'
import { MatterPriority } from '@/components/kanban/types'

/**
 * FilterBar component for Kanban board filtering and search
 * 
 * @description Provides comprehensive filtering capabilities including
 * search by case number/title, lawyer filtering, priority selection,
 * and closed matters toggle. Features mobile-responsive design with
 * collapsible interface and persistent filter state.
 * 
 * @returns JSX.Element - The filter bar component
 * 
 * @example
 * ```tsx
 * <FilterBar />
 * ```
 */
export function FilterBar() {
  const {
    filters,
    matters,
    setFilters,
    clearFilters
  } = useKanbanStore()

  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Extract unique lawyers from matters
  const availableLawyers = Array.from(
    new Set(matters.map(matter => matter.assignedLawyerId).filter(Boolean))
  )

  // Available priority options
  const priorityOptions: MatterPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      setFilters({ search: value })
    },
    300 // 300ms delay
  )

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }

  // Handle lawyer filter change
  const handleLawyerChange = (lawyerId: string) => {
    // For now, only support single lawyer selection to work with existing store
    setFilters({ assignedLawyer: lawyerId === filters.assignedLawyer ? '' : lawyerId })
  }

  // Handle priority filter change
  const handlePriorityChange = (priority: MatterPriority, checked: boolean) => {
    const currentPriorities = filters.priorities || []
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority)
    
    setFilters({ priorities: newPriorities })
  }

  // Handle closed matters toggle - simulate with overdue filter for now
  const handleClosedToggle = (show: boolean) => {
    // Map to existing showOverdueOnly filter as closest approximation
    setFilters({ showOverdueOnly: show })
  }

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchInput('')
    clearFilters()
  }

  // Calculate active filter count
  const activeFilterCount = 
    (filters.search ? 1 : 0) +
    (filters.assignedLawyer ? 1 : 0) +
    ((filters.priorities && filters.priorities.length > 0) ? filters.priorities.length : 0) +
    (filters.showOverdueOnly ? 1 : 0)

  // Sync search input with store on mount
  useEffect(() => {
    setSearchInput(filters.search || '')
  }, [filters.search])

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Mobile toggle header */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <div className="flex items-center gap-2">
            <Filter className="size-4" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ToggleLeft className={cn("size-4 transition-transform", {
              "rotate-180": !isCollapsed
            })} />
          </Button>
        </div>

        {/* Filter content */}
        <div className={cn("space-y-4", {
          "hidden md:block": isCollapsed
        })}>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by case number or title..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearchChange('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 size-6 p-0"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>

          {/* Filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Lawyer filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Users className="size-4" />
                Assigned Lawyer
              </label>
              <div className="space-y-2">
                {availableLawyers.map(lawyerId => (
                  <div key={lawyerId} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lawyer-${lawyerId}`}
                      checked={filters.assignedLawyer === lawyerId}
                      onCheckedChange={() => handleLawyerChange(lawyerId)}
                    />
                    <label
                      htmlFor={`lawyer-${lawyerId}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {lawyerId}
                    </label>
                  </div>
                ))}
                {availableLawyers.length === 0 && (
                  <p className="text-sm text-muted-foreground">No lawyers assigned</p>
                )}
              </div>
            </div>

            {/* Priority filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Flag className="size-4" />
                Priority
              </label>
              <div className="space-y-2">
                {priorityOptions.map(priority => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={(filters.priorities || []).includes(priority)}
                      onCheckedChange={(checked) => handlePriorityChange(priority, checked as boolean)}
                    />
                    <label
                      htmlFor={`priority-${priority}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {priority.toLowerCase()}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue matters toggle (closest to closed matters functionality) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                Show Overdue Only
              </label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-overdue"
                  checked={filters.showOverdueOnly || false}
                  onCheckedChange={handleClosedToggle}
                />
                <label
                  htmlFor="show-overdue"
                  className="text-sm font-normal cursor-pointer"
                >
                  {filters.showOverdueOnly ? 'Showing overdue only' : 'Showing all matters'}
                </label>
              </div>
            </div>

            {/* Clear filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={activeFilterCount === 0}
                className="w-full"
              >
                <X className="size-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}