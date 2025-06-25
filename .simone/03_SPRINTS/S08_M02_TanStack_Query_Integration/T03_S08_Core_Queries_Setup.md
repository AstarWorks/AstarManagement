# T03_S08 Core Matter Queries Setup

## Status: ready
## Assignee: unassigned
## Priority: high
## Complexity: medium
## Created: 2025-06-25
## Dependencies: ["T01_S08", "T02_S08"]

## Description
Implement core TanStack Query hooks for basic matter CRUD operations including query key factory, list queries, single matter queries, and mutations with proper typing

## Parent: S08_M02_TanStack_Query_Integration

## Technical Guidance

### Matter Type Definitions
- Located in `/frontend-nuxt-poc/src/types/matter.ts`
- Key interfaces: `Matter`, `FilterState`, `ViewPreferences`
- Status and Priority types imported from `types/kanban.ts`
- LawyerInfo interface for assignee data

### API Endpoint Patterns
- GET `/api/matters` - Fetch all matters with query filters
- GET `/api/matters/[id]` - Fetch single matter by ID
- PATCH `/api/matters/[id]` - Update matter by ID
- Query parameters supported: status, priority, limit
- Response includes full matter objects with nested lawyer/clerk data

### Existing Composable Patterns
- `useApi.ts` provides typed API client with interceptors
- Error handling via `useApiErrorHandler`
- Authentication token injection via interceptors
- Paginated response type available

### TypeScript Typing Requirements
- Strict typing for all query hooks
- Generic type parameters for response data
- Type inference from Zod schemas where applicable
- Proper error typing with ApiError interface

## Implementation Notes

### Query Implementation Strategy
- Create modular query hooks following TanStack Query patterns
- Implement query key factories for consistent cache management
- Integrate with existing Pinia stores for state synchronization
- Handle optimistic updates for matter status changes
- Implement proper error boundaries and retry logic

### Core Functionality Focus
- Basic CRUD operations with TanStack Query
- Query key management and caching strategies
- Integration with existing API composables
- Type-safe query and mutation hooks

## Tasks
- [ ] Create query key factory for matters
- [ ] Implement useMattersQuery for list fetching
- [ ] Implement useMatterQuery for single matter
- [ ] Create useMatterMutation for updates
- [ ] Implement optimistic update helpers
- [ ] Add query error handling utilities
- [ ] Integrate with existing Pinia stores
- [ ] Write unit tests for core queries
- [ ] Update documentation for basic usage

## Resources
- [TanStack Query Vue Documentation](https://tanstack.com/query/latest/docs/vue/overview)
- [Vue Query Mutations Guide](https://tanstack.com/query/latest/docs/vue/guides/mutations)
- [Query Key Factories Pattern](https://tkdodo.eu/blog/effective-react-query-keys)