/**
 * Financial Data Types
 * 
 * @description Type definitions for financial management features including
 * expenses, receipts, and financial reporting with mobile optimization support.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T08_S14 - Mobile Optimization for Financial Features
 */

// Base financial entities
export interface Expense {
  id: string
  amount: number
  currency: string
  description: string
  expenseDate: string | Date
  expenseType: ExpenseType
  billable: boolean
  matterId?: string
  receiptFile?: File | string
  receiptUrl?: string
  approvalStatus: ApprovalStatus
  approvedBy?: string
  approvedAt?: string | Date
  notes?: string
  tags?: string[]
  createdBy: string
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Receipt {
  id: string
  expenseId?: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  ocrText?: string
  ocrConfidence?: number
  metadata?: ReceiptMetadata
  uploadedAt: string | Date
  processedAt?: string | Date
}

export interface ReceiptMetadata {
  vendor?: string
  totalAmount?: number
  taxAmount?: number
  date?: string
  paymentMethod?: string
  confidence?: number
  extractedFields?: Record<string, string | number | boolean>
}

// Enums
export type ExpenseType = 
  | 'TRAVEL'
  | 'MEALS'
  | 'ACCOMMODATION'
  | 'COURT_FEES'
  | 'FILING_FEES'
  | 'COPYING'
  | 'POSTAGE'
  | 'TELEPHONE'
  | 'RESEARCH'
  | 'EXPERT_WITNESS'
  | 'OTHER'

export type ApprovalStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DRAFT'

// Financial summary and reporting
export interface FinancialSummary {
  totalExpenses: number
  expenseCount: number
  pendingCount: number
  pendingAmount: number
  currentMonth: number
  billableAmount: number
  billableCount: number
  recentExpenses?: Expense[]
}

// Alias for compatibility 
export type FinancialSummaryResponse = FinancialSummary

export interface ExpenseFilters {
  status?: ApprovalStatus[]
  expenseType?: ExpenseType[]
  billable?: boolean
  dateFrom?: string | Date
  dateTo?: string | Date
  matterId?: string
  minAmount?: number
  maxAmount?: number
  search?: string
}

// Mobile and offline support
export interface FinancialSyncItem<T = Expense | Receipt> {
  id: string
  action: 'create' | 'update' | 'delete'
  type: 'expense' | 'receipt'
  data: T
  timestamp: number
  priority: 'high' | 'medium' | 'low'
  retryCount: number
  lastRetry: number | null
  conflict: SyncConflict<T> | null
}

export interface SyncConflict<T> {
  localData: T
  serverData: T
  timestamp: number
}

// Form validation schemas (for Zod integration)
export interface ExpenseFormData {
  amount: number
  currency: string
  description: string
  expenseDate: string
  expenseType: ExpenseType
  billable: boolean
  matterId?: string
  receiptFile?: File
  notes?: string
}

// Additional types for compatibility with existing codebase
export interface FinancialMetrics {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  expenseGrowth: number
  revenueGrowth: number
  budgetTotal?: number
  budgetUtilized?: number
  budgetUtilizationPercentage?: number
  billableHours?: number
  nonBillableHours?: number
  expensesByCategory?: Array<{ category: string; amount: number }> | Record<string, number>
  averageExpensePerMatter?: number
  monthlyBurnRate?: number
  projectedYearEndExpenses?: number
  expensesByMatter?: Record<string, number>
  expensesByLawyer?: Record<string, number>
  monthlyTrends?: Array<{ month: string; amount?: number; date?: string; expenses?: number; revenue?: number; profit?: number }>
  averageHourlyRate?: number
  totalBilledAmount?: number
  budgetsByCategory?: Record<string, { allocated: number; spent: number; remaining: number }>
}

export interface FinancialFilters {
  dateFrom?: string | Date
  dateTo?: string | Date
  startDate?: string | Date
  endDate?: string | Date
  category?: ExpenseType[]
  categories?: ExpenseType[]
  status?: ApprovalStatus[]
  billable?: boolean
  search?: string
  period?: string
  includeProjected?: boolean
  matterIds?: string[]
  lawyerIds?: string[]
}

export interface FinancialKPI {
  id: string
  name?: string
  title?: string
  value: number
  change?: number
  trend?: 'up' | 'down' | 'neutral' | 'stable' | {
    direction: 'up' | 'down' | 'stable' | 'neutral'
    percentage: number
    period: string
  }
  unit?: string
  description?: string
  formattedValue?: string
  icon?: string
  color?: string
}

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'