/**
 * WorkspaceRepository
 * Real API実装（薄いプロキシ層）
 */

// OpenAPI標準型を使用
import type { components } from '@/types/api'

// フロントエンド独自型のみ保持
import type {
  WorkspaceListParams,
  WorkspaceMemberListResponse,
  WorkspaceInviteRequest,
  WorkspaceInviteResponse,
  WorkspaceMember
} from '../types'

// OpenAPI型をエイリアスで簡略化
type WorkspaceResponse = components['schemas']['WorkspaceResponse']
type WorkspaceCreateRequest = components['schemas']['WorkspaceCreateRequest']
type WorkspaceUpdateRequest = components['schemas']['WorkspaceUpdateRequest']
type WorkspaceListResponse = components['schemas']['WorkspaceListResponse']

export class WorkspaceRepository {
  private client: ReturnType<typeof useApi>
  private currentWorkspaceId: string | null = null
  
  constructor() {
    this.client = useApi()
  }
  
  // ===========================
  // Workspace CRUD
  // ===========================
  
  async listWorkspaces(_params?: WorkspaceListParams): Promise<WorkspaceListResponse> {
    const { data, error } = await this.client.GET('/api/v1/workspaces', {
      params: {
        query: {
          includeCounts: false
        }
      }
    })
    
    if (error) {
      throw new Error('Failed to list workspaces')
    }
    
    return data as WorkspaceListResponse
  }
  
  async getWorkspace(id: string): Promise<WorkspaceResponse> {
  const { data, error } = await this.client.GET('/api/v1/workspaces/{id}', {
    params: {
      path: { id }
    }
  })
  
  if (error || !data) {
    throw new Error(`Workspace ${id} not found`)
  }
  
  return data as unknown as WorkspaceResponse
}
  
  async createWorkspace(requestData: WorkspaceCreateRequest): Promise<WorkspaceResponse> {
    const { data, error } = await this.client.POST('/api/v1/workspaces', {
      body: requestData
    })
    
    if (error) {
      throw new Error('Failed to create workspace')
    }
    
    return data as WorkspaceResponse
  }
  
  async updateWorkspace(id: string, requestData: WorkspaceUpdateRequest): Promise<WorkspaceResponse> {
    const { data, error } = await this.client.PUT('/api/v1/workspaces/{id}', {
      params: {
        path: { id }
      },
      body: requestData
    })
    
    if (error) {
      throw new Error('Failed to update workspace')
    }
    
    return data as WorkspaceResponse
  }
  
  async deleteWorkspace(id: string): Promise<void> {
    const { error } = await this.client.DELETE('/api/v1/workspaces/{id}', {
      params: {
        path: { id }
      }
    })
    
    if (error) {
      throw new Error('Failed to delete workspace')
    }
  }
  
  // ===========================
  // Member Management
  // ===========================
  
  async listMembers(_workspaceId: string): Promise<WorkspaceMemberListResponse> {
    throw new Error(
      'Workspace member management is not yet implemented. ' +
      'This feature requires backend API implementation for /api/v1/workspaces/{id}/members'
    )
  }
  
  async inviteMember(
    _workspaceId: string,
    _requestData: WorkspaceInviteRequest
  ): Promise<WorkspaceInviteResponse> {
    throw new Error(
      'Workspace member invitation is not yet implemented. ' +
      'This feature requires backend API implementation for /api/v1/workspaces/{id}/invites'
    )
  }
  
  async removeMember(_workspaceId: string, _memberId: string): Promise<void> {
    throw new Error(
      'Remove workspace member is not yet implemented. ' +
      'This feature requires backend API implementation for /api/v1/workspaces/{id}/members/{memberId}'
    )
  }
  
  async updateMemberRole(
    _workspaceId: string,
    _memberId: string,
    _role: string
  ): Promise<WorkspaceMember> {
    throw new Error(
      'Update workspace member role is not yet implemented. ' +
      'This feature requires backend API implementation for /api/v1/workspaces/{id}/members/{memberId}'
    )
  }
  
  // ===========================
  // Current Workspace Management
  // ===========================
  
  async getCurrentWorkspace(): Promise<WorkspaceResponse | null> {
    // LocalStorageから現在のワークスペースIDを取得
    if (import.meta.client) {
      const savedId = localStorage.getItem('currentWorkspaceId')
      if (savedId) {
        this.currentWorkspaceId = savedId
        try {
          return await this.getWorkspace(savedId)
        } catch {
          // 取得失敗時はnullを返す
          this.currentWorkspaceId = null
          localStorage.removeItem('currentWorkspaceId')
        }
      }
    }
    return null
  }
  
  async setCurrentWorkspace(id: string): Promise<void> {
    // LocalStorageに現在のワークスペースIDを保存
    if (import.meta.client) {
      this.currentWorkspaceId = id
      localStorage.setItem('currentWorkspaceId', id)
    }
  }
}