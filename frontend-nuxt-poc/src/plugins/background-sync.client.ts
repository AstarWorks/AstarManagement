/**
 * Background Sync Plugin
 * 
 * @description Initializes background sync capabilities and integrates with
 * TanStack Query for intelligent data synchronization across the application.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import { useBackgroundSync } from '~/composables/useBackgroundSync'
import { useRealtimeSync } from '~/composables/useRealtimeSync'
import { getDefaultSyncMode } from '~/config/background-sync'

export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client side
  if (process.server) return
  
  // Initialize background sync
  const backgroundSync = useBackgroundSync()
  const realtimeSync = useRealtimeSync()
  
  // Check for saved sync mode preference
  const savedMode = localStorage.getItem('sync-mode')
  if (savedMode && ['aggressive', 'balanced', 'conservative', 'offline', 'manual'].includes(savedMode)) {
    backgroundSync.setSyncMode(savedMode as any)
  }
  
  // Auto-connect WebSocket for aggressive/balanced modes
  const currentMode = savedMode || getDefaultSyncMode()
  if (currentMode === 'aggressive' || currentMode === 'balanced') {
    // Small delay to ensure auth is ready
    setTimeout(() => {
      realtimeSync.connect()
    }, 1000)
  }
  
  // Listen for auth changes to disconnect/reconnect WebSocket
  nuxtApp.hook('auth:login', () => {
    const mode = backgroundSync.syncMode.value
    if (mode === 'aggressive' || mode === 'balanced') {
      realtimeSync.connect()
    }
  })
  
  nuxtApp.hook('auth:logout', () => {
    realtimeSync.disconnect()
  })
  
  // Provide sync utilities globally
  return {
    provide: {
      backgroundSync,
      realtimeSync
    }
  }
})

// Type augmentation
declare module '#app' {
  interface NuxtApp {
    $backgroundSync: ReturnType<typeof useBackgroundSync>
    $realtimeSync: ReturnType<typeof useRealtimeSync>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $backgroundSync: ReturnType<typeof useBackgroundSync>
    $realtimeSync: ReturnType<typeof useRealtimeSync>
  }
}