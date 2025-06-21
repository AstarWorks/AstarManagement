---
task_id: TX005
status: open
complexity: Medium
last_updated: 2025-06-19T15:03:26Z
---

# Task: Fix React Runtime Errors

## Description
The application is experiencing critical React runtime errors that cause application instability and crashes during user interaction. These are separate from the TypeScript compilation errors tracked in TX004 and represent runtime behavior issues that occur when the application is executing. The errors include infinite re-render loops and improper DOM prop forwarding that prevent normal application functionality.

## Goal / Objectives
Resolve React runtime errors to ensure stable application execution and proper user experience during normal operations.
- Fix "Maximum update depth exceeded" error in KanbanColumn component
- Resolve "React does not recognize currentUser prop on DOM element" in ErrorBoundary/Card components
- Prevent infinite re-render loops caused by circular dependencies in useMemo hooks
- Ensure proper prop filtering for DOM elements in shadcn/ui Card components

## Acceptance Criteria
- [ ] KanbanColumn component renders without "Maximum update depth exceeded" errors
- [ ] Card components properly filter non-DOM props before spreading to div elements
- [ ] Application runs without React runtime warnings or errors in browser console
- [ ] All existing functionality continues to work as expected
- [ ] No performance regressions introduced by fixes
- [ ] Component re-render patterns are optimized for performance

## Subtasks
- [ ] Fix circular dependencies in KanbanColumn.tsx useMemo hooks (lines 63-72)
- [ ] Remove unnecessary dependencies from matterIds and stableMatters useMemo calls
- [ ] Update Card component to filter currentUser prop before spreading to DOM
- [ ] Test KanbanColumn component rendering with various matter arrays
- [ ] Verify ErrorBoundary component no longer forwards React-specific props to DOM
- [ ] Run application in development mode to verify no runtime errors
- [ ] Test drag-and-drop functionality in Kanban board to ensure no regressions
- [ ] Document memoization patterns used for future reference

## Technical Guidance

### Key Files Requiring Attention
1. **KanbanColumn.tsx** (`frontend/src/components/kanban/KanbanColumn.tsx` lines 63-72):
   - Circular dependency in useMemo hooks causing infinite re-renders
   - Unnecessary `matterSignature` and `matterStatusSignature` dependencies
   - Complex memoization pattern needs simplification

2. **Card Components** (`frontend/src/components/ui/card.tsx`):
   - All Card components use `{...props}` spreading to DOM elements
   - Need prop filtering to prevent React-specific props from reaching DOM
   - Follows shadcn/ui pattern requiring careful modification

### React Patterns Used in Codebase
- **Memoization**: `React.useMemo` with dependency arrays for performance optimization
- **Component Composition**: shadcn/ui Card components with spread props pattern
- **Error Boundaries**: Class-based error boundary with fallback UI rendering
- **State Management**: Zustand store integration with React components

### Memoization Best Practices from CLAUDE.md
- Use specific selector hooks to minimize re-renders
- Avoid circular dependencies in useMemo dependency arrays
- Keep memoization focused and atomic for better performance
- Follow React hooks rules for dependencies

### shadcn/ui Integration Patterns
- Card components follow `React.ComponentProps<"div">` pattern
- Props are spread using `{...props}` to underlying div elements
- Need to filter out React-specific props before DOM spreading
- Maintain backwards compatibility with existing usage

### Error Patterns to Fix

**KanbanColumn Maximum Update Depth Pattern**:
```typescript
// PROBLEMATIC: Circular dependency
const matterSignature = React.useMemo(() => matters.map(m => `${m.id}-${m.updatedAt}`).join('|'), [matters])
const matterIds = React.useMemo(() => {
  return matters.map(matter => matter.id)
}, [matters, matterSignature]) // matterSignature dependency is unnecessary and causes circular updates
```

**Card DOM Prop Forwarding Pattern**:
```typescript
// PROBLEMATIC: Forwards all props including React-specific ones
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} /> // currentUser prop gets forwarded to DOM
  )
}
```

### Implementation Approach
1. **KanbanColumn Fixes**: Remove unnecessary dependencies from useMemo calls, simplify memoization logic
2. **Card Component Fixes**: Implement prop filtering using destructuring or filtering utilities
3. **Testing Strategy**: Use React Developer Tools to verify re-render patterns and console warnings

### Related Components and Integration Points
- **MatterCard** component uses Card components that may receive currentUser prop
- **ErrorBoundary** imports and uses Card components with potential prop forwarding issues
- **KanbanBoard** renders KanbanColumn components with matters arrays
- **Zustand stores** provide matter data that triggers re-renders in KanbanColumn

### Performance Considerations
- Memoization fixes should improve performance by reducing unnecessary re-renders
- Prop filtering adds minimal overhead compared to runtime errors
- Test with various matter array sizes to ensure scalability

## Dependencies
- Related to but separate from: [TX004 Fix TypeScript and ESLint Errors](./TX004_Fix_TypeScript_and_ESLint_Errors.md)
- Architecture alignment: [ARCHITECTURE.md](../01_PROJECT_DOCS/ARCHITECTURE.md)
- Frontend patterns: `frontend/CLAUDE.md` memoization and component guidelines
- shadcn/ui documentation: Component prop patterns and best practices

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-19 15:03:26] Task created