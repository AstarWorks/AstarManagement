<script setup lang="ts" generic="TData, TValue">
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, ColumnSizingState, ColumnPinningState } from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { computed, ref, watch } from 'vue'
import { valueUpdater } from '../table/utils'
import { useTablePersistence } from '~/composables/useTablePersistence'
import { useVirtualScrolling } from '~/composables/useVirtualScrolling'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '../table'
import { Skeleton } from '../skeleton'

/**
 * Props for the DataTable component
 * @template TData - The type of data in the table
 * @template TValue - The type of values in the table cells
 */
interface DataTableProps<TData, TValue> {
  /**
   * Column definitions for the table
   */
  columns: ColumnDef<TData, TValue>[]
  /**
   * Data to be displayed in the table
   */
  data: TData[]
  /**
   * Whether the table is in a loading state
   */
  loading?: boolean
  /**
   * Message to display when the table is empty
   */
  emptyMessage?: string
  /**
   * Number of skeleton rows to show when loading
   */
  skeletonRows?: number
  /**
   * Whether to enable sorting
   */
  enableSorting?: boolean
  /**
   * Whether to enable filtering
   */
  enableFiltering?: boolean
  /**
   * Whether to enable pagination
   */
  enablePagination?: boolean
  /**
   * Page size for pagination
   */
  pageSize?: number
  /**
   * Current page index (0-based) for controlled pagination
   */
  pageIndex?: number
  /**
   * Total number of pages (for server-side pagination)
   */
  pageCount?: number
  /**
   * Whether to use manual pagination (server-side)
   */
  manualPagination?: boolean
  /**
   * Unique ID for table state persistence
   */
  persistenceId?: string
  /**
   * Global filter value for text search across all columns
   */
  globalFilter?: string
  /**
   * Initial column filter state
   */
  initialColumnFilters?: ColumnFiltersState
  /**
   * Whether to enable virtual scrolling for large datasets
   */
  enableVirtualScrolling?: boolean
  /**
   * Number of rows threshold to enable virtual scrolling
   */
  virtualScrollThreshold?: number
  /**
   * Height of each table row in pixels (for virtual scrolling)
   */
  rowHeight?: number
  /**
   * Height of the table container in pixels (for virtual scrolling)
   */
  containerHeight?: number
}

const props = withDefaults(defineProps<DataTableProps<TData, TValue>>(), {
  loading: false,
  skeletonRows: 5,
  enableSorting: true,
  enableFiltering: true,
  enablePagination: true,
  pageSize: 10,
  pageIndex: 0,
  pageCount: undefined,
  manualPagination: false,
  globalFilter: '',
  initialColumnFilters: () => [],
  enableVirtualScrolling: false,
  virtualScrollThreshold: 100,
  rowHeight: 60,
  containerHeight: 400
})

const emit = defineEmits<{
  /**
   * Emitted when the table state changes
   */
  'update:state': [state: {
    sorting: SortingState
    columnFilters: ColumnFiltersState
    columnVisibility: VisibilityState
  }]
  /**
   * Emitted when a row is clicked
   */
  'rowClick': [row: TData]
  /**
   * Emitted when pagination changes
   */
  'update:pagination': [state: {
    pageIndex: number
    pageSize: number
  }]
}>()

// Persistence setup
const persistence = props.persistenceId ? useTablePersistence(props.persistenceId) : null
const persistedState = persistence?.loadState() || {}

// Table state - initialize with persisted values if available
const sorting = ref<SortingState>(persistedState.sorting || [])
const columnFilters = ref<ColumnFiltersState>(props.initialColumnFilters || [])
const columnVisibility = ref<VisibilityState>(persistedState.columnVisibility || {})
const rowSelection = ref({})
const columnSizing = ref<ColumnSizingState>(persistedState.columnSizing || {})
const columnPinning = ref<ColumnPinningState>(persistedState.columnPinning || { left: [], right: [] })
const globalFilter = ref(props.globalFilter || '')

// Pagination state
const pagination = ref({
  pageIndex: props.pageIndex,
  pageSize: props.pageSize,
})

// Create table instance
const table = useVueTable({
  data: computed(() => props.data),
  columns: props.columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: props.enablePagination ? getPaginationRowModel() : undefined,
  getSortedRowModel: props.enableSorting ? getSortedRowModel() : undefined,
  getFilteredRowModel: props.enableFiltering ? getFilteredRowModel() : undefined,
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  onColumnSizingChange: updaterOrValue => valueUpdater(updaterOrValue, columnSizing),
  onColumnPinningChange: updaterOrValue => valueUpdater(updaterOrValue, columnPinning),
  onGlobalFilterChange: updaterOrValue => valueUpdater(updaterOrValue, globalFilter),
  onPaginationChange: updaterOrValue => {
    valueUpdater(updaterOrValue, pagination)
    emit('update:pagination', pagination.value)
  },
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
    get columnSizing() { return columnSizing.value },
    get columnPinning() { return columnPinning.value },
    get globalFilter() { return globalFilter.value },
    get pagination() { return pagination.value },
  },
  // Manual pagination for server-side data
  manualPagination: props.manualPagination,
  pageCount: props.pageCount,
  // Enable multi-column sorting
  enableMultiSort: true,
  enableSortingRemoval: true,
  maxMultiSortColCount: 3,
  // Enable column resizing
  columnResizeMode: 'onChange',
  enableColumnResizing: true,
})

// Virtual scrolling setup
const shouldUseVirtualScrolling = computed(() => 
  props.enableVirtualScrolling && 
  props.data.length > props.virtualScrollThreshold!
)

const virtualScrollingData = computed(() => {
  if (shouldUseVirtualScrolling.value) {
    // Use filtered and sorted data from table
    return table.getRowModel().rows.map(row => row.original)
  }
  return []
})

// Initialize virtual scrolling with reactive data
const virtualScrollingDataRef = ref(virtualScrollingData.value)
const virtualScrolling = useVirtualScrolling(virtualScrollingDataRef, {
  itemHeight: props.rowHeight!,
  containerHeight: props.containerHeight!,
  overscan: 5,
  showPerformanceMetrics: process.env.NODE_ENV === 'development',
  showScrollIndicators: true
})

// Enhanced scroll position preservation
const preservedScrollPosition = ref(0)

// Update virtual scrolling data when table data changes
watch(virtualScrollingData, (newData, oldData) => {
  // Preserve scroll position before data update
  if (virtualScrolling.containerRef.value) {
    preservedScrollPosition.value = virtualScrolling.containerRef.value.scrollTop
  }
  
  virtualScrollingDataRef.value = newData
  
  // Restore scroll position after data update, but only if data length is similar
  nextTick(() => {
    if (virtualScrolling.containerRef.value && newData.length > 0) {
      // Only restore if the new dataset is similar in size (within 10% difference)
      const sizeDifference = oldData ? Math.abs(newData.length - oldData.length) / oldData.length : 0
      
      if (sizeDifference < 0.1 && preservedScrollPosition.value > 0) {
        // Ensure scroll position doesn't exceed new content height
        const maxScrollTop = virtualScrolling.totalHeight.value - props.containerHeight!
        const safeScrollTop = Math.min(preservedScrollPosition.value, maxScrollTop)
        virtualScrolling.containerRef.value.scrollTop = safeScrollTop
      }
    }
  })
}, { deep: true })

// Watch for filter changes to handle scroll position intelligently
watch(() => props.initialColumnFilters, (newFilters, oldFilters) => {
  // If filters change significantly, reset scroll to top for better UX
  if (virtualScrolling.containerRef.value && JSON.stringify(newFilters) !== JSON.stringify(oldFilters)) {
    nextTick(() => {
      if (virtualScrolling.containerRef.value) {
        virtualScrolling.containerRef.value.scrollTop = 0
      }
    })
  }
}, { deep: true })

// Watch for prop changes to update internal state
watch(() => props.globalFilter, (newValue) => {
  globalFilter.value = newValue || ''
})

watch(() => props.initialColumnFilters, (newValue) => {
  if (newValue) {
    columnFilters.value = newValue
  }
}, { deep: true })

// Watch for pagination prop changes
watch(() => props.pageIndex, (newValue) => {
  if (newValue !== undefined && newValue !== pagination.value.pageIndex) {
    pagination.value = { ...pagination.value, pageIndex: newValue }
  }
})

watch(() => props.pageSize, (newValue) => {
  if (newValue !== undefined && newValue !== pagination.value.pageSize) {
    pagination.value = { ...pagination.value, pageSize: newValue }
  }
})

// Watch for state changes and emit + persist
watch([sorting, columnFilters, columnVisibility, columnSizing, columnPinning, globalFilter], () => {
  emit('update:state', {
    sorting: sorting.value,
    columnFilters: columnFilters.value,
    columnVisibility: columnVisibility.value,
  })
  
  // Persist state if persistence is enabled
  if (persistence) {
    persistence.saveState({
      sorting: sorting.value,
      columnVisibility: columnVisibility.value,
      columnSizing: columnSizing.value,
      columnPinning: columnPinning.value,
    })
  }
})

// Expose table instance for parent components
defineExpose({
  table,
})
</script>

<template>
  <div class="w-full">
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :colspan="header.colSpan"
              :style="{
                width: `${header.getSize()}px`,
              }"
              class="relative"
            >
              <div class="flex items-center">
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </div>
              <div
                v-if="header.column.getCanResize()"
                class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none"
                :class="{
                  'bg-primary': header.column.getIsResizing(),
                }"
                @mousedown="header.getResizeHandler()($event)"
                @touchstart="header.getResizeHandler()($event)"
              >
                <div class="h-full w-1 hover:bg-muted-foreground/50"/>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading state -->
          <template v-if="loading">
            <TableRow
              v-for="i in skeletonRows"
              :key="`skeleton-${i}`"
            >
              <TableCell
                v-for="column in columns"
                :key="`skeleton-${i}-${column.id}`"
              >
                <Skeleton class="h-4 w-full" />
              </TableCell>
            </TableRow>
          </template>
          <!-- Data rows with virtual scrolling support -->
          <template v-else-if="table.getRowModel().rows?.length">
            <!-- Virtual scrolling mode -->
            <template v-if="shouldUseVirtualScrolling">
              <!-- Virtual scroll container with table structure -->
              <div 
                :ref="virtualScrolling.containerRef"
                :style="{ height: `${containerHeight}px`, overflow: 'auto' }"
                class="virtual-scroll-container"
                @scroll="virtualScrolling.handlers.handleScroll"
              >
                <!-- Virtual spacer for total height -->
                <div :style="{ height: `${virtualScrolling.totalHeight}px`, position: 'relative' }">
                  <!-- Visible rows container -->
                  <div 
                    :style="{ 
                      transform: `translateY(${virtualScrolling.offsetY}px)`,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0
                    }"
                  >
                    <TableRow
                      v-for="(row, index) in table.getRowModel().rows.slice(virtualScrolling.metrics.startIndex.value, virtualScrolling.metrics.endIndex.value + 1)"
                      :key="`virtual-${virtualScrolling.metrics.startIndex.value + index}`"
                      :style="{ height: `${rowHeight}px` }"
                      :data-state="row.getIsSelected() && 'selected'"
                      class="hover:bg-muted/50 cursor-pointer"
                      @click="emit('rowClick', row.original)"
                    >
                      <TableCell
                        v-for="cell in row.getVisibleCells()"
                        :key="cell.id"
                      >
                        <FlexRender
                          :render="cell.column.columnDef.cell"
                          :props="cell.getContext()"
                        />
                      </TableCell>
                    </TableRow>
                  </div>
                </div>
              </div>
              
              <!-- Performance metrics in development -->
              <div 
                v-if="virtualScrolling.isDevelopment"
                class="virtual-scroll-metrics fixed top-4 right-4 bg-black/80 text-white text-xs p-2 rounded z-50"
              >
                <div>FPS: {{ virtualScrolling.metrics.fps }}</div>
                <div>Visible: {{ virtualScrolling.metrics.visibleCount }}</div>
                <div>Range: {{ virtualScrolling.metrics.startIndex }}-{{ virtualScrolling.metrics.endIndex }}</div>
                <div>Total: {{ data.length }}</div>
              </div>
            </template>
            
            <!-- Regular rendering mode -->
            <template v-else>
              <TableRow
                v-for="row in table.getRowModel().rows"
                :key="row.id"
                :data-state="row.getIsSelected() && 'selected'"
                class="hover:bg-muted/50 cursor-pointer"
                @click="emit('rowClick', row.original)"
              >
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
            </template>
          </template>
          <!-- Empty state -->
          <template v-else>
            <TableRow>
              <TableCell
                :colspan="columns.length"
                class="h-24 text-center"
              >
                <TableEmpty>
                  {{ emptyMessage }}
                </TableEmpty>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
  </div>
</template>