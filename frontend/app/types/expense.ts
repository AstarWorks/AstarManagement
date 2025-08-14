/**
 * Expense domain types with explicit state modeling
 * Following "Simple over Easy" principle with clear type definitions
 */

import type { ExpenseFormData } from '~/schemas/expense'

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
  tags?: IExpenseTag[]
  attachments?: IExpenseAttachment[]
  case?: IExpenseCase
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

/**
 * Expense tag interface (re-export for consistency)
 */
export interface IExpenseTag {
  id: string
  name: string
  color: string
  scope: 'global' | 'personal' | 'office'
  createdAt?: string
  updatedAt?: string
}

/**
 * Expense attachment interface (re-export for consistency)
 */
export interface IExpenseAttachment {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  url?: string
  uploadedAt: string
  uploadedBy?: string
}

/**
 * Expense category interface (re-export for consistency)
 */
export interface IExpenseCategory {
  value: string
  labelKey: string
  color?: string
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
 * Loading state interface for async operations (expense-specific)
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
  // Search
  searchTerm?: string
  searchQuery?: string
  // Pagination
  offset?: number
  limit?: number
  // Sorting
  sortBy?: keyof IExpense
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Expense sort options
 */
export interface IExpenseSortOptions {
  field: keyof IExpense
  order: 'asc' | 'desc'
}

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
 * Expense form validation result interface
 */
export interface IExpenseFormValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings?: Record<string, string>
}

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

/**
 * Type guards for better type safety
 */
export const isExpenseWithRelations = (expense: IExpense | IExpenseWithRelations): expense is IExpenseWithRelations => {
  return 'tags' in expense || 'attachments' in expense || 'case' in expense
}

export const isApiError = (error: unknown): error is IExpenseError => {
  return typeof error === 'object' && error !== null && 'type' in error && 'message' in error
}

// Legacy type aliases for backward compatibility
export type IExpenseFormData = ExpenseFormData
export type IExpenseList = IExpenseListState
export type ITag = IExpenseTag
export type IAttachment = IExpenseAttachment
export const TagScope = {
  GLOBAL: 'global',
  PERSONAL: 'personal', 
  OFFICE: 'office',
  TENANT: 'office' // TENANT maps to office for backward compatibility
} as const

export type TagScope = IExpenseTag['scope']
export const AttachmentStatus = {
  UPLOADED: 'uploaded',
  UPLOADING: 'uploading', 
  FAILED: 'failed',
  LINKED: 'uploaded' // LINKED maps to uploaded for backward compatibility
} as const

export type AttachmentStatus = 'uploaded' | 'uploading' | 'failed'
export type ILoadingState = IExpenseLoadingState
export type IFormValidationResult = IExpenseFormValidationResult

// Additional missing types with proper definitions
export type ICreateExpenseRequest = Omit<IExpense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'tenantId'>
export type IUpdateExpenseRequest = Partial<Omit<IExpense, 'id' | 'createdAt' | 'createdBy' | 'tenantId'>>
export type IExpenseStatsResponse = IExpenseStatistics
export type IExpenseSummary = IExpenseStatistics

// Extended expense interface with computed fields for backward compatibility
export interface IExpenseWithBalance extends IExpense {
  balance: number
  tags?: IExpenseTag[]
  attachments?: IExpenseAttachment[]
  updatedBy?: string
  version?: number
}