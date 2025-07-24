import { ref } from 'vue'
import type { DataTableColumn } from '~/types/table'

export interface ExportConfig {
  filename?: string
  includeHeaders?: boolean
  dateFormat?: string
  booleanFormat?: 'text' | 'numeric'
  nullFormat?: string
}

export interface ExportProgress {
  isExporting: boolean
  progress: number
  status: string
}

const defaultConfig: Required<ExportConfig> = {
  filename: 'export',
  includeHeaders: true,
  dateFormat: 'yyyy-MM-dd',
  booleanFormat: 'text',
  nullFormat: ''
}

export function useDataExport() {
  const exportProgress = ref<ExportProgress>({
    isExporting: false,
    progress: 0,
    status: ''
  })

  /**
   * Export data to CSV format
   */
  const exportToCSV = async <T>(
    data: T[],
    columns: DataTableColumn<T>[],
    config: ExportConfig = {}
  ): Promise<void> => {
    const finalConfig = { ...defaultConfig, ...config }
    
    exportProgress.value = {
      isExporting: true,
      progress: 0,
      status: 'Preparing data...'
    }

    try {
      // Build CSV content
      const csvContent = await buildCSVContent(data, columns, finalConfig)
      
      exportProgress.value.status = 'Generating file...'
      exportProgress.value.progress = 80

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      downloadBlob(blob, `${finalConfig.filename}.csv`)
      
      exportProgress.value.progress = 100
      exportProgress.value.status = 'Complete'
    } catch (error) {
      console.error('CSV export failed:', error)
      throw new Error('Failed to export CSV file')
    } finally {
      setTimeout(() => {
        exportProgress.value.isExporting = false
      }, 1000)
    }
  }

  /**
   * Export data to Excel format
   */
  const exportToExcel = async <T>(
    data: T[],
    columns: DataTableColumn<T>[],
    config: ExportConfig = {}
  ): Promise<void> => {
    const finalConfig = { ...defaultConfig, ...config }
    
    exportProgress.value = {
      isExporting: true,
      progress: 0,
      status: 'Loading Excel library...'
    }

    try {
      // Dynamic import of xlsx library - install with: bun add xlsx
      const XLSX = await import('xlsx').catch(() => {
        throw new Error('xlsx library not found. Install with: bun add xlsx')
      })
      
      exportProgress.value.status = 'Processing data...'
      exportProgress.value.progress = 20

      // Convert data to worksheet format
      const worksheet = await buildWorksheet(data, columns, finalConfig, XLSX.utils)
      
      exportProgress.value.status = 'Creating workbook...'
      exportProgress.value.progress = 60

      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      
      exportProgress.value.status = 'Generating file...'
      exportProgress.value.progress = 80

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true
      })
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      downloadBlob(blob, `${finalConfig.filename}.xlsx`)
      
      exportProgress.value.progress = 100
      exportProgress.value.status = 'Complete'
    } catch (error) {
      console.error('Excel export failed:', error)
      throw new Error('Failed to export Excel file')
    } finally {
      setTimeout(() => {
        exportProgress.value.isExporting = false
      }, 1000)
    }
  }

  /**
   * Build CSV content from data
   */
  const buildCSVContent = async <T>(
    data: T[],
    columns: DataTableColumn<T>[],
    config: Required<ExportConfig>
  ): Promise<string> => {
    const rows: string[] = []
    
    // Add headers if requested
    if (config.includeHeaders) {
      const headers = columns.map(col => escapeCSVField(col.header || col.title || ''))
      rows.push(headers.join(','))
    }
    
    // Process data in chunks to avoid blocking UI
    const chunkSize = 100
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      
      for (const row of chunk) {
        const csvRow = columns.map(column => {
          const value = getValue(row, String(column.key))
          const formattedValue = formatValueForExport(value, column, config)
          return escapeCSVField(formattedValue)
        })
        rows.push(csvRow.join(','))
      }
      
      // Update progress
      exportProgress.value.progress = Math.round((i / data.length) * 60)
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    return rows.join('\n')
  }

  /**
   * Build Excel worksheet from data
   */
  const buildWorksheet = async <T>(
    data: T[],
    columns: DataTableColumn<T>[],
    config: Required<ExportConfig>,
    utils: any
  ): Promise<any> => {
    const worksheetData: any[][] = []
    
    // Add headers if requested
    if (config.includeHeaders) {
      worksheetData.push(columns.map(col => col.header || col.title || ''))
    }
    
    // Process data in chunks
    const chunkSize = 100
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      
      for (const row of chunk) {
        const excelRow = columns.map(column => {
          const value = getValue(row, String(column.key))
          return formatValueForExport(value, column, config, 'excel')
        })
        worksheetData.push(excelRow)
      }
      
      // Update progress
      exportProgress.value.progress = 20 + Math.round((i / data.length) * 40)
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    return utils.aoa_to_sheet(worksheetData)
  }

  /**
   * Get value from nested object path
   */
  const getValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Format value for export
   */
  const formatValueForExport = <T>(
    value: any,
    column: DataTableColumn<T>,
    config: Required<ExportConfig>,
    format: 'csv' | 'excel' = 'csv'
  ): any => {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return config.nullFormat
    }
    
    // Use custom formatter if available
    if (column.formatter && format === 'csv') {
      return column.formatter(value, {} as T)
    }
    
    // Handle different data types
    if (value instanceof Date) {
      return format === 'excel' ? value : formatDate(value, config.dateFormat)
    }
    
    if (typeof value === 'boolean') {
      if (config.booleanFormat === 'numeric') {
        return value ? 1 : 0
      }
      return value ? 'Yes' : 'No'
    }
    
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  /**
   * Format date according to specified format
   */
  const formatDate = (date: Date, format: string): string => {
    try {
      // Simple date formatting - could be enhanced with date-fns
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return format
        .replace('yyyy', String(year))
        .replace('MM', month)
        .replace('dd', day)
        .replace('HH', hours)
        .replace('mm', minutes)
    } catch (error) {
      return date.toISOString().split('T')[0]
    }
  }

  /**
   * Escape CSV field to handle commas, quotes, and newlines
   */
  const escapeCSVField = (field: string): string => {
    if (field == null) return ''
    
    const str = String(field)
    
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    
    return str
  }

  /**
   * Download blob as file
   */
  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Export filtered/selected data with current table state
   */
  const exportTableData = async <T>(
    allData: T[],
    columns: DataTableColumn<T>[],
    options: {
      selectedRows?: T[]
      visibleColumns?: DataTableColumn<T>[]
      format: 'csv' | 'excel'
      filename?: string
    }
  ): Promise<void> => {
    const dataToExport = options.selectedRows?.length ? options.selectedRows : allData
    const columnsToExport = options.visibleColumns?.length ? options.visibleColumns : columns
    
    const config: ExportConfig = {
      filename: options.filename || `export-${new Date().toISOString().split('T')[0]}`
    }
    
    if (options.format === 'csv') {
      await exportToCSV(dataToExport, columnsToExport, config)
    } else {
      await exportToExcel(dataToExport, columnsToExport, config)
    }
  }

  return {
    exportProgress: readonly(exportProgress),
    exportToCSV,
    exportToExcel,
    exportTableData
  }
}