/**
 * Document API Type Definitions
 * 
 * Type definitions for document management and processing
 */

import type { 
  AuditableEntity, 
  SoftDeletableEntity,
  UserSummary,
  FileUploadResponse,
  DateRange
} from './common'

/**
 * Document entity
 */
export interface Document extends AuditableEntity, SoftDeletableEntity {
  id: string
  title: string
  filename: string
  originalName: string
  contentType: string
  size: number // bytes
  category: DocumentCategory
  status: DocumentStatus
  matterId?: string
  uploadedBy: UserSummary
  
  // Storage information
  storageUrl: string
  thumbnailUrl?: string
  downloadUrl: string
  
  // Document metadata
  pageCount?: number
  wordCount?: number
  language?: string
  encoding?: string
  
  // OCR and processing
  ocrStatus?: OcrStatus
  ocrCompletedAt?: string
  extractedText?: string
  ocrConfidence?: number
  
  // Version control
  version: number
  isLatest: boolean
  previousVersionId?: string
  
  // Access control
  accessLevel: AccessLevel
  sharedWith?: DocumentShare[]
  publicAccessUrl?: string
  publicAccessExpiresAt?: string
  
  // Tags and classification
  tags: string[]
  autoTags?: string[]
  confidentialityLevel?: ConfidentialityLevel
  
  // Additional metadata
  checksum?: string
  virusScanStatus?: VirusScanStatus
  virusScanCompletedAt?: string
  customMetadata?: Record<string, unknown>
}

/**
 * Document categories
 */
export type DocumentCategory = 
  | 'CONTRACT'
  | 'PLEADING'
  | 'MOTION'
  | 'DISCOVERY'
  | 'CORRESPONDENCE'
  | 'EVIDENCE'
  | 'COURT_ORDER'
  | 'FILING'
  | 'INTERNAL_MEMO'
  | 'CLIENT_DOCUMENT'
  | 'RESEARCH'
  | 'TEMPLATE'
  | 'FORM'
  | 'REPORT'
  | 'OTHER'

/**
 * Document status
 */
export type DocumentStatus = 
  | 'UPLOADING'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED'
  | 'ARCHIVED'

/**
 * OCR status
 */
export type OcrStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'NOT_APPLICABLE'

/**
 * Virus scan status
 */
export type VirusScanStatus = 
  | 'PENDING'
  | 'SCANNING'
  | 'CLEAN'
  | 'INFECTED'
  | 'ERROR'

/**
 * Access levels
 */
export type AccessLevel = 
  | 'PRIVATE'      // Only owner and explicitly shared users
  | 'TEAM'         // Team members on the matter
  | 'ORGANIZATION' // All organization members
  | 'PUBLIC'       // Public link access

/**
 * Confidentiality levels
 */
export type ConfidentialityLevel = 
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'HIGHLY_CONFIDENTIAL'
  | 'PRIVILEGED'

/**
 * Document share
 */
export interface DocumentShare {
  userId: string
  sharedBy: UserSummary
  sharedAt: string
  permissions: DocumentPermission[]
  expiresAt?: string
}

/**
 * Document permissions
 */
export type DocumentPermission = 
  | 'VIEW'
  | 'DOWNLOAD'
  | 'EDIT'
  | 'DELETE'
  | 'SHARE'
  | 'COMMENT'
  | 'ANNOTATE'

/**
 * Document version
 */
export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  filename: string
  size: number
  uploadedBy: UserSummary
  uploadedAt: string
  changelog?: string
  checksum: string
  isLatest: boolean
}

/**
 * Document annotation
 */
export interface DocumentAnnotation {
  id: string
  documentId: string
  pageNumber: number
  x: number // Position coordinates
  y: number
  width: number
  height: number
  type: AnnotationType
  content: string
  color?: string
  author: UserSummary
  createdAt: string
  updatedAt?: string
  replies?: AnnotationReply[]
}

/**
 * Annotation types
 */
export type AnnotationType = 
  | 'HIGHLIGHT'
  | 'NOTE'
  | 'DRAWING'
  | 'REDACTION'
  | 'STAMP'

/**
 * Annotation reply
 */
export interface AnnotationReply {
  id: string
  content: string
  author: UserSummary
  createdAt: string
}

/**
 * Document template
 */
export interface DocumentTemplate {
  id: string
  name: string
  description?: string
  category: DocumentCategory
  filename: string
  contentType: string
  fields: TemplateField[]
  tags: string[]
  isActive: boolean
  usageCount: number
  lastUsedAt?: string
  createdBy: UserSummary
}

/**
 * Template field
 */
export interface TemplateField {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  defaultValue?: unknown
  placeholder?: string
  options?: string[] // For select/radio
  validation?: FieldValidation
  helpText?: string
  order: number
}

/**
 * Field types
 */
export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'signature'
  | 'file'

/**
 * Field validation
 */
export interface FieldValidation {
  pattern?: string     // Regex pattern
  minLength?: number
  maxLength?: number
  min?: number        // For number fields
  max?: number
  customValidator?: string // Function name
}

/**
 * Upload document request
 */
export interface UploadDocumentRequest {
  file: File
  title?: string        // Defaults to filename
  category: DocumentCategory
  matterId?: string
  tags?: string[]
  accessLevel?: AccessLevel
  confidentialityLevel?: ConfidentialityLevel
  processOcr?: boolean  // Default: true for PDFs
  customMetadata?: Record<string, unknown>
}

/**
 * Update document request
 */
export interface UpdateDocumentRequest {
  title?: string
  category?: DocumentCategory
  tags?: string[]
  accessLevel?: AccessLevel
  confidentialityLevel?: ConfidentialityLevel
  customMetadata?: Record<string, unknown>
}

/**
 * Document query parameters
 */
export interface DocumentQueryParams {
  page?: number
  size?: number
  sort?: string | string[]
  search?: string                    // Search in title, content, tags
  matterId?: string
  category?: DocumentCategory | DocumentCategory[]
  status?: DocumentStatus | DocumentStatus[]
  uploadedBy?: string
  tags?: string | string[]
  dateRange?: DateRange
  contentType?: string | string[]
  minSize?: number                   // In bytes
  maxSize?: number
  hasOcr?: boolean
  includeDeleted?: boolean
}

/**
 * Document processing job
 */
export interface DocumentProcessingJob {
  id: string
  documentId: string
  type: ProcessingType
  status: JobStatus
  progress?: number     // 0-100
  startedAt?: string
  completedAt?: string
  error?: string
  result?: ProcessingResult
}

/**
 * Processing types
 */
export type ProcessingType = 
  | 'OCR'
  | 'VIRUS_SCAN'
  | 'THUMBNAIL_GENERATION'
  | 'TEXT_EXTRACTION'
  | 'METADATA_EXTRACTION'
  | 'CLASSIFICATION'

/**
 * Job status
 */
export type JobStatus = 
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

/**
 * Processing result
 */
export interface ProcessingResult {
  type: ProcessingType
  data: Record<string, unknown>
  confidence?: number
  warnings?: string[]
}

/**
 * Batch upload request
 */
export interface BatchUploadRequest {
  files: File[]
  defaultCategory?: DocumentCategory
  defaultTags?: string[]
  matterId?: string
  processOcr?: boolean
  skipDuplicates?: boolean
}

/**
 * Batch upload response
 */
export interface BatchUploadResponse {
  totalFiles: number
  successCount: number
  failureCount: number
  duplicateCount: number
  documents: DocumentUploadResult[]
}

/**
 * Document upload result
 */
export interface DocumentUploadResult {
  filename: string
  success: boolean
  documentId?: string
  error?: string
  isDuplicate?: boolean
}

/**
 * Generate document from template request
 */
export interface GenerateDocumentRequest {
  templateId: string
  matterId?: string
  fields: Record<string, unknown>
  outputFormat?: 'PDF' | 'DOCX'
  filename?: string
}

/**
 * Document statistics
 */
export interface DocumentStatistics {
  totalDocuments: number
  totalSize: number            // In bytes
  byCategory: Record<DocumentCategory, number>
  byStatus: Record<DocumentStatus, number>
  byContentType: Array<{
    contentType: string
    count: number
    totalSize: number
  }>
  averageDocumentSize: number
  documentsWithOcr: number
  documentsShared: number
  recentUploads: number      // Last 24 hours
}

/**
 * Document search result
 */
export interface DocumentSearchResult {
  document: Document
  score: number
  highlights?: {
    title?: string[]
    content?: string[]
    tags?: string[]
  }
  matchedFields: string[]
}

/**
 * Type guards
 */
export function isDocument(obj: unknown): obj is Document {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'filename' in obj &&
    'contentType' in obj
  )
}

export function isProcessed(doc: Document): boolean {
  return doc.status === 'READY'
}

export function hasOcr(doc: Document): boolean {
  return doc.ocrStatus === 'COMPLETED' && !!doc.extractedText
}

export function canBeOcrd(doc: Document): boolean {
  const ocrContentTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff']
  return ocrContentTypes.includes(doc.contentType)
}

/**
 * File size formatting
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Content type helpers
 */
export function getFileExtension(contentType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'text/plain': 'txt'
  }
  
  return extensions[contentType] || 'file'
}

export function isImageFile(contentType: string): boolean {
  return contentType.startsWith('image/')
}

export function isPdfFile(contentType: string): boolean {
  return contentType === 'application/pdf'
}

export function isOfficeFile(contentType: string): boolean {
  return contentType.includes('officedocument') || 
         contentType.includes('msword') || 
         contentType.includes('ms-excel')
}