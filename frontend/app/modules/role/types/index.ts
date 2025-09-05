/**
 * Role Types
 * ロール管理関連の型定義
 */

// ===========================
// Base Role Types
// ===========================

// Local type definitions and schemas
import { z } from 'zod'

// Local type definitions (replacing missing generated types)
export interface RoleResponse {
  id: string
  name: string
  displayName: string
  permissions: readonly string[]
  tenantId?: string
  position?: number
  color?: string
  isSystem?: boolean
  userCount?: number
  createdAt?: string
  updatedAt?: string
}

// Zod schemas for validation
const _RoleCreateRequestSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  permissions: z.array(z.string()).optional(),
  color: z.string().optional(),
  position: z.number().optional()
})

const _RoleUpdateRequestSchema = z.object({
  name: z.string().optional(),
  displayName: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  color: z.string().optional(),
  position: z.number().optional()
})

// Extract types from Zod schemas
export type RoleCreateRequest = z.infer<typeof _RoleCreateRequestSchema>
export type RoleUpdateRequest = z.infer<typeof _RoleUpdateRequestSchema>


export interface RoleReorderRequest {
  positions: Record<string, number>
}

export interface RoleDuplicateRequest {
  newName: string
  includePermissions: boolean  // オプショナルを削除してAPI契約と一致
}

// ===========================
// Permission Types
// ===========================

export interface Permission {
  rule: string
  resource?: string
  action?: string
  description?: string
  category?: string
}

export interface PermissionGrantRequest {
  permissions: string[]
}

export interface PermissionRevokeRequest {
  permissions: string[]
}

export interface PermissionGrantResult {
  roleId: string
  granted: string[]
  failed: Record<string, string>
  totalGranted: number
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

export interface IRoleRepository {
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