/**
 * API設定 - Simple over Easy
 * API関連の設定を一元管理し、魔法の数値と文字列を排除
 */

// 型定義
const RETRYABLE_CODES = [408, 429, 500, 502, 503, 504] as const
const AUTH_ERROR_CODES = [401, 403] as const
const NETWORK_ERROR_CODES = [0, -1, 'NETWORK_ERROR', 'TIMEOUT_ERROR'] as const
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

type RetryableStatusCode = typeof RETRYABLE_CODES[number]
type AuthErrorStatusCode = typeof AUTH_ERROR_CODES[number]
type NetworkErrorCode = typeof NETWORK_ERROR_CODES[number]
type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number]

export const API_CONFIG = {
  // HTTP設定
  http: {
    timeout: 30000, // 30秒
    retryAttempts: 3,
    retryDelay: 1000, // 1秒
    keepAlive: true,
  },

  // ヘッダー設定
  headers: {
    defaultContentType: 'application/json',
    acceptLanguage: 'ja,en',
    userAgent: 'AsterManagement/1.0',
  },

  // 認証設定
  auth: {
    tokenPrefix: 'Bearer',
    refreshEndpoint: '/auth/refresh',
    loginEndpoint: '/auth/login',
    logoutEndpoint: '/auth/logout',
  },

  // エラーハンドリング設定
  errors: {
    retryableCodes: RETRYABLE_CODES,
    authErrorCodes: AUTH_ERROR_CODES,
    networkErrorCodes: NETWORK_ERROR_CODES,
  },

  // キャッシュ設定
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5分
    maxSize: 100, // 最大100エントリ
    gcInterval: 10 * 60 * 1000, // 10分ごとにGC
  },

  // ファイルアップロード設定
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ALLOWED_MIME_TYPES,
    chunkSize: 1024 * 1024, // 1MB chunks
  },

  // API エンドポイント
  endpoints: {
    // 認証関連
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      verify2FA: '/auth/verify-2fa',
      me: '/auth/me',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
    },
    
    // ユーザー管理
    users: {
      list: '/users',
      profile: '/users/profile',
      settings: '/users/settings',
    },
    
    // 案件管理
    cases: {
      list: '/cases',
      create: '/cases',
      detail: (id: string) => `/cases/${id}`,
      update: (id: string) => `/cases/${id}`,
      delete: (id: string) => `/cases/${id}`,
      status: (id: string) => `/cases/${id}/status`,
    },
    
    // クライアント管理
    clients: {
      list: '/clients',
      create: '/clients',
      detail: (id: string) => `/clients/${id}`,
      update: (id: string) => `/clients/${id}`,
      delete: (id: string) => `/clients/${id}`,
    },
    
    // ドキュメント管理
    documents: {
      list: '/documents',
      upload: '/documents/upload',
      download: (id: string) => `/documents/${id}/download`,
      delete: (id: string) => `/documents/${id}`,
    },
  },

  // エラーメッセージ
  messages: {
    networkError: 'ネットワークエラーが発生しました',
    serverError: 'サーバーエラーが発生しました',
    timeoutError: 'リクエストがタイムアウトしました',
    unauthorized: '認証が必要です',
    forbidden: 'アクセス権限がありません',
    notFound: 'リソースが見つかりません',
    validationError: '入力データに問題があります',
    uploadError: 'ファイルのアップロードに失敗しました',
    fileTooLarge: 'ファイルサイズが大きすぎます',
    fileTypeNotAllowed: 'このファイル形式は許可されていません',
  },
} as const

/**
 * 環境別API設定
 */
export interface IApiEnvironmentConfig {
  baseUrl: string
  enableLogging: boolean
  enableRetry: boolean
  enableCache: boolean
  enableMocking: boolean
}

/**
 * 環境別設定を取得
 */
export const getApiEnvironmentConfig = (): IApiEnvironmentConfig => {
  const config = useRuntimeConfig()
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    baseUrl: config.public.apiBaseUrl || 'http://localhost:8080/api/v1',
    enableLogging: isDevelopment,
    enableRetry: true,
    enableCache: !isDevelopment, // 本番でのみキャッシュ有効
    enableMocking: isDevelopment,
  }
}

/**
 * リクエスト用の共通ヘッダーを生成
 */
export const createDefaultHeaders = (
  additionalHeaders: Record<string, string> = {}
): Record<string, string> => {
  return {
    'Content-Type': API_CONFIG.headers.defaultContentType,
    'Accept-Language': API_CONFIG.headers.acceptLanguage,
    'User-Agent': API_CONFIG.headers.userAgent,
    ...additionalHeaders,
  }
}

/**
 * 認証ヘッダーを生成
 */
export const createAuthHeader = (token: string): Record<string, string> => {
  return {
    Authorization: `${API_CONFIG.auth.tokenPrefix} ${token}`,
  }
}

/**
 * 型ガード関数
 */
const isRetryableCode = (code: number | string): code is RetryableStatusCode => {
  return typeof code === 'number' && RETRYABLE_CODES.includes(code as RetryableStatusCode)
}

const isAuthErrorCode = (code: number | string): code is AuthErrorStatusCode => {
  return typeof code === 'number' && AUTH_ERROR_CODES.includes(code as AuthErrorStatusCode)
}

const isNetworkErrorCode = (code: number | string): code is NetworkErrorCode => {
  return NETWORK_ERROR_CODES.includes(code as NetworkErrorCode)
}

/**
 * エラーコードの分類
 */
export const classifyErrorCode = (code: number | string) => {
  return {
    isRetryable: isRetryableCode(code),
    isAuthError: isAuthErrorCode(code),
    isNetworkError: isNetworkErrorCode(code),
  }
}

/**
 * ファイル型の型ガード
 */
const isAllowedMimeType = (mimeType: string): mimeType is AllowedMimeType => {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)
}

/**
 * ファイルサイズとタイプの検証
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > API_CONFIG.upload.maxFileSize) {
    return {
      valid: false,
      error: API_CONFIG.messages.fileTooLarge,
    }
  }
  
  if (!isAllowedMimeType(file.type)) {
    return {
      valid: false,
      error: API_CONFIG.messages.fileTypeNotAllowed,
    }
  }
  
  return { valid: true }
}