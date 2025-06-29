export interface FolderNode {
  id: string
  name: string
  parentId: string | null
  path: string
  children: FolderNode[]
  documentCount: number
  unreadCount: number
  permissions: FolderPermissions
  metadata: FolderMetadata
}

export interface FolderMetadata {
  createdAt: Date
  modifiedAt: Date
  createdBy: string
  color?: string
  icon?: string
  description?: string
}

export interface FolderPermissions {
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canShare: boolean
  inheritsPermissions: boolean
  sharedWith?: string[]
}

export interface BatchOperation {
  type: 'move' | 'delete' | 'download' | 'permission' | 'tag'
  items: string[]
  status: 'pending' | 'confirming' | 'processing' | 'complete' | 'error'
  progress?: number
  error?: string
  targetFolderId?: string
  tags?: string[]
}

export interface DraggedItem {
  type: 'document' | 'folder' | 'multiple'
  id: string | string[]
  sourceFolder?: string
}

export interface FolderPath {
  id: string
  name: string
  path: string
}

export interface FolderCreateInput {
  name: string
  parentId: string | null
  color?: string
  icon?: string
  description?: string
}

export interface FolderUpdateInput {
  name?: string
  color?: string
  icon?: string
  description?: string
  permissions?: Partial<FolderPermissions>
}

export type FolderSortField = 'name' | 'modifiedAt' | 'documentCount'
export type FolderSortDirection = 'asc' | 'desc'

export interface FolderSortConfig {
  field: FolderSortField
  direction: FolderSortDirection
}