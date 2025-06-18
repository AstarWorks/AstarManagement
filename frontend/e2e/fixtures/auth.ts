import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TestUsers } from '../utils/test-users';

type AuthFixtures = {
  authenticatedPage: Page;
  loginAsLawyer: () => Promise<void>;
  loginAsClerk: () => Promise<void>;
  loginAsClient: () => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Default to lawyer authentication
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      TestUsers.lawyer.email,
      TestUsers.lawyer.password,
      TestUsers.lawyer.twoFactorCode
    );
    
    // Wait for successful redirect
    await page.waitForURL('/dashboard');
    
    await use(page);
    
    // Cleanup: logout
    await loginPage.logout();
  },

  loginAsLawyer: async ({ page }, use) => {
    const login = async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(
        TestUsers.lawyer.email,
        TestUsers.lawyer.password,
        TestUsers.lawyer.twoFactorCode
      );
      await page.waitForURL('/dashboard');
    };
    await use(login);
  },

  loginAsClerk: async ({ page }, use) => {
    const login = async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(
        TestUsers.clerk.email,
        TestUsers.clerk.password,
        TestUsers.clerk.twoFactorCode
      );
      await page.waitForURL('/dashboard');
    };
    await use(login);
  },

  loginAsClient: async ({ page }, use) => {
    const login = async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(
        TestUsers.client.email,
        TestUsers.client.password,
        TestUsers.client.twoFactorCode
      );
      await page.waitForURL('/client-portal');
    };
    await use(login);
  },
});

export { expect } from '@playwright/test';