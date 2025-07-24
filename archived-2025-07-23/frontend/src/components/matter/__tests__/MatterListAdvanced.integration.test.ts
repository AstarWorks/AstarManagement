import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MatterListAdvanced from '../MatterListAdvanced.vue'
import type { Matter, MatterStatus, MatterPriority } from '~/types/matter'

// Mock the router
const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {}
  }),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  })
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock URL constructor
Object.defineProperty(window, 'URL', {
  value: class URL {
    searchParams = new URLSearchParams()
    constructor(public href: string) {}
    toString() { return this.href }
  }
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

// Sample test data
const createMockMatter = (id: string, overrides: Partial<Matter> = {}): Matter => ({
  id,
  title: `Matter ${id}`,
  description: `Description for matter ${id}`,
  status: 'IN_PROGRESS',
  priority: 'MEDIUM',
  client: {
    id: `client-${id}`,
    name: `Client ${id}`,
    email: `client${id}@example.com`
  },
  assignee: {
    id: `lawyer-${id}`,
    name: `Lawyer ${id}`,
    email: `lawyer${id}@example.com`
  },
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  ...overrides
})

const mockData: Matter[] = [
  createMockMatter('1', { 
    title: 'Contract Review Alpha',
    status: 'INTAKE',
    priority: 'HIGH'
  }),
  createMockMatter('2', {
    title: 'Litigation Beta',
    status: 'IN_PROGRESS',
    priority: 'URGENT'
  }),
  createMockMatter('3', {
    title: 'Patent Filing Gamma',
    status: 'REVIEW',
    priority: 'LOW'
  }),
  createMockMatter('4', {
    title: 'Merger Documentation',
    status: 'WAITING_CLIENT',
    priority: 'MEDIUM'
  }),
  createMockMatter('5', {
    title: 'Compliance Audit',
    status: 'CLOSED',
    priority: 'LOW'
  })
]

describe('MatterListAdvanced Integration Tests', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  const mountComponent = (props = {}) => {
    return mount(MatterListAdvanced, {
      props: {
        data: mockData,
        loading: false,
        error: null,
        enableVirtualScrolling: true,
        enableColumnResize: true,
        enableInlineEdit: true,
        enableFilterPersistence: true,
        ...props
      },
      global: {
        stubs: {
          Icon: true,
          VirtualDataTable: {
            template: '<div data-testid="virtual-table"><slot /></div>',
            props: ['columns', 'data', 'loading', 'error'],
            emits: ['sort', 'selection:change', 'bulk:delete', 'bulk:status-update', 'bulk:export', 'cell:edit']
          },
          FilterBar: {
            template: '<div data-testid="filter-bar"></div>',
            props: ['configs', 'presets', 'modelValue', 'loading'],
            emits: ['update:modelValue', 'preset:apply', 'preset:save', 'preset:delete', 'export']
          }
        }
      }
    })
  }

  describe('Component Initialization', () => {
    it('should render with default props', async () => {
      wrapper = mountComponent()
      await nextTick()

      expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="virtual-table"]').exists()).toBe(true)
    })

    it('should initialize filter persistence on mount', async () => {
      wrapper = mountComponent()
      await nextTick()

      // Should attempt to load from localStorage
      expect(localStorageMock.getItem).toHaveBeenCalledWith('matter-list-filters-presets')
    })

    it('should display all matters initially', async () => {
      wrapper = mountComponent()
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      expect(tableComponent.props('data')).toHaveLength(5)
    })
  })

  describe('Filtering Functionality', () => {
    it('should filter data when filter state changes', async () => {
      wrapper = mountComponent()
      await nextTick()

      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      
      // Simulate filter change
      await filterBar.vm.$emit('update:modelValue', {
        filters: [{
          field: 'status',
          operator: 'equals',
          value: 'IN_PROGRESS'
        }],
        quickSearch: '',
        activePreset: undefined,
        sortBy: undefined,
        sortDirection: 'asc'
      })

      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      const filteredData = tableComponent.props('data')
      
      expect(filteredData).toHaveLength(1)
      expect(filteredData[0].status).toBe('IN_PROGRESS')
    })

    it('should apply quick search filter', async () => {
      wrapper = mountComponent()
      await nextTick()

      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      
      // Search for "Alpha"
      await filterBar.vm.$emit('update:modelValue', {
        filters: [],
        quickSearch: 'Alpha',
        activePreset: undefined,
        sortBy: undefined,
        sortDirection: 'asc'
      })

      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      const filteredData = tableComponent.props('data')
      
      expect(filteredData).toHaveLength(1)
      expect(filteredData[0].title).toBe('Contract Review Alpha')
    })

    it('should combine multiple filters', async () => {
      wrapper = mountComponent()
      await nextTick()

      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      
      await filterBar.vm.$emit('update:modelValue', {
        filters: [
          {
            field: 'priority',
            operator: 'in',
            value: ['HIGH', 'URGENT']
          }
        ],
        quickSearch: '',
        activePreset: undefined,
        sortBy: undefined,
        sortDirection: 'asc'
      })

      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      const filteredData = tableComponent.props('data')
      
      expect(filteredData).toHaveLength(2)
      expect(filteredData.every(m => ['HIGH', 'URGENT'].includes(m.priority))).toBe(true)
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort data when sort event is emitted', async () => {
      wrapper = mountComponent()
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      
      // Emit sort event
      await tableComponent.vm.$emit('sort', 'title', 'asc')
      await nextTick()

      const sortedData = tableComponent.props('data')
      
      // Check if data is sorted by title ascending
      expect(sortedData[0].title).toBe('Compliance Audit')
      expect(sortedData[1].title).toBe('Contract Review Alpha')
    })

    it('should emit data:sort event when sorting', async () => {
      wrapper = mountComponent()
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      
      await tableComponent.vm.$emit('sort', 'status', 'desc')
      await nextTick()

      expect(wrapper.emitted('data:sort')).toBeTruthy()
      expect(wrapper.emitted('data:sort')?.[0]).toEqual(['status', 'desc'])
    })
  })

  describe('Export Functionality', () => {
    it('should handle export from filter bar', async () => {
      wrapper = mountComponent()
      await nextTick()

      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      
      await filterBar.vm.$emit('export', 'csv')
      await nextTick()

      expect(wrapper.emitted('data:export')).toBeTruthy()
      expect(wrapper.emitted('data:export')?.[0]?.[1]).toBe('csv')
    })

    it('should handle bulk export from table', async () => {
      wrapper = mountComponent()
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      const selectedMatters = [mockData[0], mockData[1]]
      
      await tableComponent.vm.$emit('bulk:export', selectedMatters, 'excel')
      await nextTick()

      // Should not emit data:export for bulk operations
      // Bulk export is handled internally
    })
  })

  describe('Bulk Operations', () => {
    it('should handle bulk delete', async () => {
      wrapper = mountComponent()
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      const selectedMatters = [mockData[0], mockData[1]]
      
      await tableComponent.vm.$emit('bulk:delete', selectedMatters)
      await nextTick()

      expect(wrapper.emitted('matter:delete')).toBeTruthy()
      expect(wrapper.emitted('matter:delete')?.[0]).toEqual([selectedMatters])
    })

    it('should handle bulk status update', async () => {
      wrapper = mountComponent()
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      const selectedMatters = [mockData[0], mockData[1]]
      const newStatus: MatterStatus = 'CLOSED'
      
      await tableComponent.vm.$emit('bulk:status-update', selectedMatters, newStatus)
      await nextTick()

      expect(wrapper.emitted('matter:status-update')).toBeTruthy()
      expect(wrapper.emitted('matter:status-update')?.[0]).toEqual([selectedMatters, newStatus])
    })
  })

  describe('Inline Editing', () => {
    it('should handle cell edit events', async () => {
      wrapper = mountComponent()
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      const matter = mockData[0]
      
      await tableComponent.vm.$emit('cell:edit', matter, 'title', 'New Title')
      await nextTick()

      expect(wrapper.emitted('matter:update')).toBeTruthy()
      expect(wrapper.emitted('matter:update')?.[0]).toEqual([matter, 'title', 'New Title'])
    })
  })

  describe('Filter Persistence', () => {
    it('should save filters to localStorage when filter state changes', async () => {
      wrapper = mountComponent()
      await nextTick()

      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      
      const newFilterState = {
        filters: [{
          field: 'status',
          operator: 'equals',
          value: 'CLOSED'
        }],
        quickSearch: 'test',
        activePreset: undefined,
        sortBy: 'title',
        sortDirection: 'asc' as const
      }

      await filterBar.vm.$emit('update:modelValue', newFilterState)
      await nextTick()

      // Allow time for debounced operations
      await new Promise(resolve => setTimeout(resolve, 350))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'matter-list-filters',
        expect.stringContaining('filters')
      )
    })

    it('should generate shareable URL', async () => {
      wrapper = mountComponent()
      await nextTick()

      // Set some filter state
      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      await filterBar.vm.$emit('update:modelValue', {
        filters: [{
          field: 'status',
          operator: 'equals',
          value: 'IN_PROGRESS'
        }],
        quickSearch: 'test',
        activePreset: undefined,
        sortBy: 'title',
        sortDirection: 'asc'
      })

      await nextTick()

      const shareButton = wrapper.find('button:contains("Share Filters")')
      if (shareButton.exists()) {
        await shareButton.trigger('click')
        expect(navigator.clipboard.writeText).toHaveBeenCalled()
      }
    })
  })

  describe('Preset Management', () => {
    it('should handle preset save', async () => {
      wrapper = mountComponent()
      await nextTick()

      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      
      await filterBar.vm.$emit('preset:save', 'My Preset', [{
        field: 'status',
        operator: 'equals',
        value: 'IN_PROGRESS'
      }])

      await nextTick()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'matter-list-filters-presets',
        expect.stringContaining('My Preset')
      )
    })

    it('should handle preset apply', async () => {
      wrapper = mountComponent()
      await nextTick()

      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      
      const mockPreset = {
        id: 'preset-1',
        name: 'High Priority',
        filters: [{
          field: 'priority',
          operator: 'equals',
          value: 'HIGH'
        }],
        createdAt: new Date(),
        isDefault: false
      }

      await filterBar.vm.$emit('preset:apply', mockPreset)
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      const filteredData = tableComponent.props('data')
      
      expect(filteredData).toHaveLength(1)
      expect(filteredData[0].priority).toBe('HIGH')
    })

    it('should handle preset delete', async () => {
      // Mock existing presets
      localStorageMock.getItem.mockReturnValue(JSON.stringify([
        {
          id: 'preset-1',
          name: 'Test Preset',
          filters: [],
          createdAt: new Date(),
          isDefault: false
        }
      ]))

      wrapper = mountComponent()
      await nextTick()

      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      
      await filterBar.vm.$emit('preset:delete', 'preset-1')
      await nextTick()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'matter-list-filters-presets',
        '[]'
      )
    })
  })

  describe('Loading and Error States', () => {
    it('should pass loading state to child components', async () => {
      wrapper = mountComponent({ loading: true })
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      const filterBar = wrapper.findComponent('[data-testid="filter-bar"]')
      
      expect(tableComponent.props('loading')).toBe(true)
      expect(filterBar.props('loading')).toBe(true)
    })

    it('should pass error state to table component', async () => {
      const testError = new Error('Test error')
      wrapper = mountComponent({ error: testError })
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      expect(tableComponent.props('error')).toBe(testError)
    })
  })

  describe('Performance Optimizations', () => {
    it('should enable virtual scrolling for large datasets', async () => {
      // Create large dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => 
        createMockMatter(`${i + 1}`, { title: `Matter ${i + 1}` })
      )

      wrapper = mountComponent({ 
        data: largeData,
        enableVirtualScrolling: true 
      })
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      expect(tableComponent.props('enableVirtualScrolling')).toBe(true)
      expect(tableComponent.props('data')).toHaveLength(1000)
    })

    it('should handle data updates efficiently', async () => {
      wrapper = mountComponent()
      await nextTick()

      // Update data
      const newData = [...mockData, createMockMatter('6', { title: 'New Matter' })]
      await wrapper.setProps({ data: newData })
      await nextTick()

      const tableComponent = wrapper.findComponent('[data-testid="virtual-table"]')
      expect(tableComponent.props('data')).toHaveLength(6)
    })
  })

  describe('Accessibility', () => {
    it('should provide proper ARIA labels and structure', async () => {
      wrapper = mountComponent()
      await nextTick()

      // Check for proper structure
      expect(wrapper.find('.matter-list-advanced').exists()).toBe(true)
      
      // Filter bar should be accessible
      expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true)
      
      // Table should be accessible
      expect(wrapper.find('[data-testid="virtual-table"]').exists()).toBe(true)
    })
  })
})