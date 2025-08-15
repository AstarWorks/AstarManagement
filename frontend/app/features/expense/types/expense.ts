/**
 * Expense Domain Types - Unified type definitions
 * 
 * This file consolidates all expense-related types for the Astar Management system.
 * Following "Simple over Easy" principle with clear, explicit type definitions.
 */

import type { ExpenseFormData } from '~/schemas/expense'

// ====================================
// Core Domain Types
// ====================================

/**
 * Base expense entity interface
 */
export interface IExpense {
  id: string
  date: string
  category: string
  description: string
  incomeAmount: number
  expenseAmount: number
  caseId?: string
  memo?: string
  tagIds: string[]
  attachmentIds: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
  tenantId: string
}

/**
 * Expense with populated relations
 */
export interface IExpenseWithRelations extends IExpense {
  tags?: ITag[]
  attachments?: IAttachment[]
  case?: IExpenseCase
}

/**
 * Extended expense interface with computed fields
 */
export interface IExpenseWithBalance extends IExpense {
  balance: number
  tags?: ITag[]
  attachments?: IAttachment[]
  updatedBy?: string
  version?: number
}

/**
 * Expense case reference
 */
export interface IExpenseCase {
  id: string
  name: string
  clientName: string
  status: 'active' | 'inactive' | 'completed'
}

// ====================================
// Tag Types
// ====================================

/**
 * Tag scope enumeration defining tag visibility and ownership
 */
export enum TagScope {
  /** Tag is visible to all users in the tenant */
  TENANT = 'TENANT',
  /** Tag is private to the individual user */
  PERSONAL = 'PERSONAL'
}

// IExpenseTag has been removed - use ITag instead

/**
 * Tag entity for categorizing and organizing expenses
 * Maps to backend Tag entity from M002 API specifications
 */
export interface ITag {
  id: string
  tenantId: string
  name: string
  color: string
  scope: TagScope
  ownerId?: string
  usageCount: number
  lastUsedAt?: string | null
  createdAt: string
  createdBy: string
}

/**
 * Tag with usage statistics for UI display
 */
export interface ITagWithStats extends ITag {
  usageTrend: number
  totalAmount: number
  averageAmount: number
}

/**
 * Tag filter criteria
 */
export interface ITagFilter {
  scope?: TagScope
  search?: string
  ownerId?: string
  sortBy?: 'name' | 'usageCount' | 'lastUsedAt' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Predefined color palette for tag creation
 */
export const TAG_COLORS = [
  '#FF5733', // Red-Orange
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33F1', // Magenta
  '#F1FF33', // Yellow
  '#33FFF1', // Cyan
  '#FF8C33', // Orange
  '#8C33FF', // Purple
  '#33FF8C', // Light Green
  '#FF338C', // Pink
  '#8CFF33', // Lime
  '#338CFF'  // Light Blue
] as const

export type TagColor = typeof TAG_COLORS[number]

// ====================================
// Attachment Types
// ====================================

/**
 * Attachment status enumeration
 */
export enum AttachmentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSED = 'PROCESSED',
  LINKED = 'LINKED',
  DELETED = 'DELETED'
}

// IExpenseAttachment has been removed - use IAttachment instead

/**
 * File attachment entity for expense documents
 */
export interface IAttachment {
  id: string
  tenantId: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  storagePath: string
  status: AttachmentStatus
  linkedAt?: string
  expiresAt?: string
  thumbnailPath?: string
  thumbnailSize?: number
  uploadedAt: string
  uploadedBy: string
  deletedAt?: string
  deletedBy?: string
}

/**
 * File upload progress information
 */
export interface IUploadProgress {
  attachmentId: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  estimatedTimeRemaining?: number
}

/**
 * File type validation rules
 */
export interface IFileTypeRule {
  mimeType: string
  extension: string
  maxSize: number
  supportsThumbnail: boolean
}

/**
 * Attachment filter criteria
 */
export interface IAttachmentFilter {
  status?: AttachmentStatus
  mimeType?: string
  extension?: string
  uploadedAfter?: string
  uploadedBefore?: string
  sortBy?: 'uploadedAt' | 'originalName' | 'fileSize'
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Supported file types for expense attachments
 */
export const SUPPORTED_FILE_TYPES: IFileTypeRule[] = [
  // Images
  {
    mimeType: 'image/jpeg',
    extension: '.jpg',
    maxSize: 10 * 1024 * 1024, // 10MB
    supportsThumbnail: true
  },
  {
    mimeType: 'image/png',
    extension: '.png',
    maxSize: 10 * 1024 * 1024, // 10MB
    supportsThumbnail: true
  },
  {
    mimeType: 'image/gif',
    extension: '.gif',
    maxSize: 5 * 1024 * 1024, // 5MB
    supportsThumbnail: true
  },
  // Documents
  {
    mimeType: 'application/pdf',
    extension: '.pdf',
    maxSize: 25 * 1024 * 1024, // 25MB
    supportsThumbnail: false
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
    maxSize: 15 * 1024 * 1024, // 15MB
    supportsThumbnail: false
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    maxSize: 15 * 1024 * 1024, // 15MB
    supportsThumbnail: false
  },
  // Text files
  {
    mimeType: 'text/plain',
    extension: '.txt',
    maxSize: 1 * 1024 * 1024, // 1MB
    supportsThumbnail: false
  },
  {
    mimeType: 'text/csv',
    extension: '.csv',
    maxSize: 5 * 1024 * 1024, // 5MB
    supportsThumbnail: false
  }
]

/**
 * File size utility constants
 */
export const FILE_SIZE = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB per expense
  MAX_FILES_PER_EXPENSE: 10
} as const

// ====================================
// Filter and Query Types
// ====================================

/**
 * Expense filters interface
 */
export interface IExpenseFilters {
  // Date filtering - support both naming conventions
  dateFrom?: string
  dateTo?: string
  startDate?: string
  endDate?: string
  // Category filtering - support both single and array
  category?: string
  categories?: string[]
  // ID-based filtering
  tagIds?: string[]
  caseId?: string
  caseIds?: string[]
  // Amount filtering
  amountMin?: number
  amountMax?: number
  minAmount?: number
  maxAmount?: number
  // Balance type
  balanceType?: string
  // Search
  searchTerm?: string
  searchQuery?: string
  // Filters for memo and attachments
  hasMemo?: boolean
  hasAttachments?: boolean
  // Pagination
  offset?: number
  limit?: number
  // Sorting
  sortBy?: 'date' | 'category' | 'description' | 'balance' | 'amount'
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Expense sort options
 */
export interface IExpenseSortOptions {
  field: keyof IExpense
  order: 'asc' | 'desc'
}

// ====================================
// Form and UI Types
// ====================================

/**
 * Form data structure for expense creation/editing
 */
export interface IExpenseFormData {
  date: string
  category: string
  description: string
  incomeAmount: number
  expenseAmount: number
  caseId?: string
  memo?: string
  tagIds: string[]
  attachmentIds: string[]
  [key: string]: unknown
}

/**
 * Form field change event with type safety
 */
export interface IExpenseFieldChangeEvent {
  field: keyof ExpenseFormData
  value: string | number | string[] | undefined
  isValid?: boolean
}

/**
 * Form props interface with explicit state modeling
 */
export interface IExpenseFormFieldsProps {
  disabled?: boolean
  mode?: 'create' | 'edit'
  initialData?: Partial<ExpenseFormData>
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
  isValid: boolean
  errors: Record<string, string>
  warnings?: Record<string, string>
}

// ====================================
// State Management Types
// ====================================

/**
 * Loading state interface for async operations
 */
export interface IExpenseLoadingState {
  isLoading: boolean
  error: string | null
}

/**
 * Expense list state interface
 */
export interface IExpenseListState extends IExpenseLoadingState {
  data: IExpense[]
  total: number
  currentPage: number
  pageSize: number
}

/**
 * Paginated list of expenses with metadata
 */
export interface IExpenseList {
  items: IExpense[]
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

// ====================================
// Statistics Types
// ====================================

/**
 * Expense statistics interface
 */
export interface IExpenseStatistics {
  totalIncome: number
  totalExpenses: number
  balance: number
  expensesByCategory: Record<string, number>
  expensesByMonth: Record<string, number>
  topExpenseCategories: Array<{
    category: string
    amount: number
    count: number
  }>
}

/**
 * Computed expense statistics for dashboard and reporting
 */
export interface IExpenseStats {
  totalIncome: number
  totalExpense: number
  netBalance: number
  transactionCount: number
  period: {
    startDate: string
    endDate: string
  }
}

/**
 * Summary data for expense list page
 */
export interface IExpenseSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  count: number
  categories: Array<{
    name: string
    count: number
    total: number
  }>
  period: {
    startDate: string
    endDate: string
  }
}

/**
 * Expense category with usage statistics
 */
export interface IExpenseCategory {
  name: string
  label: string
  totalAmount: number
  transactionCount: number
  color?: string
}

// ====================================
// API Types
// ====================================

/**
 * Request DTO for creating a new expense
 */
export interface ICreateExpenseRequest {
  date: string
  category: string
  description: string
  incomeAmount?: number
  expenseAmount?: number
  caseId?: string
  memo?: string
  tagIds?: string[]
  attachmentIds?: string[]
}

/**
 * Request DTO for updating an existing expense
 */
export interface IUpdateExpenseRequest {
  date?: string
  category?: string
  description?: string
  incomeAmount?: number
  expenseAmount?: number
  caseId?: string
  memo?: string
  tagIds?: string[]
  attachmentIds?: string[]
}

/**
 * Response DTO for expense operations
 */
export interface IExpenseResponse {
  id: string
  date: string
  category: string
  description: string
  incomeAmount: number
  expenseAmount: number
  balance: number
  caseId?: string
  memo?: string
  tags: ITag[]
  attachments: IAttachment[]
  createdAt: string
  updatedAt: string
  version: number
}

/**
 * Generic paginated response wrapper
 */
export interface IPagedResponse<T> {
  items: T[]
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

/**
 * Expense list query parameters
 */
export interface IExpenseListParams {
  offset?: number
  limit?: number
  startDate?: string
  endDate?: string
  caseId?: string
  category?: string
  tagIds?: string[]
  searchQuery?: string
  sortBy?: 'date' | 'category' | 'description' | 'balance'
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Request DTO for creating a new tag
 */
export interface ICreateTagRequest {
  name: string
  color: string
  scope?: TagScope
}

/**
 * Request DTO for updating an existing tag
 */
export interface IUpdateTagRequest {
  name?: string
  color?: string
  scope?: TagScope
}

/**
 * Tag list query parameters
 */
export interface ITagListParams {
  scope?: 'TENANT' | 'PERSONAL'
  search?: string
}

/**
 * Response DTO for file upload operations
 */
export interface IAttachmentResponse {
  id: string
  originalName: string
  fileSize: number
  mimeType: string
  status: AttachmentStatus
  uploadedAt: string
}

/**
 * Standard API error response
 */
export interface IApiErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp?: string
  requestId?: string
}

/**
 * Validation error details
 */
export interface IValidationErrorResponse extends IApiErrorResponse {
  fieldErrors: {
    field: string
    message: string
    code: string
  }[]
}

/**
 * Expense statistics response
 */
export interface IExpenseStatsResponse {
  period: {
    startDate: string
    endDate: string
  }
  summary: {
    totalIncome: number
    totalExpense: number
    netBalance: number
    transactionCount: number
  }
  categoryBreakdown: {
    category: string
    totalAmount: number
    transactionCount: number
    percentage: number
  }[]
  tagBreakdown: {
    tagId: string
    tagName: string
    tagColor: string
    totalAmount: number
    transactionCount: number
    percentage: number
  }[]
  monthlyTrend: {
    month: string
    income: number
    expense: number
    netBalance: number
  }[]
}

// ====================================
// Bulk Operations Types
// ====================================

/**
 * Bulk operation interface
 */
export interface IBulkExpenseOperation {
  operation: 'delete' | 'addTags' | 'removeTags' | 'updateCategory' | 'export'
  expenseIds: string[]
  payload?: {
    tagIds?: string[]
    category?: string
    exportFormat?: 'csv' | 'excel' | 'pdf'
  }
}

/**
 * Bulk operation request for multiple expenses
 */
export interface IBulkExpenseRequest {
  expenseIds: string[]
  operation: 'delete' | 'addTags' | 'removeTags' | 'updateCategory'
  parameters?: {
    tagIds?: string[]
    category?: string
  }
}

/**
 * Bulk operation response
 */
export interface IBulkExpenseResponse {
  successCount: number
  failureCount: number
  failures: {
    expenseId: string
    error: string
  }[]
}

// ====================================
// Import/Export Types
// ====================================

/**
 * CSV import request structure
 */
export interface ICsvImportRequest {
  fileId: string
  columnMapping: {
    date: string
    category: string
    description: string
    incomeAmount?: string
    expenseAmount?: string
    caseId?: string
    memo?: string
  }
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
  jobId: string
  totalRows: number
  successCount: number
  failureCount: number
  preview: IExpenseResponse[]
  errors: {
    row: number
    field: string
    error: string
  }[]
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

export interface IExpenseError {
  type: ExpenseErrorType
  message: string
  field?: string
  code?: string
  details?: Record<string, unknown>
}

// ====================================
// Generic API Types
// ====================================

/**
 * API response interfaces
 */
export interface IApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface IApiListResponse<T> extends IApiResponse<T[]> {
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// ====================================
// Type Guards
// ====================================

/**
 * Type guards for better type safety
 */
export const isExpenseWithRelations = (expense: IExpense | IExpenseWithRelations): expense is IExpenseWithRelations => {
  return 'tags' in expense || 'attachments' in expense || 'case' in expense
}

export const isApiError = (error: unknown): error is IExpenseError => {
  return typeof error === 'object' && error !== null && 'type' in error && 'message' in error
}

// ====================================
// Legacy Type Aliases (for backward compatibility)
// ====================================

export type ILoadingState = IExpenseLoadingState
export type IFormValidationResult = IExpenseFormValidationResult