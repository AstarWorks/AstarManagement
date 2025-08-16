import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ColumnVisibilityDropdown from '../ColumnVisibilityDropdown.vue'
import type { Table } from '@tanstack/vue-table'

// Mock column definitions
const mockColumns = [
  {
    id: 'name',
    columnDef: {
      header: 'Name',
      enableHiding: true
    },
    getCanHide: () => true,
    getIsVisible: () => true,
    toggleVisibility: vi.fn()
  },
  {
    id: 'email',
    columnDef: {
      header: 'Email',
      enableHiding: true
    },
    getCanHide: () => true,
    getIsVisible: () => true,
    toggleVisibility: vi.fn()
  },
  {
    id: 'actions',
    columnDef: {
      header: 'Actions',
      enableHiding: false
    },
    getCanHide: () => false,
    getIsVisible: () => true,
    toggleVisibility: vi.fn()
  }
]

// Mock TanStack table instance
const createMockTable = (overrides = {}): Table<any> => ({
  getAllColumns: vi.fn(() => mockColumns),
  getIsAllColumnsVisible: vi.fn(() => true),
  toggleAllColumnsVisible: vi.fn(),
  getVisibleColumns: vi.fn(() => mockColumns.filter(c => c.getIsVisible())),
  getState: vi.fn(() => ({
    columnVisibility: {
      name: true,
      email: true,
      actions: true
    }
  })),
  setColumnVisibility: vi.fn(),
  ...overrides
} as any)

describe('ColumnVisibilityDropdown Component', () => {
  it('should render dropdown trigger button', () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    expect(wrapper.exists()).toBe(true)
    const trigger = wrapper.find('[data-testid="column-visibility-trigger"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.text()).toContain('Columns')
  })

  it('should show dropdown content on click', async () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    const trigger = wrapper.find('[data-testid="column-visibility-trigger"]')
    await trigger.trigger('click')

    const dropdown = wrapper.find('[data-testid="column-visibility-dropdown"]')
    expect(dropdown.exists()).toBe(true)
  })

  it('should list all hideable columns', async () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')

    const columnItems = wrapper.findAll('[data-testid^="column-item-"]')
    expect(columnItems).toHaveLength(2) // Only hideable columns (name, email)
    
    expect(columnItems[0]?.text()).toContain('Name')
    expect(columnItems[1]?.text()).toContain('Email')
  })

  it('should not list non-hideable columns', async () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')

    const actionsItem = wrapper.find('[data-testid="column-item-actions"]')
    expect(actionsItem.exists()).toBe(false)
  })

  it('should show checkboxes for visible columns', async () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')

    const checkboxes = wrapper.findAll('[data-testid^="column-checkbox-"]')
    expect(checkboxes).toHaveLength(2)
    
    checkboxes.forEach(checkbox => {
      expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    })
  })

  it('should toggle column visibility on checkbox click', async () => {
    const toggleVisibility = vi.fn()
    const columns = mockColumns.map(col => ({
      ...col,
      toggleVisibility
    }))

    const table = createMockTable({
      getAllColumns: vi.fn(() => columns)
    })
    
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')

    const nameCheckbox = wrapper.find('[data-testid="column-checkbox-name"]')
    await nameCheckbox.trigger('click')

    expect(toggleVisibility).toHaveBeenCalled()
  })

  it('should show "Show All" / "Hide All" buttons', async () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')

    const showAllButton = wrapper.find('[data-testid="show-all-columns"]')
    const hideAllButton = wrapper.find('[data-testid="hide-all-columns"]')

    expect(showAllButton.exists()).toBe(true)
    expect(hideAllButton.exists()).toBe(true)
  })

  it('should handle show all columns', async () => {
    const table = createMockTable({
      getIsAllColumnsVisible: vi.fn(() => false)
    })
    
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')
    
    const showAllButton = wrapper.find('[data-testid="show-all-columns"]')
    await showAllButton.trigger('click')

    expect(table.toggleAllColumnsVisible).toHaveBeenCalledWith(true)
  })

  it('should handle hide all columns', async () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')
    
    const hideAllButton = wrapper.find('[data-testid="hide-all-columns"]')
    await hideAllButton.trigger('click')

    expect(table.toggleAllColumnsVisible).toHaveBeenCalledWith(false)
  })

  it('should display column count in trigger', () => {
    const table = createMockTable({
      getVisibleColumns: vi.fn(() => mockColumns.slice(0, 2))
    })
    
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    const trigger = wrapper.find('[data-testid="column-visibility-trigger"]')
    expect(trigger.text()).toContain('2')
  })

  it('should close dropdown when clicking outside', async () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table },
      attachTo: document.body
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')
    expect(wrapper.find('[data-testid="column-visibility-dropdown"]').exists()).toBe(true)

    // Simulate click outside
    document.body.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="column-visibility-dropdown"]').exists()).toBe(false)
    
    wrapper.unmount()
  })

  it('should support keyboard navigation', async () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    const trigger = wrapper.find('[data-testid="column-visibility-trigger"]')
    
    // Open with Enter key
    await trigger.trigger('keydown', { key: 'Enter' })
    expect(wrapper.find('[data-testid="column-visibility-dropdown"]').exists()).toBe(true)

    // Close with Escape key
    await wrapper.find('[data-testid="column-visibility-dropdown"]').trigger('keydown', { key: 'Escape' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="column-visibility-dropdown"]').exists()).toBe(false)
  })

  it('should handle empty columns gracefully', () => {
    const table = createMockTable({
      getAllColumns: vi.fn(() => [])
    })
    
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    expect(wrapper.exists()).toBe(true)
    expect(() => wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')).not.toThrow()
  })

  it('should support custom trigger text', () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { 
        table,
        triggerText: 'Select Columns'
      }
    })

    const trigger = wrapper.find('[data-testid="column-visibility-trigger"]')
    expect(trigger.text()).toContain('Select Columns')
  })

  it('should apply custom classes to dropdown', () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { 
        table,
        dropdownClass: 'custom-dropdown-class'
      }
    })

    const dropdown = wrapper.find('[data-testid="column-visibility-dropdown"]')
    expect(dropdown.classes()).toContain('custom-dropdown-class')
  })

  it('should emit visibility change events', async () => {
    const toggleVisibility = vi.fn()
    const columns = mockColumns.map(col => ({
      ...col,
      toggleVisibility
    }))

    const table = createMockTable({
      getAllColumns: vi.fn(() => columns)
    })
    
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { table }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')
    await wrapper.find('[data-testid="column-checkbox-name"]').trigger('click')

    expect(wrapper.emitted('columnVisibilityChange')).toBeTruthy()
    const event = wrapper.emitted('columnVisibilityChange')?.[0]?.[0]
    expect(event).toMatchObject({
      columnId: 'name',
      visible: expect.any(Boolean)
    })
  })

  it('should support search/filter functionality', async () => {
    const table = createMockTable()
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { 
        table,
        enableSearch: true
      }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')
    
    const searchInput = wrapper.find('[data-testid="column-search-input"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('email')
    
    const columnItems = wrapper.findAll('[data-testid^="column-item-"]')
    expect(columnItems).toHaveLength(1)
    expect(columnItems[0]?.text()).toContain('Email')
  })

  it('should group columns by category if provided', async () => {
    const categorizedColumns = [
      {
        ...mockColumns[0]!,
        columnDef: {
          ...mockColumns[0]!.columnDef,
          meta: { category: 'Personal' }
        }
      },
      {
        ...mockColumns[1]!,
        columnDef: {
          ...mockColumns[1]!.columnDef,
          meta: { category: 'Contact' }
        }
      }
    ]

    const table = createMockTable({
      getAllColumns: vi.fn(() => categorizedColumns)
    })
    
    const wrapper = mount(ColumnVisibilityDropdown, {
      props: { 
        table,
        groupByCategory: true
      }
    })

    await wrapper.find('[data-testid="column-visibility-trigger"]').trigger('click')

    const categoryHeaders = wrapper.findAll('[data-testid^="category-header-"]')
    expect(categoryHeaders).toHaveLength(2)
    expect(categoryHeaders[0]?.text()).toContain('Personal')
    expect(categoryHeaders[1]?.text()).toContain('Contact')
  })
})