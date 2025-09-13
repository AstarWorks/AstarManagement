/**
 * useRecordList Composable
 * テーブルレコード一覧の管理
 */

import { useLocalStorage } from '@vueuse/core'
import { toast } from 'vue-sonner'
import type {
  RecordResponse,
  RecordCreateRequest,
  RecordUpdateRequest,
  PropertyDefinitionDto,
  RecordListParams
} from '../types'
import type { DefaultViewSettings, ViewPreferences } from '../ui-types/settings'
import { DEFAULT_VIEW_PREFERENCES } from '../ui-types/settings'
import { 
  parseTableSettings, 
  getActiveViewSettings,
  resetToDefaultView,
  createCustomViewPreferences
} from '../utils/settings'

interface UseRecordListOptions {
  pageSize?: number
  initialSortBy?: string | null
  initialSortOrder?: 'asc' | 'desc'
  autoLoad?: boolean
}

export const useRecordList = (
  tableId: MaybeRef<string>,
  properties: MaybeRef<Record<string, PropertyDefinitionDto>>,
  options: UseRecordListOptions = {}
) => {
  const {
    pageSize = 50,
    // initialSortBy = null as string | null, // Not used - using activeSettings instead
    // initialSortOrder = 'desc', // Not used - using activeSettings instead
    autoLoad = true
  } = options

  const id = toRef(tableId)
  const props = toRef(properties)
  const table = useTable()
  const { t } = useI18n()

  // ===== State Management =====
  const records = ref<RecordResponse[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const hasMore = ref(true)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // テーブル設定情報を取得してデフォルトビュー設定を取得
  const { data: tableData } = useAsyncData(
    `table-settings-${id.value}`,
    () => table.getTable(id.value),
    { 
      server: false,
      lazy: true 
    }
  )
  
  // デフォルトビュー設定を取得 (型安全な実装)
  // const defaultView = computed<DefaultViewSettings>(() => {
  //   const tableSettings = parseTableSettings(tableData.value?.settings)
  //   return tableSettings.defaultView || {
  //     sortBy: '_updatedAt',
  //     sortOrder: 'desc',
  //     showSystemColumns: false,
  //     density: 'normal'
  //   }
  // })

  // View preferences (persisted) - SSR-safe initialization
  const viewPreferences = useLocalStorage<ViewPreferences>(`table-${id.value}-view`, DEFAULT_VIEW_PREFERENCES)
  
  // 利用可能なカラム一覧
  const availableColumns = computed(() => {
    if (!props.value) return []
    return Object.keys(props.value)
  })

  // 実際に使用する設定 (型安全な実装)
  const activeSettings = computed<DefaultViewSettings>(() => {
    const tableSettings = parseTableSettings(tableData.value?.settings)
    return getActiveViewSettings(tableSettings, viewPreferences.value, availableColumns.value)
  })

  // Filter state
  const filters = ref<Record<string, unknown>>({})
  const searchQuery = ref('')

  // Selection state
  const selectedRecordIds = ref<Set<string>>(new Set())
  const isAllSelected = computed(() => 
    records.value.length > 0 && 
    records.value.every(r => !r.id || selectedRecordIds.value.has(r.id))
  )

  // ===== Computed Properties =====
  const visibleColumns = computed(() => {
    if (!props.value) return []
    const userColumns = Object.keys(props.value)
    const settings = activeSettings.value
    
    // デフォルトビューで指定されたカラムのみ表示
    if (settings.visibleColumns) {
      return settings.visibleColumns.filter(col => 
        userColumns.includes(col) || 
        (settings.showSystemColumns && ['_createdAt', '_updatedAt'].includes(col))
      )
    }
    
    // 指定がなければ全カラム表示（システムカラムは設定次第）
    return [
      ...userColumns,
      ...(settings.showSystemColumns ? ['_createdAt', '_updatedAt'] : [])
    ]
  })

  const filteredRecords = computed(() => {
    let result = [...records.value]

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(record => {
        if (!record.data) return false
        return Object.entries(record.data).some(([key, value]) => {
          if (!visibleColumns.value.includes(key)) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }

    // Apply column filters
    Object.entries(filters.value).forEach(([key, filterValue]) => {
      if (filterValue === null || filterValue === undefined) return
      
      result = result.filter(record => {
        if (!record.data) return false
        const recordValue = record.data[key]
        
        // Handle different filter types based on property type
        const propertyDef = props.value[key]
        if (!propertyDef) return true

        switch (propertyDef.type) {
          case 'text':
          case 'long_text':
          case 'email':
          case 'url':
            return String(recordValue || '').toLowerCase()
              .includes(String(filterValue).toLowerCase())
          
          case 'number':
            return Number(recordValue) === Number(filterValue)
          
          case 'date':
          case 'datetime':
            // Compare dates (simplified - could be enhanced)
            return new Date(recordValue as string).toDateString() === 
                   new Date(filterValue as string).toDateString()
          
          case 'checkbox':
            return Boolean(recordValue) === Boolean(filterValue)
          
          case 'select':
          case 'multi_select':
            if (Array.isArray(filterValue)) {
              return filterValue.includes(recordValue)
            }
            return recordValue === filterValue
          
          default:
            return true
        }
      })
    })

    return result
  })

  const sortedRecords = computed(() => {
    const sorted = [...filteredRecords.value]
    const { sortBy, sortOrder } = activeSettings.value

    if (!sortBy) return sorted

    sorted.sort((a, b) => {
      // アンダースコアで始まるカラムはメタデータ
      const isMetadata = sortBy.startsWith('_')
      const metadataKey = isMetadata ? sortBy.substring(1) : null
      
      const aVal = isMetadata && metadataKey
        ? a[metadataKey as keyof RecordResponse]
        : a.data?.[sortBy]
      const bVal = isMetadata && metadataKey
        ? b[metadataKey as keyof RecordResponse]
        : b.data?.[sortBy]

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? -1 : 1
      if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? 1 : -1

      // Compare based on type
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  })

  // ===== Data Loading =====
  const loadRecords = async (page = 1, append = false) => {
    if (loading.value) return
    
    loading.value = true
    error.value = null

    try {
      const params: RecordListParams = {
        page,
        pageSize,
        sortBy: activeSettings.value.sortBy || undefined,
        sortOrder: activeSettings.value.sortOrder,
        filter: filters.value
      }

      const response = await table.listRecords(id.value, params)
      
      if (append) {
        records.value = [...records.value, ...(response.records || [])]
      } else {
        records.value = response.records || []
      }

      totalCount.value = response.totalCount || 0
      currentPage.value = page
      hasMore.value = records.value.length < totalCount.value
    } catch (err) {
      error.value = err as Error
      toast.error(t('modules.table.record.messages.loadError'))
      console.error('Failed to load records:', err)
    } finally {
      loading.value = false
    }
  }

  const loadMore = async () => {
    if (!hasMore.value || loading.value) return
    await loadRecords(currentPage.value + 1, true)
  }

  const refresh = () => loadRecords(1, false)

  // ===== CRUD Operations =====
  const createRecord = async (data: RecordCreateRequest) => {
    try {
      const newRecord = await table.createRecord(data)
      records.value = [newRecord, ...records.value]
      totalCount.value++
      toast.success(t('modules.table.record.messages.created'))
      return newRecord
    } catch (err) {
      console.error('Failed to create record:', err)
      toast.error(t('modules.table.record.messages.createError'))
      throw err
    }
  }

  const updateRecord = async (recordId: string, data: RecordUpdateRequest) => {
    try {
      const updated = await table.updateRecord(recordId, data)
      const index = records.value.findIndex(r => r.id === recordId)
      if (index >= 0) {
        records.value[index] = updated
      }
      toast.success(t('modules.table.record.messages.updated'))
      return updated
    } catch (err) {
      console.error('Failed to update record:', err)
      toast.error(t('modules.table.record.messages.updateError'))
      throw err
    }
  }

  const deleteRecord = async (recordId: string) => {
    try {
      await table.deleteRecord(recordId)
      records.value = records.value.filter(r => r.id !== recordId)
      selectedRecordIds.value.delete(recordId)
      totalCount.value--
      toast.success(t('modules.table.record.messages.deleted'))
    } catch (err) {
      console.error('Failed to delete record:', err)
      toast.error(t('modules.table.record.messages.deleteError'))
      throw err
    }
  }

  // ===== Batch Operations =====
  const deleteSelected = async () => {
    if (selectedRecordIds.value.size === 0) return

    try {
      const ids = Array.from(selectedRecordIds.value)
      await table.deleteRecordsBatch(ids)
      
      records.value = records.value.filter(r => !r.id || !selectedRecordIds.value.has(r.id))
      totalCount.value -= ids.length
      selectedRecordIds.value.clear()
      
      toast.success(t('modules.table.record.messages.batchDeleted', { count: ids.length }))
    } catch (err) {
      console.error('Failed to delete records:', err)
      toast.error(t('modules.table.record.messages.batchDeleteError'))
      throw err
    }
  }

  const duplicateSelected = async () => {
    if (selectedRecordIds.value.size === 0) return

    try {
      const recordsToDuplicate = records.value
        .filter(r => r.id && selectedRecordIds.value.has(r.id))
        .map(r => ({
          tableId: r.tableId || id.value,
          data: r.data || {}
        }))

      const duplicated = await table.createRecordsBatch(recordsToDuplicate)
      records.value = [...duplicated, ...records.value]
      totalCount.value += duplicated.length
      selectedRecordIds.value.clear()

      toast.success(t('modules.table.record.messages.batchDuplicated', { count: duplicated.length }))
      return duplicated
    } catch (err) {
      console.error('Failed to duplicate records:', err)
      toast.error(t('modules.table.record.messages.batchDuplicateError'))
      throw err
    }
  }

  // ===== Selection Management =====
  const toggleRecordSelection = (recordId: string) => {
    if (selectedRecordIds.value.has(recordId)) {
      selectedRecordIds.value.delete(recordId)
    } else {
      selectedRecordIds.value.add(recordId)
    }
  }

  const toggleAllSelection = () => {
    if (isAllSelected.value) {
      selectedRecordIds.value.clear()
    } else {
      records.value.forEach(r => {
        if (r.id) selectedRecordIds.value.add(r.id)
      })
    }
  }

  const clearSelection = () => {
    selectedRecordIds.value.clear()
  }

  // ===== View Management =====
  const ensureCustomSettings = () => {
    if (viewPreferences.value.useDefault) {
      viewPreferences.value = createCustomViewPreferences(activeSettings.value)
    }
  }

  const toggleColumnVisibility = (columnKey: string) => {
    ensureCustomSettings()
    if (!viewPreferences.value.customSettings) return
    
    const visibleCols = viewPreferences.value.customSettings.visibleColumns || Object.keys(props.value)
    const index = visibleCols.indexOf(columnKey)
    
    if (index >= 0) {
      viewPreferences.value.customSettings.visibleColumns = visibleCols.filter(c => c !== columnKey)
    } else {
      viewPreferences.value.customSettings.visibleColumns = [...visibleCols, columnKey]
    }
  }

  const setColumnWidth = (columnKey: string, width: number) => {
    // Column width is stored separately in the future
    console.log('[View] Setting column width:', columnKey, width)
  }

  const setSortBy = (columnKey: string) => {
    ensureCustomSettings()
    if (!viewPreferences.value.customSettings) return
    
    if (viewPreferences.value.customSettings.sortBy === columnKey) {
      // Toggle sort order if same column
      viewPreferences.value.customSettings.sortOrder = 
        viewPreferences.value.customSettings.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      viewPreferences.value.customSettings.sortBy = columnKey
      viewPreferences.value.customSettings.sortOrder = 'asc'
    }
  }

  const setDensity = (density: 'compact' | 'normal' | 'comfortable') => {
    ensureCustomSettings()
    if (!viewPreferences.value.customSettings) return
    viewPreferences.value.customSettings.density = density
  }
  
  const resetToDefault = () => {
    viewPreferences.value = resetToDefaultView()
  }

  // ===== Filtering =====
  const setFilter = (columnKey: string, value: unknown) => {
    if (value === null || value === undefined || value === '') {
      Reflect.deleteProperty(filters.value, columnKey)
    } else {
      filters.value[columnKey] = value
    }
  }

  const clearFilters = () => {
    filters.value = {}
    searchQuery.value = ''
  }

  // ===== Export =====
  const exportRecords = async (format: 'csv' | 'json' | 'excel' = 'csv') => {
    try {
      // Implementation would depend on backend support
      toast.info(t('modules.table.record.messages.exportStarted'))
      
      // For now, client-side CSV export
      if (format === 'csv') {
        const csvContent = convertToCSV(sortedRecords.value, visibleColumns.value)
        downloadFile(csvContent, `records-${id.value}.csv`, 'text/csv')
        toast.success(t('modules.table.record.messages.exported'))
      } else {
        toast.info(t('foundation.messages.info.comingSoon'))
      }
    } catch (err) {
      console.error('Failed to export records:', err)
      toast.error(t('modules.table.record.messages.exportError'))
    }
  }

  // ===== Initial Load =====
  if (autoLoad) {
    onMounted(() => {
      loadRecords()
    })
  }

  return {
    // Data
    records: sortedRecords,
    totalCount: readonly(totalCount),
    loading: readonly(loading),
    error: readonly(error),
    hasMore: readonly(hasMore),

    // View state
    viewPreferences: readonly(viewPreferences),
    activeSettings: readonly(activeSettings),
    visibleColumns: readonly(visibleColumns),
    searchQuery,
    filters: readonly(filters),

    // Selection
    selectedRecordIds,
    isAllSelected: readonly(isAllSelected),

    // Actions
    loadRecords,
    loadMore,
    refresh,
    createRecord,
    updateRecord,
    deleteRecord,

    // Batch operations
    deleteSelected,
    duplicateSelected,

    // Selection management
    toggleRecordSelection,
    toggleAllSelection,
    clearSelection,

    // View management
    toggleColumnVisibility,
    setColumnWidth,
    setSortBy,
    setDensity,
    resetToDefault,

    // Filtering
    setFilter,
    clearFilters,

    // Export
    exportRecords
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