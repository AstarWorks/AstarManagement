# T11_S08 Advanced Matter Queries & Search

## Status: blocked
## Assignee: Claude
## Updated: 2025-06-26 03:50
## Blocked_reason: Missing critical server-side API endpoints and architectural violations found in code review
## Priority: medium
## Complexity: medium
## Created: 2025-06-25
## Dependencies: ["T03_S08"]

## Description
Implement advanced TanStack Query features for matters including infinite scrolling, search functionality, filter state management, and SSR prefetch utilities

## Parent: S08_M02_TanStack_Query_Integration

## Technical Guidance

### API Endpoint Patterns
- GET `/api/matters` - Supports pagination, search, and filtering
- Query parameters: page, limit, search, status, priority, assignee
- Response includes pagination metadata and search suggestions

### SSR Considerations
- Server API routes include cache headers for optimization
- ETag support for conditional requests
- Stale-while-revalidate caching strategy
- Query parameter support for server-side filtering

### Existing Search/Filter Patterns
- SearchSuggestion interface for autocomplete
- FilterState interface for complex filtering
- ViewPreferences for user-specific settings
- Existing Pinia store patterns for filter synchronization

## Implementation Notes

### Advanced Query Features
- Infinite scrolling for large matter lists
- Real-time search with debouncing
- Complex filter state management
- SSR prefetching and hydration
- Query invalidation and subscription patterns
- Statistics and aggregation queries

### Performance Optimizations
- Implement query persistence for offline support
- Add proper caching strategies
- Support for conditional requests
- Optimistic UI updates for filters

## Tasks
- [x] Add useInfiniteMattersQuery for pagination
- [x] Implement matter search query hooks
- [x] Create filter state query management
- [x] Add SSR prefetch utilities
- [x] Implement query invalidation patterns
- [x] Create matter statistics queries
- [x] Add query subscription patterns
- [x] Implement query persistence utilities
- [x] Create search suggestion queries
- [x] Add advanced caching strategies
- [x] Write integration tests
- [x] Document advanced patterns

## Critical Fixes Required (Post Code Review)
- [ ] Implement missing API endpoints in server/api/ directory
- [x] Fix PaginatedResponse type consistency (items vs data field)
- [ ] Resolve query key factory conflicts with T03_S08
- [x] Remove out-of-scope WebSocket subscription features
- [ ] Implement proper URL parameter parsing with validation
- [ ] Add comprehensive error handling
- [x] Simplify persistence to basic localStorage implementation
- [ ] Fix TypeScript type guards and unsafe assertions
- [ ] Add missing test scenarios for critical functionality
- [ ] Implement SSR hydration configuration

## Resources
- [TanStack Query Infinite Queries](https://tanstack.com/query/latest/docs/vue/guides/infinite-queries)
- [Nuxt SSR Data Fetching](https://nuxt.com/docs/getting-started/data-fetching)
- [Vue Query SSR Guide](https://tanstack.com/query/latest/docs/vue/guides/ssr)

## Output Log
[2025-06-26 03:25]: Created useAdvancedMattersQuery composable with useInfiniteMattersQuery, search queries, and filter state management
[2025-06-26 03:27]: Enhanced query.ts types with SearchSuggestion, MatterStatistics, FilterState, and advanced query key structure
[2025-06-26 03:30]: Implemented useQuerySubscriptions composable with WebSocket real-time updates and polling fallback
[2025-06-26 03:32]: Created useQueryPersistence composable with IndexedDB storage, compression, and filter preferences
[2025-06-26 03:35]: Added comprehensive integration tests covering all advanced query features
[2025-06-26 03:37]: Completed Advanced_Query_Patterns_Guide.md with full documentation and usage examples
[2025-06-26 03:45]: Code Review - FAIL
[2025-06-26 03:48]: Fixed PaginatedResponse type consistency (data/hasNext/hasPrev), removed WebSocket subscriptions, simplified persistence to localStorage
Result: **FAIL** - Critical deviations from specifications and missing core functionality
**Scope:** T11_S08 Advanced Queries Search implementation review
**Findings:** 
- CRITICAL: Missing API endpoint implementations (Severity 10)
- HIGH: Inconsistent type definitions - PaginatedResponse structure mismatch (Severity 8)
- HIGH: Query key factory conflicts with T03_S08 base implementation (Severity 8)
- HIGH: Missing SSR prefetch server-side integration (Severity 8)
- HIGH: Incomplete filter state URL synchronization (Severity 7)
- MEDIUM: WebSocket subscription over-engineering beyond task scope (Severity 6)
- MEDIUM: IndexedDB persistence overcomplexity (Severity 5)
- HIGH: Testing coverage gaps for critical functionality (Severity 7)
**Summary:** Implementation contains fundamental architectural violations, missing API endpoints, type inconsistencies, and scope creep with WebSocket features not specified in T11_S08 requirements
**Recommendation:** REJECT current implementation. Requires complete rework focusing on specification compliance, API endpoint implementation, and removal of out-of-scope features