---
task_id: T02_S01_Authentication_System_UI
status: completed
priority: Critical
dependencies: T01_S01_Nuxt3_Project_Foundation
sprint: S01_M001_FRONTEND_MVP
updated: 2025-07-24 12:50
completed_date: 2025-07-24
---

# T02_S01 - Authentication System UI

## Task Overview
**Duration**: 8 hours  
**Priority**: Critical  
**Dependencies**: T01_S01_Nuxt3_Project_Foundation  
**Sprint**: S01_M001_FRONTEND_MVP  

## Objective
Implement complete authentication user interface including login form, user menu, route protection, and mock authentication service for the legal practice management system with Japanese UI support.

## Background
This task creates the authentication foundation that enables users to access the legal practice management system. The implementation must use mock data to demonstrate realistic authentication flows while providing a polished user experience suitable for Japanese law firms.

## Technical Requirements

### 1. Login Form Component
Create responsive login form with validation:

**Location**: `components/auth/LoginForm.vue`

**Features Required**:
- Email and password input fields with Japanese labels
- Form validation using VeeValidate + Zod
- Loading states during authentication
- Error handling with user-friendly messages
- "Remember me" functionality
- Responsive design for mobile devices

### 2. Authentication Layout
Protected and public layout systems:

**Components to Create**:
- `layouts/auth.vue` - Layout for login/register pages
- `layouts/default.vue` - Main application layout
- `middleware/auth.ts` - Route protection middleware
- `pages/login.vue` - Login page implementation

### 3. User Menu & Navigation
User session management UI:

**Location**: `components/layout/UserMenu.vue`

**Features**:
- User avatar and name display
- Role badge (弁護士/事務員/依頼者)
- Account settings access
- Logout functionality
- Dropdown menu with accessibility

### 4. Mock Authentication Service
Realistic authentication simulation:

**Service Features**:
- Mock user database with different roles
- JWT token simulation (client-side only)
- Session persistence with localStorage
- Realistic response delays
- Error scenarios for testing

## 設計詳細

### 1. フォーム検証戦略 (VeeValidate + Zod + 多言語対応)

#### 型安全な多言語バリデーション

```typescript
// composables/useLoginValidation.ts
export const useLoginValidation = () => {
  const { t } = useI18n()
  
  // 日本の法律事務所向けメールバリデーション
  const emailValidation = z.string()
    .min(1, () => t('auth.validation.email.required'))
    .email(() => t('auth.validation.email.invalid'))
    .refine(
      email => {
        // 日本の法律事務所でよく使われるドメイン
        const allowedDomains = ['.co.jp', '.com', '.jp', '.or.jp', '.ne.jp']
        return allowedDomains.some(domain => email.endsWith(domain))
      },
      () => t('auth.validation.email.domain')
    )
    .refine(
      email => email.length <= 254, // RFC標準
      () => t('auth.validation.email.tooLong')
    )
  
  // セキュアなパスワード要件
  const passwordValidation = z.string()
    .min(1, () => t('auth.validation.password.required'))
    .min(8, () => t('auth.validation.password.minLength'))
    .max(128, () => t('auth.validation.password.maxLength'))
    .refine(
      password => /[A-Z]/.test(password),
      () => t('auth.validation.password.uppercase')
    )
    .refine(
      password => /[a-z]/.test(password),
      () => t('auth.validation.password.lowercase')
    )
    .refine(
      password => /[0-9]/.test(password),
      () => t('auth.validation.password.number')
    )
    .refine(
      password => /[!@#$%^&*(),.?":{}|<>]/.test(password),
      () => t('auth.validation.password.special')
    )
  
  const loginSchema = toTypedSchema(z.object({
    email: emailValidation,
    password: passwordValidation,
    rememberMe: z.boolean().default(false)
  }))
  
  return { loginSchema }
}
```

#### 多言語バリデーションメッセージ

```typescript
// locales/ja.ts に追加
export const ja = {
  // 既存の内容...
  auth: {
    validation: {
      email: {
        required: 'メールアドレスを入力してください',
        invalid: '有効なメールアドレスを入力してください',
        domain: '有効なドメイン(.co.jp, .com等)を使用してください',
        tooLong: 'メールアドレスが長すぎます'
      },
      password: {
        required: 'パスワードを入力してください',
        minLength: 'パスワードは8文字以上で入力してください',
        maxLength: 'パスワードは128文字以下で入力してください',
        uppercase: '大文字を1文字以上含めてください',
        lowercase: '小文字を1文字以上含めてください',
        number: '数字を1文字以上含めてください',
        special: '記号を1文字以上含めてください'
      }
    },
    form: {
      title: 'ログイン',
      description: '法律事務所管理システムにログインしてください',
      email: 'メールアドレス',
      emailPlaceholder: 'example@lawfirm.co.jp',
      password: 'パスワード',
      passwordShow: 'パスワードを表示',
      passwordHide: 'パスワードを非表示',
      passwordRequirements: '8文字以上、大文字・小文字・数字・記号を含む',
      rememberMe: 'ログイン情報を記憶する',
      login: 'ログイン',
      loggingIn: 'ログイン中...'
    },
    error: {
      title: 'ログインエラー',
      network: 'ネットワークエラーが発生しました',
      server: 'サーバーエラーが発生しました',
      authentication: 'メールアドレスまたはパスワードが正しくありません',
      unknown: '予期しないエラーが発生しました'
    }
  }
} as const

// locales/en.ts
export const en = {
  auth: {
    validation: {
      email: {
        required: 'Email address is required',
        invalid: 'Please enter a valid email address',
        domain: 'Please use a valid domain (.co.jp, .com, etc.)',
        tooLong: 'Email address is too long'
      },
      password: {
        required: 'Password is required',
        minLength: 'Password must be at least 8 characters',
        maxLength: 'Password must be 128 characters or less',
        uppercase: 'Must include at least one uppercase letter',
        lowercase: 'Must include at least one lowercase letter',
        number: 'Must include at least one number',
        special: 'Must include at least one special character'
      }
    },
    form: {
      title: 'Login',
      description: 'Please log in to the legal practice management system',
      email: 'Email Address',
      emailPlaceholder: 'example@lawfirm.co.jp',
      password: 'Password',
      passwordShow: 'Show password',
      passwordHide: 'Hide password',
      passwordRequirements: '8+ chars, uppercase, lowercase, number, symbol',
      rememberMe: 'Remember me',
      login: 'Login',
      loggingIn: 'Logging in...'
    },
    error: {
      title: 'Login Error',
      network: 'Network error occurred',
      server: 'Server error occurred',
      authentication: 'Invalid email or password',
      unknown: 'An unexpected error occurred'
    }
  }
} as const

// locales/zh.ts (中国語対応)
export const zh = {
  auth: {
    validation: {
      email: {
        required: '请输入邮箱地址',
        invalid: '请输入有效的邮箱地址',
        domain: '请使用有效域名(.co.jp, .com等)',
        tooLong: '邮箱地址过长'
      },
      password: {
        required: '请输入密码',
        minLength: '密码至少需要8个字符',
        maxLength: '密码不能超过128个字符',
        uppercase: '必须包含至少一个大写字母',
        lowercase: '必须包含至少一个小写字母',
        number: '必须包含至少一个数字',
        special: '必须包含至少一个特殊字符'
      }
    },
    form: {
      title: '登录',
      description: '请登录法律事务所管理系统',
      email: '邮箱地址',
      emailPlaceholder: 'example@lawfirm.co.jp',
      password: '密码',
      passwordShow: '显示密码',
      passwordHide: '隐藏密码',
      passwordRequirements: '8位以上，包含大小写字母、数字、符号',
      rememberMe: '记住登录信息',
      login: '登录',
      loggingIn: '登录中...'
    },
    error: {
      title: '登录错误',
      network: '网络错误',
      server: '服务器错误',
      authentication: '邮箱或密码错误',
      unknown: '发生未知错误'
    }
  }
} as const
```

### 2. エラーハンドリング強化設計

#### 明示的エラー型定義

```typescript
// types/error.ts - エラー型の明示化
interface AuthError {
  type: 'VALIDATION' | 'NETWORK' | 'SERVER' | 'AUTHENTICATION'
  message: string
  details?: string
  code?: string
}

class AuthenticationError extends Error {
  constructor(
    public type: AuthError['type'],
    message: string,
    public details?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

// composables/useAuthError.ts - エラー処理の統一化
export const useAuthError = () => {
  const { t } = useI18n()
  
  const createAuthError = (
    type: AuthError['type'], 
    key: string, 
    fallback?: string
  ): AuthenticationError => {
    const message = t(key) || fallback || t('auth.error.unknown')
    return new AuthenticationError(type, message)
  }
  
  const handleAuthError = (error: unknown): AuthenticationError => {
    if (error instanceof AuthenticationError) {
      return error
    }
    
    if (error instanceof Error) {
      // ネットワークエラーの判定
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return createAuthError('NETWORK', 'auth.error.network')
      }
      
      // サーバーエラーの判定
      if (error.message.includes('server') || error.message.includes('5')) {
        return createAuthError('SERVER', 'auth.error.server')
      }
      
      // 認証エラーの判定
      if (error.message.includes('401') || error.message.includes('auth')) {
        return createAuthError('AUTHENTICATION', 'auth.error.authentication')
      }
      
      // その他のエラー
      return createAuthError('SERVER', 'auth.error.server')
    }
    
    // 未知のエラー - これは絶対に避けたい状況
    console.error('Unknown error type:', error)
    return createAuthError('SERVER', 'auth.error.unknown')
  }
  
  return { createAuthError, handleAuthError }
}
```

### 2. Mock認証データ設計 (改善版)

#### 責任分離による設計改善

```typescript
// config/authConfig.ts - 設定値の外部化
export const AUTH_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION_MINUTES: 15,
  TOKEN_EXPIRES_HOURS: 24,
  SESSION_HISTORY_LIMIT: 10,
  NETWORK_DELAY_RANGE: { min: 500, max: 1500 },
  JWT_ALGORITHM: 'mock' // 本番環境では実際のアルゴリズム
} as const

// types/auth.ts - 型安全性の強化
interface MockUser {
  id: string
  email: string
  password: string
  name: string
  nameKana: string
  role: UserRole
  avatar?: string
  firmId: string
  isActive: boolean
  permissions: Permission[]
  profile: UserProfile
  loginHistory: LoginRecord[]
}

interface UserProfile {
  barNumber?: string
  department?: string
  specialization?: string[]
  phone: string
  extension?: string
  hireDate: string
  emergencyContact?: ContactInfo
}

// エラーハンドリングの型安全性向上
type AuthResult<T> = 
  | { success: true; data: T }
  | { success: false; error: AuthenticationError }

interface LoginAttempt {
  timestamp: number
  success: boolean
  ipAddress: string
}

interface MockJWTPayload {
  userId: string
  email: string
  role: UserRole
  firmId: string
  permissions: Permission[]
  iat: number
  exp: number
  sessionId: string
}
```

#### 責任を分離したサービス設計

```typescript
// services/auth/SessionManager.ts - セッション管理専用
export class SessionManager {
  private sessions = new Map<string, MockJWTPayload>()

  create(user: MockUser): string {
    const payload: MockJWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (AUTH_CONFIG.TOKEN_EXPIRES_HOURS * 60 * 60),
      sessionId: this.generateSessionId()
    }

    const token = this.encodePayload(payload)
    this.sessions.set(payload.sessionId, payload)
    return token
  }

  validate(token: string): AuthResult<MockJWTPayload> {
    try {
      const payload = this.decodePayload(token)
      
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return { success: false, error: new AuthenticationError('AUTHENTICATION', 'トークンが期限切れです') }
      }

      if (!this.sessions.has(payload.sessionId)) {
        return { success: false, error: new AuthenticationError('AUTHENTICATION', 'セッションが見つかりません') }
      }

      return { success: true, data: payload }
    } catch (error) {
      return { success: false, error: new AuthenticationError('AUTHENTICATION', 'トークンが無効です') }
    }
  }

  revoke(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  private generateSessionId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private encodePayload(payload: MockJWTPayload): string {
    return btoa(JSON.stringify(payload))
  }

  private decodePayload(token: string): MockJWTPayload {
    return JSON.parse(atob(token))
  }
}

// services/auth/LoginRateLimiter.ts - ログイン試行制限専用
export class LoginRateLimiter {
  private attempts = new Map<string, LoginAttempt[]>()

  canAttempt(email: string): boolean {
    const userAttempts = this.getRecentAttempts(email)
    const failedAttempts = userAttempts.filter(attempt => !attempt.success)
    return failedAttempts.length < AUTH_CONFIG.MAX_LOGIN_ATTEMPTS
  }

  recordAttempt(email: string, success: boolean, ipAddress: string): void {
    const attempts = this.attempts.get(email) || []
    attempts.push({
      timestamp: Date.now(),
      success,
      ipAddress
    })

    // 古い記録を削除 (24時間以上前)
    const filtered = attempts.filter(
      attempt => Date.now() - attempt.timestamp < 24 * 60 * 60 * 1000
    )

    this.attempts.set(email, filtered)
  }

  getRemainingLockoutTime(email: string): number {
    const recentAttempts = this.getRecentAttempts(email)
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success)
    
    if (failedAttempts.length < AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
      return 0
    }

    const lastFailedAttempt = Math.max(...failedAttempts.map(a => a.timestamp))
    const lockoutEnd = lastFailedAttempt + (AUTH_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000)
    
    return Math.max(0, lockoutEnd - Date.now())
  }

  private getRecentAttempts(email: string): LoginAttempt[] {
    const attempts = this.attempts.get(email) || []
    const cutoff = Date.now() - (AUTH_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000)
    return attempts.filter(attempt => attempt.timestamp > cutoff)
  }
}

// services/auth/LoginAuditLogger.ts - ログイン監査専用
export class LoginAuditLogger {
  logLoginAttempt(user: MockUser | null, success: boolean, ipAddress: string, userAgent: string): void {
    const logEntry: LoginRecord = {
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      success,
      failureReason: success ? undefined : 'Invalid credentials'
    }

    if (user && success) {
      // 成功時のみユーザーの履歴に追加
      user.loginHistory.unshift(logEntry)
      user.loginHistory = user.loginHistory.slice(0, AUTH_CONFIG.SESSION_HISTORY_LIMIT)
    }

    // システム監査ログ (実際の環境では外部ログシステムに送信)
    console.log('[AUTH_AUDIT]', {
      userId: user?.id,
      email: user?.email,
      success,
      timestamp: logEntry.timestamp,
      ipAddress,
      userAgent
    })
  }
}
```

#### 改善されたメイン認証サービス

```typescript
// services/auth/MockAuthService.ts - メイン認証サービス
export class MockAuthService {
  private sessionManager = new SessionManager()
  private rateLimiter = new LoginRateLimiter()
  private auditLogger = new LoginAuditLogger()
  private networkSimulator = new NetworkSimulator()
  private userRepository = new MockUserRepository()

  async login(credentials: LoginCredentials): Promise<AuthResult<AuthResponse>> {
    await this.networkSimulator.simulateDelay()

    const { email, password, rememberMe } = credentials
    const ipAddress = this.getClientIP()

    try {
      // レート制限チェック
      if (!this.rateLimiter.canAttempt(email)) {
        const remainingTime = this.rateLimiter.getRemainingLockoutTime(email)
        throw new AuthenticationError(
          'AUTHENTICATION',
          'アカウントが一時的にロックされています',
          `${Math.ceil(remainingTime / 60000)}分後に再試行してください`
        )
      }

      // ユーザー検証
      const userResult = this.userRepository.findByEmail(email)
      if (!userResult.success) {
        this.rateLimiter.recordAttempt(email, false, ipAddress)
        this.auditLogger.logLoginAttempt(null, false, ipAddress, navigator.userAgent)
        return { success: false, error: userResult.error }
      }

      const user = userResult.data
      
      // パスワード検証
      if (!this.verifyPassword(password, user.password)) {
        this.rateLimiter.recordAttempt(email, false, ipAddress)
        this.auditLogger.logLoginAttempt(user, false, ipAddress, navigator.userAgent)
        throw new AuthenticationError('AUTHENTICATION', 'メールアドレスまたはパスワードが正しくありません')
      }

      // 非活性ユーザーチェック
      if (!user.isActive) {
        throw new AuthenticationError('AUTHENTICATION', 'アカウントが無効です')
      }

      // ログイン成功
      this.rateLimiter.recordAttempt(email, true, ipAddress)
      this.auditLogger.logLoginAttempt(user, true, ipAddress, navigator.userAgent)
      
      const token = this.sessionManager.create(user)
      const sessionResult = this.sessionManager.validate(token)
      
      if (!sessionResult.success) {
        throw new AuthenticationError('SERVER', 'セッション作成に失敗しました')
      }

      return {
        success: true,
        data: {
          success: true,
          user: this.sanitizeUser(user),
          token,
          expiresIn: AUTH_CONFIG.TOKEN_EXPIRES_HOURS * 60 * 60,
          sessionId: sessionResult.data.sessionId,
          rememberMe
        }
      }

    } catch (error) {
      if (error instanceof AuthenticationError) {
        return { success: false, error }
      }
      return { success: false, error: new AuthenticationError('SERVER', '認証処理中にエラーが発生しました') }
    }
  }

  async logout(): Promise<AuthResult<void>> {
    try {
      await this.networkSimulator.simulateDelay(300)
      
      const token = this.getCurrentToken()
      if (token) {
        const sessionResult = this.sessionManager.validate(token)
        if (sessionResult.success) {
          this.sessionManager.revoke(sessionResult.data.sessionId)
        }
      }

      this.clearLocalStorage()
      return { success: true, data: undefined }
      
    } catch (error) {
      return { success: false, error: new AuthenticationError('SERVER', 'ログアウト処理に失敗しました') }
    }
  }

  async validateToken(token: string): Promise<AuthResult<MockJWTPayload>> {
    await this.networkSimulator.simulateDelay(200)
    return this.sessionManager.validate(token)
  }

  private verifyPassword(inputPassword: string, storedPassword: string): boolean {
    // 実際の環境では適切なハッシュ検証を実装
    return inputPassword === storedPassword
  }

  private sanitizeUser(user: MockUser): User {
    const { password, ...sanitized } = user
    return {
      ...sanitized,
      profile: {
        ...user.profile,
        emergencyContact: undefined // 機密情報除去
      }
    }
  }

  private getCurrentToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth-token')
  }

  private getClientIP(): string {
    return '192.168.1.' + Math.floor(Math.random() * 255)
  }

  private clearLocalStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user-data')
    }
  }
}
```

#### テスト支援ユーティリティ

```typescript
// services/auth/__tests__/AuthTestUtils.ts - テスト専用ユーティリティ
export class AuthTestUtils {
  static createTestUser(overrides?: Partial<MockUser>): MockUser {
    const defaultUser: MockUser = {
      id: `test-user-${Date.now()}`,
      email: 'test@example.com',
      password: 'TestPass123!',
      name: 'テスト太郎',
      nameKana: 'テストタロウ',
      role: 'lawyer',
      firmId: 'test-firm-001',
      isActive: true,
      permissions: [
        { resource: 'cases', action: 'read', scope: 'own' }
      ],
      profile: {
        department: 'テスト部',
        specialization: ['テスト業務'],
        phone: '03-0000-0000',
        hireDate: '2024-01-01'
      },
      loginHistory: []
    }

    return { ...defaultUser, ...overrides }
  }

  static createMockCredentials(valid: boolean = true): LoginCredentials {
    return {
      email: valid ? 'tanaka@astellaw.co.jp' : 'invalid@example.com',
      password: valid ? 'SecurePass123!' : 'wrongpassword',
      rememberMe: false
    }
  }

  static createTestScenario(scenario: string): Promise<AuthResult<any>> {
    const mockService = new MockAuthService()
    
    switch (scenario) {
      case 'successful_login':
        return mockService.login(this.createMockCredentials(true))
      
      case 'failed_login':
        return mockService.login(this.createMockCredentials(false))
      
      case 'rate_limited':
        // 3回失敗試行を再現
        return this.simulateRateLimit(mockService)
      
      default:
        throw new Error(`Unknown test scenario: ${scenario}`)
    }
  }

  private static async simulateRateLimit(service: MockAuthService): Promise<AuthResult<any>> {
    const invalidCredentials = this.createMockCredentials(false)
    
    // 3回失敗させる
    await service.login(invalidCredentials)
    await service.login(invalidCredentials)
    await service.login(invalidCredentials)
    
    // 4回目でレート制限を確認
    return service.login(invalidCredentials)
  }
}

// __tests__/mockAuthService.test.ts - ユニットテストサンプル
describe('MockAuthService', () => {
  let authService: MockAuthService
  
  beforeEach(() => {
    authService = new MockAuthService()
  })

  describe('login', () => {
    it('should successfully authenticate valid user', async () => {
      const credentials = AuthTestUtils.createMockCredentials(true)
      const result = await authService.login(credentials)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.user.email).toBe(credentials.email)
        expect(result.data.token).toBeDefined()
      }
    })

    it('should reject invalid credentials', async () => {
      const credentials = AuthTestUtils.createMockCredentials(false)
      const result = await authService.login(credentials)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('AUTHENTICATION')
      }
    })

    it('should enforce rate limiting', async () => {
      const result = await AuthTestUtils.createTestScenario('rate_limited')
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('ロックされています')
      }
    })
  })
})
```

#### Storybook統合の改善

```typescript
// stories/__mocks__/authMocks.ts - Storybook用改善版
export const StorybookAuthMocks = {
  // 基本ユーザーデータ
  users: {
    lawyer: AuthTestUtils.createTestUser({
      role: 'lawyer',
      name: '田中太郎',
      permissions: [
        { resource: 'cases', action: 'manage', scope: 'all' }
      ]
    }),
    
    paralegal: AuthTestUtils.createTestUser({
      role: 'paralegal',
      name: '佐藤花子',
      permissions: [
        { resource: 'cases', action: 'read', scope: 'office' }
      ]
    })
  },

  // 認証状態
  authStates: {
    authenticated: (user = StorybookAuthMocks.users.lawyer) => ({
      isAuthenticated: true,
      user,
      token: 'mock-jwt-token',
      loading: false,
      error: null
    }),
    
    unauthenticated: () => ({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    }),
    
    loading: () => ({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: true,
      error: null
    }),
    
    error: (message = 'ログインに失敗しました') => ({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: message
    })
  },

  // テストシナリオ
  scenarios: {
    loginSuccess: () => ({
      action: 'login',
      result: 'success',
      delay: 1000
    }),
    
    loginFailure: () => ({
      action: 'login',
      result: 'failure',
      error: 'メールアドレスまたはパスワードが正しくありません',
      delay: 1000
    }),
    
    rateLimited: () => ({
      action: 'login',
      result: 'failure',
      error: 'アカウントが一時的にロックされています',
      delay: 500
    })
  }
}
```

### 4. ルート保護ミドルウェア設計

#### 型安全なルート保護システム

```typescript
// types/middleware.ts - ミドルウェア関連型定義
interface RouteProtection {
  requiresAuth: boolean
  requiredPermissions?: Permission[]
  requiredRole?: UserRole | UserRole[]
  allowedRoles?: UserRole[]
  redirectPath?: string
  fallbackComponent?: Component
  bypassConditions?: BypassCondition[]
}

interface AuthMiddlewareContext {
  to: RouteLocationNormalized
  from: RouteLocationNormalized
  user: User | null
  permissions: Permission[]
  session: SessionInfo | null
}

// middleware/auth.ts - メイン認証ミドルウェア
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const { user, isAuthenticated, sessionInfo } = storeToRefs(authStore)
  const { hasPermission, hasRole } = usePermissions()

  // 認証不要なルートの早期リターン
  if (to.meta.allowGuest) return

  // 認証状態チェック
  if (!isAuthenticated.value) {
    return await handleUnauthenticatedUser(to)
  }

  // セッション有効性チェック
  if (!await validateSession(sessionInfo.value)) {
    return await handleExpiredSession(to)
  }

  // 権限チェック
  const permissionResult = await checkPermissions(to, user.value!)
  if (!permissionResult.allowed) {
    return await handleInsufficientPermissions(to, permissionResult.reason)
  }

  // 監査ログ記録
  await logRouteAccess(to, user.value!)
})

// composables/useAuthGuard.ts - 高度なルート保護
export const useAuthGuard = () => {
  const authStore = useAuthStore()
  const { user, isAuthenticated } = storeToRefs(authStore)
  const { hasPermission, hasRole } = usePermissions()

  const canAccessRoute = (routeConfig: {
    requiresAuth?: boolean
    requiredRole?: UserRole | UserRole[]
    requiredPermissions?: Permission[]
    customCheck?: (user: User) => boolean
  }): boolean => {
    if (routeConfig.requiresAuth && !isAuthenticated.value) return false
    if (!user.value) return false

    // ロールチェック
    if (routeConfig.requiredRole) {
      const requiredRoles = Array.isArray(routeConfig.requiredRole) 
        ? routeConfig.requiredRole 
        : [routeConfig.requiredRole]
      
      if (!requiredRoles.some(role => hasRole(role))) return false
    }

    // 権限チェック
    if (routeConfig.requiredPermissions) {
      const hasAllPermissions = routeConfig.requiredPermissions.every(
        permission => hasPermission(permission.resource, permission.action, permission.scope)
      )
      if (!hasAllPermissions) return false
    }

    // カスタムチェック
    if (routeConfig.customCheck && !routeConfig.customCheck(user.value)) {
      return false
    }

    return true
  }

  return { canAccessRoute }
}
```

### 5. ストア統合とデータフロー設計

#### リアクティブな認証状態管理アーキテクチャ

```typescript
// stores/auth.ts - メイン認証ストア
export const useAuthStore = defineStore('auth', () => {
  // === Core State ===
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isLoading = ref(false)
  const authError = ref<AuthenticationError | null>(null)

  // === Session Management ===
  const sessionInfo = ref<SessionInfo | null>(null)
  const lastActivity = ref<Date>(new Date())
  const sessionWarningShown = ref(false)

  // === Permissions & Role State ===
  const permissions = computed(() => user.value?.permissions || [])
  const role = computed(() => user.value?.role)
  const canManage = computed(() => role.value === 'admin' || role.value === 'lawyer')

  // === Persistent State with VueUse ===
  const rememberedEmail = useLocalStorage('auth.rememberedEmail', '')
  const loginPreferences = useLocalStorage('auth.preferences', {
    rememberMe: false,
    autoLogin: false,
    biometricEnabled: false
  })

  // === Session Monitoring ===
  const { pause: pauseSessionCheck, resume: resumeSessionCheck } = useIntervalFn(
    async () => {
      await checkSessionValidity()
    },
    30000, // 30秒ごと
    { immediate: false }
  )

  // === Core Actions ===
  const login = async (credentials: LoginCredentials): Promise<AuthResult<User>> => {
    try {
      isLoading.value = true
      authError.value = null

      const result = await authService.login(credentials)
      
      if (!result.success) {
        authError.value = result.error
        return result
      }

      // 成功時の状態更新
      const { user: userData, token: userToken, refreshToken: userRefreshToken } = result.data
      
      user.value = userData
      token.value = userToken
      refreshToken.value = userRefreshToken || null
      
      // セッション情報の設定
      sessionInfo.value = {
        token: userToken,
        expiresAt: new Date(Date.now() + (result.data.expiresIn * 1000)),
        isValid: true,
        remainingTime: result.data.expiresIn
      }

      // トークンの永続化
      await tokenManager.storeTokens(userToken, userRefreshToken)
      
      // セッション監視開始
      resumeSessionCheck()
      
      // 権限の初期化
      await initializePermissions()
      
      return { success: true, data: userData }

    } catch (error) {
      const authError = handleAuthError(error)
      authError.value = authError
      return { success: false, error: authError }
      
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (reason: 'user_initiated' | 'session_expired' | 'security' = 'user_initiated') => {
    try {
      isLoading.value = true
      
      // サーバーサイドログアウト
      if (token.value) {
        try {
          await authService.logout()
        } catch (error) {
          console.warn('Server logout failed:', error)
        }
      }
      
      // 状態クリア
      await clearAuthState()
      
      // セッション監視停止
      pauseSessionCheck()
      
      // リダイレクト処理
      if (reason === 'session_expired') {
        await navigateTo('/login?reason=session_expired')
      } else if (reason === 'security') {
        await navigateTo('/login?reason=security_logout')
      } else {
        await navigateTo('/login')
      }

    } finally {
      isLoading.value = false
    }
  }

  const refreshTokens = async (): Promise<boolean> => {
    try {
      if (!refreshToken.value) {
        throw new Error('No refresh token available')
      }

      const result = await authService.refreshToken(refreshToken.value)
      
      if (!result.success) {
        throw result.error
      }

      // トークン更新
      token.value = result.data.token
      refreshToken.value = result.data.refreshToken || refreshToken.value
      
      // セッション情報更新
      if (sessionInfo.value) {
        sessionInfo.value.token = result.data.token
        sessionInfo.value.expiresAt = new Date(Date.now() + (result.data.expiresIn * 1000))
        sessionInfo.value.remainingTime = result.data.expiresIn
      }

      // 永続化
      await tokenManager.storeTokens(token.value, refreshToken.value)
      
      return true

    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout('session_expired')
      return false
    }
  }

  const checkSessionValidity = async () => {
    if (!sessionInfo.value || !token.value) return

    const now = new Date()
    const expiresAt = sessionInfo.value.expiresAt
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()

    // 5分前に警告表示
    if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0 && !sessionWarningShown.value) {
      sessionWarningShown.value = true
      await showSessionExpiryWarning()
    }

    // 期限切れチェック
    if (timeUntilExpiry <= 0) {
      await logout('session_expired')
      return
    }

    // 自動更新（期限の15分前）
    if (timeUntilExpiry <= 15 * 60 * 1000 && refreshToken.value) {
      await refreshTokens()
    }
  }

  return {
    // State (readonly)
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    isLoading: readonly(isLoading),
    authError: readonly(authError),
    sessionInfo: readonly(sessionInfo),
    permissions,
    role,
    canManage,
    
    // Preferences
    rememberedEmail,
    loginPreferences,
    
    // Actions
    login,
    logout,
    refreshTokens,
    checkSessionValidity
  }
})
```

#### 統合データフローアーキテクチャ

```typescript
// composables/useAuthFlow.ts - 認証フロー統合
export const useAuthFlow = () => {
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  const { t } = useI18n()
  const toast = useToast()
  const router = useRouter()

  // === Reactive State Bindings ===
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    authError,
    sessionInfo 
  } = storeToRefs(authStore)

  // === Computed State ===
  const authStatus = computed(() => {
    if (isLoading.value) return 'loading'
    if (authError.value) return 'error'
    if (isAuthenticated.value) return 'authenticated'
    return 'unauthenticated'
  })

  const sessionStatus = computed(() => {
    if (!sessionInfo.value) return 'no_session'
    
    const now = Date.now()
    const expiresAt = new Date(sessionInfo.value.expiresAt).getTime()
    const timeLeft = expiresAt - now
    
    if (timeLeft <= 0) return 'expired'
    if (timeLeft <= 5 * 60 * 1000) return 'expiring_soon' // 5分以内
    if (timeLeft <= 15 * 60 * 1000) return 'expiring' // 15分以内
    return 'active'
  })

  // === Login Flow ===
  const performLogin = async (credentials: LoginCredentials) => {
    uiStore.setLoading('auth', true)
    
    try {
      const result = await authStore.login(credentials)
      
      if (result.success) {
        toast.success(t('auth.messages.loginSuccess', { name: result.data.name }))
        
        // ナビゲーション処理
        const redirectPath = getLoginRedirectPath()
        await router.push(redirectPath)
        
        return result
      } else {
        toast.error(result.error.message)
        return result
      }
      
    } finally {
      uiStore.setLoading('auth', false)
    }
  }

  const getLoginRedirectPath = (): string => {
    const route = useRoute()
    const redirectQuery = route.query.redirect as string
    
    if (redirectQuery && redirectQuery.startsWith('/')) {
      return redirectQuery
    }
    
    // ロール別デフォルトリダイレクト
    switch (user.value?.role) {
      case 'admin':
        return '/admin/dashboard'
      case 'lawyer':
        return '/cases'
      case 'paralegal':
        return '/cases'
      case 'secretary':
        return '/clients'
      default:
        return '/dashboard'
    }
  }

  // === Session Management ===
  const extendSession = async () => {
    try {
      const success = await authStore.refreshTokens()
      
      if (success) {
        toast.success(t('auth.messages.sessionExtended'))
      } else {
        toast.error(t('auth.messages.sessionExtensionFailed'))
      }
      
      return success
    } catch (error) {
      toast.error(t('auth.messages.sessionExtensionFailed'))
      return false
    }
  }

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    authError,
    authStatus,
    sessionStatus,
    sessionInfo,
    
    // Actions
    performLogin,
    extendSession,
    
    // Helpers
    getLoginRedirectPath
  }
}
```

### 3. アクセシビリティ強化ログインフォーム

```vue
<!-- components/auth/LoginForm.vue -->
<template>
  <Card class="w-full max-w-md mx-auto" role="main" aria-labelledby="login-title">
    <CardHeader class="text-center">
      <CardTitle id="login-title" class="text-2xl font-bold">
        {{ t('auth.form.title') }}
      </CardTitle>
      <CardDescription id="login-description">
        {{ t('auth.form.description') }}
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      <form 
        @submit="onSubmit" 
        class="space-y-4"
        aria-describedby="login-description"
        novalidate
      >
        <!-- Email Field - アクセシビリティ強化 -->
        <FormField v-slot="{ componentField, errorMessage }" name="email">
          <FormItem>
            <FormLabel for="email-input">{{ t('auth.form.email') }}</FormLabel>
            <FormControl>
              <Input
                id="email-input"
                type="email"
                :placeholder="t('auth.form.emailPlaceholder')"
                v-bind="componentField"
                :disabled="isSubmitting"
                :aria-invalid="!!errorMessage"
                :aria-describedby="errorMessage ? 'email-error' : undefined"
                autocomplete="email"
                spellcheck="false"
              />
            </FormControl>
            <FormMessage 
              id="email-error" 
              role="alert" 
              aria-live="polite"
            />
          </FormItem>
        </FormField>
        
        <!-- Password Field - アクセシビリティ強化 -->
        <FormField v-slot="{ componentField, errorMessage }" name="password">
          <FormItem>
            <FormLabel for="password-input">{{ t('auth.form.password') }}</FormLabel>
            <FormControl>
              <div class="relative">
                <Input
                  id="password-input"
                  :type="showPassword ? 'text' : 'password'"
                  v-bind="componentField"
                  :disabled="isSubmitting"
                  :aria-invalid="!!errorMessage"
                  :aria-describedby="errorMessage ? 'password-error' : 'password-requirements'"
                  autocomplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  @click="togglePasswordVisibility"
                  :disabled="isSubmitting"
                  :aria-label="showPassword ? t('auth.form.passwordHide') : t('auth.form.passwordShow')"
                  :aria-pressed="showPassword"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </FormControl>
            <div id="password-requirements" class="sr-only">
              {{ t('auth.form.passwordRequirements') }}
            </div>
            <FormMessage 
              id="password-error" 
              role="alert" 
              aria-live="polite"
            />
          </FormItem>
        </FormField>
        
        <!-- Remember Me -->
        <FormField v-slot="{ value, handleChange }" name="rememberMe">
          <FormItem class="flex items-center space-x-2">
            <FormControl>
              <Checkbox
                :checked="value"
                @update:checked="handleChange"
                :disabled="isSubmitting"
                aria-describedby="remember-me-label"
              />
            </FormControl>
            <FormLabel id="remember-me-label" class="text-sm font-normal">
              {{ t('auth.form.rememberMe') }}
            </FormLabel>
          </FormItem>
        </FormField>
        
        <!-- Submit Button - アクセシビリティ強化 -->
        <Button
          type="submit"
          class="w-full"
          :disabled="isSubmitting"
          :aria-describedby="loginError ? 'login-error' : undefined"
        >
          <Loader2 
            v-if="isSubmitting" 
            class="mr-2 h-4 w-4 animate-spin" 
            aria-hidden="true"
          />
          {{ isSubmitting ? t('auth.form.loggingIn') : t('auth.form.login') }}
        </Button>
        
        <!-- Error Display - アクセシビリティ強化 -->
        <Alert 
          v-if="loginError" 
          variant="destructive"
          role="alert"
          aria-live="assertive"
          id="login-error"
        >
          <AlertCircle class="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{{ t('auth.error.title') }}</AlertTitle>
          <AlertDescription>{{ loginError }}</AlertDescription>
        </Alert>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { useLoginValidation } from '~/composables/useLoginValidation'
import { useAuthError } from '~/composables/useAuthError'

const { t } = useI18n()
const { loginSchema } = useLoginValidation()
const { handleAuthError } = useAuthError()
const authStore = useAuthStore()

const showPassword = ref(false)
const loginError = ref<string | null>(null)

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: loginSchema
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const onSubmit = handleSubmit(async (values) => {
  try {
    loginError.value = null
    const result = await authStore.login(values)
    
    // リダイレクト処理
    const route = useRoute()
    const redirectPath = (route.query.redirect as string) || '/dashboard'
    await navigateTo(redirectPath)
    
  } catch (error) {
    const authError = handleAuthError(error)
    loginError.value = authError.message
  }
})
</script>
```

### 4. 認証状態管理強化

```typescript
// stores/auth.ts での使用例
const login = async (credentials: LoginCredentials): Promise<void> => {
  const { handleAuthError } = useAuthError()
  
  try {
    authError.value = null
    const response = await mockAuthService.login(credentials)
    
    if (!response.success) {
      // 認証失敗は明示的にエラーとして扱う
      throw new AuthenticationError(
        'AUTHENTICATION', 
        response.error ?? t('auth.error.authentication')
      )
    }
    
    user.value = response.user!  // 成功時は必ずuserが存在
    
  } catch (error) {
    const authErr = handleAuthError(error)
    authError.value = authErr.message
    
    // エラーを再スローして呼び出し元でも適切に処理させる
    throw authErr
  }
}
```

## Implementation Guidance

### Login Form with Validation
Comprehensive form with Japanese support:

```vue
<!-- components/auth/LoginForm.vue -->
<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader class="text-center">
      <CardTitle class="text-2xl font-bold">
        ログイン
      </CardTitle>
      <CardDescription>
        法律事務所管理システムにログインしてください
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email Field -->
        <div class="space-y-2">
          <Label for="email">メールアドレス</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="example@lawfirm.co.jp"
            :class="{ 'border-destructive': errors.email }"
            required
          />
          <p v-if="errors.email" class="text-sm text-destructive">
            {{ errors.email }}
          </p>
        </div>
        
        <!-- Password Field -->
        <div class="space-y-2">
          <Label for="password">パスワード</Label>
          <div class="relative">
            <Input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="パスワードを入力"
              :class="{ 'border-destructive': errors.password }"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              @click="showPassword = !showPassword"
            >
              <EyeIcon v-if="!showPassword" class="h-4 w-4" />
              <EyeOffIcon v-else class="h-4 w-4" />
            </Button>
          </div>
          <p v-if="errors.password" class="text-sm text-destructive">
            {{ errors.password }}
          </p>
        </div>
        
        <!-- Remember Me -->
        <div class="flex items-center space-x-2">
          <Checkbox id="remember" v-model="rememberMe" />
          <Label for="remember" class="text-sm">
            ログイン状態を保持する
          </Label>
        </div>
        
        <!-- Submit Button -->
        <Button
          type="submit"
          class="w-full"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          ログイン
        </Button>
        
        <!-- Error Display -->
        <Alert v-if="loginError" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>ログインエラー</AlertTitle>
          <AlertDescription>
            {{ loginError }}
          </AlertDescription>
        </Alert>
      </form>
    </CardContent>
    
    <CardFooter class="text-center">
      <p class="text-sm text-muted-foreground">
        パスワードを忘れた場合は管理者にお問い合わせください
      </p>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

// Validation schema
const loginSchema = toTypedSchema(z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上である必要があります')
}))

// Form setup
const { errors, handleSubmit, defineComponentBinds } = useForm({
  validationSchema: loginSchema
})

const email = defineComponentBinds('email')
const password = defineComponentBinds('password')

// Component state
const showPassword = ref(false)
const rememberMe = ref(false)
const isLoading = ref(false)
const loginError = ref('')

// Authentication store
const authStore = useAuthStore()
const router = useRouter()

// Form submission
const handleSubmit = handleSubmit(async (values) => {
  try {
    isLoading.value = true
    loginError.value = ''
    
    await authStore.login({
      email: values.email,
      password: values.password,
      rememberMe: rememberMe.value
    })
    
    // Redirect to dashboard
    await router.push('/dashboard')
  } catch (error) {
    loginError.value = error.message || 'ログインに失敗しました'
  } finally {
    isLoading.value = false
  }
})
</script>
```

### Authentication Middleware
Route protection implementation:

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Redirect to login page
    return navigateTo('/login')
  }
  
  // Check role-based access if needed
  const requiredRole = to.meta.requiresRole
  if (requiredRole && !authStore.hasRole(requiredRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'アクセス権限がありません'
    })
  }
})

// middleware/guest.ts
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  
  // Redirect authenticated users to dashboard
  if (authStore.isAuthenticated) {
    return navigateTo('/dashboard')
  }
})
```

### User Menu Component
Professional user interface:

```vue
<!-- components/layout/UserMenu.vue -->
<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" class="relative h-10 w-10 rounded-full">
        <Avatar class="h-10 w-10">
          <AvatarImage :src="user.avatar" :alt="user.name" />
          <AvatarFallback>
            {{ getInitials(user.name) }}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent class="w-56" align="end">
      <DropdownMenuLabel class="font-normal">
        <div class="flex flex-col space-y-1">
          <p class="text-sm font-medium leading-none">
            {{ user.name }}
          </p>
          <p class="text-xs leading-none text-muted-foreground">
            {{ user.email }}
          </p>
          <Badge
            :variant="getRoleVariant(user.role)"
            class="w-fit text-xs mt-1"
          >
            {{ getRoleLabel(user.role) }}
          </Badge>
        </div>
      </DropdownMenuLabel>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuGroup>
        <DropdownMenuItem @click="navigateTo('/profile')">
          <User class="mr-2 h-4 w-4" />
          <span>プロフィール</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem @click="navigateTo('/settings')">
          <Settings class="mr-2 h-4 w-4" />
          <span>設定</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem @click="handleLogout" class="text-destructive">
        <LogOut class="mr-2 h-4 w-4" />
        <span>ログアウト</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

const getRoleLabel = (role: UserRole) => {
  const labels: Record<UserRole, string> = {
    LAWYER: '弁護士',
    CLERK: '事務員',
    CLIENT: '依頼者'
  }
  return labels[role] || role
}

const getRoleVariant = (role: UserRole) => {
  const variants: Record<UserRole, string> = {
    LAWYER: 'default',
    CLERK: 'secondary',
    CLIENT: 'outline'
  }
  return variants[role] || 'outline'
}

const handleLogout = async () => {
  await authStore.logout()
}
</script>
```

### Mock Authentication Service
Realistic authentication simulation:

```typescript
// services/mockAuth.ts
interface MockUser {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  avatar?: string
  firmId: string
  isActive: boolean
}

const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'lawyer@lawfirm.co.jp',
    password: 'password123',
    name: '田中 太郎',
    role: 'LAWYER',
    firmId: 'firm-1',
    isActive: true
  },
  {
    id: '2',
    email: 'clerk@lawfirm.co.jp',
    password: 'password123',
    name: '佐藤 花子',
    role: 'CLERK',
    firmId: 'firm-1',
    isActive: true
  }
]

export class MockAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const user = mockUsers.find(u => 
      u.email === credentials.email && 
      u.password === credentials.password &&
      u.isActive
    )
    
    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }
    
    // Generate mock JWT token
    const token = btoa(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }))
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      },
      token,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    }
  }
  
  async refreshToken(token: string): Promise<AuthResponse> {
    // Mock token refresh
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      const payload = JSON.parse(atob(token))
      const user = mockUsers.find(u => u.id === payload.userId)
      
      if (!user || payload.exp < Date.now()) {
        throw new Error('Invalid token')
      }
      
      return this.login({ email: user.email, password: user.password })
    } catch {
      throw new Error('トークンの更新に失敗しました')
    }
  }
  
  async logout(): Promise<void> {
    // Mock logout
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

export const mockAuthService = new MockAuthService()
```

## Integration Points

### Pinia Store Integration
- **Authentication State**: User session and token management
- **Route Protection**: Middleware integration with store state
- **Persistence**: Local storage for session data
- **Error Handling**: Centralized authentication error management

### Component System Integration
- **shadcn-vue Components**: Form inputs, buttons, and layout components
- **Consistent Styling**: Authentication UI matches application theme
- **Accessibility**: WCAG 2.1 AA compliance for login forms
- **Mobile Responsive**: Touch-friendly authentication on mobile devices

### Route Management
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Role-based Access**: Route access based on user roles
- **Login Redirect**: Return to intended page after authentication
- **Session Handling**: Automatic logout on token expiration

## Implementation Steps

1. **Create Login Form Component** (2.5 hours)
   - Build form with VeeValidate + Zod validation
   - Implement loading states and error handling
   - Add responsive design and accessibility features

2. **Implement Authentication Store** (2 hours)
   - Create Pinia store for authentication state
   - Add login, logout, and session management
   - Implement token persistence and refresh logic

3. **Create Route Protection** (1.5 hours)
   - Build authentication middleware
   - Set up protected and guest route handling
   - Add role-based access control

4. **Build User Menu & Navigation** (1.5 hours)
   - Create user menu dropdown component
   - Add user profile and role display
   - Implement logout functionality

5. **Set Up Mock Authentication** (0.5 hours)
   - Create mock user database
   - Implement realistic authentication responses
   - Add error scenarios for testing

## Testing Requirements

### Authentication Flow Testing
```typescript
// tests/auth.test.ts
describe('Authentication Flow', () => {
  test('should login with valid credentials', async () => {
    const wrapper = mount(LoginForm)
    
    await wrapper.find('[data-testid="email"]').setValue('lawyer@lawfirm.co.jp')
    await wrapper.find('[data-testid="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    
    expect(mockAuthService.login).toHaveBeenCalled()
  })
  
  test('should show error for invalid credentials', async () => {
    // Test error handling
  })
  
  test('should redirect after successful login', async () => {
    // Test navigation
  })
})
```

### Storybook Stories
```typescript
// stories/LoginForm.stories.ts
export default {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered'
  }
}

export const Default = {}

export const WithError = {
  play: async ({ canvasElement }) => {
    // Simulate login error
  }
}

export const Loading = {
  play: async ({ canvasElement }) => {
    // Simulate loading state
  }
}
```

## Success Criteria

- [ ] Login form validates input and shows appropriate errors
- [ ] Authentication state persists across browser sessions
- [ ] Route protection redirects unauthenticated users
- [ ] User menu displays role and profile information correctly
- [ ] Mock authentication simulates realistic scenarios
- [ ] All components are mobile-responsive
- [ ] Japanese text displays correctly throughout
- [ ] Accessibility standards met (WCAG 2.1 AA)

## Security Considerations

### Legal Practice Requirements
- **Client Confidentiality**: No sensitive data in client-side storage
- **Session Security**: Secure token handling and expiration
- **Role-based Access**: Proper permission checks for legal workflows
- **Audit Trail**: Authentication events logged for compliance

### Frontend Security Best Practices
- **Input Validation**: Comprehensive client-side validation
- **XSS Prevention**: Proper input sanitization
- **CSRF Protection**: Token-based request validation
- **Secure Storage**: Encrypted local storage for sensitive data

## Performance Considerations

- **Authentication Speed**: Login process <2 seconds
- **Route Protection**: Minimal middleware overhead
- **Component Loading**: Lazy loading for authentication components
- **Token Management**: Efficient token refresh without user interruption
- **Mobile Performance**: Optimized forms for mobile devices

## Files to Create/Modify

- `components/auth/LoginForm.vue` - Main login form component
- `components/layout/UserMenu.vue` - User menu dropdown
- `layouts/auth.vue` - Authentication layout
- `layouts/default.vue` - Protected layout
- `pages/login.vue` - Login page
- `middleware/auth.ts` - Authentication middleware
- `middleware/guest.ts` - Guest middleware
- `stores/auth.ts` - Authentication Pinia store
- `services/mockAuth.ts` - Mock authentication service
- `types/auth.ts` - Authentication TypeScript types

## Related Tasks

- T01_S01_Nuxt3_Project_Foundation (dependency)
- T03_S01_Basic_Layout_System
- T04_S01_Case_Management_Kanban

---

**Note**: This authentication system provides the security foundation for the entire application. Ensure comprehensive testing of all authentication flows before proceeding to other components.