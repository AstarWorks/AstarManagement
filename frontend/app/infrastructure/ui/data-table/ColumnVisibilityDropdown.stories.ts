import type { StoryObj } from '@storybook/vue3'
import { ref, computed } from 'vue'
import ColumnVisibilityDropdown from './ColumnVisibilityDropdown.vue'
import type { Table, Column } from '@tanstack/vue-table'

// Define mock data type
interface IMockData {
  id: string
  [key: string]: unknown
}

// Mock column factory
const createMockColumn = <TData = IMockData>(config: {
  id: string
  header: string
  canHide?: boolean
  isVisible?: boolean
  category?: string
}): Column<TData> => ({
  id: config.id,
  columnDef: {
    header: config.header,
    enableHiding: config.canHide ?? true,
    meta: config.category ? { category: config.category } : undefined
  },
  getCanHide: () => config.canHide ?? true,
  getIsVisible: () => config.isVisible ?? true,
  toggleVisibility: () => {}
} as Column<TData>)

// Mock table factory
const createMockTable = <TData = IMockData>(columns: Column<TData>[]): Table<TData> => ({
  getAllColumns: () => columns,
  getIsAllColumnsVisible: () => columns.filter(c => c.getCanHide()).every(c => c.getIsVisible()),
  toggleAllColumnsVisible: () => {},
  getVisibleColumns: () => columns.filter(c => c.getIsVisible()),
  getState: () => ({
    columnVisibility: columns.reduce((acc, col) => ({
      ...acc,
      [col.id]: col.getIsVisible()
    }), {})
  }),
  setColumnVisibility: () => {}
} as unknown as Table<TData>)

const meta = {
  title: 'UI/ColumnVisibilityDropdown',
  component: ColumnVisibilityDropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Dropdown component for toggling column visibility in DataTable.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    table: {
      description: 'TanStack Table instance',
      control: false
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic columns
const basicColumns = [
  createMockColumn({ id: 'name', header: 'Name' }),
  createMockColumn({ id: 'email', header: 'Email' }),
  createMockColumn({ id: 'role', header: 'Role' }),
  createMockColumn({ id: 'department', header: 'Department' })
]

// Default dropdown
export const Default: Story = {
  args: {
    table: createMockTable(basicColumns) as Table<unknown>  }
}

// With some columns hidden
export const WithHiddenColumns: Story = {
  args: {
    table: createMockTable([
      createMockColumn({ id: 'name', header: 'Name', isVisible: true }),
      createMockColumn({ id: 'email', header: 'Email', isVisible: false }),
      createMockColumn({ id: 'role', header: 'Role', isVisible: true }),
      createMockColumn({ id: 'department', header: 'Department', isVisible: false })
    ])  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown with some columns initially hidden'
      }
    }
  }
}

// With non-hideable columns
export const WithNonHideableColumns: Story = {
  args: {
    table: createMockTable([
      createMockColumn({ id: 'id', header: 'ID', canHide: false }),
      createMockColumn({ id: 'name', header: 'Name' }),
      createMockColumn({ id: 'email', header: 'Email' }),
      createMockColumn({ id: 'actions', header: 'Actions', canHide: false })
    ])  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown excluding columns that cannot be hidden (ID and Actions)'
      }
    }
  }
}

// With mixed visibility
export const WithMixedVisibility: Story = {
  args: {
    table: createMockTable([
      createMockColumn({ id: 'name', header: 'Name', isVisible: true }),
      createMockColumn({ id: 'email', header: 'Email', isVisible: true }),
      createMockColumn({ id: 'role', header: 'Role', isVisible: false }),
      createMockColumn({ id: 'department', header: 'Department', isVisible: true })
    ])  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown showing visible column count (3 of 4)'
      }
    }
  }
}

// Many columns with scrolling
export const ManyColumnsWithScrolling: Story = {
  args: {
    table: createMockTable([
      createMockColumn({ id: 'id', header: 'ID' }),
      createMockColumn({ id: 'name', header: 'Name' }),
      createMockColumn({ id: 'email', header: 'Email' }),
      createMockColumn({ id: 'phone', header: 'Phone' }),
      createMockColumn({ id: 'address', header: 'Address' }),
      createMockColumn({ id: 'city', header: 'City' }),
      createMockColumn({ id: 'state', header: 'State' }),
      createMockColumn({ id: 'zip', header: 'ZIP Code' }),
      createMockColumn({ id: 'country', header: 'Country' }),
      createMockColumn({ id: 'department', header: 'Department' }),
      createMockColumn({ id: 'role', header: 'Role' }),
      createMockColumn({ id: 'manager', header: 'Manager' }),
      createMockColumn({ id: 'startDate', header: 'Start Date' }),
      createMockColumn({ id: 'salary', header: 'Salary' }),
      createMockColumn({ id: 'status', header: 'Status' })
    ])  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown with many columns showing scrollable list'
      }
    }
  }
}

// With many columns for scrolling
export const WithManyColumnsScrollable: Story = {
  args: {
    table: createMockTable([
      createMockColumn({ id: 'firstName', header: 'First Name' }),
      createMockColumn({ id: 'lastName', header: 'Last Name' }),
      createMockColumn({ id: 'email', header: 'Email Address' }),
      createMockColumn({ id: 'phoneNumber', header: 'Phone Number' }),
      createMockColumn({ id: 'address', header: 'Street Address' }),
      createMockColumn({ id: 'city', header: 'City' }),
      createMockColumn({ id: 'state', header: 'State' }),
      createMockColumn({ id: 'zipCode', header: 'ZIP Code' })
    ])  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown with many columns demonstrating scrollable list'
      }
    }
  }
}

// With categories in meta
export const WithCategoriesInMeta: Story = {
  args: {
    table: createMockTable([
      createMockColumn({ id: 'firstName', header: 'First Name', category: 'Personal' }),
      createMockColumn({ id: 'lastName', header: 'Last Name', category: 'Personal' }),
      createMockColumn({ id: 'email', header: 'Email', category: 'Contact' }),
      createMockColumn({ id: 'phone', header: 'Phone', category: 'Contact' }),
      createMockColumn({ id: 'department', header: 'Department', category: 'Work' }),
      createMockColumn({ id: 'role', header: 'Role', category: 'Work' }),
      createMockColumn({ id: 'salary', header: 'Salary', category: 'Work' })
    ])  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown with columns that have category metadata'
      }
    }
  }
}

// Basic dropdown
export const BasicDropdown: Story = {
  args: {
    table: createMockTable(basicColumns) as Table<unknown>  },
  parameters: {
    docs: {
      description: {
        story: 'Basic dropdown with standard columns'
      }
    }
  }
}

// Interactive example
export const Interactive: Story = {
  render: (args) => ({
    components: { ColumnVisibilityDropdown },
    setup() {
      const columns = ref([
        { 
          id: 'name', 
          header: 'Name', 
          visible: true,
          canHide: true
        },
        { 
          id: 'email', 
          header: 'Email', 
          visible: true,
          canHide: true
        },
        { 
          id: 'role', 
          header: 'Role', 
          visible: true,
          canHide: true
        },
        { 
          id: 'department', 
          header: 'Department', 
          visible: true,
          canHide: true
        },
        { 
          id: 'status', 
          header: 'Status', 
          visible: false,
          canHide: true
        }
      ])

      const mockColumns = computed(() => 
        columns.value.map(col => createMockColumn({
          id: col.id,
          header: col.header,
          isVisible: col.visible,
          canHide: col.canHide
        }))
      )

      const table = computed(() => ({
        ...createMockTable(mockColumns.value),
        toggleAllColumnsVisible: (visible: boolean) => {
          columns.value.forEach(col => {
            if (col.canHide) col.visible = visible
          })
        }
      }))

      // Update column visibility
      const updateColumnVisibility = (columnId: string) => {
        const col = columns.value.find(c => c.id === columnId)
        if (col && col.canHide) {
          col.visible = !col.visible
        }
      }

      // Override toggleVisibility for each column
      mockColumns.value.forEach(col => {
        col.toggleVisibility = () => updateColumnVisibility(col.id)
      })

      return { 
        args: { ...args, table: table.value },
        columns,
        visibleCount: computed(() => columns.value.filter(c => c.visible).length)
      }
    },
    template: `
      <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded">
          <p class="text-sm text-gray-600 mb-2">
            This is an interactive example. Toggle columns to see the changes.
          </p>
          <p class="text-sm font-medium">
            Visible columns: {{ visibleCount }} of {{ columns.length }}
          </p>
        </div>
        
        <ColumnVisibilityDropdown v-bind="args" />
        
        <div class="mt-4">
          <h4 class="text-sm font-medium mb-2">Current visibility:</h4>
          <div class="space-y-1">
            <div v-for="col in columns" :key="col.id" class="text-sm">
              <span :class="col.visible ? 'text-green-600' : 'text-red-600'">
                {{ col.visible ? '✓' : '✗' }}
              </span>
              {{ col.header }}
            </div>
          </div>
        </div>
      </div>
    `
  }),
  args: {
    table: createMockTable([])  }
}

// Empty state
export const Empty: Story = {
  args: {
    table: createMockTable([])  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown with no columns to show'
      }
    }
  }
}

// All columns hidden
export const AllHidden: Story = {
  args: {
    table: createMockTable([
      createMockColumn({ id: 'name', header: 'Name', isVisible: false }),
      createMockColumn({ id: 'email', header: 'Email', isVisible: false }),
      createMockColumn({ id: 'role', header: 'Role', isVisible: false })
    ])  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown with all columns hidden initially'
      }
    }
  }
}

// Dark theme
export const DarkTheme: Story = {
  render: (args) => ({
    components: { ColumnVisibilityDropdown },
    setup() {
      return { args }
    },
    template: `
      <div class="p-8 bg-gray-900 rounded-lg">
        <ColumnVisibilityDropdown 
          v-bind="args" 
          class="[&_button]:!bg-gray-700 [&_button]:!text-white [&_button:hover]:!bg-gray-600"
          dropdownClass="!bg-gray-800 !border-gray-700 !text-white [&_label]:!text-gray-200 [&_input]:!bg-gray-700 [&_input]:!border-gray-600"
        />
      </div>
    `
  }),
  args: {
    table: createMockTable(basicColumns) as Table<unknown>  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown styled for dark theme'
      }
    }
  }
}