/**
 * File Upload Composable for Memo Attachments
 * Provides drag-and-drop file upload with progress tracking and validation
 */

import { ref, readonly } from 'vue'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  preview?: string
  uploadProgress?: number
  error?: string
}

export interface FileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  maxFiles?: number
  uploadEndpoint?: string
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ],
    maxFiles = 10,
    uploadEndpoint = '/api/upload'
  } = options

  const uploadingFiles = ref<Map<string, UploadedFile>>(new Map())
  const uploadedFiles = ref<UploadedFile[]>([])
  const isDragging = ref(false)
  const dragCounter = ref(0)
  const isUploading = ref(false)

  /**
   * Validate a file against size and type constraints
   */
  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return `File size exceeds ${maxSizeMB}MB limit`
    }

    if (!allowedTypes.includes(file.type)) {
      return `File type "${file.type}" is not allowed`
    }

    if (uploadedFiles.value.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`
    }

    return null
  }

  /**
   * Generate preview for image files
   */
  const generatePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
    }
    return undefined
  }

  /**
   * Upload a single file with progress tracking
   */
  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const validation = validateFile(file)
    if (validation) {
      throw new Error(validation)
    }

    const fileId = crypto.randomUUID()
    const preview = await generatePreview(file)
    
    const uploadFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
      preview,
      uploadProgress: 0,
    }

    uploadingFiles.value.set(fileId, uploadFile)
    isUploading.value = true

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'memo-attachment')

      // For now, simulate upload with progress
      // In real implementation, this would be replaced with actual upload
      const response = await simulateUpload(formData, (progress: number) => {
        const file = uploadingFiles.value.get(fileId)
        if (file) {
          file.uploadProgress = progress
        }
      })

      uploadFile.url = response.url
      uploadFile.uploadProgress = 100
      
      uploadingFiles.value.delete(fileId)
      uploadedFiles.value.push(uploadFile)
      
      return uploadFile
    } catch (error) {
      uploadFile.error = error instanceof Error ? error.message : 'Upload failed'
      uploadingFiles.value.delete(fileId)
      return null
    } finally {
      if (uploadingFiles.value.size === 0) {
        isUploading.value = false
      }
    }
  }

  /**
   * Simulate file upload with progress (for development)
   * Replace with actual API call in production
   */
  const simulateUpload = async (
    formData: FormData, 
    onProgress: (progress: number) => void
  ): Promise<{ url: string }> => {
    return new Promise((resolve, reject) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress > 100) progress = 100
        
        onProgress(Math.round(progress))
        
        if (progress >= 100) {
          clearInterval(interval)
          // Simulate successful upload
          if (Math.random() > 0.1) { // 90% success rate
            resolve({
              url: `https://example.com/uploads/${crypto.randomUUID()}`
            })
          } else {
            reject(new Error('Upload failed'))
          }
        }
      }, 100)
    })
  }

  /**
   * Upload multiple files concurrently
   */
  const uploadFiles = async (files: File[]): Promise<UploadedFile[]> => {
    const promises = files.map(file => 
      uploadFile(file).catch(err => {
        console.error('File upload failed:', err)
        return null
      })
    )
    
    const results = await Promise.all(promises)
    return results.filter(Boolean) as UploadedFile[]
  }

  /**
   * Remove an uploaded file
   */
  const removeFile = (fileId: string) => {
    // Revoke preview URL to prevent memory leak
    const file = uploadedFiles.value.find(f => f.id === fileId)
    if (file?.preview && file.preview.startsWith('blob:')) {
      URL.revokeObjectURL(file.preview)
    }
    
    uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== fileId)
    uploadingFiles.value.delete(fileId)
  }

  /**
   * Clear all uploaded files
   */
  const clearFiles = () => {
    uploadedFiles.value = []
    uploadingFiles.value.clear()
    isUploading.value = false
  }

  /**
   * Drag and drop event handlers
   */
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    dragCounter.value++
    isDragging.value = true
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    dragCounter.value--
    if (dragCounter.value === 0) {
      isDragging.value = false
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
    dragCounter.value = 0

    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }

  /**
   * Get file size formatted for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file type icon class
   */
  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return 'lucide-file-text'
    if (type.includes('word')) return 'lucide-file-text'
    if (type.includes('image')) return 'lucide-image'
    return 'lucide-file'
  }

  return {
    // State
    uploadingFiles: readonly(uploadingFiles),
    uploadedFiles,
    isDragging: readonly(isDragging),
    isUploading: readonly(isUploading),
    
    // Actions
    uploadFile,
    uploadFiles,
    removeFile,
    clearFiles,
    
    // Drag & Drop
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    
    // Utilities
    formatFileSize,
    getFileIcon,
    validateFile,
    
    // Config
    maxSize,
    allowedTypes,
    maxFiles,
  }
}