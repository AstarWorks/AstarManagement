<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface Props {
  page: number
  pageSize: number
  total: number
  pageSizeOptions?: number[]
  showPageSize?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 25, 50, 100],
  showPageSize: true,
  disabled: false
})

const emit = defineEmits<{
  pageChange: [page: number]
  pageSizeChange: [size: number]
}>()

// Computed values
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
const startItem = computed(() => (props.page - 1) * props.pageSize + 1)
const endItem = computed(() => Math.min(props.page * props.pageSize, props.total))

// Navigation handlers
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== props.page) {
    emit('pageChange', page)
  }
}

const handlePageSizeChange = (value: string) => {
  const newSize = parseInt(value)
  emit('pageSizeChange', newSize)
  // Reset to page 1 when page size changes
  if (props.page !== 1) {
    emit('pageChange', 1)
  }
}

// Page range calculation for display
const pageRange = computed(() => {
  const range: number[] = []
  const delta = 2 // Show 2 pages on each side of current page
  
  for (let i = 1; i <= totalPages.value; i++) {
    if (
      i === 1 || // Always show first page
      i === totalPages.value || // Always show last page
      (i >= props.page - delta && i <= props.page + delta) // Pages around current
    ) {
      range.push(i)
    }
  }
  
  // Add ellipsis markers
  const withEllipsis: (number | string)[] = []
  let prev = 0
  
  for (const page of range) {
    if (prev && page - prev > 1) {
      withEllipsis.push('...')
    }
    withEllipsis.push(page)
    prev = page
  }
  
  return withEllipsis
})
</script>

<template>
  <div class="flex flex-col gap-4 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
    <!-- Results info -->
    <div class="text-sm text-muted-foreground">
      <span v-if="total > 0">
        Showing {{ startItem }} to {{ endItem }} of {{ total }} results
      </span>
      <span v-else>No results</span>
    </div>

    <!-- Pagination controls -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <!-- Page size selector -->
      <div v-if="showPageSize" class="flex items-center gap-2">
        <label class="text-sm text-muted-foreground">Items per page:</label>
        <Select
          :model-value="String(pageSize)"
          :disabled="disabled"
          @update:model-value="handlePageSizeChange"
        >
          <SelectTrigger class="h-8 w-[70px]">
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

      <!-- Page navigation -->
      <div class="flex items-center gap-1">
        <!-- Previous button -->
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="disabled || page === 1"
          @click="goToPage(page - 1)"
        >
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
          <span class="sr-only">Previous page</span>
        </Button>

        <!-- Page numbers -->
        <div class="flex items-center gap-1">
          <template v-for="(pageNum, index) in pageRange" :key="index">
            <span
              v-if="pageNum === '...'"
              class="px-2 text-sm text-muted-foreground"
            >
              …
            </span>
            <Button
              v-else
              variant="outline"
              size="sm"
              class="h-8 w-8 p-0"
              :disabled="disabled"
              :data-active="pageNum === page"
              @click="goToPage(pageNum as number)"
            >
              {{ pageNum }}
            </Button>
          </template>
        </div>

        <!-- Next button -->
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="disabled || page === totalPages"
          @click="goToPage(page + 1)"
        >
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
          <span class="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Active page styling */
[data-active="true"] {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}
</style>