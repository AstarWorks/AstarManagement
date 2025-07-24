import type { Meta, StoryObj } from '@storybook/vue3'
import MobileKanbanNav from './MobileKanbanNav.vue'
import { ref } from 'vue'

const meta: Meta<typeof MobileKanbanNav> = {
  title: 'Kanban/Mobile/MobileKanbanNav',
  component: MobileKanbanNav,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Mobile navigation component for Kanban board with swipeable tabs, action bar, and scroll indicators. Optimized for touch interactions.'
      }
    }
  },
  argTypes: {
    columns: {
      control: 'object',
      description: 'Array of Kanban columns for navigation tabs'
    },
    activeColumnId: {
      control: 'text',
      description: 'Currently active column ID'
    },
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

// Mock columns data
const mockColumns = [
  { id: 'intake', title: 'Initial Consultation', titleJa: '初回相談', status: 'INTAKE' as const, color: 'blue', order: 0, visible: true, acceptsDrop: true, currentItemCount: 5 },
  { id: 'prep', title: 'Document Preparation', titleJa: '書類準備', status: 'INITIAL_REVIEW' as const, color: 'yellow', order: 1, visible: true, acceptsDrop: true, currentItemCount: 3 },
  { id: 'filed', title: 'Filed', titleJa: '提出済み', status: 'IN_PROGRESS' as const, color: 'green', order: 2, visible: true, acceptsDrop: true, currentItemCount: 8 },
  { id: 'progress', title: 'In Progress', titleJa: '進行中', status: 'REVIEW' as const, color: 'purple', order: 3, visible: true, acceptsDrop: true, currentItemCount: 12 },
  { id: 'court', title: 'In Court', titleJa: '法廷審理', status: 'WAITING_CLIENT' as const, color: 'red', order: 4, visible: true, acceptsDrop: true, currentItemCount: 2 },
  { id: 'settlement', title: 'Settlement Discussion', titleJa: '和解協議', status: 'READY_FILING' as const, color: 'orange', order: 5, visible: true, acceptsDrop: true, currentItemCount: 4 },
  { id: 'closed', title: 'Closed', titleJa: '終了', status: 'CLOSED' as const, color: 'gray', order: 6, visible: true, acceptsDrop: true, currentItemCount: 15 }
]

export const Default: Story = {
  args: {
    columns: mockColumns,
    activeColumnId: 'progress',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

export const Interactive: Story = {
  render: (args) => ({
    components: { MobileKanbanNav },
    setup() {
      const activeColumn = ref('intake')
      const searchQuery = ref('')
      const showFilters = ref(false)
      
      const handleColumnChange = (columnId: string) => {
        activeColumn.value = columnId
      }
      
      const handleSearch = (query: string) => {
        searchQuery.value = query
      }
      
      const handleAddMatter = () => {
        console.log('Add new matter')
      }
      
      const handleToggleFilters = () => {
        showFilters.value = !showFilters.value
      }
      
      return {
        args: {
          ...args,
          activeColumnId: activeColumn.value
        },
        activeColumn,
        searchQuery,
        showFilters,
        handleColumnChange,
        handleSearch,
        handleAddMatter,
        handleToggleFilters
      }
    },
    template: `
      <div style="width: 100vw; height: 100vh; background: #f8fafc;">
        <MobileKanbanNav 
          v-bind="args"
          :activeColumnId="activeColumn"
          @column-change="handleColumnChange"
          @search="handleSearch"
          @add-matter="handleAddMatter"
          @toggle-filters="handleToggleFilters"
        />
        
        <!-- Demo content area -->
        <div style="padding: 20px; text-align: center;">
          <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 8px 0; font-size: 18px;">Current State:</h3>
            <p style="margin: 0; color: #666;">Active Column: <strong>{{ activeColumn }}</strong></p>
            <p style="margin: 4px 0 0 0; color: #666;" v-if="searchQuery">Search: <strong>{{ searchQuery }}</strong></p>
            <p style="margin: 4px 0 0 0; color: #666;" v-if="showFilters">Filters: <strong>Open</strong></p>
          </div>
          
          <div style="background: rgba(0,0,0,0.8); color: white; border-radius: 8px; padding: 12px; font-size: 14px;">
            📱 Try swiping left/right on the tabs<br>
            🔍 Tap the search icon to search<br>
            🎛️ Tap the filter icon to toggle filters<br>
            ➕ Tap the plus icon to add a new matter
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
        story: 'Interactive navigation demo showing column switching, search, and filter interactions.'
      }
    }
  }
}

export const JapaneseLabels: Story = {
  args: {
    columns: mockColumns,
    activeColumnId: 'court',
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Navigation with Japanese column labels for bilingual legal practice management.'
      }
    }
  }
}

export const MinimalView: Story = {
  args: {
    columns: mockColumns.slice(0, 4), // Fewer columns
    activeColumnId: 'prep',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Minimal navigation view with just column tabs, no action bar or scroll indicators.'
      }
    }
  }
}

export const ManyColumns: Story = {
  args: {
    columns: [
      ...mockColumns,
      { id: 'review', title: 'Document Review', titleJa: '書類審査', status: 'REVIEW' as const, color: 'indigo', order: 7, visible: true, acceptsDrop: true, currentItemCount: 6 },
      { id: 'negotiation', title: 'Negotiation', titleJa: '交渉', status: 'IN_PROGRESS' as const, color: 'pink', order: 8, visible: true, acceptsDrop: true, currentItemCount: 3 },
      { id: 'appeal', title: 'Appeal Process', titleJa: '控訴手続き', status: 'WAITING_CLIENT' as const, color: 'teal', order: 9, visible: true, acceptsDrop: true, currentItemCount: 1 },
      { id: 'enforcement', title: 'Enforcement', titleJa: '執行', status: 'READY_FILING' as const, color: 'amber', order: 10, visible: true, acceptsDrop: true, currentItemCount: 2 }
    ],
    activeColumnId: 'negotiation',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Navigation with many columns demonstrating horizontal scrolling and scroll indicators.'
      }
    }
  }
}

export const LandscapeOrientation: Story = {
  args: {
    columns: mockColumns,
    activeColumnId: 'settlement',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    },
    docs: {
      description: {
        story: 'Navigation optimized for landscape orientation with wider tab layout.'
      }
    }
  }
}

export const TabletView: Story = {
  args: {
    columns: mockColumns,
    activeColumnId: 'filed',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Navigation adapted for tablet view with larger touch targets and optimized spacing.'
      }
    }
  }
}

export const AccessibilityDemo: Story = {
  render: (args: any) => ({
    components: { MobileKanbanNav },
    setup() {
      const activeColumn = ref('intake')
      const announcements = ref<string[]>([])
      
      const handleColumnChange = (columnId: string) => {
        activeColumn.value = columnId
        const column = args.columns?.find((c: any) => c.id === columnId)
        if (column) {
          announcements.value.unshift(`Switched to ${column.title} column with ${column.currentItemCount} matters`)
          if (announcements.value.length > 3) {
            announcements.value.pop()
          }
        }
      }
      
      const handleFocus = (columnTitle: string) => {
        announcements.value.unshift(`Focused on ${columnTitle}`)
        if (announcements.value.length > 3) {
          announcements.value.pop()
        }
      }
      
      return {
        args: {
          ...args,
          activeColumnId: activeColumn.value
        },
        activeColumn,
        announcements,
        handleColumnChange,
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
            max-width: 200px;
            z-index: 100;
          "
        >
          <div style="font-weight: 600; margin-bottom: 8px;">♿ Accessibility:</div>
          <ul style="margin: 0; padding-left: 16px; line-height: 1.4;">
            <li>Keyboard navigation</li>
            <li>Screen reader support</li>
            <li>ARIA labels</li>
            <li>Focus management</li>
            <li>Touch targets ≥44px</li>
          </ul>
        </div>
        
        <MobileKanbanNav 
          v-bind="args"
          :activeColumnId="activeColumn"
          @column-change="handleColumnChange"
          @focus="handleFocus"
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
          <div style="font-weight: 600; margin-bottom: 4px;">📢 Screen Reader:</div>
          <div v-for="announcement in announcements" :key="announcement">
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
        story: 'Accessibility-focused demo showing keyboard navigation, focus management, and screen reader announcements.'
      }
    }
  }
}

export const PerformanceTest: Story = {
  args: {
    columns: Array.from({ length: 15 }, (_, i) => ({
      id: `column-${i}`,
      title: `Column ${i + 1}`,
      titleJa: `列${i + 1}`,
      status: (['INTAKE', 'INITIAL_REVIEW', 'IN_PROGRESS', 'REVIEW', 'WAITING_CLIENT', 'READY_FILING', 'CLOSED'] as const)[i % 7],
      color: ['blue', 'green', 'yellow', 'red', 'purple', 'orange', 'gray'][i % 7],
      order: i,
      visible: true,
      acceptsDrop: true,
      currentItemCount: Math.floor(Math.random() * 20) + 1
    })),
    activeColumnId: 'column-7',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Performance test with 15 columns to verify smooth scrolling and rendering optimization.'
      }
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="width: 100vw; height: 100vh; background: #f8fafc;">
          <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 100;">
            ⚡ 15 columns • Optimized scrolling
          </div>
          <story />
        </div>
      `
    })
  ]
}