import { ref } from 'vue'
import { useToast } from '~/composables/useToast'
import { useDocumentOrganizationStore } from '~/stores/documentOrganization'
import type { BatchOperation } from '~/types/folder'

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

interface FolderSelectorOptions {
  title: string
  description?: string
  excludeFolders?: string[]
  allowRoot?: boolean
}

export function useBatchOperations() {
  const documentsStore = useDocumentOrganizationStore()
  const { toast } = useToast()
  
  // State for modals
  const showConfirmDialog = ref(false)
  const showFolderSelector = ref(false)
  const confirmOptions = ref<ConfirmOptions | null>(null)
  const folderSelectorOptions = ref<FolderSelectorOptions | null>(null)
  const confirmResolver = ref<((value: boolean) => void) | null>(null)
  const folderSelectorResolver = ref<((value: string | null) => void) | null>(null)
  
  // Confirmation dialog
  async function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      confirmOptions.value = options
      confirmResolver.value = resolve
      showConfirmDialog.value = true
    })
  }
  
  function handleConfirm(value: boolean) {
    showConfirmDialog.value = false
    if (confirmResolver.value) {
      confirmResolver.value(value)
      confirmResolver.value = null
    }
    confirmOptions.value = null
  }
  
  // Folder selector
  async function selectFolder(options: FolderSelectorOptions): Promise<string | null> {
    return new Promise((resolve) => {
      folderSelectorOptions.value = options
      folderSelectorResolver.value = resolve
      showFolderSelector.value = true
    })
  }
  
  function handleFolderSelect(folderId: string | null) {
    showFolderSelector.value = false
    if (folderSelectorResolver.value) {
      folderSelectorResolver.value(folderId)
      folderSelectorResolver.value = null
    }
    folderSelectorOptions.value = null
  }
  
  // Batch operations
  async function confirmBatchDelete(items: string[]) {
    const itemCount = items.length
    const itemText = itemCount === 1 ? 'item' : 'items'
    
    const confirmed = await confirm({
      title: `Delete ${itemCount} ${itemText}?`,
      description: `Are you sure you want to delete ${itemCount} ${itemText}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    })
    
    if (confirmed) {
      try {
        await documentsStore.startBatchOperation('delete', items)
        await documentsStore.executeBatchOperation()
        
        toast({
          title: 'Items deleted',
          description: `Successfully deleted ${itemCount} ${itemText}`,
          variant: 'default'
        })
      } catch (error) {
        toast({
          title: 'Delete failed',
          description: error instanceof Error ? error.message : 'Failed to delete items',
          variant: 'error'
        })
      }
    }
  }
  
  async function batchMove(items: string[]) {
    const targetFolderId = await selectFolder({
      title: 'Move Items',
      description: `Select a destination folder for ${items.length} item(s)`,
      excludeFolders: items.filter(id => documentsStore.isFolder(id)),
      allowRoot: true
    })
    
    if (targetFolderId !== null) {
      try {
        await documentsStore.startBatchOperation('move', items)
        documentsStore.batchOperation!.targetFolderId = targetFolderId
        await documentsStore.executeBatchOperation()
        
        const itemCount = items.length
        const itemText = itemCount === 1 ? 'item' : 'items'
        
        toast({
          title: 'Items moved',
          description: `Successfully moved ${itemCount} ${itemText}`,
          variant: 'default'
        })
      } catch (error) {
        toast({
          title: 'Move failed',
          description: error instanceof Error ? error.message : 'Failed to move items',
          variant: 'error'
        })
      }
    }
  }
  
  async function batchDownload(items: string[]) {
    const documentIds = items.filter(id => !documentsStore.isFolder(id))
    
    if (documentIds.length === 0) {
      toast({
        title: 'No documents selected',
        description: 'Please select at least one document to download',
        variant: 'error'
      })
      return
    }
    
    try {
      await documentsStore.startBatchOperation('download', documentIds)
      await documentsStore.executeBatchOperation()
      
      // In a real app, this would trigger file downloads
      toast({
        title: 'Download started',
        description: `Downloading ${documentIds.length} document(s)...`,
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download documents',
        variant: 'error'
      })
    }
  }
  
  async function batchTag(items: string[]) {
    const documentIds = items.filter(id => !documentsStore.isFolder(id))
    
    if (documentIds.length === 0) {
      toast({
        title: 'No documents selected',
        description: 'Please select at least one document to tag',
        variant: 'error'
      })
      return
    }
    
    // TODO: Show tag selector dialog
    const tags = ['important', 'review'] // Mock tags
    
    try {
      await documentsStore.startBatchOperation('tag', documentIds)
      documentsStore.batchOperation!.tags = tags
      await documentsStore.executeBatchOperation()
      
      toast({
        title: 'Tags added',
        description: `Added ${tags.length} tag(s) to ${documentIds.length} document(s)`,
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Tagging failed',
        description: error instanceof Error ? error.message : 'Failed to add tags',
        variant: 'error'
      })
    }
  }
  
  async function batchShare(items: string[]) {
    // TODO: Show share dialog
    toast({
      title: 'Share feature',
      description: 'Document sharing will be implemented in a future update',
      variant: 'default'
    })
  }
  
  async function exportList(items: string[], format: 'csv' | 'json' = 'csv') {
    try {
      // In a real app, this would generate and download the export file
      const itemCount = items.length
      const itemText = itemCount === 1 ? 'item' : 'items'
      
      toast({
        title: 'Export started',
        description: `Exporting ${itemCount} ${itemText} as ${format.toUpperCase()}...`,
        variant: 'default'
      })
      
      // Mock export
      setTimeout(() => {
        toast({
          title: 'Export complete',
          description: `Successfully exported ${itemCount} ${itemText}`,
          variant: 'default'
        })
      }, 1000)
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export list',
        variant: 'error'
      })
    }
  }
  
  return {
    // State
    showConfirmDialog,
    showFolderSelector,
    confirmOptions,
    folderSelectorOptions,
    
    // Handlers
    handleConfirm,
    handleFolderSelect,
    
    // Operations
    confirmBatchDelete,
    batchMove,
    batchDownload,
    batchTag,
    batchShare,
    exportList
  }
}