/**
 * Currency formatting utilities
 * Handles Japanese Yen formatting with proper localization
 */

export const formatCurrency = (amount: number, locale = 'ja-JP'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatAmount = (amount: number): string => {
  if (amount === 0) return '¥0'
  return amount > 0 ? `+${formatCurrency(amount)}` : formatCurrency(amount)
}

/**
 * Format amount with locale-specific formatting
 */
export const formatAmountWithLocale = (amount: number, locale: string): string => {
  if (locale === 'en') {
    // For English locale, format as JPY but with English formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  return formatCurrency(amount, 'ja-JP')
}

/**
 * Parse currency string back to number
 */
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[¥,\s+]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Format large numbers with appropriate units (千, 万, etc.)
 */
export const formatLargeAmount = (amount: number, locale = 'ja-JP'): string => {
  if (locale === 'ja-JP') {
    if (amount >= 100000000) { // 1億
      return `${(amount / 100000000).toFixed(1) }億円`
    } else if (amount >= 10000) { // 1万
      return `${(amount / 10000).toFixed(1)}万円`
    } else if (amount >= 1000) { // 1千
      return `${(amount / 1000).toFixed(1)}千円`
    }
  }
  return formatCurrency(amount, locale)
}