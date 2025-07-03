<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { RefreshCw, Download, Settings, Filter } from 'lucide-vue-next'
import type { FinancialMetrics, FinancialFilters, TimePeriod } from '~/types/financial'

/**
 * Financial Dashboard Component
 * 
 * Comprehensive financial dashboard with KPIs, charts, and analytics.
 * Provides real-time insights into expenses, revenue, and budget tracking.
 */

interface Props {
  /** Auto-refresh interval in seconds */
  refreshInterval?: number
  /** Enable real-time updates */
  realTime?: boolean
  /** Default time period */
  defaultPeriod?: TimePeriod
  /** Show filter controls */
  showFilters?: boolean
  /** Enable export functionality */
  enableExport?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  refreshInterval: 30,
  realTime: true,
  defaultPeriod: 'month',
  showFilters: true,
  enableExport: true
})

// Dashboard state
const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<Date | null>(null)
const showFilterPanel = ref(false)

// Filters
const filters = ref<FinancialFilters>({
  period: props.defaultPeriod,
  startDate: undefined,
  endDate: undefined,
  matterIds: [],
  lawyerIds: [],
  categories: [],
  includeProjected: false
})

// Mock financial metrics (will be replaced with real API data)
const metrics = ref<FinancialMetrics>({
  totalExpenses: 1250000,
  totalRevenue: 2150000,
  budgetTotal: 1500000,
  budgetUtilized: 1250000,
  profitMargin: 41.86,
  averageExpensePerMatter: 125000,
  budgetUtilizationPercentage: 83.33,
  monthlyBurnRate: 208333,
  projectedYearEndExpenses: 1500000,
  expensesByCategory: {
    'Legal Research': 450000,
    'Court Fees': 280000,
    'Office Supplies': 120000,
    'Travel': 180000,
    'Technology': 220000
  },
  expensesByMatter: {
    'Corporate Merger - ABC Corp': 380000,
    'Patent Dispute - XYZ Inc': 295000,
    'Contract Review - DEF Ltd': 145000,
    'Litigation - GHI Corp': 430000
  },
  expensesByLawyer: {
    'Tanaka, Hiroshi': 420000,
    'Sato, Yuki': 350000,
    'Yamamoto, Kenji': 480000
  },
  monthlyTrends: [
    { month: 'Jan', date: '2024-01-01', expenses: 95000, revenue: 165000, profit: 70000 },
    { month: 'Feb', date: '2024-02-01', expenses: 108000, revenue: 175000, profit: 67000 },
    { month: 'Mar', date: '2024-03-01', expenses: 118000, revenue: 185000, profit: 67000 },
    { month: 'Apr', date: '2024-04-01', expenses: 125000, revenue: 195000, profit: 70000 },
    { month: 'May', date: '2024-05-01', expenses: 132000, revenue: 205000, profit: 73000 },
    { month: 'Jun', date: '2024-06-01', expenses: 142000, revenue: 215000, profit: 73000 }
  ],
  billableHours: 1850,
  nonBillableHours: 420,
  averageHourlyRate: 18500,
  totalBilledAmount: 34225000,
  budgetsByCategory: {
    'Legal Research': { allocated: 500000, spent: 450000, remaining: 50000 },
    'Court Fees': { allocated: 300000, spent: 280000, remaining: 20000 },
    'Office Supplies': { allocated: 150000, spent: 120000, remaining: 30000 },
    'Travel': { allocated: 200000, spent: 180000, remaining: 20000 },
    'Technology': { allocated: 350000, spent: 220000, remaining: 130000 }
  }
})

// Computed KPIs
const kpis = computed(() => [
  {
    id: 'total-expenses',
    title: 'Total Expenses',
    value: metrics.value.totalExpenses,
    formattedValue: formatCurrency(metrics.value.totalExpenses),
    trend: {
      direction: 'up' as const,
      percentage: 12.5,
      period: 'vs last month'
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
      direction: 'up' as const,
      percentage: 8.3,
      period: 'vs last month'
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
      direction: 'down' as const,
      percentage: 2.1,
      period: 'vs last month'
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
      direction: 'stable' as const,
      percentage: 0.8,
      period: 'vs last month'
    },
    icon: 'PieChart',
    color: 'text-purple-500'
  }
])

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

// Dashboard actions
const refreshData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real implementation, fetch data from API
    // const data = await $fetch('/api/financial/summary', { params: filters.value })
    // metrics.value = data
    
    lastUpdated.value = new Date()
  } catch (err) {
    error.value = 'Failed to fetch financial data'
    console.error('Dashboard refresh error:', err)
  } finally {
    loading.value = false
  }
}

const exportData = async (format: 'csv' | 'pdf') => {
  try {
    loading.value = true
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In real implementation, generate and download file
    // const exportData = await $fetch('/api/financial/export', {
    //   method: 'POST',
    //   body: { format, filters: filters.value, metrics: metrics.value }
    // })
    
    // Create mock download
    const filename = `financial-dashboard-${new Date().toISOString().split('T')[0]}.${format}`
    console.log(`Exporting as ${filename}`)
    
    // Show success message (in real app, trigger actual download)
    alert(`Export completed: ${filename}`)
  } catch (err) {
    error.value = `Failed to export data as ${format.toUpperCase()}`
    console.error('Export error:', err)
  } finally {
    loading.value = false
  }
}

const toggleFilters = () => {
  showFilterPanel.value = !showFilterPanel.value
}

const updateFilters = (newFilters: Partial<FinancialFilters>) => {
  filters.value = { ...filters.value, ...newFilters }
  refreshData()
}

// Auto-refresh setup
let refreshTimer: NodeJS.Timeout | null = null

const setupAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  if (props.realTime && props.refreshInterval > 0) {
    refreshTimer = setInterval(refreshData, props.refreshInterval * 1000)
  }
}

// Watchers
watch(() => props.refreshInterval, setupAutoRefresh)
watch(() => props.realTime, setupAutoRefresh)

// Lifecycle
onMounted(async () => {
  await refreshData()
  setupAutoRefresh()
})

// Cleanup
onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="financial-dashboard space-y-6">
    <!-- Dashboard Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Financial Dashboard</h1>
        <p class="text-muted-foreground">
          Comprehensive overview of financial performance and budget tracking
        </p>
        <div v-if="lastUpdated" class="text-xs text-muted-foreground mt-1">
          Last updated: {{ lastUpdated.toLocaleString('ja-JP') }}
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="flex items-center gap-2">
        <Button
          v-if="props.showFilters"
          variant="outline"
          size="sm"
          @click="toggleFilters"
          :class="{ 'bg-muted': showFilterPanel }"
        >
          <Filter class="w-4 h-4 mr-2" />
          Filters
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          @click="refreshData"
          :disabled="loading"
        >
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
        
        <DropdownMenu v-if="props.enableExport">
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download class="w-4 h-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="exportData('csv')">
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem @click="exportData('pdf')">
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Error Alert -->
    <Alert v-if="error" variant="destructive" class="mb-6">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Filter Panel -->
    <Card v-if="showFilterPanel" class="mb-6">
      <CardHeader>
        <CardTitle class="text-lg">Dashboard Filters</CardTitle>
        <CardDescription>
          Customize the dashboard view by adjusting the filters below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FinancialDashboardFilters
          v-model:filters="filters"
          @update="updateFilters"
        />
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="loading && !metrics" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Skeleton class="h-32" v-for="i in 4" :key="i" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton class="h-80" v-for="i in 4" :key="i" />
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <FinancialKPICard
          v-for="kpi in kpis"
          :key="kpi.id"
          :kpi="kpi"
        />
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Expense Categories Chart -->
        <FinancialExpenseCategoryChart
          :data="metrics.expensesByCategory"
          title="Expense Distribution by Category"
        />

        <!-- Revenue vs Expenses Chart -->
        <FinancialRevenueChart
          :data="metrics.monthlyTrends"
          title="Revenue vs Expenses Trend"
        />

        <!-- Budget Progress Chart -->
        <FinancialBudgetProgressChart
          :data="metrics.budgetsByCategory"
          title="Budget Utilization by Category"
        />

        <!-- Billable Hours Chart -->
        <FinancialBillableHoursChart
          :billable="metrics.billableHours"
          :nonBillable="metrics.nonBillableHours"
          title="Billable vs Non-Billable Hours"
        />
      </div>

      <!-- Full-width charts -->
      <div class="space-y-6">
        <!-- Expense Trend Chart -->
        <FinancialExpenseTrendChart
          :data="metrics.monthlyTrends"
          title="Monthly Financial Trends"
        />

        <!-- Matter Expenses Table -->
        <FinancialMatterExpensesTable
          :data="metrics.expensesByMatter"
          title="Expenses by Matter"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.financial-dashboard {
  min-height: 100vh;
  background: hsl(var(--background));
}

/* Smooth transitions for dashboard updates */
.financial-dashboard .grid > * {
  transition: all 0.3s ease;
}

/* Loading animation for refresh */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .financial-dashboard {
    padding: 1rem;
  }
  
  .grid {
    gap: 1rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .financial-dashboard {
    border: 1px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .financial-dashboard .grid > * {
    transition: none;
  }
  
  .animate-spin {
    animation: none;
  }
}
</style>