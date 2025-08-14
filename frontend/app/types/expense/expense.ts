import type { ITag as _ITag } from './tag'
import type { IAttachment as _IAttachment } from './attachment'
import type { IExpense } from '~/types/expense'

// IExpense is defined in ~/types/expense.ts to avoid conflicts

/**
 * Filter criteria for expense queries
 * Used for search and filtering operations
 */
export interface IExpenseFilter {
  /** Start date for date range filter (inclusive) */
  startDate?: string
  /** End date for date range filter (inclusive) */
  endDate?: string
  /** Filter by specific case ID */
  caseId?: string
  /** Filter by expense category */
  category?: string
  /** Filter by tag IDs (OR operation) */
  tagIds?: string[]
  /** Full-text search query across description and memo */
  searchQuery?: string
  /** Alternative search term field for compatibility */
  searchTerm?: string
  /** Minimum amount filter */
  minAmount?: number
  /** Maximum amount filter */
  maxAmount?: number
  /** Balance type filter (positive, negative, zero, all) */
  balanceType?: string
  /** Filter for expenses with memo */
  hasMemo?: boolean
  /** Filter for expenses with attachments */
  hasAttachments?: boolean
  /** Field to sort by */
  sortBy?: 'date' | 'category' | 'description' | 'balance' | 'amount'
  /** Sort order direction */
  sortOrder?: 'ASC' | 'DESC'
  /** Pagination offset */
  offset?: number
  /** Items per page limit */
  limit?: number
}

/**
 * Paginated list of expenses with metadata
 * Returned by list endpoints
 */
export interface IExpenseList {
  /** Array of expense items */
  items: IExpense[]
  /** Total number of expenses matching the filter */
  total: number
  /** Current offset for pagination */
  offset: number
  /** Number of items per page */
  limit: number
  /** Whether there are more items available */
  hasMore: boolean
}

/**
 * Form data structure for expense creation/editing
 * Optimized for UI form handling
 */
export interface IExpenseFormData {
  /** Date of the expense */
  date: string
  /** Category of the expense */
  category: string
  /** Description of the expense */
  description: string
  /** Income amount (defaults to 0) */
  incomeAmount: number
  /** Expense amount (defaults to 0) */
  expenseAmount: number
  /** Optional case ID */
  caseId?: string
  /** Optional memo */
  memo?: string
  /** Array of tag IDs to associate */
  tagIds: string[]
  /** Array of attachment IDs to associate */
  attachmentIds: string[]
  /** Index signature for Record compatibility */
  [key: string]: unknown
}

/**
 * Computed expense statistics for dashboard and reporting
 */
export interface IExpenseStats {
  /** Total income amount */
  totalIncome: number
  /** Total expense amount */
  totalExpense: number
  /** Net balance (income - expense) */
  netBalance: number
  /** Number of transactions */
  transactionCount: number
  /** Period for these statistics */
  period: {
    startDate: string
    endDate: string
  }
}

/**
 * Expense category with usage statistics
 */
export interface IExpenseCategory {
  /** Category name */
  name: string
  /** Display label for the category */
  label: string
  /** Total amount for this category */
  totalAmount: number
  /** Number of transactions in this category */
  transactionCount: number
  /** Color for UI display */
  color?: string
}

/**
 * Summary data for expense list page
 * Used for displaying aggregate statistics
 */
export interface IExpenseSummary {
  /** Total income amount for the period */
  totalIncome: number
  /** Total expense amount for the period */
  totalExpense: number
  /** Net balance (income - expense) */
  balance: number
  /** Number of transactions */
  count: number
  /** Categories breakdown */
  categories: Array<{
    name: string
    count: number
    total: number
  }>
  /** Period information for the summary */
  period: {
    startDate: string
    endDate: string
  }
}