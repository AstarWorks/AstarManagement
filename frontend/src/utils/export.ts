import type { Matter } from '~/types/matter'

/**
 * Export data to CSV format
 */
export function exportToCSV(data: Matter[], filename = 'matters.csv') {
  if (!data.length) return

  // Define columns to export
  const columns = [
    { key: 'caseNumber', label: 'Matter #' },
    { key: 'title', label: 'Title' },
    { key: 'clientName', label: 'Client' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'assignedLawyer', label: 'Assignee' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'createdAt', label: 'Created' },
    { key: 'updatedAt', label: 'Updated' },
    { key: 'description', label: 'Description' }
  ]

  // Create CSV header
  const header = columns.map(col => `"${col.label}"`).join(',')

  // Create CSV rows
  const rows = data.map(matter => {
    return columns.map(col => {
      let value = getNestedValue(matter, col.key)
      
      // Format specific fields
      switch (col.key) {
        case 'assignedLawyer':
          value = typeof value === 'string' ? value : value?.name || ''
          break
        case 'status':
        case 'priority':
          value = (value as string)?.replace(/_/g, ' ') || ''
          break
        case 'dueDate':
        case 'createdAt':
        case 'updatedAt':
          value = value ? new Date(value).toLocaleDateString() : ''
          break
        case 'description':
          // Clean description for CSV
          value = (value as string)?.replace(/[\n\r]/g, ' ').trim() || ''
          break
        default:
          value = value || ''
      }
      
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  })

  // Combine header and rows
  const csvContent = [header, ...rows].join('\n')

  // Create and download file
  downloadFile(csvContent, filename, 'text/csv')
}

/**
 * Export data to Excel-compatible CSV
 */
export function exportToExcel(data: Matter[], filename = 'matters.xlsx') {
  // For now, we'll export as CSV with Excel-friendly formatting
  // In a real implementation, you might use a library like xlsx or exceljs
  
  if (!data.length) return

  // Use UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF'
  
  // Same logic as CSV but with BOM
  const columns = [
    { key: 'caseNumber', label: 'Matter #' },
    { key: 'title', label: 'Title' },
    { key: 'clientName', label: 'Client' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'assignedLawyer', label: 'Assignee' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'createdAt', label: 'Created' },
    { key: 'updatedAt', label: 'Updated' },
    { key: 'description', label: 'Description' }
  ]

  const header = columns.map(col => col.label).join('\t')
  
  const rows = data.map(matter => {
    return columns.map(col => {
      let value = getNestedValue(matter, col.key)
      
      switch (col.key) {
        case 'assignedLawyer':
          value = typeof value === 'string' ? value : value?.name || ''
          break
        case 'status':
        case 'priority':
          value = (value as string)?.replace(/_/g, ' ') || ''
          break
        case 'dueDate':
        case 'createdAt':
        case 'updatedAt':
          value = value ? new Date(value).toLocaleDateString() : ''
          break
        case 'description':
          value = (value as string)?.replace(/[\n\r\t]/g, ' ').trim() || ''
          break
        default:
          value = value || ''
      }
      
      return String(value)
    }).join('\t')
  })

  const content = BOM + [header, ...rows].join('\n')
  
  // Download as .csv but Excel will recognize it
  downloadFile(content, filename.replace('.xlsx', '.csv'), 'text/csv')
}

/**
 * Generate filtered export based on current table state
 */
export function exportFilteredMatters(
  allMatters: Matter[],
  filters: {
    search?: string
    status?: string[]
    priority?: string[]
    assignee?: string[]
  },
  format: 'csv' | 'excel' = 'csv',
  filename?: string
) {
  let filteredData = [...allMatters]

  // Apply search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredData = filteredData.filter(matter =>
      matter.title.toLowerCase().includes(searchTerm) ||
      matter.clientName?.toLowerCase().includes(searchTerm) ||
      matter.caseNumber.toLowerCase().includes(searchTerm) ||
      matter.description?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply status filter
  if (filters.status?.length) {
    filteredData = filteredData.filter(matter =>
      filters.status!.includes(matter.status)
    )
  }

  // Apply priority filter
  if (filters.priority?.length) {
    filteredData = filteredData.filter(matter =>
      filters.priority!.includes(matter.priority)
    )
  }

  // Apply assignee filter
  if (filters.assignee?.length) {
    filteredData = filteredData.filter(matter => {
      const assigneeName = typeof matter.assignedLawyer === 'string' 
        ? matter.assignedLawyer 
        : matter.assignedLawyer?.name || ''
      return filters.assignee!.includes(assigneeName)
    })
  }

  // Generate timestamp for filename
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
  const defaultFilename = `matters-filtered-${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`

  if (format === 'excel') {
    exportToExcel(filteredData, filename || defaultFilename)
  } else {
    exportToCSV(filteredData, filename || defaultFilename)
  }

  return filteredData.length
}

/**
 * Export template for bulk import
 */
export function exportTemplate() {
  const templateData = [
    {
      caseNumber: 'CASE-001',
      title: 'Sample Matter Title',
      clientName: 'Sample Client',
      status: 'INTAKE',
      priority: 'MEDIUM',
      assignedLawyer: 'John Doe',
      dueDate: new Date().toISOString().split('T')[0],
      description: 'Sample matter description'
    }
  ]

  exportToCSV(templateData as any[], 'matter-import-template.csv')
}

/**
 * Utility function to get nested object values safely
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Utility function to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  
  // Append to body, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the URL object
  window.URL.revokeObjectURL(url)
}

/**
 * Validate CSV import data
 */
export function validateImportData(csvData: any[]): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!csvData.length) {
    errors.push('No data found in CSV file')
    return { valid: false, errors, warnings }
  }

  // Required fields
  const requiredFields = ['caseNumber', 'title', 'clientName']
  
  csvData.forEach((row, index) => {
    const rowNum = index + 1

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(`Row ${rowNum}: Missing required field '${field}'`)
      }
    })

    // Validate case number format
    if (row.caseNumber && !/^[A-Z0-9-]+$/.test(row.caseNumber)) {
      warnings.push(`Row ${rowNum}: Case number '${row.caseNumber}' should only contain letters, numbers, and hyphens`)
    }

    // Validate status
    const validStatuses = ['INTAKE', 'INITIAL_REVIEW', 'IN_PROGRESS', 'REVIEW', 'WAITING_CLIENT', 'READY_FILING', 'CLOSED']
    if (row.status && !validStatuses.includes(row.status)) {
      errors.push(`Row ${rowNum}: Invalid status '${row.status}'. Valid values: ${validStatuses.join(', ')}`)
    }

    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    if (row.priority && !validPriorities.includes(row.priority)) {
      errors.push(`Row ${rowNum}: Invalid priority '${row.priority}'. Valid values: ${validPriorities.join(', ')}`)
    }

    // Validate date format
    if (row.dueDate && isNaN(new Date(row.dueDate).getTime())) {
      warnings.push(`Row ${rowNum}: Invalid due date format '${row.dueDate}'. Use YYYY-MM-DD format`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Parse CSV file content
 */
export function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    data.push(row)
  }

  return data
}