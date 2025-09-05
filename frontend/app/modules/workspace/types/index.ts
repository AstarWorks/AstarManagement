/**
 * Workspace Types
 * ワークスペース関連の型定義
 */

// ===========================
// Base Workspace Types
// ===========================

export interface WorkspaceResponse {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  settings?: WorkspaceSettings
  createdAt: string
  updatedAt: string
}

export interface WorkspaceCreateRequest {
  name: string
  description?: string
  icon?: string
  color?: string
  settings?: WorkspaceSettings
}

export interface WorkspaceUpdateRequest {
  name?: string
  description?: string
  icon?: string
  color?: string
  settings?: WorkspaceSettings
}

export interface WorkspaceSettings {
  defaultTableView?: 'board' | 'table' | 'calendar'
  allowGuestAccess?: boolean
  features?: {
    tables?: boolean
    documents?: boolean
    expenses?: boolean
    projects?: boolean
  }
}

// ===========================
// List Response Types
// ===========================

export interface WorkspaceListResponse {
  workspaces: WorkspaceResponse[]
  totalCount: number
}

export interface WorkspaceListParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortDirection?: 'asc' | 'desc'
}

// ===========================
// Member Management Types
// ===========================

export interface WorkspaceMember {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: string
  joinedAt: string
}

export interface WorkspaceMemberListResponse {
  members: WorkspaceMember[]
  totalCount: number
}

export interface WorkspaceInviteRequest {
  email: string
  role: string
  message?: string
}

export interface WorkspaceInviteResponse {
  id: string
  workspaceId: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: string
  createdAt: string
}

// ===========================
// Repository Interface
// ===========================

export interface IWorkspaceRepository {
  // Workspace CRUD
  listWorkspaces(params?: WorkspaceListParams): Promise<WorkspaceListResponse>
  getWorkspace(id: string): Promise<WorkspaceResponse>
  createWorkspace(data: WorkspaceCreateRequest): Promise<WorkspaceResponse>
  updateWorkspace(id: string, data: WorkspaceUpdateRequest): Promise<WorkspaceResponse>
  deleteWorkspace(id: string): Promise<void>
  
  // Member Management
  listMembers(workspaceId: string): Promise<WorkspaceMemberListResponse>
  inviteMember(workspaceId: string, data: WorkspaceInviteRequest): Promise<WorkspaceInviteResponse>
  removeMember(workspaceId: string, memberId: string): Promise<void>
  updateMemberRole(workspaceId: string, memberId: string, role: string): Promise<WorkspaceMember>
  
  // Current Workspace
  getCurrentWorkspace(): Promise<WorkspaceResponse | null>
  setCurrentWorkspace(id: string): Promise<void>
}