import { format, formatRelative, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'

// Get user's locale preference (would come from user settings or browser)
const getUserLocale = () => {
  // This would be replaced with actual user preference logic
  const browserLang = typeof window !== 'undefined' ? navigator.language : 'en-US'
  return browserLang.startsWith('ja') ? 'ja' : 'en'
}

const getDateLocale = () => {
  const locale = getUserLocale()
  return locale === 'ja' ? ja : enUS
}

/**
 * Format a date string or Date object to a localized date string
 */
export const formatDate = (date: string | Date | null | undefined, formatStr = 'PP'): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    
    return format(dateObj, formatStr, { locale: getDateLocale() })
  } catch (error) {
    console.error('Date formatting error:', error)
    return ''
  }
}

/**
 * Format a date to show relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    
    return formatDistanceToNow(dateObj, { 
      addSuffix: true,
      locale: getDateLocale() 
    })
  } catch (error) {
    console.error('Relative time formatting error:', error)
    return ''
  }
}

/**
 * Format a date relative to now with more context
 */
export const formatRelativeDate = (date: string | Date | null | undefined): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    
    return formatRelative(dateObj, new Date(), { locale: getDateLocale() })
  } catch (error) {
    console.error('Relative date formatting error:', error)
    return ''
  }
}

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'PPp')
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    
    return format(dateObj, 'yyyy-MM-dd')
  } catch (error) {
    console.error('Input date formatting error:', error)
    return ''
  }
}

/**
 * Check if a date is overdue (past current date)
 */
export const isOverdue = (date: string | Date | null | undefined): boolean => {
  if (!date) return false
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return false
    
    return dateObj < new Date()
  } catch (error) {
    console.error('Overdue check error:', error)
    return false
  }
}

/**
 * Get days until a date
 */
export const getDaysUntil = (date: string | Date | null | undefined): number | null => {
  if (!date) return null
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return null
    
    const now = new Date()
    const diffTime = dateObj.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (error) {
    console.error('Days until calculation error:', error)
    return null
  }
}

/**
 * Format duration in days
 */
export const formatDuration = (days: number): string => {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  if (days === -1) return '1 day ago'
  if (days > 0) return `${days} days`
  return `${Math.abs(days)} days ago`
}