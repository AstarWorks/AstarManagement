import type { Page } from '@playwright/test'

/**
 * Wait for Nuxt app to be ready
 */
export async function waitForNuxtReady(page: Page) {
  await page.waitForFunction(() => (window as any).$nuxt && (window as any).$nuxt.$router)
}

/**
 * Clear all app data
 */
export async function clearAppData(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Mock API responses
 */
export async function mockAPI(page: Page, routes: Record<string, any>) {
  for (const [pattern, response] of Object.entries(routes)) {
    await page.route(pattern, route => {
      route.fulfill(response)
    })
  }
}

/**
 * Set auth token
 */
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate(token => {
    localStorage.setItem('auth-token', token)
  }, token)
}

/**
 * Get current timestamp for unique data
 */
export function getTimestamp(): string {
  return Date.now().toString()
}

/**
 * Generate random string
 */
export function randomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({
    path: `screenshots/${name}-${timestamp}.png`,
    fullPage: true
  })
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page) {
  // Wait for any loading spinners to disappear
  await page.waitForSelector('[data-testid="loading"], .loading, .spinner', { 
    state: 'hidden',
    timeout: 30000
  }).catch(() => {
    // Ignore if no loading indicators found
  })
}

/**
 * Simulate slow network
 */
export async function simulateSlowNetwork(page: Page) {
  const client = await page.context().newCDPSession(page)
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 200 * 1024 / 8, // 200kb/s
    uploadThroughput: 100 * 1024 / 8,   // 100kb/s
    latency: 1000 // 1 second
  })
}

/**
 * Reset network conditions
 */
export async function resetNetwork(page: Page) {
  const client = await page.context().newCDPSession(page)
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0
  })
}

/**
 * Wait for WebSocket connection
 */
export async function waitForWebSocket(page: Page) {
  await page.waitForFunction(() => {
    return window.WebSocket && window.WebSocket.OPEN === 1
  }, { timeout: 10000 }).catch(() => {
    // WebSocket might not be implemented yet
  })
}

/**
 * Trigger real-time event
 */
export async function triggerRealTimeEvent(page: Page, event: string, data: any) {
  await page.evaluate(({ event, data }) => {
    window.dispatchEvent(new CustomEvent(event, { detail: data }))
  }, { event, data })
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate(selector => {
    const element = document.querySelector(selector)
    if (!element) return false
    
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }, selector)
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.evaluate(selector => {
    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, selector)
}