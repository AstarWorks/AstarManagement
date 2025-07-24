/**
 * Background Sync Tests
 * 
 * @description Comprehensive tests for background sync functionality including
 * tab visibility, network detection, and sync mode management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useBackgroundSync } from '../useBackgroundSync'
import { useQueryClient } from '@tanstack/vue-query'
import type { SyncMode } from '~/config/background-sync'

// Mock modules
vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn()
}))

vi.mock('../useWebSocketConnection', () => ({
  useWebSocketConnection: vi.fn(() => ({
    isConnected: { value: false },
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  }))
}))

describe('useBackgroundSync', () => {
  let mockQueryClient: any
  let originalNavigator: any
  let originalDocument: any
  let visibilityState: string = 'visible'
  
  beforeEach(() => {
    // Mock query client
    mockQueryClient = {
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
      setQueryData: vi.fn(),
      getQueryCache: vi.fn(() => ({
        getAll: vi.fn(() => [])
      }))
    }
    
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient)
    
    // Mock navigator
    originalNavigator = global.navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        onLine: true,
        connection: {
          downlink: 10,
          effectiveType: '4g',
          rtt: 50
        }
      },
      writable: true
    })
    
    // Mock document visibility
    originalDocument = global.document
    Object.defineProperty(global.document, 'hidden', {
      get: () => visibilityState === 'hidden',
      configurable: true
    })
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    // Reset visibility state
    visibilityState = 'visible'
  })
  
  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    global.navigator = originalNavigator
    global.document = originalDocument
  })
  
  describe('Sync Mode Management', () => {
    it('should initialize with default sync mode', () => {
      const { syncMode } = useBackgroundSync()
      expect(syncMode.value).toBe('balanced')
    })
    
    it('should load saved sync mode from localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('conservative')
      const { syncMode } = useBackgroundSync()
      expect(syncMode.value).toBe('conservative')
    })
    
    it('should save sync mode to localStorage when changed', () => {
      const { setSyncMode } = useBackgroundSync()
      setSyncMode('aggressive')
      
      expect(localStorage.setItem).toHaveBeenCalledWith('sync-mode', 'aggressive')
    })
    
    it('should adjust sync rates when mode changes', async () => {
      const { setSyncMode } = useBackgroundSync()
      
      setSyncMode('aggressive')
      await flushPromises()
      
      // Should trigger sync adjustments
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled()
    })
  })
  
  describe('Network Quality Detection', () => {
    it('should detect excellent network quality', () => {
      Object.defineProperty(global.navigator, 'connection', {
        value: {
          downlink: 20,
          effectiveType: '4g',
          rtt: 30
        },
        writable: true
      })
      
      const { networkQuality } = useBackgroundSync()
      expect(networkQuality.value).toBe('excellent')
    })
    
    it('should detect poor network quality', () => {
      Object.defineProperty(global.navigator, 'connection', {
        value: {
          downlink: 0.5,
          effectiveType: '2g',
          rtt: 500
        },
        writable: true
      })
      
      const { networkQuality } = useBackgroundSync()
      expect(networkQuality.value).toBe('poor')
    })
    
    it('should detect offline state', () => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      })
      
      const { networkQuality, isOnline } = useBackgroundSync()
      expect(networkQuality.value).toBe('offline')
      expect(isOnline.value).toBe(false)
    })
    
    it('should update on network change events', async () => {
      const { isOnline } = useBackgroundSync()
      
      // Simulate going offline
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      })
      window.dispatchEvent(new Event('offline'))
      
      await flushPromises()
      expect(isOnline.value).toBe(false)
      
      // Simulate going online
      Object.defineProperty(global.navigator, 'onLine', {
        value: true,
        writable: true
      })
      window.dispatchEvent(new Event('online'))
      
      await flushPromises()
      expect(isOnline.value).toBe(true)
    })
  })
  
  describe('Tab Visibility Handling', () => {
    it('should detect active tab state', () => {
      const { tabVisibility } = useBackgroundSync()
      expect(tabVisibility.value).toBe('active')
    })
    
    it('should detect hidden tab state', async () => {
      const { tabVisibility } = useBackgroundSync()
      
      visibilityState = 'hidden'
      document.dispatchEvent(new Event('visibilitychange'))
      
      await flushPromises()
      expect(tabVisibility.value).toBe('hidden')
    })
    
    it('should mark tab as background after delay', async () => {
      vi.useFakeTimers()
      const { tabVisibility } = useBackgroundSync()
      
      visibilityState = 'hidden'
      document.dispatchEvent(new Event('visibilitychange'))
      
      // Should be hidden immediately
      expect(tabVisibility.value).toBe('hidden')
      
      // Advance timers past background delay
      vi.advanceTimersByTime(31000) // 30s + buffer
      
      expect(tabVisibility.value).toBe('background')
      vi.useRealTimers()
    })
    
    it('should sync on tab focus if configured', async () => {
      const { syncAllData } = useBackgroundSync()
      
      // Hide tab
      visibilityState = 'hidden'
      document.dispatchEvent(new Event('visibilitychange'))
      
      // Show tab again
      visibilityState = 'visible'
      document.dispatchEvent(new Event('visibilitychange'))
      
      await flushPromises()
      
      // Should trigger sync
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled()
    })
  })
  
  describe('Sync Operations', () => {
    it('should sync all data when online', async () => {
      const { syncAllData } = useBackgroundSync()
      
      await syncAllData()
      
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith()
    })
    
    it('should not sync when offline', async () => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      })
      
      const { syncAllData } = useBackgroundSync()
      await syncAllData()
      
      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled()
    })
    
    it('should sync specific data type', async () => {
      const { syncDataType } = useBackgroundSync()
      
      await syncDataType('matters')
      
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        predicate: expect.any(Function)
      })
    })
    
    it('should update last sync time after successful sync', async () => {
      const { syncAllData, lastSyncTime } = useBackgroundSync()
      
      const beforeSync = lastSyncTime.value
      await syncAllData()
      
      expect(lastSyncTime.value).toBeGreaterThan(beforeSync)
    })
  })
  
  describe('Performance Adaptation', () => {
    it('should detect battery level if available', async () => {
      const mockBattery = {
        level: 0.15, // 15%
        addEventListener: vi.fn()
      }
      
      ;(global.navigator as any).getBattery = vi.fn().mockResolvedValue(mockBattery)
      
      const { batteryLevel } = useBackgroundSync()
      
      await flushPromises()
      
      expect(batteryLevel.value).toBe(15)
    })
    
    it('should detect memory usage if available', () => {
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
          jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
        },
        writable: true
      })
      
      const { memoryUsage } = useBackgroundSync()
      
      expect(memoryUsage.value).toBe(50)
    })
    
    it('should stop syncing on low battery in conservative mode', async () => {
      const mockBattery = {
        level: 0.15, // 15%
        addEventListener: vi.fn()
      }
      
      ;(global.navigator as any).getBattery = vi.fn().mockResolvedValue(mockBattery)
      
      const { setSyncMode, syncAllData } = useBackgroundSync()
      
      setSyncMode('conservative')
      await flushPromises()
      
      await syncAllData()
      
      // Should not sync due to low battery
      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled()
    })
  })
  
  describe('Sync Status', () => {
    it('should report offline status when not connected', () => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true
      })
      
      const { syncStatus } = useBackgroundSync()
      expect(syncStatus.value).toBe('offline')
    })
    
    it('should report syncing status during sync', async () => {
      const { syncStatus, syncAllData } = useBackgroundSync()
      
      const syncPromise = syncAllData()
      expect(syncStatus.value).toBe('syncing')
      
      await syncPromise
      expect(syncStatus.value).toBe('idle')
    })
    
    it('should report error status on sync failure', async () => {
      mockQueryClient.invalidateQueries.mockRejectedValueOnce(new Error('Sync failed'))
      
      const { syncStatus, syncAllData } = useBackgroundSync()
      
      await syncAllData()
      
      expect(syncStatus.value).toBe('error')
    })
    
    it('should provide sync statistics', () => {
      const { getSyncStats } = useBackgroundSync()
      
      const stats = getSyncStats()
      
      expect(stats).toMatchObject({
        mode: expect.any(String),
        status: expect.any(String),
        lastSync: expect.any(Number),
        networkQuality: expect.any(String),
        tabVisibility: expect.any(String),
        wsConnected: expect.any(Boolean),
        errors: expect.any(Number)
      })
    })
  })
})