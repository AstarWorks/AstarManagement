/**
 * User Types
 * ユーザー関連の型定義
 */

import type { schemas } from '@shared/api/zod-client'
import type { z } from 'zod'

// OpenAPI型は中央集約型からインポート
import type {
  UserResponse,
  UserUpdateRequest,
  UserProfileResponse,
  UserProfileUpdateRequest,
  UserRoleAssignmentRequest,
  UserRoleAssignmentResult,
  CurrentUserResponse,
  UserDetailResponse,
  UserSearchResponse,
  UserPermissionsResponse,
  RoleResponse,
  PermissionRule
} from '~/types'

// ===========================
// OpenAPI/Zod Generated Types
// ===========================

// OpenAPI型を再エクスポート（互換性のため）
export type {
  UserResponse,
  UserUpdateRequest,
  UserProfileResponse,
  UserProfileUpdateRequest,
  UserRoleAssignmentRequest,
  UserRoleAssignmentResult,
  CurrentUserResponse,
  UserDetailResponse,
  UserSearchResponse,
  UserPermissionsResponse,
  RoleResponse,
  PermissionRule
}

// Zod検証済み型（必要に応じて使用）
export type UserResponseValidated = z.infer<typeof schemas.UserResponse>
export type UserProfileResponseValidated = z.infer<typeof schemas.UserProfileResponse>
// RoleResponseValidatedは削除（role/typesで定義済み）
export type UserRoleAssignmentResultValidated = z.infer<typeof schemas.UserRoleAssignmentResult>

// ===========================
// Custom Extension Types
// ===========================

// UserProfileは完全なユーザー情報を表す型
// Vue 3 Composition APIパターンに準拠してreadonly配列を使用
// UserProfileをOpenAPIのUserProfileResponseを拡張して定義
export interface UserProfile extends Partial<UserProfileResponse> {
  // Additional fields not in UserProfileResponse
  email: string
  name: string
  bio?: string
  phone?: string
  department?: string
  position?: string
  team?: string
  skills?: readonly string[]
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
  roles?: readonly RoleResponse[]
  permissions?: readonly string[]
  isActive?: boolean
  
  // Note: avatarUrl from UserProfileResponse is mapped to avatar in UI
  avatar?: string
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
// UserPermissionsResponse is already exported from OpenAPI schemas above

// ===========================
// User Management Types
// ===========================

// UserCreateRequestはAPIに存在しないため独自定義
export interface UserCreateRequest {
  email: string
  name: string
  displayName?: string
  password?: string
  roles?: string[]
  sendWelcomeEmail?: boolean
}


// ===========================
// List & Filter Types
// ===========================

// UserListResponseは削除済み - UserSearchResponseを直接使用してください

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

// CurrentUserは削除済み - CurrentUserResponseを直接使用してください

// ===========================
// User Statistics (既存互換性維持)
// ===========================

export interface UserStats {
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

export interface UserStatsParams {
  period?: 'day' | 'week' | 'month' | 'year'
  from?: string
  to?: string
}

// ===========================
// Repository Interface
// ===========================

export interface UserRepository {
  // Current User Operations
  getCurrentUser(): Promise<CurrentUserResponse>
  getMyRoles(): Promise<RoleResponse[]>
  getMyPermissions(): Promise<UserPermissionsResponse>
  updateMyProfile(data: Partial<UserProfile>): Promise<UserProfile>
  updateMyPreferences(preferences: UserPreferences): Promise<UserPreferences>
  
  // User CRUD Operations
  listUsers(params?: UserListParams): Promise<UserSearchResponse>
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
  
  // Legacy methods for backward compatibility
  getProfile(id: string): Promise<UserProfile>
  getStats(id: string, params?: UserStatsParams): Promise<UserStats>
  updateProfile(id: string, data: UpdateUserProfileDto): Promise<UserProfile>
  uploadAvatar(id: string, file: File): Promise<string>
  removeAvatar(id: string): Promise<void>
}

// ===========================
// Legacy Re-exports (互換性維持)
// ===========================

// IUserPreferencesは削除済み - UserPreferencesを直接使用してください
export type UpdateUserProfileDto = UserUpdateRequest & {
  phone?: string
  team?: string
  position?: string
  preferences?: Partial<UserPreferences>
}