<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <RecordListToolbar
        :search-query="searchQuery"
        :filterable-columns="filterableColumns"
        :available-columns="allColumns"
        :visible-columns="[...visibleColumns]"
        :filters="filters"
        :active-filter-count="activeFilterCount"
        :selected-count="selectedCount"
        :density="density"
        :show-pinning-controls="!!pinning"
        @update:search="searchQuery = $event"
        @filter="handleFilter"
        @clear-filters="clearFilters"
        @toggle-column="toggleColumnVisibility"
        @change-density="setDensity"
        @clear-all-pins="pinning?.clearAllPins()"
        @reset-to-default="resetToDefault"
        @clear-selection="clearSelection"
        @duplicate-selected="duplicateSelected"
        @delete-selected="handleDeleteSelected"
        @export="exportRecords"
        @create="openCreateDialog"
    />

    <!-- Active Filters Display -->
    <RecordListFilters
        :filters="filters"
        :active-filter-count="activeFilterCount"
        :get-column-display-name="getColumnDisplayName"
        :format-filter-value="formatFilterValue"
        @remove-filter="setFilter($event, null)"
        @clear-filters="clearFilters"
    />

    <!-- Data Table -->
    <div class="rounded-lg border">
      <!-- Loading state -->
      <div v-if="loading && records.length === 0" class="p-8">
        <div class="space-y-4">
          <Skeleton class="h-12 w-full"/>
          <Skeleton class="h-12 w-full"/>
          <Skeleton class="h-12 w-full"/>
        </div>
      </div>

      <!-- Empty state (no records at all) -->
      <RecordListEmpty
          v-else-if="!loading && isEmptyState"
          @create="openCreateDialog"
      />
      
      <!-- Filter empty state (no matching records) -->
      <RecordListFilterEmpty
          v-else-if="!loading && records.length === 0 && hasActiveFilters"
          @clear-filters="clearAllFilters"
      />

      <!-- Data table -->
      <RecordListTable
          v-else
          :table="table"
          :columns="columns"
          :has-aggregation="hasAggregation"
          :get-cell-class="getCellClass"
          :pinning="pinning"
          :pinning-styles="pinningStyles"
          :pinned-row-indices="pinnedRowIndices"
          :can-resize-column="canResizeColumn"
          :column-size-vars="columnSizeVars"
          :is-resizing-column="isResizingColumn"
          @edit-record="openEditDialog"
          @duplicate-record="duplicateRecord"
          @delete-record="openDeleteDialog"
          @view-record="openViewDialog"
      />

      <!-- Pagination -->
      <RecordListPagination
          ref="paginationRef"
          :has-more="hasMore"
          :loading="loading"
          @load-more="loadMore"
      />
    </div>

    <!-- Dialogs -->
    <RecordCreateDialog
        :open="dialogs.create"
        :table-id="tableId"
        :properties="properties"
        @update:open="closeDialog('create')"
        @success="handleCreateSuccess"
    />

    <RecordEditDialog
        :open="dialogs.edit"
        :record="selectedRecord as any"
        :properties="properties"
        :mode="'edit'"
        @update:open="closeDialog('edit')"
        @success="handleEditSuccess"
    />

    <RecordEditDialog
        :open="dialogs.view"
        :record="selectedRecord as any"
        :properties="properties"
        :mode="'view'"
        @update:open="closeDialog('view')"
    />

    <Dialog :open="dialogs.delete" @update:open="closeDialog('delete')">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('modules.table.record.delete.title') }}</DialogTitle>
          <DialogDescription>
            {{ deleteMessage }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="closeDialog('delete')">
            {{ $t('foundation.actions.basic.cancel') }}
          </Button>
          <Button
              variant="destructive"
              @click="confirmDelete"
          >
            {{ $t('foundation.actions.basic.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import {h, onMounted, toRef} from 'vue'
import {useInfiniteScroll, useDebounceFn} from '@vueuse/core'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnSizingState,
  type Column,
  type Row,
  functionalUpdate,
} from '@tanstack/vue-table'

// Import Composables
import {useRecordData} from '../../../composables/record/useRecordData'
import {useRecordFilters} from '../../../composables/record/useRecordFilters'
import {useRecordSorting} from '../../../composables/record/useRecordSorting'
import {useRecordSelection} from '../../../composables/record/useRecordSelection'
import {useRecordExport} from '../../../composables/record/useRecordExport'
import {useRecordDialogs} from '../../../composables/record/useRecordDialogs'
import {usePinning} from '../../../composables/usePinning'
import {usePinningStyles} from '../../../composables/usePinningStyles'
import {useTableEditing} from '../../../composables/useTableEditing'

// Import existing UseRecordList for view settings until refactored
import {useRecordList} from '../../../composables/useRecordList'

// Import Child Components
import RecordListToolbar from './RecordListToolbar.vue'
import RecordListFilters from './RecordListFilters.vue'
import RecordListEmpty from './RecordListEmpty.vue'
import RecordListFilterEmpty from './RecordListFilterEmpty.vue'
import RecordListTable from './RecordListTable.vue'
import RecordListPagination from './RecordListPagination.vue'

// Import existing components
import RecordCell from '../RecordCell.vue'
import EditableCell from '../EditableCell.vue'
import RecordActionsCell from '../RecordActionsCell.vue'
import RecordCreateDialog from '../RecordCreateDialog.vue'
import RecordEditDialog from '../RecordEditDialog.vue'

import type {RecordResponse, PropertyDefinitionDto} from '../../../types'
import type {PropertyValue} from '~/types'
import type {EditableRecord, RecordEditRepository} from '../../../types/inline-editing'

// Props
const props = defineProps<{
  tableId: string
  properties: Record<string, PropertyDefinitionDto>
  enablePinning?: boolean
  initialPinning?: {
    columns?: { left?: string[], right?: string[] }
    rows?: { top?: string[], bottom?: string[] }
  }
}>()

// Emits
const emit = defineEmits<{
  'update:recordCount': [count: number]
}>()

// Composables
const {t} = useI18n()

// Use record data management
const {
  records,
  totalCount,
  loading,
  hasMore,
  loadRecords,
  loadMore,
  refresh,
  createRecord,
  updateRecord,
  deleteRecord,
  deleteRecordsBatch,
  createRecordsBatch
} = useRecordData(props.tableId)

// Use table editing functionality
const tableRepository = {
  createRecord,
  updateRecord,
  deleteRecord
}

const {
  activeCell,
  newRecordRow,
  tableData: editableTableData,
  focusCell,
  blurCell,
  updateCellValue,
  validateField,
  autoSaveState,
  isEditingNewRecord,
  showNewRecordRow,
  startNewRecord,
  cancelNewRecord,
  hideNewRecord
} = useTableEditing(props.tableId, records, toRef(props, 'properties'), tableRepository as RecordEditRepository)

// キーボードナビゲーション機能
const navigateCell = (direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift-tab') => {
  if (!activeCell.value) return

  const currentRecordId = activeCell.value.recordId
  const currentPropertyKey = activeCell.value.propertyKey

  // プロパティのリストを取得
  const propertyKeys = Object.keys(props.properties)
  const currentPropIndex = propertyKeys.indexOf(currentPropertyKey)

  // テーブルデータからレコードのリストを取得（フィルター済み）
  const recordList = filteredEditableTableData.value
  const currentRecordIndex = recordList.findIndex(r => r.id === currentRecordId)

  let nextRecordIndex = currentRecordIndex
  let nextPropIndex = currentPropIndex

  switch (direction) {
    case 'left':
      nextPropIndex = Math.max(0, currentPropIndex - 1)
      break
    case 'right':
    case 'tab':
      nextPropIndex = currentPropIndex + 1
      if (nextPropIndex >= propertyKeys.length) {
        // 次の行の最初のセルに移動
        nextPropIndex = 0
        nextRecordIndex = Math.min(recordList.length - 1, currentRecordIndex + 1)
      }
      break
    case 'shift-tab':
      nextPropIndex = currentPropIndex - 1
      if (nextPropIndex < 0) {
        // 前の行の最後のセルに移動
        nextPropIndex = propertyKeys.length - 1
        nextRecordIndex = Math.max(0, currentRecordIndex - 1)
      }
      break
    case 'up':
      nextRecordIndex = Math.max(0, currentRecordIndex - 1)
      break
    case 'down':
      nextRecordIndex = Math.min(recordList.length - 1, currentRecordIndex + 1)
      break
  }

  // 新しい位置にフォーカス
  const nextRecord = recordList[nextRecordIndex]
  const nextProperty = propertyKeys[nextPropIndex]

  if (nextRecord && nextProperty) {
    focusCell(nextRecord.id || 'new-record', nextProperty)
  }
}

// Use existing useRecordList for view settings (to be refactored later)
const {
  visibleColumns,
  activeSettings,
  toggleColumnVisibility,
  setDensity,
  resetToDefault
} = useRecordList(props.tableId, props.properties, {autoLoad: false})

// Use record filtering
const {
  filters,
  searchQuery,
  filteredRecords,
  activeFilterCount,
  filterableColumns,
  setFilter,
  clearFilters,
  getColumnDisplayName,
  formatFilterValue,
  hasActiveFilters
} = useRecordFilters(records, props.properties, toRef(() => [...visibleColumns.value]))

// Use record sorting
const sortBy = ref(activeSettings.value?.sortBy || null)
const sortOrder = ref<'asc' | 'desc'>(activeSettings.value?.sortOrder || 'desc')
const {sortedRecords, setSortBy} = useRecordSorting(filteredRecords, sortBy, sortOrder)

// Use record selection
const {
  selectedRecordIds,
  selectedCount,
  selectedRecords,
  toggleRecordSelection,
  clearSelection
} = useRecordSelection(sortedRecords)

// Use record export
const {exportRecords} = useRecordExport(sortedRecords, toRef(() => [...visibleColumns.value]), props.tableId)

// Computed: Empty state detection
const isEmptyState = computed(() => {
  // True empty state: no records at all, no filters, not creating new
  const hasNoRecords = records.value.length === 0
  const hasNoFilters = !hasActiveFilters.value
  const isNotCreatingNew = !showNewRecordRow.value
  
  return hasNoRecords && hasNoFilters && isNotCreatingNew
})

// Clear all filters helper
const clearAllFilters = () => {
  clearFilters()
  searchQuery.value = ''
}

// Use record dialogs
const {
  dialogs,
  selectedRecord,
  deleteMessage,
  openCreateDialog: openCreateDialogOriginal,
  openEditDialog,
  openViewDialog,
  openDeleteDialog,
  openBatchDeleteDialog,
  closeDialog,
  handleCreateSuccess,
  handleEditSuccess
} = useRecordDialogs()

// レコード追加ボタンのハンドラー（インライン作成を使用）
const openCreateDialog = () => {
  startNewRecord()
}

// Rest of the component logic...
// [Due to length constraints, I'll continue with the key parts]

// Computed
const allColumns = computed(() => {
  return Object.entries(props.properties).map(([key, prop]) => ({
    ...prop,
    key
  }))
})

const density = computed(() => activeSettings.value?.density || 'normal')

// Dynamic column sizes based on density
const getSelectColumnSize = () => {
  switch (density.value) {
    case 'compact': return 28
    case 'comfortable': return 36
    default: return 32 // normal
  }
}

const getActionsColumnSize = () => {
  switch (density.value) {
    case 'compact': return 56
    case 'comfortable': return 72
    default: return 64 // normal
  }
}

// Column definitions for TanStack Table
const columns = computed<ColumnDef<RecordResponse>[]>(() => {
  const selectSize = getSelectColumnSize()
  const actionsSize = getActionsColumnSize()
  
  const cols: ColumnDef<RecordResponse>[] = [
    // Selection column
    {
      id: 'select',
      header: ({table}) => h('div', {
        class: 'flex items-center justify-center w-full'
      }, [
        h('input', {
          type: 'checkbox',
          checked: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected(),
          onChange: (event: Event) => table.toggleAllPageRowsSelected(Boolean((event.target as HTMLInputElement).checked)),
          'aria-label': 'Select all',
          class: 'h-3.5 w-3.5 rounded border-gray-300'
        })
      ]),
      cell: ({row}) => h('div', {
        class: 'flex items-center justify-center w-full'
      }, [
        h('input', {
          type: 'checkbox',
          checked: row.getIsSelected(),
          disabled: !row.getCanSelect(),
          onChange: (event: Event) => row.toggleSelected(Boolean((event.target as HTMLInputElement).checked)),
          'aria-label': 'Select row',
          class: 'h-3.5 w-3.5 rounded border-gray-300'
        })
      ]),
      enableSorting: false,
      enableHiding: false,
      enablePinning: true,
      enableResizing: false,
      size: selectSize,
      minSize: selectSize,
      maxSize: selectSize
    }
  ]

  // Data columns from properties
  Object.entries(props.properties).forEach(([key, prop]) => {
    // Default column sizes based on property type
    const getDefaultSize = () => {
      switch (prop.type) {
        case 'date': return 150
        case 'number': return 120
        case 'text': return 200
        case 'select': return 150
        case 'relation': return 180
        case 'file': return 150
        default: return 150
      }
    }
    
    cols.push({
      id: key,
      accessorFn: (row) => row.data?.[key],
      header: prop.displayName || key,
      size: getDefaultSize(),
      minSize: 80,
      maxSize: 400,
      cell: ({row, getValue}) => {
        const record = row.original as EditableRecord
        const isNewRecord = record._isNewRecord === true
        // 新規レコードの場合、リアクティブなデータを取得
        const cellValue = isNewRecord ?
            newRecordRow.value.data[key] :
            getValue() as PropertyValue

        return h(EditableCell as any, {
          record,
          property: prop,
          value: cellValue,
          isActive: activeCell.value?.recordId === (record.id || 'new-record') && activeCell.value?.propertyKey === key,
          isRequired: prop.required || false,
          validationErrors: record._validationErrors?.[key] || [],
          density: density.value,
          onFocus: () => focusCell(record.id || 'new-record', key),
          onBlur: blurCell,
          onChange: (value: PropertyValue) => updateCellValue(record.id || 'new-record', key, value),
          onNavigate: navigateCell,
          onCancel: cancelNewRecord
        })
      },
      footer: (prop.type === 'number') ?
          ({table}) => {
            const total = table.getFilteredRowModel().rows
                .reduce((sum, row) => {
                  const value = row.original.data?.[key]
                  return sum + (typeof value === 'number' ? value : 0)
                }, 0)

            const config = prop.config as { currency?: string } | undefined
            if (config?.currency || prop.key?.includes('price') || prop.key?.includes('amount')) {
              return h('div', {class: 'font-semibold text-right'}, `¥${total.toLocaleString()}`)
            }
            return h('div', {class: 'font-semibold text-right'}, total.toLocaleString())
          } : undefined
    })
  })

  // Actions column
  cols.push({
    id: 'actions',
    header: () => h('div', {class: 'text-right'}, t('foundation.common.labels.actions')),
    enablePinning: true,
    cell: ({row}) => h(RecordActionsCell, {
      density: density.value,
      onDuplicate: () => duplicateRecord(row.original),
      onDelete: () => openDeleteDialog(row.original)
    }),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: actionsSize,
    minSize: actionsSize,
    maxSize: actionsSize
  })

  return cols
})

// Filtered and editable table data integration
const filteredEditableTableData = computed(() => {
  // Convert filtered/sorted records to editable format
  const editableRecords = sortedRecords.value.map(record => ({
    ...record,
    _isNewRecord: false,
    _pendingChanges: {},
    _validationErrors: {}
  }))

  // Add new record row if it's being shown
  if (showNewRecordRow.value && newRecordRow.value) {
    return [newRecordRow.value, ...editableRecords]
  }

  return editableRecords
})

// TanStack Table setup
const sorting = ref<SortingState>([])
const rowSelection = ref<Record<string, boolean>>({})
const columnVisibility = ref<Record<string, boolean>>({})

// Column resizing state (watch-free implementation)
const columnSizing = ref<ColumnSizingState>({})

// Column sizing info for resize feedback
const columnSizingInfo = computed(() => table.getState().columnSizingInfo)
const isResizingColumn = computed(() => columnSizingInfo.value.isResizingColumn !== null)

// CSS variables for performant column sizing
const columnSizeVars = computed(() => {
  // Pre-calculate all column sizes for CSS variable injection
  const sizes: Record<string, string> = {}
  
  table.getAllColumns().forEach(column => {
    const size = column.getSize()
    sizes[`--col-${column.id}-size`] = `${size}px`
  })
  
  // Add resizing indicator size if actively resizing
  if (columnSizingInfo.value.deltaOffset != null) {
    sizes['--resize-delta'] = `${columnSizingInfo.value.deltaOffset}px`
  }
  
  return sizes
})

// Initialize column sizes from localStorage
onMounted(() => {
  try {
    const savedSizes = localStorage.getItem(`column-sizes-${props.tableId}`)
    if (savedSizes) {
      columnSizing.value = JSON.parse(savedSizes)
    }
  } catch (error) {
    console.warn('Failed to load saved column sizes:', error)
  }
})

// Debounced persistence for column sizes (side effects isolated)
const debouncedPersistColumnSizes = useDebounceFn((sizing: ColumnSizingState) => {
  try {
    localStorage.setItem(`column-sizes-${props.tableId}`, JSON.stringify(sizing))
  } catch (error) {
    console.warn('Failed to persist column sizes:', error)
  }
}, 500)

// Safety check function for column resizing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const canResizeColumn = (column: Column<any>) => {
  // Prevent resizing in unsafe conditions
  return column.getCanResize() &&               // Column allows resizing
      !column.getIsPinned() &&               // Not pinned (avoid layout conflicts)
      !isEditingNewRecord.value &&           // Not in new record creation mode
      !autoSaveState.value.isSaving &&       // Not during auto-save
      column.id !== 'select' &&              // Exclude selection column
      column.id !== 'actions'                // Exclude actions column
}

const table = useVueTable({
  get data() {
    return filteredEditableTableData.value
  },
  get columns() {
    return columns.value
  },
  enableColumnResizing: true,
  columnResizeMode: 'onEnd', // Update when resize completes (fixes double movement)
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    get sorting() {
      return sorting.value
    },
    get rowSelection() {
      return rowSelection.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get columnSizing() {
      return columnSizing.value
    }
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onRowSelectionChange: (updater) => {
    rowSelection.value = typeof updater === 'function'
        ? updater(rowSelection.value)
        : updater
  },
  onColumnSizingChange: (updater) => {
    // Pure state update without side effects
    const newSizing = functionalUpdate(updater, columnSizing.value)
    columnSizing.value = newSizing

    // Side effects isolated in debounced function
    debouncedPersistColumnSizes(newSizing)
  },
  getRowId: (row) => row.id || '',
  enableColumnPinning: props.enablePinning ?? true,
  enableRowPinning: props.enablePinning ?? true
})

// Pinning setup
const tableRef = toRef(table)
const pinning = props.enablePinning !== false ? usePinning(tableRef, props.tableId, {
  initialPinning: props.initialPinning
}) : null
const pinningStyles = props.enablePinning !== false ? usePinningStyles() : null

// Pinning state monitoring (production ready)
watch(() => pinning?.pinningState.value, (state) => {
  // State change handling can be added here if needed
}, {immediate: true, deep: true})

// Aggregation
const hasAggregation = computed(() => {
  return Object.entries(props.properties).some(([key, prop]) =>
      prop.type === 'number' && visibleColumns.value.includes(key)
  )
})

const pinnedRowIndices = computed(() => {
  const indices = new Map<string, number>()
  if (!pinning) return indices

  let topIndex = 0
  let bottomIndex = 0

  table.getRowModel().rows.forEach(row => {
    const pinPosition = pinning.isPinnedRow(row.id)
    if (pinPosition === 'top') {
      indices.set(row.id, topIndex++)
    } else if (pinPosition === 'bottom') {
      indices.set(row.id, bottomIndex++)
    }
  })

  return indices
})

// Methods
const handleFilter = (columnKey: string, value: unknown) => {
  setFilter(columnKey, value)
}

const handleDeleteSelected = () => {
  openBatchDeleteDialog(selectedRecords.value)
}

const getCellClass = (column: string) => {
  const property = props.properties[column]
  if (!property) return ''

  const classes = []

  const densityValue = density.value
  if (densityValue === 'compact') {
    classes.push('py-1 text-sm')
  } else if (densityValue === 'normal') {
    classes.push('py-2')
  } else if (densityValue === 'comfortable') {
    classes.push('py-3')
  }

  if (property.type === 'number') {
    classes.push('text-right tabular-nums')
  }

  return classes.join(' ')
}

const duplicateRecord = async (record: RecordResponse) => {
  if (!record.tableId) return
  try {
    await createRecord({
      tableId: record.tableId,
      data: {...(record.data || {})}
    })
  } catch {
    // Error already handled in composable
  }
}

const duplicateSelected = async () => {
  if (selectedRecords.value.length === 0) return

  try {
    const recordsData = selectedRecords.value.map(r => ({
      tableId: r.tableId || props.tableId,
      data: r.data || {}
    }))

    await createRecordsBatch(recordsData)
    clearSelection()
  } catch {
    // Error already handled in composable
  }
}

const confirmDelete = async () => {
  try {
    if (dialogs.value.delete) {
      if (selectedRecord.value?.id) {
        await deleteRecord(selectedRecord.value.id)
      } else if (selectedRecords.value.length > 0) {
        const ids = selectedRecords.value.map(r => r.id).filter(Boolean) as string[]
        await deleteRecordsBatch(ids)
        clearSelection()
      }
    }
  } finally {
    closeDialog('delete')
  }
}

// Infinite scroll
const paginationRef = ref<InstanceType<typeof RecordListPagination>>()
onMounted(() => {
  const trigger = paginationRef.value?.loadMoreTrigger
  if (trigger) {
    useInfiniteScroll(
        trigger,
        () => {
          if (hasMore.value && !loading.value) {
            loadMore()
          }
        },
        {distance: 10}
    )
  }
})

// Emit record count updates
watch(totalCount, (count) => {
  emit('update:recordCount', count)
}, {immediate: true})

// Initial load
onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
/* Import existing styles from original RecordList.vue */
/* テーブル全体のスタイル改善 */
:deep(.sticky-table-container) {
  background-color: hsl(var(--background));
  border-color: hsl(var(--border));
}

:deep(table) {
  background-color: hsl(var(--background));
}

:deep(thead th) {
  background-color: hsl(var(--muted));
  border-bottom: 2px solid hsl(var(--border));
  color: hsl(var(--foreground));
  font-weight: 600;
  font-size: 0.8125rem;
  padding: 0.5rem 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

:deep(tbody tr) {
  background-color: hsl(var(--background));
  transition: background-color 0.15s;
}

:deep(tbody tr:hover) {
  background-color: hsl(var(--primary) / 0.05);
}

:deep(tbody td) {
  padding: 0.375rem 0.75rem;
  color: hsl(var(--foreground));
  font-size: 0.8125rem;
  line-height: 1.25rem;
  font-weight: 400;
}

:deep(tbody tr[data-state="selected"]) {
  background-color: hsl(var(--accent));
}

/* Enhanced Pinned styles for better compatibility with EditableCell */
.pinned-column {
  position: sticky !important;
  z-index: 10;
  background-color: hsl(var(--background));
  box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.1);
}

.pinned-row {
  position: sticky !important;
  z-index: 20;
  background-color: hsl(var(--muted));
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

.pinned-cell-intersection {
  position: sticky !important;
  z-index: 30;
  background-color: hsl(var(--accent));
  box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

/* Ensure sticky positioning works with TanStack table columns */
:deep(th[style*="position: sticky"]),
:deep(td[style*="position: sticky"]) {
  background-color: hsl(var(--background)) !important;
  --z-index: 10;
}

/* Enhanced support for pinned elements with EditableCell */
:deep(.inherit-position) {
  position: inherit !important;
}

/* Fix sticky header overlays */
:deep(thead th[style*="position: sticky"]) {
  z-index: 40 !important;
  background-color: hsl(var(--muted)) !important;
}

/* Force sticky headers to work properly */
:deep([data-slot="sticky-table-header"]) {
  position: sticky !important;
  top: 0 !important;
  z-index: 40 !important;
  background-color: hsl(var(--background)) !important;
}

/* Ensure pinned column styles are applied correctly */
:deep([style*="left:"]) {
  position: sticky !important;
  z-index: 10 !important;
  background-color: hsl(var(--background)) !important;
  box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.1) !important;
}

:deep([style*="right:"]) {
  position: sticky !important;
  z-index: 10 !important;
  background-color: hsl(var(--background)) !important;
  box-shadow: -2px 0 4px -2px rgba(0, 0, 0, 0.1) !important;
}
</style>