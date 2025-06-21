/**
 * Storybook stories for FilterBar component (T04_S02)
 * 
 * Demonstrates all filter functionality and states including:
 * - Default empty state
 * - Active filters with various combinations
 * - Mobile responsive behavior
 * - Interactive filtering scenarios
 */

import type { Meta, StoryObj } from '@storybook/nextjs'
import { within, userEvent, expect } from '@storybook/test'
import React from 'react'
import { FilterBar } from './FilterBar'
import { useKanbanStore } from '@/stores/kanban-store'
import { demoMatters } from '@/lib/demo-data'

const meta: Meta<typeof FilterBar> = {
  title: 'Features/Kanban/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
FilterBar component implementing T04_S02 specification with:
- Debounced search by case number and title (300ms)
- Multi-lawyer selection with checkboxes
- Priority multi-select functionality
- Closed matters toggle switch  
- Mobile-responsive collapsible layout
- Active filter count badges
- Clear filters functionality
        `
      }
    }
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Initialize store with demo data for stories
      const initializeBoard = useKanbanStore(state => state.initializeBoard)
      React.useEffect(() => {
        initializeBoard(DEMO_MATTERS)
      }, [initializeBoard])
      
      return (
        <div className="min-h-screen bg-gray-50">
          <Story />
        </div>
      )
    }
  ]
}

export default meta
type Story = StoryObj<typeof meta>

// Default state with no active filters
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default FilterBar with no active filters. Shows all filter options available.'
      }
    }
  }
}

// Active search filter
export const WithActiveSearch: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'FilterBar with an active search query. Shows debounced search in action.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const searchInput = canvas.getByPlaceholderText(/search by case number/i)
    
    // Type in search input to trigger debounced search
    await userEvent.type(searchInput, 'Contract')
    
    // Verify search value is updated
    expect(searchInput).toHaveValue('Contract')
  }
}

// Multiple active filters
export const WithMultipleFilters: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'FilterBar with multiple active filters including search, lawyers, priorities, and closed matters toggle.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Add search filter
    const searchInput = canvas.getByPlaceholderText(/search by case number/i)
    await userEvent.type(searchInput, 'Legal')
    
    // Select a priority filter
    const highPriorityCheckbox = canvas.getByRole('checkbox', { name: /high/i })
    await userEvent.click(highPriorityCheckbox)
    
    // Toggle closed matters
    const closedToggle = canvas.getByRole('switch')
    await userEvent.click(closedToggle)
    
    // Should show active filter count
    expect(canvas.getByText(/3 filters active/i)).toBeInTheDocument()
  }
}

// Clear filters interaction
export const ClearFiltersInteraction: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the clear filters functionality removing all active filters at once.'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Add multiple filters first
    const searchInput = canvas.getByPlaceholderText(/search by case number/i)
    await userEvent.type(searchInput, 'Test')
    
    const urgentPriorityCheckbox = canvas.getByRole('checkbox', { name: /urgent/i })
    await userEvent.click(urgentPriorityCheckbox)
    
    // Wait for clear filters button to appear
    const clearButton = await canvas.findByText(/clear all/i)
    expect(clearButton).toBeInTheDocument()
    
    // Click clear filters
    await userEvent.click(clearButton)
    
    // Verify filters are cleared
    expect(searchInput).toHaveValue('')
    expect(urgentPriorityCheckbox).not.toBeChecked()
  }
}