import { render, screen, fireEvent } from '@testing-library/react'
import { MatterCard } from './MatterCard'
import { MatterCardProps } from './types'
import { DEFAULT_VIEW_PREFERENCES } from './constants'

// Mock tooltip provider
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock dnd-kit
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false
  })
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => '')
    }
  }
}))

const mockMatter = {
  id: '1',
  caseNumber: '2025-CV-0001',
  title: 'Contract Dispute with ABC Corporation',
  clientName: 'ABC Corporation',
  status: 'INTAKE' as const,
  priority: 'HIGH' as const,
  assignedLawyer: {
    id: 'lawyer1',
    name: 'John Smith',
    avatar: 'https://example.com/avatar.jpg'
  },
  assignedClerk: {
    id: 'clerk1', 
    name: 'Jane Doe'
  },
  dueDate: '2025-07-15T10:00:00Z',
  createdAt: '2025-06-15T10:00:00Z',
  updatedAt: '2025-06-17T05:00:00Z',
  statusDuration: 2
}

const mockProps: MatterCardProps = {
  matter: mockMatter,
  viewPreferences: DEFAULT_VIEW_PREFERENCES,
  currentUser: {
    id: 'user1',
    role: 'LAWYER' as const
  }
}

describe('MatterCard', () => {
  it('renders matter card with required fields', () => {
    render(<MatterCard {...mockProps} />)
    
    expect(screen.getByText('Contract Dispute with ABC Corporation')).toBeInTheDocument()
    expect(screen.getByText('#2025-CV-0001')).toBeInTheDocument()
    expect(screen.getByText('ABC Corporation')).toBeInTheDocument()
    expect(screen.getByText('intake')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('Updated Jun 17')).toBeInTheDocument() // Last updated field
  })

  it('displays priority badge with correct styling', () => {
    render(<MatterCard {...mockProps} />)
    
    const priorityBadge = screen.getByText('HIGH')
    expect(priorityBadge).toBeInTheDocument()
    expect(priorityBadge.closest('.bg-orange-100')).toBeInTheDocument()
  })

  it('shows assigned lawyer and clerk avatars when enabled', () => {
    render(<MatterCard {...mockProps} />)
    
    expect(screen.getByText('JS')).toBeInTheDocument() // Lawyer initials
    expect(screen.getByText('JD')).toBeInTheDocument() // Clerk initials
  })

  it('displays due date when enabled', () => {
    render(<MatterCard {...mockProps} />)
    
    expect(screen.getByText('Jul 15')).toBeInTheDocument()
  })

  it('shows overdue indicator for past due dates', () => {
    const overdueMatter = {
      ...mockMatter,
      dueDate: '2025-06-01T10:00:00Z' // Past date
    }
    
    render(<MatterCard {...mockProps} matter={overdueMatter} />)
    
    expect(screen.getByText(/\(Overdue\)/)).toBeInTheDocument()
  })

  it('displays status duration in detailed view', () => {
    const detailedViewPreferences = {
      ...DEFAULT_VIEW_PREFERENCES,
      cardSize: 'detailed' as const
    }
    
    render(<MatterCard {...mockProps} viewPreferences={detailedViewPreferences} />)
    
    expect(screen.getByText('2 days in status')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const onClickMock = jest.fn()
    render(<MatterCard {...mockProps} onClick={onClickMock} />)
    
    const card = screen.getByRole('button', { name: /matter card/i }) || screen.getByText('Contract Dispute with ABC Corporation').closest('div')
    if (card) {
      fireEvent.click(card)
      expect(onClickMock).toHaveBeenCalled()
    }
  })

  it('applies dragging styles when isDragging is true', () => {
    const { container } = render(<MatterCard {...mockProps} isDragging={true} />)
    
    const card = container.querySelector('.opacity-50')
    expect(card).toBeInTheDocument()
  })

  it('truncates long titles appropriately', () => {
    const longTitleMatter = {
      ...mockMatter,
      title: 'This is a very long matter title that should be truncated to prevent layout issues and maintain readability'
    }
    
    const { container } = render(<MatterCard {...mockProps} matter={longTitleMatter} />)
    
    const titleElement = container.querySelector('.truncate')
    expect(titleElement).toBeInTheDocument()
  })

  it('renders without assigned lawyer or clerk', () => {
    const matterWithoutAssignees = {
      ...mockMatter,
      assignedLawyer: undefined,
      assignedClerk: undefined
    }
    
    render(<MatterCard {...mockProps} matter={matterWithoutAssignees} />)
    
    expect(screen.getByText('Contract Dispute with ABC Corporation')).toBeInTheDocument()
    expect(screen.queryByText('JS')).not.toBeInTheDocument()
    expect(screen.queryByText('JD')).not.toBeInTheDocument()
  })

  it('handles compact card size', () => {
    const compactViewPreferences = {
      ...DEFAULT_VIEW_PREFERENCES,
      cardSize: 'compact' as const
    }
    
    const { container } = render(<MatterCard {...mockProps} viewPreferences={compactViewPreferences} />)
    
    const card = container.querySelector('.h-20')
    expect(card).toBeInTheDocument()
  })

  it('renders without due date when not provided', () => {
    const matterWithoutDueDate = {
      ...mockMatter,
      dueDate: undefined
    }
    
    render(<MatterCard {...mockProps} matter={matterWithoutDueDate} />)
    
    expect(screen.queryByText(/Jul/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument()
  })

  it('applies correct priority color scheme', () => {
    const urgentMatter = {
      ...mockMatter,
      priority: 'URGENT' as const
    }
    
    const { container } = render(<MatterCard {...mockProps} matter={urgentMatter} />)
    
    const card = container.querySelector('.border-red-500')
    expect(card).toBeInTheDocument()
  })
})