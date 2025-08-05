<template>
  <div class="mobile-pagination md:hidden">
    <div class="flex justify-between items-center p-4 border-t">
      <PaginationInfo
        :start="paginationInfo.start"
        :end="paginationInfo.end"
        :total="paginationInfo.total"
        :is-empty="paginationInfo.isEmpty"
      />
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="isFirstPage"
          @click="prev"
        >
          <Icon name="lucide:chevron-left" class="w-4 h-4" />
        </Button>
        <span class="text-sm font-medium px-2">
          {{ currentPage }} / {{ pageCount }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="isLastPage"
          @click="next"
        >
          <Icon name="lucide:chevron-right" class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { PaginationInfo } from '~/components/ui/pagination'
import { useExpensePagination } from '~/composables/usePagination'

interface Props {
  total: number
  page?: number
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  page: 1,
  pageSize: 10
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()

const {
  currentPage,
  pageCount,
  isFirstPage,
  isLastPage,
  paginationInfo,
  prev,
  next
} = useExpensePagination({
  page: props.page,
  pageSize: props.pageSize,
  total: props.total,
  onPageChange: (page) => emit('update:page', page),
  onPageSizeChange: (pageSize) => emit('update:pageSize', pageSize)
})
</script>