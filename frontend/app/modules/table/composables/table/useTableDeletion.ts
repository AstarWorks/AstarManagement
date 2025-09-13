/**
 * useTableDeletion Composable
 * テーブルの削除処理を管理するComposable
 */

import { toast } from 'vue-sonner'
import type { TableResponse } from '../../types'

export const useTableDeletion = (onRefresh?: () => Promise<void>) => {
  const { t } = useI18n()
  const table = useTable()
  
  const deleteDialogOpen = ref(false)
  const deletingTable = ref<TableResponse | null>(null)
  const isDeleting = ref(false)
  
  const openDeleteDialog = (tableData: TableResponse) => {
    deletingTable.value = tableData
    deleteDialogOpen.value = true
  }
  
  const closeDeleteDialog = () => {
    deleteDialogOpen.value = false
    deletingTable.value = null
  }
  
  const confirmDelete = async () => {
    if (!deletingTable.value?.id) return
    
    isDeleting.value = true
    try {
      await table.deleteTable(deletingTable.value.id)
      toast.success(t('modules.table.messages.deleted'))
      closeDeleteDialog()
      await onRefresh?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(t('modules.table.messages.deleteError'))
    } finally {
      isDeleting.value = false
    }
  }
  
  const batchDelete = async (ids: string[]): Promise<{ successCount: number; errors: string[] }> => {
    const errors: string[] = []
    let successCount = 0
    
    for (const id of ids) {
      try {
        await table.deleteTable(id)
        successCount++
      } catch (error) {
        errors.push(id)
      }
    }
    
    if (successCount > 0) {
      toast.success(t('modules.table.messages.batchDeleted', { count: successCount }))
      await onRefresh?.()
    }
    
    if (errors.length > 0) {
      toast.error(t('modules.table.messages.batchDeleteError'))
    }
    
    return { successCount, errors }
  }
  
  return {
    deleteDialogOpen: readonly(deleteDialogOpen),
    deletingTable: readonly(deletingTable),
    isDeleting: readonly(isDeleting),
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    batchDelete
  }
}