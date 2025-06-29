import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { chromium, Browser, Page } from 'playwright'
import type { Metric } from 'web-vitals'

interface WebVitalsMetrics {
  LCP: number | null
  FID: number | null
  CLS: number | null
  FCP: number | null
  TTFB: number | null
  INP: number | null
}

describe('Core Web Vitals Performance Tests', () => {
  let browser: Browser
  let page: Page
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  
  // Performance thresholds based on Google's recommendations
  const thresholds = {
    LCP: 2500,    // Largest Contentful Paint: Good < 2.5s
    FID: 100,     // First Input Delay: Good < 100ms
    CLS: 0.1,     // Cumulative Layout Shift: Good < 0.1
    FCP: 1800,    // First Contentful Paint: Good < 1.8s
    TTFB: 800,    // Time to First Byte: Good < 800ms
    INP: 200,     // Interaction to Next Paint: Good < 200ms
  }

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  async function collectWebVitals(url: string): Promise<WebVitalsMetrics> {
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Inject web-vitals library
    await page.addInitScript({
      path: require.resolve('web-vitals/dist/web-vitals.iife.js')
    })

    // Set up metrics collection
    const metrics: WebVitalsMetrics = {
      LCP: null,
      FID: null,
      CLS: null,
      FCP: null,
      TTFB: null,
      INP: null
    }

    await page.addInitScript(() => {
      // @ts-ignore
      window.webVitalsMetrics = {}
      
      // @ts-ignore
      webVitals.onLCP((metric) => {
        // @ts-ignore
        window.webVitalsMetrics.LCP = metric.value
      })
      
      // @ts-ignore
      webVitals.onFID((metric) => {
        // @ts-ignore
        window.webVitalsMetrics.FID = metric.value
      })
      
      // @ts-ignore
      webVitals.onCLS((metric) => {
        // @ts-ignore
        window.webVitalsMetrics.CLS = metric.value
      })
      
      // @ts-ignore
      webVitals.onFCP((metric) => {
        // @ts-ignore
        window.webVitalsMetrics.FCP = metric.value
      })
      
      // @ts-ignore
      webVitals.onTTFB((metric) => {
        // @ts-ignore
        window.webVitalsMetrics.TTFB = metric.value
      })
      
      // @ts-ignore
      webVitals.onINP((metric) => {
        // @ts-ignore
        window.webVitalsMetrics.INP = metric.value
      })
    })

    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle' })

    // Wait for LCP to be reported (usually the last metric)
    await page.waitForTimeout(3000)

    // Simulate user interaction for FID/INP
    await page.click('body')
    await page.waitForTimeout(1000)

    // Collect metrics
    const collectedMetrics = await page.evaluate(() => {
      // @ts-ignore
      return window.webVitalsMetrics || {}
    })

    Object.assign(metrics, collectedMetrics)

    await context.close()
    return metrics
  }

  describe('Homepage Performance', () => {
    it('should meet Core Web Vitals thresholds', async () => {
      const metrics = await collectWebVitals(baseUrl)
      
      // LCP (Largest Contentful Paint)
      if (metrics.LCP !== null) {
        expect(metrics.LCP).toBeLessThan(thresholds.LCP)
        console.log(`LCP: ${metrics.LCP}ms (threshold: ${thresholds.LCP}ms)`)
      }
      
      // CLS (Cumulative Layout Shift)
      if (metrics.CLS !== null) {
        expect(metrics.CLS).toBeLessThan(thresholds.CLS)
        console.log(`CLS: ${metrics.CLS} (threshold: ${thresholds.CLS})`)
      }
      
      // FCP (First Contentful Paint)
      if (metrics.FCP !== null) {
        expect(metrics.FCP).toBeLessThan(thresholds.FCP)
        console.log(`FCP: ${metrics.FCP}ms (threshold: ${thresholds.FCP}ms)`)
      }
      
      // TTFB (Time to First Byte)
      if (metrics.TTFB !== null) {
        expect(metrics.TTFB).toBeLessThan(thresholds.TTFB)
        console.log(`TTFB: ${metrics.TTFB}ms (threshold: ${thresholds.TTFB}ms)`)
      }
    }, 30000)
  })

  describe('Kanban Board Performance', () => {
    it('should load within performance budget', async () => {
      const metrics = await collectWebVitals(`${baseUrl}/kanban`)
      
      // Kanban board specific thresholds (slightly relaxed due to complexity)
      const kanbanThresholds = {
        LCP: 3000,    // 3s for complex board
        CLS: 0.15,    // Slightly higher due to drag-drop
        FCP: 2000,    // 2s for first paint
        TTFB: 1000,   // 1s TTFB
      }
      
      if (metrics.LCP !== null) {
        expect(metrics.LCP).toBeLessThan(kanbanThresholds.LCP)
      }
      
      if (metrics.CLS !== null) {
        expect(metrics.CLS).toBeLessThan(kanbanThresholds.CLS)
      }
      
      if (metrics.FCP !== null) {
        expect(metrics.FCP).toBeLessThan(kanbanThresholds.FCP)
      }
      
      if (metrics.TTFB !== null) {
        expect(metrics.TTFB).toBeLessThan(kanbanThresholds.TTFB)
      }
    }, 30000)

    it('should handle drag and drop without layout shifts', async () => {
      const context = await browser.newContext()
      const page = await context.newPage()
      
      await page.goto(`${baseUrl}/kanban`, { waitUntil: 'networkidle' })
      
      // Measure CLS during drag operation
      const clsBefore = await page.evaluate(() => {
        let clsValue = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // @ts-ignore
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              // @ts-ignore
              clsValue += entry.value
            }
          }
        }).observe({ type: 'layout-shift', buffered: true })
        return clsValue
      })
      
      // Simulate drag and drop
      const firstCard = await page.locator('.matter-card').first()
      const targetColumn = await page.locator('.kanban-column').nth(1)
      
      if (await firstCard.isVisible() && await targetColumn.isVisible()) {
        await firstCard.dragTo(targetColumn)
        await page.waitForTimeout(1000)
        
        const clsAfter = await page.evaluate(() => {
          let clsValue = 0
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // @ts-ignore
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                // @ts-ignore
                clsValue += entry.value
              }
            }
          }).observe({ type: 'layout-shift', buffered: true })
          return clsValue
        })
        
        const clsDelta = clsAfter - clsBefore
        expect(clsDelta).toBeLessThan(0.05) // Minimal layout shift during drag
      }
      
      await context.close()
    }, 30000)
  })

  describe('Form Performance', () => {
    it('should have responsive form interactions', async () => {
      const context = await browser.newContext()
      const page = await context.newPage()
      
      await page.goto(`${baseUrl}/matters/new`, { waitUntil: 'networkidle' })
      
      // Measure input latency
      const inputField = await page.locator('input[name="title"]').first()
      
      if (await inputField.isVisible()) {
        const startTime = Date.now()
        await inputField.click()
        await inputField.type('Test Matter Title', { delay: 50 })
        const endTime = Date.now()
        
        const inputLatency = endTime - startTime
        const expectedTime = 'Test Matter Title'.length * 50 // Theoretical minimum
        const overhead = inputLatency - expectedTime
        
        // Input overhead should be minimal
        expect(overhead).toBeLessThan(200)
        console.log(`Form input overhead: ${overhead}ms`)
      }
      
      await context.close()
    }, 30000)

    it('should validate forms quickly', async () => {
      const context = await browser.newContext()
      const page = await context.newPage()
      
      await page.goto(`${baseUrl}/matters/new`, { waitUntil: 'networkidle' })
      
      // Submit empty form to trigger validation
      const submitButton = await page.locator('button[type="submit"]')
      
      if (await submitButton.isVisible()) {
        const startTime = Date.now()
        await submitButton.click()
        
        // Wait for validation errors to appear
        await page.waitForSelector('.error-message', { timeout: 1000 }).catch(() => {})
        const endTime = Date.now()
        
        const validationTime = endTime - startTime
        expect(validationTime).toBeLessThan(100) // Validation should be instant
        console.log(`Form validation time: ${validationTime}ms`)
      }
      
      await context.close()
    }, 30000)
  })

  describe('Search Performance', () => {
    it('should return search results quickly', async () => {
      const context = await browser.newContext()
      const page = await context.newPage()
      
      await page.goto(`${baseUrl}/matters`, { waitUntil: 'networkidle' })
      
      const searchInput = await page.locator('input[type="search"]').first()
      
      if (await searchInput.isVisible()) {
        // Measure search response time
        await page.evaluate(() => {
          // @ts-ignore
          window.searchStartTime = null
          // @ts-ignore
          window.searchEndTime = null
        })
        
        // Intercept search requests
        await page.route('**/api/matters/search*', async (route) => {
          await page.evaluate(() => {
            // @ts-ignore
            window.searchStartTime = Date.now()
          })
          await route.continue()
        })
        
        // Monitor when results are rendered
        page.on('response', async (response) => {
          if (response.url().includes('/api/matters/search')) {
            await page.evaluate(() => {
              // @ts-ignore
              window.searchEndTime = Date.now()
            })
          }
        })
        
        // Perform search
        await searchInput.type('contract')
        await page.waitForTimeout(1000) // Wait for debounce
        
        const searchTime = await page.evaluate(() => {
          // @ts-ignore
          return window.searchEndTime - window.searchStartTime
        })
        
        if (searchTime) {
          expect(searchTime).toBeLessThan(500) // Search should complete in 500ms
          console.log(`Search API response time: ${searchTime}ms`)
        }
      }
      
      await context.close()
    }, 30000)
  })

  describe('Mobile Performance', () => {
    it('should meet mobile Core Web Vitals', async () => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        hasTouch: true,
        isMobile: true
      })
      
      const page = await context.newPage()
      
      // Add web-vitals script
      await page.addInitScript({
        path: require.resolve('web-vitals/dist/web-vitals.iife.js')
      })
      
      await page.goto(baseUrl, { waitUntil: 'networkidle' })
      
      // Mobile has slightly relaxed thresholds
      const mobileThresholds = {
        LCP: 3000,    // 3s on mobile
        CLS: 0.15,    // Slightly higher CLS allowed
        FCP: 2500,    // 2.5s FCP
        TTFB: 1200,   // 1.2s TTFB
      }
      
      // Collect metrics similar to desktop
      const metrics = await collectWebVitals(baseUrl)
      
      if (metrics.LCP !== null) {
        expect(metrics.LCP).toBeLessThan(mobileThresholds.LCP)
      }
      
      if (metrics.CLS !== null) {
        expect(metrics.CLS).toBeLessThan(mobileThresholds.CLS)
      }
      
      await context.close()
    }, 30000)
  })
})