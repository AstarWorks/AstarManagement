import type { Page, Locator } from '@playwright/test'

/**
 * Utility functions for visual regression testing
 */

export interface VisualTestOptions {
  /** Mask dynamic content like timestamps */
  mask?: string[]
  /** Custom threshold for pixel differences */
  threshold?: number
  /** Maximum allowed pixel difference */
  maxDiffPixels?: number
  /** Animation handling */
  animations?: 'disabled' | 'allow'
}

/**
 * Prepare page for consistent visual testing
 */
export async function preparePageForVisual(page: Page, options: VisualTestOptions = {}) {
  // Disable animations by default
  if (options.animations !== 'allow') {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    })
  }

  // Wait for fonts to load
  await page.waitForFunction(() => document.fonts.ready)

  // Wait for images to load
  await page.waitForFunction(() => {
    const images = Array.from(document.images)
    return images.every(img => img.complete)
  }, { timeout: 10000 }).catch(() => {
    // Continue if some images fail to load
  })

  // Wait for any loading states to complete
  await page.waitForLoadState('networkidle')
}

/**
 * Hide dynamic content for consistent screenshots
 */
export async function hideDynamicContent(page: Page) {
  await page.addStyleTag({
    content: `
      [data-testid="timestamp"],
      [data-testid="last-updated"],
      [data-testid="current-time"],
      .timestamp,
      .last-modified,
      .creation-date {
        visibility: hidden !important;
      }
    `
  })
}

/**
 * Set fixed viewport for consistent testing
 */
export async function setStandardViewport(page: Page, device: 'desktop' | 'tablet' | 'mobile' = 'desktop') {
  const viewports = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }

  await page.setViewportSize(viewports[device])
}

/**
 * Wait for component to be ready for visual testing
 */
export async function waitForComponentReady(page: Page, selector: string) {
  const element = page.locator(selector)
  
  // Wait for element to be visible
  await element.waitFor({ state: 'visible' })
  
  // Wait for any loading states within the component
  await page.waitForSelector(`${selector} [data-testid="loading"], ${selector} .loading`, { 
    state: 'hidden',
    timeout: 5000 
  }).catch(() => {
    // Continue if no loading states found
  })
  
  // Wait for layout to stabilize
  await page.waitForTimeout(100)
}

/**
 * Take screenshot with consistent settings
 */
export async function takeStandardScreenshot(page: Page, name: string, options: VisualTestOptions = {}) {
  await preparePageForVisual(page, options)
  
  const screenshotOptions = {
    fullPage: true,
    animations: 'disabled' as const,
    threshold: options.threshold || 0.1,
    maxDiffPixels: options.maxDiffPixels,
  }

  if (options.mask && options.mask.length > 0) {
    const maskLocators = options.mask.map(selector => page.locator(selector))
    return await page.screenshot({
      ...screenshotOptions,
      mask: maskLocators,
      path: `e2e/visual-tests/${name}.png`
    })
  }

  return await page.screenshot({
    ...screenshotOptions,
    path: `e2e/visual-tests/${name}.png`
  })
}

/**
 * Compare specific component visual state
 */
export async function compareComponent(
  locator: Locator, 
  name: string, 
  options: VisualTestOptions = {}
) {
  const page = locator.page()
  await waitForComponentReady(page, await locator.getAttribute('data-testid') || 'component')
  
  await locator.screenshot({
    animations: 'disabled' as const,
    path: `e2e/visual-tests/components/${name}.png`
  })
  return `e2e/visual-tests/components/${name}.png`
}

/**
 * Test responsive design across breakpoints
 */
export async function testResponsiveBreakpoints(
  page: Page, 
  testName: string,
  customBreakpoints?: { name: string; width: number; height: number }[]
) {
  const breakpoints = customBreakpoints || [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'wide', width: 2560, height: 1440 }
  ]

  const screenshots: string[] = []

  for (const breakpoint of breakpoints) {
    await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
    await page.waitForTimeout(200) // Allow layout to adjust
    await preparePageForVisual(page)
    
    const screenshotPath = `e2e/visual-tests/responsive/${testName}-${breakpoint.name}.png`
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true,
      animations: 'disabled' as const
    })
    screenshots.push(screenshotPath)
  }

  return screenshots
}

/**
 * Test dark/light theme variations
 */
export async function testThemeVariations(page: Page, testName: string) {
  const themes = ['light', 'dark']
  const screenshots: string[] = []

  for (const theme of themes) {
    // Set theme
    await page.evaluate((themeName) => {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(themeName)
      localStorage.setItem('theme', themeName)
    }, theme)

    await page.waitForTimeout(100) // Allow theme to apply
    await preparePageForVisual(page)

    const screenshotPath = `e2e/visual-tests/themes/${testName}-${theme}.png`
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true,
      animations: 'disabled' as const
    })
    screenshots.push(screenshotPath)
  }

  return screenshots
}

/**
 * Test component states (hover, focus, disabled, etc.)
 */
export async function testComponentStates(
  locator: Locator,
  componentName: string,
  states: ('hover' | 'focus' | 'disabled' | 'active')[] = ['hover', 'focus']
) {
  const screenshots: string[] = []

  // Default state
  await compareComponent(locator, `${componentName}-default`)
  
  for (const state of states) {
    switch (state) {
      case 'hover':
        await locator.hover()
        break
      case 'focus':
        await locator.focus()
        break
      case 'disabled':
        await locator.evaluate(el => el.setAttribute('disabled', 'true'))
        break
      case 'active':
        await locator.evaluate(el => el.classList.add('active'))
        break
    }

    await locator.page().waitForTimeout(100) // Allow state to apply
    const screenshotPath = await compareComponent(locator, `${componentName}-${state}`)
    if (screenshotPath) screenshots.push(screenshotPath)

    // Reset state
    switch (state) {
      case 'disabled':
        await locator.evaluate(el => el.removeAttribute('disabled'))
        break
      case 'active':
        await locator.evaluate(el => el.classList.remove('active'))
        break
    }
  }

  return screenshots
}

/**
 * Generate visual test report
 */
export async function generateVisualReport(testResults: { name: string; status: 'passed' | 'failed' | 'diff' }[]) {
  const report = {
    timestamp: new Date().toISOString(),
    total: testResults.length,
    passed: testResults.filter(r => r.status === 'passed').length,
    failed: testResults.filter(r => r.status === 'failed').length,
    diffs: testResults.filter(r => r.status === 'diff').length,
    results: testResults
  }

  return JSON.stringify(report, null, 2)
}