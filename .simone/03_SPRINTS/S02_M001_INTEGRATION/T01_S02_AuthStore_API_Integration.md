# T01_S02 - AuthStore API Integration

## Task Overview
**Duration**: 4 hours  
**Priority**: High  
**Dependencies**: S01_M001_BACKEND_AUTH (Backend JWT authentication)  
**Sprint**: S02_M001_INTEGRATION  

## Objective
Update the Pinia AuthStore to integrate with real backend authentication endpoints, replacing mock handlers with production-ready API calls.

## Background
The frontend authentication system currently uses MSW (Mock Service Worker) for API simulation. The AuthStore exists with proper structure but needs real API integration for:
- User login with JWT token handling
- 2FA verification flow
- Token refresh mechanism
- User profile fetching
- Secure logout

## Technical Requirements

### 1. API Client Configuration
Update the API client to handle authentication flows:

```typescript
// utils/api.ts
export const authApi = $fetch.create({
  baseURL: '/api/v1/auth',
  credentials: 'include', // For httpOnly cookies
  onRequest({ options }) {
    // Add CSRF token if needed
    const csrfToken = useCookie('csrf-token')
    if (csrfToken.value) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken.value
      }
    }
  },
  onResponseError({ response }) {
    // Handle auth-specific errors
    const { logout } = useAuthStore()
    
    if (response.status === 401) {
      // Try token refresh before logout
      return handleTokenRefresh(response)
    }
  }
})
```

### 2. AuthStore Integration
Update the AuthStore to use real API endpoints:

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Login with email/password
  const login = async (credentials: LoginForm) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi<LoginResponse>('/login', {
        method: 'POST',
        body: credentials
      })

      if (response.requiresTwoFactor) {
        return { requiresTwoFactor: true, challenge: response.twoFactorChallenge }
      }

      // Set user and tokens
      user.value = response.user
      tokens.value = response.tokens
      
      // Store refresh token in httpOnly cookie (handled by backend)
      await storeTokens(response.tokens)
      
      return { success: true }
    } catch (err) {
      error.value = handleApiError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 2FA verification
  const verify2FA = async (token: string, challenge: string) => {
    const response = await authApi<LoginResponse>('/verify-2fa', {
      method: 'POST',
      body: { token, challenge }
    })

    user.value = response.user
    tokens.value = response.tokens
    await storeTokens(response.tokens)
  }

  // Token refresh
  const refreshToken = async () => {
    try {
      const response = await authApi<RefreshTokenResponse>('/refresh', {
        method: 'POST'
      })
      
      tokens.value = response.tokens
      await storeTokens(response.tokens)
      return response.tokens
    } catch (err) {
      // Refresh failed, logout
      await logout()
      throw err
    }
  }

  return {
    user: readonly(user),
    tokens: readonly(tokens),
    isLoading: readonly(isLoading),
    error: readonly(error),
    login,
    verify2FA,
    refreshToken,
    logout,
    fetchCurrentUser
  }
})
```

### 3. Token Management
Implement secure token storage and rotation:

```typescript
// utils/token-storage.ts
export const storeTokens = async (tokens: AuthTokens) => {
  // Access token in memory only
  sessionStorage.setItem('access_token', tokens.accessToken)
  
  // Refresh token handled by httpOnly cookie (backend sets this)
  // Schedule token refresh before expiry
  scheduleTokenRefresh(tokens.expiresIn)
}

export const scheduleTokenRefresh = (expiresIn: number) => {
  // Refresh 1 minute before expiry
  const refreshTime = (expiresIn - 60) * 1000
  
  setTimeout(async () => {
    try {
      const { refreshToken } = useAuthStore()
      await refreshToken()
    } catch (error) {
      console.error('Token refresh failed:', error)
    }
  }, refreshTime)
}

export const getAccessToken = (): string | null => {
  return sessionStorage.getItem('access_token')
}

export const clearTokens = () => {
  sessionStorage.removeItem('access_token')
  // Refresh token cleared by backend on logout
}
```

### 4. API Error Handling
Implement proper error handling for authentication failures:

```typescript
// utils/auth-errors.ts
export const handleApiError = (error: any): string => {
  if (isApiError(error)) {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return 'メールアドレスまたはパスワードが正しくありません'
      case 'ACCOUNT_SUSPENDED':
        return 'アカウントが停止されています。管理者にお問い合わせください'
      case 'TOO_MANY_ATTEMPTS':
        return 'ログイン試行回数が多すぎます。しばらく時間をおいてお試しください'
      case 'INVALID_2FA_TOKEN':
        return '認証コードが正しくありません'
      case 'TOKEN_EXPIRED':
        return 'セッションが期限切れです。再度ログインしてください'
      default:
        return error.message
    }
  }
  return 'ログインに失敗しました。しばらく時間をおいてお試しください'
}
```

### 5. Route Protection Update
Ensure middleware works with real authentication:

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { user, tokens } = useAuthStore()
  
  // Check if tokens exist and are valid
  if (!tokens || !user) {
    const accessToken = getAccessToken()
    if (!accessToken) {
      return navigateTo('/login')
    }
    
    // Verify token is still valid
    if (isTokenExpired(accessToken)) {
      // Try refresh
      const { refreshToken } = useAuthStore()
      return refreshToken().catch(() => {
        return navigateTo('/login')
      })
    }
  }
  
  // Check route permissions
  if (to.meta.requiresPermission) {
    const hasPermission = user?.permissions?.some(p => 
      p.name === to.meta.requiresPermission
    )
    
    if (!hasPermission) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions'
      })
    }
  }
})
```

## Implementation Steps

1. **Update API configuration** (1 hour)
   - Configure base API client for authentication
   - Add CSRF token handling
   - Set up request/response interceptors

2. **Implement AuthStore methods** (2 hours)
   - Replace mock calls with real API calls
   - Add proper TypeScript types
   - Implement error handling

3. **Token management** (0.5 hours)
   - Secure token storage
   - Automatic refresh scheduling
   - Token validation utilities

4. **Update middleware** (0.5 hours)
   - Real token validation
   - Permission checking
   - Error handling

## Testing Requirements

### Unit Tests
```typescript
// stores/__tests__/auth.test.ts
describe('AuthStore', () => {
  it('should login successfully with valid credentials', async () => {
    const store = useAuthStore()
    const result = await store.login({
      email: 'lawyer@example.com',
      password: 'password123',
      rememberMe: false
    })
    
    expect(result.success).toBe(true)
    expect(store.user).toBeDefined()
    expect(store.tokens).toBeDefined()
  })

  it('should handle 2FA flow', async () => {
    const store = useAuthStore()
    const result = await store.login({
      email: 'clerk@example.com',
      password: 'password123'
    })
    
    expect(result.requiresTwoFactor).toBe(true)
    expect(result.challenge).toBeDefined()
  })

  it('should refresh tokens automatically', async () => {
    const store = useAuthStore()
    // Set up expired token scenario
    const newTokens = await store.refreshToken()
    expect(newTokens).toBeDefined()
  })
})
```

### Integration Tests
- Login flow with real backend
- 2FA verification process
- Token refresh mechanism
- Logout cleanup

## Success Criteria

- [ ] Login form successfully authenticates with backend
- [ ] 2FA flow works end-to-end
- [ ] Tokens are properly stored and rotated
- [ ] Route protection works with real authentication
- [ ] Error handling provides user-friendly messages
- [ ] All existing unit tests updated and passing
- [ ] Integration tests verify real API communication

## Security Considerations

1. **Token Storage**: Access tokens in sessionStorage, refresh tokens in httpOnly cookies
2. **CSRF Protection**: Use CSRF tokens for state-changing requests
3. **Token Rotation**: Implement automatic refresh before expiry
4. **Error Logging**: Log authentication failures for security monitoring
5. **Rate Limiting**: Handle rate limiting errors gracefully

## Files to Modify

- `stores/auth.ts` - Main authentication store
- `utils/api.ts` - API client configuration
- `utils/token-storage.ts` - Token management utilities
- `utils/auth-errors.ts` - Error handling
- `middleware/auth.ts` - Route protection
- `composables/useAuth.ts` - Authentication composable

## Technical References

### Architecture Guidelines
- Reference: `/archived-2025-07-23/frontend/CLAUDE.md` - Vue 3 Composition API patterns and component structure
- Reference: `/archived-2025-07-23/frontend/docs/developer-guide/architecture.md` - Frontend architecture patterns and API integration
- Reference: `/archived-2025-07-23/frontend/docs/api/error-handling.md` - API error handling patterns and implementation

### Design Patterns
- Follow the established AuthStore pattern with Pinia composition API
- Use the error handling patterns from the architecture documentation
- Implement token management following the secure storage patterns
- Use the established API client configuration patterns

## Related Tasks

- T02_S02_Error_Handling_Enhancement
- T03_S02_Token_Refresh_Implementation
- T04_S02_Route_Protection_Verification

---

**Note**: This task requires backend authentication endpoints to be fully functional. Coordinate with backend team to ensure API contracts match the implementation.