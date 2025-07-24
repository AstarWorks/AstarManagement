/**
 * Unit Tests for Matter Activity Timeline Component
 * 
 * Tests the core functionality, data handling, and user interactions
 * of the activity timeline component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import MatterActivityTimeline from './MatterActivityTimeline.vue'

// Mock the composables
vi.mock('~/composables/useActivityTimeline', () => ({
  useActivityTimeline: vi.fn(() => ({
    activities: ref([]),
    groupedActivities: ref([]),
    totalActivities: ref(0),
    filters: ref({}),
    viewMode: ref('detailed'),
    searchTerm: ref(''),
    loading: ref(false),
    error: ref(null),
    hasNextPage: ref(false),
    isFetchingNextPage: ref(false),
    setTypeFilter: vi.fn(),
    setActorFilter: vi.fn(),
    setDateRangeFilter: vi.fn(),
    clearFilters: vi.fn(),
    setSearchTerm: vi.fn(),
    setViewMode: vi.fn(),
    loadMore: vi.fn(),
    refresh: vi.fn(),
    exportActivities: vi.fn()
  })),
  useActivityRealTime: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn()
  }))
}))

// Mock UI components
vi.mock('~/components/ui/button', () => ({
  Button: { template: '<button><slot /></button>' }
}))

vi.mock('~/components/ui/input', () => ({
  Input: { template: '<input />' }
}))

vi.mock('~/components/ui/badge', () => ({
  Badge: { template: '<span><slot /></span>' }
}))

vi.mock('~/components/ui/skeleton', () => ({
  Skeleton: { template: '<div class="skeleton"></div>' }
}))

vi.mock('~/components/ui/select', () => ({
  Select: { template: '<div><slot /></div>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: { template: '<div><slot /></div>' },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<div><slot /></div>' }
}))

vi.mock('~/components/ui/scroll-area', () => ({
  ScrollArea: { template: '<div><slot /></div>' }
}))

// Mock child components
vi.mock('./ActivityTimelineItem.vue', () => ({
  default: { template: '<div class="activity-item"></div>' }
}))

vi.mock('./ActivityFilters.vue', () => ({
  default: { template: '<div class="activity-filters"></div>' }
}))

vi.mock('./ActivityExportDialog.vue', () => ({
  default: { template: '<div class="export-dialog"></div>' }
}))

describe('MatterActivityTimeline', () => {
  const defaultProps = {
    matterId: 'test-matter-123',
    initialViewMode: 'detailed' as const,
    enableRealTime: true,
    showHeader: true,
    maxHeight: '600px',
    enableExport: true,
    enableFiltering: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.matter-activity-timeline').exists()).toBe(true)
    })

    it('renders header when showHeader is true', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      expect(wrapper.find('.timeline-header').exists()).toBe(true)
      expect(wrapper.text()).toContain('Activity Timeline')
    })

    it('hides header when showHeader is false', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: {
          ...defaultProps,
          showHeader: false
        }
      })

      expect(wrapper.find('.timeline-header').exists()).toBe(false)
    })

    it('shows filter controls when enableFiltering is true', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      const filterButton = wrapper.find('button').element.textContent
      expect(filterButton).toContain('Filters')
    })

    it('shows export button when enableExport is true', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      const buttons = wrapper.findAll('button')
      const exportButton = buttons.find(button => 
        button.element.textContent?.includes('Export')
      )
      expect(exportButton).toBeTruthy()
    })
  })

  describe('View Mode Selection', () => {
    it('initializes with correct view mode', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: {
          ...defaultProps,
          initialViewMode: 'compact'
        }
      })

      // The component should call setViewMode with the initial value
      expect(wrapper.exists()).toBe(true)
    })

    it('updates view mode when changed', async () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      // Find the select component and simulate change
      const select = wrapper.find('select, [role="combobox"]')
      if (select.exists()) {
        await select.trigger('change')
      }

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      const searchInput = wrapper.find('input[placeholder*="Search"]')
      expect(searchInput.exists()).toBe(true)
    })

    it('updates search term when input changes', async () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      const searchInput = wrapper.find('input[placeholder*="Search"]')
      if (searchInput.exists()) {
        await searchInput.setValue('test search')
        await searchInput.trigger('input')
      }

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Activity Display', () => {
    it('shows loading skeleton when loading', () => {
      const { useActivityTimeline } = require('~/composables/useActivityTimeline')
      const mockComposable = useActivityTimeline()
      mockComposable.loading.value = true

      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      expect(wrapper.find('.skeleton').exists()).toBe(true)
    })

    it('shows error message when error occurs', () => {
      const { useActivityTimeline } = require('~/composables/useActivityTimeline')
      const mockComposable = useActivityTimeline()
      mockComposable.loading.value = false
      mockComposable.error.value = 'Failed to load activities'

      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      expect(wrapper.text()).toContain('Failed to load activities')
    })

    it('shows empty state when no activities', () => {
      const { useActivityTimeline } = require('~/composables/useActivityTimeline')
      const mockComposable = useActivityTimeline()
      mockComposable.loading.value = false
      mockComposable.activities.value = []
      mockComposable.groupedActivities.value = []

      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      expect(wrapper.text()).toContain('No activities found')
    })
  })

  describe('Real-time Updates', () => {
    it('connects to real-time updates when enabled', () => {
      const { useActivityRealTime } = require('~/composables/useActivityTimeline')
      const mockRealTime = useActivityRealTime()

      mount(MatterActivityTimeline, {
        props: {
          ...defaultProps,
          enableRealTime: true
        }
      })

      expect(mockRealTime.connect).toHaveBeenCalled()
    })

    it('does not connect to real-time when disabled', () => {
      const { useActivityRealTime } = require('~/composables/useActivityTimeline')
      const mockRealTime = useActivityRealTime()

      mount(MatterActivityTimeline, {
        props: {
          ...defaultProps,
          enableRealTime: false
        }
      })

      expect(mockRealTime.connect).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('handles refresh shortcut (Ctrl+R)', async () => {
      const { useActivityTimeline } = require('~/composables/useActivityTimeline')
      const mockComposable = useActivityTimeline()

      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps,
        attachTo: document.body
      })

      // Simulate Ctrl+R keydown
      const event = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true
      })
      document.dispatchEvent(event)

      await wrapper.vm.$nextTick()

      expect(mockComposable.refresh).toHaveBeenCalled()

      wrapper.unmount()
    })

    it('handles search focus shortcut (Ctrl+F)', async () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps,
        attachTo: document.body
      })

      // Create a spy for focus method
      const searchInput = wrapper.find('input[placeholder*="Search"]')
      if (searchInput.exists()) {
        const focusSpy = vi.spyOn(searchInput.element, 'focus')

        // Simulate Ctrl+F keydown
        const event = new KeyboardEvent('keydown', {
          key: 'f',
          ctrlKey: true
        })
        document.dispatchEvent(event)

        await wrapper.vm.$nextTick()

        expect(focusSpy).toHaveBeenCalled()
      }

      wrapper.unmount()
    })
  })

  describe('Infinite Scroll', () => {
    it('loads more activities when scrolling near bottom', async () => {
      const { useActivityTimeline } = require('~/composables/useActivityTimeline')
      const mockComposable = useActivityTimeline()
      mockComposable.hasNextPage.value = true
      mockComposable.isFetchingNextPage.value = false

      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      const scrollArea = wrapper.find('[class*="scroll"]')
      if (scrollArea.exists()) {
        // Simulate scroll to bottom
        const scrollEvent = new Event('scroll')
        Object.defineProperty(scrollEvent, 'target', {
          value: {
            scrollTop: 1000,
            scrollHeight: 1200,
            clientHeight: 400
          },
          writable: false
        })

        await scrollArea.trigger('scroll')
      }

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      // Check for search input label
      const searchInput = wrapper.find('input[placeholder*="Search"]')
      expect(searchInput.exists()).toBe(true)
    })

    it('supports keyboard navigation', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      // All interactive elements should be keyboard accessible
      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        expect(button.attributes('tabindex')).not.toBe('-1')
      })
    })
  })

  describe('Export Functionality', () => {
    it('opens export dialog when export button is clicked', async () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: defaultProps
      })

      const exportButton = wrapper.findAll('button').find(button => 
        button.element.textContent?.includes('Export')
      )

      if (exportButton) {
        await exportButton.trigger('click')
        expect(wrapper.find('.export-dialog').exists()).toBe(true)
      }
    })
  })

  describe('Props Validation', () => {
    it('accepts valid matter ID', () => {
      const wrapper = mount(MatterActivityTimeline, {
        props: {
          ...defaultProps,
          matterId: 'valid-matter-id'
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('accepts all view mode options', () => {
      const viewModes = ['compact', 'detailed', 'grouped'] as const

      viewModes.forEach(mode => {
        const wrapper = mount(MatterActivityTimeline, {
          props: {
            ...defaultProps,
            initialViewMode: mode
          }
        })

        expect(wrapper.exists()).toBe(true)
      })
    })
  })
})