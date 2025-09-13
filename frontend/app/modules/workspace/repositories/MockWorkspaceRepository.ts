/**
 * MockWorkspaceRepository
 * 開発・テスト用のモック実装
 */

import type {
  WorkspaceRepository,
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
import { generateJapaneseName } from '../../table/scenarios/japaneseData'
import { MOCK_WORKSPACE_IDS } from '../../mock/constants/mockIds'

// 固定UUIDを使用
const WORKSPACE_LEGAL_1 = MOCK_WORKSPACE_IDS.LEGAL_1
const WORKSPACE_LEGAL_2 = MOCK_WORKSPACE_IDS.LEGAL_2

// モックデータ
const mockWorkspaces: WorkspaceResponse[] = [
  {
    id: WORKSPACE_LEGAL_1,
    name: '弁護士チーム',
    description: '弁護士部門のワークスペース',
    settings: {
      icon: '⚖️',
      color: '#1e40af',
      defaultTableView: 'table',
      allowGuestAccess: false,
      features: {
        tables: true,
        documents: true,
        expenses: true,
        projects: true
      }
    },
    createdAt: '2023-04-01T00:00:00Z',
    updatedAt: '2024-12-08T10:30:00Z'
  },
  {
    id: WORKSPACE_LEGAL_2,
    name: '事務員チーム',
    description: '事務員部門のワークスペース',
    settings: {
      icon: '📋',
      color: '#059669',
      defaultTableView: 'board',
      allowGuestAccess: false,
      features: {
        tables: true,
        documents: true,
        expenses: true,
        projects: true
      }
    },
    createdAt: '2022-10-15T00:00:00Z',
    updatedAt: '2024-12-07T15:45:00Z'
  }
]

// 弁護士チームのメンバー構成
const lawyerTeamMembers: WorkspaceMember[] = [
  {
    id: 'member-lawyer-1',
    userId: 'user-partner-1',
    userName: '高橋 健一',
    userEmail: 'takahashi@law-firm.jp',
    role: 'owner',
    joinedAt: '2023-04-01T00:00:00Z'
  },
  {
    id: 'member-lawyer-2',
    userId: 'user-associate-1',
    userName: '山本 誠',
    userEmail: 'yamamoto@law-firm.jp',
    role: 'admin',
    joinedAt: '2023-04-15T00:00:00Z'
  },
  {
    id: 'member-lawyer-3',
    userId: 'user-associate-2',
    userName: '中村 美咲',
    userEmail: 'nakamura@law-firm.jp',
    role: 'admin',
    joinedAt: '2023-06-01T00:00:00Z'
  },
  {
    id: 'member-lawyer-4',
    userId: 'user-associate-3',
    userName: '鈴木 大輔',
    userEmail: 'suzuki@law-firm.jp',
    role: 'member',
    joinedAt: '2023-08-01T00:00:00Z'
  },
  {
    id: 'member-lawyer-5',
    userId: 'user-associate-4',
    userName: '伊藤 真由美',
    userEmail: 'ito@law-firm.jp',
    role: 'member',
    joinedAt: '2023-09-01T00:00:00Z'
  }
]

// 事務員チームのメンバー構成
const staffTeamMembers: WorkspaceMember[] = [
  {
    id: 'member-staff-1',
    userId: 'user-admin-1',
    userName: '田中 恵子',
    userEmail: 'tanaka.k@law-firm.jp',
    role: 'admin',
    joinedAt: '2023-04-01T00:00:00Z'
  },
  {
    id: 'member-staff-2',
    userId: 'user-paralegal-1',
    userName: '佐々木 優子',
    userEmail: 'sasaki@law-firm.jp',
    role: 'member',
    joinedAt: '2023-07-01T00:00:00Z'
  },
  {
    id: 'member-staff-3',
    userId: 'user-paralegal-2',
    userName: '渡辺 綾',
    userEmail: 'watanabe@law-firm.jp',
    role: 'member',
    joinedAt: '2023-10-01T00:00:00Z'
  },
  {
    id: 'member-staff-4',
    userId: 'user-secretary-1',
    userName: '小林 真理',
    userEmail: 'kobayashi@law-firm.jp',
    role: 'member',
    joinedAt: '2023-11-01T00:00:00Z'
  },
  {
    id: 'member-staff-5',
    userId: 'user-receptionist-1',
    userName: '森 理恵',
    userEmail: 'mori@law-firm.jp',
    role: 'member',
    joinedAt: '2024-01-01T00:00:00Z'
  }
]


const mockMembers: { [key: string]: WorkspaceMember[] } = {
  [WORKSPACE_LEGAL_1]: lawyerTeamMembers,
  [WORKSPACE_LEGAL_2]: staffTeamMembers
}

const mockInvites: WorkspaceInviteResponse[] = [
  {
    id: 'invite-1',
    workspaceId: WORKSPACE_LEGAL_1,
    email: 'kato.j@law-firm.jp',
    role: 'member',
    status: 'pending',
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'invite-2',
    workspaceId: WORKSPACE_LEGAL_2,
    email: 'yoshida.k@law-firm.jp',
    role: 'member',
    status: 'pending',
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export class MockWorkspaceRepository implements WorkspaceRepository {
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
        (w.name || '').toLowerCase().includes(searchLower) ||
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
    
    // 業界テンプレートに応じたデフォルト設定を適用
    const templateSettings = data.name.includes('法律') || data.name.includes('法務')
      ? { icon: '⚖️', color: '#1e40af', defaultTableView: 'table' as const }
      : data.name.includes('IT') || data.name.includes('テクノロジー') || data.name.includes('開発')
      ? { icon: '🚀', color: '#7c3aed', defaultTableView: 'kanban' as const }
      : data.name.includes('不動産')
      ? { icon: '🏢', color: '#0891b2', defaultTableView: 'table' as const }
      : data.name.includes('コンサル')
      ? { icon: '📊', color: '#ea580c', defaultTableView: 'table' as const }
      : { icon: '📁', color: '#6B7280', defaultTableView: 'table' as const }
    
    const newWorkspace: WorkspaceResponse = {
      id: `workspace-${Date.now()}`,
      name: data.name,
      description: data.description,
      settings: data.settings || {
        ...templateSettings,
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
    
    // 新しいワークスペースに初期メンバーを追加
    const creatorName = generateJapaneseName()
    const workspaceId = newWorkspace.id ?? `workspace-${Date.now()}`
    mockMembers[workspaceId] = [
      {
        id: `member-${Date.now()}`,
        userId: 'current-user',
        userName: creatorName.fullName,
        userEmail: `${creatorName.lastName.toLowerCase()}@${data.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.jp`,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }
    ]
    
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
  
  async listMembers(workspaceId: string): Promise<WorkspaceMemberListResponse> {
    await this.delay()
    // ワークスペースに応じたメンバーを返す
    const members = mockMembers[workspaceId] || []
    return {
      members,
      totalCount: members.length
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
    const members = mockMembers[workspaceId]
    if (!members) throw new Error(`Workspace ${workspaceId} not found`)
    
    const index = members.findIndex(m => m.id === memberId)
    if (index === -1) throw new Error(`Member ${memberId} not found`)
    members.splice(index, 1)
  }
  
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: string
  ): Promise<WorkspaceMember> {
    await this.delay()
    const members = mockMembers[workspaceId]
    if (!members) throw new Error(`Workspace ${workspaceId} not found`)
    
    const member = members.find(m => m.id === memberId)
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
      this.currentWorkspaceId = defaultWorkspace.id || null
      if (import.meta.client && defaultWorkspace.id) {
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