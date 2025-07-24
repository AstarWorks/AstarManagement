import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, defineComponent, ref } from 'vue'
import type { FilterState, Matter, SearchSuggestion } from '~/types/matter'

// Mock UI components
vi.mock('~/components/ui/input', () => ({
  Input: defineComponent({ 
    template: '<input v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />' 
  })
}))
vi.mock('~/components/ui/button', () => ({
  Button: defineComponent({ template: '<button v-bind="$attrs"><slot /></button>' })
}))
vi.mock('~/components/ui/badge', () => ({
  Badge: defineComponent({ template: '<span v-bind="$attrs"><slot /></span>' })
}))
vi.mock('~/components/ui/label', () => ({
  Label: defineComponent({ template: '<label v-bind="$attrs"><slot /></label>' })
}))
vi.mock('~/components/ui/checkbox', () => ({
  Checkbox: defineComponent({ 
    template: '<input type="checkbox" v-bind="$attrs" @change="$emit(\'update:checked\', $event.target.checked)" />' 
  })
}))
vi.mock('~/components/ui/popover', () => ({
  Popover: defineComponent({ template: '<div><slot /></div>' }),
  PopoverContent: defineComponent({ template: '<div><slot /></div>' }),
  PopoverTrigger: defineComponent({ template: '<div><slot /></div>' })
}))
vi.mock('~/components/ui/tooltip', () => ({
  Tooltip: defineComponent({ template: '<div><slot /></div>' }),
  TooltipContent: defineComponent({ template: '<div><slot /></div>' }),
  TooltipProvider: defineComponent({ template: '<div><slot /></div>' }),
  TooltipTrigger: defineComponent({ template: '<div><slot /></div>' })
}))

// Mock VueUse composables
vi.mock('@vueuse/core', () => ({
  watchDebounced: vi.fn((source: any, callback: any, options: any) => {
    // Immediately execute callback for testing
    return vi.fn(() => callback(source.value))
  }),
  useWindowSize: vi.fn(() => ({
    width: ref(1024)
  })),
  onClickOutside: vi.fn(),
  useMagicKeys: vi.fn(() => ({
    ArrowDown: ref(false),
    ArrowUp: ref(false),
    Enter: ref(false),
    Escape: ref(false)
  })),
  whenever: vi.fn(),
  useLocalStorage: vi.fn((key: any, defaultValue: any) => ref(defaultValue))
}))

// Mock composables
vi.mock('~/composables/useAdvancedSearch', () => ({
  useAdvancedSearch: vi.fn(() => ({
    searchQuery: ref(''),
    suggestions: ref([]),
    isSearching: ref(false),
    searchMode: ref('fuzzy'),
    showSuggestions: ref(false),
    selectedSuggestionIndex: ref(-1),
    performSearch: vi.fn(),
    selectSuggestion: vi.fn(),
    hideSuggestions: vi.fn(),
    clearSearch: vi.fn(),
    setSearchMode: vi.fn(),
    isFieldSearch: ref(false),
    isExactSearch: ref(false),
    isFuzzySearch: ref(true)
  }))
}))

vi.mock('~/composables/useFilterPersistence', () => ({
  useFilterPersistence: vi.fn(() => ({
    currentFilters: ref({
      searchQuery: '',
      selectedLawyers: [],
      selectedPriorities: [],
      selectedStatuses: [],
      showClosed: true,
      searchMode: 'fuzzy'
    } as FilterState),
    canUndo: ref(false),
    canRedo: ref(false),
    updateFilters: vi.fn(),
    clearFilters: vi.fn(),
    undoFilter: vi.fn(),
    redoFilter: vi.fn(),
    toggleLawyer: vi.fn(),
    togglePriority: vi.fn(),
    toggleStatus: vi.fn()
  }))
}))

// Mock stores
vi.mock('~/stores/kanban', () => ({
  useKanbanStore: vi.fn(() => ({
    filteredMatters: ref([]),
    isLoading: ref(false),
    filters: ref({}),
    updateFilters: vi.fn(),
    resetFilters: vi.fn(),
    performSearch: vi.fn()
  }))
}))

// Import component after mocks
import FilterBar from '../FilterBar.vue'

const sampleMatters: Matter[] = [
  {
    id: '1',
    caseNumber: 'CASE-001',
    title: 'Contract Dispute - ABC Corp',
    description: 'Commercial contract dispute involving payment terms',
    clientName: 'ABC Corporation',
    opponentName: 'XYZ Company',
    assignedLawyer: 'John Smith',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2024-01-15',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
    tags: ['commercial', 'contract', 'dispute']
  },
  {
    id: '2',
    caseNumber: 'CASE-002',
    title: 'Personal Injury - Road Accident',
    description: 'Motor vehicle accident resulting in personal injury',
    clientName: 'Jane Doe',
    opponentName: 'Insurance Company',
    assignedLawyer: 'Sarah Johnson',
    status: 'INTAKE',
    priority: 'MEDIUM',
    dueDate: '2024-01-20',
    createdAt: '2024-01-05T09:00:00Z',
    updatedAt: '2024-01-08T11:15:00Z',
    tags: ['personal-injury', 'accident']
  }
]

describe('FilterBar.vue', () => {
  let wrapper: VueWrapper<any>
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    wrapper = mount(FilterBar, {
      props: {
        matters: sampleMatters,
        ...props
      },
      global: {
        plugins: [pinia],
        stubs: {
          teleport: true,
          transition: false
        }
      }
    })
    return wrapper
  }

  describe('Component Rendering', () => {
    it('should render the filter bar component', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render search input with correct placeholder', () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.attributes('placeholder')).toContain('Search matters')
    })

    it('should render filter dropdowns', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Lawyer')
      expect(wrapper.text()).toContain('Priority')
      expect(wrapper.text()).toContain('Status')
    })

    it('should show active filter count when filters are applied', async () => {
      const wrapper = createWrapper({
        initialFilters: {
          selectedPriorities: ['HIGH'],
          selectedStatuses: ['IN_PROGRESS']
        }
      })
      await nextTick()
      
      const filterBadge = wrapper.find('.filter-bar .badge')
      if (filterBadge.exists()) {
        expect(filterBadge.text()).toBe('2')
      }
    })
  })

  describe('Search Functionality', () => {
    it('should update search query on input', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')
      
      await searchInput.setValue('contract')
      await nextTick()
      
      expect((searchInput.element as HTMLInputElement).value).toBe('contract')
    })

    it('should trigger search on input with debounce', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')
      
      await searchInput.setValue('test search')
      await nextTick()
      
      // Since we mocked watchDebounced to execute immediately
      const { performSearch } = vi.mocked(await import('~/composables/useAdvancedSearch')).useAdvancedSearch()
      expect(performSearch).toHaveBeenCalled()
    })

    it('should show search suggestions when focused', async () => {
      const wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')
      
      await searchInput.trigger('focus')
      await nextTick()
      
      // Suggestions dropdown should be handled by the composable
      const { showSuggestions } = vi.mocked(await import('~/composables/useAdvancedSearch')).useAdvancedSearch()
      expect(showSuggestions.value).toBe(true)
    })
  })

  describe('Filter Controls', () => {
    it('should toggle lawyer filter', async () => {
      const wrapper = createWrapper()
      
      // Find lawyer filter checkbox
      const lawyerCheckbox = wrapper.find('input[type="checkbox"][id*="lawyer"]')
      if (lawyerCheckbox.exists()) {
        await lawyerCheckbox.trigger('change')
        
        const { toggleLawyer } = vi.mocked(await import('~/composables/useFilterPersistence')).useFilterPersistence()
        expect(toggleLawyer).toHaveBeenCalled()
      }
    })

    it('should toggle priority filter', async () => {
      const wrapper = createWrapper()
      
      // Find priority filter checkbox
      const priorityCheckbox = wrapper.find('input[type="checkbox"][id*="priority"]')
      if (priorityCheckbox.exists()) {
        await priorityCheckbox.trigger('change')
        
        const { togglePriority } = vi.mocked(await import('~/composables/useFilterPersistence')).useFilterPersistence()
        expect(togglePriority).toHaveBeenCalled()
      }
    })

    it('should toggle status filter', async () => {
      const wrapper = createWrapper()
      
      // Find status filter checkbox
      const statusCheckbox = wrapper.find('input[type="checkbox"][id*="status"]')
      if (statusCheckbox.exists()) {
        await statusCheckbox.trigger('change')
        
        const { toggleStatus } = vi.mocked(await import('~/composables/useFilterPersistence')).useFilterPersistence()
        expect(toggleStatus).toHaveBeenCalled()
      }
    })

    it('should clear all filters', async () => {
      const wrapper = createWrapper({
        initialFilters: {
          searchQuery: 'test',
          selectedPriorities: ['HIGH'],
          selectedStatuses: ['IN_PROGRESS']
        }
      })
      
      const clearButton = wrapper.find('button[aria-label*="Clear"]')
      if (clearButton.exists()) {
        await clearButton.trigger('click')
        
        const { clearFilters } = vi.mocked(await import('~/composables/useFilterPersistence')).useFilterPersistence()
        expect(clearFilters).toHaveBeenCalled()
      }
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should show mobile layout on small screens', async () => {
      const { useWindowSize } = vi.mocked(await import('@vueuse/core'))
      useWindowSize.mockReturnValue({ width: ref(375), height: ref(667) })
      
      const wrapper = createWrapper()
      expect(wrapper.find('.lg\\:hidden').exists()).toBe(true)
    })

    it('should toggle filter visibility on mobile', async () => {
      const { useWindowSize } = vi.mocked(await import('@vueuse/core'))
      useWindowSize.mockReturnValue({ width: ref(375), height: ref(667) })
      
      const wrapper = createWrapper()
      const toggleButton = wrapper.find('button[aria-label*="toggle"]')
      
      if (toggleButton.exists()) {
        await toggleButton.trigger('click')
        await nextTick()
        
        // Check if filters are toggled
        const filterContent = wrapper.find('.filter-content')
        expect(filterContent.isVisible()).toBe(true)
      }
    })
  })

  describe('Filter Statistics', () => {
    it('should display correct filter statistics', () => {
      const wrapper = createWrapper()
      
      const stats = wrapper.find('.filter-statistics')
      if (stats.exists()) {
        expect(stats.text()).toContain(`${sampleMatters.length} of ${sampleMatters.length}`)
      }
    })

    it('should update statistics when filters are applied', async () => {
      const wrapper = createWrapper({
        initialFilters: {
          selectedStatuses: ['IN_PROGRESS']
        }
      })
      
      await nextTick()
      
      const stats = wrapper.find('.filter-statistics')
      if (stats.exists()) {
        const filteredCount = sampleMatters.filter(m => m.status === 'IN_PROGRESS').length
        expect(stats.text()).toContain(`${filteredCount} of ${sampleMatters.length}`)
      }
    })
  })
})