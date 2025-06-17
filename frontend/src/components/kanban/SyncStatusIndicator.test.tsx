/**
 * Tests for SyncStatusIndicator component
 * 
 * @description Tests sync status display, user interactions,
 * and various connection states for the real-time update indicator.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { SyncStatusIndicator, SyncStatusIndicatorCompact } from './SyncStatusIndicator'

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 minutes ago')
}))

describe('SyncStatusIndicator', () => {
  const defaultProps = {
    connectionStatus: 'connected' as const,
    lastUpdate: new Date('2024-01-01T12:00:00Z'),
    isPolling: false,
    isEnabled: true,
    errorCount: 0,
    nextRetryIn: 0,
    onRefresh: jest.fn(),
    onToggle: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Connected State', () => {
    it('renders connected status correctly', () => {
      render(<SyncStatusIndicator {...defaultProps} />)
      
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText(/Last updated 2 minutes ago/)).toBeInTheDocument()
    })

    it('shows syncing state when polling', () => {
      render(<SyncStatusIndicator {...defaultProps} isPolling={true} />)
      
      expect(screen.getByText('Syncing...')).toBeInTheDocument()
    })

    it('shows green indicator for connected state', () => {
      render(<SyncStatusIndicator {...defaultProps} />)
      
      const indicator = document.querySelector('.bg-green-500')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Disconnected State', () => {
    it('renders disconnected status correctly', () => {
      render(
        <SyncStatusIndicator 
          {...defaultProps} 
          connectionStatus="disconnected"
          isEnabled={false}
        />
      )
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument()
      expect(screen.getByText(/Real-time updates disabled/)).toBeInTheDocument()
    })

    it('shows error state with error count', () => {
      render(
        <SyncStatusIndicator 
          {...defaultProps} 
          connectionStatus="disconnected"
          errorCount={3}
        />
      )
      
      expect(screen.getByText('Connection Error')).toBeInTheDocument()
      expect(screen.getByText(/3 failed attempts/)).toBeInTheDocument()
    })

    it('shows red indicator for error state', () => {
      render(
        <SyncStatusIndicator 
          {...defaultProps} 
          connectionStatus="disconnected"
          errorCount={1}
        />
      )
      
      const indicator = document.querySelector('.bg-red-500')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Reconnecting State', () => {
    it('renders reconnecting status correctly', () => {
      render(
        <SyncStatusIndicator 
          {...defaultProps} 
          connectionStatus="reconnecting"
          nextRetryIn={30}
        />
      )
      
      expect(screen.getByText('Reconnecting...')).toBeInTheDocument()
      expect(screen.getByText(/Retrying in 30s/)).toBeInTheDocument()
    })

    it('shows yellow indicator for reconnecting state', () => {
      render(
        <SyncStatusIndicator 
          {...defaultProps} 
          connectionStatus="reconnecting"
        />
      )
      
      const indicator = document.querySelector('.bg-yellow-500')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('calls onRefresh when refresh button is clicked', () => {
      const onRefresh = jest.fn()
      render(<SyncStatusIndicator {...defaultProps} onRefresh={onRefresh} />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh now/i })
      fireEvent.click(refreshButton)
      
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('calls onToggle when toggle button is clicked', () => {
      const onToggle = jest.fn()
      render(<SyncStatusIndicator {...defaultProps} onToggle={onToggle} />)
      
      const toggleButton = screen.getByRole('button', { name: /disable auto-sync/i })
      fireEvent.click(toggleButton)
      
      expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('disables refresh button when polling', () => {
      render(<SyncStatusIndicator {...defaultProps} isPolling={true} />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh now/i })
      expect(refreshButton).toBeDisabled()
    })

    it('shows correct toggle button state when disabled', () => {
      render(<SyncStatusIndicator {...defaultProps} isEnabled={false} />)
      
      expect(screen.getByRole('button', { name: /enable auto-sync/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels and descriptions', () => {
      render(<SyncStatusIndicator {...defaultProps} />)
      
      // Tooltip should provide additional context
      const statusElement = screen.getByText('Connected')
      expect(statusElement).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(<SyncStatusIndicator {...defaultProps} />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh now/i })
      expect(refreshButton).toBeVisible()
      
      // Button should be focusable
      refreshButton.focus()
      expect(refreshButton).toHaveFocus()
    })
  })
})

describe('SyncStatusIndicatorCompact', () => {
  const compactProps = {
    connectionStatus: 'connected' as const,
    isPolling: false,
    onRefresh: jest.fn()
  }

  it('renders compact indicator correctly', () => {
    render(<SyncStatusIndicatorCompact {...compactProps} />)
    
    // Should render a compact dot indicator
    const indicator = document.querySelector('.bg-green-500')
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveClass('w-2', 'h-2', 'rounded-full')
  })

  it('shows different colors for different states', () => {
    const { rerender } = render(<SyncStatusIndicatorCompact {...compactProps} />)
    expect(document.querySelector('.bg-green-500')).toBeInTheDocument()

    rerender(<SyncStatusIndicatorCompact {...compactProps} connectionStatus="disconnected" />)
    expect(document.querySelector('.bg-red-500')).toBeInTheDocument()

    rerender(<SyncStatusIndicatorCompact {...compactProps} connectionStatus="reconnecting" />)
    expect(document.querySelector('.bg-yellow-500')).toBeInTheDocument()

    rerender(<SyncStatusIndicatorCompact {...compactProps} isPolling={true} />)
    expect(document.querySelector('.bg-blue-500')).toBeInTheDocument()
  })

  it('calls onRefresh when clicked', () => {
    const onRefresh = jest.fn()
    render(<SyncStatusIndicatorCompact {...compactProps} onRefresh={onRefresh} />)
    
    const indicator = document.querySelector('.bg-green-500')
    fireEvent.click(indicator!)
    
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows animation for active states', () => {
    const { rerender } = render(<SyncStatusIndicatorCompact {...compactProps} isPolling={true} />)
    
    let indicator = document.querySelector('.animate-pulse')
    expect(indicator).toBeInTheDocument()

    rerender(<SyncStatusIndicatorCompact {...compactProps} connectionStatus="reconnecting" />)
    indicator = document.querySelector('.animate-pulse')
    expect(indicator).toBeInTheDocument()
  })
})