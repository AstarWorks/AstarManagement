---
task_id: T03_S02
sprint_sequence_id: S02
status: open
complexity: Medium
last_updated: 2025-01-17T10:00:00Z
---

# Task: Drag and Drop Implementation

## Description
Implement drag-and-drop functionality for the Kanban board using @dnd-kit/sortable. This task focuses on enabling smooth, performant drag operations between columns with proper visual feedback, touch support, and status transition validation. The implementation must maintain 60fps performance and provide an excellent user experience across all devices.

## Goal / Objectives
- Integrate @dnd-kit/sortable for drag-and-drop operations
- Implement smooth animations and visual feedback during drag
- Add touch gesture support for mobile devices
- Validate status transitions based on business rules
- Ensure accessibility with keyboard navigation

## Acceptance Criteria
- [ ] Cards can be dragged smoothly between columns at 60fps
- [ ] Drag start response time is under 50ms
- [ ] Drop completion happens within 200ms
- [ ] Ghost card appears while dragging with opacity effect
- [ ] Drop zones highlight when dragging over valid columns
- [ ] Invalid drop zones show red tint or disabled state
- [ ] Touch gestures work on mobile (long press to drag)
- [ ] Keyboard navigation allows moving cards between columns
- [ ] Status transition validation prevents invalid moves
- [ ] Confirmation dialog appears for major status changes
- [ ] Optimistic updates with rollback on API failure

## Subtasks
- [ ] Install and configure @dnd-kit/sortable package
- [ ] Create DragOverlay component for ghost card rendering
- [ ] Implement useSortable hook in MatterCard component
- [ ] Add DndContext provider to KanbanBoard
- [ ] Create drag event handlers (onDragStart, onDragEnd, onDragOver)
- [ ] Implement visual feedback for active drag state
- [ ] Add drop zone highlighting logic
- [ ] Implement status transition validation rules
- [ ] Add touch support with long-press detection
- [ ] Create keyboard navigation handlers
- [ ] Add confirmation dialog for major transitions
- [ ] Implement optimistic updates with error rollback
- [ ] Performance optimize with React.memo and callbacks
- [ ] Write tests for drag operations and validation

## Technical Guidance

### Key interfaces and integration points
- @dnd-kit/sortable for drag mechanics
- Zustand store for state updates
- Status transition rules from backend
- Existing Dialog component for confirmations
- Animation utilities from Tailwind

### Specific imports and module references
```typescript
// DnD Kit imports
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Store
import { useKanbanStore } from '@/stores/kanban-store'

// Types
import type { MatterStatus } from '@/types/matter'
```

### Existing patterns to follow
- Use existing animation patterns from UI components
- Follow established error handling patterns
- Integrate with existing Dialog component
- Use Tailwind transitions for smooth animations

### Status validation integration
```typescript
// Valid status transitions (from backend)
const validTransitions: Record<MatterStatus, MatterStatus[]> = {
  INITIAL_CONSULTATION: ['DOCUMENT_PREPARATION', 'CLOSED_WITHDRAWN'],
  DOCUMENT_PREPARATION: ['FILED', 'ON_HOLD', 'CLOSED_WITHDRAWN'],
  FILED: ['IN_PROGRESS', 'WAITING_COURT_DATE', 'CLOSED_WITHDRAWN'],
  // ... etc
}
```

### Implementation Notes

**Step-by-step implementation approach:**
1. Install @dnd-kit packages and dependencies
2. Wrap KanbanBoard with DndContext provider
3. Configure sensors for pointer, touch, and keyboard
4. Implement useSortable in MatterCard
5. Create DragOverlay for ghost card
6. Add drag event handlers with validation
7. Implement visual feedback states
8. Add touch sensor with long-press
9. Configure keyboard navigation
10. Add confirmation dialogs
11. Implement optimistic updates

**Performance optimization strategies:**
- Use CSS transforms instead of layout changes
- Implement will-change CSS property during drag
- Debounce drag over events
- Use React.memo for static components
- Batch state updates in drag end handler

**Touch gesture configuration:**
```typescript
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: {
    delay: 250, // Long press delay
    tolerance: 5, // Movement tolerance
  },
})
```

**Key architectural decisions:**
- Separate drag logic from visual components
- Use Zustand for optimistic state updates
- Validate transitions on both client and server
- Progressive enhancement (works without JS)

**Testing approach:**
- Unit tests for validation logic
- Integration tests for drag operations
- E2E tests for full user flows
- Performance tests for 60fps target
- Accessibility tests for keyboard nav

## Output Log
*(This section is populated as work progresses on the task)*