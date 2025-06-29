import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { AdvancedDataTableColumn } from '~/components/matter/DataTableAdvanced.vue'

export interface ColumnResizeOptions {
  minWidth?: number
  maxWidth?: number
  persistKey?: string
}

export function useColumnResize<T>(
  columns: Ref<AdvancedDataTableColumn<T>[]>,
  options: ColumnResizeOptions = {}
) {
  const {
    minWidth = 50,
    maxWidth = 800,
    persistKey
  } = options

  // Column widths state
  const columnWidths = ref<Record<string, number>>({})
  const isResizing = ref(false)
  const activeColumn = ref<string | null>(null)
  const startX = ref(0)
  const startWidth = ref(0)

  // Load persisted widths
  onMounted(() => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`column-widths-${persistKey}`)
        if (saved) {
          columnWidths.value = JSON.parse(saved)
        }
      } catch (error) {
        console.warn('Failed to load column widths from localStorage:', error)
      }
    }
  })

  // Save widths to localStorage
  const saveColumnWidths = () => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`column-widths-${persistKey}`, JSON.stringify(columnWidths.value))
      } catch (error) {
        console.warn('Failed to save column widths to localStorage:', error)
      }
    }
  }

  // Get current width for a column
  const getColumnWidth = (column: AdvancedDataTableColumn<T>): number => {
    const key = String(column.key)
    const storedWidth = columnWidths.value[key]
    const defaultWidth = typeof column.width === 'number' ? column.width : 150
    return storedWidth || defaultWidth
  }

  // Set column width
  const setColumnWidth = (column: AdvancedDataTableColumn<T>, width: number): void => {
    const key = String(column.key)
    const constrainedWidth = Math.max(
      column.minWidth || minWidth,
      Math.min(column.maxWidth || maxWidth, width)
    )
    
    columnWidths.value[key] = constrainedWidth
    saveColumnWidths()
  }

  // Start resize operation
  const startResize = (
    event: MouseEvent,
    column: AdvancedDataTableColumn<T>
  ): void => {
    if (!column.resizable) return

    event.preventDefault()
    event.stopPropagation()

    isResizing.value = true
    activeColumn.value = String(column.key)
    startX.value = event.clientX
    startWidth.value = getColumnWidth(column)

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResize)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  // Handle mouse move during resize
  const handleMouseMove = (event: MouseEvent): void => {
    if (!isResizing.value || !activeColumn.value) return

    const deltaX = event.clientX - startX.value
    const newWidth = startWidth.value + deltaX

    const column = columns.value.find(col => String(col.key) === activeColumn.value)
    if (column) {
      const constrainedWidth = Math.max(
        column.minWidth || minWidth,
        Math.min(column.maxWidth || maxWidth, newWidth)
      )
      
      columnWidths.value[activeColumn.value] = constrainedWidth
    }
  }

  // Stop resize operation
  const stopResize = (): void => {
    if (!isResizing.value) return

    isResizing.value = false
    
    // Save the final width
    if (activeColumn.value) {
      const column = columns.value.find(col => String(col.key) === activeColumn.value)
      if (column) {
        saveColumnWidths()
      }
    }

    activeColumn.value = null
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }

  // Reset column widths to defaults
  const resetColumnWidths = (): void => {
    columnWidths.value = {}
    saveColumnWidths()
  }

  // Auto-fit column width based on content
  const autoFitColumn = (
    column: AdvancedDataTableColumn<T>,
    tableElement: HTMLTableElement
  ): void => {
    const key = String(column.key)
    const columnIndex = columns.value.findIndex(col => String(col.key) === key)
    
    if (columnIndex === -1) return

    // Create a temporary element to measure text width
    const measureElement = document.createElement('div')
    measureElement.style.visibility = 'hidden'
    measureElement.style.position = 'absolute'
    measureElement.style.whiteSpace = 'nowrap'
    measureElement.style.font = window.getComputedStyle(tableElement).font
    document.body.appendChild(measureElement)

    let maxWidth = 0

    try {
      // Measure header width
      measureElement.textContent = column.header
      maxWidth = Math.max(maxWidth, measureElement.offsetWidth)

      // Measure cell content widths (sample first 100 rows for performance)
      const rows = tableElement.querySelectorAll('tbody tr')
      const sampleSize = Math.min(rows.length, 100)
      
      for (let i = 0; i < sampleSize; i++) {
        const cell = rows[i]?.children[columnIndex] as HTMLElement
        if (cell) {
          measureElement.textContent = cell.textContent || ''
          maxWidth = Math.max(maxWidth, measureElement.offsetWidth)
        }
      }

      // Add padding
      maxWidth += 32 // 16px padding on each side

      // Apply constraints
      const constrainedWidth = Math.max(
        column.minWidth || minWidth,
        Math.min(column.maxWidth || maxWidth, maxWidth)
      )

      setColumnWidth(column, constrainedWidth)
    } finally {
      document.body.removeChild(measureElement)
    }
  }

  // Double-click to auto-fit
  const handleDoubleClick = (
    event: MouseEvent,
    column: AdvancedDataTableColumn<T>,
    tableElement: HTMLTableElement
  ): void => {
    event.preventDefault()
    event.stopPropagation()
    autoFitColumn(column, tableElement)
  }

  // Computed column styles
  const getColumnStyle = (column: AdvancedDataTableColumn<T>) => {
    const width = getColumnWidth(column)
    return {
      width: `${width}px`,
      minWidth: `${column.minWidth || minWidth}px`,
      maxWidth: `${column.maxWidth || maxWidth}px`
    }
  }

  // Check if column is currently being resized
  const isColumnResizing = (column: AdvancedDataTableColumn<T>): boolean => {
    return isResizing.value && activeColumn.value === String(column.key)
  }

  // Get resize handle props
  const getResizeHandleProps = (column: AdvancedDataTableColumn<T>) => ({
    onMousedown: (event: MouseEvent) => startResize(event, column),
    onDblclick: (event: MouseEvent, tableElement: HTMLTableElement) => 
      handleDoubleClick(event, column, tableElement),
    style: {
      cursor: 'col-resize',
      userSelect: 'none' as const
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (isResizing.value) {
      stopResize()
    }
  })

  return {
    // State
    columnWidths: readonly(columnWidths),
    isResizing: readonly(isResizing),
    activeColumn: readonly(activeColumn),

    // Methods
    getColumnWidth,
    setColumnWidth,
    startResize,
    stopResize,
    resetColumnWidths,
    autoFitColumn,
    handleDoubleClick,

    // Computed
    getColumnStyle,
    isColumnResizing,
    getResizeHandleProps
  }
}