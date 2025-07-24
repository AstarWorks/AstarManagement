<template>
  <div 
    class="document-card"
    :class="{
      'selected': isSelected,
      'bulk-select': bulkSelect,
      'loading': loading
    }"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
    @keydown.space.prevent="handleCardClick"
    tabindex="0"
    role="article"
    :aria-label="`Document: ${document.fileName}`"
    :aria-selected="isSelected"
  >
    <!-- Selection Checkbox (when bulk select is enabled) -->
    <div v-if="bulkSelect" class="selection-checkbox">
      <Checkbox
        :checked="isSelected"
        @update:checked="$emit('select', document, $event)"
        @click.stop
        :aria-label="`Select ${document.fileName}`"
      />
    </div>

    <!-- Document Thumbnail -->
    <div class="document-thumbnail">
      <DocumentThumbnail
        :document="document"
        :loading="thumbnailLoading"
        class="thumbnail-image"
        @load="thumbnailLoading = false"
        @error="thumbnailLoading = false"
      />
      
      <!-- Loading overlay -->
      <div v-if="loading || thumbnailLoading" class="thumbnail-loading">
        <div class="loading-spinner">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
      
      <!-- File type badge -->
      <div class="file-type-badge">
        <Badge variant="secondary" class="text-xs">
          {{ getFileExtension(document.fileName) }}
        </Badge>
      </div>
      
      <!-- Quick actions overlay -->
      <div class="quick-actions-overlay">
        <div class="quick-actions">
          <Button
            variant="secondary"
            size="sm"
            @click.stop="$emit('action', 'preview', document)"
            :title="'Preview ' + document.fileName"
          >
            <Eye class="h-4 w-4" />
          </Button>
          <Button
            variant="secondary" 
            size="sm"
            @click.stop="$emit('action', 'download', document)"
            :title="'Download ' + document.fileName"
          >
            <Download class="h-4 w-4" />
          </Button>
          <DocumentQuickActions
            :document="document"
            @action="(action) => $emit('action', action, document)"
            @click.stop
          />
        </div>
      </div>
    </div>

    <!-- Document Information -->
    <div class="document-info">
      <!-- File name -->
      <h3 class="document-title" :title="document.fileName">
        {{ document.fileName }}
      </h3>
      
      <!-- Document metadata -->
      <DocumentMetadata
        :document="document"
        :compact="true"
        class="document-meta"
      />
      
      <!-- Tags -->
      <div v-if="document.tags && document.tags.length > 0" class="document-tags">
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
      
      <!-- Status indicators -->
      <div class="status-indicators">
        <!-- Sync status -->
        <div v-if="document.syncStatus" class="sync-status" :title="getSyncStatusText(document.syncStatus)">
          <component
            :is="getSyncStatusIcon(document.syncStatus)"
            :class="getSyncStatusClass(document.syncStatus)"
            class="h-3 w-3"
          />
        </div>
        
        <!-- Shared indicator -->
        <div v-if="document.isShared" class="shared-indicator" title="Shared">
          <Share2 class="h-3 w-3 text-blue-500" />
        </div>
        
        <!-- Locked indicator -->
        <div v-if="document.isLocked" class="locked-indicator" title="Locked">
          <Lock class="h-3 w-3 text-orange-500" />
        </div>
        
        <!-- Version indicator -->
        <div v-if="document.version && document.version > 1" class="version-indicator" :title="`Version ${document.version}`">
          <Badge variant="outline" class="text-xs">
            v{{ document.version }}
          </Badge>
        </div>
      </div>
    </div>

    <!-- Selection ring for accessibility -->
    <div v-if="isSelected" class="selection-ring" aria-hidden="true"></div>
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
  Clock
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'

// Document Components
import DocumentThumbnail from './DocumentThumbnail.vue'
import DocumentMetadata from './DocumentMetadata.vue'
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
  maxTags: 2
})

const emit = defineEmits<Emits>()

// Local state
const thumbnailLoading = ref(true)

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
const getFileExtension = (fileName: string) => {
  const ext = fileName.split('.').pop()
  return ext ? ext.toUpperCase() : 'FILE'
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
const handleCardClick = (event: MouseEvent | KeyboardEvent) => {
  // Don't emit click if bulk select is enabled and user clicks checkbox area
  if (props.bulkSelect && (event.target as HTMLElement).closest('.selection-checkbox')) {
    return
  }
  
  // Don't emit click if user clicks on quick actions
  if ((event.target as HTMLElement).closest('.quick-actions-overlay')) {
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
.document-card {
  @apply relative bg-card border border-border rounded-lg overflow-hidden transition-all duration-200;
  @apply hover:shadow-md hover:border-accent-foreground/20;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
  @apply cursor-pointer select-none;
}

.document-card.selected {
  @apply border-primary bg-accent/50;
}

.document-card.bulk-select {
  @apply hover:bg-accent/30;
}

.document-card.loading {
  @apply opacity-75 pointer-events-none;
}

/* Selection checkbox */
.selection-checkbox {
  @apply absolute top-2 left-2 z-20 bg-background/80 rounded p-1 backdrop-blur-sm;
}

/* Thumbnail section */
.document-thumbnail {
  @apply relative aspect-[4/3] bg-muted overflow-hidden;
}

.thumbnail-image {
  @apply w-full h-full object-cover;
}

.thumbnail-loading {
  @apply absolute inset-0 bg-background/80 flex items-center justify-center;
}

.loading-spinner {
  @apply flex items-center justify-center;
}

.file-type-badge {
  @apply absolute top-2 right-2 z-10;
}

/* Quick actions overlay */
.quick-actions-overlay {
  @apply absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-200;
  @apply flex items-center justify-center;
}

.document-card:hover .quick-actions-overlay {
  @apply opacity-100;
}

.quick-actions {
  @apply flex items-center gap-2;
}

/* Document information */
.document-info {
  @apply p-3 space-y-2;
}

.document-title {
  @apply font-medium text-sm leading-tight truncate;
  @apply text-foreground;
}

.document-meta {
  @apply text-xs text-muted-foreground;
}

/* Tags */
.document-tags {
  @apply flex flex-wrap gap-1;
}

.tag-badge {
  @apply text-xs px-1.5 py-0.5 max-w-[80px] truncate;
}

.more-tags {
  @apply cursor-help;
}

/* Status indicators */
.status-indicators {
  @apply flex items-center gap-2 text-xs;
}

.sync-status,
.shared-indicator,
.locked-indicator {
  @apply flex items-center;
}

.version-indicator .badge {
  @apply px-1 py-0;
}

/* Selection ring */
.selection-ring {
  @apply absolute inset-0 ring-2 ring-primary ring-offset-1 ring-offset-background rounded-lg pointer-events-none;
}

/* Loading state */
.document-card.loading .document-info {
  @apply opacity-50;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .document-card {
    @apply hover:shadow-sm;
  }
  
  .document-info {
    @apply p-2 space-y-1;
  }
  
  .document-title {
    font-size: 0.75rem; line-height: 1rem;
  }
  
  .quick-actions-overlay {
    @apply opacity-100 bg-black/30;
  }
  
  .quick-actions {
    @apply gap-1;
  }
  
  .tag-badge {
    @apply text-xs max-w-[60px];
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .document-card {
    @apply border-2;
  }
  
  .document-card.selected {
    @apply border-primary border-2;
  }
  
  .quick-actions-overlay {
    @apply bg-black/70;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .document-card {
    transition: none;
  }
  
  .quick-actions-overlay {
    transition: none;
  }
  
  .loading-spinner .animate-spin {
    animation: none;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .document-card {
    @apply min-h-[200px]; /* Ensure adequate touch target */
  }
  
  .quick-actions-overlay {
    @apply opacity-100 bg-black/20;
  }
  
  .selection-checkbox {
    @apply bg-background border border-border;
    @apply min-h-[44px] min-w-[44px] flex items-center justify-center;
  }
}

/* Focus management */
.document-card:focus .quick-actions-overlay {
  @apply opacity-100;
}

/* Print styles */
@media print {
  .document-card {
    @apply shadow-none border border-gray-300;
    @apply break-inside-avoid;
  }
  
  .quick-actions-overlay {
    @apply hidden;
  }
  
  .selection-checkbox {
    @apply hidden;
  }
}
</style>