<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { TrendingUp, DollarSign, AlertTriangle, RefreshCw } from 'lucide-vue-next'
import type { FinancialFilters } from '~/types/financial'

/**
 * Financial Dashboard Page
 * 
 * Main financial dashboard page integrating all financial components:
 * - KPI cards showing key financial metrics
 * - Interactive charts for visual analysis  
 * - Expense breakdown tables
 * - Comprehensive filtering and export capabilities
 */

// Set page metadata
definePageMeta({
  title: 'Financial Dashboard',
  description: 'Comprehensive financial analysis and reporting dashboard',
  layout: 'default'
})

// SEO metadata
useSeoMeta({
  title: 'Financial Dashboard - Aster Management',
  description: 'Track expenses, revenue, and budget utilization across legal matters with comprehensive charts and analytics.',
  ogTitle: 'Financial Dashboard - Aster Management',
  ogDescription: 'Professional financial tracking and analysis for legal practices.',
  ogType: 'website'
})

// Composables - temporary mock implementation
const metrics = ref({
  budgetUtilizationPercentage: 75,
  profitMargin: 25,
  billableHours: 150,
  nonBillableHours: 30,
  monthlyTrends: [],
  totalRevenue: 1000000,
  totalExpenses: 750000,
  expensesByCategory: {},
  budgetsByCategory: {},
  averageHourlyRate: 18500,
  expensesByMatter: {}
})
const loading = ref(false)
const error = ref(null)
const kpis = ref([{
  id: 'test',
  title: 'Test KPI',
  value: 100,
  formattedValue: '¥100',
  icon: 'DollarSign',
  color: 'text-green-500'
}])
const updateFilters = async (newFilters: FinancialFilters) => {}
const exportData = async (format: string) => {}

// Page state
const pageLoading = ref(true)
const refreshing = ref(false)
const lastRefresh = ref<Date | null>(null)

// Default filters
const filters = ref<FinancialFilters>({
  period: 'month',
  startDate: undefined,
  endDate: undefined,
  matterIds: [],
  lawyerIds: [],
  categories: [],
  includeProjected: false
})

// Dashboard layout preferences (persisted to localStorage)
const showFilters = ref(true)
const compactMode = ref(false)

// Computed dashboard state
const hasData = computed(() => metrics.value !== null)
const isEmpty = computed(() => !hasData.value && !loading.value)
const hasError = computed(() => error.value !== null)

// Chart visibility controls
const chartVisibility = ref({
  kpis: true,
  trends: true,
  categories: true,
  revenue: true,
  budget: true,
  billableHours: true,
  expenseTable: true
})

// Dashboard insights
const dashboardInsights = computed(() => {
  if (!metrics.value) return []
  
  const insights = []
  const data = metrics.value
  
  // Budget utilization insights
  if (data.budgetUtilizationPercentage > 90) {
    insights.push({
      type: 'warning',
      title: 'Budget Alert',
      message: `Budget utilization is at ${data.budgetUtilizationPercentage.toFixed(1)}%. Consider reviewing spending.`,
      action: 'Review Budget'
    })
  }
  
  // Profit margin insights
  if (data.profitMargin < 20) {
    insights.push({
      type: 'error',
      title: 'Low Profit Margin',
      message: `Profit margin is ${data.profitMargin.toFixed(1)}%. This is below industry standards.`,
      action: 'Analyze Costs'
    })
  } else if (data.profitMargin > 40) {
    insights.push({
      type: 'success',
      title: 'Excellent Profit Margin',
      message: `Profit margin of ${data.profitMargin.toFixed(1)}% is performing well.`,
      action: 'Maintain Efficiency'
    })
  }
  
  // Utilization rate insights
  const utilizationRate = (data.billableHours / (data.billableHours + data.nonBillableHours)) * 100
  if (utilizationRate < 70) {
    insights.push({
      type: 'warning',
      title: 'Low Billable Hours',
      message: `Billable hour utilization is ${utilizationRate.toFixed(1)}%. Consider optimizing time allocation.`,
      action: 'Review Schedule'
    })
  }
  
  return insights
})

// Methods
const handleFiltersChange = async (newFilters: FinancialFilters) => {
  filters.value = newFilters
  await updateFilters(newFilters)
}

const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
  try {
    await exportData(format)
    // Show success toast
    console.log(`Exported financial data as ${format.toUpperCase()}`)
  } catch (err) {
    console.error('Export failed:', err)
    // Show error toast
  }
}

const refreshDashboard = async () => {
  refreshing.value = true
  try {
    await updateFilters(filters.value)
    lastRefresh.value = new Date()
  } catch (err) {
    console.error('Refresh failed:', err)
  } finally {
    refreshing.value = false
  }
}

const toggleChartVisibility = (chart: keyof typeof chartVisibility.value) => {
  chartVisibility.value[chart] = !chartVisibility.value[chart]
}

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(amount)
}

// Lifecycle
onMounted(async () => {
  try {
    // Load initial data
    await updateFilters(filters.value)
    lastRefresh.value = new Date()
  } catch (err) {
    console.error('Failed to load dashboard:', err)
  } finally {
    pageLoading.value = false
  }
})
</script>

<template>
  <div class="financial-dashboard">
    <!-- Page Header -->
    <header class="dashboard-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <p class="text-muted-foreground mt-1">
            Comprehensive financial analysis and expense tracking
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Refresh button -->
          <Button
            variant="outline"
            size="sm"
            @click="refreshDashboard"
            :disabled="refreshing"
          >
            <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': refreshing }" />
            {{ refreshing ? 'Refreshing...' : 'Refresh' }}
          </Button>
          
          <!-- Dashboard settings -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm">
                <Settings class="w-4 h-4 mr-2" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel>Dashboard Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuCheckboxItem
                :checked="showFilters"
                @update:checked="showFilters = $event"
              >
                Show Filters Panel
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                :checked="compactMode"
                @update:checked="compactMode = $event"
              >
                Compact Mode
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Chart Visibility</DropdownMenuLabel>
              
              <DropdownMenuCheckboxItem
                v-for="(visible, chart) in chartVisibility"
                :key="chart"
                :checked="visible"
                @update:checked="toggleChartVisibility(chart)"
              >
                {{ chart.charAt(0).toUpperCase() + chart.slice(1).replace(/([A-Z])/g, ' $1') }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <!-- Last updated info -->
      <div v-if="lastRefresh" class="mt-4 text-sm text-muted-foreground">
        Last updated: {{ lastRefresh.toLocaleString('ja-JP') }}
      </div>
    </header>

    <!-- Dashboard Insights -->
    <section v-if="dashboardInsights.length > 0" class="dashboard-insights mb-8">
      <div class="grid gap-4">
        <Alert
          v-for="(insight, index) in dashboardInsights"
          :key="index"
          :variant="insight.type === 'error' ? 'destructive' : 'default'"
        >
          <AlertTriangle v-if="insight.type === 'warning'" class="h-4 w-4" />
          <TrendingUp v-else-if="insight.type === 'success'" class="h-4 w-4" />
          <DollarSign v-else class="h-4 w-4" />
          
          <AlertTitle>{{ insight.title }}</AlertTitle>
          <AlertDescription class="flex items-center justify-between">
            <span>{{ insight.message }}</span>
            <Button variant="outline" size="sm" class="ml-4">
              {{ insight.action }}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </section>

    <div class="dashboard-layout" :class="{ 'compact': compactMode }">
      <!-- Filters Sidebar -->
      <aside v-if="showFilters" class="dashboard-sidebar">
        <FinancialDashboardFilters
          :filters="filters"
          :compact="compactMode"
          @filters-change="handleFiltersChange"
          @export="handleExport"
          @reset="refreshDashboard"
        />
      </aside>

      <!-- Main Dashboard Content -->
      <main class="dashboard-content">
        <!-- Loading State -->
        <div v-if="pageLoading" class="loading-container">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 class="text-lg font-semibold">Loading Financial Dashboard</h3>
            <p class="text-muted-foreground">Fetching latest financial data...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError" class="error-container">
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <AlertTitle>Dashboard Error</AlertTitle>
            <AlertDescription>
              {{ error }}
              <Button variant="outline" size="sm" @click="refreshDashboard" class="ml-4">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>

        <!-- Empty State -->
        <div v-else-if="isEmpty" class="empty-container">
          <div class="text-center">
            <DollarSign class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 class="text-lg font-semibold">No Financial Data</h3>
            <p class="text-muted-foreground mb-4">
              No financial data available for the selected period and filters.
            </p>
            <Button @click="refreshDashboard">
              Refresh Data
            </Button>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div v-else class="dashboard-grid">
          <!-- KPI Cards -->
          <section v-if="chartVisibility.kpis" class="kpi-section">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FinancialKPICard
                v-for="kpi in kpis"
                :key="kpi.id"
                :kpi="kpi"
                :animated="true"
                :show-trend="true"
              />
            </div>
          </section>

          <!-- Charts Grid -->
          <section class="charts-section">
            <div class="charts-grid">
              <!-- Expense Trend Chart -->
              <div v-if="chartVisibility.trends" class="chart-container full-width">
                <FinancialExpenseTrendChart
                  :data="metrics?.monthlyTrends || []"
                  :height="400"
                  :show-projections="filters.includeProjected"
                />
              </div>

              <!-- Revenue Chart -->
              <div v-if="chartVisibility.revenue" class="chart-container">
                <FinancialRevenueChart
                  :revenue="metrics?.totalRevenue || 0"
                  :expenses="metrics?.totalExpenses || 0"
                  :profit="(metrics?.totalRevenue || 0) - (metrics?.totalExpenses || 0)"
                  :height="300"
                />
              </div>

              <!-- Expense Categories Chart -->
              <div v-if="chartVisibility.categories" class="chart-container">
                <FinancialExpenseCategoryChart
                  :data="metrics?.expensesByCategory || {}"
                  :height="300"
                />
              </div>

              <!-- Budget Progress Chart -->
              <div v-if="chartVisibility.budget" class="chart-container">
                <FinancialBudgetProgressChart
                  :data="metrics?.budgetsByCategory || {}"
                  :height="300"
                  :horizontal="true"
                />
              </div>

              <!-- Billable Hours Chart -->
              <div v-if="chartVisibility.billableHours" class="chart-container">
                <FinancialBillableHoursChart
                  :billable="metrics?.billableHours || 0"
                  :non-billable="metrics?.nonBillableHours || 0"
                  :hourly-rate="metrics?.averageHourlyRate || 18500"
                  :height="300"
                />
              </div>
            </div>
          </section>

          <!-- Expense Table -->
          <section v-if="chartVisibility.expenseTable" class="table-section">
            <FinancialMatterExpensesTable
              :data="metrics?.expensesByMatter || {}"
              :show-export="true"
              :max-rows="10"
            />
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.financial-dashboard {
  --dashboard-spacing: 2rem;
  --sidebar-width: 320px;
  
  min-height: 100vh;
  background: hsl(var(--background));
  padding: var(--dashboard-spacing);
}

.dashboard-header {
  margin-bottom: var(--dashboard-spacing);
}

.dashboard-insights {
  margin-bottom: var(--dashboard-spacing);
}

.dashboard-layout {
  display: grid;
  gap: var(--dashboard-spacing);
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: calc(100vh - 200px);
}

.dashboard-layout.compact {
  --dashboard-spacing: 1rem;
  --sidebar-width: 280px;
}

.dashboard-sidebar {
  position: sticky;
  top: var(--dashboard-spacing);
  height: fit-content;
}

.dashboard-content {
  min-height: 600px;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 2rem;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: var(--dashboard-spacing);
}

.kpi-section {
  margin-bottom: calc(var(--dashboard-spacing) * 0.5);
}

.charts-section {
  flex: 1;
}

.charts-grid {
  display: grid;
  gap: var(--dashboard-spacing);
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

.chart-container {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  overflow: hidden;
}

.chart-container.full-width {
  grid-column: 1 / -1;
}

.table-section {
  margin-top: calc(var(--dashboard-spacing) * 0.5);
}

/* Responsive design */
@media (max-width: 1280px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
  
  .dashboard-sidebar {
    position: static;
  }
  
  .charts-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .financial-dashboard {
    --dashboard-spacing: 1rem;
    padding: 1rem;
  }
  
  .dashboard-header .flex {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .grid.grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .grid.grid-cols-4,
  .grid.grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header h1 {
    font-size: 1.5rem;
  }
}

/* Hide sidebar on mobile when not needed */
@media (max-width: 768px) {
  .dashboard-layout:not(.show-filters-mobile) .dashboard-sidebar {
    display: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .chart-container,
  .loading-container,
  .error-container,
  .empty-container {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
}

/* Print styles */
@media print {
  .dashboard-sidebar,
  .dashboard-header .flex > div:last-child {
    display: none;
  }
  
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    break-inside: avoid;
    margin-bottom: 1rem;
  }
}
</style>