/**
 * Expense Validation Schemas
 * 
 * @description Zod schemas for expense form validation with mobile-optimized
 * error handling and type-safe validation rules.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T08_S14 - Mobile Optimization for Financial Features
 */

import { z } from 'zod'

// Supported expense types
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
])

// Supported currencies
export const currencySchema = z.enum(['JPY', 'USD', 'EUR', 'GBP', 'KRW', 'CNY', 'SGD']).default('JPY')

// Approval status
export const approvalStatusSchema = z.enum([
  'DRAFT',
  'PENDING', 
  'APPROVED',
  'REJECTED'
])

// File validation for receipts
export const receiptFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 10 * 1024 * 1024, {
    message: 'Receipt file must be less than 10MB'
  })
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type),
    {
      message: 'Receipt must be an image (JPEG, PNG, WebP) or PDF file'
    }
  )
  .optional()

// Core expense creation schema
export const expenseCreateSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number'
    })
    .positive('Amount must be greater than zero')
    .max(1000000, 'Amount cannot exceed ¥1,000,000')
    .multipleOf(0.01, 'Amount can only have up to 2 decimal places'),
    
  currency: currencySchema,
  
  description: z
    .string({
      required_error: 'Description is required'
    })
    .min(1, 'Description cannot be empty')
    .max(255, 'Description must be less than 255 characters')
    .trim(),
    
  expenseDate: z
    .string({
      required_error: 'Expense date is required'
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const expenseDate = new Date(date)
      const today = new Date()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(today.getFullYear() - 1)
      
      return expenseDate <= today && expenseDate >= oneYearAgo
    }, {
      message: 'Expense date must be within the last year and not in the future'
    })
    .transform((date) => new Date(date)),
    
  expenseType: expenseTypeSchema,
  
  billable: z
    .boolean()
    .default(true),
    
  matterId: z
    .string()
    .uuid('Invalid matter ID format')
    .optional(),
    
  receiptFile: receiptFileSchema,
  
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .transform((val) => val?.trim() || undefined)
})

// Type inference from schemas
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>
export type ExpenseCreateForm = ExpenseCreateInput // Alias for compatibility

// Validation helper functions
export const validateExpenseAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000 && Number.isFinite(amount)
}

export const validateExpenseDate = (date: string): boolean => {
  const expenseDate = new Date(date)
  const today = new Date()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)
  
  return expenseDate <= today && expenseDate >= oneYearAgo && !isNaN(expenseDate.getTime())
}

// Form validation helpers for mobile
export const mobileValidationMessages = {
  amount: {
    required: 'Amount required',
    positive: 'Must be greater than 0',
    tooLarge: 'Amount too large'
  },
  description: {
    required: 'Description required',
    tooLong: 'Keep description brief'
  },
  date: {
    required: 'Date required',
    invalid: 'Invalid date',
    future: 'Cannot be future date',
    tooOld: 'Date too old'
  },
  category: {
    required: 'Select category'
  },
  receipt: {
    tooLarge: 'Image too large (max 10MB)',
    invalidType: 'Use JPG, PNG, or PDF'
  }
} as const