import type { KanbanColumn } from '~/types/kanban'
import type { Matter } from '~/types/matter'
import { DEFAULT_KANBAN_COLUMNS } from '~/constants/kanban'

export function useKanbanColumns(matters: Ref<Matter[]>) {
  const columns = ref<KanbanColumn[]>(DEFAULT_KANBAN_COLUMNS)
  
  // Group matters by column based on status mapping
  const mattersByColumn = computed(() => {
    const grouped: Record<string, Matter[]> = {}
    
    // Initialize each column with empty array
    columns.value.forEach(column => {
      grouped[column.id] = []
    })
    
    // Group matters into columns based on status
    matters.value.forEach(matter => {
      const column = columns.value.find(col => 
        col.status.includes(matter.status as any)
      )
      if (column) {
        grouped[column.id].push(matter)
      }
    })
    
    return grouped
  })
  
  // Add count information to columns
  const columnsWithCounts = computed(() => 
    columns.value.map(column => ({
      ...column,
      count: mattersByColumn.value[column.id]?.length || 0
    }))
  )
  
  // Get visible columns (for responsive design)
  const getVisibleColumns = (maxColumns?: number) => {
    let visibleColumns = columns.value
    
    if (maxColumns && maxColumns < columns.value.length) {
      visibleColumns = columns.value.slice(0, maxColumns)
    }
    
    return visibleColumns
  }
  
  // Find column by matter status
  const getColumnForStatus = (status: string) => {
    return columns.value.find(column => 
      column.status.includes(status as any)
    )
  }
  
  // Get column by ID
  const getColumnById = (columnId: string) => {
    return columns.value.find(column => column.id === columnId)
  }
  
  return {
    columns: readonly(columns),
    mattersByColumn,
    columnsWithCounts,
    getVisibleColumns,
    getColumnForStatus,
    getColumnById
  }
}