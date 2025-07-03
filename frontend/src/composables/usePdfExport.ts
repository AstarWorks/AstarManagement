import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { Matter } from '~/types/matter'

export interface PdfExportOptions {
  title?: string
  subtitle?: string
  filename?: string
  logo?: string
  template?: 'standard' | 'detailed' | 'summary' | 'legal'
  includeMetadata?: boolean
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'a4' | 'letter' | 'legal'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  watermark?: string
  footer?: boolean
  showPageNumbers?: boolean
}

export interface PdfTemplate {
  id: string
  name: string
  description: string
  columns: Array<{
    key: keyof Matter
    label: string
    width?: number
    formatter?: (value: any) => string
  }>
  styles: {
    headerColor: string
    headerTextColor: string
    bodyTextColor: string
    alternatingRows: boolean
    borderStyle: 'full' | 'horizontal' | 'none'
  }
}

const DEFAULT_TEMPLATES: Record<string, PdfTemplate> = {
  standard: {
    id: 'standard',
    name: 'Standard Report',
    description: 'Basic matter information',
    columns: [
      { key: 'caseNumber', label: 'Matter #', width: 20 },
      { key: 'title', label: 'Title', width: 35 },
      { key: 'clientName', label: 'Client', width: 25 },
      { key: 'status', label: 'Status', width: 20 }
    ],
    styles: {
      headerColor: '#1f2937',
      headerTextColor: '#ffffff',
      bodyTextColor: '#374151',
      alternatingRows: true,
      borderStyle: 'full'
    }
  },
  detailed: {
    id: 'detailed',
    name: 'Detailed Report',
    description: 'Comprehensive matter details',
    columns: [
      { key: 'caseNumber', label: 'Matter #', width: 15 },
      { key: 'title', label: 'Title', width: 25 },
      { key: 'clientName', label: 'Client', width: 20 },
      { key: 'status', label: 'Status', width: 15 },
      { key: 'priority', label: 'Priority', width: 12 },
      { key: 'assignedLawyer', label: 'Assignee', width: 13 }
    ],
    styles: {
      headerColor: '#059669',
      headerTextColor: '#ffffff',
      bodyTextColor: '#374151',
      alternatingRows: true,
      borderStyle: 'full'
    }
  },
  summary: {
    id: 'summary',
    name: 'Executive Summary',
    description: 'High-level overview',
    columns: [
      { key: 'caseNumber', label: 'Matter #', width: 25 },
      { key: 'title', label: 'Title', width: 40 },
      { key: 'status', label: 'Status', width: 35 }
    ],
    styles: {
      headerColor: '#dc2626',
      headerTextColor: '#ffffff',
      bodyTextColor: '#374151',
      alternatingRows: false,
      borderStyle: 'horizontal'
    }
  },
  legal: {
    id: 'legal',
    name: 'Legal Document',
    description: 'Formal legal format',
    columns: [
      { key: 'caseNumber', label: 'Case Number', width: 20 },
      { key: 'title', label: 'Matter Title', width: 30 },
      { key: 'clientName', label: 'Client Name', width: 25 },
      { key: 'assignedLawyer', label: 'Counsel', width: 25 }
    ],
    styles: {
      headerColor: '#1e40af',
      headerTextColor: '#ffffff',
      bodyTextColor: '#1f2937',
      alternatingRows: false,
      borderStyle: 'full'
    }
  }
}

export function usePdfExport() {
  const generatePdf = async (
    matters: Matter[],
    options: PdfExportOptions = {}
  ) => {
    const {
      title = 'Matter Report',
      subtitle = '',
      filename = `matter-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      template = 'standard',
      includeMetadata = true,
      orientation = 'portrait',
      pageSize = 'a4',
      margins = { top: 20, right: 15, bottom: 20, left: 15 },
      watermark = '',
      footer = true,
      showPageNumbers = true
    } = options

    // Initialize jsPDF
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: pageSize
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const contentWidth = pageWidth - margins.left - margins.right

    // Get template configuration
    const templateConfig = DEFAULT_TEMPLATES[template]
    if (!templateConfig) {
      throw new Error(`Template '${template}' not found`)
    }

    // Add metadata
    if (includeMetadata) {
      doc.setProperties({
        title: title,
        subject: 'Matter Management Report',
        author: 'Aster Management System',
        creator: 'Aster Management System',
        keywords: 'matters, legal, report'
      })
    }

    // Add logo if provided
    if (options.logo) {
      try {
        doc.addImage(options.logo, 'PNG', margins.left, margins.top, 40, 15)
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error)
      }
    }

    // Add title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margins.left + (options.logo ? 45 : 0), margins.top + 10)

    // Add subtitle
    if (subtitle) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(subtitle, margins.left + (options.logo ? 45 : 0), margins.top + 18)
    }

    // Add generation info
    const currentDate = new Date().toLocaleDateString()
    const currentTime = new Date().toLocaleTimeString()
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(
      `Generated on ${currentDate} at ${currentTime}`,
      pageWidth - margins.right,
      margins.top + 10,
      { align: 'right' }
    )

    // Add summary statistics
    const statsY = margins.top + (subtitle ? 35 : 28)
    doc.setFontSize(11)
    doc.setTextColor(60)
    
    const statusCounts = matters.reduce((acc, matter) => {
      acc[matter.status] = (acc[matter.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statsText = [
      `Total Matters: ${matters.length}`,
      ...Object.entries(statusCounts).map(([status, count]) => 
        `${status.replace(/_/g, ' ')}: ${count}`
      )
    ].join(' | ')

    doc.text(statsText, margins.left, statsY)

    // Prepare table data
    const headers: string[] = templateConfig.columns.map(col => col.label)
    
    // Format matter data for table
    const tableData: string[][] = []
    for (const matter of matters) {
      const row: string[] = []
      for (const col of templateConfig.columns) {
        let value = matter[col.key]
        
        // Apply custom formatter if provided
        if (col.formatter) {
          row.push(col.formatter(value))
          continue
        }

        // Default formatting
        let formattedValue: string
        switch (col.key) {
          case 'assignedLawyer':
            formattedValue = typeof value === 'string' ? value : (value as any)?.name || 'Unassigned'
            break
          case 'status':
          case 'priority':
            formattedValue = (value as string)?.replace(/_/g, ' ') || ''
            break
          case 'dueDate':
          case 'createdAt':
          case 'updatedAt':
            formattedValue = value ? new Date(value as string | number | Date).toLocaleDateString() : ''
            break
          case 'amountSpent':
            formattedValue = value ? `$${(value as number).toLocaleString()}` : ''
            break
          case 'description':
            // Truncate long descriptions
            formattedValue = value && typeof value === 'string' 
              ? (value.length > 50 ? value.substring(0, 47) + '...' : value)
              : ''
            break
          default:
            formattedValue = String(value || '')
        }
        row.push(formattedValue)
      }
      tableData.push(row)
    }

    // Calculate column styles
    const totalWidth = templateConfig.columns.reduce((sum, c) => sum + (c.width || 10), 0)
    const columnStyles: Record<number, { cellWidth: number }> = {}
    for (let index = 0; index < templateConfig.columns.length; index++) {
      const col = templateConfig.columns[index]
      columnStyles[index] = { cellWidth: ((col.width || 10) / totalWidth) * contentWidth }
    }

    // Add table
    (doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: statsY + 15,
      margin: { left: margins.left, right: margins.right },
      columnStyles,
      headStyles: {
        fillColor: templateConfig.styles.headerColor,
        textColor: templateConfig.styles.headerTextColor,
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: {
        textColor: templateConfig.styles.bodyTextColor,
        fontSize: 9
      },
      alternateRowStyles: templateConfig.styles.alternatingRows ? {
        fillColor: '#f9fafb'
      } : {},
      tableLineColor: templateConfig.styles.borderStyle === 'none' ? 'transparent' : '#e5e7eb',
      tableLineWidth: templateConfig.styles.borderStyle === 'full' ? 0.5 : 0,
      horizontalPageBreak: true,
      didDrawPage: (data: any) => {
        // Add watermark if specified
        if (watermark) {
          doc.setTextColor(200)
          doc.setFontSize(50)
          doc.text(
            watermark,
            pageWidth / 2,
            pageHeight / 2,
            { 
              align: 'center',
              angle: 45
            }
          )
        }

        // Add footer
        if (footer || showPageNumbers) {
          const footerY = pageHeight - 10
          doc.setTextColor(100)
          doc.setFontSize(8)
          
          if (footer) {
            doc.text(
              'Generated by Aster Management System',
              margins.left,
              footerY
            )
          }
          
          if (showPageNumbers) {
            doc.text(
              `Page ${data.pageNumber}`,
              pageWidth - margins.right,
              footerY,
              { align: 'right' }
            )
          }
        }
      }
    })

    // Add final summary page for detailed reports
    if (template === 'detailed' && matters.length > 10) {
      doc.addPage()
      
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Matter Summary', margins.left, margins.top + 10)

      // Status distribution chart (text-based)
      let chartY = margins.top + 30
      doc.setFontSize(12)
      doc.text('Status Distribution:', margins.left, chartY)
      
      chartY += 10
      doc.setFontSize(10)
      Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = ((count / matters.length) * 100).toFixed(1)
        doc.text(
          `${status.replace(/_/g, ' ')}: ${count} (${percentage}%)`,
          margins.left + 5,
          chartY
        )
        chartY += 6
      })

      // Priority distribution
      const priorityCounts = matters.reduce((acc, matter) => {
        acc[matter.priority] = (acc[matter.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      chartY += 10
      doc.setFontSize(12)
      doc.text('Priority Distribution:', margins.left, chartY)
      
      chartY += 10
      doc.setFontSize(10)
      Object.entries(priorityCounts).forEach(([priority, count]) => {
        const percentage = ((count / matters.length) * 100).toFixed(1)
        doc.text(
          `${priority}: ${count} (${percentage}%)`,
          margins.left + 5,
          chartY
        )
        chartY += 6
      })
    }

    return doc
  }

  const downloadPdf = async (
    matters: Matter[],
    options: PdfExportOptions = {}
  ) => {
    const doc = await generatePdf(matters, options)
    const filename = options.filename || `matter-report-${new Date().toISOString().slice(0, 10)}.pdf`
    doc.save(filename)
  }

  const previewPdf = async (
    matters: Matter[],
    options: PdfExportOptions = {}
  ) => {
    const doc = await generatePdf(matters, options)
    const pdfUrl = doc.output('datauristring')
    
    // Open in new window
    const previewWindow = window.open()
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>PDF Preview - ${options.title || 'Matter Report'}</title>
            <style>
              body { margin: 0; padding: 0; }
              iframe { width: 100%; height: 100vh; border: none; }
            </style>
          </head>
          <body>
            <iframe src="${pdfUrl}"></iframe>
          </body>
        </html>
      `)
    }
  }

  const getAvailableTemplates = () => {
    return Object.values(DEFAULT_TEMPLATES)
  }

  const validatePdfOptions = (options: PdfExportOptions): string[] => {
    const errors: string[] = []

    if (options.template && !DEFAULT_TEMPLATES[options.template]) {
      errors.push(`Invalid template: ${options.template}`)
    }

    if (options.orientation && !['portrait', 'landscape'].includes(options.orientation)) {
      errors.push(`Invalid orientation: ${options.orientation}`)
    }

    if (options.pageSize && !['a4', 'letter', 'legal'].includes(options.pageSize)) {
      errors.push(`Invalid page size: ${options.pageSize}`)
    }

    return errors
  }

  return {
    generatePdf,
    downloadPdf,
    previewPdf,
    getAvailableTemplates,
    validatePdfOptions,
    DEFAULT_TEMPLATES
  }
}