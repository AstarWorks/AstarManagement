/**
 * Dashboard Repository Interface
 * Defines the contract for dashboard data operations
 */

import type { 
  DashboardData,
  DashboardStats, 
  Activity, 
  DashboardStatsParams, 
  RecentActivitiesParams,
  DashboardRefreshParams
} from '../types'

export interface DashboardRepository {
  /**
   * Get dashboard statistics
   */
  getStats(params?: DashboardStatsParams): Promise<DashboardStats[]>
  
  /**
   * Get recent activities
   */
  getRecentActivities(params?: RecentActivitiesParams): Promise<Activity[]>
  
  /**
   * Get complete dashboard data (stats + activities)
   */
  getDashboardData(params?: DashboardRefreshParams): Promise<DashboardData>
  
  /**
   * Refresh dashboard data
   */
  refreshDashboard(params?: DashboardRefreshParams): Promise<void>
}