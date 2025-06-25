---
task_id: T008
status: open
complexity: High
last_updated: 2025-06-24T08:58:28Z
---

# Task: Nuxt API Integration - Connect Frontend to Spring Boot Backend

## Description
The Nuxt.js POC currently uses mock data from server API routes instead of connecting to the real Spring Boot backend. This task involves replacing all mock API calls with real backend integration, implementing proper authentication flow, and ensuring feature parity with the React/Next.js implementation. The API client infrastructure is already in place but needs to be connected to actual endpoints.

## Goal / Objectives
- Replace mock data in `/src/server/api/` with real backend connections
- Implement JWT authentication flow with token refresh mechanism
- Connect all Pinia stores to real API endpoints
- Ensure SSR compatibility with proper data fetching
- Maintain optimistic update patterns for better UX
- Add comprehensive error handling for all API operations

## Acceptance Criteria
- [ ] All mock API endpoints replaced with real backend calls
- [ ] JWT authentication working with access/refresh tokens
- [ ] Login/logout flow functional with proper redirects
- [ ] All CRUD operations for matters working against backend
- [ ] Optimistic updates with proper rollback on failure
- [ ] Error handling displays user-friendly messages
- [ ] SSR data fetching works without hydration errors
- [ ] API calls work in both online and offline modes
- [ ] All existing tests pass with real API integration

## Subtasks
- [ ] Configure API base URL for different environments (dev/staging/prod)
- [ ] Update `useApi` composable to use real backend URL
- [ ] Implement authentication endpoints (login, logout, refresh)
- [ ] Update auth store to use real authentication API
- [ ] Replace mock matter endpoints with real API calls
- [ ] Implement proper error handling with toast notifications
- [ ] Add request/response interceptors for auth tokens
- [ ] Update matter store to use real CRUD operations
- [ ] Implement file upload for document attachments
- [ ] Add API integration tests
- [ ] Update environment configuration documentation
- [ ] Test SSR data fetching with real backend

## Technical Guidance

### Key Files to Modify
- `/src/composables/useApi.ts` - Update base URL and auth handling
- `/src/stores/auth.ts` - Replace mock auth with real API calls
- `/src/stores/kanban/matters.ts` - Replace TODO comments with API calls
- `/src/server/api/matters*.ts` - Remove or update to proxy real API
- `/src/middleware/auth.ts` - Ensure proper token validation
- `nuxt.config.ts` - Update runtime config for API URLs

### Existing Patterns to Follow
- Optimistic update pattern in `matters.ts` (lines 239-267)
- Error handling in `useErrorHandler.ts` composable
- Offline queue pattern in `useOfflineQueue.ts`
- API configuration in `useApi.ts` with Axios interceptors

### Backend API Contracts
Reference the Spring Boot backend API documentation:
- Authentication: POST `/api/auth/login`, `/api/auth/refresh`
- Matters: GET/POST `/api/matters`, PATCH/DELETE `/api/matters/{id}`
- Use DTOs defined in backend `MatterDto`, `CreateMatterRequest`, etc.

### Testing Approach
- Update existing store tests to use MSW for API mocking
- Add integration tests for auth flow
- Test offline functionality with service worker
- Verify SSR data fetching doesn't leak tokens

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-24 08:58:28] Task created based on Nuxt.js migration gap analysis