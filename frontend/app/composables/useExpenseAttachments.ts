import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Expense attachment interface with explicit state modeling
 */
interface IExpenseAttachment {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  url?: string
  uploadedAt: string
  uploadedBy?: string
}

/**
 * Attachment upload state interface
 */
interface IAttachmentUploadState {
  isUploading: boolean
  progress: number
  error: string | null
}

/**
 * Attachment state interface
 */
interface IAttachmentState {
  data: IExpenseAttachment[]
  isLoading: boolean
  error: string | null
  upload: IAttachmentUploadState
}

/**
 * Composable for expense attachment management
 * Extracts attachment logic from UI components
 */
export function useExpenseAttachments() {
  const { t } = useI18n()

  // State with explicit modeling instead of union types
  const attachmentState = ref<IAttachmentState>({
    data: [],
    isLoading: false,
    error: null,
    upload: {
      isUploading: false,
      progress: 0,
      error: null
    }
  })

  // Computed properties
  const attachments = computed(() => attachmentState.value.data)
  const isLoading = computed(() => attachmentState.value.isLoading)
  const error = computed(() => attachmentState.value.error)
  const isUploading = computed(() => attachmentState.value.upload.isUploading)
  const uploadProgress = computed(() => attachmentState.value.upload.progress)
  const uploadError = computed(() => attachmentState.value.upload.error)

  // Methods for attachment management
  const getAttachmentById = (attachmentId: string): IExpenseAttachment | undefined => {
    return attachments.value.find(attachment => attachment.id === attachmentId)
  }

  const getAttachmentName = (attachmentId: string): string => {
    const attachment = getAttachmentById(attachmentId)
    return attachment?.originalName || `attachment_${attachmentId}.pdf`
  }

  const getAttachmentsByIds = (attachmentIds: string[]): IExpenseAttachment[] => {
    return attachmentIds.map(id => getAttachmentById(id)).filter(Boolean) as IExpenseAttachment[]
  }

  const removeAttachmentFromList = (
    attachmentId: string,
    currentAttachmentIds: string[],
    onChange: (newAttachmentIds: string[]) => void
  ): string[] => {
    const newAttachmentIds = currentAttachmentIds.filter(id => id !== attachmentId)
    onChange(newAttachmentIds)
    return newAttachmentIds
  }

  const addAttachmentToList = (
    attachmentId: string,
    currentAttachmentIds: string[],
    onChange: (newAttachmentIds: string[]) => void
  ): string[] => {
    if (currentAttachmentIds.includes(attachmentId)) {
      return currentAttachmentIds // Already exists
    }
    const newAttachmentIds = [...currentAttachmentIds, attachmentId]
    onChange(newAttachmentIds)
    return newAttachmentIds
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'lucide:image'
    if (mimeType === 'application/pdf') return 'lucide:file-text'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'lucide:file-spreadsheet'
    if (mimeType.includes('document') || mimeType.includes('word')) return 'lucide:file-text'
    return 'lucide:file'
  }

  const validateFileType = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    return allowedTypes.includes(file.type)
  }

  const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  }

  // API methods
  const loadAttachments = async (attachmentIds?: string[]): Promise<void> => {
    try {
      attachmentState.value.isLoading = true
      attachmentState.value.error = null

      // TODO: Replace with actual API call when backend is ready
      // const response = await $fetch('/api/expenses/attachments', {
      //   query: attachmentIds ? { ids: attachmentIds.join(',') } : {}
      // })
      // attachmentState.value.data = response.data

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 200))
      
      if (attachmentIds && attachmentIds.length > 0) {
        // Load specific attachments
        attachmentState.value.data = attachmentIds.map(id => ({
          id,
          fileName: `file_${id}.pdf`,
          originalName: `Document ${id}.pdf`,
          fileSize: 1024 * 500, // 500KB
          mimeType: 'application/pdf',
          uploadedAt: new Date().toISOString()
        }))
      }

    } catch (err) {
      attachmentState.value.error = err instanceof Error ? err.message : 'Failed to load attachments'
      console.error('Failed to load attachments:', err)
    } finally {
      attachmentState.value.isLoading = false
    }
  }

  const uploadAttachment = async (file: File): Promise<IExpenseAttachment | null> => {
    try {
      // Validate file
      if (!validateFileType(file)) {
        attachmentState.value.upload.error = t('expense.attachments.errors.invalidType')
        return null
      }

      if (!validateFileSize(file)) {
        attachmentState.value.upload.error = t('expense.attachments.errors.fileTooLarge')
        return null
      }

      attachmentState.value.upload.isUploading = true
      attachmentState.value.upload.progress = 0
      attachmentState.value.upload.error = null

      // TODO: Replace with actual file upload API
      // const formData = new FormData()
      // formData.append('file', file)
      // 
      // const response = await $fetch('/api/expenses/attachments/upload', {
      //   method: 'POST',
      //   body: formData,
      //   onUploadProgress: (progress) => {
      //     attachmentState.value.upload.progress = Math.round((progress.loaded / progress.total) * 100)
      //   }
      // })

      // Mock upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        attachmentState.value.upload.progress = progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Mock successful upload
      const newAttachment: IExpenseAttachment = {
        id: Date.now().toString(),
        fileName: `${Date.now()}_${file.name}`,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString()
      }

      attachmentState.value.data.push(newAttachment)
      return newAttachment

    } catch (err) {
      attachmentState.value.upload.error = err instanceof Error ? err.message : 'Failed to upload file'
      console.error('Failed to upload attachment:', err)
      return null
    } finally {
      attachmentState.value.upload.isUploading = false
      attachmentState.value.upload.progress = 0
    }
  }

  const deleteAttachment = async (attachmentId: string): Promise<boolean> => {
    try {
      attachmentState.value.isLoading = true
      attachmentState.value.error = null

      // TODO: Replace with actual API call
      // await $fetch(`/api/expenses/attachments/${attachmentId}`, { method: 'DELETE' })

      // Mock deletion
      await new Promise(resolve => setTimeout(resolve, 200))
      attachmentState.value.data = attachmentState.value.data.filter(att => att.id !== attachmentId)
      return true

    } catch (err) {
      attachmentState.value.error = err instanceof Error ? err.message : 'Failed to delete attachment'
      console.error('Failed to delete attachment:', err)
      return false
    } finally {
      attachmentState.value.isLoading = false
    }
  }

  const downloadAttachment = (attachmentId: string): void => {
    const attachment = getAttachmentById(attachmentId)
    if (!attachment) {
      console.error('Attachment not found:', attachmentId)
      return
    }

    // TODO: Replace with actual download logic
    // window.open(attachment.url, '_blank')
    console.log('Download attachment:', attachment.originalName)
  }

  return {
    // State (readonly to prevent direct mutation)
    attachments,
    isLoading,
    error,
    isUploading,
    uploadProgress,
    uploadError,
    
    // Methods
    getAttachmentById,
    getAttachmentName,
    getAttachmentsByIds,
    removeAttachmentFromList,
    addAttachmentToList,
    formatFileSize,
    getFileIcon,
    validateFileType,
    validateFileSize,
    
    // API methods
    loadAttachments,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment
  }
}

// Export types for better type safety
export type { IExpenseAttachment, IAttachmentState, IAttachmentUploadState }