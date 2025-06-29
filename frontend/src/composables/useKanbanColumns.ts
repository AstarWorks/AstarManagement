import type { KanbanColumn, MatterCard } from '~/types/kanban'
import type { Matter } from '~/types/matter'
import { DEFAULT_KANBAN_COLUMNS } from '~/constants/kanban'

// Convert Matter to MatterCard format
function matterToCard(matter: Matter): MatterCard {
  return {
    ...matter,
    assignedLawyer: matter.assignedLawyer ? (
      typeof matter.assignedLawyer === 'string' ? {
        id: matter.assignedLawyer,
        name: matter.assignedLawyer,
        initials: matter.assignedLawyer.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      } : {
        id: matter.assignedLawyer.id,
        name: matter.assignedLawyer.name,
        initials: matter.assignedLawyer.initials
      }
    ) : undefined,
    assignedClerk: undefined, // Not available in Matter type
    statusDuration: undefined,
    isOverdue: matter.dueDate ? new Date(matter.dueDate) < new Date() : false,
    searchHighlights: {},
    relevanceScore: 0
  }
}

export function useKanbanColumns(matters: Ref<Matter[]>) {
  const columns = ref<KanbanColumn[]>(DEFAULT_KANBAN_COLUMNS)
  
  // Group matters by column based on status mapping
  const mattersByColumn = computed(() => {
    const grouped: Record<string, MatterCard[]> = {}
    
    // Initialize each column with empty array
    columns.value.forEach(column => {
      grouped[column.id] = []
    })
    
    // Group matters into columns based on status
    matters.value.forEach((matter: Matter) => {
      const column = columns.value.find(col => 
        col.status === matter.status
      )
      if (column) {
        grouped[column.id].push(matterToCard(matter))
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