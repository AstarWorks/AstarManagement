/**
 * Expense Form Step Constants
 * Provides type-safe constants for expense form step management
 */

/**
 * Step identifiers enum
 */
export enum ExpenseFormStepId {
  BASIC = 'basic',
  AMOUNT = 'amount',
  ADDITIONAL = 'additional'
}

/**
 * Step indices enum for type-safe step navigation
 */
export enum ExpenseFormStepIndex {
  BASIC = 0,
  AMOUNT = 1,
  ADDITIONAL = 2
}

/**
 * Step configuration type
 */
export interface IExpenseFormStepConfig {
  readonly id: ExpenseFormStepId
  readonly index: ExpenseFormStepIndex
  readonly label: string
  readonly required: boolean
  readonly description?: string
}

/**
 * Complete step configuration
 */
export const EXPENSE_FORM_STEPS: readonly IExpenseFormStepConfig[] = [
  {
    id: ExpenseFormStepId.BASIC,
    index: ExpenseFormStepIndex.BASIC,
    label: 'expense.form.steps.basic',
    required: true,
    description: 'expense.form.steps.basicDescription'
  },
  {
    id: ExpenseFormStepId.AMOUNT,
    index: ExpenseFormStepIndex.AMOUNT,
    label: 'expense.form.steps.amount',
    required: true,
    description: 'expense.form.steps.amountDescription'
  },
  {
    id: ExpenseFormStepId.ADDITIONAL,
    index: ExpenseFormStepIndex.ADDITIONAL,
    label: 'expense.form.steps.additional',
    required: false,
    description: 'expense.form.steps.additionalDescription'
  }
] as const

/**
 * Step navigation constants
 */
export const STEP_NAVIGATION = {
  FIRST_STEP: ExpenseFormStepIndex.BASIC,
  LAST_STEP: ExpenseFormStepIndex.ADDITIONAL,
  TOTAL_STEPS: EXPENSE_FORM_STEPS.length
} as const

/**
 * Step validation helpers
 */
export const STEP_HELPERS = {
  isFirstStep: (step: number): boolean => step === STEP_NAVIGATION.FIRST_STEP,
  isLastStep: (step: number): boolean => step === STEP_NAVIGATION.LAST_STEP,
  isValidStepIndex: (step: number): boolean => step >= 0 && step < STEP_NAVIGATION.TOTAL_STEPS,
  getStepById: (id: ExpenseFormStepId): IExpenseFormStepConfig | undefined => 
    EXPENSE_FORM_STEPS.find(step => step.id === id),
  getStepByIndex: (index: number): IExpenseFormStepConfig | undefined =>
    EXPENSE_FORM_STEPS.find(step => step.index === index),
  getNextStepIndex: (current: number): number | null =>
    current < STEP_NAVIGATION.LAST_STEP ? current + 1 : null,
  getPreviousStepIndex: (current: number): number | null =>
    current > STEP_NAVIGATION.FIRST_STEP ? current - 1 : null
} as const

/**
 * Export types for better type safety
 */
export type ExpenseFormStepMap = typeof EXPENSE_FORM_STEPS
export type ExpenseFormStepHelpers = typeof STEP_HELPERS