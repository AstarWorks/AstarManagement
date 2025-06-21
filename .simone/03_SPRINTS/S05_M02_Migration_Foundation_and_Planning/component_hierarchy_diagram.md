# Component Hierarchy Diagram - AsterManagement Frontend

## Application Component Tree

```
App (Root Layout)
├── ErrorBoundary
├── MockServiceWorkerProvider
├── ServiceWorkerProvider  
├── QueryProvider (React Query)
├── ToastProvider
├── ErrorToastProvider
└── OfflineDetector
    │
    ├── HomePage (/)
    │   └── DemoCards
    │       ├── Card (Kanban Demo - Active)
    │       ├── Card (Audit Trail - Coming Soon)
    │       ├── Card (Matter Forms - Coming Soon)
    │       └── Card (Search - Coming Soon)
    │
    ├── KanbanDemoPage (/demo/kanban)
    │   └── KanbanBoardContainer
    │       ├── FilterBar
    │       │   ├── Input (Search)
    │       │   ├── Select (Status Filter)
    │       │   ├── Select (Priority Filter)
    │       │   └── Button (Clear Filters)
    │       │
    │       ├── KanbanBoard
    │       │   ├── KanbanColumn (multiple)
    │       │   │   ├── ColumnHeader
    │       │   │   │   ├── Badge (Count)
    │       │   │   │   └── StatusIcon
    │       │   │   │
    │       │   │   └── MatterCard (multiple)
    │       │   │       ├── Card
    │       │   │       ├── CardContent
    │       │   │       ├── Badge (Priority)
    │       │   │       ├── ClientInfo
    │       │   │       ├── DateInfo
    │       │   │       └── SearchHighlight
    │       │   │
    │       │   └── SyncStatusIndicator
    │       │       ├── StatusIcon
    │       │       └── Tooltip
    │       │
    │       └── KanbanBoardMobile
    │           ├── MobileKanbanTabs
    │           │   └── Tab (per status)
    │           │
    │           └── MobileMatterList
    │               └── MatterCard (mobile variant)
    │
    ├── AuditPage (/audit)
    │   └── AuditTimeline
    │       ├── AuditFilters
    │       │   ├── DateRangePicker
    │       │   ├── Select (Event Type)
    │       │   └── Button (Apply/Clear)
    │       │
    │       └── AuditEventCard (multiple)
    │           ├── Avatar (User)
    │           ├── EventIcon
    │           ├── EventDetails
    │           └── Timestamp
    │
    └── MatterAuditPage (/matters/[id]/audit)
        └── AuditTimeline (filtered by matter)
```

## Component Dependencies & Data Flow

### State Management Integration

```
Zustand Stores
├── kanban-store (re-exports modular stores)
│   ├── kanban-board-store
│   │   └── Used by: KanbanBoard, KanbanColumn
│   │
│   ├── matter-data-store  
│   │   └── Used by: MatterCard, FilterBar, KanbanBoardContainer
│   │
│   ├── search-store
│   │   └── Used by: FilterBar, SearchHighlight
│   │
│   ├── ui-preferences-store
│   │   └── Used by: KanbanBoard, MatterCard
│   │
│   └── real-time-store
│       └── Used by: SyncStatusIndicator, KanbanBoardContainer
│
└── ui-store
    └── Used by: Global UI components
```

### Form Components Hierarchy

```
Form Components
├── CreateMatterForm
│   ├── Form (react-hook-form)
│   ├── FormField (multiple)
│   │   ├── FormLabel
│   │   ├── FormControl
│   │   │   ├── Input
│   │   │   ├── Select
│   │   │   ├── DatePicker
│   │   │   └── Textarea
│   │   └── FormMessage
│   └── Button (Submit)
│
└── EditMatterForm
    └── (Similar structure to CreateMatterForm)
```

### UI Component Library (shadcn/ui)

```
UI Components
├── Primitives
│   ├── Button
│   ├── Input
│   ├── Label
│   └── Textarea
│
├── Layout
│   ├── Card
│   │   ├── CardHeader
│   │   ├── CardContent
│   │   └── CardFooter
│   │
│   └── Sheet
│       ├── SheetTrigger
│       ├── SheetContent
│       └── SheetClose
│
├── Feedback
│   ├── Alert
│   ├── Badge
│   ├── Progress
│   └── Toast
│
├── Overlay
│   ├── Dialog
│   │   ├── DialogTrigger
│   │   ├── DialogContent
│   │   └── DialogClose
│   │
│   ├── Popover
│   └── Tooltip
│
└── Data Display
    ├── Avatar
    ├── Select
    ├── Tabs
    └── Table
```

## Component Communication Patterns

### Props Flow
```
Parent → Child (Direct Props)
- KanbanBoard → KanbanColumn → MatterCard
- FilterBar → Input/Select components
- AuditTimeline → AuditEventCard

Context/Provider Pattern
- QueryProvider → All child components (API state)
- ToastProvider → Toast notifications
- Form → FormField → Form controls

Store Subscriptions (Zustand)
- Components → Store hooks → Selective state
```

### Event Flow
```
Child → Parent (Callbacks)
- MatterCard onClick → KanbanBoard handler
- FilterBar onChange → KanbanBoardContainer update
- FormField onSubmit → Form submission handler

Store Actions (Global State)
- User action → Store action → State update → Re-render
```

## Key Component Relationships

### 1. Drag and Drop System
```
@dnd-kit Integration
├── DndContext (KanbanBoard)
├── SortableContext (KanbanColumn)
└── useSortable (MatterCard)
    ├── Drag handlers
    ├── Transform styles
    └── Drop animations
```

### 2. Form Validation Flow
```
Zod Schema → react-hook-form → FormField → UI Component
    ↓              ↓                ↓           ↓
Validation   Form State      Field State   Display
```

### 3. Real-time Updates
```
real-time-store
├── Polling mechanism
├── Sync queue
└── Network status
    ↓
Components re-render on state change
```

## Component Categories by Complexity

### High Complexity (Need careful migration)
- KanbanBoard (drag & drop orchestration)
- CreateMatterForm/EditMatterForm (complex validation)
- FilterBar (multiple state interactions)
- KanbanBoardContainer (state coordination)

### Medium Complexity
- MatterCard (multiple features, memoization)
- AuditTimeline (data transformation)
- KanbanColumn (sortable context)
- Select components (portal rendering)

### Low Complexity (Easy to migrate)
- Badge, Button, Input (simple props)
- SearchHighlight (pure presentation)
- Avatar, Card (minimal logic)
- Toast notifications (event-driven)

## Migration Priority Order

1. **Phase 1: UI Primitives** (Low complexity)
   - Basic shadcn/ui components
   - No state management needed

2. **Phase 2: Display Components** (Low-Medium)
   - MatterCard (without drag)
   - AuditEventCard
   - SearchHighlight

3. **Phase 3: Form Components** (Medium)
   - Form fields and validation
   - Zod integration

4. **Phase 4: Interactive Features** (High)
   - Drag and drop system
   - Real-time updates
   - Complex state management

5. **Phase 5: Container Components** (High)
   - KanbanBoardContainer
   - Page-level components
   - Provider hierarchy

This hierarchy diagram provides a clear view of component relationships and dependencies, essential for planning the migration strategy from React to Vue.