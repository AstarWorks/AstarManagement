/**
 * Expense Types - Centralized exports
 * 
 * This file provides centralized access to all expense-related types
 * for the Astar Management expense management system.
 */

// ====================================
// Core Expense Types
// ====================================

export type {
  IExpense,
  IExpenseWithRelations,
  IExpenseWithBalance,
  IExpenseCase,
  IExpenseFilters,
  IExpenseSortOptions,
  IExpenseList,
  IExpenseFormData,
  IExpenseFieldChangeEvent,
  IExpenseFormFieldsProps,
  IExpenseFormFieldsEmits,
  IExpenseFormValidationResult,
  IExpenseLoadingState,
  IExpenseListState,
  IExpenseStats,
  IExpenseCategory,
  IExpenseSummary,
  IExpenseStatistics,
  ExpenseErrorType,
  IExpenseError
} from './expense'

// Export type guards
export {
  isExpenseWithRelations,
  isApiError
} from './expense'

// ====================================
// Tag Types
// ====================================

export type {
  ITag,
  ICreateTagRequest,
  IUpdateTagRequest,
  ITagWithStats,
  ITagFilter,
  TagColor,
  TagScopeType
} from './tag'

export {
  TagScope,
  TAG_COLORS
} from './tag'

// ====================================
// Attachment Types
// ====================================

export type {
  IAttachment,
  IAttachmentResponse,
  IUploadProgress,
  IFileTypeRule,
  IAttachmentFilter,
  AttachmentStatusType
} from './attachment'

export {
  AttachmentStatus,
  SUPPORTED_FILE_TYPES,
  FILE_SIZE
} from './attachment'

// ====================================
// API Types
// ====================================

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
  IBulkExpenseOperation,
  ICsvImportRequest,
  ICsvImportResponse,
  IApiResponse,
  IApiListResponse
} from './api'

// ====================================
// Backward Compatibility Notes
// ====================================

// The following type names are already exported above and can be used directly:
// - IExpenseFilters (previously IExpenseFilter)
// - ITag (previously IExpenseTag)
// - IAttachment (previously IExpenseAttachment)
// - IExpenseLoadingState (previously ILoadingState)
// - IExpenseFormValidationResult (previously IFormValidationResult)