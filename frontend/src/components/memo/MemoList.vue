<template>
  <div class="memo-list">
    <!-- List Header -->
    <div class="list-header">
      <div class="header-left">
        <h3 class="list-title">Memos</h3>
        <Badge v-if="totalCount > 0" variant="secondary" class="count-badge">
          {{ totalCount }}
        </Badge>
      </div>
      
      <div class="header-right">
        <!-- View Toggle -->
        <div class="view-toggle">
          <Button
            variant="ghost"
            size="sm"
            :class="viewMode === 'list' ? 'view-active' : ''"
            @click="setViewMode('list')"
          >
            <List class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="viewMode === 'grid' ? 'view-active' : ''"
            @click="setViewMode('grid')"
          >
            <Grid class="size-4" />
          </Button>
        </div>
        
        <!-- Sort Options -->
        <Select v-model="sortBy" @update:modelValue="handleSortChange">
          <SelectTrigger class="w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date Created</SelectItem>
            <SelectItem value="sentAt">Date Sent</SelectItem>
            <SelectItem value="subject">Subject</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="ghost"
          size="sm"
          @click="toggleSortOrder"
        >
          <component :is="sortOrder === 'asc' ? ArrowUp : ArrowDown" class="size-4" />
        </Button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading && !memos.length" class="loading-state">
      <div class="loading-grid" :class="viewMode === 'grid' ? 'grid-layout' : 'list-layout'">
        <div
          v-for="i in 6"
          :key="i"
          class="loading-item"
        >
          <div class="loading-skeleton" />
        </div>
      </div>
    </div>
    
    <!-- Memo Grid/List with Virtual Scrolling -->
    <div v-else-if="memos.length > 0" class="memo-container">
      <div v-if="viewMode === 'list'" class="memo-list-container">
        <div 
          class="memo-grid list-layout"
          :class="{ 'selecting-mode': selectedMemoIds.size > 0 }"
        >
          <MemoListItem
            v-for="memo in memos"
            :key="memo.id"
            :memo="memo"
            :selected="selectedMemoIds.has(memo.id)"
            :search-terms="searchTerms"
            @click="handleMemoClick(memo)"
            @select="handleMemoSelect(memo.id, $event)"
            @edit="handleMemoEdit(memo)"
            @view="handleMemoView(memo)"
          />
        </div>
      </div>
      
      <!-- Grid view without virtualization for now -->
      <div 
        v-else
        class="memo-grid grid-layout"
        :class="{ 'selecting-mode': selectedMemoIds.size > 0 }"
      >
        <MemoCard
          v-for="memo in memos"
          :key="memo.id"
          :memo="memo"
          :selected="selectedMemoIds.has(memo.id)"
          :search-terms="searchTerms"
          @click="handleMemoClick(memo)"
          @select="handleMemoSelect(memo.id, $event)"
          @edit="handleMemoEdit(memo)"
          @view="handleMemoView(memo)"
        />
      </div>
      
      <!-- Load More / Infinite Scroll Trigger -->
      <div ref="loadMoreTrigger" class="load-more-trigger">
        <div v-if="isFetchingNextPage" class="loading-more">
          <div class="loading-spinner" />
          <span>Loading more memos...</span>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <MessageSquare class="empty-icon" />
        <h3 class="empty-title">{{ getEmptyStateTitle() }}</h3>
        <p class="empty-description">{{ getEmptyStateDescription() }}</p>
        <div class="empty-actions">
          <Button @click="clearFiltersAndSearch" v-if="hasActiveFilters">
            <X class="size-4 mr-2" />
            Clear Filters
          </Button>
          <Button @click="createNewMemo">
            <Plus class="size-4 mr-2" />
            Create Memo
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-if="error && !isLoading" class="error-state">
      <div class="error-content">
        <AlertTriangle class="error-icon" />
        <h3 class="error-title">Failed to load memos</h3>
        <p class="error-description">{{ error.message }}</p>
        <Button @click="refetch" variant="outline">
          <RefreshCw class="size-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
    
    <!-- Bulk Actions Toolbar -->
    <MemoBulkActions
      v-if="selectedMemoIds.size > 0"
      :selected-memo-ids="Array.from(selectedMemoIds)"
      :total-count="totalCount"
      :is-all-selected="isAllSelected"
      @selection-change="handleSelectionChange"
      @select-all="selectAllMemos"
      @clear-selection="clearSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  List,
  Grid,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Plus,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useMemosInfiniteQuery } from '~/composables/useMemoQueries'
import { useListViewPreference } from '~/composables/useListViewPreference'
import { useIntersectionObserver, useLocalStorage } from '@vueuse/core'
import MemoCard from './MemoCard.vue'
import MemoListItem from './MemoListItem.vue'
import MemoBulkActions from './MemoBulkActions.vue'
import type { MemoFilters, Memo } from '~/types/memo'

interface Props {
  caseId?: string
  defaultView?: 'list' | 'grid'
  filters?: MemoFilters
  searchTerms?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  defaultView: 'list'
})

const emit = defineEmits<{
  memoClick: [memo: Memo]
  memoEdit: [memo: Memo]
  memoView: [memo: Memo]
  createMemo: []
  filtersChange: [filters: MemoFilters]
}>()

// View preferences
const { viewMode, setViewMode } = useListViewPreference('memo-view', props.defaultView)

// Filter persistence
const savedFilters = useLocalStorage('memo-filters', {} as MemoFilters)
const currentFilters = ref<MemoFilters>(savedFilters.value)
const updateFilters = (filters: MemoFilters) => {
  currentFilters.value = filters
  savedFilters.value = filters
}

// Merge props filters with persisted filters
const mergedFilters = computed(() => ({
  ...currentFilters.value,
  ...props.filters,
  caseId: props.caseId
}))

// Data fetching
const {
  data,
  isLoading,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch
} = useMemosInfiniteQuery(mergedFilters, { enabled: true })

// Selection state
const selectedMemoIds = ref<Set<string>>(new Set())

// Sorting
const sortBy = ref<'createdAt' | 'subject' | 'sentAt' | 'priority'>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Load more trigger
const loadMoreTrigger = ref<HTMLElement>()

// Computed properties
const memos = computed(() => {
  if (!data.value) return []
  return data.value.pages.flatMap(page => page.data)
})

const totalCount = computed(() => {
  return data.value?.pages[0]?.total || 0
})

const isAllSelected = computed(() => {
  return memos.value.length > 0 && memos.value.every(memo => selectedMemoIds.value.has(memo.id))
})

const hasActiveFilters = computed(() => {
  const filters = mergedFilters.value
  return !!(
    filters.search ||
    filters.status?.length ||
    filters.priority?.length ||
    filters.recipientType?.length ||
    filters.tags?.length ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.hasAttachments !== undefined
  )
})

// Methods
const handleSortChange = (newSortBy: string) => {
  const validSortBy = newSortBy as 'createdAt' | 'subject' | 'sentAt' | 'priority'
  sortBy.value = validSortBy
  updateFilters({ 
    ...mergedFilters.value,
    sort: validSortBy,
    order: sortOrder.value
  })
  emit('filtersChange', mergedFilters.value)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  updateFilters({ 
    ...mergedFilters.value,
    sort: sortBy.value,
    order: sortOrder.value
  })
  emit('filtersChange', mergedFilters.value)
}

const handleMemoClick = (memo: Memo) => {
  if (selectedMemoIds.value.size > 0) {
    // In selection mode, clicking toggles selection
    handleMemoSelect(memo.id, !selectedMemoIds.value.has(memo.id))
  } else {
    // Normal click
    emit('memoClick', memo)
  }
}

const handleMemoSelect = (memoId: string, selected: boolean) => {
  if (selected) {
    selectedMemoIds.value.add(memoId)
  } else {
    selectedMemoIds.value.delete(memoId)
  }
}

const handleMemoEdit = (memo: Memo) => {
  emit('memoEdit', memo)
}

const handleMemoView = (memo: Memo) => {
  emit('memoView', memo)
}

const selectAllMemos = () => {
  memos.value.forEach(memo => {
    selectedMemoIds.value.add(memo.id)
  })
}

const clearSelection = () => {
  selectedMemoIds.value.clear()
}

const handleSelectionChange = (ids: string[]) => {
  selectedMemoIds.value = new Set(ids)
}

const clearFiltersAndSearch = () => {
  updateFilters({})
  emit('filtersChange', {})
}

const createNewMemo = () => {
  emit('createMemo')
}

const getEmptyStateTitle = () => {
  if (hasActiveFilters.value) {
    return 'No memos match your filters'
  }
  return props.caseId ? 'No memos for this case' : 'No memos found'
}

const getEmptyStateDescription = () => {
  if (hasActiveFilters.value) {
    return 'Try adjusting your search terms or filters to find more memos.'
  }
  return props.caseId 
    ? 'Create your first memo for this case to get started.'
    : 'Create your first memo to start communicating with clients and external parties.'
}

// Intersection observer for infinite scroll
const { stop } = useIntersectionObserver(
  loadMoreTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasNextPage.value && !isFetchingNextPage.value) {
      fetchNextPage()
    }
  },
  { threshold: 0.1 }
)

// Watch for filter changes
watch(mergedFilters, () => {
  // Reset selection when filters change
  clearSelection()
}, { deep: true })

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + A to select all
  if ((event.ctrlKey || event.metaKey) && event.key === 'a' && memos.value.length > 0) {
    event.preventDefault()
    if (isAllSelected.value) {
      clearSelection()
    } else {
      selectAllMemos()
    }
  }
  
  // Escape to clear selection
  if (event.key === 'Escape' && selectedMemoIds.value.size > 0) {
    clearSelection()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  stop()
})
</script>

<style scoped>
.memo-list {
  @apply space-y-6;
}

.list-header {
  @apply flex items-center justify-between;
}

.header-left {
  @apply flex items-center gap-3;
}

.list-title {
  @apply text-lg font-semibold text-foreground;
}

.count-badge {
  @apply text-xs;
}

.header-right {
  @apply flex items-center gap-3;
}

.view-toggle {
  @apply flex items-center border border-border rounded-lg overflow-hidden;
}

.view-toggle .btn {
  @apply border-none rounded-none;
}

.view-active {
  @apply bg-muted text-foreground;
}

.loading-state {
  @apply space-y-4;
}

.loading-grid {
  @apply space-y-4;
}

.loading-grid.grid-layout {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0;
}

.loading-item {
  @apply animate-pulse;
}

.loading-skeleton {
  @apply h-32 bg-muted rounded-lg;
}

.loading-grid.grid-layout .loading-skeleton {
  @apply h-48;
}

.memo-container {
  @apply space-y-6;
}

.memo-grid.list-layout {
  @apply space-y-4;
}

.memo-grid.grid-layout {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.memo-grid.selecting-mode {
  @apply select-none;
}

.load-more {
  @apply flex justify-center pt-6;
}

.loading-more {
  @apply flex items-center gap-3 text-sm text-muted-foreground;
}

.loading-spinner {
  @apply size-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin;
}

.empty-state,
.error-state {
  @apply flex items-center justify-center py-16;
}

.empty-content,
.error-content {
  @apply text-center space-y-4 max-w-md;
}

.empty-icon,
.error-icon {
  @apply size-16 text-muted-foreground mx-auto;
}

.error-icon {
  @apply text-destructive;
}

.empty-title,
.error-title {
  @apply text-xl font-semibold text-foreground;
}

.empty-description,
.error-description {
  @apply text-muted-foreground;
}

.empty-actions {
  @apply flex flex-col sm:flex-row gap-3 justify-center;
}

/* Virtual scrolling styles */
.virtual-scroll-container {
  @apply h-[600px] overflow-auto;
}

.virtual-list {
  @apply relative w-full;
}

.virtual-item {
  @apply absolute top-0 left-0 w-full;
}

.load-more-trigger {
  @apply h-20 flex items-center justify-center;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .list-header {
    @apply flex-col gap-4;
  }
  
  .header-right {
    @apply w-full justify-between;
  }
  
  .memo-grid.grid-layout {
    @apply grid-cols-1;
  }
  
  .virtual-scroll-container {
    @apply h-[500px];
  }
}
</style>