# Requirement: R06 - Task Management Table

## Overview
Implement a comprehensive table view for task management that displays the same data as the Kanban board but optimized for lawyers who need to see more information at once. The table view shares state with the Kanban board and provides inline editing capabilities.

## Detailed Requirements

### 1. View Integration

#### 1.1 View Toggle
- Toggle buttons: [Kanban Board] [Table View]
- Seamless switching without data loss
- URL state preservation: `/matters/:id?tab=tasks&view=table`
- View preference saved to user settings

#### 1.2 Shared State Management
- Single Pinia store shared with Kanban board
- Real-time synchronization between views
- Optimistic updates with rollback on error

### 2. Table Configuration

#### 2.1 Column Structure

| Column | Type | Inline Editable | Sortable | Width |
|--------|------|-----------------|----------|--------|
| Task Name | Text | Yes | Yes | Flexible |
| Status | Select | Yes | Yes | 120px |
| Assignees | Multi-select | Yes | Yes | 200px |
| Deadline | Date picker | Yes | Yes | 120px |
| Priority | Select | Yes | Yes | 100px |
| Progress | Slider | Yes | Yes | 100px |
| Related Docs | Link | No | Yes | 80px |
| Comments | Icon+Count | No | Yes | 80px |
| Created | Date | No | Yes | 100px |
| Updated | Relative time | No | Yes | 100px |

#### 2.2 Column Features
- Resizable columns with saved preferences
- Show/hide columns per user preference
- Reorderable columns via drag-and-drop
- Fixed task name column when scrolling horizontally

### 3. Inline Editing

#### 3.1 Edit Triggers
- Single click on editable cells
- Tab key to move between editable cells
- Enter key to confirm edit
- Escape key to cancel edit

#### 3.2 Edit Components

**Status Select**:
```
┌─────────────────┐
│ In Progress ▼   │
├─────────────────┤
│ ○ ToDo         │
│ ● In Progress  │
│ ○ Review       │
│ ○ Done         │
└─────────────────┘
```

**Deadline Picker**:
- Calendar popup on click
- Keyboard date entry support
- Color coding based on urgency

**Assignee Multi-select**:
- Checkbox list of available users
- Search within dropdown
- Show user avatars and roles

**Progress Slider**:
- 0-100% range
- 5% increments
- Keyboard arrow key support
- Visual progress bar

### 4. Filtering and Search

#### 4.1 Quick Filters
- Status filter chips above table
- Assignee filter dropdown
- Date range picker for deadlines
- Priority filter buttons

#### 4.2 Advanced Filtering
- Column-specific filters in header
- Save filter combinations
- Share filter URLs with team

### 5. Sorting

- Multi-column sorting with priority indicators
- Default sort: Deadline (ascending), Priority (descending)
- Sort state preserved in URL
- Clear sort button to reset

### 6. Bulk Operations

#### 6.1 Selection
- Checkbox in first column for selection
- Select all/none in header
- Shift+click for range selection
- Selected count display

#### 6.2 Bulk Actions
- Change status for multiple tasks
- Bulk assign/unassign users
- Set priority for selected tasks
- Delete multiple tasks (with confirmation)

### 7. Export Functionality

#### 7.1 Export Formats
- PDF: Formatted table with logo
- Excel: Full data with formatting
- CSV: Raw data export

#### 7.2 Export Options
- Current view (filtered/sorted)
- All tasks for matter
- Selected tasks only

### 8. Performance Optimization

#### 8.1 Rendering
- Virtual scrolling for 100+ tasks
- Debounced inline editing (300ms)
- Progressive loading of related data
- Cached user/document lists

#### 8.2 Data Management
```typescript
// Optimistic update pattern
async updateTask(taskId: string, updates: Partial<Task>) {
  // 1. Update UI immediately
  const oldTask = this.updateTaskOptimistically(taskId, updates)
  
  try {
    // 2. Send to backend
    const response = await api.updateTask(taskId, updates)
    // 3. Update with server response
    this.confirmTaskUpdate(taskId, response)
  } catch (error) {
    // 4. Rollback on error
    this.rollbackTaskUpdate(taskId, oldTask)
    throw error
  }
}
```

### 9. Display Modes

#### 9.1 Pagination Mode
- 30 items per page default
- Page size options: 30, 50, 100
- Page navigation controls

#### 9.2 Infinite Scroll Mode
- Load more on scroll
- Loading indicator at bottom
- Scroll position preservation

### 10. Keyboard Navigation

- `Tab` / `Shift+Tab`: Navigate cells
- `Enter`: Edit cell / confirm edit
- `Escape`: Cancel edit
- `Space`: Toggle selection
- `Ctrl+A`: Select all
- Arrow keys: Navigate in edit mode

### 11. Mobile Optimization

- Horizontal scroll for full table
- Sticky first column (task name)
- Touch-friendly edit controls
- Swipe actions for common operations

## Implementation Notes

1. Use virtual scrolling library (e.g., @tanstack/vue-virtual)
2. Implement field-level validation with immediate feedback
3. Use Web Workers for export generation
4. Cache dropdown options (users, statuses) 
5. Implement undo/redo for bulk operations
6. Add autosave for inline edits

## Testing Requirements

- Test with 1000+ tasks for performance
- Verify all inline editors work correctly
- Test keyboard navigation flow
- Verify export with large datasets
- Test sort combinations
- Ensure mobile horizontal scroll works
- Test optimistic updates with network delays
- Verify shared state with Kanban board