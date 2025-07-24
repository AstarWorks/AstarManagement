// Improved folder.ts with consistency fixes and enhanced features
// This is a reference implementation showing the recommended improvements

// ===== CORE INTERFACES =====

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
  createdAt: string                    // ✅ ISO string format (matches Document)
  modifiedAt: string                   // ✅ ISO string format (matches Document)
  createdBy: UserReference             // ✅ Structured user object (matches Document)
  color?: string
  icon?: string
  description?: string
  tags?: string[]                      // ✅ Added tagging support
  isFavorite?: boolean                 // ✅ User favorites
  isArchived?: boolean                 // ✅ Archive functionality
  retentionPolicy?: string             // ✅ Legal retention requirements
}

export interface UserReference {
  id: string
  name: string
  avatar?: string
}

// ===== ENHANCED PERMISSIONS =====

export interface FolderPermissions {
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canShare: boolean
  canExport: boolean                   // ✅ Export control for legal documents
  canAudit: boolean                    // ✅ Legal compliance auditing
  inheritsPermissions: boolean
  sharedWith?: ShareInfo[]             // ✅ Detailed sharing information
  accessLevel?: 'owner' | 'editor' | 'viewer' | 'commenter'
}

export interface ShareInfo {
  userId: string
  userName: string
  permissions: string[]
  sharedAt: string
  expiresAt?: string
}

// ===== IMPROVED DRAG & DROP =====

export type DraggedItem = 
  | { 
      type: 'document' | 'folder'
      id: string
      sourceFolder?: string
    }
  | { 
      type: 'multiple'
      ids: string[]                    // ✅ Clear array for multiple items
      sourceFolder?: string
    }

// ===== ENHANCED BATCH OPERATIONS =====

export interface BatchOperation {
  id: string                           // ✅ Unique operation identifier
  type: 'move' | 'delete' | 'download' | 'permission' | 'tag' | 'copy' | 'rename' | 'share'
  items: string[]
  status: 'pending' | 'confirming' | 'processing' | 'complete' | 'error'
  progress?: number
  error?: FolderError                  // ✅ Structured error handling
  targetFolderId?: string
  tags?: string[]
  createdAt: string                    // ✅ Operation timing
  completedAt?: string                 // ✅ Completion tracking
}

// ===== ERROR HANDLING =====

export interface FolderError {
  type: 'validation' | 'permission' | 'not_found' | 'conflict' | 'network'
  message: string
  code?: string
  details?: Record<string, any>
}

export interface FolderValidationError {
  field: keyof FolderCreateInput | keyof FolderUpdateInput
  message: string
  code: string
}

// ===== PATH & NAVIGATION =====

export interface FolderPath {
  id: string
  name: string
  path: string
}

export interface FolderBreadcrumb extends FolderPath {
  isClickable: boolean
  icon?: string
}

// ===== TREE UTILITIES =====

export interface FolderTreeContext {
  allFolders: FolderNode[]
  expandedIds: Set<string>
  selectedIds: string[]
  searchQuery?: string
  sortConfig?: FolderSortConfig
}

// ===== CRUD OPERATIONS =====

export interface FolderCreateInput {
  name: string
  parentId: string | null
  color?: string
  icon?: string
  description?: string
  tags?: string[]                      // ✅ Initial tags
}

export interface FolderUpdateInput {
  name?: string
  color?: string
  icon?: string
  description?: string
  permissions?: Partial<FolderPermissions>
  tags?: string[]                      // ✅ Tag updates
  isArchived?: boolean                 // ✅ Archive status
}

// ===== SORTING & FILTERING =====

export type FolderSortField = 'name' | 'modifiedAt' | 'documentCount' | 'createdAt'
export type FolderSortDirection = 'asc' | 'desc'

export interface FolderSortConfig {
  field: FolderSortField
  direction: FolderSortDirection
}

export interface FolderFilterConfig {
  tags?: string[]
  isArchived?: boolean
  hasPermission?: keyof FolderPermissions
  dateRange?: {
    start: string
    end: string
  }
  createdBy?: string[]
}

// ===== AUDIT TRAIL =====

export interface FolderAuditEntry {
  id: string
  folderId: string
  action: 'create' | 'update' | 'delete' | 'move' | 'share' | 'permission_change' | 'archive' | 'restore'
  userId: string
  userName: string
  timestamp: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// ===== SEARCH & DISCOVERY =====

export interface FolderSearchResult {
  folders: FolderNode[]
  total: number
  hasMore: boolean
  nextCursor?: string
  searchTime: number
}

export interface FolderSearchOptions {
  query: string
  includeArchived?: boolean
  tags?: string[]
  parentId?: string
  permissions?: (keyof FolderPermissions)[]
  limit?: number
  offset?: number
}

// ===== BULK OPERATIONS =====

export interface BulkFolderOperation {
  operationId: string
  type: 'archive' | 'restore' | 'tag' | 'permission' | 'move' | 'delete'
  folderIds: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: {
    completed: number
    total: number
    errors: number
  }
  createdAt: string
  completedAt?: string
  errors?: FolderError[]
}

// ===== STATISTICS =====

export interface FolderStats {
  totalFolders: number
  totalDocuments: number
  foldersByStatus: Record<string, number>
  storageUsed: number
  recentActivity: {
    created: number
    modified: number
    deleted: number
  }
}