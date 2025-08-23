/**
 * Dashboard API Repository
 * Implementation using real API endpoints
 */

import type { BaseApiClient } from '@shared/api/core/BaseApiClient'
import type { IDashboardRepository } from './IDashboardRepository'
import type { 
  IDashboardData,
  IDashboardStats, 
  IActivity, 
  IDashboardStatsParams, 
  IRecentActivitiesParams,
  IDashboardRefreshParams
} from '../types'

export class DashboardApiRepository implements IDashboardRepository {
  
  constructor(private client: BaseApiClient) {
    // Dashboard-specific API repository
  }

  async getStats(params?: IDashboardStatsParams): Promise<IDashboardStats[]> {
    const queryString = this.buildQueryString(params as Record<string, unknown>)
    return await this.client.request<IDashboardStats[]>({
      endpoint: `/dashboard/stats${queryString}`,
      method: 'GET'
    })
  }

  async getRecentActivities(params?: IRecentActivitiesParams): Promise<IActivity[]> {
    const queryString = this.buildQueryString(params as Record<string, unknown>)
    return await this.client.request<IActivity[]>({
      endpoint: `/dashboard/activities${queryString}`,
      method: 'GET'
    })
  }

  async getDashboardData(params?: IDashboardRefreshParams): Promise<IDashboardData> {
    const queryString = this.buildQueryString(params as Record<string, unknown>)
    return await this.client.request<IDashboardData>({
      endpoint: `/dashboard/data${queryString}`,
      method: 'GET'
    })
  }

  async refreshDashboard(params?: IDashboardRefreshParams): Promise<void> {
    // Clear client-side cache by invalidating Nuxt data
    await clearNuxtData('dashboard')
    
    // If force refresh, also trigger a background refresh
    if (params?.forceRefresh) {
      try {
        await this.client.request({
          endpoint: '/dashboard/refresh',
          method: 'POST',
          body: params
        })
      } catch (error) {
        // Non-critical operation, log but don't throw
        console.warn('[DashboardApiRepository] Background refresh failed:', error)
      }
    }
  }

  /**
   * Helper to build query string from params
   */
  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return ''
    }
    
    const queryParts = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(v => `${key}[]=${encodeURIComponent(String(v))}`).join('&')
        }
        return `${key}=${encodeURIComponent(String(value))}`
      })
    
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  }
}