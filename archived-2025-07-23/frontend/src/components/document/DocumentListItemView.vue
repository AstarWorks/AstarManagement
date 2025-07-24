<template>
  <div class="document-list-view">
    <!-- Table header -->
    <div class="list-header" role="row">
      <div v-if="bulkSelect" class="header-cell selection-header">
        <Checkbox
          :checked="allSelected"
          :indeterminate="someSelected"
          @update:checked="toggleSelectAll"
          aria-label="Select all documents"
        />
      </div>
      
      <div class="header-cell thumbnail-header">
        <!-- No header for thumbnail -->
      </div>
      
      <div class="header-cell name-header">
        <button
          class="sort-button"
          :class="{ 'active': sortConfig.field === 'fileName' }"
          @click="$emit('sort', 'fileName')"
        >
          Name
          <component
            :is="getSortIcon('fileName')"
            class="sort-icon"
          />
        </button>
      </div>
      
      <div class="header-cell size-header hidden sm:flex">
        <button
          class="sort-button"
          :class="{ 'active': sortConfig.field === 'size' }"
          @click="$emit('sort', 'size')"
        >
          Size
          <component
            :is="getSortIcon('size')"
            class="sort-icon"
          />
        </button>
      </div>
      
      <div class="header-cell type-header hidden md:flex">
        Type
      </div>
      
      <div class="header-cell date-header hidden lg:flex">
        <button
          class="sort-button"
          :class="{ 'active': sortConfig.field === 'modifiedDate' }"
          @click="$emit('sort', 'modifiedDate')"
        >
          Modified
          <component
            :is="getSortIcon('modifiedDate')"
            class="sort-icon"
          />
        </button>
      </div>
      
      <div class="header-cell creator-header hidden xl:flex">
        <button
          class="sort-button"
          :class="{ 'active': sortConfig.field === 'createdBy' }"
          @click="$emit('sort', 'createdBy')"
        >
          Created By
          <component
            :is="getSortIcon('createdBy')"
            class="sort-icon"
          />
        </button>
      </div>
      
      <div class="header-cell tags-header hidden sm:flex">
        Tags
      </div>
      
      <div class="header-cell status-header hidden md:flex">
        Status
      </div>
      
      <div class="header-cell actions-header">
        Actions
      </div>
    </div>

    <!-- Document list container -->
    <div 
      class="list-container"
      ref="listContainer"
      role="grid"
      :aria-rowcount="documents.length"
    >
      <!-- Virtual scrolling container -->
      <div
        class="list-content"
        :style="{ height: virtualScrollHeight }"
      >
        <!-- Document items -->
        <DocumentListItem
          v-for="(item, index) in visibleDocuments"
          :key="item.data.id"
          :document="item.data"
          :is-selected="selectedDocuments.includes(item.data.id)"
          :bulk-select="bulkSelect"
          :loading="loading && index < 3"
          :style="getItemStyle(index)"
          @action="(action, doc) => $emit('action', action, doc)"
          @select="(doc, selected) => $emit('select', doc, selected)"
          @click="(doc) => $emit('action', 'preview', doc)"
        />
        
        <!-- Loading placeholders -->
        <div
          v-if="loading"
          v-for="i in placeholderCount"
          :key="`placeholder-${i}`"
          class="list-item-placeholder"
          :style="getItemStyle(documents.length + i - 1)"
        >
          <div class="placeholder-row">
            <div class="placeholder-thumbnail"></div>
            <div class="placeholder-name"></div>
            <div class="placeholder-size hidden sm:block"></div>
            <div class="placeholder-type hidden md:block"></div>
            <div class="placeholder-date hidden lg:block"></div>
            <div class="placeholder-creator hidden xl:block"></div>
            <div class="placeholder-tags hidden sm:block"></div>
            <div class="placeholder-status hidden md:block"></div>
            <div class="placeholder-actions"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load more section -->
    <div
      v-if="hasMore && !loading"
      ref="loadMoreTrigger"
      class="load-more-section"
    >
      <Button
        variant="outline"
        @click="$emit('load-more')"
        class="load-more-button"
      >
        <Plus class="h-4 w-4 mr-2" />
        Load More Documents
      </Button>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && documents.length === 0" class="empty-state">
      <div class="empty-content">
        <FileText class="empty-icon" />
        <h3 class="empty-title">No documents found</h3>
        <p class="empty-description">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useVirtualList } from '@vueuse/core'
import { ArrowUp, ArrowDown, ChevronsUpDown, Plus, FileText } from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'

// Document Components
import DocumentListItem from './DocumentListItem.vue'

// Types
import type { Document, DocumentAction, DocumentSortConfig } from '~/types/document'

interface Props {
  documents: Document[]
  selectedDocuments?: string[]
  bulkSelect?: boolean
  loading?: boolean
  hasMore?: boolean
  sortConfig?: DocumentSortConfig
  itemHeight?: number
  overscan?: number
}

interface Emits {
  (e: 'action', action: DocumentAction, document: Document): void
  (e: 'select', document: Document, selected: boolean): void
  (e: 'sort', field: string): void
  (e: 'load-more'): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedDocuments: () => [],
  bulkSelect: false,
  loading: false,
  hasMore: false,
  sortConfig: () => ({ field: 'modifiedDate', direction: 'desc' }),
  itemHeight: 64,
  overscan: 10
})

const emit = defineEmits<Emits>()

// Local state
const listContainer = ref<HTMLElement>()
const loadMoreTrigger = ref<HTMLElement>()

// Virtual scrolling setup
const {
  list: visibleDocuments,
  containerProps,
  wrapperProps
} = useVirtualList(
  computed(() => props.documents),
  {
    itemHeight: props.itemHeight,
    overscan: props.overscan
  }
)

// Computed properties
const allSelected = computed(() => {
  return props.documents.length > 0 && 
         props.documents.every(doc => props.selectedDocuments.includes(doc.id))
})

const someSelected = computed(() => {
  return props.selectedDocuments.length > 0 && !allSelected.value
})

const placeholderCount = computed(() => {
  return props.loading ? Math.min(5, Math.max(0, 10 - props.documents.length)) : 0
})

const virtualScrollHeight = computed(() => {
  const totalItems = props.documents.length + placeholderCount.value
  return `${totalItems * props.itemHeight}px`
})

// Helper methods
const getSortIcon = (field: string) => {
  if (props.sortConfig?.field !== field) {
    return ChevronsUpDown
  }
  return props.sortConfig.direction === 'asc' ? ArrowUp : ArrowDown
}

const getItemStyle = (index: number) => {
  return {
    position: 'absolute' as const,
    top: `${index * props.itemHeight}px`,
    left: '0',
    right: '0',
    height: `${props.itemHeight}px`
  }
}

const toggleSelectAll = (checked: boolean) => {
  props.documents.forEach(document => {
    emit('select', document, checked)
  })
}

// Intersection Observer for infinite scrolling
let loadMoreObserver: IntersectionObserver | null = null

const setupInfiniteScroll = () => {
  if (!loadMoreTrigger.value || !('IntersectionObserver' in window)) return
  
  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && props.hasMore && !props.loading) {
          emit('load-more')
        }
      })
    },
    {
      rootMargin: '100px',
      threshold: 0.1
    }
  )
  
  loadMoreObserver.observe(loadMoreTrigger.value)
}

const cleanupInfiniteScroll = () => {
  if (loadMoreObserver) {
    loadMoreObserver.disconnect()
    loadMoreObserver = null
  }
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    setupInfiniteScroll()
  })
})

onUnmounted(() => {
  cleanupInfiniteScroll()
})

// Watch for load more trigger changes
watch(() => props.hasMore, () => {
  nextTick(() => {
    cleanupInfiniteScroll()
    setupInfiniteScroll()
  })
})
</script>

<style scoped>
.document-list-view {
  @apply flex flex-col h-full bg-background;
}

/* Table header */
.list-header {
  @apply flex items-center py-3 px-4 border-b-2 border-border bg-muted/50 sticky top-0 z-10;
  @apply text-sm font-medium text-muted-foreground;
}

.header-cell {
  @apply flex items-center;
}

.sort-button {
  @apply flex items-center gap-1 hover:text-foreground transition-colors;
  @apply focus:outline-none focus:text-foreground;
}

.sort-button.active {
  @apply text-foreground;
}

.sort-icon {
  @apply h-3 w-3;
}

/* Header column widths */
.selection-header {
  @apply w-10 flex-shrink-0 mr-3;
}

.thumbnail-header {
  @apply w-12 flex-shrink-0 mr-3;
}

.name-header {
  @apply flex-1 min-w-0 mr-4;
}

.size-header {
  @apply w-20 flex-shrink-0 mr-4 justify-end;
}

.type-header {
  @apply w-24 flex-shrink-0 mr-4;
}

.date-header {
  @apply w-32 flex-shrink-0 mr-4;
}

.creator-header {
  @apply w-40 flex-shrink-0 mr-4;
}

.tags-header {
  @apply w-32 flex-shrink-0 mr-4;
}

.status-header {
  @apply w-20 flex-shrink-0 mr-4;
}

.actions-header {
  @apply w-24 flex-shrink-0;
}

/* List container */
.list-container {
  @apply flex-1 overflow-auto relative;
}

.list-content {
  @apply relative;
  min-height: 100%;
}

/* Loading placeholders */
.list-item-placeholder {
  @apply absolute left-0 right-0;
  @apply border-b border-border bg-background animate-pulse;
}

.placeholder-row {
  @apply flex items-center py-3 px-4 gap-3;
}

.placeholder-thumbnail {
  @apply w-10 h-10 bg-muted rounded;
}

.placeholder-name {
  @apply flex-1 h-4 bg-muted rounded;
}

.placeholder-size {
  @apply w-16 h-3 bg-muted rounded;
}

.placeholder-type {
  @apply w-20 h-3 bg-muted rounded;
}

.placeholder-date {
  @apply w-24 h-3 bg-muted rounded;
}

.placeholder-creator {
  @apply w-32 h-3 bg-muted rounded;
}

.placeholder-tags {
  @apply w-24 h-3 bg-muted rounded;
}

.placeholder-status {
  @apply w-16 h-3 bg-muted rounded;
}

.placeholder-actions {
  @apply w-20 h-3 bg-muted rounded;
}

/* Load more section */
.load-more-section {
  @apply flex justify-center p-4 border-t border-border;
}

.load-more-button {
  @apply px-6 py-2 text-sm;
}

/* Empty state */
.empty-state {
  @apply flex items-center justify-center min-h-[400px] p-8;
}

.empty-content {
  @apply text-center max-w-md;
}

.empty-icon {
  @apply h-16 w-16 mx-auto mb-4 text-muted-foreground;
}

.empty-title {
  @apply text-lg font-semibold mb-2 text-foreground;
}

.empty-description {
  @apply text-muted-foreground;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .list-header {
    @apply py-2 px-2 text-xs;
  }
  
  .placeholder-row {
    @apply py-2 px-2;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .list-header {
    @apply border-b-4;
  }
  
  .list-item-placeholder {
    @apply border-b-2;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .sort-button {
    transition: none;
  }
  
  .list-item-placeholder {
    animation: none;
  }
}

/* Print styles */
@media print {
  .list-header {
    @apply sticky;
  }
  
  .load-more-section {
    @apply hidden;
  }
  
  .actions-header,
  .placeholder-actions {
    @apply hidden;
  }
}
</style>