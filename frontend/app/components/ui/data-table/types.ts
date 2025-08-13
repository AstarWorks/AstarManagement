import type { ColumnDef, Table } from '@tanstack/vue-table'

/**
 * Base configuration for DataTable
 */
export interface IDataTableConfig {
  /**
   * Enable or disable specific features
   */
  features?: {
    sorting?: boolean
    filtering?: boolean
    pagination?: boolean
    rowSelection?: boolean
    columnVisibility?: boolean
  }
  /**
   * Default page size for pagination
   */
  defaultPageSize?: number
  /**
   * Default sorting state
   */
  defaultSorting?: Array<{
    id: string
    desc: boolean
  }>
  /**
   * Default column visibility
   */
  defaultColumnVisibility?: Record<string, boolean>
}

/**
 * Column meta interface for additional column properties
 */
export interface IColumnMeta {
  /**
   * Header label for the column
   */
  label?: string
  /**
   * Whether the column is sortable
   */
  sortable?: boolean
  /**
   * Whether the column is filterable
   */
  filterable?: boolean
  /**
   * Custom class for the column
   */
  className?: string
  /**
   * Alignment for the column
   */
  align?: 'left' | 'center' | 'right'
}

/**
 * Extended column definition with meta
 */
export type ExtendedColumnDef<TData = unknown, TValue = unknown> = ColumnDef<TData, TValue> & {
  meta?: IColumnMeta
}

/**
 * Table instance type
 */
export type DataTableInstance<TData = unknown> = Table<TData>

/**
 * Helper type for creating column definitions
 */
export type ColumnHelper<TData = unknown> = {
  accessor: <TValue>(
    accessor: keyof TData | ((row: TData) => TValue),
    column: Omit<ExtendedColumnDef<TData, TValue>, 'accessorFn' | 'accessorKey'>
  ) => ExtendedColumnDef<TData, TValue>
  display: (column: ExtendedColumnDef<TData>) => ExtendedColumnDef<TData>
}