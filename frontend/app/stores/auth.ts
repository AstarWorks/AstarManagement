/**
 * Simple Auth Store - Setup Store Pattern
 * Simple over Easy: @pinia-plugin-persistedstateを活用した最適化された認証管理
 * Setup Store パターンでDiscriminated Union互換性問題を解決
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { z } from 'zod'
import type { 
  IUser, 
  IAuthTokensWithTimestamp, 
  ILoginCredentials,
  AuthState,
  IAuthError
} from '@auth/types/auth'
import {
  isAuthenticatedState,
  isLoadingState,
  isErrorState,
  createAuthError,
  createSuccess,
  createFailure
} from '@auth/types/auth'
import { mockAuthService } from '@auth/services/mockAuth'
import { AUTH_CONFIG } from '@infrastructure/config/authConfig'

/**
 * 永続化される認証データのスキーマ（型安全）
 */
const PersistedAuthStateSchema = z.object({
  status: z.enum(['idle', 'loading', 'authenticated', 'unauthenticated', 'error']),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    nameKana: z.string(),
    firmId: z.string(),
    firmName: z.string(),
    isActive: z.boolean(),
    twoFactorEnabled: z.boolean()
  }).nullable(),
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    tokenType: z.literal('Bearer'),
    createdAt: z.number()
  }).nullable(),
  error: z.object({
    code: z.enum(['INVALID_CREDENTIALS', 'TOKEN_EXPIRED', 'NETWORK_ERROR', 'UNKNOWN_ERROR']),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional()
  }).nullable(),
  lastActivity: z.number()
})

export const useAuthStore = defineStore('auth', () => {
  // ===========================
  // State (ref で管理)
  // ===========================
  const authState = ref<AuthState>({
    status: 'idle',
    user: null,
    tokens: null,
    error: null,
    lastActivity: Date.now(),
  })

  // ===========================
  // Getters (computed で管理)
  // ===========================
  
  // 型ガード関数を使用した型安全なアクセス
  const isAuthenticated = computed((): boolean => {
    return isAuthenticatedState(authState.value)
  })

  const isLoading = computed((): boolean => {
    return isLoadingState(authState.value)
  })

  const isError = computed((): boolean => {
    return isErrorState(authState.value)
  })

  // 型安全なデータアクセス
  const permissions = computed((): string[] => {
    return isAuthenticatedState(authState.value) ? authState.value.user.permissions : []
  })

  const roles = computed((): string[] => {
    return isAuthenticatedState(authState.value) ? authState.value.user.roles.map(r => r.name) : []
  })

  const currentUser = computed((): IUser | null => {
    return isAuthenticatedState(authState.value) ? authState.value.user : null
  })

  const currentTokens = computed((): IAuthTokensWithTimestamp | null => {
    return isAuthenticatedState(authState.value) ? authState.value.tokens : null
  })

  const currentError = computed((): IAuthError | null => {
    return isErrorState(authState.value) ? authState.value.error : null
  })

  const isTokenExpired = computed((): boolean => {
    if (!isAuthenticatedState(authState.value)) return true
    const tokenAge = Date.now() - authState.value.lastActivity
    return tokenAge > (authState.value.tokens.expiresIn * 1000)
  })

  const isSessionInactive = computed((): boolean => {
    const timeSinceLastActivity = Date.now() - authState.value.lastActivity
    return timeSinceLastActivity > AUTH_CONFIG.session.maxInactivityMs
  })

  const requiresTwoFactor = computed((): boolean => {
    return isAuthenticatedState(authState.value) ? authState.value.user.twoFactorEnabled : false
  })

  // ===========================
  // Helper Functions (状態更新)
  // ===========================
  
  /**
   * 型安全な状態更新ヘルパー（$patchの代替）
   */
  const setState = (newState: AuthState): void => {
    authState.value = newState
  }

  // ===========================
  // Actions (直接状態操作)
  // ===========================

  const login = async (credentials: ILoginCredentials) => {
    console.log('🏪 AuthStore: Login called with credentials', { email: credentials.email })
    console.log('🏪 AuthStore: Current state before login:', authState.value.status)
    
    // 状態遷移チェック
    if (authState.value.status !== 'idle' && authState.value.status !== 'unauthenticated' && authState.value.status !== 'error') {
      console.log('🏪 AuthStore: Invalid state for login:', authState.value.status)
      const error = createAuthError('UNKNOWN_ERROR', 'Invalid state for login')
      setState({ status: 'error', user: null, tokens: null, error, lastActivity: Date.now() })
      return createFailure(error)
    }

    // ローディング状態に遷移
    console.log('🏪 AuthStore: Setting loading state')
    setState({ status: 'loading', user: null, tokens: null, error: null, lastActivity: Date.now() })

    try {
      console.log('🏪 AuthStore: Calling mockAuthService.login')
      const response = await mockAuthService.login(credentials)
      console.log('🏪 AuthStore: Received response from mockAuthService', { user: Boolean(response.user), tokens: Boolean(response.tokens) })
      
      // 認証成功状態に遷移
      const newState = {
        status: 'authenticated' as const,
        user: response.user,
        tokens: { ...response.tokens, createdAt: Date.now() },
        error: null,
        lastActivity: Date.now()
      }
      console.log('🏪 AuthStore: Setting authenticated state')
      setState(newState)
      
      return createSuccess(response)
    } catch (error: unknown) {
      console.error('🏪 AuthStore: Login failed:', error)
      const authError = createAuthError(
        'INVALID_CREDENTIALS',
        (error as Error)?.message || 'Login failed',
        { originalError: error }
      )
      
      // エラー状態に遷移
      setState({ 
        status: 'error', 
        user: null, 
        tokens: null, 
        error: authError, 
        lastActivity: Date.now() 
      })
      
      return createFailure(authError)
    }
  }

  const logout = async () => {
    // 認証解除状態に遷移
    setState({
      status: 'unauthenticated',
      user: null,
      tokens: null,
      error: null,
      lastActivity: Date.now()
    })
    
    return createSuccess(undefined)
  }

  const refreshToken = async () => {
    if (!isAuthenticatedState(authState.value)) {
      const error = createAuthError('TOKEN_EXPIRED', 'No valid authentication state for token refresh')
      setState({ status: 'error', user: null, tokens: null, error, lastActivity: Date.now() })
      return createFailure(error)
    }

    // ローディング状態に遷移（トークンを保持）
    const currentUser = authState.value.user
    const currentRefreshToken = authState.value.tokens.refreshToken
    setState({ status: 'loading', user: null, tokens: null, error: null, lastActivity: Date.now() })

    try {
      const response = await mockAuthService.refreshToken(currentRefreshToken)
      
      // 認証状態を復元
      setState({
        status: 'authenticated',
        user: currentUser,
        tokens: { ...response.tokens, createdAt: Date.now() },
        error: null,
        lastActivity: Date.now()
      })
      
      return createSuccess(response)
    } catch (error: unknown) {
      const authError = createAuthError(
        'TOKEN_EXPIRED',
        (error as Error)?.message || 'Token refresh failed',
        { originalError: error }
      )
      
      setState({ 
        status: 'unauthenticated', 
        user: null, 
        tokens: null, 
        error: null, 
        lastActivity: Date.now() 
      })
      
      return createFailure(authError)
    }
  }

  const refreshTokens = async (): Promise<boolean> => {
    const result = await refreshToken()
    return result.success
  }

  const fetchUser = async () => {
    if (!isAuthenticatedState(authState.value)) {
      const error = createAuthError('TOKEN_EXPIRED', 'No valid authentication state for user fetch')
      setState({ status: 'error', user: null, tokens: null, error, lastActivity: Date.now() })
      return createFailure(error)
    }
    
    // 簡易実装: トークンがあればユーザーは有効とみなす
    // 実際のアプリでは、ここでユーザー情報を取得する
    updateActivity()
    return createSuccess(authState.value.user)
  }

  const hasRole = (role: string): boolean => {
    return isAuthenticatedState(authState.value) ? authState.value.user.roles.some(r => r.name === role) : false
  }

  const hasPermission = (permission: string): boolean => {
    return isAuthenticatedState(authState.value) ? authState.value.user.permissions.includes(permission) : false
  }

  const updateActivity = (): void => {
    // 最終アクティビティ時刻を更新（状態は変更しない）
    authState.value.lastActivity = Date.now()
  }

  const shouldRefreshToken = (): boolean => {
    if (!isAuthenticatedState(authState.value)) return false
    const tokenAge = Date.now() - authState.value.lastActivity
    const refreshThreshold = 5 * 60 * 1000 // 5分
    return (authState.value.tokens.expiresIn * 1000 - tokenAge) <= refreshThreshold
  }

  const clearError = (): void => {
    if (isErrorState(authState.value)) {
      setState({ status: 'idle', user: null, tokens: null, error: null, lastActivity: Date.now() })
    }
  }

  // ===========================
  // Return Object (Setup Store Pattern)
  // ===========================
  return {
    // State - for direct access (compatible with old API)
    status: computed(() => authState.value.status),
    user: computed(() => authState.value.user),
    tokens: computed(() => authState.value.tokens),
    error: computed(() => authState.value.error),
    lastActivity: computed(() => authState.value.lastActivity),
    
    // Getters
    isAuthenticated,
    isLoading,
    isError,
    permissions,
    roles,
    currentUser,
    currentTokens,
    currentError,
    isTokenExpired,
    isSessionInactive,
    requiresTwoFactor,
    
    // Actions
    login,
    logout,
    refreshToken,
    refreshTokens,
    fetchUser,
    hasRole,
    hasPermission,
    updateActivity,
    shouldRefreshToken,
    clearError
  }
}, {
  persist: {
    key: AUTH_CONFIG.storage.key,
    
    // Setup Store用の永続化設定
    serializer: {
      serialize: (state) => {
        try {
          return JSON.stringify(state)
        } catch (error) {
          console.warn('Failed to serialize auth state:', error)
          return JSON.stringify({ status: 'idle', user: null, tokens: null, error: null, lastActivity: Date.now() })
        }
      },
      deserialize: (value) => {
        try {
          const parsed = JSON.parse(value)
          const result = PersistedAuthStateSchema.safeParse(parsed)
          
          if (!result.success) {
            console.warn('Invalid persisted auth state, resetting to idle:', result.error)
            return { status: 'idle', user: null, tokens: null, error: null, lastActivity: Date.now() }
          }
          
          return result.data
        } catch (error) {
          console.warn('Failed to deserialize auth state, resetting to idle:', error)
          return { status: 'idle', user: null, tokens: null, error: null, lastActivity: Date.now() }
        }
      }
    }
  }
})