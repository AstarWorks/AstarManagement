/**
 * Simplified Mock Authentication Service
 * Simple over Easy: Minimal viable mock for development
 */

import type { ILoginCredentials, IUser, IAuthTokens, ILoginResponse, IRefreshTokenResponse, IRole } from '@auth/types/auth'

// Simple role factory
const createRole = (id: string, displayName: string, permissions: string[]): IRole => ({
  id,
  name: id,
  displayName,
  description: `${displayName}の役割`,
  isSystemRole: false,
  permissions
})

// Minimal role definitions
export const ROLES = {
  LAWYER: createRole('lawyer', '弁護士', ['cases:*', 'clients:*', 'documents:*']),
  CLERK: createRole('clerk', '事務員', ['cases:read', 'clients:read']),
  CLIENT: createRole('client', '依頼者', ['cases:read:own'])
} as const

// Minimal mock users for development
const createMockUser = (id: string, email: string, name: string, role: IRole): IUser => ({
  id,
  email,
  name,
  nameKana: name,
  roles: [role],
  permissions: role.permissions,
  avatar: null,
  firmId: 'test-firm',
  firmName: 'テスト法律事務所',
  isActive: true,
  twoFactorEnabled: false,
  lastLoginAt: new Date(),
  profile: { phone: '03-0000-0000' },
  preferences: {
    language: 'ja',
    timezone: 'Asia/Tokyo',
    theme: 'light',
    notifications: { email: true, browser: true, mobile: false }
  }
})

const MOCK_USERS = [
  createMockUser('1', 'lawyer@test.com', '田中弁護士', ROLES.LAWYER),
  createMockUser('2', 'clerk@test.com', '佐藤事務員', ROLES.CLERK),
  createMockUser('3', 'client@test.com', '山田依頼者', ROLES.CLIENT)
]

// Simple auth service
export class MockAuthService {
  private static instance: MockAuthService
  private users = new Map(MOCK_USERS.map(user => [user.email, { ...user, password: 'password123' }]))

  static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService()
    }
    return MockAuthService.instance
  }

  async login(credentials: ILoginCredentials): Promise<ILoginResponse> {
    console.log('🔑 MockAuth: Login attempt', { email: credentials.email })
    const user = this.users.get(credentials.email)
    console.log('🔑 MockAuth: User found:', Boolean(user))
    console.log('🔑 MockAuth: Available users:', Array.from(this.users.keys()))
    
    if (!user || user.password !== credentials.password) {
      console.log('🔑 MockAuth: Invalid credentials')
      throw new Error('Invalid credentials')
    }

    const response = {
      user: this.sanitizeUser(user),
      tokens: this.generateTokens(),
      requiresTwoFactor: false
    }
    
    console.log('🔑 MockAuth: Login successful', { userId: response.user.id, email: response.user.email })
    return response
  }

  async logout(): Promise<void> {
    console.log('🔑 MockAuth: Logout')
    // In a real implementation, this would invalidate tokens
  }

  async refreshToken(refreshToken: string): Promise<IRefreshTokenResponse> {
    // Simple validation
    if (!refreshToken) throw new Error('Invalid refresh token')
    
    return {
      tokens: this.generateTokens()
    }
  }

  async verify2FA(challenge: string, token: string): Promise<ILoginResponse> {
    console.log('🔑 MockAuth: 2FA verification', { challenge, token })
    
    // Simple mock validation
    if (!challenge || !token) {
      throw new Error('Invalid 2FA credentials')
    }
    
    // Return a mock successful response
    const mockUser = Array.from(this.users.values())[0]
    if (!mockUser) {
      throw new Error('No mock users available')
    }
    return {
      user: this.sanitizeUser(mockUser),
      tokens: this.generateTokens(),
      requiresTwoFactor: false
    }
  }

  private sanitizeUser(user: IUser & { password: string }): IUser {
    const { password: _password, ...safeUser } = user
    return safeUser
  }

  private generateTokens(): IAuthTokens {
    return {
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      expiresIn: 3600,
      tokenType: 'Bearer'
    }
  }
}

// Export singleton instance
export const mockAuthService = MockAuthService.getInstance()