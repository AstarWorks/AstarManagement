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
}

const props = withDefaults(defineProps<DataTableProps<TData, TValue>>(), {
  loading: false,
  skeletonRows: 5,
  enableSorting: true,
  enableFiltering: true,
  enablePagination: true,
  pageSize: 10,
  globalFilter: '',
  initialColumnFilters: () => []
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
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
    get columnSizing() { return columnSizing.value },
    get columnPinning() { return columnPinning.value },
    get globalFilter() { return globalFilter.value },
  },
  initialState: {
    pagination: {
      pageSize: props.pageSize,
    },
  },
  // Enable multi-column sorting
  enableMultiSort: true,
  enableSortingRemoval: true,
  maxMultiSortColCount: 3,
  // Enable column resizing
  columnResizeMode: 'onChange',
  enableColumnResizing: true,
})

// Watch for prop changes to update internal state
watch(() => props.globalFilter, (newValue) => {
  globalFilter.value = newValue || ''
})

watch(() => props.initialColumnFilters, (newValue) => {
  if (newValue) {
    columnFilters.value = newValue
  }
}, { deep: true })

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
          <!-- Data rows -->
          <template v-else-if="table.getRowModel().rows?.length">
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