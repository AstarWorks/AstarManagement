# T08_S13 Document Organization - Folder Structure and Batch Operations

**Status**: TODO  
**Complexity**: Medium  
**Type**: Feature

## Summary
Implement a comprehensive document organization system with folder hierarchy, drag-and-drop capabilities, batch operations, and intuitive navigation for the document management module.

## Requirements

### Folder Tree View
- [ ] Hierarchical folder structure with expandable/collapsible nodes
- [ ] Folder icons indicating type (regular, shared, locked)
- [ ] Document count badges per folder
- [ ] Visual indicators for new/unread documents
- [ ] Right-click context menu for folder operations

### Drag-and-Drop Organization
- [ ] Drag documents between folders
- [ ] Drag folders to reorganize hierarchy
- [ ] Multi-select drag for batch movements
- [ ] Visual feedback during drag operations
- [ ] Validation for permissions before drop

### Batch Operations
- [ ] Multi-select with checkboxes
- [ ] Batch move to folder
- [ ] Batch delete with confirmation
- [ ] Batch download as zip
- [ ] Batch permission changes
- [ ] Batch tagging/categorization

### Folder Management
- [ ] Create new folders and subfolders
- [ ] Rename folders inline
- [ ] Delete folders (with content handling)
- [ ] Folder properties/metadata
- [ ] Folder sharing and permissions

### Navigation Features
- [ ] Breadcrumb navigation trail
- [ ] Search within current folder
- [ ] Quick folder switching
- [ ] Recent folders list
- [ ] Folder bookmarks/favorites

## Technical Specifications

### State Management (Pinia)
```typescript
// stores/documents.ts
interface DocumentsState {
  folders: FolderNode[]
  selectedFolders: string[]
  selectedDocuments: string[]
  expandedFolders: Set<string>
  currentFolder: string | null
  searchQuery: string
  batchOperation: BatchOperation | null
}

interface FolderNode {
  id: string
  name: string
  parentId: string | null
  path: string
  children: FolderNode[]
  documentCount: number
  unreadCount: number
  permissions: FolderPermissions
  metadata: {
    createdAt: Date
    modifiedAt: Date
    createdBy: string
    color?: string
    icon?: string
  }
}

interface BatchOperation {
  type: 'move' | 'delete' | 'download' | 'permission'
  items: string[]
  status: 'pending' | 'confirming' | 'processing' | 'complete'
  progress?: number
}
```

### Component Architecture

#### 1. DocumentTreeView Component
```vue
<template>
  <div class="document-tree-view">
    <div class="tree-header">
      <Button @click="createNewFolder" size="sm">
        <FolderPlus class="h-4 w-4 mr-2" />
        New Folder
      </Button>
    </div>
    
    <ScrollArea class="tree-content">
      <FolderNode
        v-for="folder in rootFolders"
        :key="folder.id"
        :folder="folder"
        :expanded="expandedFolders.has(folder.id)"
        :selected="currentFolder === folder.id"
        @toggle="toggleFolder"
        @select="selectFolder"
        @drop="handleDrop"
      />
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
// Recursive folder tree implementation
// Support for drag-drop between folders
// Context menu for folder operations
</script>
```

#### 2. BatchOperationBar Component
```vue
<template>
  <Transition name="slide-up">
    <div v-if="hasSelection" class="batch-operation-bar">
      <div class="selection-info">
        <Checkbox 
          :checked="allSelected"
          :indeterminate="someSelected"
          @update:checked="toggleSelectAll"
        />
        <span>{{ selectionCount }} selected</span>
      </div>
      
      <div class="batch-actions">
        <Button @click="batchMove" variant="outline" size="sm">
          <FolderInput class="h-4 w-4 mr-2" />
          Move
        </Button>
        <Button @click="batchDelete" variant="outline" size="sm">
          <Trash2 class="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button @click="batchDownload" variant="outline" size="sm">
          <Download class="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  </Transition>
</template>
```

#### 3. Breadcrumb Navigation
```vue
<template>
  <nav class="document-breadcrumbs">
    <ol class="breadcrumb-list">
      <li>
        <Button 
          @click="navigateToRoot" 
          variant="ghost" 
          size="sm"
          class="breadcrumb-item"
        >
          <Home class="h-4 w-4" />
        </Button>
      </li>
      
      <li v-for="(folder, index) in breadcrumbPath" :key="folder.id">
        <ChevronRight class="h-4 w-4 mx-1" />
        <Button
          @click="navigateToFolder(folder.id)"
          variant="ghost"
          size="sm"
          class="breadcrumb-item"
          :disabled="index === breadcrumbPath.length - 1"
        >
          {{ folder.name }}
        </Button>
      </li>
    </ol>
  </nav>
</template>
```

### Drag-and-Drop Implementation
```typescript
// composables/useDocumentDragDrop.ts
export function useDocumentDragDrop() {
  const documentsStore = useDocumentsStore()
  const { showToast } = useToast()
  
  const draggedItems = ref<DraggedItem | null>(null)
  const dragOverFolder = ref<string | null>(null)
  
  function handleDragStart(event: DragEvent, item: DraggedItem) {
    draggedItems.value = item
    event.dataTransfer!.effectAllowed = 'move'
    event.dataTransfer!.setData('application/json', JSON.stringify(item))
  }
  
  function handleDragOver(event: DragEvent, folderId: string) {
    event.preventDefault()
    const canDrop = validateDrop(draggedItems.value, folderId)
    event.dataTransfer!.dropEffect = canDrop ? 'move' : 'none'
    dragOverFolder.value = canDrop ? folderId : null
  }
  
  async function handleDrop(event: DragEvent, targetFolderId: string) {
    event.preventDefault()
    
    if (!draggedItems.value || !validateDrop(draggedItems.value, targetFolderId)) {
      return
    }
    
    try {
      await documentsStore.moveItems(draggedItems.value, targetFolderId)
      showToast({
        title: 'Items moved successfully',
        variant: 'success'
      })
    } catch (error) {
      showToast({
        title: 'Failed to move items',
        description: error.message,
        variant: 'error'
      })
    } finally {
      draggedItems.value = null
      dragOverFolder.value = null
    }
  }
  
  return {
    draggedItems: readonly(draggedItems),
    dragOverFolder: readonly(dragOverFolder),
    handleDragStart,
    handleDragOver,
    handleDrop
  }
}
```

### Batch Operations with Confirmation
```typescript
// composables/useBatchOperations.ts
export function useBatchOperations() {
  const modal = useModal()
  const documentsStore = useDocumentsStore()
  
  async function confirmBatchDelete(items: string[]) {
    const confirmed = await modal.confirm({
      title: 'Delete Selected Items',
      description: `Are you sure you want to delete ${items.length} items? This action cannot be undone.`,
      variant: 'destructive'
    })
    
    if (confirmed) {
      await documentsStore.batchDelete(items)
    }
  }
  
  async function batchMove(items: string[]) {
    const targetFolder = await modal.open({
      component: FolderSelectorModal,
      props: {
        title: 'Move Items',
        excludeFolders: items.filter(id => documentsStore.isFolder(id))
      }
    })
    
    if (targetFolder) {
      await documentsStore.batchMove(items, targetFolder.id)
    }
  }
  
  return {
    confirmBatchDelete,
    batchMove,
    // ... other batch operations
  }
}
```

### Performance Optimizations
```typescript
// Virtual scrolling for large folder trees
// Lazy loading of folder contents
// Debounced search within folders
// Optimistic updates for drag-drop operations
// Progressive loading for batch operations
```

### Accessibility Features
- Keyboard navigation (arrow keys for tree)
- ARIA labels for folder states
- Screen reader announcements for operations
- Focus management during batch operations
- Keyboard shortcuts for common actions

## Testing Requirements
- Unit tests for folder tree operations
- Integration tests for drag-drop functionality
- E2E tests for batch operations workflow
- Performance tests for large folder structures
- Accessibility audit for keyboard navigation

## Dependencies
- Existing components:
  - `Breadcrumbs.vue` for navigation
  - `StatusConfirmationDialog.vue` as template for batch confirmations
  - Drag-drop patterns from Kanban implementation
- New dependencies:
  - Tree view component library or custom implementation
  - File compression library for batch downloads

## Acceptance Criteria
- [ ] Users can create and organize folders in a hierarchical structure
- [ ] Drag-and-drop works smoothly between folders
- [ ] Batch operations complete successfully with progress indication
- [ ] Navigation is intuitive with breadcrumbs and search
- [ ] Performance remains smooth with 1000+ folders
- [ ] All operations respect user permissions
- [ ] Mobile users can navigate and organize (without drag-drop)

## Notes
- Consider implementing virtual scrolling for large folder trees
- Ensure drag-drop visual feedback is clear and responsive
- Batch operations should show progress for long-running tasks
- Folder permissions should be inherited by default but overridable
- Search should be scoped to current folder with option to search all