/**
 * Dashboard Data Composable
 * Provides dashboard statistics and recent activities
 */

import { ref, computed } from 'vue'

interface IDashboardStat {
  key: string
  labelKey: string
  icon: string
  value: number
  change: string
  format?: 'number' | 'currency'
}

interface IActivity {
  id: string
  type: 'case' | 'document' | 'deadline' | 'client'
  title: string
  subtitle: string
  timestamp: Date
}

export function useDashboardData() {
  const isLoadingActivity = ref(false)
  
  // Dashboard statistics
  const dashboardStats = ref<IDashboardStat[]>([
    {
      key: 'activeCases',
      labelKey: 'dashboard.stats.activeCases',
      icon: 'lucide:briefcase',
      value: 12,
      change: '+2',
      format: 'number'
    },
    {
      key: 'totalRevenue',
      labelKey: 'dashboard.stats.revenue',
      icon: 'lucide:trending-up',
      value: 1250000,
      change: '+15%',
      format: 'currency'
    },
    {
      key: 'pendingInvoices',
      labelKey: 'dashboard.stats.pendingInvoices',
      icon: 'lucide:file-text',
      value: 8,
      change: '-3',
      format: 'number'
    },
    {
      key: 'upcomingDeadlines',
      labelKey: 'dashboard.stats.deadlines',
      icon: 'lucide:calendar-check',
      value: 5,
      change: '0',
      format: 'number'
    }
  ])
  
  // Recent activities
  const recentActivities = ref<IActivity[]>([
    {
      id: '1',
      type: 'case',
      title: '新規案件登録',
      subtitle: '田中太郎 vs 山田花子',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'document',
      title: '書類アップロード',
      subtitle: '契約書_20241215.pdf',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '3',
      type: 'deadline',
      title: '期限通知',
      subtitle: '答弁書提出期限',
      timestamp: new Date(Date.now() - 7200000)
    }
  ])
  
  // Refresh dashboard data
  const refreshDashboard = async () => {
    isLoadingActivity.value = true
    try {
      // TODO: Implement actual API call to fetch dashboard data
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      isLoadingActivity.value = false
    }
  }
  
  return {
    dashboardStats: computed(() => dashboardStats.value),
    recentActivities: computed(() => recentActivities.value),
    isLoadingActivity: computed(() => isLoadingActivity.value),
    refreshDashboard
  }
}