/**
 * Storybook Stories for Matter Activity Timeline
 * 
 * Demonstrates various configurations and use cases for the activity timeline component
 */

import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MatterActivityTimeline from './MatterActivityTimeline.vue'

const meta: Meta<typeof MatterActivityTimeline> = {
  title: 'Matter/Timeline/MatterActivityTimeline',
  component: MatterActivityTimeline,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The Matter Activity Timeline component displays a comprehensive timeline of all matter-related activities including:

- Document uploads, views, and downloads
- Email communications and notes  
- Matter status changes and updates
- Task creation and completion
- Audit trail events

## Features

- **Multiple View Modes**: Compact, detailed, and grouped by date
- **Real-time Updates**: WebSocket integration for live activity feeds
- **Advanced Filtering**: Filter by activity type, user, and date range
- **Infinite Scroll**: Performance-optimized loading for large datasets
- **Export Functionality**: Export activities in PDF, CSV, or JSON formats
- **Mobile Responsive**: Optimized layouts for all screen sizes

## Usage

The component integrates with TanStack Query for efficient data fetching and caching, 
and supports real-time updates via WebSocket connections.
        `
      }
    }
  },
  argTypes: {
    matterId: {
      control: 'text',
      description: 'Matter ID for filtering activities'
    },
    initialViewMode: {
      control: 'select',
      options: ['compact', 'detailed', 'grouped'],
      description: 'Initial view mode for the timeline'
    },
    enableRealTime: {
      control: 'boolean',
      description: 'Enable real-time updates via WebSocket'
    },
    showHeader: {
      control: 'boolean',
      description: 'Show header with search and controls'
    },
    maxHeight: {
      control: 'text',
      description: 'Maximum height for scrollable area'
    },
    enableExport: {
      control: 'boolean',
      description: 'Enable export functionality'
    },
    enableFiltering: {
      control: 'boolean',
      description: 'Enable advanced filtering options'
    }
  },
  args: {
    matterId: 'matter-123',
    initialViewMode: 'detailed',
    enableRealTime: true,
    showHeader: true,
    maxHeight: '600px',
    enableExport: true,
    enableFiltering: true
  }
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default timeline with all features enabled
 */
export const Default: Story = {
  args: {
    matterId: 'matter-123'
  }
}

/**
 * Compact view mode for space-constrained layouts
 */
export const CompactView: Story = {
  args: {
    matterId: 'matter-123',
    initialViewMode: 'compact',
    maxHeight: '400px'
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact view shows activities in a condensed format, ideal for sidebars or overview panels.'
      }
    }
  }
}

/**
 * Detailed view with full activity information
 */
export const DetailedView: Story = {
  args: {
    matterId: 'matter-123',
    initialViewMode: 'detailed',
    maxHeight: '800px'
  },
  parameters: {
    docs: {
      description: {
        story: 'Detailed view shows complete activity information with expandable content and metadata.'
      }
    }
  }
}

/**
 * Grouped view organizing activities by date
 */
export const GroupedView: Story = {
  args: {
    matterId: 'matter-123',
    initialViewMode: 'grouped',
    maxHeight: '700px'
  },
  parameters: {
    docs: {
      description: {
        story: 'Grouped view organizes activities by date with clear visual separation between days.'
      }
    }
  }
}

/**
 * Embedded timeline without header controls
 */
export const Embedded: Story = {
  args: {
    matterId: 'matter-123',
    showHeader: false,
    enableFiltering: false,
    enableExport: false,
    maxHeight: '500px'
  },
  parameters: {
    docs: {
      description: {
        story: 'Embedded version without header controls, suitable for integration into larger components.'
      }
    }
  }
}

/**
 * Mobile-optimized timeline
 */
export const Mobile: Story = {
  args: {
    matterId: 'matter-123',
    initialViewMode: 'compact',
    maxHeight: '400px'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile-optimized layout with touch-friendly controls and condensed information.'
      }
    }
  }
}

/**
 * Loading state demonstration
 */
export const LoadingState: Story = {
  render: (args) => ({
    components: { MatterActivityTimeline },
    setup() {
      return { args }
    },
    template: `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Loading State</h3>
        <p class="text-sm text-muted-foreground">
          Shows skeleton loading while activities are being fetched
        </p>
        <MatterActivityTimeline v-bind="args" />
      </div>
    `
  }),
  args: {
    matterId: 'loading-matter'
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the loading state with skeleton placeholders while data is being fetched.'
      }
    }
  }
}

/**
 * Error state demonstration
 */
export const ErrorState: Story = {
  render: (args) => ({
    components: { MatterActivityTimeline },
    setup() {
      return { args }
    },
    template: `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Error State</h3>
        <p class="text-sm text-muted-foreground">
          Shows error message with retry functionality when data loading fails
        </p>
        <MatterActivityTimeline v-bind="args" />
      </div>
    `
  }),
  args: {
    matterId: 'error-matter'
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the error state with retry functionality when data loading fails.'
      }
    }
  }
}

/**
 * Empty state demonstration
 */
export const EmptyState: Story = {
  render: (args) => ({
    components: { MatterActivityTimeline },
    setup() {
      return { args }
    },
    template: `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Empty State</h3>
        <p class="text-sm text-muted-foreground">
          Shows empty state when no activities are found for the matter
        </p>
        <MatterActivityTimeline v-bind="args" />
      </div>
    `
  }),
  args: {
    matterId: 'empty-matter'
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the empty state when no activities are found for the matter.'
      }
    }
  }
}

/**
 * Interactive demo with all view modes
 */
export const InteractiveDemo: Story = {
  render: (args) => ({
    components: { MatterActivityTimeline },
    setup() {
      const viewMode = ref('detailed')
      const enableRealTime = ref(true)
      const enableExport = ref(true)
      
      return { 
        args: {
          ...args,
          initialViewMode: viewMode.value,
          enableRealTime: enableRealTime.value,
          enableExport: enableExport.value
        },
        viewMode,
        enableRealTime,
        enableExport
      }
    },
    template: `
      <div class="space-y-6">
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-4">Interactive Controls</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">View Mode</label>
              <select v-model="viewMode" class="w-full p-2 border rounded">
                <option value="compact">Compact</option>
                <option value="detailed">Detailed</option>
                <option value="grouped">Grouped</option>
              </select>
            </div>
            <div class="flex items-center space-x-2">
              <input v-model="enableRealTime" type="checkbox" id="realtime" />
              <label for="realtime" class="text-sm">Real-time Updates</label>
            </div>
            <div class="flex items-center space-x-2">
              <input v-model="enableExport" type="checkbox" id="export" />
              <label for="export" class="text-sm">Enable Export</label>
            </div>
          </div>
        </div>
        
        <MatterActivityTimeline 
          :matter-id="args.matterId"
          :initial-view-mode="viewMode"
          :enable-real-time="enableRealTime"
          :enable-export="enableExport"
          :show-header="true"
          :enable-filtering="true"
          max-height="600px"
        />
      </div>
    `
  }),
  args: {
    matterId: 'interactive-matter'
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo allowing you to test different configurations and view modes in real-time.'
      }
    }
  }
}