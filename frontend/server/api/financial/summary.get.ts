/**
 * Financial Summary API Endpoint
 * 
 * Provides comprehensive financial metrics and data for the dashboard.
 * Supports filtering by time period, matters, lawyers, and categories.
 */

interface FinancialSummaryQuery {
  period?: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  startDate?: string
  endDate?: string
  matterIds?: string
  lawyerIds?: string
  categories?: string
  includeProjected?: string
}

interface MonthlyTrend {
  month: string
  date: string
  expenses: number
  revenue: number
  profit: number
}

interface BudgetData {
  allocated: number
  spent: number
  remaining: number
}

interface FinancialMetrics {
  totalExpenses: number
  totalRevenue: number
  budgetTotal: number
  budgetUtilized: number
  profitMargin: number
  averageExpensePerMatter: number
  budgetUtilizationPercentage: number
  monthlyBurnRate: number
  projectedYearEndExpenses: number
  expensesByCategory: Record<string, number>
  expensesByMatter: Record<string, number>
  expensesByLawyer: Record<string, number>
  monthlyTrends: MonthlyTrend[]
  billableHours: number
  nonBillableHours: number
  averageHourlyRate: number
  totalBilledAmount: number
  budgetsByCategory: Record<string, BudgetData>
}

export default defineEventHandler(async (event): Promise<FinancialMetrics> => {
  const query = getQuery(event) as FinancialSummaryQuery
  
  // Parse query parameters
  const period = query.period || 'month'
  const startDate = query.startDate ? new Date(query.startDate) : undefined
  const endDate = query.endDate ? new Date(query.endDate) : undefined
  const selectedMatterIds = query.matterIds ? query.matterIds.split(',') : []
  const selectedLawyerIds = query.lawyerIds ? query.lawyerIds.split(',') : []
  const selectedCategories = query.categories ? query.categories.split(',') : []
  const includeProjected = query.includeProjected === 'true'
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))
  
  // Calculate period multiplier for scaling data
  const periodMultiplier = getPeriodMultiplier(period, startDate, endDate)
  
  // Base financial data
  const baseExpenses = 1250000
  const baseRevenue = 2150000
  
  // Apply filters to adjust data
  const filterMultiplier = getFilterMultiplier(selectedMatterIds, selectedLawyerIds, selectedCategories)
  const adjustedExpenses = Math.round(baseExpenses * periodMultiplier * filterMultiplier)
  const adjustedRevenue = Math.round(baseRevenue * periodMultiplier * filterMultiplier)
  
  // Generate expense breakdown by category
  const categoryDistribution = {
    'Legal Research': 0.36,
    'Court Fees': 0.22,
    'Office Supplies': 0.10,
    'Travel': 0.14,
    'Technology': 0.18
  }
  
  const expensesByCategory: Record<string, number> = {}
  Object.entries(categoryDistribution).forEach(([category, percentage]) => {
    if (selectedCategories.length === 0 || selectedCategories.includes(category)) {
      expensesByCategory[category] = Math.round(adjustedExpenses * percentage)
    }
  })
  
  // Generate expenses by matter
  const matterData = [
    { id: 'matter-1', name: 'Corporate Merger - ABC Corp', percentage: 0.30 },
    { id: 'matter-2', name: 'Patent Dispute - XYZ Inc', percentage: 0.24 },
    { id: 'matter-3', name: 'Contract Review - DEF Ltd', percentage: 0.12 },
    { id: 'matter-4', name: 'Litigation - GHI Corp', percentage: 0.34 }
  ]
  
  const expensesByMatter: Record<string, number> = {}
  matterData.forEach(matter => {
    if (selectedMatterIds.length === 0 || selectedMatterIds.includes(matter.id)) {
      expensesByMatter[matter.name] = Math.round(adjustedExpenses * matter.percentage)
    }
  })
  
  // Generate expenses by lawyer
  const lawyerData = [
    { id: 'lawyer-1', name: 'Tanaka, Hiroshi', percentage: 0.34 },
    { id: 'lawyer-2', name: 'Sato, Yuki', percentage: 0.28 },
    { id: 'lawyer-3', name: 'Yamamoto, Kenji', percentage: 0.38 }
  ]
  
  const expensesByLawyer: Record<string, number> = {}
  lawyerData.forEach(lawyer => {
    if (selectedLawyerIds.length === 0 || selectedLawyerIds.includes(lawyer.id)) {
      expensesByLawyer[lawyer.name] = Math.round(adjustedExpenses * lawyer.percentage)
    }
  })
  
  // Generate monthly trends
  const monthlyTrends = generateMonthlyTrends(period, startDate, endDate, filterMultiplier)
  
  // Calculate budget data
  const budgetTotal = Math.round(1500000 * periodMultiplier)
  const budgetUtilized = adjustedExpenses
  
  const budgetsByCategory: Record<string, BudgetData> = {}
  Object.entries(categoryDistribution).forEach(([category, percentage]) => {
    if (selectedCategories.length === 0 || selectedCategories.includes(category)) {
      const allocated = Math.round(budgetTotal * percentage)
      const spent = expensesByCategory[category] || 0
      budgetsByCategory[category] = {
        allocated,
        spent,
        remaining: allocated - spent
      }
    }
  })
  
  // Calculate billable hours
  const billableHours = Math.round(1850 * periodMultiplier * filterMultiplier)
  const nonBillableHours = Math.round(420 * periodMultiplier * filterMultiplier)
  const averageHourlyRate = 18500
  
  // Add projection data if requested
  const projectionMultiplier = includeProjected ? 1.15 : 1.0
  
  const metrics: FinancialMetrics = {
    totalExpenses: Math.round(adjustedExpenses * projectionMultiplier),
    totalRevenue: Math.round(adjustedRevenue * projectionMultiplier),
    budgetTotal,
    budgetUtilized: adjustedExpenses,
    profitMargin: ((adjustedRevenue - adjustedExpenses) / adjustedRevenue) * 100,
    averageExpensePerMatter: Math.round(adjustedExpenses / Object.keys(expensesByMatter).length),
    budgetUtilizationPercentage: (adjustedExpenses / budgetTotal) * 100,
    monthlyBurnRate: Math.round(adjustedExpenses / getPeriodInMonths(period)),
    projectedYearEndExpenses: Math.round(adjustedExpenses * (12 / getPeriodInMonths(period))),
    expensesByCategory,
    expensesByMatter,
    expensesByLawyer,
    monthlyTrends,
    billableHours,
    nonBillableHours,
    averageHourlyRate,
    totalBilledAmount: Math.round(billableHours * averageHourlyRate),
    budgetsByCategory
  }
  
  return metrics
})

function getPeriodMultiplier(period: string, startDate?: Date, endDate?: Date): number {
  switch (period) {
    case 'week': return 0.25
    case 'month': return 1
    case 'quarter': return 3
    case 'year': return 12
    case 'custom':
      if (startDate && endDate) {
        const daysDiff = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff / 30 // Convert to months
      }
      return 1
    default: return 1
  }
}

function getPeriodInMonths(period: string): number {
  switch (period) {
    case 'week': return 0.25
    case 'month': return 1
    case 'quarter': return 3
    case 'year': return 12
    default: return 1
  }
}

function getFilterMultiplier(matterIds: string[], lawyerIds: string[], categories: string[]): number {
  let multiplier = 1.0
  
  // Reduce data based on selected filters
  if (matterIds.length > 0) {
    multiplier *= Math.min(matterIds.length / 4, 1) // Max 4 matters
  }
  
  if (lawyerIds.length > 0) {
    multiplier *= Math.min(lawyerIds.length / 3, 1) // Max 3 lawyers
  }
  
  if (categories.length > 0) {
    multiplier *= Math.min(categories.length / 5, 1) // Max 5 categories
  }
  
  return multiplier
}

function generateMonthlyTrends(
  period: string, 
  startDate?: Date, 
  endDate?: Date, 
  filterMultiplier: number = 1
): MonthlyTrend[] {
  const monthCount = getMonthCount(period, startDate, endDate)
  const trends: MonthlyTrend[] = []
  const baseDate = new Date()
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Generate realistic trend data with some variation and seasonal patterns
    const seasonalFactor = 1 + (Math.sin((date.getMonth() + 1) * Math.PI / 6) * 0.15)
    const trendFactor = 1 + (i * 0.02) // Slight upward trend
    const randomVariation = 0.8 + (Math.random() * 0.4) // ±20% variation
    
    const baseExpenses = 95000 * seasonalFactor * trendFactor * randomVariation * filterMultiplier
    const baseRevenue = 165000 * seasonalFactor * trendFactor * randomVariation * filterMultiplier
    
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

function getMonthCount(period: string, startDate?: Date, endDate?: Date): number {
  switch (period) {
    case 'week': return 1
    case 'month': return 6
    case 'quarter': return 3
    case 'year': return 12
    case 'custom':
      if (startDate && endDate) {
        const monthsDiff = Math.abs(endDate.getMonth() - startDate.getMonth() + 
          (12 * (endDate.getFullYear() - startDate.getFullYear())))
        return Math.max(1, Math.min(monthsDiff, 24)) // Limit to 2 years max
      }
      return 6
    default: return 6
  }
}