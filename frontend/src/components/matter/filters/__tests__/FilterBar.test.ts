import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import FilterBar from '../FilterBar.vue'
import { MATTER_FILTER_CONFIGS, MATTER_FILTER_PRESETS } from '../FilterConfig'
import type { FilterState } from '../FilterConfig'

// Mock the components that are imported
vi.mock('~/components/ui/button', () => ({
  Button: { template: '<button><slot /></button>' }
}))

vi.mock('~/components/ui/badge', () => ({
  Badge: { template: '<span><slot /></span>' }
}))

vi.mock('~/components/ui/dropdown-menu', () => ({
  DropdownMenu: { template: '<div><slot /></div>' },
  DropdownMenuContent: { template: '<div><slot /></div>' },
  DropdownMenuItem: { template: '<div><slot /></div>' },
  DropdownMenuTrigger: { template: '<div><slot /></div>' },
  DropdownMenuSeparator: { template: '<hr />' }
}))

vi.mock('../TextFilter.vue', () => ({
  default: { template: '<input />', props: ['config', 'modelValue', 'disabled'], emits: ['update:modelValue', 'clear'] }
}))

vi.mock('../SelectFilter.vue', () => ({
  default: { template: '<select />', props: ['config', 'modelValue', 'disabled'], emits: ['update:modelValue', 'clear'] }
}))

vi.mock('../DateRangeFilter.vue', () => ({
  default: { template: '<input type="date" />', props: ['config', 'modelValue', 'disabled'], emits: ['update:modelValue', 'clear'] }
}))

vi.mock('../TagFilter.vue', () => ({
  default: { template: '<div class="tag-filter" />', props: ['config', 'modelValue', 'disabled'], emits: ['update:modelValue', 'clear'] }
}))

describe('FilterBar', () => {
  let wrapper: any
  const defaultProps = {
    configs: MATTER_FILTER_CONFIGS.slice(0, 3), // Use first 3 configs for testing
    presets: MATTER_FILTER_PRESETS,
    modelValue: {
      filters: [],
      quickSearch: '',
      sortBy: 'createdAt',
      sortDirection: 'desc' as const
    } as FilterState,
    loading: false,
    collapsible: true
  }

  beforeEach(() => {
    wrapper = mount(FilterBar, {
      props: defaultProps,
      global: {
        stubs: {
          Icon: { template: '<span class="icon" />' }
        }
      }
    })
  })

  it('renders the filter bar with all main sections', () => {
    expect(wrapper.find('.filter-bar').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true) // Quick search input
  })

  it('displays correct filter count when filters are active', async () => {
    const activeFilterState: FilterState = {
      filters: [
        { field: 'title', operator: 'contains', value: 'test' },
        { field: 'status', operator: 'in', value: ['IN_PROGRESS'] }
      ],
      quickSearch: 'search term',
      sortBy: 'createdAt',
      sortDirection: 'desc'
    }

    await wrapper.setProps({ modelValue: activeFilterState })
    
    // Should show 3 total filters (2 explicit + 1 quickSearch)
    const filterState = wrapper.vm.currentFilterState
    expect(filterState.filters).toHaveLength(3)
  })

  it('emits update:modelValue when filters change', async () => {
    // Simulate changing a filter
    wrapper.vm.updateFilter('title', 'new value')
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('update:modelValue')).toBeDefined()
    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as FilterState
    expect(emittedValue.filters.some(f => f.field === 'title' && f.value === 'new value')).toBe(true)
  })

  it('clears filters correctly', async () => {
    // Set some initial filters
    wrapper.vm.activeFilters.value = { title: 'test', status: ['IN_PROGRESS'] }
    wrapper.vm.quickSearch.value = 'search'
    
    await wrapper.vm.$nextTick()
    
    // Clear all filters
    wrapper.vm.clearAllFilters()
    
    expect(wrapper.vm.quickSearch.value).toBe('')
    expect(Object.keys(wrapper.vm.activeFilters.value)).toHaveLength(0)
  })

  it('handles preset application correctly', () => {
    const preset = MATTER_FILTER_PRESETS[0] // Use first preset
    
    wrapper.vm.applyPreset(preset)
    
    expect(wrapper.emitted('preset:apply')).toBeDefined()
    expect(wrapper.emitted('preset:apply')[0][0]).toEqual(preset)
  })

  it('shows loading state when loading prop is true', async () => {
    await wrapper.setProps({ loading: true })
    
    expect(wrapper.find('.loading').exists() || wrapper.text().includes('Applying filters')).toBe(true)
  })

  it('toggles expansion when collapsible', async () => {
    const initialExpanded = wrapper.vm.isExpanded.value
    
    wrapper.vm.toggleExpanded()
    
    expect(wrapper.vm.isExpanded.value).toBe(!initialExpanded)
  })

  it('validates filter values correctly', () => {
    // Test text filter
    const textConfig = MATTER_FILTER_CONFIGS.find(c => c.type === 'text')!
    wrapper.vm.updateFilter(textConfig.field, 'valid text')
    
    expect(wrapper.vm.activeFilters.value[textConfig.field]).toBe('valid text')
    
    // Test empty value (should be cleared)
    wrapper.vm.updateFilter(textConfig.field, '')
    
    expect(wrapper.vm.activeFilters.value[textConfig.field]).toBeUndefined()
  })

  it('handles different filter types correctly', () => {
    const configs = wrapper.props('configs')
    
    // Check that we have different filter types
    const hasTextFilter = configs.some((c: any) => c.type === 'text')
    const hasSelectFilter = configs.some((c: any) => c.type === 'select' || c.type === 'multiselect')
    
    expect(hasTextFilter).toBe(true)
    expect(hasSelectFilter).toBe(true)
  })
})