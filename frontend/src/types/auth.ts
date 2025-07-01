/**
 * Authentication and Authorization Types
 * 
 * This file contains all TypeScript interfaces and types related to
 * authentication, authorization, and user management.
 */

// Core User Types
export interface User {
  /** Unique user identifier */
  id: string
  /** User's email address */
  email: string
  /** User's display name */
  name: string
  /** User's role in the system */
  role: UserRole
  /** List of user permissions */
  permissions: string[]
  /** User's avatar URL */
  avatar?: string
  /** Whether two-factor authentication is enabled */
  twoFactorEnabled: boolean
  /** Last login timestamp */
  lastLoginAt?: string
  /** User profile information */
  profile?: UserProfile
  /** Account status */
  status: UserStatus
  /** Account creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
}

export interface UserProfile {
  /** User's first name */
  firstName: string
  /** User's last name */
  lastName: string
  /** Professional title */
  title?: string
  /** Department or team */
  department?: string
  /** Phone number */
  phone?: string
  /** Time zone preference */
  timezone?: string
  /** Language preference */
  language?: string
  /** Bio or description */
  bio?: string
  /** Social media links */
  socialLinks?: SocialLinks
}

export interface SocialLinks {
  linkedin?: string
  twitter?: string
  website?: string
}

// User Role and Status
export type UserRole = 'admin' | 'lawyer' | 'clerk' | 'client'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'

// Authentication Request/Response Types
export interface LoginCredentials {
  /** User's email address */
  email: string
  /** User's password */
  password: string
  /** Remember user for extended session */
  rememberMe?: boolean
}

export interface TwoFactorCredentials {
  /** 6-digit verification code */
  code: string
  /** Trust this device for 30 days */
  trustDevice?: boolean
}

export interface AuthResponse {
  /** Authenticated user data */
  user: User
  /** Whether two-factor authentication is required */
  requiresTwoFactor?: boolean
  /** Session identifier */
  sessionId: string
  /** Token expiration timestamp */
  expiresAt: number
  /** Refresh token expiration */
  refreshExpiresAt?: number
}

export interface SessionInfo {
  /** Session identifier */
  sessionId: string
  /** Session creation time */
  createdAt: string
  /** Last activity time */
  lastActivity: string
  /** Session expiration time */
  expiresAt: string
  /** IP address */
  ipAddress: string
  /** User agent string */
  userAgent: string
  /** Whether session is active */
  isActive: boolean
  /** Device information */
  device?: DeviceInfo
}

export interface DeviceInfo {
  /** Device type */
  type: 'desktop' | 'mobile' | 'tablet'
  /** Operating system */
  os: string
  /** Browser information */
  browser: string
  /** Whether device is trusted */
  isTrusted: boolean
}

// Authentication State
export interface AuthState {
  /** Current authenticated user */
  user: User | null
  /** Whether user is authenticated */
  isAuthenticated: boolean
  /** Whether awaiting 2FA verification */
  pendingTwoFactor: boolean
  /** Loading state for auth operations */
  isLoading: boolean
  /** Current error message */
  error: string | null
  /** Current session identifier */
  sessionId: string | null
  /** Last activity timestamp */
  lastActivity: number
  /** Promise for ongoing refresh operation */
  refreshPromise: Promise<void> | null
}

// Permission and Role Types
export interface Permission {
  /** Permission identifier */
  id: string
  /** Permission name */
  name: string
  /** Permission description */
  description: string
  /** Permission category */
  category: PermissionCategory
  /** Whether permission is system-level */
  isSystem: boolean
}

export type PermissionCategory = 
  | 'matter' 
  | 'document' 
  | 'client' 
  | 'billing' 
  | 'report' 
  | 'admin' 
  | 'system'

export interface Role {
  /** Role identifier */
  id: string
  /** Role name */
  name: string
  /** Role description */
  description: string
  /** List of permissions */
  permissions: string[]
  /** Whether role is system-defined */
  isSystem: boolean
  /** Role color for UI */
  color?: string
}

// Password Management
export interface PasswordResetRequest {
  /** User's email address */
  email: string
}

export interface PasswordResetCredentials {
  /** Reset token from email */
  token: string
  /** New password */
  newPassword: string
  /** Confirm new password */
  confirmPassword: string
}

export interface PasswordChangeCredentials {
  /** Current password */
  currentPassword: string
  /** New password */
  newPassword: string
  /** Confirm new password */
  confirmPassword: string
}

// Two-Factor Authentication
export interface TwoFactorSetup {
  /** QR code for authenticator app */
  qrCode: string
  /** Secret key for manual entry */
  secret: string
  /** Backup codes for recovery */
  backupCodes: string[]
}

export interface TwoFactorStatus {
  /** Whether 2FA is enabled */
  enabled: boolean
  /** Setup completion status */
  isSetupComplete: boolean
  /** Number of backup codes remaining */
  backupCodesRemaining: number
  /** Last verification timestamp */
  lastVerifiedAt?: string
}

// Error Types
export interface AuthError {
  /** Error message */
  message: string
  /** Error code */
  code: string
  /** Additional error details */
  details?: Record<string, any>
}

export interface ValidationError extends AuthError {
  /** Field-specific errors */
  fieldErrors: Record<string, string[]>
}

export interface RateLimitError extends AuthError {
  /** Seconds until retry is allowed */
  retryAfter: number
}

// API Response Types
export interface ApiResponse<T = any> {
  /** Response data */
  data: T
  /** Success status */
  success: boolean
  /** Response message */
  message?: string
  /** Response metadata */
  meta?: Record<string, any>
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  /** Pagination metadata */
  pagination: {
    /** Current page number */
    page: number
    /** Items per page */
    limit: number
    /** Total number of items */
    total: number
    /** Total number of pages */
    totalPages: number
    /** Whether there are more pages */
    hasNext: boolean
    /** Whether there are previous pages */
    hasPrev: boolean
  }
}

// Route Protection Types
export interface RoutePermissions {
  /** Required permissions for route access */
  permissions?: string[]
  /** Required roles for route access */
  roles?: UserRole[]
  /** Whether route requires authentication */
  requiresAuth?: boolean
  /** Whether route allows anonymous access */
  allowAnonymous?: boolean
}

// Audit and Security Types
export interface SecurityEvent {
  /** Event identifier */
  id: string
  /** Event type */
  type: SecurityEventType
  /** User who triggered the event */
  userId?: string
  /** Event timestamp */
  timestamp: string
  /** IP address */
  ipAddress: string
  /** User agent */
  userAgent: string
  /** Event metadata */
  metadata: Record<string, any>
  /** Risk score (0-100) */
  riskScore: number
}

export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_change'
  | 'password_reset'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_verification'
  | 'session_created'
  | 'session_expired'
  | 'permission_denied'
  | 'suspicious_activity'

// Composable Return Types
export interface UseAuthReturn {
  // State
  user: ComputedRef<User | null>
  isAuthenticated: ComputedRef<boolean>
  isLoading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  pendingTwoFactor: ComputedRef<boolean>
  permissions: ComputedRef<string[]>
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  verify2FA: (credentials: TwoFactorCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  restoreSession: () => Promise<boolean>
  
  // Permission helpers
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  hasRole: (role: string) => boolean
  
  // Utility functions
  initializeCSRF: () => Promise<void>
  setupTokenRefresh: () => number
  clearError: () => void
  updateActivity: () => void
  getSessionTimeRemaining: () => number
  
  // Password management
  forgotPassword: (email: string) => Promise<{ success: boolean }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean }>
  
  // Two-factor authentication
  enableTwoFactor: () => Promise<TwoFactorSetup>
  disableTwoFactor: (code: string) => Promise<{ success: boolean }>
}

// Form Validation Types
export interface FormValidationResult {
  /** Whether form is valid */
  isValid: boolean
  /** Field-specific errors */
  errors: Record<string, string>
  /** Touched fields */
  touched: Record<string, boolean>
}

// Cookie Configuration
export interface CookieConfig {
  /** Cookie name */
  name: string
  /** Default value */
  default: string | boolean | number
  /** Whether cookie is httpOnly */
  httpOnly: boolean
  /** Whether cookie requires HTTPS */
  secure: boolean
  /** SameSite policy */
  sameSite: 'strict' | 'lax' | 'none'
  /** Cookie expiration in seconds */
  maxAge?: number
  /** Cookie domain */
  domain?: string
  /** Cookie path */
  path?: string
}