/**
 * Dashboard API Repository
 * Implementation using real API endpoints
 * NOTE: Dashboard endpoints are not yet implemented in backend
 */

import type { DashboardRepository } from './DashboardRepository'
import type { 
  DashboardData,
  DashboardStats, 
  Activity, 
  DashboardStatsParams, 
  RecentActivitiesParams,
  DashboardRefreshParams
} from '../types'

export class DashboardApiRepository implements DashboardRepository {
  private api: ReturnType<typeof useApi>
  
  constructor() {
    this.api = useApi()
  }

  // NOTE: Dashboard endpoints not available in current API
  // Using mock implementation until backend provides these endpoints
  
  async getStats(_params?: DashboardStatsParams): Promise<DashboardStats[]> {
    console.warn('Dashboard.getStats: Using mock implementation - endpoint not available')
    // Return empty stats for now
    return Promise.resolve([])
  }

  async getRecentActivities(_params?: RecentActivitiesParams): Promise<Activity[]> {
    console.warn('Dashboard.getRecentActivities: Using mock implementation - endpoint not available')
    // Return empty activities for now
    return Promise.resolve([])
  }

  async getDashboardData(_params?: DashboardRefreshParams): Promise<DashboardData> {
    console.warn('Dashboard.getDashboardData: Using mock implementation - endpoint not available')
    // Return minimal dashboard data
    return Promise.resolve({
      stats: [],
      recentActivities: []
    })
  }

  async refreshDashboard(_params?: DashboardRefreshParams): Promise<void> {
    // Clear client-side cache by invalidating Nuxt data
    await clearNuxtData('dashboard')
    console.warn('Dashboard.refreshDashboard: Using mock implementation - endpoint not available')
  }
}