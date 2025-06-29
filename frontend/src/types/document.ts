// Document types for the legal case management system

export interface Document {
  id: string
  matterId: string
  title: string
  description?: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
  category: DocumentCategory
  tags: string[]
  confidential: boolean
  ocrStatus?: OcrStatus
  previewUrl?: string
  downloadUrl: string
  metadata: DocumentMetadata
}

export type DocumentCategory = 'contract' | 'evidence' | 'correspondence' | 'court_filing' | 'other'

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface DocumentMetadata {
  createdDate?: string
  modifiedDate?: string
  pageCount?: number
  extractedText?: string
  customFields?: Record<string, any>
}

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled' | 'paused'

export interface UploadItem {
  id: string
  file: File
  status: UploadStatus
  progress: number
  speed: number
  timeRemaining: number | null
  error: string | null
  metadata: UploadMetadata
  retryCount: number
  documentId?: string
  startTime?: number
  pausedAt?: number
}

// Make UploadItem properties mutable for store operations
export type MutableUploadItem = {
  -readonly [K in keyof UploadItem]: UploadItem[K]
}

export interface UploadMetadata {
  title: string
  description?: string
  matterId?: string
  category: DocumentCategory
  tags: string[]
  confidential: boolean
}

export interface UploadQueueStats {
  total: number
  pending: number
  uploading: number
  completed: number
  failed: number
  cancelled: number
  paused: number
}

export interface DocumentUploadOptions {
  maxFileSize: number
  maxConcurrentUploads: number
  acceptedFileTypes: string[]
  autoRetry: boolean
  maxRetries: number
}

export interface DocumentPreview {
  type: 'image' | 'pdf' | 'text' | 'unsupported'
  url?: string
  content?: string
  error?: string
}

export interface BatchUploadResult {
  successful: string[]
  failed: Array<{
    fileName: string
    error: string
  }>
  total: number
}