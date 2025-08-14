import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import DataTable from '../DataTable.vue'
import type { ColumnDef } from '@tanstack/vue-table'

// Mock data
interface ITestData {
  id: string
  name: string
  age: number
  email: string
}

const mockData: ITestData[] = [
  { id: '1', name: 'John Doe', age: 30, email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', age: 25, email: 'jane@example.com' },
  { id: '3', name: 'Bob Johnson', age: 35, email: 'bob@example.com' },
]

const mockColumns: ColumnDef<ITestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'age',
    header: 'Age',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
]

describe('DataTable Component', () => {
  it('should render table with provided data', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns as any,
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(true)
    
    // Check if all data rows are rendered
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(mockData.length)
  })

  it('should render column headers correctly', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns as any,
      },
    })

    const headers = wrapper.findAll('th')
    expect(headers).toHaveLength(mockColumns.length)
    expect(headers[0]?.text()).toBe('Name')
    expect(headers[1]?.text()).toBe('Age')
    expect(headers[2]?.text()).toBe('Email')
  })

  it('should handle empty data gracefully', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: [],
        columns: mockColumns as any,
      },
    })

    expect(wrapper.find('table').exists()).toBe(true)
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(0)
  })

  it('should support column sorting', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns.map(col => ({ ...col, enableSorting: true })) as any,
      },
    })

    // Click on a sortable header
    const nameHeader = wrapper.find('th:first-child button')
    expect(nameHeader.exists()).toBe(true)
    
    await nameHeader.trigger('click')
    
    // Check if sorting indicator appears
    expect(wrapper.find('[data-testid="sort-indicator"]').exists()).toBe(true)
  })

  it('should emit selection events when row selection is enabled', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns as any,
        enableRowSelection: true,
      },
    })

    // Find checkbox in first row
    const checkbox = wrapper.find('tbody tr:first-child input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)
    
    // Click checkbox
    await checkbox.trigger('click')
    
    // Check if selection event was emitted
    expect(wrapper.emitted('update:selected')).toBeTruthy()
    const emittedSelection = wrapper.emitted('update:selected')?.[0]?.[0] as Set<string>
    expect(emittedSelection.has('1')).toBe(true)
  })

  it('should support column visibility toggle', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns as any,
        enableColumnVisibility: true,
      },
    })

    // Initially all columns should be visible
    let headers = wrapper.findAll('th')
    expect(headers).toHaveLength(mockColumns.length)

    // Emit column visibility change
    await wrapper.vm.$emit('update:columnVisibility', { name: false, age: true, email: true })
    await wrapper.vm.$nextTick()

    // Check if column is hidden
    headers = wrapper.findAll('th')
    expect(headers).toHaveLength(2) // One column hidden
  })

  it('should handle loading state', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns as any,
        loading: true,
      },
    })

    // Should show loading indicator or skeleton
    expect(wrapper.find('[data-testid="loading-indicator"]').exists() || 
           wrapper.find('.skeleton').exists()).toBe(true)
  })

  it('should support custom cell rendering', () => {
    const customColumns: ColumnDef<unknown, unknown>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => h('span', { class: 'custom-cell' }, (row.original as ITestData).name.toUpperCase()),
      },
    ]

    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: customColumns,
      },
    })

    const customCell = wrapper.find('.custom-cell')
    expect(customCell.exists()).toBe(true)
    expect(customCell.text()).toBe('JOHN DOE')
  })

  it('should apply custom row classes', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns as any,
        rowClassName: (row: ITestData) => row.age > 30 ? 'old-row' : 'young-row',
      },
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0]?.classes()).toContain('young-row') // John, age 30
    expect(rows[1]?.classes()).toContain('young-row') // Jane, age 25
    expect(rows[2]?.classes()).toContain('old-row')   // Bob, age 35
  })

  it('should handle column pinning', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns.map((col, idx) => ({
          ...col,
          enablePinning: true,
          pinned: idx === 0 ? 'left' : false,
        })) as any,
      },
    })

    // Check if first column has pinning styles
    const firstColumn = wrapper.find('th:first-child')
    expect(firstColumn.classes()).toContain('pinned-left')
  })

  it('should emit sort events', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns.map(col => ({ ...col, enableSorting: true })) as any,
      },
    })

    const sortButton = wrapper.find('th:first-child button')
    await sortButton.trigger('click')

    expect(wrapper.emitted('sort')).toBeTruthy()
    const sortEvent = wrapper.emitted('sort')?.[0]?.[0]
    expect(sortEvent).toMatchObject({
      column: 'name',
      direction: expect.stringMatching(/^(asc|desc)$/),
    })
  })

  it('should support global filtering', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns as any,
        enableGlobalFilter: true,
        globalFilter: 'john',
      },
    })

    // Should only show rows matching the filter
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2) // John Doe and Bob Johnson
  })

  it('should handle column resizing', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns.map(col => ({ ...col, enableResizing: true })) as any,
      },
    })

    // Check if resize handles are present
    const resizeHandles = wrapper.findAll('[data-testid="column-resize-handle"]')
    expect(resizeHandles.length).toBeGreaterThan(0)
  })

  it('should support row expansion', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns as any,
        enableRowExpansion: true,
        expandedRowContent: (row: ITestData) => h('div', `Details for ${row.name}`),
      },
    })

    // Find expand button
    const expandButton = wrapper.find('tbody tr:first-child [data-testid="expand-button"]')
    expect(expandButton.exists()).toBe(true)

    // Click to expand
    await expandButton.trigger('click')

    // Check if expanded content is shown
    const expandedContent = wrapper.find('[data-testid="expanded-content"]')
    expect(expandedContent.exists()).toBe(true)
    expect(expandedContent.text()).toContain('Details for John Doe')
  })

  it('should handle errors gracefully', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const wrapper = mount(DataTable, {
      props: {
        data: null as any, // Invalid data
        columns: mockColumns as any,
      },
    })

    // Should still render without crashing
    expect(wrapper.exists()).toBe(true)
    
    consoleError.mockRestore()
  })
})