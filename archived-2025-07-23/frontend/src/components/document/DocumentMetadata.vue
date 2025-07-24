<template>
  <div class="document-metadata" :class="{ 'compact': compact }">
    <div class="metadata-grid">
      <!-- File size -->
      <div class="metadata-item">
        <HardDrive class="metadata-icon" />
        <span class="metadata-value">{{ formatFileSize(document.size) }}</span>
      </div>
      
      <!-- Modified date -->
      <div class="metadata-item">
        <Calendar class="metadata-icon" />
        <span class="metadata-value">{{ formatDate(document.modifiedDate) }}</span>
      </div>
      
      <!-- Created by (if not compact) -->
      <div v-if="!compact && document.createdBy" class="metadata-item">
        <User class="metadata-icon" />
        <span class="metadata-value">{{ document.createdBy.name }}</span>
      </div>
      
      <!-- File type (if not compact) -->
      <div v-if="!compact" class="metadata-item">
        <FileText class="metadata-icon" />
        <span class="metadata-value">{{ getFileTypeLabel(document.mimeType) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HardDrive, Calendar, User, FileText } from 'lucide-vue-next'
import type { Document } from '~/types/document'

interface Props {
  document: Document
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false
})

// Helper methods
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round(bytes / Math.pow(k, i) * 10) / 10} ${sizes[i]}`
}

const formatDate = (date: string | Date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return d.toLocaleDateString()
}

const getFileTypeLabel = (mimeType: string) => {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'video/mp4': 'MP4',
    'audio/mpeg': 'MP3',
    'application/zip': 'ZIP',
    'text/plain': 'Text'
  }
  return typeMap[mimeType] || 'Unknown'
}
</script>

<style scoped>
.document-metadata {
  @apply text-xs text-muted-foreground;
}

.metadata-grid {
  @apply flex flex-wrap gap-3;
}

.metadata-item {
  @apply flex items-center gap-1;
}

.metadata-icon {
  @apply h-3 w-3 flex-shrink-0;
}

.metadata-value {
  @apply truncate;
}

/* Compact layout */
.document-metadata.compact .metadata-grid {
  @apply gap-2;
}

.document-metadata.compact .metadata-item {
  @apply gap-1;
}

.document-metadata.compact .metadata-icon {
  @apply h-3 w-3;
}

.document-metadata.compact .metadata-value {
  font-size: 0.75rem; line-height: 1rem;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .metadata-grid {
    @apply gap-2;
  }
  
  .metadata-value {
    font-size: 0.75rem; line-height: 1rem;
  }
}
</style>