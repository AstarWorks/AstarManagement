import { test, expect } from '@playwright/test';

test.describe('Example Tests', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');
    
    // Expects a title "to contain" a substring.
    await expect(page).toHaveTitle(/Aster Management/);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Check that login form elements are present
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});