/**
 * UserRepository
 * Real API実装（薄いプロキシ層）
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
  RoleResponse,
  UserPermissionsResponse,
  UserProfile,
  UserPreferences,
  TenantUserListResponse,
  TenantUser
} from '../types'

export class UserRepository implements IUserRepository {
  private client: ReturnType<typeof useApi>
  
  constructor() {
    this.client = useApi()
  }
  
  // ===========================
  // Current User Operations
  // ===========================
  
  async getCurrentUser(): Promise<CurrentUser> {
    // Note: /api/v1/users/me endpoint does not exist in backend
    // This method should be used with session information from useAuth()
    throw new Error('getCurrentUser should use session information from useAuth(). This endpoint does not exist in the backend.')
  }
  
  async getMyRoles(): Promise<RoleResponse[]> {
    const { data, error } = await this.client.GET('/api/v1/users/me/roles')
    
    if (error) {
      throw new Error('Failed to get user roles')
    }
    
    return data as RoleResponse[]
  }
  
  async getMyPermissions(): Promise<UserPermissionsResponse> {
    const { data, error } = await this.client.GET('/api/v1/users/me/permissions')
    
    if (error) {
      throw new Error('Failed to get user permissions')
    }
    
    return data as UserPermissionsResponse
  }
  
  async updateMyProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    // TODO: Implement when backend API is ready
    // For now, return the updated data
    console.warn('[UserRepository] updateMyProfile API not implemented yet')
    return profileData as UserProfile
  }
  
  async updateMyPreferences(preferences: UserPreferences): Promise<UserPreferences> {
    // TODO: Implement when backend API is ready
    // For now, return the updated preferences
    console.warn('[UserRepository] updateMyPreferences API not implemented yet')
    return preferences
  }
  
  // ===========================
  // User CRUD Operations
  // ===========================
  // Note: These endpoints do not exist in the current backend implementation
  
  async listUsers(_params?: UserListParams): Promise<UserListResponse> {
    throw new Error('listUsers endpoint does not exist in the backend. Use tenant user endpoints instead.')
  }
  
  async getUser(_userId: string): Promise<UserResponse> {
    throw new Error('getUser endpoint does not exist in the backend. Use session information from useAuth().')
  }
  
  async createUser(_requestData: UserCreateRequest): Promise<UserResponse> {
    throw new Error('createUser endpoint does not exist in the backend. Use invitation system instead.')
  }
  
  async updateUser(_userId: string, _requestData: UserUpdateRequest): Promise<UserResponse> {
    throw new Error('updateUser endpoint does not exist in the backend. Use profile update endpoints instead.')
  }
  
  async deleteUser(_userId: string): Promise<void> {
    throw new Error('deleteUser endpoint does not exist in the backend.')
  }
  
  // ===========================
  // User Role Management
  // ===========================
  
  async getUserRoles(userId: string): Promise<RoleResponse[]> {
    // API exists but requires specific user ID
    const { data, error } = await this.client.GET('/api/v1/users/{userId}/roles', {
      params: {
        path: { userId }
      }
    })
    
    if (error) {
      throw new Error('Failed to get user roles')
    }
    
    return data as RoleResponse[]
  }
  
  async assignUserRoles(
    userId: string,
    requestData: UserRoleAssignmentRequest
  ): Promise<UserRoleAssignmentResult> {
    // API exists - uses POST to assign roles
    const { data, error } = await this.client.POST('/api/v1/users/{userId}/roles', {
      params: {
        path: { userId }
      },
      body: requestData
    })
    
    if (error) {
      throw new Error('Failed to assign roles')
    }
    
    // Transform API response to expected format
    return this.transformUserRoleResult(data)
  }
  
  private transformUserRoleResult(apiResponse: Record<string, unknown>): UserRoleAssignmentResult {
    return {
      success: apiResponse.failedRoles ? Object.keys(apiResponse.failedRoles).length === 0 : true,
      assignedRoles: [],  // API doesn't return full role objects, would need separate call
      errors: apiResponse.failedRoles ? Object.values(apiResponse.failedRoles) : []
    }
  }
  
  async removeUserRole(_userId: string, _roleId: string): Promise<void> {
    // Note: Individual role removal endpoint may not exist
    // Use assignUserRoles with updated role list instead
    throw new Error('Individual role removal not supported. Use assignUserRoles with updated role list.')
  }
  
  // ===========================
  // Tenant User Operations
  // ===========================
  
  async listTenantUsers(_tenantId: string): Promise<TenantUserListResponse> {
    // TODO: Implement when backend API is ready
    console.warn('[UserRepository] listTenantUsers API not implemented yet')
    return {
      users: [],
      totalCount: 0
    }
  }
  
  async getTenantUser(_tenantUserId: string): Promise<TenantUser> {
    // TODO: Implement when backend API is ready
    throw new Error('getTenantUser API not implemented yet')
  }
  
  // ===========================
  // User Search & Filter
  // ===========================
  // Note: These endpoints do not exist in the current backend implementation
  
  async searchUsers(_query: string): Promise<UserResponse[]> {
    throw new Error('searchUsers endpoint does not exist in the backend. Use tenant user list with filtering instead.')
  }
  
  async getUsersByRole(_roleId: string): Promise<UserResponse[]> {
    throw new Error('getUsersByRole endpoint does not exist in the backend. Use tenant user list with role filtering instead.')
  }
  
  async getUsersByStatus(_status: 'active' | 'inactive' | 'suspended'): Promise<UserResponse[]> {
    throw new Error('getUsersByStatus endpoint does not exist in the backend. Use tenant user list with status filtering instead.')
  }
}