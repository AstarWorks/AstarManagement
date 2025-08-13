import type { ColumnDef } from '@tanstack/vue-table'
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
import { ArrowUpDown } from 'lucide-vue-next'

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
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      () => [
        t('expense.fields.date'),
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' }),
      ]
    ),
    cell: ({ row }) => formatters.formatDate(row.getValue('date')),
  },
  {
    accessorKey: 'category',
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      () => [
        t('expense.fields.category'),
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' }),
      ]
    ),
    cell: ({ row }) => h(
      Badge,
      {
        variant: 'outline',
        class: formatters.getCategoryBadgeClass(row.getValue('category')),
      },
      () => row.getValue('category')
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      () => [
        t('expense.fields.description'),
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' }),
      ]
    ),
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      const memo = row.original.memo
      return h('div', { class: 'space-y-1' }, [
        h('div', { class: 'font-medium' }, description),
        memo && h('div', { class: 'text-sm text-muted-foreground' }, memo)
      ])
    },
  },
  {
    id: 'amounts',
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
    header: ({ column }) => h(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      () => [
        t('expense.fields.balance'),
        h(ArrowUpDown, { class: 'ml-2 h-4 w-4' }),
      ]
    ),
    cell: ({ row }) => h(
      'div',
      {
        class: `text-right font-mono ${formatters.getBalanceClass(row.getValue('balance'))}`,
      },
      formatters.formatCurrency(row.getValue('balance'))
    ),
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