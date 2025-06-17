/**
 * Storybook stories for Mobile Loading States
 * 
 * @description Showcases mobile-optimized loading indicators and skeleton states
 */

import type { Meta, StoryObj } from '@storybook/react'
import { 
  MobileCardSkeleton,
  MobileColumnLoading,
  MobileBoardLoading,
  RefreshLoading,
  PullToRefreshIndicator,
  TouchLoadingFeedback,
  ConnectionStatusLoading
} from './MobileLoadingStates'

const meta: Meta = {
  title: 'Kanban/Mobile/LoadingStates',
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile2',
    },
    docs: {
      description: {
        component: `
Mobile-optimized loading states and skeleton components for smooth user experience during data loading and interactions.

## Components
- **MobileCardSkeleton**: Skeleton for matter cards
- **MobileColumnLoading**: Loading state for entire column
- **MobileBoardLoading**: Full board loading skeleton
- **RefreshLoading**: Refresh indicator
- **PullToRefreshIndicator**: Pull-to-refresh feedback
- **TouchLoadingFeedback**: Touch interaction feedback
- **ConnectionStatusLoading**: Connection status indicators
        `
      }
    }
  },
  tags: ['autodocs']
}

export default meta

/**
 * Mobile Card Skeleton
 */
export const CardSkeleton: StoryObj = {
  render: () => (
    <div className="p-4 space-y-3 max-w-sm">
      <div className="text-sm font-medium mb-2">Mobile Card Skeleton:</div>
      <MobileCardSkeleton />
      <MobileCardSkeleton />
      <MobileCardSkeleton />
    </div>
  )
}

/**
 * Mobile Column Loading
 */
export const ColumnLoading: StoryObj = {
  render: () => (
    <div className="h-screen max-w-sm border">
      <div className="p-2 border-b bg-muted text-sm font-medium">Column Loading:</div>
      <MobileColumnLoading />
    </div>
  )
}

/**
 * Full Mobile Board Loading
 */
export const BoardLoading: StoryObj = {
  render: () => (
    <div className="h-screen max-w-sm border">
      <MobileBoardLoading />
    </div>
  )
}

/**
 * Refresh Loading Indicator
 */
export const RefreshIndicator: StoryObj = {
  render: () => (
    <div className="relative h-32 max-w-sm border bg-muted/20">
      <div className="p-4 text-sm text-muted-foreground">
        Refresh indicator appears at top of screen
      </div>
      <RefreshLoading isVisible={true} />
    </div>
  )
}

/**
 * Pull to Refresh States
 */
export const PullToRefresh: StoryObj = {
  render: () => (
    <div className="space-y-4 max-w-sm">
      <div className="text-sm font-medium">Pull to Refresh States:</div>
      
      <div className="relative h-20 border bg-muted/20">
        <div className="p-2 text-xs text-muted-foreground">25% Progress</div>
        <PullToRefreshIndicator isVisible={true} progress={0.25} />
      </div>
      
      <div className="relative h-20 border bg-muted/20">
        <div className="p-2 text-xs text-muted-foreground">75% Progress</div>
        <PullToRefreshIndicator isVisible={true} progress={0.75} />
      </div>
      
      <div className="relative h-20 border bg-muted/20">
        <div className="p-2 text-xs text-muted-foreground">100% Progress (Release to refresh)</div>
        <PullToRefreshIndicator isVisible={true} progress={1} />
      </div>
    </div>
  )
}

/**
 * Touch Loading Feedback
 */
export const TouchFeedback: StoryObj = {
  render: () => (
    <div className="relative h-48 max-w-sm border bg-muted/20 overflow-hidden">
      <div className="p-4 text-sm text-muted-foreground">
        Touch feedback appears at touch point
      </div>
      <TouchLoadingFeedback 
        isVisible={true} 
        position={{ x: 150, y: 100 }} 
      />
    </div>
  )
}

/**
 * Connection Status Loading
 */
export const ConnectionStatus: StoryObj = {
  render: () => (
    <div className="space-y-4 max-w-sm p-4">
      <div className="text-sm font-medium">Connection Status Indicators:</div>
      
      <div className="space-y-2">
        <ConnectionStatusLoading status="connecting" />
        <ConnectionStatusLoading status="syncing" />
        <ConnectionStatusLoading status="offline" />
        <ConnectionStatusLoading status="error" />
      </div>
    </div>
  )
}

/**
 * All Loading States Demo
 */
export const AllStates: StoryObj = {
  render: () => (
    <div className="space-y-6 p-4">
      <div className="text-lg font-semibold">Mobile Loading States Overview</div>
      
      {/* Card Skeletons */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Card Skeletons</h3>
        <div className="grid gap-3 max-w-xs">
          <MobileCardSkeleton />
          <MobileCardSkeleton />
        </div>
      </section>
      
      {/* Connection Status */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Connection Status</h3>
        <div className="flex flex-wrap gap-2">
          <ConnectionStatusLoading status="connecting" />
          <ConnectionStatusLoading status="syncing" />
          <ConnectionStatusLoading status="offline" />
          <ConnectionStatusLoading status="error" />
        </div>
      </section>
      
      {/* Refresh Indicators */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Refresh Indicators</h3>
        <div className="relative h-16 bg-muted/20 rounded border">
          <RefreshLoading isVisible={true} />
        </div>
      </section>
      
      {/* Pull to Refresh */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Pull to Refresh Progress</h3>
        <div className="flex gap-2">
          <div className="relative w-16 h-16 bg-muted/20 rounded border">
            <PullToRefreshIndicator isVisible={true} progress={0.3} />
          </div>
          <div className="relative w-16 h-16 bg-muted/20 rounded border">
            <PullToRefreshIndicator isVisible={true} progress={0.7} />
          </div>
          <div className="relative w-16 h-16 bg-muted/20 rounded border">
            <PullToRefreshIndicator isVisible={true} progress={1} />
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * Animated Loading Demo
 */
export const AnimatedDemo: StoryObj = {
  render: () => {
    const [refreshVisible, setRefreshVisible] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    
    React.useEffect(() => {
      const interval = setInterval(() => {
        setRefreshVisible(prev => !prev)
      }, 2000)
      
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev + 0.1) % 1.1)
      }, 200)
      
      return () => {
        clearInterval(interval)
        clearInterval(progressInterval)
      }
    }, [])
    
    return (
      <div className="space-y-6 p-4 max-w-sm">
        <div className="text-lg font-semibold">Animated Loading Demo</div>
        
        <div className="relative h-32 bg-muted/20 rounded border">
          <div className="p-2 text-xs text-muted-foreground">
            Auto-toggling refresh indicator
          </div>
          <RefreshLoading isVisible={refreshVisible} />
        </div>
        
        <div className="relative h-20 bg-muted/20 rounded border">
          <div className="p-2 text-xs text-muted-foreground">
            Animated pull progress: {Math.round(progress * 100)}%
          </div>
          <PullToRefreshIndicator isVisible={true} progress={progress} />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Loading Cards</div>
          <MobileCardSkeleton />
          <MobileCardSkeleton />
        </div>
      </div>
    )
  }
}

// Add React import for the animated demo
const React = require('react')