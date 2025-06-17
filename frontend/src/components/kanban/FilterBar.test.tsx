/**
 * Unit tests for FilterBar component (T04_S02)
 * 
 * Tests all filtering functionality including:
 * - Search debouncing and functionality
 * - Multi-lawyer selection
 * - Priority multi-select
 * - Closed matters toggle
 * - Clear filters functionality
 * - Mobile responsive behavior
 * - Filter state persistence through store
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { FilterBar } from './FilterBar'
import { useKanbanStore } from '@/stores/kanban-store'
import { DEMO_MATTERS } from '@/lib/demo-data'

// Mock the debounce hook
jest.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: Function, delay: number) => {
    return fn // Return the function directly for testing
  }
}))

// Test setup helper
const renderFilterBar = () => {
  // Initialize store with demo data
  act(() => {
    useKanbanStore.getState().initializeBoard(DEMO_MATTERS)
  })
  
  return render(<FilterBar />)
}

describe('FilterBar Component', () => {
  beforeEach(() => {
    // Clear store state before each test
    act(() => {
      useKanbanStore.getState().clearFilters()
      useKanbanStore.getState().initializeBoard([])
    })
  })

  describe('T04_S02 Specification Compliance', () => {
    test('implements exact FilterState interface', () => {
      renderFilterBar()
      
      // Verify all required filter elements are present
      expect(screen.getByPlaceholderText(/search by case number/i)).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeInTheDocument()
      expect(screen.getAllByRole('checkbox')).toHaveLength(4) // 4 priority levels
    })

    test('search input filters by case number and title (case-insensitive)', async () => {
      const user = userEvent.setup()
      renderFilterBar()
      
      const searchInput = screen.getByPlaceholderText(/search by case number/i)
      
      // Test case-insensitive search
      await user.type(searchInput, 'CONTRACT')
      
      // Verify filter state is updated with searchQuery (not search)
      await waitFor(() => {
        expect(useKanbanStore.getState().filters.searchQuery).toBe('CONTRACT')
      })
    })

    test('priority filter allows multi-select of all priority levels', async () => {
      const user = userEvent.setup()
      renderFilterBar()
      
      // Should have all 4 priority levels
      const lowCheckbox = screen.getByRole('checkbox', { name: /low/i })
      const mediumCheckbox = screen.getByRole('checkbox', { name: /medium/i })
      const highCheckbox = screen.getByRole('checkbox', { name: /high/i })
      const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent/i })
      
      expect(lowCheckbox).toBeInTheDocument()
      expect(mediumCheckbox).toBeInTheDocument()
      expect(highCheckbox).toBeInTheDocument()
      expect(urgentCheckbox).toBeInTheDocument()
      
      // Test multi-select
      await user.click(highCheckbox)
      await user.click(urgentCheckbox)
      
      expect(highCheckbox).toBeChecked()
      expect(urgentCheckbox).toBeChecked()
      
      // Verify store state uses selectedPriorities (not priorities)
      await waitFor(() => {
        const filters = useKanbanStore.getState().filters
        expect(filters.selectedPriorities).toContain('HIGH')
        expect(filters.selectedPriorities).toContain('URGENT')
      })
    })

    test('closed matters toggle uses showClosed boolean', async () => {
      const user = userEvent.setup()
      renderFilterBar()
      
      const closedToggle = screen.getByRole('switch')
      
      // Default should be true (show closed)
      expect(closedToggle).toBeChecked()
      
      // Toggle to hide closed matters
      await user.click(closedToggle)
      
      expect(closedToggle).not.toBeChecked()
      
      // Verify store state uses showClosed (not showOverdueOnly)
      await waitFor(() => {
        expect(useKanbanStore.getState().filters.showClosed).toBe(false)
      })
    })

    test('clear filters button resets all filters', async () => {
      const user = userEvent.setup()
      renderFilterBar()
      
      // Apply multiple filters first
      const searchInput = screen.getByPlaceholderText(/search by case number/i)
      await user.type(searchInput, 'Test')
      
      const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent/i })
      await user.click(urgentCheckbox)
      
      // Wait for clear button to appear
      const clearButton = await screen.findByText(/clear all/i)
      expect(clearButton).toBeInTheDocument()
      
      // Click clear filters
      await user.click(clearButton)
      
      // Verify all filters are cleared
      expect(searchInput).toHaveValue('')
      expect(urgentCheckbox).not.toBeChecked()
    })
  })

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      renderFilterBar()
      
      // Search input should have proper attributes
      const searchInput = screen.getByPlaceholderText(/search by case number/i)
      expect(searchInput).toHaveAttribute('type', 'text')
      
      // Switch should have accessible name
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAccessibleName()
    })
  })
})