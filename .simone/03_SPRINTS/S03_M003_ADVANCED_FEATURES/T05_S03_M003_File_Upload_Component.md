---
task_id: T05_S03_M003
title: File Upload Component with Drag-and-Drop
status: pending
estimated_hours: 6
actual_hours: null
assigned_to: Claude
dependencies: ["T02_S03_M003_CSV_Import_UI"]
complexity: Medium
updated: null
completed: null
---

# T05_S03_M003: File Upload Component with Drag-and-Drop

## Description
Create a comprehensive file upload component with drag-and-drop functionality, progress indicators, chunked upload implementation, and file validation. This component will be reusable across the expense management system for CSV imports, attachment uploads, and document management. Focus on user experience, error handling, and performance optimization for various file sizes.

## Acceptance Criteria
- [ ] Implement drag-and-drop file upload with visual feedback
- [ ] Add progress indicators for upload operations
- [ ] Support chunked uploads for large files (>10MB)
- [ ] Comprehensive file validation (type, size, content)
- [ ] Multiple file selection and batch upload
- [ ] Upload cancellation and retry functionality
- [ ] Preview thumbnails for image files
- [ ] Responsive design for mobile and desktop
- [ ] Japanese localization for all user messages
- [ ] Integration with existing attachment system

## Technical Details

### 1. Core Upload Component

**Location**: `frontend/app/components/ui/FileUpload.vue`

**Component Interface**:
```vue
<template>
  <div class="file-upload-container">
    <!-- Drop Zone -->
    <div
      ref="dropZone"
      class="drop-zone"
      :class="dropZoneClasses"
      @click="selectFiles"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        :accept="acceptedTypes"
        :disabled="disabled"
        class="hidden"
        @change="handleFileSelect"
      />
      
      <!-- Drop Zone Content -->
      <div class="drop-zone-content">
        <Icon 
          :name="getDropZoneIcon()" 
          class="w-12 h-12 mx-auto mb-3 text-muted-foreground" 
        />
        <p class="font-medium mb-1">
          {{ dragActive ? t('fileUpload.dropHere') : t('fileUpload.selectOrDrop') }}
        </p>
        <p class="text-sm text-muted-foreground mb-2">
          {{ t('fileUpload.supportedFormats', { formats: formatAcceptedTypes() }) }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ t('fileUpload.maxSize', { size: formatFileSize(maxFileSize) }) }}
        </p>
      </div>
    </div>

    <!-- Upload Queue -->
    <div v-if="uploadQueue.length > 0" class="upload-queue mt-4">
      <div class="mb-3 flex justify-between items-center">
        <h4 class="font-medium">{{ t('fileUpload.uploadQueue') }}</h4>
        <Button
          v-if="hasActiveUploads"
          variant="outline"
          size="sm"
          @click="cancelAllUploads"
        >
          {{ t('fileUpload.cancelAll') }}
        </Button>
      </div>
      
      <div class="space-y-2">
        <FileUploadItem
          v-for="file in uploadQueue"
          :key="file.id"
          :file="file"
          @cancel="cancelUpload"
          @retry="retryUpload"
          @remove="removeFromQueue"
        />
      </div>
    </div>

    <!-- Upload Summary -->
    <div v-if="showSummary && completedUploads.length > 0" class="upload-summary mt-4">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="lucide:check-circle" class="w-4 h-4 text-green-600" />
        {{ t('fileUpload.summary', { 
          completed: completedUploads.length, 
          total: totalFiles 
        }) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadFile, UploadOptions, UploadResult } from '~/types/upload'

interface Props {
  multiple?: boolean
  acceptedTypes?: string
  maxFileSize?: number
  maxFiles?: number
  uploadUrl?: string
  chunkedUpload?: boolean
  chunkSize?: number
  showSummary?: boolean
  disabled?: boolean
  immediate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  acceptedTypes: '*/*',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  chunkedUpload: true,
  chunkSize: 1024 * 1024, // 1MB chunks
  showSummary: true,
  disabled: false,
  immediate: true
})

const emit = defineEmits<{
  filesSelected: [files: File[]]
  uploadStart: [file: UploadFile]
  uploadProgress: [file: UploadFile, progress: number]
  uploadComplete: [file: UploadFile, result: UploadResult]
  uploadError: [file: UploadFile, error: Error]
  uploadCancelled: [file: UploadFile]
}>()
</script>
```

### 2. Upload File Item Component

**Location**: `frontend/app/components/ui/FileUploadItem.vue`

```vue
<template>
  <div class="upload-item" :class="itemClasses">
    <div class="flex items-center gap-3">
      <!-- File Icon/Thumbnail -->
      <div class="flex-shrink-0">
        <div v-if="file.thumbnail" class="w-10 h-10 rounded overflow-hidden">
          <img 
            :src="file.thumbnail" 
            :alt="file.name"
            class="w-full h-full object-cover"
          />
        </div>
        <div v-else class="w-10 h-10 rounded bg-muted flex items-center justify-center">
          <Icon :name="getFileIcon(file.type)" class="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      <!-- File Info -->
      <div class="flex-1 min-w-0">
        <p class="font-medium truncate">{{ file.name }}</p>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{{ formatFileSize(file.size) }}</span>
          <span v-if="file.status === 'uploading'">
            {{ Math.round(file.progress) }}%
          </span>
          <span v-else-if="file.status === 'completed'" class="text-green-600">
            {{ t('fileUpload.status.completed') }}
          </span>
          <span v-else-if="file.status === 'error'" class="text-red-600">
            {{ file.error || t('fileUpload.status.error') }}
          </span>
        </div>

        <!-- Progress Bar -->
        <div v-if="file.status === 'uploading'" class="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            class="h-full bg-primary transition-all duration-300"
            :style="{ width: `${file.progress}%` }"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <Button
          v-if="file.status === 'uploading'"
          variant="ghost"
          size="sm"
          @click="$emit('cancel', file.id)"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </Button>
        
        <Button
          v-else-if="file.status === 'error'"
          variant="ghost"
          size="sm"
          @click="$emit('retry', file.id)"
        >
          <Icon name="lucide:refresh-cw" class="w-4 h-4" />
        </Button>
        
        <Button
          v-if="file.status !== 'uploading'"
          variant="ghost"
          size="sm"
          @click="$emit('remove', file.id)"
        >
          <Icon name="lucide:trash-2" class="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadFile } from '~/types/upload'

interface Props {
  file: UploadFile
}

defineProps<Props>()

defineEmits<{
  cancel: [fileId: string]
  retry: [fileId: string]
  remove: [fileId: string]
}>()

const { t } = useI18n()

const itemClasses = computed(() => [
  'p-3 border rounded-lg transition-colors',
  {
    'bg-muted/50': props.file.status === 'pending',
    'bg-blue-50 border-blue-200': props.file.status === 'uploading',
    'bg-green-50 border-green-200': props.file.status === 'completed',
    'bg-red-50 border-red-200': props.file.status === 'error'
  }
])
</script>
```

### 3. Upload Service with Chunked Upload

**Location**: `frontend/app/services/uploadService.ts`

```typescript
export interface UploadOptions {
  chunked?: boolean
  chunkSize?: number
  maxRetries?: number
  headers?: Record<string, string>
  onProgress?: (progress: number) => void
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void
}

export interface ChunkUploadResponse {
  chunkId: string
  uploaded: boolean
  nextChunkIndex?: number
}

export class UploadService {
  private static instance: UploadService
  
  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService()
    }
    return UploadService.instance
  }

  async uploadFile(
    file: File,
    uploadUrl: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      chunked = true,
      chunkSize = 1024 * 1024, // 1MB
      maxRetries = 3,
      headers = {},
      onProgress,
      onChunkComplete
    } = options

    if (chunked && file.size > chunkSize) {
      return this.uploadFileChunked(file, uploadUrl, {
        chunkSize,
        maxRetries,
        headers,
        onProgress,
        onChunkComplete
      })
    } else {
      return this.uploadFileComplete(file, uploadUrl, {
        maxRetries,
        headers,
        onProgress
      })
    }
  }

  private async uploadFileChunked(
    file: File,
    uploadUrl: string,
    options: Required<Pick<UploadOptions, 'chunkSize' | 'maxRetries' | 'headers'>> & 
            Pick<UploadOptions, 'onProgress' | 'onChunkComplete'>
  ): Promise<UploadResult> {
    const totalChunks = Math.ceil(file.size / options.chunkSize)
    const uploadId = generateUploadId()
    let uploadedBytes = 0

    // Initialize upload session
    await this.initializeChunkedUpload(uploadUrl, file, uploadId, totalChunks)

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * options.chunkSize
      const end = Math.min(start + options.chunkSize, file.size)
      const chunk = file.slice(start, end)

      let retries = 0
      let chunkUploaded = false

      while (!chunkUploaded && retries < options.maxRetries) {
        try {
          const formData = new FormData()
          formData.append('chunk', chunk)
          formData.append('chunkIndex', chunkIndex.toString())
          formData.append('totalChunks', totalChunks.toString())
          formData.append('uploadId', uploadId)
          formData.append('fileName', file.name)

          const response = await fetch(`${uploadUrl}/chunk`, {
            method: 'POST',
            headers: options.headers,
            body: formData
          })

          if (!response.ok) {
            throw new Error(`Chunk upload failed: ${response.statusText}`)
          }

          const result: ChunkUploadResponse = await response.json()
          chunkUploaded = result.uploaded

          uploadedBytes += chunk.size
          const progress = (uploadedBytes / file.size) * 100
          options.onProgress?.(progress)
          options.onChunkComplete?.(chunkIndex, totalChunks)

        } catch (error) {
          retries++
          if (retries >= options.maxRetries) {
            throw new Error(`Failed to upload chunk ${chunkIndex} after ${retries} retries`)
          }
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
        }
      }
    }

    // Finalize upload
    return this.finalizeChunkedUpload(uploadUrl, uploadId, file)
  }

  private async uploadFileComplete(
    file: File,
    uploadUrl: string,
    options: Pick<UploadOptions, 'maxRetries' | 'headers' | 'onProgress'>
  ): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    let retries = 0
    
    while (retries < (options.maxRetries || 3)) {
      try {
        const xhr = new XMLHttpRequest()
        
        return new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100
              options.onProgress?.(progress)
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText))
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`))
            }
          })

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'))
          })

          xhr.open('POST', uploadUrl)
          
          // Set headers
          Object.entries(options.headers || {}).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value)
          })
          
          xhr.send(formData)
        })
      } catch (error) {
        retries++
        if (retries >= (options.maxRetries || 3)) {
          throw error
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
      }
    }

    throw new Error('Upload failed after all retries')
  }

  async cancelUpload(uploadId: string): Promise<void> {
    // Implementation for cancelling ongoing uploads
    // This would typically involve aborting XHR requests
    // and notifying the server to clean up partial uploads
  }
}

function generateUploadId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

### 4. File Validation Service

**Location**: `frontend/app/services/fileValidationService.ts`

```typescript
export interface ValidationRule {
  name: string
  validate: (file: File) => boolean | Promise<boolean>
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export class FileValidationService {
  private rules: ValidationRule[] = []

  addRule(rule: ValidationRule): void {
    this.rules.push(rule)
  }

  async validateFile(file: File): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    for (const rule of this.rules) {
      try {
        const isValid = await rule.validate(file)
        if (!isValid) {
          errors.push(rule.message)
        }
      } catch (error) {
        errors.push(`Validation error: ${error.message}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Predefined validation rules
  static createSizeRule(maxSize: number, message?: string): ValidationRule {
    return {
      name: 'fileSize',
      validate: (file: File) => file.size <= maxSize,
      message: message || `File size must be less than ${formatFileSize(maxSize)}`
    }
  }

  static createTypeRule(allowedTypes: string[], message?: string): ValidationRule {
    return {
      name: 'fileType',
      validate: (file: File) => {
        if (allowedTypes.includes('*/*')) return true
        return allowedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -1))
          }
          return file.type === type
        })
      },
      message: message || `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  static createImageRule(message?: string): ValidationRule {
    return {
      name: 'imageValidation',
      validate: async (file: File) => {
        if (!file.type.startsWith('image/')) return true
        
        return new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
          img.src = URL.createObjectURL(file)
        })
      },
      message: message || 'Invalid image file'
    }
  }
}
```

### 5. Upload Composable

**Location**: `frontend/app/composables/useFileUpload.ts`

```typescript
export const useFileUpload = (options: {
  uploadUrl?: string
  multiple?: boolean
  acceptedTypes?: string
  maxFileSize?: number
  maxFiles?: number
  chunkedUpload?: boolean
  immediate?: boolean
} = {}) => {
  const uploadQueue = ref<UploadFile[]>([])
  const completedUploads = ref<UploadFile[]>([])
  const uploading = ref(false)
  const uploadService = UploadService.getInstance()
  const validationService = new FileValidationService()

  // Setup validation rules
  if (options.maxFileSize) {
    validationService.addRule(
      FileValidationService.createSizeRule(options.maxFileSize)
    )
  }
  
  if (options.acceptedTypes && options.acceptedTypes !== '*/*') {
    const types = options.acceptedTypes.split(',').map(t => t.trim())
    validationService.addRule(
      FileValidationService.createTypeRule(types)
    )
  }

  const addFiles = async (files: File[]) => {
    const filesToAdd = options.multiple 
      ? files.slice(0, (options.maxFiles || 10) - uploadQueue.value.length)
      : [files[0]]

    for (const file of filesToAdd) {
      const validation = await validationService.validateFile(file)
      
      const uploadFile: UploadFile = {
        id: generateFileId(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: validation.valid ? 'pending' : 'error',
        progress: 0,
        error: validation.errors[0],
        thumbnail: await generateThumbnail(file)
      }

      uploadQueue.value.push(uploadFile)

      if (validation.valid && options.immediate !== false) {
        uploadFile.status = 'uploading'
        uploadSingleFile(uploadFile)
      }
    }
  }

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    if (!options.uploadUrl) return

    uploading.value = true
    uploadFile.status = 'uploading'
    uploadFile.progress = 0

    try {
      const result = await uploadService.uploadFile(uploadFile.file, options.uploadUrl, {
        chunked: options.chunkedUpload,
        onProgress: (progress) => {
          uploadFile.progress = progress
        }
      })

      uploadFile.status = 'completed'
      uploadFile.result = result
      completedUploads.value.push(uploadFile)

    } catch (error) {
      uploadFile.status = 'error'
      uploadFile.error = error.message
    } finally {
      uploading.value = uploadQueue.value.some(f => f.status === 'uploading')
    }
  }

  const cancelUpload = (fileId: string) => {
    const file = uploadQueue.value.find(f => f.id === fileId)
    if (file && file.status === 'uploading') {
      file.status = 'error'
      file.error = 'Cancelled by user'
      uploadService.cancelUpload(fileId)
    }
  }

  const retryUpload = (fileId: string) => {
    const file = uploadQueue.value.find(f => f.id === fileId)
    if (file && file.status === 'error') {
      uploadSingleFile(file)
    }
  }

  const removeFromQueue = (fileId: string) => {
    const index = uploadQueue.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      uploadQueue.value.splice(index, 1)
    }
  }

  const clearCompleted = () => {
    uploadQueue.value = uploadQueue.value.filter(f => f.status !== 'completed')
    completedUploads.value = []
  }

  return {
    uploadQueue: readonly(uploadQueue),
    completedUploads: readonly(completedUploads),
    uploading: readonly(uploading),
    addFiles,
    cancelUpload,
    retryUpload,
    removeFromQueue,
    clearCompleted
  }
}

async function generateThumbnail(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return undefined

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      const size = 64
      canvas.width = size
      canvas.height = size

      const aspectRatio = img.width / img.height
      let drawWidth = size
      let drawHeight = size

      if (aspectRatio > 1) {
        drawHeight = size / aspectRatio
      } else {
        drawWidth = size * aspectRatio
      }

      const x = (size - drawWidth) / 2
      const y = (size - drawHeight) / 2

      ctx?.drawImage(img, x, y, drawWidth, drawHeight)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }

    img.onerror = () => resolve(undefined)
    img.src = URL.createObjectURL(file)
  })
}

function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

## Integration Guidelines

### 1. Existing Codebase Integration

**Attachment System Integration**:
- Integrate with existing attachment models from `types/expense/expense.ts`
- Use existing file icon mapping from `ExpenseAttachmentsCard.vue`
- Follow established file size formatting patterns
- Maintain consistency with existing upload UI in `attachments.vue`

**API Integration Pattern**:
```typescript
// Follow existing API patterns from attachment handling
const uploadToExpenseAttachments = async (
  files: File[],
  expenseId: string
): Promise<IAttachment[]> => {
  const uploadResults = await Promise.all(
    files.map(file => 
      uploadService.uploadFile(file, `/api/expenses/${expenseId}/attachments`)
    )
  )
  
  return uploadResults.map(result => ({
    id: result.id,
    tenantId: result.tenantId,
    fileName: result.fileName,
    originalName: result.originalName,
    fileSize: result.fileSize,
    mimeType: result.mimeType,
    storagePath: result.storagePath,
    status: AttachmentStatus.UPLOADED,
    uploadedAt: new Date().toISOString(),
    uploadedBy: result.uploadedBy
  }))
}
```

### 2. Usage in Existing Components

**CSV Import Integration** (update `pages/expenses/import.vue`):
```vue
<template>
  <div class="csv-import-page">
    <!-- Replace existing upload section -->
    <FileUpload
      :multiple="false"
      accepted-types=".csv,text/csv,application/vnd.ms-excel"
      :max-file-size="10 * 1024 * 1024"
      :max-files="1"
      upload-url="/api/expenses/import/csv"
      :chunked-upload="false"
      @upload-complete="handleCsvUploadComplete"
    />
  </div>
</template>
```

**Attachment Upload Integration** (update `pages/expenses/[id]/attachments.vue`):
```vue
<template>
  <div class="expense-attachments-page">
    <!-- Replace existing upload section -->
    <FileUpload
      :multiple="true"
      accepted-types=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
      :max-file-size="10 * 1024 * 1024"
      :max-files="10"
      :upload-url="`/api/expenses/${expenseId}/attachments`"
      :chunked-upload="true"
      @upload-complete="handleAttachmentUploadComplete"
    />
  </div>
</template>
```

### 3. Type System Integration

**Update Upload Types** (`types/upload.ts`):
```typescript
export interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  file: File
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled'
  progress: number
  error?: string
  thumbnail?: string
  result?: UploadResult
}

export interface UploadResult {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  storagePath: string
  uploadedAt: string
  uploadedBy: string
  tenantId: string
}
```

## Research Findings

### Existing Codebase Patterns

**File Handling** (from `pages/expenses/[id]/attachments.vue`):
- Drag-and-drop implementation with event handlers
- Progress tracking with visual indicators
- File validation with size and type checks
- Upload queue management with cancel/retry functionality
- Thumbnail generation for image previews

**UI Patterns**:
- Consistent use of Card components for upload sections
- Icon integration with file type mapping
- Loading states and progress bars
- Error handling with user-friendly messages

**Data Flow**:
- Mock upload simulation with timeout-based progress
- Integration with attachment data models
- File size formatting utilities
- Japanese localization support

### Performance Considerations

**Large File Handling**:
- Chunked upload for files > 1MB
- Progress tracking per chunk
- Error retry with exponential backoff
- Memory-efficient processing

**User Experience**:
- Visual feedback for drag-and-drop states
- Clear progress indicators
- Intuitive error messages
- Responsive design for all screen sizes

## Subtasks
- [ ] Create core FileUpload component with drag-and-drop
- [ ] Implement FileUploadItem component for queue display
- [ ] Build chunked upload service with retry logic
- [ ] Create file validation service with custom rules
- [ ] Implement thumbnail generation for image files
- [ ] Add upload progress tracking and cancellation
- [ ] Create upload composable for state management
- [ ] Integrate with existing attachment system
- [ ] Update CSV import page to use new component
- [ ] Update attachments page to use new component
- [ ] Add comprehensive error handling
- [ ] Implement responsive design for mobile

## Testing Requirements
- [ ] Drag-and-drop functionality works across browsers
- [ ] Progress indicators display accurate information
- [ ] Chunked uploads handle network interruptions
- [ ] File validation catches all invalid files
- [ ] Upload cancellation works properly
- [ ] Thumbnail generation works for all image types
- [ ] Component integrates properly with existing pages
- [ ] Performance remains good with multiple large files

## Success Metrics
- Upload 10MB file with progress tracking in under 60 seconds
- Handle 10 concurrent file uploads without UI lag
- Generate thumbnails for images under 500ms
- File validation responds within 100ms
- Drag-and-drop provides immediate visual feedback
- Error messages are clear and actionable
- Component works on all screen sizes from 320px to 1920px

## Notes
- Focus on reusability across different upload scenarios
- Consider accessibility for keyboard navigation and screen readers
- Ensure proper error handling for network issues
- Optimize for Japanese legal practice file types
- Support both immediate and batch upload modes
- Consider future extensibility for cloud storage integration

## Implementation Priority
1. Core FileUpload component with basic functionality (30% of effort)
2. Chunked upload service and progress tracking (25% of effort)
3. File validation and thumbnail generation (20% of effort)
4. Integration with existing pages and systems (15% of effort)
5. Error handling, testing, and polish (10% of effort)