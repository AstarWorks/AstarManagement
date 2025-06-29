# Kanban Store SSR Migration Guide

## Overview

This guide helps you migrate existing components to use the new SSR-compatible kanban store implementation.

## Quick Migration

### Before (Client-Only)
```typescript
// Direct store usage - NOT SSR safe
import { useKanbanStore } from '@/stores/kanban-store'

function MyComponent() {
  const matters = useKanbanStore((state) => state.matters)
  const isLoading = useKanbanStore((state) => state.isLoading)
  
  return <div>...</div>
}
```

### After (SSR-Safe)
```typescript
// Option 1: Use the SSR wrapper hook
import { useKanbanSSR } from '@/components/kanban/KanbanSSRWrapper'

function MyComponent() {
  const matters = useKanbanSSR((state) => state.matters)
  const isLoading = useKanbanSSR((state) => state.isLoading)
  
  return <div>...</div>
}

// Option 2: Use useSyncExternalStore directly
import { useSyncExternalStore } from 'react'
import { useKanbanStore, getServerSnapshot } from '@/stores/kanban-store'

function MyComponent() {
  const matters = useSyncExternalStore(
    useKanbanStore.subscribe,
    () => useKanbanStore.getState().matters,
    () => getServerSnapshot().matters
  )
  
  return <div>...</div>
}
```

## Migration Steps

### 1. Identify Components That Need Migration

Components that need migration are those that:
- Render on the server (not marked with 'use client')
- Use kanban store data for initial render
- Are part of pages that benefit from SSR

### 2. Update Imports

```typescript
// Add these imports
import { useKanbanSSR } from '@/components/kanban/KanbanSSRWrapper'
// or
import { useSyncExternalStore } from 'react'
import { getServerSnapshot } from '@/stores/kanban-store'
```

### 3. Replace Store Hooks

Replace direct store usage with SSR-safe alternatives:

```typescript
// Before
const matters = useMatters()
const metrics = useBoardMetrics()

// After
const matters = useKanbanSSR((state) => state.matters)
const metrics = useKanbanSSR((state) => state.getBoardMetrics())
```

### 4. Actions Remain Unchanged

Actions can be used directly as they're no-ops on the server:

```typescript
// This is already SSR-safe
const { refreshBoard, addMatter } = useBoardActions()
```

## Common Patterns

### Filtered Data Access
```typescript
// SSR-safe filtered matters
const filteredMatters = useKanbanSSR((state) => state.getFilteredMatters())

// SSR-safe matters by column
const mattersByColumn = useKanbanSSR((state) => state.getMattersByColumn())
```

### Conditional Rendering
```typescript
function KanbanContent() {
  const searchMode = useKanbanSSR((state) => state.searchMode)
  const searchResults = useKanbanSSR((state) => state.searchResults)
  const matters = useKanbanSSR((state) => state.matters)
  
  return searchMode ? (
    <SearchResults results={searchResults} />
  ) : (
    <KanbanBoard matters={matters} />
  )
}
```

### Loading States
```typescript
function LoadingWrapper() {
  const isLoading = useKanbanSSR((state) => state.isLoading)
  const error = useKanbanSSR((state) => state.error)
  
  if (error) return <ErrorDisplay error={error} />
  if (isLoading) return <LoadingSpinner />
  
  return <KanbanContent />
}
```

## Testing SSR Compatibility

### 1. Build and Run Production Mode
```bash
bun build
bun start
```

### 2. Check for Hydration Warnings

Look for console warnings like:
- "Text content did not match"
- "Hydration failed"
- "There was an error while hydrating"

### 3. Verify Server HTML

View page source to ensure data is rendered on the server.

## Performance Considerations

1. **Cache TTL**: The server snapshot is cached for 5 minutes. Adjust `SERVER_SNAPSHOT_TTL` if needed.

2. **Memory Usage**: The cache is automatically cleared on the client after TTL expires.

3. **Bundle Size**: The SSR additions are minimal (~1KB gzipped).

## Rollback Plan

If you encounter issues, you can temporarily disable SSR by:

1. Adding 'use client' to the page/component
2. Using the original hooks (they still work in client components)

## Need Help?

- Check the test file: `kanban-store.ssr.test.ts`
- See examples in: `KanbanSSRWrapper.tsx`
- Review the implementation in: `kanban-store.ts`