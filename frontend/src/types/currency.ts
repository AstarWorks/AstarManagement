/**
 * Currency Type Definitions
 * 
 * Provides comprehensive currency support types and interfaces for the Aster Management system.
 * This foundation supports future multi-currency expansion while maintaining type safety.
 */

export interface Currency {
  /** ISO 4217 currency code (e.g., 'JPY', 'USD', 'EUR') */
  code: string
  /** Currency symbol (e.g., '¥', '$', '€') */
  symbol: string
  /** Full currency name */
  name: string
  /** Number of decimal places for this currency */
  decimals: number
  /** Primary locale for this currency */
  locale: string
}

export interface CurrencyAmount {
  /** Monetary amount */
  amount: number
  /** Currency code */
  currency: string
}

export interface CurrencyConversion {
  /** Original amount and currency */
  from: CurrencyAmount
  /** Converted amount and currency */
  to: CurrencyAmount
  /** Exchange rate used for conversion */
  rate: number
  /** Date of the exchange rate */
  date: Date
  /** Source of the exchange rate */
  source: string
}

export interface CurrencyFormatOptions {
  /** Locale to use for formatting (defaults to currency's primary locale) */
  locale?: string
  /** Minimum number of fraction digits */
  minimumFractionDigits?: number
  /** Maximum number of fraction digits */
  maximumFractionDigits?: number
  /** How to display the currency ('symbol' | 'code' | 'name') */
  currencyDisplay?: 'symbol' | 'code' | 'name'
  /** Notation style ('standard' | 'compact') */
  notation?: 'standard' | 'compact'
  /** Whether to show the currency symbol */
  showSymbol?: boolean
}

export interface ExchangeRate {
  /** Base currency code */
  from: string
  /** Target currency code */
  to: string
  /** Exchange rate value */
  rate: number
  /** Date of the rate */
  date: Date
  /** Source of the rate (e.g., 'BOJ', 'ECB', 'manual') */
  source: string
  /** Whether this rate is currently active */
  isActive: boolean
}

export interface CurrencySettings {
  /** Default base currency for the organization */
  baseCurrency: string
  /** List of currencies available for selection */
  availableCurrencies: string[]
  /** Whether to show currency conversion hints */
  showConversions: boolean
  /** Preferred locale for formatting */
  preferredLocale: string
}

// Predefined currency configurations
export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0,
    locale: 'ja-JP'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    locale: 'en-US'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    locale: 'de-DE'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    locale: 'en-GB'
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    decimals: 0,
    locale: 'ko-KR'
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimals: 2,
    locale: 'zh-CN'
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimals: 2,
    locale: 'en-SG'
  }
} as const

// Currency groupings for UI organization
export const CURRENCY_GROUPS = [
  {
    label: 'Common Currencies',
    currencies: ['JPY', 'USD', 'EUR', 'GBP']
  },
  {
    label: 'Asian Currencies', 
    currencies: ['KRW', 'CNY', 'SGD']
  }
] as const

// Default currency settings for Japanese legal practice
export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  baseCurrency: 'JPY',
  availableCurrencies: ['JPY', 'USD', 'EUR'],
  showConversions: false, // Disabled for MVP, enabled in S15
  preferredLocale: 'ja-JP'
}

// Type guards for runtime validation
export function isCurrencyCode(code: string): code is keyof typeof SUPPORTED_CURRENCIES {
  return code in SUPPORTED_CURRENCIES
}

export function isValidCurrencyAmount(amount: unknown): amount is CurrencyAmount {
  return (
    typeof amount === 'object' &&
    amount !== null &&
    'amount' in amount &&
    'currency' in amount &&
    typeof (amount as CurrencyAmount).amount === 'number' &&
    typeof (amount as CurrencyAmount).currency === 'string' &&
    isCurrencyCode((amount as CurrencyAmount).currency)
  )
}

// Utility types for form handling
export type CurrencyFormValue = {
  amount: string | number
  currency: string
}

export type CurrencyInputProps = {
  modelValue?: CurrencyFormValue
  placeholder?: string
  disabled?: boolean
  required?: boolean
  showConversion?: boolean
  baseCurrency?: string
  availableCurrencies?: string[]
}

// Events for currency components
export interface CurrencyChangeEvent {
  amount: number
  currency: string
  formatted: string
}

export interface CurrencyValidationError {
  field: 'amount' | 'currency'
  message: string
  code: string
}