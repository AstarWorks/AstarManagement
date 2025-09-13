/**
 * useTableDetail Composable
 * テーブル詳細情報の管理と操作
 */

import { toast } from 'vue-sonner'
import { useWorkspaceNavigation } from '~/composables/useWorkspaceNavigation'
import type {
  TableResponse,
  TableUpdateRequest,
  PropertyAddRequest,
  PropertyUpdateRequest
} from '../types'

export const useTableDetail = (tableId: MaybeRef<string>) => {
  const id = toRef(tableId)
  const table = useTable()
  const { t } = useI18n()
  
  // ===== Data Fetching =====
  const {
    data: tableData,
    pending,
    error,
    refresh
  } = useAsyncData<TableResponse>(
    `table-detail-${id.value}`,
    () => table.getTable(id.value),
    {
      watch: [id],
      immediate: true,
      // Use lazy loading to handle SSR/CSR gracefully
      lazy: true
    }
  )
  
  // ===== Computed Properties =====
  const properties = computed(() => tableData.value?.properties || {})
  
  const orderedProperties = computed(() => {
    if (tableData.value?.orderedProperties?.length) {
      return tableData.value.orderedProperties
    }
    // Fallback: プロパティキーをソート
    return Object.keys(properties.value).sort()
  })
  
  const visibleProperties = computed(() => {
    return orderedProperties.value
      .filter(key => typeof key === 'string' && key in properties.value)
      .map(key => {
        const prop = properties.value[key as string]
        return {
          key,
          ...prop
        }
      })
      .filter(prop => prop !== null && prop !== undefined)
  })
  
  // 統計情報
  const stats = computed(() => ({
    recordCount: 0, // TODO: 実際のレコード数を取得
    propertyCount: Object.keys(properties.value).length,
    createdAt: tableData.value?.createdAt,
    updatedAt: tableData.value?.updatedAt
  }))
  
  // タブ状態管理 - URLクエリパラメータと同期
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref((route.query.tab as string) || 'records')
  
  // タブ変更時にURLを更新
  watch(activeTab, (newTab) => {
    if (newTab !== (route.query.tab || 'records')) {
      router.push({
        path: route.path,
        query: { ...route.query, tab: newTab }
      })
    }
  })
  
  // ワークスペース情報をグローバル状態で共有
  const { setTableInfo } = useWorkspaceNavigation()
  
  // テーブルデータが読み込まれた時にワークスペース情報を更新
  watch(tableData, (table) => {
    if (table?.id && table.workspaceId) {
      setTableInfo({
        id: table.id,
        name: table.name,
        workspaceId: table.workspaceId
      })
    }
  }, { immediate: true })
  
  // ===== Actions =====
  
  /**
   * テーブル情報を更新
   */
  const updateTable = async (data: TableUpdateRequest) => {
    try {
      const result = await table.updateTable(id.value, data)
      await refresh()
      toast.success(t('modules.table.messages.updated'))
      return result
    } catch (error) {
      console.error('Failed to update table:', error)
      toast.error(t('modules.table.messages.updateError'))
      throw error
    }
  }
  
  /**
   * テーブルを削除
   */
  const deleteTable = async () => {
    try {
      await table.deleteTable(id.value)
      toast.success(t('modules.table.messages.deleted'))
      
      // テーブル削除後は元のワークスペースのtablesタブに戻る
      const workspaceId = tableData.value?.workspaceId
      if (workspaceId) {
        await navigateTo(`/workspaces/${workspaceId}?tab=tables`)
      } else {
        await navigateTo('/workspaces')
      }
    } catch (error) {
      console.error('Failed to delete table:', error)
      toast.error(t('modules.table.messages.deleteError'))
      throw error
    }
  }
  
  /**
   * プロパティを追加
   */
  const addProperty = async (property: PropertyAddRequest) => {
    try {
      const result = await table.addProperty(id.value, property)
      await refresh()
      toast.success(t('modules.table.property.messages.added'))
      return result
    } catch (error) {
      console.error('Failed to add property:', error)
      toast.error(t('modules.table.property.messages.addError'))
      throw error
    }
  }
  
  /**
   * プロパティを更新
   */
  const updateProperty = async (key: string, data: PropertyUpdateRequest) => {
    try {
      const result = await table.updateProperty(id.value, key, data)
      await refresh()
      toast.success(t('modules.table.property.messages.updated'))
      return result
    } catch (error) {
      console.error('Failed to update property:', error)
      toast.error(t('modules.table.property.messages.updateError'))
      throw error
    }
  }
  
  /**
   * プロパティを削除
   */
  const removeProperty = async (key: string) => {
    try {
      const result = await table.removeProperty(id.value, key)
      await refresh()
      toast.success(t('modules.table.property.messages.removed'))
      return result
    } catch (error) {
      console.error('Failed to remove property:', error)
      toast.error(t('modules.table.property.messages.removeError'))
      throw error
    }
  }
  
  /**
   * プロパティの順序を変更
   */
  const reorderProperties = async (orderedKeys: string[]) => {
    try {
      // propertyOrderフィールドを更新
      const result = await updateTable({
        propertyOrder: orderedKeys
      })
      toast.success(t('modules.table.property.messages.reordered'))
      return result
    } catch (error) {
      console.error('Failed to reorder properties:', error)
      toast.error(t('modules.table.property.messages.reorderError'))
      throw error
    }
  }
  
  /**
   * テーブルを複製
   */
  const duplicateTable = async () => {
    if (!tableData.value?.workspaceId) {
      throw new Error('Workspace ID is required for table duplication')
    }
    
    try {
      const newTable = await table.createTable({
        workspaceId: tableData.value.workspaceId,
        name: `${tableData.value?.name} (Copy)`,
        description: tableData.value?.description,
        properties: Object.entries(properties.value).map(([key, prop]) => ({
          key,
          type: prop.type,
          displayName: prop.displayName,
          required: prop.required || false,
          config: prop.config
        }))
      })
      toast.success(t('modules.table.messages.duplicated'))
      await navigateTo(`/tables/${newTable.id}`)
      return newTable
    } catch (error) {
      console.error('Failed to duplicate table:', error)
      toast.error(t('modules.table.messages.duplicateError'))
      throw error
    }
  }
  
  return {
    // Data
    table: readonly(tableData),
    properties: readonly(properties),
    orderedProperties: readonly(orderedProperties),
    visibleProperties: readonly(visibleProperties),
    stats: readonly(stats),
    
    // State
    activeTab,
    pending,
    error,
    
    // Actions
    refresh,
    updateTable,
    deleteTable,
    addProperty,
    updateProperty,
    removeProperty,
    reorderProperties,
    duplicateTable
  }
}