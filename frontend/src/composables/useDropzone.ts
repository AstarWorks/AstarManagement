import { ref, computed } from 'vue'
import { useDropzone as useVueUseDropzone } from '@vueuse/integrations/useDropzone'
import type { UseDropzoneOptions } from '@vueuse/integrations/useDropzone'
import { documentFileSchema, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '~/schemas/document'
import { useToast } from '~/composables/useToast'

export interface DropzoneOptions extends Omit<UseDropzoneOptions, 'onDrop'> {
  onDrop?: (files: File[], rejectedFiles: RejectedFile[]) => void
  onError?: (error: string) => void
  validateFiles?: boolean
}

export interface RejectedFile {
  file: File
  errors: string[]
}

export function useDropzone(options: DropzoneOptions = {}) {
  const { showToast } = useToast()
  const isValidating = ref(false)
  const validationErrors = ref<Map<string, string[]>>(new Map())
  
  const validateFile = (file: File): string[] => {
    const errors: string[] = []
    
    try {
      documentFileSchema.shape.file.parse(file)
    } catch (error: any) {
      if (error.errors) {
        errors.push(...error.errors.map((e: any) => e.message))
      } else {
        errors.push('Invalid file')
      }
    }
    
    return errors
  }
  
  const handleDrop = async (acceptedFiles: File[]) => {
    if (!options.validateFiles) {
      options.onDrop?.(acceptedFiles, [])
      return
    }
    
    isValidating.value = true
    validationErrors.value.clear()
    
    const validFiles: File[] = []
    const rejectedFiles: RejectedFile[] = []
    
    for (const file of acceptedFiles) {
      const errors = validateFile(file)
      
      if (errors.length > 0) {
        rejectedFiles.push({ file, errors })
        validationErrors.value.set(file.name, errors)
      } else {
        validFiles.push(file)
      }
    }
    
    isValidating.value = false
    
    // Show errors for rejected files
    if (rejectedFiles.length > 0) {
      const errorMessage = rejectedFiles.length === 1
        ? `${rejectedFiles[0].file.name}: ${rejectedFiles[0].errors.join(', ')}`
        : `${rejectedFiles.length} files were rejected due to validation errors`
      
      showToast(errorMessage, 'error')
      options.onError?.(errorMessage)
    }
    
    // Call the provided onDrop handler
    options.onDrop?.(validFiles, rejectedFiles)
  }
  
  const dropzoneOptions: UseDropzoneOptions = {
    ...options,
    onDrop: handleDrop,
    accept: options.accept || {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt']
    },
    maxSize: options.maxSize || MAX_FILE_SIZE,
    multiple: options.multiple !== false
  }
  
  const dropzone = useVueUseDropzone(dropzoneOptions)
  
  const dropzoneClasses = computed(() => ({
    'relative border-2 border-dashed rounded-lg transition-all duration-200': true,
    'border-muted-foreground/25 bg-muted/5 hover:border-muted-foreground/50': !dropzone.isDragActive.value,
    'border-primary bg-primary/5 scale-[1.02]': dropzone.isDragActive.value,
    'cursor-pointer': !options.disabled,
    'opacity-50 cursor-not-allowed': options.disabled
  }))
  
  const hasErrors = computed(() => validationErrors.value.size > 0)
  
  const clearErrors = () => {
    validationErrors.value.clear()
  }
  
  return {
    ...dropzone,
    isValidating,
    validationErrors,
    hasErrors,
    clearErrors,
    dropzoneClasses,
    // Helper methods
    formatFileSize: (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    isFileTypeAccepted: (file: File) => ACCEPTED_FILE_TYPES.includes(file.type)
  }
}