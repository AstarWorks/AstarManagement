# Expense Types Migration Analysis

## Types to Migrate from Monolithic File

### Core Expense Types (to expense.ts):
- IExpense - Main expense entity interface
- IExpenseWithRelations - Expense with populated relations  
- IExpenseWithBalance - Extended expense with computed fields
- IExpenseCase - Case reference type

### Form and UI Types (to expense.ts):
- IExpenseFieldChangeEvent - Form field change event
- IExpenseFormFieldsProps - Form props interface
- IExpenseFormFieldsEmits - Form emits interface
- IExpenseFormValidationResult - Validation result

### State Management Types (to expense.ts):
- IExpenseLoadingState - Loading state interface
- IExpenseListState - List state with pagination

### Statistics Types (to expense.ts):
- IExpenseStatistics - Detailed statistics interface

### Error Types (to expense.ts):
- ExpenseErrorType - Error type enumeration
- IExpenseError - Error interface

### Bulk Operations (to api.ts):
- IBulkExpenseOperation - Bulk operation interface (different from IBulkExpenseRequest)

### Generic API Types (to api.ts):
- IApiResponse<T> - Generic API response wrapper
- IApiListResponse<T> - List API response with pagination

### Type Guards (to expense.ts):
- isExpenseWithRelations - Type guard function
- isApiError - Type guard function

## Duplicates to Merge:
- IExpenseFilters + IExpenseFilter → IExpenseFilters (comprehensive)
- Keep modular enum definitions (TagScope, AttachmentStatus)
- Remove backward compatibility aliases

## Already Properly Organized:
- Tag types in tag.ts
- Attachment types in attachment.ts  
- API types in api.ts