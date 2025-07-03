/**
 * Currency Formatting Utilities
 * 
 * Provides locale-aware currency formatting for the Aster Management system.
 * Handles different currency types, decimal places, and locale preferences.
 */

import type { Currency, CurrencyFormatOptions } from '~/types/currency'
import { SUPPORTED_CURRENCIES } from '~/types/currency'

/**
 * Format a currency amount using locale-aware formatting
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: CurrencyFormatOptions = {}
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as keyof typeof SUPPORTED_CURRENCIES]
  
  if (!currency) {
    console.warn(`Unsupported currency code: ${currencyCode}`)
    return `${currencyCode} ${amount.toFixed(2)}`
  }

  const {
    locale = currency.locale,
    minimumFractionDigits = currency.decimals,
    maximumFractionDigits = currency.decimals,
    currencyDisplay = 'symbol',
    notation = 'standard',
    showSymbol = true
  } = options

  try {
    if (!showSymbol) {
      // Format without currency symbol
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
        notation: notation as Intl.NumberFormatOptions['notation']
      }).format(amount)
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits,
      maximumFractionDigits,
      currencyDisplay,
      notation: notation as Intl.NumberFormatOptions['notation']
    }).format(amount)
  } catch (error) {
    console.warn(`Currency formatting error for ${currencyCode}:`, error)
    return `${currency.symbol}${amount.toFixed(currency.decimals)}`
  }
}

/**
 * Format currency amount for compact display (e.g., "¥1.2M")
 */
export function formatCurrencyCompact(
  amount: number,
  currencyCode: string,
  locale?: string
): string {
  return formatCurrency(amount, currencyCode, {
    notation: 'compact',
    locale
  })
}

/**
 * Parse a formatted currency string back to a number
 */
export function parseCurrencyAmount(
  formattedAmount: string,
  currencyCode: string
): number | null {
  const currency = SUPPORTED_CURRENCIES[currencyCode as keyof typeof SUPPORTED_CURRENCIES]
  
  if (!currency) {
    return null
  }

  // Remove currency symbols and formatting
  const cleanAmount = formattedAmount
    .replace(new RegExp(`[${currency.symbol}$]`, 'g'), '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim()

  const parsed = parseFloat(cleanAmount)
  return isNaN(parsed) ? null : parsed
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as keyof typeof SUPPORTED_CURRENCIES]
  return currency?.symbol || currencyCode
}

/**
 * Get currency name for a given currency code
 */
export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as keyof typeof SUPPORTED_CURRENCIES]
  return currency?.name || currencyCode
}

/**
 * Get the number of decimal places for a currency
 */
export function getCurrencyDecimals(currencyCode: string): number {
  const currency = SUPPORTED_CURRENCIES[currencyCode as keyof typeof SUPPORTED_CURRENCIES]
  return currency?.decimals || 2
}

/**
 * Validate if a string is a valid currency amount for the given currency
 */
export function isValidCurrencyAmountString(
  amountString: string,
  currencyCode: string
): boolean {
  const parsed = parseCurrencyAmount(amountString, currencyCode)
  return parsed !== null && parsed >= 0
}

/**
 * Format currency amount for input field display
 */
export function formatCurrencyForInput(
  amount: number,
  currencyCode: string
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as keyof typeof SUPPORTED_CURRENCIES]
  
  if (!currency) {
    return amount.toString()
  }

  return amount.toFixed(currency.decimals)
}

/**
 * Predefined formatters for common scenarios
 */
export const currencyFormatters = {
  /**
   * Standard JPY formatting (no decimals)
   */
  jpyStandard: (amount: number) => formatCurrency(amount, 'JPY', {
    locale: 'ja-JP'
  }),

  /**
   * Standard USD formatting
   */
  usdStandard: (amount: number) => formatCurrency(amount, 'USD', {
    locale: 'en-US'
  }),

  /**
   * Standard EUR formatting
   */
  eurStandard: (amount: number) => formatCurrency(amount, 'EUR', {
    locale: 'de-DE'
  }),

  /**
   * Compact format for any currency
   */
  compact: (amount: number, currency: string) => formatCurrencyCompact(amount, currency),

  /**
   * Amount only (no symbol)
   */
  amountOnly: (amount: number, currency: string) => formatCurrency(amount, currency, {
    showSymbol: false
  }),

  /**
   * Japanese yen with traditional formatting
   */
  jpyTraditional: (amount: number) => {
    // For very large amounts, could add 万 (man) formatting in the future
    return formatCurrency(amount, 'JPY', {
      locale: 'ja-JP',
      notation: 'standard'
    })
  }
}

/**
 * Format currency range (e.g., "¥1,000 - ¥5,000")
 */
export function formatCurrencyRange(
  minAmount: number,
  maxAmount: number,
  currencyCode: string,
  options?: CurrencyFormatOptions
): string {
  const minFormatted = formatCurrency(minAmount, currencyCode, options)
  const maxFormatted = formatCurrency(maxAmount, currencyCode, options)
  
  return `${minFormatted} - ${maxFormatted}`
}

/**
 * Format currency with conditional precision
 * Shows fewer decimals for whole numbers when appropriate
 */
export function formatCurrencyAdaptive(
  amount: number,
  currencyCode: string,
  options: CurrencyFormatOptions = {}
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode as keyof typeof SUPPORTED_CURRENCIES]
  
  if (!currency) {
    return formatCurrency(amount, currencyCode, options)
  }

  // For whole numbers, show no decimals even if currency normally has them
  const isWholeNumber = amount === Math.floor(amount)
  const adaptiveOptions = {
    ...options,
    minimumFractionDigits: isWholeNumber ? 0 : currency.decimals,
    maximumFractionDigits: currency.decimals
  }

  return formatCurrency(amount, currencyCode, adaptiveOptions)
}

/**
 * Utility for displaying currency in tables and lists
 */
export function formatCurrencyForTable(
  amount: number,
  currencyCode: string
): string {
  // Use compact notation for large amounts in tables
  if (Math.abs(amount) >= 10000) {
    return formatCurrencyCompact(amount, currencyCode)
  }
  
  return formatCurrencyAdaptive(amount, currencyCode)
}