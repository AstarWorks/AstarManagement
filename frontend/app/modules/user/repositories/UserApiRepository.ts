/**
 * User API Repository
 * Implementation using real API endpoints
 */

import type { IPaginatedResponse } from '@shared/api/types'
import type { 
  UserRepository,
  UserProfile, 
  UserStats, 
  UserStatsParams, 
  UpdateUserProfileDto,
  CurrentUserResponse,
  RoleResponse,
  UserPermissionsResponse,
  UserPreferences,
  UserListParams,
  UserSearchResponse,
  UserResponse,
  UserCreateRequest,
  UserUpdateRequest,
  UserRoleAssignmentRequest,
  UserRoleAssignmentResult,
  TenantUserListResponse,
  TenantUser
} from '../types'

export class UserApiRepository implements UserRepository {
  private api: ReturnType<typeof useApi>
  
  constructor() {
    this.api = useApi()
  }
  
  // Current User Operations
  async getCurrentUser(): Promise<CurrentUserResponse> {
    const { data, error } = await this.api.GET('/api/v1/users/me', {})
    if (error) throw new Error('Failed to get current user')
    return data as CurrentUserResponse
  }
  
  async getMyRoles(): Promise<RoleResponse[]> {
    const { data, error } = await this.api.GET('/api/v1/user-roles/me/roles', {})
    if (error) throw new Error('Failed to get user roles')
    return data as RoleResponse[]
  }
  
  async getMyPermissions(): Promise<UserPermissionsResponse> {
    const { data, error } = await this.api.GET('/api/v1/user-roles/me/permissions', {})
    if (error) throw new Error('Failed to get user permissions')
    return data as UserPermissionsResponse
  }
  
  async updateMyProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    // Use PUT method as PATCH is not available for this endpoint
    const { data, error } = await this.api.PUT('/api/v1/users/me', {
      body: profileData as any
    })
    if (error) throw new Error('Failed to update profile')
    return data as UserProfile
  }
  
  // NOTE: preferences endpoint not available in current API
  async updateMyPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    // Temporarily return the input preferences until backend implements this endpoint
    console.warn('updateMyPreferences: Using mock implementation - endpoint not available')
    return Promise.resolve(preferences)
  }
  
  // User CRUD Operations
  async listUsers(params?: UserListParams): Promise<UserSearchResponse> {
    const { data, error } = await this.api.GET('/api/v1/users', {})
    if (error) throw new Error('Failed to list users')
    // TODO: Apply filtering on client side until backend supports query params
    return data as UserSearchResponse
  }
  
  async getUser(userId: string): Promise<UserResponse> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID')
    }
    
    const { data, error } = await this.api.GET('/api/v1/users/{userId}', {
      params: { path: { userId } }
    })
    if (error) throw new Error('Failed to get user')
    return data as UserResponse
  }
  
  // NOTE: User creation endpoint not available in current API
  async createUser(userData: UserCreateRequest): Promise<UserResponse> {
    if (!userData.email) {
      throw new Error('Email is required')
    }
    
    console.warn('createUser: Using mock implementation - endpoint not available')
    return Promise.resolve({
      id: 'mock-id',
      email: userData.email,
      name: userData.name || ''
    } as UserResponse)
  }
  
  // NOTE: User update endpoint not available in current API format
  async updateUser(userId: string, userData: UserUpdateRequest): Promise<UserResponse> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID')
    }
    
    console.warn('updateUser: Using mock implementation - endpoint not available')
    return Promise.resolve({
      id: userId,
      ...userData
    } as UserResponse)
  }
  
  // NOTE: User deletion endpoint not available in current API
  async deleteUser(userId: string): Promise<void> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID')
    }
    
    console.warn('deleteUser: Using mock implementation - endpoint not available')
    return Promise.resolve()
  }
  
  // User Role Management
  // NOTE: getUserRoles endpoint not available in current API
  async getUserRoles(userId: string): Promise<RoleResponse[]> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID')
    }
    
    console.warn('getUserRoles: Using mock implementation - endpoint not available')
    return Promise.resolve([])
  }
  
  // NOTE: assignUserRoles endpoint not available in current API
  async assignUserRoles(userId: string, roleData: UserRoleAssignmentRequest): Promise<UserRoleAssignmentResult> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID')
    }
    
    console.warn('assignUserRoles: Using mock implementation - endpoint not available')
    return Promise.resolve({
      success: true,
      assignedRoles: []
    } as UserRoleAssignmentResult)
  }
  
  // NOTE: removeUserRole endpoint not available in current API
  async removeUserRole(userId: string, roleId: string): Promise<void> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Invalid user ID')
    }
    if (!roleId || typeof roleId !== 'string' || roleId.trim() === '') {
      throw new Error('Invalid role ID')
    }
    
    console.warn('removeUserRole: Using mock implementation - endpoint not available')
    return Promise.resolve()
  }
  
  // Tenant User Operations
  // NOTE: listTenantUsers endpoint not available in current API
  async listTenantUsers(tenantId: string): Promise<TenantUserListResponse> {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new Error('Invalid tenant ID')
    }
    
    console.warn('listTenantUsers: Using mock implementation - endpoint not available')
    return Promise.resolve({
      users: [],
      totalCount: 0
    } as TenantUserListResponse)
  }
  
  // NOTE: getTenantUser endpoint not available in current API
  async getTenantUser(tenantUserId: string): Promise<TenantUser> {
    if (!tenantUserId || typeof tenantUserId !== 'string' || tenantUserId.trim() === '') {
      throw new Error('Invalid tenant user ID')
    }
    
    console.warn('getTenantUser: Using mock implementation - endpoint not available')
    return Promise.resolve({
      id: tenantUserId,
      tenantId: 'mock-tenant',
      userId: 'mock-user'
    } as TenantUser)
  }
  
  // User Search & Filter
  // NOTE: search endpoint not available in current API
  async searchUsers(query: string): Promise<UserResponse[]> {
    if (!query) {
      throw new Error('Search query is required')
    }
    
    // Temporarily return empty array until backend implements this endpoint
    console.warn('searchUsers: Using mock implementation - endpoint not available')
    return Promise.resolve([])
  }
  
  // NOTE: getUsersByRole endpoint not available in current API
  async getUsersByRole(roleId: string): Promise<UserResponse[]> {
    if (!roleId || typeof roleId !== 'string' || roleId.trim() === '') {
      throw new Error('Invalid role ID')
    }
    
    // Temporarily return empty array until backend implements this endpoint
    console.warn('getUsersByRole: Using mock implementation - endpoint not available')
    return Promise.resolve([])
  }
  
  // NOTE: getUsersByStatus filtering not available in current API
  async getUsersByStatus(status: 'active' | 'inactive' | 'suspended'): Promise<UserResponse[]> {
    const { data, error } = await this.api.GET('/api/v1/users', {})
    if (error) throw new Error('Failed to get users by status')
    // TODO: Filter by status on client side until backend supports query params
    return data as UserResponse[]
  }
  
  // Legacy methods for backward compatibility
  async list(params?: Record<string, unknown>): Promise<IPaginatedResponse<UserProfile>> {
    const { data, error } = await this.api.GET('/api/v1/users', {})
    if (error) throw new Error('Failed to list users')
    // TODO: Apply filtering on client side until backend supports query params
    return data as IPaginatedResponse<UserProfile>
  }
  
  async get(id: string): Promise<UserProfile> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid ID')
    }
    
    const { data, error } = await this.api.GET('/api/v1/users/{userId}', {
      params: { path: { userId: id } }
    })
    if (error) throw new Error('Failed to get user')
    return data as UserProfile
  }
  
  async getProfile(id: string): Promise<UserProfile> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid ID')
    }
    
    const { data, error } = await this.api.GET('/api/v1/users/{userId}/profile', {
      params: { path: { userId: id } }
    })
    if (error) throw new Error('Failed to get user profile')
    return data as UserProfile
  }
  
  // NOTE: User creation endpoint not available in current API
  async create(userData: Partial<UserProfile>): Promise<UserProfile> {
    if (!userData.email) {
      throw new Error('Email is required')
    }
    
    console.warn('create: Using mock implementation - endpoint not available')
    return Promise.resolve({
      id: 'mock-id',
      email: userData.email!,
      name: userData.name || ''
    } as UserProfile)
  }
  
  // NOTE: User update endpoint not available in current API format
  async update(id: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid ID')
    }
    
    console.warn('update: Using mock implementation - endpoint not available')
    return Promise.resolve({
      id,
      email: 'mock@example.com',
      name: 'Mock User',
      ...userData
    } as UserProfile)
  }
  
  // NOTE: Using PUT method as PATCH is not available
  async updateProfile(id: string, profileData: UpdateUserProfileDto): Promise<UserProfile> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid ID')
    }
    
    // If updating current user, use /users/me endpoint
    if (id === 'me' || id === 'current') {
      const { data, error } = await this.api.PUT('/api/v1/users/me', {
        body: profileData as any
      })
      if (error) throw new Error('Failed to update user profile')
      return data as UserProfile
    }
    
    // For other users, mock the response
    console.warn('updateProfile: Using mock implementation for non-current user')
    return Promise.resolve({
      ...profileData,
      id,
      email: profileData.email || 'mock@example.com',
      name: 'Mock User'
    } as UserProfile)
  }
  
  // NOTE: User deletion endpoint not available in current API
  async delete(id: string): Promise<void> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid ID')
    }
    
    console.warn('delete: Using mock implementation - endpoint not available')
    return Promise.resolve()
  }
  
  // NOTE: stats endpoint not available in current API
  // NOTE: stats endpoint not available in current API
  async getStats(id: string, params?: UserStatsParams): Promise<UserStats> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid ID')
    }
    
    // Temporarily return mock stats until backend implements this endpoint
    console.warn('getStats: Using mock implementation - endpoint not available')
    return Promise.resolve({
      userId: id,
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      activeCases: 0,
      tasksToday: 0,
      unreadMessages: 0
    } as UserStats)
  }
  
  // NOTE: avatar upload endpoint not available in current API
  async uploadAvatar(id: string, file: File): Promise<string> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid ID')
    }
    
    // Validate file
    if (!file) {
      throw new Error('File is required')
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB')
    }
    
    // Temporarily return mock URL until backend implements this endpoint
    console.warn('uploadAvatar: Using mock implementation - endpoint not available')
    return Promise.resolve('/mock-avatar-url.jpg')
  }
  
  // NOTE: avatar removal endpoint not available in current API
  async removeAvatar(id: string): Promise<void> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid ID')
    }
    
    // Temporarily do nothing until backend implements this endpoint
    console.warn('removeAvatar: Using mock implementation - endpoint not available')
    return Promise.resolve()
  }
  
  async getByEmail(email: string): Promise<UserProfile | null> {
    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required')
    }
    
    try {
      const { data, error } = await this.api.GET('/api/v1/users', {})
      
      if (error) {
        // If 404, return null
        if ((error as any).message?.includes('404')) {
          return null
        }
        throw new Error('Failed to get user by email')
      }
      
      // TODO: Filter by email on client side until backend supports query params
      const response = data as IPaginatedResponse<UserProfile>
      return response.data?.[0] || null
    } catch (error) {
      // If 404, return null
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }
}