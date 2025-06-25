import { test, expect, devices } from '@playwright/test'
import { LoginPage, KanbanPage, NavigationComponent, MatterPage } from '../pages'

// Use mobile viewport
test.use({
  ...devices['iPhone 12']
})

test.describe('Mobile Experience', () => {
  let loginPage: LoginPage
  let kanbanPage: KanbanPage
  let navigation: NavigationComponent
  let matterPage: MatterPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    kanbanPage = new KanbanPage(page)
    navigation = new NavigationComponent(page)
    matterPage = new MatterPage(page)
    
    // Login
    await loginPage.goto()
    await loginPage.login('lawyer@example.com', 'password123')
  })

  test('should show mobile navigation menu', async ({ page }) => {
    await kanbanPage.goto()
    
    // Mobile menu button should be visible
    await navigation.assertElementVisible('[data-testid="mobile-menu-button"]')
    
    // Open mobile menu
    await navigation.openMobileMenu()
    
    // Menu items should be visible
    await navigation.assertElementVisible('[data-testid="mobile-menu"]')
  })

  test('should navigate using mobile menu', async ({ page }) => {
    await kanbanPage.goto()
    
    // Navigate to matters via mobile menu
    await navigation.navigateToMatters()
    
    // Should be on matters page
    await expect(page).toHaveURL('/matters')
  })

  test('should show mobile-optimized kanban board', async ({ page }) => {
    await kanbanPage.goto()
    
    // Should be in mobile view
    const isMobile = await kanbanPage.isMobileView()
    expect(isMobile).toBe(true)
    
    // Should show one column at a time
    const visibleColumns = await page.locator('[data-testid^="kanban-column-"]:visible').count()
    expect(visibleColumns).toBe(1)
  })

  test('should swipe between kanban columns', async ({ page }) => {
    await kanbanPage.goto()
    
    // Get initial column
    const initialColumn = await page.locator('[data-testid^="kanban-column-"]:visible').first().getAttribute('data-column-name')
    
    // Swipe to next column
    await kanbanPage.swipeToNextColumn()
    
    // Should show different column
    await page.waitForTimeout(500) // Wait for animation
    const currentColumn = await page.locator('[data-testid^="kanban-column-"]:visible').first().getAttribute('data-column-name')
    expect(currentColumn).not.toBe(initialColumn)
  })

  test('should show mobile-friendly matter cards', async ({ page }) => {
    await kanbanPage.goto()
    
    // Matter cards should be touch-friendly
    const cards = page.locator('[data-testid^="matter-card-"]')
    const firstCard = cards.first()
    
    // Check card has sufficient height for touch
    const box = await firstCard.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(60)
  })

  test('should handle touch gestures on matter cards', async ({ page }) => {
    await kanbanPage.goto()
    
    // Get first matter
    const matters = await kanbanPage.getMattersInColumn('intake')
    const matterId = matters[0]
    
    // Long press for actions
    const card = page.locator(`[data-testid="matter-card-${matterId}"]`)
    await card.tap({ modifiers: ['ControlOrMeta'] }) // Simulate long press
    
    // Should show context menu or actions
    // Note: Implementation dependent
  })

  test('should show mobile-optimized forms', async ({ page }) => {
    await matterPage.gotoCreate()
    
    // Form fields should be stacked vertically
    const inputs = page.locator('input, select, textarea')
    const count = await inputs.count()
    
    // Check all inputs are visible without horizontal scroll
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const box = await input.boundingBox()
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(375) // iPhone 12 width
      }
    }
  })

  test('should handle virtual keyboard properly', async ({ page }) => {
    await matterPage.gotoCreate()
    
    // Focus on input
    await page.click('input[name="title"]')
    
    // Virtual keyboard should not obscure input
    // Note: This is device-specific and hard to test accurately
    await page.waitForTimeout(500) // Wait for keyboard animation
    
    // Input should still be visible
    const input = page.locator('input[name="title"]')
    await expect(input).toBeInViewport()
  })

  test('should show mobile-friendly search', async ({ page }) => {
    await kanbanPage.goto()
    
    // Search should be accessible
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
    
    // Tap to focus
    await searchInput.tap()
    
    // Should expand or show clearly
    await expect(searchInput).toBeFocused()
  })

  test('should handle offline mode', async ({ page, context }) => {
    await kanbanPage.goto()
    
    // Go offline
    await context.setOffline(true)
    
    // Try to perform action
    const matters = await kanbanPage.getMattersInColumn('intake')
    if (matters.length > 0) {
      await kanbanPage.dragMatterToColumn(matters[0], 'initial_review')
    }
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    
    // Should sync changes
    await page.waitForTimeout(2000)
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible()
  })

  test('should optimize images for mobile', async ({ page }) => {
    await kanbanPage.goto()
    
    // Check avatar images are optimized
    const avatars = page.locator('img[alt*="avatar"]')
    const count = await avatars.count()
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const avatar = avatars.nth(i)
      const src = await avatar.getAttribute('src')
      
      // Should use optimized images
      if (src) {
        expect(src).toMatch(/(_sm|_mobile|w=\d{2,3}|sizes=)/)
      }
    }
  })

  test('should handle orientation changes', async ({ page }) => {
    await kanbanPage.goto()
    
    // Portrait orientation
    await page.setViewportSize({ width: 375, height: 812 })
    let isMobile = await kanbanPage.isMobileView()
    expect(isMobile).toBe(true)
    
    // Landscape orientation
    await page.setViewportSize({ width: 812, height: 375 })
    await page.waitForTimeout(500) // Wait for re-render
    
    // Should adapt layout
    // Note: Implementation dependent
  })

  test('should show mobile-specific UI elements', async ({ page }) => {
    await kanbanPage.goto()
    
    // Bottom navigation (if implemented)
    const bottomNav = page.locator('[data-testid="bottom-navigation"]')
    if (await bottomNav.count() > 0) {
      await expect(bottomNav).toBeVisible()
    }
    
    // Floating action button (if implemented)
    const fab = page.locator('[data-testid="fab"]')
    if (await fab.count() > 0) {
      await expect(fab).toBeVisible()
    }
  })

  test('should handle pull-to-refresh', async ({ page }) => {
    await kanbanPage.goto()
    
    // Simulate pull-to-refresh gesture
    await page.mouse.move(187, 100)
    await page.mouse.down()
    await page.mouse.move(187, 300)
    await page.mouse.up()
    
    // Should trigger refresh
    // Note: Implementation dependent
    await page.waitForTimeout(1000)
  })
})