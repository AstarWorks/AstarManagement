import type { Meta, StoryObj } from '@storybook/nextjs'
import { MatterCard } from './MatterCard'
import { DEFAULT_VIEW_PREFERENCES } from './constants'
// import { TooltipProvider } from '@/components/ui/tooltip'
import type { MatterStatus, MatterPriority } from './types'

const meta: Meta<typeof MatterCard> = {
  title: 'Features/MatterCard',
  component: MatterCard,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    )
  ],
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

// Base matter data
const baseMatter = {
  id: '1',
  caseNumber: '2025-CV-0001',
  title: 'Contract Dispute with ABC Corporation',
  clientName: 'ABC Corporation',
  status: 'INTAKE' as const,
  priority: 'HIGH' as const,
  assignedLawyer: {
    id: 'lawyer1',
    name: 'John Smith',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  assignedClerk: {
    id: 'clerk1',
    name: 'Jane Doe',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face'
  },
  dueDate: '2025-07-15T10:00:00Z',
  createdAt: '2025-06-15T10:00:00Z',
  updatedAt: '2025-06-17T05:00:00Z',
  statusDuration: 2
}

const baseProps = {
  viewPreferences: DEFAULT_VIEW_PREFERENCES,
  currentUser: {
    id: 'user1',
    role: 'LAWYER' as const
  }
}

export const Default: Story = {
  args: {
    matter: baseMatter,
    ...baseProps
  }
}

export const UrgentPriority: Story = {
  args: {
    matter: {
      ...baseMatter,
      priority: 'URGENT',
      title: 'Urgent Litigation Matter - Injunction Required'
    },
    ...baseProps
  }
}

export const LowPriority: Story = {
  args: {
    matter: {
      ...baseMatter,
      priority: 'LOW',
      title: 'Routine Contract Review'
    },
    ...baseProps
  }
}

export const OverdueMatter: Story = {
  args: {
    matter: {
      ...baseMatter,
      dueDate: '2025-06-01T10:00:00Z', // Past date
      priority: 'URGENT',
      title: 'Overdue Response Required'
    },
    ...baseProps
  }
}

export const LongTitle: Story = {
  args: {
    matter: {
      ...baseMatter,
      title: 'Complex Multi-Party Commercial Litigation Involving Contract Disputes, Intellectual Property Claims, and Cross-Border Jurisdictional Issues'
    },
    ...baseProps
  }
}

export const NoAssignees: Story = {
  args: {
    matter: {
      ...baseMatter,
      assignedLawyer: undefined,
      assignedClerk: undefined,
      title: 'Unassigned New Matter'
    },
    ...baseProps
  }
}

export const NoDueDate: Story = {
  args: {
    matter: {
      ...baseMatter,
      dueDate: undefined,
      title: 'Open-Ended Consultation'
    },
    ...baseProps
  }
}

export const CompactView: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: {
      ...DEFAULT_VIEW_PREFERENCES,
      cardSize: 'compact'
    },
    currentUser: baseProps.currentUser
  }
}

export const DetailedView: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: {
      ...DEFAULT_VIEW_PREFERENCES,
      cardSize: 'detailed'
    },
    currentUser: baseProps.currentUser
  }
}

export const DifferentStatuses: Story = {
  render: () => (
    <div className="space-y-4">
      {[
        { status: 'INTAKE', title: 'Initial Intake' },
        { status: 'INVESTIGATION', title: 'Under Investigation' },
        { status: 'DRAFT_PLEADINGS', title: 'Drafting Pleadings' },
        { status: 'FILED', title: 'Filed with Court' },
        { status: 'DISCOVERY', title: 'Discovery Phase' },
        { status: 'TRIAL', title: 'Trial in Progress' },
        { status: 'SETTLEMENT', title: 'Settlement Negotiation' },
        { status: 'CLOSED', title: 'Case Closed' }
      ].map((item, index) => (
        <MatterCard
          key={index}
          matter={{
            ...baseMatter,
            id: `matter-${index}`,
            status: item.status as MatterStatus,
            title: item.title,
            caseNumber: `2025-CV-000${index + 1}`
          }}
          {...baseProps}
        />
      ))}
    </div>
  )
}

export const AllPriorities: Story = {
  render: () => (
    <div className="space-y-4">
      {[
        { priority: 'URGENT', title: 'Urgent Matter' },
        { priority: 'HIGH', title: 'High Priority Matter' },
        { priority: 'MEDIUM', title: 'Medium Priority Matter' },
        { priority: 'LOW', title: 'Low Priority Matter' }
      ].map((item, index) => (
        <MatterCard
          key={index}
          matter={{
            ...baseMatter,
            id: `matter-${index}`,
            priority: item.priority as MatterPriority,
            title: item.title,
            caseNumber: `2025-CV-000${index + 1}`
          }}
          {...baseProps}
        />
      ))}
    </div>
  )
}

export const DraggingState: Story = {
  args: {
    matter: baseMatter,
    isDragging: true,
    ...baseProps
  }
}

export const WithoutAvatars: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: {
      ...DEFAULT_VIEW_PREFERENCES,
      showAvatars: false
    },
    currentUser: baseProps.currentUser
  }
}

export const WithoutPriority: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: {
      ...DEFAULT_VIEW_PREFERENCES,
      showPriority: false
    },
    currentUser: baseProps.currentUser
  }
}

export const WithoutDueDates: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: {
      ...DEFAULT_VIEW_PREFERENCES,
      showDueDates: false
    },
    currentUser: baseProps.currentUser
  }
}

export const Interactive: Story = {
  args: {
    matter: baseMatter,
    onClick: () => alert('Matter clicked!'),
    onEdit: () => alert('Edit clicked!'),
    ...baseProps
  }
}

export const RecentlyUpdated: Story = {
  args: {
    matter: {
      ...baseMatter,
      updatedAt: new Date().toISOString(), // Just updated
      title: 'Recently Updated Matter'
    },
    ...baseProps
  }
}

export const OldUpdate: Story = {
  args: {
    matter: {
      ...baseMatter,
      updatedAt: '2025-01-15T10:00:00Z', // Old update
      title: 'Matter with Old Update'
    },
    ...baseProps
  }
}