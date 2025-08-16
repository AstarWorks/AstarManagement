import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { z } from 'zod'
import { DEFAULT_EXPENSE_COLUMNS } from '~/modules/expense/config/expenseTableConfig'

/**
 * Zod schemas for column configuration validation
 */
const tableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  sortable: z.boolean().default(false),
  visible: z.boolean().default(true),
  width: z.number().optional(),
  minWidth: z.number().optional(),
  maxWidth: z.number().optional(),
  resizable: z.boolean().default(false),
  align: z.enum(['left', 'center', 'right']).default('left'),
  className: z.string().optional()
})

const columnVisibilitySchema = z.record(z.string(), z.boolean())

export type TableColumn = z.infer<typeof tableColumnSchema>
export type ColumnVisibility = z.infer<typeof columnVisibilitySchema>

/**
 * Table columns composable
 * Manages column visibility, configuration, and persistence
 */
export function useTableColumns(
  defaultColumns: TableColumn[],
  storageKey?: string
) {
  // Validate default columns
  const validatedColumns = z.array(tableColumnSchema).parse(defaultColumns)
  
  // Create initial visibility state from default columns
  const initialVisibility = validatedColumns.reduce((acc, col) => ({
    ...acc,
    [col.key]: col.visible
  }), {} as ColumnVisibility)

  // Persistent column visibility using localStorage
  const columnVisibility = storageKey 
    ? useLocalStorage<ColumnVisibility>(storageKey, initialVisibility)
    : ref<ColumnVisibility>(initialVisibility)

  // Column configuration state
  const columnConfig = ref<TableColumn[]>(validatedColumns)

  // Computed visible columns
  const visibleColumns = computed(() => 
    columnConfig.value.filter(col => columnVisibility.value[col.key] ?? col.visible)
  )

  // Computed hidden columns
  const hiddenColumns = computed(() => 
    columnConfig.value.filter(col => !(columnVisibility.value[col.key] ?? col.visible))
  )

  // Column statistics
  const columnStats = computed(() => ({
    total: columnConfig.value.length,
    visible: visibleColumns.value.length,
    hidden: hiddenColumns.value.length
  }))

  /**
   * Check if a column is visible
   */
  const isColumnVisible = (columnKey: string): boolean => {
    return columnVisibility.value[columnKey] ?? false
  }

  /**
   * Toggle column visibility
   */
  const toggleColumn = (columnKey: string) => {
    const currentState = columnVisibility.value[columnKey] ?? false
    columnVisibility.value[columnKey] = !currentState
  }

  /**
   * Show a specific column
   */
  const showColumn = (columnKey: string) => {
    columnVisibility.value[columnKey] = true
  }

  /**
   * Hide a specific column
   */
  const hideColumn = (columnKey: string) => {
    columnVisibility.value[columnKey] = false
  }

  /**
   * Show multiple columns
   */
  const showColumns = (columnKeys: string[]) => {
    columnKeys.forEach(key => {
      columnVisibility.value[key] = true
    })
  }

  /**
   * Hide multiple columns
   */
  const hideColumns = (columnKeys: string[]) => {
    columnKeys.forEach(key => {
      columnVisibility.value[key] = false
    })
  }

  /**
   * Reset to default column visibility
   */
  const resetColumns = () => {
    columnVisibility.value = { ...initialVisibility }
  }

  /**
   * Show all columns
   */
  const showAllColumns = () => {
    columnConfig.value.forEach(col => {
      columnVisibility.value[col.key] = true
    })
  }

  /**
   * Hide all columns (except required ones if specified)
   */
  const hideAllColumns = (exceptKeys: string[] = []) => {
    columnConfig.value.forEach(col => {
      if (!exceptKeys.includes(col.key)) {
        columnVisibility.value[col.key] = false
      }
    })
  }

  /**
   * Get column configuration by key
   */
  const getColumn = (columnKey: string): TableColumn | undefined => {
    return columnConfig.value.find(col => col.key === columnKey)
  }

  /**
   * Update column configuration
   */
  const updateColumn = (columnKey: string, updates: Partial<TableColumn>) => {
    const columnIndex = columnConfig.value.findIndex(col => col.key === columnKey)
    if (columnIndex > -1) {
      const currentColumn = columnConfig.value[columnIndex]
      const updatedColumn = { ...currentColumn, ...updates }
      
      // Validate updated column
      const validatedColumn = tableColumnSchema.parse(updatedColumn)
      columnConfig.value[columnIndex] = validatedColumn
    }
  }

  /**
   * Reorder columns (for future drag-and-drop functionality)
   */
  const reorderColumns = (newOrder: string[]) => {
    const reorderedColumns: TableColumn[] = []
    
    // Add columns in the new order
    newOrder.forEach(key => {
      const column = columnConfig.value.find(col => col.key === key)
      if (column) {
        reorderedColumns.push(column)
      }
    })
    
    // Add any remaining columns that weren't in the new order
    columnConfig.value.forEach(col => {
      if (!newOrder.includes(col.key)) {
        reorderedColumns.push(col)
      }
    })
    
    columnConfig.value = reorderedColumns
  }

  /**
   * Export column configuration (for sharing/backup)
   */
  const exportConfig = () => ({
    columns: columnConfig.value,
    visibility: columnVisibility.value
  })

  /**
   * Import column configuration
   */
  const importConfig = (config: {
    columns?: TableColumn[]
    visibility?: ColumnVisibility
  }) => {
    if (config.columns) {
      const validatedColumns = z.array(tableColumnSchema).parse(config.columns)
      columnConfig.value = validatedColumns
    }
    
    if (config.visibility) {
      const validatedVisibility = columnVisibilitySchema.parse(config.visibility)
      columnVisibility.value = validatedVisibility
    }
  }

  return {
    // State
    columnConfig,
    columnVisibility,
    
    // Computed
    visibleColumns,
    hiddenColumns,
    columnStats,
    
    // Methods
    isColumnVisible,
    toggleColumn,
    showColumn,
    hideColumn,
    showColumns,
    hideColumns,
    resetColumns,
    showAllColumns,
    hideAllColumns,
    getColumn,
    updateColumn,
    reorderColumns,
    exportConfig,
    importConfig
  }
}

/**
 * Specialized version for expense table columns
 */
export function useExpenseTableColumns(storageKey: string = 'expense-table-columns') {
  return useTableColumns(DEFAULT_EXPENSE_COLUMNS, storageKey)
}