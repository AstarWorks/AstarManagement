/**
 * User module type definitions
 */

// Re-export profile types from auth module for now
export type { IBusinessProfile as IUserProfile, IBusinessRole as IUserRole } from '@modules/auth/types/business-profile'

/**
 * User statistics
 */
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

/**
 * User preferences extension
 */
export interface IUserPreferences {
  language: string
  timezone: string
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    browser: boolean
    mobile: boolean
  }
  dashboard?: {
    widgets: string[]
    layout: 'grid' | 'list'
  }
}

/**
 * Parameters for fetching user stats
 */
export interface IUserStatsParams {
  period?: 'day' | 'week' | 'month' | 'year'
  from?: string
  to?: string
}

/**
 * User profile update DTO
 */
export interface IUpdateUserProfileDto {
  name?: string
  displayName?: string
  phone?: string
  team?: string
  position?: string
  preferences?: Partial<IUserPreferences>
}