/**
 * Authentication Flow E2E Tests
 * Tests login, 2FA, logout, and session management
 */

import { test, expect } from '../fixtures/auth';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('successful login with valid credentials and 2FA', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Test form validation
      await loginPage.submit();
      await loginPage.expectError('Email is required');
      
      // Fill credentials
      await loginPage.fillCredentials('lawyer@example.com', 'ValidPass123!');
      await loginPage.submit();
      
      // Handle 2FA
      await expect(page).toHaveURL('/login/2fa');
      await loginPage.fill2FACode('123456');
      
      // Verify successful login
      await expect(page).toHaveURL('/dashboard');
      const dashboard = new DashboardPage(page);
      await expect(dashboard.welcomeMessage).toContainText('Welcome back');
    });

    test('invalid credentials show appropriate error', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.login('invalid@example.com', 'wrongpassword');
      await loginPage.expectError('Invalid email or password');
      
      // Should remain on login page
      await expect(page).toHaveURL('/login');
    });

    test('invalid 2FA code prevents login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.fillCredentials('lawyer@example.com', 'ValidPass123!');
      await loginPage.submit();
      
      // Enter wrong 2FA code
      await loginPage.fill2FACode('000000');
      await loginPage.expectError('Invalid verification code');
      
      // Should remain on 2FA page
      await expect(page).toHaveURL('/login/2fa');
    });

    test('rate limiting after multiple failed attempts', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await loginPage.login('lawyer@example.com', 'wrongpassword');
        await page.waitForTimeout(500); // Small delay between attempts
      }
      
      // 6th attempt should be rate limited
      await loginPage.fillCredentials('lawyer@example.com', 'wrongpassword');
      await loginPage.submit();
      await loginPage.expectError('Too many attempts. Please try again later');
    });
  });

  test.describe('Session Management', () => {
    test('logout clears session and redirects to login', async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);
      await dashboard.goto();
      
      // Logout
      await dashboard.logout();
      
      // Should redirect to login
      await expect(authenticatedPage).toHaveURL('/login');
      
      // Try to access protected route
      await authenticatedPage.goto('/dashboard');
      await expect(authenticatedPage).toHaveURL('/login?redirect=/dashboard');
    });

    test('session timeout redirects to login', async ({ authenticatedPage }) => {
      // Set session to expire immediately
      await authenticatedPage.evaluate(() => {
        localStorage.setItem('session_expires_at', new Date().toISOString());
      });
      
      // Navigate to trigger session check
      await authenticatedPage.goto('/matters');
      
      // Should redirect to login with message
      await expect(authenticatedPage).toHaveURL('/login');
      await expect(authenticatedPage.getByText('Your session has expired')).toBeVisible();
    });

    test('remember me extends session duration', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      // Check remember me
      await page.getByLabel('Remember me').check();
      await loginPage.login('lawyer@example.com', 'ValidPass123!', '123456');
      
      // Check session expiry is extended
      const sessionExpiry = await page.evaluate(() => {
        return localStorage.getItem('session_expires_at');
      });
      
      const expiryDate = new Date(sessionExpiry);
      const now = new Date();
      const daysDiff = (expiryDate - now) / (1000 * 60 * 60 * 24);
      
      expect(daysDiff).toBeGreaterThan(25); // Should be ~30 days
    });
  });
});