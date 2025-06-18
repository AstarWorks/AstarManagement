---
task_id: T01_S03
sprint_sequence_id: S03
status: open
complexity: Medium
last_updated: 2025-01-18T10:00:00Z
---

# Task: Frontend-Backend API Integration

## Description
Connect React frontend components to Spring Boot REST APIs with proper authentication, error handling, and state management integration. This task establishes the critical connection between the completed backend infrastructure (S01) and frontend components (S02), enabling real functionality.

## Goal / Objectives
- Create a robust API client service with JWT authentication handling
- Implement automatic token refresh mechanism
- Connect Zustand store actions to real backend endpoints
- Handle all HTTP error scenarios gracefully
- Establish request/response interceptors for cross-cutting concerns

## Acceptance Criteria
- [ ] All CRUD operations (Create, Read, Update, Delete) work with real backend
- [ ] JWT token refresh happens automatically before expiration
- [ ] All error types (400, 401, 403, 404, 409, 500) show appropriate user messages
- [ ] Loading states display during all API calls
- [ ] Audit events are properly tracked for all user actions
- [ ] API responses match TypeScript interfaces exactly
- [ ] Request correlation IDs are implemented for debugging

## Subtasks
- [ ] Create base API client service with Axios configuration
- [ ] Implement JWT token management (storage, refresh, headers)
- [ ] Create typed API endpoint functions matching backend controllers
- [ ] Update Zustand store to use real API instead of mocks
- [ ] Implement comprehensive error handling with user notifications
- [ ] Add request/response interceptors for auth and logging
- [ ] Create unit tests for API client functionality
- [ ] Test all error scenarios with backend integration

## Technical Guidance

### Key Interfaces and Integration Points
- **Frontend Store**: `/frontend/src/stores/kanban-store.ts` - Contains mock API calls to replace
- **Backend Controllers**: `/backend/src/main/kotlin/com/astermanagement/api/controller/MatterController.kt`
- **Auth Endpoints**: `/backend/src/main/kotlin/com/astermanagement/api/controller/AuthController.kt`
- **DTO Models**: `/backend/src/main/kotlin/com/astermanagement/api/dto/` - Match these exactly in TypeScript

### Specific Imports and Module References
```typescript
// API client location
/frontend/src/lib/api/client.ts

// Types to match backend DTOs
/frontend/src/types/api/matter.ts
/frontend/src/types/api/auth.ts
/frontend/src/types/api/error.ts

// Zustand store integration
/frontend/src/stores/kanban-store.ts
```

### Existing Patterns to Follow
- Use `/v1/{resource}` URL pattern (NOT `/api/v1/`)
- Implement RFC 7807 Problem+JSON error format
- Store tokens securely (httpOnly cookies preferred)
- Use Bearer token in Authorization header
- Maintain optimistic updates with rollback on failure

### Error Handling Approach
```typescript
// Error response interface (RFC 7807)
interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

## Implementation Notes

### Step-by-Step Implementation Approach
1. Start with auth endpoints (login, refresh, logout)
2. Test token storage and automatic refresh
3. Implement matter CRUD endpoints one by one
4. Add error handling for each endpoint
5. Connect to Zustand store actions
6. Add loading states and optimistic updates
7. Implement audit tracking on all actions
8. Test with various user roles (Lawyer, Clerk, Client)

### Key Architectural Decisions to Respect
- Maintain agent-native architecture (CLI/API parity)
- Respect Discord-style RBAC permissions
- Support both Japanese and English error messages
- Keep API client stateless for better testing

### Testing Approach
- Unit test API client methods with mocked responses
- Integration test with real backend using test data
- Test error scenarios with network simulation
- Verify audit events are properly recorded
- Test token refresh during long sessions

### Performance Considerations
- Implement request deduplication
- Add caching for GET requests where appropriate
- Use compression for large responses
- Monitor API response times against SLOs

## Output Log
*(This section is populated as work progresses on the task)*