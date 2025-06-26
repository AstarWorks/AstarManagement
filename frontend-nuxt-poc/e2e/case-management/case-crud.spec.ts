/**
 * Case Management CRUD E2E Tests
 * 
 * Tests complete case management workflows including creation, reading,
 * updating, and deletion of legal matters with role-based permissions
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'
import { getTestData } from '../utils/test-config'

test.describe('Case Management CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
    await helpers.navigation.navigateToSection('cases')
  })

  test.describe('Case Creation', () => {
    test('should create a new case with complete information', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Click create new case button
      await page.click('[data-testid="create-case-button"]')

      // Verify create case modal is open
      await expect(page.locator('[data-testid="create-case-modal"]')).toBeVisible()

      // Fill case information
      const caseData = {
        title: 'Personal Injury Case - John Smith',
        client: 'John Smith',
        description: 'Personal injury case involving automobile accident on Highway 101',
        priority: 'HIGH',
        dueDate: '2025-08-15',
        practiceArea: 'Personal Injury',
        estimatedHours: '40'
      }

      await helpers.forms.fillField('[data-testid="case-title-input"]', caseData.title)
      await helpers.forms.fillField('[data-testid="case-client-input"]', caseData.client)
      await helpers.forms.fillField('[data-testid="case-description-textarea"]', caseData.description)
      await page.selectOption('[data-testid="case-priority-select"]', caseData.priority)
      await helpers.forms.fillField('[data-testid="case-due-date-input"]', caseData.dueDate)
      await page.selectOption('[data-testid="case-practice-area-select"]', caseData.practiceArea)
      await helpers.forms.fillField('[data-testid="case-estimated-hours-input"]', caseData.estimatedHours)

      // Submit the form
      await page.click('[data-testid="save-case-button"]')

      // Wait for modal to close and case to appear
      await expect(page.locator('[data-testid="create-case-modal"]')).not.toBeVisible()
      
      // Verify case appears in the list
      await expect(page.locator(`[data-testid="case-row"]:has-text("${caseData.title}")`)).toBeVisible()
      
      // Verify case details are displayed correctly
      const caseRow = page.locator(`[data-testid="case-row"]:has-text("${caseData.title}")`)
      await expect(caseRow.locator('[data-testid="case-client"]')).toContainText(caseData.client)
      await expect(caseRow.locator('[data-testid="case-priority"]')).toContainText(caseData.priority)
      await expect(caseRow.locator('[data-testid="case-status"]')).toContainText('INTAKE')

      // Verify success notification
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('Case created successfully')
    })

    test('should validate required fields when creating a case', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Open create case modal
      await page.click('[data-testid="create-case-button"]')

      // Try to submit without filling required fields
      await page.click('[data-testid="save-case-button"]')

      // Verify validation errors
      await expect(page.locator('[data-testid="case-title-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="case-client-error"]')).toBeVisible()
      
      // Verify specific error messages
      await expect(page.locator('[data-testid="case-title-error"]')).toContainText('Case title is required')
      await expect(page.locator('[data-testid="case-client-error"]')).toContainText('Client name is required')

      // Verify modal remains open
      await expect(page.locator('[data-testid="create-case-modal"]')).toBeVisible()
    })

    test('should handle API errors during case creation', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Mock API failure
      await page.route('**/api/cases', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })

      // Open create case modal and fill form
      await page.click('[data-testid="create-case-button"]')
      await helpers.forms.fillField('[data-testid="case-title-input"]', 'Test Case')
      await helpers.forms.fillField('[data-testid="case-client-input"]', 'Test Client')

      // Submit form
      await page.click('[data-testid="save-case-button"]')

      // Verify error notification
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-notification"]')).toContainText('Failed to create case')

      // Verify modal remains open for retry
      await expect(page.locator('[data-testid="create-case-modal"]')).toBeVisible()
    })
  })

  test.describe('Case Reading and Listing', () => {
    test('should display case list with proper information', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Wait for cases to load
      await helpers.wait.waitForElement('[data-testid="case-list"]')

      // Verify case list headers
      await expect(page.locator('[data-testid="case-list-header"]')).toContainText('Title')
      await expect(page.locator('[data-testid="case-list-header"]')).toContainText('Client')
      await expect(page.locator('[data-testid="case-list-header"]')).toContainText('Status')
      await expect(page.locator('[data-testid="case-list-header"]')).toContainText('Priority')
      await expect(page.locator('[data-testid="case-list-header"]')).toContainText('Due Date')

      // Verify at least one case is displayed
      await expect(page.locator('[data-testid="case-row"]')).toHaveCount({ gte: 1 })

      // Verify case row contains expected information
      const firstCaseRow = page.locator('[data-testid="case-row"]').first()
      await expect(firstCaseRow.locator('[data-testid="case-title"]')).toBeVisible()
      await expect(firstCaseRow.locator('[data-testid="case-client"]')).toBeVisible()
      await expect(firstCaseRow.locator('[data-testid="case-status"]')).toBeVisible()
      await expect(firstCaseRow.locator('[data-testid="case-priority"]')).toBeVisible()
    })

    test('should open case details when clicking on a case', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Wait for cases to load
      await helpers.wait.waitForElement('[data-testid="case-list"]')

      // Click on first case
      const firstCase = page.locator('[data-testid="case-row"]').first()
      const caseTitle = await firstCase.locator('[data-testid="case-title"]').textContent()
      
      await firstCase.click()

      // Verify case details page opens
      await expect(page.locator('[data-testid="case-details"]')).toBeVisible()
      await expect(page.locator('[data-testid="case-details-title"]')).toContainText(caseTitle || '')

      // Verify case details sections are present
      await expect(page.locator('[data-testid="case-overview-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="case-timeline-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="case-documents-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="case-notes-section"]')).toBeVisible()
    })

    test('should filter cases by status', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Wait for cases to load
      await helpers.wait.waitForElement('[data-testid="case-list"]')

      // Get initial case count
      const initialCount = await page.locator('[data-testid="case-row"]').count()
      expect(initialCount).toBeGreaterThan(0)

      // Apply status filter
      await page.click('[data-testid="status-filter-dropdown"]')
      await page.click('[data-testid="status-filter-in-progress"]')

      // Wait for filter to apply
      await helpers.wait.waitForApiCall('/api/cases')

      // Verify only IN_PROGRESS cases are shown
      const caseRows = page.locator('[data-testid="case-row"]')
      const count = await caseRows.count()

      for (let i = 0; i < count; i++) {
        const statusElement = caseRows.nth(i).locator('[data-testid="case-status"]')
        await expect(statusElement).toContainText('IN_PROGRESS')
      }
    })

    test('should search cases by title and client', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Wait for cases to load
      await helpers.wait.waitForElement('[data-testid="case-list"]')

      // Enter search term
      const searchTerm = 'contract'
      await helpers.forms.fillField('[data-testid="case-search-input"]', searchTerm)

      // Wait for search results
      await helpers.wait.waitForApiCall('/api/cases')

      // Verify search results contain the search term
      const caseRows = page.locator('[data-testid="case-row"]')
      const count = await caseRows.count()

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const caseRow = caseRows.nth(i)
          const titleText = await caseRow.locator('[data-testid="case-title"]').textContent()
          const clientText = await caseRow.locator('[data-testid="case-client"]').textContent()
          
          const containsSearch = (titleText?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (clientText?.toLowerCase().includes(searchTerm.toLowerCase()))
          expect(containsSearch).toBe(true)
        }
      }
    })
  })

  test.describe('Case Updates', () => {
    test('should update case information successfully', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Navigate to first case
      await helpers.wait.waitForElement('[data-testid="case-list"]')
      await page.locator('[data-testid="case-row"]').first().click()

      // Click edit button
      await page.click('[data-testid="edit-case-button"]')

      // Verify edit modal is open
      await expect(page.locator('[data-testid="edit-case-modal"]')).toBeVisible()

      // Update case information
      const updatedTitle = 'Updated Case Title - Contract Review'
      await page.fill('[data-testid="case-title-input"]', '')
      await helpers.forms.fillField('[data-testid="case-title-input"]', updatedTitle)
      
      await page.selectOption('[data-testid="case-priority-select"]', 'LOW')

      // Save changes
      await page.click('[data-testid="save-case-button"]')

      // Verify modal closes
      await expect(page.locator('[data-testid="edit-case-modal"]')).not.toBeVisible()

      // Verify changes are reflected in case details
      await expect(page.locator('[data-testid="case-details-title"]')).toContainText(updatedTitle)
      await expect(page.locator('[data-testid="case-priority-display"]')).toContainText('LOW')

      // Verify success notification
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('Case updated successfully')
    })

    test('should update case status through workflow actions', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Navigate to case in INTAKE status
      await helpers.wait.waitForElement('[data-testid="case-list"]')
      
      // Find a case in INTAKE status or create one for testing
      const intakeCase = page.locator('[data-testid="case-row"]:has([data-testid="case-status"]:text("INTAKE"))').first()
      await intakeCase.click()

      // Click status change button
      await page.click('[data-testid="change-status-button"]')

      // Select new status
      await page.click('[data-testid="status-option-in-progress"]')

      // Confirm status change
      await page.click('[data-testid="confirm-status-change"]')

      // Verify status is updated
      await expect(page.locator('[data-testid="case-status-display"]')).toContainText('IN_PROGRESS')

      // Verify timeline entry is added
      await expect(page.locator('[data-testid="timeline-entry"]:has-text("Status changed to IN_PROGRESS")')).toBeVisible()
    })

    test('should handle optimistic updates with rollback on failure', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Navigate to case details
      await helpers.wait.waitForElement('[data-testid="case-list"]')
      await page.locator('[data-testid="case-row"]').first().click()

      const originalTitle = await page.locator('[data-testid="case-details-title"]').textContent()

      // Mock API failure for update
      await page.route('**/api/cases/*', route => {
        if (route.request().method() === 'PUT') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Update failed' })
          })
        } else {
          route.continue()
        }
      })

      // Try to update case
      await page.click('[data-testid="edit-case-button"]')
      await page.fill('[data-testid="case-title-input"]', '')
      await helpers.forms.fillField('[data-testid="case-title-input"]', 'Failed Update Title')
      await page.click('[data-testid="save-case-button"]')

      // Verify error notification
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible()

      // Verify title reverted to original (rollback)
      await expect(page.locator('[data-testid="case-details-title"]')).toContainText(originalTitle || '')
    })
  })

  test.describe('Case Deletion', () => {
    test('should delete case with confirmation', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Navigate to case details
      await helpers.wait.waitForElement('[data-testid="case-list"]')
      const firstCase = page.locator('[data-testid="case-row"]').first()
      const caseTitle = await firstCase.locator('[data-testid="case-title"]').textContent()
      
      await firstCase.click()

      // Click delete button
      await page.click('[data-testid="delete-case-button"]')

      // Verify confirmation dialog
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible()
      await expect(page.locator('[data-testid="delete-confirmation-message"]')).toContainText('Are you sure you want to delete this case?')

      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]')

      // Verify redirect to case list
      await expect(page).toHaveURL('/cases')

      // Verify case no longer appears in list
      await helpers.wait.waitForApiCall('/api/cases')
      await expect(page.locator(`[data-testid="case-row"]:has-text("${caseTitle || ''}")`)).not.toBeVisible()

      // Verify success notification
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('Case deleted successfully')
    })

    test('should cancel deletion when user chooses not to proceed', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Navigate to case details
      await helpers.wait.waitForElement('[data-testid="case-list"]')
      const firstCase = page.locator('[data-testid="case-row"]').first()
      const caseTitle = await firstCase.locator('[data-testid="case-title"]').textContent()
      
      await firstCase.click()

      // Click delete button
      await page.click('[data-testid="delete-case-button"]')

      // Cancel deletion
      await page.click('[data-testid="cancel-delete-button"]')

      // Verify dialog closes
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible()

      // Verify case details are still visible
      await expect(page.locator('[data-testid="case-details-title"]')).toContainText(caseTitle || '')

      // Verify case still exists in list
      await helpers.navigation.navigateToSection('cases')
      await expect(page.locator(`[data-testid="case-row"]:has-text("${caseTitle || ''}")`)).toBeVisible()
    })
  })

  test.describe('Bulk Operations', () => {
    test('should select multiple cases and update status in bulk', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Wait for case list
      await helpers.wait.waitForElement('[data-testid="case-list"]')

      // Select multiple cases
      await page.check('[data-testid="case-checkbox"]:nth-child(1)')
      await page.check('[data-testid="case-checkbox"]:nth-child(2)')
      await page.check('[data-testid="case-checkbox"]:nth-child(3)')

      // Verify bulk actions toolbar appears
      await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible()
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('3 cases selected')

      // Click bulk status update
      await page.click('[data-testid="bulk-status-update-button"]')

      // Select new status
      await page.selectOption('[data-testid="bulk-status-select"]', 'IN_PROGRESS')
      await page.click('[data-testid="apply-bulk-status-button"]')

      // Verify confirmation dialog
      await expect(page.locator('[data-testid="bulk-update-confirmation"]')).toBeVisible()
      await page.click('[data-testid="confirm-bulk-update-button"]')

      // Verify all selected cases have updated status
      await helpers.wait.waitForApiCall('/api/cases/bulk-update')
      
      // Check that bulk actions toolbar disappears
      await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).not.toBeVisible()

      // Verify success notification
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('3 cases updated successfully')
    })

    test('should handle partial failures in bulk operations', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Mock partial failure response
      await page.route('**/api/cases/bulk-update', route => {
        route.fulfill({
          status: 207, // Multi-status
          contentType: 'application/json',
          body: JSON.stringify({
            successful: 2,
            failed: 1,
            errors: [
              { caseId: 'case-3', error: 'Permission denied' }
            ]
          })
        })
      })

      // Select and update multiple cases
      await helpers.wait.waitForElement('[data-testid="case-list"]')
      await page.check('[data-testid="case-checkbox"]:nth-child(1)')
      await page.check('[data-testid="case-checkbox"]:nth-child(2)')
      await page.check('[data-testid="case-checkbox"]:nth-child(3)')

      await page.click('[data-testid="bulk-status-update-button"]')
      await page.selectOption('[data-testid="bulk-status-select"]', 'COMPLETED')
      await page.click('[data-testid="apply-bulk-status-button"]')
      await page.click('[data-testid="confirm-bulk-update-button"]')

      // Verify partial success notification
      await expect(page.locator('[data-testid="warning-notification"]')).toBeVisible()
      await expect(page.locator('[data-testid="warning-notification"]')).toContainText('2 cases updated, 1 failed')

      // Verify error details are shown
      await expect(page.locator('[data-testid="bulk-errors-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="bulk-errors-list"]')).toContainText('Permission denied')
    })
  })
})