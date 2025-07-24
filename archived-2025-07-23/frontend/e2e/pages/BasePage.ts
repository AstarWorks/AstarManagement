import { type Page, type Locator, expect } from '@playwright/test'

export abstract class BasePage {
  protected page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '/') {
    await this.page.goto(path)
    await this.waitForPageLoad()
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    // Wait for Nuxt to be ready
    await this.page.waitForFunction(() => (window as any).$nuxt)
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, timeout: number = 30000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout })
  }

  /**
   * Click an element with retry logic
   */
  async clickElement(selector: string) {
    await this.waitForElement(selector)
    await this.page.click(selector)
  }

  /**
   * Fill input field
   */
  async fillInput(selector: string, value: string) {
    await this.waitForElement(selector)
    await this.page.fill(selector, value)
  }

  /**
   * Get element text
   */
  async getElementText(selector: string): Promise<string> {
    await this.waitForElement(selector)
    return await this.page.textContent(selector) || ''
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    return await this.page.locator(selector).count() > 0
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(urlPattern?: string | RegExp) {
    if (urlPattern) {
      await this.page.waitForURL(urlPattern)
    } else {
      await this.page.waitForLoadState('networkidle')
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true })
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title()
  }

  /**
   * Assert element is visible
   */
  async assertElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible()
  }

  /**
   * Assert element contains text
   */
  async assertElementContainsText(selector: string, text: string) {
    await expect(this.page.locator(selector)).toContainText(text)
  }

  /**
   * Assert URL
   */
  async assertURL(urlPattern: string | RegExp) {
    await expect(this.page).toHaveURL(urlPattern)
  }

  /**
   * Get current URL
   */
  getURL(): string {
    return this.page.url()
  }

  /**
   * Reload the page
   */
  async reload() {
    await this.page.reload()
    await this.waitForPageLoad()
  }

  /**
   * Handle toast notifications
   */
  async waitForToast(message: string) {
    const toast = this.page.locator('[data-sonner-toast]', { hasText: message })
    await expect(toast).toBeVisible()
  }

  /**
   * Close toast notifications
   */
  async closeToast() {
    const closeButton = this.page.locator('[data-sonner-toast] button[aria-label="Close"]')
    if (await closeButton.count() > 0) {
      await closeButton.click()
    }
  }

  /**
   * Handle dialogs
   */
  async acceptDialog() {
    this.page.once('dialog', dialog => dialog.accept())
  }

  /**
   * Handle file uploads
   */
  async uploadFile(selector: string, filePath: string) {
    const fileInput = this.page.locator(selector)
    await fileInput.setInputFiles(filePath)
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string | RegExp) {
    await this.page.waitForResponse(urlPattern)
  }

  /**
   * Mock API response
   */
  async mockAPIResponse(urlPattern: string | RegExp, response: any) {
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      })
    })
  }

  /**
   * Get local storage item
   */
  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate(key => localStorage.getItem(key), key)
  }

  /**
   * Set local storage item
   */
  async setLocalStorageItem(key: string, value: string) {
    await this.page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key, value })
  }

  /**
   * Clear local storage
   */
  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear())
  }

  /**
   * Check if page is mobile viewport
   */
  isMobile(): boolean {
    const viewportSize = this.page.viewportSize()
    return viewportSize ? viewportSize.width < 768 : false
  }
}