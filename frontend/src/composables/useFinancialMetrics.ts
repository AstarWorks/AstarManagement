/**
 * Financial Metrics Composable
 * 
 * Provides comprehensive financial data management and calculations for the dashboard.
 * Handles data fetching, caching, real-time updates, and metric computations.
 */

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { 
  FinancialMetrics, 
  FinancialFilters, 
  FinancialKPI,
  TimePeriod,
  FinancialSummaryResponse 
} from '~/types/financial'

interface UseFinancialMetricsOptions {
  /** Auto-refresh interval in seconds */
  refreshInterval?: number
  /** Enable real-time updates */
  realTime?: boolean
  /** Initial filters */
  initialFilters?: Partial<FinancialFilters>
  /** Cache duration in minutes */
  cacheDuration?: number
}

export function useFinancialMetrics(options: UseFinancialMetricsOptions = {}) {
  const {
    refreshInterval = 30,
    realTime = true,
    initialFilters = {},
    cacheDuration = 5
  } = options

  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  const metrics = ref<FinancialMetrics | null>(null)
  
  // Filters
  const filters = ref<FinancialFilters>({
    period: 'month',
    startDate: undefined,
    endDate: undefined,
    matterIds: [],
    lawyerIds: [],
    categories: [],
    includeProjected: false,
    ...initialFilters
  })

  // Auto-refresh timer
  let refreshTimer: NodeJS.Timeout | null = null

  // Cache for API responses
  const cache = new Map<string, { data: FinancialMetrics; timestamp: number }>()

  // Generate cache key from filters
  const getCacheKey = (filterObj: FinancialFilters): string => {
    return JSON.stringify(filterObj)
  }

  // Check if cached data is still valid
  const isCacheValid = (timestamp: number): boolean => {
    const now = Date.now()
    const maxAge = cacheDuration * 60 * 1000 // Convert to milliseconds
    return (now - timestamp) < maxAge
  }

  // Mock data generation for development
  const generateMockData = (filterObj: FinancialFilters): FinancialMetrics => {
    // Generate realistic mock data based on filters
    const baseExpenses = 1250000
    const baseRevenue = 2150000
    const periodMultiplier = filterObj.period === 'year' ? 12 : filterObj.period === 'quarter' ? 3 : 1
    
    return {
      totalExpenses: baseExpenses * periodMultiplier,
      totalRevenue: baseRevenue * periodMultiplier,
      budgetTotal: 1500000 * periodMultiplier,
      budgetUtilized: 1250000 * periodMultiplier,
      profitMargin: 41.86,
      averageExpensePerMatter: 125000,
      budgetUtilizationPercentage: 83.33,
      monthlyBurnRate: 208333,
      projectedYearEndExpenses: 1500000,
      expensesByCategory: {
        'Legal Research': 450000 * periodMultiplier,
        'Court Fees': 280000 * periodMultiplier,
        'Office Supplies': 120000 * periodMultiplier,
        'Travel': 180000 * periodMultiplier,
        'Technology': 220000 * periodMultiplier
      },
      expensesByMatter: {
        'Corporate Merger - ABC Corp': 380000 * periodMultiplier,
        'Patent Dispute - XYZ Inc': 295000 * periodMultiplier,
        'Contract Review - DEF Ltd': 145000 * periodMultiplier,
        'Litigation - GHI Corp': 430000 * periodMultiplier
      },
      expensesByLawyer: {
        'Tanaka, Hiroshi': 420000 * periodMultiplier,
        'Sato, Yuki': 350000 * periodMultiplier,
        'Yamamoto, Kenji': 480000 * periodMultiplier
      },
      monthlyTrends: generateMonthlyTrends(filterObj.period),
      billableHours: 1850 * periodMultiplier,
      nonBillableHours: 420 * periodMultiplier,
      averageHourlyRate: 18500,
      totalBilledAmount: 34225000 * periodMultiplier,
      budgetsByCategory: {
        'Legal Research': { 
          allocated: 500000 * periodMultiplier, 
          spent: 450000 * periodMultiplier, 
          remaining: 50000 * periodMultiplier 
        },
        'Court Fees': { 
          allocated: 300000 * periodMultiplier, 
          spent: 280000 * periodMultiplier, 
          remaining: 20000 * periodMultiplier 
        },
        'Office Supplies': { 
          allocated: 150000 * periodMultiplier, 
          spent: 120000 * periodMultiplier, 
          remaining: 30000 * periodMultiplier 
        },
        'Travel': { 
          allocated: 200000 * periodMultiplier, 
          spent: 180000 * periodMultiplier, 
          remaining: 20000 * periodMultiplier 
        },
        'Technology': { 
          allocated: 350000 * periodMultiplier, 
          spent: 220000 * periodMultiplier, 
          remaining: 130000 * periodMultiplier 
        }
      }
    }
  }

  // Generate monthly trends based on period
  const generateMonthlyTrends = (period: TimePeriod) => {
    const monthCount = period === 'year' ? 12 : period === 'quarter' ? 3 : 6
    const trends = []
    const baseDate = new Date()
    
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      // Generate realistic trend data with some variation
      const baseExpenses = 95000 + (i * 5000) + (Math.random() * 20000)
      const baseRevenue = 165000 + (i * 8000) + (Math.random() * 30000)
      
      trends.push({
        month: monthNames[date.getMonth()],
        date: date.toISOString().split('T')[0],
        expenses: Math.round(baseExpenses),
        revenue: Math.round(baseRevenue),
        profit: Math.round(baseRevenue - baseExpenses)
      })
    }
    
    return trends
  }

  // Fetch financial data
  const fetchData = async (useCache = true): Promise<void> => {
    const cacheKey = getCacheKey(filters.value)
    
    // Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey)
      if (cached && isCacheValid(cached.timestamp)) {
        metrics.value = cached.data
        lastUpdated.value = new Date(cached.timestamp)
        return
      }
    }

    loading.value = true
    error.value = null

    try {
      // TODO: Replace with real API call
      // const response = await $fetch<FinancialSummaryResponse>('/api/financial/summary', {
      //   params: filters.value
      // })
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Use mock data for now
      const data = generateMockData(filters.value)
      
      metrics.value = data
      lastUpdated.value = new Date()
      
      // Cache the result
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

    } catch (err) {
      console.error('Failed to fetch financial data:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch financial data'
    } finally {
      loading.value = false
    }
  }

  // Update filters and refetch data
  const updateFilters = async (newFilters: Partial<FinancialFilters>): Promise<void> => {
    filters.value = { ...filters.value, ...newFilters }
    await fetchData()
  }

  // Computed KPIs
  const kpis = computed((): FinancialKPI[] => {
    if (!metrics.value) return []

    return [
      {
        id: 'total-expenses',
        title: 'Total Expenses',
        value: metrics.value.totalExpenses,
        formattedValue: formatCurrency(metrics.value.totalExpenses),
        trend: {
          direction: 'up',
          percentage: 12.5,
          period: 'vs last period'
        },
        icon: 'TrendingUp',
        color: 'text-red-500'
      },
      {
        id: 'total-revenue',
        title: 'Total Revenue',
        value: metrics.value.totalRevenue,
        formattedValue: formatCurrency(metrics.value.totalRevenue),
        trend: {
          direction: 'up',
          percentage: 8.3,
          period: 'vs last period'
        },
        icon: 'DollarSign',
        color: 'text-green-500'
      },
      {
        id: 'profit-margin',
        title: 'Profit Margin',
        value: metrics.value.profitMargin,
        formattedValue: `${metrics.value.profitMargin.toFixed(1)}%`,
        trend: {
          direction: 'down',
          percentage: 2.1,
          period: 'vs last period'
        },
        icon: 'Target',
        color: 'text-blue-500'
      },
      {
        id: 'budget-utilization',
        title: 'Budget Utilization',
        value: metrics.value.budgetUtilizationPercentage,
        formattedValue: `${metrics.value.budgetUtilizationPercentage.toFixed(1)}%`,
        trend: {
          direction: 'stable',
          percentage: 0.8,
          period: 'vs last period'
        },
        icon: 'PieChart',
        color: 'text-purple-500'
      }
    ]
  })

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)}%`
  }

  // Calculate financial ratios and insights
  const insights = computed(() => {
    if (!metrics.value) return null

    const profitMargin = (metrics.value.totalRevenue - metrics.value.totalExpenses) / metrics.value.totalRevenue * 100
    const expenseRatio = metrics.value.totalExpenses / metrics.value.totalRevenue * 100
    const budgetVariance = ((metrics.value.budgetUtilized - metrics.value.budgetTotal) / metrics.value.budgetTotal) * 100
    const utilizationRate = (metrics.value.billableHours / (metrics.value.billableHours + metrics.value.nonBillableHours)) * 100

    return {
      profitMargin,
      expenseRatio,
      budgetVariance,
      utilizationRate,
      isOverBudget: budgetVariance > 0,
      isProfitable: profitMargin > 0,
      hasGoodUtilization: utilizationRate > 75
    }
  })

  // Auto-refresh setup
  const setupAutoRefresh = (): void => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }

    if (realTime && refreshInterval > 0) {
      refreshTimer = setInterval(() => {
        fetchData(false) // Force fresh data on auto-refresh
      }, refreshInterval * 1000)
    }
  }

  // Export data functionality
  const exportData = async (format: 'csv' | 'json' | 'pdf'): Promise<void> => {
    if (!metrics.value) return

    const data = {
      metrics: metrics.value,
      filters: filters.value,
      generatedAt: new Date().toISOString(),
      insights: insights.value
    }

    switch (format) {
      case 'csv':
        exportAsCSV(data)
        break
      case 'json':
        exportAsJSON(data)
        break
      case 'pdf':
        // TODO: Implement PDF export
        console.log('PDF export not yet implemented')
        break
    }
  }

  const exportAsCSV = (data: { metrics: FinancialMetrics }): void => {
    const csvContent = convertToCSV(data.metrics)
    downloadFile(csvContent, 'financial-metrics.csv', 'text/csv')
  }

  const exportAsJSON = (data: { metrics: FinancialMetrics }): void => {
    const jsonContent = JSON.stringify(data, null, 2)
    downloadFile(jsonContent, 'financial-metrics.json', 'application/json')
  }

  const convertToCSV = (metricsData: FinancialMetrics): string => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Expenses', metricsData.totalExpenses.toString()],
      ['Total Revenue', metricsData.totalRevenue.toString()],
      ['Profit Margin', metricsData.profitMargin.toString() + '%'],
      ['Budget Utilization', metricsData.budgetUtilizationPercentage.toString() + '%'],
      ['Billable Hours', metricsData.billableHours.toString()],
      ['Non-Billable Hours', metricsData.nonBillableHours.toString()],
      ...Object.entries(metricsData.expensesByCategory).map(([category, amount]) => 
        [`Expenses - ${category}`, amount.toString()]
      )
    ]
    
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const downloadFile = (content: string, filename: string, mimeType: string): void => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Watchers
  watch(() => refreshInterval, setupAutoRefresh)
  watch(() => realTime, setupAutoRefresh)

  // Lifecycle
  onMounted(async () => {
    await fetchData()
    setupAutoRefresh()
  })

  onBeforeUnmount(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
  })

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),
    metrics: readonly(metrics),
    filters: readonly(filters),
    
    // Computed
    kpis,
    insights,
    
    // Methods
    fetchData,
    updateFilters,
    exportData,
    formatCurrency,
    formatPercentage,
    
    // Utilities
    setupAutoRefresh
  }
}