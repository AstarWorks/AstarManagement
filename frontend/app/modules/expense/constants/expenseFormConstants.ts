/**
 * Expense Form Constants
 * Contains constants for expense form components and validation
 */

/**
 * Amount validation limits
 */
export const AMOUNT_LIMITS = {
  MIN: 0,
  MAX: 999999999
} as const

/**
 * Amount type definitions
 */
export type AmountType = 'expense' | 'income'

/**
 * Amount preset interface
 */
export interface IAmountPreset {
  readonly value: number
  readonly label: string
}

/**
 * Common amount presets for Japanese legal practice
 * Based on typical expense amounts in legal offices
 */
export const AMOUNT_PRESETS: readonly IAmountPreset[] = [
  { value: 100, label: '100' },
  { value: 200, label: '200' },
  { value: 500, label: '500' },
  { value: 1000, label: '1,000' },
  { value: 2000, label: '2,000' },
  { value: 5000, label: '5,000' },
  { value: 10000, label: '10,000' },
  { value: 20000, label: '20,000' }
] as const

/**
 * Currency configuration
 */
export const CURRENCY_CONFIG = {
  LOCALE: 'ja-JP',
  CURRENCY: 'JPY',
  SYMBOL: '¥'
} as const

/**
 * Input field configuration
 */
export const INPUT_CONFIG = {
  STEP: '1',
  TYPE: 'number'
} as const

/**
 * Balance calculation types
 */
export type BalanceType = 'positive' | 'negative' | 'zero'

/**
 * Balance calculation helper
 */
export const BALANCE_HELPERS = {
  getBalanceType: (balance: number): BalanceType => {
    if (balance > 0) return 'positive'
    if (balance < 0) return 'negative'
    return 'zero'
  },
  getBalanceColorClass: (balance: number): string => {
    if (balance > 0) return 'text-green-600'
    if (balance < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }
} as const

/**
 * Grid configuration for layout consistency
 */
export const GRID_CONFIG = {
  PRESETS: 'grid-cols-3 md:grid-cols-6',
  FIELDS: 'grid-cols-1 md:grid-cols-2'
} as const