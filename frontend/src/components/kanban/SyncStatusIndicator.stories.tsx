/**
 * Storybook stories for SyncStatusIndicator
 * 
 * @description Interactive stories showcasing different sync states,
 * user interactions, and visual feedback for the real-time update indicator.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { SyncStatusIndicator, SyncStatusIndicatorCompact } from './SyncStatusIndicator'

const meta: Meta<typeof SyncStatusIndicator> = {
  title: 'Kanban/SyncStatusIndicator',
  component: SyncStatusIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The SyncStatusIndicator provides visual feedback about real-time synchronization status.
It shows connection state, last update time, and provides manual refresh controls.

## Features
- Visual connection status with color-coded indicators
- Last update timestamp with relative time formatting
- Manual refresh and auto-sync toggle controls
- Error state with retry information
- Accessible tooltips and keyboard navigation
- Compact variant for minimal space usage

## Usage
Use this component in board headers or status bars to keep users informed about
data synchronization state and provide manual control options.
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    connectionStatus: {
      control: { type: 'select' },
      options: ['connected', 'disconnected', 'reconnecting'],
      description: 'Current connection status'
    },
    lastUpdate: {
      control: { type: 'date' },
      description: 'Timestamp of last successful update'
    },
    isPolling: {
      control: { type: 'boolean' },
      description: 'Whether polling is currently active'
    },
    isEnabled: {
      control: { type: 'boolean' },
      description: 'Whether auto-sync is enabled'
    },
    errorCount: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Number of consecutive failed attempts'
    },
    nextRetryIn: {
      control: { type: 'number', min: 0, max: 300 },
      description: 'Seconds until next retry attempt'
    },
    onRefresh: { action: 'refresh' },
    onToggle: { action: 'toggle' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default connected state with recent update
 */
export const Connected: Story = {
  args: {
    connectionStatus: 'connected',
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    isPolling: false,
    isEnabled: true,
    errorCount: 0,
    nextRetryIn: 0,
    onRefresh: action('Manual refresh triggered'),
    onToggle: action('Auto-sync toggled')
  }
}

/**
 * Active syncing state with loading indicator
 */
export const Syncing: Story = {
  args: {
    ...Connected.args,
    isPolling: true
  }
}

/**
 * Disconnected state with auto-sync disabled
 */
export const Disconnected: Story = {
  args: {
    connectionStatus: 'disconnected',
    lastUpdate: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    isPolling: false,
    isEnabled: false,
    errorCount: 0,
    nextRetryIn: 0,
    onRefresh: action('Manual refresh triggered'),
    onToggle: action('Auto-sync toggled')
  }
}

/**
 * Connection error state with failed attempts
 */
export const ConnectionError: Story = {
  args: {
    connectionStatus: 'disconnected',
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isPolling: false,
    isEnabled: true,
    errorCount: 3,
    nextRetryIn: 0,
    onRefresh: action('Manual refresh triggered'),
    onToggle: action('Auto-sync toggled')
  }
}

/**
 * Reconnecting state with retry countdown
 */
export const Reconnecting: Story = {
  args: {
    connectionStatus: 'reconnecting',
    lastUpdate: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    isPolling: false,
    isEnabled: true,
    errorCount: 1,
    nextRetryIn: 45,
    onRefresh: action('Manual refresh triggered'),
    onToggle: action('Auto-sync toggled')
  }
}

/**
 * No recent updates - stale data warning
 */
export const StaleData: Story = {
  args: {
    connectionStatus: 'connected',
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isPolling: false,
    isEnabled: true,
    errorCount: 0,
    nextRetryIn: 0,
    onRefresh: action('Manual refresh triggered'),
    onToggle: action('Auto-sync toggled')
  }
}

/**
 * First time use - no previous update
 */
export const FirstUse: Story = {
  args: {
    connectionStatus: 'connected',
    lastUpdate: null,
    isPolling: false,
    isEnabled: true,
    errorCount: 0,
    nextRetryIn: 0,
    onRefresh: action('Manual refresh triggered'),
    onToggle: action('Auto-sync toggled')
  }
}

/**
 * Interactive demo with state changes
 */
export const Interactive: Story = {
  args: Connected.args,
  render: (args) => {
    const [state, setState] = React.useState({
      connectionStatus: args.connectionStatus,
      isPolling: args.isPolling,
      isEnabled: args.isEnabled,
      errorCount: args.errorCount
    })

    const handleRefresh = () => {
      action('Manual refresh triggered')()
      setState(prev => ({ ...prev, isPolling: true }))
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          isPolling: false,
          connectionStatus: 'connected',
          errorCount: 0
        }))
      }, 2000)
    }

    const handleToggle = () => {
      action('Auto-sync toggled')()
      setState(prev => ({ ...prev, isEnabled: !prev.isEnabled }))
    }

    return (
      <SyncStatusIndicator
        {...args}
        connectionStatus={state.connectionStatus}
        isPolling={state.isPolling}
        isEnabled={state.isEnabled}
        errorCount={state.errorCount}
        onRefresh={handleRefresh}
        onToggle={handleToggle}
      />
    )
  }
}

// Compact variant stories
const compactMeta: Meta<typeof SyncStatusIndicatorCompact> = {
  title: 'Kanban/SyncStatusIndicator',
  component: SyncStatusIndicatorCompact,
  parameters: {
    layout: 'centered'
  }
}

type CompactStory = StoryObj<typeof compactMeta>

/**
 * Compact version for minimal space usage
 */
export const CompactConnected: CompactStory = {
  name: 'Compact - Connected',
  render: () => (
    <div className="flex items-center gap-4 p-4 border rounded">
      <span className="text-sm">Board Status:</span>
      <SyncStatusIndicatorCompact
        connectionStatus="connected"
        isPolling={false}
        onRefresh={action('Compact refresh')}
      />
    </div>
  )
}

/**
 * Compact syncing state
 */
export const CompactSyncing: CompactStory = {
  name: 'Compact - Syncing',
  render: () => (
    <div className="flex items-center gap-4 p-4 border rounded">
      <span className="text-sm">Board Status:</span>
      <SyncStatusIndicatorCompact
        connectionStatus="connected"
        isPolling={true}
        onRefresh={action('Compact refresh')}
      />
    </div>
  )
}

/**
 * Compact error state
 */
export const CompactError: CompactStory = {
  name: 'Compact - Error',
  render: () => (
    <div className="flex items-center gap-4 p-4 border rounded">
      <span className="text-sm">Board Status:</span>
      <SyncStatusIndicatorCompact
        connectionStatus="disconnected"
        isPolling={false}
        onRefresh={action('Compact refresh')}
      />
    </div>
  )
}

/**
 * Multiple compact indicators
 */
export const CompactGrid: CompactStory = {
  name: 'Compact - Multiple States',
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="flex items-center gap-2 p-2 border rounded">
        <span className="text-xs">Connected</span>
        <SyncStatusIndicatorCompact
          connectionStatus="connected"
          isPolling={false}
        />
      </div>
      <div className="flex items-center gap-2 p-2 border rounded">
        <span className="text-xs">Syncing</span>
        <SyncStatusIndicatorCompact
          connectionStatus="connected"
          isPolling={true}
        />
      </div>
      <div className="flex items-center gap-2 p-2 border rounded">
        <span className="text-xs">Reconnecting</span>
        <SyncStatusIndicatorCompact
          connectionStatus="reconnecting"
          isPolling={false}
        />
      </div>
      <div className="flex items-center gap-2 p-2 border rounded">
        <span className="text-xs">Error</span>
        <SyncStatusIndicatorCompact
          connectionStatus="disconnected"
          isPolling={false}
        />
      </div>
    </div>
  )
}