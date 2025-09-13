/**
 * useTableList Composable
 * テーブル一覧の管理とフィルタリング機能を提供
 */

import { useDebounce, useLocalStorage } from '@vueuse/core'
import type { TableListResponse, TableResponse, TableCreateRequest } from '../types'

export const useTableList = (workspaceId: MaybeRef<string>) => {
  const table = useTable()
  const id = toRef(workspaceId)
  
  console.log('[useTableList] Called with workspaceId:', id.value)
  
  // ===== State Management =====
  // ソート・フィルタ設定をLocalStorageに永続化
  const sortBy = useLocalStorage<'name' | 'createdAt' | 'updatedAt'>('table-sort-by', 'updatedAt')
  const sortOrder = useLocalStorage<'asc' | 'desc'>('table-sort-order', 'desc')
  const viewMode = useLocalStorage<'card' | 'list'>('table-view-mode', 'card')
  
  // 検索クエリ（デバウンス付き）
  const searchQuery = ref('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  
  // ===== Data Fetching =====
  const { 
    data: tableListResponse, 
    pending: isLoading,
    error: fetchError,
    refresh 
  } = useAsyncData<TableListResponse>(
    `tables-workspace-${id.value}`,
    () => {
      console.log('[useTableList] Fetching tables for:', id.value)
      return table.listTables(id.value)
    },
    {
      watch: [id],
      server: false, // クライアントサイドのみで実行
      immediate: true // 明示的に即座に実行
    }
  )
  
  console.log('[useTableList] Initial state:', {
    pending: isLoading.value,
    data: tableListResponse.value,
    error: fetchError.value
  })
  
  // ===== Computed Properties =====
  const tables = computed(() => tableListResponse.value?.tables || [])
  
  const sortedAndFilteredTables = computed(() => {
    console.log('[useTableList] Computing sortedAndFilteredTables, raw tables:', tables.value?.length)
    if (!tables.value) return []
    
    let result = [...tables.value]
    
    // 検索フィルタリング
    if (debouncedSearchQuery.value) {
      const query = debouncedSearchQuery.value.toLowerCase()
      result = result.filter(table => 
        table.name?.toLowerCase().includes(query) ||
        table.description?.toLowerCase().includes(query)
      )
    }
    
    // ソート処理
    result.sort((a, b) => {
      const aVal = a[sortBy.value as keyof TableResponse] || ''
      const bVal = b[sortBy.value as keyof TableResponse] || ''
      
      // 型ガード: string, number, Date以外の値は無視
      if (typeof aVal !== 'string' && typeof aVal !== 'number' && !(aVal instanceof Date)) return 0
      if (typeof bVal !== 'string' && typeof bVal !== 'number' && !(bVal instanceof Date)) return 0
      
      let compareA: string | number | Date = aVal
      let compareB: string | number | Date = bVal
      
      if (sortBy.value === 'name') {
        compareA = compareA.toString().toLowerCase()
        compareB = compareB.toString().toLowerCase()
      }
      
      const comparison = compareA < compareB ? -1 : compareA > compareB ? 1 : 0
      return sortOrder.value === 'asc' ? comparison : -comparison
    })
    
    console.log('[useTableList] sortedAndFilteredTables result:', result.length)
    return result
  })
  
  // 統計情報
  const stats = computed(() => ({
    total: tables.value?.length || 0,
    filtered: sortedAndFilteredTables.value.length,
    hasRecords: sortedAndFilteredTables.value.filter(t => 'recordCount' in t && typeof t.recordCount === 'number' && t.recordCount > 0).length
  }))
  
  // エラー状態
  const isError = computed(() => Boolean(fetchError.value))
  const error = computed(() => fetchError.value)
  
  // ===== Actions =====
  const createTable = async (data: TableCreateRequest) => {
    const result = await table.createTable(data)
    await refresh()
    return result
  }
  
  const deleteTable = async (tableId: string) => {
    await table.deleteTable(tableId)
    await refresh()
  }
  
  const duplicateTable = async (sourceTable: TableResponse) => {
    const properties = Object.entries(sourceTable.properties || {}).map(([key, prop]) => ({
      key,
      type: prop.type,
      displayName: prop.displayName,
      required: prop.required || false,
      config: prop.config
    }))
    
    const newTable = await table.createTable({
      workspaceId: id.value,
      name: `${sourceTable.name} (Copy)`,
      description: sourceTable.description,
      properties,
      templateName: undefined
    })
    await refresh()
    return newTable
  }
  
  const updateTable = async (tableId: string, data: Partial<TableResponse>) => {
    const result = await table.updateTable(tableId, data)
    await refresh()
    return result
  }
  
  // ソート切り替え
  const toggleSort = (field: typeof sortBy.value) => {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'desc'
    }
  }
  
  return {
    // Data
    tables: readonly(sortedAndFilteredTables),
    stats: readonly(stats),
    
    // State
    isLoading,
    isError,
    error,
    searchQuery,
    sortBy: readonly(sortBy),
    sortOrder: readonly(sortOrder),
    viewMode,
    
    // Actions
    refresh,
    createTable,
    updateTable,
    deleteTable,
    duplicateTable,
    toggleSort
  }
}