import type { Meta, StoryObj } from '@storybook/vue3'
import MobileFilterDrawer from './MobileFilterDrawer.vue'
import { ref, computed } from 'vue'
import type { FilterState } from '~/types/matter'
import type { MatterPriority, MatterStatus } from '~/types/kanban'

const meta: Meta<typeof MobileFilterDrawer> = {
  title: 'Kanban/Mobile/MobileFilterDrawer',
  component: MobileFilterDrawer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Mobile-optimized filter drawer with swipe-to-close, touch-friendly controls, and comprehensive filtering options for legal matter management.'
      }
    }
  },
  argTypes: {
    modelValue: {
      control: 'boolean',
      description: 'Controls drawer visibility'
    },
    filters: {
      control: 'object',
      description: 'Current filter state'
    },
    availableTags: {
      control: 'object',
      description: 'Available tags for filtering'
    },
    availableAssignees: {
      control: 'object',
      description: 'Available assignees for filtering'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

// Mock data
const mockFilters: FilterState = {
  searchQuery: '',
  selectedLawyers: [],
  selectedPriorities: [],
  selectedStatuses: [],
  showClosed: false,
  searchMode: 'fuzzy' as const,
  search: '',
  priority: [],
  status: [],
  assigneeIds: [],
  tags: [],
  dateRange: undefined,
  showCompleted: false,
  filters: []
}

const mockTags = ['Contract', 'Commercial', 'Urgent', 'Review', 'Litigation', 'Settlement', 'Employment', 'Personal Injury', 'Real Estate']

const mockAssignees = [
  { id: 'lawyer1', name: 'John Smith' },
  { id: 'lawyer2', name: 'Jane Doe' },
  { id: 'lawyer3', name: 'Robert Johnson' },
  { id: 'clerk1', name: 'Emily Brown' },
  { id: 'clerk2', name: 'Michael Davis' }
]

export const Default: Story = {
  args: {
    modelValue: true,
    filters: mockFilters,
    availableTags: mockTags,
    availableAssignees: mockAssignees
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

export const Interactive: Story = {
  render: (args) => ({
    components: { MobileFilterDrawer },
    setup() {
      const isOpen = ref(false)
      const currentFilters = ref<FilterState>({ ...mockFilters })
      const appliedFilters = ref<FilterState>({ ...mockFilters })
      
      const openDrawer = () => {
        isOpen.value = true
      }
      
      const handleUpdateFilters = (filters: FilterState) => {
        currentFilters.value = { ...filters }
      }
      
      const handleApply = (filters: FilterState) => {
        appliedFilters.value = { ...filters }
        isOpen.value = false
      }
      
      const handleReset = () => {
        currentFilters.value = { ...mockFilters }
        appliedFilters.value = { ...mockFilters }
      }
      
      const activeFilterCount = computed(() => {
        let count = 0
        if (appliedFilters.value.search) count++
        if (appliedFilters.value.priority?.length) count += appliedFilters.value.priority.length
        if (appliedFilters.value.status?.length) count += appliedFilters.value.status.length
        if (appliedFilters.value.assigneeIds?.length) count += appliedFilters.value.assigneeIds.length
        if (appliedFilters.value.tags?.length) count += appliedFilters.value.tags.length
        if (appliedFilters.value.dateRange?.start || appliedFilters.value.dateRange?.end) count++
        return count
      })
      
      return {
        args: {
          ...args,
          modelValue: isOpen.value,
          filters: currentFilters.value
        },
        isOpen,
        currentFilters,
        appliedFilters,
        activeFilterCount,
        openDrawer,
        handleUpdateFilters,
        handleApply,
        handleReset
      }
    },
    template: `
      <div style="width: 100vw; height: 100vh; background: #f8fafc; position: relative;">
        <!-- Main content with filter trigger -->
        <div style="padding: 20px;">
          <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="margin: 0 0 16px 0; font-size: 24px;">Legal Matters Dashboard</h2>
            
            <button 
              @click="openDrawer"
              style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                margin-bottom: 16px;
              "
            >
              🎛️ Open Filters 
              <span v-if="activeFilterCount > 0" style="background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 12px; margin-left: 8px;">
                {{ activeFilterCount }}
              </span>
            </button>
            
            <!-- Applied filters display -->
            <div v-if="activeFilterCount > 0" style="margin-top: 16px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">Applied Filters:</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <span v-if="appliedFilters.search" style="background: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  Search: {{ appliedFilters.search }}
                </span>
                <span v-for="priority in appliedFilters.priority" :key="priority" style="background: #fed7d7; color: #c53030; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  Priority: {{ priority }}
                </span>
                <span v-for="status in appliedFilters.status" :key="status" style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  Status: {{ status }}
                </span>
                <span v-for="tag in appliedFilters.tags" :key="tag" style="background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  Tag: {{ tag }}
                </span>
              </div>
            </div>
            
            <div style="margin-top: 24px; padding: 16px; background: rgba(0,0,0,0.8); color: white; border-radius: 8px; font-size: 14px;">
              📱 <strong>Mobile Interactions:</strong><br>
              • Tap the filter button to open the drawer<br>
              • Swipe down on the drawer to close<br>
              • Drag the handle for visual feedback<br>
              • Use the filter chips to toggle options<br>
              • Apply or reset filters with action buttons
            </div>
          </div>
        </div>
        
        <MobileFilterDrawer 
          v-model="isOpen"
          :filters="currentFilters"
          :availableTags="args.availableTags"
          :availableAssignees="args.availableAssignees"
          @update:filters="handleUpdateFilters"
          @apply="handleApply"
          @reset="handleReset"
        />
      </div>
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Interactive filter drawer demo showing complete filter workflow with swipe gestures and touch interactions.'
      }
    }
  }
}

export const WithActiveFilters: Story = {
  args: {
    modelValue: true,
    filters: {
      searchQuery: 'contract dispute',
      selectedLawyers: ['lawyer1', 'lawyer2'],
      selectedPriorities: ['HIGH', 'URGENT'] as MatterPriority[],
      selectedStatuses: ['INTAKE', 'IN_PROGRESS'] as MatterStatus[],
      showClosed: false,
      searchMode: 'fuzzy' as const,
      search: 'contract dispute',
      priority: ['HIGH', 'URGENT'],
      status: ['ACTIVE', 'PENDING'],
      assigneeIds: ['lawyer1', 'lawyer2'],
      tags: ['Contract', 'Commercial', 'Urgent'],
      dateRange: {
        start: new Date('2025-06-01'),
        end: new Date('2025-07-31')
      },
      showCompleted: false,
      filters: []
    },
    availableTags: mockTags,
    availableAssignees: mockAssignees
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Filter drawer with multiple active filters demonstrating selected states and filter chips.'
      }
    }
  }
}

export const MinimalOptions: Story = {
  args: {
    modelValue: true,
    filters: mockFilters,
    availableTags: ['Contract', 'Review'],
    availableAssignees: [
      { id: 'lawyer1', name: 'John Smith' }
    ]
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Filter drawer with minimal available options, showing clean layout with fewer choices.'
      }
    }
  }
}

export const SwipeGestures: Story = {
  render: (args) => ({
    components: { MobileFilterDrawer },
    setup() {
      const isOpen = ref(true)
      const dragDistance = ref(0)
      const swipeActions = ref<string[]>([])
      
      const addSwipeAction = (action: string) => {
        swipeActions.value.unshift(`${new Date().toLocaleTimeString()}: ${action}`)
        if (swipeActions.value.length > 5) {
          swipeActions.value.pop()
        }
      }
      
      const handleDragStart = () => {
        addSwipeAction('Drag started')
      }
      
      const handleDragMove = (distance: number) => {
        dragDistance.value = distance
        if (distance > 50) {
          addSwipeAction(`Dragging down: ${distance}px`)
        }
      }
      
      const handleDragEnd = (willClose: boolean) => {
        addSwipeAction(willClose ? 'Drawer closed by swipe' : 'Drag cancelled')
        dragDistance.value = 0
      }
      
      return {
        args: {
          ...args,
          modelValue: isOpen.value
        },
        isOpen,
        dragDistance,
        swipeActions,
        handleDragStart,
        handleDragMove,
        handleDragEnd
      }
    },
    template: `
      <div style="width: 100vw; height: 100vh; background: #f8fafc; position: relative;">
        <!-- Swipe feedback panel -->
        <div 
          style="
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 200;
            font-size: 14px;
          "
        >
          <div style="font-weight: 600; margin-bottom: 8px;">👆 Swipe Gesture Tracking:</div>
          <div style="margin-bottom: 8px;">Current drag: {{ dragDistance }}px</div>
          <div style="max-height: 120px; overflow-y: auto;">
            <div v-for="action in swipeActions" :key="action" style="font-family: monospace; font-size: 12px; margin-bottom: 2px;">
              {{ action }}
            </div>
          </div>
        </div>
        
        <MobileFilterDrawer 
          v-model="isOpen"
          :filters="args.filters"
          :availableTags="args.availableTags"
          :availableAssignees="args.availableAssignees"
          @drag-start="handleDragStart"
          @drag-move="handleDragMove"
          @drag-end="handleDragEnd"
        />
      </div>
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Demonstrates swipe gesture detection and visual feedback for drawer interactions.'
      }
    }
  }
}

export const LandscapeMode: Story = {
  args: {
    modelValue: true,
    filters: {
      searchQuery: 'legal case',
      selectedLawyers: [],
      selectedPriorities: ['HIGH'] as MatterPriority[],
      selectedStatuses: ['INTAKE'] as MatterStatus[],
      showClosed: false,
      searchMode: 'fuzzy' as const,
      search: 'legal case',
      priority: ['HIGH'],
      status: ['ACTIVE'],
      assigneeIds: [],
      tags: ['Contract'],
      dateRange: undefined,
      showCompleted: false,
      filters: []
    },
    availableTags: mockTags,
    availableAssignees: mockAssignees
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    },
    docs: {
      description: {
        story: 'Filter drawer optimized for landscape orientation with adjusted layout and sizing.'
      }
    }
  }
}

export const TabletView: Story = {
  args: {
    modelValue: true,
    filters: mockFilters,
    availableTags: mockTags,
    availableAssignees: mockAssignees
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Filter drawer adapted for tablet view with larger touch targets and optimized spacing.'
      }
    }
  }
}

export const iOSSafeArea: Story = {
  args: {
    modelValue: true,
    filters: mockFilters,
    availableTags: mockTags.slice(0, 5),
    availableAssignees: mockAssignees.slice(0, 3)
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'iOS device simulation with proper safe area handling for notch and home indicator.'
      }
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div 
          style="
            width: 100vw; 
            height: 100vh; 
            background: #f8fafc;
            padding-top: 44px;
            padding-bottom: 34px;
            position: relative;
          "
        >
          <!-- Simulated iOS status bar -->
          <div 
            style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 44px;
              background: #000;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: 600;
              z-index: 300;
            "
          >
            📱 iOS Safe Area Demo
          </div>
          
          <story />
          
          <!-- Simulated iOS home indicator -->
          <div 
            style="
              position: absolute;
              bottom: 8px;
              left: 50%;
              transform: translateX(-50%);
              width: 134px;
              height: 5px;
              background: #000;
              border-radius: 3px;
              opacity: 0.3;
              z-index: 300;
            "
          />
        </div>
      `
    })
  ]
}

export const AccessibilityDemo: Story = {
  render: (args) => ({
    components: { MobileFilterDrawer },
    setup() {
      const isOpen = ref(true)
      const currentFilters = ref<FilterState>({ ...mockFilters })
      const a11yAnnouncements = ref<string[]>([])
      
      const addAnnouncement = (message: string) => {
        a11yAnnouncements.value.unshift(`${new Date().toLocaleTimeString()}: ${message}`)
        if (a11yAnnouncements.value.length > 4) {
          a11yAnnouncements.value.pop()
        }
      }
      
      const handleFilterChange = (filters: FilterState) => {
        currentFilters.value = { ...filters }
        
        // Announce filter changes
        const activeCount = Object.values(filters).flat().filter(Boolean).length
        addAnnouncement(`Filters updated. ${activeCount} active filters.`)
      }
      
      const handleFocus = (element: string) => {
        addAnnouncement(`Focused on ${element}`)
      }
      
      return {
        args: {
          ...args,
          modelValue: isOpen.value,
          filters: currentFilters.value
        },
        isOpen,
        currentFilters,
        a11yAnnouncements,
        handleFilterChange,
        handleFocus
      }
    },
    template: `
      <div style="width: 100vw; height: 100vh; background: #f8fafc; position: relative;">
        <!-- Accessibility info panel -->
        <div 
          style="
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            max-width: 220px;
            z-index: 200;
          "
        >
          <div style="font-weight: 600; margin-bottom: 8px;">♿ Accessibility Features:</div>
          <ul style="margin: 0; padding-left: 16px; line-height: 1.4;">
            <li>Keyboard navigation</li>
            <li>Screen reader labels</li>
            <li>Focus management</li>
            <li>ARIA live regions</li>
            <li>High contrast support</li>
            <li>Touch targets ≥44px</li>
          </ul>
        </div>
        
        <MobileFilterDrawer 
          v-model="isOpen"
          :filters="currentFilters"
          :availableTags="args.availableTags"
          :availableAssignees="args.availableAssignees"
          @update:filters="handleFilterChange"
          @focus="handleFocus"
        />
        
        <!-- Screen reader announcements -->
        <div
          v-if="a11yAnnouncements.length > 0"
          style="
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 200;
          "
        >
          <div style="font-weight: 600; margin-bottom: 4px;">📢 Screen Reader:</div>
          <div v-for="announcement in a11yAnnouncements" :key="announcement" style="font-family: monospace; font-size: 12px; margin-bottom: 2px;">
            {{ announcement }}
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Accessibility-focused demo showing keyboard navigation, focus management, and screen reader support.'
      }
    }
  }
}

export const PerformanceTest: Story = {
  args: {
    modelValue: true,
    filters: mockFilters,
    availableTags: Array.from({ length: 30 }, (_, i) => `Tag ${i + 1}`),
    availableAssignees: Array.from({ length: 20 }, (_, i) => ({
      id: `user-${i}`,
      name: `User ${i + 1}`
    }))
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Performance test with many filter options to verify smooth scrolling and rendering.'
      }
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="width: 100vw; height: 100vh; background: #f8fafc;">
          <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 200;">
            ⚡ 30 tags • 20 assignees • Optimized rendering
          </div>
          <story />
        </div>
      `
    })
  ]
}