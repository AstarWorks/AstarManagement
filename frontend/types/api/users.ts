/**
 * User API Type Definitions
 * 
 * Type definitions for user management and authentication
 */

import type { 
  AuditableEntity, 
  SoftDeletableEntity,
  NotificationPreference,
  DateRange
} from './common'

/**
 * User entity
 */
export interface User extends AuditableEntity, SoftDeletableEntity {
  id: string
  email: string
  name: string
  phoneNumber?: string
  avatar?: string
  status: UserStatus
  role: Role
  permissions: Permission[]
  twoFactorEnabled: boolean
  emailVerified: boolean
  phoneVerified: boolean
  lastLoginAt?: string
  passwordChangedAt?: string
  preferredLanguage: Language
  timezone: string
  notificationPreferences: NotificationPreference[]
  metadata?: UserMetadata
}

/**
 * User status
 */
export type UserStatus = 
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'PENDING_VERIFICATION'

/**
 * Role definitions
 */
export interface Role {
  id: string
  name: string
  displayName: string
  description?: string
  permissions: Permission[]
  isDefault: boolean
  isSystem: boolean
  priority: number
}

/**
 * Permission definitions
 */
export interface Permission {
  id: string
  resource: string
  action: PermissionAction
  scope?: PermissionScope
  conditions?: PermissionCondition[]
}

/**
 * Permission actions
 */
export type PermissionAction = 
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'MANAGE'
  | 'SETTINGS'

/**
 * Permission scopes
 */
export type PermissionScope = 
  | 'OWN'      // Own resources only
  | 'TEAM'     // Team resources
  | 'ALL'      // All resources

/**
 * Permission conditions
 */
export interface PermissionCondition {
  field: string
  operator: 'equals' | 'notEquals' | 'in' | 'notIn' | 'contains'
  value: unknown
}

/**
 * Supported languages
 */
export type Language = 'en' | 'ja'

/**
 * User metadata
 */
export interface UserMetadata {
  barNumber?: string              // Legal bar number
  practiceAreas?: string[]        // Areas of legal practice
  yearsOfExperience?: number      // Years practicing law
  firmName?: string              // Law firm name
  department?: string            // Department within firm
  billableRate?: number          // Hourly billable rate
  targetHours?: number           // Annual billable hours target
  assistantEmail?: string        // Legal assistant's email
  officeLocation?: string        // Office location
  bio?: string                  // Professional biography
}

/**
 * User profile (public view)
 */
export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  role: RoleSummary
  practiceAreas?: string[]
  bio?: string
  officeLocation?: string
}

/**
 * Role summary
 */
export interface RoleSummary {
  id: string
  name: string
  displayName: string
}

/**
 * User session
 */
export interface UserSession {
  id: string
  userId: string
  device: DeviceInfo
  ipAddress: string
  location?: LocationInfo
  createdAt: string
  lastActiveAt: string
  expiresAt: string
}

/**
 * Device information
 */
export interface DeviceInfo {
  userAgent: string
  browser?: string
  os?: string
  device?: string
  isMobile: boolean
}

/**
 * Location information
 */
export interface LocationInfo {
  city?: string
  region?: string
  country?: string
  timezone?: string
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string
  name: string
  password: string
  roleId: string
  phoneNumber?: string
  preferredLanguage?: Language
  timezone?: string
  metadata?: UserMetadata
  sendWelcomeEmail?: boolean
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  name?: string
  phoneNumber?: string
  avatar?: string
  preferredLanguage?: Language
  timezone?: string
  notificationPreferences?: NotificationPreference[]
  metadata?: UserMetadata
}

/**
 * Update user status request
 */
export interface UpdateUserStatusRequest {
  status: UserStatus
  reason?: string
  suspensionEndDate?: string // For temporary suspension
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  logoutOtherSessions?: boolean
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/**
 * Two-factor authentication setup
 */
export interface TwoFactorSetupRequest {
  method: TwoFactorMethod
  phoneNumber?: string // For SMS method
}

/**
 * Two-factor methods
 */
export type TwoFactorMethod = 'TOTP' | 'SMS' | 'EMAIL'

/**
 * Two-factor setup response
 */
export interface TwoFactorSetupResponse {
  method: TwoFactorMethod
  secret?: string        // For TOTP
  qrCode?: string       // QR code image URL for TOTP
  backupCodes?: string[] // One-time backup codes
}

/**
 * User query parameters
 */
export interface UserQueryParams {
  page?: number
  size?: number
  sort?: string | string[]
  search?: string              // Search in name, email
  status?: UserStatus | UserStatus[]
  roleId?: string | string[]
  hasPermission?: string       // Filter by permission
  createdDateRange?: DateRange
  lastLoginDateRange?: DateRange
  includeDeleted?: boolean
}

/**
 * User invitation
 */
export interface UserInvitation {
  id: string
  email: string
  roleId: string
  invitedBy: UserProfile
  createdAt: string
  expiresAt: string
  acceptedAt?: string
  metadata?: Record<string, unknown>
}

/**
 * Create invitation request
 */
export interface CreateInvitationRequest {
  email: string
  roleId: string
  message?: string
  metadata?: Record<string, unknown>
  expiresInDays?: number // Default: 7 days
}

/**
 * User activity log
 */
export interface UserActivity {
  id: string
  userId: string
  action: ActivityAction
  resource?: string
  resourceId?: string
  ipAddress: string
  userAgent: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * Activity actions
 */
export type ActivityAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'SETTINGS_CHANGE'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'TWO_FACTOR_ENABLED'
  | 'TWO_FACTOR_DISABLED'
  | 'API_KEY_CREATED'
  | 'API_KEY_DELETED'

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  dashboardLayout: DashboardLayout
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  autoLogoutMinutes?: number
  defaultMatterView: 'kanban' | 'list' | 'calendar'
  dateFormat: string
  timeFormat: '12h' | '24h'
  firstDayOfWeek: 0 | 1 | 6 // Sunday, Monday, Saturday
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  widgets: DashboardWidget[]
  columns: number
}

/**
 * Dashboard widget
 */
export interface DashboardWidget {
  id: string
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  config?: Record<string, unknown>
}

/**
 * API key for programmatic access
 */
export interface ApiKey {
  id: string
  name: string
  key: string // Only shown once on creation
  lastUsedAt?: string
  expiresAt?: string
  permissions: Permission[]
  createdAt: string
  createdBy: UserProfile
}

/**
 * Create API key request
 */
export interface CreateApiKeyRequest {
  name: string
  permissions?: string[] // Permission IDs
  expiresInDays?: number // Optional expiration
}

/**
 * User statistics
 */
export interface UserStatistics {
  totalUsers: number
  byStatus: Record<UserStatus, number>
  byRole: Record<string, number>
  activeToday: number
  activeThisWeek: number
  activeThisMonth: number
  averageSessionDuration: number // In minutes
  topPermissions: Array<{
    permission: string
    count: number
  }>
}

/**
 * Type guards
 */
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'role' in obj
  )
}

export function isActiveUser(user: User): boolean {
  return user.status === 'ACTIVE' && user.emailVerified
}

export function hasPermission(
  user: User, 
  resource: string, 
  action: PermissionAction
): boolean {
  return user.permissions.some(p => 
    p.resource === resource && p.action === action
  )
}

export function hasRole(user: User, roleName: string): boolean {
  return user.role.name === roleName
}

/**
 * Permission helpers
 */
export function canAccessMatter(user: User, matterId: string): boolean {
  // Check if user has general matter access
  if (hasPermission(user, 'matter', 'READ')) {
    // Check scope
    const permission = user.permissions.find(p => 
      p.resource === 'matter' && p.action === 'READ'
    )
    
    if (permission?.scope === 'ALL') return true
    if (permission?.scope === 'OWN') {
      // Would need to check if user owns the matter
      // This is just an example
      return true
    }
  }
  
  return false
}

/**
 * Role priority comparison
 */
export function compareRoles(a: Role, b: Role): number {
  return b.priority - a.priority
}