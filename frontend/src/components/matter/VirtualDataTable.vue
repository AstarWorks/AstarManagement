<script setup lang="ts" generic="TData">
import { ref, computed, watch, nextTick } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import type { SortDirection } from '~/types/table'
import type { Matter } from '~/types/matter'
import { cn } from '~/lib/utils'
import DataTablePagination from './DataTablePagination.vue'
import BulkActionToolbar from './BulkActionToolbar.vue'
import type { AdvancedDataTableColumn } from './DataTableAdvanced.vue'

interface Props {
  columns: AdvancedDataTableColumn<TData>[]
  data: TData[]
  loading?: boolean
  error?: Error | null
  // Virtual scrolling props
  itemHeight?: number
  visibleItemsCount?: number
  bufferSize?: number
  // Selection props
  selectable?: boolean
  selectedRows?: TData[]
  getRowId?: (row: TData) => string
  // Bulk operations
  bulkActions?: boolean
  // Table props
  sortable?: boolean
  emptyMessage?: string
  className?: string
  // Performance
  enableVirtualScrolling?: boolean
  virtualScrollThreshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  itemHeight: 60,
  visibleItemsCount: 20,
  bufferSize: 5,
  selectable: true,
  selectedRows: () => [],
  getRowId: (row: any) => row.id || String(row),
  bulkActions: true,
  sortable: true,
  emptyMessage: 'No data found',
  className: '',
  enableVirtualScrolling: true,
  virtualScrollThreshold: 100
})

const emit = defineEmits<{
  sort: [column: string, direction: SortDirection]
  'selection:change': [selectedRows: TData[]]
  'selection:row': [row: TData, selected: boolean]
  'bulk:delete': [items: TData[]]
  'bulk:status-update': [items: TData[], status: any]
  'bulk:export': [items: TData[], format: 'csv' | 'excel']
  'cell:edit': [row: TData, column: string, value: any]
  'column:resize': [column: string, width: number]
}>()

// Refs for virtual scrolling
const scrollerRef = ref<InstanceType<typeof RecycleScroller>>()
const tableContainerRef = ref<HTMLElement>()

// Sorting state
const sortColumn = ref<string | null>(null)
const sortDirection = ref<SortDirection>('asc')

// Selection state
const selectedRowIds = ref<Set<string>>(new Set())
const lastSelectedIndex = ref<number | null>(null)

// Computed properties
const shouldUseVirtualScrolling = computed(() => 
  props.enableVirtualScrolling && props.data.length >= props.virtualScrollThreshold
)

const selectedRows = computed(() => {
  return props.data.filter(row => 
    selectedRowIds.value.has(props.getRowId(row))
  )
})

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

// Table height calculation for virtual scrolling
const tableHeight = computed(() => {
  if (!shouldUseVirtualScrolling.value) return 'auto'
  return Math.min(props.data.length * props.itemHeight, props.visibleItemsCount * props.itemHeight)
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

// Scroll to top when data changes
watch(() => props.data, () => {
  if (shouldUseVirtualScrolling.value && scrollerRef.value) {
    nextTick(() => {
      // Type assertion for virtual scroller methods
      const scroller = scrollerRef.value as any
      scroller?.scrollToItem?.(0)
    })
  }
}, { flush: 'post' })

// Watch for external selection changes
watch(() => props.selectedRows, (newSelection) => {
  const newIds = new Set(newSelection.map(row => props.getRowId(row)))
  selectedRowIds.value = newIds
}, { immediate: true })

// Expose methods for parent component
defineExpose({
  clearSelection,
  selectAll,
  scrollToTop: () => {
    const scroller = scrollerRef.value as any
    scroller?.scrollToItem?.(0)
  },
  scrollToItem: (index: number) => {
    const scroller = scrollerRef.value as any
    scroller?.scrollToItem?.(index)
  }
})
</script>

<template>
  <div :class="cn('virtual-data-table', className)">
    <!-- Bulk Action Toolbar -->
    <BulkActionToolbar
      v-if="bulkActions && selectable"
      :selected-items="selectedRows as Matter[]"
      :total-items="data.length"
      :disabled="loading"
      @action:delete="(items: Matter[]) => $emit('bulk:delete', items as TData[])"
      @action:status-update="(items: Matter[], status: any) => $emit('bulk:status-update', items as TData[], status)"
      @action:export="(items: Matter[], format: 'csv' | 'excel') => $emit('bulk:export', items as TData[], format)"
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

    <!-- Table Container -->
    <div v-else class="data-table__container" ref="tableContainerRef">
      <!-- Virtual Scrolling Table for Large Datasets -->
      <div v-if="shouldUseVirtualScrolling" class="virtual-table-wrapper">
        <!-- Table Header (Fixed) -->
        <div class="virtual-table-header">
          <table class="w-full">
            <thead class="border-b bg-background sticky top-0 z-10">
              <tr>
                <!-- Selection column -->
                <th v-if="selectable" class="px-4 py-3 w-12">
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
                    column.className
                  )"
                  :style="{ width: column.width }"
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
                  </div>
                </th>
              </tr>
            </thead>
          </table>
        </div>

        <!-- Virtual Scroller Body -->
        <div class="virtual-table-body" :style="{ height: `${tableHeight}px` }">
          <RecycleScroller
            ref="scrollerRef"
            class="scroller"
            :items="data"
            :item-size="itemHeight"
            :buffer="bufferSize"
            key-field="id"
            v-slot="{ item: row, index }"
          >
            <div
              class="virtual-row border-b hover:bg-muted/50 transition-colors"
              :class="{ 'bg-muted/30': isRowSelected(row) }"
              :style="{ height: `${itemHeight}px` }"
            >
              <table class="w-full h-full">
                <tbody>
                  <tr class="h-full">
                    <!-- Selection checkbox -->
                    <td v-if="selectable" class="px-4 py-3 w-12">
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
                        'px-4 py-3 text-sm truncate',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.className
                      )"
                      :style="{ width: column.width }"
                      @click="selectable && handleRowSelect(row, $event)"
                    >
                      <div class="truncate" :title="formatValue(column, row)">
                        {{ formatValue(column, row) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </RecycleScroller>
        </div>
      </div>

      <!-- Regular Table for Small Datasets -->
      <div v-else class="regular-table-wrapper">
        <div class="overflow-x-auto">
          <table class="w-full">
            <!-- Header -->
            <thead class="border-b bg-background sticky top-0 z-10">
              <tr>
                <!-- Selection column -->
                <th v-if="selectable" class="px-4 py-3 w-12">
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
                    column.className
                  )"
                  :style="{ width: column.width }"
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
                :class="{ 'bg-muted/30': isRowSelected(row) }"
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
      </div>
    </div>

    <!-- Virtual Scrolling Info -->
    <div v-if="shouldUseVirtualScrolling && data.length > 0" class="virtual-info">
      <p class="text-xs text-muted-foreground p-2">
        Virtual scrolling enabled - showing {{ data.length }} items efficiently
      </p>
    </div>
  </div>
</template>

<style scoped>
.virtual-data-table {
  @apply rounded-lg border bg-card;
}

.data-table__container {
  @apply relative w-full;
}

.virtual-table-wrapper {
  @apply relative;
}

.virtual-table-header {
  @apply border-b;
}

.virtual-table-body {
  @apply overflow-hidden;
}

.scroller {
  height: 100%;
}

.virtual-row {
  @apply flex items-center;
}

.virtual-info {
  @apply border-t bg-muted/30;
}

/* Enhanced selection styles */
tr.bg-muted\/30,
.virtual-row.bg-muted\/30 {
  @apply bg-primary/5 border-primary/20;
}

/* Ensure proper truncation in virtual rows */
.virtual-row td {
  @apply overflow-hidden;
}

.virtual-row .truncate {
  @apply whitespace-nowrap overflow-hidden text-ellipsis;
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

/* Smooth scrolling for virtual scroller */
.scroller {
  scroll-behavior: smooth;
}

/* Loading states for virtual items */
.virtual-row {
  @apply animate-in fade-in-0 duration-150;
}
</style>