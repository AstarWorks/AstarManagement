<template>
  <ExpensePaginationContainer
    :total="totalItems"
    :page="currentPage"
    :page-size="pageSize"
    :page-size-options="pageSizeOptions"
    :show-summary-bar="showSummaryBar"
    @update:page="handlePageChange"
    @update:page-size="handlePageSizeChange"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import ExpensePaginationContainer from './pagination/ExpensePaginationContainer.vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  showSummaryBar?: boolean
}

withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 20, 50, 100],
  showSummaryBar: false
})

const emit = defineEmits<{
  'pageChange': [number]
  'pageSizeChange': [number]
}>()

// Navigation handlers
const handlePageChange = (page: number) => {
  emit('pageChange', page)
}

const handlePageSizeChange = (pageSize: number) => {
  emit('pageSizeChange', pageSize)
}

// Keyboard navigation support
const handleKeydown = (event: KeyboardEvent) => {
  if (event.target === document.body) {
    switch (event.key) {
      case 'ArrowLeft':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          // Previous page logic is handled internally by the container
        }
        break
      case 'ArrowRight':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          // Next page logic is handled internally by the container
        }
        break
      default:
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