import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import DataTablePagination from './DataTablePagination.vue'
import type { Table } from '@tanstack/vue-table'

// Define mock data type for pagination
interface IMockPaginationData {
  id: string
  [key: string]: unknown
}

// Mock table factory
const createMockTable = <TData = IMockPaginationData>(config: {
  pageIndex?: number
  pageSize?: number
  pageCount?: number
  rowCount?: number
  canPreviousPage?: boolean
  canNextPage?: boolean
} = {}): Table<TData> => ({
  getState: () => ({
    pagination: {
      pageIndex: config.pageIndex ?? 0,
      pageSize: config.pageSize ?? 10
    }
  }),
  getPageCount: () => config.pageCount ?? 10,
  getCanPreviousPage: () => config.canPreviousPage ?? (config.pageIndex ?? 0) > 0,
  getCanNextPage: () => config.canNextPage ?? (config.pageIndex ?? 0) < (config.pageCount ?? 10) - 1,
  setPageIndex: () => {},
  previousPage: () => {},
  nextPage: () => {},
  setPageSize: () => {},
  getRowCount: () => config.rowCount ?? 100,
  getPageOptions: () => Array.from({ length: config.pageCount ?? 10 }, (_, i) => i)
} as unknown as Table<TData>)

const meta: Meta<typeof DataTablePagination> = {
  title: 'UI/DataTablePagination',
  component: DataTablePagination,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Pagination component for DataTable with page navigation and size controls.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    table: {
      description: 'TanStack Table instance',
      control: false
    },
    pageSizeOptions: {
      description: 'Available page size options',
      control: { type: 'object' }
    },
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Default pagination
export const Default: Story = {
  args: {
    table: createMockTable()
  }
}

// First page
export const FirstPage: Story = {
  args: {
    table: createMockTable({
      pageIndex: 0,
      pageCount: 10,
      canPreviousPage: false,
      canNextPage: true
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination on the first page with previous button disabled'
      }
    }
  }
}

// Last page
export const LastPage: Story = {
  args: {
    table: createMockTable({
      pageIndex: 9,
      pageCount: 10,
      canPreviousPage: true,
      canNextPage: false
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination on the last page with next button disabled'
      }
    }
  }
}

// Middle page
export const MiddlePage: Story = {
  args: {
    table: createMockTable({
      pageIndex: 5,
      pageCount: 20,
      rowCount: 200
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination in the middle of many pages'
      }
    }
  }
}

// Custom page sizes
export const CustomPageSizes: Story = {
  args: {
    table: createMockTable(),
    pageSizeOptions: [5, 10, 25, 50, 100]
  }
}

// With show all option
export const WithShowAll: Story = {
  args: {
    table: createMockTable({
      rowCount: 150
    }),
    pageSizeOptions: [10, 25, 50]
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination with "All" option to show all records'
      }
    }
  }
}

// Compact mode
export const Compact: Story = {
  args: {
    table: createMockTable(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact pagination with minimal controls'
      }
    }
  }
}

// Loading state
export const Loading: Story = {
  args: {
    table: createMockTable(),
  }
}

// Large dataset
export const LargeDataset: Story = {
  args: {
    table: createMockTable({
      pageIndex: 50,
      pageCount: 100,
      rowCount: 10000,
      pageSize: 100
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination for large dataset with 10,000 records'
      }
    }
  }
}

// Small dataset
export const SmallDataset: Story = {
  args: {
    table: createMockTable({
      pageIndex: 0,
      pageCount: 1,
      rowCount: 5,
      pageSize: 10
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination for small dataset that fits in one page'
      }
    }
  }
}

// Without page size select
export const NoPageSizeSelect: Story = {
  args: {
    table: createMockTable(),
  }
}

// Without page info
export const NoPageInfo: Story = {
  args: {
    table: createMockTable(),
  }
}

// Interactive example
export const Interactive: Story = {
  render: (args) => ({
    components: { DataTablePagination },
    setup() {
      const pageIndex = ref(0)
      const pageSize = ref(10)
      const totalRows = 250
      
      const table = {
        getState: () => ({
          pagination: {
            pageIndex: pageIndex.value,
            pageSize: pageSize.value
          }
        }),
        getPageCount: () => Math.ceil(totalRows / pageSize.value),
        getCanPreviousPage: () => pageIndex.value > 0,
        getCanNextPage: () => pageIndex.value < Math.ceil(totalRows / pageSize.value) - 1,
        setPageIndex: (index: number) => {
          pageIndex.value = index
        },
        previousPage: () => {
          if (pageIndex.value > 0) pageIndex.value--
        },
        nextPage: () => {
          if (pageIndex.value < Math.ceil(totalRows / pageSize.value) - 1) pageIndex.value++
        },
        setPageSize: (size: number) => {
          pageSize.value = size
          pageIndex.value = 0 // Reset to first page
        },
        getRowCount: () => totalRows,
        getPageOptions: () => Array.from({ length: Math.ceil(totalRows / pageSize.value) }, (_, i) => i)
      }
      
      return { args: { ...args, table } }
    },
    template: `
      <div>
        <div class="mb-4 p-4 bg-gray-50 rounded">
          <p class="text-sm text-gray-600">
            This is an interactive pagination component. Try clicking the navigation buttons
            or changing the page size to see it in action.
          </p>
        </div>
        <DataTablePagination v-bind="args" />
      </div>
    `
  }),
  args: {
    pageSizeOptions: [5, 10, 20, 50]
  }
}

// Custom styling
export const CustomStyling: Story = {
  render: (args) => ({
    components: { DataTablePagination },
    setup() {
      return { args }
    },
    template: `
      <div class="p-6 bg-slate-900 rounded-lg">
        <DataTablePagination v-bind="args" class="[&_button]:!bg-slate-700 [&_button]:!text-white [&_button:hover]:!bg-slate-600 [&_select]:!bg-slate-700 [&_select]:!text-white [&_span]:!text-slate-300" />
      </div>
    `
  }),
  args: {
    table: createMockTable({
      pageIndex: 2,
      pageCount: 5
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination with custom dark theme styling'
      }
    }
  }
}

// With many pages
export const ManyPages: Story = {
  args: {
    table: createMockTable({
      pageIndex: 25,
      pageCount: 50,
      rowCount: 5000,
      pageSize: 100
    })
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination with many pages showing ellipsis'
      }
    }
  }
}

// RTL support
export const RTLSupport: Story = {
  render: (args) => ({
    components: { DataTablePagination },
    setup() {
      return { args }
    },
    template: `
      <div dir="rtl">
        <DataTablePagination v-bind="args" />
      </div>
    `
  }),
  args: {
    table: createMockTable()
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination with RTL (Right-to-Left) layout support'
      }
    }
  }
}

// Mobile responsive
export const MobileResponsive: Story = {
  render: (args) => ({
    components: { DataTablePagination },
    setup() {
      return { args }
    },
    template: `
      <div class="max-w-sm mx-auto border rounded p-4">
        <p class="text-sm text-gray-600 mb-4">Mobile viewport (max-width: 384px)</p>
        <DataTablePagination v-bind="args" />
      </div>
    `
  }),
  args: {
    table: createMockTable(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination optimized for mobile devices'
      }
    }
  }
}