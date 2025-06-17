---
task_id: T04_S02
sprint_sequence_id: S02
status: open
complexity: Low
last_updated: 2025-01-17T10:00:00Z
---

# Task: Filters and Search Implementation

## Description
Implement quick filters and search functionality for the Kanban board to help users find and focus on specific matters. This includes search by case number/title, filtering by assigned lawyer, priority filtering, and the ability to show/hide closed matters. The implementation should provide instant feedback and maintain filter state across sessions.

## Goal / Objectives
- Create a search input for case number and title searches
- Implement filter dropdowns for lawyer and priority selection
- Add toggle for showing/hiding closed matters
- Ensure filters work together (AND logic)
- Persist filter preferences in local storage

## Acceptance Criteria
- [ ] Search input filters matters by case number or title (case-insensitive)
- [ ] Search results update instantly as user types (debounced)
- [ ] Lawyer filter shows dropdown with all assigned lawyers
- [ ] Priority filter allows multi-select of priority levels
- [ ] Closed matters toggle hides/shows completed cases
- [ ] Multiple filters work together with AND logic
- [ ] Filter state persists across page refreshes
- [ ] Clear filters button resets all filters
- [ ] Filter badges show active filter count
- [ ] Mobile-responsive filter UI with collapsible panel

## Subtasks
- [ ] Create FilterBar component with search input
- [ ] Implement debounced search handler
- [ ] Create lawyer selection dropdown using existing Select component
- [ ] Add priority multi-select checkboxes
- [ ] Implement closed matters toggle switch
- [ ] Add filter logic to Zustand store
- [ ] Create computed filtered matters selector
- [ ] Add local storage persistence for filters
- [ ] Implement clear filters functionality
- [ ] Add filter count badges
- [ ] Create mobile-responsive layout
- [ ] Write unit tests for filter logic
- [ ] Add Storybook stories for filter states

## Technical Guidance

### Key interfaces and integration points
- Zustand store for filter state management
- Existing Select and Checkbox components
- Local storage for persistence
- Debounce utility for search

### Specific imports and module references
```typescript
// UI Components
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Icons
import { Search, X, Filter } from 'lucide-react'

// Utilities
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/utils'
```

### Existing patterns to follow
- Use existing form components from shadcn/ui
- Follow established responsive patterns
- Integrate with Zustand store patterns
- Use consistent spacing and styling

### Filter state interface
```typescript
interface FilterState {
  searchQuery: string
  selectedLawyers: string[]
  selectedPriorities: MatterPriority[]
  showClosed: boolean
  
  setSearchQuery: (query: string) => void
  setSelectedLawyers: (lawyers: string[]) => void
  setSelectedPriorities: (priorities: MatterPriority[]) => void
  setShowClosed: (show: boolean) => void
  clearFilters: () => void
}
```

### Implementation Notes

**Step-by-step implementation approach:**
1. Create FilterBar component structure
2. Add search input with icon and clear button
3. Implement lawyer dropdown with data from matters
4. Create priority checkboxes group
5. Add closed matters toggle switch
6. Integrate filters with Zustand store
7. Create filtered matters selector
8. Add debouncing to search input
9. Implement local storage persistence
10. Add mobile collapsible behavior

**Search implementation:**
```typescript
const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    setSearchQuery(value)
  },
  300 // 300ms delay
)
```

**Filter logic pattern:**
```typescript
const filteredMatters = matters.filter(matter => {
  // Search filter
  if (searchQuery && !matter.caseNumber.includes(searchQuery) && 
      !matter.title.toLowerCase().includes(searchQuery.toLowerCase())) {
    return false
  }
  
  // Lawyer filter
  if (selectedLawyers.length > 0 && 
      !selectedLawyers.includes(matter.assignedLawyerId)) {
    return false
  }
  
  // Priority filter
  if (selectedPriorities.length > 0 && 
      !selectedPriorities.includes(matter.priority)) {
    return false
  }
  
  // Closed filter
  if (!showClosed && matter.status === 'CLOSED') {
    return false
  }
  
  return true
})
```

**Key architectural decisions:**
- Filters are AND-ed together, not OR-ed
- Search is case-insensitive for better UX
- Filters persist in localStorage
- Mobile UI collapses to save space

**Performance considerations:**
- Debounce search to avoid excessive filtering
- Memoize filtered results
- Use virtualization if matter count is high

**Testing approach:**
- Unit tests for each filter type
- Integration tests for combined filters
- Test persistence across refreshes
- Test mobile responsiveness

## Output Log
*(This section is populated as work progresses on the task)*