# Requirement: R02 - Kanban Board UI

## Overview
Implement an interactive Kanban board interface for visualizing and managing matter progress through drag-and-drop functionality, with real-time updates and mobile responsiveness.

## Detailed Requirements

### 1. Board Layout

#### 1.1 Column Structure
Default columns (customizable):
1. **初回相談** (Initial Consultation)
2. **書類作成中** (Document Preparation)
3. **提出済み** (Filed)
4. **進行中** (In Progress)
5. **法廷** (In Court)
6. **和解協議中** (Settlement Discussion)
7. **完了** (Closed) - Grouped status

#### 1.2 Visual Design
```
┌─────────────────────────────────────────────────────────────┐
│ Matter Management Board                    [+ New] [Filter] │
├─────────────────────────────────────────────────────────────┤
│ Initial      │ Document Prep │ Filed       │ In Progress   │
│ Consultation │               │             │               │
├──────────────┼───────────────┼─────────────┼───────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌─────────┐ │ ┌──────────┐ │
│ │2025-CV-01│ │ │2025-CV-03│ │ │2025-CV-05│ │ │2025-CV-07│ │
│ │山田 vs ABC│ │ │鈴木 vs XYZ│ │ │佐藤 vs...│ │ │田中 vs...│ │
│ │[HIGH] 👤 │ │ │[MED] 👤  │ │ │[LOW] 👤 │ │ │[URG] 👤  │ │
│ └──────────┘ │ └──────────┘ │ └─────────┘ │ └──────────┘ │
│              │ ┌──────────┐ │             │               │
│              │ │2025-CV-04│ │             │               │
│              │ │...       │ │             │               │
└──────────────┴───────────────┴─────────────┴───────────────┘
```

### 2. Card Component

#### 2.1 Card Display
Each matter card shows:
- Case number (top, bold)
- Title (truncated to 2 lines)
- Client name
- Priority badge (color-coded)
- Assigned lawyer avatar/initials
- Days in current status (small, bottom)
- Overdue indicator (red border if past deadline)

#### 2.2 Card Colors
- **Border Colors by Priority**:
  - URGENT: Red (#EF4444)
  - HIGH: Orange (#F97316)
  - MEDIUM: Blue (#3B82F6)
  - LOW: Gray (#6B7280)

#### 2.3 Card Hover State
On hover, show:
- Full title (tooltip)
- Quick actions (Edit, View details)
- Last updated timestamp

### 3. Drag and Drop Functionality

#### 3.1 Drag Behavior
- Smooth drag animation
- Ghost card while dragging
- Drop zones highlight on drag start
- Invalid drop zones show red tint
- Cursor changes to grabbing hand

#### 3.2 Drop Rules
- Validate status transitions on drop
- Show confirmation dialog for major transitions
- Automatic timestamp and user recording
- Optimistic UI update with rollback on error

#### 3.3 Touch Support
- Long press to initiate drag on mobile
- Larger drop zones for touch accuracy
- Alternative status update via card menu

### 4. Interactive Features

#### 4.1 Quick Filters
- Search by case number or title
- Filter by assigned lawyer
- Filter by priority
- Filter by date range
- Show/hide closed matters

#### 4.2 Quick Actions
- Click card to view details (modal or side panel)
- Double-click to edit
- Right-click context menu
- Bulk actions with multi-select

#### 4.3 Real-time Updates
- WebSocket connection for live updates
- Show notification when others move cards
- Conflict resolution for simultaneous edits
- Offline queue with sync on reconnect

### 5. Responsive Design

#### 5.1 Desktop (>1024px)
- Show all columns with horizontal scroll if needed
- Minimum column width: 280px
- Maximum 6 columns visible without scroll

#### 5.2 Tablet (768px - 1024px)
- Show 3-4 columns
- Swipe to navigate between columns
- Pinch to zoom out for overview

#### 5.3 Mobile (<768px)
- Single column view with tabs
- Swipe between status columns
- Simplified card layout
- Bottom sheet for quick actions

### 6. Performance Requirements

- Initial load: < 2 seconds for 100 matters
- Drag start: < 50ms response time
- Drop completion: < 200ms including animation
- Search/filter: < 100ms response time
- Smooth 60fps animations

### 7. Accessibility

- Keyboard navigation (Tab, Arrow keys)
- Screen reader announcements for status changes
- High contrast mode support
- Focus indicators for all interactive elements
- ARIA labels for all actions

### 8. Component Structure

```typescript
// Main board component
interface KanbanBoardProps {
  matters: Matter[]
  onStatusChange: (matterId: string, newStatus: MatterStatus) => Promise<void>
  currentUser: User
  filters: FilterOptions
}

// Column component
interface KanbanColumnProps {
  status: MatterStatus
  matters: Matter[]
  onDrop: (matterId: string) => void
  canDrop: boolean
}

// Card component
interface MatterCardProps {
  matter: Matter
  isDragging: boolean
  onEdit: () => void
  onView: () => void
}
```

### 9. State Management

- Use React Context or Zustand for board state
- Optimistic updates with rollback
- Persist view preferences (filters, column order)
- Undo/redo for status changes

### 10. Internationalization

All UI text must support:
- Japanese (default)
- English
- Runtime language switching
- Proper date/time formatting per locale

## Implementation Notes

1. Use @dnd-kit/sortable for drag-and-drop (better than react-beautiful-dnd for our needs)
2. Implement virtual scrolling for columns with many cards
3. Use Tailwind CSS for responsive design
4. Add loading skeletons during data fetch
5. Implement error boundaries for graceful failures
6. Use React.memo for card components to prevent unnecessary re-renders

## Testing Requirements

- Unit tests for all components
- Integration tests for drag-and-drop flows
- Visual regression tests for different screen sizes
- Performance tests with 500+ cards
- Accessibility audit with screen readers
- Cross-browser testing (Chrome, Safari, Firefox, Edge)