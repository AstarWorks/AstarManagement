/**
 * Dashboard Types
 * Type definitions for dashboard data structures
 */

/**
 * Dashboard statistics item
 */
export interface IDashboardStats {
  key: string
  labelKey: string
  icon: string
  value: number
  change: string
  format?: 'number' | 'currency'
}

/**
 * Activity types for recent activities
 */
export type ActivityType = 'case' | 'document' | 'deadline' | 'client'

/**
 * Recent activity item
 */
export interface IActivity {
  id: string
  type: ActivityType
  title: string
  subtitle: string
  timestamp: Date
}

/**
 * Complete dashboard data response
 */
export interface IDashboardData {
  stats: IDashboardStats[]
  recentActivities: IActivity[]
}

/**
 * Dashboard statistics parameters
 */
export interface IDashboardStatsParams {
  period?: 'day' | 'week' | 'month' | 'year'
  dateFrom?: string
  dateTo?: string
}

/**
 * Recent activities parameters
 */
export interface IRecentActivitiesParams {
  limit?: number
  type?: ActivityType
  dateFrom?: string
  dateTo?: string
}

/**
 * Dashboard refresh parameters
 */
export interface IDashboardRefreshParams {
  forceRefresh?: boolean
  includeStats?: boolean
  includeActivities?: boolean
}