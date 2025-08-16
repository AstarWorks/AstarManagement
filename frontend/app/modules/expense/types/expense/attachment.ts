/**
 * Attachment status enumeration
 * Maps to backend attachment status from M002 API specifications
 */
export enum AttachmentStatus {
  /** Attachment is being uploaded */
  UPLOADING = 'UPLOADING',
  /** Attachment is uploaded but not yet processed */
  UPLOADED = 'UPLOADED',
  /** Attachment has been processed and is ready */
  PROCESSED = 'PROCESSED',
  /** Attachment is linked to an expense */
  LINKED = 'LINKED',
  /** Upload or processing failed */
  FAILED = 'FAILED',
  /** Attachment is marked for deletion */
  DELETED = 'DELETED'
}

/**
 * Attachment status type for string literal usage
 */
export type AttachmentStatusType = 'UPLOADING' | 'UPLOADED' | 'PROCESSED' | 'LINKED' | 'FAILED' | 'DELETED'

/**
 * File attachment entity for expense documents
 * Maps to backend Attachment entity from M002 API specifications
 */
export interface IAttachment {
  /** Unique identifier for the attachment */
  id: string
  /** Tenant ID for multi-tenancy isolation */
  tenantId: string
  /** Current filename in storage */
  fileName: string
  /** Original filename as uploaded by user */
  originalName: string
  /** File size in bytes */
  fileSize: number
  /** MIME type of the file */
  mimeType: string
  /** Storage path (internal use) */
  storagePath: string
  /** Current status of the attachment */
  status: AttachmentStatus
  /** Timestamp when attachment was linked to an expense */
  linkedAt?: string
  /** Timestamp when temporary attachment expires */
  expiresAt?: string
  /** Path to thumbnail (for images) */
  thumbnailPath?: string
  /** Thumbnail file size in bytes */
  thumbnailSize?: number
  /** Timestamp when the file was uploaded */
  uploadedAt: string
  /** User ID who uploaded the file */
  uploadedBy: string
  /** Timestamp when the attachment was soft deleted */
  deletedAt?: string
  /** User ID who deleted the attachment */
  deletedBy?: string
}

/**
 * Response DTO for file upload operations
 * Returned by upload endpoints
 */
export interface IAttachmentResponse {
  /** Unique identifier for the uploaded attachment */
  id: string
  /** Original filename */
  originalName: string
  /** File size in bytes */
  fileSize: number
  /** MIME type */
  mimeType: string
  /** Current status */
  status: AttachmentStatus
  /** Upload timestamp */
  uploadedAt: string
}

/**
 * File upload progress information
 */
export interface IUploadProgress {
  /** Attachment ID being uploaded */
  attachmentId: string
  /** Upload progress percentage (0-100) */
  progress: number
  /** Current upload status */
  status: 'uploading' | 'processing' | 'completed' | 'error'
  /** Error message if upload failed */
  error?: string
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number
}

/**
 * File type validation rules
 */
export interface IFileTypeRule {
  /** MIME type pattern */
  mimeType: string
  /** File extension */
  extension: string
  /** Maximum file size in bytes */
  maxSize: number
  /** Whether thumbnails are supported */
  supportsThumbnail: boolean
}

/**
 * Attachment filter criteria
 */
export interface IAttachmentFilter {
  /** Filter by attachment status */
  status?: AttachmentStatus
  /** Filter by MIME type pattern */
  mimeType?: string
  /** Filter by file extension */
  extension?: string
  /** Filter by uploaded date range */
  uploadedAfter?: string
  uploadedBefore?: string
  /** Sort by field */
  sortBy?: 'uploadedAt' | 'originalName' | 'fileSize'
  /** Sort order */
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Supported file types for expense attachments
 */
export const SUPPORTED_FILE_TYPES: IFileTypeRule[] = [
  // Images
  {
    mimeType: 'image/jpeg',
    extension: '.jpg',
    maxSize: 10 * 1024 * 1024, // 10MB
    supportsThumbnail: true
  },
  {
    mimeType: 'image/png',
    extension: '.png',
    maxSize: 10 * 1024 * 1024, // 10MB
    supportsThumbnail: true
  },
  {
    mimeType: 'image/gif',
    extension: '.gif',
    maxSize: 5 * 1024 * 1024, // 5MB
    supportsThumbnail: true
  },
  // Documents
  {
    mimeType: 'application/pdf',
    extension: '.pdf',
    maxSize: 25 * 1024 * 1024, // 25MB
    supportsThumbnail: false
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
    maxSize: 15 * 1024 * 1024, // 15MB
    supportsThumbnail: false
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    maxSize: 15 * 1024 * 1024, // 15MB
    supportsThumbnail: false
  },
  // Text files
  {
    mimeType: 'text/plain',
    extension: '.txt',
    maxSize: 1 * 1024 * 1024, // 1MB
    supportsThumbnail: false
  },
  {
    mimeType: 'text/csv',
    extension: '.csv',
    maxSize: 5 * 1024 * 1024, // 5MB
    supportsThumbnail: false
  }
]

/**
 * File size utility constants
 */
export const FILE_SIZE = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB per expense
  MAX_FILES_PER_EXPENSE: 10
} as const