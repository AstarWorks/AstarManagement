import type { TestRunnerConfig } from '@storybook/test-runner'
import { getStoryContext } from '@storybook/test-runner'

const config: TestRunnerConfig = {
  setup() {
    // Global setup before all tests
    console.log('Setting up Storybook test runner...')
  },
  
  async preVisit(page, context) {
    // Setup before each story visit
    await page.setViewportSize({ width: 1200, height: 800 })
    
    // Disable animations for consistent screenshots
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
  },

  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context)
    
    // Take visual regression screenshots for specific stories
    const shouldTakeScreenshot = storyContext.parameters?.screenshot !== false
    
    if (shouldTakeScreenshot) {
      // Wait for fonts and images to load
      await page.waitForFunction(() => document.fonts.ready)
      await page.waitForLoadState('networkidle')
      
      // Take screenshot
      const screenshotName = `${context.name.replace(/\s+/g, '-').toLowerCase()}`
      
      await page.screenshot({
        path: `visual-tests/${screenshotName}.png`,
        fullPage: false,
        animations: 'disabled',
      })
    }
    
    // Run accessibility tests on all stories
    const { injectAxe, checkA11y } = await import('axe-playwright')
    await injectAxe(page)
    
    try {
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      })
    } catch (e) {
      console.warn(`Accessibility issues found in ${context.name}:`, e)
    }
  },

  // Custom test configuration
  testTimeout: 60000, // 60 seconds per test
  
  // Tags to include/exclude
  tags: {
    include: ['test'],
    exclude: ['skip-test'],
    skip: ['broken'],
  },
}

export default config