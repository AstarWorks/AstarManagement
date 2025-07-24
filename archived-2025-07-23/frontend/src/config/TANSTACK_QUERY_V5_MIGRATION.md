# TanStack Query v5 Migration Guide

## Overview

This document outlines the changes made to `config/tanstack-query.ts` to fix TypeScript errors related to TanStack Query v5 API changes.

## Key Changes

### 1. Removed Deprecated Properties

TanStack Query v5 removed the `onError` and `onSuccess` callbacks from `QueryCache` and `MutationCache` configurations. 

**Before (v4):**
```typescript
queryCache: {
  onError: (error, query) => {
    // Global error handling
  },
  onSuccess: (data, query) => {
    // Global success handling
  }
},
mutationCache: {
  onError: (error, variables, context, mutation) => {
    // Global mutation error handling
  },
  onSuccess: (data, variables, context, mutation) => {
    // Global mutation success handling
  }
}
```

**After (v5):**
```typescript
// QueryCache and MutationCache no longer support onError/onSuccess
// Use individual query/mutation options or custom hooks instead
```

### 2. Error Handling Helpers

Since global error handlers are no longer supported in cache configuration, we've added helper functions that can be used in individual queries and mutations:

```typescript
// Use in your query options
const { data } = useQuery({
  queryKey: ['matters'],
  queryFn: fetchMatters,
  // Use the helper for consistent error handling
  meta: {
    onError: (error) => handleQueryError(error, { queryKey: ['matters'] }),
    onSuccess: (data) => handleQuerySuccess(data, { queryKey: ['matters'] })
  }
})

// Use in your mutation options
const mutation = useMutation({
  mutationFn: updateMatter,
  onError: (error, variables, context) => handleMutationError(error, variables, context),
  onSuccess: (data, variables) => handleMutationSuccess(data, variables)
})
```

### 3. Type Safety Improvements

- Added explicit return type for `getNetworkMode()` to ensure type safety
- Used `as const` for literal types to prevent TypeScript errors
- Fixed module imports to use relative paths for better compatibility

### 4. Environment Detection

Changed from `import.meta.dev` to `process.env.NODE_ENV` for better compatibility with the current TypeScript configuration:

```typescript
// Before
if (import.meta.dev) { ... }

// After
if (process.env.NODE_ENV !== 'production') { ... }
```

## Migration Checklist

When updating your code to use this configuration:

1. ✅ Remove any direct usage of `queryCache.onError` or `mutationCache.onError`
2. ✅ Use the provided helper functions (`handleQueryError`, `handleMutationError`, etc.) in your queries/mutations
3. ✅ Update any custom query client configurations to match v5 API
4. ✅ Test error handling behavior in your components

## Best Practices

1. **Error Handling**: Implement error handling at the component level using the `onError` option in `useQuery` and `useMutation`
2. **Success Notifications**: Show success messages in mutation `onSuccess` callbacks
3. **Global Error Boundaries**: Use Vue error boundaries for catching unhandled errors
4. **Type Safety**: Leverage TypeScript for query keys and response types

## Example Usage

```typescript
// In your composable
import { handleQueryError, handleQuerySuccess } from '~/config/tanstack-query'

export function useMattersQuery() {
  return useQuery({
    queryKey: queryKeys.matters.all,
    queryFn: fetchMatters,
    // Component-level error handling
    onError: (error) => {
      handleQueryError(error, { queryKey: queryKeys.matters.all })
      // Additional component-specific handling
    },
    onSuccess: (data) => {
      handleQuerySuccess(data, { queryKey: queryKeys.matters.all })
    }
  })
}
```

## References

- [TanStack Query v5 Migration Guide](https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5)
- [TanStack Query Error Handling](https://tanstack.com/query/latest/docs/react/guides/errors)