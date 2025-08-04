<template>
  <div class="expense-pagination">
    <!-- Mobile Pagination (Simplified) -->
    <div class="mobile-pagination md:hidden">
      <div class="flex justify-between items-center p-4 border-t">
        <div class="pagination-info text-sm text-muted-foreground">
          {{ paginationSummary }}
        </div>
        <div class="pagination-controls flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1"
            @click="goToPrevious"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
          </Button>
          <span class="text-sm font-medium px-2">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages"
            @click="goToNext"
          >
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Desktop Pagination (Full Featured) -->
    <div class="desktop-pagination hidden md:flex justify-between items-center p-4 border-t bg-background">
      <!-- Left: Items per page and info -->
      <div class="pagination-left flex items-center gap-6">
        <!-- Page Size Selector -->
        <div class="page-size-selector flex items-center gap-2">
          <Label class="text-sm whitespace-nowrap">{{ $t('expense.pagination.itemsPerPage') }}</Label>
          <Select
            :model-value="String(pageSize)"
            @update:model-value="handlePageSizeChange"
          >
            <SelectTrigger class="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="size in pageSizeOptions"
                :key="size"
                :value="String(size)"
              >
                {{ size }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Pagination Info -->
        <div class="pagination-info text-sm text-muted-foreground">
          {{ paginationSummary }}
        </div>
      </div>

      <!-- Right: Navigation controls -->
      <div class="pagination-right flex items-center gap-4">
        <!-- Jump to page (when many pages) -->
        <div v-if="totalPages > 10" class="jump-to-page flex items-center gap-2">
          <Label class="text-sm whitespace-nowrap">{{ $t('expense.pagination.goToPage') }}</Label>
          <Input
            v-model="jumpToPageInput"
            type="number"
            :min="1"
            :max="totalPages"
            class="w-16 text-center"
            @keydown.enter="handleJumpToPage"
            @blur="handleJumpToPage"
          />
        </div>

        <!-- Page Navigation -->
        <div class="page-navigation flex items-center gap-1">
          <!-- First page -->
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1"
            class="hidden sm:inline-flex"
            @click="goToFirst"
          >
            <Icon name="lucide:chevrons-left" class="w-4 h-4" />
          </Button>

          <!-- Previous page -->
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1"
            @click="goToPrevious"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
            <span class="hidden sm:inline ml-1">{{ $t('expense.pagination.previous') }}</span>
          </Button>

          <!-- Page numbers -->
          <div class="page-numbers flex items-center gap-1">
            <template v-for="page in visiblePageNumbers" :key="page">
              <Button
                v-if="typeof page === 'number'"
                :variant="page === currentPage ? 'default' : 'outline'"
                size="sm"
                class="min-w-[2.5rem]"
                @click="goToPage(page)"
              >
                {{ page }}
              </Button>
              <span v-else class="px-2 text-muted-foreground">{{ page }}</span>
            </template>
          </div>

          <!-- Next page -->
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages"
            @click="goToNext"
          >
            <span class="hidden sm:inline mr-1">{{ $t('expense.pagination.next') }}</span>
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </Button>

          <!-- Last page -->
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages"
            class="hidden sm:inline-flex"
            @click="goToLast"
          >
            <Icon name="lucide:chevrons-right" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Pagination Summary Bar (Optional) -->
    <div v-if="showSummaryBar" class="summary-bar flex justify-center items-center p-2 bg-muted/50 text-xs text-muted-foreground border-t">
      <div class="flex items-center gap-4">
        <span>{{ $t('expense.pagination.totalItems', { count: totalItems }) }}</span>
        <Separator orientation="vertical" class="h-4" />
        <span>{{ $t('expense.pagination.totalPages', { count: totalPages }) }}</span>
        <Separator orientation="vertical" class="h-4" />
        <span>{{ $t('expense.pagination.currentPage', { current: currentPage, total: totalPages }) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  showSummaryBar?: boolean
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 20, 50, 100],
  showSummaryBar: false,
  maxVisiblePages: 7
})

const emit = defineEmits<{
  'pageChange': [number]
  'pageSizeChange': [number]
}>()

// Local state for jump to page input
const jumpToPageInput = ref(props.currentPage)

// Watch for external page changes to update jump input
watch(() => props.currentPage, (newPage) => {
  jumpToPageInput.value = newPage
})

// Computed properties
const paginationSummary = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize + 1
  const end = Math.min(props.currentPage * props.pageSize, props.totalItems)
  
  if (props.totalItems === 0) {
    return '結果がありません'
  }
  
  return `${start.toLocaleString()}-${end.toLocaleString()} / ${props.totalItems.toLocaleString()} 件`
})

const visiblePageNumbers = computed(() => {
  const pages: (number | string)[] = []
  const { currentPage, totalPages, maxVisiblePages } = props
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Show condensed pagination with ellipsis
    const halfMax = Math.floor(maxVisiblePages / 2)
    
    if (currentPage <= halfMax + 1) {
      // Current page is near beginning
      for (let i = 1; i <= maxVisiblePages - 2; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - halfMax) {
      // Current page is near end
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - (maxVisiblePages - 3); i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Current page is in middle
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - halfMax + 1; i <= currentPage + halfMax - 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    }
  }
  
  return pages
})

// Navigation methods
const goToFirst = () => {
  if (props.currentPage > 1) {
    emit('pageChange', 1)
  }
}

const goToPrevious = () => {
  if (props.currentPage > 1) {
    emit('pageChange', props.currentPage - 1)
  }
}

const goToNext = () => {
  if (props.currentPage < props.totalPages) {
    emit('pageChange', props.currentPage + 1)
  }
}

const goToLast = () => {
  if (props.currentPage < props.totalPages) {
    emit('pageChange', props.totalPages)
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('pageChange', page)
  }
}

const handleJumpToPage = () => {
  const page = Number(jumpToPageInput.value)
  if (page >= 1 && page <= props.totalPages) {
    goToPage(page)
  } else {
    // Reset to current page if invalid
    jumpToPageInput.value = props.currentPage
  }
}

const handlePageSizeChange = (newSize: unknown) => {
  if (newSize !== null && newSize !== undefined) {
    const size = Number(newSize)
    if (!isNaN(size) && size > 0) {
      emit('pageSizeChange', size)
    }
  }
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (event.target === document.body) {
    switch (event.key) {
      case 'ArrowLeft':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          goToPrevious()
        }
        break
      case 'ArrowRight':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          goToNext()
        }
        break
      case 'Home':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          goToFirst()
        }
        break
      case 'End':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          goToLast()
        }
        break
      default:
        // No action needed for other keys
        break
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.expense-pagination {
  @apply bg-background;
}

/* Ensure page number buttons are consistently sized */
.page-numbers .btn {
  @apply font-mono;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .desktop-pagination {
    @apply hidden;
  }
  
  .mobile-pagination {
    @apply block;
  }
}

@media (min-width: 769px) {
  .desktop-pagination {
    @apply flex;
  }
  
  .mobile-pagination {
    @apply hidden;
  }
}

/* Accessibility improvements */
.page-navigation button:focus {
  @apply ring-2 ring-offset-2 ring-primary;
}

.page-numbers button[aria-current="page"] {
  @apply bg-primary text-primary-foreground;
}
</style>