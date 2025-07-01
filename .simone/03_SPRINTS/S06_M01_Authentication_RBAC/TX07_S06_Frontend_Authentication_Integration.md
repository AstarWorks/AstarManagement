---
task_id: T07_S06
sprint_sequence_id: S06
status: completed
complexity: Medium
priority: High
estimated_hours: 21
actual_hours: 19
dependencies: [T02_S06, T03_S06, T05_S06, T06_S06]
started: 2025-07-01 03:05
completed: 2025-07-01 06:30
last_updated: 2025-07-01T06:30:00Z
code_review_score: 9.2/10
code_review_status: approved
---

# T07_S06 - Frontend Authentication Integration

## Task Overview
- **ID**: T07_S06
- **Sprint**: S06_M01_Authentication_RBAC
- **Priority**: P1 (Critical Path) 
- **Complexity**: Medium
- **Estimated Effort**: 3-4 days

## Task Description
Integrate the authentication system with the Nuxt.js frontend using Pinia store for state management. This task involves creating a comprehensive authentication store, implementing JWT token interceptors for API requests, adding route guards via Nuxt middleware, and building the necessary UI components for login and authentication flows.

## Goals
1. **Create Authentication Store**: Implement a Pinia store to manage authentication state
2. **Implement Token Interceptors**: Add Axios interceptors for automatic JWT token handling
3. **Add Route Guards**: Protect routes using Nuxt middleware based on authentication status
4. **Build Auth UI Components**: Create login form, 2FA input, and auth-related UI elements
5. **Secure Token Storage**: Implement secure token storage using httpOnly cookies

## Dependencies
- T04_S06: JWT Token Implementation (Backend)
- T05_S06: Session Management with Redis
- T06_S06: RBAC Implementation

## Acceptance Criteria
1. **Authentication Store**
   - [ ] Pinia store manages user authentication state
   - [ ] Store includes user profile, roles, and permissions
   - [ ] Actions for login, logout, and token refresh
   - [ ] Persisted state for remember me functionality
   - [ ] TypeScript interfaces for all auth-related types

2. **Token Management**
   - [ ] Axios interceptors automatically attach JWT to requests
   - [ ] Response interceptor handles 401 errors and token refresh
   - [ ] Tokens stored securely in httpOnly cookies
   - [ ] Refresh token logic implemented with retry mechanism
   - [ ] Token expiration handling with proactive refresh

3. **Route Protection**
   - [ ] Nuxt middleware checks authentication on protected routes
   - [ ] Redirect to login for unauthenticated access
   - [ ] Role-based route protection implemented
   - [ ] Remember original URL for post-login redirect
   - [ ] Handle public vs private route configurations

4. **UI Components**
   - [ ] Login form with email/password validation
   - [ ] 2FA input component with OTP verification
   - [ ] Password reset flow components
   - [ ] User profile dropdown with logout
   - [ ] Loading states for authentication operations

5. **Security Requirements**
   - [ ] No sensitive data in localStorage
   - [ ] CSRF protection implemented
   - [ ] Secure password input handling
   - [ ] Rate limiting awareness in UI
   - [ ] Clear error messages without security leaks

## Subtasks
1. **Create Authentication Pinia Store** (4h)
   - Define store structure and TypeScript interfaces
   - Implement login, logout, and refresh actions
   - Add getters for auth status and user permissions
   - Configure store persistence for remember me
   - Handle loading and error states

2. **Implement Axios Interceptors** (3h)
   - Create request interceptor for JWT attachment
   - Implement response interceptor for 401 handling
   - Add token refresh logic with queue management
   - Configure base URL and timeout settings
   - Handle network errors gracefully

3. **Build Nuxt Middleware** (3h)
   - Create auth.ts middleware for route protection
   - Implement role-based middleware (lawyer, clerk, client)
   - Add guest middleware for public routes
   - Configure middleware in nuxt.config.ts
   - Handle SSR considerations

4. **Develop Authentication UI Components** (6h)
   - LoginForm.vue with Zod validation
   - TwoFactorAuth.vue for OTP input
   - PasswordReset.vue with email verification
   - UserMenu.vue with profile dropdown
   - AuthLayout.vue for authentication pages

5. **Configure Secure Token Storage** (2h)
   - Implement httpOnly cookie handling
   - Add CSRF token management
   - Configure cookie settings (secure, sameSite)
   - Handle token rotation on refresh
   - Implement logout across all tabs

6. **Integration Testing** (3h)
   - Test complete authentication flow
   - Verify token refresh mechanism
   - Test route protection scenarios
   - Validate error handling
   - Performance testing with multiple requests

## Technical Guidance

### Key Interfaces
```typescript
// stores/auth.ts
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  permissions: string[]
}

interface User {
  id: string
  email: string
  name: string
  role: 'lawyer' | 'clerk' | 'client'
  twoFactorEnabled: boolean
}

// composables/useAuth.ts
interface UseAuthReturn {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  verify2FA: (code: string) => Promise<void>
  hasPermission: (permission: string) => boolean
}
```

### Integration Points
- **Auth Store**: `/frontend/src/stores/auth.ts`
- **Middleware**: `/frontend/src/middleware/auth.ts`, `/frontend/src/middleware/role.ts`
- **Composables**: `/frontend/src/composables/useAuth.ts`
- **API Client**: `/frontend/src/utils/api.ts`
- **Components**: `/frontend/src/components/auth/`

### Existing Patterns
- **Store Pattern**: Follow structure from `stores/matter.ts`
- **Composable Pattern**: Use similar structure to `composables/useCase.ts`
- **Form Validation**: Apply Zod patterns from existing forms
- **Component Structure**: Follow shadcn-vue component patterns

### Token Storage Strategy
- **Access Token**: httpOnly cookie with 15-minute expiry
- **Refresh Token**: httpOnly cookie with 7-day expiry
- **CSRF Token**: Meta tag and header validation
- **Remember Me**: Extended refresh token expiry (30 days)

### Error Handling
- **401 Unauthorized**: Trigger token refresh or redirect to login
- **403 Forbidden**: Show permission denied page
- **Network Errors**: Display offline indicator
- **Validation Errors**: Field-level error messages
- **Rate Limiting**: Show countdown timer

## Implementation Notes

### Pinia Store Structure
```typescript
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Getters
  const permissions = computed(() => 
    user.value?.role ? getRolePermissions(user.value.role) : []
  )
  
  const hasPermission = (permission: string) => 
    permissions.value.includes(permission)
  
  // Actions
  const login = async (credentials: LoginCredentials) => {
    // Implementation with error handling
  }
  
  const refreshToken = async () => {
    // Silent refresh implementation
  }
  
  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    permissions,
    hasPermission,
    login,
    logout,
    refreshToken
  }
})
```

### Axios Interceptor Configuration
```typescript
// Request interceptor
api.interceptors.request.use(
  (config) => {
    // CSRF token attachment
    const csrfToken = useCookie('csrf-token')
    if (csrfToken.value) {
      config.headers['X-CSRF-Token'] = csrfToken.value
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor with retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Queue requests and attempt refresh
    }
    return Promise.reject(error)
  }
)
```

### Nuxt Middleware Pattern
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated.value && to.meta.requiresAuth !== false) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
```

### Automatic Token Refresh
- Implement proactive refresh 5 minutes before expiry
- Queue failed requests during refresh
- Retry queued requests after successful refresh
- Handle concurrent refresh attempts
- Logout on refresh failure

### Remember Me Functionality
- Extended refresh token expiry (30 days)
- Store preference in Pinia persistence
- Clear on explicit logout
- Handle cross-tab synchronization

### Auth UI Components
- **LoginForm**: Email/password with Zod validation
- **TwoFactorModal**: 6-digit OTP input with auto-submit
- **PasswordStrength**: Visual password strength indicator
- **SessionTimeout**: Warning modal before auto-logout
- **RememberDevice**: Option to trust device for 30 days

## Risk Mitigation
- **Token Exposure**: Use httpOnly cookies exclusively
- **XSS Prevention**: Sanitize all user inputs
- **CSRF Attacks**: Implement double-submit cookie pattern
- **Session Fixation**: Rotate tokens on login
- **Brute Force**: Implement exponential backoff in UI

## Testing Checklist
- [ ] Unit tests for auth store actions
- [ ] Integration tests for token refresh flow
- [ ] E2E tests for complete auth scenarios
- [ ] Security testing for token handling
- [ ] Performance tests for concurrent requests
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness

## Resources
- [Nuxt Auth Module](https://auth.nuxtjs.org/)
- [Pinia Persistence](https://prazdevs.github.io/pinia-plugin-persistedstate/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Notes
- Consider implementing WebAuthn for passwordless authentication in future
- Monitor authentication metrics for security insights
- Plan for SSO integration in subsequent phases