<script setup lang="ts" generic="TData, TValue">
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/vue-table'
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
}

const props = withDefaults(defineProps<DataTableProps<TData, TValue>>(), {
  loading: false,
  skeletonRows: 5,
  enableSorting: true,
  enableFiltering: true,
  enablePagination: true,
  pageSize: 10,
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

// Table state
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})

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
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
  },
  initialState: {
    pagination: {
      pageSize: props.pageSize,
    },
  },
})

// Watch for state changes and emit
watch([sorting, columnFilters, columnVisibility], () => {
  emit('update:state', {
    sorting: sorting.value,
    columnFilters: columnFilters.value,
    columnVisibility: columnVisibility.value,
  })
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
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
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