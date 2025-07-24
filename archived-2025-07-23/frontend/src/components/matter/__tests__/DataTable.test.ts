import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import DataTable from '../DataTable.vue'
import DataTablePagination from '../DataTablePagination.vue'
import type { DataTableColumn } from '../DataTable.vue'

// Mock Icon component
vi.mock('~/components/Icon', () => ({
  default: {
    name: 'Icon',
    template: '<span :data-icon="name" />'
  }
}))

// Mock utils
vi.mock('~/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

interface TestData {
  id: string
  name: string
  status: string
  priority: number
  createdAt: Date
}

describe('DataTable', () => {
  let wrapper: VueWrapper<any>
  
  const testData: TestData[] = [
    { id: '1', name: 'Matter A', status: 'active', priority: 1, createdAt: new Date('2024-01-01') },
    { id: '2', name: 'Matter B', status: 'pending', priority: 2, createdAt: new Date('2024-01-02') },
    { id: '3', name: 'Matter C', status: 'complete', priority: 3, createdAt: new Date('2024-01-03') }
  ]
  
  const columns: DataTableColumn<TestData>[] = [
    { key: 'id', header: 'ID', sortable: false },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'priority', header: 'Priority', sortable: true },
    { key: 'createdAt', header: 'Created', sortable: true }
  ]
  
  const defaultProps = {
    columns,
    data: testData,
    page: 1,
    pageSize: 10,
    total: 3
  }
  
  beforeEach(() => {
    wrapper = mount(DataTable, {
      props: defaultProps,
      global: {
        components: {
          DataTablePagination
        }
      }
    })
  })

  describe('Rendering', () => {
    it('renders table with correct structure', () => {
      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.find('thead').exists()).toBe(true)
      expect(wrapper.find('tbody').exists()).toBe(true)
    })

    it('renders correct number of columns', () => {
      const headers = wrapper.findAll('thead th')
      expect(headers).toHaveLength(columns.length)
    })

    it('renders correct column headers', () => {
      const headers = wrapper.findAll('thead th')
      columns.forEach((col, index) => {
        expect(headers[index].text()).toContain(col.header)
      })
    })

    it('renders correct number of data rows', () => {
      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(testData.length)
    })

    it('renders cell data correctly', () => {
      const firstRow = wrapper.findAll('tbody tr')[0]
      const cells = firstRow.findAll('td')
      
      expect(cells[0].text()).toBe('1')
      expect(cells[1].text()).toBe('Matter A')
      expect(cells[2].text()).toBe('active')
      expect(cells[3].text()).toBe('1')
    })

    it('shows sort icons for sortable columns', () => {
      const headers = wrapper.findAll('thead th')
      
      // First column is not sortable
      expect(headers[0].find('[data-icon]').exists()).toBe(false)
      
      // Other columns are sortable
      for (let i = 1; i < headers.length; i++) {
        expect(headers[i].find('[data-icon]').exists()).toBe(true)
      }
    })
  })

  describe('Empty state', () => {
    it('displays empty message when no data', async () => {
      await wrapper.setProps({ data: [] })
      
      const emptyRow = wrapper.find('tbody tr')
      expect(emptyRow.text()).toBe('No matters found')
    })

    it('displays custom empty message', async () => {
      await wrapper.setProps({ 
        data: [],
        emptyMessage: 'No results found'
      })
      
      const emptyRow = wrapper.find('tbody tr')
      expect(emptyRow.text()).toBe('No results found')
    })
  })

  describe('Loading state', () => {
    it('shows loading indicator when loading', async () => {
      await wrapper.setProps({ loading: true })
      
      expect(wrapper.find('.data-table__loading').exists()).toBe(true)
      expect(wrapper.find('[data-icon="lucide:loader-2"]').exists()).toBe(true)
    })

    it('hides table when loading', async () => {
      await wrapper.setProps({ loading: true })
      
      expect(wrapper.find('.data-table__container').exists()).toBe(false)
    })
  })

  describe('Error state', () => {
    it('shows error message when error exists', async () => {
      const error = new Error('Failed to load data')
      await wrapper.setProps({ error })
      
      expect(wrapper.find('.data-table__error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to load data')
    })

    it('hides table when error exists', async () => {
      await wrapper.setProps({ error: new Error('Test error') })
      
      expect(wrapper.find('.data-table__container').exists()).toBe(false)
    })
  })

  describe('Sorting', () => {
    it('emits sort event when clicking sortable column', async () => {
      const nameHeader = wrapper.findAll('thead th')[1]
      await nameHeader.trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('sort')
      expect(wrapper.emitted().sort[0]).toEqual(['name', 'asc'])
    })

    it('does not emit sort event for non-sortable columns', async () => {
      const idHeader = wrapper.findAll('thead th')[0]
      await idHeader.trigger('click')
      
      expect(wrapper.emitted()).not.toHaveProperty('sort')
    })

    it('toggles sort direction on repeated clicks', async () => {
      const nameHeader = wrapper.findAll('thead th')[1]
      
      // First click - ascending
      await nameHeader.trigger('click')
      expect(wrapper.emitted().sort[0]).toEqual(['name', 'asc'])
      
      // Second click - descending
      await nameHeader.trigger('click')
      expect(wrapper.emitted().sort[1]).toEqual(['name', 'desc'])
      
      // Third click - ascending again
      await nameHeader.trigger('click')
      expect(wrapper.emitted().sort[2]).toEqual(['name', 'asc'])
    })

    it('changes sort column when clicking different column', async () => {
      const nameHeader = wrapper.findAll('thead th')[1]
      const statusHeader = wrapper.findAll('thead th')[2]
      
      // Click name column
      await nameHeader.trigger('click')
      expect(wrapper.emitted().sort[0]).toEqual(['name', 'asc'])
      
      // Click status column - should reset to ascending
      await statusHeader.trigger('click')
      expect(wrapper.emitted().sort[1]).toEqual(['status', 'asc'])
    })

    it('updates sort icon based on current sort state', async () => {
      const nameHeader = wrapper.findAll('thead th')[1]
      
      // Initial state - chevrons-up-down
      expect(nameHeader.find('[data-icon="lucide:chevrons-up-down"]').exists()).toBe(true)
      
      // After first click - chevron-up (ascending)
      await nameHeader.trigger('click')
      await wrapper.vm.$nextTick()
      expect(nameHeader.find('[data-icon="lucide:chevron-up"]').exists()).toBe(true)
      
      // After second click - chevron-down (descending)  
      await nameHeader.trigger('click')
      await wrapper.vm.$nextTick()
      expect(nameHeader.find('[data-icon="lucide:chevron-down"]').exists()).toBe(true)
    })

    it('respects sortable prop', async () => {
      await wrapper.setProps({ sortable: false })
      
      const nameHeader = wrapper.findAll('thead th')[1]
      await nameHeader.trigger('click')
      
      expect(wrapper.emitted()).not.toHaveProperty('sort')
    })
  })

  describe('Pagination', () => {
    it('shows pagination when showPagination is true', () => {
      expect(wrapper.findComponent(DataTablePagination).exists()).toBe(true)
    })

    it('hides pagination when showPagination is false', async () => {
      await wrapper.setProps({ showPagination: false })
      expect(wrapper.findComponent(DataTablePagination).exists()).toBe(false)
    })

    it('passes correct props to pagination component', () => {
      const pagination = wrapper.findComponent(DataTablePagination)
      
      expect(pagination.props('page')).toBe(1)
      expect(pagination.props('pageSize')).toBe(10)
      expect(pagination.props('total')).toBe(3)
    })

    it('emits pageChange event from pagination', async () => {
      const pagination = wrapper.findComponent(DataTablePagination)
      await pagination.vm.$emit('page-change', 2)
      
      expect(wrapper.emitted()).toHaveProperty('pageChange')
      expect(wrapper.emitted().pageChange[0]).toEqual([2])
    })

    it('emits pageSizeChange event from pagination', async () => {
      const pagination = wrapper.findComponent(DataTablePagination)
      await pagination.vm.$emit('page-size-change', 25)
      
      expect(wrapper.emitted()).toHaveProperty('pageSizeChange')
      expect(wrapper.emitted().pageSizeChange[0]).toEqual([25])
    })
  })

  describe('Formatting', () => {
    it('applies custom formatter to cell values', async () => {
      const columnsWithFormatter: DataTableColumn<TestData>[] = [
        {
          key: 'name',
          header: 'Name',
          formatter: (value) => `[${value}]`
        },
        {
          key: 'status',
          header: 'Status',
          formatter: (value) => value.toUpperCase()
        }
      ]
      
      await wrapper.setProps({ columns: columnsWithFormatter })
      
      const firstRow = wrapper.findAll('tbody tr')[0]
      const cells = firstRow.findAll('td')
      
      expect(cells[0].text()).toBe('[Matter A]')
      expect(cells[1].text()).toBe('ACTIVE')
    })

    it('handles null and undefined values', async () => {
      const dataWithNulls = [
        { id: '1', name: null, status: undefined, priority: 0, createdAt: new Date() }
      ]
      
      await wrapper.setProps({ data: dataWithNulls })
      
      const cells = wrapper.findAll('tbody td')
      expect(cells[1].text()).toBe('-') // null
      expect(cells[2].text()).toBe('-') // undefined
    })

    it('formats boolean values', async () => {
      const dataWithBooleans = [
        { id: '1', name: 'Test', status: 'active', priority: 1, isActive: true, createdAt: new Date() }
      ]
      
      const columnsWithBoolean: DataTableColumn<any>[] = [
        ...columns,
        { key: 'isActive', header: 'Active' }
      ]
      
      await wrapper.setProps({ 
        data: dataWithBooleans,
        columns: columnsWithBoolean
      })
      
      const cells = wrapper.findAll('tbody td')
      expect(cells[5].text()).toBe('Yes')
    })

    it('formats Date objects', async () => {
      const cells = wrapper.findAll('tbody td')
      expect(cells[4].text()).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // Date format
    })
  })

  describe('Column alignment', () => {
    it('applies column alignment classes', async () => {
      const columnsWithAlignment: DataTableColumn<TestData>[] = [
        { key: 'id', header: 'ID', align: 'left' },
        { key: 'name', header: 'Name', align: 'center' },
        { key: 'priority', header: 'Priority', align: 'right' }
      ]
      
      await wrapper.setProps({ columns: columnsWithAlignment })
      
      const headers = wrapper.findAll('thead th')
      const cells = wrapper.findAll('tbody td')
      
      expect(headers[0].classes()).not.toContain('text-center')
      expect(headers[1].classes()).toContain('text-center')
      expect(headers[2].classes()).toContain('text-right')
      
      expect(cells[0].classes()).not.toContain('text-center')
      expect(cells[1].classes()).toContain('text-center')
      expect(cells[2].classes()).toContain('text-right')
    })
  })

  describe('CSS classes', () => {
    it('applies custom className', async () => {
      await wrapper.setProps({ className: 'custom-table' })
      
      expect(wrapper.find('.data-table').classes()).toContain('custom-table')
    })

    it('applies column-specific classes', async () => {
      const columnsWithClasses: DataTableColumn<TestData>[] = [
        { 
          key: 'status', 
          header: 'Status',
          className: 'status-column'
        }
      ]
      
      await wrapper.setProps({ columns: columnsWithClasses })
      
      const header = wrapper.find('thead th')
      const cell = wrapper.find('tbody td')
      
      expect(header.classes()).toContain('status-column')
      expect(cell.classes()).toContain('status-column')
    })
  })

  describe('Accessibility', () => {
    it('has proper table structure for screen readers', () => {
      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.find('thead').exists()).toBe(true)
      expect(wrapper.find('tbody').exists()).toBe(true)
    })

    it('uses semantic HTML for empty state', async () => {
      await wrapper.setProps({ data: [] })
      
      const emptyCell = wrapper.find('tbody td')
      expect(emptyCell.attributes('colspan')).toBe(String(columns.length))
    })
  })
})