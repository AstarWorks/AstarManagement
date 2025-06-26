/**
 * StaleDataIndicator Component Tests
 * 
 * @description Unit tests for the StaleDataIndicator component
 * @author Claude
 * @created 2025-06-26
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import StaleDataIndicator from '../StaleDataIndicator.vue'
import { Button } from '~/components/ui/button'

// Mock composables
vi.mock('~/composables/useBackgroundSync', () => ({
  useBackgroundSync: () => ({
    syncMode: { value: 'balanced' },
    syncStatus: { value: 'idle' },
    syncDataType: vi.fn()
  })
}))

// Mock config
vi.mock('~/config/background-sync', () => ({
  getSyncConfig: vi.fn(() => ({
    staleTime: 60000 // 1 minute
  }))
}))

describe('StaleDataIndicator', () => {
  const defaultProps = {
    dataType: 'matters' as const,
    lastUpdated: Date.now() - 30000 // 30 seconds ago
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders fresh indicator when data is fresh', () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        lastUpdated: Date.now() - 10000 // 10 seconds ago
      }
    })

    // Should show fresh status
    expect(wrapper.find('.indicator-dot').classes()).toContain('bg-green-500')
    expect(wrapper.text()).toContain('Fresh')
    
    // Should not show refresh button
    expect(wrapper.findComponent(Button).exists()).toBe(false)
  })

  it('renders stale indicator when data is stale', () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        lastUpdated: Date.now() - 120000 // 2 minutes ago
      }
    })

    // Should show stale status
    expect(wrapper.find('.indicator-dot').classes()).toContain('bg-yellow-500')
    expect(wrapper.text()).toContain('Stale')
    
    // Should show refresh button
    expect(wrapper.findComponent(Button).exists()).toBe(true)
  })

  it('renders very stale indicator when data is very old', () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        lastUpdated: Date.now() - 300000 // 5 minutes ago
      }
    })

    // Should show very stale status
    expect(wrapper.find('.indicator-dot').classes()).toContain('bg-orange-500')
    expect(wrapper.text()).toContain('Very stale')
    
    // Should show refresh button
    expect(wrapper.findComponent(Button).exists()).toBe(true)
  })

  it('handles unknown last updated time', () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        lastUpdated: null
      }
    })

    // Should show unknown status
    expect(wrapper.find('.indicator-dot').classes()).toContain('bg-gray-400')
    expect(wrapper.text()).toContain('Unknown')
  })

  it('hides text when showText is false', () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        showText: false
      }
    })

    expect(wrapper.find('.status-text').exists()).toBe(false)
  })

  it('applies compact styles when compact is true', () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        compact: true
      }
    })

    expect(wrapper.find('.indicator-dot').classes()).toContain('w-1.5')
    expect(wrapper.find('.indicator-dot').classes()).toContain('h-1.5')
  })

  it('emits refresh event when refresh button is clicked', async () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        lastUpdated: Date.now() - 120000 // Stale
      }
    })

    const refreshButton = wrapper.findComponent(Button)
    await refreshButton.trigger('click')

    expect(wrapper.emitted('refresh')).toBeTruthy()
    expect(wrapper.emitted('refresh')?.[0]).toEqual([])
  })

  it('calls custom onRefresh handler when provided', async () => {
    const onRefresh = vi.fn()
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        lastUpdated: Date.now() - 120000, // Stale
        onRefresh
      }
    })

    const refreshButton = wrapper.findComponent(Button)
    await refreshButton.trigger('click')

    expect(onRefresh).toHaveBeenCalled()
  })

  it('emits staleDetected when data becomes stale', async () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        lastUpdated: Date.now() - 10000 // Fresh
      }
    })

    expect(wrapper.emitted('staleDetected')).toBeFalsy()

    // Update to stale
    await wrapper.setProps({
      lastUpdated: Date.now() - 120000 // Stale
    })
    await nextTick()

    expect(wrapper.emitted('staleDetected')).toBeTruthy()
  })

  it('shows pulse animation for stale states', () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        lastUpdated: Date.now() - 120000 // Stale
      }
    })

    const pulseElement = wrapper.find('.animate-ping')
    expect(pulseElement.exists()).toBe(true)
    expect(pulseElement.classes()).toContain('bg-yellow-500')
  })

  it('disables refresh button while refreshing', async () => {
    const onRefresh = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        lastUpdated: Date.now() - 120000, // Stale
        onRefresh
      }
    })

    const refreshButton = wrapper.findComponent(Button)
    
    // Click refresh
    await refreshButton.trigger('click')
    
    // Should be disabled while refreshing
    expect(refreshButton.props('disabled')).toBe(true)
    
    // Wait for refresh to complete
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Should be enabled again
    expect(refreshButton.props('disabled')).toBe(false)
  })

  it('applies custom CSS classes', () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        class: 'custom-class'
      }
    })

    expect(wrapper.find('.stale-data-indicator').classes()).toContain('custom-class')
  })

  it('provides appropriate tooltip text', () => {
    const testCases = [
      {
        lastUpdated: Date.now() - 10000,
        expectedToContain: 'Data is fresh'
      },
      {
        lastUpdated: Date.now() - 120000,
        expectedToContain: 'Data is stale'
      },
      {
        lastUpdated: Date.now() - 300000,
        expectedToContain: 'Data is very stale'
      },
      {
        lastUpdated: null,
        expectedToContain: 'Data freshness unknown'
      }
    ]

    testCases.forEach(({ lastUpdated, expectedToContain }) => {
      const wrapper = mount(StaleDataIndicator, {
        props: {
          ...defaultProps,
          lastUpdated
        }
      })

      const indicator = wrapper.find('.indicator-wrapper')
      expect(indicator.attributes('title')).toContain(expectedToContain)
    })
  })

  it('respects syncMode override', () => {
    const wrapper = mount(StaleDataIndicator, {
      props: {
        ...defaultProps,
        syncMode: 'aggressive'
      }
    })

    // Component should use the overridden sync mode
    // This would affect the stale time calculation
    expect(wrapper.vm.effectiveSyncMode).toBe('aggressive')
  })
})