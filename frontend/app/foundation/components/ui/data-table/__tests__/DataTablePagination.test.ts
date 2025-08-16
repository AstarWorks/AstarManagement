import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTablePagination from '../DataTablePagination.vue'
import type { Table } from '@tanstack/vue-table'

// Mock TanStack table instance
const createMockTable = (overrides = {}): Table<any> => ({
  getState: vi.fn(() => ({
    pagination: {
      pageIndex: 0,
      pageSize: 10
    }
  })),
  getPageCount: vi.fn(() => 5),
  getCanPreviousPage: vi.fn(() => false),
  getCanNextPage: vi.fn(() => true),
  setPageIndex: vi.fn(),
  previousPage: vi.fn(),
  nextPage: vi.fn(),
  setPageSize: vi.fn(),
  getRowCount: vi.fn(() => 50),
  ...overrides
} as any)

describe('DataTablePagination Component', () => {
  it('should render pagination controls', () => {
    const table = createMockTable()
    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="pagination-info"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="page-size-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pagination-controls"]').exists()).toBe(true)
  })

  it('should display correct page information', () => {
    const table = createMockTable({
      getState: vi.fn(() => ({
        pagination: {
          pageIndex: 2,
          pageSize: 10
        }
      })),
      getPageCount: vi.fn(() => 10),
      getRowCount: vi.fn(() => 100)
    })

    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    const info = wrapper.find('[data-testid="pagination-info"]')
    expect(info.text()).toContain('21-30')
    expect(info.text()).toContain('100')
  })

  it('should disable previous button on first page', () => {
    const table = createMockTable({
      getCanPreviousPage: vi.fn(() => false),
      getCanNextPage: vi.fn(() => true)
    })

    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    const prevButton = wrapper.find('[data-testid="prev-page-button"]')
    expect(prevButton.attributes('disabled')).toBeDefined()
  })

  it('should disable next button on last page', () => {
    const table = createMockTable({
      getState: vi.fn(() => ({
        pagination: {
          pageIndex: 4,
          pageSize: 10
        }
      })),
      getCanPreviousPage: vi.fn(() => true),
      getCanNextPage: vi.fn(() => false)
    })

    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    const nextButton = wrapper.find('[data-testid="next-page-button"]')
    expect(nextButton.attributes('disabled')).toBeDefined()
  })

  it('should handle page navigation', async () => {
    const table = createMockTable({
      getCanPreviousPage: vi.fn(() => true),
      getCanNextPage: vi.fn(() => true)
    })

    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    // Click next page
    const nextButton = wrapper.find('[data-testid="next-page-button"]')
    await nextButton.trigger('click')
    expect(table.nextPage).toHaveBeenCalled()

    // Click previous page
    const prevButton = wrapper.find('[data-testid="prev-page-button"]')
    await prevButton.trigger('click')
    expect(table.previousPage).toHaveBeenCalled()
  })

  it('should handle direct page navigation', async () => {
    const table = createMockTable({
      getPageCount: vi.fn(() => 10)
    })

    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    // Click on page 3
    const pageButton = wrapper.find('[data-testid="page-button-3"]')
    await pageButton.trigger('click')
    expect(table.setPageIndex).toHaveBeenCalledWith(2) // 0-indexed
  })

  it('should handle page size changes', async () => {
    const table = createMockTable()
    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    const select = wrapper.find('[data-testid="page-size-select"]')
    await select.setValue('25')
    
    expect(table.setPageSize).toHaveBeenCalledWith(25)
  })

  it('should show ellipsis for many pages', () => {
    const table = createMockTable({
      getState: vi.fn(() => ({
        pagination: {
          pageIndex: 5,
          pageSize: 10
        }
      })),
      getPageCount: vi.fn(() => 20)
    })

    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    const ellipsis = wrapper.findAll('[data-testid="pagination-ellipsis"]')
    expect(ellipsis.length).toBeGreaterThan(0)
  })

  it('should emit page change events', async () => {
    const table = createMockTable()
    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    await wrapper.find('[data-testid="next-page-button"]').trigger('click')
    
    expect(wrapper.emitted('pageChange')).toBeTruthy()
    const pageChangeEvent = wrapper.emitted('pageChange')?.[0]?.[0]
    expect(pageChangeEvent).toMatchObject({
      pageIndex: expect.any(Number),
      pageSize: expect.any(Number)
    })
  })

  it('should handle empty data gracefully', () => {
    const table = createMockTable({
      getRowCount: vi.fn(() => 0),
      getPageCount: vi.fn(() => 0)
    })

    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    const info = wrapper.find('[data-testid="pagination-info"]')
    expect(info.text()).toContain('0')
  })

  it('should support custom page sizes', () => {
    const table = createMockTable()
    const customPageSizes = [5, 15, 30, 50]
    
    const wrapper = mount(DataTablePagination, {
      props: { 
        table,
        pageSizeOptions: customPageSizes
      }
    })

    const options = wrapper.findAll('[data-testid="page-size-option"]')
    expect(options).toHaveLength(customPageSizes.length)
    
    customPageSizes.forEach((size, index) => {
      expect(options[index]?.text()).toBe(size.toString())
    })
  })

  it('should support show all option', async () => {
    const table = createMockTable({
      getRowCount: vi.fn(() => 150)
    })

    const wrapper = mount(DataTablePagination, {
      props: { 
        table,
        showAllOption: true
      }
    })

    const select = wrapper.find('[data-testid="page-size-select"]')
    const allOption = wrapper.find('[data-testid="page-size-all-option"]')
    
    expect(allOption.exists()).toBe(true)
    
    await select.setValue('-1')
    expect(table.setPageSize).toHaveBeenCalledWith(150)
  })

  it('should handle keyboard navigation', async () => {
    const table = createMockTable({
      getCanPreviousPage: vi.fn(() => true),
      getCanNextPage: vi.fn(() => true)
    })

    const wrapper = mount(DataTablePagination, {
      props: { table }
    })

    const pagination = wrapper.find('[data-testid="pagination-controls"]')
    
    // Simulate keyboard events
    await pagination.trigger('keydown', { key: 'ArrowLeft' })
    expect(table.previousPage).toHaveBeenCalled()

    await pagination.trigger('keydown', { key: 'ArrowRight' })
    expect(table.nextPage).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    const table = createMockTable()
    const wrapper = mount(DataTablePagination, {
      props: { 
        table,
        loading: true
      }
    })

    const controls = wrapper.find('[data-testid="pagination-controls"]')
    expect(controls.classes()).toContain('opacity-50')
    expect(controls.classes()).toContain('pointer-events-none')
  })

  it('should support compact mode', () => {
    const table = createMockTable()
    const wrapper = mount(DataTablePagination, {
      props: { 
        table,
        compact: true
      }
    })

    // In compact mode, only show essential controls
    expect(wrapper.find('[data-testid="page-size-select"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="pagination-info"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pagination-controls"]').exists()).toBe(true)
  })

  it('should calculate correct display range', () => {
    const testCases = [
      { pageIndex: 0, pageSize: 10, total: 50, expected: '1-10' },
      { pageIndex: 1, pageSize: 10, total: 50, expected: '11-20' },
      { pageIndex: 4, pageSize: 10, total: 45, expected: '41-45' },
      { pageIndex: 0, pageSize: 25, total: 10, expected: '1-10' }
    ]

    testCases.forEach(({ pageIndex, pageSize, total, expected }) => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          pagination: { pageIndex, pageSize }
        })),
        getRowCount: vi.fn(() => total)
      })

      const wrapper = mount(DataTablePagination, {
        props: { table }
      })

      const info = wrapper.find('[data-testid="pagination-info"]')
      expect(info.text()).toContain(expected)
    })
  })
})