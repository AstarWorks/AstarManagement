<template>
  <div class="generation-history">
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center gap-2">
            <Clock class="h-5 w-5" />
            Generation History
            <Badge v-if="filteredHistory.length > 0" variant="outline">
              {{ filteredHistory.length }} documents
            </Badge>
          </CardTitle>
          
          <div class="history-controls">
            <div class="flex items-center gap-2">
              <!-- Search -->
              <div class="search-box">
                <Search class="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  placeholder="Search history..."
                  class="pl-9 w-64"
                />
              </div>
              
              <!-- Filter -->
              <Select v-model="statusFilter">
                <SelectTrigger class="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <!-- Date Range -->
              <Select v-model="dateFilter">
                <SelectTrigger class="w-32">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              
              <!-- Export -->
              <Button @click="exportHistory" variant="outline" size="sm">
                <Download class="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <!-- Stats Summary -->
        <div class="history-stats">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg mb-6">
            <div class="stat">
              <div class="text-2xl font-bold text-green-600">{{ historyStats.completed }}</div>
              <div class="text-xs text-muted-foreground">Completed</div>
            </div>
            <div class="stat">
              <div class="text-2xl font-bold text-red-600">{{ historyStats.failed }}</div>
              <div class="text-xs text-muted-foreground">Failed</div>
            </div>
            <div class="stat">
              <div class="text-2xl font-bold text-blue-600">{{ historyStats.todayCount }}</div>
              <div class="text-xs text-muted-foreground">Today</div>
            </div>
            <div class="stat">
              <div class="text-2xl font-bold text-purple-600">{{ historyStats.formats.pdf || 0 }}</div>
              <div class="text-xs text-muted-foreground">PDF Documents</div>
            </div>
          </div>
        </div>

        <!-- History List -->
        <div class="history-list">
          <div v-if="filteredHistory.length === 0" class="empty-state">
            <div class="text-center py-12">
              <Clock class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 class="text-lg font-medium mb-2">
                {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'No matches found' 
                  : 'No generation history' }}
              </h3>
              <p class="text-muted-foreground mb-4">
                {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'Generated documents will appear here after creation' }}
              </p>
              <Button 
                v-if="searchQuery || statusFilter !== 'all' || dateFilter !== 'all'"
                @click="clearFilters" 
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="item in paginatedHistory"
              :key="item.id"
              class="history-item"
            >
              <Card class="history-card hover:shadow-md transition-shadow">
                <CardContent class="p-4">
                  <div class="flex items-start gap-4">
                    <!-- Document Icon -->
                    <div class="document-icon mt-1">
                      <FileText 
                        v-if="item.format === 'pdf'"
                        class="h-8 w-8 text-red-500" 
                      />
                      <FileText 
                        v-else-if="item.format === 'docx'"
                        class="h-8 w-8 text-blue-500" 
                      />
                      <FileText 
                        v-else-if="item.format === 'html'"
                        class="h-8 w-8 text-green-500" 
                      />
                      <FileText 
                        v-else
                        class="h-8 w-8 text-gray-500" 
                      />
                    </div>
                    
                    <!-- Document Details -->
                    <div class="flex-1 min-w-0">
                      <div class="document-header">
                        <div class="flex items-center gap-2 mb-1">
                          <h4 class="font-medium text-sm truncate">
                            {{ item.templateName }}
                          </h4>
                          <Badge :variant="getStatusVariant(item.status)">
                            {{ item.status }}
                          </Badge>
                          <Badge variant="outline" class="text-xs">
                            {{ item.format.toUpperCase() }}
                          </Badge>
                        </div>
                        
                        <div class="text-xs text-muted-foreground mb-2">
                          <span class="font-medium">{{ item.matterTitle }}</span>
                          <span class="mx-2">•</span>
                          <span>{{ formatDateTime(item.createdAt) }}</span>
                        </div>
                      </div>
                      
                      <!-- Error Message -->
                      <Alert 
                        v-if="item.status === 'failed' && item.error" 
                        variant="destructive" 
                        class="mt-2"
                      >
                        <AlertTriangle class="h-4 w-4" />
                        <AlertTitle>Generation Failed</AlertTitle>
                        <AlertDescription class="text-xs">
                          {{ item.error }}
                        </AlertDescription>
                      </Alert>
                      
                      <!-- Metadata -->
                      <div class="document-metadata mt-2">
                        <div class="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            <Calendar class="h-3 w-3 inline mr-1" />
                            {{ formatRelativeTime(item.createdAt) }}
                          </span>
                          <span v-if="item.downloadUrl">
                            <Download class="h-3 w-3 inline mr-1" />
                            Available for download
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="document-actions">
                      <div class="flex flex-col gap-2">
                        <!-- Primary Actions -->
                        <Button
                          v-if="item.status === 'completed' && item.downloadUrl"
                          @click="downloadDocument(item.id)"
                          size="sm"
                          variant="outline"
                          class="text-xs"
                        >
                          <Download class="h-3 w-3 mr-2" />
                          Download
                        </Button>
                        
                        <Button
                          v-if="item.status === 'completed'"
                          @click="viewDocument(item.id)"
                          size="sm"
                          variant="outline"
                          class="text-xs"
                        >
                          <Eye class="h-3 w-3 mr-2" />
                          View
                        </Button>
                        
                        <Button
                          v-if="item.status === 'failed'"
                          @click="regenerateDocument(item.id)"
                          size="sm"
                          variant="outline"
                          class="text-xs"
                        >
                          <RotateCcw class="h-3 w-3 mr-2" />
                          Retry
                        </Button>
                        
                        <!-- More Actions -->
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" class="text-xs">
                              <MoreHorizontal class="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem @click="copyShareLink(item.id)">
                              <Share class="h-3 w-3 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem @click="duplicateGeneration(item.id)">
                              <Copy class="h-3 w-3 mr-2" />
                              Generate Again
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              @click="deleteHistoryItem(item.id)"
                              class="text-red-600"
                            >
                              <Trash2 class="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="filteredHistory.length > itemsPerPage" class="pagination">
          <div class="flex items-center justify-between mt-6">
            <div class="text-sm text-muted-foreground">
              Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to 
              {{ Math.min(currentPage * itemsPerPage, filteredHistory.length) }} of 
              {{ filteredHistory.length }} documents
            </div>
            
            <div class="flex items-center gap-2">
              <Button
                @click="currentPage--"
                :disabled="currentPage === 1"
                size="sm"
                variant="outline"
              >
                <ChevronLeft class="h-4 w-4" />
                Previous
              </Button>
              
              <div class="flex items-center gap-1">
                <Button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="currentPage = page"
                  :variant="page === currentPage ? 'default' : 'outline'"
                  size="sm"
                  class="w-10"
                >
                  {{ page }}
                </Button>
              </div>
              
              <Button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                size="sm"
                variant="outline"
              >
                Next
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Clock, 
  Search, 
  Download, 
  FileText, 
  Eye, 
  RotateCcw,
  MoreHorizontal,
  Share,
  Copy,
  Trash2,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

// Utils
import { formatDateTime } from '~/utils/helpers'
import { formatRelativeTime } from '~/utils/formatters'

// Types
interface GenerationHistory {
  id: string
  templateName: string
  matterTitle: string
  format: string
  status: 'completed' | 'failed'
  createdAt: Date
  downloadUrl?: string
  error?: string
}

// Props
interface Props {
  history: GenerationHistory[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  download: [documentId: string]
  regenerate: [documentId: string]
  view: [documentId: string]
  delete: [documentId: string]
}>()

// State
const searchQuery = ref('')
const statusFilter = ref('all')
const dateFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10

// Computed
const filteredHistory = computed(() => {
  let filtered = [...props.history]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.templateName.toLowerCase().includes(query) ||
      item.matterTitle.toLowerCase().includes(query)
    )
  }
  
  // Status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(item => item.status === statusFilter.value)
  }
  
  // Date filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.createdAt)
      
      switch (dateFilter.value) {
        case 'today':
          return itemDate >= today
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return itemDate >= weekAgo
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
          return itemDate >= monthAgo
        default:
          return true
      }
    })
  }
  
  // Sort by date (newest first)
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredHistory.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredHistory.value.length / itemsPerPage))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const historyStats = computed(() => {
  const stats = {
    completed: 0,
    failed: 0,
    todayCount: 0,
    formats: {} as Record<string, number>
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  props.history.forEach(item => {
    // Status counts
    if (item.status === 'completed') stats.completed++
    if (item.status === 'failed') stats.failed++
    
    // Today count
    const itemDate = new Date(item.createdAt)
    if (itemDate >= today) stats.todayCount++
    
    // Format counts
    stats.formats[item.format] = (stats.formats[item.format] || 0) + 1
  })
  
  return stats
})

// Methods
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'default' // success variant doesn't exist
    case 'failed': return 'destructive'
    default: return 'outline'
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateFilter.value = 'all'
  currentPage.value = 1
}

const downloadDocument = (documentId: string) => {
  emit('download', documentId)
}

const viewDocument = (documentId: string) => {
  emit('view', documentId)
}

const regenerateDocument = (documentId: string) => {
  emit('regenerate', documentId)
}

const deleteHistoryItem = (documentId: string) => {
  if (confirm('Are you sure you want to delete this history item?')) {
    emit('delete', documentId)
  }
}

const copyShareLink = async (documentId: string) => {
  const url = `${window.location.origin}/documents/generated/${documentId}`
  try {
    await navigator.clipboard.writeText(url)
    // Show toast notification
  } catch (error) {
    console.error('Failed to copy link:', error)
  }
}

const duplicateGeneration = (documentId: string) => {
  // Find the history item and regenerate with same parameters
  const item = props.history.find(h => h.id === documentId)
  if (item) {
    regenerateDocument(documentId)
  }
}

const exportHistory = () => {
  // Export history to CSV
  const csvData = filteredHistory.value.map(item => ({
    Template: item.templateName,
    Matter: item.matterTitle,
    Format: item.format,
    Status: item.status,
    'Created At': formatDateTime(item.createdAt),
    Error: item.error || ''
  }))
  
  const csv = [
    Object.keys(csvData[0]).join(','),
    ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `generation-history-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Watchers
watch([searchQuery, statusFilter, dateFilter], () => {
  currentPage.value = 1
})
</script>

<style scoped>
.generation-history {
  @apply w-full;
}

.history-controls .search-box {
  @apply relative;
}

.history-stats .stat {
  @apply text-center;
}

.history-list {
  @apply space-y-3;
}

.history-item {
  @apply relative;
}

.history-card {
  @apply transition-all duration-200;
}

.history-card:hover {
  @apply shadow-md;
}

.document-icon {
  @apply flex-shrink-0;
}

.document-header {
  @apply space-y-1;
}

.document-metadata {
  @apply space-y-1;
}

.document-actions {
  @apply flex-shrink-0;
}

.empty-state {
  @apply border-2 border-dashed border-muted-foreground/25 rounded-lg;
}

.pagination {
  @apply border-t pt-4;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .history-controls {
    @apply flex-col gap-2;
  }
  
  .history-controls .flex {
    @apply flex-col gap-2;
  }
  
  .search-box {
    @apply w-full;
  }
  
  .search-box input {
    @apply w-full;
  }
  
  .history-stats .grid {
    @apply grid-cols-2;
  }
  
  .history-card .flex {
    @apply flex-col gap-3;
  }
  
  .document-actions {
    @apply w-full;
  }
  
  .document-actions .flex {
    @apply flex-row justify-end;
  }
  
  .pagination .flex {
    @apply flex-col gap-2;
  }
}

/* Print styles */
@media print {
  .history-controls,
  .document-actions,
  .pagination {
    @apply hidden;
  }
}
</style>