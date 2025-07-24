import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { chromium, Browser, Page } from 'playwright'

interface MemoryMetrics {
  jsHeapSizeUsed: number
  jsHeapSizeTotal: number
  nodes: number
  listeners: number
}

describe('Memory Leak Detection Tests', () => {
  let browser: Browser
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  
  // Memory thresholds
  const thresholds = {
    heapGrowthRate: 0.2,      // 20% growth is acceptable
    maxHeapSize: 100 * 1024 * 1024,  // 100MB max heap
    maxListeners: 1000,       // Max event listeners
    maxNodes: 50000,          // Max DOM nodes
  }

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--js-flags=--expose-gc']
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  async function collectMemoryMetrics(page: Page): Promise<MemoryMetrics> {
    // Force garbage collection
    await page.evaluate(() => {
      if (window.gc) {
        window.gc()
      }
    })

    await page.waitForTimeout(100)

    return await page.evaluate(() => {
      const memory = performance.memory as any
      const nodeCount = document.querySelectorAll('*').length
      
      // Count event listeners
      let listenerCount = 0
      const allElements = document.querySelectorAll('*')
      allElements.forEach((element) => {
        const listeners = (window as any).getEventListeners?.(element)
        if (listeners) {
          Object.keys(listeners).forEach(event => {
            listenerCount += listeners[event].length
          })
        }
      })

      return {
        jsHeapSizeUsed: memory.usedJSHeapSize,
        jsHeapSizeTotal: memory.totalJSHeapSize,
        nodes: nodeCount,
        listeners: listenerCount || -1 // -1 if we can't count
      }
    })
  }

  describe('Component Memory Leaks', () => {
    it('should not leak memory when mounting/unmounting components', async () => {
      const page = await browser.newPage()
      await page.goto(`${baseUrl}/test-ui-components`, { waitUntil: 'networkidle' })

      // Initial metrics
      const initialMetrics = await collectMemoryMetrics(page)
      console.log('Initial heap size:', (initialMetrics.jsHeapSizeUsed / 1024 / 1024).toFixed(2), 'MB')

      // Repeatedly mount/unmount components
      for (let i = 0; i < 10; i++) {
        // Click button to show modal/dialog
        const showButton = await page.locator('button:has-text("Show Dialog")').first()
        if (await showButton.isVisible()) {
          await showButton.click()
          await page.waitForTimeout(100)
          
          // Close modal/dialog
          const closeButton = await page.locator('button:has-text("Close")').first()
          if (await closeButton.isVisible()) {
            await closeButton.click()
            await page.waitForTimeout(100)
          }
        }
      }

      // Collect metrics after operations
      const afterMetrics = await collectMemoryMetrics(page)
      console.log('After operations heap size:', (afterMetrics.jsHeapSizeUsed / 1024 / 1024).toFixed(2), 'MB')

      // Check for memory growth
      const heapGrowth = (afterMetrics.jsHeapSizeUsed - initialMetrics.jsHeapSizeUsed) / initialMetrics.jsHeapSizeUsed
      expect(heapGrowth).toBeLessThan(thresholds.heapGrowthRate)
      
      // Check absolute heap size
      expect(afterMetrics.jsHeapSizeUsed).toBeLessThan(thresholds.maxHeapSize)

      await page.close()
    }, 60000)

    it('should not leak memory in Kanban drag and drop', async () => {
      const page = await browser.newPage()
      await page.goto(`${baseUrl}/kanban`, { waitUntil: 'networkidle' })

      const initialMetrics = await collectMemoryMetrics(page)

      // Perform multiple drag and drop operations
      for (let i = 0; i < 20; i++) {
        const card = await page.locator('.matter-card').first()
        const targetColumn = await page.locator('.kanban-column').nth((i % 3) + 1)
        
        if (await card.isVisible() && await targetColumn.isVisible()) {
          await card.dragTo(targetColumn)
          await page.waitForTimeout(200)
        }
      }

      const afterMetrics = await collectMemoryMetrics(page)

      // Check memory growth
      const heapGrowth = (afterMetrics.jsHeapSizeUsed - initialMetrics.jsHeapSizeUsed) / initialMetrics.jsHeapSizeUsed
      expect(heapGrowth).toBeLessThan(thresholds.heapGrowthRate)

      // Check DOM nodes didn't grow excessively
      const nodeGrowth = afterMetrics.nodes - initialMetrics.nodes
      expect(nodeGrowth).toBeLessThan(100) // Should not create many new nodes

      await page.close()
    }, 60000)

    it('should clean up event listeners properly', async () => {
      const page = await browser.newPage()
      await page.goto(`${baseUrl}/kanban`, { waitUntil: 'networkidle' })

      // Add custom event listener tracking
      await page.evaluate(() => {
        let originalAddEventListener = EventTarget.prototype.addEventListener
        let originalRemoveEventListener = EventTarget.prototype.removeEventListener
        let listenerCount = 0

        // @ts-ignore
        window.activeListeners = new Set()

        EventTarget.prototype.addEventListener = function(type, listener, options) {
          // @ts-ignore
          window.activeListeners.add({ target: this, type, listener })
          listenerCount++
          return originalAddEventListener.call(this, type, listener, options)
        }

        EventTarget.prototype.removeEventListener = function(type, listener, options) {
          // @ts-ignore
          window.activeListeners.forEach(item => {
            if (item.target === this && item.type === type && item.listener === listener) {
              // @ts-ignore
              window.activeListeners.delete(item)
              listenerCount--
            }
          })
          return originalRemoveEventListener.call(this, type, listener, options)
        }

        // @ts-ignore
        window.getListenerCount = () => window.activeListeners.size
      })

      // Navigate between pages
      await page.goto(`${baseUrl}/matters`, { waitUntil: 'networkidle' })
      await page.goto(`${baseUrl}/kanban`, { waitUntil: 'networkidle' })
      await page.goto(`${baseUrl}/matters`, { waitUntil: 'networkidle' })

      // Check listener count
      const listenerCount = await page.evaluate(() => {
        // @ts-ignore
        return window.getListenerCount()
      })

      // Should have reasonable number of listeners
      expect(listenerCount).toBeLessThan(thresholds.maxListeners)

      await page.close()
    }, 60000)

    it('should not leak memory with real-time updates', async () => {
      const page = await browser.newPage()
      await page.goto(`${baseUrl}/kanban`, { waitUntil: 'networkidle' })

      const initialMetrics = await collectMemoryMetrics(page)

      // Simulate real-time updates
      await page.evaluate(() => {
        // Mock WebSocket updates
        for (let i = 0; i < 100; i++) {
          window.dispatchEvent(new CustomEvent('matter-update', {
            detail: {
              id: `matter-${i}`,
              status: 'IN_PROGRESS',
              title: `Updated Matter ${i}`
            }
          }))
        }
      })

      await page.waitForTimeout(2000)

      const afterMetrics = await collectMemoryMetrics(page)

      // Check memory didn't grow significantly
      const heapGrowth = (afterMetrics.jsHeapSizeUsed - initialMetrics.jsHeapSizeUsed) / initialMetrics.jsHeapSizeUsed
      expect(heapGrowth).toBeLessThan(thresholds.heapGrowthRate)

      await page.close()
    }, 60000)
  })

  describe('Store Memory Management', () => {
    it('should not accumulate data indefinitely in stores', async () => {
      const page = await browser.newPage()
      await page.goto(`${baseUrl}/matters`, { waitUntil: 'networkidle' })

      // Check initial store size
      const initialStoreSize = await page.evaluate(() => {
        // @ts-ignore
        const store = window.$nuxt?.$pinia?.state?.value
        return JSON.stringify(store || {}).length
      })

      // Perform many operations that update store
      for (let i = 0; i < 50; i++) {
        await page.evaluate((i) => {
          // Simulate store updates
          window.dispatchEvent(new CustomEvent('add-matter', {
            detail: {
              id: `temp-${i}`,
              title: `Temporary Matter ${i}`,
              status: 'DRAFT'
            }
          }))
        }, i)
      }

      await page.waitForTimeout(1000)

      // Check store size after operations
      const afterStoreSize = await page.evaluate(() => {
        // @ts-ignore
        const store = window.$nuxt?.$pinia?.state?.value
        return JSON.stringify(store || {}).length
      })

      // Store should not grow indefinitely
      const storeGrowth = (afterStoreSize - initialStoreSize) / initialStoreSize
      expect(storeGrowth).toBeLessThan(2) // Max 2x growth

      await page.close()
    }, 60000)
  })

  describe('Form Memory Management', () => {
    it('should clean up form validation and state', async () => {
      const page = await browser.newPage()
      await page.goto(`${baseUrl}/matters/new`, { waitUntil: 'networkidle' })

      const initialMetrics = await collectMemoryMetrics(page)

      // Fill and clear form multiple times
      for (let i = 0; i < 20; i++) {
        // Fill form
        await page.fill('input[name="title"]', `Test Matter ${i}`)
        await page.fill('textarea[name="description"]', `Description ${i}`.repeat(100))
        
        // Trigger validation
        await page.click('button[type="submit"]')
        await page.waitForTimeout(100)
        
        // Clear form
        await page.fill('input[name="title"]', '')
        await page.fill('textarea[name="description"]', '')
      }

      const afterMetrics = await collectMemoryMetrics(page)

      // Check memory growth
      const heapGrowth = (afterMetrics.jsHeapSizeUsed - initialMetrics.jsHeapSizeUsed) / initialMetrics.jsHeapSizeUsed
      expect(heapGrowth).toBeLessThan(thresholds.heapGrowthRate)

      await page.close()
    }, 60000)
  })

  describe('Long-running Session Memory', () => {
    it('should maintain stable memory over extended use', async () => {
      const page = await browser.newPage()
      await page.goto(baseUrl, { waitUntil: 'networkidle' })

      const measurements: MemoryMetrics[] = []

      // Simulate 5 minutes of usage
      for (let minute = 0; minute < 5; minute++) {
        // Navigate around
        await page.goto(`${baseUrl}/kanban`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(5000)
        
        await page.goto(`${baseUrl}/matters`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(5000)
        
        await page.goto(`${baseUrl}/matters/new`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(5000)
        
        // Collect metrics
        const metrics = await collectMemoryMetrics(page)
        measurements.push(metrics)
        
        console.log(`Minute ${minute + 1} heap:`, (metrics.jsHeapSizeUsed / 1024 / 1024).toFixed(2), 'MB')
      }

      // Check for memory trend
      const firstMeasurement = measurements[0]
      const lastMeasurement = measurements[measurements.length - 1]
      
      const overallGrowth = (lastMeasurement.jsHeapSizeUsed - firstMeasurement.jsHeapSizeUsed) / firstMeasurement.jsHeapSizeUsed
      
      // Should not grow more than 50% over 5 minutes
      expect(overallGrowth).toBeLessThan(0.5)
      
      // Final heap should be reasonable
      expect(lastMeasurement.jsHeapSizeUsed).toBeLessThan(thresholds.maxHeapSize)

      await page.close()
    }, 360000) // 6 minute timeout
  })
})