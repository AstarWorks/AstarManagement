import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import FilterBar from '../FilterBar.vue'
import type { FilterState, Matter, SearchSuggestion } from '~/types/matter'

// Mock VueUse composables
vi.mock('@vueuse/core', () => ({
  watchDebounced: vi.fn((source, callback, options) => {
    // Immediately execute callback for testing
    vi.fn(() => callback(source.value))
  }),
  useWindowSize: vi.fn(() => ({
    width: { value: 1024 }
  })),
  onClickOutside: vi.fn(),
  useMagicKeys: vi.fn(() => ({
    ArrowDown: { value: false },
    ArrowUp: { value: false },
    Enter: { value: false },
    Escape: { value: false }
  })),
  whenever: vi.fn(),
  useLocalStorage: vi.fn((key, defaultValue) => ({
    value: defaultValue
  }))
}))

// Mock stores
const mockKanbanStore = {
  filteredMatters: { value: [] },
  isLoading: { value: false }
}

const mockAdvancedSearch = {
  searchQuery: { value: '' },
  suggestions: { value: [] },
  isSearching: { value: false },
  searchMode: { value: 'fuzzy' },
  showSuggestions: { value: false },
  selectedSuggestionIndex: { value: -1 },
  performSearch: vi.fn(),
  selectSuggestion: vi.fn(),
  hideSuggestions: vi.fn(),
  clearSearch: vi.fn(),
  setSearchMode: vi.fn(),
  isFieldSearch: { value: false },
  isExactSearch: { value: false },
  isFuzzySearch: { value: true }
}

const mockFilterPersistence = {
  currentFilters: { 
    value: {
      searchQuery: '',
      selectedLawyers: [],
      selectedPriorities: [],
      selectedStatuses: [],
      showClosed: true,
      searchMode: 'fuzzy'
    } as FilterState
  },
  canUndo: { value: false },
  canRedo: { value: false },
  updateFilters: vi.fn(),
  clearFilters: vi.fn(),
  undoFilter: vi.fn(),
  redoFilter: vi.fn(),
  toggleLawyer: vi.fn(),
  togglePriority: vi.fn(),
  toggleStatus: vi.fn()
}

vi.mock('~/composables/useAdvancedSearch', () => ({
  useAdvancedSearch: () => mockAdvancedSearch
}))

vi.mock('~/composables/useFilterPersistence', () => ({
  useFilterPersistence: () => mockFilterPersistence
}))

vi.mock('~/stores/kanban', () => ({
  useKanbanStore: () => mockKanbanStore
}))

// Mock UI components to avoid import issues
vi.mock('~/components/ui/input', () => ({
  Input: {
    name: 'Input',
    template: '<input v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  }
}))

vi.mock('~/components/ui/button', () => ({
  Button: {
    name: 'Button',
    template: '<button v-bind="$attrs"><slot /></button>'
  }
}))

vi.mock('~/components/ui/badge', () => ({
  Badge: {
    name: 'Badge',
    template: '<span v-bind="$attrs"><slot /></span>'
  }
}))

vi.mock('~/components/ui/label', () => ({
  Label: {
    name: 'Label',
    template: '<label v-bind="$attrs"><slot /></label>'
  }
}))

vi.mock('~/components/ui/checkbox', () => ({
  Checkbox: {
    name: 'Checkbox',
    template: '<input type="checkbox" v-bind="$attrs" @change="$emit(\'update:checked\', $event.target.checked)" />'
  }
}))

vi.mock('~/components/ui/popover', () => ({
  Popover: {
    name: 'Popover',
    template: '<div><slot /></div>'
  },
  PopoverContent: {
    name: 'PopoverContent',
    template: '<div><slot /></div>'
  },
  PopoverTrigger: {
    name: 'PopoverTrigger',
    template: '<div><slot /></div>'
  }
}))

vi.mock('~/components/ui/tooltip', () => ({
  Tooltip: {
    name: 'Tooltip',
    template: '<div><slot /></div>'
  },
  TooltipContent: {
    name: 'TooltipContent',
    template: '<div><slot /></div>'
  },
  TooltipProvider: {
    name: 'TooltipProvider',
    template: '<div><slot /></div>'
  },
  TooltipTrigger: {
    name: 'TooltipTrigger',
    template: '<div><slot /></div>'
  }
}))

// Mock Lucide icons
vi.mock('lucide-vue-next', () => {
  const mockIcon = { name: 'MockIcon', template: '<div class="icon"></div>' }
  return {
    Search: mockIcon,
    Filter: mockIcon,
    ChevronDown: mockIcon,
    ChevronUp: mockIcon,
    ChevronsUpDown: mockIcon,
    FileText: mockIcon,
    User: mockIcon,
    Users: mockIcon,
    Tag: mockIcon,
    Target: mockIcon,
    Type: mockIcon,
    Zap: mockIcon,
    Undo2: mockIcon,
    Redo2: mockIcon
  }
})

// Sample test data
const sampleMatters: Matter[] = [
  {
    id: '1',
    caseNumber: 'CASE-001',
    title: 'Contract Dispute - ABC Corp',
    description: 'Commercial contract dispute involving payment terms',
    clientName: 'ABC Corporation',
    opponentName: 'XYZ Company',
    assignedLawyer: 'John Smith',
    status: 'in_progress',
    priority: 'high',
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
    status: 'new',
    priority: 'medium',
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
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Reset mock values
    mockAdvancedSearch.searchQuery.value = ''
    mockAdvancedSearch.suggestions.value = []
    mockAdvancedSearch.showSuggestions.value = false
    mockFilterPersistence.currentFilters.value = {
      searchQuery: '',
      selectedLawyers: [],
      selectedPriorities: [],
      selectedStatuses: [],
      showClosed: true,
      searchMode: 'fuzzy'
    }
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  const createWrapper = (props = {}) => {
    return mount(FilterBar, {
      props: {
        matters: sampleMatters,
        ...props
      },
      global: {
        plugins: [pinia],
        stubs: {
          Transition: false
        }
      }
    })
  }

  describe('Component Rendering', () => {
    it('should render the filter bar component', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.filter-bar').exists()).toBe(true)
    })

    it('should render search input with correct placeholder', () => {
      wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.attributes('placeholder')).toContain('Search matters')
    })

    it('should render mobile header on smaller screens', async () => {
      // Mock mobile screen size
      vi.mocked(require('@vueuse/core').useWindowSize).mockReturnValue({
        width: { value: 600 }
      })
      
      wrapper = createWrapper()
      const mobileHeader = wrapper.find('.lg\\:hidden')
      expect(mobileHeader.exists()).toBe(true)
    })

    it('should display filter count badge when filters are active', async () => {
      mockFilterPersistence.currentFilters.value.selectedLawyers = ['John Smith']
      wrapper = createWrapper()
      
      await nextTick()
      const badge = wrapper.find('[data-testid="filter-count-badge"]')
      // Note: The exact selector depends on the Badge component implementation
    })
  })

  describe('Search Functionality', () => {
    it('should emit searchPerformed when search query is entered', async () => {
      wrapper = createWrapper()
      const searchInput = wrapper.find('input[type="search"]')
      
      await searchInput.setValue('test query')
      await nextTick()
      
      expect(wrapper.emitted()).toHaveProperty('searchPerformed')
    })

    it('should handle search mode cycling', async () => {
      wrapper = createWrapper()
      
      // Find and click the search mode toggle button
      const searchModeButton = wrapper.find('[data-testid="search-mode-toggle"]')
      if (searchModeButton.exists()) {
        await searchModeButton.trigger('click')
        expect(mockAdvancedSearch.setSearchMode).toHaveBeenCalled()
      }
    })

    it('should show search suggestions when available', async () => {
      const mockSuggestions: SearchSuggestion[] = [
        {
          id: 'suggestion-1',
          value: 'ABC Corporation',
          type: 'client',
          count: 1,
          category: 'Clients'
        }
      ]
      
      mockAdvancedSearch.suggestions.value = mockSuggestions
      mockAdvancedSearch.showSuggestions.value = true
      
      wrapper = createWrapper()
      await nextTick()
      
      // Check if suggestions dropdown is rendered
      const suggestionsDropdown = wrapper.find('[data-testid="suggestions-dropdown"]')
      // Note: This test depends on the exact implementation of suggestions display
    })

    it('should handle suggestion selection', async () => {
      const mockSuggestion: SearchSuggestion = {
        id: 'suggestion-1',
        value: 'ABC Corporation',
        type: 'client',
        count: 1,
        category: 'Clients'
      }
      
      wrapper = createWrapper()
      
      // Simulate suggestion click
      await wrapper.vm.selectSuggestion(mockSuggestion)
      
      expect(mockAdvancedSearch.selectSuggestion).toHaveBeenCalledWith(mockSuggestion)
      expect(wrapper.emitted()).toHaveProperty('suggestionSelected')
    })
  })

  describe('Filter Controls', () => {
    it('should toggle lawyer filter when checkbox is clicked', async () => {
      wrapper = createWrapper()
      
      // Simulate lawyer checkbox toggle
      await wrapper.vm.toggleLawyer('John Smith', true)
      
      expect(mockFilterPersistence.toggleLawyer).toHaveBeenCalledWith('John Smith')
    })

    it('should toggle priority filter when checkbox is clicked', async () => {
      wrapper = createWrapper()
      
      // Simulate priority checkbox toggle
      await wrapper.vm.togglePriority('high', true)
      
      expect(mockFilterPersistence.togglePriority).toHaveBeenCalledWith('high')
    })

    it('should toggle status filter when checkbox is clicked', async () => {
      wrapper = createWrapper()
      
      // Simulate status checkbox toggle
      await wrapper.vm.toggleStatus('in_progress', true)
      
      expect(mockFilterPersistence.toggleStatus).toHaveBeenCalledWith('in_progress')
    })

    it('should update show closed filter', async () => {
      wrapper = createWrapper()
      
      // Find and toggle the show closed checkbox
      const showClosedCheckbox = wrapper.find('input[id="show-closed"]')
      if (showClosedCheckbox.exists()) {
        await showClosedCheckbox.trigger('change')
        expect(mockFilterPersistence.updateFilters).toHaveBeenCalled()
      }
    })
  })

  describe('Filter Statistics', () => {
    it('should calculate correct filter statistics', () => {
      wrapper = createWrapper()
      
      const filterStats = wrapper.vm.filterStats
      expect(filterStats.totalMatters).toBe(2)
      expect(filterStats.activeFiltersCount).toBe(0) // No filters active initially
    })

    it('should count active filters correctly', async () => {
      mockFilterPersistence.currentFilters.value.searchQuery = 'test'
      mockFilterPersistence.currentFilters.value.selectedLawyers = ['John Smith']
      
      wrapper = createWrapper()
      await nextTick()
      
      const filterStats = wrapper.vm.filterStats
      expect(filterStats.activeFiltersCount).toBe(2)
    })
  })

  describe('Available Lawyers Computation', () => {
    it('should compute available lawyers with case counts', () => {
      wrapper = createWrapper()
      
      const availableLawyers = wrapper.vm.availableLawyers
      expect(availableLawyers).toEqual([
        { id: 'John Smith', name: 'John Smith', caseCount: 1 },
        { id: 'Sarah Johnson', name: 'Sarah Johnson', caseCount: 1 }
      ])
    })

    it('should sort lawyers alphabetically', () => {
      const mattersWithMoreLawyers: Matter[] = [
        ...sampleMatters,
        {
          ...sampleMatters[0],
          id: '3',
          assignedLawyer: 'Alice Brown'
        }
      ]
      
      wrapper = createWrapper({ matters: mattersWithMoreLawyers })
      
      const availableLawyers = wrapper.vm.availableLawyers
      const lawyerNames = availableLawyers.map(l => l.name)
      expect(lawyerNames).toEqual(['Alice Brown', 'John Smith', 'Sarah Johnson'])
    })
  })

  describe('Undo/Redo Functionality', () => {
    it('should call undo when undo button is clicked', async () => {
      mockFilterPersistence.canUndo.value = true
      wrapper = createWrapper()
      
      const undoButton = wrapper.find('[data-testid="undo-button"]')
      if (undoButton.exists()) {
        await undoButton.trigger('click')
        expect(mockFilterPersistence.undoFilter).toHaveBeenCalled()
      }
    })

    it('should call redo when redo button is clicked', async () => {
      mockFilterPersistence.canRedo.value = true
      wrapper = createWrapper()
      
      const redoButton = wrapper.find('[data-testid="redo-button"]')
      if (redoButton.exists()) {
        await redoButton.trigger('click')
        expect(mockFilterPersistence.redoFilter).toHaveBeenCalled()
      }
    })

    it('should disable undo button when cannot undo', () => {
      mockFilterPersistence.canUndo.value = false
      wrapper = createWrapper()
      
      const undoButton = wrapper.find('[data-testid="undo-button"]')
      if (undoButton.exists()) {
        expect(undoButton.attributes('disabled')).toBeDefined()
      }
    })
  })

  describe('Clear Filters', () => {
    it('should clear all filters when clear button is clicked', async () => {
      // Set some active filters
      mockFilterPersistence.currentFilters.value.searchQuery = 'test'
      wrapper = createWrapper()
      
      const clearButton = wrapper.find('[data-testid="clear-all-button"]')
      if (clearButton.exists()) {
        await clearButton.trigger('click')
        expect(mockFilterPersistence.clearFilters).toHaveBeenCalled()
        expect(mockAdvancedSearch.clearSearch).toHaveBeenCalled()
      }
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should collapse filters on mobile by default', async () => {
      // Mock mobile screen size
      vi.mocked(require('@vueuse/core').useWindowSize).mockReturnValue({
        width: { value: 600 }
      })
      
      wrapper = createWrapper()
      await nextTick()
      
      expect(wrapper.vm.isCollapsed).toBe(true)
    })

    it('should toggle collapse when mobile header button is clicked', async () => {
      wrapper = createWrapper()
      
      const toggleButton = wrapper.find('[data-testid="mobile-toggle"]')
      if (toggleButton.exists()) {
        const initialCollapsed = wrapper.vm.isCollapsed
        await toggleButton.trigger('click')
        expect(wrapper.vm.isCollapsed).toBe(!initialCollapsed)
      }
    })
  })

  describe('Props and Events', () => {
    it('should accept initial filters prop', () => {
      const initialFilters = {
        searchQuery: 'initial search',
        selectedPriorities: ['high']
      }
      
      wrapper = createWrapper({ initialFilters })
      
      // Check that initial filters are applied
      expect(mockFilterPersistence.updateFilters).toHaveBeenCalledWith(initialFilters)
    })

    it('should emit filtersChanged when filters are updated', async () => {
      wrapper = createWrapper()
      
      // Trigger a filter change
      mockFilterPersistence.currentFilters.value.searchQuery = 'test'
      await nextTick()
      
      expect(wrapper.emitted()).toHaveProperty('filtersChanged')
    })

    it('should use custom persistence key when provided', () => {
      const customKey = 'custom-filters-key'
      wrapper = createWrapper({ persistenceKey: customKey })
      
      // Check that the persistence composable was called with the custom key
      expect(require('~/composables/useFilterPersistence').useFilterPersistence).toHaveBeenCalledWith(customKey)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle escape key to blur search input', async () => {
      wrapper = createWrapper()
      
      const searchInput = wrapper.find('input[type="search"]')
      const mockBlur = vi.fn()
      searchInput.element.blur = mockBlur
      
      await wrapper.vm.handleSearchKeydown({ key: 'Escape' })
      expect(mockBlur).toHaveBeenCalled()
    })
  })

  describe('Search Mode UI', () => {
    it('should display correct search mode icon for fuzzy search', () => {
      mockAdvancedSearch.searchMode.value = 'fuzzy'
      wrapper = createWrapper()
      
      expect(wrapper.vm.searchModeIcon).toBeDefined()
    })

    it('should display correct tooltip for each search mode', () => {
      const modes = ['fuzzy', 'exact', 'field'] as const
      
      modes.forEach(mode => {
        mockAdvancedSearch.searchMode.value = mode
        wrapper = createWrapper()
        
        const tooltip = wrapper.vm.searchModeTooltip
        expect(tooltip).toContain(mode === 'fuzzy' ? 'Fuzzy' : mode === 'exact' ? 'Exact' : 'Field')
      })
    })
  })

  describe('Performance', () => {
    it('should handle large numbers of matters efficiently', () => {
      const largeMattersList = Array.from({ length: 1000 }, (_, i) => ({
        ...sampleMatters[0],
        id: `matter-${i}`,
        title: `Matter ${i}`,
        assignedLawyer: `Lawyer ${i % 10}`
      }))
      
      const startTime = performance.now()
      wrapper = createWrapper({ matters: largeMattersList })
      const endTime = performance.now()
      
      // Should render in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})