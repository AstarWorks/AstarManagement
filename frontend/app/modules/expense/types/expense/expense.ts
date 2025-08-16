/**
 * Expense Domain Types
 * Core expense entity definitions and related types
 */

import type { ITag } from './tag'
import type { IAttachment } from './attachment'

// ====================================
// Core Domain Types
// ====================================

/**
 * Base expense entity interface
 * Maps to backend Expense entity from M002 API specifications
 */
export interface IExpense {
  /** Unique identifier */
  id: string
  /** Transaction date (ISO 8601 format) */
  date: string
  /** Expense category */
  category: string
  /** Description of the expense */
  description: string
  /** Income amount (defaults to 0) */
  incomeAmount: number
  /** Expense amount (defaults to 0) */
  expenseAmount: number
  /** Associated case ID */
  caseId?: string
  /** Optional memo or notes */
  memo?: string
  /** Array of tag IDs associated with this expense */
  tagIds: string[]
  /** Array of attachment IDs associated with this expense */
  attachmentIds: string[]
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
  /** User ID who created the expense */
  createdBy: string
  /** Tenant ID for multi-tenancy isolation */
  tenantId: string
}

/**
 * Expense with populated relations
 * Used when fetching expenses with related entities
 */
export interface IExpenseWithRelations extends IExpense {
  /** Populated tag entities */
  tags?: ITag[]
  /** Populated attachment entities */
  attachments?: IAttachment[]
  /** Populated case information */
  case?: IExpenseCase
}

/**
 * Extended expense interface with computed fields
 * Used for display with calculated balance
 */
export interface IExpenseWithBalance extends IExpense {
  /** Computed balance (incomeAmount - expenseAmount) */
  balance: number
  /** Populated tags */
  tags?: ITag[]
  /** Populated attachments */
  attachments?: IAttachment[]
  /** User ID who last updated */
  updatedBy?: string
  /** Version for optimistic locking */
  version?: number
}

/**
 * Expense case reference
 * Simplified case information for expense context
 */
export interface IExpenseCase {
  /** Case unique identifier */
  id: string
  /** Case name/title */
  name: string
  /** Client name associated with the case */
  clientName: string
  /** Current case status */
  status: 'active' | 'inactive' | 'completed'
}

// ====================================
// Filter and Query Types
// ====================================

/**
 * Comprehensive expense filter interface
 * Used for search, filtering, and pagination operations
 */
export interface IExpenseFilters {
  // Date filtering - support multiple naming conventions for compatibility
  /** Start date for date range filter (inclusive) */
  startDate?: string
  /** End date for date range filter (inclusive) */
  endDate?: string
  /** Alternative: Start date (same as startDate) */
  dateFrom?: string
  /** Alternative: End date (same as endDate) */
  dateTo?: string
  
  // Category filtering
  /** Filter by specific category */
  category?: string
  /** Filter by multiple categories (OR operation) */
  categories?: string[]
  
  // Entity associations
  /** Filter by specific case ID */
  caseId?: string
  /** Filter by multiple case IDs (OR operation) */
  caseIds?: string[]
  /** Filter by tag IDs (OR operation) */
  tagIds?: string[]
  
  // Amount filtering - support multiple naming conventions
  /** Minimum amount filter */
  minAmount?: number
  /** Maximum amount filter */
  maxAmount?: number
  /** Alternative: Minimum amount */
  amountMin?: number
  /** Alternative: Maximum amount */
  amountMax?: number
  
  // Search and additional filters
  /** Full-text search query */
  searchQuery?: string
  /** Alternative: Search term */
  searchTerm?: string
  /** Balance type filter (positive, negative, zero, all) */
  balanceType?: string
  /** Filter for expenses with memo */
  hasMemo?: boolean
  /** Filter for expenses with attachments */
  hasAttachments?: boolean
  
  // Pagination
  /** Pagination offset */
  offset?: number
  /** Items per page limit */
  limit?: number
  
  // Sorting
  /** Field to sort by */
  sortBy?: 'date' | 'category' | 'description' | 'balance' | 'amount'
  /** Sort order direction */
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Expense sort options
 * Simplified sorting configuration
 */
export interface IExpenseSortOptions {
  /** Field to sort by */
  field: keyof IExpense
  /** Sort direction */
  order: 'asc' | 'desc'
}

// ====================================
// List and Pagination Types
// ====================================

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

// ====================================
// Form and UI Types
// ====================================

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
 * Form field change event with type safety
 */
export interface IExpenseFieldChangeEvent {
  /** Field that changed */
  field: keyof IExpenseFormData
  /** New value */
  value: string | number | string[] | undefined
  /** Whether the new value is valid */
  isValid?: boolean
}

/**
 * Form props interface with explicit state modeling
 */
export interface IExpenseFormFieldsProps {
  /** Whether form is disabled */
  disabled?: boolean
  /** Form mode */
  mode?: 'create' | 'edit'
  /** Initial data for edit mode */
  initialData?: Partial<IExpenseFormData>
}

/**
 * Form emits interface with type safety
 */
export interface IExpenseFormFieldsEmits {
  (e: 'openTagSelector' | 'openAttachmentUpload'): void
  (e: 'fieldChange', event: IExpenseFieldChangeEvent): void
  (e: 'validationChange', isValid: boolean): void
}

/**
 * Expense form validation result interface
 */
export interface IExpenseFormValidationResult {
  /** Overall validation status */
  isValid: boolean
  /** Field-specific errors */
  errors: Record<string, string>
  /** Optional warnings */
  warnings?: Record<string, string>
}

// ====================================
// State Management Types
// ====================================

/**
 * Loading state interface for async operations
 */
export interface IExpenseLoadingState {
  /** Loading status */
  isLoading: boolean
  /** Error message if any */
  error: string | null
}

/**
 * Expense list state interface
 * Used for managing list component state
 */
export interface IExpenseListState extends IExpenseLoadingState {
  /** List of expenses */
  data: IExpense[]
  /** Total count */
  total: number
  /** Current page number */
  currentPage: number
  /** Items per page */
  pageSize: number
}

// ====================================
// Statistics Types
// ====================================

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
  /** Category identifier/value */
  value?: string
  /** Category name */
  name?: string
  /** Display label for the category */
  label?: string
  /** i18n key for label */
  labelKey?: string
  /** Total amount for this category */
  totalAmount?: number
  /** Number of transactions in this category */
  transactionCount?: number
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

/**
 * Detailed expense statistics interface
 * Used for comprehensive reporting
 */
export interface IExpenseStatistics {
  /** Total income */
  totalIncome: number
  /** Total expenses */
  totalExpenses: number
  /** Net balance */
  balance: number
  /** Expenses grouped by category */
  expensesByCategory: Record<string, number>
  /** Expenses grouped by month */
  expensesByMonth: Record<string, number>
  /** Top expense categories with details */
  topExpenseCategories: Array<{
    category: string
    amount: number
    count: number
  }>
}

// ====================================
// Error Types
// ====================================

/**
 * Error types for better error handling
 */
export type ExpenseErrorType = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'FILE_UPLOAD_ERROR'

/**
 * Expense error interface
 */
export interface IExpenseError {
  /** Error type for programmatic handling */
  type: ExpenseErrorType
  /** Human-readable error message */
  message: string
  /** Field that caused the error */
  field?: string
  /** Error code */
  code?: string
  /** Additional error details */
  details?: Record<string, unknown>
}

// ====================================
// Type Guards
// ====================================

/**
 * Type guard to check if expense has relations populated
 */
export const isExpenseWithRelations = (
  expense: IExpense | IExpenseWithRelations
): expense is IExpenseWithRelations => {
  return 'tags' in expense || 'attachments' in expense || 'case' in expense
}

/**
 * Type guard to check if error is an expense error
 */
export const isApiError = (error: unknown): error is IExpenseError => {
  return typeof error === 'object' && 
         error !== null && 
         'type' in error && 
         'message' in error
}