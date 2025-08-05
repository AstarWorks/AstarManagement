<template>
  <PaginationRoot class="expense-pagination">
    <ExpensePaginationMobile
      :total="total"
      :page="page"
      :page-size="pageSize"
      @update:page="$emit('update:page', $event)"
      @update:page-size="$emit('update:pageSize', $event)"
    />
    <ExpensePaginationDesktop
      :total="total"
      :page="page"
      :page-size="pageSize"
      :page-size-options="pageSizeOptions"
      @update:page="$emit('update:page', $event)"
      @update:page-size="$emit('update:pageSize', $event)"
    />
    <ExpensePaginationSummary
      v-if="showSummaryBar"
      :current-page="page"
      :total-pages="Math.ceil(total / pageSize)"
      :total-items="total"
    />
  </PaginationRoot>
</template>

<script setup lang="ts">
import { PaginationRoot } from '~/components/ui/pagination'
import ExpensePaginationMobile from './ExpensePaginationMobile.vue'
import ExpensePaginationDesktop from './ExpensePaginationDesktop.vue'
import ExpensePaginationSummary from './ExpensePaginationSummary.vue'

interface Props {
  total: number
  page?: number
  pageSize?: number
  pageSizeOptions?: number[]
  showSummaryBar?: boolean
}

withDefaults(defineProps<Props>(), {
  page: 1,
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 50, 100],
  showSummaryBar: false
})

defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()
</script>

<style scoped>
.expense-pagination {
  @apply bg-background;
}

/* Ensure keyboard navigation focus is visible */
.expense-pagination :deep(button:focus) {
  @apply ring-2 ring-offset-2 ring-primary;
}

/* Active page indicator for accessibility */
.expense-pagination :deep(button[aria-current="page"]) {
  @apply bg-primary text-primary-foreground;
}
</style>