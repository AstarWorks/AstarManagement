import type { Meta, StoryObj } from '@storybook/nextjs'
import { FilterBar } from './FilterBar'

const meta: Meta<typeof FilterBar> = {
  title: 'Features/Kanban/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Comprehensive filtering component for the Kanban board with search, lawyer filtering, priority selection, and closed matters toggle.'
      }
    }
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto">
        <Story />
      </div>
    )
  ]
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default filter bar state with no active filters
 */
export const Default: Story = {}

/**
 * Filter bar with active search query
 */
export const WithSearch: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Filter bar with an active search query showing the clear button'
      }
    }
  }
}

/**
 * Filter bar with multiple active filters
 */
export const WithActiveFilters: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Filter bar with multiple active filters including lawyer selection, priority filters, and search'
      }
    }
  }
}

/**
 * Mobile collapsed state
 */
export const MobileCollapsed: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Filter bar in collapsed state on mobile devices'
      }
    }
  }
}

/**
 * Mobile expanded state
 */
export const MobileExpanded: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Filter bar in expanded state on mobile devices showing all filter options'
      }
    }
  }
}

/**
 * Empty state with no available lawyers
 */
export const EmptyLawyers: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Filter bar when no lawyers are assigned to any matters'
      }
    }
  }
}

/**
 * Filter bar showing all priority options
 */
export const AllPriorities: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Filter bar displaying all available priority levels (Low, Medium, High, Urgent)'
      }
    }
  }
}

/**
 * Filter bar with disabled clear button
 */
export const NoClearButton: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Filter bar with no active filters, showing disabled clear button'
      }
    }
  }
}