<template>
  <CommunicationLayout>
    <template #header-actions>
      <Button @click="showCreateMemo = true">
        <Plus class="size-4 mr-2" />
        New Memo
      </Button>
    </template>
    
    <div class="memos-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h2 class="text-xl font-semibold text-foreground">Client Memos</h2>
          <p class="text-muted-foreground">
            Manage communications with clients and external parties
          </p>
        </div>
      </div>
      
      <!-- Search and Filters Section -->
      <div class="search-filters-section">
        <!-- Advanced Search Bar -->
        <MemoSearchBar
          @search="handleSearch"
          @filters-change="handleFiltersChange"
        />
        
        <!-- Filter Toggle -->
        <div class="filter-controls">
          <Button
            variant="outline"
            @click="showFilters = !showFilters"
            class="filter-toggle"
          >
            <Filter class="size-4 mr-2" />
            Filters
            <Badge v-if="activeFiltersCount > 0" variant="secondary" class="ml-2">
              {{ activeFiltersCount }}
            </Badge>
            <ChevronDown :class="['size-4 ml-2', { 'rotate-180': showFilters }]" />
          </Button>
          
          <!-- Quick Actions -->
          <div class="quick-actions">
            <Button
              variant="outline"
              size="sm"
              @click="refreshData"
              :disabled="isLoading"
            >
              <RefreshCw :class="['size-4', { 'animate-spin': isLoading }]" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download class="size-4 mr-2" />
                  Export
                  <ChevronDown class="size-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="exportAllMemos('csv')">
                  <FileSpreadsheet class="size-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem @click="exportAllMemos('pdf')">
                  <FileText class="size-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <!-- Advanced Filters Panel -->
      <div v-if="showFilters" class="filters-panel">
        <MemoFilters
          v-model="currentFilters"
          @update:model-value="handleFiltersChange"
        />
      </div>
      
      <!-- Memo List -->
      <div class="memo-list-container">
        <MemoList
          :filters="currentFilters"
          :search-terms="searchTerms"
          @memo-click="handleMemoClick"
          @memo-edit="handleMemoEdit"
          @memo-view="handleMemoView"
          @create-memo="showCreateMemo = true"
          @filters-change="handleFiltersChange"
        />
      </div>
    </div>
    
    <!-- Create/Edit Memo Dialog -->
    <Dialog v-model:open="showCreateMemo">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {{ editingMemo ? 'Edit Memo' : 'Create New Memo' }}
          </DialogTitle>
          <DialogDescription>
            {{ editingMemo ? 'Update the memo details below.' : 'Create a new memo to communicate with clients or external parties.' }}
          </DialogDescription>
        </DialogHeader>
        
        <div class="memo-form">
          <!-- Memo form would go here -->
          <div class="form-placeholder">
            <MessageSquare class="size-12 text-muted-foreground" />
            <p class="text-muted-foreground">Memo editor coming in T02_S13</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="cancelMemoEdit">
            Cancel
          </Button>
          <Button @click="saveMemo">
            {{ editingMemo ? 'Update Memo' : 'Create Memo' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <!-- Memo Detail Dialog -->
    <Dialog v-model:open="showMemoDetail">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{{ selectedMemo?.subject }}</DialogTitle>
          <DialogDescription>
            {{ selectedMemo?.recipient.name }} • {{ selectedMemo?.caseNumber }}
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedMemo" class="memo-detail">
          <div class="memo-meta">
            <div class="meta-row">
              <span class="meta-label">Status:</span>
              <Badge :variant="getStatusVariant(selectedMemo.status)">
                {{ selectedMemo.status }}
              </Badge>
            </div>
            <div class="meta-row">
              <span class="meta-label">Priority:</span>
              <Badge :variant="getPriorityVariant(selectedMemo.priority)">
                {{ selectedMemo.priority }}
              </Badge>
            </div>
            <div class="meta-row">
              <span class="meta-label">Created:</span>
              <span>{{ formatDate(selectedMemo.sentAt || new Date().toISOString()) }}</span>
            </div>
            <div v-if="selectedMemo.sentAt" class="meta-row">
              <span class="meta-label">Sent:</span>
              <span>{{ formatDate(selectedMemo.sentAt) }}</span>
            </div>
          </div>
          
          <div class="memo-content">
            <h4 class="content-title">Content</h4>
            <div class="content-text">
              {{ selectedMemo.content }}
            </div>
          </div>
          
          <div v-if="selectedMemo.tags.length > 0" class="memo-tags">
            <h4 class="tags-title">Tags</h4>
            <div class="tags-list">
              <Badge
                v-for="tag in selectedMemo.tags"
                :key="tag"
                variant="outline"
              >
                {{ tag }}
              </Badge>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showMemoDetail = false">
            Close
          </Button>
          <Button @click="editSelectedMemo">
            <Edit class="size-4 mr-2" />
            Edit Memo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </CommunicationLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus, 
  Filter,
  ChevronDown,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Edit
} from 'lucide-vue-next'
import { CommunicationLayout } from '~/components/communication'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import MemoSearchBar from '~/components/memo/MemoSearchBar.vue'
import MemoFilters from '~/components/memo/MemoFilters.vue'
import MemoList from '~/components/memo/MemoList.vue'
import { useMemoExport } from '~/composables/useMemoExport'
import { useMemosQuery } from '~/composables/useMemoQueries'
import type { MemoFilters as MemoFiltersType, Memo } from '~/types/memo'
import { format } from 'date-fns'

// Define the page meta
definePageMeta({
  title: 'Client Memos',
  description: 'Manage client memos and external communications'
})

// Component state
const showCreateMemo = ref(false)
const showMemoDetail = ref(false)
const showFilters = ref(false)
const editingMemo = ref<Memo | null>(null)
const selectedMemo = ref<Memo | null>(null)
const searchTerms = ref<string[]>([])
const currentFilters = ref<MemoFiltersType>({})

// Data fetching
const { data, isLoading, refetch } = useMemosQuery(currentFilters)

// Export functionality
const { exportMemos } = useMemoExport()

// Computed properties
const activeFiltersCount = computed(() => {
  let count = 0
  if (currentFilters.value.search) count++
  if (currentFilters.value.status?.length) count++
  if (currentFilters.value.priority?.length) count++
  if (currentFilters.value.recipientType?.length) count++
  if (currentFilters.value.tags?.length) count++
  if (currentFilters.value.dateFrom || currentFilters.value.dateTo) count++
  if (currentFilters.value.hasAttachments !== undefined) count++
  return count
})

// Methods
const handleSearch = (query: string) => {
  // Extract search terms for highlighting
  searchTerms.value = query.split(' ').filter(term => term.length > 2)
}

const handleFiltersChange = (filters: MemoFiltersType) => {
  currentFilters.value = filters
}

const handleMemoClick = (memo: Memo) => {
  selectedMemo.value = memo
  showMemoDetail.value = true
}

const handleMemoEdit = (memo: Memo) => {
  editingMemo.value = memo
  showCreateMemo.value = true
}

const handleMemoView = (memo: Memo) => {
  selectedMemo.value = memo
  showMemoDetail.value = true
}

const refreshData = () => {
  refetch()
}

const exportAllMemos = async (format: 'csv' | 'pdf') => {
  if (!data.value?.data.length) return
  
  try {
    await exportMemos(data.value.data, {
      format,
      includeContent: format === 'pdf',
      includeAttachments: true
    })
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const saveMemo = () => {
  // TODO: Implement memo save logic
  console.log('Saving memo:', editingMemo.value ? 'edit' : 'create')
  showCreateMemo.value = false
  editingMemo.value = null
}

const cancelMemoEdit = () => {
  showCreateMemo.value = false
  editingMemo.value = null
}

const editSelectedMemo = () => {
  if (selectedMemo.value) {
    editingMemo.value = selectedMemo.value
    showMemoDetail.value = false
    showCreateMemo.value = true
  }
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  const variants = {
    draft: 'outline' as const,
    sent: 'default' as const,
    read: 'secondary' as const,
    archived: 'outline' as const
  }
  return variants[status as keyof typeof variants] || 'default'
}

const getPriorityVariant = (priority: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  const variants = {
    low: 'outline' as const,
    medium: 'secondary' as const,
    high: 'default' as const,
    urgent: 'destructive' as const
  }
  return variants[priority as keyof typeof variants] || 'default'
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'PPP p')
}
</script>

<style scoped>
.memos-page {
  @apply space-y-6;
}

.page-header {
  @apply border-b border-border pb-4;
}

.header-content {
  @apply space-y-1;
}

.search-filters-section {
  @apply space-y-4;
}

.filter-controls {
  @apply flex items-center justify-between;
}

.filter-toggle {
  @apply text-sm;
}

.quick-actions {
  @apply flex items-center gap-2;
}

.filters-panel {
  @apply border border-border rounded-lg;
}

.memo-list-container {
  @apply min-h-96;
}

.form-placeholder {
  @apply flex flex-col items-center justify-center py-16 text-center space-y-4;
}

.memo-detail {
  @apply space-y-6;
}

.memo-meta {
  @apply grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg;
}

.meta-row {
  @apply flex items-center gap-2;
}

.meta-label {
  @apply text-sm font-medium text-muted-foreground;
}

.memo-content {
  @apply space-y-3;
}

.content-title {
  @apply text-sm font-medium text-foreground;
}

.content-text {
  @apply p-4 bg-muted/30 rounded-lg text-sm leading-relaxed;
  @apply max-h-64 overflow-y-auto;
}

.memo-tags {
  @apply space-y-3;
}

.tags-title {
  @apply text-sm font-medium text-foreground;
}

.tags-list {
  @apply flex flex-wrap gap-2;
}

/* Animation for chevron rotation */
.rotate-180 {
  @apply transform rotate-180 transition-transform duration-200;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .filter-controls {
    @apply flex-col gap-3 items-stretch;
  }
  
  .quick-actions {
    @apply justify-center;
  }
  
  .memo-meta {
    @apply grid-cols-1;
  }
}
</style>