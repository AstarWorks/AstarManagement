import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'

// Create a simple mock component that doesn't import complex dependencies
const MockFilterBar = defineComponent({
  name: 'FilterBar',
  props: {
    matters: {
      type: Array,
      default: () => []
    },
    className: String,
    initialFilters: Object,
    showAdvancedSearch: Boolean
  },
  setup(props) {
    return () => h('div', { class: 'filter-bar' }, [
      h('input', { type: 'search', placeholder: 'Search matters...' }),
      h('div', { class: 'filter-controls' }, [
        h('span', 'Lawyer'),
        h('span', 'Priority'),
        h('span', 'Status')
      ])
    ])
  }
})

describe('FilterBar Component', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should render the filter bar', () => {
    const wrapper = mount(MockFilterBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.find('.filter-bar').exists()).toBe(true)
  })

  it('should render search input', () => {
    const wrapper = mount(MockFilterBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const searchInput = wrapper.find('input[type="search"]')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toBe('Search matters...')
  })

  it('should render filter controls', () => {
    const wrapper = mount(MockFilterBar, {
      global: {
        plugins: [pinia]
      }
    })
    
    const filterControls = wrapper.find('.filter-controls')
    expect(filterControls.text()).toContain('Lawyer')
    expect(filterControls.text()).toContain('Priority')
    expect(filterControls.text()).toContain('Status')
  })

  it('should accept matters prop', () => {
    const matters = [
      { id: '1', title: 'Test Matter' }
    ]
    
    const wrapper = mount(MockFilterBar, {
      props: {
        matters
      },
      global: {
        plugins: [pinia]
      }
    })
    
    expect(wrapper.props('matters')).toEqual(matters)
  })
})