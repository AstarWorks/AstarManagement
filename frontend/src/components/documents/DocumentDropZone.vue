<script setup lang="ts">
import { ref, computed } from 'vue'
import { Upload, FileIcon, AlertCircle } from 'lucide-vue-next'
import { useDropzone } from '~/composables/useDropzone'
import { formatFileSize } from '~/schemas/document'
import type { RejectedFile } from '~/composables/useDropzone'

interface Props {
  disabled?: boolean
  maxFiles?: number
  accept?: Record<string, string[]>
  maxSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxFiles: 10,
  maxSize: 50 * 1024 * 1024 // 50MB
})

const emit = defineEmits<{
  drop: [files: File[]]
  error: [error: string]
}>()

// Dropzone setup
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
  onDrop: (files: File[], rejectedFiles: RejectedFile[]) => {
    if (files.length > 0) {
      emit('drop', files)
    }
  },
  onError: (error: string) => {
    emit('error', error)
  },
  disabled: props.disabled,
  multiple: true,
  maxFiles: props.maxFiles,
  accept: props.accept,
  maxSize: props.maxSize,
  validateFiles: true
})

// UI state
const dropzoneText = computed(() => {
  if (isDragActive.value) {
    return 'Drop files here...'
  }
  return 'Drag & drop files here, or click to browse'
})

const acceptedFormats = ['PDF', 'DOC', 'DOCX', 'JPG', 'PNG', 'TXT']
</script>

<template>
  <div class="document-dropzone">
    <div
      v-bind="getRootProps()"
      :class="dropzoneClasses"
      class="p-8 text-center"
    >
      <input v-bind="getInputProps()" />
      
      <!-- Icon and text -->
      <div class="flex flex-col items-center space-y-4">
        <div class="relative">
          <Upload 
            :class="[
              'w-12 h-12 transition-all duration-200',
              isDragActive ? 'text-primary scale-110' : 'text-muted-foreground'
            ]"
          />
          <FileIcon 
            v-if="isDragActive"
            class="absolute top-0 right-0 w-6 h-6 text-primary animate-bounce"
          />
        </div>
        
        <div class="space-y-2">
          <p class="text-sm font-medium">
            {{ dropzoneText }}
          </p>
          <p class="text-xs text-muted-foreground">
            Supported formats: {{ acceptedFormats.join(', ') }}
          </p>
          <p class="text-xs text-muted-foreground">
            Maximum file size: {{ formatFileSize(maxSize) }}
          </p>
        </div>
        
        <!-- Browse button -->
        <Button
          v-if="!isDragActive"
          variant="outline"
          size="sm"
          @click.stop="open"
          :disabled="disabled"
        >
          Browse Files
        </Button>
      </div>
      
      <!-- Validation errors -->
      <div v-if="hasErrors" class="mt-4 space-y-2">
        <div
          v-for="[fileName, errors] in validationErrors"
          :key="fileName"
          class="flex items-start gap-2 p-2 bg-destructive/10 rounded-md text-left"
        >
          <AlertCircle class="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div class="text-xs">
            <p class="font-medium text-destructive">{{ fileName }}</p>
            <p class="text-destructive/80">{{ errors.join(', ') }}</p>
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          @click="clearErrors"
          class="text-xs"
        >
          Clear errors
        </Button>
      </div>
    </div>
    
    <!-- Help text -->
    <div v-if="!disabled" class="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
      <AlertCircle class="w-4 h-4" />
      <span>
        You can upload up to {{ maxFiles }} files at once. 
        Each file must be smaller than {{ formatFileSize(maxSize) }}.
      </span>
    </div>
  </div>
</template>

<style scoped>
.document-dropzone {
  @apply w-full;
}

/* Add subtle animation to the dropzone on hover */
.document-dropzone > div:first-child {
  @apply transition-all duration-200;
}

.document-dropzone > div:first-child:hover:not([disabled]) {
  @apply shadow-sm;
}
</style>