<template>
  <ExpensePaginationContainer
    :total="totalItems"
    :page="currentPage"
    :page-size="pageSize"
    :page-size-options="pageSizeOptions"
    :show-summary-bar="showSummaryBar"
    @update:page="$emit('update:page', $event)"
    @update:page-size="$emit('update:pageSize', $event)"
  />
</template>

<script setup lang="ts">
/**
 * ExpensePagination - 経費一覧のページネーションコンポーネント
 * ExpensePaginationContainerへのシンプルなラッパーとして機能
 * 
 * @component
 * @example
 * <ExpensePagination
 *   :current-page="1"
 *   :total-items="100"
 *   :page-size="20"
 *   @update:page="handlePageChange"
 *   @update:pageSize="handlePageSizeChange"
 * />
 */
import ExpensePaginationContainer from './ExpensePaginationContainer.vue'

interface Props {
  currentPage: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  showSummaryBar?: boolean
}

withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 20, 50, 100],
  showSummaryBar: false
})

defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()
</script>