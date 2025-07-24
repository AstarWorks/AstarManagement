import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { KanbanPage } from '../pages/KanbanPage'
import { MatterPage } from '../pages/MatterPage'
import { waitForNuxtReady, clearAppData, mockAPI } from '../utils/helpers'
import { MockResponses, MatterFactory } from '../fixtures/test-data'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppData(page)
    await waitForNuxtReady(page)
  })

  test.describe('Authentication Pages', () => {
    test('login page appearance', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('login-page.png')
      
      // Test different states
      await loginPage.enterCredentials('test@example.com', 'wrongpassword')
      await loginPage.submit()
      
      // Wait for error message to appear
      await page.waitForSelector('[role="alert"], .error-message', { timeout: 5000 })
      await expect(page).toHaveScreenshot('login-page-error.png')
    })

    test('login page responsive design', async ({ page }) => {
      const loginPage = new LoginPage(page)
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await loginPage.goto()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('login-page-mobile.png')
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await expect(page).toHaveScreenshot('login-page-tablet.png')
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      await expect(page).toHaveScreenshot('login-page-desktop.png')
    })
  })

  test.describe('Kanban Board', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication
      await mockAPI(page, {
        '**/api/auth/login': MockResponses.auth.success(),
        '**/api/matters': MockResponses.matters.success(),
        '**/api/matters/*': MockResponses.matters.success([new MatterFactory().create()])
      })
    })

    test('kanban board layout', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const kanbanPage = new KanbanPage(page)
      
      // Login and navigate to kanban
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      await kanbanPage.goto()
      
      // Wait for kanban to load
      await page.waitForSelector('[data-testid="kanban-board"]')
      await page.waitForLoadState('networkidle')
      
      // Take screenshot of full kanban board
      await expect(page).toHaveScreenshot('kanban-board-full.png')
      
      // Test individual columns
      const columns = await page.locator('[data-testid="kanban-column"]').all()
      for (let i = 0; i < columns.length; i++) {
        await expect(columns[i]).toHaveScreenshot(`kanban-column-${i}.png`)
      }
    })

    test('kanban board empty state', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const kanbanPage = new KanbanPage(page)
      
      // Mock empty response
      await mockAPI(page, {
        '**/api/auth/login': MockResponses.auth.success(),
        '**/api/matters': MockResponses.matters.empty()
      })
      
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      await kanbanPage.goto()
      
      await page.waitForSelector('[data-testid="kanban-board"]')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('kanban-board-empty.png')
    })

    test('kanban board with multiple matters', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const kanbanPage = new KanbanPage(page)
      
      // Create test data with multiple matters in different columns
      const testMatters = [
        new MatterFactory().create({ status: 'intake', title: 'Matter 1' }),
        new MatterFactory().create({ status: 'initial_review', title: 'Matter 2' }),
        new MatterFactory().create({ status: 'investigation', title: 'Matter 3' }),
        new MatterFactory().create({ status: 'draft_pleadings', title: 'Matter 4' }),
        new MatterFactory().create({ status: 'filed', title: 'Matter 5' })
      ]
      
      await mockAPI(page, {
        '**/api/auth/login': MockResponses.auth.success(),
        '**/api/matters': MockResponses.matters.success(testMatters)
      })
      
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      await kanbanPage.goto()
      
      await page.waitForSelector('[data-testid="kanban-board"]')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('kanban-board-populated.png')
    })

    test('kanban board mobile responsiveness', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const kanbanPage = new KanbanPage(page)
      
      await mockAPI(page, {
        '**/api/auth/login': MockResponses.auth.success(),
        '**/api/matters': MockResponses.matters.success()
      })
      
      // Mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      await kanbanPage.goto()
      
      await page.waitForSelector('[data-testid="kanban-board"]')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('kanban-board-mobile.png')
    })
  })

  test.describe('Matter Pages', () => {
    test.beforeEach(async ({ page }) => {
      await mockAPI(page, {
        '**/api/auth/login': MockResponses.auth.success(),
        '**/api/matters': MockResponses.matters.success(),
        '**/api/matters/*': MockResponses.matters.success([new MatterFactory().create()])
      })
    })

    test('matter detail page', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const matterPage = new MatterPage(page)
      
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      await matterPage.goto('matter-123')
      
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('matter-detail-page.png')
    })

    test('matter create form', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const matterPage = new MatterPage(page)
      
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      await matterPage.gotoCreate()
      
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('matter-create-form.png')
      
      // Test form with validation errors
      await matterPage.submitForm()
      await page.waitForSelector('.error-message, [role="alert"]', { timeout: 5000 })
      await expect(page).toHaveScreenshot('matter-create-form-errors.png')
    })

    test('matter edit form', async ({ page }) => {
      const loginPage = new LoginPage(page)
      const matterPage = new MatterPage(page)
      
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      await matterPage.gotoEdit('matter-123')
      
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('matter-edit-form.png')
    })
  })

  test.describe('Navigation and Layout', () => {
    test.beforeEach(async ({ page }) => {
      await mockAPI(page, {
        '**/api/auth/login': MockResponses.auth.success(),
        '**/api/matters': MockResponses.matters.success()
      })
    })

    test('navigation sidebar', async ({ page }) => {
      const loginPage = new LoginPage(page)
      
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      
      // Wait for navigation to load
      await page.waitForSelector('[data-testid="navigation"], nav')
      await page.waitForLoadState('networkidle')
      
      // Test expanded sidebar
      await expect(page.locator('[data-testid="navigation"], nav')).toHaveScreenshot('navigation-sidebar.png')
      
      // Test collapsed sidebar (if toggle exists)
      const toggleButton = page.locator('[data-testid="sidebar-toggle"], [aria-label*="toggle"], button[aria-expanded]')
      if (await toggleButton.isVisible()) {
        await toggleButton.click()
        await page.waitForTimeout(300) // Wait for animation
        await expect(page.locator('[data-testid="navigation"], nav')).toHaveScreenshot('navigation-sidebar-collapsed.png')
      }
    })

    test('header and breadcrumbs', async ({ page }) => {
      const loginPage = new LoginPage(page)
      
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      
      await page.waitForSelector('header, [role="banner"]')
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('header, [role="banner"]')).toHaveScreenshot('header-component.png')
      
      // Test breadcrumbs if they exist
      const breadcrumbs = page.locator('[aria-label*="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]')
      if (await breadcrumbs.isVisible()) {
        await expect(breadcrumbs).toHaveScreenshot('breadcrumbs-component.png')
      }
    })
  })

  test.describe('Dark Mode Theme', () => {
    test.beforeEach(async ({ page }) => {
      await mockAPI(page, {
        '**/api/auth/login': MockResponses.auth.success(),
        '**/api/matters': MockResponses.matters.success()
      })
    })

    test('dark mode appearance', async ({ page }) => {
      const loginPage = new LoginPage(page)
      
      // Enable dark mode via localStorage
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark')
        document.documentElement.classList.add('dark')
      })
      
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('dashboard-dark-mode.png')
      
      // Test kanban in dark mode
      await page.goto('/kanban')
      await page.waitForSelector('[data-testid="kanban-board"]')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('kanban-board-dark-mode.png')
    })
  })

  test.describe('Error States', () => {
    test('network error page', async ({ page }) => {
      await mockAPI(page, {
        '**/api/auth/login': MockResponses.auth.success(),
        '**/api/matters': MockResponses.matters.error('Network Error')
      })
      
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login('lawyer@example.com', 'password123')
      
      // Navigate to a page that will show the error
      await page.goto('/kanban')
      await page.waitForSelector('[role="alert"], .error-message, .error-state', { timeout: 10000 })
      
      await expect(page).toHaveScreenshot('network-error-state.png')
    })

    test('404 page not found', async ({ page }) => {
      await page.goto('/non-existent-page')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('404-not-found.png')
    })
  })
})