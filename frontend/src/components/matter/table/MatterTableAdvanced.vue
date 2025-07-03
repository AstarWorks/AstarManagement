<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  useVueTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  FlexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type RowSelectionState
} from '@tanstack/vue-table'
import { ArrowUpDown, ChevronDown, Settings2, Download, FileText, Printer } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { useKanbanStore } from '~/stores/kanban'
import { storeToRefs } from 'pinia'
import type { Matter, MatterStatus, MatterPriority } from '~/types/matter'
import { formatDate } from '~/utils/formatters'
import EditableCell from './EditableCell.vue'
import BulkActionToolbar from '../BulkActionToolbar.vue'

interface Props {
  density?: 'compact' | 'comfortable' | 'spacious'
  showColumnVisibility?: boolean
  enableInlineEdit?: boolean
  enableBulkOperations?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  density: 'comfortable',
  showColumnVisibility: true,
  enableInlineEdit: true,
  enableBulkOperations: true
})

const emit = defineEmits<{
  'matter-click': [matter: Matter]
  'matter-edit': [matter: Matter]
  'matter-update': [matterId: string, field: keyof Matter, value: any]
  'bulk-delete': [matters: Matter[]]
  'bulk-status-update': [matters: Matter[], status: MatterStatus]
  'bulk-export': [matters: Matter[], format: 'csv' | 'excel']
}>()

// Get store
const kanbanStore = useKanbanStore()
const { filteredMatters: matters, isLoading } = storeToRefs(kanbanStore)

// Table state
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref<RowSelectionState>({})
const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 50,
})

// Inline editing state
const editingCell = ref<{ row: string; column: string } | null>(null)
const savingCells = ref<Set<string>>(new Set())
const editErrors = ref<Record<string, string>>({})

// Load saved preferences
onMounted(() => {
  const savedColumns = localStorage.getItem('matter-table-columns-advanced')
  if (savedColumns) {
    columnVisibility.value = JSON.parse(savedColumns)
  }
  
  const savedDensity = localStorage.getItem('matter-table-density')
  if (savedDensity) {
    // Handle density if needed
  }
})

// Save column visibility
watch(columnVisibility, (newVisibility) => {
  localStorage.setItem('matter-table-columns-advanced', JSON.stringify(newVisibility))
}, { deep: true })

// Column helper
const columnHelper = createColumnHelper<Matter>()

// Start inline edit
const startInlineEdit = (rowId: string, columnId: string) => {
  if (!props.enableInlineEdit) return
  
  // Cancel any existing edit
  if (editingCell.value) {
    cancelInlineEdit()
  }
  
  editingCell.value = { row: rowId, column: columnId }
  
  // Clear any previous errors
  const cellKey = `${rowId}-${columnId}`
  delete editErrors.value[cellKey]
}

// Cancel inline edit
const cancelInlineEdit = () => {
  editingCell.value = null
}

// Save inline edit
const saveInlineEdit = async (rowId: string, columnId: string, value: any) => {
  const matter = matters.value.find(m => m.id === rowId)
  if (!matter) return
  
  const cellKey = `${rowId}-${columnId}`
  savingCells.value.add(cellKey)
  
  try {
    // Validate the value
    const isValid = await validateFieldValue(columnId as keyof Matter, value, matter)
    if (!isValid) {
      throw new Error('Invalid value')
    }
    
    // Emit update event
    emit('matter-update', rowId, columnId as keyof Matter, value)
    
    // Clear editing state
    editingCell.value = null
    delete editErrors.value[cellKey]
    
  } catch (error) {
    editErrors.value[cellKey] = error instanceof Error ? error.message : 'Validation failed'
  } finally {
    savingCells.value.delete(cellKey)
  }
}

// Validate field value
const validateFieldValue = async (field: keyof Matter, value: any, matter: Matter): Promise<boolean> => {
  switch (field) {
    case 'title':
      return typeof value === 'string' && value.trim().length >= 3
    case 'caseNumber':
      return typeof value === 'string' && /^[A-Z0-9-]+$/.test(value)
    case 'clientName':
      return typeof value === 'string' && value.trim().length > 0
    case 'status':
      return ['INTAKE', 'INITIAL_REVIEW', 'IN_PROGRESS', 'REVIEW', 'WAITING_CLIENT', 'READY_FILING', 'CLOSED'].includes(value)
    case 'priority':
      return ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(value)
    case 'dueDate':
      return !value || !isNaN(new Date(value).getTime())
    default:
      return true
  }
}

// Handle keyboard navigation
const handleCellKeydown = (event: KeyboardEvent, rowIndex: number, columnIndex: number) => {
  if (!editingCell.value) return
  
  const currentRow = table.value.getRowModel().rows[rowIndex]
  const currentCell = currentRow?.getVisibleCells()[columnIndex]
  
  if (!currentCell) return
  
  switch (event.key) {
    case 'Tab':
      event.preventDefault()
      navigateToNextCell(rowIndex, columnIndex, event.shiftKey ? -1 : 1)
      break
    case 'Enter':
      event.preventDefault()
      navigateToNextRow(rowIndex, columnIndex, event.shiftKey ? -1 : 1)
      break
    case 'Escape':
      cancelInlineEdit()
      break
  }
}

// Navigate to next cell
const navigateToNextCell = (rowIndex: number, columnIndex: number, direction: number) => {
  const rows = table.value.getRowModel().rows
  const currentRow = rows[rowIndex]
  const cells = currentRow?.getVisibleCells()
  
  if (!cells) return
  
  let nextColumnIndex = columnIndex + direction
  let nextRowIndex = rowIndex
  
  // Wrap to next/previous row
  if (nextColumnIndex >= cells.length) {
    nextColumnIndex = 1 // Skip selection column
    nextRowIndex = Math.min(rowIndex + 1, rows.length - 1)
  } else if (nextColumnIndex < 1) { // Skip selection column
    nextColumnIndex = cells.length - 1
    nextRowIndex = Math.max(rowIndex - 1, 0)
  }
  
  const nextRow = rows[nextRowIndex]
  const nextCell = nextRow?.getVisibleCells()[nextColumnIndex]
  
  if (nextCell && isEditableColumn(nextCell.column.id)) {
    startInlineEdit(nextRow.id, nextCell.column.id)
  }
}

// Navigate to next row
const navigateToNextRow = (rowIndex: number, columnIndex: number, direction: number) => {
  const rows = table.value.getRowModel().rows
  const nextRowIndex = Math.max(0, Math.min(rowIndex + direction, rows.length - 1))
  const nextRow = rows[nextRowIndex]
  const nextCell = nextRow?.getVisibleCells()[columnIndex]
  
  if (nextCell && isEditableColumn(nextCell.column.id)) {
    startInlineEdit(nextRow.id, nextCell.column.id)
  }
}

// Check if column is editable
const isEditableColumn = (columnId: string): boolean => {
  return ['title', 'clientName', 'status', 'priority', 'dueDate'].includes(columnId)
}

// Get cell editing state
const getCellEditState = (rowId: string, columnId: string) => {
  const cellKey = `${rowId}-${columnId}`
  return {
    isEditing: editingCell.value?.row === rowId && editingCell.value?.column === columnId,
    isSaving: savingCells.value.has(cellKey),
    error: editErrors.value[cellKey]
  }
}

// Column definitions with inline editing
const columns = computed(() => [
  // Selection column
  columnHelper.display({
    id: 'select',
    header: ({ table }) => h(
      Checkbox,
      {
        checked: table.getIsAllPageRowsSelected(),
        indeterminate: table.getIsSomePageRowsSelected(),
        onUpdate:checked: table.getToggleAllPageRowsSelectedHandler()
      }
    ),
    cell: ({ row }) => h(
      Checkbox,
      {
        checked: row.getIsSelected(),
        onUpdate:checked: row.getToggleSelectedHandler()
      }
    ),
    size: 40,
  }),
  
  // Matter Number - editable
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
    cell: ({ row }) => {
      const cellState = getCellEditState(row.id, 'caseNumber')
      return h(EditableCell, {
        matter: row.original,
        field: 'caseNumber',
        type: 'text',
        value: row.getValue('caseNumber'),
        isEditing: cellState.isEditing,
        isSaving: cellState.isSaving,
        error: cellState.error,
        required: true,
        onEditStart: () => startInlineEdit(row.id, 'caseNumber'),
        onEditCancel: () => cancelInlineEdit(),
        onEditSave: (value: string) => saveInlineEdit(row.id, 'caseNumber', value)
      })
    },
    size: 150,
  }),
  
  // Title - editable
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
    cell: ({ row }) => {
      const cellState = getCellEditState(row.id, 'title')
      return h(EditableCell, {
        matter: row.original,
        field: 'title',
        type: 'text',
        value: row.getValue('title'),
        isEditing: cellState.isEditing,
        isSaving: cellState.isSaving,
        error: cellState.error,
        required: true,
        onEditStart: () => startInlineEdit(row.id, 'title'),
        onEditCancel: () => cancelInlineEdit(),
        onEditSave: (value: string) => saveInlineEdit(row.id, 'title', value)
      })
    },
    size: 300,
  }),
  
  // Client - editable
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
    cell: ({ row }) => {
      const cellState = getCellEditState(row.id, 'clientName')
      return h(EditableCell, {
        matter: row.original,
        field: 'clientName',
        type: 'text',
        value: row.getValue('clientName'),
        isEditing: cellState.isEditing,
        isSaving: cellState.isSaving,
        error: cellState.error,
        onEditStart: () => startInlineEdit(row.id, 'clientName'),
        onEditCancel: () => cancelInlineEdit(),
        onEditSave: (value: string) => saveInlineEdit(row.id, 'clientName', value)
      })
    },
    size: 150,
  }),
  
  // Status - editable
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
    cell: ({ row }) => {
      const cellState = getCellEditState(row.id, 'status')
      return h(EditableCell, {
        matter: row.original,
        field: 'status',
        type: 'status',
        value: row.getValue('status'),
        isEditing: cellState.isEditing,
        isSaving: cellState.isSaving,
        error: cellState.error,
        onEditStart: () => startInlineEdit(row.id, 'status'),
        onEditCancel: () => cancelInlineEdit(),
        onEditSave: (value: MatterStatus) => saveInlineEdit(row.id, 'status', value)
      })
    },
    size: 140,
  }),
  
  // Priority - editable
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
    cell: ({ row }) => {
      const cellState = getCellEditState(row.id, 'priority')
      return h(EditableCell, {
        matter: row.original,
        field: 'priority',
        type: 'priority',
        value: row.getValue('priority'),
        isEditing: cellState.isEditing,
        isSaving: cellState.isSaving,
        error: cellState.error,
        onEditStart: () => startInlineEdit(row.id, 'priority'),
        onEditCancel: () => cancelInlineEdit(),
        onEditSave: (value: MatterPriority) => saveInlineEdit(row.id, 'priority', value)
      })
    },
    size: 100,
  }),
  
  // Assignee - read-only for now
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
  
  // Due Date - editable
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
      const cellState = getCellEditState(row.id, 'dueDate')
      return h(EditableCell, {
        matter: row.original,
        field: 'dueDate',
        type: 'date',
        value: row.getValue('dueDate'),
        isEditing: cellState.isEditing,
        isSaving: cellState.isSaving,
        error: cellState.error,
        onEditStart: () => startInlineEdit(row.id, 'dueDate'),
        onEditCancel: () => cancelInlineEdit(),
        onEditSave: (value: string) => saveInlineEdit(row.id, 'dueDate', value)
      })
    },
    size: 140,
  }),
  
  // Documents - read-only
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
  
  // Updated - read-only
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
    data: [...matters.value],
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
    enableRowSelection: props.enableBulkOperations,
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

// Selected rows for bulk operations
const selectedRows = computed(() => {
  return Object.keys(rowSelection.value)
    .map(id => matters.value.find(m => m.id === id))
    .filter(Boolean) as Matter[]
})

// Export functions
const exportToCSV = (selectedOnly = false) => {
  const dataToExport = selectedOnly ? selectedRows.value : matters.value
  emit('bulk-export', dataToExport, 'csv')
}

const exportToExcel = (selectedOnly = false) => {
  const dataToExport = selectedOnly ? selectedRows.value : matters.value
  emit('bulk-export', dataToExport, 'excel')
}

// Print function
const printTable = () => {
  window.print()
}

// Bulk operation handlers
const handleBulkDelete = (items: Matter[]) => {
  emit('bulk-delete', items)
  rowSelection.value = {}
}

const handleBulkStatusUpdate = (items: Matter[], status: MatterStatus) => {
  emit('bulk-status-update', items, status)
  rowSelection.value = {}
}

const handleBulkExport = (items: Matter[], format: 'csv' | 'excel') => {
  emit('bulk-export', items, format)
}

const clearSelection = () => {
  rowSelection.value = {}
}

const selectAll = () => {
  const allRowIds = matters.value.reduce((acc, matter) => {
    acc[matter.id] = true
    return acc
  }, {} as RowSelectionState)
  rowSelection.value = allRowIds
}
</script>

<template>
  <div class="matter-table-advanced">
    <!-- Bulk Action Toolbar -->
    <BulkActionToolbar
      v-if="enableBulkOperations"
      :selected-items="selectedRows"
      :total-items="matters.length"
      :disabled="isLoading"
      @action:delete="handleBulkDelete"
      @action:status-update="handleBulkStatusUpdate"
      @action:export="handleBulkExport"
      @selection:clear="clearSelection"
      @selection:all="selectAll"
    />

    <!-- Table Controls -->
    <div class="table-controls">
      <div class="flex items-center gap-2">
        <!-- Inline editing indicator -->
        <div v-if="enableInlineEdit && editingCell" class="text-sm text-muted-foreground flex items-center gap-2">
          <div class="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Editing {{ editingCell.column }}
        </div>
        
        <!-- Selection info -->
        <div v-else-if="selectedRows.length > 0" class="text-sm text-muted-foreground">
          {{ selectedRows.length }} row{{ selectedRows.length > 1 ? 's' : '' }} selected
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Export options -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download class="h-4 w-4 mr-2" />
              Export
              <ChevronDown class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="exportToCSV(false)">
              <FileText class="h-4 w-4 mr-2" />
              Export all to CSV
            </DropdownMenuItem>
            <DropdownMenuItem @click="exportToExcel(false)">
              <FileText class="h-4 w-4 mr-2" />
              Export all to Excel
            </DropdownMenuItem>
            <DropdownMenuSeparator v-if="selectedRows.length > 0" />
            <DropdownMenuItem v-if="selectedRows.length > 0" @click="exportToCSV(true)">
              <FileText class="h-4 w-4 mr-2" />
              Export selected to CSV
            </DropdownMenuItem>
            <DropdownMenuItem v-if="selectedRows.length > 0" @click="exportToExcel(true)">
              <FileText class="h-4 w-4 mr-2" />
              Export selected to Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Print -->
        <Button variant="outline" size="sm" @click="printTable">
          <Printer class="h-4 w-4 mr-2" />
          Print
        </Button>

        <!-- Column visibility toggle -->
        <DropdownMenu v-if="showColumnVisibility">
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 class="h-4 w-4 mr-2" />
              Columns
              <ChevronDown class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-[200px]">
            <div class="px-2 py-1.5 text-sm font-semibold">Toggle columns</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="column in table.getAllColumns().filter(col => col.getCanHide())"
              :key="column.id"
              @click="() => column.toggleVisibility()"
              class="flex items-center gap-2"
            >
              <Checkbox
                :checked="column.getIsVisible()"
                @click.stop="() => column.toggleVisibility()"
              />
              {{ column.id }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    
    <!-- Table -->
    <div class="table-container" @keydown="handleCellKeydown">
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
                <FlexRender
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                  v-if="!header.isPlaceholder"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="table.getRowModel().rows?.length">
              <tr
                v-for="(row, rowIndex) in table.getRowModel().rows"
                :key="row.id"
                :class="[
                  'table-row',
                  densityClasses,
                  row.getIsSelected() && 'selected'
                ]"
              >
                <td
                  v-for="(cell, cellIndex) in row.getVisibleCells()"
                  :key="cell.id"
                  :style="{ width: `${cell.column.getSize()}px` }"
                  class="table-cell"
                  @keydown="(e) => handleCellKeydown(e, rowIndex, cellIndex)"
                  tabindex="0"
                >
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
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
              @change="table.setPageSize(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="pageSize in [10, 20, 30, 50, 100]" :key="pageSize" :value="pageSize">
                {{ pageSize }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Inline editing instructions -->
    <div v-if="enableInlineEdit" class="editing-instructions">
      <div class="text-xs text-muted-foreground">
        <strong>Editing:</strong> Click to edit • <kbd>Enter</kbd> next row • <kbd>Tab</kbd> next cell • <kbd>Esc</kbd> cancel
      </div>
    </div>
  </div>
</template>

<style scoped>
.matter-table-advanced {
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

.table-cell:focus {
  @apply outline-none ring-2 ring-primary/20 ring-inset;
}

.table-pagination {
  @apply border-t p-4;
}

.editing-instructions {
  @apply border-t p-2 bg-muted/30;
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

/* Print styles */
@media print {
  .table-controls,
  .table-pagination,
  .editing-instructions {
    @apply hidden;
  }
  
  .matter-table-advanced {
    @apply h-auto;
  }
  
  .table-container {
    @apply overflow-visible;
  }
  
  .table-wrapper {
    @apply overflow-visible;
  }
  
  .table-header {
    @apply static;
  }
  
  .table-row {
    @apply break-inside-avoid;
  }
}

/* Keyboard navigation hints */
kbd {
  @apply inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded;
}
</style>