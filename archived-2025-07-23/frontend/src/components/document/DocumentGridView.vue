<template>
  <div class="document-grid-view">
    <!-- Grid container with responsive columns -->
    <div 
      class="documents-grid"
      :class="gridClasses"
      :style="gridStyles"
      ref="gridContainer"
    >
      <DocumentCard
        v-for="document in documents"
        :key="document.id"
        :document="document"
        :is-selected="selectedDocuments.includes(document.id)"
        :bulk-select="bulkSelect"
        :loading="loading"
        @action="(action, doc) => $emit('action', action, doc)"
        @select="(doc, selected) => $emit('select', doc, selected)"
        @click="(doc) => $emit('action', 'preview', doc)"
      />
      
      <!-- Loading placeholders -->
      <div
        v-if="loading"
        v-for="i in placeholderCount"
        :key="`placeholder-${i}`"
        class="document-card-placeholder"
      >
        <div class="placeholder-thumbnail"></div>
        <div class="placeholder-content">
          <div class="placeholder-title"></div>
          <div class="placeholder-meta"></div>
        </div>
      </div>
    </div>

    <!-- Load more trigger -->
    <div
      v-if="hasMore && !loading"
      ref="loadMoreTrigger"
      class="load-more-trigger"
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { Plus, FileText } from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'

// Document Components
import DocumentCard from './DocumentCard.vue'

// Types
import type { Document, DocumentAction } from '~/types/document'

interface Props {
  documents: Document[]
  selectedDocuments?: string[]
  bulkSelect?: boolean
  loading?: boolean
  hasMore?: boolean
  minColumnWidth?: number
  maxColumns?: number
  gap?: number
}

interface Emits {
  (e: 'action', action: DocumentAction, document: Document): void
  (e: 'select', document: Document, selected: boolean): void
  (e: 'load-more'): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedDocuments: () => [],
  bulkSelect: false,
  loading: false,
  hasMore: false,
  minColumnWidth: 280,
  maxColumns: 6,
  gap: 16
})

const emit = defineEmits<Emits>()

// Local state
const gridContainer = ref<HTMLElement>()
const loadMoreTrigger = ref<HTMLElement>()
const containerWidth = ref(0)
const columns = ref(4)

// Computed properties
const gridClasses = computed(() => ({
  'grid-loading': props.loading,
  'bulk-select': props.bulkSelect
}))

const gridStyles = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
  gap: `${props.gap}px`
}))

const placeholderCount = computed(() => {
  // Show placeholders to fill the grid while loading
  return Math.max(0, columns.value * 2 - props.documents.length)
})

// Calculate optimal number of columns based on container width
const calculateColumns = () => {
  if (!gridContainer.value) return
  
  const containerRect = gridContainer.value.getBoundingClientRect()
  containerWidth.value = containerRect.width
  
  // Calculate columns based on minimum width and gaps
  const availableWidth = containerWidth.value - props.gap
  const columnWithGap = props.minColumnWidth + props.gap
  const calculatedColumns = Math.floor(availableWidth / columnWithGap)
  
  // Constrain to reasonable limits
  columns.value = Math.max(1, Math.min(props.maxColumns, calculatedColumns))
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

// Resize observer for responsive columns
useResizeObserver(gridContainer, () => {
  calculateColumns()
})

// Lifecycle
onMounted(() => {
  nextTick(() => {
    calculateColumns()
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
.document-grid-view {
  @apply w-full h-full;
}

/* Grid layout */
.documents-grid {
  @apply grid gap-4 p-4;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.documents-grid.grid-loading {
  @apply animate-pulse;
}

.documents-grid.bulk-select {
  @apply select-none;
}

/* Loading placeholders */
.document-card-placeholder {
  @apply bg-muted rounded-lg overflow-hidden animate-pulse;
  aspect-ratio: 280 / 320;
}

.placeholder-thumbnail {
  @apply bg-muted-foreground/20 h-48;
}

.placeholder-content {
  @apply p-3 space-y-2;
}

.placeholder-title {
  @apply bg-muted-foreground/20 h-4 rounded;
}

.placeholder-meta {
  @apply bg-muted-foreground/10 h-3 rounded w-2/3;
}

/* Load more section */
.load-more-trigger {
  @apply flex justify-center p-6;
}

.load-more-button {
  @apply px-6 py-3 text-sm;
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

/* Responsive breakpoints */
@media (max-width: 640px) {
  .documents-grid {
    @apply grid-cols-1 gap-3 p-3;
  }
  
  .load-more-trigger {
    @apply p-4;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .documents-grid {
    @apply grid-cols-2 gap-3;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .documents-grid {
    @apply grid-cols-3;
  }
}

@media (min-width: 1025px) and (max-width: 1280px) {
  .documents-grid {
    @apply grid-cols-4;
  }
}

@media (min-width: 1281px) and (max-width: 1536px) {
  .documents-grid {
    @apply grid-cols-5;
  }
}

@media (min-width: 1537px) {
  .documents-grid {
    @apply grid-cols-6;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .document-card-placeholder {
    @apply border border-border;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .documents-grid.grid-loading {
    animation: none;
  }
  
  .document-card-placeholder {
    animation: none;
  }
}

/* Print styles */
@media print {
  .load-more-trigger {
    @apply hidden;
  }
  
  .documents-grid {
    @apply grid-cols-3 gap-2;
  }
}
</style>