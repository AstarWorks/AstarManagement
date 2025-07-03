/**
 * Financial Export Composable
 * 
 * Provides comprehensive export functionality for financial data.
 * Handles API calls, file generation, and download management.
 */

import { ref, computed } from 'vue'
import type { FinancialFilters } from '~/types/financial'

interface FinancialDataItem {
  date: string
  description: string
  category: string
  amount: number
  matter: string
  type: string
  billable: boolean
  notes: string
}

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

  // Generate CSV content from financial data
  const generateCSVContent = (data: FinancialDataItem[], filters: FinancialFilters): string => {
    const headers = [
      'Date',
      'Description', 
      'Category',
      'Amount (JPY)',
      'Matter',
      'Type',
      'Billable',
      'Notes'
    ]
    
    const csvRows = [headers.join(',')]
    
    data.forEach(item => {
      const row = [
        item.date || new Date().toISOString().split('T')[0],
        `"${(item.description || '').replace(/"/g, '""')}"`,
        item.category || 'Other',
        (item.amount || 0).toLocaleString('ja-JP'),
        `"${(item.matter || '').replace(/"/g, '""')}"`,
        item.type || 'Expense',
        item.billable ? 'Yes' : 'No',
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }

  // Generate PDF content from financial data
  const generatePDFContent = async (data: FinancialDataItem[], filters: FinancialFilters): Promise<Blob> => {
    // Create HTML content for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Financial Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .period { color: #666; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .amount { text-align: right; }
          .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Financial Report</h1>
          <div class="period">Period: ${filters.period}</div>
          <div class="period">Generated: ${new Date().toLocaleDateString('ja-JP')}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount (JPY)</th>
              <th>Matter</th>
              <th>Billable</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                <td>${item.date || new Date().toISOString().split('T')[0]}</td>
                <td>${item.description || ''}</td>
                <td>${item.category || 'Other'}</td>
                <td class="amount">¥${(item.amount || 0).toLocaleString('ja-JP')}</td>
                <td>${item.matter || ''}</td>
                <td>${item.billable ? 'Yes' : 'No'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <h3>Summary</h3>
          <p>Total Records: ${data.length}</p>
          <p>Total Amount: ¥${data.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString('ja-JP')}</p>
          <p>Billable Amount: ¥${data.filter(item => item.billable).reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString('ja-JP')}</p>
        </div>
      </body>
      </html>
    `
    
    // Convert HTML to PDF using browser's print functionality
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(htmlContent)
      doc.close()
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Create blob from HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' })
      document.body.removeChild(iframe)
      return blob
    }
    
    throw new Error('Failed to generate PDF content')
  }

  // Get mock financial data based on filters
  const getMockFinancialData = (filters: FinancialFilters): FinancialDataItem[] => {
    const baseData = [
      {
        date: '2025-07-01',
        description: 'Legal research materials',
        category: 'Research',
        amount: 25000,
        matter: 'Corporate Merger Case',
        type: 'Expense',
        billable: true,
        notes: 'Database subscription fee'
      },
      {
        date: '2025-07-02', 
        description: 'Court filing fees',
        category: 'Court Fees',
        amount: 15000,
        matter: 'IP Litigation',
        type: 'Expense',
        billable: true,
        notes: 'District court filing'
      },
      {
        date: '2025-07-03',
        description: 'Client meeting travel',
        category: 'Travel',
        amount: 8500,
        matter: 'Contract Review',
        type: 'Expense', 
        billable: false,
        notes: 'Train fare to client office'
      },
      {
        date: '2025-06-28',
        description: 'Expert witness consultation',
        category: 'Professional Services',
        amount: 120000,
        matter: 'Patent Dispute',
        type: 'Expense',
        billable: true,
        notes: 'Technical expert 4 hours'
      },
      {
        date: '2025-06-25',
        description: 'Document translation',
        category: 'Translation',
        amount: 45000,
        matter: 'International Contract',
        type: 'Expense',
        billable: true,
        notes: 'Japanese to English translation'
      }
    ]
    
    // Apply filters if specified
    let filteredData = [...baseData]
    
    if (filters.matterIds && filters.matterIds.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.matterIds!.some(id => item.matter.includes(id))
      )
    }
    
    if (filters.categories && filters.categories.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.categories!.includes(item.category)
      )
    }
    
    return filteredData
  }

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

      // Get financial data (currently mock data)
      const financialData = getMockFinancialData(request.filters)
      exportStatus.progress = 30

      let fileData: string | Blob
      let contentType: string
      let fileExtension: string

      // Generate export content based on format
      if (request.format === 'csv') {
        fileData = generateCSVContent(financialData, request.filters)
        contentType = 'text/csv;charset=utf-8'
        fileExtension = 'csv'
        exportStatus.progress = 70
      } else if (request.format === 'pdf') {
        fileData = await generatePDFContent(financialData, request.filters)
        contentType = 'text/html'
        fileExtension = 'html' // Temporary - will be proper PDF in backend
        exportStatus.progress = 70
      } else if (request.format === 'json') {
        fileData = JSON.stringify({
          metadata: {
            generatedAt: new Date().toISOString(),
            filters: request.filters,
            recordCount: financialData.length
          },
          data: financialData
        }, null, 2)
        contentType = 'application/json'
        fileExtension = 'json'
        exportStatus.progress = 70
      } else {
        throw new Error(`Unsupported export format: ${request.format}`)
      }

      // Create downloadable file
      const blob = new Blob([fileData], { type: contentType })
      const downloadUrl = URL.createObjectURL(blob)
      const filename = exportStatus.filename.endsWith(`.${fileExtension}`) 
        ? exportStatus.filename 
        : `${exportStatus.filename}.${fileExtension}`

      exportStatus.progress = 90

      // Complete export
      exportStatus.status = 'completed'
      exportStatus.progress = 100
      exportStatus.downloadUrl = downloadUrl
      exportStatus.size = blob.size
      exportStatus.completedAt = new Date()
      exportStatus.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Auto-download the file
      await downloadFile(downloadUrl, filename)
      
      return downloadUrl

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

    // Get actual mock data to calculate real metrics
    const mockData = getMockFinancialData(filters)
    const recordCount = mockData.length
    
    // Calculate estimated file sizes based on actual data
    let estimatedBytes: number
    
    if (filters.period) {
      // CSV: roughly 150 bytes per record
      estimatedBytes = recordCount * 150
    } else {
      estimatedBytes = recordCount * 120
    }

    // Get unique categories and matters from mock data
    const uniqueCategories = new Set(mockData.map(item => item.category))
    const uniqueMatters = new Set(mockData.map(item => item.matter))

    return {
      estimatedSize: formatFileSize(estimatedBytes),
      recordCount,
      categories: uniqueCategories.size,
      matters: uniqueMatters.size,
      timeRange: `${filters.period || 'all'} period`
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