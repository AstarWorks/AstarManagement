import type { ITag } from './tag'
import type { IAttachment } from './attachment'

/**
 * Core expense entity representing a financial transaction
 * Maps to backend Expense entity from M002 API specifications
 */
export interface IExpense {
  /** Unique identifier for the expense */
  id: string
  /** Tenant ID for multi-tenancy isolation */
  tenantId: string
  /** Date of the expense transaction */
  date: string
  /** Category of the expense (e.g., Transportation, Office Supplies) */
  category: string
  /** Human-readable description of the expense */
  description: string
  /** Income amount in the transaction (positive value) */
  incomeAmount: number
  /** Expense amount in the transaction (positive value) */
  expenseAmount: number
  /** Running balance after this transaction */
  balance: number
  /** Optional case ID this expense is associated with */
  caseId?: string
  /** Optional memo or additional notes */
  memo?: string
  /** Tags associated with this expense */
  tags: ITag[]
  /** File attachments associated with this expense */
  attachments: IAttachment[]
  /** Timestamp when the expense was created */
  createdAt: string
  /** Timestamp when the expense was last updated */
  updatedAt: string
  /** User ID who created the expense */
  createdBy: string
  /** User ID who last updated the expense */
  updatedBy: string
  /** Version for optimistic locking */
  version: number
}

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