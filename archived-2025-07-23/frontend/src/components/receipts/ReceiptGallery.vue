<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  FileImage, 
  Search, 
  Filter, 
  X, 
  Eye, 
  Trash2, 
  Download, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Receipt as ReceiptIcon
} from 'lucide-vue-next'
import { useReceipts } from '~/composables/useReceipts'
import { formatFileSize } from '~/utils/imageCompression'
import type { ReceiptFilters } from '~/types/receipt'
import type { Receipt, OcrStatus } from '~/schemas/receipt'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/alert-dialog'

/**
 * Receipt Gallery Component
 * 
 * Displays receipts in an organized grid with filtering, search, and management capabilities.
 * Supports virtual scrolling for large collections and responsive design for mobile.
 */

interface Props {
  expenseId?: string
  showFilters?: boolean
  selectable?: boolean
  maxItems?: number
  sortBy?: 'createdAt' | 'filename' | 'extractedAmount' | 'ocrStatus'
  sortOrder?: 'asc' | 'desc'
}

interface Emits {
  select: [receipt: Receipt]
  delete: [receiptId: string]
  view: [receipt: Receipt]
  updated: []
}

const props = withDefaults(defineProps<Props>(), {
  showFilters: true,
  selectable: false,
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

const emit = defineEmits<Emits>()

// Composable
const {
  receipts,
  filteredReceipts,
  loading,
  error,
  stats,
  filters,
  hasReceipts,
  hasFilters,
  fetchReceipts,
  deleteReceipt,
  updateFilters,
  clearFilters
} = useReceipts({
  expenseId: props.expenseId,
  autoLoad: true
})

// Component state
const selectedReceipt = ref<Receipt | null>(null)
const showViewer = ref(false)
const showDeleteDialog = ref(false)
const receiptToDelete = ref<Receipt | null>(null)
const searchInput = ref('')
const localFilters = ref<ReceiptFilters>({
  search: '',
  ocrStatus: undefined,
  dateFrom: undefined,
  dateTo: undefined
})

// Computed properties
const displayReceipts = computed(() => {
  let result = filteredReceipts.value

  // Apply local search if different from global filter
  if (searchInput.value && searchInput.value !== filters.value.search) {
    const search = searchInput.value.toLowerCase()
    result = result.filter(r => 
      r.originalFilename.toLowerCase().includes(search) ||
      r.extractedVendor?.toLowerCase().includes(search) ||
      r.ocrText?.toLowerCase().includes(search)
    )
  }

  // Apply sorting
  result.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (props.sortBy) {
      case 'filename':
        aValue = a.originalFilename.toLowerCase()
        bValue = b.originalFilename.toLowerCase()
        break
      case 'extractedAmount':
        aValue = a.extractedAmount || 0
        bValue = b.extractedAmount || 0
        break
      case 'ocrStatus':
        aValue = a.ocrStatus
        bValue = b.ocrStatus
        break
      default:
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
    }

    if (props.sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }
  })

  // Apply max items limit
  if (props.maxItems) {
    result = result.slice(0, props.maxItems)
  }

  return result
})

const isEmpty = computed(() => !loading.value && displayReceipts.value.length === 0)
const isFiltered = computed(() => hasFilters.value || searchInput.value)

// OCR status badge variants
const getOcrStatusVariant = (status: OcrStatus) => {
  switch (status) {
    case 'COMPLETED': return 'default'
    case 'PROCESSING': return 'secondary' 
    case 'FAILED': return 'destructive'
    default: return 'outline'
  }
}

// OCR status icons
const getOcrStatusIcon = (status: OcrStatus) => {
  switch (status) {
    case 'COMPLETED': return CheckCircle
    case 'PROCESSING': return Loader2
    case 'FAILED': return AlertCircle
    default: return Clock
  }
}

// Format currency amount
const formatAmount = (amount?: number): string => {
  if (!amount) return ''
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}

// Format date
const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// Handle receipt selection
const handleReceiptClick = (receipt: Receipt) => {
  if (props.selectable) {
    emit('select', receipt)
  } else {
    handleViewReceipt(receipt)
  }
}

// View receipt in modal
const handleViewReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showViewer.value = true
  emit('view', receipt)
}

// Download receipt
const handleDownloadReceipt = async (receipt: Receipt) => {
  try {
    const response = await fetch(receipt.fullSizeUrl)
    const blob = await response.blob()
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = receipt.originalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download receipt:', error)
  }
}

// Confirm delete receipt
const confirmDelete = (receipt: Receipt) => {
  receiptToDelete.value = receipt
  showDeleteDialog.value = true
}

// Handle delete receipt
const handleDeleteReceipt = async () => {
  if (!receiptToDelete.value) return

  const success = await deleteReceipt(receiptToDelete.value.id)
  if (success) {
    emit('delete', receiptToDelete.value.id)
    emit('updated')
  }

  showDeleteDialog.value = false
  receiptToDelete.value = null
}

// Apply search filter
const applySearch = () => {
  updateFilters({ search: searchInput.value })
}

// Apply filters
const applyFilters = () => {
  updateFilters(localFilters.value)
}

// Clear all filters
const handleClearFilters = () => {
  searchInput.value = ''
  localFilters.value = {
    search: '',
    ocrStatus: undefined,
    dateFrom: undefined,
    dateTo: undefined
  }
  clearFilters()
}

// Refresh receipts
const handleRefresh = async () => {
  await fetchReceipts(props.expenseId)
  emit('updated')
}

// Watch for search input changes (debounced)
watch(searchInput, () => {
  // Simple debouncing
  setTimeout(() => {
    if (searchInput.value !== filters.value.search) {
      applySearch()
    }
  }, 300)
})

// Initialize
onMounted(() => {
  if (!hasReceipts.value) {
    fetchReceipts(props.expenseId)
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header and Filters -->
    <Card v-if="showFilters">
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ReceiptIcon class="w-5 h-5" />
            Receipt Gallery
            <Badge v-if="stats.total > 0" variant="secondary">
              {{ stats.total }}
            </Badge>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            @click="handleRefresh"
            :disabled="loading"
          >
            <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent class="space-y-4">
        <!-- Search -->
        <div class="flex gap-2">
          <div class="flex-1">
            <Label for="search" class="sr-only">Search receipts</Label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                v-model="searchInput"
                placeholder="Search by filename, vendor, or content..."
                class="pl-10"
              />
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            @click="handleClearFilters"
            :disabled="!isFiltered"
            title="Clear filters"
          >
            <X class="w-4 h-4" />
          </Button>
        </div>

        <!-- Filters Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- OCR Status Filter -->
          <div>
            <Label for="ocr-status">OCR Status</Label>
            <Select v-model="localFilters.ocrStatus" @update:model-value="applyFilters">
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Date From -->
          <div>
            <Label for="date-from">Date From</Label>
            <Input
              id="date-from"
              v-model="localFilters.dateFrom"
              type="date"
              @change="applyFilters"
            />
          </div>

          <!-- Date To -->
          <div>
            <Label for="date-to">Date To</Label>
            <Input
              id="date-to"
              v-model="localFilters.dateTo"
              type="date"
              @change="applyFilters"
            />
          </div>
        </div>

        <!-- Stats Summary -->
        <div v-if="stats.total > 0" class="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Total: {{ stats.total }}</span>
          <span>Completed: {{ stats.completed }}</span>
          <span>Processing: {{ stats.processing }}</span>
          <span>Failed: {{ stats.failed }}</span>
          <span>Total Size: {{ formatFileSize(stats.totalFileSize) }}</span>
        </div>
      </CardContent>
    </Card>

    <!-- Error State -->
    <Card v-if="error" class="border-destructive">
      <CardContent class="pt-6">
        <div class="flex items-center gap-2 text-destructive">
          <AlertCircle class="w-5 h-5" />
          <span>{{ error }}</span>
        </div>
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div v-for="i in 6" :key="i" class="space-y-2">
        <Skeleton class="aspect-square w-full rounded-lg" />
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-3 w-1/2" />
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="isEmpty" class="text-center py-12">
      <FileImage class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 class="text-lg font-medium mb-2">
        {{ isFiltered ? 'No receipts found' : 'No receipts yet' }}
      </h3>
      <p class="text-muted-foreground mb-4">
        {{ isFiltered 
          ? 'Try adjusting your search or filters' 
          : 'Upload your first receipt to get started'
        }}
      </p>
      <Button v-if="isFiltered" variant="outline" @click="handleClearFilters">
        Clear Filters
      </Button>
    </div>
    
    <!-- Receipt Grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div
        v-for="receipt in displayReceipts"
        :key="receipt.id"
        class="group relative aspect-square cursor-pointer rounded-lg border-2 border-transparent hover:border-primary transition-all duration-200 overflow-hidden"
        @click="handleReceiptClick(receipt)"
      >
        <!-- Receipt Image -->
        <img
          :src="receipt.thumbnailUrl"
          :alt="receipt.originalFilename"
          class="w-full h-full object-cover bg-muted"
          loading="lazy"
          @error="($event.target as HTMLImageElement).src = '/placeholder-receipt.svg'"
        />
        
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
          <!-- Quick Actions -->
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="icon"
              variant="secondary"
              class="h-6 w-6 bg-black/50 border-white/20 text-white hover:bg-black/70"
              @click.stop="handleViewReceipt(receipt)"
              title="View receipt"
            >
              <Eye class="h-3 w-3" />
            </Button>
            
            <Button
              size="icon"
              variant="secondary"
              class="h-6 w-6 bg-black/50 border-white/20 text-white hover:bg-black/70"
              @click.stop="handleDownloadReceipt(receipt)"
              title="Download receipt"
            >
              <Download class="h-3 w-3" />
            </Button>
            
            <Button
              size="icon"
              variant="destructive"
              class="h-6 w-6"
              @click.stop="confirmDelete(receipt)"
              title="Delete receipt"
            >
              <Trash2 class="h-3 w-3" />
            </Button>
          </div>
          
          <!-- Receipt Info -->
          <div class="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <p class="text-xs font-medium truncate mb-1">
              {{ receipt.originalFilename }}
            </p>
            
            <div class="flex items-center justify-between">
              <Badge 
                :variant="getOcrStatusVariant(receipt.ocrStatus)" 
                class="text-xs h-5"
              >
                <component 
                  :is="getOcrStatusIcon(receipt.ocrStatus)" 
                  class="w-3 h-3 mr-1"
                  :class="{ 'animate-spin': receipt.ocrStatus === 'PROCESSING' }"
                />
                {{ receipt.ocrStatus }}
              </Badge>
              
              <span v-if="receipt.extractedAmount" class="text-xs font-medium">
                {{ formatAmount(receipt.extractedAmount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- OCR Status Indicator -->
        <div class="absolute top-2 left-2">
          <Badge 
            :variant="getOcrStatusVariant(receipt.ocrStatus)"
            class="text-xs h-5"
          >
            <component 
              :is="getOcrStatusIcon(receipt.ocrStatus)" 
              class="w-3 h-3"
              :class="{ 'animate-spin': receipt.ocrStatus === 'PROCESSING' }"
            />
          </Badge>
        </div>
      </div>
    </div>

    <!-- Receipt Viewer Modal -->
    <Dialog v-model:open="showViewer">
      <DialogContent v-if="selectedReceipt" class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{{ selectedReceipt.originalFilename }}</DialogTitle>
          <DialogDescription>
            Uploaded {{ formatDate(selectedReceipt.createdAt) }} • 
            {{ formatFileSize(selectedReceipt.fileSize) }}
          </DialogDescription>
        </DialogHeader>
        
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Image -->
          <div class="space-y-4">
            <img
              :src="selectedReceipt.fullSizeUrl"
              :alt="selectedReceipt.originalFilename"
              class="w-full rounded-lg border"
            />
          </div>
          
          <!-- Metadata -->
          <div class="space-y-4">
            <div>
              <h4 class="font-medium mb-2">OCR Status</h4>
              <Badge :variant="getOcrStatusVariant(selectedReceipt.ocrStatus)">
                <component 
                  :is="getOcrStatusIcon(selectedReceipt.ocrStatus)" 
                  class="w-4 h-4 mr-2"
                  :class="{ 'animate-spin': selectedReceipt.ocrStatus === 'PROCESSING' }"
                />
                {{ selectedReceipt.ocrStatus }}
              </Badge>
            </div>
            
            <div v-if="selectedReceipt.extractedAmount">
              <h4 class="font-medium mb-2">Extracted Amount</h4>
              <p class="text-lg font-mono">{{ formatAmount(selectedReceipt.extractedAmount) }}</p>
            </div>
            
            <div v-if="selectedReceipt.extractedVendor">
              <h4 class="font-medium mb-2">Vendor</h4>
              <p>{{ selectedReceipt.extractedVendor }}</p>
            </div>
            
            <div v-if="selectedReceipt.extractedDate">
              <h4 class="font-medium mb-2">Date</h4>
              <p>{{ new Date(selectedReceipt.extractedDate).toLocaleDateString() }}</p>
            </div>
            
            <div v-if="selectedReceipt.ocrText">
              <h4 class="font-medium mb-2">OCR Text</h4>
              <div class="max-h-40 overflow-y-auto text-sm bg-muted p-3 rounded">
                {{ selectedReceipt.ocrText }}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="handleDownloadReceipt(selectedReceipt)">
            <Download class="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button @click="showViewer = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{{ receiptToDelete?.originalFilename }}"? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="handleDeleteReceipt">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
/* Smooth hover transitions */
.group:hover img {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Loading state animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border-transparent {
    border-color: currentColor;
    border-width: 1px;
  }
  
  .hover\:border-primary:hover {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .transition-all,
  .transition-colors,
  .transition-opacity {
    transition: none;
  }
  
  .group:hover img {
    transform: none;
  }
  
  .animate-spin {
    animation: none;
  }
}
</style>