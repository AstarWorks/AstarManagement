/**
 * Tabs component for mobile navigation
 * 
 * @description Accessible tab component optimized for mobile touch interfaces.
 * Supports horizontal scrolling, keyboard navigation, and smooth transitions.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
  disabled?: boolean
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

// Context for sharing tabs state
const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs')
  }
  return context
}

/**
 * Tabs Root Component
 */
function Tabs({ value, onValueChange, className, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

/**
 * Tabs List - Container for tab triggers
 */
function TabsList({ className, children }: TabsListProps) {
  const listRef = React.useRef<HTMLDivElement>(null)

  return (
    <div
      ref={listRef}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        "overflow-x-auto scrollbar-none",
        "gap-1",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

/**
 * Tabs Trigger - Individual tab button
 */
function TabsTrigger({ 
  value, 
  className, 
  children, 
  disabled = false 
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext()
  const isSelected = value === selectedValue
  
  const handleClick = React.useCallback(() => {
    if (!disabled) {
      onValueChange(value)
    }
  }, [value, onValueChange, disabled])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }, [handleClick])

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      aria-controls={`tabpanel-${value}`}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5",
        "text-sm font-medium ring-offset-background transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "min-w-[44px] min-h-[44px]", // Touch target size
        isSelected 
          ? "bg-background text-foreground shadow-sm" 
          : "hover:bg-muted-foreground/10 hover:text-foreground",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  )
}

/**
 * Tabs Content - Content panel for each tab
 */
function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext()
  const isSelected = value === selectedValue

  if (!isSelected) return null

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      tabIndex={0}
    >
      {children}
    </div>
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
}