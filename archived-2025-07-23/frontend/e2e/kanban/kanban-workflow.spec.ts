/**
 * Kanban Workflow E2E Tests
 * 
 * Tests complete Kanban board functionality including drag-and-drop operations,
 * status transitions, real-time updates, and collaborative features
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'
import { getTestData } from '../utils/test-config'

test.describe('Kanban Workflow Operations', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await helpers.navigation.navigateToSection('kanban')
    await helpers.wait.waitForElement('[data-testid="kanban-board"]')
  })

  test.describe('Kanban Board Layout', () => {
    test('should display all kanban columns with proper headers', async ({ page }) => {
      const expectedColumns = ['INTAKE', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CLOSED']

      // Verify all columns are present
      for (const column of expectedColumns) {
        await expect(page.locator(`[data-testid="column-${column}"]`)).toBeVisible()
        await expect(page.locator(`[data-testid="column-header-${column}"]`)).toContainText(column.replace('_', ' '))
      }

      // Verify columns are in correct order
      const columnElements = page.locator('[data-testid^="column-"]')
      for (let i = 0; i < expectedColumns.length; i++) {
        await expect(columnElements.nth(i)).toHaveAttribute('data-testid', `column-${expectedColumns[i]}`)
      }
    })

    test('should display matter cards with complete information', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Wait for matters to load
      await helpers.wait.waitForElement('[data-testid^="matter-card-"]')

      // Get first matter card
      const firstCard = page.locator('[data-testid^="matter-card-"]').first()

      // Verify card contains all required information
      await expect(firstCard.locator('[data-testid="matter-title"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="matter-client"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="matter-priority"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="matter-due-date"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="matter-assigned-lawyer"]')).toBeVisible()

      // Verify priority indicator is styled correctly
      const priorityElement = firstCard.locator('[data-testid="matter-priority"]')
      const priorityClass = await priorityElement.getAttribute('class')
      expect(priorityClass).toMatch(/(high|medium|low)/)
    })

    test('should show column counts and statistics', async ({ page }) => {
      // Verify each column shows count
      const columns = ['INTAKE', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CLOSED']
      
      for (const column of columns) {
        const columnHeader = page.locator(`[data-testid="column-header-${column}"]`)
        const countElement = columnHeader.locator('[data-testid="column-count"]')
        
        await expect(countElement).toBeVisible()
        
        // Verify count is a number
        const countText = await countElement.textContent()
        expect(countText).toMatch(/^\d+$/)
      }

      // Verify board statistics
      await expect(page.locator('[data-testid="total-matters-count"]')).toBeVisible()
      await expect(page.locator('[data-testid="overdue-matters-count"]')).toBeVisible()
      await expect(page.locator('[data-testid="high-priority-count"]')).toBeVisible()
    })
  })

  test.describe('Drag and Drop Operations', () => {
    test('should drag matter from INTAKE to IN_PROGRESS successfully', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Find a matter in INTAKE column
      const intakeColumn = page.locator('[data-testid="column-INTAKE"]')
      const matterCard = intakeColumn.locator('[data-testid^="matter-card-"]').first()
      
      // Get matter ID for verification
      const matterId = await matterCard.getAttribute('data-testid')
      const matterIdValue = matterId?.replace('matter-card-', '') || ''

      // Get initial counts
      const initialIntakeCount = await helpers.kanban.getMattersInColumn('INTAKE')
      const initialInProgressCount = await helpers.kanban.getMattersInColumn('IN_PROGRESS')

      // Perform drag and drop
      await helpers.kanban.dragMatterToColumn(matterIdValue, 'IN_PROGRESS')

      // Verify matter moved to IN_PROGRESS column
      const inProgressColumn = page.locator('[data-testid="column-IN_PROGRESS"]')
      await expect(inProgressColumn.locator(`[data-testid="matter-card-${matterIdValue}"]`)).toBeVisible()

      // Verify matter is no longer in INTAKE column
      await expect(intakeColumn.locator(`[data-testid="matter-card-${matterIdValue}"]`)).not.toBeVisible()

      // Verify column counts updated
      const newIntakeCount = await helpers.kanban.getMattersInColumn('INTAKE')
      const newInProgressCount = await helpers.kanban.getMattersInColumn('IN_PROGRESS')

      expect(newIntakeCount.length).toBe(initialIntakeCount.length - 1)
      expect(newInProgressCount.length).toBe(initialInProgressCount.length + 1)

      // Verify success notification
      await expect(page.locator('[data-testid="status-update-notification"]')).toBeVisible()
    })

    test('should handle drag and drop with position reordering', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Get matters in IN_PROGRESS column
      const inProgressMatters = await helpers.kanban.getMattersInColumn('IN_PROGRESS')
      
      if (inProgressMatters.length < 2) {
        // Need at least 2 matters for reordering test
        test.skip('Need at least 2 matters in IN_PROGRESS for reordering test')
      }

      const firstMatterId = inProgressMatters[0]
      const secondMatterId = inProgressMatters[1]

      // Drag first matter to second position
      const firstCard = page.locator(`[data-testid="matter-card-${firstMatterId}"]`)
      const secondCard = page.locator(`[data-testid="matter-card-${secondMatterId}"]`)

      await firstCard.dragTo(secondCard, { targetPosition: { x: 0, y: 50 } })
      await helpers.kanban.waitForDragComplete()

      // Verify order changed
      const updatedMatters = await helpers.kanban.getMattersInColumn('IN_PROGRESS')
      expect(updatedMatters[0]).toBe(secondMatterId)
      expect(updatedMatters[1]).toBe(firstMatterId)
    })

    test('should validate status transition rules during drag', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Try to drag matter from COMPLETED back to INTAKE (invalid transition)
      const completedColumn = page.locator('[data-testid="column-COMPLETED"]')
      const completedMatter = completedColumn.locator('[data-testid^="matter-card-"]').first()

      if (!(await completedMatter.isVisible())) {
        test.skip('No completed matters available for transition validation test')
      }

      const matterId = await completedMatter.getAttribute('data-testid')
      const matterIdValue = matterId?.replace('matter-card-', '') || ''

      // Attempt invalid drag
      const intakeColumn = page.locator('[data-testid="column-INTAKE"]')
      await completedMatter.dragTo(intakeColumn)

      // Verify matter did not move (stays in COMPLETED)
      await expect(completedColumn.locator(`[data-testid="matter-card-${matterIdValue}"]`)).toBeVisible()
      await expect(intakeColumn.locator(`[data-testid="matter-card-${matterIdValue}"]`)).not.toBeVisible()

      // Verify error notification
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-notification"]')).toContainText('Invalid status transition')
    })

    test('should handle drag cancellation with escape key', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Start dragging a matter
      const intakeColumn = page.locator('[data-testid="column-INTAKE"]')
      const matterCard = intakeColumn.locator('[data-testid^="matter-card-"]').first()
      const matterId = await matterCard.getAttribute('data-testid')
      const matterIdValue = matterId?.replace('matter-card-', '') || ''

      // Start drag operation
      await matterCard.hover()
      await page.mouse.down()

      // Verify drag state is active
      await expect(page.locator('[data-testid="drag-overlay"]')).toBeVisible()
      await expect(matterCard).toHaveClass(/dragging/)

      // Cancel drag with escape key
      await page.keyboard.press('Escape')

      // Verify drag is cancelled
      await expect(page.locator('[data-testid="drag-overlay"]')).not.toBeVisible()
      await expect(matterCard).not.toHaveClass(/dragging/)

      // Verify matter stayed in original position
      await expect(intakeColumn.locator(`[data-testid="matter-card-${matterIdValue}"]`)).toBeVisible()
    })
  })

  test.describe('Real-time Collaboration', () => {
    test('should show drag indicators when another user is dragging', async ({ page, context }) => {
      const helpers = createPageHelpers(page)

      // Create second browser context to simulate another user
      const secondPage = await context.newPage()
      const secondHelpers = createPageHelpers(secondPage)

      try {
        // Login as different user in second context
        await secondHelpers.auth.loginAs('clerk')
        await secondHelpers.navigation.navigateToSection('kanban')

        // Simulate real-time drag event from another user
        await page.evaluate(() => {
          // Simulate WebSocket message for drag start
          window.dispatchEvent(new CustomEvent('ws-message', {
            detail: {
              type: 'drag_started',
              data: {
                matterId: 'matter-1',
                userId: 'other-user',
                userName: 'Test Clerk'
              }
            }
          }))
        })

        // Verify drag indicator appears for other user
        await expect(page.locator('[data-testid="collaborative-drag-indicator"]')).toBeVisible()
        await expect(page.locator('[data-testid="collaborative-drag-indicator"]')).toContainText('Test Clerk is moving')

        // Simulate drag end
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('ws-message', {
            detail: {
              type: 'drag_ended',
              data: {
                matterId: 'matter-1',
                userId: 'other-user'
              }
            }
          }))
        })

        // Verify indicator disappears
        await expect(page.locator('[data-testid="collaborative-drag-indicator"]')).not.toBeVisible()

      } finally {
        await secondPage.close()
      }
    })

    test('should handle concurrent drag conflicts', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Start dragging a matter
      const matterCard = page.locator('[data-testid^="matter-card-"]').first()
      const matterId = await matterCard.getAttribute('data-testid')
      const matterIdValue = matterId?.replace('matter-card-', '') || ''

      await matterCard.hover()
      await page.mouse.down()

      // Simulate another user trying to drag the same matter
      await page.evaluate((id) => {
        window.dispatchEvent(new CustomEvent('ws-message', {
          detail: {
            type: 'drag_conflict',
            data: {
              matterId: id,
              conflictingUser: 'Test Clerk',
              resolution: 'first_user_wins'
            }
          }
        }))
      }, matterIdValue)

      // Verify conflict notification
      await expect(page.locator('[data-testid="drag-conflict-notification"]')).toBeVisible()
      await expect(page.locator('[data-testid="drag-conflict-notification"]')).toContainText('Test Clerk tried to move the same matter')

      // Verify current user can continue drag
      const targetColumn = page.locator('[data-testid="column-IN_PROGRESS"]')
      await page.mouse.move(targetColumn.boundingBox()?.x || 0, targetColumn.boundingBox()?.y || 0)
      await page.mouse.up()

      // Verify drag completed successfully
      await helpers.kanban.waitForDragComplete()
    })
  })

  test.describe('Performance and Responsive Design', () => {
    test('should handle large number of matters efficiently', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Mock API to return large dataset
      await page.route('**/api/matters', route => {
        const largeMatterSet = Array.from({ length: 100 }, (_, i) => ({
          id: `matter-${i}`,
          title: `Test Matter ${i}`,
          status: ['INTAKE', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'][i % 4],
          priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
          clientName: `Client ${i}`,
          dueDate: '2025-08-15',
          createdAt: new Date().toISOString()
        }))

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeMatterSet)
        })
      })

      // Reload page to get large dataset
      await page.reload()
      await helpers.wait.waitForElement('[data-testid="kanban-board"]')

      // Measure drag performance
      const startTime = Date.now()
      
      // Perform drag operation
      const firstMatter = page.locator('[data-testid^="matter-card-"]').first()
      const matterId = await firstMatter.getAttribute('data-testid')
      const matterIdValue = matterId?.replace('matter-card-', '') || ''
      
      await helpers.kanban.dragMatterToColumn(matterIdValue, 'IN_PROGRESS')
      
      const endTime = Date.now()
      const dragDuration = endTime - startTime

      // Verify drag completed in reasonable time (< 2 seconds)
      expect(dragDuration).toBeLessThan(2000)

      // Verify UI remains responsive
      await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible()
      await expect(page.locator(`[data-testid="matter-card-${matterIdValue}"]`)).toBeVisible()
    })

    test('should work correctly on mobile devices', async ({ page, browserName }) => {
      // Only run on mobile browsers
      test.skip(!browserName.includes('Mobile'), 'Mobile-specific test')

      const helpers = createPageHelpers(page)

      // Verify mobile kanban layout
      await expect(page.locator('[data-testid="mobile-kanban-view"]')).toBeVisible()

      // Verify horizontal scrolling is enabled
      const kanbanBoard = page.locator('[data-testid="kanban-board"]')
      const isScrollable = await kanbanBoard.evaluate(el => el.scrollWidth > el.clientWidth)
      expect(isScrollable).toBe(true)

      // Test touch drag on mobile
      const matterCard = page.locator('[data-testid^="matter-card-"]').first()
      const matterId = await matterCard.getAttribute('data-testid')
      const matterIdValue = matterId?.replace('matter-card-', '') || ''

      // Perform touch drag
      await matterCard.tap()
      await page.waitForTimeout(500) // Long press
      
      const targetColumn = page.locator('[data-testid="column-IN_PROGRESS"]')
      await matterCard.dragTo(targetColumn)

      // Verify drag worked on mobile
      await expect(targetColumn.locator(`[data-testid="matter-card-${matterIdValue}"]`)).toBeVisible()
    })
  })

  test.describe('Kanban Filters and Search', () => {
    test('should filter matters by priority', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Apply high priority filter
      await page.click('[data-testid="priority-filter-button"]')
      await page.click('[data-testid="priority-filter-high"]')

      // Wait for filter to apply
      await helpers.wait.waitForApiCall('/api/matters')

      // Verify only high priority matters are shown
      const visibleCards = page.locator('[data-testid^="matter-card-"]')
      const count = await visibleCards.count()

      for (let i = 0; i < count; i++) {
        const priorityElement = visibleCards.nth(i).locator('[data-testid="matter-priority"]')
        await expect(priorityElement).toContainText('HIGH')
      }

      // Verify filter indicator is active
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('Priority: High')
    })

    test('should search matters across all columns', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Enter search term
      const searchTerm = 'contract'
      await page.fill('[data-testid="kanban-search-input"]', searchTerm)
      await page.press('[data-testid="kanban-search-input"]', 'Enter')

      // Wait for search results
      await helpers.wait.waitForApiCall('/api/matters')

      // Verify search results contain the search term
      const visibleCards = page.locator('[data-testid^="matter-card-"]')
      const count = await visibleCards.count()

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const card = visibleCards.nth(i)
          const titleText = await card.locator('[data-testid="matter-title"]').textContent()
          const clientText = await card.locator('[data-testid="matter-client"]').textContent()
          
          const containsSearch = (titleText?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (clientText?.toLowerCase().includes(searchTerm.toLowerCase()))
          expect(containsSearch).toBe(true)
        }
      }

      // Clear search
      await page.fill('[data-testid="kanban-search-input"]', '')
      await page.press('[data-testid="kanban-search-input"]', 'Enter')

      // Verify all matters are shown again
      await helpers.wait.waitForApiCall('/api/matters')
      const allCards = await page.locator('[data-testid^="matter-card-"]').count()
      expect(allCards).toBeGreaterThan(count)
    })
  })

  test.describe('Accessibility', () => {
    test('should support keyboard navigation for drag and drop', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Focus on first matter card
      const firstCard = page.locator('[data-testid^="matter-card-"]').first()
      await firstCard.focus()

      // Use keyboard to initiate drag
      await page.keyboard.press('Space')

      // Verify drag mode is activated
      await expect(page.locator('[data-testid="keyboard-drag-mode"]')).toBeVisible()
      await expect(firstCard).toHaveClass(/keyboard-dragging/)

      // Navigate to target column using arrow keys
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')

      // Drop using space
      await page.keyboard.press('Space')

      // Verify drag completed
      await helpers.kanban.waitForDragComplete()
      await expect(page.locator('[data-testid="keyboard-drag-mode"]')).not.toBeVisible()
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Verify kanban board has proper role
      await expect(page.locator('[data-testid="kanban-board"]')).toHaveAttribute('role', 'application')

      // Verify columns have proper labels
      const columns = page.locator('[data-testid^="column-"]')
      const count = await columns.count()

      for (let i = 0; i < count; i++) {
        const column = columns.nth(i)
        await expect(column).toHaveAttribute('role', 'region')
        
        const ariaLabel = await column.getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()
      }

      // Verify matter cards are accessible
      const cards = page.locator('[data-testid^="matter-card-"]')
      const cardCount = await cards.count()

      for (let i = 0; i < Math.min(cardCount, 3); i++) { // Check first 3 cards
        const card = cards.nth(i)
        await expect(card).toHaveAttribute('role', 'button')
        await expect(card).toHaveAttribute('tabindex', '0')
        
        const ariaLabel = await card.getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()
      }
    })
  })
})