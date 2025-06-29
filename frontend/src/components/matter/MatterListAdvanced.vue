<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { Matter, MatterStatus, MatterPriority } from '~/types/matter'
import type { SortDirection } from '~/types/table'
import type { DataTableColumn } from './DataTable.vue'
import type { AdvancedDataTableColumn } from './DataTableAdvanced.vue'
import VirtualDataTable from './VirtualDataTable.vue'
import FilterBar from './filters/FilterBar.vue'
import { MATTER_FILTER_CONFIGS, MATTER_FILTER_PRESETS } from './filters/FilterConfig'
import type { FilterState } from './filters/FilterConfig'
import { useFilterPersistence } from '~/composables/useFilterPersistence'
import { useDataExport } from '~/composables/useDataExport'
import { useColumnResize } from '~/composables/useColumnResize'
import { useInlineEdit } from '~/composables/useInlineEdit'

interface Props {
  /** Matter data to display */
  data: Matter[]
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: Error | null
  /** Enable advanced features */
  enableVirtualScrolling?: boolean
  /** Enable column resizing */
  enableColumnResize?: boolean
  /** Enable inline editing */
  enableInlineEdit?: boolean
  /** Enable filter persistence */
  enableFilterPersistence?: boolean
  /** Custom filter persistence key */
  persistenceKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  enableVirtualScrolling: true,
  enableColumnResize: true,
  enableInlineEdit: true,
  enableFilterPersistence: true,
  persistenceKey: 'matter-list-filters'
})

const emit = defineEmits<{
  'matter:update': [matter: Matter, field: string, value: any]
  'matter:delete': [matters: Matter[]]
  'matter:status-update': [matters: Matter[], status: MatterStatus]
  'data:sort': [column: string, direction: SortDirection]
  'data:filter': [filters: FilterState]
  'data:export': [matters: Matter[], format: 'csv' | 'excel']
}>()

// Refs
const tableRef = ref<InstanceType<typeof VirtualDataTable>>()

// Column definitions with advanced features
const columns = ref<AdvancedDataTableColumn<Matter>[]>([
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    resizable: true,
    editable: true,
    required: true,
    width: 250,
    minWidth: 150,
    maxWidth: 400,
    validator: (value: string) => {
      if (!value || value.trim().length < 3) {
        return 'Title must be at least 3 characters'
      }
      return null
    }
  },
  {
    key: 'client.name',
    header: 'Client',
    sortable: true,
    resizable: true,
    width: 180,
    minWidth: 120,
    formatter: (value: any, matter: Matter) => {
      return matter.client?.name || '-'
    }
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    resizable: true,
    editable: true,
    width: 140,
    minWidth: 100,
    formatter: (value: MatterStatus) => {
      const statusMap: Record<MatterStatus, string> = {
        'INTAKE': 'Intake',
        'INITIAL_REVIEW': 'Initial Review',
        'IN_PROGRESS': 'In Progress',
        'REVIEW': 'Review',
        'WAITING_CLIENT': 'Waiting Client',
        'READY_FILING': 'Ready Filing',
        'CLOSED': 'Closed'
      }
      return statusMap[value] || value
    }
  },
  {
    key: 'priority',
    header: 'Priority',
    sortable: true,
    resizable: true,
    editable: true,
    width: 120,
    minWidth: 80,
    formatter: (value: MatterPriority) => {
      const priorityMap: Record<MatterPriority, string> = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High',
        'URGENT': 'Urgent'
      }
      return priorityMap[value] || value
    }
  },
  {
    key: 'assignee.name',
    header: 'Assigned To',
    sortable: true,
    resizable: true,
    width: 150,
    minWidth: 100,
    formatter: (value: any, matter: Matter) => {
      return matter.assignee?.name || 'Unassigned'
    }
  },
  {
    key: 'dueDate',
    header: 'Due Date',
    sortable: true,
    resizable: true,
    width: 130,
    minWidth: 100,
    formatter: (value: Date | string) => {
      if (!value) return '-'
      const date = value instanceof Date ? value : new Date(value)
      return date.toLocaleDateString()
    }
  },
  {
    key: 'createdAt',
    header: 'Created',
    sortable: true,
    resizable: true,
    width: 130,
    minWidth: 100,
    formatter: (value: Date | string) => {
      const date = value instanceof Date ? value : new Date(value)
      return date.toLocaleDateString()
    }
  },
  {
    key: 'updatedAt',
    header: 'Last Updated',
    sortable: true,
    resizable: true,
    width: 130,
    minWidth: 100,
    formatter: (value: Date | string) => {
      const date = value instanceof Date ? value : new Date(value)
      return date.toLocaleDateString()
    }
  }
])

// Composables
const {
  filterState,
  savedPresets,
  initializeFilters,
  updateFilters,
  clearFilters,
  saveAsPreset,
  applyPreset,
  deletePreset,
  getShareableUrl
} = useFilterPersistence({
  storageKey: props.persistenceKey,
  syncWithUrl: props.enableFilterPersistence,
  urlPrefix: 'matter_'
})

const { exportProgress, exportTableData } = useDataExport()

const {
  getColumnWidth,
  setColumnWidth,
  getColumnStyle,
  getResizeHandleProps
} = useColumnResize(columns, {
  persistKey: props.persistenceKey + '-columns'
})

const {
  isCellEditing,
  getCellValue,
  getCellEditState,
  startEdit,
  updateCellValue,
  saveCell,
  cancelEdit,
  handleKeyDown,
  handleBlur,
  handleDoubleClick,
  hasPendingChanges
} = useInlineEdit(
  computed(() => props.data),
  columns,
  (matter: Matter) => matter.id,
  {
    validateOnChange: true,
    saveOnBlur: true,
    cancelOnEscape: true,
    allowedColumns: ['title', 'status', 'priority']
  }
)

// Filter and sort state
const currentSort = ref<{ column: string; direction: SortDirection } | null>(null)
const filteredData = ref<Matter[]>([])

// Apply filters and sorting
const applyFiltersAndSort = () => {
  let result = [...props.data]

  // Apply filters
  if (filterState.value.filters.length > 0 || filterState.value.quickSearch) {
    result = result.filter(matter => {
      // Quick search
      if (filterState.value.quickSearch) {
        const searchTerm = filterState.value.quickSearch.toLowerCase()
        const searchableText = [
          matter.title,
          matter.client?.name,
          matter.status,
          matter.priority,
          matter.assignee?.name,
          matter.description
        ].filter(Boolean).join(' ').toLowerCase()

        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      // Field-specific filters
      return filterState.value.filters.every(filter => {
        const value = filter.field.split('.').reduce((obj, key) => obj?.[key], matter as any)
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value
          case 'contains':
            return String(value || '').toLowerCase().includes(String(filter.value).toLowerCase())
          case 'in':
            return Array.isArray(filter.value) ? filter.value.includes(value) : value === filter.value
          case 'between':
            if (Array.isArray(filter.value) && filter.value.length === 2) {
              const [start, end] = filter.value
              const dateValue = new Date(value)
              return dateValue >= new Date(start) && dateValue <= new Date(end)
            }
            return true
          default:
            return true
        }
      })
    })
  }

  // Apply sorting
  if (currentSort.value) {
    const { column, direction } = currentSort.value
    result.sort((a, b) => {
      const aVal = column.split('.').reduce((obj, key) => obj?.[key], a as any)
      const bVal = column.split('.').reduce((obj, key) => obj?.[key], b as any)
      
      if (aVal === bVal) return 0
      
      const comparison = aVal < bVal ? -1 : 1
      return direction === 'asc' ? comparison : -comparison
    })
  }

  filteredData.value = result
}

// Handle events
const handleSort = (column: string, direction: SortDirection) => {
  currentSort.value = { column, direction }
  applyFiltersAndSort()
  emit('data:sort', column, direction)
}

const handleFilterChange = (newFilters: FilterState) => {
  updateFilters(newFilters)
  applyFiltersAndSort()
  emit('data:filter', newFilters)
}

const handlePresetApply = (preset: any) => {
  applyPreset(preset)
}

const handlePresetSave = (name: string, filters: any[]) => {
  saveAsPreset(name, `Saved on ${new Date().toLocaleDateString()}`)
}

const handlePresetDelete = (presetId: string) => {
  deletePreset(presetId)
}

const handleExport = async (format: 'csv' | 'excel') => {
  await exportTableData(filteredData.value, columns.value, {
    format,
    filename: `matters-${new Date().toISOString().split('T')[0]}`
  })
  emit('data:export', filteredData.value, format)
}

const handleBulkExport = async (items: Matter[], format: 'csv' | 'excel') => {
  await exportTableData(items, columns.value, {
    selectedRows: items,
    format,
    filename: `matters-selected-${new Date().toISOString().split('T')[0]}`
  })
}

const handleCellEdit = (matter: Matter, columnKey: string, value: any) => {
  emit('matter:update', matter, columnKey, value)
}

const handleBulkDelete = (items: Matter[]) => {
  emit('matter:delete', items)
}

const handleBulkStatusUpdate = (items: Matter[], status: MatterStatus) => {
  emit('matter:status-update', items, status)
}

// Initialize filters on mount
onMounted(async () => {
  if (props.enableFilterPersistence) {
    await initializeFilters()
  }
  applyFiltersAndSort()
})

// Watch for data changes
watch(() => props.data, () => {
  applyFiltersAndSort()
}, { deep: true })

watch(filterState, () => {
  applyFiltersAndSort()
}, { deep: true })

// Update column widths
const updateColumnWidths = () => {
  columns.value.forEach(column => {
    const width = getColumnWidth(column)
    if (width !== column.width) {
      column.width = width
    }
  })
}

onMounted(() => {
  updateColumnWidths()
})
</script>

<template>
  <div class="matter-list-advanced space-y-4">
    <!-- Filter Bar -->
    <FilterBar
      :configs="MATTER_FILTER_CONFIGS"
      :presets="[...MATTER_FILTER_PRESETS, ...savedPresets]"
      :model-value="filterState"
      :loading="loading"
      @update:model-value="handleFilterChange"
      @preset:apply="handlePresetApply"
      @preset:save="handlePresetSave"
      @preset:delete="handlePresetDelete"
      @export="handleExport"
    />

    <!-- Export Progress -->
    <div v-if="exportProgress.isExporting" class="export-progress">
      <div class="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Icon name="lucide:loader-2" class="h-5 w-5 animate-spin text-primary" />
        <div class="flex-1">
          <p class="text-sm font-medium">{{ exportProgress.status }}</p>
          <div class="w-full bg-secondary rounded-full h-2 mt-1">
            <div 
              class="bg-primary h-2 rounded-full transition-all duration-300"
              :style="{ width: `${exportProgress.progress}%` }"
            />
          </div>
        </div>
        <Badge variant="secondary">{{ exportProgress.progress }}%</Badge>
      </div>
    </div>

    <!-- Pending Changes Warning -->
    <div v-if="hasPendingChanges && enableInlineEdit" class="pending-changes">
      <div class="flex items-center gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
        <Icon name="lucide:alert-triangle" class="h-5 w-5 text-warning" />
        <div class="flex-1">
          <p class="text-sm font-medium">You have unsaved changes</p>
          <p class="text-xs text-muted-foreground">
            Press Enter to save or Escape to cancel individual cells
          </p>
        </div>
        <div class="flex gap-2">
          <Button size="sm" variant="outline" @click="saveAllEdits">
            Save All
          </Button>
          <Button size="sm" variant="ghost" @click="cancelAllEdits">
            Cancel All
          </Button>
        </div>
      </div>
    </div>

    <!-- Advanced Data Table -->
    <VirtualDataTable
      ref="tableRef"
      :columns="columns"
      :data="filteredData"
      :loading="loading"
      :error="error"
      :enable-virtual-scrolling="enableVirtualScrolling"
      :virtual-scroll-threshold="100"
      :item-height="60"
      :selectable="true"
      :bulk-actions="true"
      :sortable="true"
      @sort="handleSort"
      @selection:change="/* Handle selection */"
      @bulk:delete="handleBulkDelete"
      @bulk:status-update="handleBulkStatusUpdate"
      @bulk:export="handleBulkExport"
      @cell:edit="handleCellEdit"
    />

    <!-- Summary Info -->
    <div v-if="filteredData.length > 0" class="summary-info">
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {{ filteredData.length }} of {{ data.length }} matters
        </span>
        <div class="flex items-center gap-4">
          <span v-if="filterState.filters.length > 0">
            {{ filterState.filters.length }} filter{{ filterState.filters.length !== 1 ? 's' : '' }} applied
          </span>
          <Button
            v-if="enableFilterPersistence"
            variant="ghost"
            size="sm"
            @click="() => navigator.clipboard?.writeText(getShareableUrl())"
          >
            <Icon name="lucide:share" class="mr-2 h-4 w-4" />
            Share Filters
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matter-list-advanced {
  @apply w-full;
}

.export-progress,
.pending-changes,
.summary-info {
  @apply animate-in fade-in-0 duration-200;
}

/* Smooth transitions for filter changes */
.matter-list-advanced {
  @apply transition-all duration-200;
}

/* Loading states */
.matter-list-advanced[data-loading="true"] {
  @apply opacity-70 pointer-events-none;
}
</style>