/**
 * MockWorkspaceRepository
 * 開発・テスト用のモック実装
 */

import type {
  IWorkspaceRepository,
  WorkspaceResponse,
  WorkspaceCreateRequest,
  WorkspaceUpdateRequest,
  WorkspaceListResponse,
  WorkspaceListParams,
  WorkspaceMemberListResponse,
  WorkspaceInviteRequest,
  WorkspaceInviteResponse,
  WorkspaceMember
} from '../types'

// モックデータ
const mockWorkspaces: WorkspaceResponse[] = [
  {
    id: 'workspace-1',
    name: 'Astar Works',
    description: 'メインワークスペース',
    icon: '🏢',
    color: '#3B82F6',
    settings: {
      defaultTableView: 'table',
      allowGuestAccess: false,
      features: {
        tables: true,
        documents: true,
        expenses: true,
        projects: true
      }
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'workspace-2',
    name: '法律事務所テンプレート',
    description: '法律事務所向けのテンプレートワークスペース',
    icon: '⚖️',
    color: '#10B981',
    settings: {
      defaultTableView: 'board',
      allowGuestAccess: false,
      features: {
        tables: true,
        documents: true,
        expenses: true,
        projects: true
      }
    },
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
]

const mockMembers: WorkspaceMember[] = [
  {
    id: 'member-1',
    userId: 'user-1',
    userName: '山田太郎',
    userEmail: 'yamada@example.com',
    role: 'admin',
    joinedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'member-2',
    userId: 'user-2',
    userName: '鈴木花子',
    userEmail: 'suzuki@example.com',
    role: 'member',
    joinedAt: '2024-01-02T00:00:00Z'
  }
]

const mockInvites: WorkspaceInviteResponse[] = []

export class MockWorkspaceRepository implements IWorkspaceRepository {
  private currentWorkspaceId: string | null = null
  
  // Simulate network delay
  private async delay(ms: number = 200): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // ===========================
  // Workspace CRUD
  // ===========================
  
  async listWorkspaces(params?: WorkspaceListParams): Promise<WorkspaceListResponse> {
    await this.delay()
    
    let workspaces = [...mockWorkspaces]
    
    // Apply search
    if (params?.search) {
      const searchLower = params.search.toLowerCase()
      workspaces = workspaces.filter(w =>
        w.name.toLowerCase().includes(searchLower) ||
        w.description?.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply sorting
    if (params?.sortBy) {
      workspaces.sort((a, b) => {
        const aVal = a[params.sortBy as keyof WorkspaceResponse]
        const bVal = b[params.sortBy as keyof WorkspaceResponse]
        
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
    const paginatedWorkspaces = workspaces.slice(start, start + pageSize)
    
    return {
      workspaces: paginatedWorkspaces,
      totalCount: workspaces.length
    }
  }
  
  async getWorkspace(id: string): Promise<WorkspaceResponse> {
    await this.delay()
    const workspace = mockWorkspaces.find(w => w.id === id)
    if (!workspace) throw new Error(`Workspace ${id} not found`)
    return workspace
  }
  
  async createWorkspace(data: WorkspaceCreateRequest): Promise<WorkspaceResponse> {
    await this.delay()
    const newWorkspace: WorkspaceResponse = {
      id: `workspace-${Date.now()}`,
      name: data.name,
      description: data.description,
      icon: data.icon || '📁',
      color: data.color || '#6B7280',
      settings: data.settings || {
        defaultTableView: 'table',
        allowGuestAccess: false,
        features: {
          tables: true,
          documents: true,
          expenses: true,
          projects: true
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockWorkspaces.push(newWorkspace)
    return newWorkspace
  }
  
  async updateWorkspace(id: string, data: WorkspaceUpdateRequest): Promise<WorkspaceResponse> {
    await this.delay()
    const index = mockWorkspaces.findIndex(w => w.id === id)
    if (index === -1) throw new Error(`Workspace ${id} not found`)
    
    const existingWorkspace = mockWorkspaces[index]
    if (!existingWorkspace) throw new Error(`Workspace ${id} not found`)
    
    const updatedWorkspace: WorkspaceResponse = {
      ...existingWorkspace,
      ...data,
      id: existingWorkspace.id, // id は必須なので明示的に保持
      name: data.name ?? existingWorkspace.name, // name も必須
      createdAt: existingWorkspace.createdAt, // createdAt も必須
      updatedAt: new Date().toISOString()
    }
    mockWorkspaces[index] = updatedWorkspace
    return updatedWorkspace
  }
  
  async deleteWorkspace(id: string): Promise<void> {
    await this.delay()
    const index = mockWorkspaces.findIndex(w => w.id === id)
    if (index === -1) throw new Error(`Workspace ${id} not found`)
    mockWorkspaces.splice(index, 1)
  }
  
  // ===========================
  // Member Management
  // ===========================
  
  async listMembers(_workspaceId: string): Promise<WorkspaceMemberListResponse> {
    await this.delay()
    // 実際にはworkspaceIdでフィルタするが、ここでは全メンバーを返す
    return {
      members: mockMembers,
      totalCount: mockMembers.length
    }
  }
  
  async inviteMember(
    workspaceId: string,
    data: WorkspaceInviteRequest
  ): Promise<WorkspaceInviteResponse> {
    await this.delay()
    const newInvite: WorkspaceInviteResponse = {
      id: `invite-${Date.now()}`,
      workspaceId,
      email: data.email,
      role: data.role,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString()
    }
    mockInvites.push(newInvite)
    return newInvite
  }
  
  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await this.delay()
    const index = mockMembers.findIndex(m => m.id === memberId)
    if (index === -1) throw new Error(`Member ${memberId} not found`)
    mockMembers.splice(index, 1)
  }
  
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: string
  ): Promise<WorkspaceMember> {
    await this.delay()
    const member = mockMembers.find(m => m.id === memberId)
    if (!member) throw new Error(`Member ${memberId} not found`)
    
    member.role = role
    return member
  }
  
  // ===========================
  // Current Workspace Management
  // ===========================
  
  async getCurrentWorkspace(): Promise<WorkspaceResponse | null> {
    await this.delay(100)
    
    // LocalStorageから現在のワークスペースIDを取得
    if (import.meta.client) {
      const savedId = localStorage.getItem('currentWorkspaceId')
      if (savedId) {
        this.currentWorkspaceId = savedId
        const workspace = mockWorkspaces.find(w => w.id === savedId)
        if (workspace) {
          return workspace
        }
        // 見つからない場合はクリア
        this.currentWorkspaceId = null
        localStorage.removeItem('currentWorkspaceId')
      }
    }
    
    // デフォルトで最初のワークスペースを返す
    const defaultWorkspace = mockWorkspaces[0]
    if (defaultWorkspace) {
      this.currentWorkspaceId = defaultWorkspace.id
      if (import.meta.client) {
        localStorage.setItem('currentWorkspaceId', defaultWorkspace.id)
      }
      return defaultWorkspace
    }
    
    return null
  }
  
  async setCurrentWorkspace(id: string): Promise<void> {
    await this.delay(100)
    
    // 存在確認
    const workspace = mockWorkspaces.find(w => w.id === id)
    if (!workspace) {
      throw new Error(`Workspace ${id} not found`)
    }
    
    // LocalStorageに保存
    if (import.meta.client) {
      this.currentWorkspaceId = id
      localStorage.setItem('currentWorkspaceId', id)
    }
  }
}