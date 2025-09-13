/**
 * useTableDuplication Composable
 * テーブルの複製処理を管理するComposable
 */

import { toast } from 'vue-sonner'
import type { TableResponse, TableCreateRequest } from '../../types'

export const useTableDuplication = (onRefresh?: () => Promise<void>) => {
  const { t } = useI18n()
  const table = useTable()
  
  const isDuplicating = ref(false)
  
  const duplicateTable = async (sourceTable: TableResponse) => {
    if (!sourceTable.id) {
      toast.error(t('modules.table.messages.duplicateError'))
      return
    }
    
    isDuplicating.value = true
    
    try {
      // プロパティを適切な形式に変換
      const properties = Object.entries(sourceTable.properties || {}).map(([key, prop]) => ({
        key,
        type: prop.type,
        displayName: prop.displayName,
        required: prop.required || false,
        config: prop.config
      }))
      
      // 複製用のリクエストデータを作成
      const duplicateRequest: TableCreateRequest = {
        workspaceId: sourceTable.workspaceId || '',
        name: `${sourceTable.name} (Copy)`,
        description: sourceTable.description,
        properties,
        templateName: undefined
      }
      
      await table.createTable(duplicateRequest)
      toast.success(t('modules.table.messages.duplicated'))
      await onRefresh?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(t('modules.table.messages.duplicateError'))
    } finally {
      isDuplicating.value = false
    }
  }
  
  return {
    isDuplicating: readonly(isDuplicating),
    duplicateTable
  }
}