/**
 * Dashboard Data Composable
 * Provides dashboard statistics and recent activities using Repository pattern
 */

import { useApiClient, useIsMockMode } from '@shared/api/composables/useApiClient'
import { DashboardApiRepository } from '../repositories/DashboardApiRepository'
import { DashboardMockRepository } from '../repositories/DashboardMockRepository'
import type { IDashboardRepository } from '../repositories/IDashboardRepository'
import type { IDashboardRefreshParams, IDashboardStatsParams, IRecentActivitiesParams } from '../types'

export function useDashboardData() {
    const client = useApiClient()
    const isMockMode = useIsMockMode()
    
    // Create appropriate repository based on mode
    const repository = computed<IDashboardRepository>(() => {
        console.log(`[useDashboardData] Creating ${isMockMode ? 'mock' : 'API'} repository`)
        return isMockMode
            ? new DashboardMockRepository(client)
            : new DashboardApiRepository(client)
    })
    
    /**
     * Get complete dashboard data
     */
    const getDashboardData = (params?: IDashboardRefreshParams) => {
        return useAsyncData(
            `dashboard:data:${JSON.stringify(params || {})}`,
            () => repository.value.getDashboardData(params),
            {
                server: false,
                lazy: true
            }
        )
    }
    
    /**
     * Get dashboard statistics only
     */
    const getStats = (params?: IDashboardStatsParams) => {
        return useAsyncData(
            `dashboard:stats:${JSON.stringify(params || {})}`,
            () => repository.value.getStats(params),
            {
                server: false,
                lazy: true
            }
        )
    }
    
    /**
     * Get recent activities only
     */
    const getActivities = (params?: IRecentActivitiesParams) => {
        return useAsyncData(
            `dashboard:activities:${JSON.stringify(params || {})}`,
            () => repository.value.getRecentActivities(params),
            {
                server: false,
                lazy: true
            }
        )
    }
    
    /**
     * Refresh dashboard data
     */
    const refreshDashboard = async (params?: IDashboardRefreshParams) => {
        await repository.value.refreshDashboard(params)
        
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