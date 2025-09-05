/**
 * User Types
 * ユーザー関連の型定義
 */

import { z } from 'zod'

// Local type definitions (replacing missing generated types)
export interface RoleResponse {
  id: string
  name: string
  displayName: string
  permissions: readonly string[]
}

export interface UserRoleAssignmentResult {
  success: boolean
  assignedRoles: RoleResponse[]
  errors?: string[]
}

// Zod schemas for validation
const _UserRoleAssignmentRequestSchema = z.object({
  roleIds: z.array(z.string()),
  replace: z.boolean().optional()
})

export type UserRoleAssignmentRequest = z.infer<typeof _UserRoleAssignmentRequestSchema>

// ===========================
// Base User Types
// ===========================

export interface UserResponse {
  id: string
  email: string
  name: string
  displayName?: string
  avatarUrl?: string
  locale?: string
  timezone?: string
  status: 'active' | 'inactive' | 'suspended'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

// UserProfileは完全なユーザー情報を表す型
// Vue 3 Composition APIパターンに準拠してreadonly配列を使用
export interface UserProfile {
  id: string  // Changed from userId to id for consistency
  email: string
  name: string
  displayName?: string
  avatar?: string  // avatarUrl -> avatar for consistency
  bio?: string
  phone?: string
  department?: string
  position?: string
  team?: string
  skills?: readonly string[]  // readonly配列に変更
  socialLinks?: {
    twitter?: string
    github?: string
    linkedin?: string
  }
  preferences?: UserPreferences
  
  // Organization/Tenant info
  organizationId?: string
  organizationName?: string
  tenantId?: string
  tenantUserId?: string
  
  // Roles and permissions
  roles?: readonly RoleResponse[]  // readonly配列に変更
  permissions?: readonly string[]  // readonly配列に変更
  isActive?: boolean
  
  // Timestamps
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  notifications?: {
    email?: boolean
    browser?: boolean  // Vueコンポーネントで使用されている名称に統一
    mobile?: boolean
  }
  defaultWorkspaceId?: string
}

// ===========================
// Role & Permission Types
// ===========================

export interface UserPermissionsResponse {
  userId: string
  tenantUserId: string
  roles: RoleResponse[]
  effectivePermissions: string[]
  permissionsByRole: Record<string, string[]>
}

// ===========================
// User Management Types
// ===========================

export interface UserCreateRequest {
  email: string
  name: string
  displayName?: string
  password?: string
  roles?: string[]
  sendWelcomeEmail?: boolean
}

export interface UserUpdateRequest {
  name?: string
  displayName?: string
  avatarUrl?: string
  locale?: string
  timezone?: string
  status?: 'active' | 'inactive' | 'suspended'
}


// ===========================
// List & Filter Types
// ===========================

export interface UserListResponse {
  users: UserResponse[]
  totalCount: number
}

export interface UserListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: 'active' | 'inactive' | 'suspended' | 'all'
  roleId?: string
  sortBy?: 'name' | 'email' | 'createdAt' | 'updatedAt'
  sortDirection?: 'asc' | 'desc'
}

// ===========================
// Tenant User Types
// ===========================

export interface TenantUser {
  id: string
  userId: string
  tenantId: string
  roles: RoleResponse[]
  isOwner: boolean
  joinedAt: string
  lastActiveAt?: string
}

export interface TenantUserListResponse {
  users: TenantUser[]
  totalCount: number
}

// ===========================
// Authentication Types
// ===========================

// CurrentUserはUserProfileのサブセット（セッションで利用可能な情報）
export type CurrentUser = Pick<UserProfile, 
  'id' | 'email' | 'name' | 'displayName' | 
  'tenantUserId' | 'tenantId' | 'roles' | 'permissions'> & {
  avatarUrl?: string  // Keep for backward compatibility
}

// ===========================
// User Statistics (既存互換性維持)
// ===========================

export interface IUserStats {
  // Activity stats
  activeCases: number
  tasksToday: number
  unreadMessages: number
  
  // Financial stats
  totalRevenue?: number
  pendingInvoices?: number
  
  // Time stats
  hoursThisWeek?: number
  hoursThisMonth?: number
  
  // Performance metrics
  completionRate?: number
  averageResponseTime?: number
}

export interface IUserStatsParams {
  period?: 'day' | 'week' | 'month' | 'year'
  from?: string
  to?: string
}

// ===========================
// Repository Interface
// ===========================

export interface IUserRepository {
  // Current User Operations
  getCurrentUser(): Promise<CurrentUser>
  getMyRoles(): Promise<RoleResponse[]>
  getMyPermissions(): Promise<UserPermissionsResponse>
  updateMyProfile(data: Partial<UserProfile>): Promise<UserProfile>
  updateMyPreferences(preferences: UserPreferences): Promise<UserPreferences>
  
  // User CRUD Operations
  listUsers(params?: UserListParams): Promise<UserListResponse>
  getUser(userId: string): Promise<UserResponse>
  createUser(data: UserCreateRequest): Promise<UserResponse>
  updateUser(userId: string, data: UserUpdateRequest): Promise<UserResponse>
  deleteUser(userId: string): Promise<void>
  
  // User Role Management
  getUserRoles(userId: string): Promise<RoleResponse[]>
  assignUserRoles(userId: string, data: UserRoleAssignmentRequest): Promise<UserRoleAssignmentResult>
  removeUserRole(userId: string, roleId: string): Promise<void>
  
  // Tenant User Operations
  listTenantUsers(tenantId: string): Promise<TenantUserListResponse>
  getTenantUser(tenantUserId: string): Promise<TenantUser>
  
  // User Search & Filter
  searchUsers(query: string): Promise<UserResponse[]>
  getUsersByRole(roleId: string): Promise<UserResponse[]>
  getUsersByStatus(status: 'active' | 'inactive' | 'suspended'): Promise<UserResponse[]>
}

// ===========================
// Legacy Re-exports (互換性維持)
// ===========================

export type IUserPreferences = UserPreferences
export type IUpdateUserProfileDto = UserUpdateRequest & {
  phone?: string
  team?: string
  position?: string
  preferences?: Partial<UserPreferences>
}