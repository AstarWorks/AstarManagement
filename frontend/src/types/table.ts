export interface DataTableColumn<T = any> {
  key: string
  title?: string
  header?: string
  width?: number | string
  sortable?: boolean
  filterable?: boolean
  hidden?: boolean
  align?: 'left' | 'center' | 'right'
  formatter?: (value: any, row: T) => string
  render?: (value: any, row: T) => any
}

export interface AdvancedDataTableColumn<T = any> extends DataTableColumn<T> {
  resizable?: boolean
  hideable?: boolean
  sticky?: boolean
  minWidth?: number
  maxWidth?: number
  editable?: boolean
  required?: boolean
  validator?: (value: any, row: T) => Promise<string | boolean> | string | boolean
  type?: 'text' | 'number' | 'email' | 'url' | 'date'
}

export interface OperationProgress {
  id: string
  type: 'create' | 'update' | 'delete' | 'bulk'
  progress: number
  total: number
  completed: number
  failed: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  message?: string
  startTime: Date
  endTime?: Date
}

export type SortDirection = 'asc' | 'desc'

export interface TableQueryParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: SortDirection
  search?: string
  filters?: Record<string, any>
}