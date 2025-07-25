# T03_S02 - Token Refresh Implementation

## Task Overview
**Duration**: 2 hours  
**Priority**: High  
**Dependencies**: T01_S02_AuthStore_API_Integration, T02_S02_Error_Handling_Enhancement  
**Sprint**: S02_M001_INTEGRATION  

## Objective
Implement automatic JWT token refresh mechanism with proper concurrency handling, retry logic, and secure storage to maintain user sessions without interruption.

## Background
JWT tokens have limited lifespan for security. The application needs to:
- Automatically refresh tokens before expiry
- Handle concurrent requests during refresh
- Manage refresh failures gracefully
- Maintain user session continuity
- Prevent token refresh loops

## Technical Requirements

### 1. Token Refresh Service
Create a dedicated service for token management:

```typescript
// services/token-refresh.ts
export class TokenRefreshService {
  private refreshPromise: Promise<AuthTokens> | null = null
  private refreshTimeout: NodeJS.Timeout | null = null
  
  constructor(
    private authStore: ReturnType<typeof useAuthStore>,
    private api: typeof $fetch
  ) {}
  
  /**
   * Schedule automatic token refresh before expiry
   */
  scheduleRefresh(expiresIn: number) {
    this.clearScheduledRefresh()
    
    // Refresh 2 minutes before expiry (minimum 30 seconds)
    const refreshTime = Math.max((expiresIn - 120) * 1000, 30000)
    
    this.refreshTimeout = setTimeout(() => {
      this.refreshToken().catch(error => {
        console.error('Scheduled token refresh failed:', error)
        // If refresh fails, user will be logged out on next API call
      })
    }, refreshTime)
  }
  
  /**
   * Refresh token with concurrency protection
   */
  async refreshToken(): Promise<AuthTokens> {
    // Return existing promise if refresh is already in progress
    if (this.refreshPromise) {
      return this.refreshPromise
    }
    
    this.refreshPromise = this.performRefresh()
    
    try {
      const tokens = await this.refreshPromise
      this.scheduleRefresh(tokens.expiresIn)
      return tokens
    } finally {
      this.refreshPromise = null
    }
  }
  
  /**
   * Perform the actual token refresh
   */
  private async performRefresh(): Promise<AuthTokens> {
    try {
      const response = await this.api<RefreshTokenResponse>('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include' // For httpOnly refresh token cookie
      })
      
      // Update stored tokens
      await this.storeTokens(response.tokens)
      
      return response.tokens
    } catch (error) {
      console.error('Token refresh failed:', error)
      
      // If refresh fails, logout user
      await this.authStore.logout()
      
      throw new Error('Token refresh failed')
    }
  }
  
  /**
   * Store tokens securely
   */
  private async storeTokens(tokens: AuthTokens) {
    // Store access token in sessionStorage (will be cleared on browser close)
    sessionStorage.setItem('access_token', tokens.accessToken)
    
    // Update store
    this.authStore.setTokens(tokens)
    
    // Log token refresh for debugging
    console.debug('Tokens refreshed successfully', {
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType
    })
  }
  
  /**
   * Clear scheduled refresh
   */
  clearScheduledRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }
  
  /**
   * Check if token needs refresh
   */
  shouldRefreshToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = payload.exp * 1000
      const currentTime = Date.now()
      
      // Refresh if token expires in less than 5 minutes
      return (expiryTime - currentTime) < 5 * 60 * 1000
    } catch {
      return true // If we can't parse token, assume it needs refresh
    }
  }
  
  /**
   * Cleanup on logout
   */
  cleanup() {
    this.clearScheduledRefresh()
    this.refreshPromise = null
    sessionStorage.removeItem('access_token')
  }
}
```

### 2. Request Interceptor with Token Refresh
Update API client to handle token refresh automatically:

```typescript
// utils/api.ts
let tokenRefreshService: TokenRefreshService | null = null

export const api = $fetch.create({
  baseURL: '/api/v1',
  
  async onRequest({ options }) {
    const token = sessionStorage.getItem('access_token')
    
    if (token) {
      // Check if token needs refresh
      if (tokenRefreshService?.shouldRefreshToken(token)) {
        try {
          const newTokens = await tokenRefreshService.refreshToken()
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newTokens.accessToken}`
          }
        } catch (error) {
          // Refresh failed, proceed with current token
          // The 401 handler will catch this and logout
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`
          }
        }
      } else {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`
        }
      }
    }
  },
  
  async onResponseError({ response, request, options }) {
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      const error = response._data?.error
      
      if (error?.code === 'TOKEN_EXPIRED' && tokenRefreshService) {
        try {
          // Try to refresh token
          const newTokens = await tokenRefreshService.refreshToken()
          
          // Retry original request with new token
          return api(request, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newTokens.accessToken}`
            }
          })
        } catch (refreshError) {
          // Refresh failed, redirect to login
          console.error('Token refresh failed, redirecting to login')
          await navigateTo('/login')
          throw refreshError
        }
      }
    }
    
    throw ApiError.fromResponse(response)
  }
})

// Initialize token refresh service
export function initializeTokenRefresh(authStore: ReturnType<typeof useAuthStore>) {
  tokenRefreshService = new TokenRefreshService(authStore, $fetch)
  return tokenRefreshService
}
```

### 3. AuthStore Integration
Update AuthStore to use token refresh service:

```typescript
// stores/auth.ts (additions)
export const useAuthStore = defineStore('auth', () => {
  // ... existing code ...
  
  let tokenRefreshService: TokenRefreshService | null = null
  
  const initializeTokenRefresh = () => {
    if (!tokenRefreshService) {
      tokenRefreshService = new TokenRefreshService(
        // Pass store methods that the service needs
        {
          setTokens,
          logout,
        },
        $fetch
      )
    }
  }
  
  const setTokens = (newTokens: AuthTokens) => {
    tokens.value = newTokens
    
    // Schedule next refresh
    if (tokenRefreshService) {
      tokenRefreshService.scheduleRefresh(newTokens.expiresIn)
    }
  }
  
  const login = async (credentials: LoginForm) => {
    // ... existing login logic ...
    
    if (response.tokens) {
      setTokens(response.tokens)
      initializeTokenRefresh()
    }
    
    return response
  }
  
  const verify2FA = async (token: string, challenge: string) => {
    // ... existing 2FA logic ...
    
    if (response.tokens) {
      setTokens(response.tokens)
      initializeTokenRefresh()
    }
    
    return response
  }
  
  const logout = async () => {
    try {
      // Call logout endpoint
      await $fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      // Clean up regardless of logout API success
      user.value = null
      tokens.value = null
      
      if (tokenRefreshService) {
        tokenRefreshService.cleanup()
        tokenRefreshService = null
      }
      
      // Clear all storage
      sessionStorage.clear()
      
      // Redirect to login
      await navigateTo('/login')
    }
  }
  
  const refreshToken = async (): Promise<AuthTokens> => {
    if (!tokenRefreshService) {
      throw new Error('Token refresh service not initialized')
    }
    
    return tokenRefreshService.refreshToken()
  }
  
  // Initialize token refresh on store creation if user is logged in
  const initialize = () => {
    const token = sessionStorage.getItem('access_token')
    if (token && tokens.value) {
      initializeTokenRefresh()
    }
  }
  
  return {
    // ... existing returns ...
    refreshToken,
    initialize,
    setTokens
  }
})
```

### 4. Nuxt Plugin for Initialization
Create plugin to initialize token refresh on app start:

```typescript
// plugins/auth-init.client.ts
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Initialize token refresh service if user was previously logged in
  const token = sessionStorage.getItem('access_token')
  if (token) {
    try {
      // Verify current user session
      const user = await $fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      // Restore user state
      authStore.setUser(user)
      
      // Decode token to get expiry
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresIn = payload.exp - Math.floor(Date.now() / 1000)
      
      if (expiresIn > 0) {
        authStore.setTokens({
          accessToken: token,
          tokenType: 'Bearer',
          expiresIn
        })
        
        // Initialize token refresh
        authStore.initialize()
      } else {
        // Token expired, clear storage
        sessionStorage.clear()
      }
    } catch (error) {
      console.error('Failed to restore user session:', error)
      sessionStorage.clear()
    }
  }
})
```

### 5. Composable for Token Management
Create a composable for easy token management:

```typescript
// composables/useTokenRefresh.ts
export const useTokenRefresh = () => {
  const authStore = useAuthStore()
  
  const refreshToken = async (): Promise<AuthTokens> => {
    return authStore.refreshToken()
  }
  
  const getValidToken = async (): Promise<string | null> => {
    const token = sessionStorage.getItem('access_token')
    
    if (!token) {
      return null
    }
    
    // Check if token is expired or will expire soon
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = payload.exp * 1000
      const currentTime = Date.now()
      
      // If token expires in less than 1 minute, refresh it
      if ((expiryTime - currentTime) < 60000) {
        const newTokens = await refreshToken()
        return newTokens.accessToken
      }
      
      return token
    } catch {
      // If we can't parse token, try to refresh
      try {
        const newTokens = await refreshToken()
        return newTokens.accessToken
      } catch {
        return null
      }
    }
  }
  
  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = payload.exp * 1000
      const currentTime = Date.now()
      
      return expiryTime > currentTime
    } catch {
      return false
    }
  }
  
  return {
    refreshToken,
    getValidToken,
    isTokenValid
  }
}
```

## Implementation Steps

1. **Token refresh service** (1 hour)
   - Create TokenRefreshService class
   - Implement concurrency protection
   - Add scheduling logic

2. **API client integration** (0.5 hours)
   - Update request interceptor
   - Handle 401 responses with retry
   - Initialize service

3. **AuthStore updates** (0.5 hours)
   - Integrate token refresh service
   - Update login/logout flows
   - Add initialization logic

## Testing Requirements

### Unit Tests
```typescript
// services/__tests__/token-refresh.test.ts
describe('TokenRefreshService', () => {
  let service: TokenRefreshService
  let mockAuthStore: any
  let mockApi: any

  beforeEach(() => {
    mockAuthStore = {
      setTokens: vi.fn(),
      logout: vi.fn()
    }
    mockApi = vi.fn()
    service = new TokenRefreshService(mockAuthStore, mockApi)
  })

  it('should schedule token refresh', () => {
    vi.useFakeTimers()
    
    service.scheduleRefresh(300) // 5 minutes
    
    // Should schedule refresh for 2 minutes before expiry
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 180000)
    
    vi.useRealTimers()
  })

  it('should handle concurrent refresh requests', async () => {
    const mockTokens = {
      accessToken: 'new-token',
      refreshToken: 'new-refresh',
      expiresIn: 3600,
      tokenType: 'Bearer'
    }
    
    mockApi.mockResolvedValue({ tokens: mockTokens })
    
    // Start multiple refresh requests
    const promise1 = service.refreshToken()
    const promise2 = service.refreshToken()
    const promise3 = service.refreshToken()
    
    const [result1, result2, result3] = await Promise.all([
      promise1, promise2, promise3
    ])
    
    // All should return the same result
    expect(result1).toEqual(mockTokens)
    expect(result2).toEqual(mockTokens)
    expect(result3).toEqual(mockTokens)
    
    // API should only be called once
    expect(mockApi).toHaveBeenCalledTimes(1)
  })

  it('should logout on refresh failure', async () => {
    mockApi.mockRejectedValue(new Error('Refresh failed'))
    
    await expect(service.refreshToken()).rejects.toThrow('Token refresh failed')
    expect(mockAuthStore.logout).toHaveBeenCalled()
  })
})
```

### Integration Tests
- Token refresh on API calls
- Concurrent request handling
- Session restoration on page reload
- Automatic logout on refresh failure

## Success Criteria

- [ ] Tokens are automatically refreshed before expiry
- [ ] Concurrent requests don't cause multiple refresh calls
- [ ] Failed refresh attempts trigger logout
- [ ] User session is maintained across page reloads
- [ ] API calls work seamlessly during token refresh
- [ ] Token refresh is scheduled correctly
- [ ] Memory leaks are prevented through proper cleanup

## Security Considerations

1. **Token Storage**: Access tokens in sessionStorage only
2. **Refresh Security**: Use httpOnly cookies for refresh tokens
3. **Cleanup**: Proper cleanup on logout to prevent token leaks
4. **Timing**: Refresh tokens before expiry to prevent gaps
5. **Failure Handling**: Secure logout on refresh failures

## Files to Create/Modify

- `services/token-refresh.ts` - Token refresh service
- `utils/api.ts` - API client with refresh integration
- `stores/auth.ts` - AuthStore updates
- `plugins/auth-init.client.ts` - Initialization plugin
- `composables/useTokenRefresh.ts` - Token management composable

## Technical References

### Architecture Guidelines
- Reference: `/archived-2025-07-23/frontend/docs/developer-guide/architecture.md` - Token management patterns and security considerations
- Reference: `/archived-2025-07-23/frontend/CLAUDE.md` - Vue 3 Composition API patterns for service classes
- Reference: `/archived-2025-07-23/frontend/docs/api/error-handling.md` - Retry mechanisms and error handling for token refresh failures

### Design Patterns
- Implement TokenRefreshService as a singleton with concurrency protection
- Use the established API client patterns with interceptors
- Follow secure token storage patterns (sessionStorage for access tokens, httpOnly cookies for refresh tokens)
- Use the composable pattern for token management utilities

## Related Tasks

- T01_S02_AuthStore_API_Integration
- T02_S02_Error_Handling_Enhancement
- T04_S02_Route_Protection_Verification

---

**Note**: This implementation ensures seamless user experience by maintaining authentication state automatically. Test thoroughly with various scenarios including network failures and concurrent requests.