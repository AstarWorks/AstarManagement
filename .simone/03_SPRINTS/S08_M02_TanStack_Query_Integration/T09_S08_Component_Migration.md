# T09_S08: Component Migration to TanStack Query

## Task Details
- **Task ID**: T09_S08
- **Title**: Component Migration to TanStack Query
- **Description**: Update all Kanban components to use TanStack Query hooks instead of direct Pinia store data fetching
- **Status**: ready
- **Assignee**: unassigned
- **Created_date**: 2025-06-25
- **Priority**: medium
- **Complexity**: medium
- **Dependencies**: ["T03_S08_Core_Queries_Setup", "T04_S08", "T05_S08"]

## Technical Guidance

### Component Hierarchy and Relationships

1. **Main Kanban Board Components**
   - `KanbanBoard.vue` - Primary container component that orchestrates the board
   - `KanbanBoardSSR.vue` - Server-side rendering specific variant
   - `KanbanBoardInteractive.vue` - Interactive features variant

2. **Column Components**
   - `KanbanColumn.vue` - Individual column component with drag-drop functionality
   - Uses draggable for sorting matters within/between columns

3. **Card Components**
   - `MatterCard.vue` - Individual matter card with swipe gestures and mobile optimizations

4. **Filter Components**
   - `FilterBar.vue` - Advanced filtering UI with search, lawyer/priority/status filters
   - `MobileFilterDrawer.vue` - Mobile-specific filter interface

5. **Mobile Components**
   - `MobileKanbanNav.vue` - Mobile navigation for column switching

### Current Pinia Store Integration Points

1. **KanbanBoard.vue**
   - Uses `useKanbanColumns` composable with reactive matters prop
   - Uses `useKanbanRealTime` for real-time updates
   - Uses `useRealTimeStore` for connection status

2. **KanbanColumn.vue**
   - Receives matters as props from parent
   - Uses `useKanbanDragDrop` composable for drag operations
   - Emits events for matter updates

3. **MatterCard.vue**
   - Receives matter data as props
   - No direct store access - purely presentational

4. **FilterBar.vue**
   - Uses `useKanbanStore` for filteredMatters and isLoading
   - Uses composables for search and filter persistence
   - Maintains local filter state synced with store

### Data Flow Patterns

1. **Current Flow**
   ```
   KanbanStore → KanbanBoard → KanbanColumn → MatterCard
                     ↓
                FilterBar → KanbanStore (updates filters)
   ```

2. **Props Drilling**
   - Matters data flows from KanbanBoard down through props
   - ViewPreferences passed through component hierarchy
   - Events bubble up for updates

3. **Store Access Patterns**
   - Direct store access in FilterBar and KanbanBoard
   - Composables abstract some store interactions
   - Real-time store accessed separately

### Testing Considerations

1. **Component Tests**
   - Components use Vitest for unit testing
   - Storybook for visual testing and documentation
   - E2E tests exist for full user flows

2. **Mock Requirements**
   - Need to mock TanStack Query hooks in tests
   - Existing store mocks need adaptation
   - Real-time features need special handling

3. **SSR Considerations**
   - KanbanBoardSSR.vue handles server-side rendering
   - Hydration mismatches need careful handling
   - Query prefetching required for SSR

### Performance Optimization Points

1. **Query Invalidation**
   - Column-specific updates should not refetch all data
   - Optimistic updates for drag-drop operations
   - Selective cache updates for matter changes

2. **Real-time Integration**
   - WebSocket updates should update query cache
   - Polling fallback when WebSocket unavailable
   - Conflict resolution for concurrent updates

3. **Mobile Optimizations**
   - Touch gesture handling needs preservation
   - Swipe actions should work with loading states
   - Reduced data fetching on mobile connections

## Implementation Notes

### Migration Strategy

1. **Phase 1: Read Operations**
   - Replace Pinia getters with useQuery hooks
   - Maintain existing prop interfaces
   - Add query prefetching for SSR

2. **Phase 2: Mutations**
   - Replace store actions with useMutation hooks
   - Implement optimistic updates
   - Add proper error handling and rollback

3. **Phase 3: Real-time**
   - Integrate WebSocket updates with query cache
   - Implement subscription-based cache updates
   - Handle offline/online transitions

4. **Phase 4: Testing & Documentation**
   - Update all component tests
   - Update Storybook stories
   - Document new patterns

### Key Considerations

- Preserve all mobile interactions and gestures
- Maintain SSR compatibility
- Keep existing event-based communication
- Ensure smooth loading/error states
- Preserve drag-drop functionality

## Subtasks

- [ ] Migrate KanbanBoard.vue to use useQuery for matters data
- [ ] Update KanbanColumn.vue to handle loading states from queries
- [ ] Migrate FilterBar.vue to use query-based filtering
- [ ] Update real-time integration to work with query cache
- [ ] Implement optimistic updates for drag-drop operations
- [ ] Add error boundaries and fallback UI
- [ ] Update component tests for TanStack Query
- [ ] Update Storybook stories with MSW handlers
- [ ] Test SSR compatibility with query prefetching
- [ ] Document new data fetching patterns

## Notes
- Components heavily use Vue 3 Composition API
- Mobile-first design with extensive touch optimizations
- Real-time features are critical for user experience
- Existing composables can be adapted rather than replaced
- FilterBar has complex state management that needs careful migration