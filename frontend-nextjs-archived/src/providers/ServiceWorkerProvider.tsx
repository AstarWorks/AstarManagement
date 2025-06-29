/**
 * Service Worker Provider
 * 
 * @description Initializes and manages service worker for offline functionality
 */

'use client'

import * as React from 'react'
import { initServiceWorker } from '@/lib/service-worker'

interface ServiceWorkerProviderProps {
  children: React.ReactNode
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    // Initialize service worker on client side only
    if (typeof window !== 'undefined') {
      initServiceWorker({
        onInstalled: () => {
          console.log('Service Worker installed successfully')
        },
        onUpdated: () => {
          console.log('Service Worker updated - new version available')
          // Could show update notification here
        },
        onOffline: () => {
          console.log('App went offline')
        },
        onOnline: () => {
          console.log('App is back online')
        },
        onError: (error) => {
          console.error('Service Worker error:', error)
        }
      })
        .then(() => {
          setIsInitialized(true)
        })
        .catch((error) => {
          console.error('Failed to initialize service worker:', error)
          setIsInitialized(true) // Continue even if SW fails
        })
    }
  }, [])

  return <>{children}</>
}