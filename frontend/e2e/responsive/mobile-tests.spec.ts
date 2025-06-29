/**
 * Mobile Responsive E2E Tests
 * 
 * Tests mobile-specific functionality and responsive design
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'

test.describe('Mobile Responsive Design', () => {
  test('should adapt layout for mobile devices', async ({ page, browserName }) => {
    test.skip(!browserName.includes('Mobile'), 'Mobile-specific test')
    
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')

    // Verify mobile menu is present
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible()
  })

  test('should handle touch interactions on mobile', async ({ page, browserName }) => {
    test.skip(!browserName.includes('Mobile'), 'Mobile-specific test')
    
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await helpers.navigation.navigateToSection('kanban')

    // Test touch drag on Kanban cards
    const matterCard = page.locator('[data-testid^="matter-card-"]').first()
    
    // Perform touch drag
    await matterCard.tap()
    await page.waitForTimeout(500) // Long press simulation
    
    // Verify touch drag UI appears
    await expect(page.locator('[data-testid="touch-drag-overlay"]')).toBeVisible()
  })
})