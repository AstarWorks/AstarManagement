/**
 * Expense formatters composable
 * Provides currency and date formatting utilities following Simple over Easy principle
 */

// Category mapping for consistent key usage
const CATEGORY_KEY_MAP: Record<string, string> = {
  '交通費': 'transportation',
  '印紙代': 'stampFees',
  'コピー代': 'copyFees',
  '郵送料': 'postage',
  'その他': 'other'
}

export function useExpenseFormatters() {
  /**
   * Format currency amount in Japanese Yen
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Format date for display in Japanese locale
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    })
  }

  /**
   * Format date with full year for detailed display
   */
  const formatDateLong = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Get balance styling class based on amount
   */
  const getBalanceClass = (balance: number): string => {
    if (balance > 0) return 'text-green-600'
    if (balance < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  /**
   * Get category indicator CSS class for visual distinction
   */
  const getCategoryIndicatorClass = (category: string): string => {
    const categoryClasses: Record<string, string> = {
      'transportation': 'bg-blue-500 border-blue-500',
      'stampFees': 'bg-red-500 border-red-500',
      'copyFees': 'bg-green-500 border-green-500',
      'postage': 'bg-yellow-500 border-yellow-500',
      'other': 'bg-purple-500 border-purple-500'
    }
    
    const categoryKey = CATEGORY_KEY_MAP[category] || 'other'
    return categoryClasses[categoryKey] || 'bg-gray-500 border-gray-500'
  }

  /**
   * Format number for summary display
   */
  const formatNumber = (value: number): string => {
    return value.toLocaleString('ja-JP')
  }

  /**
   * Get category badge CSS class for styled display
   */
  const getCategoryBadgeClass = (category: string): string => {
    const categoryClasses: Record<string, string> = {
      'transportation': 'bg-blue-100 text-blue-800 border-blue-200',
      'stampFees': 'bg-red-100 text-red-800 border-red-200',
      'copyFees': 'bg-green-100 text-green-800 border-green-200',
      'postage': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'other': 'bg-purple-100 text-purple-800 border-purple-200'
    }
    
    const categoryKey = CATEGORY_KEY_MAP[category] || 'other'
    return categoryClasses[categoryKey] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return {
    formatCurrency,
    formatDate,
    formatDateLong,
    formatNumber,
    getBalanceClass,
    getCategoryIndicatorClass,
    getCategoryBadgeClass
  }
}