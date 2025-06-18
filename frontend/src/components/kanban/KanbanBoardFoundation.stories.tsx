import type { Meta, StoryObj } from '@storybook/react'
import { KanbanBoardFoundation } from './KanbanBoardFoundation'
import { DEFAULT_COLUMNS } from './constants'
import type { KanbanColumn } from './types'

const meta: Meta<typeof KanbanBoardFoundation> = {
  title: 'Kanban/Foundation/KanbanBoardFoundation',
  component: KanbanBoardFoundation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Foundational Kanban board layout component (T01_S02 scope). Provides responsive layout structure without advanced features like drag-and-drop, filtering, or real-time updates.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Board title displayed in header'
    },
    columns: {
      control: 'object',
      description: 'Array of columns to display'
    },
    showJapanese: {
      control: 'boolean',
      description: 'Whether to show Japanese column titles'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Default foundational board
export const Default: Story = {
  args: {
    title: 'Matter Management Board',
    showJapanese: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Default foundational board layout with all 7 columns and Japanese titles enabled.'
      }
    }
  }
}

// English language version
export const EnglishTitles: Story = {
  args: {
    title: 'Matter Management Board',
    showJapanese: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Foundational board with English column titles only.'
      }
    }
  }
}

// Custom title
export const CustomTitle: Story = {
  args: {
    title: 'Case Progress Tracking Dashboard',
    showJapanese: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Board with custom title to demonstrate title customization.'
      }
    }
  }
}

// Minimal columns (for testing with fewer columns)
const minimalColumns: KanbanColumn[] = [
  {
    id: 'initial-consultation',
    title: 'Initial Consultation',
    titleJa: '初回相談',
    status: ['INTAKE', 'INITIAL_REVIEW'],
    color: 'bg-blue-50 border-blue-200',
    order: 1
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    titleJa: '進行中',
    status: ['DISCOVERY', 'TRIAL_PREP'],
    color: 'bg-orange-50 border-orange-200',
    order: 2
  },
  {
    id: 'closed',
    title: 'Closed',
    titleJa: '完了',
    status: ['CLOSED'],
    color: 'bg-gray-50 border-gray-200',
    order: 3
  }
]

export const MinimalColumns: Story = {
  args: {
    title: 'Simplified Board',
    columns: minimalColumns,
    showJapanese: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Board with only 3 columns to test minimal layout scenarios.'
      }
    }
  }
}

// Mobile viewport simulation
export const MobileView: Story = {
  args: {
    title: 'Mobile Board View',
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Board displayed in mobile viewport to demonstrate single-column layout with tab navigation.'
      }
    }
  }
}

// Tablet viewport simulation
export const TabletView: Story = {
  args: {
    title: 'Tablet Board View',
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Board displayed in tablet viewport to demonstrate medium-width responsive behavior.'
      }
    }
  }
}

// Desktop wide view
export const DesktopWideView: Story = {
  args: {
    title: 'Desktop Wide View',
    showJapanese: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    },
    docs: {
      description: {
        story: 'Board displayed in desktop viewport showing all columns with horizontal scroll.'
      }
    }
  }
}

// Test with custom styling
export const CustomStyling: Story = {
  args: {
    title: 'Custom Styled Board',
    showJapanese: true,
    className: 'bg-gradient-to-br from-blue-50 to-indigo-100'
  },
  parameters: {
    docs: {
      description: {
        story: 'Board with custom background styling to demonstrate className prop.'
      }
    }
  }
}

// Responsive breakpoint testing story
export const ResponsiveBreakpoints: Story = {
  args: {
    title: 'Responsive Layout Test',
    showJapanese: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the viewport controls in the toolbar to test different screen sizes and responsive behavior.'
      }
    }
  }
}

// Language switching demonstration
export const LanguageSwitching: Story = {
  args: {
    title: 'Language Switching Demo',
    showJapanese: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates Japanese/English language switching. Toggle the "showJapanese" control to see both languages.'
      }
    }
  }
}