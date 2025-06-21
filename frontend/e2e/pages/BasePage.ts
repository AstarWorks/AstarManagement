import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  async waitForLoadState() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    // Additional wait for any dynamic content
    await this.page.waitForTimeout(500);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  protected getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  protected async waitForElement(locator: Locator) {
    await locator.waitFor({ state: 'visible' });
  }

  protected async waitForElementToDisappear(locator: Locator) {
    await locator.waitFor({ state: 'hidden' });
  }

  async waitForToast(message: string) {
    const toast = this.page.getByRole('status').filter({ hasText: message });
    await this.waitForElement(toast);
    return toast;
  }

  async dismissToast() {
    const closeButton = this.page.getByRole('button', { name: 'Close' });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.getByTestId('error-message');
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }
}