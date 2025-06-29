import { ref, readonly } from 'vue'
import { useToast } from '~/composables/useToast'
import { useDocumentOrganizationStore } from '~/stores/documentOrganization'
import type { DraggedItem } from '~/types/folder'

export function useDocumentDragDrop() {
  const documentsStore = useDocumentOrganizationStore()
  const { toast } = useToast()
  
  // State
  const draggedItems = ref<DraggedItem | null>(null)
  const dragOverFolder = ref<string | null>(null)
  const dragOverDocument = ref<string | null>(null)
  const isDragging = ref(false)
  
  // Validation
  function validateDrop(item: DraggedItem | null, targetFolderId: string): boolean {
    if (!item) return false
    
    // Can't drop into itself
    if (item.type === 'folder' && item.id === targetFolderId) {
      return false
    }
    
    // Can't drop folder into its own children
    if (item.type === 'folder' && typeof item.id === 'string') {
      const targetFolder = documentsStore.findFolderById(targetFolderId)
      if (targetFolder && isChildOfFolder(targetFolder, item.id)) {
        return false
      }
    }
    
    // Check target folder permissions
    const canDrop = documentsStore.canDropInFolder(targetFolderId)
    if (!canDrop) {
      return false
    }
    
    return true
  }
  
  function isChildOfFolder(folder: any, parentId: string): boolean {
    if (folder.parentId === parentId) return true
    if (!folder.parentId) return false
    
    const parent = documentsStore.findFolderById(folder.parentId)
    return parent ? isChildOfFolder(parent, parentId) : false
  }
  
  // Drag handlers
  function handleDragStart(event: DragEvent, item: DraggedItem) {
    draggedItems.value = item
    isDragging.value = true
    
    // Set drag data
    event.dataTransfer!.effectAllowed = 'move'
    event.dataTransfer!.setData('application/json', JSON.stringify(item))
    
    // Set drag image
    if (event.dataTransfer!.setDragImage) {
      const dragImage = createDragImage(item)
      event.dataTransfer!.setDragImage(dragImage, 20, 20)
      
      // Clean up drag image after a delay
      setTimeout(() => {
        dragImage.remove()
      }, 0)
    }
  }
  
  function handleDragEnd() {
    draggedItems.value = null
    dragOverFolder.value = null
    dragOverDocument.value = null
    isDragging.value = false
  }
  
  function handleDragOver(event: DragEvent, targetId: string, type: 'folder' | 'document' = 'folder') {
    event.preventDefault()
    
    // Only handle if we have dragged items
    if (!draggedItems.value) {
      // Try to parse from dataTransfer
      try {
        const data = event.dataTransfer!.getData('application/json')
        if (data) {
          draggedItems.value = JSON.parse(data)
        }
      } catch {
        // External drag - not supported yet
        event.dataTransfer!.dropEffect = 'none'
        return
      }
    }
    
    if (type === 'folder') {
      const canDrop = validateDrop(draggedItems.value, targetId)
      event.dataTransfer!.dropEffect = canDrop ? 'move' : 'none'
      dragOverFolder.value = canDrop ? targetId : null
    } else {
      // For documents, we might want to reorder
      dragOverDocument.value = targetId
      event.dataTransfer!.dropEffect = 'move'
    }
  }
  
  function handleDragLeave(event: DragEvent, targetId: string, type: 'folder' | 'document' = 'folder') {
    // Only clear if we're leaving the actual target
    const relatedTarget = event.relatedTarget as HTMLElement
    const currentTarget = event.currentTarget as HTMLElement
    
    if (!currentTarget.contains(relatedTarget)) {
      if (type === 'folder') {
        dragOverFolder.value = null
      } else {
        dragOverDocument.value = null
      }
    }
  }
  
  async function handleDrop(event: DragEvent, targetFolderId: string) {
    event.preventDefault()
    event.stopPropagation()
    
    // Clear drag states
    dragOverFolder.value = null
    dragOverDocument.value = null
    
    // Get dragged items
    let items = draggedItems.value
    if (!items) {
      try {
        const data = event.dataTransfer!.getData('application/json')
        items = JSON.parse(data)
      } catch {
        toast({
          title: 'Invalid drop data',
          description: 'Could not process the dropped items',
          variant: 'destructive'
        })
        return
      }
    }
    
    if (!items || !validateDrop(items, targetFolderId)) {
      return
    }
    
    try {
      await documentsStore.moveItems(items, targetFolderId)
      
      const itemCount = Array.isArray(items.id) ? items.id.length : 1
      const itemText = itemCount === 1 ? 'item' : 'items'
      
      toast({
        title: 'Items moved successfully',
        description: `${itemCount} ${itemText} moved to the target folder`,
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Failed to move items',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      handleDragEnd()
    }
  }
  
  // Helper to create drag image
  function createDragImage(item: DraggedItem): HTMLElement {
    const div = document.createElement('div')
    div.className = 'drag-image'
    div.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      padding: 8px 12px;
      background: hsl(var(--accent));
      color: hsl(var(--accent-foreground));
      border: 1px solid hsl(var(--border));
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 9999;
    `
    
    const itemCount = Array.isArray(item.id) ? item.id.length : 1
    const itemType = item.type === 'folder' ? 'folder' : 'document'
    const itemText = itemCount === 1 ? itemType : `${itemType}s`
    
    div.textContent = `${itemCount} ${itemText}`
    document.body.appendChild(div)
    
    return div
  }
  
  // Multi-select drag
  function handleMultiDragStart(event: DragEvent, selectedIds: string[], type: 'document' | 'folder' | 'multiple') {
    const item: DraggedItem = {
      type: selectedIds.length === 1 ? type : 'multiple',
      id: selectedIds.length === 1 ? selectedIds[0] : selectedIds,
      sourceFolder: documentsStore.currentFolderId ?? undefined
    }
    
    handleDragStart(event, item)
  }
  
  return {
    // State
    draggedItems: readonly(draggedItems),
    dragOverFolder: readonly(dragOverFolder),
    dragOverDocument: readonly(dragOverDocument),
    isDragging: readonly(isDragging),
    
    // Handlers
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleMultiDragStart,
    
    // Utils
    validateDrop
  }
}