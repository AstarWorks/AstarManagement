# Requirement: R05 - Matter Detail Board

## Overview
Implement a comprehensive matter detail board that serves as the central hub for all information and actions related to a specific legal matter. The board uses a tabbed interface with a collapsible sidebar for quick access to summary information.

## Detailed Requirements

### 1. Layout Structure

#### 1.1 Overall Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [<] Matter List  Matter ID: 2025-001  Civil Litigation     │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────┬─────────────────────────────────────────┤
│ │   Sidebar    │         Tab Navigation                  │
│ │   Summary    ├─────────────────────────────────────────┤
│ │   (Collapsible)│       Main Content Area               │
│ └───────────────┴─────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

#### 1.2 Sidebar Content
Collapsible sidebar displaying:
- **Basic Information**: Matter name, client details, opposing party, assigned lawyers
- **Upcoming Events**: Color-coded deadlines with location/time
- **Financial Summary**: Claim amount, retainer status, expense tracking

### 2. Tab Structure

#### 2.1 Available Tabs
1. **Overview** - Matter details and summary
2. **Tasks** - Task management with Kanban/Table view toggle
3. **Schedule** - Event management with List/Calendar view toggle
4. **Communications** - Communication history
5. **Documents** - Document creation and management
6. **FAX** - Received FAX documents
7. **Billing** - Billing and payment tracking
8. **Notes** - Internal notes and memos

#### 2.2 URL Routing
Each tab must have a unique URL for direct access:
```
/matters/:id?tab=overview
/matters/:id?tab=tasks&view=kanban
/matters/:id?tab=schedule&view=calendar
```

### 3. Tab-Specific Requirements

#### 3.1 Overview Tab
- Editable matter information form
- Rich text editor for case background/summary
- Important notes section
- Quick links to related files
- Key metrics dashboard

#### 3.2 Tasks Tab
**View Toggle**: [Kanban Board] [Table View]

- **Kanban Board**: Visual task management with drag-and-drop
- **Table View**: Detailed task list for lawyers (see R06)
- Shared state between views
- Real-time updates when tasks change

#### 3.3 Schedule Tab
**View Toggle**: [List View] [Calendar View]

**List View Features**:
- Event types: Oral argument, Brief deadlines, Meetings, Other
- Fields: Date/time, location, notes, status
- Status options: Scheduled, Completed, Postponed

**Calendar View Features**:
- Month/Week/Day view options
- Drag-and-drop event rescheduling
- Color coding by event type
- Quick event creation

#### 3.4 Communications Tab
- Integrated display of all communication types
- See R07 for detailed requirements
- Quick filters for communication type

#### 3.5 Documents Tab
- VSCode-style three-panel layout
- See R08 for detailed requirements
- Quick access to templates

#### 3.6 FAX Tab
- List of received FAX documents
- Integration with communication history
- See R09 for detailed requirements

#### 3.7 Billing Tab
- Invoice generation and history
- Payment tracking and confirmation
- Expense summary with charts
- Quick expense entry

#### 3.8 Notes Tab
- Markdown editor with preview
- Tag system for categorization
- Search within notes
- Version history

### 4. Sidebar Features

#### 4.1 Collapse/Expand
- Toggle button to maximize content area
- State persisted in localStorage
- Smooth animation transition

#### 4.2 Summary Information Update
- Real-time updates when data changes
- Visual indicators for urgent items
- Click-to-navigate functionality

### 5. Performance Requirements

- Tab switching: < 100ms
- Initial load with data: < 1 second
- Sidebar toggle: Instant (< 50ms)
- Data updates: < 300ms

### 6. State Management

```typescript
interface MatterDetailState {
  matter: Matter
  activeTab: string
  sidebarCollapsed: boolean
  subTabs: {
    tasks: 'kanban' | 'table'
    schedule: 'list' | 'calendar'
  }
  tabStates: Map<string, any> // Preserve tab-specific states
}
```

### 7. Navigation Features

- Breadcrumb navigation back to matter list
- Previous/Next matter navigation
- Keyboard shortcuts for tab switching (Ctrl+1-9)
- Deep linking support for all tab states

### 8. Data Loading Strategy

- Lazy load tab content on first access
- Use KeepAlive to maintain tab state
- Prefetch adjacent matter data for quick navigation
- Progressive loading for heavy content (documents, FAX)

### 9. Authorization

- Tab visibility based on user role
- Clients see limited tabs (Overview, Documents, Billing)
- Lawyers and clerks see all tabs
- Edit permissions vary by role and tab

### 10. Mobile Responsiveness

- Sidebar hidden by default on mobile
- Tab navigation becomes dropdown on small screens
- Swipe gestures for tab switching
- Optimized layouts for each tab on mobile

## Implementation Notes

1. Use Vue KeepAlive for tab content caching
2. Implement virtual scrolling for long lists
3. Use Web Workers for heavy computations
4. Implement optimistic updates for better UX
5. Add loading skeletons for perceived performance
6. Use IndexedDB for offline draft storage

## Testing Requirements

- Test all tab combinations and states
- Verify deep linking works for all URLs
- Test with large amounts of data per tab
- Verify mobile gestures work correctly
- Test tab switching performance
- Ensure accessibility for keyboard navigation
- Test role-based tab visibility