import { test, expect } from '@playwright/test'
import { LoginPage, KanbanPage } from '../pages'

test.describe('Kanban Board', () => {
  let loginPage: LoginPage
  let kanbanPage: KanbanPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    kanbanPage = new KanbanPage(page)
    
    // Login before each test
    await loginPage.goto()
    await loginPage.login('lawyer@example.com', 'password123')
    await loginPage.assertLoginSuccess()
  })

  test('should display kanban board with columns', async ({ page }) => {
    await kanbanPage.goto()
    
    // Check all columns are displayed
    const columns = await kanbanPage.getColumns()
    expect(columns).toContain('intake')
    expect(columns).toContain('initial_review')
    expect(columns).toContain('investigation')
    expect(columns).toContain('draft_pleadings')
    expect(columns).toContain('filed')
    expect(columns).toContain('discovery')
    expect(columns).toContain('trial_prep')
  })

  test('should display matters in correct columns', async ({ page }) => {
    await kanbanPage.goto()
    
    // Check matters are loaded
    const intakeMatters = await kanbanPage.getMattersInColumn('intake')
    expect(intakeMatters.length).toBeGreaterThan(0)
  })

  test('should drag matter to another column', async ({ page }) => {
    await kanbanPage.goto()
    
    // Get first matter in intake column
    const intakeMatters = await kanbanPage.getMattersInColumn('intake')
    const matterId = intakeMatters[0]
    
    // Drag to initial_review column
    await kanbanPage.dragMatterToColumn(matterId, 'initial_review')
    
    // Verify matter moved
    await kanbanPage.assertMatterInColumn(matterId, 'initial_review')
    
    // Verify removed from original column
    const updatedIntakeMatters = await kanbanPage.getMattersInColumn('intake')
    expect(updatedIntakeMatters).not.toContain(matterId)
  })

  test('should prevent invalid status transitions', async ({ page }) => {
    await kanbanPage.goto()
    
    // Try to drag from intake directly to filed (invalid transition)
    const intakeMatters = await kanbanPage.getMattersInColumn('intake')
    const matterId = intakeMatters[0]
    
    await kanbanPage.dragMatterToColumn(matterId, 'filed')
    
    // Matter should still be in intake
    await kanbanPage.assertMatterInColumn(matterId, 'intake')
    
    // Should show error toast
    await kanbanPage.waitForToast('Invalid status transition')
  })

  test('should search for matters', async ({ page }) => {
    await kanbanPage.goto()
    
    // Get initial matter count
    const initialCount = await kanbanPage.getVisibleMatterCount()
    
    // Search for specific matter
    await kanbanPage.searchMatters('contract')
    
    // Should show filtered results
    const filteredCount = await kanbanPage.getVisibleMatterCount()
    expect(filteredCount).toBeLessThan(initialCount)
  })

  test('should clear search', async ({ page }) => {
    await kanbanPage.goto()
    
    // Search first
    await kanbanPage.searchMatters('contract')
    const filteredCount = await kanbanPage.getVisibleMatterCount()
    
    // Clear search
    await kanbanPage.clearSearch()
    
    // Should show all matters again
    const allCount = await kanbanPage.getVisibleMatterCount()
    expect(allCount).toBeGreaterThan(filteredCount)
  })

  test('should filter by priority', async ({ page }) => {
    await kanbanPage.goto()
    
    // Get initial count
    const initialCount = await kanbanPage.getVisibleMatterCount()
    
    // Filter by urgent priority
    await kanbanPage.filterByPriority('urgent')
    
    // Should show only urgent matters
    const urgentCount = await kanbanPage.getVisibleMatterCount()
    expect(urgentCount).toBeLessThan(initialCount)
  })

  test('should open matter details on click', async ({ page }) => {
    await kanbanPage.goto()
    
    // Get first matter
    const intakeMatters = await kanbanPage.getMattersInColumn('intake')
    const matterId = intakeMatters[0]
    
    // Click matter card
    await kanbanPage.clickMatterCard(matterId)
    
    // Should navigate to matter details
    await expect(page).toHaveURL(new RegExp(`/matters/${matterId}`))
  })

  test('should add new matter', async ({ page }) => {
    await kanbanPage.goto()
    
    // Click add matter button
    await kanbanPage.clickAddMatter()
    
    // Should navigate to create matter page
    await expect(page).toHaveURL('/matters/new')
  })

  test('should handle empty board state', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/matters', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })
    
    await kanbanPage.goto()
    
    // Should show empty state
    await kanbanPage.assertEmptyBoard()
  })

  test('should work in mobile view', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
    }
    
    await kanbanPage.goto()
    
    // Should show mobile view
    const isMobileView = await kanbanPage.isMobileView()
    expect(isMobileView).toBe(true)
    
    // Test swipe to next column
    await kanbanPage.swipeToNextColumn()
    
    // Should show next column
    // Note: This would need actual implementation to verify column change
  })

  test('should show matter details in card', async ({ page }) => {
    await kanbanPage.goto()
    
    // Get first matter details
    const intakeMatters = await kanbanPage.getMattersInColumn('intake')
    const matterId = intakeMatters[0]
    
    const details = await kanbanPage.getMatterCardDetails(matterId)
    
    // Check details are displayed
    expect(details.title).toBeTruthy()
    expect(details.caseNumber).toBeTruthy()
    expect(details.priority).toBeTruthy()
  })

  test('should handle real-time updates', async ({ page }) => {
    await kanbanPage.goto()
    
    // Get initial matters
    const initialMatters = await kanbanPage.getMattersInColumn('intake')
    
    // Simulate real-time update
    await page.evaluate(() => {
      // Trigger a real-time event
      window.dispatchEvent(new CustomEvent('matter-updated', {
        detail: { matterId: 'test-123', status: 'intake' }
      }))
    })
    
    // Wait for update
    await page.waitForTimeout(1000)
    
    // Could check for update notification or refreshed data
  })
})