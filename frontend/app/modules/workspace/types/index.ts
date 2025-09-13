/**
 * Workspace Types
 * ワークスペース関連の型定義
 */

import type { schemas } from '@shared/api/zod-client'
import type { z } from 'zod'

// OpenAPI型は中央集約型からインポート
import type {
  WorkspaceResponse,
  WorkspaceCreateRequest,
  WorkspaceUpdateRequest,
  WorkspaceListResponse,
  JsonObject
} from '~/types'

// OpenAPI型を再エクスポート（互換性のため）
export type {
  WorkspaceResponse,
  WorkspaceCreateRequest,
  WorkspaceUpdateRequest,
  WorkspaceListResponse
}

// ===========================
// Zod Validated Types
// ===========================

// Zod検証済み型（必要に応じて使用）
export type WorkspaceResponseValidated = z.infer<typeof schemas.WorkspaceResponse>
export type WorkspaceCreateRequestValidated = z.infer<typeof schemas.WorkspaceCreateRequest>
export type WorkspaceUpdateRequestValidated = z.infer<typeof schemas.WorkspaceUpdateRequest>

// ===========================
// Custom Extension Types
// ===========================

// 独自のWorkspace設定型（OpenAPIに含まれない詳細設定）
// WorkspaceSettingsはOpenAPIのJsonObjectと互換性を持たせつつ型安全性を提供
export interface WorkspaceSettings extends Partial<JsonObject> {
  defaultTableView?: 'board' | 'table' | 'calendar'
  allowGuestAccess?: boolean
  features?: {
    tables?: boolean
    documents?: boolean
    expenses?: boolean
    projects?: boolean
  }
  // Additional settings can be added while maintaining JsonObject compatibility
  [key: string]: unknown
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

export interface WorkspaceRepository {
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