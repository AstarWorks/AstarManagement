<script setup lang="ts" generic="TData">
import { computed, ref } from 'vue'
import type { SortDirection } from '~/types/table'
import { cn } from '~/lib/utils'
import DataTablePagination from './DataTablePagination.vue'

export interface DataTableColumn<T = Record<string, unknown>> {
  key: keyof T | string
  header: string
  sortable?: boolean
  formatter?: (value: unknown, row: T) => string
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

interface Props {
  columns: DataTableColumn<TData>[]
  data: TData[]
  loading?: boolean
  error?: Error | null
  // Pagination props
  page?: number
  pageSize?: number
  total?: number
  pageSizeOptions?: number[]
  showPagination?: boolean
  showPageSize?: boolean
  // Table props
  sortable?: boolean
  emptyMessage?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  page: 1,
  pageSize: 30,
  total: 0,
  pageSizeOptions: () => [10, 25, 50, 100],
  showPagination: true,
  showPageSize: true,
  sortable: true,
  emptyMessage: 'No matters found',
  className: ''
})

const emit = defineEmits<{
  sort: [column: string, direction: SortDirection]
  pageChange: [page: number]
  pageSizeChange: [size: number]
}>()

// Sorting state
const sortColumn = ref<string | null>(null)
const sortDirection = ref<SortDirection>('asc')

// Handle column sort click
const handleSort = (column: DataTableColumn<TData>) => {
  if (!props.sortable || !column.sortable) return

  const key = String(column.key)
  if (sortColumn.value === key) {
    // Toggle direction if same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // New column, default to ascending
    sortColumn.value = key
    sortDirection.value = 'asc'
  }

  emit('sort', key, sortDirection.value)
}

// Get value from nested path (e.g., 'user.name')
const getValue = (row: TData, path: string): unknown => {
  return path.split('.').reduce((obj, key) => obj?.[key], row as Record<string, unknown>)
}

// Format cell value
const formatValue = (column: DataTableColumn<TData>, row: TData): string => {
  const value = getValue(row, String(column.key))
  
  if (column.formatter) {
    return column.formatter(value, row)
  }
  
  // Default formatting
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toLocaleDateString()
  
  return String(value)
}

// Compute sort icon for column header
const getSortIcon = (column: DataTableColumn<TData>) => {
  const key = String(column.key)
  if (!column.sortable || sortColumn.value !== key) {
    return 'lucide:chevrons-up-down'
  }
  return sortDirection.value === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down'
}
</script>

<template>
  <div :class="cn('data-table', className)">
    <!-- Loading State -->
    <div v-if="loading" class="data-table__loading">
      <div class="flex items-center justify-center py-12">
        <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="data-table__error">
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <Icon name="lucide:alert-circle" class="h-12 w-12 text-destructive mb-4" />
        <p class="text-sm text-muted-foreground">{{ error.message }}</p>
      </div>
    </div>

    <!-- Table -->
    <div v-else class="data-table__container">
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- Header -->
          <thead class="border-b">
            <tr>
              <th
                v-for="column in columns"
                :key="String(column.key)"
                :class="cn(
                  'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                  column.sortable && sortable && 'cursor-pointer hover:text-foreground transition-colors',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.className
                )"
                :style="{ width: column.width }"
                @click="handleSort(column)"
              >
                <div class="flex items-center gap-1">
                  <span>{{ column.header }}</span>
                  <Icon
                    v-if="column.sortable && sortable"
                    :name="getSortIcon(column)"
                    class="h-4 w-4"
                  />
                </div>
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody>
            <!-- Data rows -->
            <tr
              v-for="(row, index) in data"
              :key="index"
              class="border-b hover:bg-muted/50 transition-colors"
            >
              <td
                v-for="column in columns"
                :key="String(column.key)"
                :class="cn(
                  'px-4 py-3 text-sm',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.className
                )"
              >
                {{ formatValue(column, row) }}
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="data.length === 0">
              <td :colspan="columns.length" class="px-4 py-12 text-center">
                <p class="text-sm text-muted-foreground">{{ emptyMessage }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <DataTablePagination
        v-if="showPagination && total > 0"
        :page="page"
        :page-size="pageSize"
        :total="total"
        :page-size-options="pageSizeOptions"
        :show-page-size="showPageSize"
        :disabled="loading"
        @page-change="$emit('pageChange', $event)"
        @page-size-change="$emit('pageSizeChange', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.data-table {
  @apply rounded-lg border bg-card;
}

.data-table__container {
  @apply relative w-full;
}

/* Ensure horizontal scroll on mobile */
@media (max-width: 768px) {
  .data-table__container {
    @apply -mx-4;
  }
  
  .data-table__container > div {
    @apply px-4;
  }
}
</style>