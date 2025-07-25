# T06_S02 - AuthStore Unit Tests

## Task Overview
**Duration**: 3 hours  
**Priority**: Medium  
**Dependencies**: T01_S02_AuthStore_API_Integration, T03_S02_Token_Refresh_Implementation  
**Sprint**: S02_M001_INTEGRATION  

## Objective
Create comprehensive unit tests for the AuthStore to ensure reliable authentication state management, proper error handling, and correct API integration.

## Background
The AuthStore is critical for application security and user experience. Unit tests must verify:
- Authentication state management
- API integration correctness
- Token refresh mechanisms
- Error handling scenarios
- Edge cases and race conditions

## Technical Requirements

### 1. Test Setup and Configuration
Configure Vitest with proper mocking for external dependencies:

```typescript
// stores/__tests__/setup.ts
import { vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { User, AuthTokens } from '~/types/auth'

// Mock $fetch globally
global.$fetch = vi.fn()

// Mock navigateTo
const mockNavigateTo = vi.fn()
vi.mock('#app/composables/router', () => ({
  navigateTo: mockNavigateTo
}))

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

// Mock user data
export const mockUser: User = {
  id: '1',
  email: 'lawyer@example.com',
  name: '田中 太郎',
  roles: [
    {
      id: '1',
      name: 'LAWYER',
      displayName: '弁護士',
      description: '法律事務所の弁護士',
      permissions: [
        {
          id: '1',
          name: 'MATTER_READ',
          displayName: '案件閲覧',
          description: '案件情報を閲覧できる',
          resource: 'matter',
          action: 'read'
        },
        {
          id: '2',
          name: 'MATTER_WRITE',
          displayName: '案件編集',
          description: '案件情報を編集できる',
          resource: 'matter',
          action: 'write'
        }
      ]
    }
  ],
  permissions: [],
  twoFactorEnabled: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

export const mockTokens: AuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  tokenType: 'Bearer'
}

// Setup function for each test
export function setupTest() {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockSessionStorage.getItem.mockReturnValue(null)
  return {
    mockNavigateTo,
    mockSessionStorage,
    mockFetch: global.$fetch as any
  }
}
```

### 2. Core Authentication Tests
Test basic authentication functionality:

```typescript
// stores/__tests__/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../auth'
import { setupTest, mockUser, mockTokens } from './setup'

describe('AuthStore', () => {
  let mockFetch: any
  let mockNavigateTo: any
  let mockSessionStorage: any

  beforeEach(() => {
    const setup = setupTest()
    mockFetch = setup.mockFetch
    mockNavigateTo = setup.mockNavigateTo
    mockSessionStorage = setup.mockSessionStorage
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const authStore = useAuthStore()
      
      // Mock successful login response
      mockFetch.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens
      })

      const credentials = {
        email: 'lawyer@example.com',
        password: 'password123',
        rememberMe: false
      }

      const result = await authStore.login(credentials)

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        body: credentials
      })

      // Verify state updates
      expect(authStore.user).toEqual(mockUser)
      expect(authStore.tokens).toEqual(mockTokens)
      expect(authStore.isAuthenticated).toBe(true)
      expect(result.success).toBe(true)

      // Verify token storage
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'access_token',
        mockTokens.accessToken
      )
    })

    it('should handle 2FA required response', async () => {
      const authStore = useAuthStore()
      
      mockFetch.mockResolvedValueOnce({
        requiresTwoFactor: true,
        twoFactorChallenge: 'mock-challenge'
      })

      const credentials = {
        email: 'clerk@example.com',
        password: 'password123',
        rememberMe: false
      }

      const result = await authStore.login(credentials)

      expect(result.requiresTwoFactor).toBe(true)
      expect(result.challenge).toBe('mock-challenge')
      expect(authStore.user).toBeNull()
      expect(authStore.tokens).toBeNull()
    })

    it('should handle invalid credentials error', async () => {
      const authStore = useAuthStore()
      
      const apiError = new Error('API Error')
      apiError.response = {
        status: 401,
        _data: {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'メールアドレスまたはパスワードが正しくありません'
          }
        }
      }
      
      mockFetch.mockRejectedValueOnce(apiError)

      const credentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
        rememberMe: false
      }

      await expect(authStore.login(credentials)).rejects.toThrow()
      
      expect(authStore.user).toBeNull()
      expect(authStore.tokens).toBeNull()
      expect(authStore.error).toBeTruthy()
    })

    it('should handle network errors', async () => {
      const authStore = useAuthStore()
      
      const networkError = new Error('Network Error')
      mockFetch.mockRejectedValueOnce(networkError)

      const credentials = {
        email: 'lawyer@example.com',
        password: 'password123',
        rememberMe: false
      }

      await expect(authStore.login(credentials)).rejects.toThrow()
      
      expect(authStore.user).toBeNull()
      expect(authStore.tokens).toBeNull()
      expect(authStore.isLoading).toBe(false)
    })
  })

  describe('verify2FA', () => {
    it('should verify 2FA token successfully', async () => {
      const authStore = useAuthStore()
      
      mockFetch.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens
      })

      await authStore.verify2FA('123456', 'mock-challenge')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/verify-2fa', {
        method: 'POST',
        body: {
          token: '123456',
          challenge: 'mock-challenge'
        }
      })

      expect(authStore.user).toEqual(mockUser)
      expect(authStore.tokens).toEqual(mockTokens)
    })

    it('should handle invalid 2FA token', async () => {
      const authStore = useAuthStore()
      
      const apiError = new Error('Invalid 2FA token')
      apiError.response = {
        status: 401,
        _data: {
          error: {
            code: 'INVALID_2FA_TOKEN',
            message: '認証コードが正しくありません'
          }
        }
      }
      
      mockFetch.mockRejectedValueOnce(apiError)

      await expect(authStore.verify2FA('000000', 'mock-challenge')).rejects.toThrow()
      
      expect(authStore.user).toBeNull()
      expect(authStore.tokens).toBeNull()
    })
  })

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const authStore = useAuthStore()
      
      // Set initial tokens
      authStore.setTokens(mockTokens)
      
      const newTokens = {
        ...mockTokens,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
      
      mockFetch.mockResolvedValueOnce({ tokens: newTokens })

      const result = await authStore.refreshToken()

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })

      expect(result).toEqual(newTokens)
      expect(authStore.tokens).toEqual(newTokens)
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'access_token',
        newTokens.accessToken
      )
    })

    it('should logout on refresh failure', async () => {
      const authStore = useAuthStore()
      
      // Set initial state
      authStore.setUser(mockUser)
      authStore.setTokens(mockTokens)
      
      mockFetch.mockRejectedValueOnce(new Error('Refresh failed'))

      await expect(authStore.refreshToken()).rejects.toThrow()
      
      // Should be logged out
      expect(authStore.user).toBeNull()
      expect(authStore.tokens).toBeNull()
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const authStore = useAuthStore()
      
      // Set initial authenticated state
      authStore.setUser(mockUser)
      authStore.setTokens(mockTokens)
      
      mockFetch.mockResolvedValueOnce({ message: 'Logged out' })

      await authStore.logout()

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      // Verify state cleared
      expect(authStore.user).toBeNull()
      expect(authStore.tokens).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
      
      // Verify storage cleared
      expect(mockSessionStorage.clear).toHaveBeenCalled()
      
      // Verify redirect
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })

    it('should clear state even if API call fails', async () => {
      const authStore = useAuthStore()
      
      authStore.setUser(mockUser)
      authStore.setTokens(mockTokens)
      
      mockFetch.mockRejectedValueOnce(new Error('Logout API failed'))

      await authStore.logout()

      // State should still be cleared
      expect(authStore.user).toBeNull()
      expect(authStore.tokens).toBeNull()
      expect(mockSessionStorage.clear).toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })
  })

  describe('fetchCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const authStore = useAuthStore()
      
      mockSessionStorage.getItem.mockReturnValue('valid-token')
      mockFetch.mockResolvedValueOnce(mockUser)

      await authStore.fetchCurrentUser()

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/me', {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      expect(authStore.user).toEqual(mockUser)
    })

    it('should handle unauthorized response', async () => {
      const authStore = useAuthStore()
      
      const apiError = new Error('Unauthorized')
      apiError.response = { status: 401 }
      
      mockFetch.mockRejectedValueOnce(apiError)

      await expect(authStore.fetchCurrentUser()).rejects.toThrow()
      
      expect(authStore.user).toBeNull()
    })
  })
})
```

### 3. State Management Tests
Test reactive state behavior:

```typescript
// stores/__tests__/auth-state.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../auth'
import { setupTest, mockUser, mockTokens } from './setup'

describe('AuthStore State Management', () => {
  beforeEach(() => {
    setupTest()
  })

  describe('reactive state', () => {
    it('should update isAuthenticated when user changes', () => {
      const authStore = useAuthStore()
      
      expect(authStore.isAuthenticated).toBe(false)
      
      authStore.setUser(mockUser)
      expect(authStore.isAuthenticated).toBe(true)
      
      authStore.setUser(null)
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should compute user permissions correctly', () => {
      const authStore = useAuthStore()
      
      authStore.setUser(mockUser)
      
      const permissions = authStore.userPermissions
      expect(permissions).toHaveLength(2)
      expect(permissions[0].name).toBe('MATTER_READ')
      expect(permissions[1].name).toBe('MATTER_WRITE')
    })

    it('should handle user without permissions', () => {
      const authStore = useAuthStore()
      
      const userWithoutPermissions = {
        ...mockUser,
        roles: [],
        permissions: []
      }
      
      authStore.setUser(userWithoutPermissions)
      
      expect(authStore.userPermissions).toHaveLength(0)
    })
  })

  describe('error handling', () => {
    it('should clear error on successful operation', async () => {
      const authStore = useAuthStore()
      
      // Set initial error
      authStore.setError('Previous error')
      expect(authStore.error).toBe('Previous error')
      
      // Mock successful login
      global.$fetch.mockResolvedValueOnce({
        user: mockUser,
        tokens: mockTokens
      })
      
      await authStore.login({
        email: 'test@example.com',
        password: 'password',
        rememberMe: false
      })
      
      expect(authStore.error).toBeNull()
    })

    it('should set loading state correctly', async () => {
      const authStore = useAuthStore()
      
      expect(authStore.isLoading).toBe(false)
      
      // Mock delayed response
      global.$fetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          user: mockUser,
          tokens: mockTokens
        }), 100))
      )
      
      const loginPromise = authStore.login({
        email: 'test@example.com',
        password: 'password',
        rememberMe: false
      })
      
      expect(authStore.isLoading).toBe(true)
      
      await loginPromise
      
      expect(authStore.isLoading).toBe(false)
    })
  })
})
```

### 4. Integration Tests with Token Refresh
Test token refresh integration:

```typescript
// stores/__tests__/auth-token-refresh.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../auth'
import { setupTest, mockUser, mockTokens } from './setup'

describe('AuthStore Token Refresh Integration', () => {
  let mockFetch: any

  beforeEach(() => {
    const setup = setupTest()
    mockFetch = setup.mockFetch
    
    // Mock setTimeout for token scheduling
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should schedule token refresh after login', async () => {
    const authStore = useAuthStore()
    
    mockFetch.mockResolvedValueOnce({
      user: mockUser,
      tokens: { ...mockTokens, expiresIn: 300 } // 5 minutes
    })

    await authStore.login({
      email: 'test@example.com',
      password: 'password',
      rememberMe: false
    })

    // Should schedule refresh for 2 minutes before expiry (180 seconds)
    expect(setTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      180000 // 3 minutes in milliseconds
    )
  })

  it('should handle concurrent token refresh requests', async () => {
    const authStore = useAuthStore()
    
    // Set initial tokens
    authStore.setTokens(mockTokens)
    
    const newTokens = {
      ...mockTokens,
      accessToken: 'new-token'
    }
    
    // Mock refresh response with delay
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ tokens: newTokens }), 100))
    )

    // Start multiple refresh requests
    const promise1 = authStore.refreshToken()
    const promise2 = authStore.refreshToken()
    const promise3 = authStore.refreshToken()

    const [result1, result2, result3] = await Promise.all([
      promise1, promise2, promise3
    ])

    // All should return same result
    expect(result1).toEqual(newTokens)
    expect(result2).toEqual(newTokens)
    expect(result3).toEqual(newTokens)

    // API should only be called once
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should clear scheduled refresh on logout', async () => {
    const authStore = useAuthStore()
    
    // Login first to schedule refresh
    mockFetch.mockResolvedValueOnce({
      user: mockUser,
      tokens: mockTokens
    })
    
    await authStore.login({
      email: 'test@example.com',
      password: 'password',
      rememberMe: false
    })

    // Mock logout response
    mockFetch.mockResolvedValueOnce({ message: 'Logged out' })
    
    await authStore.logout()

    // Verify clearTimeout was called
    expect(clearTimeout).toHaveBeenCalled()
  })
})
```

### 5. Edge Cases and Error Scenarios
Test edge cases and error conditions:

```typescript
// stores/__tests__/auth-edge-cases.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../auth'
import { setupTest } from './setup'

describe('AuthStore Edge Cases', () => {
  beforeEach(() => {
    setupTest()
  })

  it('should handle malformed API responses', async () => {
    const authStore = useAuthStore()
    
    // Mock malformed response
    global.$fetch.mockResolvedValueOnce({
      // Missing required fields
    })

    await expect(authStore.login({
      email: 'test@example.com',
      password: 'password',
      rememberMe: false
    })).rejects.toThrow()
  })

  it('should handle session storage errors', async () => {
    const authStore = useAuthStore()
    const mockSessionStorage = window.sessionStorage as any
    
    // Mock sessionStorage error
    mockSessionStorage.setItem.mockImplementationOnce(() => {
      throw new Error('Storage quota exceeded')
    })

    global.$fetch.mockResolvedValueOnce({
      user: mockUser,
      tokens: mockTokens
    })

    // Should not throw, but handle gracefully
    await expect(authStore.login({
      email: 'test@example.com',
      password: 'password',
      rememberMe: false
    })).resolves.toBeDefined()
  })

  it('should handle multiple simultaneous login attempts', async () => {
    const authStore = useAuthStore()
    
    global.$fetch.mockResolvedValue({
      user: mockUser,
      tokens: mockTokens
    })

    const credentials = {
      email: 'test@example.com',
      password: 'password',
      rememberMe: false
    }

    // Start multiple login attempts
    const promise1 = authStore.login(credentials)
    const promise2 = authStore.login(credentials)

    const [result1, result2] = await Promise.all([promise1, promise2])

    // Both should succeed
    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
  })

  it('should handle token expiry during operation', async () => {
    const authStore = useAuthStore()
    
    // Set expired token
    const expiredToken = 'expired.token.here'
    window.sessionStorage.getItem = vi.fn().mockReturnValue(expiredToken)
    
    // Mock 401 response for expired token
    const tokenExpiredError = new Error('Token expired')
    tokenExpiredError.response = {
      status: 401,
      _data: {
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      }
    }
    
    global.$fetch.mockRejectedValueOnce(tokenExpiredError)

    await expect(authStore.fetchCurrentUser()).rejects.toThrow()
    
    // Should clear user state
    expect(authStore.user).toBeNull()
  })
})
```

## Implementation Steps

1. **Test setup and configuration** (0.5 hours)
   - Configure Vitest with proper mocking
   - Set up test utilities and mock data
   - Configure test environment

2. **Core functionality tests** (1.5 hours)
   - Test login, logout, 2FA flows
   - Test error handling scenarios
   - Test state management

3. **Integration and edge case tests** (1 hour)
   - Test token refresh integration
   - Test concurrent request handling
   - Test edge cases and error scenarios

## Testing Requirements

### Test Coverage
Target 100% code coverage for AuthStore:
- All public methods tested
- All state mutations verified
- All error scenarios covered
- All edge cases handled

### Test Structure
```
stores/__tests__/
├── setup.ts                    # Test utilities and mocks
├── auth.test.ts                # Core authentication tests
├── auth-state.test.ts          # State management tests
├── auth-token-refresh.test.ts  # Token refresh integration
└── auth-edge-cases.test.ts     # Edge cases and error scenarios
```

### Mock Strategy
- Mock external dependencies ($fetch, navigateTo, sessionStorage)
- Use real Pinia store implementation
- Mock timers for token refresh testing
- Use realistic mock data

## Success Criteria

- [ ] 100% code coverage for AuthStore
- [ ] All authentication flows tested
- [ ] Error scenarios properly tested
- [ ] State management tests pass
- [ ] Token refresh integration works
- [ ] Edge cases handled correctly
- [ ] Tests run fast and reliably
- [ ] Tests are maintainable and readable

## Performance Considerations

1. **Test Speed**: Use fake timers for time-dependent tests
2. **Memory Usage**: Clean up after each test
3. **Parallel Execution**: Tests should be independent
4. **Mocking**: Mock expensive operations like API calls

## Files to Create

- `stores/__tests__/setup.ts` - Test configuration and utilities
- `stores/__tests__/auth.test.ts` - Core authentication tests
- `stores/__tests__/auth-state.test.ts` - State management tests
- `stores/__tests__/auth-token-refresh.test.ts` - Token refresh tests
- `stores/__tests__/auth-edge-cases.test.ts` - Edge case tests

## Technical References

### Architecture Guidelines
- Reference: `/archived-2025-07-23/frontend/docs/developer-guide/architecture.md` - Testing patterns and mock strategies for Vue 3 applications
- Reference: `/archived-2025-07-23/frontend/CLAUDE.md` - Vitest configuration and testing best practices
- Reference: `frontend/app/mocks/handlers/auth.ts` - Mock data patterns and realistic test scenarios
- Reference: `frontend/app/schemas/auth.ts` - Type definitions and validation patterns for testing

### Design Patterns
- Use Vitest with Pinia testing utilities for store testing
- Follow the established mock patterns from auth handlers
- Implement concurrent request testing patterns
- Use the authentication flow patterns from existing implementation

## Related Tasks

- T01_S02_AuthStore_API_Integration
- T03_S02_Token_Refresh_Implementation
- T07_S02_E2E_Integration_Tests

---

**Note**: These unit tests provide confidence in the AuthStore implementation and catch regressions early. Run tests frequently during development and maintain high code coverage.