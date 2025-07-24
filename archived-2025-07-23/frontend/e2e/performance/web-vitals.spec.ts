/**
 * Web Vitals Performance E2E Tests
 * 
 * Tests Core Web Vitals and performance monitoring for legal case management workflows
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'

// Performance thresholds based on Google's Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint should be under 2.5s
  FID: 100,  // First Input Delay should be under 100ms  
  CLS: 0.1,  // Cumulative Layout Shift should be under 0.1
  FCP: 1800, // First Contentful Paint should be under 1.8s
  TTI: 3800, // Time to Interactive should be under 3.8s
  TBT: 300   // Total Blocking Time should be under 300ms
}

interface WebVitals {
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  tti?: number
  tbt?: number
}

test.describe('Core Web Vitals Performance', () => {
  let webVitals: WebVitals = {}

  test.beforeEach(async ({ page }) => {
    // Set up Web Vitals collection
    await page.addInitScript(() => {
      window.webVitals = {}
      
      // Collect LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        window.webVitals.lcp = lastEntry.startTime
      }).observe({ entryTypes: ['largest-contentful-paint'] })
      
      // Collect FID (First Input Delay)
      new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0]
        window.webVitals.fid = firstInput.processingStart - firstInput.startTime
      }).observe({ entryTypes: ['first-input'] })
      
      // Collect CLS (Cumulative Layout Shift)
      let clsValue = 0
      let sessionValue = 0
      let sessionEntries = []
      
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0]
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1]
            
            if (sessionValue && 
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value
              sessionEntries.push(entry)
            } else {
              sessionValue = entry.value
              sessionEntries = [entry]
            }
            
            if (sessionValue > clsValue) {
              clsValue = sessionValue
              window.webVitals.cls = clsValue
            }
          }
        }
      }).observe({ entryTypes: ['layout-shift'] })
      
      // Collect FCP (First Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          window.webVitals.fcp = fcpEntry.startTime
        }
      }).observe({ entryTypes: ['paint'] })
    })
  })

  test.afterEach(async ({ page }) => {
    // Collect final Web Vitals measurements
    webVitals = await page.evaluate(() => window.webVitals || {})
    
    // Log performance metrics
    console.log('Web Vitals Results:', {
      LCP: webVitals.lcp ? `${Math.round(webVitals.lcp)}ms` : 'N/A',
      FID: webVitals.fid ? `${Math.round(webVitals.fid)}ms` : 'N/A', 
      CLS: webVitals.cls ? Math.round(webVitals.cls * 1000) / 1000 : 'N/A',
      FCP: webVitals.fcp ? `${Math.round(webVitals.fcp)}ms` : 'N/A'
    })
  })

  test('dashboard should meet Core Web Vitals thresholds', async ({ page }) => {
    const helpers = createPageHelpers(page)
    
    const startTime = Date.now()
    await helpers.auth.loginAs('lawyer')
    const loginTime = Date.now() - startTime
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Allow time for vitals collection
    
    // Check login performance
    expect(loginTime).toBeLessThan(5000) // Should login within 5 seconds
    
    // Verify critical content is visible
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="navigation-menu"]')).toBeVisible()
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
    
    // Get final Web Vitals
    const vitals = await page.evaluate(() => window.webVitals || {})
    
    // Assert Core Web Vitals thresholds
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP)
    }
    if (vitals.fcp) {
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP)
    }
    if (vitals.cls) {
      expect(vitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS)
    }
  })

  test('cases list should load performantly', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    const startTime = Date.now()
    await page.goto('/cases')
    
    // Wait for cases to load
    await expect(page.locator('[data-testid="cases-list"]')).toBeVisible()
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    
    // Check for performance indicators
    const casesCount = await page.locator('[data-testid^="matter-card-"]').count()
    expect(casesCount).toBeGreaterThan(0)
    
    // Measure largest contentful paint for cases list
    const lcp = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Fallback timeout
        setTimeout(() => resolve(null), 5000)
      })
    })
    
    if (lcp) {
      expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP)
    }
  })

  test('kanban board should render efficiently', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    const startTime = Date.now()
    await page.goto('/kanban')
    
    // Wait for kanban board to render
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible()
    await expect(page.locator('[data-testid="kanban-column"]').first()).toBeVisible()
    
    const renderTime = Date.now() - startTime
    expect(renderTime).toBeLessThan(2000) // Should render within 2 seconds
    
    // Check for layout stability (CLS)
    await page.waitForTimeout(3000) // Allow time for any layout shifts
    
    const cls = await page.evaluate(() => window.webVitals?.cls || 0)
    expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS)
    
    // Test drag performance
    const dragStartTime = Date.now()
    const firstCard = page.locator('[data-testid^="matter-card-"]').first()
    const targetColumn = page.locator('[data-testid="kanban-column"]').nth(1)
    
    await firstCard.dragTo(targetColumn)
    const dragTime = Date.now() - dragStartTime
    
    expect(dragTime).toBeLessThan(500) // Drag should complete within 500ms
  })

  test('document viewer should load quickly', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/documents')
    
    // Open first document
    const startTime = Date.now()
    await page.click('[data-testid^="document-item-"]')
    
    // Wait for document viewer
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible()
    const viewerLoadTime = Date.now() - startTime
    
    expect(viewerLoadTime).toBeLessThan(3000) // Viewer should open within 3 seconds
    
    // Check document content loads
    await expect(page.locator('[data-testid="document-content"]')).toBeVisible()
    
    // Measure FID for document interaction
    await page.click('[data-testid="zoom-in-button"]')
    
    const fid = await page.evaluate(() => window.webVitals?.fid)
    if (fid) {
      expect(fid).toBeLessThan(PERFORMANCE_THRESHOLDS.FID)
    }
  })
})

test.describe('Performance Monitoring', () => {
  test('should track resource loading performance', async ({ page }) => {
    const helpers = createPageHelpers(page)
    
    // Monitor network requests
    const resourceTimings: any[] = []
    page.on('response', response => {
      resourceTimings.push({
        url: response.url(),
        status: response.status(),
        timing: response.timing()
      })
    })
    
    await helpers.auth.loginAs('lawyer')
    
    // Check critical resources loaded quickly
    const criticalResources = resourceTimings.filter(r => 
      r.url.includes('.js') || r.url.includes('.css') || r.url.includes('/api/')
    )
    
    for (const resource of criticalResources) {
      expect(resource.status).toBeLessThan(400) // No error responses
      if (resource.timing) {
        const responseTime = resource.timing.responseEnd - resource.timing.requestStart
        expect(responseTime).toBeLessThan(2000) // Respond within 2 seconds
      }
    }
  })

  test('should measure JavaScript bundle performance', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Get resource timing for JavaScript bundles
    const bundleTimings = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('.js'))
        .map(entry => ({
          name: entry.name.split('/').pop(),
          duration: entry.duration,
          transferSize: (entry as any).transferSize,
          decodedBodySize: (entry as any).decodedBodySize
        }))
    })
    
    // Check bundle sizes and load times
    for (const bundle of bundleTimings) {
      expect(bundle.duration).toBeLessThan(1000) // Load within 1 second
      
      // Main bundles shouldn't be too large
      if (bundle.name?.includes('main') || bundle.name?.includes('app')) {
        expect(bundle.transferSize).toBeLessThan(500 * 1024) // Under 500KB
      }
    }
  })

  test('should monitor memory usage', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    })
    
    if (initialMemory) {
      // Navigate through different pages to simulate usage
      await page.goto('/cases')
      await page.goto('/kanban')
      await page.goto('/documents')
      await page.goto('/dashboard')
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        }
      })
      
      // Memory shouldn't increase dramatically
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Under 50MB increase
      
      // Used memory shouldn't exceed 70% of total
      const memoryUsageRatio = finalMemory.usedJSHeapSize / finalMemory.totalJSHeapSize
      expect(memoryUsageRatio).toBeLessThan(0.7)
    }
  })

  test('should measure API response times', async ({ page }) => {
    const helpers = createPageHelpers(page)
    
    // Track API response times
    const apiTimings: Array<{url: string, duration: number}> = []
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const timing = response.timing()
        if (timing) {
          apiTimings.push({
            url: response.url(),
            duration: timing.responseEnd - timing.requestStart
          })
        }
      }
    })
    
    await helpers.auth.loginAs('lawyer')
    await page.goto('/cases')
    
    // Wait for API calls to complete
    await page.waitForLoadState('networkidle')
    
    // Check API response times
    for (const timing of apiTimings) {
      expect(timing.duration).toBeLessThan(1000) // API calls under 1 second
      
      // Critical APIs should be even faster
      if (timing.url.includes('/auth/') || timing.url.includes('/user/')) {
        expect(timing.duration).toBeLessThan(500) // Critical APIs under 500ms
      }
    }
    
    // Should have made API calls
    expect(apiTimings.length).toBeGreaterThan(0)
  })
})

test.describe('Performance Regression Testing', () => {
  test('should maintain consistent performance across browser sessions', async ({ page, browser }) => {
    const helpers = createPageHelpers(page)
    const performanceData: Array<{session: number, lcp: number, fcp: number}> = []
    
    // Test multiple browser sessions
    for (let session = 1; session <= 3; session++) {
      const context = await browser.newContext()
      const sessionPage = await context.newPage()
      const sessionHelpers = createPageHelpers(sessionPage)
      
      // Set up performance monitoring
      await sessionPage.addInitScript(() => {
        window.webVitals = {}
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          window.webVitals.lcp = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
          if (fcpEntry) {
            window.webVitals.fcp = fcpEntry.startTime
          }
        }).observe({ entryTypes: ['paint'] })
      })
      
      // Perform test workflow
      await sessionHelpers.auth.loginAs('lawyer')
      await sessionPage.waitForLoadState('networkidle')
      await sessionPage.waitForTimeout(2000)
      
      // Collect performance data
      const vitals = await sessionPage.evaluate(() => window.webVitals || {})
      if (vitals.lcp && vitals.fcp) {
        performanceData.push({
          session,
          lcp: vitals.lcp,
          fcp: vitals.fcp
        })
      }
      
      await context.close()
    }
    
    // Analyze performance consistency
    if (performanceData.length >= 2) {
      const lcpValues = performanceData.map(d => d.lcp)
      const fcpValues = performanceData.map(d => d.fcp)
      
      const lcpVariance = Math.max(...lcpValues) - Math.min(...lcpValues)
      const fcpVariance = Math.max(...fcpValues) - Math.min(...fcpValues)
      
      // Performance shouldn't vary by more than 500ms between sessions
      expect(lcpVariance).toBeLessThan(500)
      expect(fcpVariance).toBeLessThan(500)
    }
  })

  test('should perform well under load simulation', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Simulate multiple rapid interactions
    const interactions = [
      () => page.goto('/cases'),
      () => page.goto('/kanban'),
      () => page.goto('/documents'),
      () => page.goto('/dashboard'),
      () => page.click('[data-testid="user-menu-button"]'),
      () => page.keyboard.press('Escape')
    ]
    
    const startTime = Date.now()
    
    // Perform rapid interactions
    for (let i = 0; i < 5; i++) {
      for (const interaction of interactions) {
        await interaction()
        await page.waitForTimeout(100) // Small delay between interactions
      }
    }
    
    const totalTime = Date.now() - startTime
    
    // Should complete all interactions within reasonable time
    expect(totalTime).toBeLessThan(15000) // Under 15 seconds for all interactions
    
    // Check final page state is stable
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
    
    // Memory shouldn't spike during rapid interactions
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? 
        (performance as any).memory.usedJSHeapSize : null
    })
    
    if (finalMemory) {
      expect(finalMemory).toBeLessThan(100 * 1024 * 1024) // Under 100MB
    }
  })
})