import type { Meta, StoryObj } from '@storybook/vue3'
import KanbanBoard from './KanbanBoard.vue'
import { DEFAULT_KANBAN_COLUMNS } from '~/constants/kanban'
import type { Matter } from '~/types/matter'

// Mock data for stories
const mockMatters: Matter[] = [
  {
    id: 'matter-1',
    caseNumber: '2025-CV-0001',
    title: 'Contract Dispute - ABC Corp',
    description: 'Commercial contract disagreement requiring urgent review',
    clientName: 'ABC Corporation',
    opponentName: 'XYZ Holdings',
    assignedLawyer: 'Jane Smith',
    status: 'INTAKE',
    priority: 'high',
    dueDate: '2025-07-15',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-22T16:00:00Z',
    relatedDocuments: 5,
    tags: ['contract', 'commercial']
  },
  {
    id: 'matter-2',
    caseNumber: '2025-CV-0002',
    title: 'Personal Injury Case',
    description: 'Slip and fall incident at commercial property',
    clientName: 'John Doe',
    assignedLawyer: 'Robert Johnson',
    status: 'INVESTIGATION',
    priority: 'medium',
    dueDate: '2025-08-01',
    createdAt: '2025-06-10T14:30:00Z',
    updatedAt: '2025-06-22T16:00:00Z',
    relatedDocuments: 12,
    tags: ['personal-injury']
  },
  {
    id: 'matter-3',
    caseNumber: '2025-CV-0003',
    title: 'Employment Termination',
    description: 'Wrongful termination claim requiring immediate attention',
    clientName: 'Sarah Wilson',
    assignedLawyer: 'Emily Brown',
    status: 'FILED',
    priority: 'high',
    dueDate: '2025-07-20',
    createdAt: '2025-06-05T09:15:00Z',
    updatedAt: '2025-06-22T16:00:00Z',
    relatedDocuments: 8,
    tags: ['employment', 'urgent']
  },
  {
    id: 'matter-4',
    caseNumber: '2025-CV-0004',
    title: 'Real Estate Transaction',
    description: 'Commercial property purchase with complex terms',
    clientName: 'Green Properties LLC',
    assignedLawyer: 'Michael Davis',
    status: 'DISCOVERY',
    priority: 'medium',
    dueDate: '2025-09-10',
    createdAt: '2025-05-28T11:45:00Z',
    updatedAt: '2025-06-22T16:00:00Z',
    relatedDocuments: 15,
    tags: ['real-estate', 'commercial']
  },
  {
    id: 'matter-5',
    caseNumber: '2025-CV-0005',
    title: 'Family Law Matter',
    description: 'Custody agreement modification',
    clientName: 'Lisa Johnson',
    assignedLawyer: 'Amanda White',
    status: 'SETTLEMENT',
    priority: 'low',
    dueDate: '2025-08-15',
    createdAt: '2025-06-12T16:20:00Z',
    updatedAt: '2025-06-22T16:00:00Z',
    relatedDocuments: 6,
    tags: ['family-law']
  },
  {
    id: 'matter-6',
    caseNumber: '2025-CV-0006',
    title: 'Completed Litigation',
    description: 'Successfully resolved civil litigation case',
    clientName: 'Tech Innovations Inc.',
    assignedLawyer: 'David Lee',
    status: 'CLOSED',
    priority: 'low',
    dueDate: '2025-06-01',
    createdAt: '2025-03-15T08:30:00Z',
    updatedAt: '2025-06-20T14:00:00Z',
    relatedDocuments: 25,
    tags: ['litigation', 'closed']
  }
]

const meta: Meta<typeof KanbanBoard> = {
  title: 'Kanban/KanbanBoard',
  component: KanbanBoard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Vue 3 Kanban board layout foundation with responsive design and 7 Japanese status columns. Supports desktop horizontal scrolling and mobile tab navigation.'
      }
    }
  },
  argTypes: {
    showJapanese: {
      control: 'boolean',
      description: 'Show Japanese column titles instead of English'
    },
    title: {
      control: 'text',
      description: 'Board title displayed in header'
    },
    matters: {
      control: 'object',
      description: 'Array of matter objects to display in columns'
    },
    columns: {
      control: 'object',
      description: 'Custom column configuration (uses default 7 Japanese columns if not provided)'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

// Default story with Japanese labels
export const Default: Story = {
  args: {
    title: 'Matter Management Board',
    columns: DEFAULT_KANBAN_COLUMNS,
    showJapanese: true,
    matters: mockMatters
  }
}

// English version
export const English: Story = {
  args: {
    ...Default.args,
    showJapanese: false,
    title: 'Legal Case Management Dashboard'
  }
}

// Empty state
export const Empty: Story = {
  args: {
    ...Default.args,
    matters: [],
    title: 'Empty Kanban Board'
  }
}

// Mobile viewport story
export const Mobile: Story = {
  args: {
    ...Default.args,
    title: '案件管理ボード'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile layout with tab navigation and transitions between columns'
      }
    }
  }
}

// Tablet viewport story
export const Tablet: Story = {
  args: {
    ...Default.args
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Tablet layout showing desktop view with horizontal scrolling'
      }
    }
  }
}

// Large desktop story
export const LargeDesktop: Story = {
  args: {
    ...Default.args
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    },
    docs: {
      description: {
        story: 'Large desktop layout showing all 7 columns without scrolling'
      }
    }
  }
}

// High priority matters only
export const HighPriorityMatters: Story = {
  args: {
    ...Default.args,
    matters: mockMatters.filter(matter => matter.priority === 'high'),
    title: 'High Priority Matters'
  }
}

// Single column with many matters
export const SingleColumnManyMatters: Story = {
  args: {
    ...Default.args,
    matters: Array.from({ length: 15 }, (_, i) => ({
      ...mockMatters[0],
      id: `matter-${i + 1}`,
      caseNumber: `2025-CV-${String(i + 1).padStart(4, '0')}`,
      title: `Matter ${i + 1}: Various Legal Case`,
      status: 'INTAKE' as const
    })),
    title: 'Column Overflow Test'
  }
}

// Loading state
export const Loading: Story = {
  args: {
    ...Default.args,
    matters: []
  },
  render: (args) => ({
    components: { KanbanBoard },
    setup() {
      const isLoading = ref(true)
      return { args, isLoading }
    },
    template: `
      <div class="h-screen">
        <KanbanBoard v-bind="args" />
        <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <div class="text-gray-600">Loading matters...</div>
          </div>
        </div>
      </div>
    `
  })
}

// Accessibility testing story
export const AccessibilityDemo: Story = {
  args: {
    ...Default.args
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard navigation and screen reader support. Use Tab to navigate between elements and Enter/Space to interact.'
      }
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'keyboard-navigation',
            enabled: true
          }
        ]
      }
    }
  }
}

// Custom columns configuration
export const CustomColumns: Story = {
  args: {
    ...Default.args,
    columns: [
      {
        id: 'urgent',
        title: 'Urgent',
        titleJa: '緊急',
        status: ['INTAKE', 'INITIAL_REVIEW'],
        color: 'bg-red-50 border-red-200',
        order: 1
      },
      {
        id: 'working',
        title: 'In Progress',
        titleJa: '作業中',
        status: ['INVESTIGATION', 'RESEARCH', 'DRAFT_PLEADINGS', 'DISCOVERY'],
        color: 'bg-blue-50 border-blue-200',
        order: 2
      },
      {
        id: 'done',
        title: 'Completed',
        titleJa: '完了',
        status: ['CLOSED'],
        color: 'bg-green-50 border-green-200',
        order: 3
      }
    ],
    title: 'Simplified 3-Column Layout'
  }
}