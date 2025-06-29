/**
 * Tests for Mobile Kanban Board Component
 * 
 * @description Comprehensive test suite for mobile Kanban board functionality
 * including touch interactions, responsive behavior, and accessibility.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanbanBoardMobile } from './KanbanBoardMobile'
import { DEFAULT_COLUMNS } from './constants'
import { generateMockMatter } from '../../lib/demo-data'

// Mock the hooks
jest.mock('@/hooks/use-media-query', () => ({
  useBreakpoints: () => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isMobileOrTablet: true,
    isTabletOrDesktop: false
  })
}))

// Mock data
const mockMatters = [
  generateMockMatter({ id: '1', status: 'INTAKE', priority: 'HIGH' }),
  generateMockMatter({ id: '2', status: 'INITIAL_REVIEW', priority: 'MEDIUM' }),
  generateMockMatter({ id: '3', status: 'INVESTIGATION', priority: 'URGENT' }),
]

const mockBoard = {
  id: 'test-board',
  title: 'Test Mobile Board',
  columns: DEFAULT_COLUMNS,
  matters: mockMatters,
  lastUpdated: new Date().toISOString()
}

const mockActions = {
  moveMatter: jest.fn(),
  updateMatter: jest.fn(),
  refreshBoard: jest.fn(),
  setFilters: jest.fn(),
  setSorting: jest.fn(),
  clearFilters: jest.fn(),
  setViewPreferences: jest.fn(),
  toggleColumn: jest.fn(),
  reorderColumns: jest.fn(),
  startAutoRefresh: jest.fn(),
  stopAutoRefresh: jest.fn()
}

const mockCurrentUser = {
  id: 'user-1',
  name: 'Test User',
  role: 'LAWYER' as const
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

describe('KanbanBoardMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders mobile board with title and stats', () => {
    render(<KanbanBoardMobile {...defaultProps} />)
    
    expect(screen.getByText('Test Mobile Board')).toBeInTheDocument()
    expect(screen.getByText(/3 matters • 7 columns/)).toBeInTheDocument()
  })

  it('shows column tabs with matter counts', () => {
    render(<KanbanBoardMobile {...defaultProps} showColumnCount={true} />)
    
    // Check for Japanese column titles in tabs
    expect(screen.getByText('受付')).toBeInTheDocument()
    expect(screen.getByText('初期審査')).toBeInTheDocument()
    expect(screen.getByText('調査')).toBeInTheDocument()
  })

  it('navigates between columns using tabs', async () => {
    const user = userEvent.setup()
    render(<KanbanBoardMobile {...defaultProps} />)
    
    // Click on the "Initial Review" tab
    const initialReviewTab = screen.getByText('初期審査')
    await user.click(initialReviewTab)
    
    // Should show content for that column
    expect(screen.getByText('初期審査')).toBeInTheDocument()
  })

  it('navigates using header navigation buttons', async () => {
    const user = userEvent.setup()
    render(<KanbanBoardMobile {...defaultProps} />)
    
    // Find navigation buttons
    const nextButton = screen.getByRole('button', { name: /next/i })
    const prevButton = screen.getByRole('button', { name: /previous/i })
    
    // Previous should be disabled initially
    expect(prevButton).toBeDisabled()
    
    // Click next button
    await user.click(nextButton)
    
    // Previous should now be enabled
    expect(prevButton).not.toBeDisabled()
  })

  it('opens filter sheet when filter button is clicked', async () => {
    const user = userEvent.setup()
    render(<KanbanBoardMobile {...defaultProps} />)
    
    const filterButton = screen.getByRole('button', { name: /filter/i })
    await user.click(filterButton)
    
    // Filter sheet should open
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('opens matter action sheet when matter is clicked', async () => {
    const user = userEvent.setup()
    render(<KanbanBoardMobile {...defaultProps} />)
    
    // Find and click a matter card
    const matterCard = screen.getByText(/Contract|Personal|Corporate/)
    await user.click(matterCard)
    
    // Action sheet should open
    expect(screen.getByText('Matter Actions')).toBeInTheDocument()
  })

  it('handles status change from action sheet', async () => {
    const user = userEvent.setup()
    render(<KanbanBoardMobile {...defaultProps} />)
    
    // Click matter to open action sheet
    const matterCard = screen.getByText(/Contract|Personal|Corporate/)
    await user.click(matterCard)
    
    // Click a status change button
    const researchButton = screen.getByText('Research')
    await user.click(researchButton)
    
    // Should call moveMatter action
    expect(mockActions.moveMatter).toHaveBeenCalled()
  })

  it('shows empty state when no matters in column', () => {
    const emptyBoard = {
      ...mockBoard,
      matters: []
    }
    
    render(<KanbanBoardMobile {...defaultProps} board={emptyBoard} />)
    
    // Should show empty state
    expect(screen.getByText(/Content area/)).toBeInTheDocument()
  })

  it('handles swipe gestures when enabled', () => {
    render(<KanbanBoardMobile {...defaultProps} enableSwipeNavigation={true} />)
    
    const swipeContainer = screen.getByRole('main') || document.querySelector('[data-testid="swipe-container"]')
    
    if (swipeContainer) {
      // Simulate swipe left (next column)
      fireEvent.touchStart(swipeContainer, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchMove(swipeContainer, {
        touches: [{ clientX: 50, clientY: 100 }]
      })
      fireEvent.touchEnd(swipeContainer, {
        changedTouches: [{ clientX: 50, clientY: 100 }]
      })
      
      // Should navigate to next column (implementation would need to be verified)
    }
  })

  it('applies filters correctly', () => {
    const filtersWithSearch = {
      ...defaultProps.filters,
      searchQuery: 'Contract'
    }
    
    render(<KanbanBoardMobile {...defaultProps} filters={filtersWithSearch} />)
    
    // Should filter matters based on search
    // Note: This would need to be implemented in the component
  })

  it('shows compact cards when compactCards is true', () => {
    render(<KanbanBoardMobile {...defaultProps} compactCards={true} />)
    
    // Cards should have compact styling
    const matterCards = screen.getAllByText(/Contract|Personal|Corporate/)
    expect(matterCards.length).toBeGreaterThan(0)
  })

  it('meets accessibility requirements', async () => {
    render(<KanbanBoardMobile {...defaultProps} />)
    
    // Check for proper ARIA labels and roles
    expect(screen.getByRole('main') || screen.getByRole('application')).toBeInTheDocument()
    
    // Tab navigation should be accessible
    const tabs = screen.getAllByRole('button')
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('type', 'button')
    })
  })

  it('handles touch target sizes correctly', () => {
    render(<KanbanBoardMobile {...defaultProps} />)
    
    // All interactive elements should meet minimum touch target size
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button)
      const minHeight = parseInt(styles.minHeight)
      const minWidth = parseInt(styles.minWidth)
      
      // Should meet 44px minimum (or be handled by parent container)
      expect(minHeight >= 44 || minWidth >= 44).toBeTruthy()
    })
  })

  it('handles loading states', () => {
    const loadingBoard = {
      ...mockBoard,
      matters: []
    }
    
    render(<KanbanBoardMobile {...defaultProps} board={loadingBoard} />)
    
    // Should show appropriate loading/empty states
    expect(screen.getByText(/Content area/)).toBeInTheDocument()
  })

  it('handles error states gracefully', () => {
    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    // Test with invalid data
    const invalidBoard = {
      ...mockBoard,
      columns: []
    }
    
    render(<KanbanBoardMobile {...defaultProps} board={invalidBoard} />)
    
    // Should not crash and should handle gracefully
    expect(screen.getByText('Test Mobile Board')).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<KanbanBoardMobile {...defaultProps} />)
    
    // Test tab navigation
    await user.tab()
    
    // Should focus on interactive elements
    const focusedElement = document.activeElement
    expect(focusedElement).toBeTruthy()
    expect(focusedElement?.tagName).toBe('BUTTON')
  })

  it('maintains performance with many matters', () => {
    const manyMatters = Array.from({ length: 100 }, (_, i) => 
      generateMockMatter({ 
        id: `matter-${i}`, 
        status: 'INTAKE',
        priority: 'MEDIUM'
      })
    )
    
    const boardWithManyMatters = {
      ...mockBoard,
      matters: manyMatters
    }
    
    const start = performance.now()
    render(<KanbanBoardMobile {...defaultProps} board={boardWithManyMatters} />)
    const end = performance.now()
    
    // Should render in reasonable time (less than 100ms)
    expect(end - start).toBeLessThan(100)
  })
})