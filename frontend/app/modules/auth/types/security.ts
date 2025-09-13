/**
 * Security-related type definitions
 * Industry-standard security types separated from business logic
 */

/**
 * User security settings
 */
export interface SecuritySettings {
  userId: string
  twoFactorEnabled: boolean
  twoFactorVerified?: boolean
  lastPasswordChange?: Date
  passwordExpiresAt?: Date
  loginAttempts?: number
  accountLockedUntil?: Date
  trustedDevices?: string[]
  securityQuestions?: {
    questionId: string
    isAnswered: boolean
  }[]
}

/**
 * Security session state
 */
export interface SecuritySession {
  twoFactorRequired: boolean
  twoFactorVerified: boolean
  sessionExpiresAt: Date
  ipAddress?: string
  userAgent?: string
  deviceId?: string
}

/**
 * Security event types for audit logging
 */
export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'two_factor_verified'
  | 'account_locked'
  | 'account_unlocked'

/**
 * Security audit log entry
 */
export interface SecurityAuditLog {
  id: string
  userId: string
  eventType: SecurityEventType
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  success: boolean
  details?: Record<string, unknown>
}