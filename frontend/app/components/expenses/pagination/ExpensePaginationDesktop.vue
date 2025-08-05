<template>
  <div class="desktop-pagination hidden md:flex justify-between items-center p-4 border-t bg-background">
    <!-- Left: Items per page and info -->
    <div class="pagination-left flex items-center gap-6">
      <PaginationPageSize
        :page-size="currentPageSize"
        :page-size-options="pageSizeOptions"
        @update:page-size="updatePageSize"
      />
      <PaginationInfo
        :start="paginationInfo.start"
        :end="paginationInfo.end"
        :total="paginationInfo.total"
        :is-empty="paginationInfo.isEmpty"
      />
    </div>

    <!-- Right: Navigation controls -->
    <div class="pagination-right flex items-center gap-4">
      <!-- Jump to page (when many pages) -->
      <PaginationJumpTo
        v-if="pageCount > 10"
        v-model="jumpToPageInput"
        :max-page="pageCount"
        @jump="handleJumpToPage"
      />

      <!-- Page Navigation -->
      <PaginationNav
        :current-page="currentPage"
        :visible-page-numbers="visiblePageNumbers"
        :is-first-page="isFirstPage"
        :is-last-page="isLastPage"
        show-first-last
        show-labels
        @first="goToFirst"
        @prev="prev"
        @next="next"
        @last="goToLast"
        @go-to-page="goToPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PaginationInfo,
  PaginationNav,
  PaginationPageSize,
  PaginationJumpTo
} from '~/components/ui/pagination'
import { useExpensePagination } from '~/composables/usePagination'

interface Props {
  total: number
  page?: number
  pageSize?: number
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  page: 1,
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 50, 100]
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()

const {
  currentPage,
  currentPageSize,
  pageCount,
  isFirstPage,
  isLastPage,
  jumpToPageInput,
  visiblePageNumbers,
  paginationInfo,
  prev,
  next,
  goToFirst,
  goToLast,
  goToPage,
  handleJumpToPage,
  updatePageSize,
  pageSizeOptions
} = useExpensePagination({
  page: props.page,
  pageSize: props.pageSize,
  pageSizeOptions: props.pageSizeOptions,
  total: props.total,
  onPageChange: (page) => emit('update:page', page),
  onPageSizeChange: (pageSize) => emit('update:pageSize', pageSize)
})
</script>