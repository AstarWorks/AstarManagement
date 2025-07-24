<template>
  <div 
    class="document-thumbnail"
    :class="[
      `size-${size}`,
      { 'loading': loading }
    ]"
  >
    <!-- Thumbnail image -->
    <img
      v-if="thumbnailUrl && !thumbnailError"
      :src="thumbnailUrl"
      :alt="`Thumbnail for ${document.fileName}`"
      class="thumbnail-image"
      @load="handleLoad"
      @error="handleError"
      loading="lazy"
    />
    
    <!-- Fallback icon -->
    <div 
      v-else
      class="thumbnail-fallback"
      :class="{ 'error': thumbnailError }"
    >
      <component 
        :is="getFileIcon(document.mimeType)" 
        :class="iconSizeClass"
      />
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="thumbnail-loading">
      <div class="loading-spinner">
        <div class="animate-spin rounded-full border-2 border-primary border-t-transparent" :class="spinnerSizeClass"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  FileText,
  Image,
  File,
  Video,
  Music,
  Archive,
  FileSpreadsheet,
  FileCode,
  Presentation
} from 'lucide-vue-next'

import type { Document } from '~/types/document'

interface Props {
  document: Document
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  eager?: boolean
}

interface Emits {
  (e: 'load'): void
  (e: 'error'): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  loading: false,
  eager: false
})

const emit = defineEmits<Emits>()

// Local state
const thumbnailUrl = ref<string | null>(null)
const thumbnailError = ref(false)
const isLoading = ref(props.loading)

// File type to icon mapping
const fileTypeMap = {
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'application/vnd.ms-powerpoint': Presentation,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': Presentation,
  'image/jpeg': Image,
  'image/png': Image,
  'image/gif': Image,
  'image/svg+xml': Image,
  'image/webp': Image,
  'video/mp4': Video,
  'video/webm': Video,
  'video/quicktime': Video,
  'audio/mpeg': Music,
  'audio/wav': Music,
  'audio/ogg': Music,
  'application/zip': Archive,
  'application/x-rar-compressed': Archive,
  'application/x-7z-compressed': Archive,
  'text/plain': File,
  'text/html': FileCode,
  'text/css': FileCode,
  'text/javascript': FileCode,
  'application/json': FileCode,
  'application/xml': FileCode
}

// Computed properties
const iconSizeClass = computed(() => {
  const sizeMap = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }
  return sizeMap[props.size]
})

const spinnerSizeClass = computed(() => {
  const sizeMap = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  }
  return sizeMap[props.size]
})

// Helper methods
const getFileIcon = (mimeType: string) => {
  return fileTypeMap[mimeType as keyof typeof fileTypeMap] || File
}

const generateThumbnailUrl = async (document: Document): Promise<string | null> => {
  try {
    // For now, return mock thumbnails based on file type
    // TODO: Replace with actual thumbnail generation service
    
    const isImage = document.mimeType.startsWith('image/')
    if (isImage) {
      // For images, we could return the actual file URL
      // return `/api/documents/${document.id}/content`
      return `/api/documents/${document.id}/thumbnail`
    }
    
    const isPdf = document.mimeType === 'application/pdf'
    if (isPdf) {
      // For PDFs, generate thumbnail
      return `/api/documents/${document.id}/thumbnail`
    }
    
    // For other file types, no thumbnail available
    return null
  } catch (error) {
    console.error('Failed to generate thumbnail URL:', error)
    return null
  }
}

// Event handlers
const handleLoad = () => {
  isLoading.value = false
  thumbnailError.value = false
  emit('load')
}

const handleError = () => {
  isLoading.value = false
  thumbnailError.value = true
  thumbnailUrl.value = null
  emit('error')
}

// Load thumbnail
const loadThumbnail = async () => {
  if (!props.eager && thumbnailUrl.value) return
  
  isLoading.value = true
  thumbnailError.value = false
  
  try {
    const url = await generateThumbnailUrl(props.document)
    thumbnailUrl.value = url
    
    if (!url) {
      isLoading.value = false
      thumbnailError.value = true
    }
  } catch (error) {
    console.error('Failed to load thumbnail:', error)
    isLoading.value = false
    thumbnailError.value = true
    thumbnailUrl.value = null
  }
}

// Initialize
onMounted(() => {
  if (props.eager) {
    loadThumbnail()
  }
})

// Expose methods for parent components
defineExpose({
  loadThumbnail,
  retry: loadThumbnail
})
</script>

<style scoped>
.document-thumbnail {
  @apply relative overflow-hidden bg-muted/50 flex items-center justify-center;
}

/* Size variants */
.size-xs {
  @apply w-6 h-6 rounded;
}

.size-sm {
  @apply w-8 h-8 rounded;
}

.size-md {
  @apply w-12 h-12 rounded-md;
}

.size-lg {
  @apply w-16 h-16 rounded-md;
}

.size-xl {
  @apply w-20 h-20 rounded-lg;
}

/* Thumbnail image */
.thumbnail-image {
  @apply w-full h-full object-cover;
}

/* Fallback icon container */
.thumbnail-fallback {
  @apply flex items-center justify-center text-muted-foreground transition-colors;
}

.thumbnail-fallback.error {
  @apply text-destructive/60;
}

/* Loading overlay */
.thumbnail-loading {
  @apply absolute inset-0 bg-background/80 flex items-center justify-center;
}

.loading-spinner {
  @apply flex items-center justify-center;
}

/* Loading state */
.document-thumbnail.loading {
  @apply bg-muted animate-pulse;
}

/* Hover effects for interactive thumbnails */
.document-thumbnail:hover:not(.loading) .thumbnail-image {
  @apply scale-105 transition-transform duration-200;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .document-thumbnail {
    @apply border border-border;
  }
  
  .thumbnail-fallback {
    @apply bg-background;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .thumbnail-image {
    transition: none;
  }
  
  .animate-pulse {
    animation: none;
  }
  
  .animate-spin {
    animation: none;
  }
}

/* Print styles */
@media print {
  .thumbnail-loading {
    @apply hidden;
  }
  
  .document-thumbnail {
    @apply border border-gray-300;
  }
}
</style>