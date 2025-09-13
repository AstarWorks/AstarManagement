/**
 * テーブル操作のComposable
 * Repository層を活用した実装
 */

import { useTableRepository } from '~/modules/table/repositories'
import type {
  TableResponse,
  TableCreateRequest,
  TableUpdateRequest,
  RecordResponse,
  RecordCreateRequest,
  RecordUpdateRequest,
  RecordListParams,
  PropertyAddRequest,
  PropertyUpdateRequest
} from '~/modules/table/types'

export const useTable = () => {
  // Repository取得（Mock/Real自動切り替え）
  const repository = useTableRepository()
  
  // テーブル操作
  const listTables = (workspaceId: string) => repository.listTables(workspaceId)
  const getTable = (id: string) => repository.getTable(id)
  const createTable = (data: TableCreateRequest) => repository.createTable(data)
  const updateTable = (id: string, data: TableUpdateRequest) => repository.updateTable(id, data)
  const deleteTable = (id: string) => repository.deleteTable(id)
  
  // プロパティ操作
  const addProperty = (tableId: string, property: PropertyAddRequest) => repository.addProperty(tableId, property)
  const updateProperty = (tableId: string, key: string, data: PropertyUpdateRequest) => repository.updateProperty(tableId, key, data)
  const removeProperty = (tableId: string, key: string) => repository.removeProperty(tableId, key)
  
  // レコード操作
  const listRecords = (tableId: string, params?: RecordListParams) => repository.listRecords(tableId, params)
  const getRecord = (id: string) => repository.getRecord(id)
  const createRecord = (data: RecordCreateRequest) => repository.createRecord(data)
  const updateRecord = (id: string, data: RecordUpdateRequest) => repository.updateRecord(id, data)
  const deleteRecord = (id: string) => repository.deleteRecord(id)
  
  // バッチ操作
  const createRecordsBatch = (records: RecordCreateRequest[]) => repository.createRecordsBatch(records)
  const updateRecordsBatch = (updates: Array<{ id: string; data: RecordUpdateRequest }>) => repository.updateRecordsBatch(updates)
  const deleteRecordsBatch = (ids: string[]) => repository.deleteRecordsBatch(ids)
  
  return {
    // テーブル操作
    listTables,
    getTable,
    createTable,
    updateTable,
    deleteTable,
    
    // プロパティ操作
    addProperty,
    updateProperty,
    removeProperty,
    
    // レコード操作
    listRecords,
    getRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    
    // バッチ操作
    createRecordsBatch,
    updateRecordsBatch,
    deleteRecordsBatch
  }
}

/**
 * リアクティブなテーブルデータ管理
 * Repository経由でのデータ取得
 */
export const useTableData = (tableId: MaybeRef<string>) => {
  const id = toRef(tableId)
  const repository = useTableRepository()
  
  // テーブル情報の取得
  const { 
    data: table, 
    pending: tablePending, 
    refresh: refreshTable,
    error: tableError 
  } = useAsyncData(
    `table-${id.value}`,
    () => repository.getTable(id.value),
    {
      watch: [id]
    }
  )
  
  // レコード一覧の取得
  const { 
    data: records, 
    pending: recordsPending, 
    refresh: refreshRecords,
    error: recordsError
  } = useAsyncData(
    `table-records-${id.value}`,
    async () => {
      const response = await repository.listRecords(id.value)
      return response.records
    },
    {
      watch: [id]
    }
  )
  
  // データのリフレッシュ
  const refresh = async () => {
    await Promise.all([
      refreshTable(),
      refreshRecords()
    ])
  }
  
  return {
    table: readonly(table),
    records: readonly(records),
    pending: computed(() => tablePending.value || recordsPending.value),
    error: computed(() => tableError.value || recordsError.value),
    refresh
  }
}