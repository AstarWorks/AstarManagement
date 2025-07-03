import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import FilterBar from './FilterBar.vue'
import { MATTER_FILTER_CONFIGS, MATTER_FILTER_PRESETS } from './FilterConfig'
import type { FilterState } from './FilterConfig'

const meta: Meta<typeof FilterBar> = {
  title: 'Components/Matter/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive filter bar component for matter management with support for multiple filter types, presets, and persistence.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    configs: {
      description: 'Array of filter configurations defining available filters',
      control: { type: 'object' }
    },
    presets: {
      description: 'Array of predefined filter presets',
      control: { type: 'object' }
    },
    modelValue: {
      description: 'Current filter state including active filters and search terms',
      control: { type: 'object' }
    },
    loading: {
      description: 'Loading state for filter operations',
      control: { type: 'boolean' }
    },
    collapsible: {
      description: 'Whether the filter panel can be collapsed',
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Default filter state
const defaultFilterState: FilterState = {
  filters: [],
  quickSearch: '',
  sortBy: 'createdAt',
  sortDirection: 'desc'
}

// Active filter state for demonstration
const activeFilterState: FilterState = {
  filters: [
    { field: 'title', operator: 'contains', value: 'Corporate' },
    { field: 'status', operator: 'in', value: ['IN_PROGRESS', 'REVIEW'] },
    { field: 'priority', operator: 'in', value: ['HIGH'] },
    { field: 'assignedLawyer', operator: 'in', value: ['1'] }
  ],
  quickSearch: 'merger',
  sortBy: 'dueDate',
  sortDirection: 'asc'
}

export const Default: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    presets: MATTER_FILTER_PRESETS,
    modelValue: defaultFilterState,
    loading: false,
    collapsible: true
  },
  render: (args: any) => ({
    components: { FilterBar },
    setup() {
      const filterState = ref(args.modelValue || defaultFilterState)
      
      const handleFilterChange = (newState: FilterState) => {
        filterState.value = newState
        console.log('Filter state changed:', newState)
      }
      
      const handlePresetApply = (preset: any) => {
        console.log('Applied preset:', preset.name)
      }
      
      const handlePresetSave = (name: string, filters: any[]) => {
        console.log('Save preset:', name, filters)
      }
      
      const handlePresetDelete = (presetId: string) => {
        console.log('Delete preset:', presetId)
      }
      
      const handleExport = (format: 'csv' | 'excel') => {
        console.log('Export as:', format)
      }
      
      return {
        args,
        filterState,
        handleFilterChange,
        handlePresetApply,
        handlePresetSave,
        handlePresetDelete,
        handleExport
      }
    },
    template: `
      <div class="p-4 space-y-4">
        <h3 class="text-lg font-semibold">Matter Filter Bar</h3>
        <FilterBar
          :configs="args.configs"
          :presets="args.presets"
          v-model="filterState"
          :loading="args.loading"
          :collapsible="args.collapsible"
          @preset:apply="handlePresetApply"
          @preset:save="handlePresetSave"
          @preset:delete="handlePresetDelete"
          @export="handleExport"
        />
        
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 class="font-medium mb-2">Current Filter State:</h4>
          <pre class="text-sm overflow-auto">{{ JSON.stringify(filterState, null, 2) }}</pre>
        </div>
      </div>
    `
  })
}

export const WithActiveFilters: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    presets: MATTER_FILTER_PRESETS,
    modelValue: activeFilterState,
    loading: false,
    collapsible: true
  },
  render: Default.render
}

export const Loading: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    presets: MATTER_FILTER_PRESETS,
    modelValue: defaultFilterState,
    loading: true,
    collapsible: true
  },
  render: Default.render
}

export const NonCollapsible: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    presets: MATTER_FILTER_PRESETS,
    modelValue: defaultFilterState,
    loading: false,
    collapsible: false
  },
  render: Default.render
}

export const BasicFiltersOnly: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS.slice(0, 4), // Only first 4 basic filters
    presets: [],
    modelValue: defaultFilterState,
    loading: false,
    collapsible: true
  },
  render: Default.render,
  parameters: {
    docs: {
      description: {
        story: 'Filter bar with only basic text and select filters, no presets.'
      }
    }
  }
}

export const InteractiveDemo: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    presets: MATTER_FILTER_PRESETS,
    modelValue: defaultFilterState,
    loading: false,
    collapsible: true
  },
  render: (args: any) => ({
    components: { FilterBar },
    setup() {
      const filterState = ref(args.modelValue || defaultFilterState)
      const resultCount = ref(156)
      
      const handleFilterChange = (newState: FilterState) => {
        filterState.value = newState
        // Simulate filtering results
        const activeFilters = newState.filters.length + (newState.quickSearch ? 1 : 0)
        resultCount.value = Math.max(1, 156 - (activeFilters * 23))
      }
      
      return {
        args,
        filterState,
        resultCount,
        handleFilterChange
      }
    },
    template: `
      <div class="p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Matter Management Filters</h3>
          <div class="text-sm text-gray-600">
            {{ resultCount }} matters found
          </div>
        </div>
        
        <FilterBar
          :configs="args.configs"
          :presets="args.presets"
          v-model="filterState"
          :loading="args.loading"
          :collapsible="args.collapsible"
          @update:model-value="handleFilterChange"
        />
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div v-for="n in Math.min(resultCount, 6)" :key="n" class="p-4 border rounded-lg">
            <h4 class="font-medium">Matter {{ n }}</h4>
            <p class="text-sm text-gray-600 mt-1">Case #CC-2024-{{ String(n).padStart(3, '0') }}</p>
            <div class="flex gap-2 mt-2">
              <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">IN_PROGRESS</span>
              <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">HIGH</span>
            </div>
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing how filters affect search results in real-time.'
      }
    }
  }
}