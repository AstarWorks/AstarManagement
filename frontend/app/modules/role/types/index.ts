/**
 * Role Types
 * ロール管理関連の型定義
 */

import type { schemas } from '@shared/api/zod-client'
import type { z } from 'zod'

// OpenAPI型は中央集約型からインポート
import type {
  RoleResponse,
  RoleCreateRequestDto,
  RoleUpdateRequest,
  RoleReorderRequest,
  PermissionRule,
  PermissionGrantRequest,
  PermissionGrantResult,
  PermissionSyncRequest,
  PermissionSyncResult,
  PermissionBulkDeleteRequest
} from '~/types'

// OpenAPI型を再エクスポート（互換性のため）
export type {
  RoleResponse,
  RoleUpdateRequest,
  RoleReorderRequest,
  PermissionRule,
  PermissionGrantRequest,
  PermissionGrantResult,
  PermissionSyncRequest,
  PermissionSyncResult,
  PermissionBulkDeleteRequest
}

// RoleCreateRequestのエイリアス
export type RoleCreateRequest = RoleCreateRequestDto

// ===========================
// Zod Validated Types
// ===========================

// Zod検証済み型（必要に応じて使用）
export type RoleResponseValidated = z.infer<typeof schemas.RoleResponse>
export type RoleUpdateRequestValidated = z.infer<typeof schemas.RoleUpdateRequest>
export type PermissionGrantResultValidated = z.infer<typeof schemas.PermissionGrantResult>
export type RoleCreateRequestValidated = z.infer<typeof schemas.RoleCreateRequestDto>

// ===========================
// Custom Extension Types
// ===========================

// API仕様にない独自の型定義
export interface RoleDuplicateRequest {
  newName: string
  includePermissions: boolean
}

export interface PermissionRevokeRequest {
  permissions: string[]
}

export interface PermissionRevokeResult {
  roleId: string
  revoked: string[]
  failed: Record<string, string>
  totalRevoked: number
}

// ===========================
// Role Template Types
// ===========================

export interface RoleTemplate {
  id: string
  name: string
  displayName: string
  description?: string
  color: string
  position: number
  permissions: string[]
  category?: string
  isRecommended?: boolean
}

export interface RoleTemplateCategory {
  id: string
  name: string
  displayName: string
  description?: string
  templates: RoleTemplate[]
}

// ===========================
// List & Filter Types
// ===========================

export interface RoleListResponse {
  roles: RoleResponse[]
  totalCount: number
}

export interface RoleListParams {
  includePermissions?: boolean
  includeUserCount?: boolean
  includeSystem?: boolean
  sortBy?: 'name' | 'position' | 'createdAt' | 'updatedAt'
  sortDirection?: 'asc' | 'desc'
}

// ===========================
// Permission Catalog
// ===========================

export interface PermissionCatalog {
  categories: PermissionCategory[]
  totalPermissions: number
}

export interface PermissionCategory {
  name: string
  displayName: string
  description?: string
  permissions: PermissionDefinition[]
}

export interface PermissionDefinition {
  rule: string
  displayName: string
  description?: string
  resourceType?: string
  actions?: string[]
  isAdvanced?: boolean
  category?: string
}

// ===========================
// Repository Interface
// ===========================

export interface RoleRepository {
  // Role CRUD Operations
  listRoles(params?: RoleListParams): Promise<RoleListResponse>
  getRole(roleId: string): Promise<RoleResponse>
  createRole(data: RoleCreateRequest): Promise<RoleResponse>
  updateRole(roleId: string, data: RoleUpdateRequest): Promise<RoleResponse>
  deleteRole(roleId: string): Promise<void>
  
  // Role Operations
  duplicateRole(roleId: string, data: RoleDuplicateRequest): Promise<RoleResponse>
  reorderRoles(data: RoleReorderRequest): Promise<RoleResponse[]>
  
  // Permission Management
  getRolePermissions(roleId: string): Promise<string[]>
  grantPermissions(roleId: string, data: PermissionGrantRequest): Promise<PermissionGrantResult>
  revokePermissions(roleId: string, data: PermissionRevokeRequest): Promise<PermissionRevokeResult>
  
  // Permission Catalog
  getPermissionCatalog(): Promise<PermissionCatalog>
  searchPermissions(query: string): Promise<PermissionDefinition[]>
  
  // Role Templates
  getRoleTemplates(): Promise<RoleTemplateCategory[]>
  applyRoleTemplate(templateId: string): Promise<RoleResponse>
  
  // Role Statistics
  getRoleStatistics(roleId: string): Promise<{
    userCount: number
    permissionCount: number
    lastModified: string
    createdBy?: string
  }>
}