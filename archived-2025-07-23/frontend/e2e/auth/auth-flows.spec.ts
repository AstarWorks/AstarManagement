/**
 * Authentication E2E Tests
 * 
 * Tests all authentication flows including login, logout, role-based access,
 * and session management for the legal case management system
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'
import { getTestUser } from '../utils/test-config'

test.describe('Authentication Flows', () => {
  test.describe('Login Process', () => {
    test('should login successfully with valid lawyer credentials', async ({ page }) => {
      const helpers = createPageHelpers(page)
      const lawyer = getTestUser('lawyer')

      await page.goto('/login')

      // Fill login form
      await page.fill('[data-testid="email-input"]', lawyer.email)
      await page.fill('[data-testid="password-input"]', lawyer.password)
      
      // Submit login
      await page.click('[data-testid="login-button"]')

      // Verify redirect to dashboard
      await page.waitForURL('/', { timeout: 10000 })
      
      // Verify user menu is visible
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      
      // Verify user display name
      await expect(page.locator('[data-testid="user-display-name"]')).toContainText(lawyer.displayName)
      
      // Verify role-based navigation is visible
      await expect(page.locator('[data-testid="nav-cases"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-documents"]')).toBeVisible()
    })

    test('should login successfully with valid clerk credentials', async ({ page }) => {
      const helpers = createPageHelpers(page)
      const clerk = getTestUser('clerk')

      await helpers.auth.loginAs('clerk')

      // Verify clerk-specific UI elements
      await expect(page.locator('[data-testid="user-display-name"]')).toContainText(clerk.displayName)
      
      // Verify clerk has access to cases but not admin functions
      await expect(page.locator('[data-testid="nav-cases"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible()
    })

    test('should login successfully with valid client credentials', async ({ page }) => {
      const helpers = createPageHelpers(page)
      const client = getTestUser('client')

      await helpers.auth.loginAs('client')

      // Verify client-specific UI elements
      await expect(page.locator('[data-testid="user-display-name"]')).toContainText(client.displayName)
      
      // Verify client has limited navigation options
      await expect(page.locator('[data-testid="nav-my-cases"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-documents"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible()
    })

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/login')

      // Attempt login with invalid credentials
      await page.fill('[data-testid="email-input"]', 'invalid@example.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      await page.click('[data-testid="login-button"]')

      // Verify error message is displayed
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials')
      
      // Verify user remains on login page
      await expect(page).toHaveURL('/login')
    })

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login')

      // Submit form without filling fields
      await page.click('[data-testid="login-button"]')

      // Verify validation errors
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
      
      // Verify specific error messages
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required')
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required')
    })

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.goto('/login')

      // Fill invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email')
      await page.fill('[data-testid="password-input"]', 'somepassword')
      
      // Trigger validation by blurring the email field
      await page.locator('[data-testid="email-input"]').blur()

      // Verify email format validation error
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format')
    })
  })

  test.describe('Logout Process', () => {
    test('should logout successfully and redirect to login page', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Login first
      await helpers.auth.loginAs('lawyer')

      // Perform logout
      await helpers.auth.logout()

      // Verify redirect to login page
      await expect(page).toHaveURL('/login')
      
      // Verify user menu is no longer visible
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
    })

    test('should clear session and require re-authentication', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Login and navigate to a protected page
      await helpers.auth.loginAs('lawyer')
      await page.goto('/cases')

      // Logout
      await helpers.auth.logout()

      // Try to access protected page directly
      await page.goto('/cases')

      // Should be redirected to login
      await page.waitForURL('/login')
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Login
      await helpers.auth.loginAs('lawyer')

      // Refresh the page
      await page.reload()

      // Verify user is still logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      await expect(page).toHaveURL('/')
    })

    test('should handle session timeout gracefully', async ({ page }) => {
      const helpers = createPageHelpers(page)

      // Login
      await helpers.auth.loginAs('lawyer')

      // Simulate session expiration by clearing cookies
      await page.context().clearCookies()

      // Try to navigate to a protected page
      await page.goto('/cases')

      // Should be redirected to login with session timeout message
      await page.waitForURL('/login')
      await expect(page.locator('[data-testid="session-timeout-message"]')).toBeVisible()
    })

    test('should handle concurrent sessions correctly', async ({ browser }) => {
      // Create two different browser contexts to simulate different users
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()
      
      const page1 = await context1.newPage()
      const page2 = await context2.newPage()
      
      const helpers1 = createPageHelpers(page1)
      const helpers2 = createPageHelpers(page2)

      try {
        // Login with different users in each context
        await helpers1.auth.loginAs('lawyer')
        await helpers2.auth.loginAs('clerk')

        // Verify both sessions are independent
        await expect(page1.locator('[data-testid="user-display-name"]')).toContainText('Test Lawyer')
        await expect(page2.locator('[data-testid="user-display-name"]')).toContainText('Test Clerk')

        // Verify different role-based access
        await expect(page1.locator('[data-testid="nav-admin"]')).toBeVisible() // Lawyer should see admin
        await expect(page2.locator('[data-testid="nav-admin"]')).not.toBeVisible() // Clerk should not

      } finally {
        await context1.close()
        await context2.close()
      }
    })
  })

  test.describe('Role-Based Access Control', () => {
    test('should enforce lawyer permissions', async ({ page }) => {
      const helpers = createPageHelpers(page)

      await helpers.auth.loginAs('lawyer')

      // Verify lawyer can access all sections
      await helpers.navigation.navigateToSection('cases')
      await expect(page).toHaveURL('/cases')

      await helpers.navigation.navigateToSection('documents')
      await expect(page).toHaveURL('/documents')

      await helpers.navigation.navigateToSection('reports')
      await expect(page).toHaveURL('/reports')

      // Verify lawyer-specific functions are available
      await expect(page.locator('[data-testid="create-case-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="assign-lawyer-button"]')).toBeVisible()
    })

    test('should enforce clerk permissions', async ({ page }) => {
      const helpers = createPageHelpers(page)

      await helpers.auth.loginAs('clerk')

      // Verify clerk can access permitted sections
      await helpers.navigation.navigateToSection('cases')
      await expect(page).toHaveURL('/cases')

      // Verify clerk cannot access restricted sections
      await page.goto('/admin')
      await page.waitForURL('/unauthorized')
      await expect(page.locator('[data-testid="unauthorized-message"]')).toBeVisible()

      // Verify clerk-specific limitations
      await helpers.navigation.navigateToSection('cases')
      await expect(page.locator('[data-testid="assign-lawyer-button"]')).not.toBeVisible()
    })

    test('should enforce client permissions', async ({ page }) => {
      const helpers = createPageHelpers(page)

      await helpers.auth.loginAs('client')

      // Verify client can only access their own cases
      await expect(page.locator('[data-testid="nav-my-cases"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-cases"]')).not.toBeVisible()

      // Try to access restricted areas
      await page.goto('/admin')
      await page.waitForURL('/unauthorized')

      await page.goto('/all-cases')
      await page.waitForURL('/unauthorized')

      // Verify client can only see their assigned cases
      await page.goto('/my-cases')
      await expect(page.locator('[data-testid="case-list"]')).toBeVisible()
      
      // Verify limited functionality
      await expect(page.locator('[data-testid="create-case-button"]')).not.toBeVisible()
    })
  })

  test.describe('Password Security', () => {
    test('should enforce password complexity requirements', async ({ page }) => {
      // This test assumes there's a password change functionality
      const helpers = createPageHelpers(page)

      await helpers.auth.loginAs('lawyer')
      await page.goto('/profile/password')

      // Test weak passwords
      const weakPasswords = [
        '123456',
        'password',
        'abc123',
        'Password1' // Missing special character
      ]

      for (const weakPassword of weakPasswords) {
        await page.fill('[data-testid="new-password-input"]', weakPassword)
        await page.fill('[data-testid="confirm-password-input"]', weakPassword)
        await page.locator('[data-testid="new-password-input"]').blur()

        await expect(page.locator('[data-testid="password-strength-error"]')).toBeVisible()
      }

      // Test strong password
      await page.fill('[data-testid="new-password-input"]', 'SecurePassword123!')
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePassword123!')
      await page.locator('[data-testid="new-password-input"]').blur()

      await expect(page.locator('[data-testid="password-strength-error"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="password-strength-good"]')).toBeVisible()
    })

    test('should require password confirmation match', async ({ page }) => {
      const helpers = createPageHelpers(page)

      await helpers.auth.loginAs('lawyer')
      await page.goto('/profile/password')

      // Fill mismatched passwords
      await page.fill('[data-testid="new-password-input"]', 'SecurePassword123!')
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!')
      await page.locator('[data-testid="confirm-password-input"]').blur()

      // Verify mismatch error
      await expect(page.locator('[data-testid="password-mismatch-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-mismatch-error"]')).toContainText('Passwords do not match')
    })
  })

  test.describe('Mobile Authentication', () => {
    test('should handle mobile login correctly', async ({ page, browserName }) => {
      // Skip non-mobile browsers for this test
      test.skip(!browserName.includes('Mobile'), 'This test is for mobile browsers only')

      const helpers = createPageHelpers(page)

      await page.goto('/login')

      // Verify mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible()

      // Login on mobile
      await helpers.auth.loginAs('lawyer')

      // Verify mobile navigation is available
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      
      // Test mobile menu functionality
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible()
    })
  })
})