import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import FilterBar from '../FilterBar.vue'
import type { FilterState, MatterCard, MatterPriority, MatterStatus } from '~/types/matter'

// Mock data generators
const generateMockMatters = (count: number): MatterCard[] => {
  const statuses: MatterStatus[] = ['draft', 'active', 'on_hold', 'completed', 'archived']
  const priorities: MatterPriority[] = ['low', 'medium', 'high', 'urgent']
  const lawyers = ['田中弁護士', '佐藤弁護士', '山田弁護士', '中村弁護士', '小林弁護士']
  const clients = ['ABC商事', 'XYZ銀行', '123不動産', 'DEF製薬', 'GHI建設']

  return Array.from({ length: count }, (_, i) => ({
    id: `matter-${i}`,
    caseNumber: `CASE-${String(i + 1).padStart(4, '0')}`,
    title: `案件${i + 1} - ${clients[i % clients.length]}関連事項`,
    description: `案件${i + 1}の詳細説明。${clients[i % clients.length]}に関する重要な法的事項について。`,
    clientName: clients[i % clients.length],
    opponentName: i % 3 === 0 ? '対立当事者' : undefined,
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
    createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
    updatedAt: new Date().toISOString(),
    assignedLawyer: {
      id: `lawyer-${i % lawyers.length}`,
      name: lawyers[i % lawyers.length],
      initials: lawyers[i % lawyers.length].substring(0, 2)
    },
    statusDuration: Math.floor(Math.random() * 30) + 1,
    isOverdue: i % 7 === 0,
    relatedDocuments: Math.floor(Math.random() * 20) + 1,
    tags: [`タグ${i % 5 + 1}`, `分類${i % 3 + 1}`]
  }))
}

const meta: Meta<typeof FilterBar> = {
  title: 'Kanban/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# FilterBar Component

Advanced filtering and search component for the Kanban board with Vue 3 Composition API.

## Features
- **Debounced Search**: 300ms debounce with multiple search modes (fuzzy, exact, field-specific)
- **Multi-Select Filters**: Lawyers, priorities, and statuses with reactive arrays
- **Search Suggestions**: Keyboard navigation with autocomplete
- **Local Storage Persistence**: Filter state saved with undo/redo functionality
- **Mobile Responsive**: Collapsible design with Vue 3 transitions
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support

## Search Modes
- **Fuzzy Search**: "山田" matches "山田弁護士", "山田案件"
- **Exact Search**: "山田弁護士" (use quotes for exact matching)
- **Field Search**: "lawyer:山田", "client:ABC商事", "status:active"

## Performance
- Handles 10,000+ matters efficiently
- Virtual scrolling for large suggestion lists
- Web Worker support for complex searches
        `
      }
    }
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
    showAdvancedSearch: {
      control: 'boolean',
      description: 'Show advanced search options'
    },
    maxSuggestions: {
      control: { type: 'number', min: 5, max: 50, step: 5 },
      description: 'Maximum number of search suggestions'
    }
  }
}

export default meta
type Story = StoryObj<typeof FilterBar>

// Default FilterBar story
export const Default: Story = {
  render: (args) => ({
    components: { FilterBar },
    setup() {
      const matters = ref(generateMockMatters(100))
      const filters = ref<FilterState>({
        searchQuery: '',
        selectedLawyers: [],
        selectedPriorities: [],
        selectedStatuses: [],
        showClosed: true,
        searchMode: 'fuzzy'
      })

      const handleFiltersChanged = (newFilters: FilterState) => {
        filters.value = { ...newFilters }
        console.log('Filters changed:', newFilters)
      }

      const handleSearchPerformed = (query: string) => {
        console.log('Search performed:', query)
      }

      return {
        args,
        matters,
        filters,
        handleFiltersChanged,
        handleSearchPerformed
      }
    },
    template: `
      <div class="min-h-screen bg-background p-4">
        <FilterBar
          v-bind="args"
          :matters="matters"
          :filters="filters"
          @filters-changed="handleFiltersChanged"
          @search-performed="handleSearchPerformed"
        />
        
        <!-- Debug panel -->
        <div class="mt-8 p-4 bg-muted rounded-lg">
          <h3 class="font-semibold mb-2">Current Filter State</h3>
          <pre class="text-sm">{{ JSON.stringify(filters, null, 2) }}</pre>
        </div>
      </div>
    `
  }),
  args: {
    className: '',
    showAdvancedSearch: true,
    maxSuggestions: 10
  }
}

// Large dataset performance test
export const LargeDataset: Story = {
  render: (args) => ({
    components: { FilterBar },
    setup() {
      const matters = ref(generateMockMatters(5000))
      const filters = ref<FilterState>({
        searchQuery: '',
        selectedLawyers: [],
        selectedPriorities: [],
        selectedStatuses: [],
        showClosed: true,
        searchMode: 'fuzzy'
      })

      const startTime = ref<number>(0)
      const searchTime = ref<number>(0)

      const handleFiltersChanged = (newFilters: FilterState) => {
        filters.value = { ...newFilters }
      }

      const handleSearchPerformed = (query: string) => {
        searchTime.value = Date.now() - startTime.value
        console.log(`Search completed in ${searchTime.value}ms`)
      }

      const startSearch = () => {
        startTime.value = Date.now()
      }

      return {
        args,
        matters,
        filters,
        searchTime,
        handleFiltersChanged,
        handleSearchPerformed,
        startSearch
      }
    },
    template: `
      <div class="min-h-screen bg-background p-4">
        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 class="font-semibold text-blue-900">Performance Test: 5,000 Matters</h3>
          <p class="text-sm text-blue-700">
            Testing search performance with large dataset. Search time: 
            <span class="font-mono">{{ searchTime }}ms</span>
          </p>
        </div>
        
        <FilterBar
          v-bind="args"
          :matters="matters"
          :filters="filters"
          @filters-changed="handleFiltersChanged"
          @search-performed="handleSearchPerformed"
          @search-started="startSearch"
        />
      </div>
    `
  }),
  args: {
    showAdvancedSearch: true,
    maxSuggestions: 20
  }
}

// Mobile responsive view
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'FilterBar in mobile view with collapsible filters and touch-optimized interactions.'
      }
    }
  },
  render: (args) => ({
    components: { FilterBar },
    setup() {
      const matters = ref(generateMockMatters(50))
      const filters = ref<FilterState>({
        searchQuery: '',
        selectedLawyers: [],
        selectedPriorities: [],
        selectedStatuses: [],
        showClosed: true,
        searchMode: 'fuzzy'
      })

      const isMobile = ref(true)

      return {
        args,
        matters,
        filters,
        isMobile
      }
    },
    template: `
      <div class="min-h-screen bg-background">
        <div class="p-3 bg-primary text-primary-foreground text-center text-sm">
          📱 Mobile View (375px width)
        </div>
        
        <FilterBar
          v-bind="args"
          :matters="matters"
          :filters="filters"
          class="mobile-optimized"
        />
      </div>
    `
  }),
  args: {
    showAdvancedSearch: false,
    maxSuggestions: 8
  }
}

// Search modes demonstration
export const SearchModes: Story = {
  render: (args) => ({
    components: { FilterBar },
    setup() {
      const matters = ref(generateMockMatters(200))
      const filters = ref<FilterState>({
        searchQuery: '',
        selectedLawyers: [],
        selectedPriorities: [],
        selectedStatuses: [],
        showClosed: true,
        searchMode: 'fuzzy'
      })

      const searchExamples = ref([
        { mode: 'fuzzy', query: '山田', description: 'Fuzzy search for "山田"' },
        { mode: 'exact', query: '"山田弁護士"', description: 'Exact search for "山田弁護士"' },
        { mode: 'field', query: 'lawyer:山田', description: 'Field search: lawyer contains "山田"' },
        { mode: 'field', query: 'client:ABC商事', description: 'Field search: client is "ABC商事"' },
        { mode: 'field', query: 'status:active priority:high', description: 'Multiple field search' }
      ])

      const runExample = (example: any) => {
        filters.value.searchMode = example.mode === 'field' ? 'field' : 
                                  example.mode === 'exact' ? 'exact' : 'fuzzy'
        filters.value.searchQuery = example.query
      }

      return {
        args,
        matters,
        filters,
        searchExamples,
        runExample
      }
    },
    template: `
      <div class="min-h-screen bg-background p-4">
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Search Mode Examples</h3>
          <div class="grid gap-2">
            <button
              v-for="example in searchExamples"
              :key="example.query"
              @click="runExample(example)"
              class="text-left p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <div class="font-mono text-sm text-primary">{{ example.query }}</div>
              <div class="text-xs text-muted-foreground">{{ example.description }}</div>
            </button>
          </div>
        </div>
        
        <FilterBar
          v-bind="args"
          :matters="matters"
          :filters="filters"
        />
      </div>
    `
  }),
  args: {
    showAdvancedSearch: true,
    maxSuggestions: 15
  }
}

// Filter persistence demo
export const FilterPersistence: Story = {
  render: (args) => ({
    components: { FilterBar },
    setup() {
      const matters = ref(generateMockMatters(150))
      const filters = ref<FilterState>({
        searchQuery: 'Test persistence',
        selectedLawyers: ['田中弁護士', '佐藤弁護士'],
        selectedPriorities: ['high', 'urgent'],
        selectedStatuses: ['active'],
        showClosed: false,
        searchMode: 'fuzzy'
      })

      const savedFilters = ref<FilterState[]>([])

      const saveCurrentFilters = () => {
        savedFilters.value.push({ ...filters.value })
      }

      const loadFilters = (index: number) => {
        filters.value = { ...savedFilters.value[index] }
      }

      const clearFilters = () => {
        filters.value = {
          searchQuery: '',
          selectedLawyers: [],
          selectedPriorities: [],
          selectedStatuses: [],
          showClosed: true,
          searchMode: 'fuzzy'
        }
      }

      return {
        args,
        matters,
        filters,
        savedFilters,
        saveCurrentFilters,
        loadFilters,
        clearFilters
      }
    },
    template: `
      <div class="min-h-screen bg-background p-4">
        <div class="mb-6 p-4 bg-muted rounded-lg">
          <h3 class="font-semibold mb-3">Filter Persistence Demo</h3>
          <div class="flex gap-2 mb-3">
            <button 
              @click="saveCurrentFilters"
              class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              Save Current Filters
            </button>
            <button 
              @click="clearFilters"
              class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
            >
              Clear All Filters
            </button>
          </div>
          
          <div v-if="savedFilters.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium">Saved Filter Sets:</h4>
            <div 
              v-for="(saved, index) in savedFilters" 
              :key="index"
              class="flex items-center justify-between p-2 bg-background rounded border"
            >
              <div class="text-sm">
                <div>Query: "{{ saved.searchQuery || '(empty)' }}"</div>
                <div class="text-xs text-muted-foreground">
                  {{ saved.selectedLawyers.length }} lawyers, 
                  {{ saved.selectedPriorities.length }} priorities,
                  {{ saved.selectedStatuses.length }} statuses
                </div>
              </div>
              <button 
                @click="loadFilters(index)"
                class="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
              >
                Load
              </button>
            </div>
          </div>
        </div>
        
        <FilterBar
          v-bind="args"
          :matters="matters"
          :filters="filters"
        />
      </div>
    `
  }),
  args: {
    showAdvancedSearch: true,
    maxSuggestions: 12
  }
}

// Accessibility demo
export const AccessibilityDemo: Story = {
  parameters: {
    docs: {
      description: {
        story: 'FilterBar with enhanced accessibility features including screen reader support, keyboard navigation, and high contrast mode.'
      }
    }
  },
  render: (args) => ({
    components: { FilterBar },
    setup() {
      const matters = ref(generateMockMatters(80))
      const filters = ref<FilterState>({
        searchQuery: '',
        selectedLawyers: [],
        selectedPriorities: [],
        selectedStatuses: [],
        showClosed: true,
        searchMode: 'fuzzy'
      })

      const announcements = ref<string[]>([])
      const isHighContrast = ref(false)

      const handleAnnouncement = (message: string) => {
        announcements.value.unshift(`${new Date().toLocaleTimeString()}: ${message}`)
        if (announcements.value.length > 5) {
          announcements.value = announcements.value.slice(0, 5)
        }
      }

      return {
        args,
        matters,
        filters,
        announcements,
        isHighContrast,
        handleAnnouncement
      }
    },
    template: `
      <div class="min-h-screen bg-background p-4" :class="{ 'high-contrast': isHighContrast }">
        <div class="mb-6 p-4 bg-muted rounded-lg">
          <h3 class="font-semibold mb-3">Accessibility Features</h3>
          
          <div class="flex gap-4 mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="isHighContrast"
                class="w-4 h-4"
              />
              <span class="text-sm">High Contrast Mode</span>
            </label>
          </div>
          
          <div class="mb-4">
            <h4 class="text-sm font-medium mb-2">Keyboard Shortcuts:</h4>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li><kbd class="px-1 py-0.5 bg-background border rounded">Tab</kbd> - Navigate between elements</li>
              <li><kbd class="px-1 py-0.5 bg-background border rounded">↑</kbd><kbd class="px-1 py-0.5 bg-background border rounded">↓</kbd> - Navigate suggestions</li>
              <li><kbd class="px-1 py-0.5 bg-background border rounded">Enter</kbd> - Select suggestion</li>
              <li><kbd class="px-1 py-0.5 bg-background border rounded">Escape</kbd> - Close suggestions</li>
            </ul>
          </div>
          
          <div v-if="announcements.length > 0">
            <h4 class="text-sm font-medium mb-2">Screen Reader Announcements:</h4>
            <div class="space-y-1">
              <div 
                v-for="announcement in announcements" 
                :key="announcement"
                class="text-xs p-2 bg-background border rounded"
              >
                {{ announcement }}
              </div>
            </div>
          </div>
        </div>
        
        <FilterBar
          v-bind="args"
          :matters="matters"
          :filters="filters"
          @accessibility-announcement="handleAnnouncement"
        />
      </div>
    `
  }),
  args: {
    showAdvancedSearch: true,
    maxSuggestions: 10
  }
}