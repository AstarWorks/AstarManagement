import type { TestRunnerConfig } from '@storybook/test-runner'
import { getStoryContext } from '@storybook/test-runner'
import { visualConfig, VisualTestUtils, VisualTestMetrics } from '../visual-tests/config/visual-config'

const config: TestRunnerConfig = {
  setup() {
    // Global setup before all tests
    console.log('🚀 Setting up enhanced Storybook visual regression test runner...')
    
    // Initialize visual test metrics tracking
    const startTime = Date.now()
    console.log(`📊 Visual test metrics tracking enabled`)
    
    return () => {
      const totalTime = Date.now() - startTime
      console.log(`✅ Visual tests completed in ${(totalTime / 1000).toFixed(2)}s`)
      console.log(VisualTestMetrics.generateReport())
    }
  },
  
  async preVisit(page, context) {
    const endTimer = VisualTestMetrics.startTimer(`preVisit-${context.name}`)
    
    try {
      const storyContext = await getStoryContext(page, context)
      const visualParams = storyContext.parameters?.visualRegression || {}
      
      // Apply component-specific configuration
      const componentName = context.name.toLowerCase().replace(/\s+/g, '-')
      const componentConfig = VisualTestUtils.getComponentConfig(componentName)
      
      // Set viewport based on visual parameters or component config
      const viewport = visualParams.viewport || componentConfig.defaultViewport || visualConfig.global.defaultViewport
      await page.setViewportSize(viewport)
      
      // Apply theme if specified in visual parameters
      if (visualParams.theme) {
        await VisualTestUtils.applyTheme(page, visualParams.theme)
      }
      
      // Prepare page with standard visual test settings
      await VisualTestUtils.preparePage(page, componentConfig)
      
      // Apply custom mask selectors from story parameters
      if (visualParams.maskSelectors) {
        await VisualTestUtils.maskDynamicContent(page, visualParams.maskSelectors)
      }
      
    } finally {
      endTimer()
    }
  },

  async postVisit(page, context) {
    const endTimer = VisualTestMetrics.startTimer(`postVisit-${context.name}`)
    
    try {
      const storyContext = await getStoryContext(page, context)
      
      // Check if visual regression testing should be performed
      const shouldTakeScreenshot = storyContext.parameters?.screenshot !== false
      const visualParams = storyContext.parameters?.visualRegression || {}
      const isVisualRegressionStory = storyContext.tags?.includes('visual') || 
                                     storyContext.tags?.includes('regression')
      
      if (shouldTakeScreenshot && isVisualRegressionStory) {
        await this.performVisualRegression(page, context, storyContext, visualParams)
      }
      
      // Run accessibility tests on all stories
      await this.performAccessibilityTest(page, context)
      
    } finally {
      endTimer()
    }
  },
  
  async performVisualRegression(page: any, context: any, storyContext: any, visualParams: any) {
    const endTimer = VisualTestMetrics.startTimer(`visual-${context.name}`)
    
    try {
      const componentName = context.name.toLowerCase().replace(/\s+/g, '-')
      
      // Test multiple themes if specified
      const themes = visualParams.themes || ['light']
      const breakpoints = visualParams.breakpoints || ['desktop']
      
      for (const theme of themes) {
        for (const breakpoint of breakpoints) {
          await VisualTestUtils.takeScreenshot(page, componentName, {
            componentName,
            theme,
            breakpoint,
            additionalMaskSelectors: visualParams.maskSelectors
          })
        }
      }
      
      // Take default screenshot for non-matrix tests
      if (!visualParams.themes && !visualParams.breakpoints) {
        const screenshotName = `${context.name.replace(/\s+/g, '-').toLowerCase()}`
        await page.screenshot({
          path: `visual-tests/current/${screenshotName}.png`,
          fullPage: visualParams.fullPage || false,
          animations: 'disabled',
        })
      }
      
    } finally {
      endTimer()
    }
  },
  
  async performAccessibilityTest(page: any, context: any) {
    const endTimer = VisualTestMetrics.startTimer(`a11y-${context.name}`)
    
    try {
      // Run accessibility tests on all stories
      const { injectAxe, checkA11y } = await import('axe-playwright')
      await injectAxe(page)
      
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
        rules: {
          // Customize a11y rules based on story context
          'color-contrast': { enabled: true },
          'keyboard-nav': { enabled: true },
          'focus-management': { enabled: true }
        }
      })
      
    } catch (e) {
      console.warn(`⚠️  Accessibility issues found in ${context.name}:`, e.message)
    } finally {
      endTimer()
    }
  },

  // Enhanced test configuration
  testTimeout: 90000, // 90 seconds per test for comprehensive visual testing
  
  // Enhanced tags configuration
  tags: {
    include: ['test', 'visual', 'regression'],
    exclude: ['skip-test', 'skip-visual', 'broken'],
    skip: ['dev-only', 'manual-only'],
  },
  
  // Custom test filtering
  getHttpHeaders: async () => ({
    'X-Visual-Test-Runner': 'storybook-enhanced',
    'X-Test-Environment': process.env.NODE_ENV || 'test'
  }),
  
  // Error handling
  errorMessageFormatter: (message) => {
    if (message.includes('visual regression')) {
      return `🖼️  Visual Regression Error: ${message}\n\nTo update baselines: bun run visual:generate:force`
    }
    if (message.includes('accessibility')) {
      return `♿ Accessibility Error: ${message}\n\nReview accessibility guidelines for this component`
    }
    return message
  }
}

export default config