/**
 * useRecordData Composable
 * データ取得とCRUD操作のみに責任を持つ
 */

import { toast } from 'vue-sonner'
import type {
  RecordResponse,
  RecordCreateRequest,
  RecordUpdateRequest,
  RecordListParams
} from '../../types'

interface UseRecordDataOptions {
  pageSize?: number
  autoLoad?: boolean
}

export const useRecordData = (
  tableId: MaybeRef<string>,
  options: UseRecordDataOptions = {}
) => {
  const {
    pageSize = 50,
    autoLoad = true
  } = options

  const id = toRef(tableId)
  const table = useTable()
  const { t } = useI18n()

  // ===== State Management =====
  const records = ref<RecordResponse[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const hasMore = ref(true)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // ===== Data Loading =====
  const loadRecords = async (params: RecordListParams = {}, append = false) => {
    if (loading.value) return
    
    loading.value = true
    error.value = null

    try {
      const requestParams: RecordListParams = {
        page: params.page || 1,
        pageSize,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder || 'desc',
        filter: params.filter
      }

      const response = await table.listRecords(id.value, requestParams)
      
      if (append) {
        records.value = [...records.value, ...(response.records || [])]
      } else {
        records.value = response.records || []
      }

      totalCount.value = response.totalCount || 0
      currentPage.value = requestParams.page || 1
      hasMore.value = records.value.length < totalCount.value
    } catch (err) {
      error.value = err as Error
      toast.error(t('modules.table.record.messages.loadError'))
      console.error('Failed to load records:', err)
    } finally {
      loading.value = false
    }
  }

  const loadMore = async (params: RecordListParams = {}) => {
    if (!hasMore.value || loading.value) return
    const nextPage = currentPage.value + 1
    await loadRecords({ ...params, page: nextPage }, true)
  }

  const refresh = (params: RecordListParams = {}) => {
    return loadRecords({ ...params, page: 1 }, false)
  }

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
      totalCount.value--
      toast.success(t('modules.table.record.messages.deleted'))
    } catch (err) {
      console.error('Failed to delete record:', err)
      toast.error(t('modules.table.record.messages.deleteError'))
      throw err
    }
  }

  // ===== Batch Operations =====
  const createRecordsBatch = async (recordsData: RecordCreateRequest[]) => {
    try {
      const duplicated = await table.createRecordsBatch(recordsData)
      records.value = [...duplicated, ...records.value]
      totalCount.value += duplicated.length
      toast.success(t('modules.table.record.messages.batchDuplicated', { count: duplicated.length }))
      return duplicated
    } catch (err) {
      console.error('Failed to create records:', err)
      toast.error(t('modules.table.record.messages.batchDuplicateError'))
      throw err
    }
  }

  const deleteRecordsBatch = async (ids: string[]) => {
    if (ids.length === 0) return

    try {
      await table.deleteRecordsBatch(ids)
      records.value = records.value.filter(r => !r.id || !ids.includes(r.id))
      totalCount.value -= ids.length
      toast.success(t('modules.table.record.messages.batchDeleted', { count: ids.length }))
    } catch (err) {
      console.error('Failed to delete records:', err)
      toast.error(t('modules.table.record.messages.batchDeleteError'))
      throw err
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
    records,
    totalCount,
    currentPage,
    hasMore,
    loading,
    error,

    // Actions
    loadRecords,
    loadMore,
    refresh,
    createRecord,
    updateRecord,
    deleteRecord,

    // Batch operations
    createRecordsBatch,
    deleteRecordsBatch
  }
}