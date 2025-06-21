/**
 * Date Utility Functions
 * 
 * @description Common date formatting and manipulation utilities
 * using date-fns for consistent date handling across the application.
 */

import { 
  format, 
  formatDistanceToNow, 
  isToday, 
  isYesterday, 
  addDays,
  startOfDay,
  endOfDay,
  parseISO
} from 'date-fns'

/**
 * Format date for display in UI
 */
export function formatDate(date: string | Date, formatString = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

/**
 * Format date with relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (isToday(dateObj)) {
    return formatDistanceToNow(dateObj, { addSuffix: true })
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday'
  }
  
  return format(dateObj, 'MMM d, yyyy')
}

/**
 * Format date for datetime input
 */
export function formatDateTimeLocal(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, "yyyy-MM-dd'T'HH:mm")
}

/**
 * Check if date is due soon (within 3 days)
 */
export function isDueSoon(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const threeDaysFromNow = addDays(new Date(), 3)
  return dateObj <= threeDaysFromNow && dateObj >= startOfDay(new Date())
}

/**
 * Check if date is overdue
 */
export function isOverdue(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return dateObj < startOfDay(new Date())
}