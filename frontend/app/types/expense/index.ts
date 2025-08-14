/**
 * Expense Types - Centralized exports
 * 
 * This file provides centralized access to all expense-related types
 * for the Astar Management expense management system.
 */

// Core expense domain types from main expense.ts
export type {
  IExpense,
  IExpenseWithRelations,
  IExpenseCase,
  IExpenseTag,
  IExpenseAttachment,
  IExpenseFilters
} from '../expense'

// Additional expense domain types from ./expense
export type {
  IExpenseFilter,
  IExpenseList,
  IExpenseFormData,
  IExpenseStats,
  IExpenseCategory,
  IExpenseSummary
} from './expense'

// Tag types
export type {
  ITag,
  ICreateTagRequest,
  IUpdateTagRequest,
  ITagWithStats,
  ITagFilter,
  TagColor
} from './tag'

export {
  TagScope,
  TAG_COLORS
} from './tag'

// Attachment types
export type {
  IAttachment,
  IAttachmentResponse,
  IUploadProgress,
  IFileTypeRule,
  IAttachmentFilter
} from './attachment'

export {
  AttachmentStatus,
  SUPPORTED_FILE_TYPES,
  FILE_SIZE
} from './attachment'

// API types
export type {
  ICreateExpenseRequest,
  IUpdateExpenseRequest,
  IExpenseResponse,
  IPagedResponse,
  IExpenseListParams,
  ITagListParams,
  IApiErrorResponse,
  IValidationErrorResponse,
  IExpenseStatsResponse,
  IBulkExpenseRequest,
  IBulkExpenseResponse,
  ICsvImportRequest,
  ICsvImportResponse
} from './api'