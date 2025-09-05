/**
 * MockUserRepository
 * 開発・テスト用のモック実装
 */

import type {
  IUserRepository,
  UserResponse,
  UserCreateRequest,
  UserUpdateRequest,
  UserListResponse,
  UserListParams,
  UserRoleAssignmentRequest,
  UserRoleAssignmentResult,
  CurrentUser,
  UserPermissionsResponse,
  UserProfile,
  UserPreferences,
  TenantUserListResponse,
  TenantUser
} from '../types'
import type { RoleResponse } from '../../role/types'

// モックデータ
const mockUsers: UserResponse[] = [
  {
    id: 'user-1',
    email: 'yamada@example.com',
    name: '山田太郎',
    displayName: 'Taro Yamada',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamada',
    locale: 'ja',
    timezone: 'Asia/Tokyo',
    status: 'active',
    emailVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    email: 'suzuki@example.com',
    name: '鈴木花子',
    displayName: 'Hanako Suzuki',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suzuki',
    locale: 'ja',
    timezone: 'Asia/Tokyo',
    status: 'active',
    emailVerified: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 'user-3',
    email: 'tanaka@example.com',
    name: '田中一郎',
    displayName: 'Ichiro Tanaka',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tanaka',
    locale: 'ja',
    timezone: 'Asia/Tokyo',
    status: 'inactive',
    emailVerified: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
]

const mockRoles: RoleResponse[] = [
  {
    id: 'role-admin',
    name: 'admin',
    displayName: '管理者',
    color: '#FF6B6B',
    position: 100,
    isSystem: false,
    permissions: ['*'] as const,
    userCount: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'role-member',
    name: 'member',
    displayName: 'メンバー',
    color: '#4ECDC4',
    position: 50,
    isSystem: false,
    permissions: ['table.view', 'record.view', 'record.create', 'record.update'] as const,
    userCount: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'role-viewer',
    name: 'viewer',
    displayName: '閲覧者',
    color: '#95E77E',
    position: 10,
    isSystem: false,
    permissions: ['table.view', 'record.view'] as const,
    userCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

const mockUserProfiles: Map<string, UserProfile> = new Map([
  ['user-1', {
    id: 'user-1',
    email: 'yamada@example.com',
    name: '山田太郎',
    bio: 'フルスタックエンジニア。TypeScriptとRustが好きです。',
    phone: '090-1234-5678',
    department: '開発部',
    position: 'シニアエンジニア',
    skills: ['TypeScript', 'React', 'Node.js', 'Rust'] as const,
    socialLinks: {
      twitter: '@yamada_dev',
      github: 'yamada-taro',
      linkedin: 'taro-yamada'
    },
    preferences: {
      theme: 'dark',
      language: 'ja',
      notifications: {
        email: true,
        push: true,
        inApp: true
      },
      defaultWorkspaceId: 'workspace-1'
    }
  }]
])

const mockCurrentUser: CurrentUser = {
  id: 'user-1',
  email: 'yamada@example.com',
  name: '山田太郎',
  displayName: 'Taro Yamada',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamada',
  tenantUserId: 'tenant-user-1',
  tenantId: 'tenant-1',
  roles: mockRoles.filter(r => r !== undefined),
  permissions: ['*'] as const
}

export class MockUserRepository implements IUserRepository {
  
  // Simulate network delay
  private async delay(ms: number = 200): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // ===========================
  // Current User Operations
  // ===========================
  
  async getCurrentUser(): Promise<CurrentUser> {
    await this.delay()
    return mockCurrentUser
  }
  
  async getMyRoles(): Promise<RoleResponse[]> {
    await this.delay()
    return [...(mockCurrentUser.roles || [])] as RoleResponse[]
  }
  
  async getMyPermissions(): Promise<UserPermissionsResponse> {
    await this.delay()
    return {
      userId: mockCurrentUser.id || '',
      tenantUserId: mockCurrentUser.tenantUserId || '',
      roles: [...(mockCurrentUser.roles || [])] as RoleResponse[],
      effectivePermissions: [...(mockCurrentUser.permissions || [])] as string[],
      permissionsByRole: {
        'admin': ['*']
      }
    }
  }
  
  async updateMyProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
  await this.delay()
  const currentProfile = mockUserProfiles.get('user-1') || {
    id: 'user-1', // UserProfile uses 'id', not 'userId'
    email: 'yamada@example.com',
    name: '山田太郎',
    preferences: {}
  }
  
  const updatedProfile: UserProfile = {
    ...currentProfile,
    ...profileData,
    // Ensure required fields are present
    id: currentProfile.id || 'user-1',
    email: profileData.email ?? currentProfile.email ?? 'yamada@example.com',
    name: profileData.name ?? currentProfile.name ?? '山田太郎'
  }
  
  mockUserProfiles.set('user-1', updatedProfile)
  return updatedProfile
}
  
  async updateMyPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    await this.delay()
    const profile = mockUserProfiles.get('user-1')
    if (profile) {
      profile.preferences = preferences
      mockUserProfiles.set('user-1', profile)
    }
    return preferences
  }
  
  // ===========================
  // User CRUD Operations
  // ===========================
  
  async listUsers(params?: UserListParams): Promise<UserListResponse> {
    await this.delay()
    
    let users = [...mockUsers]
    
    // Apply filters
    if (params?.status && params.status !== 'all') {
      users = users.filter(u => u.status === params.status)
    }
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase()
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.displayName?.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply sorting
    if (params?.sortBy) {
      users.sort((a, b) => {
        const aVal = a[params.sortBy as keyof UserResponse]
        const bVal = b[params.sortBy as keyof UserResponse]
        
        if (params.sortDirection === 'desc') {
          return String(bVal).localeCompare(String(aVal))
        }
        return String(aVal).localeCompare(String(bVal))
      })
    }
    
    // Apply pagination
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const start = (page - 1) * pageSize
    const paginatedUsers = users.slice(start, start + pageSize)
    
    return {
      users: paginatedUsers,
      totalCount: users.length
    }
  }
  
  async getUser(userId: string): Promise<UserResponse> {
    await this.delay()
    const user = mockUsers.find(u => u.id === userId)
    if (!user) throw new Error(`User ${userId} not found`)
    return user
  }
  
  async createUser(data: UserCreateRequest): Promise<UserResponse> {
    await this.delay()
    const newUser: UserResponse = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      displayName: data.displayName,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
      locale: 'ja',
      timezone: 'Asia/Tokyo',
      status: 'active',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockUsers.push(newUser)
    return newUser
  }
  
  async updateUser(userId: string, data: UserUpdateRequest): Promise<UserResponse> {
  await this.delay()
  const index = mockUsers.findIndex(u => u.id === userId)
  if (index === -1) throw new Error(`User ${userId} not found`)
  
  const existingUser = mockUsers[index]
  if (!existingUser) throw new Error(`User ${userId} not found`)
  
  const updatedUser: UserResponse = {
    ...existingUser,
    ...data,
    // Ensure required fields are always present
    id: existingUser.id,
    email: existingUser.email, // email cannot be updated via UserUpdateRequest
    name: data.name ?? existingUser.name,
    status: data.status ?? existingUser.status,
    emailVerified: existingUser.emailVerified, // emailVerified cannot be updated via UserUpdateRequest
    createdAt: existingUser.createdAt, // createdAt は必須なので明示的に保持
    updatedAt: new Date().toISOString()
  }
  mockUsers[index] = updatedUser
  return updatedUser
}
  
  async deleteUser(userId: string): Promise<void> {
    await this.delay()
    const index = mockUsers.findIndex(u => u.id === userId)
    if (index === -1) throw new Error(`User ${userId} not found`)
    mockUsers.splice(index, 1)
  }
  
  // ===========================
  // User Role Management
  // ===========================
  
  async getUserRoles(userId: string): Promise<RoleResponse[]> {
    await this.delay()
    // Mock: return different roles based on userId
    if (userId === 'user-1' && mockRoles[0]) {
      return [mockRoles[0]] // admin
    } else if (userId === 'user-2' && mockRoles[1]) {
      return [mockRoles[1]] // member
    }
    return mockRoles[2] ? [mockRoles[2]] : [] // viewer or empty
  }
  
  async assignUserRoles(
    userId: string,
    data: UserRoleAssignmentRequest
  ): Promise<UserRoleAssignmentResult> {
    await this.delay()
    const assignedRoles = mockRoles.filter(r => data.roleIds.includes(r.id))
    return {
      success: true,
      assignedRoles,
      errors: []
    }
  }
  
  async removeUserRole(_userId: string, _roleId: string): Promise<void> {
    await this.delay()
    // Mock implementation - just simulate success
  }
  
  // ===========================
  // Tenant User Operations
  // ===========================
  
  async listTenantUsers(tenantId: string): Promise<TenantUserListResponse> {
    await this.delay()
    const tenantUsers: TenantUser[] = mockUsers.map((user, index) => ({
      id: `tenant-user-${index + 1}`,
      userId: user.id,
      tenantId,
      roles: index === 0 && mockRoles[0] ? [mockRoles[0]] : mockRoles[1] ? [mockRoles[1]] : [],
      isOwner: index === 0,
      joinedAt: user.createdAt,
      lastActiveAt: new Date().toISOString()
    }))
    
    return {
      users: tenantUsers,
      totalCount: tenantUsers.length
    }
  }
  
  async getTenantUser(tenantUserId: string): Promise<TenantUser> {
  await this.delay()
  return {
    id: tenantUserId,
    userId: 'user-1',
    tenantId: 'tenant-1', // tenantId は必須フィールドなので明示的に設定
    roles: mockRoles[0] ? [mockRoles[0]] : [],
    isOwner: true,
    joinedAt: '2024-01-01T00:00:00Z',
    lastActiveAt: new Date().toISOString()
  }
}
  
  // ===========================
  // User Search & Filter
  // ===========================
  
  async searchUsers(query: string): Promise<UserResponse[]> {
    await this.delay()
    const searchLower = query.toLowerCase()
    return mockUsers.filter(u => 
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.displayName?.toLowerCase().includes(searchLower)
    )
  }
  
  async getUsersByRole(roleId: string): Promise<UserResponse[]> {
    await this.delay()
    // Mock: return users based on roleId
    if (roleId === 'role-admin' && mockUsers[0]) {
      return [mockUsers[0]]
    } else if (roleId === 'role-member') {
      const users: UserResponse[] = []
      if (mockUsers[1]) users.push(mockUsers[1])
      if (mockUsers[2]) users.push(mockUsers[2])
      return users
    }
    return []
  }
  
  async getUsersByStatus(status: 'active' | 'inactive' | 'suspended'): Promise<UserResponse[]> {
    await this.delay()
    return mockUsers.filter(u => u.status === status)
  }
}