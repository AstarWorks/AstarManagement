import { z } from 'zod'
import { createI18nValidation } from '~/utils/validationHelpers'

/**
 * 経費フォームのバリデーションスキーマ
 * Expense form validation schema with i18n support
 * Follows established patterns from auth.ts
 */
export const createExpenseSchema = (t: (key: string, params?: Record<string, string | number>) => string) => {
  const _validation = createI18nValidation(t)
  
  return z.object({
    // Step 1: Basic Information
    date: z
      .string()
      .min(1, t('expense.form.validation.required', { field: t('expense.form.fields.date') }))
      .refine((date) => {
        const expenseDate = new Date(date)
        const today = new Date()
        today.setHours(23, 59, 59, 999) // End of today
        return expenseDate <= today
      }, {
        message: t('expense.form.validation.futureDate'),
      }),
    
    category: z
      .string()
      .min(1, t('expense.form.validation.required', { field: t('expense.form.fields.category') }))
      .max(50, t('expense.form.validation.invalidCategory')),
    
    description: z
      .string()
      .min(1, t('expense.form.validation.required', { field: t('expense.form.fields.description') }))
      .max(500, t('expense.form.validation.invalidDescription')),
    
    // Step 2: Amount Information  
    incomeAmount: z
      .number()
      .min(0, t('expense.form.validation.minAmount'))
      .max(999999999, t('expense.form.validation.maxAmount')),
    
    expenseAmount: z
      .number()
      .min(0, t('expense.form.validation.minAmount'))
      .max(999999999, t('expense.form.validation.maxAmount')),
    
    // Step 3: Additional Information
    caseId: z.string().optional(),
    memo: z.string().max(1000, t('expense.form.validation.maxMemo')).optional(),
    tagIds: z.array(z.string()).default([]),
    attachmentIds: z.array(z.string()).default([])
  }).refine((data) => data.incomeAmount > 0 || data.expenseAmount > 0, {
    message: t('expense.form.validation.amountRequired'),
    path: ['incomeAmount'],
  })
}

/**
 * 経費編集フォームのバリデーションスキーマ
 * Expense edit form validation schema (same as create for now)
 */
export const createExpenseEditSchema = createExpenseSchema

// TypeScript型定義のエクスポート
export type ExpenseFormData = z.infer<ReturnType<typeof createExpenseSchema>>
export type ExpenseEditFormData = z.infer<ReturnType<typeof createExpenseEditSchema>>