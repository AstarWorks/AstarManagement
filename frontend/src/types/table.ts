export type SortDirection = 'asc' | 'desc'

export interface SortState {
  column: string
  direction: SortDirection
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface TableQueryParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: SortDirection
  search?: string
}

export interface TableState {
  sort: SortState | null
  pagination: PaginationState
  search: string
}

// Re-export from matter types if needed
export type { DataTableColumn } from '~/components/matter/DataTable.vue'