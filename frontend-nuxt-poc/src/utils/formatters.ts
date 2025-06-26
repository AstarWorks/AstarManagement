/**
 * Formatting Utilities
 * 
 * @description Common formatting functions for displaying data in the UI
 * @author Claude
 * @created 2025-06-26
 */

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 0) return 'Invalid'
  if (ms === 0) return '0ms'
  
  const parts = []
  
  // Hours
  const hours = Math.floor(ms / 3600000)
  if (hours > 0) {
    parts.push(`${hours}h`)
    ms %= 3600000
  }
  
  // Minutes
  const minutes = Math.floor(ms / 60000)
  if (minutes > 0) {
    parts.push(`${minutes}m`)
    ms %= 60000
  }
  
  // Seconds
  const seconds = Math.floor(ms / 1000)
  if (seconds > 0) {
    parts.push(`${seconds}s`)
    ms %= 1000
  }
  
  // Milliseconds
  if (ms > 0 && parts.length === 0) {
    parts.push(`${ms}ms`)
  }
  
  return parts.join(' ')
}

/**
 * Format date to relative time string
 */
export function formatRelativeTime(date: Date | string | number): string {
  const timestamp = typeof date === 'number' ? date : new Date(date).getTime()
  const now = Date.now()
  const diff = now - timestamp
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  if (seconds > 0) return `${seconds}s ago`
  return 'just now'
}

/**
 * Format percentage with specified decimals
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}