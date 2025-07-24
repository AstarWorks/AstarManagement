import type { Meta, StoryObj } from '@storybook/vue3'
import KanbanColumn from './KanbanColumn.vue'
import { DEFAULT_KANBAN_COLUMNS } from '~/constants/kanban'
import type { MatterCard, MatterPriority } from '~/types/kanban'
import { ref } from 'vue'

// Mock matters for the column
const mockMatters: MatterCard[] = [
  {
    id: 'matter-1',
    caseNumber: '2025-CV-0001',
    title: 'Contract Dispute - ABC Corporation vs XYZ Holdings',
    description: 'Commercial contract disagreement requiring urgent review and potential litigation',
    clientName: 'ABC Corporation',
    opponentName: 'XYZ Holdings',
    assignedLawyer: {
      id: 'lawyer-1',
      name: 'Jane Smith',
      initials: 'JS'
    },
    status: 'INTAKE',
    priority: 'HIGH' as MatterPriority,
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
    assignedLawyer: {
      id: 'lawyer-2',
      name: 'Robert Johnson',
      initials: 'RJ'
    },
    status: 'INTAKE',
    priority: 'MEDIUM' as MatterPriority,
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
    assignedLawyer: {
      id: 'lawyer-3',
      name: 'Emily Brown',
      initials: 'EB'
    },
    status: 'INTAKE',
    priority: 'URGENT' as MatterPriority,
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
        status: 'IN_PROGRESS',
        priority: 'URGENT' as MatterPriority,
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
        status: 'REVIEW',
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
        priority: 'LOW' as MatterPriority
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
      priority: (['HIGH', 'MEDIUM', 'LOW', 'URGENT'] as const)[i % 4]
    })),
    showJapanese: true
  }
}

// Priority variations
export const HighPriorityMatters: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters.map(matter => ({ ...matter, priority: 'HIGH' as const })),
    showJapanese: true
  }
}

export const UrgentMatters: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters.map(matter => ({ ...matter, priority: 'URGENT' as const })),
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

// Mobile-specific stories
export const MobileView: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters.slice(0, 3),
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile-optimized column view with touch interactions, swipe gestures, and collapsible design.'
      }
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="width: 100vw; height: 100vh; background: #f8fafc;"><story /></div>'
    })
  ]
}

export const MobileCollapsed: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters,
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Column in collapsed state on mobile - tap header to expand. Shows collapse indicator and optimized touch targets.'
      }
    }
  },
  render: (args) => ({
    components: { KanbanColumn },
    setup() {
      const isCollapsed = ref(true)
      
      const handleToggleCollapse = () => {
        isCollapsed.value = !isCollapsed.value
      }
      
      return { args, isCollapsed, handleToggleCollapse }
    },
    template: `
      <div style="width: 100vw; height: 100vh; background: #f8fafc; padding: 1rem;">
        <KanbanColumn 
          v-bind="args"
          :class="{ 'collapsed-mobile': isCollapsed }"
          @header-click="handleToggleCollapse"
        />
      </div>
    `
  })
}

export const MobileSwipeActions: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters.slice(0, 2),
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Demonstrates swipe gesture detection and swipe hints for mobile interaction. Swipe left/right on the column area to trigger actions.'
      }
    }
  },
  render: (args) => ({
    components: { KanbanColumn },
    setup() {
      const swipeAction = ref<string | null>(null)
      
      const handleSwipeAction = (direction: string, column: any) => {
        swipeAction.value = `Swiped ${direction} on ${column.title}`
        setTimeout(() => {
          swipeAction.value = null
        }, 3000)
      }
      
      const handleLongPress = (column: any) => {
        swipeAction.value = `Long pressed on ${column.title}`
        setTimeout(() => {
          swipeAction.value = null
        }, 3000)
      }
      
      return { args, swipeAction, handleSwipeAction, handleLongPress }
    },
    template: `
      <div style="width: 100vw; height: 100vh; background: #f8fafc; padding: 1rem; position: relative;">
        <KanbanColumn 
          v-bind="args"
          @swipe-action="handleSwipeAction"
          @column-collapse="handleLongPress"
        />
        
        <!-- Feedback overlay -->
        <div 
          v-if="swipeAction"
          style="
            position: fixed; 
            top: 20px; 
            left: 50%; 
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          "
        >
          {{ swipeAction }}
        </div>
      </div>
    `
  })
}

export const TabletView: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters,
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Tablet-optimized view with hybrid touch and pointer interactions. Shows transition between mobile and desktop patterns.'
      }
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="width: 100vw; height: 100vh; background: #f8fafc; padding: 2rem;"><story /></div>'
    })
  ]
}

export const iOSSafeArea: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters.slice(0, 4),
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'iOS device simulation with safe area insets. Shows proper padding for notch and home indicator areas.'
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
            "
          >
            📱 iOS Safe Area (Top: 44px)
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
            "
          />
          <div 
            style="
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 34px;
              background: rgba(0,0,0,0.05);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: #666;
            "
          >
            Safe Area (Bottom: 34px)
          </div>
        </div>
      `
    })
  ]
}

export const PerformanceOptimized: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: Array.from({ length: 20 }, (_, i) => ({
      ...mockMatters[i % mockMatters.length],
      id: `perf-matter-${i + 1}`,
      caseNumber: `2025-PERF-${String(i + 1).padStart(4, '0')}`,
      title: `Performance Test Matter ${i + 1}`,
      priority: (['HIGH', 'MEDIUM', 'LOW', 'URGENT'] as const)[i % 4]
    })),
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Performance-optimized column with 20 matters. Demonstrates virtual scrolling, lazy loading, and GPU acceleration for smooth mobile experience.'
      }
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="width: 100vw; height: 100vh; background: #f8fafc;">
          <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 100;">
            📊 20 matters • Virtual scroll • GPU accelerated
          </div>
          <story />
        </div>
      `
    })
  ]
}

export const AccessibilityDemo: Story = {
  args: {
    column: DEFAULT_KANBAN_COLUMNS[0],
    matters: mockMatters.slice(0, 3),
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Accessibility-focused demo showing keyboard navigation, screen reader support, and high contrast compatibility.'
      }
    }
  },
  render: (args) => ({
    components: { KanbanColumn },
    setup() {
      const announcements = ref<string[]>([])
      
      const handleKeyboardNavigation = (direction: string, matter: any) => {
        const announcement = `Navigated ${direction} to ${matter.title}`
        announcements.value.push(announcement)
        if (announcements.value.length > 3) {
          announcements.value.shift()
        }
      }
      
      return { args, announcements, handleKeyboardNavigation }
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
            max-width: 200px;
            z-index: 100;
          "
        >
          <div style="font-weight: 600; margin-bottom: 8px;">🔍 Accessibility Features:</div>
          <ul style="margin: 0; padding-left: 16px; line-height: 1.4;">
            <li>Keyboard navigation (↑↓)</li>
            <li>Screen reader support</li>
            <li>High contrast compatible</li>
            <li>Touch-friendly targets</li>
            <li>ARIA labels & roles</li>
          </ul>
        </div>
        
        <KanbanColumn 
          v-bind="args"
          @keyboard-navigation="handleKeyboardNavigation"
        />
        
        <!-- Screen reader announcements -->
        <div
          v-if="announcements.length > 0"
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
          "
        >
          <div style="font-weight: 600; margin-bottom: 4px;">Screen Reader:</div>
          <div v-for="announcement in announcements" :key="announcement">
            {{ announcement }}
          </div>
        </div>
      </div>
    `
  })
}