/**
 * Test Helper Utilities
 * 
 * Common utilities for E2E tests including authentication, data setup,
 * waiting functions, and browser automation helpers
 */

import { Page, expect, Locator } from '@playwright/test'
import { TestUser, getTestConfig, getTestUser, isMobileTest } from './test-config'

/**
 * Authentication helpers
 */
export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Login with specific user role
   */
  async loginAs(role: 'lawyer' | 'clerk' | 'client') {
    const user = getTestUser(role)
    await this.login(user.email, user.password)
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    await this.page.goto('/login')
    
    // Fill login form
    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    
    // Submit form
    await this.page.click('[data-testid="login-button"]')
    
    // Wait for successful login redirect
    await this.page.waitForURL('/', { timeout: 10000 })
    
    // Verify login success
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible()
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"]')
    await this.page.click('[data-testid="logout-button"]')
    
    // Wait for redirect to login
    await this.page.waitForURL('/login', { timeout: 10000 })
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 3000 })
      return true
    } catch {
      return false
    }
  }
}

/**
 * Navigation helpers
 */
export class NavigationHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to specific page with loading state handling
   */
  async goto(path: string, options?: { waitForLoad?: boolean }) {
    await this.page.goto(path)
    
    if (options?.waitForLoad !== false) {
      await this.waitForPageLoad()
    }
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForLoadState('domcontentloaded')
    
    // Wait for any loading spinners to disappear
    await this.page.waitForFunction(() => {
      const spinners = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner')
      return spinners.length === 0
    }, { timeout: 30000 })
  }

  /**
   * Navigate using the sidebar menu
   */
  async navigateToSection(section: string) {
    const isMobile = await this.isMobileViewport()
    
    if (isMobile) {
      // Open mobile menu first
      await this.page.click('[data-testid="mobile-menu-button"]')
    }
    
    await this.page.click(`[data-testid="nav-${section}"]`)
    await this.waitForPageLoad()
  }

  /**
   * Check if current viewport is mobile
   */
  async isMobileViewport(): Promise<boolean> {
    const viewport = this.page.viewportSize()
    return viewport ? viewport.width < 768 : false
  }
}

/**
 * Kanban board helpers
 */
export class KanbanHelpers {
  constructor(private page: Page) {}

  /**
   * Drag matter from one column to another
   */
  async dragMatterToColumn(matterId: string, targetColumn: string) {
    const sourceCard = this.page.locator(`[data-testid="matter-card-${matterId}"]`)
    const targetColumnLocator = this.page.locator(`[data-testid="column-${targetColumn}"]`)
    
    // Perform drag and drop
    await sourceCard.dragTo(targetColumnLocator)
    
    // Wait for the drag operation to complete
    await this.waitForDragComplete()
  }

  /**
   * Wait for drag and drop operation to complete
   */
  async waitForDragComplete() {
    // Wait for any loading states to clear
    await this.page.waitForFunction(() => {
      const dragging = document.querySelector('.dragging, [data-dragging="true"]')
      return !dragging
    }, { timeout: 10000 })
    
    // Wait for network idle (API calls complete)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get matters in a specific column
   */
  async getMattersInColumn(columnStatus: string): Promise<string[]> {
    const column = this.page.locator(`[data-testid="column-${columnStatus}"]`)
    const matterCards = column.locator('[data-testid^="matter-card-"]')
    
    const matterIds: string[] = []
    const count = await matterCards.count()
    
    for (let i = 0; i < count; i++) {
      const card = matterCards.nth(i)
      const testId = await card.getAttribute('data-testid')
      if (testId) {
        const matterId = testId.replace('matter-card-', '')
        matterIds.push(matterId)
      }
    }
    
    return matterIds
  }

  /**
   * Create new matter via Kanban interface
   */
  async createNewMatter(matterData: {
    title: string
    client: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    dueDate?: string
  }) {
    // Click create matter button
    await this.page.click('[data-testid="create-matter-button"]')
    
    // Fill matter form
    await this.page.fill('[data-testid="matter-title-input"]', matterData.title)
    await this.page.fill('[data-testid="matter-client-input"]', matterData.client)
    await this.page.selectOption('[data-testid="matter-priority-select"]', matterData.priority)
    
    if (matterData.dueDate) {
      await this.page.fill('[data-testid="matter-due-date-input"]', matterData.dueDate)
    }
    
    // Submit form
    await this.page.click('[data-testid="save-matter-button"]')
    
    // Wait for matter to appear in Kanban board
    await this.page.waitForSelector(`[data-testid*="matter-card"]:has-text("${matterData.title}")`)
  }
}

/**
 * Form helpers
 */
export class FormHelpers {
  constructor(private page: Page) {}

  /**
   * Fill form field and wait for validation
   */
  async fillField(selector: string, value: string) {
    await this.page.fill(selector, value)
    
    // Trigger blur to activate validation
    await this.page.locator(selector).blur()
    
    // Wait for any validation messages to appear
    await this.page.waitForTimeout(300)
  }

  /**
   * Submit form and wait for response
   */
  async submitForm(formSelector: string = 'form') {
    await this.page.click(`${formSelector} [type="submit"]`)
    
    // Wait for form submission to complete
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Check for validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    const errorElements = await this.page.locator('.error, [data-testid*="error"], .text-red').count()
    return errorElements > 0
  }

  /**
   * Get validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const errorElements = this.page.locator('.error, [data-testid*="error"], .text-red')
    const count = await errorElements.count()
    const errors: string[] = []
    
    for (let i = 0; i < count; i++) {
      const errorText = await errorElements.nth(i).textContent()
      if (errorText) {
        errors.push(errorText.trim())
      }
    }
    
    return errors
  }
}

/**
 * Wait and assertion helpers
 */
export class WaitHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for element to be visible and stable
   */
  async waitForElement(selector: string, options?: { timeout?: number }) {
    const element = this.page.locator(selector)
    await element.waitFor({ state: 'visible', timeout: options?.timeout })
    
    // Wait for element to be stable (not moving/animating)
    await element.waitFor({ state: 'attached' })
    return element
  }

  /**
   * Wait for text to appear in element
   */
  async waitForText(selector: string, text: string, options?: { timeout?: number }) {
    await this.page.waitForFunction(
      ({ sel, txt }) => {
        const element = document.querySelector(sel)
        return element && element.textContent?.includes(txt)
      },
      { sel: selector, txt: text },
      { timeout: options?.timeout || 10000 }
    )
  }

  /**
   * Wait for API call to complete
   */
  async waitForApiCall(urlPattern: string | RegExp) {
    await this.page.waitForResponse(response => {
      const url = response.url()
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern)
      }
      return urlPattern.test(url)
    })
  }

  /**
   * Wait for multiple conditions
   */
  async waitForAll(conditions: (() => Promise<void>)[]) {
    await Promise.all(conditions.map(condition => condition()))
  }
}

/**
 * Visual testing helpers
 */
export class VisualHelpers {
  constructor(private page: Page) {}

  /**
   * Take screenshot with standardized options
   */
  async takeScreenshot(name: string, options?: {
    fullPage?: boolean
    clip?: { x: number; y: number; width: number; height: number }
  }) {
    return await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: options?.fullPage ?? false,
      clip: options?.clip
    })
  }

  /**
   * Compare visual state of element
   */
  async expectElementToMatchSnapshot(selector: string, name: string) {
    const element = this.page.locator(selector)
    await expect(element).toHaveScreenshot(`${name}.png`)
  }

  /**
   * Wait for animations to complete
   */
  async waitForAnimations() {
    await this.page.waitForFunction(() => {
      return !document.querySelector('.animate, .transition, [style*="transition"]')
    }, { timeout: 5000 })
  }
}

/**
 * Combined page helpers class
 */
export class PageHelpers {
  public auth: AuthHelpers
  public navigation: NavigationHelpers
  public kanban: KanbanHelpers
  public forms: FormHelpers
  public wait: WaitHelpers
  public visual: VisualHelpers

  constructor(public page: Page) {
    this.auth = new AuthHelpers(page)
    this.navigation = new NavigationHelpers(page)
    this.kanban = new KanbanHelpers(page)
    this.forms = new FormHelpers(page)
    this.wait = new WaitHelpers(page)
    this.visual = new VisualHelpers(page)
  }
}

/**
 * Create page helpers instance
 */
export function createPageHelpers(page: Page): PageHelpers {
  return new PageHelpers(page)
}