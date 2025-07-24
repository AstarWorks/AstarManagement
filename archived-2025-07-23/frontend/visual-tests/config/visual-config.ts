/**
 * Visual Regression Testing Configuration
 * 
 * Centralized configuration for visual testing parameters, viewport settings,
 * and component-specific testing rules for the Nuxt.js POC.
 */

import type { Page } from '@playwright/test'

export interface VisualTestConfig {
  /** Global settings for all visual tests */
  global: {
    /** Default viewport for desktop testing */
    defaultViewport: { width: number; height: number }
    /** Animation settings */
    animations: 'disabled' | 'allow'
    /** Wait for fonts to load */
    waitForFonts: boolean
    /** Wait for network idle state */
    waitForNetworkIdle: boolean
    /** Default timeout for operations */
    timeout: number
    /** Global comparison threshold (0-1) */
    threshold: number
    /** Maximum allowed different pixels */
    maxDiffPixels: number
  }
  
  /** Responsive breakpoint configurations */
  breakpoints: Record<string, { width: number; height: number; name: string }>
  
  /** Theme variations to test */
  themes: Array<{
    name: string
    class: string
    storageState?: Record<string, string>
  }>
  
  /** Component-specific overrides */
  componentOverrides: Record<string, Partial<VisualTestConfig['global']>>
  
  /** Selectors to mask during testing */
  maskSelectors: string[]
  
  /** Browsers to test against */
  browsers: Array<{
    name: string
    enabled: boolean
    deviceEmulation?: string
  }>
}

export const visualConfig: VisualTestConfig = {
  global: {
    defaultViewport: { width: 1200, height: 800 },
    animations: 'disabled',
    waitForFonts: true,
    waitForNetworkIdle: true,
    timeout: 30000,
    threshold: 0.1, // 10% difference threshold
    maxDiffPixels: 100
  },
  
  breakpoints: {
    mobile: { width: 375, height: 667, name: 'iPhone SE' },
    tablet: { width: 768, height: 1024, name: 'iPad' },
    desktop: { width: 1024, height: 768, name: 'Desktop' },
    wide: { width: 1440, height: 900, name: 'Wide Desktop' },
    ultrawide: { width: 1920, height: 1080, name: 'Ultra Wide' }
  },
  
  themes: [
    {
      name: 'light',
      class: 'light',
      storageState: { 'color-scheme': 'light' }
    },
    {
      name: 'dark',
      class: 'dark',
      storageState: { 'color-scheme': 'dark' }
    },
    {
      name: 'high-contrast',
      class: 'light high-contrast',
      storageState: { 'color-scheme': 'light', 'contrast': 'high' }
    }
  ],
  
  componentOverrides: {
    // Kanban board requires more time for rendering
    'kanban-board': {
      timeout: 45000,
      maxDiffPixels: 200,
      threshold: 0.15
    },
    
    // Form components are sensitive to text rendering
    'form-input': {
      threshold: 0.05,
      maxDiffPixels: 50
    },
    
    // Charts and dynamic content need more tolerance
    'performance-chart': {
      threshold: 0.2,
      maxDiffPixels: 300
    },
    
    // Dialogs and modals need more time for animations
    'dialog': {
      timeout: 20000,
      threshold: 0.12
    }
  },
  
  maskSelectors: [
    // Dynamic timestamps
    '[data-testid="timestamp"]',
    '[data-testid="last-updated"]',
    '.dynamic-time',
    
    // Random IDs and dynamic content
    '[data-testid="matter-id"]',
    '[data-testid="random-id"]',
    '.dynamic-content',
    
    // Performance metrics that change
    '[data-testid="performance-metric"]',
    '.metric-value',
    
    // User-specific content
    '[data-testid="user-avatar"]',
    '.user-specific',
    
    // Real-time indicators
    '.connection-status',
    '.sync-indicator',
    
    // Loading states (should be stable in tests)
    '.loading-spinner',
    '.skeleton-loading'
  ],
  
  browsers: [
    { name: 'chromium', enabled: true },
    { name: 'firefox', enabled: true },
    { name: 'webkit', enabled: true, deviceEmulation: 'iPhone 12' }
  ]
}

/**
 * Component categories for organized testing
 */
export const componentCategories = {
  'basic-ui': [
    'button', 'input', 'card', 'badge', 'alert', 'avatar',
    'checkbox', 'radio', 'switch', 'slider', 'progress'
  ],
  
  'complex-ui': [
    'dialog', 'sheet', 'popover', 'tooltip', 'dropdown-menu',
    'command', 'calendar', 'date-picker'
  ],
  
  'form-components': [
    'form-input', 'form-select', 'form-textarea', 'form-checkbox',
    'form-radio', 'form-date-picker', 'form-file-upload'
  ],
  
  'layout': [
    'app-header', 'app-sidebar', 'app-footer', 'breadcrumbs',
    'navigation', 'menu'
  ],
  
  'kanban': [
    'kanban-board', 'kanban-column', 'matter-card',
    'drag-overlay', 'column-header'
  ],
  
  'legal-specific': [
    'matter-timeline', 'case-summary', 'document-viewer',
    'client-profile', 'billing-summary'
  ],
  
  'system': [
    'error-boundary', 'loading-state', 'empty-state',
    'connection-status', 'toast-notification'
  ]
}

/**
 * Story tag configuration for visual testing
 */
export const storyTags = {
  // Include these in visual regression tests
  include: ['visual', 'regression', 'test'],
  
  // Exclude these from visual tests
  exclude: ['skip-visual', 'interactive-only', 'dev-only'],
  
  // Require manual review for visual changes
  requireReview: ['critical-ui', 'user-facing', 'public-api']
}

/**
 * Utility functions for test configuration
 */
export class VisualTestUtils {
  /**
   * Prepare page for visual testing with standard settings
   */
  static async preparePage(page: Page, overrides?: Partial<VisualTestConfig['global']>): Promise<void> {
    const config = { ...visualConfig.global, ...overrides }
    
    // Set viewport
    await page.setViewportSize(config.defaultViewport)
    
    // Disable animations
    if (config.animations === 'disabled') {
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            scroll-behavior: auto !important;
          }
        `
      })
    }
    
    // Wait for fonts
    if (config.waitForFonts) {
      await page.waitForFunction(() => document.fonts.ready)
    }
    
    // Wait for network idle
    if (config.waitForNetworkIdle) {
      await page.waitForLoadState('networkidle')
    }
  }
  
  /**
   * Apply theme to page
   */
  static async applyTheme(page: Page, themeName: string): Promise<void> {
    const theme = visualConfig.themes.find(t => t.name === themeName)
    if (!theme) {
      throw new Error(`Theme "${themeName}" not found`)
    }
    
    // Apply theme class to html element
    await page.locator('html').setAttribute('class', theme.class)
    
    // Set storage state if defined
    if (theme.storageState) {
      for (const [key, value] of Object.entries(theme.storageState)) {
        await page.evaluate(
          ({ key, value }) => localStorage.setItem(key, value),
          { key, value }
        )
      }
    }
    
    // Wait for theme changes to apply
    await page.waitForTimeout(100)
  }
  
  /**
   * Mask dynamic content for consistent screenshots
   */
  static async maskDynamicContent(page: Page, additionalSelectors: string[] = []): Promise<void> {
    const allSelectors = [...visualConfig.maskSelectors, ...additionalSelectors]
    
    for (const selector of allSelectors) {
      await page.locator(selector).evaluateAll(elements => {
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.visibility = 'hidden'
          }
        })
      }).catch(() => {
        // Ignore if selector doesn't exist
      })
    }
  }
  
  /**
   * Get component-specific configuration
   */
  static getComponentConfig(componentName: string): Partial<VisualTestConfig['global']> {
    return visualConfig.componentOverrides[componentName] || {}
  }
  
  /**
   * Take screenshot with proper preparation
   */
  static async takeScreenshot(
    page: Page, 
    name: string, 
    options?: {
      componentName?: string
      theme?: string
      breakpoint?: string
      fullPage?: boolean
      additionalMaskSelectors?: string[]
    }
  ): Promise<void> {
    const config = options?.componentName 
      ? this.getComponentConfig(options.componentName)
      : {}
    
    // Apply theme if specified
    if (options?.theme) {
      await this.applyTheme(page, options.theme)
    }
    
    // Set breakpoint viewport if specified
    if (options?.breakpoint) {
      const breakpoint = visualConfig.breakpoints[options.breakpoint]
      if (breakpoint) {
        await page.setViewportSize({ 
          width: breakpoint.width, 
          height: breakpoint.height 
        })
      }
    }
    
    // Prepare page for screenshot
    await this.preparePage(page, config)
    
    // Mask dynamic content
    await this.maskDynamicContent(page, options?.additionalMaskSelectors)
    
    // Generate screenshot path
    const basePath = 'visual-tests/current'
    const themeSegment = options?.theme ? `-${options.theme}` : ''
    const breakpointSegment = options?.breakpoint ? `-${options.breakpoint}` : ''
    const screenshotPath = `${basePath}/${name}${themeSegment}${breakpointSegment}.png`
    
    // Take screenshot
    await page.screenshot({
      path: screenshotPath,
      fullPage: options?.fullPage || false,
      animations: 'disabled',
      threshold: config.threshold || visualConfig.global.threshold
    })
  }
  
  /**
   * Test component across multiple configurations
   */
  static async testComponentMatrix(
    page: Page,
    componentName: string,
    options?: {
      themes?: string[]
      breakpoints?: string[]
      additionalMaskSelectors?: string[]
    }
  ): Promise<void> {
    const themes = options?.themes || ['light', 'dark']
    const breakpoints = options?.breakpoints || ['mobile', 'desktop']
    
    for (const theme of themes) {
      for (const breakpoint of breakpoints) {
        await this.takeScreenshot(page, componentName, {
          componentName,
          theme,
          breakpoint,
          additionalMaskSelectors: options?.additionalMaskSelectors
        })
      }
    }
  }
}

/**
 * Performance monitoring for visual tests
 */
export class VisualTestMetrics {
  private static metrics: Array<{
    name: string
    duration: number
    timestamp: Date
    screenshotSize?: number
  }> = []
  
  static startTimer(name: string): () => void {
    const start = Date.now()
    
    return () => {
      const duration = Date.now() - start
      this.metrics.push({
        name,
        duration,
        timestamp: new Date()
      })
    }
  }
  
  static getMetrics(): typeof VisualTestMetrics.metrics {
    return [...this.metrics]
  }
  
  static getAverageTime(testPattern: string): number {
    const matching = this.metrics.filter(m => m.name.includes(testPattern))
    if (matching.length === 0) return 0
    
    const total = matching.reduce((sum, m) => sum + m.duration, 0)
    return total / matching.length
  }
  
  static getSlowestTests(count = 10): typeof VisualTestMetrics.metrics {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count)
  }
  
  static generateReport(): string {
    const total = this.metrics.length
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    const averageTime = totalTime / total
    const slowest = this.getSlowestTests(5)
    
    return `
Visual Test Performance Report
============================
Total Tests: ${total}
Total Time: ${(totalTime / 1000).toFixed(2)}s
Average Time: ${(averageTime / 1000).toFixed(2)}s

Slowest Tests:
${slowest.map(m => `  ${m.name}: ${(m.duration / 1000).toFixed(2)}s`).join('\n')}
`
  }
}

export default visualConfig