<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Upload, FileIcon, AlertCircle, FolderOpen, Camera, X } from 'lucide-vue-next'
import { useDropzone } from '~/composables/useDropzone'
import { useDocumentUploadStore } from '~/stores/documentUpload'
import { useIsMobile } from '~/composables/useIsMobile'
import { useAccessibility } from '~/composables/useAccessibility'
import { formatFileSize } from '~/schemas/document'
import type { RejectedFile } from '~/composables/useDropzone'

interface Props {
  disabled?: boolean
  maxFiles?: number
  accept?: Record<string, string[]>
  maxSize?: number
  showPreview?: boolean
  enableBatchMode?: boolean
  autoUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxFiles: 50, // Increased for batch operations
  maxSize: 50 * 1024 * 1024, // 50MB
  showPreview: true,
  enableBatchMode: true,
  autoUpload: false
})

const emit = defineEmits<{
  drop: [files: File[]]
  error: [error: string]
  batchUploadStart: [files: File[]]
  previewUpdate: [files: File[]]
}>()

// Dependencies
const { isMobile } = useIsMobile()
const { announceToScreenReader, generateId } = useAccessibility()
const { addToQueue } = useDocumentUploadStore()

// State
const previewFiles = ref<File[]>([])
const draggedFileCount = ref(0)
const dropzoneDescriptionId = generateId()
const accessibilityAnnouncement = ref('')

// Enhanced dropzone setup
const { 
  getRootProps, 
  getInputProps, 
  isDragActive, 
  open,
  dropzoneClasses,
  validationErrors,
  hasErrors,
  clearErrors
} = useDropzone({
  onDrop: async (files: File[], rejectedFiles: RejectedFile[]) => {
    if (files.length > 0) {
      if (props.enableBatchMode && props.showPreview) {
        // Add to preview for batch processing
        previewFiles.value.push(...files)
        emit('previewUpdate', previewFiles.value)
        
        announceToScreenReader(
          `${files.length} file${files.length !== 1 ? 's' : ''} added to upload queue. ${previewFiles.value.length} total files ready.`
        )
      } else {
        // Direct upload
        if (props.autoUpload) {
          addToQueue(files)
        }
        emit('drop', files)
      }
    }
    
    if (rejectedFiles.length > 0) {
      announceToScreenReader(
        `${rejectedFiles.length} file${rejectedFiles.length !== 1 ? 's' : ''} rejected due to validation errors.`
      )
    }
  },
  onError: (error: string) => {
    emit('error', error)
    announceToScreenReader(`Upload error: ${error}`)
  },
  disabled: props.disabled,
  multiple: true,
  maxFiles: props.maxFiles,
  accept: props.accept,
  maxSize: props.maxSize,
  validateFiles: true
})

// Enhanced UI state
const primaryText = computed(() => {
  if (isDragActive.value) {
    return `Drop ${draggedFileCount.value} file${draggedFileCount.value !== 1 ? 's' : ''} here`
  }
  if (props.enableBatchMode) {
    return 'Drag & drop multiple files for batch upload'
  }
  return 'Drag & drop files here, or click to browse'
})

const secondaryText = computed(() => {
  if (props.enableBatchMode) {
    return 'Upload up to 50 files simultaneously with real-time progress tracking'
  }
  return 'Select files from your device to upload to the document library'
})

const dropzoneAriaLabel = computed(() => {
  if (props.disabled) {
    return 'File upload area (disabled)'
  }
  return `File upload area. ${props.enableBatchMode ? 'Supports batch upload of up to ' + props.maxFiles + ' files.' : ''} Maximum file size ${formatFileSize(props.maxSize)}.`
})

const acceptedFormats = ['PDF', 'DOC', 'DOCX', 'JPG', 'PNG', 'TXT']
const previewFormats = computed(() => acceptedFormats.slice(0, 3))

// Enhanced drag handling
const handleDragEnter = (e: DragEvent) => {
  if (e.dataTransfer?.items) {
    draggedFileCount.value = e.dataTransfer.items.length
  }
}

// Methods
const removePreviewFile = (fileToRemove: File) => {
  const index = previewFiles.value.findIndex(f => 
    f.name === fileToRemove.name && f.size === fileToRemove.size
  )
  if (index !== -1) {
    previewFiles.value.splice(index, 1)
    emit('previewUpdate', previewFiles.value)
    
    announceToScreenReader(`Removed ${fileToRemove.name} from upload queue.`)
  }
}

const clearPreview = () => {
  const count = previewFiles.value.length
  previewFiles.value = []
  emit('previewUpdate', previewFiles.value)
  
  announceToScreenReader(`Cleared ${count} file${count !== 1 ? 's' : ''} from upload queue.`)
}

const startBatchUpload = () => {
  if (previewFiles.value.length === 0) return
  
  // Add files to upload queue
  addToQueue(previewFiles.value)
  emit('batchUploadStart', previewFiles.value)
  
  announceToScreenReader(
    `Started batch upload of ${previewFiles.value.length} file${previewFiles.value.length !== 1 ? 's' : ''}.`
  )
  
  // Clear preview after starting upload
  previewFiles.value = []
  emit('previewUpdate', previewFiles.value)
}

const removeError = (fileName: string) => {
  validationErrors.value.delete(fileName)
  announceToScreenReader(`Dismissed error for ${fileName}.`)
}

const openCamera = () => {
  // Placeholder for camera integration
  // This would typically open a camera interface for mobile document capture
  announceToScreenReader('Camera feature not yet implemented.')
}

// Enhanced root props with additional drag events
const getEnhancedRootProps = () => ({
  ...getRootProps(),
  onDragenter: handleDragEnter,
  'data-testid': 'enhanced-dropzone'
})

// Watch for accessibility announcements
watch([isDragActive, hasErrors], () => {
  nextTick(() => {
    if (isDragActive.value) {
      accessibilityAnnouncement.value = `Drag active. Ready to drop ${draggedFileCount.value} file${draggedFileCount.value !== 1 ? 's' : ''}.`
    } else if (hasErrors.value) {
      accessibilityAnnouncement.value = `${validationErrors.value.size} file${validationErrors.value.size !== 1 ? 's' : ''} rejected due to validation errors.`
    } else {
      accessibilityAnnouncement.value = ''
    }
  })
})
</script>

<template>
  <div class="enhanced-document-dropzone">
    <!-- Main dropzone area -->
    <div
      v-bind="getEnhancedRootProps()"
      :class="dropzoneClasses"
      class="relative p-8 text-center transition-all duration-300"
      role="button"
      tabindex="0"
      :aria-label="dropzoneAriaLabel"
      :aria-describedby="dropzoneDescriptionId"
      @keydown.enter.space.prevent="open"
    >
      <input v-bind="getInputProps()" />
      
      <!-- Enhanced drag overlay -->
      <div 
        v-if="isDragActive"
        class="absolute inset-0 bg-primary/5 border-2 border-primary border-dashed rounded-lg flex items-center justify-center z-10"
      >
        <div class="text-center">
          <div class="relative">
            <Upload class="w-16 h-16 text-primary animate-pulse mx-auto" />
            <div class="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {{ draggedFileCount }}
            </div>
          </div>
          <p class="text-lg font-semibold text-primary mt-4">
            Drop {{ draggedFileCount }} file{{ draggedFileCount !== 1 ? 's' : '' }} to upload
          </p>
        </div>
      </div>
      
      <!-- Main content -->
      <div class="flex flex-col items-center space-y-6" :class="{ 'opacity-30': isDragActive }">
        <!-- Icon section with animation -->
        <div class="relative">
          <div 
            class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center transition-all duration-300"
            :class="{ 'scale-110 bg-primary/10': !isDragActive }"
          >
            <Upload 
              :class="[
                'w-10 h-10 transition-all duration-300',
                !isDragActive ? 'text-muted-foreground' : 'text-primary'
              ]"
            />
          </div>
          
          <!-- File type indicators -->
          <div 
            v-if="!isDragActive"
            class="absolute -bottom-2 -right-2 flex -space-x-1"
          >
            <div 
              v-for="(format, index) in previewFormats" 
              :key="format"
              class="w-6 h-6 bg-background border-2 border-muted rounded-full flex items-center justify-center text-xs font-bold"
              :style="{ zIndex: previewFormats.length - index }"
            >
              {{ format.charAt(0) }}
            </div>
          </div>
        </div>
        
        <!-- Text content -->
        <div class="space-y-3 max-w-md">
          <h3 class="text-lg font-semibold">
            {{ primaryText }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ secondaryText }}
          </p>
          <div class="flex flex-wrap gap-1 justify-center">
            <span 
              v-for="format in acceptedFormats"
              :key="format"
              class="inline-flex items-center px-2 py-1 bg-muted rounded-full text-xs font-medium"
            >
              {{ format }}
            </span>
          </div>
        </div>
        
        <!-- Action buttons -->
        <div class="flex flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            size="lg"
            @click.stop="open"
            :disabled="disabled"
            class="min-w-[140px]"
          >
            <FolderOpen class="w-4 h-4 mr-2" />
            Browse Files
          </Button>
          
          <Button
            v-if="isMobile"
            variant="outline" 
            size="lg"
            @click.stop="openCamera"
            :disabled="disabled"
            class="min-w-[140px]"
          >
            <Camera class="w-4 h-4 mr-2" />
            Take Photo
          </Button>
        </div>
        
        <!-- Limits information -->
        <div class="text-xs text-muted-foreground space-y-1 text-center">
          <p>Maximum {{ maxFiles }} files • {{ formatFileSize(maxSize) }} per file</p>
          <p>Supports batch upload with progress tracking</p>
        </div>
      </div>
    </div>
    
    <!-- File preview section -->
    <div v-if="previewFiles.length > 0" class="mt-6">
      <h4 class="text-sm font-medium mb-3">Files ready for upload ({{ previewFiles.length }})</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          v-for="file in previewFiles"
          :key="file.name + file.size"
          class="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors"
        >
          <div class="flex-shrink-0">
            <FileIcon class="w-8 h-8 text-muted-foreground" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ file.name }}</p>
            <p class="text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            @click="removePreviewFile(file)"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div class="flex gap-3 mt-4">
        <Button
          @click="startBatchUpload"
          :disabled="previewFiles.length === 0"
          class="flex-1"
        >
          <Upload class="w-4 h-4 mr-2" />
          Upload {{ previewFiles.length }} File{{ previewFiles.length !== 1 ? 's' : '' }}
        </Button>
        <Button
          variant="outline"
          @click="clearPreview"
        >
          Clear All
        </Button>
      </div>
    </div>
    
    <!-- Enhanced validation errors -->
    <div v-if="hasErrors" class="mt-6">
      <div class="flex items-center gap-2 mb-3">
        <AlertCircle class="w-4 h-4 text-destructive" />
        <h4 class="text-sm font-medium text-destructive">
          {{ validationErrors.size }} file{{ validationErrors.size !== 1 ? 's' : '' }} rejected
        </h4>
      </div>
      
      <div class="space-y-2">
        <div
          v-for="[fileName, errors] in validationErrors"
          :key="fileName"
          class="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
        >
          <AlertCircle class="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div class="flex-1">
            <p class="text-sm font-medium text-destructive">{{ fileName }}</p>
            <ul class="text-xs text-destructive/80 mt-1 space-y-1">
              <li v-for="error in errors" :key="error">• {{ error }}</li>
            </ul>
          </div>
          <Button
            variant="ghost"
            size="sm"
            @click="removeError(fileName)"
            class="text-destructive hover:text-destructive"
          >
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        @click="clearErrors"
        class="mt-3 text-destructive hover:text-destructive"
      >
        Clear all errors
      </Button>
    </div>
    
    <!-- Accessibility live region -->
    <div 
      :id="dropzoneDescriptionId"
      aria-live="polite" 
      aria-atomic="false"
      class="sr-only"
    >
      {{ accessibilityAnnouncement }}
    </div>
  </div>
</template>

<style scoped>
.enhanced-document-dropzone {
  @apply w-full;
}

/* Enhanced animations for drag states */
.enhanced-document-dropzone [role="button"]:hover:not([disabled]) {
  @apply shadow-lg;
}

.enhanced-document-dropzone .opacity-30 {
  transition: opacity 0.3s ease-in-out;
}

/* File preview animations */
.enhanced-document-dropzone .group:hover {
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>