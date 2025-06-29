import { z } from 'zod'

// File validation constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain'
]

export const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']

// File validation schema
export const documentFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    })
    .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type), {
      message: 'File type not supported. Supported types: PDF, DOC, DOCX, JPG, PNG, TXT'
    })
    .refine((file) => /^[\w\-. ]+$/.test(file.name), {
      message: 'File name contains invalid characters. Only letters, numbers, spaces, dots, hyphens and underscores are allowed'
    })
})

// Document metadata schema
export const documentMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  matterId: z.string().uuid('Invalid matter ID').optional(),
  category: z.enum(['contract', 'evidence', 'correspondence', 'court_filing', 'other']),
  tags: z.array(z.string()).default([]),
  confidential: z.boolean().default(false)
})

// Combined upload schema
export const documentUploadSchema = z.object({
  file: documentFileSchema.shape.file,
  metadata: documentMetadataSchema
})

export type DocumentFileInput = z.infer<typeof documentFileSchema>
export type DocumentMetadataInput = z.infer<typeof documentMetadataSchema>
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>

// Helper functions
export function getFileTypeFromMimeType(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'text/plain': 'TXT'
  }
  
  return typeMap[mimeType] || 'Unknown'
}

export function getFileIcon(mimeType: string): string {
  const iconMap: Record<string, string> = {
    'application/pdf': 'FileText',
    'application/msword': 'FileText',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'FileText',
    'image/jpeg': 'Image',
    'image/png': 'Image',
    'text/plain': 'FileText'
  }
  
  return iconMap[mimeType] || 'File'
}

export function isValidFileName(fileName: string): boolean {
  return /^[\w\-. ]+$/.test(fileName)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 KB/s'
  
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
  
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return 'calculating...'
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}