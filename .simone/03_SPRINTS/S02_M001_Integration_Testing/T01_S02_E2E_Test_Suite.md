---
task_id: T01_S02
title: E2E Test Suite Implementation
sprint: S02_M001
complexity: Medium
status: planned
created: 2025-01-23
---

## Task Overview

Implement a comprehensive End-to-End (E2E) test suite for the Auth0 authentication flow and JWT validation system. This task focuses on testing the complete integration between frontend and backend, covering critical authentication paths, token handling, and error scenarios.

The test suite will validate the entire authentication workflow from browser interactions through Auth0 to API requests with JWT tokens, ensuring seamless integration across all system components.

## Objectives

- Set up Playwright test framework for browser automation
- Implement critical authentication flow test scenarios
- Test JWT token handling and validation edge cases
- Validate cookie management and session persistence
- Create mock Auth0 responses for deterministic testing
- Establish CI/CD pipeline integration for automated testing

## Acceptance Criteria

- [ ] Playwright framework configured and integrated with existing test setup
- [ ] Complete login flow test (browser → Auth0 → callback → dashboard)
- [ ] API request with valid JWT token test
- [ ] Token expiration and 401 error handling test
- [ ] Logout flow and session cleanup test
- [ ] Token refresh mechanism test
- [ ] Mock Auth0 provider for development environment
- [ ] Tests run in CI/CD pipeline with proper reporting
- [ ] Test coverage reports generated
- [ ] Error scenarios properly tested and documented

## Subtasks

### 1. Setup and Configuration
- [ ] Install and configure Playwright test framework
- [ ] Create playwright.config.ts with proper browser configurations
- [ ] Set up test environment variables and Auth0 mock configuration
- [ ] Configure test data fixtures and utilities
- [ ] Integrate with existing Vitest setup for unified test reporting

### 2. Authentication Flow Tests
- [ ] Complete login flow test
  - Navigate to protected route
  - Redirect to signin page
  - Mock Auth0 authentication
  - Verify callback handling
  - Confirm redirect to original destination
- [ ] Development environment credential login test
- [ ] Authentication state persistence across page reloads

### 3. API Integration Tests  
- [ ] Authenticated API request test
  - Login and obtain JWT token
  - Make API call to `/api/v1/auth/me`
  - Verify token included in request headers
  - Validate response structure and content
- [ ] Protected endpoint access validation
- [ ] JWT token claims extraction test (`/api/v1/auth/claims`)
- [ ] Business context retrieval test (`/api/v1/auth/business-context`)

### 4. Token Management Tests
- [ ] Token expiration handling test
  - Mock expired token scenario
  - Verify 401 response from backend
  - Test automatic redirect to login
- [ ] Token refresh mechanism test
  - Simulate near-expiry token
  - Verify automatic refresh attempt
  - Test fallback to login on refresh failure
- [ ] Cookie handling and secure storage validation

### 5. Error Scenario Tests
- [ ] Invalid credentials handling
- [ ] Network failure during authentication
- [ ] Auth0 service unavailable scenario  
- [ ] Malformed JWT token handling
- [ ] CORS and preflight request validation

### 6. Logout and Cleanup Tests
- [ ] Complete logout flow test
- [ ] Session cleanup verification
- [ ] Token invalidation confirmation
- [ ] Redirect to signin page validation

## Technical Guidance

### Framework Setup
Based on the codebase analysis, the project uses:
- **Testing**: Vitest for unit tests, need to add Playwright for E2E
- **Auth Framework**: `@sidebase/nuxt-auth` with Auth0 provider
- **Test Utilities**: Already configured with MSW for API mocking

### Key Components to Test

#### Frontend Auth Components
```typescript
// Main authentication handler
frontend/server/api/auth/[...].ts

// Authentication middleware (currently mocked in tests)
frontend/app/middleware/rbac.ts

// Development credentials provider
// Production Auth0 provider with audience/scope configuration
```

#### Backend API Endpoints
```kotlin
// Main authentication endpoints
/api/v1/auth/me       // Current user info
/api/v1/auth/claims   // JWT claims
/api/v1/auth/business-context // Business-specific data

// Security configuration
backend/src/main/kotlin/.../SecurityConfig.kt
backend/src/main/kotlin/.../JwtClaimsExtractor.kt
```

#### Test Configuration Files
```typescript
// Existing test setup
frontend/vitest.config.ts
frontend/test/setup.ts - comprehensive mocking setup already in place

// Need to create
playwright.config.ts
tests/e2e/ directory structure
```

### Required Dependencies
Add to `frontend/package.json`:
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "playwright": "^1.40.0"
  },
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### Test Data Configuration
```typescript
// Environment-specific test configuration
const TEST_CONFIG = {
  development: {
    authProvider: 'mock',
    credentials: {
      email: 'dev@example.com',
      password: 'dev-password'
    }
  },
  staging: {
    authProvider: 'auth0',
    mockAuth0Responses: true
  }
}
```

### Mock Integration Points
```typescript
// Key areas requiring mocking
- Auth0 authentication responses
- JWT token generation and validation  
- API endpoint responses
- Cookie/session management
- Browser navigation and redirects
```

## Implementation Notes

### Step-by-Step Implementation Approach

1. **Phase 1: Framework Setup**
   - Install Playwright dependencies
   - Create basic config and first smoke test
   - Verify integration with existing test infrastructure

2. **Phase 2: Authentication Core**
   - Implement login flow test using development credentials
   - Test JWT token acquisition and storage
   - Validate API authentication headers

3. **Phase 3: Integration Validation**
   - Test authenticated API endpoints
   - Verify middleware protection mechanisms
   - Validate business context extraction

4. **Phase 4: Edge Cases**
   - Implement token expiration scenarios
   - Test error handling and recovery
   - Validate logout and cleanup processes

5. **Phase 5: Production Readiness**
   - Add Auth0 mocking for production testing
   - Configure CI/CD integration
   - Generate comprehensive test reports

### Testing Patterns to Follow
```typescript
// Use page object model for reusable authentication flows
class AuthenticationPageObject {
  async loginWithCredentials(email: string, password: string)
  async waitForAuthCompletion()
  async verifyAuthenticatedState()
  async logout()
}

// Utility functions for API testing
async function makeAuthenticatedRequest(page: Page, endpoint: string)
async function verifyJwtTokenPresent(page: Page)
async function simulateTokenExpiration(page: Page)
```

### Key Imports and Modules
```typescript
import { test, expect } from '@playwright/test'
import { setupMockAuth0 } from '../utils/auth-mocks'
import type { AuthSession } from '../types/auth'

// Leverage existing test utilities from vitest setup
import { mockUserProfile } from '../../test/setup'
```

## Dependencies

- **Prerequisite**: Sprint S01 completion (JWT validation backend implementation)
- **Auth0 Configuration**: Test tenant or comprehensive mock setup required
- **Environment Setup**: Test environment configuration with proper secrets management
- **Backend Services**: Local backend running for integration tests
- **Mock Services**: MSW integration for API response mocking

## Testing Approach

### Test Execution Strategy
- **Development**: Use mock credentials provider for fast iteration
- **CI/CD**: Mock Auth0 responses for deterministic test results  
- **Staging**: Optional real Auth0 integration testing
- **Cross-browser**: Chrome (primary), Firefox, Safari testing

### Test Data Management
- Use factory functions for generating consistent test users
- Implement cleanup mechanisms for test data isolation
- Leverage existing MSW setup for API response mocking

### Performance Considerations
- Parallel test execution where possible
- Smart test ordering to minimize setup/teardown
- Page object model for efficient element interactions
- Selective browser launching based on test requirements

## Success Metrics

- **Coverage**: 100% of critical authentication paths tested
- **Reliability**: Tests pass consistently across multiple runs
- **Speed**: Complete E2E suite execution under 5 minutes
- **Integration**: Seamless CI/CD pipeline integration with proper reporting
- **Documentation**: Clear test scenarios and failure troubleshooting guides