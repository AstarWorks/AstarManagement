import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly twoFactorInput: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.twoFactorInput = page.getByLabel('2FA Code');
    this.errorMessage = page.getByTestId('error-message');
    this.rememberMeCheckbox = page.getByLabel('Remember me');
  }

  async goto() {
    await this.page.goto('/login');
    await this.waitForLoadState();
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async fill2FACode(code: string) {
    await this.waitForElement(this.twoFactorInput);
    await this.twoFactorInput.fill(code);
    await this.page.getByRole('button', { name: 'Verify' }).click();
  }

  async login(email: string, password: string, twoFactorCode?: string) {
    await this.fillCredentials(email, password);
    await this.submit();
    
    if (twoFactorCode) {
      await this.fill2FACode(twoFactorCode);
    }
  }

  async expectError(message: string) {
    await this.waitForElement(this.errorMessage);
    await expect(this.errorMessage).toContainText(message);
  }

  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.submitButton).toBeVisible();
  }

  async logout() {
    await this.page.getByTestId('user-menu').click();
    await this.page.getByRole('button', { name: 'Logout' }).click();
    await this.expectToBeOnLoginPage();
  }
}