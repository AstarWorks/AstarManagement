/**
 * Web Vitals Plugin
 * 
 * @description Automatically initializes Web Vitals tracking and integrates
 * with TanStack Query performance monitoring for comprehensive performance insights.
 * 
 * @author Claude
 * @created 2025-06-26
 */

export default defineNuxtPlugin(async (nuxtApp: any) => {
  // Only initialize in production or when explicitly enabled
  const enableWebVitals = process.env.NODE_ENV === 'production' || 
    process.env.NUXT_PUBLIC_ENABLE_WEB_VITALS === 'true'
  
  if (!enableWebVitals) return
  
  // Lazy load Web Vitals to reduce bundle size
  const { useWebVitals } = await import('~/composables/useWebVitals')
  
  // Initialize Web Vitals tracking
  const webVitals = useWebVitals()
  
  // Make Web Vitals available globally
  nuxtApp.provide('webVitals', webVitals)
  
  // Log initialization
  console.log('📊 Web Vitals tracking initialized')
  
  // Optional: Send metrics to analytics service
  if (process.env.NUXT_PUBLIC_ANALYTICS_ENDPOINT) {
    // Example: Send metrics to your analytics endpoint
    watch(() => webVitals.metrics.value, (metrics) => {
      // Only send complete metrics
      if (metrics.lcp !== null && metrics.fid !== null && metrics.cls !== null) {
        // Batch and send metrics
        sendMetricsToAnalytics({
          ...metrics,
          score: webVitals.performanceScore.value,
          url: window.location.href,
          timestamp: Date.now()
        })
      }
    }, { deep: true })
  }
})

/**
 * Send metrics to analytics endpoint
 */
async function sendMetricsToAnalytics(metrics: any) {
  try {
    // Use navigator.sendBeacon for reliability
    if ('sendBeacon' in navigator) {
      const data = JSON.stringify({ type: 'web-vitals', metrics })
      navigator.sendBeacon(process.env.NUXT_PUBLIC_ANALYTICS_ENDPOINT!, data)
    } else {
      // Fallback to fetch
      await fetch(process.env.NUXT_PUBLIC_ANALYTICS_ENDPOINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'web-vitals', metrics }),
        keepalive: true
      })
    }
  } catch (error) {
    console.warn('Failed to send Web Vitals metrics:', error)
  }
}