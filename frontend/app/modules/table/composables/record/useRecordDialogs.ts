/**
 * useRecordDialogs Composable
 * ダイアログ状態管理のみに責任を持つ
 */

import type { RecordResponse } from '../../types'

interface DialogState {
  create: boolean
  edit: boolean
  view: boolean
  delete: boolean
}

export const useRecordDialogs = () => {
  // ===== State Management =====
  const dialogs = ref<DialogState>({
    create: false,
    edit: false,
    view: false,
    delete: false
  })

  const selectedRecord = ref<RecordResponse | null>(null)
  const deleteType = ref<'single' | 'batch'>('single')
  const recordsToDelete = ref<RecordResponse[]>([])

  // ===== Methods =====
  const openCreateDialog = () => {
    dialogs.value.create = true
    selectedRecord.value = null
  }

  const openEditDialog = (record: RecordResponse) => {
    selectedRecord.value = record
    dialogs.value.edit = true
  }

  const openViewDialog = (record: RecordResponse) => {
    selectedRecord.value = record
    dialogs.value.view = true
  }

  const openDeleteDialog = (record: RecordResponse) => {
    selectedRecord.value = record
    recordsToDelete.value = [record]
    deleteType.value = 'single'
    dialogs.value.delete = true
  }

  const openBatchDeleteDialog = (records: RecordResponse[]) => {
    selectedRecord.value = null
    recordsToDelete.value = records
    deleteType.value = 'batch'
    dialogs.value.delete = true
  }

  const closeDialog = (dialogType: keyof DialogState) => {
    dialogs.value[dialogType] = false
    if (dialogType === 'delete') {
      recordsToDelete.value = []
      deleteType.value = 'single'
    }
    // selectedRecord is kept for potential reopening
  }

  const closeAllDialogs = () => {
    Object.keys(dialogs.value).forEach(key => {
      dialogs.value[key as keyof DialogState] = false
    })
    selectedRecord.value = null
    recordsToDelete.value = []
    deleteType.value = 'single'
  }

  const isDialogOpen = (dialogType: keyof DialogState) => {
    return dialogs.value[dialogType]
  }

  // ===== Event Handlers =====
  const handleCreateSuccess = (record?: RecordResponse) => {
    closeDialog('create')
    // Emit or callback to parent for refresh
    return record
  }

  const handleEditSuccess = (record?: RecordResponse) => {
    closeDialog('edit')
    // Record is already updated in the list via the composable
    return record
  }

  const handleDeleteConfirm = async (
    deleteCallback: () => Promise<void>
  ) => {
    try {
      await deleteCallback()
      closeDialog('delete')
    } catch (err) {
      // Error already handled in the callback
      console.error('Delete operation failed:', err)
    }
  }

  // ===== Computed Properties =====
  const deleteMessage = computed(() => {
    const { t } = useI18n()
    if (deleteType.value === 'batch') {
      return t('modules.table.record.delete.batchDescription', { 
        count: recordsToDelete.value.length 
      })
    }
    return t('modules.table.record.delete.description')
  })

  const hasOpenDialog = computed(() => {
    return Object.values(dialogs.value).some(open => open)
  })

  return {
    // State
    dialogs,
    selectedRecord,
    deleteType,
    recordsToDelete,

    // Computed
    deleteMessage,
    hasOpenDialog,

    // Methods
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    openDeleteDialog,
    openBatchDeleteDialog,
    closeDialog,
    closeAllDialogs,
    isDialogOpen,

    // Event handlers
    handleCreateSuccess,
    handleEditSuccess,
    handleDeleteConfirm
  }
}