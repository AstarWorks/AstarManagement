/**
 * Mock Authentication Service for Japanese Legal Practice Management
 * 
 * This service simulates realistic authentication flows for a Japanese law firm
 * including proper user roles, permissions, and Japanese legal practice scenarios.
 */

import type { 
  LoginCredentials, 
  User, 
  AuthTokens, 
  LoginResponse,
  RefreshTokenResponse,
  Role,
  Permission
} from '~/types/auth'

// Legal practice specific roles for Japanese law firms
export const LEGAL_ROLES: Record<string, Role> = {
  LAWYER: {
    id: 'lawyer',
    name: 'lawyer',
    displayName: '弁護士',
    description: '法律事務を行う弁護士',
    isSystemRole: false,
    permissions: [
      'cases:*', 'clients:*', 'documents:*', 
      'finance:*', 'admin:read', 'reports:*'
    ]
  },
  SENIOR_PARALEGAL: {
    id: 'senior_paralegal',
    name: 'senior_paralegal', 
    displayName: '上級事務員',
    description: '経験豊富な法律事務員',
    isSystemRole: false,
    permissions: [
      'cases:read', 'cases:update', 'clients:*', 
      'documents:*', 'finance:read', 'reports:read'
    ]
  },
  PARALEGAL: {
    id: 'paralegal',
    name: 'paralegal',
    displayName: '事務員', 
    description: '法律事務をサポートする事務員',
    isSystemRole: false,
    permissions: [
      'cases:read', 'clients:read', 'clients:update',
      'documents:read', 'documents:create'
    ]
  },
  SECRETARY: {
    id: 'secretary',
    name: 'secretary',
    displayName: '秘書',
    description: '事務所の秘書業務',
    isSystemRole: false,
    permissions: [
      'clients:read', 'documents:read', 'schedule:*'
    ]
  },
  CLIENT: {
    id: 'client', 
    name: 'client',
    displayName: '依頼者',
    description: '法律サービスの依頼者',
    isSystemRole: false,
    permissions: [
      'cases:read:own', 'documents:read:own', 'communication:*:own'
    ]
  }
}

// Mock user database with realistic Japanese legal practice data
export const MOCK_USERS: Record<string, MockUser> = {
  'tanaka@astellaw.co.jp': {
    id: 'user-001',
    email: 'tanaka@astellaw.co.jp',
    password: 'SecurePass123!', // In real app, this would be hashed
    name: '田中 太郎',
    nameKana: 'タナカ タロウ',
    roles: [LEGAL_ROLES.LAWYER],
    permissions: [
      { id: 'p1', name: 'cases:*', displayName: '案件管理（全権限）', resource: 'cases', action: '*', scope: 'all' },
      { id: 'p2', name: 'clients:*', displayName: '顧客管理（全権限）', resource: 'clients', action: '*', scope: 'all' },
      { id: 'p3', name: 'documents:*', displayName: '文書管理（全権限）', resource: 'documents', action: '*', scope: 'all' },
      { id: 'p4', name: 'finance:*', displayName: '財務管理（全権限）', resource: 'finance', action: '*', scope: 'all' }
    ],
    avatar: null,
    firmId: 'firm-astellaw',
    firmName: 'アステル法律事務所',
    isActive: true,
    twoFactorEnabled: false,
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    profile: {
      barNumber: '東京弁護士会 第12345号',
      department: '企業法務部',
      specialization: ['企業法務', '契約法', 'M&A'],
      phone: '03-1234-5678',  
      extension: '101',
      hireDate: '2018-04-01',
      emergencyContact: {
        name: '田中 花子',
        relationship: '配偶者',
        phone: '090-1234-5678'
      }
    },
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
      theme: 'light',
      notifications: {
        email: true,
        browser: true,
        mobile: false
      }
    },
    loginHistory: []
  },

  'sato@astellaw.co.jp': {
    id: 'user-002', 
    email: 'sato@astellaw.co.jp',
    password: 'SecurePass123!',
    name: '佐藤 花子',
    nameKana: 'サトウ ハナコ',
    roles: [LEGAL_ROLES.SENIOR_PARALEGAL],
    permissions: [
      { id: 'p5', name: 'cases:read', displayName: '案件閲覧', resource: 'cases', action: 'read', scope: 'office' },
      { id: 'p6', name: 'cases:update', displayName: '案件更新', resource: 'cases', action: 'update', scope: 'office' },
      { id: 'p7', name: 'clients:*', displayName: '顧客管理（全権限）', resource: 'clients', action: '*', scope: 'office' },
      { id: 'p8', name: 'documents:*', displayName: '文書管理（全権限）', resource: 'documents', action: '*', scope: 'office' }
    ],
    avatar: null,
    firmId: 'firm-astellaw', 
    firmName: 'アステル法律事務所',
    isActive: true,
    twoFactorEnabled: true,
    lastLoginAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    profile: {
      department: '事務部',
      specialization: ['事務処理', '顧客対応', '文書管理'],
      phone: '03-1234-5678',
      extension: '201', 
      hireDate: '2020-04-01'
    },
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo', 
      theme: 'light',
      notifications: {
        email: true,
        browser: true,
        mobile: true
      }
    },
    loginHistory: []
  },

  'yamada@astellaw.co.jp': {
    id: 'user-003',
    email: 'yamada@astellaw.co.jp', 
    password: 'SecurePass123!',
    name: '山田 次郎',
    nameKana: 'ヤマダ ジロウ',
    roles: [LEGAL_ROLES.PARALEGAL],
    permissions: [
      { id: 'p9', name: 'cases:read', displayName: '案件閲覧', resource: 'cases', action: 'read', scope: 'assigned' },
      { id: 'p10', name: 'clients:read', displayName: '顧客閲覧', resource: 'clients', action: 'read', scope: 'assigned' },
      { id: 'p11', name: 'documents:read', displayName: '文書閲覧', resource: 'documents', action: 'read', scope: 'assigned' },
      { id: 'p12', name: 'documents:create', displayName: '文書作成', resource: 'documents', action: 'create', scope: 'assigned' }
    ],
    avatar: null,
    firmId: 'firm-astellaw',
    firmName: 'アステル法律事務所', 
    isActive: true,
    twoFactorEnabled: false,
    lastLoginAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    profile: {
      department: '事務部',
      specialization: ['データ入力', '書類整理'],
      phone: '03-1234-5678',
      extension: '301',
      hireDate: '2023-04-01'
    },
    preferences: {
      language: 'ja', 
      timezone: 'Asia/Tokyo',
      theme: 'light',
      notifications: {
        email: true,
        browser: false,
        mobile: false
      }
    },
    loginHistory: []
  },

  'client@example.com': {
    id: 'user-004',
    email: 'client@example.com',
    password: 'ClientPass123!',
    name: '鈴木 一郎',
    nameKana: 'スズキ イチロウ', 
    roles: [LEGAL_ROLES.CLIENT],
    permissions: [
      { id: 'p13', name: 'cases:read:own', displayName: '自身の案件閲覧', resource: 'cases', action: 'read', scope: 'own' },
      { id: 'p14', name: 'documents:read:own', displayName: '自身の文書閲覧', resource: 'documents', action: 'read', scope: 'own' },
      { id: 'p15', name: 'communication:*:own', displayName: '自身のコミュニケーション', resource: 'communication', action: '*', scope: 'own' }
    ],
    avatar: null,
    firmId: 'firm-astellaw',
    firmName: 'アステル法律事務所',
    isActive: true,
    twoFactorEnabled: false,
    lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    profile: {
      clientType: 'individual',
      company: null,
      phone: '090-1234-5678'
    },
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
      theme: 'light', 
      notifications: {
        email: true,
        browser: false,
        mobile: false
      }
    },
    loginHistory: []
  }
}

interface MockUser {
  id: string
  email: string
  password: string
  name: string
  nameKana: string
  roles: Role[]
  permissions: Permission[]
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
  loginHistory: LoginRecord[]
}

interface LoginRecord {
  timestamp: string
  ipAddress: string
  userAgent: string
  success: boolean
  failureReason?: string
}

interface NetworkSimulator {
  simulateDelay(min?: number, max?: number): Promise<void>
}

class NetworkSimulator implements NetworkSimulator {
  async simulateDelay(min: number = 800, max: number = 1500): Promise<void> {
    const delay = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }
}

interface LoginAttempt {
  email: string
  timestamp: number
  success: boolean
  ipAddress: string
}

class RateLimiter {
  private attempts: Map<string, LoginAttempt[]> = new Map()
  private readonly MAX_ATTEMPTS = 3
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

  canAttempt(email: string): boolean {
    const userAttempts = this.getRecentAttempts(email)
    const failedAttempts = userAttempts.filter(attempt => !attempt.success)
    return failedAttempts.length < this.MAX_ATTEMPTS
  }

  recordAttempt(email: string, success: boolean, ipAddress: string): void {
    const attempts = this.attempts.get(email) || []
    attempts.push({
      email,
      timestamp: Date.now(),
      success,
      ipAddress
    })
    
    // Keep only recent attempts (last 24 hours)
    const filtered = attempts.filter(
      attempt => Date.now() - attempt.timestamp < 24 * 60 * 60 * 1000
    )
    
    this.attempts.set(email, filtered)
  }

  getRemainingLockoutTime(email: string): number {
    const recentAttempts = this.getRecentAttempts(email)
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success)
    
    if (failedAttempts.length < this.MAX_ATTEMPTS) {
      return 0
    }

    const lastFailedAttempt = Math.max(...failedAttempts.map(a => a.timestamp))
    const lockoutEnd = lastFailedAttempt + this.LOCKOUT_DURATION
    
    return Math.max(0, lockoutEnd - Date.now())
  }

  private getRecentAttempts(email: string): LoginAttempt[] {
    const attempts = this.attempts.get(email) || []
    const cutoff = Date.now() - this.LOCKOUT_DURATION
    return attempts.filter(attempt => attempt.timestamp > cutoff)
  }
}

export class MockAuthService {
  private networkSimulator = new NetworkSimulator()
  private rateLimiter = new RateLimiter()

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    await this.networkSimulator.simulateDelay()

    const { email, password, rememberMe } = credentials
    const ipAddress = this.getClientIP()
    const userAgent = this.getUserAgent()

    try {
      // Rate limiting check
      if (!this.rateLimiter.canAttempt(email)) {
        const remainingTime = this.rateLimiter.getRemainingLockoutTime(email)
        this.rateLimiter.recordAttempt(email, false, ipAddress)
        
        throw new Error(
          `アカウントが一時的にロックされています。${Math.ceil(remainingTime / 60000)}分後に再試行してください。`
        )
      }

      // Find user
      const user = MOCK_USERS[email]
      if (!user) {
        this.rateLimiter.recordAttempt(email, false, ipAddress)
        throw new Error('メールアドレスまたはパスワードが正しくありません')
      }

      // Verify password
      if (!this.verifyPassword(password, user.password)) {
        this.rateLimiter.recordAttempt(email, false, ipAddress)
        this.addLoginRecord(user, false, ipAddress, userAgent, 'Invalid password')
        throw new Error('メールアドレスまたはパスワードが正しくありません')
      }

      // Check if account is active
      if (!user.isActive) {
        this.rateLimiter.recordAttempt(email, false, ipAddress)
        this.addLoginRecord(user, false, ipAddress, userAgent, 'Account disabled')
        throw new Error('アカウントが無効です。管理者にお問い合わせください。')
      }

      // Successful login
      this.rateLimiter.recordAttempt(email, true, ipAddress)
      this.addLoginRecord(user, true, ipAddress, userAgent)

      // Generate tokens
      const tokens = this.generateTokens(user, rememberMe)
      
      // Check if 2FA is required
      if (user.twoFactorEnabled) {
        return {
          success: false,
          requiresTwoFactor: true,
          twoFactorChallenge: this.generate2FAChallenge(user),
          user: null,
          tokens: null
        }
      }

      // Update last login
      user.lastLoginAt = new Date()

      return {
        success: true,
        requiresTwoFactor: false,
        user: this.sanitizeUser(user),
        tokens
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    await this.networkSimulator.simulateDelay(200, 500)

    try {
      const payload = this.decodeToken(refreshToken)
      const user = Object.values(MOCK_USERS).find(u => u.id === payload.userId)
      
      if (!user || payload.exp < Date.now()) {
        throw new Error('Refresh token expired')
      }

      const tokens = this.generateTokens(user, false)
      
      return {
        success: true,
        tokens
      }
    } catch (error) {
      throw new Error('トークンの更新に失敗しました')
    }
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(): Promise<void> {
    await this.networkSimulator.simulateDelay(100, 300)
    // In a real implementation, we would invalidate the token on the server
    // For mock purposes, we just simulate the delay
  }

  /**
   * Verify 2FA token
   */
  async verify2FA(challenge: string, token: string): Promise<LoginResponse> {
    await this.networkSimulator.simulateDelay()

    // Decode challenge to get user info
    const challengeData = this.decode2FAChallenge(challenge)
    const user = MOCK_USERS[challengeData.email]
    
    if (!user) {
      throw new Error('無効なチャレンジです')
    }

    // Verify 2FA token (in real app, this would verify TOTP/SMS code)
    if (!this.verify2FAToken(token, user)) {
      throw new Error('認証コードが正しくありません')
    }

    // Generate tokens
    const tokens = this.generateTokens(user, challengeData.rememberMe)
    
    // Update last login
    user.lastLoginAt = new Date()

    return {
      success: true,
      requiresTwoFactor: false,
      user: this.sanitizeUser(user),
      tokens
    }
  }

  private verifyPassword(inputPassword: string, storedPassword: string): boolean {
    // In real implementation, use proper password hashing (bcrypt, etc.)
    return inputPassword === storedPassword
  }

  private verify2FAToken(token: string, user: MockUser): boolean {
    // Mock 2FA verification - accept '123456' or current minute-based TOTP
    if (token === '123456') return true
    
    // Simple time-based token for demo (real implementation would use proper TOTP)
    const currentMinute = Math.floor(Date.now() / 60000)
    const expectedToken = (currentMinute % 1000000).toString().padStart(6, '0')
    return token === expectedToken
  }

  private generateTokens(user: MockUser, rememberMe: boolean = false): AuthTokens {
    const now = Math.floor(Date.now() / 1000)
    const accessTokenExpiry = rememberMe ? 7 * 24 * 60 * 60 : 60 * 60 // 7 days or 1 hour
    const refreshTokenExpiry = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 // 30 days or 7 days

    const accessTokenPayload = {
      userId: user.id,
      email: user.email,
      firmId: user.firmId,
      roles: user.roles.map(r => r.name),
      permissions: user.permissions.map(p => p.name),
      iat: now,
      exp: now + accessTokenExpiry,
      type: 'access'
    }

    const refreshTokenPayload = {
      userId: user.id,
      email: user.email,
      iat: now,
      exp: now + refreshTokenExpiry,
      type: 'refresh'
    }

    return {
      accessToken: this.encodeToken(accessTokenPayload),
      refreshToken: this.encodeToken(refreshTokenPayload),
      tokenType: 'Bearer',
      expiresIn: accessTokenExpiry
    }
  }

  private encodeToken(payload: any): string {
    // Mock JWT - in real implementation, use proper JWT library with signing
    return btoa(JSON.stringify(payload))
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token))
    } catch {
      throw new Error('Invalid token format')
    }
  }

  private generate2FAChallenge(user: MockUser): string {
    const challengeData = {
      userId: user.id,
      email: user.email,
      timestamp: Date.now(),
      rememberMe: false
    }
    return btoa(JSON.stringify(challengeData))
  }

  private decode2FAChallenge(challenge: string): any {
    try {
      return JSON.parse(atob(challenge))
    } catch {
      throw new Error('Invalid challenge format')
    }
  }

  private sanitizeUser(user: MockUser): User {
    const { password, loginHistory, ...sanitizedUser } = user
    return {
      ...sanitizedUser,
      profile: {
        ...user.profile,
        // Remove sensitive emergency contact info from client response
        emergencyContact: undefined
      }
    }
  }

  private addLoginRecord(
    user: MockUser, 
    success: boolean, 
    ipAddress: string, 
    userAgent: string,
    failureReason?: string
  ): void {
    const record: LoginRecord = {
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      success,
      failureReason
    }

    user.loginHistory.unshift(record)
    
    // Keep only last 10 login records
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(0, 10)
    }

    // Log for audit purposes (in real app, send to external audit system)
    console.log('[AUTH_AUDIT]', {
      userId: user.id,
      email: user.email,
      success,
      timestamp: record.timestamp,
      ipAddress,
      userAgent: userAgent.substring(0, 100) // Truncate long user agents
    })
  }

  private getClientIP(): string {
    // Mock IP generation for demo
    return `192.168.1.${Math.floor(Math.random() * 255)}`
  }

  private getUserAgent(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent
    }
    return 'MockUserAgent/1.0'
  }
}

// Export singleton instance
export const mockAuthService = new MockAuthService()

// Export test utilities for development
export const AuthTestUtils = {
  getValidCredentials: (role: keyof typeof LEGAL_ROLES = 'LAWYER') => {
    const users = Object.values(MOCK_USERS)
    const user = users.find(u => u.roles.some(r => r.name === role.toLowerCase()))
    
    if (!user) {
      return { email: 'tanaka@astellaw.co.jp', password: 'SecurePass123!' }
    }
    
    return {
      email: user.email,
      password: user.password
    }
  },

  getInvalidCredentials: () => ({
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }),

  get2FAUser: () => ({
    email: 'sato@astellaw.co.jp',
    password: 'SecurePass123!'
  }),

  getMockUsers: () => MOCK_USERS,
  
  resetRateLimit: () => {
    // Reset rate limiter for testing
    const service = new MockAuthService()
    // @ts-ignore - accessing private member for testing
    service.rateLimiter = new RateLimiter()
  }
}