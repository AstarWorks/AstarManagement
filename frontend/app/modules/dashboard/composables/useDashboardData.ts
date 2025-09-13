/**
 * Dashboard Data Composable
 * Provides dashboard statistics and recent activities using Repository pattern
 */

import { useDashboardRepository } from '../repositories'
import type { DashboardRefreshParams, DashboardStatsParams, RecentActivitiesParams } from '../types'

export function useDashboardData() {
    // Repository取得（Mock/Real自動切り替え）
    const repository = useDashboardRepository()
    
    /**
     * Get complete dashboard data
     */
    const getDashboardData = (params?: DashboardRefreshParams) => {
        return useAsyncData(
            `dashboard:data:${JSON.stringify(params || {})}`,
            () => repository.getDashboardData(params),
            {
                server: false,
                lazy: true
            }
        )
    }
    
    /**
     * Get dashboard statistics only
     */
    const getStats = (params?: DashboardStatsParams) => {
        return useAsyncData(
            `dashboard:stats:${JSON.stringify(params || {})}`,
            () => repository.getStats(params),
            {
                server: false,
                lazy: true
            }
        )
    }
    
    /**
     * Get recent activities only
     */
    const getActivities = (params?: RecentActivitiesParams) => {
        return useAsyncData(
            `dashboard:activities:${JSON.stringify(params || {})}`,
            () => repository.getRecentActivities(params),
            {
                server: false,
                lazy: true
            }
        )
    }
    
    /**
     * Refresh dashboard data
     */
    const refreshDashboard = async (params?: DashboardRefreshParams) => {
        await repository.refreshDashboard(params)
        
        // Refresh cached data
        await refreshNuxtData('dashboard:data')
        await refreshNuxtData('dashboard:stats')
        await refreshNuxtData('dashboard:activities')
    }
    
    return {
        getDashboardData,
        getStats,
        getActivities,
        refreshDashboard
    }
}