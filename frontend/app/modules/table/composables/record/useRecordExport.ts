/**
 * useRecordExport Composable
 * エクスポート機能のみに責任を持つ
 */

import { toast } from 'vue-sonner'
import type { RecordResponse } from '../../types'

export const useRecordExport = (
  records: Ref<RecordResponse[]>,
  visibleColumns: Ref<string[]>,
  tableId: MaybeRef<string>
) => {
  const { t } = useI18n()
  const id = toRef(tableId)

  // ===== Export Methods =====
  const exportRecords = async (format: 'csv' | 'json' | 'excel' = 'csv') => {
    try {
      toast.info(t('modules.table.record.messages.exportStarted'))
      
      switch (format) {
        case 'csv':
          await exportToCSV()
          break
        case 'json':
          await exportToJSON()
          break
        case 'excel':
          toast.info(t('foundation.messages.info.comingSoon'))
          break
        default:
          toast.error(t('modules.table.record.messages.exportError'))
          return
      }
      
      toast.success(t('modules.table.record.messages.exported'))
    } catch (err) {
      console.error('Failed to export records:', err)
      toast.error(t('modules.table.record.messages.exportError'))
    }
  }

  const exportToCSV = async () => {
    const csvContent = convertToCSV(records.value, visibleColumns.value)
    downloadFile(csvContent, `records-${id.value}.csv`, 'text/csv')
  }

  const exportToJSON = async () => {
    const jsonData = records.value.map(record => {
      const exportData: Record<string, unknown> = {}
      visibleColumns.value.forEach(col => {
        exportData[col] = record.data?.[col]
      })
      return exportData
    })
    
    const jsonContent = JSON.stringify(jsonData, null, 2)
    downloadFile(jsonContent, `records-${id.value}.json`, 'application/json')
  }

  const exportSelected = async (selectedRecords: RecordResponse[], format: 'csv' | 'json' | 'excel' = 'csv') => {
    if (selectedRecords.length === 0) {
      toast.warning(t('modules.table.record.messages.noRecordsSelected'))
      return
    }

    try {
      toast.info(t('modules.table.record.messages.exportStarted'))
      
      switch (format) {
        case 'csv':
          const csvContent = convertToCSV(selectedRecords, visibleColumns.value)
          downloadFile(csvContent, `selected-records-${id.value}.csv`, 'text/csv')
          break
        case 'json':
          const jsonData = selectedRecords.map(record => {
            const exportData: Record<string, unknown> = {}
            visibleColumns.value.forEach(col => {
              exportData[col] = record.data?.[col]
            })
            return exportData
          })
          const jsonContent = JSON.stringify(jsonData, null, 2)
          downloadFile(jsonContent, `selected-records-${id.value}.json`, 'application/json')
          break
        case 'excel':
          toast.info(t('foundation.messages.info.comingSoon'))
          return
        default:
          toast.error(t('modules.table.record.messages.exportError'))
          return
      }
      
      toast.success(t('modules.table.record.messages.exported'))
    } catch (err) {
      console.error('Failed to export selected records:', err)
      toast.error(t('modules.table.record.messages.exportError'))
    }
  }

  return {
    // Methods
    exportRecords,
    exportSelected,
    exportToCSV,
    exportToJSON
  }
}

// ===== Helper Functions =====

function convertToCSV(records: RecordResponse[], columns: string[]): string {
  const headers = columns.join(',')
  const rows = records.map(record => {
    return columns.map(col => {
      const value = record.data?.[col]
      // Escape CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    }).join(',')
  })
  
  return [headers, ...rows].join('\n')
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}