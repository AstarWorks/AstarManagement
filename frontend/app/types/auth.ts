/**
 * 認証関連の型定義
 */

/**
 * ユーザー情報
 */
export interface IUser {
  id: string
  email: string
  name: string
  roles: IRole[]
  permissions: IPermission[]
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * ロール情報
 */
export interface IRole {
  id: string
  name: string
  displayName: string
  description?: string
  permissions: IPermission[]
}

/**
 * 権限情報
 */
export interface IPermission {
  id: string
  name: string
  displayName: string
  description?: string
  resource: string
  action: string
}

/**
 * JWT認証トークン
 */
export interface IAuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

/**
 * ログインレスポンス
 */
export interface ILoginResponse {
  user: IUser
  tokens: IAuthTokens
  requiresTwoFactor?: boolean
  twoFactorChallenge?: string
}

/**
 * リフレッシュトークンレスポンス
 */
export interface IRefreshTokenResponse {
  tokens: IAuthTokens
}

/**
 * パスワードリセット要求レスポンス
 */
export interface IPasswordResetRequestResponse {
  message: string
  success: boolean
}

/**
 * 2要素認証設定レスポンス
 */
export interface ITwoFactorSetupResponse {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

/**
 * 認証エラー
 */
export interface IAuthError {
  code: string
  message: string
  details?: Record<string, any>
}

/**
 * 認証状態
 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error'

/**
 * 2要素認証状態
 */
export type TwoFactorStatus = 'disabled' | 'pending' | 'enabled' | 'required'

/**
 * 認証コンテキスト
 */
export interface IAuthContext {
  user: User | null
  status: AuthStatus
  twoFactorStatus: TwoFactorStatus
  permissions: string[]
  roles: string[]
  isAuthenticated: boolean
  isLoading: boolean
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAnyRole: (roles: string[]) => boolean
}

/**
 * ログイン資格情報
 */
export interface ILoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
  twoFactorToken?: string
}

/**
 * ユーザー設定
 */
export interface IUserSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'ja' | 'en'
  timezone: string
  notifications: {
    email: boolean
    browser: boolean
    mobile: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'team'
    activityTracking: boolean
  }
}

/**
 * セッション情報
 */
export interface ISessionInfo {
  id: string
  userId: string
  deviceInfo: {
    userAgent: string
    ip: string
    location?: string
  }
  createdAt: string
  lastAccessedAt: string
  expiresAt: string
  isActive: boolean
  isCurrent: boolean
}

/**
 * 監査ログエントリ
 */
export interface IAuditLogEntry {
  id: string
  userId: string
  action: string
  resource: string
  details: Record<string, any>
  ip: string
  userAgent: string
  timestamp: string
  success: boolean
}

/**
 * APIエラーレスポンス
 */
export interface IApiErrorResponse {
  error: {
    code: string
    message: string
    timestamp: string
    path: string
    details?: Record<string, any>
  }
}