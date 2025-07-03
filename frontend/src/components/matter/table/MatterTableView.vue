<script setup lang="ts">
import { ref, computed, watch, h, onMounted } from 'vue'
import {
  useVueTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type Table
} from '@tanstack/vue-table'
import { ArrowUpDown, ChevronDown, Eye, EyeOff, Settings2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Badge } from '~/components/ui/badge'
import { useKanbanStore } from '~/stores/kanban'
import { storeToRefs } from 'pinia'
import type { Matter, MatterStatus, MatterPriority } from '~/types/matter'
import { formatDate } from '~/utils/formatters'

interface Props {
  density?: 'compact' | 'comfortable' | 'spacious'
  showColumnVisibility?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  density: 'comfortable',
  showColumnVisibility: true
})

const emit = defineEmits<{
  'matter-click': [matter: Matter]
  'matter-edit': [matter: Matter]
}>()

// Get store
const kanbanStore = useKanbanStore()
const { filteredMatters: matters, isLoading } = storeToRefs(kanbanStore)

// Table state
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 30,
})

// Load saved column visibility from localStorage
onMounted(() => {
  const saved = localStorage.getItem('matter-table-columns')
  if (saved) {
    columnVisibility.value = JSON.parse(saved)
  }
})

// Save column visibility to localStorage
watch(columnVisibility, (newVisibility) => {
  localStorage.setItem('matter-table-columns', JSON.stringify(newVisibility))
}, { deep: true })

// Column helper
const columnHelper = createColumnHelper<Matter>()

// Priority badge variant
const getPriorityVariant = (priority: MatterPriority) => {
  switch (priority) {
    case 'URGENT': return 'destructive'
    case 'HIGH': return 'default'
    case 'MEDIUM': return 'secondary'
    case 'LOW': return 'outline'
    default: return 'outline'
  }
}

// Status badge variant
const getStatusVariant = (status: MatterStatus) => {
  switch (status) {
    case 'INTAKE': return 'secondary'
    case 'INITIAL_REVIEW': return 'secondary'
    case 'IN_PROGRESS': return 'default'
    case 'REVIEW': return 'default'
    case 'WAITING_CLIENT': return 'outline'
    case 'READY_FILING': return 'default'
    case 'CLOSED': return 'secondary'
    default: return 'outline'
  }
}

// Column definitions
const columns = computed<ColumnDef<Matter>[]>(() => [
  // Selection column
  columnHelper.display({
    id: 'select',
    header: ({ table }) => h(
      'input',
      {
        type: 'checkbox',
        class: 'w-4 h-4 rounded border-gray-300',
        checked: table.getIsAllPageRowsSelected(),
        indeterminate: table.getIsSomePageRowsSelected(),
        onChange: table.getToggleAllPageRowsSelectedHandler()
      }
    ),
    cell: ({ row }) => h(
      'input',
      {
        type: 'checkbox',
        class: 'w-4 h-4 rounded border-gray-300',
        checked: row.getIsSelected(),
        onChange: row.getToggleSelectedHandler()
      }
    ),
    size: 40,
  }),
  
  // Matter Number
  columnHelper.accessor('caseNumber', {
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        class: 'h-8 p-0 font-medium'
      },
      () => [
        'Matter #',
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })
      ]
    ),
    cell: ({ row }) => h(
      'div',
      { class: 'font-medium' },
      row.getValue('caseNumber')
    ),
    size: 120,
  }),
  
  // Title
  columnHelper.accessor('title', {
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        class: 'h-8 p-0 font-medium'
      },
      () => [
        'Title',
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })
      ]
    ),
    cell: ({ row }) => h(
      'div',
      {
        class: 'max-w-[300px] truncate cursor-pointer hover:text-primary',
        onClick: () => emit('matter-click', row.original)
      },
      row.getValue('title')
    ),
    size: 300,
  }),
  
  // Client
  columnHelper.accessor('clientName', {
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        class: 'h-8 p-0 font-medium'
      },
      () => [
        'Client',
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })
      ]
    ),
    cell: ({ row }) => row.getValue('clientName'),
    size: 150,
  }),
  
  // Status
  columnHelper.accessor('status', {
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        class: 'h-8 p-0 font-medium'
      },
      () => [
        'Status',
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })
      ]
    ),
    cell: ({ row }) => h(
      Badge,
      { variant: getStatusVariant(row.getValue('status')) },
      () => row.getValue('status').replace(/_/g, ' ')
    ),
    size: 140,
  }),
  
  // Priority
  columnHelper.accessor('priority', {
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        class: 'h-8 p-0 font-medium'
      },
      () => [
        'Priority',
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })
      ]
    ),
    cell: ({ row }) => h(
      Badge,
      { variant: getPriorityVariant(row.getValue('priority')) },
      () => row.getValue('priority')
    ),
    size: 100,
  }),
  
  // Assignee
  columnHelper.display({
    id: 'assignee',
    header: 'Assignee',
    cell: ({ row }) => {
      const lawyer = row.original.assignedLawyer
      if (!lawyer) return '-'
      return typeof lawyer === 'string' ? lawyer : lawyer.name
    },
    size: 150,
  }),
  
  // Due Date
  columnHelper.accessor('dueDate', {
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        class: 'h-8 p-0 font-medium'
      },
      () => [
        'Due Date',
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })
      ]
    ),
    cell: ({ row }) => {
      const date = row.getValue('dueDate')
      return date ? formatDate(date as string) : '-'
    },
    size: 120,
  }),
  
  // Documents
  columnHelper.accessor('relatedDocuments', {
    header: 'Docs',
    cell: ({ row }) => {
      const count = (row.getValue('relatedDocuments') as number) || 0
      return h(
        'div',
        { class: 'text-center' },
        count > 0 ? count.toString() : '-'
      )
    },
    size: 80,
  }),
  
  // Updated
  columnHelper.accessor('updatedAt', {
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        class: 'h-8 p-0 font-medium'
      },
      () => [
        'Updated',
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })
      ]
    ),
    cell: ({ row }) => formatDate(row.getValue('updatedAt')),
    size: 120,
  }),
])

// Create table instance
const table = computed(() =>
  useVueTable({
    data: matters.value,
    columns: columns.value,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updater) => {
      sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
    },
    onColumnFiltersChange: (updater) => {
      columnFilters.value = typeof updater === 'function' ? updater(columnFilters.value) : updater
    },
    onColumnVisibilityChange: (updater) => {
      columnVisibility.value = typeof updater === 'function' ? updater(columnVisibility.value) : updater
    },
    onRowSelectionChange: (updater) => {
      rowSelection.value = typeof updater === 'function' ? updater(rowSelection.value) : updater
    },
    onPaginationChange: (updater) => {
      pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater
    },
    state: {
      sorting: sorting.value,
      columnFilters: columnFilters.value,
      columnVisibility: columnVisibility.value,
      rowSelection: rowSelection.value,
      pagination: pagination.value,
    },
  })
)

// Density classes
const densityClasses = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'h-8 text-sm'
    case 'spacious':
      return 'h-14 text-base'
    default:
      return 'h-11 text-sm'
  }
})

// Selected rows
const selectedRows = computed(() => {
  return Object.keys(rowSelection.value).length
})
</script>

<template>
  <div class="matter-table-view">
    <!-- Table Controls -->
    <div class="table-controls">
      <div class="flex items-center gap-2">
        <!-- Selection info -->
        <div v-if="selectedRows > 0" class="text-sm text-muted-foreground">
          {{ selectedRows }} row{{ selectedRows > 1 ? 's' : '' }} selected
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Column visibility toggle -->
        <DropdownMenu v-if="showColumnVisibility">
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" class="ml-auto">
              <Settings2 class="h-4 w-4 mr-2" />
              Columns
              <ChevronDown class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              v-for="column in table.getAllColumns().filter(col => col.getCanHide())"
              :key="column.id"
              :checked="column.getIsVisible()"
              @update:checked="(value) => column.toggleVisibility(!!value)"
            >
              {{ column.id }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    
    <!-- Table -->
    <div class="table-container">
      <div class="table-wrapper">
        <table class="matter-table">
          <thead>
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :style="{ width: `${header.getSize()}px` }"
                :class="[
                  'table-header',
                  header.column.getCanSort() && 'cursor-pointer select-none'
                ]"
              >
                <component
                  :is="flexRender(header.column.columnDef.header, header.getContext())"
                  v-if="!header.isPlaceholder"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="table.getRowModel().rows?.length">
              <tr
                v-for="row in table.getRowModel().rows"
                :key="row.id"
                :class="[
                  'table-row',
                  densityClasses,
                  row.getIsSelected() && 'selected'
                ]"
              >
                <td
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :style="{ width: `${cell.column.getSize()}px` }"
                  class="table-cell"
                >
                  <component :is="flexRender(cell.column.columnDef.cell, cell.getContext())" />
                </td>
              </tr>
            </template>
            <template v-else>
              <tr>
                <td :colspan="columns.length" class="h-24 text-center">
                  <div v-if="isLoading" class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                  <div v-else class="text-muted-foreground">
                    No matters found
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Pagination -->
    <div class="table-pagination">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
          >
            Next
          </Button>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm">
            <span>Page</span>
            <strong>
              {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
            </strong>
          </div>
          
          <div class="flex items-center gap-2">
            <label class="text-sm">Show</label>
            <select
              class="h-8 w-[70px] rounded border border-input bg-background px-2 text-sm"
              :value="table.getState().pagination.pageSize"
              @change="table.setPageSize(Number($event.target.value))"
            >
              <option v-for="pageSize in [10, 20, 30, 50, 100]" :key="pageSize" :value="pageSize">
                {{ pageSize }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matter-table-view {
  @apply flex flex-col h-full bg-background;
}

.table-controls {
  @apply flex items-center justify-between p-4 border-b;
}

.table-container {
  @apply flex-1 overflow-hidden;
}

.table-wrapper {
  @apply h-full overflow-auto;
}

.matter-table {
  @apply w-full border-collapse;
}

.table-header {
  @apply sticky top-0 z-10 h-11 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50;
  @apply border-b transition-colors hover:bg-muted/80;
}

.table-row {
  @apply border-b transition-colors hover:bg-muted/50;
}

.table-row.selected {
  @apply bg-muted;
}

.table-cell {
  @apply px-4 align-middle;
}

.table-pagination {
  @apply border-t p-4;
}

/* Density variations */
.table-row.h-8 .table-cell {
  @apply py-1;
}

.table-row.h-11 .table-cell {
  @apply py-2;
}

.table-row.h-14 .table-cell {
  @apply py-3;
}

/* Column resize handle */
.table-header .resize-handle {
  @apply absolute right-0 top-0 h-full w-1 cursor-col-resize bg-border opacity-0 hover:opacity-100;
}

/* Loading state */
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>