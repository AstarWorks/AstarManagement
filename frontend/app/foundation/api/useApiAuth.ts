/**
 * Simple Auth API Client
 * Simple over Easy: 型安全で直接的な認証API、Result型パターンによるエラーハンドリング
 */

import type { 
  ILoginCredentials, 
  ILoginResponse, 
  IRefreshTokenResponse,
  IAuthError,
  Result
} from '~/modules/auth/types/auth'
import { 
  createSuccess,
  createFailure,
  createAuthError
} from '~/modules/auth/types/auth'

/**
 * 認証API専用のコンポーザブル（$fetch直接使用）
 */
export const useApiAuth = () => {

  /**
   * ログイン（Result型パターン）
   */
  const login = async (credentials: ILoginCredentials): Promise<Result<ILoginResponse, IAuthError>> => {
    try {
      const response = await $fetch<ILoginResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      return createSuccess(response)
    } catch (error: unknown) {
      const authError = createAuthError(
        'INVALID_CREDENTIALS',
        (error as Error)?.message || 'Login failed',
        { originalError: error }
      )
      return createFailure(authError)
    }
  }

  /**
   * ログアウト（Result型パターン）
   */
  const logout = async (): Promise<Result<void, IAuthError>> => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
      return createSuccess(undefined)
    } catch (error: unknown) {
      const authError = createAuthError(
        'NETWORK_ERROR',
        (error as Error)?.message || 'Logout failed',
        { originalError: error }
      )
      return createFailure(authError)
    }
  }

  /**
   * トークンリフレッシュ（Result型パターン）
   */
  const refreshToken = async (refreshToken: string): Promise<Result<IRefreshTokenResponse, IAuthError>> => {
    try {
      const response = await $fetch<IRefreshTokenResponse>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken }
      })
      return createSuccess(response)
    } catch (error: unknown) {
      const authError = createAuthError(
        'TOKEN_EXPIRED',
        (error as Error)?.message || 'Token refresh failed',
        { originalError: error }
      )
      return createFailure(authError)
    }
  }

  /**
   * 2要素認証確認（Result型パターン）
   */
  const verifyTwoFactor = async (challenge: string, token: string): Promise<Result<ILoginResponse, IAuthError>> => {
    try {
      const response = await $fetch<ILoginResponse>('/api/auth/verify-2fa', {
        method: 'POST',
        body: { challenge, token }
      })
      return createSuccess(response)
    } catch (error: unknown) {
      const authError = createAuthError(
        'INVALID_CREDENTIALS',
        (error as Error)?.message || '2FA verification failed',
        { originalError: error }
      )
      return createFailure(authError)
    }
  }

  /**
   * パスワードリセット要求（Result型パターン）
   */
  const forgotPassword = async (email: string): Promise<Result<{ message: string }, IAuthError>> => {
    try {
      const response = await $fetch<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: { email }
      })
      return createSuccess(response)
    } catch (error: unknown) {
      const authError = createAuthError(
        'NETWORK_ERROR',
        (error as Error)?.message || 'Password reset request failed',
        { originalError: error }
      )
      return createFailure(authError)
    }
  }

  /**
   * パスワードリセット実行（Result型パターン）
   */
  const resetPassword = async (token: string, password: string): Promise<Result<{ message: string }, IAuthError>> => {
    try {
      const response = await $fetch<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password }
      })
      return createSuccess(response)
    } catch (error: unknown) {
      const authError = createAuthError(
        'INVALID_CREDENTIALS',
        (error as Error)?.message || 'Password reset failed',
        { originalError: error }
      )
      return createFailure(authError)
    }
  }

  /**
   * 現在のユーザー情報取得（Result型パターン）
   */
  const getCurrentUser = async (): Promise<Result<ILoginResponse['user'], IAuthError>> => {
    try {
      const user = await $fetch<ILoginResponse['user']>('/api/auth/me')
      return createSuccess(user)
    } catch (error: unknown) {
      const authError = createAuthError(
        'TOKEN_EXPIRED',
        (error as Error)?.message || 'Failed to get current user',
        { originalError: error }
      )
      return createFailure(authError)
    }
  }

  return {
    login,
    logout,
    refreshToken,
    verifyTwoFactor,
    forgotPassword,
    resetPassword,
    getCurrentUser,
  }
}