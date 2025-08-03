/**
 * 認証設定 - Simple over Easy
 * 設定値の一元管理により、魔法の数値を排除
 */

export const AUTH_CONFIG = {
  // トークン設定
  token: {
    refreshIntervalMs: 5 * 60 * 1000, // 5分
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
  },

  // 永続化設定
  storage: {
    key: 'auth-data',
    storageType: 'localStorage' as const,
  },

  // セッション設定
  session: {
    challengeKey: '2fa-challenge',
    maxInactivityMs: 30 * 60 * 1000, // 30分
  },

  // エラーメッセージ
  messages: {
    loginFailed: 'ログインに失敗しました',
    tokenExpired: 'セッションの有効期限が切れました',
    userNotFound: 'ユーザーが見つかりません',
    networkError: 'ネットワークエラーが発生しました',
    twoFactorRequired: '2要素認証が必要です',
    challengeNotFound: '2要素認証チャレンジが見つかりません',
  },
} as const

/**
 * 環境別設定の型定義
 */
export interface IAuthEnvironmentConfig {
  apiBaseUrl: string
  enableMockAuth: boolean
  enableDebugLogging: boolean
  tokenValidationStrict: boolean
}

/**
 * 環境別設定
 */
export const getAuthEnvironmentConfig = (): IAuthEnvironmentConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
    enableMockAuth: isDevelopment,
    enableDebugLogging: isDevelopment,
    tokenValidationStrict: !isDevelopment,
  }
}

/**
 * JWT設定
 */
export const JWT_CONFIG = {
  algorithms: ['HS256', 'RS256'] as const,
  issuer: 'aster-management',
  audience: 'aster-management-client',
  clockTolerance: 30, // 30秒の時刻ずれを許容
} as const