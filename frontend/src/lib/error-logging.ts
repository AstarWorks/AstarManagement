/**
 * Enhanced error logging service
 * 
 * @description Provides comprehensive error logging with correlation tracking,
 * user context, performance metrics, and integration with monitoring services.
 * Supports offline queuing and batch uploading of error logs.
 */

import { BoardError, ErrorType } from '@/services/error/error.handler'

interface LogContext {
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  timestamp?: string
  buildVersion?: string
  environment?: string
}

interface PerformanceMetrics {
  memoryUsage?: any
  networkLatency?: number
  renderTime?: number
  loadTime?: number
}

interface ErrorLogEntry {
  id: string
  error: BoardError
  context: LogContext
  performance?: PerformanceMetrics
  stackTrace?: string
  userActions?: UserAction[]
  deviceInfo?: DeviceInfo
  retryCount?: number
  resolved?: boolean
  reportedToUser?: boolean
}

interface UserAction {
  type: string
  timestamp: string
  details?: any
}

interface DeviceInfo {
  platform: string
  screenResolution: string
  colorDepth: number
  timezone: string
  language: string
  cookieEnabled: boolean
  memoryLimit?: number
}

class ErrorLoggingService {
  private logQueue: ErrorLogEntry[] = []
  private userActions: UserAction[] = []
  private sessionId: string
  private isOnline: boolean = true
  private maxQueueSize = 100
  private maxUserActionsHistory = 50
  private batchUploadInterval: NodeJS.Timeout | null = null
  private readonly storageKey = 'aster-error-logs'

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeService()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeService() {
    // Load queued logs from localStorage
    this.loadQueuedLogs()

    // Set up periodic batch upload
    this.startBatchUpload()

    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.uploadQueuedLogs()
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
      })

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.persistQueuedLogs()
        }
      })

      // Track page unload
      window.addEventListener('beforeunload', () => {
        this.persistQueuedLogs()
      })
    }
  }

  /**
   * Log an error with full context and metrics
   */
  public logError(
    error: BoardError,
    additionalContext?: Partial<LogContext>,
    stackTrace?: string
  ): string {
    const logEntry: ErrorLogEntry = {
      id: crypto.randomUUID(),
      error: {
        ...error,
        correlationId: error.correlationId || crypto.randomUUID()
      },
      context: this.buildContext(additionalContext),
      performance: this.capturePerformanceMetrics(),
      stackTrace,
      userActions: [...this.userActions],
      deviceInfo: this.captureDeviceInfo(),
      retryCount: 0,
      resolved: false,
      reportedToUser: false
    }

    // Add to queue
    this.addToQueue(logEntry)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Log [${logEntry.id.slice(0, 8)}]`)
      console.error('Error:', error)
      console.log('Context:', logEntry.context)
      console.log('Performance:', logEntry.performance)
      console.log('Recent Actions:', logEntry.userActions.slice(-5))
      if (stackTrace) console.log('Stack:', stackTrace)
      console.groupEnd()
    }

    // Immediate upload for critical errors if online
    if (this.isOnline && this.isCriticalError(error)) {
      this.uploadLogEntry(logEntry)
    }

    return logEntry.id
  }

  /**
   * Track user actions for error context
   */
  public trackUserAction(type: string, details?: any) {
    const action: UserAction = {
      type,
      timestamp: new Date().toISOString(),
      details
    }

    this.userActions.push(action)

    // Keep only recent actions
    if (this.userActions.length > this.maxUserActionsHistory) {
      this.userActions = this.userActions.slice(-this.maxUserActionsHistory)
    }
  }

  /**
   * Mark an error as resolved
   */
  public markErrorResolved(errorId: string, resolution?: string) {
    const logEntry = this.logQueue.find(log => log.id === errorId)
    if (logEntry) {
      logEntry.resolved = true
      logEntry.error.details = resolution || logEntry.error.details
      
      // Upload resolution immediately if online
      if (this.isOnline) {
        this.uploadLogEntry(logEntry)
      }
    }
  }

  /**
   * Increment retry count for an error
   */
  public incrementRetryCount(errorId: string) {
    const logEntry = this.logQueue.find(log => log.id === errorId)
    if (logEntry) {
      logEntry.retryCount = (logEntry.retryCount || 0) + 1
    }
  }

  /**
   * Get error statistics for monitoring
   */
  public getErrorStats() {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const recentErrors = this.logQueue.filter(
      log => new Date(log.error.timestamp).getTime() > now - oneHour
    )

    const errorsByType = recentErrors.reduce((acc, log) => {
      acc[log.error.type] = (acc[log.error.type] || 0) + 1
      return acc
    }, {} as Record<ErrorType, number>)

    return {
      totalErrors: this.logQueue.length,
      recentErrors: recentErrors.length,
      errorsByType,
      resolvedErrors: this.logQueue.filter(log => log.resolved).length,
      criticalErrors: this.logQueue.filter(log => this.isCriticalError(log.error)).length,
      queueSize: this.logQueue.length
    }
  }

  /**
   * Export logs for debugging or support
   */
  public exportLogs(includeContext: boolean = true): string {
    const exportData = this.logQueue.map(log => ({
      id: log.id,
      error: log.error,
      context: includeContext ? log.context : undefined,
      resolved: log.resolved,
      retryCount: log.retryCount
    }))

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Clear old logs to prevent memory issues
   */
  public clearOldLogs(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = Date.now() - maxAge
    this.logQueue = this.logQueue.filter(
      log => new Date(log.error.timestamp).getTime() > cutoff
    )
  }

  private buildContext(additionalContext?: Partial<LogContext>): LogContext {
    const baseContext: LogContext = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      buildVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
    }

    if (typeof window !== 'undefined') {
      baseContext.userAgent = navigator.userAgent
      baseContext.url = window.location.href
    }

    return { ...baseContext, ...additionalContext }
  }

  private capturePerformanceMetrics(): PerformanceMetrics | undefined {
    if (typeof window === 'undefined' || !window.performance) return undefined

    const metrics: PerformanceMetrics = {}

    // Memory usage
    if ('memory' in performance) {
      metrics.memoryUsage = (performance as any).memory
    }

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart
      metrics.networkLatency = navigation.responseStart - navigation.requestStart
    }

    return metrics
  }

  private captureDeviceInfo(): DeviceInfo | undefined {
    if (typeof window === 'undefined') return undefined

    return {
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      memoryLimit: (navigator as any).deviceMemory
    }
  }

  private isCriticalError(error: BoardError): boolean {
    return error.type === ErrorType.AUTHENTICATION ||
           error.type === ErrorType.SERVER ||
           error.message.toLowerCase().includes('crash') ||
           error.message.toLowerCase().includes('critical')
  }

  private addToQueue(logEntry: ErrorLogEntry) {
    this.logQueue.push(logEntry)

    // Maintain queue size limit
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue = this.logQueue.slice(-this.maxQueueSize)
    }
  }

  private async uploadLogEntry(logEntry: ErrorLogEntry) {
    try {
      // TODO: Replace with actual monitoring service endpoint
      const response = await fetch('/api/v1/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      })

      if (response.ok) {
        // Remove from queue after successful upload
        this.logQueue = this.logQueue.filter(log => log.id !== logEntry.id)
      }
    } catch (uploadError) {
      // Upload failed - log will remain in queue for retry
      console.warn('Failed to upload error log:', uploadError)
    }
  }

  private async uploadQueuedLogs() {
    if (!this.isOnline || this.logQueue.length === 0) return

    // Upload in batches
    const batchSize = 10
    const batches = []
    for (let i = 0; i < this.logQueue.length; i += batchSize) {
      batches.push(this.logQueue.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      try {
        await Promise.all(batch.map(log => this.uploadLogEntry(log)))
      } catch (error) {
        console.warn('Failed to upload error log batch:', error)
        break // Stop uploading on first failure
      }
    }
  }

  private startBatchUpload() {
    this.batchUploadInterval = setInterval(() => {
      this.uploadQueuedLogs()
    }, 30000) // Upload every 30 seconds
  }

  private persistQueuedLogs() {
    if (typeof localStorage === 'undefined') return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logQueue))
    } catch (error) {
      console.warn('Failed to persist error logs:', error)
    }
  }

  private loadQueuedLogs() {
    if (typeof localStorage === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.logQueue = JSON.parse(stored)
        localStorage.removeItem(this.storageKey) // Clear after loading
      }
    } catch (error) {
      console.warn('Failed to load persisted error logs:', error)
    }
  }

  /**
   * Cleanup resources
   */
  public destroy() {
    if (this.batchUploadInterval) {
      clearInterval(this.batchUploadInterval)
    }
    this.persistQueuedLogs()
  }
}

// Export singleton instance
export const errorLoggingService = new ErrorLoggingService()

// Export hooks for React components
export function useErrorLogging() {
  return {
    logError: errorLoggingService.logError.bind(errorLoggingService),
    trackUserAction: errorLoggingService.trackUserAction.bind(errorLoggingService),
    markErrorResolved: errorLoggingService.markErrorResolved.bind(errorLoggingService),
    getErrorStats: errorLoggingService.getErrorStats.bind(errorLoggingService),
    exportLogs: errorLoggingService.exportLogs.bind(errorLoggingService)
  }
}