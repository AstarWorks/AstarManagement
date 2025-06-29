export interface Document {
  id: string
  fileName: string
  description?: string
  mimeType: string
  size: number
  createdDate: string
  modifiedDate: string
  createdBy: {
    id: string
    name: string
    avatar?: string
  }
  updatedBy?: {
    id: string
    name: string
    avatar?: string
  }
  matterId?: string
  tags?: string[]
  version?: number
  isShared?: boolean
  isLocked?: boolean
  syncStatus?: 'synced' | 'syncing' | 'pending' | 'error'
  thumbnailUrl?: string
  contentUrl?: string
  metadata?: Record<string, any>
}

export interface DocumentSortConfig {
  field: keyof Document
  direction: 'asc' | 'desc'
}

export interface DocumentFilterConfig {
  fileTypes: string[]
  dateRange: {
    start: Date
    end: Date
  } | null
  sizeRange: {
    min: number
    max: number
  } | null
  tags: string[]
}

export type DocumentAction = 
  | 'preview'
  | 'download'
  | 'share'
  | 'copy-link'
  | 'rename'
  | 'move'
  | 'duplicate'
  | 'delete'
  | 'properties'
  | 'version-history'

export interface DocumentListOptions {
  matterId?: string
  pageSize?: number
  sortConfig?: DocumentSortConfig
  filterConfig?: DocumentFilterConfig
}

export interface DocumentUploadProgress {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export interface DocumentSearchResult {
  documents: Document[]
  total: number
  hasMore: boolean
  nextCursor?: string
}

// Upload-related types
export interface UploadItem {
  id: string
  file: File
  matterId?: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  result?: Document
}

export interface UploadMetadata {
  matterId?: string
  tags?: string[]
  description?: string
}

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error'

export interface UploadQueueStats {
  total: number
  pending: number
  uploading: number
  completed: number
  failed: number
  totalSize: number
  uploadedSize: number
}

export interface DocumentUploadOptions {
  matterId?: string
  tags?: string[]
  description?: string
  allowedTypes?: string[]
  maxSize?: number
  concurrent?: number
}

// Mock data interfaces for development
export interface MockDocumentData {
  documents: Document[]
  generateThumbnail: (documentId: string) => Promise<string>
  uploadDocument: (file: File, matterId?: string) => Promise<Document>
  deleteDocument: (documentId: string) => Promise<void>
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<Document>
}