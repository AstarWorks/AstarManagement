import type { Meta, StoryObj } from '@storybook/vue3'
import MatterCard from './MatterCard.vue'
import { DEFAULT_VIEW_PREFERENCES } from '~/constants/kanban'
import type { MatterCard as MatterCardType } from '~/types/kanban'

const meta: Meta<typeof MatterCard> = {
  title: 'Kanban/MatterCard',
  component: MatterCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Vue 3 SFC component for displaying matter information in kanban cards with priority coding, avatars, and accessibility features.'
      }
    }
  },
  decorators: [
    () => ({
      template: '<div class="w-80 p-4 bg-gray-50"><story /></div>'
    })
  ],
  argTypes: {
    'matter.priority': {
      control: 'select',
      options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    },
    'viewPreferences.cardSize': {
      control: 'select', 
      options: ['compact', 'normal', 'expanded']
    },
    isDragging: {
      control: 'boolean'
    },
    'viewPreferences.showAvatars': {
      control: 'boolean'
    },
    'viewPreferences.showDueDates': {
      control: 'boolean'
    },
    'viewPreferences.showPriority': {
      control: 'boolean'
    },
    'viewPreferences.showTags': {
      control: 'boolean'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

// Base matter data
const baseMatter: MatterCardType = {
  id: '1',
  caseNumber: '2025-CV-0001',
  title: 'Contract Dispute with ABC Corporation',
  clientName: 'ABC Corporation',
  opponentName: 'XYZ Industries',
  status: 'INTAKE',
  priority: 'HIGH',
  dueDate: '2025-07-15T10:00:00Z',
  createdAt: '2025-06-15T10:00:00Z',
  updatedAt: '2025-06-17T05:00:00Z',
  statusDuration: 2,
  assignedLawyer: {
    id: 'lawyer1',
    name: 'John Smith',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  assignedClerk: {
    id: 'clerk1', 
    name: 'Jane Doe',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face'
  },
  relatedDocuments: 12,
  tags: ['Contract', 'Commercial', 'Urgent']
}

export const Default: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const AllPriorities: Story = {
  render: () => ({
    components: { MatterCard },
    setup() {
      const priorities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      const matters = priorities.map((priority, index) => ({
        ...baseMatter,
        id: `matter-${index}`,
        priority,
        title: `${priority} Priority Matter`,
        caseNumber: `2025-CV-000${index + 1}`
      }))
      
      return { matters, viewPreferences: DEFAULT_VIEW_PREFERENCES }
    },
    template: `
      <div class="space-y-4">
        <MatterCard
          v-for="matter in matters"
          :key="matter.id"
          :matter="matter"
          :viewPreferences="viewPreferences"
        />
      </div>
    `
  })
}

export const ViewSizes: Story = {
  render: () => ({
    components: { MatterCard },
    setup() {
      const sizes: Array<'compact' | 'normal' | 'detailed'> = ['compact', 'normal', 'detailed']
      return { 
        matter: baseMatter,
        sizes: sizes.map(size => ({
          ...DEFAULT_VIEW_PREFERENCES,
          cardSize: size
        }))
      }
    },
    template: `
      <div class="space-y-6">
        <div v-for="prefs in sizes" :key="prefs.cardSize">
          <h3 class="text-sm font-medium mb-2 capitalize">{{ prefs.cardSize }} View</h3>
          <MatterCard :matter="matter" :viewPreferences="prefs" />
        </div>
      </div>
    `
  })
}

export const OverdueMatter: Story = {
  args: {
    matter: {
      ...baseMatter,
      dueDate: '2024-06-01T10:00:00Z', // Past date
      priority: 'URGENT',
      title: 'Overdue Response Required - Court Filing'
    },
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const NoAssignees: Story = {
  args: {
    matter: {
      ...baseMatter,
      assignedLawyer: undefined,
      assignedClerk: undefined,
      title: 'Unassigned New Intake Matter'
    },
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const WithoutAvatarImages: Story = {
  args: {
    matter: {
      ...baseMatter,
      assignedLawyer: {
        id: 'lawyer2',
        name: 'Robert Johnson',
        initials: 'RJ'
      },
      assignedClerk: {
        id: 'clerk2',
        name: 'Emily Brown',
        initials: 'EB'
      }
    },
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const MinimalView: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: {
      ...DEFAULT_VIEW_PREFERENCES,
      showAvatars: false,
      showTags: false,
      showPriority: false,
      showDueDates: false
    }
  }
}

export const DraggingState: Story = {
  args: {
    matter: baseMatter,
    isDragging: true,
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const LongContent: Story = {
  args: {
    matter: {
      ...baseMatter,
      title: 'Very Long Matter Title That Should Be Truncated Properly in the Card Display',
      clientName: 'Very Long Client Corporation Name LLC',
      opponentName: 'Another Very Long Opponent Company Name Inc.',
      tags: ['Contract', 'Commercial', 'Urgent', 'Review', 'Litigation', 'Settlement']
    },
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const AllStatuses: Story = {
  render: () => ({
    components: { MatterCard },
    setup() {
      const statuses: Array<'INTAKE' | 'INVESTIGATION' | 'FILED' | 'TRIAL' | 'CLOSED'> = 
        ['INTAKE', 'INVESTIGATION', 'FILED', 'TRIAL', 'CLOSED']
      
      const matters = statuses.map((status, index) => ({
        ...baseMatter,
        id: `matter-status-${index}`,
        status,
        title: `Matter in ${status} status`,
        caseNumber: `2025-${status}-001`,
        statusDuration: Math.floor(Math.random() * 30) + 1
      }))
      
      return { matters, viewPreferences: DEFAULT_VIEW_PREFERENCES }
    },
    template: `
      <div class="space-y-4">
        <MatterCard
          v-for="matter in matters"
          :key="matter.id"
          :matter="matter"
          :viewPreferences="viewPreferences"
        />
      </div>
    `
  })
}

export const InteractiveCard: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  },
  play: async ({ canvasElement, args }) => {
    // Interaction testing
    const canvas = within(canvasElement)
    const card = canvas.getByRole('button')
    
    // Test hover state
    await userEvent.hover(card)
    
    // Test keyboard navigation
    await userEvent.tab()
    expect(card).toHaveFocus()
    
    // Test keyboard activation
    await userEvent.keyboard('{Enter}')
  }
}

export const MobileView: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: {
      ...DEFAULT_VIEW_PREFERENCES,
      cardSize: 'compact'
    }
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

export const HighContrastMode: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  },
  decorators: [
    () => ({
      template: `
        <div class="w-80 p-4 bg-gray-50" style="filter: contrast(2);">
          <story />
        </div>
      `
    })
  ]
}

// Import necessary testing utilities
import { within, userEvent, expect } from '@storybook/test'