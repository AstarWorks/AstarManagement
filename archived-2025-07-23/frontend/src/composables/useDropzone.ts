import { ref, computed } from 'vue'
import { documentFileSchema, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '~/schemas/document'
import { useToast } from '~/composables/useToast'

export interface DropzoneOptions {
  onDrop?: (files: File[], rejectedFiles: RejectedFile[]) => void
  onError?: (error: string) => void
  validateFiles?: boolean
  disabled?: boolean
  multiple?: boolean
  maxFiles?: number
  accept?: Record<string, string[]>
  maxSize?: number
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
  
  // Create manual dropzone implementation
  const isDragActive = ref(false)
  const inputRef = ref<HTMLInputElement>()
  
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!options.disabled) {
      isDragActive.value = true
    }
  }
  
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDragActive.value = false
  }
  
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDropEvent = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDragActive.value = false
    
    if (options.disabled || !e.dataTransfer?.files) return
    
    const files = Array.from(e.dataTransfer.files)
    handleDrop(files)
  }
  
  const open = () => {
    inputRef.value?.click()
  }
  
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) {
      const files = Array.from(target.files)
      handleDrop(files)
    }
  }
  
  const getRootProps = () => ({
    onDragenter: handleDragEnter,
    onDragleave: handleDragLeave,
    onDragover: handleDragOver,
    onDrop: handleDropEvent,
    onClick: () => !options.disabled && open()
  })
  
  const getInputProps = () => ({
    ref: inputRef,
    type: 'file',
    multiple: options.multiple !== false,
    accept: Object.keys(options.accept || {}).join(','),
    style: { display: 'none' },
    onChange: handleInputChange
  })
  
  const dropzoneClasses = computed(() => ({
    'relative border-2 border-dashed rounded-lg transition-all duration-200': true,
    'border-muted-foreground/25 bg-muted/5 hover:border-muted-foreground/50': !isDragActive.value,
    'border-primary bg-primary/5 scale-[1.02]': isDragActive.value,
    'cursor-pointer': !options.disabled,
    'opacity-50 cursor-not-allowed': options.disabled
  }))
  
  const hasErrors = computed(() => validationErrors.value.size > 0)
  
  const clearErrors = () => {
    validationErrors.value.clear()
  }
  
  return {
    getRootProps,
    getInputProps,
    isDragActive,
    open,
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