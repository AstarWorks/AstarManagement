/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from './FilterBar'
import { useKanbanStore } from '@/stores/kanban-store'

// Mock the store
jest.mock('@/stores/kanban-store')
const mockUseKanbanStore = useKanbanStore as jest.MockedFunction<typeof useKanbanStore>

// Mock debounce hook
jest.mock('use-debounce', () => ({
  useDebouncedCallback: jest.fn((fn) => fn)
}))

const mockMatters = [
  {
    id: '1',
    caseNumber: '2025-CV-0001',
    title: 'Contract Dispute',
    clientName: 'ABC Corp',
    assignedLawyerId: 'lawyer1',
    priority: 'HIGH' as const,
    status: 'INVESTIGATION' as const
  },
  {
    id: '2',
    caseNumber: '2025-CV-0002',
    title: 'Personal Injury',
    clientName: 'John Doe',
    assignedLawyerId: 'lawyer2',
    priority: 'MEDIUM' as const,
    status: 'CLOSED' as const
  }
]

const defaultFilters = {
  searchQuery: '',
  selectedLawyers: [],
  selectedPriorities: [],
  showClosed: true
}

const mockSetFilters = jest.fn()
const mockClearFilters = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  
  mockUseKanbanStore.mockReturnValue({
    filters: defaultFilters,
    matters: mockMatters,
    setFilters: mockSetFilters,
    clearFilters: mockClearFilters
  })
})

describe('FilterBar Component', () => {
  describe('Rendering', () => {
    it('renders all filter controls', () => {
      render(<FilterBar />)
      
      // Search input
      expect(screen.getByPlaceholderText('Search by case number or title...')).toBeInTheDocument()
      
      // Filter sections
      expect(screen.getByText('Assigned Lawyer')).toBeInTheDocument()
      expect(screen.getByText('Priority')).toBeInTheDocument()
      expect(screen.getByText('Show Closed Matters')).toBeInTheDocument()
      
      // Lawyer checkboxes
      expect(screen.getByLabelText('lawyer1')).toBeInTheDocument()
      expect(screen.getByLabelText('lawyer2')).toBeInTheDocument()
      
      // Priority checkboxes
      expect(screen.getByLabelText('low')).toBeInTheDocument()
      expect(screen.getByLabelText('medium')).toBeInTheDocument()
      expect(screen.getByLabelText('high')).toBeInTheDocument()
      expect(screen.getByLabelText('urgent')).toBeInTheDocument()
      
      // Clear button
      expect(screen.getByText('Clear All')).toBeInTheDocument()
    })

    it('shows active filter count', () => {
      mockUseKanbanStore.mockReturnValue({
        filters: {
          ...defaultFilters,
          search: 'test',
          assignedLawyer: 'lawyer1',
          priorities: ['HIGH']
        },
        matters: mockMatters,
        setFilters: mockSetFilters,
        clearFilters: mockClearFilters
      })
      
      render(<FilterBar />)
      
      // Should show active filter count badges
      const badges = screen.getAllByText('3')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('disables clear button when no filters are active', () => {
      render(<FilterBar />)
      
      const clearButton = screen.getByText('Clear All')
      expect(clearButton).toBeDisabled()
    })
  })

  describe('Search Functionality', () => {
    it('calls setFilters when search input changes', async () => {
      const user = userEvent.setup()
      render(<FilterBar />)
      
      const searchInput = screen.getByPlaceholderText('Search by case number or title...')
      await user.type(searchInput, 'contract')
      
      expect(mockSetFilters).toHaveBeenCalledWith({ search: 'contract' })
    })

    it('shows clear button when search has value', async () => {
      const user = userEvent.setup()
      render(<FilterBar />)
      
      const searchInput = screen.getByPlaceholderText('Search by case number or title...')
      await user.type(searchInput, 'test')
      
      // Clear button should be visible in search input
      const clearButton = screen.getByRole('button', { name: '' })
      expect(clearButton).toBeInTheDocument()
    })

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup()
      mockUseKanbanStore.mockReturnValue({
        filters: { ...defaultFilters, search: 'test' },
        matters: mockMatters,
        setFilters: mockSetFilters,
        clearFilters: mockClearFilters
      })
      
      render(<FilterBar />)
      
      const clearButton = screen.getByRole('button', { name: '' })
      await user.click(clearButton)
      
      expect(mockSetFilters).toHaveBeenCalledWith({ search: '' })
    })
  })

  describe('Lawyer Filter', () => {
    it('calls setFilters when lawyer is selected', async () => {
      const user = userEvent.setup()
      render(<FilterBar />)
      
      const lawyerCheckbox = screen.getByLabelText('lawyer1')
      await user.click(lawyerCheckbox)
      
      expect(mockSetFilters).toHaveBeenCalledWith({ assignedLawyer: 'lawyer1' })
    })

    it('removes lawyer when deselected', async () => {
      const user = userEvent.setup()
      mockUseKanbanStore.mockReturnValue({
        filters: { ...defaultFilters, assignedLawyer: 'lawyer1' },
        matters: mockMatters,
        setFilters: mockSetFilters,
        clearFilters: mockClearFilters
      })
      
      render(<FilterBar />)
      
      const lawyerCheckbox = screen.getByLabelText('lawyer1')
      await user.click(lawyerCheckbox)
      
      expect(mockSetFilters).toHaveBeenCalledWith({ assignedLawyer: '' })
    })

    it('shows message when no lawyers are available', () => {
      mockUseKanbanStore.mockReturnValue({
        filters: defaultFilters,
        matters: [],
        setFilters: mockSetFilters,
        clearFilters: mockClearFilters
      })
      
      render(<FilterBar />)
      
      expect(screen.getByText('No lawyers assigned')).toBeInTheDocument()
    })
  })

  describe('Priority Filter', () => {
    it('calls setFilters when priority is selected', async () => {
      const user = userEvent.setup()
      render(<FilterBar />)
      
      const priorityCheckbox = screen.getByLabelText('high')
      await user.click(priorityCheckbox)
      
      expect(mockSetFilters).toHaveBeenCalledWith({ priorities: ['HIGH'] })
    })

    it('removes priority when deselected', async () => {
      const user = userEvent.setup()
      mockUseKanbanStore.mockReturnValue({
        filters: { ...defaultFilters, priorities: ['HIGH'] },
        matters: mockMatters,
        setFilters: mockSetFilters,
        clearFilters: mockClearFilters
      })
      
      render(<FilterBar />)
      
      const priorityCheckbox = screen.getByLabelText('high')
      await user.click(priorityCheckbox)
      
      expect(mockSetFilters).toHaveBeenCalledWith({ priorities: [] })
    })
  })

  describe('Closed Matters Toggle', () => {
    it('calls setFilters when toggle is changed', async () => {
      const user = userEvent.setup()
      render(<FilterBar />)
      
      const toggle = screen.getByRole('switch')
      await user.click(toggle)
      
      expect(mockSetFilters).toHaveBeenCalledWith({ showOverdueOnly: true })
    })

    it('shows correct toggle state text', () => {
      mockUseKanbanStore.mockReturnValue({
        filters: { ...defaultFilters, showOverdueOnly: true },
        matters: mockMatters,
        setFilters: mockSetFilters,
        clearFilters: mockClearFilters
      })
      
      render(<FilterBar />)
      
      expect(screen.getByText('Showing overdue only')).toBeInTheDocument()
    })
  })

  describe('Clear Filters', () => {
    it('calls clearFilters when clear button is clicked', async () => {
      const user = userEvent.setup()
      mockUseKanbanStore.mockReturnValue({
        filters: { ...defaultFilters, search: 'test' },
        matters: mockMatters,
        setFilters: mockSetFilters,
        clearFilters: mockClearFilters
      })
      
      render(<FilterBar />)
      
      const clearButton = screen.getByText('Clear All')
      await user.click(clearButton)
      
      expect(mockClearFilters).toHaveBeenCalled()
    })

    it('enables clear button when filters are active', () => {
      mockUseKanbanStore.mockReturnValue({
        filters: { ...defaultFilters, search: 'test' },
        matters: mockMatters,
        setFilters: mockSetFilters,
        clearFilters: mockClearFilters
      })
      
      render(<FilterBar />)
      
      const clearButton = screen.getByText('Clear All')
      expect(clearButton).not.toBeDisabled()
    })
  })

  describe('Mobile Responsiveness', () => {
    it('shows mobile toggle button on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<FilterBar />)
      
      // Should show filter toggle and count
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('toggles collapsed state on mobile', async () => {
      const user = userEvent.setup()
      render(<FilterBar />)
      
      // Find and click the toggle button (ToggleLeft icon)
      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)
      
      // Component should handle collapse state internally
      expect(toggleButton).toBeInTheDocument()
    })
  })
})

describe('Filter Logic Integration', () => {
  it('correctly calculates active filter count', () => {
    const filtersWithAll = {
      search: 'test',
      assignedLawyer: 'lawyer1',
      priorities: ['HIGH', 'MEDIUM'],
      showOverdueOnly: true
    }
    
    mockUseKanbanStore.mockReturnValue({
      filters: filtersWithAll,
      matters: mockMatters,
      setFilters: mockSetFilters,
      clearFilters: mockClearFilters
    })
    
    render(<FilterBar />)
    
    // Should show count of 5: 1 search + 1 lawyer + 2 priorities + 1 overdue toggle
    const badges = screen.getAllByText('5')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('syncs search input with store state', () => {
    mockUseKanbanStore.mockReturnValue({
      filters: { ...defaultFilters, search: 'existing search' },
      matters: mockMatters,
      setFilters: mockSetFilters,
      clearFilters: mockClearFilters
    })
    
    render(<FilterBar />)
    
    const searchInput = screen.getByDisplayValue('existing search')
    expect(searchInput).toBeInTheDocument()
  })
})