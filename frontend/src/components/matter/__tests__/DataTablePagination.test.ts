import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import DataTablePagination from '../DataTablePagination.vue'

// Mock components
vi.mock('~/components/ui/button', () => ({
  Button: {
    name: 'Button',
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>'
  }
}))

vi.mock('~/components/ui/select', () => ({
  Select: {
    name: 'Select',
    template: '<div class="select" @click="$emit(\'update:modelValue\', \'25\')"><slot /></div>'
  },
  SelectContent: { name: 'SelectContent', template: '<div><slot /></div>' },
  SelectItem: { name: 'SelectItem', template: '<div @click="$emit(\'select\')"><slot /></div>' },
  SelectTrigger: { name: 'SelectTrigger', template: '<div><slot /></div>' },
  SelectValue: { name: 'SelectValue', template: '<span>{{ value }}</span>' }
}))

// Mock Icon component
vi.mock('~/components/Icon', () => ({
  default: {
    name: 'Icon',
    template: '<span :data-icon="name" />'
  }
}))

describe('DataTablePagination', () => {
  let wrapper: VueWrapper<any>
  
  const defaultProps = {
    page: 1,
    pageSize: 25,
    total: 100
  }
  
  beforeEach(() => {
    wrapper = mount(DataTablePagination, {
      props: defaultProps
    })
  })

  describe('Results display', () => {
    it('displays correct result range for first page', () => {
      expect(wrapper.text()).toContain('Showing 1 to 25 of 100 results')
    })

    it('displays correct result range for middle page', async () => {
      await wrapper.setProps({ page: 3, pageSize: 25, total: 100 })
      expect(wrapper.text()).toContain('Showing 51 to 75 of 100 results')
    })

    it('displays correct result range for last page', async () => {
      await wrapper.setProps({ page: 4, pageSize: 25, total: 90 })
      expect(wrapper.text()).toContain('Showing 76 to 90 of 90 results')
    })

    it('displays "No results" when total is 0', async () => {
      await wrapper.setProps({ total: 0 })
      expect(wrapper.text()).toContain('No results')
    })

    it('handles single result correctly', async () => {
      await wrapper.setProps({ page: 1, pageSize: 25, total: 1 })
      expect(wrapper.text()).toContain('Showing 1 to 1 of 1 results')
    })
  })

  describe('Page size selector', () => {
    it('shows page size selector by default', () => {
      expect(wrapper.text()).toContain('Items per page:')
      expect(wrapper.find('.select').exists()).toBe(true)
    })

    it('hides page size selector when showPageSize is false', async () => {
      await wrapper.setProps({ showPageSize: false })
      expect(wrapper.text()).not.toContain('Items per page:')
    })

    it('displays current page size', () => {
      // The select should show the current value
      expect(wrapper.text()).toContain('25')
    })

    it('emits pageSizeChange when page size changes', async () => {
      await wrapper.setProps({ pageSizeOptions: [10, 25, 50] })
      
      const select = wrapper.find('.select')
      await select.trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('pageSizeChange')
    })

    it('resets to page 1 when page size changes', async () => {
      await wrapper.setProps({ page: 3 })
      
      // Simulate page size change
      await wrapper.vm.handlePageSizeChange('50')
      
      const emitted = wrapper.emitted()
      expect(emitted.pageSizeChange).toBeTruthy()
      expect(emitted.pageChange).toBeTruthy()
      expect(emitted.pageChange[0]).toEqual([1])
    })
  })

  describe('Navigation buttons', () => {
    it('shows previous and next buttons', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
      
      // Find prev/next buttons by their icons
      const prevButton = buttons.find(btn => 
        btn.find('[data-icon="lucide:chevron-left"]').exists()
      )
      const nextButton = buttons.find(btn => 
        btn.find('[data-icon="lucide:chevron-right"]').exists()
      )
      
      expect(prevButton).toBeTruthy()
      expect(nextButton).toBeTruthy()
    })

    it('disables previous button on first page', () => {
      const prevButton = wrapper.findAll('button').find(btn =>
        btn.find('[data-icon="lucide:chevron-left"]').exists()
      )
      
      expect(prevButton?.attributes('disabled')).toBeDefined()
    })

    it('enables previous button on other pages', async () => {
      await wrapper.setProps({ page: 2 })
      
      const prevButton = wrapper.findAll('button').find(btn =>
        btn.find('[data-icon="lucide:chevron-left"]').exists()
      )
      
      expect(prevButton?.attributes('disabled')).toBeUndefined()
    })

    it('disables next button on last page', async () => {
      await wrapper.setProps({ page: 4, total: 100 }) // 4 pages total
      
      const nextButton = wrapper.findAll('button').find(btn =>
        btn.find('[data-icon="lucide:chevron-right"]').exists()
      )
      
      expect(nextButton?.attributes('disabled')).toBeDefined()
    })

    it('enables next button on other pages', () => {
      const nextButton = wrapper.findAll('button').find(btn =>
        btn.find('[data-icon="lucide:chevron-right"]').exists()
      )
      
      expect(nextButton?.attributes('disabled')).toBeUndefined()
    })

    it('emits pageChange when clicking previous button', async () => {
      await wrapper.setProps({ page: 2 })
      
      const prevButton = wrapper.findAll('button').find(btn =>
        btn.find('[data-icon="lucide:chevron-left"]').exists()
      )
      
      await prevButton?.trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('pageChange')
      expect(wrapper.emitted().pageChange[0]).toEqual([1])
    })

    it('emits pageChange when clicking next button', async () => {
      const nextButton = wrapper.findAll('button').find(btn =>
        btn.find('[data-icon="lucide:chevron-right"]').exists()
      )
      
      await nextButton?.trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('pageChange')
      expect(wrapper.emitted().pageChange[0]).toEqual([2])
    })
  })

  describe('Page numbers', () => {
    it('displays page numbers for small page counts', async () => {
      await wrapper.setProps({ total: 75 }) // 3 pages
      
      const pageButtons = wrapper.findAll('button').filter(btn =>
        !btn.find('[data-icon]').exists()
      )
      
      expect(pageButtons.length).toBe(3)
      expect(pageButtons[0].text()).toBe('1')
      expect(pageButtons[1].text()).toBe('2')
      expect(pageButtons[2].text()).toBe('3')
    })

    it('shows ellipsis for large page counts', async () => {
      await wrapper.setProps({ total: 1000 }) // 40 pages
      
      expect(wrapper.text()).toContain('…')
    })

    it('highlights current page', async () => {
      await wrapper.setProps({ page: 2, total: 100 })
      
      const pageButtons = wrapper.findAll('button').filter(btn =>
        !btn.find('[data-icon]').exists()
      )
      
      const currentPageButton = pageButtons.find(btn => btn.text() === '2')
      expect(currentPageButton?.attributes('data-active')).toBe('true')
    })

    it('emits pageChange when clicking page number', async () => {
      await wrapper.setProps({ total: 100 })
      
      const pageButtons = wrapper.findAll('button').filter(btn =>
        !btn.find('[data-icon]').exists()
      )
      
      const page3Button = pageButtons.find(btn => btn.text() === '3')
      await page3Button?.trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('pageChange')
      expect(wrapper.emitted().pageChange[0]).toEqual([3])
    })

    it('does not emit when clicking current page', async () => {
      const pageButtons = wrapper.findAll('button').filter(btn =>
        !btn.find('[data-icon]').exists()
      )
      
      const currentPageButton = pageButtons.find(btn => btn.text() === '1')
      await currentPageButton?.trigger('click')
      
      // Should not emit since we're already on page 1
      expect(wrapper.emitted().pageChange).toBeFalsy()
    })
  })

  describe('Page range calculation', () => {
    it('shows all pages when total pages <= 7', async () => {
      await wrapper.setProps({ total: 150 }) // 6 pages
      
      const pageButtons = wrapper.findAll('button').filter(btn =>
        !btn.find('[data-icon]').exists()
      )
      
      expect(pageButtons.length).toBe(6)
      expect(wrapper.text()).not.toContain('…')
    })

    it('shows pages around current page with ellipsis', async () => {
      await wrapper.setProps({ page: 10, total: 500 }) // 20 pages, current page 10
      
      // Should show: 1 ... 8 9 10 11 12 ... 20
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('8')
      expect(wrapper.text()).toContain('9')
      expect(wrapper.text()).toContain('10')
      expect(wrapper.text()).toContain('11')
      expect(wrapper.text()).toContain('12')
      expect(wrapper.text()).toContain('20')
      expect(wrapper.text()).toContain('…')
    })

    it('shows correct range at beginning', async () => {
      await wrapper.setProps({ page: 2, total: 500 }) // 20 pages, current page 2
      
      // Should show: 1 2 3 4 ... 20
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('4')
      expect(wrapper.text()).toContain('20')
    })

    it('shows correct range at end', async () => {
      await wrapper.setProps({ page: 19, total: 500 }) // 20 pages, current page 19
      
      // Should show: 1 ... 17 18 19 20
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('17')
      expect(wrapper.text()).toContain('18')
      expect(wrapper.text()).toContain('19')
      expect(wrapper.text()).toContain('20')
    })
  })

  describe('Disabled state', () => {
    it('disables all controls when disabled prop is true', async () => {
      await wrapper.setProps({ disabled: true })
      
      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        expect(button.attributes('disabled')).toBeDefined()
      })
    })

    it('enables controls when disabled prop is false', () => {
      const buttons = wrapper.findAll('button')
      const enabledButtons = buttons.filter(btn => !btn.attributes('disabled'))
      
      expect(enabledButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Edge cases', () => {
    it('handles single page correctly', async () => {
      await wrapper.setProps({ page: 1, pageSize: 25, total: 20 })
      
      // Previous and next should be disabled
      const prevButton = wrapper.findAll('button').find(btn =>
        btn.find('[data-icon="lucide:chevron-left"]').exists()
      )
      const nextButton = wrapper.findAll('button').find(btn =>
        btn.find('[data-icon="lucide:chevron-right"]').exists()
      )
      
      expect(prevButton?.attributes('disabled')).toBeDefined()
      expect(nextButton?.attributes('disabled')).toBeDefined()
    })

    it('handles zero total correctly', async () => {
      await wrapper.setProps({ total: 0 })
      
      expect(wrapper.text()).toContain('No results')
      
      // All navigation should be disabled
      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        expect(button.attributes('disabled')).toBeDefined()
      })
    })

    it('validates page boundaries', async () => {
      // Try to go to page 0
      await wrapper.vm.goToPage(0)
      expect(wrapper.emitted().pageChange).toBeFalsy()
      
      // Try to go beyond total pages
      await wrapper.vm.goToPage(100)
      expect(wrapper.emitted().pageChange).toBeFalsy()
      
      // Valid page should work
      await wrapper.vm.goToPage(2)
      expect(wrapper.emitted().pageChange).toBeTruthy()
    })
  })

  describe('Responsive behavior', () => {
    it('has responsive CSS classes', () => {
      expect(wrapper.classes()).toContain('flex-col')
      expect(wrapper.classes()).toContain('sm:flex-row')
    })

    it('maintains functionality on mobile', () => {
      // All functionality should work regardless of screen size
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})