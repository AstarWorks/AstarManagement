/**
 * Dashboard Mock Repository
 * Implementation using mock data for development
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

// Mock dashboard statistics
const mockDashboardStats: IDashboardStats[] = [
  {
    key: 'activeCases',
    labelKey: 'modules.dashboard.stats.activeMatter',
    icon: 'lucide:briefcase',
    value: 12,
    change: '+2',
    format: 'number'
  },
  {
    key: 'totalRevenue',
    labelKey: 'modules.dashboard.stats.revenueThisMonth',
    icon: 'lucide:trending-up',
    value: 1250000,
    change: '+15%',
    format: 'currency'
  },
  {
    key: 'totalClients',
    labelKey: 'modules.dashboard.stats.totalClients',
    icon: 'lucide:users',
    value: 48,
    change: '+5',
    format: 'number'
  },
  {
    key: 'documentsThisMonth',
    labelKey: 'modules.dashboard.stats.documentsThisMonth',
    icon: 'lucide:file-text',
    value: 25,
    change: '+8',
    format: 'number'
  }
]

// Mock recent activities
const mockRecentActivities: IActivity[] = [
  {
    id: 'activity-001',
    type: 'case',
    title: 'New Case Registration',
    subtitle: 'Corporate Legal Matter #2024-001',
    timestamp: new Date()
  },
  {
    id: 'activity-002',
    type: 'document',
    title: 'Document Upload',
    subtitle: 'Contract_20241215.pdf',
    timestamp: new Date(Date.now() - 3600000) // 1 hour ago
  },
  {
    id: 'activity-003',
    type: 'deadline',
    title: 'Deadline Notification',
    subtitle: 'Response Brief Due Date',
    timestamp: new Date(Date.now() - 7200000) // 2 hours ago
  },
  {
    id: 'activity-004',
    type: 'client',
    title: 'New Client Onboarding',
    subtitle: 'Astar Corporation',
    timestamp: new Date(Date.now() - 86400000) // 1 day ago
  },
  {
    id: 'activity-005',
    type: 'case',
    title: 'Case Status Update',
    subtitle: 'Settlement Negotiations Initiated',
    timestamp: new Date(Date.now() - 172800000) // 2 days ago
  }
]

export class DashboardMockRepository implements IDashboardRepository {
  
  constructor(private client: BaseApiClient) {
    // Dashboard repository doesn't need BaseRepository functionality
  }

  async getStats(params?: IDashboardStatsParams): Promise<IDashboardStats[]> {
    await this.delay(150)
    
    let stats = [...mockDashboardStats]
    
    // Simulate different values based on period
    if (params?.period === 'day') {
      stats = stats.map(stat => ({
        ...stat,
        value: Math.floor(stat.value / 30), // Daily approximation
        change: this.randomizeChange()
      }))
    } else if (params?.period === 'week') {
      stats = stats.map(stat => ({
        ...stat,
        value: Math.floor(stat.value / 4), // Weekly approximation
        change: this.randomizeChange()
      }))
    } else if (params?.period === 'year') {
      stats = stats.map(stat => ({
        ...stat,
        value: stat.value * 12, // Yearly approximation
        change: this.randomizeChange()
      }))
    }
    
    return stats
  }

  async getRecentActivities(params?: IRecentActivitiesParams): Promise<IActivity[]> {
    await this.delay(100)
    
    let activities = [...mockRecentActivities]
    
    // Apply type filter
    if (params?.type) {
      activities = activities.filter(activity => activity.type === params.type)
    }
    
    // Apply date range filter
    if (params?.dateFrom) {
      const fromDate = new Date(params.dateFrom)
      activities = activities.filter(activity => activity.timestamp >= fromDate)
    }
    
    if (params?.dateTo) {
      const toDate = new Date(params.dateTo)
      activities = activities.filter(activity => activity.timestamp <= toDate)
    }
    
    // Apply limit
    if (params?.limit) {
      activities = activities.slice(0, params.limit)
    }
    
    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return activities
  }

  async getDashboardData(params?: IDashboardRefreshParams): Promise<IDashboardData> {
    await this.delay(200)
    
    const stats = params?.includeStats !== false 
      ? await this.getStats()
      : []
    
    const recentActivities = params?.includeActivities !== false
      ? await this.getRecentActivities({ limit: 10 })
      : []
    
    return {
      stats,
      recentActivities
    }
  }

  async refreshDashboard(params?: IDashboardRefreshParams): Promise<void> {
    await this.delay(100)
    
    // In a real implementation, this would trigger cache invalidation
    // For mock, we just simulate the delay
    
    // Optionally simulate some data changes
    if (params?.forceRefresh) {
      // Simulate refreshing stats with slight variations
      mockDashboardStats.forEach(stat => {
        if (stat.format === 'number') {
          stat.value += Math.floor(Math.random() * 3) - 1 // ±1 random change
        }
      })
    }
  }

  /**
   * Generate random change percentage for stats
   */
  private randomizeChange(): string {
    const changes = ['+5%', '+12%', '-3%', '+8%', '+15%', '-2%', '+20%']
    return changes[Math.floor(Math.random() * changes.length)]!
  }

  /**
   * Helper method to simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}