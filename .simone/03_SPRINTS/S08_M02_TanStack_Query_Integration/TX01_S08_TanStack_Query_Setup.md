---
task_id: T01_S08
sprint_sequence_id: S08
status: completed
complexity: Medium
last_updated: 2025-06-25 15:30
assignee: Claude
created_date: 2025-06-25
priority: high
dependencies: None
---

# Task: TanStack Query Setup and Configuration

## Description
Install and configure @tanstack/vue-query for Nuxt 3 with proper SSR support, hydration, and TypeScript integration. This foundational task establishes TanStack Query as the primary data fetching and caching solution for the Nuxt.js POC, replacing direct API calls with a more robust query/mutation pattern that supports optimistic updates, background refetching, and intelligent caching.

## Goal / Objectives
- Set up @tanstack/vue-query with full Nuxt 3 SSR compatibility
- Configure proper client-side hydration to avoid hydration mismatches
- Establish TypeScript types and interfaces for query/mutation patterns
- Create a reusable plugin architecture that integrates with existing authentication
- Ensure compatibility with existing Pinia stores and composables

## Acceptance Criteria
- [x] @tanstack/vue-query is installed with correct peer dependencies
- [x] Nuxt plugin is created for VueQuery initialization
- [x] SSR hydration is properly configured without console errors
- [x] TypeScript types are properly configured and auto-imported
- [x] Query client configuration includes appropriate defaults for the legal domain
- [x] Development tools (Vue Query Devtools) are configured for local development
- [x] Basic query and mutation examples are working with the existing API
- [x] Integration points with existing useApi composable are documented

## Subtasks
- [x] Install @tanstack/vue-query and related dependencies via bun
- [x] Create vue-query.client.ts plugin following existing plugin patterns
- [x] Configure QueryClient with SSR-safe defaults
- [x] Set up proper hydration handling in app.vue
- [x] Add VueQuery to nuxt.config.ts optimizeDeps
- [x] Create type definitions for query keys and options
- [x] Set up Vue Query Devtools for development environment
- [x] Test SSR/CSR transitions with sample queries
- [x] Document integration patterns with existing stores

## Technical Guidance

### Nuxt Plugin System Location
The project uses a client-side plugin pattern located at `src/plugins/`. Existing plugins demonstrate:
- TypeScript plugin structure with proper Nuxt typing
- Client-side only execution patterns (`.client.ts` suffix)
- Store initialization and hydration patterns (see pinia.client.ts)
- Error handling integration (see error-handler.ts)

### Package Installation
Dependencies are managed in `frontend-nuxt-poc/package.json` using bun as the package manager. The project already includes:
- Vue 3 and Nuxt 3.17.5
- TypeScript 5 with strict mode enabled
- Pinia for state management
- VeeValidate and Zod for validation

### Nuxt Configuration
The `nuxt.config.ts` shows:
- Vite optimization configuration with explicit dependency inclusion
- Module registration pattern for Nuxt modules
- TypeScript strict mode with type checking enabled
- Source directory set to `src/`

### SSR/Hydration Patterns
The codebase demonstrates SSR patterns in:
- `src/pages/kanban.vue` - Uses `useFetch` with SSR-safe transforms
- Hydration-safe reactive state management
- Progressive enhancement approach for client-only features
- Server-side data fetching with proper error handling

### TypeScript Configuration
Project uses:
- Strict TypeScript configuration in tsconfig.json
- Path aliases for imports (~/ and @/ pointing to src/)
- Proper type definitions for Nuxt auto-imports
- Existing type definitions in src/types/

### Integration Points
- Authentication: `useAuthStore()` provides `getAccessToken()` for API authorization
- API Layer: `useApi()` composable in `src/composables/useApi.ts` handles current API calls
- Error Handling: `useApiErrorHandler()` provides consistent error management
- Existing stores use Pinia with TypeScript interfaces

## Implementation Notes

### Step-by-Step Approach
1. **Dependency Installation**: Add @tanstack/vue-query and @tanstack/vue-query-devtools
2. **Plugin Creation**: Create vue-query.client.ts following the pinia.client.ts pattern
3. **QueryClient Setup**: Configure with legal domain appropriate defaults (longer stale times for case data)
4. **Hydration Bridge**: Implement dehydrate/hydrate pattern for SSR data transfer
5. **Type Safety**: Create query key factories and typed query options
6. **DevTools Integration**: Conditionally load devtools in development
7. **Migration Path**: Document how to convert existing useApi calls to useQuery/useMutation
8. **Testing**: Verify SSR rendering and client hydration work correctly

### Configuration Considerations
- Set appropriate staleTime for legal case data (likely longer than typical apps)
- Configure retry logic suitable for legal operations (fewer retries, explicit errors)
- Set up proper cache invalidation patterns for status changes
- Consider offline support requirements for court visits

### Integration Strategy
- TanStack Query will complement, not replace, Pinia stores
- Pinia remains for UI state and complex client state
- TanStack Query handles server state and caching
- Existing API error handling patterns should be preserved

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Task created
[2025-06-25 15:16]: Added @tanstack/vue-query and @tanstack/vue-query-devtools to package.json dependencies
[2025-06-25 15:19]: Created vue-query.client.ts plugin with SSR support and legal domain-optimized configuration
[2025-06-25 15:23]: Added @tanstack/vue-query to nuxt.config.ts optimizeDeps for better development performance
[2025-06-25 15:24]: Created type definitions in types/query.ts with query key factory and type-safe options
[2025-06-25 15:25]: Set up Vue Query Devtools plugin for development environment debugging
[2025-06-25 15:26]: Created sample composables and test page to verify SSR/CSR transitions
[2025-06-25 15:28]: Documented integration patterns with existing Pinia stores in docs/tanstack-query-integration.md

[2025-06-25 15:29]: Code Review - PASS
Result: **PASS** - All requirements and specifications have been properly implemented.
**Scope:** Task T01_S08 - TanStack Query Setup and Configuration
**Findings:** 
- No issues found
- All acceptance criteria met (Severity: N/A)
- Proper implementation following existing patterns (Severity: N/A)
- Legal domain optimizations correctly applied (Severity: N/A)
**Summary:** The implementation fully complies with all specifications. TanStack Query has been properly installed, configured with SSR support, integrated with TypeScript, and documented comprehensively.
**Recommendation:** Proceed with task completion. Consider the suggested improvement of creating a dedicated useQueryKeys.ts composable for centralized query key management in future tasks.