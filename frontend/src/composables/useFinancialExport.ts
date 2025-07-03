/**
 * Financial Export Composable
 * 
 * Provides comprehensive export functionality for financial data.
 * Handles API calls, file generation, and download management.
 */

import { ref, computed } from 'vue'
import type { FinancialFilters } from '~/types/financial'

export interface ExportOptions {
  includeCharts?: boolean
  includeRawData?: boolean
  filename?: string
}

export interface ExportRequest {
  format: 'csv' | 'json' | 'pdf'
  filters: FinancialFilters
  options?: ExportOptions
}

export interface ExportStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  format: string
  filename: string
  downloadUrl?: string
  progress: number
  error?: string
  createdAt: Date
  completedAt?: Date
  size?: number
  expiresAt?: Date
}

export function useFinancialExport() {
  // State
  const isExporting = ref(false)
  const exportQueue = ref<ExportStatus[]>([])
  const currentExport = ref<ExportStatus | null>(null)
  const error = ref<string | null>(null)

  // Computed
  const hasActiveExports = computed(() => 
    exportQueue.value.some(exp => exp.status === 'pending' || exp.status === 'processing')
  )

  const completedExports = computed(() =>
    exportQueue.value.filter(exp => exp.status === 'completed')
  )

  const failedExports = computed(() =>
    exportQueue.value.filter(exp => exp.status === 'failed')
  )

  // Export financial data
  const exportData = async (request: ExportRequest): Promise<string | null> => {
    if (isExporting.value) {
      throw new Error('Export already in progress')
    }

    isExporting.value = true
    error.value = null

    // Create export status entry
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const exportStatus: ExportStatus = {
      id: exportId,
      status: 'pending',
      format: request.format,
      filename: request.options?.filename || `financial-report-${new Date().toISOString().split('T')[0]}.${request.format}`,
      progress: 0,
      createdAt: new Date()
    }

    exportQueue.value.unshift(exportStatus)
    currentExport.value = exportStatus

    try {
      // Update status to processing
      exportStatus.status = 'processing'
      exportStatus.progress = 10

      // Call export API
      const response = await $fetch<{
        success: boolean
        downloadUrl?: string
        filename: string
        format: string
        size: number
        generatedAt: string
        expiresAt: string
        error?: string
      }>('/api/financial/export', {
        method: 'POST',
        body: request
      })

      // Simulate progress updates
      for (let progress = 20; progress <= 90; progress += 20) {
        exportStatus.progress = progress
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (response.success && response.downloadUrl) {
        exportStatus.status = 'completed'
        exportStatus.progress = 100
        exportStatus.downloadUrl = response.downloadUrl
        exportStatus.size = response.size
        exportStatus.completedAt = new Date()
        exportStatus.expiresAt = new Date(response.expiresAt)

        // Auto-download the file
        await downloadFile(response.downloadUrl, response.filename)
        
        return response.downloadUrl
      } else {
        throw new Error(response.error || 'Export failed')
      }

    } catch (err) {
      console.error('Export failed:', err)
      exportStatus.status = 'failed'
      exportStatus.error = err instanceof Error ? err.message : 'Export failed'
      error.value = exportStatus.error
      throw err

    } finally {
      isExporting.value = false
      currentExport.value = null
    }
  }

  // Quick export methods
  const exportAsCSV = async (filters: FinancialFilters, options?: ExportOptions) => {
    return exportData({
      format: 'csv',
      filters,
      options: {
        includeRawData: true,
        ...options
      }
    })
  }

  const exportAsJSON = async (filters: FinancialFilters, options?: ExportOptions) => {
    return exportData({
      format: 'json',
      filters,
      options: {
        includeRawData: true,
        includeCharts: false,
        ...options
      }
    })
  }

  const exportAsPDF = async (filters: FinancialFilters, options?: ExportOptions) => {
    return exportData({
      format: 'pdf',
      filters,
      options: {
        includeCharts: true,
        includeRawData: false,
        ...options
      }
    })
  }

  // Download file from URL
  const downloadFile = async (url: string, filename: string): Promise<void> => {
    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the URL if it's a blob URL
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Download failed:', err)
      throw new Error('Failed to download file')
    }
  }

  // Retry failed export
  const retryExport = async (exportId: string): Promise<void> => {
    const exportStatus = exportQueue.value.find(exp => exp.id === exportId)
    if (!exportStatus || exportStatus.status !== 'failed') {
      throw new Error('Export not found or not in failed state')
    }

    // Reset status and retry
    exportStatus.status = 'pending'
    exportStatus.progress = 0
    exportStatus.error = undefined
    exportStatus.createdAt = new Date()

    // Note: In a real implementation, you would store the original request
    // For this mock, we'll just mark it as failed again
    setTimeout(() => {
      exportStatus.status = 'failed'
      exportStatus.error = 'Retry not implemented in mock'
    }, 1000)
  }

  // Remove export from queue
  const removeExport = (exportId: string): void => {
    const index = exportQueue.value.findIndex(exp => exp.id === exportId)
    if (index > -1) {
      exportQueue.value.splice(index, 1)
    }
  }

  // Clear all completed exports
  const clearCompleted = (): void => {
    exportQueue.value = exportQueue.value.filter(exp => exp.status !== 'completed')
  }

  // Clear all failed exports
  const clearFailed = (): void => {
    exportQueue.value = exportQueue.value.filter(exp => exp.status !== 'failed')
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get export status by ID
  const getExportStatus = (exportId: string): ExportStatus | undefined => {
    return exportQueue.value.find(exp => exp.id === exportId)
  }

  // Generate export preview data
  const generatePreview = async (filters: FinancialFilters): Promise<{
    estimatedSize: string
    recordCount: number
    categories: number
    matters: number
    timeRange: string
  }> => {
    // Simulate API call for preview data
    await new Promise(resolve => setTimeout(resolve, 300))

    // Calculate estimated values based on filters
    let recordCount = 1250
    let estimatedBytes = 25000

    // Adjust based on time period
    const periodMultipliers = {
      week: 0.25,
      month: 1,
      quarter: 3,
      year: 12,
      custom: 1
    }
    
    const multiplier = periodMultipliers[filters.period] || 1
    recordCount = Math.round(recordCount * multiplier)
    estimatedBytes = Math.round(estimatedBytes * multiplier)

    // Adjust for selected filters
    if (filters.matterIds && filters.matterIds.length > 0) {
      const ratio = filters.matterIds.length / 10 // Assume 10 total matters
      recordCount = Math.round(recordCount * ratio)
      estimatedBytes = Math.round(estimatedBytes * ratio)
    }

    return {
      estimatedSize: formatFileSize(estimatedBytes),
      recordCount,
      categories: filters.categories?.length || 5,
      matters: filters.matterIds?.length || 10,
      timeRange: `${filters.period} period`
    }
  }

  // Export multiple formats at once
  const exportMultiple = async (
    formats: Array<'csv' | 'json' | 'pdf'>,
    filters: FinancialFilters,
    options?: ExportOptions
  ): Promise<string[]> => {
    const promises = formats.map(format => 
      exportData({ format, filters, options })
    )

    try {
      const results = await Promise.all(promises)
      return results.filter((url): url is string => url !== null)
    } catch (err) {
      console.error('Multiple export failed:', err)
      throw err
    }
  }

  return {
    // State
    isExporting: readonly(isExporting),
    exportQueue: readonly(exportQueue),
    currentExport: readonly(currentExport),
    error: readonly(error),

    // Computed
    hasActiveExports,
    completedExports,
    failedExports,

    // Methods
    exportData,
    exportAsCSV,
    exportAsJSON,
    exportAsPDF,
    exportMultiple,
    downloadFile,
    retryExport,
    removeExport,
    clearCompleted,
    clearFailed,
    generatePreview,
    getExportStatus,
    formatFileSize
  }
}