// Memo export functionality for T04_S13

import { ref } from 'vue'
import type { Memo, MemoExportOptions } from '~/types/memo'
import { format } from 'date-fns'
import Papa from 'papaparse'
import { jsPDF } from 'jspdf'

export function useMemoExport() {
  const isExporting = ref(false)
  const exportProgress = ref(0)
  const exportError = ref<string | null>(null)

  // Generate CSV export using papaparse
  const generateCSV = (memos: Memo[], options: Partial<MemoExportOptions> = {}): string => {
    const { includeContent = false, includeAttachments = true } = options
    
    // Define CSV headers
    const headers = [
      'ID',
      'Case Number',
      'Subject',
      'Recipient Name',
      'Recipient Type',
      'Status',
      'Priority',
      'Sent Date',
      'Read Date',
      'Created By',
      'Tags'
    ]
    
    if (includeContent) {
      headers.splice(3, 0, 'Content')
    }
    
    if (includeAttachments) {
      headers.push('Attachments Count', 'Attachment Names')
    }
    
    // Generate CSV rows
    const rows = memos.map(memo => {
      const row = [
        memo.id,
        memo.caseNumber,
        memo.subject,
        memo.recipient.name,
        memo.recipient.type,
        memo.status,
        memo.priority,
        memo.sentAt ? formatDateForExport(memo.sentAt) : '',
        memo.readAt ? formatDateForExport(memo.readAt) : '',
        memo.createdBy.name,
        memo.tags.join('; ')
      ]
      
      if (includeContent) {
        row.splice(3, 0, memo.content)
      }
      
      if (includeAttachments) {
        row.push(
          memo.attachments.length.toString(),
          memo.attachments.map(att => att.filename).join('; ')
        )
      }
      
      return row
    })
    
    // Use papaparse to generate CSV
    const csv = Papa.unparse({
      fields: headers,
      data: rows
    })
    
    return csv
  }

  // Generate PDF export using jsPDF
  const generatePDF = async (memos: Memo[], options: Partial<MemoExportOptions> = {}): Promise<Blob> => {
    const { includeContent = false } = options
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    
    let yPosition = margin
    
    // Add header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Memo Report', margin, yPosition)
    yPosition += 10
    
    // Add generation date
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, margin, yPosition)
    yPosition += 10
    
    // Add summary
    doc.text(`Total Memos: ${memos.length}`, margin, yPosition)
    yPosition += 20
    
    // Add memos
    memos.forEach((memo, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }
      
      // Memo header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${memo.subject}`, margin, yPosition)
      yPosition += 8
      
      // Memo details
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const details = [
        `Case: ${memo.caseNumber}`,
        `To: ${memo.recipient.name} (${memo.recipient.type})`,
        `Status: ${memo.status}`,
        `Priority: ${memo.priority}`,
        `Date: ${memo.sentAt ? formatDateForExport(memo.sentAt) : 'Not sent'}`
      ]
      
      if (memo.tags.length > 0) {
        details.push(`Tags: ${memo.tags.join(', ')}`)
      }
      
      details.forEach(detail => {
        doc.text(detail, margin + 5, yPosition)
        yPosition += 5
      })
      
      // Add content if requested
      if (includeContent && memo.content) {
        yPosition += 3
        doc.setFont('helvetica', 'italic')
        
        // Split long content into multiple lines
        const lines = doc.splitTextToSize(memo.content, contentWidth - 10)
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage()
            yPosition = margin
          }
          doc.text(line, margin + 5, yPosition)
          yPosition += 4
        })
      }
      
      yPosition += 10
    })
    
    return doc.output('blob')
  }

  // Download file helper
  const downloadFile = (content: string | Blob, filename: string, contentType: string) => {
    const blob = typeof content === 'string' 
      ? new Blob([content], { type: contentType })
      : content
      
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Main export function
  const exportMemos = async (
    memos: Memo[], 
    options: MemoExportOptions
  ): Promise<void> => {
    if (!memos.length) {
      throw new Error('No memos to export')
    }

    isExporting.value = true
    exportProgress.value = 0
    exportError.value = null

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
      const baseFilename = `memos-export-${timestamp}`

      if (options.format === 'csv') {
        exportProgress.value = 25
        const csvContent = generateCSV(memos, options)
        
        exportProgress.value = 75
        downloadFile(
          csvContent, 
          `${baseFilename}.csv`, 
          'text/csv;charset=utf-8;'
        )
        
      } else if (options.format === 'pdf') {
        exportProgress.value = 25
        const pdfBlob = await generatePDF(memos, options)
        
        exportProgress.value = 75
        downloadFile(
          pdfBlob, 
          `${baseFilename}.pdf`, 
          'application/pdf'
        )
      }

      exportProgress.value = 100

    } catch (error) {
      console.error('Export failed:', error)
      exportError.value = error instanceof Error ? error.message : 'Export failed'
      throw error
    } finally {
      setTimeout(() => {
        isExporting.value = false
        exportProgress.value = 0
      }, 1000)
    }
  }

  // Server-side export (when available)
  const exportMemosServer = async (options: MemoExportOptions): Promise<void> => {
    try {
      const response = await $fetch('/api/memos/export', {
        method: 'POST',
        body: options,
        responseType: 'blob'
      })

      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
      const filename = `memos-export-${timestamp}.${options.format}`
      const contentType = options.format === 'csv' 
        ? 'text/csv;charset=utf-8;' 
        : 'application/pdf'

      downloadFile(response as Blob, filename, contentType)

    } catch (error) {
      console.error('Server export failed:', error)
      throw error
    }
  }

  // Helper functions
  const escapeCSVValue = (value: string): string => {
    if (!value) return ''
    // Escape quotes and handle newlines
    return value.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')
  }

  const formatDateForExport = (dateString: string): string => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss')
  }

  // Export statistics
  const getExportStats = (memos: Memo[]) => {
    const stats = {
      total: memos.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byRecipientType: {} as Record<string, number>,
      dateRange: {
        earliest: '',
        latest: ''
      }
    }

    memos.forEach(memo => {
      // Count by status
      stats.byStatus[memo.status] = (stats.byStatus[memo.status] || 0) + 1
      
      // Count by priority
      stats.byPriority[memo.priority] = (stats.byPriority[memo.priority] || 0) + 1
      
      // Count by recipient type
      const recipientType = memo.recipient.type
      stats.byRecipientType[recipientType] = (stats.byRecipientType[recipientType] || 0) + 1
    })

    // Calculate date range
    if (memos.length > 0) {
      const dates = memos.map(memo => new Date(memo.sentAt || '2024-01-01'))
      const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
      stats.dateRange.earliest = format(sortedDates[0], 'PPP')
      stats.dateRange.latest = format(sortedDates[sortedDates.length - 1], 'PPP')
    }

    return stats
  }

  return {
    isExporting,
    exportProgress,
    exportError,
    exportMemos,
    exportMemosServer,
    generateCSV,
    generatePDF,
    downloadFile,
    getExportStats
  }
}