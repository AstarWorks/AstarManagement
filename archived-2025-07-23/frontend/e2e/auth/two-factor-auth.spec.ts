/**
 * Two-Factor Authentication E2E Tests
 * 
 * Tests 2FA setup, verification, and security flows
 */

import { test, expect } from '@playwright/test'
import { createPageHelpers } from '../utils/test-helpers'
import { UserFactory } from '../fixtures/test-data'

test.describe('Two-Factor Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test.describe('2FA Setup Flow', () => {
    test('should guide user through 2FA setup on first login', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Login with user who hasn't set up 2FA
      const user = UserFactory.createLawyer({ twoFactorEnabled: false })
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      // Should redirect to 2FA setup
      await expect(page.locator('[data-testid="2fa-setup-page"]')).toBeVisible()
      await expect(page.locator('[data-testid="2fa-setup-title"]')).toContainText('Secure Your Account')
      
      // Display QR code for authenticator app
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible()
      await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible()
      
      // Verify backup codes are generated
      const backupCodes = page.locator('[data-testid="backup-code"]')
      await expect(backupCodes).toHaveCount(10)
    })

    test('should verify 2FA setup with valid code', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await helpers.auth.startTwoFactorSetup()
      
      // Enter verification code
      await helpers.forms.fillField('[data-testid="verification-code-input"]', '123456')
      await page.click('[data-testid="verify-2fa-button"]')
      
      // Should complete setup and redirect
      await expect(page.locator('[data-testid="2fa-success-message"]')).toContainText('Two-factor authentication enabled')
      await expect(page).toHaveURL('/dashboard')
    })

    test('should reject invalid verification codes', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await helpers.auth.startTwoFactorSetup()
      
      // Enter invalid code
      await helpers.forms.fillField('[data-testid="verification-code-input"]', '000000')
      await page.click('[data-testid="verify-2fa-button"]')
      
      // Should show error
      await expect(page.locator('[data-testid="verification-error"]')).toContainText('Invalid verification code')
      await expect(page.locator('[data-testid="2fa-setup-page"]')).toBeVisible()
    })

    test('should allow downloading backup codes', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await helpers.auth.startTwoFactorSetup()
      
      // Download backup codes
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="download-backup-codes"]')
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toBe('backup-codes.txt')
    })
  })

  test.describe('2FA Login Flow', () => {
    test('should require 2FA after username/password', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Login with 2FA-enabled user
      const user = UserFactory.createLawyer({ twoFactorEnabled: true })
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      // Should prompt for 2FA
      await expect(page.locator('[data-testid="2fa-verification-page"]')).toBeVisible()
      await expect(page.locator('[data-testid="2fa-prompt"]')).toContainText('Enter your authenticator code')
      
      // Should show username but not password
      await expect(page.locator('[data-testid="logged-in-as"]')).toContainText(user.email)
    })

    test('should login successfully with valid 2FA code', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Complete login flow
      await helpers.auth.loginAs('lawyer') // This includes 2FA
      
      // Should reach dashboard
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    })

    test('should reject invalid 2FA codes', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      const user = UserFactory.createLawyer({ twoFactorEnabled: true })
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      // Enter invalid 2FA code
      await helpers.forms.fillField('[data-testid="2fa-code-input"]', '000000')
      await page.click('[data-testid="verify-2fa-login-button"]')
      
      // Should show error
      await expect(page.locator('[data-testid="2fa-error"]')).toContainText('Invalid authentication code')
      await expect(page.locator('[data-testid="2fa-verification-page"]')).toBeVisible()
    })

    test('should handle 2FA code expiration', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      const user = UserFactory.createLawyer({ twoFactorEnabled: true })
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      // Wait for code to expire (simulate with mock)
      await page.route('**/api/auth/verify-2fa', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Code expired' })
        })
      })
      
      await helpers.forms.fillField('[data-testid="2fa-code-input"]', '123456')
      await page.click('[data-testid="verify-2fa-login-button"]')
      
      await expect(page.locator('[data-testid="2fa-error"]')).toContainText('Code has expired')
    })

    test('should rate limit after multiple failed attempts', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      const user = UserFactory.createLawyer({ twoFactorEnabled: true })
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await helpers.forms.fillField('[data-testid="2fa-code-input"]', '000000')
        await page.click('[data-testid="verify-2fa-login-button"]')
        await page.waitForTimeout(100)
      }
      
      // Should show rate limit message
      await expect(page.locator('[data-testid="rate-limit-message"]')).toContainText('Too many failed attempts')
      await expect(page.locator('[data-testid="verify-2fa-login-button"]')).toBeDisabled()
    })
  })

  test.describe('Backup Code Authentication', () => {
    test('should allow login with backup code', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      const user = UserFactory.createLawyer({ twoFactorEnabled: true })
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      // Use backup code instead
      await page.click('[data-testid="use-backup-code-link"]')
      await expect(page.locator('[data-testid="backup-code-input"]')).toBeVisible()
      
      await helpers.forms.fillField('[data-testid="backup-code-input"]', 'backup-123456789')
      await page.click('[data-testid="verify-backup-code-button"]')
      
      // Should login successfully
      await expect(page).toHaveURL('/dashboard')
    })

    test('should invalidate backup code after use', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // First use of backup code
      await helpers.auth.loginWithBackupCode('backup-123456789')
      await helpers.auth.logout()
      
      // Try to use same backup code again
      const user = UserFactory.createLawyer({ twoFactorEnabled: true })
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      await page.click('[data-testid="use-backup-code-link"]')
      await helpers.forms.fillField('[data-testid="backup-code-input"]', 'backup-123456789')
      await page.click('[data-testid="verify-backup-code-button"]')
      
      await expect(page.locator('[data-testid="backup-code-error"]')).toContainText('Backup code has already been used')
    })

    test('should warn when few backup codes remain', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Mock user with only 2 backup codes left
      await page.route('**/api/auth/verify-backup-code', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: true, 
            backupCodesRemaining: 2,
            warning: 'Only 2 backup codes remaining'
          })
        })
      })
      
      await helpers.auth.loginWithBackupCode('backup-987654321')
      
      // Should show warning
      await expect(page.locator('[data-testid="backup-codes-warning"]')).toContainText('Only 2 backup codes remaining')
      await expect(page.locator('[data-testid="generate-new-codes-link"]')).toBeVisible()
    })
  })

  test.describe('2FA Management', () => {
    test('should allow disabling 2FA', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await helpers.auth.loginAs('lawyer')
      await page.goto('/settings/security')
      
      // Disable 2FA
      await page.click('[data-testid="disable-2fa-button"]')
      
      // Confirm with password
      await expect(page.locator('[data-testid="confirm-disable-2fa-modal"]')).toBeVisible()
      await helpers.forms.fillField('[data-testid="password-confirmation-input"]', 'password123')
      await page.click('[data-testid="confirm-disable-button"]')
      
      // Verify 2FA is disabled
      await expect(page.locator('[data-testid="2fa-status"]')).toContainText('Disabled')
      await expect(page.locator('[data-testid="enable-2fa-button"]')).toBeVisible()
    })

    test('should regenerate backup codes', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await helpers.auth.loginAs('lawyer')
      await page.goto('/settings/security')
      
      // Regenerate backup codes
      await page.click('[data-testid="regenerate-backup-codes-button"]')
      
      // Confirm action
      await expect(page.locator('[data-testid="regenerate-codes-modal"]')).toBeVisible()
      await page.click('[data-testid="confirm-regenerate-button"]')
      
      // Should show new codes
      await expect(page.locator('[data-testid="new-backup-codes"]')).toBeVisible()
      const newCodes = page.locator('[data-testid="backup-code"]')
      await expect(newCodes).toHaveCount(10)
    })

    test('should reset 2FA after password change', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await helpers.auth.loginAs('lawyer')
      await page.goto('/settings/security')
      
      // Change password
      await helpers.forms.fillField('[data-testid="current-password-input"]', 'password123')
      await helpers.forms.fillField('[data-testid="new-password-input"]', 'newPassword456')
      await helpers.forms.fillField('[data-testid="confirm-password-input"]', 'newPassword456')
      await page.click('[data-testid="change-password-button"]')
      
      // Should prompt to re-setup 2FA
      await expect(page.locator('[data-testid="2fa-reset-notice"]')).toContainText('Please re-configure two-factor authentication')
    })
  })

  test.describe('Security Scenarios', () => {
    test('should prevent 2FA bypass attempts', async ({ page }) => {
      // Try to access protected page without 2FA completion
      await page.goto('/dashboard')
      
      // Should redirect to login
      await expect(page).toHaveURL('/login')
    })

    test('should timeout 2FA session', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      const user = UserFactory.createLawyer({ twoFactorEnabled: true })
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      // Mock session timeout
      await page.route('**/api/auth/verify-2fa', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' })
        })
      })
      
      // Wait and try to verify
      await page.waitForTimeout(1000)
      await helpers.forms.fillField('[data-testid="2fa-code-input"]', '123456')
      await page.click('[data-testid="verify-2fa-login-button"]')
      
      // Should redirect back to login
      await expect(page.locator('[data-testid="session-expired-message"]')).toContainText('Session expired')
      await expect(page).toHaveURL('/login')
    })

    test('should enforce 2FA for sensitive operations', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await helpers.auth.loginAs('lawyer')
      await page.goto('/settings/security')
      
      // Try to disable 2FA (sensitive operation)
      await page.click('[data-testid="disable-2fa-button"]')
      
      // Should require re-authentication
      await expect(page.locator('[data-testid="re-auth-required"]')).toBeVisible()
      await helpers.forms.fillField('[data-testid="re-auth-2fa-input"]', '123456')
      await page.click('[data-testid="verify-re-auth-button"]')
      
      // Only then show confirmation dialog
      await expect(page.locator('[data-testid="confirm-disable-2fa-modal"]')).toBeVisible()
    })

    test('should lock account after repeated 2FA failures', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      const user = UserFactory.createLawyer({ twoFactorEnabled: true })
      
      // Mock account lockout after 10 failed attempts
      let attemptCount = 0
      await page.route('**/api/auth/verify-2fa', route => {
        attemptCount++
        if (attemptCount >= 10) {
          route.fulfill({
            status: 423,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Account locked due to repeated failures' })
          })
        } else {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Invalid code' })
          })
        }
      })
      
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      // Make 10 failed attempts
      for (let i = 0; i < 10; i++) {
        await helpers.forms.fillField('[data-testid="2fa-code-input"]', '000000')
        await page.click('[data-testid="verify-2fa-login-button"]')
        await page.waitForTimeout(100)
      }
      
      // Should show account locked message
      await expect(page.locator('[data-testid="account-locked-message"]')).toContainText('Account has been locked')
      await expect(page.locator('[data-testid="contact-admin-link"]')).toBeVisible()
    })
  })

  test.describe('User Experience', () => {
    test('should show helpful setup instructions', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await helpers.auth.startTwoFactorSetup()
      
      // Verify instructional content
      await expect(page.locator('[data-testid="setup-instructions"]')).toContainText('Download an authenticator app')
      await expect(page.locator('[data-testid="recommended-apps"]')).toContainText('Google Authenticator')
      await expect(page.locator('[data-testid="manual-entry-code"]')).toBeVisible()
    })

    test('should provide accessibility for QR code', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      await helpers.auth.startTwoFactorSetup()
      
      // Check QR code accessibility
      await expect(page.locator('[data-testid="qr-code"]')).toHaveAttribute('alt', /QR code/)
      await expect(page.locator('[data-testid="manual-entry-option"]')).toBeVisible()
      
      // Manual entry should work
      await page.click('[data-testid="show-manual-entry"]')
      await expect(page.locator('[data-testid="manual-entry-secret"]')).toBeVisible()
    })

    test('should remember trusted devices', async ({ page }) => {
      const helpers = createPageHelpers(page)
      
      // Login with 2FA and trust device
      const user = UserFactory.createLawyer({ twoFactorEnabled: true })
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      await helpers.forms.fillField('[data-testid="2fa-code-input"]', '123456')
      await page.check('[data-testid="trust-device-checkbox"]')
      await page.click('[data-testid="verify-2fa-login-button"]')
      
      // Logout and login again
      await helpers.auth.logout()
      await helpers.auth.loginWithCredentials(user.email, 'password123')
      
      // Should skip 2FA on trusted device
      await expect(page).toHaveURL('/dashboard')
    })
  })
})