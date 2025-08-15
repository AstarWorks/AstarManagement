export { default as DataTable } from './DataTable.vue'
export * from './types'
export * from './helpers'

// Re-export TanStack Table types for convenience
export type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table,
  Row,
  Cell,
  Header,
  HeaderGroup,
} from '@tanstack/vue-table'