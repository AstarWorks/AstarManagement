/**
 * 認証関連の型定義
 * Case.tsのパターンを参考にした型安全設計
 */

/**
 * ユーザー情報
 */
export interface IUser {
  id: string
  email: string
  name: string
  nameKana: string
  roles: IRole[]
  permissions: string[]
  avatar: string | null
  firmId: string
  firmName: string
  isActive: boolean
  twoFactorEnabled: boolean
  lastLoginAt: Date
  profile: {
    barNumber?: string
    department?: string
    specialization?: string[]
    phone: string
    extension?: string
    hireDate?: string
    clientType?: 'individual' | 'corporate'
    company?: string | null
    emergencyContact?: {
      name: string
      relationship: string
      phone: string
    }
  }
  preferences: {
    language: string
    timezone: string
    theme: string
    notifications: {
      email: boolean
      browser: boolean
      mobile: boolean
    }
  }
}

/**
 * ロール情報
 */
export interface IRole {
  id: string
  name: string
  displayName: string
  description?: string
  isSystemRole: boolean
  permissions: string[]
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
  scope: string
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
 * ストア用認証トークン（作成時刻付き）
 */
export interface IAuthTokensWithTimestamp extends IAuthTokens {
  createdAt: number
}

/**
 * 認証エラー型（型安全なエラーハンドリング）
 */
export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR'
  message: string
  details?: Record<string, unknown>
}

/**
 * 認証状態の有限状態機械（Discriminated Union）
 * case.tsのパターンを参考にした型安全な状態管理
 */
export type AuthState = 
  | { status: 'idle'; user: null; tokens: null; error: null; lastActivity: number }
  | { status: 'loading'; user: null; tokens: null; error: null; lastActivity: number }
  | { status: 'authenticated'; user: IUser; tokens: IAuthTokensWithTimestamp; error: null; lastActivity: number }
  | { status: 'unauthenticated'; user: null; tokens: null; error: null; lastActivity: number }
  | { status: 'error'; user: null; tokens: null; error: AuthError; lastActivity: number }

/**
 * Result型パターン（関数型プログラミング由来）
 */
export type Result<T, E = AuthError> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * API レスポンス型（型安全な非同期処理）
 */
export type AuthApiResponse<T> = Promise<Result<T, AuthError>>

/**
 * 認証状態遷移ルール（case.tsパターン）
 */
export const VALID_AUTH_STATE_TRANSITIONS: Record<AuthState['status'], AuthState['status'][]> = {
  idle: ['loading'],
  loading: ['authenticated', 'unauthenticated', 'error'],
  authenticated: ['loading', 'unauthenticated', 'error'],
  unauthenticated: ['loading'],
  error: ['loading', 'idle']
} as const

/**
 * 型ガード関数群（case.tsパターン）
 */
export function isAuthenticatedState(state: AuthState): state is Extract<AuthState, { status: 'authenticated' }> {
  return state.status === 'authenticated'
}

export function isLoadingState(state: AuthState): state is Extract<AuthState, { status: 'loading' }> {
  return state.status === 'loading'
}

export function isErrorState(state: AuthState): state is Extract<AuthState, { status: 'error' }> {
  return state.status === 'error'
}

export function isUnauthenticatedState(state: AuthState): state is Extract<AuthState, { status: 'unauthenticated' }> {
  return state.status === 'unauthenticated'
}

export function isIdleState(state: AuthState): state is Extract<AuthState, { status: 'idle' }> {
  return state.status === 'idle'
}

/**
 * ヘルパー関数群（case.tsパターン）
 */
export function isValidAuthStateTransition(from: AuthState['status'], to: AuthState['status']): boolean {
  return VALID_AUTH_STATE_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextAvailableAuthStates(currentStatus: AuthState['status']): AuthState['status'][] {
  return VALID_AUTH_STATE_TRANSITIONS[currentStatus] ?? []
}

export function createAuthError(code: AuthError['code'], message: string, details?: Record<string, unknown>): AuthError {
  return { code, message, details }
}

/**
 * Result型のヘルパー関数
 */
export function createSuccess<T>(data: T): Result<T, never> {
  return { success: true, data }
}

export function createFailure<E>(error: E): Result<never, E> {
  return { success: false, error }
}

export function isSuccess<T, E>(result: Result<T, E>): result is Extract<Result<T, E>, { success: true }> {
  return result.success === true
}

export function isFailure<T, E>(result: Result<T, E>): result is Extract<Result<T, E>, { success: false }> {
  return result.success === false
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
  user: IUser | null
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

// Type aliases for backwards compatibility and clarity
export type User = IUser
export type Role = IRole
export type Permission = IPermission
export type AuthTokens = IAuthTokens
export type LoginResponse = ILoginResponse
export type RefreshTokenResponse = IRefreshTokenResponse
export type PasswordResetRequestResponse = IPasswordResetRequestResponse
export type TwoFactorSetupResponse = ITwoFactorSetupResponse
export type AuthContext = IAuthContext
export type LoginCredentials = ILoginCredentials
export type UserSettings = IUserSettings
export type SessionInfo = ISessionInfo
export type AuditLogEntry = IAuditLogEntry
export type ApiErrorResponse = IApiErrorResponse