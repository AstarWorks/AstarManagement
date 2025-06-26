/**
 * Case Management CRUD E2E Tests
 * 
 * Tests complete Create, Read, Update, Delete operations for legal matters
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'
import { MatterFactory, UserFactory, TestScenarios } from '../fixtures/test-data'

test.describe('Case Management CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createPageHelpers(page)
    
    // Login as lawyer with full permissions
    await helpers.auth.loginAs('lawyer')
    
    // Navigate to cases section
    await page.goto('/cases')
    await expect(page.locator('[data-testid="cases-page"]')).toBeVisible()
  })

  test.describe('Create Operations', () => {
    test('should create a new matter successfully', async ({ page }) => {
      const helpers = createPageHelpers(page)
      const testMatter = MatterFactory.create({
        title: 'Test Contract Review',
        priority: 'high',
        status: 'intake'
      })

      // Click create button
      await page.click('[data-testid="create-case-button"]')
      await expect(page.locator('[data-testid="create-case-modal"]')).toBeVisible()

      // Fill form
      await helpers.forms.fillField('[data-testid="case-title-input"]', testMatter.title)
      await helpers.forms.fillField('[data-testid="case-description-input"]', testMatter.description)
      await helpers.forms.selectOption('[data-testid="case-priority-select"]', testMatter.priority)
      await helpers.forms.fillField('[data-testid="case-client-input"]', testMatter.clientName)
      
      // Submit form
      await helpers.forms.submitForm('[data-testid="create-case-form"]')
      
      // Verify success
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('Matter created successfully')
      await expect(page.locator(`[data-testid="matter-card-${testMatter.title}"]`)).toBeVisible()
    })

    test('should validate required fields on create', async ({ page }) => {
      await page.click('[data-testid="create-case-button"]')
      await page.click('[data-testid="submit-case-button"]')
      
      // Check validation errors
      await expect(page.locator('[data-testid="case-title-error"]')).toContainText('Title is required')
      await expect(page.locator('[data-testid="case-client-error"]')).toContainText('Client is required')
    })

    test('should create matter with file upload', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await page.click('[data-testid="create-case-button"]')
      
      // Fill basic information
      await helpers.forms.fillField('[data-testid="case-title-input"]', 'Contract with Documents')
      await helpers.forms.fillField('[data-testid="case-client-input"]', 'Test Client')
      
      // Upload document
      const fileInput = page.locator('[data-testid="document-upload-input"]')
      await fileInput.setInputFiles('test/fixtures/sample-contract.pdf')
      
      await helpers.forms.submitForm('[data-testid="create-case-form"]')
      
      // Verify document was attached
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible()
      await page.click('[data-testid="matter-card-Contract with Documents"]')
      await expect(page.locator('[data-testid="document-list"]')).toContainText('sample-contract.pdf')
    })
  })

  test.describe('Read Operations', () => {
    test('should display matter list with proper data', async ({ page }) => {
      // Verify page loads with matters
      await expect(page.locator('[data-testid="matter-list"]')).toBeVisible()
      
      // Check matter cards contain expected information
      const firstMatter = page.locator('[data-testid^="matter-card-"]').first()
      await expect(firstMatter.locator('[data-testid="matter-title"]')).toBeVisible()
      await expect(firstMatter.locator('[data-testid="matter-status"]')).toBeVisible()
      await expect(firstMatter.locator('[data-testid="matter-client"]')).toBeVisible()
      await expect(firstMatter.locator('[data-testid="matter-assignee"]')).toBeVisible()
    })

    test('should open matter detail view', async ({ page }) => {
      // Click on first matter
      await page.click('[data-testid^="matter-card-"]')
      
      // Verify detail view opens
      await expect(page.locator('[data-testid="matter-detail-view"]')).toBeVisible()
      await expect(page.locator('[data-testid="matter-detail-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="matter-detail-description"]')).toBeVisible()
      await expect(page.locator('[data-testid="matter-detail-timeline"]')).toBeVisible()
    })

    test('should filter matters by status', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Use status filter
      await helpers.forms.selectOption('[data-testid="status-filter"]', 'active')
      
      // Wait for filter to apply
      await page.waitForTimeout(500)
      
      // Verify only active matters are shown
      const statusBadges = page.locator('[data-testid="matter-status"]')
      const count = await statusBadges.count()
      
      for (let i = 0; i < count; i++) {
        await expect(statusBadges.nth(i)).toContainText('active')
      }
    })

    test('should search matters by title', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Enter search term
      await helpers.forms.fillField('[data-testid="search-input"]', 'Contract')
      
      // Wait for search results
      await page.waitForTimeout(500)
      
      // Verify filtered results
      const matterTitles = page.locator('[data-testid="matter-title"]')
      const count = await matterTitles.count()
      
      for (let i = 0; i < count; i++) {
        await expect(matterTitles.nth(i)).toContainText(/Contract/i)
      }
    })
  })

  test.describe('Update Operations', () => {
    test('should update matter details', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Open first matter
      await page.click('[data-testid^="matter-card-"]')
      
      // Click edit button
      await page.click('[data-testid="edit-matter-button"]')
      
      // Update fields
      await helpers.forms.fillField('[data-testid="case-title-input"]', 'Updated Matter Title')
      await helpers.forms.selectOption('[data-testid="case-priority-select"]', 'urgent')
      
      // Save changes
      await page.click('[data-testid="save-matter-button"]')
      
      // Verify update
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('Matter updated successfully')
      await expect(page.locator('[data-testid="matter-detail-title"]')).toContainText('Updated Matter Title')
    })

    test('should update matter status via dropdown', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Find a matter in intake status
      const intakeMatter = page.locator('[data-testid^="matter-card-"]').filter({
        has: page.locator('[data-testid="matter-status"]:has-text("intake")')
      }).first()
      
      await intakeMatter.click()
      
      // Update status
      await helpers.forms.selectOption('[data-testid="status-dropdown"]', 'active')
      
      // Verify status update
      await expect(page.locator('[data-testid="matter-status"]')).toContainText('active')
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('Status updated')
    })

    test('should assign matter to different lawyer', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await page.click('[data-testid^="matter-card-"]')
      await page.click('[data-testid="edit-matter-button"]')
      
      // Change assignee
      await helpers.forms.selectOption('[data-testid="assignee-select"]', 'Jane Smith')
      await page.click('[data-testid="save-matter-button"]')
      
      // Verify assignment
      await expect(page.locator('[data-testid="matter-assignee"]')).toContainText('Jane Smith')
    })

    test('should add note to matter', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await page.click('[data-testid^="matter-card-"]')
      
      // Add note
      await page.click('[data-testid="add-note-button"]')
      await helpers.forms.fillField('[data-testid="note-text-input"]', 'Client meeting scheduled for next week')
      await page.click('[data-testid="save-note-button"]')
      
      // Verify note appears
      await expect(page.locator('[data-testid="matter-notes"]')).toContainText('Client meeting scheduled')
    })
  })

  test.describe('Delete Operations', () => {
    test('should delete matter with confirmation', async ({ page }) => {
      // Find a matter to delete (prefer completed ones)
      const completedMatter = page.locator('[data-testid^="matter-card-"]').filter({
        has: page.locator('[data-testid="matter-status"]:has-text("completed")')
      }).first()
      
      const matterTitle = await completedMatter.locator('[data-testid="matter-title"]').textContent()
      
      await completedMatter.click()
      
      // Delete matter
      await page.click('[data-testid="delete-matter-button"]')
      
      // Confirm deletion
      await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible()
      await page.click('[data-testid="confirm-delete-button"]')
      
      // Verify deletion
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('Matter deleted successfully')
      await expect(page.locator(`[data-testid="matter-card-${matterTitle}"]`)).not.toBeVisible()
    })

    test('should cancel matter deletion', async ({ page }) => {
      await page.click('[data-testid^="matter-card-"]')
      await page.click('[data-testid="delete-matter-button"]')
      
      // Cancel deletion
      await page.click('[data-testid="cancel-delete-button"]')
      
      // Verify matter still exists
      await expect(page.locator('[data-testid="delete-confirmation-modal"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="matter-detail-view"]')).toBeVisible()
    })

    test('should prevent deletion of active matters', async ({ page }) => {
      // Find an active matter
      const activeMatter = page.locator('[data-testid^="matter-card-"]').filter({
        has: page.locator('[data-testid="matter-status"]:has-text("active")')
      }).first()
      
      await activeMatter.click()
      
      // Try to delete (button should be disabled or show warning)
      const deleteButton = page.locator('[data-testid="delete-matter-button"]')
      await expect(deleteButton).toBeDisabled()
    })
  })

  test.describe('Bulk Operations', () => {
    test('should select multiple matters', async ({ page }) => {
      // Enable bulk selection mode
      await page.click('[data-testid="bulk-select-toggle"]')
      
      // Select first 3 matters
      await page.click('[data-testid^="matter-checkbox-"]', { clickCount: 3 })
      
      // Verify selection count
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('3 selected')
    })

    test('should bulk update status', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await page.click('[data-testid="bulk-select-toggle"]')
      
      // Select multiple matters in intake status
      const intakeMatters = page.locator('[data-testid^="matter-checkbox-"]').filter({
        has: page.locator('[data-testid="matter-status"]:has-text("intake")')
      })
      
      const count = Math.min(await intakeMatters.count(), 2)
      for (let i = 0; i < count; i++) {
        await intakeMatters.nth(i).click()
      }
      
      // Bulk update status
      await page.click('[data-testid="bulk-actions-menu"]')
      await page.click('[data-testid="bulk-update-status"]')
      await helpers.forms.selectOption('[data-testid="bulk-status-select"]', 'active')
      await page.click('[data-testid="apply-bulk-update"]')
      
      // Verify updates
      await expect(page.locator('[data-testid="success-notification"]')).toContainText(`${count} matters updated`)
    })

    test('should bulk assign matters', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await page.click('[data-testid="bulk-select-toggle"]')
      
      // Select multiple matters
      await page.click('[data-testid^="matter-checkbox-"]', { clickCount: 2 })
      
      // Bulk assign
      await page.click('[data-testid="bulk-actions-menu"]')
      await page.click('[data-testid="bulk-assign"]')
      await helpers.forms.selectOption('[data-testid="bulk-assignee-select"]', 'John Doe')
      await page.click('[data-testid="apply-bulk-assign"]')
      
      // Verify assignment
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('2 matters assigned')
    })
  })

  test.describe('Data Validation and Error Handling', () => {
    test('should handle server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/matters', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        })
      })
      
      await page.reload()
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load matters')
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    })

    test('should validate matter title length', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await page.click('[data-testid="create-case-button"]')
      
      // Try very long title
      await helpers.forms.fillField('[data-testid="case-title-input"]', 'A'.repeat(256))
      await page.click('[data-testid="submit-case-button"]')
      
      await expect(page.locator('[data-testid="case-title-error"]')).toContainText('Title must be less than 255 characters')
    })

    test('should handle duplicate matter titles', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Get existing matter title
      const existingTitle = await page.locator('[data-testid="matter-title"]').first().textContent()
      
      await page.click('[data-testid="create-case-button"]')
      await helpers.forms.fillField('[data-testid="case-title-input"]', existingTitle || 'Duplicate Title')
      await helpers.forms.fillField('[data-testid="case-client-input"]', 'Test Client')
      await page.click('[data-testid="submit-case-button"]')
      
      await expect(page.locator('[data-testid="case-title-error"]')).toContainText('Matter with this title already exists')
    })
  })

  test.describe('Permission-Based Access', () => {
    test('clerk should have limited access', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Login as clerk
      await helpers.auth.logout()
      await helpers.auth.loginAs('clerk')
      await page.goto('/cases')
      
      // Verify limited permissions
      await expect(page.locator('[data-testid="create-case-button"]')).not.toBeVisible()
      
      // Can view but not delete
      await page.click('[data-testid^="matter-card-"]')
      await expect(page.locator('[data-testid="delete-matter-button"]')).not.toBeVisible()
    })

    test('client should only see assigned matters', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Login as client
      await helpers.auth.logout()
      await helpers.auth.loginAs('client')
      await page.goto('/cases')
      
      // Verify only assigned matters are visible
      const matterCards = page.locator('[data-testid^="matter-card-"]')
      const count = await matterCards.count()
      
      // Each matter should be assigned to this client
      for (let i = 0; i < count; i++) {
        const clientName = await matterCards.nth(i).locator('[data-testid="matter-client"]').textContent()
        expect(clientName).toContain('Test Client')
      }
    })
  })
})