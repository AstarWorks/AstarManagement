/**
 * RoleRepository
 * Real API実装（薄いプロキシ層）
 */

// フロントエンド独自型のみ保持
import type {
  RoleResponse,
  RoleListParams,
  RoleListResponse,
  RoleCreateRequest,
  RoleUpdateRequest,
  RoleReorderRequest,
  RoleDuplicateRequest,
  PermissionGrantRequest,
  PermissionGrantResult,
  PermissionRevokeRequest,
  PermissionRevokeResult,
  PermissionDefinition,
  PermissionCatalog,
  RoleTemplateCategory
} from '../types'

export class RoleRepositoryImpl {
  private client: ReturnType<typeof useApi>
  
  constructor() {
    this.client = useApi()
  }
  
  // ===========================
  // Role CRUD Operations
  // ===========================
  
  async listRoles(params?: RoleListParams): Promise<RoleListResponse> {
    const { data, error } = await this.client.GET('/api/v1/roles', {
      params: {
        query: params
      }
    })
    
    if (error) {
      throw new Error('Failed to list roles')
    }
    
    // API returns array directly, wrap in response object
    const roles = Array.isArray(data) ? data : (data as RoleListResponse)?.roles || []
    return {
      roles: roles as RoleResponse[],
      totalCount: roles.length
    }
  }
  
  async getRole(roleId: string): Promise<RoleResponse> {
    const { data, error } = await this.client.GET('/api/v1/roles/{id}', {
      params: {
        path: { id: roleId }
      }
    })
    
    if (error) {
      throw new Error('Failed to get role')
    }
    
    return data as RoleResponse
  }
  
  async createRole(requestData: RoleCreateRequest): Promise<RoleResponse> {
    // デフォルト値でAPI契約を満たす
    const bodyData = {
      ...requestData,
      position: requestData.position ?? 0,  // デフォルトposition
      permissions: requestData.permissions || []  // デフォルト権限配列
    }
    
    const { data, error } = await this.client.POST('/api/v1/roles', {
      body: bodyData
    })
    
    if (error) {
      throw new Error('Failed to create role')
    }
    
    return data as RoleResponse
  }
  
  async updateRole(roleId: string, requestData: RoleUpdateRequest): Promise<RoleResponse> {
    const { data, error } = await this.client.PUT('/api/v1/roles/{id}', {
      params: {
        path: { id: roleId }
      },
      body: requestData
    })
    
    if (error) {
      throw new Error('Failed to update role')
    }
    
    return data as RoleResponse
  }
  
  async deleteRole(roleId: string): Promise<void> {
    const { error } = await this.client.DELETE('/api/v1/roles/{id}', {
      params: {
        path: { id: roleId }
      }
    })
    
    if (error) {
      throw new Error('Failed to delete role')
    }
  }
  
  // ===========================
  // Role Operations
  // ===========================
  
  async duplicateRole(roleId: string, requestData: RoleDuplicateRequest): Promise<RoleResponse> {
    // 必須プロパティを明示的に設定
    const body = {
      ...requestData,
      includePermissions: requestData.includePermissions ?? true
    }
    
    const { data, error } = await this.client.POST('/api/v1/roles/{id}/duplicate', {
      params: {
        path: { id: roleId }
      },
      body
    })
    
    if (error) {
      throw new Error(`Failed to duplicate role: ${error}`)
    }
    
    if (!data) {
      throw new Error('No data received from role duplicate API')
    }
    
    return data as RoleResponse
  }
  
  async reorderRoles(requestData: RoleReorderRequest): Promise<RoleResponse[]> {
    const { data, error } = await this.client.PUT('/api/v1/roles/reorder', {
      body: requestData
    })
    
    if (error) {
      throw new Error(`Failed to reorder roles: ${error}`)
    }
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected array of roles')
    }
    
    return data as RoleResponse[]
  }
  
  // ===========================
  // Permission Management
  // ===========================
  
  async getRolePermissions(roleId: string): Promise<string[]> {
    const { data, error } = await this.client.GET('/api/v1/roles/{roleId}/permissions', {
      params: {
        path: { roleId }
      }
    })
    
    if (error) {
      throw new Error(`Failed to get role permissions: ${error}`)
    }
    
    // 型ガードを使用して安全に変換
    if (!data) {
      return []
    }
    
    if (Array.isArray(data)) {
      return data.filter((item): item is string => typeof item === 'string')
    }
    
    // オブジェクト形式のレスポンスの場合
    if (typeof data === 'object' && 'permissions' in data) {
      const permissions = (data as Record<string, unknown>).permissions
      return Array.isArray(permissions) ? permissions.filter((item): item is string => typeof item === 'string') : []
    }
    
    return []
  }
  
  async grantPermissions(
    roleId: string,
    requestData: PermissionGrantRequest
  ): Promise<PermissionGrantResult> {
    const { data, error } = await this.client.POST('/api/v1/roles/{roleId}/permissions', {
      params: {
        path: { roleId }
      },
      body: requestData
    })
    
    if (error) {
      throw new Error('Failed to grant permissions')
    }
    
    return data as PermissionGrantResult
  }
  
  async revokePermissions(
    roleId: string,
    requestData: PermissionRevokeRequest
  ): Promise<PermissionRevokeResult> {
    // Convert string permissions to PermissionRule objects for the API
    const bulkDeleteRequest = {
      permissions: requestData.permissions.map(perm => {
        // Simple conversion - you may need to adjust based on your permission format
        const parts = perm.split('.')
        return {
          resourceType: (parts[0]?.toUpperCase() || 'TABLE') as 'TABLE' | 'WORKSPACE' | 'USER' | 'ROLE',
          action: (parts[1]?.toUpperCase() || 'VIEW') as 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'MANAGE',
          scope: 'ALL' as 'ALL' | 'OWN' | 'TEAM'
        }
      })
    }
    
    const { error } = await this.client.DELETE('/api/v1/roles/{roleId}/permissions', {
      params: {
        path: { roleId }
      },
      body: bulkDeleteRequest
    })
    
    if (error) {
      throw new Error('Failed to revoke permissions')
    }
    
    // DELETE usually doesn't return data, return a success result
    return {
      roleId,
      revoked: requestData.permissions,
      failed: {},
      totalRevoked: requestData.permissions.length
    }
  }
  
  // ===========================
  // Permission Catalog
  // ===========================
  
  async getPermissionCatalog(): Promise<PermissionCatalog> {
    // TODO: Implement when backend API is ready
    // Returning mock data for now
    return {
      categories: [],
      totalPermissions: 0
    }
  }
  
  async searchPermissions(_query: string): Promise<PermissionDefinition[]> {
    // TODO: Implement when backend API is ready
    // For now, return empty array
    console.warn('[RoleRepository] searchPermissions API not implemented yet')
    return []
  }
  
  // ===========================
  // Role Templates
  // ===========================
  
  async getRoleTemplates(): Promise<RoleTemplateCategory[]> {
    // TODO: Implement when backend API is ready
    // Returning mock data for now
    return []
  }
  
  async applyRoleTemplate(_templateId: string): Promise<RoleResponse> {
    // TODO: Implement when backend API is ready
    throw new Error('Role templates not implemented yet')
  }
  
  // ===========================
  // Role Statistics
  // ===========================
  
  async getRoleStatistics(_roleId: string): Promise<{
    userCount: number
    permissionCount: number
    lastModified: string
    createdBy?: string
  }> {
    // TODO: Implement when backend API is ready
    // For now, return mock statistics
    return {
      userCount: 0,
      permissionCount: 0,
      lastModified: new Date().toISOString(),
      createdBy: undefined
    }
  }
}