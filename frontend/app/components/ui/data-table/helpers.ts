import type { Column } from '@tanstack/vue-table'
import type { ExtendedColumnDef, ColumnHelper } from './types'

/**
 * Create a column helper for type-safe column definitions
 * @template TData The type of data in the table
 */
export function createColumnHelper<TData>(): ColumnHelper<TData> {
  return {
    accessor: (accessor, column) => {
      if (typeof accessor === 'string') {
        return {
          ...column,
          accessorKey: accessor,
        } as ExtendedColumnDef<TData>
      }
      return {
        ...column,
        accessorFn: accessor,
      } as ExtendedColumnDef<TData>
    },
    display: (column) => column,
  }
}

/**
 * Helper to create sortable header
 */
export function createSortableHeader<TData>(
  column: { column: Column<TData, unknown> },
  label: string
) {
  const { column: col } = column
  const isSorted = col.getIsSorted()
  
  return {
    label,
    canSort: col.getCanSort(),
    isSorted,
    toggleSorting: () => col.toggleSorting(),
  }
}

/**
 * Get column alignment class
 */
export function getColumnAlign(align?: 'left' | 'center' | 'right'): string {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}