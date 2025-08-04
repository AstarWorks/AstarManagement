import type { Tag } from './tag'
import type { Attachment } from './attachment'

/**
 * Core expense entity representing a financial transaction
 * Maps to backend Expense entity from M002 API specifications
 */
export interface Expense {
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
  tags: Tag[]
  /** File attachments associated with this expense */
  attachments: Attachment[]
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
export interface ExpenseFilter {
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
  /** Field to sort by */
  sortBy?: 'date' | 'category' | 'description' | 'balance'
  /** Sort order direction */
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Paginated list of expenses with metadata
 * Returned by list endpoints
 */
export interface ExpenseList {
  /** Array of expense items */
  items: Expense[]
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
export interface ExpenseFormData {
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
}

/**
 * Computed expense statistics for dashboard and reporting
 */
export interface ExpenseStats {
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
export interface ExpenseCategory {
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