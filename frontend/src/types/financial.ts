/**
 * Financial Dashboard Types
 * 
 * Type definitions for financial dashboard components, metrics, and analytics.
 */

// Time period for financial analysis
export type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom'

// Trend direction for KPI indicators
export type TrendDirection = 'up' | 'down' | 'stable'

// Chart types supported by the dashboard
export type ChartType = 'pie' | 'doughnut' | 'bar' | 'line' | 'gauge' | 'area'

// Financial KPI metrics
export interface FinancialKPI {
  id: string
  title: string
  value: number
  formattedValue: string
  unit?: string
  trend?: {
    direction: TrendDirection
    percentage: number
    period: string
  }
  icon: string
  color?: string
}

// Comprehensive financial metrics
export interface FinancialMetrics {
  // Core financial data
  totalExpenses: number
  totalRevenue: number
  budgetTotal: number
  budgetUtilized: number
  profitMargin: number
  
  // Calculated KPIs
  averageExpensePerMatter: number
  budgetUtilizationPercentage: number
  monthlyBurnRate: number
  projectedYearEndExpenses: number
  
  // Breakdown data
  expensesByCategory: Record<string, number>
  expensesByMatter: Record<string, number>
  expensesByLawyer: Record<string, number>
  
  // Time-based trends
  monthlyTrends: Array<{
    month: string
    date: string
    expenses: number
    revenue: number
    profit: number
  }>
  
  // Revenue insights
  billableHours: number
  nonBillableHours: number
  averageHourlyRate: number
  totalBilledAmount: number
  
  // Budget tracking
  budgetsByCategory: Record<string, {
    allocated: number
    spent: number
    remaining: number
  }>
}

// Chart data structure
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label?: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    fill?: boolean
  }>
}

// Chart configuration options
export interface ChartOptions {
  responsive: boolean
  maintainAspectRatio?: boolean
  plugins?: {
    legend?: {
      display?: boolean
      position?: 'top' | 'bottom' | 'left' | 'right'
    }
    title?: {
      display?: boolean
      text?: string
    }
    tooltip?: {
      enabled?: boolean
      callbacks?: Record<string, Function>
    }
  }
  scales?: Record<string, any>
  animation?: {
    duration?: number
    easing?: string
  }
}

// Financial dashboard filters
export interface FinancialFilters {
  period: TimePeriod
  startDate?: string
  endDate?: string
  matterIds?: string[]
  lawyerIds?: string[]
  categories?: string[]
  includeProjected?: boolean
}

// Export format options
export type ExportFormat = 'csv' | 'excel' | 'pdf'

// Dashboard card configuration
export interface DashboardCardConfig {
  id: string
  title: string
  type: 'kpi' | 'chart' | 'table'
  chartType?: ChartType
  size: 'small' | 'medium' | 'large' | 'full'
  position: {
    x: number
    y: number
    w: number
    h: number
  }
  visible: boolean
  minimized?: boolean
}

// Financial categories
export interface ExpenseCategory {
  id: string
  name: string
  color: string
  budget?: number
  description?: string
  isActive: boolean
}

// Revenue category
export interface RevenueCategory {
  id: string
  name: string
  color: string
  target?: number
  description?: string
  isActive: boolean
}

// Budget allocation
export interface BudgetAllocation {
  categoryId: string
  allocated: number
  spent: number
  remaining: number
  utilizationPercentage: number
  isOverBudget: boolean
}

// Financial report data
export interface FinancialReport {
  id: string
  title: string
  generatedAt: string
  period: {
    start: string
    end: string
    type: TimePeriod
  }
  metrics: FinancialMetrics
  filters: FinancialFilters
  format: ExportFormat
}

// Dashboard state
export interface DashboardState {
  cards: DashboardCardConfig[]
  filters: FinancialFilters
  lastUpdated: string
  autoRefresh: boolean
  refreshInterval: number
}

// API response types
export interface FinancialSummaryResponse {
  success: boolean
  data: FinancialMetrics
  lastUpdated: string
  period: {
    start: string
    end: string
  }
}

export interface FinancialTrendsResponse {
  success: boolean
  data: {
    trends: FinancialMetrics['monthlyTrends']
    projections: Array<{
      month: string
      projectedExpenses: number
      projectedRevenue: number
    }>
  }
}

// Calculation utilities
export interface FinancialCalculations {
  calculateProfitMargin: (revenue: number, expenses: number) => number
  calculateBudgetUtilization: (spent: number, allocated: number) => number
  calculateGrowthRate: (current: number, previous: number) => number
  formatCurrency: (amount: number, currency?: string) => string
  formatPercentage: (value: number, decimals?: number) => string
}

// Validation schemas (for runtime validation)
export interface FinancialValidation {
  isValidPeriod: (period: string) => boolean
  isValidAmount: (amount: number) => boolean
  isValidDateRange: (start: string, end: string) => boolean
}