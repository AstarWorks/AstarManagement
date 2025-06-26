/**
 * Form Validation E2E Tests
 * 
 * Tests form validation, submission, and error handling across the application
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createPageHelpers(page)
    await helpers.auth.loginAs('lawyer')
  })

  test('should validate matter creation form', async ({ page }) => {
    const helpers = createPageHelpers(page)
    
    await helpers.navigation.navigateToSection('cases')
    await page.click('[data-testid="create-case-button"]')

    // Test required field validation
    await page.click('[data-testid="save-case-button"]')
    
    await expect(page.locator('[data-testid="case-title-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="case-client-error"]')).toBeVisible()

    // Test valid form submission
    await helpers.forms.fillField('[data-testid="case-title-input"]', 'Valid Case Title')
    await helpers.forms.fillField('[data-testid="case-client-input"]', 'Valid Client')
    
    await helpers.forms.submitForm('[data-testid="create-case-form"]')
    
    await expect(page.locator('[data-testid="success-notification"]')).toBeVisible()
  })

  test('should validate email formats in user forms', async ({ page }) => {
    await page.goto('/profile')
    
    // Test invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.locator('[data-testid="email-input"]').blur()
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format')
    
    // Test valid email
    await page.fill('[data-testid="email-input"]', 'valid@example.com')
    await page.locator('[data-testid="email-input"]').blur()
    
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible()
  })
})