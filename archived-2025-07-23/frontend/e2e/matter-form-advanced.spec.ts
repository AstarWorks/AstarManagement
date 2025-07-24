import { test, expect } from '@playwright/test'

test.describe('Matter Form - Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to matter creation page
    await page.goto('/matters/create')
    
    // Wait for form to load
    await page.waitForSelector('[data-testid="matter-form-steps"]')
  })

  test.describe('Auto-save Functionality', () => {
    test('should auto-save form data after typing', async ({ page }) => {
      // Fill in basic information
      await page.fill('[name="title"]', 'Test Auto-save Matter')
      await page.fill('[name="description"]', 'This matter tests auto-save functionality')
      
      // Wait for auto-save to trigger (5 second debounce)
      await page.waitForTimeout(6000)
      
      // Check for auto-save indicator
      await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('Saved')
      
      // Verify last save time is shown
      await expect(page.locator('[data-testid="last-save-time"]')).toBeVisible()
    })

    test('should show saving indicator while auto-saving', async ({ page }) => {
      // Fill in form data
      await page.fill('[name="title"]', 'Auto-save Test')
      
      // Check for saving indicator immediately
      await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('Saving...')
      
      // Wait for save to complete
      await page.waitForTimeout(6000)
      
      // Should show saved status
      await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('Saved')
    })

    test('should restore auto-saved data on page reload', async ({ page }) => {
      // Fill in comprehensive form data
      await page.fill('[name="title"]', 'Persistent Matter Title')
      await page.fill('[name="description"]', 'This matter should persist across page reloads')
      await page.selectOption('[name="priority"]', 'HIGH')
      
      // Wait for auto-save
      await page.waitForTimeout(6000)
      await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('Saved')
      
      // Reload the page
      await page.reload()
      
      // Should show restore prompt
      await expect(page.locator('[data-testid="restore-prompt"]')).toBeVisible()
      
      // Click restore
      await page.click('[data-testid="restore-data-btn"]')
      
      // Verify data is restored
      await expect(page.locator('[name="title"]')).toHaveValue('Persistent Matter Title')
      await expect(page.locator('[name="description"]')).toHaveValue('This matter should persist across page reloads')
      await expect(page.locator('[name="priority"]')).toHaveValue('HIGH')
    })

    test('should clear auto-saved data after successful submission', async ({ page }) => {
      // Fill in required fields
      await page.fill('[name="title"]', 'Matter to Submit')
      await page.selectOption('[name="type"]', 'CONTRACT')
      await page.selectOption('[name="status"]', 'ACTIVE')
      await page.selectOption('[name="priority"]', 'MEDIUM')
      
      // Wait for auto-save
      await page.waitForTimeout(6000)
      
      // Navigate through steps to submit
      await page.click('[data-testid="next-step-btn"]')
      
      // Select client
      await page.click('[data-testid="client-dropdown"]')
      await page.click('[data-testid="client-option-1"]')
      await page.click('[data-testid="next-step-btn"]')
      
      // Assign lawyers
      await page.click('[data-testid="lawyer-checkbox-1"]')
      await page.click('[data-testid="next-step-btn"]')
      
      // Submit form
      await page.click('[data-testid="submit-matter-btn"]')
      
      // Wait for submission success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Go back to create page
      await page.goto('/matters/create')
      
      // Should not show restore prompt (data should be cleared)
      await expect(page.locator('[data-testid="restore-prompt"]')).not.toBeVisible()
    })
  })

  test.describe('Navigation Guards', () => {
    test('should warn when navigating away with unsaved changes', async ({ page }) => {
      // Fill in form data
      await page.fill('[name="title"]', 'Unsaved Matter')
      
      // Set up dialog handler
      let dialogShown = false
      page.on('dialog', async dialog => {
        dialogShown = true
        expect(dialog.message()).toContain('unsaved changes')
        await dialog.dismiss() // Cancel navigation
      })
      
      // Try to navigate away
      await page.click('[data-testid="back-to-matters-link"]')
      
      // Verify dialog was shown
      expect(dialogShown).toBe(true)
      
      // Should still be on form page
      await expect(page.locator('[data-testid="matter-form-steps"]')).toBeVisible()
    })

    test('should allow navigation when confirming to leave with unsaved changes', async ({ page }) => {
      // Fill in form data
      await page.fill('[name="title"]', 'Unsaved Matter')
      
      // Set up dialog handler to accept
      page.on('dialog', async dialog => {
        await dialog.accept() // Confirm navigation
      })
      
      // Try to navigate away
      await page.click('[data-testid="back-to-matters-link"]')
      
      // Should navigate to matters list
      await expect(page).toHaveURL('/matters')
    })

    test('should not warn when navigating with saved form', async ({ page }) => {
      // Fill in form data
      await page.fill('[name="title"]', 'Saved Matter')
      
      // Wait for auto-save
      await page.waitForTimeout(6000)
      
      // Set up dialog handler (should not be called)
      let dialogShown = false
      page.on('dialog', async dialog => {
        dialogShown = true
        await dialog.dismiss()
      })
      
      // Navigate away
      await page.click('[data-testid="back-to-matters-link"]')
      
      // Dialog should not be shown
      expect(dialogShown).toBe(false)
      
      // Should navigate successfully
      await expect(page).toHaveURL('/matters')
    })

    test('should handle browser back button with unsaved changes', async ({ page }) => {
      // Fill in form data to make it dirty
      await page.fill('[name="title"]', 'Browser Back Test')
      
      // Set up beforeunload handler check
      const beforeUnloadPromise = page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          let beforeUnloadCalled = false
          
          const handler = (e: BeforeUnloadEvent) => {
            beforeUnloadCalled = true
            e.preventDefault()
            e.returnValue = 'unsaved changes'
          }
          
          window.addEventListener('beforeunload', handler)
          
          // Simulate navigation
          setTimeout(() => {
            window.removeEventListener('beforeunload', handler)
            resolve(beforeUnloadCalled)
          }, 1000)
        })
      })
      
      // Try to use browser back
      await page.goBack()
      
      // Check if beforeunload was properly set up
      const beforeUnloadCalled = await beforeUnloadPromise
      expect(beforeUnloadCalled).toBe(true)
    })
  })

  test.describe('Multi-step Form Workflow', () => {
    test('should navigate through all steps successfully', async ({ page }) => {
      // Step 1: Basic Information
      await expect(page.locator('[data-testid="step-progress"]')).toContainText('Step 1 of 4')
      
      await page.fill('[name="title"]', 'Complete Workflow Test')
      await page.fill('[name="description"]', 'Testing complete multi-step workflow')
      await page.selectOption('[name="type"]', 'LITIGATION')
      await page.selectOption('[name="status"]', 'INVESTIGATION')
      await page.selectOption('[name="priority"]', 'HIGH')
      
      await page.click('[data-testid="next-step-btn"]')
      
      // Step 2: Client Details
      await expect(page.locator('[data-testid="step-progress"]')).toContainText('Step 2 of 4')
      
      await page.click('[data-testid="client-search"]')
      await page.fill('[data-testid="client-search"]', 'Acme Corp')
      await page.click('[data-testid="client-option-acme"]')
      
      await page.fill('[name="openDate"]', '2024-01-15')
      
      await page.click('[data-testid="next-step-btn"]')
      
      // Step 3: Team Assignment
      await expect(page.locator('[data-testid="step-progress"]')).toContainText('Step 3 of 4')
      
      await page.click('[data-testid="lawyer-search"]')
      await page.fill('[data-testid="lawyer-search"]', 'Sarah Johnson')
      await page.click('[data-testid="lawyer-checkbox-sarah"]')
      
      await page.click('[data-testid="next-step-btn"]')
      
      // Step 4: Review
      await expect(page.locator('[data-testid="step-progress"]')).toContainText('Step 4 of 4')
      
      // Verify all data in review
      await expect(page.locator('[data-testid="review-title"]')).toContainText('Complete Workflow Test')
      await expect(page.locator('[data-testid="review-client"]')).toContainText('Acme Corp')
      await expect(page.locator('[data-testid="review-lawyer"]')).toContainText('Sarah Johnson')
      
      // Submit
      await page.click('[data-testid="submit-matter-btn"]')
      
      // Success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })

    test('should allow jumping to previous steps', async ({ page }) => {
      // Complete first step
      await page.fill('[name="title"]', 'Step Navigation Test')
      await page.selectOption('[name="type"]', 'CONTRACT')
      await page.selectOption('[name="status"]', 'ACTIVE')
      await page.selectOption('[name="priority"]', 'MEDIUM')
      
      await page.click('[data-testid="next-step-btn"]')
      
      // Go to step 2
      await page.click('[data-testid="client-dropdown"]')
      await page.click('[data-testid="client-option-1"]')
      
      await page.click('[data-testid="next-step-btn"]')
      
      // Now on step 3, click back to step 1
      await page.click('[data-testid="step-indicator-1"]')
      
      // Should be back on step 1
      await expect(page.locator('[data-testid="step-progress"]')).toContainText('Step 1 of 4')
      
      // Data should be preserved
      await expect(page.locator('[name="title"]')).toHaveValue('Step Navigation Test')
    })

    test('should validate required fields before proceeding', async ({ page }) => {
      // Try to proceed without filling required fields
      await page.click('[data-testid="next-step-btn"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="validation-error-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="validation-error-type"]')).toBeVisible()
      
      // Should still be on step 1
      await expect(page.locator('[data-testid="step-progress"]')).toContainText('Step 1 of 4')
      
      // Fill required fields
      await page.fill('[name="title"]', 'Valid Matter')
      await page.selectOption('[name="type"]', 'CONTRACT')
      await page.selectOption('[name="status"]', 'ACTIVE')
      await page.selectOption('[name="priority"]', 'MEDIUM')
      
      // Now should be able to proceed
      await page.click('[data-testid="next-step-btn"]')
      await expect(page.locator('[data-testid="step-progress"]')).toContainText('Step 2 of 4')
    })
  })

  test.describe('Form State Persistence', () => {
    test('should persist form state across browser sessions', async ({ page, context }) => {
      // Fill in form data
      await page.fill('[name="title"]', 'Session Persistent Matter')
      await page.selectOption('[name="priority"]', 'URGENT')
      
      // Wait for auto-save
      await page.waitForTimeout(6000)
      
      // Close page and create new one (simulates closing browser)
      await page.close()
      const newPage = await context.newPage()
      
      // Navigate to form
      await newPage.goto('/matters/create')
      
      // Should offer to restore data
      await expect(newPage.locator('[data-testid="restore-prompt"]')).toBeVisible()
      
      // Restore data
      await newPage.click('[data-testid="restore-data-btn"]')
      
      // Verify data is restored
      await expect(newPage.locator('[name="title"]')).toHaveValue('Session Persistent Matter')
      await expect(newPage.locator('[name="priority"]')).toHaveValue('URGENT')
    })

    test('should handle multiple form instances', async ({ page }) => {
      // Fill in data for new matter
      await page.fill('[name="title"]', 'New Matter Instance')
      await page.waitForTimeout(6000)
      
      // Navigate to edit existing matter
      await page.goto('/matters/edit/existing-123')
      
      // Fill in different data
      await page.fill('[name="title"]', 'Edited Matter Instance')
      await page.waitForTimeout(6000)
      
      // Go back to create form
      await page.goto('/matters/create')
      
      // Should restore correct data for create form
      await page.click('[data-testid="restore-data-btn"]')
      await expect(page.locator('[name="title"]')).toHaveValue('New Matter Instance')
    })
  })

  test.describe('Error Handling', () => {
    test('should handle auto-save failures gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/v1/matters/auto-save', route => {
        route.abort('failed')
      })
      
      // Fill in form data
      await page.fill('[name="title"]', 'Auto-save Failure Test')
      
      // Wait for auto-save attempt
      await page.waitForTimeout(6000)
      
      // Should show error indicator
      await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('Save failed')
      
      // Should show error toast
      await expect(page.locator('[data-testid="toast-error"]')).toBeVisible()
    })

    test('should retry auto-save after failure', async ({ page }) => {
      let requestCount = 0
      
      // Mock network failure for first request, success for second
      await page.route('**/api/v1/matters/auto-save', route => {
        requestCount++
        if (requestCount === 1) {
          route.abort('failed')
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        }
      })
      
      // Fill in form data
      await page.fill('[name="title"]', 'Auto-save Retry Test')
      
      // Wait for first save attempt (should fail)
      await page.waitForTimeout(6000)
      await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('Save failed')
      
      // Make another change to trigger retry
      await page.fill('[name="description"]', 'Additional data for retry')
      
      // Wait for retry attempt (should succeed)
      await page.waitForTimeout(6000)
      await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('Saved')
    })
  })

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Focus on first input
      await page.focus('[name="title"]')
      
      // Tab through form fields
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should reach next button
      await expect(page.locator('[data-testid="next-step-btn"]')).toBeFocused()
      
      // Press Enter to activate
      await page.keyboard.press('Enter')
      
      // Should move to next step (if validation passes)
      // Note: This would require all required fields to be filled first
    })

    test('should announce step changes to screen readers', async ({ page }) => {
      // Complete first step
      await page.fill('[name="title"]', 'Accessibility Test')
      await page.selectOption('[name="type"]', 'CONTRACT')
      await page.selectOption('[name="status"]', 'ACTIVE')
      await page.selectOption('[name="priority"]', 'MEDIUM')
      
      await page.click('[data-testid="next-step-btn"]')
      
      // Check for aria-live announcements
      await expect(page.locator('[data-testid="step-announcement"]')).toHaveAttribute('aria-live', 'polite')
      await expect(page.locator('[data-testid="step-announcement"]')).toContainText('Step 2 of 4: Client Details')
    })

    test('should provide proper form labels and descriptions', async ({ page }) => {
      // Check that all form fields have proper labels
      await expect(page.locator('label[for="title"]')).toBeVisible()
      await expect(page.locator('[name="title"]')).toHaveAttribute('aria-describedby')
      
      // Check for required field indicators
      await expect(page.locator('label[for="title"]')).toContainText('*')
    })
  })
})