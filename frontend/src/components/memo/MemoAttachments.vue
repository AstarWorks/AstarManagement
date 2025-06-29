<!--
  Memo Attachments Component
  Provides drag-and-drop file upload interface with progress tracking and file management
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Upload, File, Image, FileText, Trash2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { Card } from '~/components/ui/card'
import { useFileUpload, type UploadedFile } from '~/composables/memo/useFileUpload'
import { useToast } from '~/composables/useToast'

interface Props {
  /** Maximum number of files allowed */
  maxFiles?: number
  /** Maximum file size in bytes */
  maxSize?: number
  /** Allowed file types */
  allowedTypes?: string[]
  /** Show file previews */
  showPreviews?: boolean
  /** Disabled state */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxFiles: 10,
  maxSize: 10 * 1024 * 1024, // 10MB
  showPreviews: true,
  disabled: false
})

const emit = defineEmits<{
  /** Emitted when files are uploaded */
  filesUploaded: [files: UploadedFile[]]
  /** Emitted when a file is removed */
  fileRemoved: [fileId: string]
  /** Emitted when all files are cleared */
  filesCleared: []
}>()

const { showToast } = useToast()
const fileInputRef = ref<HTMLInputElement>()

const {
  uploadingFiles,
  uploadedFiles,
  isDragging,
  isUploading,
  uploadFiles,
  removeFile,
  clearFiles,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  formatFileSize,
  getFileIcon,
  validateFile,
  maxSize,
  allowedTypes
} = useFileUpload({
  maxFiles: props.maxFiles,
  maxSize: props.maxSize,
  allowedTypes: props.allowedTypes
})

// Computed properties
const hasFiles = computed(() => uploadedFiles.value.length > 0)
const canUploadMore = computed(() => 
  uploadedFiles.value.length < props.maxFiles && !props.disabled
)

const dragZoneClasses = computed(() => [
  'memo-attachments-dropzone',
  {
    'is-dragging': isDragging.value,
    'is-disabled': props.disabled,
    'has-files': hasFiles.value
  }
])

// Methods
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  if (files.length === 0) return
  
  try {
    const uploadedFilesList = await uploadFiles(files)
    if (uploadedFilesList.length > 0) {
      emit('filesUploaded', uploadedFilesList)
      showToast(`${uploadedFilesList.length} file(s) uploaded successfully`, 'success')
    }
  } catch (error) {
    showToast('Failed to upload files', 'error')
    console.error('File upload error:', error)
  }
  
  // Reset input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const onDrop = async (event: DragEvent) => {
  await handleDrop(event)
  const newFiles = uploadedFiles.value.slice(-1) // Get last uploaded files
  if (newFiles.length > 0) {
    emit('filesUploaded', newFiles)
  }
}

const onRemoveFile = (fileId: string) => {
  removeFile(fileId)
  emit('fileRemoved', fileId)
  showToast('File removed', 'info')
}

const onClearFiles = () => {
  clearFiles()
  emit('filesCleared')
  showToast('All files cleared', 'info')
}

const openFileDialog = () => {
  if (canUploadMore.value && fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const getFileTypeIcon = (type: string) => {
  if (type.includes('pdf') || type.includes('word')) return FileText
  if (type.includes('image')) return Image
  return File
}

// Format allowed types for display
const allowedTypesDisplay = computed(() => {
  const types = props.allowedTypes || allowedTypes
  const extensions = types.map(type => {
    if (type.includes('pdf')) return 'PDF'
    if (type.includes('word')) return 'DOC/DOCX'
    if (type.includes('image')) return 'Images'
    if (type.includes('text')) return 'TXT'
    return type.split('/')[1]?.toUpperCase()
  }).filter(Boolean)
  
  return extensions.join(', ')
})
</script>

<template>
  <div class="memo-attachments">
    <!-- Upload Zone -->
    <div
      :class="dragZoneClasses"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="onDrop"
      @click="openFileDialog"
    >
      <div class="dropzone-content">
        <Upload class="dropzone-icon" />
        <div class="dropzone-text">
          <p class="dropzone-primary">
            <template v-if="isDragging">
              Drop files here to upload
            </template>
            <template v-else-if="canUploadMore">
              Drag files here or click to browse
            </template>
            <template v-else>
              Maximum {{ maxFiles }} files reached
            </template>
          </p>
          <p class="dropzone-secondary">
            Supports: {{ allowedTypesDisplay }} • Max: {{ formatFileSize(maxSize) }} per file
          </p>
        </div>
      </div>
      
      <!-- Hidden file input -->
      <input
        ref="fileInputRef"
        type="file"
        multiple
        :accept="allowedTypes?.join(',')"
        :disabled="!canUploadMore"
        @change="handleFileSelect"
        class="file-input"
      />
    </div>

    <!-- Uploading Files -->
    <div v-if="uploadingFiles.size > 0" class="uploading-files">
      <h4 class="section-title">Uploading...</h4>
      <div class="file-list">
        <Card
          v-for="[id, file] of uploadingFiles"
          :key="id"
          class="file-item uploading"
        >
          <div class="file-info">
            <component :is="getFileTypeIcon(file.type)" class="file-icon" />
            <div class="file-details">
              <p class="file-name">{{ file.name }}</p>
              <p class="file-meta">{{ formatFileSize(file.size) }}</p>
            </div>
          </div>
          <div class="file-progress">
            <Progress :value="file.uploadProgress || 0" class="progress-bar" />
            <span class="progress-text">{{ file.uploadProgress || 0 }}%</span>
          </div>
        </Card>
      </div>
    </div>

    <!-- Uploaded Files -->
    <div v-if="hasFiles" class="uploaded-files">
      <div class="section-header">
        <h4 class="section-title">
          Attachments ({{ uploadedFiles.length }})
        </h4>
        <Button
          variant="ghost"
          size="sm"
          @click="onClearFiles"
          class="clear-button"
        >
          <Trash2 class="h-4 w-4" />
          Clear All
        </Button>
      </div>
      
      <div class="file-list">
        <Card
          v-for="file in uploadedFiles"
          :key="file.id"
          class="file-item"
        >
          <!-- File Preview (if image) -->
          <div v-if="file.preview && showPreviews" class="file-preview">
            <img
              :src="file.preview"
              :alt="file.name"
              class="preview-image"
            />
          </div>
          
          <div class="file-info">
            <component :is="getFileTypeIcon(file.type)" class="file-icon" />
            <div class="file-details">
              <p class="file-name">{{ file.name }}</p>
              <p class="file-meta">
                {{ formatFileSize(file.size) }} • {{ file.type.split('/')[1]?.toUpperCase() }}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            @click="onRemoveFile(file.id)"
            class="remove-button"
            :aria-label="`Remove ${file.name}`"
          >
            <X class="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!hasFiles && uploadingFiles.size === 0" class="empty-state">
      <p class="empty-text">No attachments yet</p>
    </div>
  </div>
</template>

<style scoped>
.memo-attachments {
  --spacing: 1rem;
  --border-radius: 0.5rem;
  --transition: all 0.2s ease;
  
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}

/* Drop Zone */
.memo-attachments-dropzone {
  position: relative;
  padding: 2rem;
  border: 2px dashed hsl(var(--border));
  border-radius: var(--border-radius);
  background: hsl(var(--background));
  cursor: pointer;
  transition: var(--transition);
}

.memo-attachments-dropzone:hover:not(.is-disabled) {
  border-color: hsl(var(--primary));
  background: hsl(var(--muted) / 0.5);
}

.memo-attachments-dropzone.is-dragging {
  border-color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.1);
  transform: scale(1.02);
}

.memo-attachments-dropzone.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.memo-attachments-dropzone.has-files {
  padding: 1rem;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.dropzone-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: hsl(var(--muted-foreground));
}

.dropzone-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dropzone-primary {
  font-weight: 500;
  color: hsl(var(--foreground));
  margin: 0;
}

.dropzone-secondary {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0;
}

.clear-button {
  color: hsl(var(--muted-foreground));
}

/* File Lists */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  transition: var(--transition);
}

.file-item:hover {
  background: hsl(var(--muted) / 0.5);
}

.file-item.uploading {
  background: hsl(var(--muted) / 0.3);
}

/* File Preview */
.file-preview {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: calc(var(--border-radius) - 2px);
  overflow: hidden;
  background: hsl(var(--muted));
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* File Info */
.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.file-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: hsl(var(--muted-foreground));
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: hsl(var(--foreground));
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
}

/* Progress */
.file-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  min-width: 4rem;
}

.progress-bar {
  width: 4rem;
  height: 0.25rem;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
}

/* Remove Button */
.remove-button {
  flex-shrink: 0;
  color: hsl(var(--muted-foreground));
}

.remove-button:hover {
  color: hsl(var(--destructive));
}

/* Empty State */
.empty-state {
  padding: 1rem;
  text-align: center;
}

.empty-text {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
}

/* Responsive Design */
@media (max-width: 640px) {
  .memo-attachments-dropzone {
    padding: 1.5rem 1rem;
  }
  
  .dropzone-content {
    gap: 0.5rem;
  }
  
  .dropzone-icon {
    width: 2rem;
    height: 2rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .file-info {
    width: 100%;
  }
  
  .file-progress {
    width: 100%;
    align-items: flex-start;
  }
  
  .progress-bar {
    width: 100%;
  }
}
</style>