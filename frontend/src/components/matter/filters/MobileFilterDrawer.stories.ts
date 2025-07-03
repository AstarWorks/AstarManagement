import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MobileFilterDrawer from './MobileFilterDrawer.vue'
import { MATTER_FILTER_CONFIGS } from './FilterConfig'
import type { FilterState } from './FilterConfig'

const meta: Meta<typeof MobileFilterDrawer> = {
  title: 'Components/Matter/MobileFilterDrawer',
  component: MobileFilterDrawer,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'iphone12',
    },
    docs: {
      description: {
        component: 'A mobile-optimized filter drawer component with touch gestures, organized sections, and preset management for matter filtering on mobile devices.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    configs: {
      description: 'Array of filter configurations defining available filters',
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
    open: {
      description: 'Whether the mobile drawer is open',
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
    { field: 'status', operator: 'in', value: ['IN_PROGRESS', 'REVIEW'] },
    { field: 'priority', operator: 'in', value: ['HIGH'] },
    { field: 'assignedLawyer', operator: 'in', value: ['1'] }
  ],
  quickSearch: 'corporate',
  sortBy: 'dueDate',
  sortDirection: 'asc'
}

export const Default: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    modelValue: defaultFilterState,
    loading: false,
    open: false
  },
  render: (args: any) => ({
    components: { MobileFilterDrawer },
    setup() {
      const isOpen = ref(args.open || false)
      const filterState = ref(args.modelValue || defaultFilterState)
      
      const handleOpenChange = (open: boolean) => {
        isOpen.value = open
      }
      
      const handleFilterChange = (newState: FilterState) => {
        filterState.value = newState
        console.log('Filter state changed:', newState)
      }
      
      const handlePresetApply = (preset: any) => {
        console.log('Applied preset:', preset.name)
      }
      
      const handleExport = (format: 'csv' | 'excel') => {
        console.log('Export as:', format)
      }
      
      return {
        args,
        isOpen,
        filterState,
        handleOpenChange,
        handleFilterChange,
        handlePresetApply,
        handleExport
      }
    },
    template: `
      <div class="h-screen bg-background p-4">
        <div class="mb-4 text-center">
          <p class="text-sm text-muted-foreground mb-4">
            This demo shows the mobile filter drawer. Click "Filters" to open.
          </p>
          <div class="bg-muted/50 rounded-lg p-4">
            <h4 class="font-medium mb-2">Current Filter State:</h4>
            <pre class="text-xs overflow-auto">{{ JSON.stringify(filterState, null, 2) }}</pre>
          </div>
        </div>
        
        <MobileFilterDrawer
          :configs="args.configs"
          v-model="filterState"
          v-model:open="isOpen"
          :loading="args.loading"
          @preset:apply="handlePresetApply"
          @export="handleExport"
        />
      </div>
    `
  })
}

export const WithActiveFilters: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    modelValue: activeFilterState,
    loading: false,
    open: false
  },
  render: Default.render,
  parameters: {
    docs: {
      description: {
        story: 'Mobile filter drawer with active filters showing filter count badge and organized sections.'
      }
    }
  }
}

export const Loading: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    modelValue: defaultFilterState,
    loading: true,
    open: true
  },
  render: Default.render,
  parameters: {
    docs: {
      description: {
        story: 'Mobile filter drawer in loading state with overlay.'
      }
    }
  }
}

export const TouchInteraction: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    modelValue: defaultFilterState,
    loading: false,
    open: true
  },
  render: (args: any) => ({
    components: { MobileFilterDrawer },
    setup() {
      const isOpen = ref(args.open || false)
      const filterState = ref(args.modelValue || defaultFilterState)
      const touchActions = ref<string[]>([])
      
      const handleOpenChange = (open: boolean) => {
        isOpen.value = open
        touchActions.value.push(`Drawer ${open ? 'opened' : 'closed'}`)
      }
      
      const handleFilterChange = (newState: FilterState) => {
        filterState.value = newState
        touchActions.value.push(`Filter changed: ${newState.filters.length} filters`)
      }
      
      return {
        args,
        isOpen,
        filterState,
        touchActions,
        handleOpenChange,
        handleFilterChange
      }
    },
    template: `
      <div class="h-screen bg-background">
        <div class="p-4 border-b">
          <h3 class="font-medium mb-2">Touch Interaction Demo</h3>
          <p class="text-sm text-muted-foreground mb-4">
            Try swiping down to close, tapping sections to expand, and using touch-optimized controls.
          </p>
          <div class="bg-muted/50 rounded-lg p-3">
            <h4 class="text-sm font-medium mb-2">Touch Actions:</h4>
            <div class="max-h-32 overflow-y-auto">
              <p 
                v-for="(action, index) in touchActions.slice(-5)" 
                :key="index"
                class="text-xs text-muted-foreground"
              >
                {{ action }}
              </p>
            </div>
          </div>
        </div>
        
        <MobileFilterDrawer
          :configs="args.configs"
          v-model="filterState"
          v-model:open="isOpen"
          :loading="args.loading"
          @update:open="handleOpenChange"
          @update:modelValue="handleFilterChange"
        />
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing touch gestures and mobile-optimized controls. Try swiping and tapping.'
      }
    }
  }
}

export const PresetManagement: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS,
    modelValue: defaultFilterState,
    loading: false,
    open: true
  },
  render: (args: any) => ({
    components: { MobileFilterDrawer },
    setup() {
      const isOpen = ref(args.open || false)
      const filterState = ref(args.modelValue || defaultFilterState)
      const presetActions = ref<string[]>([])
      
      const handlePresetApply = (preset: any) => {
        presetActions.value.push(`Applied: ${preset.name}`)
        console.log('Applied preset:', preset)
      }
      
      const handleExport = (format: 'csv' | 'excel') => {
        presetActions.value.push(`Exported as ${format.toUpperCase()}`)
        console.log('Export as:', format)
      }
      
      return {
        args,
        isOpen,
        filterState,
        presetActions,
        handlePresetApply,
        handleExport
      }
    },
    template: `
      <div class="h-screen bg-background">
        <div class="p-4 border-b">
          <h3 class="font-medium mb-2">Preset Management Demo</h3>
          <p class="text-sm text-muted-foreground mb-4">
            Test preset application and export functionality.
          </p>
          <div class="bg-muted/50 rounded-lg p-3">
            <h4 class="text-sm font-medium mb-2">Preset Actions:</h4>
            <div class="max-h-32 overflow-y-auto">
              <p 
                v-for="(action, index) in presetActions.slice(-5)" 
                :key="index"
                class="text-xs text-muted-foreground"
              >
                {{ action }}
              </p>
            </div>
          </div>
        </div>
        
        <MobileFilterDrawer
          :configs="args.configs"
          v-model="filterState"
          v-model:open="isOpen"
          :loading="args.loading"
          @preset:apply="handlePresetApply"
          @export="handleExport"
        />
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Demo focusing on preset management features including system presets, custom presets, and export options.'
      }
    }
  }
}

export const Responsive: Story = {
  args: {
    configs: MATTER_FILTER_CONFIGS.slice(0, 6), // Fewer configs for cleaner demo
    modelValue: defaultFilterState,
    loading: false,
    open: false
  },
  render: Default.render,
  parameters: {
    viewport: {
      defaultViewport: 'responsive',
    },
    docs: {
      description: {
        story: 'Responsive behavior - drawer only shows on mobile screens (< 1024px width).'
      }
    }
  }
}