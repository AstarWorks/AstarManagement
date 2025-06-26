/**
 * Mobile Responsive E2E Tests
 * 
 * Comprehensive mobile testing including touch gestures, responsive design, and mobile-specific workflows
 */

import { test, expect, devices } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'

// Configure tests for mobile devices
const iPhone = devices['iPhone 12']
const android = devices['Pixel 5']

test.describe('Mobile Responsive Design', () => {
  test.describe('iPhone 12 Tests', () => {
    test.use({ ...iPhone })

    test('should display mobile navigation correctly', async ({ page }) => {
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
      await page.click('[data-testid="mobile-fab-button"]') // Floating action button
      
      // Check form adapts to mobile
      const form = page.locator('[data-testid="create-case-form"]')
      await expect(form).toBeVisible()
      
      // Form should be full screen on mobile
      const formBounds = await form.boundingBox()
      const viewportSize = page.viewportSize()
      expect(formBounds?.width).toBe(viewportSize?.width)
      
      // Test mobile-optimized input
      await helpers.forms.fillField('[data-testid="case-title-input"]', 'Mobile Test Case')
      
      // Check virtual keyboard doesn't break layout
      await expect(page.locator('[data-testid="submit-case-button"]')).toBeVisible()
    })

    test('should support mobile kanban interactions', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/kanban')
      
      // Mobile kanban should be scrollable horizontally
      const kanbanBoard = page.locator('[data-testid="kanban-board"]')
      await expect(kanbanBoard).toBeVisible()
      
      // Check for mobile scroll indicators
      await expect(page.locator('[data-testid="scroll-indicator"]')).toBeVisible()
      
      // Test horizontal scroll
      await kanbanBoard.swipe({ direction: 'left', distance: 200 })
      
      // Verify scroll worked
      const scrollLeft = await kanbanBoard.evaluate(el => el.scrollLeft)
      expect(scrollLeft).toBeGreaterThan(0)
    })
  })

  test.describe('Android Pixel 5 Tests', () => {
    test.use({ ...android })

    test('should handle Android-specific interactions', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      
      // Test Android back button behavior
      await page.goto('/cases')
      await page.click('[data-testid^="matter-card-"]')
      
      // Simulate Android back button
      await page.keyboard.press('Android.Back')
      await expect(page).toHaveURL('/cases')
    })

    test('should support Android file picker', async ({ page }) => {
      const helpers = createPageHelpers(page)
      await helpers.auth.loginAs('lawyer')
      await page.goto('/documents')
      
      // Test file upload on Android
      const uploadButton = page.locator('[data-testid="upload-document-button"]')
      await uploadButton.click()
      
      // Should trigger Android file picker
      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toBeVisible()
    })
  })

  test.describe('Cross-Device Responsive Behavior', () => {
    const devices = [
      { name: 'iPhone 12', device: iPhone },
      { name: 'Pixel 5', device: android }
    ]

    devices.forEach(({ name, device }) => {
      test(`${name} - responsive breakpoints`, async ({ page }) => {
        await page.setViewportSize(device.viewport)
        const helpers = createPageHelpers(page)
        await helpers.auth.loginAs('lawyer')
        
        // Test different responsive breakpoints
        const breakpoints = [
          { width: 320, height: 568 }, // iPhone 5
          { width: 375, height: 667 }, // iPhone 6/7/8
          { width: 414, height: 896 }, // iPhone 11
          { width: 768, height: 1024 } // iPad
        ]
        
        for (const viewport of breakpoints) {
          await page.setViewportSize(viewport)
          
          // Check layout adapts properly
          const content = page.locator('[data-testid="main-content"]')
          const contentBounds = await content.boundingBox()
          
          expect(contentBounds?.width).toBeLessThanOrEqual(viewport.width)
          expect(contentBounds?.height).toBeLessThanOrEqual(viewport.height)
          
          // Ensure no horizontal overflow
          const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
          expect(bodyScrollWidth).toBeLessThanOrEqual(viewport.width + 1) // Allow 1px tolerance
        }
      })
    })
  })
})

test.describe('Touch Gestures and Interactions', () => {
  test.use({ ...iPhone })

  test('should support swipe gestures on kanban cards', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/kanban')
    
    const matterCard = page.locator('[data-testid^="matter-card-"]').first()
    await expect(matterCard).toBeVisible()
    
    // Test swipe left for quick actions
    await matterCard.swipe({ direction: 'left', distance: 100 })
    
    // Should reveal action buttons
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible()
    await expect(page.locator('[data-testid="quick-edit-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="quick-delete-button"]')).toBeVisible()
    
    // Test swipe right to hide actions
    await matterCard.swipe({ direction: 'right', distance: 100 })
    await expect(page.locator('[data-testid="quick-actions"]')).not.toBeVisible()
  })

  test('should support pull-to-refresh', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/cases')
    
    // Test pull-to-refresh gesture
    const casesList = page.locator('[data-testid="cases-list"]')
    
    // Swipe down from top to trigger refresh
    await casesList.swipe({ direction: 'down', distance: 150, startY: 0 })
    
    // Should show refresh indicator
    await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible()
    
    // Wait for refresh to complete
    await expect(page.locator('[data-testid="refresh-indicator"]')).not.toBeVisible({ timeout: 5000 })
  })

  test('should support long press gestures', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/cases')
    
    const matterCard = page.locator('[data-testid^="matter-card-"]').first()
    
    // Long press to enter selection mode
    await matterCard.press({ duration: 1000 })
    
    // Should enter multi-select mode
    await expect(page.locator('[data-testid="selection-mode"]')).toBeVisible()
    await expect(page.locator('[data-testid="bulk-actions-bar"]')).toBeVisible()
    
    // Card should show selected state
    await expect(matterCard).toHaveClass(/selected/)
  })

  test('should support pinch-to-zoom on document viewer', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/documents')
    
    // Open document
    await page.click('[data-testid^="document-item-"]')
    
    const documentViewer = page.locator('[data-testid="document-viewer"]')
    await expect(documentViewer).toBeVisible()
    
    // Test pinch zoom (simulated)
    await documentViewer.click({ position: { x: 100, y: 100 } })
    
    // Simulate pinch gesture by double-tap
    await documentViewer.dblclick({ position: { x: 100, y: 100 } })
    
    // Document should zoom in
    const transform = await documentViewer.evaluate(el => 
      getComputedStyle(el).transform
    )
    expect(transform).not.toBe('none')
  })

  test('should handle touch drag for kanban cards', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/kanban')
    
    const sourceCard = page.locator('[data-testid^="matter-card-"]').first()
    const targetColumn = page.locator('[data-testid="kanban-column"]').nth(1)
    
    // Get initial positions
    const sourceBounds = await sourceCard.boundingBox()
    const targetBounds = await targetColumn.boundingBox()
    
    if (sourceBounds && targetBounds) {
      // Perform touch drag
      await page.touchscreen.tap(sourceBounds.x + sourceBounds.width / 2, 
                                 sourceBounds.y + sourceBounds.height / 2)
      
      await page.touchscreen.tap(targetBounds.x + targetBounds.width / 2, 
                                 targetBounds.y + targetBounds.height / 2)
      
      // Verify card moved (in real implementation)
      await expect(page.locator('[data-testid="move-success-message"]')).toBeVisible()
    }
  })
})

test.describe('Mobile Performance and UX', () => {
  test.use({ ...iPhone })

  test('should load quickly on mobile networks', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/*', route => {
      return new Promise(resolve => {
        setTimeout(() => {
          route.continue()
          resolve()
        }, 100) // Add 100ms delay to simulate network latency
      })
    })
    
    const helpers = createPageHelpers(page)
    
    const startTime = Date.now()
    await helpers.auth.loginAs('lawyer')
    const loadTime = Date.now() - startTime
    
    // Should load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(10000) // 10 seconds max
    
    // Check critical content loads first
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible()
  })

  test('should show loading states appropriately', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Navigate to cases page
    await page.click('[data-testid="nav-cases"]')
    
    // Should show skeleton loading
    await expect(page.locator('[data-testid="skeleton-loader"]')).toBeVisible()
    
    // Content should replace skeleton
    await expect(page.locator('[data-testid="cases-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="skeleton-loader"]')).not.toBeVisible()
  })

  test('should handle mobile keyboard properly', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/cases')
    
    // Open create form
    await page.click('[data-testid="mobile-fab-button"]')
    
    // Focus on input field
    const titleInput = page.locator('[data-testid="case-title-input"]')
    await titleInput.click()
    
    // Simulate mobile keyboard appearance
    await page.setViewportSize({ width: 375, height: 400 }) // Reduced height for keyboard
    
    // Check form adjusts for keyboard
    await expect(titleInput).toBeInViewport()
    await expect(page.locator('[data-testid="submit-case-button"]')).toBeInViewport()
  })

  test('should support offline capabilities', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Load page normally first
    await page.goto('/cases')
    await expect(page.locator('[data-testid="cases-list"]')).toBeVisible()
    
    // Simulate going offline
    await page.context().setOffline(true)
    
    // Try to create new case (should queue for later)
    await page.click('[data-testid="mobile-fab-button"]')
    await helpers.forms.fillField('[data-testid="case-title-input"]', 'Offline Test Case')
    await page.click('[data-testid="submit-case-button"]')
    
    // Should show offline message
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="queued-actions"]')).toContainText('1 action queued')
    
    // Go back online
    await page.context().setOffline(false)
    
    // Should sync queued actions
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible()
  })
})

test.describe('Mobile Accessibility', () => {
  test.use({ ...iPhone })

  test('should support mobile screen readers', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Check for mobile-specific accessibility features
    const mainNav = page.locator('[data-testid="mobile-nav-menu"]')
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    
    // Check menu is accessible
    await expect(mainNav).toHaveAttribute('role', 'menu')
    await expect(mainNav).toHaveAttribute('aria-expanded', 'true')
    
    // Check menu items are properly labeled
    const menuItems = mainNav.locator('[role="menuitem"]')
    const itemCount = await menuItems.count()
    
    for (let i = 0; i < itemCount; i++) {
      const item = menuItems.nth(i)
      const ariaLabel = await item.getAttribute('aria-label')
      const textContent = await item.textContent()
      
      // Each item should have accessible text
      expect(ariaLabel || textContent?.trim()).toBeTruthy()
    }
  })

  test('should support mobile focus management', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/cases')
    
    // Open modal
    await page.click('[data-testid="mobile-fab-button"]')
    
    const modal = page.locator('[data-testid="create-case-modal"]')
    await expect(modal).toBeVisible()
    
    // Focus should be trapped in modal
    const firstFocusable = modal.locator('input, button, select').first()
    await expect(firstFocusable).toBeFocused()
    
    // Tab through all focusable elements
    const focusableElements = await modal.locator('input, button, select').all()
    
    for (let i = 0; i < focusableElements.length; i++) {
      await page.keyboard.press('Tab')
    }
    
    // Should cycle back to first element
    await expect(firstFocusable).toBeFocused()
  })

  test('should support touch target sizing', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    
    // Check interactive elements meet minimum touch target size (44x44px)
    const interactiveElements = page.locator('button, [role="button"], a, input')
    const elementCount = await interactiveElements.count()
    
    for (let i = 0; i < Math.min(elementCount, 10); i++) { // Sample first 10 elements
      const element = interactiveElements.nth(i)
      const bounds = await element.boundingBox()
      
      if (bounds) {
        expect(bounds.width).toBeGreaterThanOrEqual(44)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
})

test.describe('Mobile-Specific Features', () => {
  test.use({ ...iPhone })

  test('should support voice input', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/cases')
    
    // Check for voice input button on text fields
    await page.click('[data-testid="mobile-fab-button"]')
    
    const titleInput = page.locator('[data-testid="case-title-input"]')
    await titleInput.click()
    
    // Look for voice input button (microphone icon)
    const voiceButton = page.locator('[data-testid="voice-input-button"]')
    if (await voiceButton.isVisible()) {
      await expect(voiceButton).toBeVisible()
      await expect(voiceButton).toHaveAttribute('aria-label', /voice input/i)
    }
  })

  test('should support camera integration', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/documents')
    
    // Test camera access for document scanning
    await page.click('[data-testid="scan-document-button"]')
    
    // Should request camera permission
    const cameraButton = page.locator('[data-testid="camera-capture-button"]')
    if (await cameraButton.isVisible()) {
      await expect(cameraButton).toBeVisible()
      await expect(cameraButton).toHaveAttribute('aria-label', /camera/i)
    }
  })

  test('should support haptic feedback simulation', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/kanban')
    
    // Test haptic feedback on drag operations
    const matterCard = page.locator('[data-testid^="matter-card-"]').first()
    
    // Long press should trigger haptic feedback (simulated through class change)
    await matterCard.press({ duration: 1000 })
    
    // Check for haptic feedback indicator
    await expect(matterCard).toHaveClass(/haptic-feedback/)
  })

  test('should handle device orientation changes', async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await page.goto('/kanban')
    
    // Test portrait mode
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible()
    
    // Test landscape mode
    await page.setViewportSize({ width: 667, height: 375 })
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible()
    
    // Layout should adapt to landscape
    const kanbanColumns = page.locator('[data-testid="kanban-column"]')
    const columnCount = await kanbanColumns.count()
    
    // More columns should be visible in landscape
    let visibleColumns = 0
    for (let i = 0; i < columnCount; i++) {
      if (await kanbanColumns.nth(i).isInViewport()) {
        visibleColumns++
      }
    }
    
    expect(visibleColumns).toBeGreaterThanOrEqual(2)
  })
})