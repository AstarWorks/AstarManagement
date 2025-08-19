/**
 * Mock data for frontend-only development
 */

export interface IMockUser {
  id: string
  email: string
  password: string
  name: string
  role: string
  tenantId: string
  tenantSlug: string
  plan: string
}

export interface IMockTenant {
  id: string
  slug: string
  name: string
  plan: string
}

// Mock テナント
export const mockTenants: IMockTenant[] = [
  {
    id: 'tenant-1',
    slug: 'demo-law-firm',
    name: 'デモ法律事務所',
    plan: 'professional'
  },
  {
    id: 'tenant-2', 
    slug: 'test-company',
    name: 'テスト企業',
    plan: 'starter'
  }
]

// Mock ユーザー
export const mockUsers: IMockUser[] = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    password: 'admin123',
    name: '管理者',
    role: 'admin',
    tenantId: 'tenant-1',
    tenantSlug: 'demo-law-firm',
    plan: 'professional'
  },
  {
    id: 'user-2',
    email: 'lawyer@example.com', 
    password: 'lawyer123',
    name: '弁護士 太郎',
    role: 'lawyer',
    tenantId: 'tenant-1',
    tenantSlug: 'demo-law-firm',
    plan: 'professional'
  },
  {
    id: 'user-3',
    email: 'staff@example.com',
    password: 'staff123', 
    name: 'スタッフ 花子',
    role: 'staff',
    tenantId: 'tenant-1',
    tenantSlug: 'demo-law-firm',
    plan: 'professional'
  },
  {
    id: 'user-4',
    email: 'user@example.com',
    password: 'user123',
    name: '一般ユーザー',
    role: 'user',
    tenantId: 'tenant-2',
    tenantSlug: 'test-company',
    plan: 'starter'
  }
]

// ユーザー検索ヘルパー
export function findUserByEmail(email: string): IMockUser | undefined {
  return mockUsers.find(user => user.email === email)
}

// パスワード検証ヘルパー
export function validatePassword(user: IMockUser, password: string): boolean {
  return user.password === password
}

// Mock JWT作成（実際のJWTではなく、ただの文字列）
export function createMockToken(user: IMockUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: user.tenantSlug,
    plan: user.plan,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24時間
  }
  
  // Base64エンコードしたJWT風文字列（セキュリティは考慮しない）
  return `mock.${btoa(JSON.stringify(payload))}.signature`
}

// Mock Refresh Token作成
export function createMockRefreshToken(user: IMockUser): string {
  return `refresh.${btoa(user.id + Date.now())}.mock`
}