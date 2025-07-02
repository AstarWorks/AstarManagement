<script setup lang="ts" generic="TData">
import { ref, computed, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import type { SortDirection } from '~/types/table'
import type { Matter } from '~/types/matter'
import { cn } from '~/lib/utils'
import DataTablePagination from './DataTablePagination.vue'
import BulkActionToolbar from './BulkActionToolbar.vue'
import type { DataTableColumn } from './DataTable.vue'

export interface AdvancedDataTableColumn<T = any> extends DataTableColumn<T> {
  resizable?: boolean
  hideable?: boolean
  sticky?: boolean
  minWidth?: number
  maxWidth?: number
  editable?: boolean
  required?: boolean
  validator?: (value: any, row: T) => Promise<string | boolean> | string | boolean
  type?: 'text' | 'number' | 'email' | 'url' | 'date'
}

interface Props {
  columns: AdvancedDataTableColumn<TData>[]
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
  // Selection props
  selectable?: boolean
  selectedRows?: TData[]
  getRowId?: (row: TData) => string
  // Bulk operations
  bulkActions?: boolean
  // Advanced features
  resizableColumns?: boolean
  stickyHeader?: boolean
  virtualScrolling?: boolean
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
  selectable: true,
  selectedRows: () => [],
  getRowId: (row: any) => row.id || String(row),
  bulkActions: true,
  resizableColumns: true,
  stickyHeader: true,
  virtualScrolling: false,
  sortable: true,
  emptyMessage: 'No data found',
  className: ''
})

const emit = defineEmits<{
  sort: [column: string, direction: SortDirection]
  pageChange: [page: number]
  pageSizeChange: [size: number]
  'selection:change': [selectedRows: TData[]]
  'selection:row': [row: TData, selected: boolean]
  'bulk:delete': [items: TData[]]
  'bulk:status-update': [items: TData[], status: any]
  'bulk:export': [items: TData[], format: 'csv' | 'excel']
  'cell:edit': [row: TData, column: string, value: any]
  'column:resize': [column: string, width: number]
}>()

// Sorting state
const sortColumn = ref<string | null>(null)
const sortDirection = ref<SortDirection>('asc')

// Selection state
const selectedRowIds = ref<Set<string>>(new Set())
const lastSelectedIndex = ref<number | null>(null)

// Column widths for resizing
const columnWidths = ref<Record<string, number>>({})

// Computed selected rows
const selectedRows = computed(() => {
  return props.data.filter(row => 
    selectedRowIds.value.has(props.getRowId(row))
  )
})

// Selection helpers
const isRowSelected = (row: TData): boolean => {
  return selectedRowIds.value.has(props.getRowId(row))
}

const isAllSelected = computed(() => {
  return props.data.length > 0 && 
         props.data.every(row => selectedRowIds.value.has(props.getRowId(row)))
})

const isPartiallySelected = computed(() => {
  return selectedRowIds.value.size > 0 && !isAllSelected.value
})

// Handle sort click
const handleSort = (column: AdvancedDataTableColumn<TData>) => {
  if (!props.sortable || !column.sortable) return

  const key = String(column.key)
  if (sortColumn.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = key
    sortDirection.value = 'asc'
  }

  emit('sort', key, sortDirection.value)
}

// Handle row selection
const handleRowSelect = (row: TData, event?: MouseEvent) => {
  const rowId = props.getRowId(row)
  const rowIndex = props.data.findIndex(r => props.getRowId(r) === rowId)
  
  if (event?.shiftKey && lastSelectedIndex.value !== null) {
    // Range selection with Shift+click
    const start = Math.min(lastSelectedIndex.value, rowIndex)
    const end = Math.max(lastSelectedIndex.value, rowIndex)
    
    for (let i = start; i <= end; i++) {
      const targetRow = props.data[i]
      if (targetRow) {
        selectedRowIds.value.add(props.getRowId(targetRow))
      }
    }
  } else {
    // Single row selection
    if (selectedRowIds.value.has(rowId)) {
      selectedRowIds.value.delete(rowId)
    } else {
      selectedRowIds.value.add(rowId)
    }
  }
  
  lastSelectedIndex.value = rowIndex
  emit('selection:row', row, selectedRowIds.value.has(rowId))
  emit('selection:change', selectedRows.value)
}

// Handle select all
const handleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRowIds.value.clear()
  } else {
    props.data.forEach(row => {
      selectedRowIds.value.add(props.getRowId(row))
    })
  }
  emit('selection:change', selectedRows.value)
}

// Clear selection
const clearSelection = () => {
  selectedRowIds.value.clear()
  lastSelectedIndex.value = null
  emit('selection:change', [])
}

// Select all items
const selectAll = () => {
  props.data.forEach(row => {
    selectedRowIds.value.add(props.getRowId(row))
  })
  emit('selection:change', selectedRows.value)
}

// Get value from nested path
const getValue = (row: TData, path: string): any => {
  return path.split('.').reduce((obj, key) => obj?.[key], row as any)
}

// Format cell value
const formatValue = (column: AdvancedDataTableColumn<TData>, row: TData): string => {
  const value = getValue(row, String(column.key))
  
  if (column.formatter) {
    return column.formatter(value, row)
  }
  
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toLocaleDateString()
  
  return String(value)
}

// Get sort icon
const getSortIcon = (column: AdvancedDataTableColumn<TData>) => {
  const key = String(column.key)
  if (!column.sortable || sortColumn.value !== key) {
    return 'lucide:chevrons-up-down'
  }
  return sortDirection.value === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down'
}

// Column width management
const getColumnWidth = (column: AdvancedDataTableColumn<TData>) => {
  const key = String(column.key)
  return columnWidths.value[key] || column.width
}

const handleColumnResize = (column: AdvancedDataTableColumn<TData>, width: number) => {
  const key = String(column.key)
  columnWidths.value[key] = width
  emit('column:resize', key, width)
}

// Watch for external selection changes
watch(() => props.selectedRows, (newSelection) => {
  const newIds = new Set(newSelection.map(row => props.getRowId(row)))
  selectedRowIds.value = newIds
}, { immediate: true })
</script>

<template>
  <div :class="cn('advanced-data-table', className)">
    <!-- Bulk Action Toolbar -->
    <BulkActionToolbar
      v-if="bulkActions && selectable"
      :selected-items="selectedRows as Matter[]"
      :total-items="total"
      :disabled="loading"
      @action:delete="(items: Matter[]) => $emit('bulk:delete', items as TData[])"
      @action:status-update="(items: any[], status: any) => $emit('bulk:status-update', items as TData[], status)"
      @action:export="(items: any[], format: 'csv' | 'excel') => $emit('bulk:export', items as TData[], format)"
      @selection:clear="clearSelection"
      @selection:all="selectAll"
    />

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
          <thead 
            class="border-b"
            :class="{ 'sticky top-0 bg-background z-10': stickyHeader }"
          >
            <tr>
              <!-- Selection column -->
              <th
                v-if="selectable"
                class="px-4 py-3 w-12"
              >
                <Checkbox
                  :checked="isAllSelected"
                  :indeterminate="isPartiallySelected"
                  @update:checked="handleSelectAll"
                />
              </th>

              <!-- Data columns -->
              <th
                v-for="column in columns"
                :key="String(column.key)"
                :class="cn(
                  'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                  column.sortable && sortable && 'cursor-pointer hover:text-foreground transition-colors',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sticky && 'sticky bg-background',
                  column.className
                )"
                :style="{ 
                  width: getColumnWidth(column),
                  minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
                  maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined
                }"
                @click="handleSort(column)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1">
                    <span>{{ column.header }}</span>
                    <Icon
                      v-if="column.sortable && sortable"
                      :name="getSortIcon(column)"
                      class="h-4 w-4"
                    />
                  </div>
                  
                  <!-- Resize handle -->
                  <div
                    v-if="resizableColumns && column.resizable !== false"
                    class="resize-handle w-1 h-4 bg-border hover:bg-primary cursor-col-resize"
                    @mousedown="/* Handle resize */"
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
              :key="getRowId(row)"
              class="border-b hover:bg-muted/50 transition-colors"
              :class="{
                'bg-muted/30': isRowSelected(row)
              }"
            >
              <!-- Selection checkbox -->
              <td v-if="selectable" class="px-4 py-3">
                <Checkbox
                  :checked="isRowSelected(row)"
                  @update:checked="handleRowSelect(row, $event)"
                />
              </td>

              <!-- Data cells -->
              <td
                v-for="column in columns"
                :key="String(column.key)"
                :class="cn(
                  'px-4 py-3 text-sm',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sticky && 'sticky bg-background',
                  column.className
                )"
                @click="selectable && handleRowSelect(row, $event)"
              >
                {{ formatValue(column, row) }}
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="data.length === 0">
              <td 
                :colspan="columns.length + (selectable ? 1 : 0)" 
                class="px-4 py-12 text-center"
              >
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
.advanced-data-table {
  @apply rounded-lg border bg-card;
}

.data-table__container {
  @apply relative w-full;
}

.resize-handle {
  @apply opacity-0 transition-opacity;
}

th:hover .resize-handle {
  @apply opacity-100;
}

/* Enhanced selection styles */
tr.bg-muted\/30 {
  @apply bg-primary/5 border-primary/20;
}

/* Sticky column shadows */
.sticky {
  box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.1);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .data-table__container {
    @apply -mx-4;
  }
  
  .data-table__container > div {
    @apply px-4;
  }
}
</style>