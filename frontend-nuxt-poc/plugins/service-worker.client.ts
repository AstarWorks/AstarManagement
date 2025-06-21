/**
 * Service Worker Plugin
 * 
 * @description Manages Progressive Web App (PWA) functionality including
 * service worker registration, updates, and offline capabilities.
 * This is the Vue/Nuxt equivalent of the React ServiceWorkerProvider.
 */

import { defineNuxtPlugin } from '#app'
import { ref } from 'vue'

export default defineNuxtPlugin(() => {
  // Service worker state
  const isServiceWorkerSupported = ref('serviceWorker' in navigator)
  const registration = ref<ServiceWorkerRegistration | null>(null)
  const isUpdateAvailable = ref(false)
  const isOffline = ref(!navigator.onLine)
  
  // Skip service worker in development by default
  const enableInDev = process.env.ENABLE_SW_DEV === 'true'
  if (process.env.NODE_ENV === 'development' && !enableInDev) {
    console.log('Service Worker disabled in development')
    return {
      provide: {
        serviceWorker: {
          isSupported: false,
          isUpdateAvailable,
          isOffline,
          registration,
          update: () => Promise.resolve(),
          skipWaiting: () => Promise.resolve()
        }
      }
    }
  }
  
  if (!isServiceWorkerSupported.value) {
    console.log('Service Worker not supported')
    return {
      provide: {
        serviceWorker: {
          isSupported: false,
          isUpdateAvailable,
          isOffline,
          registration,
          update: () => Promise.resolve(),
          skipWaiting: () => Promise.resolve()
        }
      }
    }
  }
  
  // Register service worker
  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      registration.value = reg
      console.log('Service Worker registered:', reg)
      
      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            isUpdateAvailable.value = true
            console.log('Service Worker update available')
            
            // Show update notification
            if (window.$nuxt?.$toast) {
              window.$nuxt.$toast.info(
                'Update Available',
                'A new version of the app is available.',
                {
                  action: {
                    label: 'Update',
                    onClick: () => skipWaiting()
                  }
                }
              )
            }
          }
        })
      })
      
      // Check for updates periodically
      setInterval(() => {
        reg.update()
      }, 60 * 60 * 1000) // Every hour
      
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
  
  // Update service worker
  const update = async () => {
    if (registration.value) {
      await registration.value.update()
    }
  }
  
  // Skip waiting and reload
  const skipWaiting = async () => {
    if (registration.value?.waiting) {
      registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload once the new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }
  
  // Monitor online/offline status
  window.addEventListener('online', () => {
    isOffline.value = false
    if (window.$nuxt?.$toast) {
      window.$nuxt.$toast.success('Back Online', 'Connection restored')
    }
  })
  
  window.addEventListener('offline', () => {
    isOffline.value = true
    if (window.$nuxt?.$toast) {
      window.$nuxt.$toast.warning('Offline', 'You are currently offline')
    }
  })
  
  // Register on mount
  registerServiceWorker()
  
  // Handle service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'CACHE_UPDATED') {
      console.log('Cache updated:', event.data.payload)
    }
  })
  
  return {
    provide: {
      serviceWorker: {
        isSupported: isServiceWorkerSupported.value,
        isUpdateAvailable,
        isOffline,
        registration,
        update,
        skipWaiting
      }
    }
  }
})

// Type declarations
declare module '#app' {
  interface NuxtApp {
    $serviceWorker: {
      isSupported: boolean
      isUpdateAvailable: Ref<boolean>
      isOffline: Ref<boolean>
      registration: Ref<ServiceWorkerRegistration | null>
      update: () => Promise<void>
      skipWaiting: () => Promise<void>
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $serviceWorker: {
      isSupported: boolean
      isUpdateAvailable: Ref<boolean>
      isOffline: Ref<boolean>
      registration: Ref<ServiceWorkerRegistration | null>
      update: () => Promise<void>
      skipWaiting: () => Promise<void>
    }
  }
}