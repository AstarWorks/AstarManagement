/**
 * Expense Validation Schemas
 * 
 * @description Comprehensive Zod validation schemas for expense management,
 * including creation, update, approval, and filtering validation.
 * Integrates with VeeValidate for form validation.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T01_S14 + T07_S14 - Expense Entry Form + Approval Workflow
 */

import { z } from 'zod'
import type { ExpenseType, ApprovalStatus, Currency } from '~/types/expense'

// Base Validation Schemas
export const expenseTypeSchema = z.enum([
  'TRAVEL',
  'MEALS',
  'ACCOMMODATION', 
  'COURT_FEES',
  'FILING_FEES',
  'COPYING',
  'POSTAGE',
  'TELEPHONE',
  'RESEARCH',
  'EXPERT_WITNESS',
  'OTHER'
] as const)

export const approvalStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED', 
  'REIMBURSED'
] as const)

export const currencySchema = z.enum([
  'JPY',
  'USD',
  'EUR',
  'GBP',
  'KRW',
  'CNY',
  'SGD'
] as const).default('JPY')

// Amount validation with Japanese business rules
export const amountSchema = z.number()
  .min(0.01, 'Amount must be greater than 0')
  .max(1000000, 'Amount cannot exceed ¥1,000,000')
  .refine(
    (val) => Number.isFinite(val) && val >= 0,
    'Amount must be a valid positive number'
  )
  .transform((val) => Math.round(val * 100) / 100) // Round to 2 decimal places

// Date validation
export const expenseDateSchema = z.date()
  .max(new Date(), 'Expense date cannot be in the future')
  .min(
    new Date(new Date().getFullYear() - 2, 0, 1),
    'Expense date cannot be more than 2 years old'
  )

// Description validation
export const descriptionSchema = z.string()
  .min(3, 'Description must be at least 3 characters')
  .max(500, 'Description cannot exceed 500 characters')
  .regex(
    /^[a-zA-Z0-9\s\-.,!?()[\]{}:;'"/@#¥$%&*+=<>|\\~`_]+$/,
    'Description contains invalid characters'
  )

// Notes validation (optional)
export const notesSchema = z.string()
  .max(1000, 'Notes cannot exceed 1000 characters')
  .optional()
  .or(z.literal(''))

// Matter ID validation (optional)
export const matterIdSchema = z.string()
  .uuid('Invalid matter ID format')
  .optional()
  .or(z.literal(''))

// File validation for receipt uploads
export const receiptFileSchema = z.instanceof(File)
  .refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB limit
    'Receipt file must be smaller than 10MB'
  )
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type),
    'Receipt must be a valid image (JPEG, PNG, WebP) or PDF file'
  )
  .optional()

// Core Expense Creation Schema
export const expenseCreateSchema = z.object({
  matterId: matterIdSchema,
  description: descriptionSchema,
  amount: amountSchema,
  currency: currencySchema,
  expenseDate: expenseDateSchema,
  expenseType: expenseTypeSchema,
  billable: z.boolean().default(true),
  notes: notesSchema,
  receiptFile: receiptFileSchema
}).refine(
  (data) => {
    // Business rule: High-value expenses require receipt
    if (data.amount > 20000 && !data.receiptFile) {
      return false
    }
    return true
  },
  {
    message: 'Receipt is required for expenses over ¥20,000',
    path: ['receiptFile']
  }
).refine(
  (data) => {
    // Business rule: Court and filing fees always require receipt
    const receiptRequiredTypes: ExpenseType[] = ['COURT_FEES', 'FILING_FEES', 'EXPERT_WITNESS']
    if (receiptRequiredTypes.includes(data.expenseType) && !data.receiptFile) {
      return false
    }
    return true
  },
  {
    message: 'Receipt is required for this expense type',
    path: ['receiptFile']
  }
)

// Expense Update Schema (partial fields allowed)
export const expenseUpdateSchema = expenseCreateSchema.partial().extend({
  id: z.string().uuid('Invalid expense ID')
})

// Approval Decision Schema
export const approvalDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string()
    .min(1, 'Reason is required')
    .max(500, 'Reason cannot exceed 500 characters')
    .optional()
}).refine(
  (data) => {
    // Rejection always requires reason
    if (data.decision === 'REJECTED' && !data.reason) {
      return false
    }
    return true
  },
  {
    message: 'Reason is required when rejecting an expense',
    path: ['reason']
  }
)

// Bulk Approval Schema
export const bulkApprovalSchema = z.object({
  expenseIds: z.array(z.string().uuid())
    .min(1, 'At least one expense must be selected')
    .max(50, 'Cannot approve more than 50 expenses at once'),
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional()
}).refine(
  (data) => {
    // Bulk rejection requires reason
    if (data.decision === 'REJECTED' && !data.reason) {
      return false
    }
    return true
  },
  {
    message: 'Reason is required when rejecting expenses',
    path: ['reason']
  }
)

// Filtering Schemas
export const expenseFiltersSchema = z.object({
  status: z.array(approvalStatusSchema).optional(),
  expenseType: z.array(expenseTypeSchema).optional(),
  billable: z.boolean().optional(),
  billed: z.boolean().optional(),
  matterId: z.string().uuid().optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }).refine(
    (data) => data.start <= data.end,
    'Start date must be before end date'
  ).optional(),
  amountRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).refine(
    (data) => data.min <= data.max,
    'Minimum amount must be less than maximum amount'
  ).optional(),
  searchQuery: z.string()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional()
})

// Approval Queue Filters Schema
export const approvalQueueFiltersSchema = z.object({
  status: z.array(approvalStatusSchema).optional(),
  expenseType: z.array(expenseTypeSchema).optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }).optional(),
  amountRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).optional(),
  matterId: z.string().uuid().optional(),
  submitterId: z.string().uuid().optional(),
  priority: z.array(z.enum(['low', 'medium', 'high'])).optional()
})

// List Parameters Schema
export const expenseListParamsSchema = expenseFiltersSchema.extend({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum([
    'createdAt',
    'expenseDate', 
    'amount',
    'description',
    'expenseType',
    'approvalStatus'
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Form-specific schemas for different contexts
export const quickExpenseSchema = expenseCreateSchema.pick({
  description: true,
  amount: true,
  expenseType: true,
  billable: true
}).extend({
  expenseDate: z.date().default(() => new Date()),
  currency: currencySchema
})

export const expenseWithReceiptSchema = expenseCreateSchema.extend({
  receiptFile: receiptFileSchema.refine(
    (file) => file !== undefined,
    'Receipt is required'
  )
})

// Advanced validation for role-based constraints
export const createExpenseValidationSchema = (userRole: 'LAWYER' | 'CLERK' | 'CLIENT') => {
  let schema = expenseCreateSchema
  
  if (userRole === 'CLERK') {
    // Clerks have amount limitations
    schema = schema.refine(
      (data) => data.amount <= 10000,
      {
        message: 'Clerks cannot create expenses over ¥10,000',
        path: ['amount']
      }
    )
  }
  
  if (userRole === 'CLIENT') {
    // Clients cannot create expenses (read-only)
    throw new Error('Clients cannot create expenses')
  }
  
  return schema
}

// Type exports for form handling
export type ExpenseCreateForm = z.infer<typeof expenseCreateSchema>
export type ExpenseUpdateForm = z.infer<typeof expenseUpdateSchema>
export type ApprovalDecisionForm = z.infer<typeof approvalDecisionSchema>
export type BulkApprovalForm = z.infer<typeof bulkApprovalSchema>
export type ExpenseFiltersForm = z.infer<typeof expenseFiltersSchema>
export type QuickExpenseForm = z.infer<typeof quickExpenseSchema>

// Validation helper functions
export function validateExpenseAmount(amount: number, currency: Currency): boolean {
  const limits = {
    JPY: 1000000,
    USD: 10000,
    EUR: 8000,
    GBP: 7000,
    KRW: 12000000,
    CNY: 65000,
    SGD: 13000
  }
  
  return amount > 0 && amount <= (limits[currency] || limits.JPY)
}

export function validateReceiptRequirement(
  expenseType: ExpenseType,
  amount: number,
  hasReceipt: boolean
): { required: boolean; message?: string } {
  const alwaysRequireReceipt: ExpenseType[] = [
    'COURT_FEES',
    'FILING_FEES', 
    'EXPERT_WITNESS',
    'ACCOMMODATION',
    'RESEARCH'
  ]
  
  // Always required for certain types
  if (alwaysRequireReceipt.includes(expenseType)) {
    return {
      required: true,
      message: hasReceipt ? undefined : 'Receipt is required for this expense type'
    }
  }
  
  // Required for high-value expenses
  if (amount > 20000) {
    return {
      required: true,
      message: hasReceipt ? undefined : 'Receipt is required for expenses over ¥20,000'
    }
  }
  
  return { required: false }
}

// Default values for forms
export const defaultExpenseValues: Partial<ExpenseCreateForm> = {
  currency: 'JPY',
  billable: true,
  expenseDate: new Date(),
  description: '',
  amount: 0,
  notes: ''
}

// Export commonly used schemas
export {
  expenseCreateSchema,
  expenseUpdateSchema,
  approvalDecisionSchema,
  bulkApprovalSchema,
  expenseFiltersSchema,
  approvalQueueFiltersSchema,
  expenseListParamsSchema
}