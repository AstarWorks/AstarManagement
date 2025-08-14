/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Meta, StoryObj } from '@storybook/vue3'
import DataTable from './DataTable.vue'
import type { ColumnDef } from '@tanstack/vue-table'

// Sample data types
interface IUser {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive' | 'pending'
  joinDate: string
  salary: number
}

// Generate sample data
const generateUsers = (count: number): IUser[] => {
  const roles = ['Developer', 'Designer', 'Manager', 'Sales', 'Support']
  const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR']
  const statuses: IUser['status'][] = ['active', 'inactive', 'pending']

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: roles[i % roles.length]!,
    department: departments[i % departments.length]!,
    status: statuses[i % statuses.length]!,
    joinDate: new Date(2020 + Math.floor(i / 50), i % 12, (i % 28) + 1).toISOString(),
    salary: 50000 + Math.floor(Math.random() * 50000)
  }))
}

const sampleData = generateUsers(50)

// Basic columns
const basicColumns = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'role',
    header: 'Role'
  },
  {
    accessorKey: 'department',
    header: 'Department'
  }
]

// Full-featured columns
const fullColumns = [
  {
    id: 'select',
    header: ({ table }: any) => ({
      component: 'Checkbox',
      props: {
        checked: table.getIsAllRowsSelected(),
        indeterminate: table.getIsSomeRowsSelected(),
        onChange: table.toggleAllRowsSelected
      }
    }),
    cell: ({ row }: any) => ({
      component: 'Checkbox',
      props: {
        checked: row.getIsSelected(),
        onChange: row.toggleSelected
      }
    }),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
    enableHiding: true
  },
  {
    accessorKey: 'email',
    header: 'Email',
    enableSorting: true,
    enableHiding: true
  },
  {
    accessorKey: 'role',
    header: 'Role',
    enableSorting: true,
    enableHiding: true,
    filterFn: 'includesString'
  },
  {
    accessorKey: 'department',
    header: 'Department',
    enableSorting: true,
    enableHiding: true,
    filterFn: 'includesString'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }: any) => {
      const status = row.original.status
      const colors: Record<string, string> = {
        active: 'text-green-600 bg-green-50',
        inactive: 'text-gray-600 bg-gray-50',
        pending: 'text-yellow-600 bg-yellow-50'
      }
      return `<span class="px-2 py-1 rounded-full text-xs font-medium ${colors[status]}">${status}</span>`
    }
  },
  {
    accessorKey: 'joinDate',
    header: 'Join Date',
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }: any) => new Date(row.original.joinDate).toLocaleDateString()
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }: any) => `$${row.original.salary.toLocaleString()}`
  }
]

const meta = {
  title: 'UI/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible and feature-rich data table component built with TanStack Table v8.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      description: 'The data array to display in the table',
      control: { type: 'object' }
    },
    columns: {
      description: 'Column definitions for the table',
      control: { type: 'object' }
    },
    enableSorting: {
      description: 'Enable sorting functionality',
      control: { type: 'boolean' }
    },
    enableFiltering: {
      description: 'Enable filtering functionality',
      control: { type: 'boolean' }
    },
    loading: {
      description: 'Show loading state',
      control: { type: 'boolean' }
    },
  }
}

export default meta as Meta<typeof DataTable>
type Story = StoryObj<typeof DataTable>

// Basic table
export const Basic: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: basicColumns
  }
}

// Table with sorting
export const WithSorting: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: basicColumns.map(col => ({ ...col, enableSorting: true })) as ColumnDef<unknown, unknown>[],
    enableSorting: true
  }
}

// Table with row selection
export const WithSelection: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: fullColumns as ColumnDef<unknown, unknown>[],
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with checkbox selection for rows'
      }
    }
  }
}

// Table with all features
export const FullFeatured: Story = {
  args: {
    data: sampleData,
    columns: fullColumns as ColumnDef<unknown, unknown>[],
    enableSorting: true,
    enableFiltering: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with all features enabled: sorting, filtering, selection, and column visibility'
      }
    }
  }
}

// Loading state
export const Loading: Story = {
  args: {
    data: [],
    columns: basicColumns as ColumnDef<unknown, unknown>[],
    loading: true
  }
}

// Empty state
export const Empty: Story = {
  args: {
    data: [],
    columns: basicColumns as ColumnDef<unknown, unknown>[],
    emptyMessage: 'No users found'
  }
}

// Striped rows
export const Striped: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: basicColumns as ColumnDef<unknown, unknown>[],
  }
}

// Compact table
export const Compact: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: basicColumns as ColumnDef<unknown, unknown>[],
  }
}

// Custom cell rendering
export const CustomCells: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }: any) => `<strong>${(row.original as IUser).name}</strong>`
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }: any) => `<a href="mailto:${(row.original as IUser).email}" class="text-blue-600 hover:underline">${(row.original as IUser).email}</a>`
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: any) => {
          const status = (row.original as IUser).status
          const icons: Record<string, string> = {
            active: '✅',
            inactive: '❌',
            pending: '⏳'
          }
          return `${icons[status]} ${status}`
        }
      }
    ] as ColumnDef<unknown, unknown>[]
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with custom cell rendering including HTML content'
      }
    }
  }
}

// Large dataset with virtual scrolling
export const VirtualScrolling: Story = {
  args: {
    data: generateUsers(1000),
    columns: basicColumns as ColumnDef<unknown, unknown>[],
    style: { height: '600px' }
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with virtual scrolling enabled for large datasets (1000 rows)'
      }
    }
  }
}

// Responsive table
export const Responsive: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: fullColumns as ColumnDef<unknown, unknown>[],
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with responsive behavior for mobile devices'
      }
    }
  }
}

// Sortable with initial sort
export const InitialSort: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: basicColumns.map(col => ({ ...col, enableSorting: true })) as ColumnDef<unknown, unknown>[],
    enableSorting: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with initial sorting applied to the name column'
      }
    }
  }
}

// Pinned columns
export const PinnedColumns: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      ...(basicColumns.slice(1) as ColumnDef<unknown, unknown>[]),
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: () => '<button class="px-2 py-1 text-sm bg-blue-500 text-white rounded">Edit</button>'
      }
    ] as ColumnDef<unknown, unknown>[]
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with pinned columns on left and right'
      }
    }
  }
}

// With global filter
export const GlobalFilter: Story = {
  render: (args) => ({
    components: { DataTable },
    setup() {
      const globalFilter = ref('')
      return { args, globalFilter }
    },
    template: `
      <div>
        <div class="mb-4">
          <input
            v-model="globalFilter"
            placeholder="Search all columns..."
            class="px-3 py-2 border rounded-md w-full max-w-sm"
          />
        </div>
        <DataTable v-bind="args" :globalFilter="globalFilter" />
      </div>
    `
  }),
  args: {
    data: sampleData.slice(0, 20),
    columns: basicColumns.map(col => ({ ...col, enableGlobalFilter: true })) as ColumnDef<unknown, unknown>[],
    enableFiltering: true
  }
}

// Row actions
export const WithRowActions: Story = {
  args: {
    data: sampleData.slice(0, 10),
    columns: [
      ...(basicColumns as ColumnDef<unknown, unknown>[]),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: any) => ({
          component: 'div',
          props: {
            class: 'flex gap-2'
          },
          children: [
            {
              component: 'button',
              props: {
                class: 'px-2 py-1 text-sm bg-blue-500 text-white rounded',
                onClick: () => console.log('Edit', (row.original as IUser))
              },
              children: 'Edit'
            },
            {
              component: 'button',
              props: {
                class: 'px-2 py-1 text-sm bg-red-500 text-white rounded',
                onClick: () => console.log('Delete', (row.original as IUser))
              },
              children: 'Delete'
            }
          ]
        })
      }
    ]
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with action buttons in each row'
      }
    }
  }
}