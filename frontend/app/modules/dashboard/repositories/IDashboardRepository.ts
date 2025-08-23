/**
 * Dashboard Repository Interface
 * Defines the contract for dashboard data operations
 */

import type { 
  IDashboardData,
  IDashboardStats, 
  IActivity, 
  IDashboardStatsParams, 
  IRecentActivitiesParams,
  IDashboardRefreshParams
} from '../types'

export interface IDashboardRepository {
  /**
   * Get dashboard statistics
   */
  getStats(params?: IDashboardStatsParams): Promise<IDashboardStats[]>
  
  /**
   * Get recent activities
   */
  getRecentActivities(params?: IRecentActivitiesParams): Promise<IActivity[]>
  
  /**
   * Get complete dashboard data (stats + activities)
   */
  getDashboardData(params?: IDashboardRefreshParams): Promise<IDashboardData>
  
  /**
   * Refresh dashboard data
   */
  refreshDashboard(params?: IDashboardRefreshParams): Promise<void>
}