import { injectAxe, checkA11y } from 'axe-playwright'
import type { TestRunnerConfig } from '@storybook/test-runner'

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page)
  },
  async postVisit(page) {
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      },
      rules: {
        // Disable color contrast checks in dark mode as they can be flaky
        'color-contrast': { enabled: false }
      }
    })
  }
}

export default config