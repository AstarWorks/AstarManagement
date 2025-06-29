import { ref, computed } from 'vue'
import type { UploadItem, UploadMetadata } from '~/types/document'
import { useDocumentUploadStore } from '~/stores/documentUpload'
import { useToast } from '~/composables/useToast'
import { documentFileSchema } from '~/schemas/document'

export interface FileUploadOptions {
  matterId?: string
  category?: string
  defaultMetadata?: Partial<UploadMetadata>
  onSuccess?: (documentIds: string[]) => void
  onError?: (error: string) => void
  validateBeforeUpload?: boolean
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const uploadStore = useDocumentUploadStore()
  const { showToast } = useToast()
  
  const isUploading = computed(() => uploadStore.hasActiveUploads)
  const uploadProgress = computed(() => {
    const active = uploadStore.activeQueue
    if (active.length === 0) return 0
    
    const totalProgress = active.reduce((sum, item) => sum + item.progress, 0)
    return Math.round(totalProgress / active.length)
  })
  
  const validateFiles = (files: File[]): { valid: File[], invalid: Array<{ file: File, error: string }> } => {
    const valid: File[] = []
    const invalid: Array<{ file: File, error: string }> = []
    
    for (const file of files) {
      try {
        documentFileSchema.shape.file.parse(file)
        valid.push(file)
      } catch (error: any) {
        const errorMessage = error.errors?.[0]?.message || 'Invalid file'
        invalid.push({ file, error: errorMessage })
      }
    }
    
    return { valid, invalid }
  }
  
  const uploadFiles = async (files: File[]) => {
    // Validate files if enabled
    if (options.validateBeforeUpload !== false) {
      const { valid, invalid } = validateFiles(files)
      
      if (invalid.length > 0) {
        const errorMessage = invalid.map(({ file, error }) => 
          `${file.name}: ${error}`
        ).join('\n')
        
        showToast(`Failed to upload ${invalid.length} file(s):\n${errorMessage}`, 'error')
        options.onError?.(errorMessage)
        
        // Continue with valid files only
        files = valid
      }
      
      if (files.length === 0) {
        return []
      }
    }
    
    // Prepare default metadata
    const defaultMetadata: Partial<UploadMetadata> = {
      matterId: options.matterId,
      category: options.category as any || 'other',
      ...options.defaultMetadata
    }
    
    // Add files to upload queue
    const uploadIds = uploadStore.addToQueue(files, defaultMetadata)
    
    // Show notification
    showToast(
      `Added ${files.length} file(s) to upload queue`, 
      'success'
    )
    
    // Monitor uploads for completion
    if (options.onSuccess) {
      const checkCompletion = setInterval(() => {
        const items = uploadStore.queue.filter(item => 
          uploadIds.includes(item.id)
        )
        
        const allCompleted = items.every(item => 
          item.status === 'completed' || item.status === 'failed'
        )
        
        if (allCompleted) {
          clearInterval(checkCompletion)
          
          const successful = items
            .filter(item => item.status === 'completed' && item.documentId)
            .map(item => item.documentId!)
          
          if (successful.length > 0) {
            options.onSuccess(successful)
          }
          
          const failed = items.filter(item => item.status === 'failed')
          if (failed.length > 0) {
            const errorMessage = `${failed.length} file(s) failed to upload`
            showToast(errorMessage, 'error')
            options.onError?.(errorMessage)
          }
        }
      }, 1000)
    }
    
    return uploadIds
  }
  
  const cancelUpload = (uploadId: string) => {
    uploadStore.cancelUpload(uploadId)
    showToast('Upload cancelled', 'warning')
  }
  
  const retryUpload = (uploadId: string) => {
    uploadStore.retryUpload(uploadId)
    showToast('Retrying upload', 'default')
  }
  
  const pauseUpload = (uploadId: string) => {
    uploadStore.pauseUpload(uploadId)
    showToast('Upload paused', 'default')
  }
  
  const resumeUpload = (uploadId: string) => {
    uploadStore.resumeUpload(uploadId)
    showToast('Upload resumed', 'default')
  }
  
  const clearCompleted = () => {
    uploadStore.clearCompleted()
  }
  
  const clearAll = () => {
    uploadStore.clearAll()
    showToast('All uploads cleared', 'default')
  }
  
  return {
    // State
    isUploading,
    uploadProgress,
    queue: uploadStore.queue,
    stats: uploadStore.stats,
    
    // Actions
    uploadFiles,
    cancelUpload,
    retryUpload,
    pauseUpload,
    resumeUpload,
    clearCompleted,
    clearAll
  }
}