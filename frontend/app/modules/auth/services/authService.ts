/**
 * 認証サービス抽象化 - Simple over Easy
 * API実装の詳細を隠蔽し、モック/実API の切り替えを可能にする
 */

import { AUTH_CONFIG, getAuthEnvironmentConfig } from '~/foundation/config/authConfig'
import type { 
  ILoginCredentials, 
  ILoginResponse, 
  IRefreshTokenResponse,
  IUser,
  IAuthTokens
} from '~/modules/auth/types/auth'
import { z } from 'zod'

/**
 * API レスポンススキーマ
 */
const LoginResponseSchema = z.object({
  user: z.unknown().optional(), // IUser構造は複雑なので unknown で一旦
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    tokenType: z.literal('Bearer'),
  }).optional(),
  requiresTwoFactor: z.boolean().optional(),
  twoFactorChallenge: z.string().optional(),
})

const RefreshTokenResponseSchema = z.object({
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    tokenType: z.literal('Bearer'),
  }),
})

/**
 * 認証サービスのインターフェース
 */
export interface IAuthService {
  login(credentials: ILoginCredentials): Promise<ILoginResponse>
  logout(): Promise<void>
  refreshToken(refreshToken: string): Promise<IRefreshTokenResponse>
  verify2FA(challenge: string, token: string): Promise<ILoginResponse>
  getCurrentUser(): Promise<IUser | null>
}

/**
 * 実際のAPI実装
 */
class ProductionAuthService implements IAuthService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async login(credentials: ILoginCredentials): Promise<ILoginResponse> {
    const response = await $fetch<unknown>('/auth/login', {
      baseURL: this.baseUrl,
      method: 'POST',
      body: credentials,
    })

    const validatedResponse = LoginResponseSchema.parse(response)
    
    return {
      user: validatedResponse.user as IUser,
      tokens: validatedResponse.tokens as IAuthTokens,
      requiresTwoFactor: validatedResponse.requiresTwoFactor,
      twoFactorChallenge: validatedResponse.twoFactorChallenge,
    }
  }

  async logout(): Promise<void> {
    await $fetch('/auth/logout', {
      baseURL: this.baseUrl,
      method: 'POST',
    })
  }

  async refreshToken(refreshToken: string): Promise<IRefreshTokenResponse> {
    const response = await $fetch<unknown>('/auth/refresh', {
      baseURL: this.baseUrl,
      method: 'POST',
      body: { refreshToken },
    })

    const validatedResponse = RefreshTokenResponseSchema.parse(response)
    
    return {
      tokens: validatedResponse.tokens as IAuthTokens,
    }
  }

  async verify2FA(challenge: string, token: string): Promise<ILoginResponse> {
    const response = await $fetch<unknown>('/auth/verify-2fa', {
      baseURL: this.baseUrl,
      method: 'POST',
      body: { challenge, token },
    })

    const validatedResponse = LoginResponseSchema.parse(response)
    
    return {
      user: validatedResponse.user as IUser,
      tokens: validatedResponse.tokens as IAuthTokens,
    }
  }

  async getCurrentUser(): Promise<IUser | null> {
    try {
      const user = await $fetch<IUser>('/auth/me', {
        baseURL: this.baseUrl,
        method: 'GET',
      })
      return user
    } catch {
      return null
    }
  }
}

/**
 * モック実装（開発用）
 */
class MockAuthService implements IAuthService {
  private mockAuthService: ReturnType<typeof import('./mockAuth').MockAuthService.getInstance> | null

  constructor() {
    // 動的インポートで循環依存を回避
    this.mockAuthService = null
  }

  private async getMockService() {
    if (!this.mockAuthService) {
      const { mockAuthService } = await import('./mockAuth')
      this.mockAuthService = mockAuthService
    }
    return this.mockAuthService
  }

  async login(credentials: ILoginCredentials): Promise<ILoginResponse> {
    const service = await this.getMockService()
    return service.login(credentials)
  }

  async logout(): Promise<void> {
    const service = await this.getMockService()
    return service.logout()
  }

  async refreshToken(refreshToken: string): Promise<IRefreshTokenResponse> {
    const service = await this.getMockService()
    return service.refreshToken(refreshToken)
  }

  async verify2FA(challenge: string, token: string): Promise<ILoginResponse> {
    const service = await this.getMockService()
    return service.verify2FA(challenge, token)
  }

  async getCurrentUser(): Promise<IUser | null> {
    // モック実装では直接ユーザー情報を返す
    return null
  }
}

/**
 * 認証サービスファクトリー（モジュールパターン）
 */
let authServiceInstance: IAuthService | null = null

const AuthServiceFactory = {
  getAuthService(): IAuthService {
    if (!authServiceInstance) {
      const config = getAuthEnvironmentConfig()
      
      if (config.enableMockAuth) {
        authServiceInstance = new MockAuthService()
      } else {
        authServiceInstance = new ProductionAuthService(config.apiBaseUrl)
      }
    }
    
    return authServiceInstance
  },

  // テスト用: インスタンスをリセット
  resetInstance(): void {
    authServiceInstance = null
  },

  // テスト用: モックサービスを強制設定
  setMockService(): void {
    authServiceInstance = new MockAuthService()
  }
}

/**
 * 認証サービスインスタンスを取得
 */
export const getAuthService = (): IAuthService => {
  return AuthServiceFactory.getAuthService()
}

/**
 * 認証エラーのハンドリング
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'AuthError'
  }

  static fromFetchError(error: { statusCode?: number; message?: string }): AuthError {
    if (error.statusCode === 401) {
      return new AuthError(
        AUTH_CONFIG.messages.tokenExpired,
        'TOKEN_EXPIRED',
        401,
        error
      )
    }
    
    if (error.statusCode === 404) {
      return new AuthError(
        AUTH_CONFIG.messages.userNotFound,
        'USER_NOT_FOUND',
        404,
        error
      )
    }
    
    if (error.statusCode && error.statusCode >= 500) {
      return new AuthError(
        AUTH_CONFIG.messages.networkError,
        'NETWORK_ERROR',
        error.statusCode,
        error
      )
    }
    
    return new AuthError(
      error.message || AUTH_CONFIG.messages.loginFailed,
      'UNKNOWN_ERROR',
      error.statusCode,
      error
    )
  }
}

/**
 * 認証サービスのコンポーザブル
 */
export const useAuthService = () => {
  const authService = getAuthService()

  /**
   * エラーハンドリング付きのログイン
   */
  const login = async (credentials: ILoginCredentials): Promise<ILoginResponse> => {
    try {
      return await authService.login(credentials)
    } catch (error) {
      throw AuthError.fromFetchError(error as { statusCode?: number; message?: string })
    }
  }

  /**
   * エラーハンドリング付きのログアウト
   */
  const logout = async (): Promise<void> => {
    try {
      await authService.logout()
    } catch (error) {
      // ログアウトエラーは通常無視するが、ログは出力
      console.warn('Logout service error:', error)
    }
  }

  /**
   * エラーハンドリング付きのトークンリフレッシュ
   */
  const refreshToken = async (refreshToken: string): Promise<IRefreshTokenResponse> => {
    try {
      return await authService.refreshToken(refreshToken)
    } catch (error) {
      throw AuthError.fromFetchError(error as { statusCode?: number; message?: string })
    }
  }

  /**
   * エラーハンドリング付きの2要素認証
   */
  const verify2FA = async (challenge: string, token: string): Promise<ILoginResponse> => {
    try {
      return await authService.verify2FA(challenge, token)
    } catch (error) {
      throw AuthError.fromFetchError(error as { statusCode?: number; message?: string })
    }
  }

  return {
    login,
    logout,
    refreshToken,
    verify2FA,
  }
}