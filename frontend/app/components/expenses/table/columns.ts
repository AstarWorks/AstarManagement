import type { ColumnDef, Column, FilterFn } from '@tanstack/vue-table'
import { rankItem } from '@tanstack/match-sorter-utils'
import type { IExpense } from '~/types/expense'
import { h } from 'vue'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Icon } from '#components'
import SortIndicator from '~/components/ui/data-table/SortIndicator.vue'

// Custom filter functions for TanStackTable
const dateRangeFilter: FilterFn<IExpense> = (row, columnId, filterValue) => {
  const { from, to } = filterValue || {}
  if (!from && !to) return true
  
  const rowDate = new Date(row.getValue(columnId) as string)
  if (from && rowDate < new Date(from)) return false
  if (to && rowDate > new Date(to)) return false
  
  return true
}

const amountRangeFilter: FilterFn<IExpense> = (row, columnId, filterValue) => {
  const { min, max } = filterValue || {}
  if (min === undefined && max === undefined) return true
  
  const rowValue = row.getValue(columnId) as number
  if (min !== undefined && rowValue < min) return false
  if (max !== undefined && rowValue > max) return false
  
  return true
}

const multiSelectFilter: FilterFn<IExpense> = (row, columnId, filterValue) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true
  
  const rowValue = row.getValue(columnId) as string
  return filterValue.includes(rowValue)
}

const fuzzyFilter: FilterFn<IExpense> = (row, columnId, filterValue) => {
  const itemRank = rankItem(row.getValue(columnId), filterValue)
  return itemRank.passed
}

// Helper function to create sortable header
const createSortableHeader = (label: string, column: Column<IExpense, unknown>) => h(
  Button,
  {
    variant: 'ghost',
    onClick: (event: MouseEvent) => {
      if (event.shiftKey) {
        column.toggleSorting(column.getIsSorted() === 'asc', true)
      } else {
        column.toggleSorting(column.getIsSorted() === 'asc')
      }
    },
  },
  () => [
    label,
    h(SortIndicator, { sortDirection: column.getIsSorted() }),
  ]
)

export const createExpenseColumns = (
  t: (key: string) => string,
  formatters: ReturnType<typeof import('~/composables/useExpenseFormatters')['useExpenseFormatters']>,
  actions: {
    onView: (expense: IExpense) => void
    onEdit: (expense: IExpense) => void
    onDelete: (expense: IExpense) => void
    onDuplicate: (expense: IExpense) => void
  }
): ColumnDef<IExpense>[] => [
  {
    id: 'select',
    header: ({ table }) => h(
      Checkbox,
      {
        checked: table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
        'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(Boolean(value)),
        ariaLabel: t('expense.table.selectAll'),
      }
    ),
    cell: ({ row }) => h(
      'div',
      {
        onClick: (e: Event) => e.stopPropagation()
      },
      h(
        Checkbox,
        {
          checked: row.getIsSelected(),
          'onUpdate:checked': (value: boolean) => row.toggleSelected(Boolean(value)),
          ariaLabel: t('expense.table.selectRow'),
        }
      )
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'date',
    meta: { label: t('expense.fields.date') },
    enablePinning: true,
    header: ({ column }) => createSortableHeader(t('expense.fields.date'), column),
    cell: ({ row }) => formatters.formatDate(row.getValue('date')),
    filterFn: dateRangeFilter,
  },
  {
    accessorKey: 'category',
    meta: { label: t('expense.fields.category') },
    header: ({ column }) => createSortableHeader(t('expense.fields.category'), column),
    cell: ({ row }) => h(
      Badge,
      {
        variant: 'outline',
        class: formatters.getCategoryBadgeClass(row.getValue('category')),
      },
      () => row.getValue('category')
    ),
    filterFn: multiSelectFilter,
  },
  {
    accessorKey: 'description',
    meta: { label: t('expense.fields.description') },
    header: ({ column }) => createSortableHeader(t('expense.fields.description'), column),
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      const memo = row.original.memo
      return h('div', { class: 'space-y-1' }, [
        h('div', { class: 'font-medium' }, description),
        memo && h('div', { class: 'text-sm text-muted-foreground' }, memo)
      ])
    },
    filterFn: fuzzyFilter,
    enableGlobalFilter: true,
  },
  {
    id: 'amounts',
    meta: { label: t('expense.fields.amount') },
    enablePinning: true,
    header: () => t('expense.fields.amount'),
    cell: ({ row }) => {
      const income = row.original.incomeAmount
      const expense = row.original.expenseAmount
      return h('div', { class: 'text-right font-mono' }, [
        income > 0 && h('div', { class: 'text-green-600' }, `+${formatters.formatCurrency(income)}`),
        expense > 0 && h('div', { class: 'text-red-600' }, `-${formatters.formatCurrency(expense)}`),
      ])
    },
  },
  {
    accessorKey: 'balance',
    meta: { label: t('expense.fields.balance') },
    header: ({ column }) => createSortableHeader(t('expense.fields.balance'), column),
    cell: ({ row }) => h(
      'div',
      {
        class: `text-right font-mono ${formatters.getBalanceClass(row.getValue('balance'))}`,
      },
      formatters.formatCurrency(row.getValue('balance'))
    ),
    filterFn: amountRangeFilter,
  },
  {
    id: 'actions',
    header: () => t('common.actions'),
    cell: ({ row }) => {
      const expense = row.original
      return h(
        'div',
        {
          onClick: (e: Event) => e.stopPropagation()
        },
        h(
          DropdownMenu,
          {},
          {
            default: () => [
              h(
                DropdownMenuTrigger,
                { asChild: true },
                () => h(
                  Button,
                  { variant: 'ghost', class: 'h-8 w-8 p-0' },
                  () => h(Icon, { name: 'lucide:more-horizontal', class: 'h-4 w-4' })
                )
              ),
            h(
              DropdownMenuContent,
              { align: 'end' },
              () => [
                h(DropdownMenuLabel, {}, () => t('common.actions')),
                h(
                  DropdownMenuItem,
                  { onClick: () => actions.onView(expense) },
                  () => [
                    h(Icon, { name: 'lucide:eye', class: 'mr-2 h-4 w-4' }),
                    t('common.view')
                  ]
                ),
                h(
                  DropdownMenuItem,
                  { onClick: () => actions.onEdit(expense) },
                  () => [
                    h(Icon, { name: 'lucide:edit', class: 'mr-2 h-4 w-4' }),
                    t('common.edit')
                  ]
                ),
                h(
                  DropdownMenuItem,
                  { onClick: () => actions.onDuplicate(expense) },
                  () => [
                    h(Icon, { name: 'lucide:copy', class: 'mr-2 h-4 w-4' }),
                    t('common.duplicate')
                  ]
                ),
                h(DropdownMenuSeparator),
                h(
                  DropdownMenuItem,
                  {
                    onClick: () => actions.onDelete(expense),
                    class: 'text-destructive',
                  },
                  () => [
                    h(Icon, { name: 'lucide:trash', class: 'mr-2 h-4 w-4' }),
                    t('common.delete')
                  ]
                ),
              ]
            ),
          ],
        }
        )
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]