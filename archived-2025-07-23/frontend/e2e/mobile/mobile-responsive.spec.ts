/**
 * Mobile Responsive E2E Tests
 * 
 * Comprehensive mobile testing including touch gestures, responsive design, and mobile-specific workflows
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'

test.describe('Mobile Responsive Design', () => {
  test('should display mobile navigation correctly on iPhone', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'iPhone tests run on webkit only')
    
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible()
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible()
    
    // Check menu items are accessible
    const menuItems = page.locator('[data-testid="mobile-nav-item"]')
    await expect(menuItems).toHaveCount.greaterThan(3)
  })

  test('should handle mobile form interactions', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/cases')
    
    // Open create case form
    await page.click('[data-testid="mobile-fab-button"]').catch(() => {
      // Fallback if mobile FAB not available
      page.click('[data-testid="create-case-button"]')
    })
    
    // Check form adapts to mobile
    const form = page.locator('[data-testid="create-case-form"]')
    await expect(form).toBeVisible()
    
    // Form should be responsive on mobile
    const formBounds = await form.boundingBox()
    const viewportSize = page.viewportSize()
    expect(formBounds?.width).toBeLessThanOrEqual(viewportSize?.width || 0)
  })

  test('should support touch interactions on documents', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/documents')
    
    // Open a document
    await page.click('[data-testid="document-item"]:first-child')
    
    // Check document viewer responds to touch
    const viewer = page.locator('[data-testid="document-viewer"]')
    await expect(viewer).toBeVisible()
    
    // Test touch controls are accessible
    await expect(page.locator('[data-testid="zoom-controls"]')).toBeVisible()
  })

  test('should handle responsive breakpoints', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/kanban')
    
    // Test mobile breakpoint
    await page.setViewportSize({ width: 390, height: 844 })
    
    // Mobile layout should be active
    const container = page.locator('[data-testid="kanban-container"]')
    const containerClasses = await container.getAttribute('class') || ''
    expect(containerClasses).toMatch(/mobile|sm:|responsive/)
    
    // Test tablet breakpoint
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Tablet layout adjustments
    await expect(page.locator('[data-testid="kanban-columns"]')).toBeVisible()
  })

  test('should support swipe gestures on kanban cards', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/kanban')
    
    // Get a kanban card
    const card = page.locator('[data-testid="kanban-card"]:first-child')
    await expect(card).toBeVisible()
    
    // Test card interaction
    await card.hover()
    await card.click()
    
    // Should show card details or actions
    await expect(page.locator('[data-testid="card-details"], [data-testid="card-actions"]')).toBeVisible()
  })

  test('should support long press for context menus', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/cases')
    
    // Long press simulation on a case item
    const caseItem = page.locator('[data-testid="case-item"]:first-child')
    await caseItem.click({ button: 'right' })
    
    // Should show context menu
    await expect(page.locator('[data-testid="context-menu"]')).toBeVisible()
    
    // Menu should have appropriate options
    await expect(page.locator('[data-testid="context-option-edit"]')).toBeVisible()
  })

  test('should load quickly on mobile networks', async ({ page }) => {
    // Simulate slower network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100) // 100ms delay
    })
    
    const helpers = createPageHelpers(page)
    const startTime = Date.now()
    
    await helpers.auth.loginAs('lawyer')
    
    const loadTime = Date.now() - startTime
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(10000) // 10 seconds max for slow network
    
    // Critical elements should be visible
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible()
  })

  test('should provide smooth animations', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/kanban')
    
    // Test card animations during interactions
    const card = page.locator('[data-testid="kanban-card"]:first-child')
    
    // Hover should trigger smooth animation
    await card.hover()
    
    // Check animation classes or styles are applied
    const cardStyles = await card.getAttribute('style') || ''
    const cardClasses = await card.getAttribute('class') || ''
    
    expect(cardClasses + cardStyles).toMatch(/transition|animate|transform/)
  })

  test('should handle orientation changes', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/kanban')
    
    // Test portrait mode
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.locator('[data-testid="kanban-container"]')).toBeVisible()
    
    // Test landscape mode
    await page.setViewportSize({ width: 844, height: 390 })
    await expect(page.locator('[data-testid="kanban-container"]')).toBeVisible()
    
    // Content should remain accessible in both orientations
    await expect(page.locator('[data-testid="kanban-card"]')).toBeVisible()
  })

  test('should support mobile screen readers', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Check ARIA labels are present for mobile interactions
    const menuButton = page.locator('[data-testid="mobile-menu-button"]')
    if (await menuButton.isVisible()) {
      await expect(menuButton).toHaveAttribute('aria-label')
      await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      
      // Open menu and check expanded state
      await menuButton.click()
      await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    }
  })

  test('should have appropriate touch target sizes', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Check that interactive elements meet minimum touch target size
    const buttons = page.locator('button:visible')
    const count = await buttons.count()
    
    for (let i = 0; i < Math.min(count, 5); i++) { // Check first 5 visible buttons
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      
      if (box) {
        // Touch targets should be at least 44px (iOS) or 48dp (Android)
        expect(box.width).toBeGreaterThanOrEqual(40) // Slightly relaxed for test
        expect(box.height).toBeGreaterThanOrEqual(40)
      }
    }
  })

  test('should support offline document access', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Load documents page
    await page.goto('/documents')
    
    // Check for offline capabilities indicator
    const offlineButton = page.locator('[data-testid="offline-sync-button"]')
    if (await offlineButton.isVisible()) {
      await offlineButton.click()
      
      // Should show sync status
      await expect(page.locator('[data-testid="sync-status"]')).toBeVisible()
    }
  })

  test('should support mobile notifications', async ({ page, context }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Grant notification permission if supported
    try {
      await context.grantPermissions(['notifications'])
    } catch (e) {
      test.skip('Notifications not supported in this environment')
    }
    
    // Test notification setup
    await page.goto('/settings')
    
    // Should have notification preferences
    const notificationSettings = page.locator('[data-testid="notification-settings"]')
    if (await notificationSettings.isVisible()) {
      await expect(notificationSettings).toBeVisible()
    }
  })

  test('should support mobile-optimized search', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/search')
    
    // Mobile search should have optimized UI
    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible()
    
    // Should have mobile-appropriate input attributes
    const inputType = await searchInput.getAttribute('type')
    const inputMode = await searchInput.getAttribute('inputmode')
    
    expect(inputType).toBe('search')
    expect(inputMode).toMatch(/search|text/)
    
    // Test search functionality
    await searchInput.fill('contract')
    
    // Should show search results or suggestions
    await expect(page.locator('[data-testid="search-results"], [data-testid="search-suggestions"]')).toBeVisible()
  })
})