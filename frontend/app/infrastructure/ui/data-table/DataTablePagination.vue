<template>
  <div class="flex items-center justify-between px-2">
    <!-- Left section: rows per page and summary -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <p class="text-sm font-medium">{{ $t('common.table.rowsPerPage') }}</p>
        <Select
          :model-value="String(table.getState().pagination.pageSize)"
          @update:model-value="table.setPageSize(Number($event))"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue :placeholder="String(table.getState().pagination.pageSize)" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem v-for="pageSize in pageSizeOptions" :key="pageSize" :value="String(pageSize)">
              {{ pageSize }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <!-- Results summary -->
      <div class="text-sm text-muted-foreground">
        {{ $t('common.table.showing', {
          from: (table.getState().pagination.pageIndex * table.getState().pagination.pageSize) + 1,
          to: Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, totalRows),
          total: totalRows
        }) }}
      </div>
    </div>
    
    <!-- Right section: pagination controls -->
    <div class="flex items-center gap-2">
      <!-- Page info -->
      <div class="flex items-center gap-1 text-sm font-medium">
        {{ $t('common.table.page') }}
        {{ table.getState().pagination.pageIndex + 1 }}
        {{ $t('common.table.of') }}
        {{ table.getPageCount() }}
      </div>
      
      <!-- Navigation buttons -->
      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <Icon name="lucide:chevrons-left" class="h-4 w-4" />
          <span class="sr-only">{{ $t('common.table.firstPage') }}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
          <span class="sr-only">{{ $t('common.table.previousPage') }}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
          <span class="sr-only">{{ $t('common.table.nextPage') }}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(table.getPageCount() - 1)"
        >
          <Icon name="lucide:chevrons-right" class="h-4 w-4" />
          <span class="sr-only">{{ $t('common.table.lastPage') }}</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import { computed } from 'vue'
import { Button } from '@ui/button/index'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import { Icon } from '#components'

interface Props<T = unknown> {
  table: Table<T>
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props<unknown>>(), {
  pageSizeOptions: () => [10, 25, 50, 100]
})

// const { t } = useI18n() // Temporarily unused

// Compute total rows considering filtering
const totalRows = computed(() => {
  // For manual pagination, use the row count from the table
  if (props.table.options.manualPagination) {
    return props.table.getRowCount()
  }
  // For client-side pagination, use filtered row count
  return props.table.getFilteredRowModel().rows.length
})
</script>