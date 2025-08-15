import type { ITag } from './tag'
import type { IAttachment } from './attachment'

/**
 * Request DTO for creating a new expense
 * Maps to backend CreateExpenseRequest from M002 API specifications
 */
export interface ICreateExpenseRequest {
  /** Date of the expense transaction */
  date: string
  /** Category of the expense */
  category: string
  /** Description of the expense */
  description: string
  /** Income amount (optional, defaults to 0) */
  incomeAmount?: number
  /** Expense amount (optional, defaults to 0) */
  expenseAmount?: number
  /** Optional case ID to associate with */
  caseId?: string
  /** Optional memo or notes */
  memo?: string
  /** Optional array of tag IDs to associate */
  tagIds?: string[]
  /** Optional array of attachment IDs to associate */
  attachmentIds?: string[]
}

/**
 * Request DTO for updating an existing expense
 * Maps to backend UpdateExpenseRequest from M002 API specifications
 */
export interface IUpdateExpenseRequest {
  /** Optional new date */
  date?: string
  /** Optional new category */
  category?: string
  /** Optional new description */
  description?: string
  /** Optional new income amount */
  incomeAmount?: number
  /** Optional new expense amount */
  expenseAmount?: number
  /** Optional new case ID */
  caseId?: string
  /** Optional new memo */
  memo?: string
  /** Optional new array of tag IDs */
  tagIds?: string[]
  /** Optional new array of attachment IDs */
  attachmentIds?: string[]
}

/**
 * Response DTO for expense operations
 * Maps to backend ExpenseResponse from M002 API specifications
 */
export interface IExpenseResponse {
  /** Unique identifier */
  id: string
  /** Transaction date */
  date: string
  /** Expense category */
  category: string
  /** Expense description */
  description: string
  /** Income amount */
  incomeAmount: number
  /** Expense amount */
  expenseAmount: number
  /** Running balance */
  balance: number
  /** Associated case ID */
  caseId?: string
  /** Memo or notes */
  memo?: string
  /** Associated tags */
  tags: ITag[]
  /** Associated attachments */
  attachments: IAttachment[]
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
  /** Version for optimistic locking */
  version: number
}

/**
 * Generic paginated response wrapper
 * Maps to backend PagedResponse from M002 API specifications
 */
export interface IPagedResponse<T> {
  /** Array of items */
  items: T[]
  /** Total number of items matching the filter */
  total: number
  /** Current offset */
  offset: number
  /** Number of items per page */
  limit: number
  /** Whether there are more items available */
  hasMore: boolean
}

/**
 * Expense list query parameters
 * Used for GET /api/v1/expenses endpoint
 */
export interface IExpenseListParams {
  /** Pagination offset (default: 0) */
  offset?: number
  /** Items per page (default: 20) */
  limit?: number
  /** Filter by start date (inclusive) */
  startDate?: string
  /** Filter by end date (inclusive) */
  endDate?: string
  /** Filter by case ID */
  caseId?: string
  /** Filter by category */
  category?: string
  /** Filter by tag IDs (comma-separated) */
  tagIds?: string[]
  /** Full-text search query */
  searchQuery?: string
  /** Sort field (default: date) */
  sortBy?: 'date' | 'category' | 'description' | 'balance'
  /** Sort order (default: DESC) */
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Tag list query parameters
 * Used for GET /api/v1/tags endpoint
 */
export interface ITagListParams {
  /** Filter by tag scope */
  scope?: 'TENANT' | 'PERSONAL'
  /** Search query for tag names */
  search?: string
}

/**
 * Standard API error response
 * Consistent error format across all endpoints
 */
export interface IApiErrorResponse {
  /** Error code for programmatic handling */
  code: string
  /** Human-readable error message */
  message: string
  /** Optional additional error details */
  details?: Record<string, unknown>
  /** Timestamp when error occurred */
  timestamp?: string
  /** Request ID for tracing */
  requestId?: string
}

/**
 * Validation error details
 * Used for form validation errors
 */
export interface IValidationErrorResponse extends IApiErrorResponse {
  /** Field-specific validation errors */
  fieldErrors: {
    /** Field name */
    field: string
    /** Error message for this field */
    message: string
    /** Validation rule that failed */
    code: string
  }[]
}

/**
 * Expense statistics response
 * Used for dashboard and reporting endpoints
 */
export interface IExpenseStatsResponse {
  /** Period for these statistics */
  period: {
    startDate: string
    endDate: string
  }
  /** Financial summary */
  summary: {
    totalIncome: number
    totalExpense: number
    netBalance: number
    transactionCount: number
  }
  /** Breakdown by category */
  categoryBreakdown: {
    category: string
    totalAmount: number
    transactionCount: number
    percentage: number
  }[]
  /** Breakdown by tag */
  tagBreakdown: {
    tagId: string
    tagName: string
    tagColor: string
    totalAmount: number
    transactionCount: number
    percentage: number
  }[]
  /** Monthly trend data */
  monthlyTrend: {
    month: string
    income: number
    expense: number
    netBalance: number
  }[]
}

/**
 * Bulk operation request for multiple expenses
 */
export interface IBulkExpenseRequest {
  /** Array of expense IDs to operate on */
  expenseIds: string[]
  /** Operation to perform */
  operation: 'delete' | 'addTags' | 'removeTags' | 'updateCategory'
  /** Operation-specific parameters */
  parameters?: {
    /** For addTags/removeTags operations */
    tagIds?: string[]
    /** For updateCategory operation */
    category?: string
  }
}

/**
 * Bulk operation response
 */
export interface IBulkExpenseResponse {
  /** Number of successfully processed items */
  successCount: number
  /** Number of failed items */
  failureCount: number
  /** Details of failed operations */
  failures: {
    expenseId: string
    error: string
  }[]
}

/**
 * CSV import request structure
 */
export interface ICsvImportRequest {
  /** CSV file content or file ID */
  fileId: string
  /** Column mapping configuration */
  columnMapping: {
    date: string
    category: string
    description: string
    incomeAmount?: string
    expenseAmount?: string
    caseId?: string
    memo?: string
  }
  /** Import options */
  options: {
    skipFirstRow: boolean
    dateFormat: string
    defaultCategory?: string
  }
}

/**
 * CSV import response
 */
export interface ICsvImportResponse {
  /** Import job ID for tracking */
  jobId: string
  /** Number of rows processed */
  totalRows: number
  /** Number of successful imports */
  successCount: number
  /** Number of failed imports */
  failureCount: number
  /** Preview of imported data */
  preview: IExpenseResponse[]
  /** Import errors */
  errors: {
    row: number
    field: string
    error: string
  }[]
}