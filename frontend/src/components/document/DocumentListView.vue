<template>
  <div class="document-list-view">
    <!-- View Controls Header -->
    <div class="view-controls flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="flex items-center gap-4">
        <!-- View Toggle -->
        <DocumentViewToggle 
          v-model="viewMode" 
          @change="handleViewChange"
        />
        
        <!-- Document Count -->
        <div class="text-sm text-muted-foreground">
          {{ filteredDocuments.length }} document{{ filteredDocuments.length !== 1 ? 's' : '' }}
          <span v-if="loading" class="ml-2">
            <div class="inline-flex items-center">
              <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
              Loading...
            </div>
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Sort Options -->
        <DocumentSortOptions 
          v-model="sortConfig"
          @change="handleSortChange" 
        />
        
        <!-- Filter Toggle -->
        <Button 
          variant="outline" 
          size="sm"
          @click="showFilters = !showFilters"
          :class="{ 'bg-accent': showFilters }"
        >
          <Filter class="h-4 w-4 mr-2" />
          Filters
          <span v-if="activeFiltersCount > 0" class="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
            {{ activeFiltersCount }}
          </span>
        </Button>
        
        <!-- View Options -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="refreshDocuments">
              <RefreshCw class="h-4 w-4 mr-2" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem @click="exportDocuments">
              <Download class="h-4 w-4 mr-2" />
              Export List
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="showBulkActions = !showBulkActions">
              <CheckSquare class="h-4 w-4 mr-2" />
              Bulk Select
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Filters Sidebar -->
    <div class="flex flex-1 overflow-hidden">
      <DocumentFilters
        v-if="showFilters"
        v-model="filterConfig"
        :documents="documents"
        @change="handleFilterChange"
        class="w-64 border-r bg-muted/20"
      />

      <!-- Main Content Area -->
      <div class="flex-1 overflow-hidden">
        <!-- Bulk Actions Bar -->
        <div v-if="showBulkActions && selectedDocuments.length > 0" 
             class="bulk-actions-bar flex items-center justify-between p-3 bg-accent border-b">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">
              {{ selectedDocuments.length }} selected
            </span>
            <Button variant="outline" size="sm" @click="clearSelection">
              Clear
            </Button>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="downloadSelected">
              <Download class="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" @click="shareSelected">
              <Share class="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="destructive" size="sm" @click="deleteSelected">
              <Trash2 class="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar p-4 border-b">
          <div class="relative max-w-md">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Search documents..."
              class="pl-10"
              @input="handleSearchChange"
            />
            <Button
              v-if="searchQuery"
              variant="ghost"
              size="sm"
              class="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              @click="clearSearch"
            >
              <X class="h-3 w-3" />
            </Button>
          </div>
        </div>

        <!-- Document Views -->
        <div class="document-views flex-1 overflow-auto" ref="documentContainer">
          <!-- Empty State -->
          <div v-if="!loading && filteredDocuments.length === 0" class="empty-state">
            <div class="flex flex-col items-center justify-center h-64 text-center">
              <FileText class="h-16 w-16 text-muted-foreground mb-4" />
              <h3 class="text-lg font-medium mb-2">
                {{ searchQuery || hasActiveFilters ? 'No documents found' : 'No documents yet' }}
              </h3>
              <p class="text-muted-foreground mb-4">
                {{ searchQuery || hasActiveFilters 
                  ? 'Try adjusting your search or filters' 
                  : 'Upload your first document to get started' 
                }}
              </p>
              <Button v-if="!searchQuery && !hasActiveFilters" @click="$emit('upload-documents')">
                <Upload class="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          </div>

          <!-- Grid View -->
          <DocumentGridView 
            v-else-if="viewMode === 'grid'"
            :documents="paginatedDocuments"
            :loading="loading"
            :selected-documents="selectedDocuments"
            :bulk-select="showBulkActions"
            @action="handleDocumentAction"
            @select="handleDocumentSelect"
            @load-more="handleLoadMore"
            class="p-4"
          />
          
          <!-- List View -->
          <DocumentListItemView 
            v-else
            :documents="paginatedDocuments"
            :loading="loading"
            :selected-documents="selectedDocuments"
            :bulk-select="showBulkActions"
            :sort-config="sortConfig"
            @action="handleDocumentAction"
            @select="handleDocumentSelect"
            @sort="handleSort"
            @load-more="handleLoadMore"
          />
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading && documents.length === 0" class="loading-overlay absolute inset-0 bg-background/80 flex items-center justify-center z-10">
      <div class="flex flex-col items-center gap-2">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="text-sm text-muted-foreground">Loading documents...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useDocumentListView } from '~/composables/useDocumentListView'
import { useDocumentViewStore } from '~/stores/documentViewStore'
import { 
  Filter, 
  MoreHorizontal, 
  RefreshCw, 
  Download, 
  CheckSquare, 
  Share, 
  Trash2, 
  Search, 
  X, 
  FileText, 
  Upload 
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu'

// Document Components
import DocumentViewToggle from './DocumentViewToggle.vue'
import DocumentSortOptions from './DocumentSortOptions.vue'
import DocumentFilters from './DocumentFilters.vue'
import DocumentGridView from './DocumentGridView.vue'
import DocumentListItemView from './DocumentListItemView.vue'

// Types
import type { Document, DocumentAction, DocumentSortConfig, DocumentFilterConfig } from '~/types/document'

interface Props {
  matterId?: string
  initialViewMode?: 'grid' | 'list'
  enableBulkActions?: boolean
  enableFilters?: boolean
  pageSize?: number
}

interface Emits {
  (e: 'document-action', action: DocumentAction, document: Document): void
  (e: 'upload-documents'): void
  (e: 'selection-change', documents: Document[]): void
}

const props = withDefaults(defineProps<Props>(), {
  initialViewMode: 'grid',
  enableBulkActions: true,
  enableFilters: true,
  pageSize: 50
})

const emit = defineEmits<Emits>()

// Document list composable
const {
  documents,
  loading,
  error,
  refreshDocuments,
  loadMoreDocuments,
  hasMore
} = useDocumentListView(props.matterId)

// View store for preferences
const viewStore = useDocumentViewStore()

// Local state
const documentContainer = ref<HTMLElement>()
const searchQuery = ref('')
const showFilters = ref(false)
const showBulkActions = ref(false)
const selectedDocuments = ref<Document[]>([])
const currentPage = ref(1)

// View configuration
const viewMode = ref(props.initialViewMode)
const sortConfig = ref<DocumentSortConfig>({
  field: 'modifiedDate',
  direction: 'desc'
})
const filterConfig = ref<DocumentFilterConfig>({
  fileTypes: [],
  dateRange: null,
  sizeRange: null,
  tags: []
})

// Computed properties
const filteredDocuments = computed(() => {
  let result = [...documents.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(doc => 
      doc.fileName.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  // Apply type filters
  if (filterConfig.value.fileTypes.length > 0) {
    result = result.filter(doc => 
      filterConfig.value.fileTypes.includes(doc.mimeType)
    )
  }
  
  // Apply date range filter
  if (filterConfig.value.dateRange) {
    const { start, end } = filterConfig.value.dateRange
    result = result.filter(doc => {
      const docDate = new Date(doc.modifiedDate)
      return docDate >= start && docDate <= end
    })
  }
  
  // Apply size range filter
  if (filterConfig.value.sizeRange) {
    const { min, max } = filterConfig.value.sizeRange
    result = result.filter(doc => 
      doc.size >= min && doc.size <= max
    )
  }
  
  // Apply sorting
  result.sort((a, b) => {
    const { field, direction } = sortConfig.value
    let aValue = a[field as keyof Document]
    let bValue = b[field as keyof Document]
    
    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
  
  return result
})

const paginatedDocuments = computed(() => {
  const start = 0
  const end = currentPage.value * props.pageSize
  return filteredDocuments.value.slice(start, end)
})

const hasActiveFilters = computed(() => {
  return filterConfig.value.fileTypes.length > 0 ||
         filterConfig.value.dateRange !== null ||
         filterConfig.value.sizeRange !== null ||
         filterConfig.value.tags.length > 0
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filterConfig.value.fileTypes.length > 0) count++
  if (filterConfig.value.dateRange) count++
  if (filterConfig.value.sizeRange) count++
  if (filterConfig.value.tags.length > 0) count++
  return count
})

// Event handlers
const handleViewChange = (newMode: 'grid' | 'list') => {
  viewMode.value = newMode
  viewStore.setViewMode(newMode)
  clearSelection()
}

const handleSortChange = (newSortConfig: DocumentSortConfig) => {
  sortConfig.value = newSortConfig
  viewStore.setSortConfig(newSortConfig)
}

const handleFilterChange = (newFilterConfig: DocumentFilterConfig) => {
  filterConfig.value = newFilterConfig
  currentPage.value = 1 // Reset to first page when filters change
}

const handleSearchChange = () => {
  currentPage.value = 1 // Reset to first page when searching
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const handleDocumentAction = (action: DocumentAction, document: Document) => {
  emit('document-action', action, document)
}

const handleDocumentSelect = (document: Document, selected: boolean) => {
  if (selected) {
    selectedDocuments.value.push(document)
  } else {
    const index = selectedDocuments.value.findIndex(d => d.id === document.id)
    if (index !== -1) {
      selectedDocuments.value.splice(index, 1)
    }
  }
  emit('selection-change', selectedDocuments.value)
}

const clearSelection = () => {
  selectedDocuments.value = []
  emit('selection-change', [])
}

const handleSort = (field: string) => {
  const newDirection = sortConfig.value.field === field && sortConfig.value.direction === 'asc' 
    ? 'desc' 
    : 'asc'
  
  handleSortChange({
    field: field as keyof Document,
    direction: newDirection
  })
}

const handleLoadMore = () => {
  if (paginatedDocuments.value.length < filteredDocuments.value.length) {
    currentPage.value++
  } else if (hasMore.value) {
    loadMoreDocuments()
  }
}

// Bulk actions
const downloadSelected = () => {
  selectedDocuments.value.forEach(doc => {
    handleDocumentAction('download', doc)
  })
  clearSelection()
}

const shareSelected = () => {
  // TODO: Implement bulk share functionality
  console.log('Share selected documents:', selectedDocuments.value)
  clearSelection()
}

const deleteSelected = () => {
  if (confirm(`Are you sure you want to delete ${selectedDocuments.value.length} documents?`)) {
    selectedDocuments.value.forEach(doc => {
      handleDocumentAction('delete', doc)
    })
    clearSelection()
  }
}

const exportDocuments = () => {
  // TODO: Implement export functionality
  console.log('Export documents')
}

// Initialize view preferences
onMounted(() => {
  viewMode.value = viewStore.viewMode
  sortConfig.value = viewStore.sortConfig
})

// Watch for view mode changes and persist
watch(viewMode, (newMode) => {
  viewStore.setViewMode(newMode)
})

watch(sortConfig, (newConfig) => {
  viewStore.setSortConfig(newConfig)
}, { deep: true })
</script>

<style scoped>
.document-list-view {
  @apply flex flex-col h-full bg-background;
}

.view-controls {
  @apply sticky top-0 z-20;
}

.bulk-actions-bar {
  @apply sticky top-0 z-10;
}

.search-bar {
  @apply sticky top-0 z-10 bg-background;
}

.document-views {
  @apply relative;
}

.loading-overlay {
  @apply pointer-events-none;
}

.empty-state {
  @apply p-8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .view-controls {
    @apply flex-col gap-2 p-2;
  }
  
  .view-controls > div {
    @apply flex-wrap;
  }
  
  .search-bar {
    @apply p-2;
  }
  
  .bulk-actions-bar {
    @apply flex-col gap-2 p-2;
  }
}

/* Focus states for accessibility */
.document-views:focus {
  @apply outline-none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .view-controls {
    @apply border-b-2;
  }
  
  .bulk-actions-bar {
    @apply border-b-2;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
}
</style>