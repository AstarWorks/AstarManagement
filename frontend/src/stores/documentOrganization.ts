import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  FolderNode, 
  BatchOperation, 
  FolderCreateInput, 
  FolderUpdateInput,
  FolderPath 
} from '~/types/folder'
import type { Document } from '~/types/document'

export const useDocumentOrganizationStore = defineStore('document-organization', () => {
  // State
  const folders = ref<FolderNode[]>([])
  const selectedFolders = ref<string[]>([])
  const selectedDocuments = ref<string[]>([])
  const expandedFolders = ref<Set<string>>(new Set())
  const currentFolderId = ref<string | null>(null)
  const searchQuery = ref('')
  const batchOperation = ref<BatchOperation | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const recentFolders = ref<string[]>([])
  const favoritesFolders = ref<string[]>([])

  // Mock root folders for development
  const mockFolders: FolderNode[] = [
    {
      id: 'root-1',
      name: 'Active Cases',
      parentId: null,
      path: '/active-cases',
      children: [
        {
          id: 'folder-1-1',
          name: 'Contract Disputes',
          parentId: 'root-1',
          path: '/active-cases/contract-disputes',
          children: [],
          documentCount: 24,
          unreadCount: 3,
          permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
            inheritsPermissions: true
          },
          metadata: {
            createdAt: new Date('2024-01-15'),
            modifiedAt: new Date('2024-02-20'),
            createdBy: 'user-1',
            color: '#3B82F6',
            icon: 'briefcase'
          }
        },
        {
          id: 'folder-1-2',
          name: 'Employment Law',
          parentId: 'root-1',
          path: '/active-cases/employment-law',
          children: [],
          documentCount: 18,
          unreadCount: 1,
          permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
            inheritsPermissions: true
          },
          metadata: {
            createdAt: new Date('2024-01-20'),
            modifiedAt: new Date('2024-02-18'),
            createdBy: 'user-1',
            color: '#10B981',
            icon: 'users'
          }
        }
      ],
      documentCount: 42,
      unreadCount: 4,
      permissions: {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canShare: true,
        inheritsPermissions: false
      },
      metadata: {
        createdAt: new Date('2024-01-01'),
        modifiedAt: new Date('2024-02-20'),
        createdBy: 'admin',
        icon: 'folder'
      }
    },
    {
      id: 'root-2',
      name: 'Archived Cases',
      parentId: null,
      path: '/archived-cases',
      children: [],
      documentCount: 156,
      unreadCount: 0,
      permissions: {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canShare: false,
        inheritsPermissions: false
      },
      metadata: {
        createdAt: new Date('2023-01-01'),
        modifiedAt: new Date('2024-01-15'),
        createdBy: 'admin',
        icon: 'archive'
      }
    },
    {
      id: 'root-3',
      name: 'Templates',
      parentId: null,
      path: '/templates',
      children: [],
      documentCount: 32,
      unreadCount: 0,
      permissions: {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canShare: true,
        inheritsPermissions: false
      },
      metadata: {
        createdAt: new Date('2023-06-01'),
        modifiedAt: new Date('2024-02-10'),
        createdBy: 'admin',
        icon: 'file-text',
        color: '#8B5CF6'
      }
    }
  ]

  // Computed
  const rootFolders = computed(() => 
    folders.value.filter(folder => folder.parentId === null)
  )

  const currentFolder = computed(() => 
    folders.value.find(folder => folder.id === currentFolderId.value)
  )

  const breadcrumbPath = computed((): FolderPath[] => {
    if (!currentFolderId.value) return []
    
    const path: FolderPath[] = []
    let current = currentFolder.value
    
    while (current) {
      path.unshift({
        id: current.id,
        name: current.name,
        path: current.path
      })
      current = folders.value.find(f => f.id === current!.parentId)
    }
    
    return path
  })

  const hasSelection = computed(() => 
    selectedDocuments.value.length > 0 || selectedFolders.value.length > 0
  )

  const selectionCount = computed(() => 
    selectedDocuments.value.length + selectedFolders.value.length
  )

  const canDropInFolder = computed(() => (folderId: string) => {
    const folder = folders.value.find(f => f.id === folderId)
    return folder?.permissions.canWrite ?? false
  })

  // Helper functions
  function findFolderById(folderId: string): FolderNode | undefined {
    return folders.value.find(f => f.id === folderId)
  }

  function getFolderChildren(folderId: string): FolderNode[] {
    return folders.value.filter(f => f.parentId === folderId)
  }

  function updateFolderCounts(folderId: string, delta: number) {
    const folder = findFolderById(folderId)
    if (folder) {
      folder.documentCount += delta
      // Update parent folders recursively
      if (folder.parentId) {
        updateFolderCounts(folder.parentId, delta)
      }
    }
  }

  // Actions
  async function loadFolders() {
    loading.value = true
    error.value = null
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      folders.value = mockFolders
    } catch (err) {
      error.value = 'Failed to load folders'
      console.error('Failed to load folders:', err)
    } finally {
      loading.value = false
    }
  }

  async function createFolder(input: FolderCreateInput): Promise<FolderNode> {
    loading.value = true
    error.value = null
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const parentPath = input.parentId 
        ? findFolderById(input.parentId)?.path ?? ''
        : ''
      
      const newFolder: FolderNode = {
        id: `folder-${Date.now()}`,
        name: input.name,
        parentId: input.parentId,
        path: `${parentPath}/${input.name.toLowerCase().replace(/\s+/g, '-')}`,
        children: [],
        documentCount: 0,
        unreadCount: 0,
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: true,
          canShare: true,
          inheritsPermissions: true
        },
        metadata: {
          createdAt: new Date(),
          modifiedAt: new Date(),
          createdBy: 'current-user',
          color: input.color,
          icon: input.icon,
          description: input.description
        }
      }
      
      folders.value.push(newFolder)
      
      if (input.parentId) {
        const parent = findFolderById(input.parentId)
        if (parent) {
          parent.children.push(newFolder)
        }
      }
      
      return newFolder
    } catch (err) {
      error.value = 'Failed to create folder'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateFolder(folderId: string, input: FolderUpdateInput) {
    loading.value = true
    error.value = null
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const folder = findFolderById(folderId)
      if (!folder) throw new Error('Folder not found')
      
      if (input.name) folder.name = input.name
      if (input.color) folder.metadata.color = input.color
      if (input.icon) folder.metadata.icon = input.icon
      if (input.description) folder.metadata.description = input.description
      if (input.permissions) {
        Object.assign(folder.permissions, input.permissions)
      }
      
      folder.metadata.modifiedAt = new Date()
    } catch (err) {
      error.value = 'Failed to update folder'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteFolder(folderId: string, deleteContents = false) {
    loading.value = true
    error.value = null
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const folder = findFolderById(folderId)
      if (!folder) throw new Error('Folder not found')
      if (!folder.permissions.canDelete) throw new Error('No permission to delete folder')
      
      if (!deleteContents && folder.documentCount > 0) {
        throw new Error('Folder contains documents')
      }
      
      // Remove from folders array
      const index = folders.value.findIndex(f => f.id === folderId)
      if (index > -1) {
        folders.value.splice(index, 1)
      }
      
      // Remove from parent's children
      if (folder.parentId) {
        const parent = findFolderById(folder.parentId)
        if (parent) {
          const childIndex = parent.children.findIndex(c => c.id === folderId)
          if (childIndex > -1) {
            parent.children.splice(childIndex, 1)
          }
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete folder'
      throw err
    } finally {
      loading.value = false
    }
  }

  function toggleFolderExpanded(folderId: string) {
    if (expandedFolders.value.has(folderId)) {
      expandedFolders.value.delete(folderId)
    } else {
      expandedFolders.value.add(folderId)
    }
  }

  function selectFolder(folderId: string) {
    currentFolderId.value = folderId
    
    // Add to recent folders
    const index = recentFolders.value.indexOf(folderId)
    if (index > -1) {
      recentFolders.value.splice(index, 1)
    }
    recentFolders.value.unshift(folderId)
    
    // Keep only last 10 recent folders
    if (recentFolders.value.length > 10) {
      recentFolders.value = recentFolders.value.slice(0, 10)
    }
  }

  function toggleFolderSelection(folderId: string) {
    const index = selectedFolders.value.indexOf(folderId)
    if (index > -1) {
      selectedFolders.value.splice(index, 1)
    } else {
      selectedFolders.value.push(folderId)
    }
  }

  function toggleDocumentSelection(documentId: string) {
    const index = selectedDocuments.value.indexOf(documentId)
    if (index > -1) {
      selectedDocuments.value.splice(index, 1)
    } else {
      selectedDocuments.value.push(documentId)
    }
  }

  function clearSelection() {
    selectedFolders.value = []
    selectedDocuments.value = []
  }

  function toggleSelectAll(documents: Document[]) {
    if (selectedDocuments.value.length === documents.length) {
      selectedDocuments.value = []
    } else {
      selectedDocuments.value = documents.map(d => d.id)
    }
  }

  async function moveItems(items: DraggedItem, targetFolderId: string) {
    const itemIds = Array.isArray(items.id) ? items.id : [items.id]
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Update folder counts
    if (items.sourceFolder) {
      updateFolderCounts(items.sourceFolder, -itemIds.length)
    }
    updateFolderCounts(targetFolderId, itemIds.length)
    
    clearSelection()
  }

  async function startBatchOperation(type: BatchOperation['type'], items: string[]) {
    batchOperation.value = {
      type,
      items,
      status: 'confirming',
      progress: 0
    }
  }

  async function executeBatchOperation() {
    if (!batchOperation.value) return
    
    batchOperation.value.status = 'processing'
    batchOperation.value.progress = 0
    
    try {
      // Simulate batch processing
      const totalItems = batchOperation.value.items.length
      for (let i = 0; i < totalItems; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        batchOperation.value.progress = ((i + 1) / totalItems) * 100
      }
      
      batchOperation.value.status = 'complete'
      clearSelection()
      
      // Clear batch operation after delay
      setTimeout(() => {
        batchOperation.value = null
      }, 2000)
    } catch (err) {
      batchOperation.value.status = 'error'
      batchOperation.value.error = err instanceof Error ? err.message : 'Operation failed'
    }
  }

  function cancelBatchOperation() {
    batchOperation.value = null
  }

  function toggleFavorite(folderId: string) {
    const index = favoritesFolders.value.indexOf(folderId)
    if (index > -1) {
      favoritesFolders.value.splice(index, 1)
    } else {
      favoritesFolders.value.push(folderId)
    }
  }

  function isFolder(id: string): boolean {
    return folders.value.some(f => f.id === id)
  }

  return {
    // State
    folders,
    selectedFolders,
    selectedDocuments,
    expandedFolders,
    currentFolderId,
    searchQuery,
    batchOperation,
    loading,
    error,
    recentFolders,
    favoritesFolders,
    
    // Computed
    rootFolders,
    currentFolder,
    breadcrumbPath,
    hasSelection,
    selectionCount,
    canDropInFolder,
    
    // Actions
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolderExpanded,
    selectFolder,
    toggleFolderSelection,
    toggleDocumentSelection,
    clearSelection,
    toggleSelectAll,
    moveItems,
    startBatchOperation,
    executeBatchOperation,
    cancelBatchOperation,
    toggleFavorite,
    isFolder,
    findFolderById,
    getFolderChildren
  }
})