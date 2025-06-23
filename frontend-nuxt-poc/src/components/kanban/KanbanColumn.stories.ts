import type { Meta, StoryObj } from '@storybook/vue3'
import KanbanColumn from './KanbanColumn.vue'
import { DEFAULT_KANBAN_COLUMNS } from '~/constants/kanban'
import type { Matter } from '~/types/matter'

// Mock matters for the column
const mockMatters: Matter[] = [
  {
    id: 'matter-1',
    caseNumber: '2025-CV-0001',
    title: 'Contract Dispute - ABC Corporation vs XYZ Holdings',
    description: 'Commercial contract disagreement requiring urgent review and potential litigation',
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
    title: 'Personal Injury Claim',
    description: 'Slip and fall incident at commercial property',
    clientName: 'John Doe',
    assignedLawyer: 'Robert Johnson',
    status: 'INTAKE',
    priority: 'medium',
    dueDate: '2025-08-01',
    createdAt: '2025-06-10T14:30:00Z',
    updatedAt: '2025-06-22T16:00:00Z',
    relatedDocuments: 3,
    tags: ['personal-injury']
  },
  {
    id: 'matter-3',
    caseNumber: '2025-CV-0003',
    title: 'Employment Law Issue',
    description: 'Wrongful termination claim',
    clientName: 'Sarah Wilson',
    assignedLawyer: 'Emily Brown',
    status: 'INTAKE',
    priority: 'urgent',
    dueDate: '2025-07-01',
    createdAt: '2025-06-05T09:15:00Z',
    updatedAt: '2025-06-22T16:00:00Z',
    relatedDocuments: 8,
    tags: ['employment', 'urgent']
  }
]

const meta: Meta<typeof KanbanColumn> = {
  title: 'Kanban/KanbanColumn',
  component: KanbanColumn,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Individual Kanban column component with matter cards, supporting Japanese/English labels and priority-based styling.'
      }
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="width: 320px; height: 600px; border: 1px solid #e5e7eb; border-radius: 8px;"><story /></div>'
    })
  ],
  argTypes: {
    column: {
      control: 'object',
      description: 'Column configuration with title, status mapping, and styling'
    },
    matters: {
      control: 'object',
      description: 'Array of matters to display in this column'
    },
    showJapanese: {
      control: 'boolean',
      description: 'Show Japanese column title instead of English'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the column'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

// Default story with Japanese labels
export const Default: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0], // Initial Consultation column
    matters: mockMatters,
    showJapanese: true
  }
}

// English version
export const English: Story = {
  args: {
    ...Default.args,
    showJapanese: false
  }
}

// Empty column
export const Empty: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[1], // Document Preparation
    matters: [],
    showJapanese: true
  }
}

// Filed column with single matter
export const SingleMatter: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[2], // Filed
    matters: [mockMatters[0]],
    showJapanese: true
  }
}

// In Progress column
export const InProgress: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[3], // In Progress
    matters: mockMatters.slice(0, 2),
    showJapanese: true
  }
}

// In Court column with urgent matter
export const InCourt: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[4], // In Court
    matters: [
      {
        ...mockMatters[2],
        status: 'TRIAL',
        priority: 'urgent',
        title: 'High-Stakes Litigation Case',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days from now
      }
    ],
    showJapanese: true
  }
}

// Settlement column
export const Settlement: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[5], // Settlement Discussion
    matters: [
      {
        ...mockMatters[1],
        status: 'SETTLEMENT',
        title: 'Mediation in Progress',
        description: 'Settlement negotiations ongoing with opposing counsel'
      }
    ],
    showJapanese: true
  }
}

// Closed column
export const Closed: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[6], // Closed
    matters: [
      {
        ...mockMatters[0],
        status: 'CLOSED',
        title: 'Successfully Resolved Case',
        description: 'Favorable settlement reached for client',
        priority: 'low'
      }
    ],
    showJapanese: true
  }
}

// Column with many matters (scrolling)
export const ManyMatters: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: Array.from({ length: 8 }, (_, i) => ({
      ...mockMatters[i % mockMatters.length],
      id: `matter-${i + 1}`,
      caseNumber: `2025-CV-${String(i + 1).padStart(4, '0')}`,
      title: `Matter ${i + 1}: ${['Contract Review', 'Personal Injury', 'Employment Dispute', 'Real Estate Transaction', 'Family Law'][i % 5]}`,
      priority: (['high', 'medium', 'low', 'urgent'] as const)[i % 4]
    })),
    showJapanese: true
  }
}

// Priority variations
export const HighPriorityMatters: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters.map(matter => ({ ...matter, priority: 'high' as const })),
    showJapanese: true
  }
}

export const UrgentMatters: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters.map(matter => ({ ...matter, priority: 'urgent' as const })),
    showJapanese: true
  }
}

// Different column colors
export const CustomStyledColumn: Story = {
  args: {
    column: {
      ...DEFAULT_KANBAN_COLUMNS[0],
      color: 'bg-purple-50 border-purple-200',
      title: 'Custom Column',
      titleJa: 'カスタム列'
    },
    matters: mockMatters.slice(0, 2),
    showJapanese: true
  }
}

// Interactive demo
export const Interactive: Story = {
  args: {
    ...Default.args
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive column demo - click on column header or matter cards to see events in the Actions panel.'
      }
    }
  },
  render: (args) => ({
    components: { KanbanColumn },
    setup() {
      const handleHeaderClick = (column: any) => {
        console.log('Header clicked:', column)
      }
      
      const handleMatterClick = (matter: any) => {
        console.log('Matter clicked:', matter)
      }
      
      return { args, handleHeaderClick, handleMatterClick }
    },
    template: `
      <KanbanColumn 
        v-bind="args" 
        @header-click="handleHeaderClick"
        @matter-click="handleMatterClick"
      />
    `
  })
}