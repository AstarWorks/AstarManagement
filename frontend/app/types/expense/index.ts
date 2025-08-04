/**
 * Expense Types - Centralized exports
 * 
 * This file provides centralized access to all expense-related types
 * for the Astar Management expense management system.
 */

// Core expense domain types
export type {
  Expense,
  ExpenseFilter,
  ExpenseList,
  ExpenseFormData,
  ExpenseStats,
  ExpenseCategory,
  ExpenseSummary
} from './expense'

// Tag types
export type {
  Tag,
  CreateTagRequest,
  UpdateTagRequest,
  TagWithStats,
  TagFilter,
  TagColor
} from './tag'

export {
  TagScope,
  TAG_COLORS
} from './tag'

// Attachment types
export type {
  Attachment,
  AttachmentResponse,
  UploadProgress,
  FileTypeRule,
  AttachmentFilter
} from './attachment'

export {
  AttachmentStatus,
  SUPPORTED_FILE_TYPES,
  FILE_SIZE
} from './attachment'

// API types
export type {
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseResponse,
  PagedResponse,
  ExpenseListParams,
  TagListParams,
  ApiErrorResponse,
  ValidationErrorResponse,
  ExpenseStatsResponse,
  BulkExpenseRequest,
  BulkExpenseResponse,
  CsvImportRequest,
  CsvImportResponse
} from './api'