/**
 * Receipt Management Types
 * 
 * Type definitions for the receipt management system including camera capture,
 * upload functionality, OCR processing, and expense integration.
 */

// OCR processing status
export type OcrStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

// Receipt metadata interface
export interface Receipt {
  id: string
  expenseId?: string
  originalFilename: string
  storedFilename: string
  fileSize: number
  mimeType: string
  imageWidth?: number
  imageHeight?: number
  
  // OCR processing
  ocrStatus: OcrStatus
  ocrText?: string
  ocrConfidence?: number
  
  // Extracted data
  extractedAmount?: number
  extractedDate?: string
  extractedVendor?: string
  
  // URLs for access
  thumbnailUrl: string
  fullSizeUrl: string
  
  // Audit trail
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

// Receipt upload data
export interface ReceiptUpload {
  file: File | Blob
  originalFilename: string
  expenseId?: string
  metadata?: {
    capturedAt?: string
    deviceInfo?: string
    location?: string
  }
}

// OCR processing result
export interface OcrResult {
  text: string
  confidence: number
  extractedAmount?: number
  extractedDate?: string
  extractedVendor?: string
  processingTime: number
  rawData?: Record<string, any>
}

// Receipt search filters
export interface ReceiptFilters {
  search?: string
  ocrStatus?: OcrStatus
  expenseId?: string
  dateFrom?: string
  dateTo?: string
  hasOcrData?: boolean
  mimeType?: string
}

// Receipt gallery view options
export interface ReceiptGalleryOptions {
  showFilters?: boolean
  selectable?: boolean
  maxItems?: number
  sortBy?: 'createdAt' | 'filename' | 'extractedAmount' | 'ocrStatus'
  sortOrder?: 'asc' | 'desc'
}

// Camera capture options
export interface CameraOptions {
  facingMode?: 'user' | 'environment'
  width?: number
  height?: number
  quality?: number
}

// Image compression options
export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
  maxFileSize?: number
}

// Receipt processing queue item
export interface ReceiptQueueItem {
  receiptId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  queuedAt: string
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  retryCount: number
}

// Receipt stats for dashboard
export interface ReceiptStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  totalFileSize: number
  avgProcessingTime?: number
}

// Receipt validation errors
export interface ReceiptValidationError {
  field: string
  message: string
  code: string
}

// Receipt upload response
export interface ReceiptUploadResponse {
  receipt: Receipt
  warnings?: string[]
  errors?: ReceiptValidationError[]
}

// Batch receipt upload
export interface BatchReceiptUpload {
  receipts: ReceiptUpload[]
  expenseId?: string
  options?: {
    autoProcess?: boolean
    skipDuplicates?: boolean
    maxConcurrent?: number
  }
}

// Receipt template for common use cases
export interface ReceiptTemplate {
  id: string
  name: string
  description?: string
  defaultFilename: string
  expectedFields: string[]
  ocrTemplate?: string
  createdBy: string
  isPublic: boolean
}