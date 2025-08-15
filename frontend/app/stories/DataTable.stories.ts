import type { Meta, StoryObj } from '@storybook/vue3'
import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { DataTable, createColumnHelper } from '@ui/data-table'
import { Button } from '@ui/button/index'
import { Badge } from '@ui/badge'

// Sample data type
interface IPerson {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  role: string
  joinDate: string
}

// Sample data
const sampleData: IPerson[] = [
  {
    id: '1',
    name: 'Taro Yamada',
    email: 'yamada@example.com',
    status: 'active',
    role: 'Lawyer',
    joinDate: '2023-01-15',
  },
  {
    id: '2',
    name: 'Hanako Sato',
    email: 'sato@example.com',
    status: 'active',
    role: 'Clerk',
    joinDate: '2023-03-20',
  },
  {
    id: '3',
    name: 'Ichiro Suzuki',
    email: 'suzuki@example.com',
    status: 'inactive',
    role: 'Lawyer',
    joinDate: '2022-11-10',
  },
  {
    id: '4',
    name: 'Michiko Tanaka',
    email: 'tanaka@example.com',
    status: 'active',
    role: 'Accountant',
    joinDate: '2023-02-01',
  },
  {
    id: '5',
    name: 'Kenichi Takahashi',
    email: 'takahashi@example.com',
    status: 'active',
    role: 'Lawyer',
    joinDate: '2023-04-15',
  },
]

// Column definitions
const columnHelper = createColumnHelper<IPerson>()

// In a real app, these headers would use i18n:
// header: $t('common.table.name')
// header: $t('common.table.email')
// header: $t('common.table.status')
// header: $t('common.table.role')
// header: $t('common.table.joinDate')
// header: $t('common.table.actions')
const columns: ColumnDef<IPerson>[] = [
  columnHelper.accessor('name', {
    header: 'Name', // i18n: common.table.name
    cell: info => info.getValue(),
    meta: {
      sortable: true,
    },
  }),
  columnHelper.accessor('email', {
    header: 'Email', // i18n: common.table.email
    cell: info => info.getValue(),
    meta: {
      sortable: true,
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status', // i18n: common.table.status
    cell: info => h(Badge, {
      variant: info.getValue() === 'active' ? 'default' : 'secondary',
    }, () => info.getValue() === 'active' ? 'Active' : 'Inactive'), // i18n: common.table.active/inactive
    meta: {
      sortable: true,
    },
  }),
  columnHelper.accessor('role', {
    header: 'Role', // i18n: common.table.role
    cell: info => info.getValue(),
    meta: {
      sortable: true,
    },
  }),
  columnHelper.accessor('joinDate', {
    header: 'Join Date', // i18n: common.table.joinDate
    cell: info => {
      const value = info.getValue()
      return new Date(value as string).toLocaleDateString('ja-JP')
    },
    meta: {
      sortable: true,
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions', // i18n: common.table.actions
    cell: () => h('div', { class: 'flex gap-2' }, [
      h(Button, {
        variant: 'ghost',
        size: 'sm',
        onClick: () => {
          // TODO: Implement edit action
        },
      }, () => 'Edit'), // i18n: common.edit
      h(Button, {
        variant: 'ghost',
        size: 'sm',
        onClick: () => {
          // TODO: Implement delete action
        },
      }, () => 'Delete'), // i18n: common.delete
    ]),
  }),
]

const meta = {
  title: 'UI/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A powerful data table component powered by TanStackTable v8.

## Features
- Sorting functionality
- Filtering
- Pagination
- Loading states
- Empty state display
- TypeScript type safety
- Responsive design

## Usage
\`\`\`typescript
import { DataTable, createColumnHelper } from '@ui/data-table'

const columnHelper = createColumnHelper<YourDataType>()
const columns = [
  columnHelper.accessor('field', {
    header: 'Header Name',
    cell: info => info.getValue(),
  }),
]
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Data to display in the table',
    },
    columns: {
      control: 'object',
      description: 'Column definitions',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    emptyMessage: {
      control: 'text',
      description: 'Message to display when empty',
    },
    skeletonRows: {
      control: 'number',
      description: 'Number of skeleton rows when loading',
    },
    enableSorting: {
      control: 'boolean',
      description: 'Enable sorting functionality',
    },
    enableFiltering: {
      control: 'boolean',
      description: 'Enable filtering functionality',
    },
    enablePagination: {
      control: 'boolean',
      description: 'Enable pagination functionality',
    },
    pageSize: {
      control: 'number',
      description: 'Number of items per page',
    },
  },
}

export default meta as Meta<typeof DataTable>

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    data: sampleData,
    columns: columns as ColumnDef<unknown>[],
    emptyMessage: 'No data available', // i18n: common.table.noData
    skeletonRows: 5,
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    pageSize: 10,
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
    data: [],
  },
}

export const Empty: Story = {
  args: {
    ...Default.args,
    data: [],
    emptyMessage: 'No search results found',
  },
}

export const NoSorting: Story = {
  args: {
    ...Default.args,
    enableSorting: false,
  },
}

export const NoPagination: Story = {
  args: {
    ...Default.args,
    enablePagination: false,
  },
}

export const LargeDataset: Story = {
  args: {
    ...Default.args,
    data: Array.from({ length: 50 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: i % 3 === 0 ? 'inactive' : 'active',
      role: ['Lawyer', 'Clerk', 'Accountant'][i % 3],
      joinDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    })) as IPerson[],
    pageSize: 10,
  },
}