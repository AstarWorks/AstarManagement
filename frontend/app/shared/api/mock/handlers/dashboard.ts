/**
 * Dashboard Mock Handler
 * Handles mock API requests for dashboard endpoints
 */

import type { IRequestOptions } from '../../types'
import { ApiError } from '../../core/ApiError'

// Mock dashboard statistics
const mockDashboardStats = [
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
const mockRecentActivities = [
  {
    id: 'activity-001',
    type: 'case',
    title: 'New Case Registration',
    subtitle: 'Corporate Legal Matter #2024-001',
    timestamp: new Date().toISOString()
  },
  {
    id: 'activity-002',
    type: 'document',
    title: 'Document Upload',
    subtitle: 'Contract_20241215.pdf',
    timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 'activity-003',
    type: 'deadline',
    title: 'Deadline Notification',
    subtitle: 'Response Brief Due Date',
    timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  },
  {
    id: 'activity-004',
    type: 'client',
    title: 'New Client Onboarding',
    subtitle: 'Astar Corporation',
    timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: 'activity-005',
    type: 'case',
    title: 'Case Status Update',
    subtitle: 'Settlement Negotiations Initiated',
    timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  }
]

function getMockDashboardStats(params?: Record<string, unknown>) {
  let stats = [...mockDashboardStats]
  
  // Simulate different values based on period
  if (params?.period === 'day') {
    stats = stats.map(stat => ({
      ...stat,
      value: Math.floor(stat.value / 30), // Daily approximation
      change: randomizeChange()
    }))
  } else if (params?.period === 'week') {
    stats = stats.map(stat => ({
      ...stat,
      value: Math.floor(stat.value / 4), // Weekly approximation
      change: randomizeChange()
    }))
  } else if (params?.period === 'year') {
    stats = stats.map(stat => ({
      ...stat,
      value: stat.value * 12, // Yearly approximation
      change: randomizeChange()
    }))
  }
  
  return stats
}

function getMockDashboardActivities(params?: Record<string, unknown>) {
  let activities = [...mockRecentActivities]
  
  // Apply type filter
  if (params?.type) {
    activities = activities.filter(activity => activity.type === params.type)
  }
  
  // Apply date range filter
  if (params?.dateFrom) {
    const fromDate = new Date(params.dateFrom as string)
    activities = activities.filter(activity => new Date(activity.timestamp) >= fromDate)
  }
  
  if (params?.dateTo) {
    const toDate = new Date(params.dateTo as string)
    activities = activities.filter(activity => new Date(activity.timestamp) <= toDate)
  }
  
  // Apply limit
  if (params?.limit) {
    activities = activities.slice(0, params.limit as number)
  }
  
  // Sort by timestamp (most recent first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  return activities
}

function getMockCombinedData(params?: Record<string, unknown>) {
  const stats = params?.includeStats !== false 
    ? getMockDashboardStats(params)
    : []
  
  const recentActivities = params?.includeActivities !== false
    ? getMockDashboardActivities({ ...params, limit: 10 })
    : []
  
  return {
    stats,
    recentActivities
  }
}

function randomizeChange(): string {
  const changes = ['+5%', '+12%', '-3%', '+8%', '+15%', '-2%', '+20%']
  return changes[Math.floor(Math.random() * changes.length)]!
}

export default function dashboardHandler(options: IRequestOptions) {
  const { method, endpoint, params } = options
  
  // Handle different endpoints
  if (endpoint.includes('/stats')) {
    if (method !== 'GET') {
      throw new ApiError({
        message: 'Method not allowed',
        statusCode: 405,
        code: 'METHOD_NOT_ALLOWED',
        path: endpoint
      })
    }
    return getMockDashboardStats(params)
  }
  
  if (endpoint.includes('/activities')) {
    if (method !== 'GET') {
      throw new ApiError({
        message: 'Method not allowed',
        statusCode: 405,
        code: 'METHOD_NOT_ALLOWED',
        path: endpoint
      })
    }
    return getMockDashboardActivities(params)
  }
  
  if (endpoint.includes('/data')) {
    if (method !== 'GET') {
      throw new ApiError({
        message: 'Method not allowed',
        statusCode: 405,
        code: 'METHOD_NOT_ALLOWED',
        path: endpoint
      })
    }
    return getMockCombinedData(params)
  }
  
  if (endpoint.includes('/refresh')) {
    if (method !== 'POST') {
      throw new ApiError({
        message: 'Method not allowed',
        statusCode: 405,
        code: 'METHOD_NOT_ALLOWED',
        path: endpoint
      })
    }
    
    // Simulate refresh operation
    return { success: true, message: 'Dashboard refreshed successfully' }
  }
  
  // Default fallback
  throw new ApiError({
    message: `Dashboard endpoint not found: ${endpoint}`,
    statusCode: 404,
    code: 'NOT_FOUND',
    path: endpoint
  })
}