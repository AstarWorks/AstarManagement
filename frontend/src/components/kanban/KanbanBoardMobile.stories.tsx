/**
 * Storybook stories for Mobile Kanban Board
 * 
 * @description Interactive stories showcasing mobile Kanban board functionality
 * including touch gestures, responsive layouts, and mobile-optimized interactions.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent, expect } from '@storybook/test'
import { KanbanBoardMobile } from './KanbanBoardMobile'
import { DEFAULT_COLUMNS } from './constants'
import { generateMockMatter } from '../../lib/demo-data'

const meta: Meta<typeof KanbanBoardMobile> = {
  title: 'Kanban/Mobile/KanbanBoardMobile',
  component: KanbanBoardMobile,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile2',
    },
    docs: {
      description: {
        component: `
Mobile-optimized Kanban board with touch gestures, swipe navigation, and bottom sheet interactions.

## Features
- **Touch-first design** with 44px minimum touch targets
- **Swipe navigation** between columns
- **Bottom sheet** for matter actions
- **Tab navigation** for status columns
- **Pull-to-refresh** functionality
- **Responsive layout** optimizations

## Mobile Breakpoints
- Mobile: < 768px (single column with tabs)
- Tablet: 768px - 1024px (3-4 columns)
- Desktop: > 1024px (full layout)
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    enableSwipeNavigation: {
      control: 'boolean',
      description: 'Enable swipe gestures for column navigation'
    },
    showColumnCount: {
      control: 'boolean',
      description: 'Show matter count in column tabs'
    },
    compactCards: {
      control: 'boolean',
      description: 'Use compact card layout for mobile'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Mock data
const mockMatters = [
  generateMockMatter({ id: '1', status: 'INTAKE', priority: 'HIGH' }),
  generateMockMatter({ id: '2', status: 'INITIAL_REVIEW', priority: 'MEDIUM' }),
  generateMockMatter({ id: '3', status: 'INVESTIGATION', priority: 'URGENT' }),
  generateMockMatter({ id: '4', status: 'RESEARCH', priority: 'LOW' }),
  generateMockMatter({ id: '5', status: 'DRAFT_PLEADINGS', priority: 'HIGH' }),
  generateMockMatter({ id: '6', status: 'INTAKE', priority: 'MEDIUM' }),
  generateMockMatter({ id: '7', status: 'DISCOVERY', priority: 'HIGH' }),
  generateMockMatter({ id: '8', status: 'TRIAL_PREP', priority: 'URGENT' }),
]

const mockBoard = {
  id: 'mobile-board',
  title: 'Matter Management (Mobile)',
  columns: DEFAULT_COLUMNS,
  matters: mockMatters,
  lastUpdated: new Date().toISOString()
}

const mockActions = {
  moveMatter: async (matterId: string, newStatus: string, columnId: string) => {
    console.log(`Moving matter ${matterId} to ${newStatus} in column ${columnId}`)
  },
  updateMatter: async (matterId: string, updates: any) => {
    console.log(`Updating matter ${matterId}:`, updates)
  },
  refreshBoard: async () => {
    console.log('Refreshing board...')
  },
  setFilters: (filters: any) => {
    console.log('Setting filters:', filters)
  },
  setSorting: (sort: any) => {
    console.log('Setting sorting:', sort)
  },
  clearFilters: () => {
    console.log('Clearing filters')
  },
  setViewPreferences: (preferences: any) => {
    console.log('Setting view preferences:', preferences)
  },
  toggleColumn: (columnId: string) => {
    console.log(`Toggling column ${columnId}`)
  },
  reorderColumns: (order: string[]) => {
    console.log('Reordering columns:', order)
  },
  startAutoRefresh: () => {
    console.log('Starting auto-refresh')
  },
  stopAutoRefresh: () => {
    console.log('Stopping auto-refresh')
  }
}

const mockCurrentUser = {
  id: 'user-1',
  name: 'Mobile User',
  role: 'LAWYER' as const,
  avatar: undefined
}

const defaultProps = {
  board: mockBoard,
  actions: mockActions,
  filters: {
    searchQuery: '',
    selectedLawyers: [],
    selectedPriorities: [],
    showClosed: false
  },
  sorting: {
    field: 'priority' as const,
    direction: 'desc' as const
  },
  viewPreferences: {
    columnsVisible: DEFAULT_COLUMNS.map(col => col.id),
    columnOrder: DEFAULT_COLUMNS.map(col => col.id),
    cardSize: 'compact' as const,
    showAvatars: true,
    showPriority: true,
    showDueDates: true,
    autoRefresh: false,
    refreshInterval: 30
  },
  currentUser: mockCurrentUser
}

/**
 * Default mobile Kanban board
 */
export const Default: Story = {
  args: {
    ...defaultProps,
    enableSwipeNavigation: true,
    showColumnCount: true,
    compactCards: true
  }
}

/**
 * Without swipe navigation
 */
export const NoSwipeNavigation: Story = {
  args: {
    ...defaultProps,
    enableSwipeNavigation: false,
    showColumnCount: true,
    compactCards: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile board with swipe navigation disabled. Users must tap column tabs to navigate.'
      }
    }
  }
}

/**
 * Large cards layout
 */
export const LargeCards: Story = {
  args: {
    ...defaultProps,
    enableSwipeNavigation: true,
    showColumnCount: true,
    compactCards: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile board with larger, detailed card layout for better readability.'
      }
    }
  }
}

/**
 * With search filter applied
 */
export const WithFilters: Story = {
  args: {
    ...defaultProps,
    filters: {
      searchQuery: 'Contract',
      selectedLawyers: [],
      selectedPriorities: ['HIGH', 'URGENT'],
      showClosed: false
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile board with search and priority filters applied.'
      }
    }
  }
}

/**
 * Empty state
 */
export const EmptyBoard: Story = {
  args: {
    ...defaultProps,
    board: {
      ...mockBoard,
      matters: []
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile board showing empty states for all columns.'
      }
    }
  }
}

/**
 * Single column with many matters
 */
export const ManyMatters: Story = {
  args: {
    ...defaultProps,
    board: {
      ...mockBoard,
      matters: Array.from({ length: 20 }, (_, i) => 
        generateMockMatter({ 
          id: `matter-${i}`, 
          status: 'INTAKE',
          priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4] as any
        })
      )
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile board with many matters in a single column to test scrolling performance.'
      }
    }
  }
}

/**
 * Interactive test story
 */
export const InteractiveTesting: Story = {
  args: {
    ...defaultProps
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive story for testing mobile interactions and gestures.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Test tab navigation
    const tabs = canvas.getAllByRole('button')
    const firstTab = tabs.find(tab => tab.textContent?.includes('受付'))
    
    if (firstTab) {
      await userEvent.click(firstTab)
      await expect(firstTab).toHaveAttribute('aria-selected', 'true')
    }
    
    // Test matter card interaction
    const matterCards = canvas.getAllByText(/Contract|Personal|Corporate/)
    if (matterCards.length > 0) {
      await userEvent.click(matterCards[0])
      // Bottom sheet should appear (would need to test in actual mobile environment)
    }
    
    // Test filter button
    const filterButton = canvas.getByRole('button', { name: /filter/i })
    if (filterButton) {
      await userEvent.click(filterButton)
      // Filter sheet should appear
    }
  }
}

/**
 * Loading states
 */
export const LoadingStates: Story = {
  args: {
    ...defaultProps,
    board: {
      ...mockBoard,
      matters: [] // Empty to show loading skeletons
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows various loading states and skeletons for mobile board.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="text-sm font-medium mb-2">Mobile Board Loading States:</div>
        <Story />
      </div>
    )
  ]
}

/**
 * Dark mode
 */
export const DarkMode: Story = {
  args: {
    ...defaultProps
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'Mobile board in dark mode with proper contrast and visibility.'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    )
  ]
}

/**
 * Japanese language
 */
export const JapaneseLanguage: Story = {
  args: {
    ...defaultProps,
    board: {
      ...mockBoard,
      title: '案件管理ボード（モバイル）',
      matters: mockMatters.map(matter => ({
        ...matter,
        title: matter.title.replace('Contract', '契約').replace('Personal', '個人').replace('Corporate', '企業'),
        clientName: matter.clientName.replace('Corporation', '株式会社').replace('LLC', '合同会社')
      }))
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile board with Japanese language content and proper text rendering.'
      }
    }
  }
}