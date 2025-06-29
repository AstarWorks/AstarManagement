/**
 * Real-time Collaboration E2E Tests
 * 
 * Tests real-time features and collaborative functionality
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'

test.describe('Real-time Collaboration', () => {
  test('should show real-time updates when another user makes changes', async ({ page, context }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await helpers.navigation.navigateToSection('kanban')

    // Simulate real-time update
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-message', {
        detail: {
          type: 'matter_updated',
          data: {
            id: 'matter-1',
            title: 'Updated by Another User',
            status: 'IN_PROGRESS'
          }
        }
      }))
    })

    // Verify real-time indicator appears
    await expect(page.locator('[data-testid="realtime-update-indicator"]')).toBeVisible()
  })

  test('should handle WebSocket connection states', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')

    // Verify connection status indicator
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected')

    // Simulate disconnect
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-disconnect'))
    })

    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Disconnected')
  })
})