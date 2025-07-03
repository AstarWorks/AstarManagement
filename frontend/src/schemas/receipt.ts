import { z } from 'zod'
import {
  requiredString,
  optionalString,
  requiredStringWithMax,
  optionalStringWithMax,
  dateString,
  auditableSchema
} from './common'

/**
 * Receipt Management Schemas
 * 
 * Validation schemas for receipt capture, upload, OCR processing,
 * and expense integration functionality.
 */

// OCR status enum
export const ocrStatusSchema = z.enum([
  'PENDING',
  'PROCESSING', 
  'COMPLETED',
  'FAILED'
])

// MIME type validation for receipt images
export const receiptMimeTypeSchema = z.enum([
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
])

// File size validation (max 10MB)
export const fileSizeSchema = z.number()
  .min(1, 'File cannot be empty')
  .max(10 * 1024 * 1024, 'File size cannot exceed 10MB')

// Image dimensions validation
export const imageDimensionsSchema = z.object({
  width: z.number().min(100, 'Image width must be at least 100px').max(8000, 'Image width cannot exceed 8000px'),
  height: z.number().min(100, 'Image height must be at least 100px').max(8000, 'Image height cannot exceed 8000px')
}).refine(
  (data) => data.width * data.height <= 32000000, // Max 32MP
  {
    message: 'Image resolution cannot exceed 32 megapixels',
    path: ['width']
  }
)

// OCR confidence score validation
export const ocrConfidenceSchema = z.number()
  .min(0, 'OCR confidence must be between 0 and 1')
  .max(1, 'OCR confidence must be between 0 and 1')

// Extracted amount validation (Japanese currency focused)
export const extractedAmountSchema = z.number()
  .min(0, 'Extracted amount cannot be negative')
  .max(10000000, 'Extracted amount cannot exceed ¥10,000,000')
  .multipleOf(0.01, 'Amount precision cannot exceed 2 decimal places')

// Vendor name validation
export const vendorNameSchema = z.string()
  .min(1, 'Vendor name cannot be empty')
  .max(255, 'Vendor name must be less than 255 characters')
  .refine(
    (val) => val.trim().length >= 1,
    'Vendor name cannot be only whitespace'
  )

// Receipt filename validation
export const filenameSchema = z.string()
  .min(1, 'Filename cannot be empty')
  .max(500, 'Filename must be less than 500 characters')
  .refine(
    (val) => !val.includes('/') && !val.includes('\\') && !val.includes('..'),
    'Filename contains invalid characters'
  )

// Base receipt schema
export const receiptSchema = z.object({
  id: z.string().uuid('Invalid receipt ID'),
  expenseId: z.string().uuid('Invalid expense ID').optional(),
  originalFilename: filenameSchema,
  storedFilename: filenameSchema,
  fileSize: fileSizeSchema,
  mimeType: receiptMimeTypeSchema,
  imageWidth: z.number().min(1).optional(),
  imageHeight: z.number().min(1).optional(),
  
  // OCR processing fields
  ocrStatus: ocrStatusSchema.default('PENDING'),
  ocrText: z.string().max(10000, 'OCR text cannot exceed 10,000 characters').optional(),
  ocrConfidence: ocrConfidenceSchema.optional(),
  
  // Extracted data fields
  extractedAmount: extractedAmountSchema.optional(),
  extractedDate: dateString.optional(),
  extractedVendor: vendorNameSchema.optional(),
  
  // URLs for accessing images
  thumbnailUrl: z.string().url('Invalid thumbnail URL'),
  fullSizeUrl: z.string().url('Invalid full size URL'),
  
  // Audit fields
  createdAt: z.string().datetime('Invalid created date'),
  updatedAt: z.string().datetime('Invalid updated date'),
  createdBy: z.string().uuid('Invalid creator ID'),
  updatedBy: z.string().uuid('Invalid updater ID')
})

// Receipt upload schema
export const receiptUploadSchema = z.object({
  originalFilename: filenameSchema,
  fileSize: fileSizeSchema,
  mimeType: receiptMimeTypeSchema,
  expenseId: z.string().uuid().optional(),
  
  // Optional metadata
  metadata: z.object({
    capturedAt: z.string().datetime().optional(),
    deviceInfo: optionalStringWithMax(200, 'Device info must be less than 200 characters'),
    location: optionalStringWithMax(100, 'Location must be less than 100 characters'),
    notes: optionalStringWithMax(500, 'Notes must be less than 500 characters')
  }).optional()
}).refine(
  (data) => {
    // Validate file extension matches MIME type
    const extension = data.originalFilename.split('.').pop()?.toLowerCase()
    const mimeToExt = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/jpg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/heic': ['heic'],
      'image/heif': ['heif']
    }
    
    if (extension && mimeToExt[data.mimeType]) {
      return mimeToExt[data.mimeType].includes(extension)
    }
    return true
  },
  {
    message: 'File extension does not match MIME type',
    path: ['originalFilename']
  }
)

// Receipt update schema (for OCR results and metadata updates)
export const receiptUpdateSchema = z.object({
  id: z.string().uuid('Invalid receipt ID'),
  version: z.number().optional(), // For optimistic locking
  
  // Updatable fields
  ocrStatus: ocrStatusSchema.optional(),
  ocrText: z.string().max(10000, 'OCR text cannot exceed 10,000 characters').optional(),
  ocrConfidence: ocrConfidenceSchema.optional(),
  extractedAmount: extractedAmountSchema.optional(),
  extractedDate: dateString.optional(),
  extractedVendor: vendorNameSchema.optional(),
  expenseId: z.string().uuid().optional()
})

// Receipt search/filter schema
export const receiptSearchSchema = z.object({
  query: optionalStringWithMax(255, 'Search query must be less than 255 characters'),
  ocrStatus: ocrStatusSchema.optional(),
  expenseId: z.string().uuid().optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  hasOcrData: z.boolean().optional(),
  mimeType: receiptMimeTypeSchema.optional(),
  minFileSize: z.number().min(0).optional(),
  maxFileSize: z.number().min(0).optional(),
  minAmount: extractedAmountSchema.optional(),
  maxAmount: extractedAmountSchema.optional(),
  vendor: optionalStringWithMax(255),
  
  // Sorting and pagination
  sortBy: z.enum([
    'createdAt',
    'originalFilename', 
    'fileSize',
    'extractedAmount',
    'ocrStatus',
    'extractedDate'
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo)
    }
    return true
  },
  {
    message: 'Date from must be before date to',
    path: ['dateTo']
  }
).refine(
  (data) => {
    if (data.minFileSize && data.maxFileSize) {
      return data.minFileSize <= data.maxFileSize
    }
    return true
  },
  {
    message: 'Minimum file size must be less than maximum file size',
    path: ['maxFileSize']
  }
).refine(
  (data) => {
    if (data.minAmount && data.maxAmount) {
      return data.minAmount <= data.maxAmount
    }
    return true
  },
  {
    message: 'Minimum amount must be less than maximum amount',
    path: ['maxAmount']
  }
)

// OCR processing request schema
export const ocrProcessingSchema = z.object({
  receiptId: z.string().uuid('Invalid receipt ID'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  options: z.object({
    extractAmount: z.boolean().default(true),
    extractDate: z.boolean().default(true),
    extractVendor: z.boolean().default(true),
    extractLineItems: z.boolean().default(false),
    language: z.enum(['auto', 'ja', 'en']).default('auto'),
    confidence: z.number().min(0).max(1).default(0.7)
  }).optional()
})

// OCR result schema
export const ocrResultSchema = z.object({
  receiptId: z.string().uuid(),
  text: z.string().max(10000, 'OCR text cannot exceed 10,000 characters'),
  confidence: ocrConfidenceSchema,
  extractedAmount: extractedAmountSchema.optional(),
  extractedDate: dateString.optional(),
  extractedVendor: vendorNameSchema.optional(),
  processingTime: z.number().min(0, 'Processing time cannot be negative'),
  
  // Additional extracted data
  extractedData: z.object({
    lineItems: z.array(z.object({
      description: z.string().max(200),
      amount: extractedAmountSchema,
      quantity: z.number().min(0).optional()
    })).optional(),
    tax: extractedAmountSchema.optional(),
    currency: z.string().length(3).optional(),
    receiptNumber: optionalStringWithMax(50),
    merchantInfo: z.object({
      name: vendorNameSchema.optional(),
      address: optionalStringWithMax(500),
      phone: optionalStringWithMax(20),
      email: z.string().email().optional()
    }).optional()
  }).optional(),
  
  // Raw OCR data for debugging
  rawData: z.record(z.any()).optional()
})

// Batch receipt upload schema
export const batchReceiptUploadSchema = z.object({
  receipts: z.array(receiptUploadSchema).min(1, 'At least one receipt is required').max(10, 'Cannot upload more than 10 receipts at once'),
  expenseId: z.string().uuid().optional(),
  options: z.object({
    autoProcess: z.boolean().default(true),
    skipDuplicates: z.boolean().default(true),
    maxConcurrent: z.number().min(1).max(5).default(3)
  }).optional()
}).refine(
  (data) => {
    // Total file size limit for batch upload (50MB)
    const totalSize = data.receipts.reduce((sum, receipt) => sum + receipt.fileSize, 0)
    return totalSize <= 50 * 1024 * 1024
  },
  {
    message: 'Total batch size cannot exceed 50MB',
    path: ['receipts']
  }
)

// Camera options schema
export const cameraOptionsSchema = z.object({
  facingMode: z.enum(['user', 'environment']).default('environment'),
  width: z.number().min(320).max(4096).default(1920),
  height: z.number().min(240).max(4096).default(1080),
  quality: z.number().min(0.1).max(1).default(0.8)
})

// Image compression options schema
export const compressionOptionsSchema = z.object({
  maxWidth: z.number().min(100).max(4096).default(1920),
  maxHeight: z.number().min(100).max(4096).default(1080),
  quality: z.number().min(0.1).max(1).default(0.8),
  format: z.enum(['jpeg', 'webp', 'png']).default('jpeg'),
  maxFileSize: z.number().min(100000).max(10 * 1024 * 1024).default(2 * 1024 * 1024) // Default 2MB
})

// Receipt template schema
export const receiptTemplateSchema = z.object({
  name: requiredStringWithMax(100, 'Template name must be less than 100 characters'),
  description: optionalStringWithMax(300, 'Template description must be less than 300 characters'),
  defaultFilename: filenameSchema,
  expectedFields: z.array(z.enum([
    'amount',
    'date', 
    'vendor',
    'tax',
    'currency',
    'receiptNumber',
    'lineItems'
  ])).min(1, 'At least one expected field is required'),
  ocrTemplate: optionalStringWithMax(1000, 'OCR template must be less than 1000 characters'),
  isPublic: z.boolean().default(false),
  createdBy: z.string().uuid(),
  tags: z.array(z.string().max(50)).max(10).optional()
})

// Combined schemas with auditing
export const auditableReceiptSchema = receiptSchema.and(auditableSchema)
export const auditableReceiptTemplateSchema = receiptTemplateSchema.and(auditableSchema)

// Export type definitions for TypeScript
export type OcrStatus = z.infer<typeof ocrStatusSchema>
export type ReceiptMimeType = z.infer<typeof receiptMimeTypeSchema>

export type Receipt = z.infer<typeof receiptSchema>
export type ReceiptUpload = z.infer<typeof receiptUploadSchema>
export type ReceiptUpdate = z.infer<typeof receiptUpdateSchema>
export type ReceiptSearch = z.infer<typeof receiptSearchSchema>
export type OcrProcessingRequest = z.infer<typeof ocrProcessingSchema>
export type OcrResult = z.infer<typeof ocrResultSchema>
export type BatchReceiptUpload = z.infer<typeof batchReceiptUploadSchema>
export type CameraOptions = z.infer<typeof cameraOptionsSchema>
export type CompressionOptions = z.infer<typeof compressionOptionsSchema>
export type ReceiptTemplate = z.infer<typeof receiptTemplateSchema>

// Common receipt validation patterns
export const validateReceiptFile = (file: File): string | null => {
  if (file.size === 0) return 'File cannot be empty'
  if (file.size > 10 * 1024 * 1024) return 'File size cannot exceed 10MB'
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  if (!allowedTypes.includes(file.type)) {
    return 'File must be an image (JPEG, PNG, WebP, or HEIC)'
  }
  
  return null
}

// Receipt processing status helpers
export const isProcessingComplete = (status: OcrStatus): boolean => {
  return status === 'COMPLETED' || status === 'FAILED'
}

export const canRetryProcessing = (status: OcrStatus): boolean => {
  return status === 'FAILED' || status === 'PENDING'
}

export const getStatusColor = (status: OcrStatus): string => {
  switch (status) {
    case 'PENDING': return 'yellow'
    case 'PROCESSING': return 'blue'
    case 'COMPLETED': return 'green'
    case 'FAILED': return 'red'
    default: return 'gray'
  }
}