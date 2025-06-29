/**
 * Service Worker Registration and Management
 * 
 * @description Handles service worker registration, updates, and offline functionality
 * for the mobile Kanban board interface.
 */

import React from 'react'

interface ServiceWorkerEvents {
  onInstalled?: () => void
  onUpdated?: () => void
  onOffline?: () => void
  onOnline?: () => void
  onError?: (error: Error) => void
}

interface OfflineQueueItem {
  id: string
  url: string
  method: string
  data: any
  timestamp: number
  retries: number
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private isOnline: boolean = navigator.onLine
  private offlineQueue: OfflineQueueItem[] = []
  private events: ServiceWorkerEvents = {}

  constructor(events?: ServiceWorkerEvents) {
    this.events = events || {}
    this.setupEventListeners()
  }

  /**
   * Register service worker
   */
  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered:', this.registration.scope)

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.events.onUpdated?.()
            }
          })
        }
      })

      // Check for updates
      this.registration.update()

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      this.events.onError?.(error as Error)
      return false
    }
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (this.registration) {
      return await this.registration.unregister()
    }
    return false
  }

  /**
   * Check if app is running in offline mode
   */
  isOffline(): boolean {
    return !this.isOnline
  }

  /**
   * Cache matter data for offline access
   */
  async cacheMatters(matters: any[]): Promise<void> {
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'CACHE_MATTERS',
        matters
      })
    }
  }

  /**
   * Add request to offline queue
   */
  async queueRequest(
    url: string,
    method: string = 'GET',
    data?: any
  ): Promise<string> {
    const queueItem: OfflineQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      url,
      method,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    this.offlineQueue.push(queueItem)
    
    // Store in localStorage for persistence
    this.saveOfflineQueue()
    
    return queueItem.id
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): {
    count: number
    items: OfflineQueueItem[]
  } {
    return {
      count: this.offlineQueue.length,
      items: [...this.offlineQueue]
    }
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue(): void {
    this.offlineQueue = []
    localStorage.removeItem('aster_offline_queue')
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return

    console.log(`Processing ${this.offlineQueue.length} queued requests`)
    
    const failedItems: OfflineQueueItem[] = []

    for (const item of this.offlineQueue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: item.data ? JSON.stringify(item.data) : undefined
        })

        if (response.ok) {
          console.log('Successfully synced queued request:', item.url)
        } else {
          throw new Error(`Request failed with status: ${response.status}`)
        }
      } catch (error) {
        console.warn('Failed to sync queued request:', error)
        
        // Retry logic
        if (item.retries < 3) {
          item.retries++
          failedItems.push(item)
        }
      }
    }

    // Update queue with failed items for retry
    this.offlineQueue = failedItems
    this.saveOfflineQueue()
  }

  /**
   * Setup event listeners for online/offline detection
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('App is back online')
      this.isOnline = true
      this.events.onOnline?.()
      this.processOfflineQueue()
    })

    window.addEventListener('offline', () => {
      console.log('App is offline')
      this.isOnline = false
      this.events.onOffline?.()
    })

    // Load offline queue from storage
    this.loadOfflineQueue()
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('aster_offline_queue', JSON.stringify(this.offlineQueue))
    } catch (error) {
      console.warn('Failed to save offline queue:', error)
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem('aster_offline_queue')
      if (saved) {
        this.offlineQueue = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error)
      this.offlineQueue = []
    }
  }
}

// Global service worker manager instance
let serviceWorkerManager: ServiceWorkerManager | null = null

/**
 * Initialize service worker
 */
export async function initServiceWorker(events?: ServiceWorkerEvents): Promise<ServiceWorkerManager> {
  if (!serviceWorkerManager) {
    serviceWorkerManager = new ServiceWorkerManager(events)
    await serviceWorkerManager.register()
  }
  return serviceWorkerManager
}

/**
 * Get service worker manager instance
 */
export function getServiceWorkerManager(): ServiceWorkerManager | null {
  return serviceWorkerManager
}

/**
 * Check if browser supports service workers
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator
}

/**
 * Hook for service worker state in React components
 */
export function useServiceWorker() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)
  const [hasUpdate, setHasUpdate] = React.useState(false)
  const [queueCount, setQueueCount] = React.useState(0)

  React.useEffect(() => {
    const manager = getServiceWorkerManager()
    if (!manager) return

    const updateQueueCount = () => {
      setQueueCount(manager.getOfflineQueueStatus().count)
    }

    // Initial queue count
    updateQueueCount()

    // Listen for online/offline changes
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleUpdate = () => setHasUpdate(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update queue count periodically
    const interval = setInterval(updateQueueCount, 1000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const cacheMatters = React.useCallback(async (matters: any[]) => {
    const manager = getServiceWorkerManager()
    if (manager) {
      await manager.cacheMatters(matters)
    }
  }, [])

  const queueRequest = React.useCallback(async (url: string, method: string = 'GET', data?: any) => {
    const manager = getServiceWorkerManager()
    if (manager) {
      return await manager.queueRequest(url, method, data)
    }
    return null
  }, [])

  return {
    isOnline,
    hasUpdate,
    queueCount,
    cacheMatters,
    queueRequest,
    isOffline: !isOnline
  }
}