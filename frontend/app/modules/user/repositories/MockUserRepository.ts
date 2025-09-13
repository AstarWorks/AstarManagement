/**
 * MockUserRepository
 * 開発・テスト用のモック実装
 */

import type {
  UserRepository,
  UserResponse,
  UserCreateRequest,
  UserUpdateRequest,
  UserListParams,
  UserRoleAssignmentRequest,
  UserRoleAssignmentResult,
  UserPermissionsResponse,
  UserProfile,
  UserPreferences,
  TenantUserListResponse,
  TenantUser,
  RoleResponse,
  PermissionRule,
  UserStats,
  UserStatsParams,
  UpdateUserProfileDto
} from '../types'
import type { CurrentUserResponse, UserSearchResponse } from '~/types'
import { generateJapaneseName } from '../../table/scenarios/japaneseData'

// 文字列権限をPermissionRuleオブジェクトに変換するヘルパー関数
function parsePermissionString(permission: string): PermissionRule {
  const parts = permission.split('.')
  const resourceMap: Record<string, PermissionRule['resourceType']> = {
    'workspace': 'WORKSPACE',
    'table': 'TABLE',
    'record': 'RECORD',
    'user': 'USER',
    'role': 'ROLE'
  }
  const actionMap: Record<string, PermissionRule['action']> = {
    'view': 'VIEW',
    'create': 'CREATE',
    'edit': 'EDIT',
    'update': 'EDIT',
    'delete': 'DELETE',
    '*': 'MANAGE'
  }
  
  if (permission === '*') {
    return { resourceType: 'TENANT', action: 'MANAGE', scope: 'ALL' }
  }
  
  const [resource, action] = parts
  return {
    resourceType: (resource && resourceMap[resource]) || 'TABLE',
    action: (action && actionMap[action]) || 'VIEW',
    scope: 'ALL'
  }
}

// 法律事務所スタッフ
const legalStaffUsers: UserResponse[] = [
  {
    id: 'user-partner-1',
    auth0Sub: 'auth0|partner-takahashi',
    email: 'takahashi@takahashi-law.jp',
    createdAt: '2023-04-01T00:00:00Z',
    updatedAt: '2024-12-08T10:00:00Z'
  },
  {
    id: 'user-associate-1',
    auth0Sub: 'auth0|associate-yamamoto',
    email: 'yamamoto@takahashi-law.jp',
    createdAt: '2023-04-15T00:00:00Z',
    updatedAt: '2024-12-07T15:30:00Z'
  },
  {
    id: 'user-associate-2',
    auth0Sub: 'auth0|associate-nakamura',
    email: 'nakamura@takahashi-law.jp',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-12-06T09:00:00Z'
  },
  {
    id: 'user-paralegal-1',
    auth0Sub: 'auth0|paralegal-sasaki',
    email: 'sasaki@takahashi-law.jp',
    createdAt: '2023-07-01T00:00:00Z',
    updatedAt: '2024-12-05T14:20:00Z'
  },
  {
    id: 'user-admin-1',
    auth0Sub: 'auth0|admin-tanaka',
    email: 'tanaka@takahashi-law.jp',
    createdAt: '2023-04-01T00:00:00Z',
    updatedAt: '2024-12-04T11:00:00Z'
  }
]

// IT企業スタッフ
const techStaffUsers: UserResponse[] = [
  {
    id: 'user-cto-1',
    auth0Sub: 'auth0|cto-suzuki',
    email: 'suzuki@next-innovation.jp',
    createdAt: '2021-06-01T00:00:00Z',
    updatedAt: '2024-12-08T08:30:00Z'
  },
  {
    id: 'user-lead-1',
    auth0Sub: 'auth0|lead-sato',
    email: 'sato@next-innovation.jp',
    createdAt: '2021-08-01T00:00:00Z',
    updatedAt: '2024-12-07T17:00:00Z'
  },
  {
    id: 'user-dev-1',
    auth0Sub: 'auth0|dev-tanaka',
    email: 'tanaka.t@next-innovation.jp',
    createdAt: '2022-04-01T00:00:00Z',
    updatedAt: '2024-12-06T13:45:00Z'
  },
  {
    id: 'user-dev-2',
    auth0Sub: 'auth0|dev-ito',
    email: 'ito@next-innovation.jp',
    createdAt: '2022-10-15T00:00:00Z',
    updatedAt: '2024-12-05T10:15:00Z'
  },
  {
    id: 'user-designer-1',
    auth0Sub: 'auth0|designer-watanabe',
    email: 'watanabe@next-innovation.jp',
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2024-12-04T16:30:00Z'
  },
  {
    id: 'user-pm-1',
    auth0Sub: 'auth0|pm-yamada',
    email: 'yamada.h@next-innovation.jp',
    createdAt: '2021-09-01T00:00:00Z',
    updatedAt: '2024-12-08T07:00:00Z'
  }
]

const mockUsers: UserResponse[] = [...legalStaffUsers, ...techStaffUsers]

const mockRoles: RoleResponse[] = [
  {
    id: 'role-admin',
    name: 'admin',
    displayName: '管理者',
    color: '#FF6B6B',
    position: 100,
    system: false,
    permissions: [parsePermissionString('*')],
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
    system: false,
    permissions: [
      parsePermissionString('table.view'),
      parsePermissionString('record.view'),
      parsePermissionString('record.create'),
      parsePermissionString('record.update')
    ],
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
    system: false,
    permissions: [
      parsePermissionString('table.view'),
      parsePermissionString('record.view')
    ],
    userCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

const mockUserProfiles: Map<string, UserProfile> = new Map([
  // 法律事務所スタッフ
  ['user-partner-1', {
    id: 'user-partner-1',
    email: 'takahashi@takahashi-law.jp',
    name: '高橋 健一',
    displayName: '高橋 健一',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=takahashi',
    organizationId: 'org-legal-1',
    organizationName: '高橋法律事務所',
    isActive: true,
    createdAt: '2023-04-01T00:00:00Z',
    updatedAt: '2024-12-08T10:00:00Z'
  }],
  ['user-associate-1', {
    id: 'user-associate-1',
    email: 'yamamoto@takahashi-law.jp',
    name: '山本 誠',
    displayName: '山本 誠',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yamamoto',
    organizationId: 'org-legal-1',
    organizationName: '高橋法律事務所',
    isActive: true,
    createdAt: '2023-04-15T00:00:00Z',
    updatedAt: '2024-12-07T15:30:00Z'
  }],
  
  // IT企業スタッフ
  ['user-cto-1', {
    id: 'user-cto-1',
    email: 'suzuki@next-innovation.jp',
    name: '鈴木 大輔',
    displayName: '鈴木 大輔',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suzuki',
    organizationId: 'org-tech-1',
    organizationName: 'ネクストイノベーション株式会社',
    isActive: true,
    createdAt: '2021-06-01T00:00:00Z',
    updatedAt: '2024-12-08T08:30:00Z'
  }],
  ['user-lead-1', {
    id: 'user-lead-1',
    email: 'sato@next-innovation.jp',
    name: '佐藤 翔',
    displayName: '佐藤 翔',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sato',
    organizationId: 'org-tech-1',
    organizationName: 'ネクストイノベーション株式会社',
    isActive: true,
    createdAt: '2021-08-01T00:00:00Z',
    updatedAt: '2024-12-07T17:00:00Z'
  }]
])

const mockCurrentUser: CurrentUserResponse = {
  user: {
    id: 'user-cto-1',
    email: 'suzuki@next-innovation.jp',
    auth0Sub: 'auth0|cto-suzuki',
    profile: {
      id: 'profile-cto-1',
      userId: 'user-cto-1',
      displayName: '鈴木 大輔',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suzuki',
      createdAt: '2021-06-01T00:00:00Z',
      updatedAt: '2024-12-08T08:30:00Z'
    },
    tenantCount: 1,
    roleCount: mockRoles.length,
    createdAt: '2021-06-01T00:00:00Z',
    updatedAt: '2024-12-08T08:30:00Z'
  },
  currentTenantId: 'tenant-1',
  permissions: []
}

// Mock user profile for legacy methods
const mockUserProfile: UserProfile = {
  id: 'user-cto-1',
  email: 'suzuki@next-innovation.jp',
  name: '鈴木 大輔',
  displayName: '鈴木 大輔',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suzuki',
  organizationId: 'org-tech-1',
  organizationName: 'ネクストイノベーション株式会社',
  isActive: true,
  createdAt: '2021-06-01T00:00:00Z',
  updatedAt: '2024-12-08T08:30:00Z'
}

export class MockUserRepository implements UserRepository {
  
  // Simulate network delay
  private async delay(ms: number = 200): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // ===========================
  // Current User Operations
  // ===========================
  
  async getCurrentUser(): Promise<CurrentUserResponse> {
    await this.delay()
    return mockCurrentUser
  }
  
  async getMyRoles(): Promise<RoleResponse[]> {
    await this.delay()
    return [...mockRoles] as RoleResponse[]
  }
  
  async getMyPermissions(): Promise<UserPermissionsResponse> {
    await this.delay()
    return {
      userId: mockCurrentUser.user?.id || '',
      tenantUserId: 'tenant-user-1',
      roles: [...mockRoles] as RoleResponse[],
      effectivePermissions: [parsePermissionString('*')],
      permissionsByRole: [{
        roleName: 'admin',
        permissions: [parsePermissionString('*')]
      }]
    }
  }
  
  async updateMyProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
  await this.delay()
  const currentProfile = mockUserProfiles.get('user-cto-1') || mockUserProfile
  
  const updatedProfile: UserProfile = {
    ...currentProfile,
    ...profileData,
    // Ensure required fields are present
    id: currentProfile.id || 'user-cto-1',
    email: profileData.email ?? currentProfile.email ?? 'suzuki@next-innovation.jp',
    name: profileData.name ?? currentProfile.name ?? '鈴木 大輔'
  }
  
  mockUserProfiles.set('user-cto-1', updatedProfile)
  return updatedProfile
}
  
  async updateMyPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    await this.delay()
    const profile = mockUserProfiles.get('user-cto-1')
    if (profile) {
      profile.preferences = preferences
      mockUserProfiles.set('user-cto-1', profile)
    }
    return preferences
  }
  
  // ===========================
  // User CRUD Operations
  // ===========================
  
  async listUsers(params?: UserListParams): Promise<UserSearchResponse> {
    await this.delay()
    
    let users = [...mockUsers]
    
    // Apply filters
    // Note: UserResponse doesn't have status field in OpenAPI, skipping status filter
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase()
      users = users.filter(u => 
        (u.email || '').toLowerCase().includes(searchLower) ||
        (u.auth0Sub || '').toLowerCase().includes(searchLower)
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
      auth0Sub: `auth0|user-${Date.now()}`,
      email: data.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockUsers.push(newUser)
    
    // 新しいユーザーのプロフィールも作成
    const userName = generateJapaneseName()
    const newProfile: UserProfile = {
      id: newUser.id,
      email: newUser.email ?? 'user@example.com',
      name: userName.fullName,
      displayName: userName.fullName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName.lastName}`,
      organizationId: 'org-new',
      organizationName: '新規組織',
      isActive: true,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    }
    mockUserProfiles.set(newUser.id ?? `user-${Date.now()}`, newProfile)
    
    return newUser
  }
  
  async updateUser(userId: string, _data: UserUpdateRequest): Promise<UserResponse> {
  await this.delay()
  const index = mockUsers.findIndex(u => u.id === userId)
  if (index === -1) throw new Error(`User ${userId} not found`)
  
  const existingUser = mockUsers[index]
  if (!existingUser) throw new Error(`User ${userId} not found`)
  
  const updatedUser: UserResponse = {
    ...existingUser,
    // UserUpdateRequest doesn't have many fields in basic UserResponse
    // Ensure required fields are always present
    id: existingUser.id,
    auth0Sub: existingUser.auth0Sub,
    email: existingUser.email, // email cannot be updated via UserUpdateRequest
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
    if ((userId === 'user-partner-1' || userId === 'user-cto-1') && mockRoles[0]) {
      return [mockRoles[0]] // admin
    } else if ((userId === 'user-associate-1' || userId === 'user-lead-1') && mockRoles[1]) {
      return [mockRoles[1]] // member
    }
    return mockRoles[2] ? [mockRoles[2]] : [] // viewer or empty
  }
  
  async assignUserRoles(
    userId: string,
    data: UserRoleAssignmentRequest
  ): Promise<UserRoleAssignmentResult> {
    await this.delay()
    const assignedRoles = mockRoles.filter(r => r.id && data.roleIds?.includes(r.id))
    return {
      userId,
      assignedRoles: assignedRoles.map(r => r.id || ''),
      failedRoles: [],
      totalAssigned: assignedRoles.length
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
      userId: user.id || '',
      tenantId,
      roles: index === 0 && mockRoles[0] ? [mockRoles[0]] : mockRoles[1] ? [mockRoles[1]] : [],
      isOwner: index === 0,
      joinedAt: user.createdAt || new Date().toISOString(),
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
      (u.email || '').toLowerCase().includes(searchLower) ||
      (u.auth0Sub || '').toLowerCase().includes(searchLower)
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
  
  async getUsersByStatus(_status: 'active' | 'inactive' | 'suspended'): Promise<UserResponse[]> {
    await this.delay()
    // UserResponse doesn't have status field in OpenAPI, returning all users
    return mockUsers
  }
  
  // ===========================
  // Legacy methods for backward compatibility
  // ===========================
  
  async getProfile(id: string): Promise<UserProfile> {
    await this.delay()
    
    // Return the mock user profile if it's the requested user
    if (mockUserProfile.id === id) {
      return mockUserProfile
    }
    
    // This is a simplified mock - in real implementation would fetch from API
    return {
      id,
      email: `user-${id}@example.com`,
      name: `User ${id}`,
      displayName: `User ${id}`,
      avatar: undefined,
      organizationId: mockUserProfile.organizationId,
      organizationName: mockUserProfile.organizationName,
      isActive: true,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
  
  async getStats(_id: string, _params?: UserStatsParams): Promise<UserStats> {
    await this.delay()
    
    return {
      activeCases: 12,
      tasksToday: 5,
      unreadMessages: 7,
      totalRevenue: 1500000,
      pendingInvoices: 3,
      hoursThisWeek: 32.5,
      hoursThisMonth: 156.5,
      completionRate: 85.5,
      averageResponseTime: 3.2
    }
  }
  
  async updateProfile(id: string, data: UpdateUserProfileDto): Promise<UserProfile> {
    await this.delay()
    
    // Update mockUserProfile if it's the current user
    if (mockUserProfile.id === id) {
      Object.assign(mockUserProfile, data)
      mockUserProfile.updatedAt = new Date().toISOString()
      return mockUserProfile
    }
    
    // For other users, return updated data
    const existingProfile = await this.getProfile(id)
    return { ...existingProfile, ...data }
  }
  
  async uploadAvatar(id: string, _file: File): Promise<string> {
    await this.delay()
    
    // Return a mock avatar URL
    const avatarUrl = `/api/avatars/${id}-${Date.now()}.jpg`
    
    // Update mockUserProfile if it's the current user
    if (mockUserProfile.id === id) {
      mockUserProfile.avatar = avatarUrl
    }
    
    return avatarUrl
  }
  
  async removeAvatar(id: string): Promise<void> {
    await this.delay()
    
    // Update mockUserProfile if it's the current user
    if (mockUserProfile.id === id) {
      mockUserProfile.avatar = undefined
    }
  }
}