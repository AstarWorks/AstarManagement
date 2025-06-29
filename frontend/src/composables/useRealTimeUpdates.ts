import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import type { Ref } from 'vue'

export interface RealTimeConfig {
  endpoint: string
  interval?: number
  enabled?: boolean
  onUpdate?: (data: any) => void
  onError?: (error: Error) => void
}

/**
 * Composable for real-time updates with polling mechanism
 * Provides automatic data fetching with configurable intervals
 * 
 * @param config - Configuration for real-time updates
 * @returns Object containing reactive data, loading state, error, and control methods
 */
export function useRealTimeUpdates(config: RealTimeConfig) {
  const data = ref<any>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const lastUpdated = ref<Date | null>(null)
  
  let intervalId: NodeJS.Timeout | null = null
  
  /**
   * Fetches data from the configured endpoint
   * Handles errors and updates reactive state
   */
  const fetchData = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(config.endpoint)
      data.value = response
      lastUpdated.value = new Date()
      config.onUpdate?.(response)
    } catch (err) {
      error.value = err as Error
      config.onError?.(err as Error)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Starts the polling mechanism
   * Performs initial fetch and sets up interval
   */
  const start = () => {
    if (intervalId) return
    
    fetchData() // Initial fetch
    intervalId = setInterval(fetchData, config.interval || 30000)
  }
  
  /**
   * Stops the polling mechanism
   * Clears the interval timer
   */
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
  
  /**
   * Manually triggers a data refresh
   * Useful for user-initiated updates
   */
  const refresh = () => fetchData()
  
  // Lifecycle hooks
  onMounted(() => {
    if (config.enabled !== false) {
      start()
    }
  })
  
  onUnmounted(() => {
    stop()
  })
  
  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),
    start,
    stop,
    refresh
  }
}