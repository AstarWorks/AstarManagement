<template>
  <div
    class="document-list-item"
    :class="{
      'selected': isSelected,
      'bulk-select': bulkSelect,
      'loading': loading
    }"
    @click="handleItemClick"
    @keydown.enter="handleItemClick"
    @keydown.space.prevent="handleItemClick"
    tabindex="0"
    role="row"
    :aria-label="`Document: ${document.fileName}`"
    :aria-selected="isSelected"
  >
    <!-- Selection column -->
    <div v-if="bulkSelect" class="item-column selection-column">
      <Checkbox
        :checked="isSelected"
        @update:checked="$emit('select', document, $event)"
        @click.stop
        :aria-label="`Select ${document.fileName}`"
      />
    </div>

    <!-- Thumbnail column -->
    <div class="item-column thumbnail-column">
      <DocumentThumbnail
        :document="document"
        :loading="thumbnailLoading"
        class="list-thumbnail"
        size="sm"
        @load="thumbnailLoading = false"
        @error="thumbnailLoading = false"
      />
    </div>

    <!-- Name column -->
    <div class="item-column name-column">
      <div class="file-info">
        <div class="file-name" :title="document.fileName">
          <component :is="getFileIcon(document.mimeType)" class="file-icon h-4 w-4" />
          <span class="name-text">{{ document.fileName }}</span>
        </div>
        <div v-if="document.description" class="file-description">
          {{ document.description }}
        </div>
        <!-- Tags for small screens -->
        <div v-if="document.tags && document.tags.length > 0" class="file-tags sm:hidden">
          <Badge
            v-for="tag in document.tags.slice(0, 2)"
            :key="tag"
            variant="outline"
            class="tag-badge"
          >
            {{ tag }}
          </Badge>
        </div>
      </div>
    </div>

    <!-- Size column -->
    <div class="item-column size-column hidden sm:flex">
      <span class="size-text">{{ formatFileSize(document.size) }}</span>
    </div>

    <!-- Type column -->
    <div class="item-column type-column hidden md:flex">
      <Badge variant="secondary" class="type-badge">
        {{ getFileTypeLabel(document.mimeType) }}
      </Badge>
    </div>

    <!-- Modified date column -->
    <div class="item-column date-column hidden lg:flex">
      <div class="date-info">
        <span class="date-text">{{ formatDate(document.modifiedDate) }}</span>
        <span class="time-text">{{ formatTime(document.modifiedDate) }}</span>
      </div>
    </div>

    <!-- Created by column -->
    <div class="item-column creator-column hidden xl:flex">
      <div class="creator-info">
        <Avatar class="creator-avatar">
          <AvatarImage :src="document.createdBy.avatar ?? ''" :alt="document.createdBy.name" />
          <AvatarFallback>{{ getInitials(document.createdBy.name) }}</AvatarFallback>
        </Avatar>
        <span class="creator-name">{{ document.createdBy.name }}</span>
      </div>
    </div>

    <!-- Tags column -->
    <div class="item-column tags-column hidden sm:flex">
      <div v-if="document.tags && document.tags.length > 0" class="tags-list">
        <Badge
          v-for="tag in visibleTags"
          :key="tag"
          variant="outline"
          class="tag-badge"
        >
          {{ tag }}
        </Badge>
        <Badge
          v-if="hiddenTagsCount > 0"
          variant="outline"
          class="tag-badge more-tags"
          :title="hiddenTags.join(', ')"
        >
          +{{ hiddenTagsCount }}
        </Badge>
      </div>
    </div>

    <!-- Status column -->
    <div class="item-column status-column hidden md:flex">
      <div class="status-indicators">
        <!-- Sync status -->
        <div v-if="document.syncStatus" class="status-item" :title="getSyncStatusText(document.syncStatus)">
          <component
            :is="getSyncStatusIcon(document.syncStatus)"
            :class="getSyncStatusClass(document.syncStatus)"
            class="h-4 w-4"
          />
        </div>
        
        <!-- Shared status -->
        <div v-if="document.isShared" class="status-item" title="Shared">
          <Share2 class="h-4 w-4 text-blue-500" />
        </div>
        
        <!-- Lock status -->
        <div v-if="document.isLocked" class="status-item" title="Locked">
          <Lock class="h-4 w-4 text-orange-500" />
        </div>
        
        <!-- Version -->
        <div v-if="document.version && document.version > 1" class="status-item">
          <Badge variant="outline" class="version-badge">
            v{{ document.version }}
          </Badge>
        </div>
      </div>
    </div>

    <!-- Actions column -->
    <div class="item-column actions-column">
      <div class="actions-container">
        <div class="quick-actions">
          <Button
            variant="ghost"
            size="sm"
            @click.stop="$emit('action', 'preview', document)"
            :title="'Preview ' + document.fileName"
          >
            <Eye class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click.stop="$emit('action', 'download', document)"
            :title="'Download ' + document.fileName"
          >
            <Download class="h-4 w-4" />
          </Button>
        </div>
        <DocumentQuickActions
          :document="document"
          @action="(action) => $emit('action', action, document)"
          @click.stop
        />
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
    </div>

    <!-- Selection indicator -->
    <div v-if="isSelected" class="selection-indicator" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Eye, 
  Download, 
  Share2, 
  Lock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  FileText,
  Image,
  File,
  Video,
  Music,
  Archive,
  FileSpreadsheet
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'

// Document Components
import DocumentThumbnail from './DocumentThumbnail.vue'
import DocumentQuickActions from './DocumentQuickActions.vue'

// Types
import type { Document, DocumentAction } from '~/types/document'

interface Props {
  document: Document
  isSelected?: boolean
  bulkSelect?: boolean
  loading?: boolean
  maxTags?: number
}

interface Emits {
  (e: 'action', action: DocumentAction, document: Document): void
  (e: 'select', document: Document, selected: boolean): void
  (e: 'click', document: Document): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  bulkSelect: false,
  loading: false,
  maxTags: 3
})

const emit = defineEmits<Emits>()

// Local state
const thumbnailLoading = ref(true)

// File type mapping
const fileTypeMap = {
  'application/pdf': { label: 'PDF', icon: FileText },
  'application/msword': { label: 'Word', icon: FileText },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'Word', icon: FileText },
  'application/vnd.ms-excel': { label: 'Excel', icon: FileSpreadsheet },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'Excel', icon: FileSpreadsheet },
  'image/jpeg': { label: 'JPEG', icon: Image },
  'image/png': { label: 'PNG', icon: Image },
  'image/gif': { label: 'GIF', icon: Image },
  'video/mp4': { label: 'Video', icon: Video },
  'audio/mpeg': { label: 'Audio', icon: Music },
  'application/zip': { label: 'Archive', icon: Archive },
  'text/plain': { label: 'Text', icon: File }
}

// Computed properties
const visibleTags = computed(() => {
  if (!props.document.tags) return []
  return props.document.tags.slice(0, props.maxTags)
})

const hiddenTags = computed(() => {
  if (!props.document.tags) return []
  return props.document.tags.slice(props.maxTags)
})

const hiddenTagsCount = computed(() => hiddenTags.value.length)

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
  return d.toLocaleDateString()
}

const formatTime = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getFileIcon = (mimeType: string) => {
  return fileTypeMap[mimeType as keyof typeof fileTypeMap]?.icon || File
}

const getFileTypeLabel = (mimeType: string) => {
  return fileTypeMap[mimeType as keyof typeof fileTypeMap]?.label || 'Unknown'
}

const getSyncStatusIcon = (status: string) => {
  switch (status) {
    case 'synced': return CheckCircle
    case 'syncing': return Clock
    case 'error': return XCircle
    case 'pending': return AlertCircle
    default: return Clock
  }
}

const getSyncStatusClass = (status: string) => {
  switch (status) {
    case 'synced': return 'text-green-500'
    case 'syncing': return 'text-blue-500 animate-spin'
    case 'error': return 'text-red-500'
    case 'pending': return 'text-yellow-500'
    default: return 'text-gray-500'
  }
}

const getSyncStatusText = (status: string) => {
  switch (status) {
    case 'synced': return 'Synced'
    case 'syncing': return 'Syncing...'
    case 'error': return 'Sync error'
    case 'pending': return 'Sync pending'
    default: return 'Unknown status'
  }
}

// Event handlers
const handleItemClick = (event: MouseEvent | KeyboardEvent) => {
  // Don't emit click if bulk select is enabled and user clicks checkbox area
  if (props.bulkSelect && (event.target as HTMLElement).closest('.selection-column')) {
    return
  }
  
  // Don't emit click if user clicks on actions
  if ((event.target as HTMLElement).closest('.actions-column')) {
    return
  }
  
  if (props.bulkSelect) {
    // In bulk select mode, clicking selects/deselects
    emit('select', props.document, !props.isSelected)
  } else {
    // Normal mode, emit click for preview/navigation
    emit('click', props.document)
  }
}
</script>

<style scoped>
.document-list-item {
  @apply flex items-center py-3 px-4 border-b border-border last:border-b-0;
  @apply hover:bg-accent/50 transition-colors duration-150;
  @apply focus:outline-none focus:bg-accent/50 focus:ring-2 focus:ring-ring focus:ring-inset;
  @apply cursor-pointer relative;
}

.document-list-item.selected {
  @apply bg-accent border-l-4 border-l-primary;
}

.document-list-item.bulk-select {
  @apply hover:bg-accent/30;
}

.document-list-item.loading {
  @apply opacity-50 pointer-events-none;
}

/* Column layout */
.item-column {
  @apply flex items-center;
}

.selection-column {
  @apply w-10 flex-shrink-0 mr-3;
}

.thumbnail-column {
  @apply w-12 flex-shrink-0 mr-3;
}

.list-thumbnail {
  @apply w-10 h-10 rounded border;
}

.name-column {
  @apply flex-1 min-w-0 mr-4;
}

.file-info {
  @apply space-y-1;
}

.file-name {
  @apply flex items-center gap-2 font-medium text-sm;
}

.file-icon {
  @apply flex-shrink-0 text-muted-foreground;
}

.name-text {
  @apply truncate;
}

.file-description {
  @apply text-xs text-muted-foreground truncate;
}

.file-tags {
  @apply flex gap-1 mt-1;
}

.size-column {
  @apply w-20 flex-shrink-0 mr-4 justify-end;
}

.size-text {
  @apply text-sm text-muted-foreground;
}

.type-column {
  @apply w-24 flex-shrink-0 mr-4;
}

.type-badge {
  @apply text-xs;
}

.date-column {
  @apply w-32 flex-shrink-0 mr-4;
}

.date-info {
  @apply text-sm space-y-0;
}

.date-text {
  @apply block text-foreground;
}

.time-text {
  @apply block text-xs text-muted-foreground;
}

.creator-column {
  @apply w-40 flex-shrink-0 mr-4;
}

.creator-info {
  @apply flex items-center gap-2;
}

.creator-avatar {
  @apply w-6 h-6;
}

.creator-name {
  @apply text-sm truncate;
}

.tags-column {
  @apply w-32 flex-shrink-0 mr-4;
}

.tags-list {
  @apply flex flex-wrap gap-1;
}

.tag-badge {
  @apply text-xs px-1.5 py-0.5 max-w-[80px] truncate;
}

.more-tags {
  @apply cursor-help;
}

.status-column {
  @apply w-20 flex-shrink-0 mr-4;
}

.status-indicators {
  @apply flex items-center gap-1;
}

.status-item {
  @apply flex items-center;
}

.version-badge {
  @apply text-xs px-1 py-0;
}

.actions-column {
  @apply w-24 flex-shrink-0;
}

.actions-container {
  @apply flex items-center gap-1;
}

.quick-actions {
  @apply hidden group-hover:flex gap-1;
}

.document-list-item:hover .quick-actions {
  @apply flex;
}

/* Loading overlay */
.loading-overlay {
  @apply absolute right-4 top-1/2 transform -translate-y-1/2;
}

/* Selection indicator */
.selection-indicator {
  @apply absolute left-0 top-0 bottom-0 w-1 bg-primary;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .document-list-item {
    @apply py-2 px-2;
  }
  
  .thumbnail-column {
    @apply w-8 mr-2;
  }
  
  .list-thumbnail {
    @apply w-8 h-8;
  }
  
  .name-column {
    @apply mr-2;
  }
  
  .file-name {
    @apply text-xs;
  }
  
  .file-description {
    @apply text-xs;
  }
  
  .actions-column {
    @apply w-16;
  }
  
  .quick-actions {
    @apply flex gap-0;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .document-list-item {
    @apply border-b-2;
  }
  
  .document-list-item.selected {
    @apply border-l-8;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .document-list-item {
    transition: none;
  }
  
  .animate-spin {
    animation: none;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .document-list-item {
    @apply min-h-[60px]; /* Adequate touch target */
  }
  
  .quick-actions {
    @apply flex; /* Always visible on touch devices */
  }
  
  .selection-column {
    @apply w-12; /* Larger touch target */
  }
}

/* Print styles */
@media print {
  .document-list-item {
    @apply shadow-none border-b border-gray-300;
    @apply break-inside-avoid;
  }
  
  .actions-column {
    @apply hidden;
  }
  
  .selection-column {
    @apply hidden;
  }
}
</style>