import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class NavigationComponent extends BasePage {
  // Selectors
  private readonly navbar = '[data-testid="navbar"], nav'
  private readonly logo = '[data-testid="logo"]'
  private readonly kanbanLink = 'a[href="/kanban"], [data-testid="kanban-link"]'
  private readonly mattersLink = 'a[href="/matters"], [data-testid="matters-link"]'
  private readonly profileMenu = '[data-testid="profile-menu"]'
  private readonly logoutButton = 'button:has-text("Logout"), [data-testid="logout-button"]'
  private readonly mobileMenuButton = '[data-testid="mobile-menu-button"]'
  private readonly mobileMenu = '[data-testid="mobile-menu"]'
  private readonly languageToggle = '[data-testid="language-toggle"]'
  private readonly themeToggle = '[data-testid="theme-toggle"]'
  private readonly notificationBell = '[data-testid="notifications"]'

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to Kanban board
   */
  async navigateToKanban() {
    if (this.isMobile()) {
      await this.openMobileMenu()
    }
    await this.clickElement(this.kanbanLink)
    await this.waitForNavigation('/kanban')
  }

  /**
   * Navigate to Matters list
   */
  async navigateToMatters() {
    if (this.isMobile()) {
      await this.openMobileMenu()
    }
    await this.clickElement(this.mattersLink)
    await this.waitForNavigation('/matters')
  }

  /**
   * Open profile menu
   */
  async openProfileMenu() {
    await this.clickElement(this.profileMenu)
  }

  /**
   * Logout
   */
  async logout() {
    await this.openProfileMenu()
    await this.clickElement(this.logoutButton)
    await this.waitForNavigation('/login')
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu() {
    if (!this.isMobile()) {
      throw new Error('Mobile menu is only available in mobile view')
    }
    await this.clickElement(this.mobileMenuButton)
    await this.waitForElement(this.mobileMenu)
  }

  /**
   * Close mobile menu
   */
  async closeMobileMenu() {
    if (!this.isMobile()) {
      throw new Error('Mobile menu is only available in mobile view')
    }
    // Click outside or close button
    await this.page.keyboard.press('Escape')
  }

  /**
   * Toggle language
   */
  async toggleLanguage() {
    await this.clickElement(this.languageToggle)
  }

  /**
   * Get current language
   */
  async getCurrentLanguage(): Promise<string> {
    const toggle = this.page.locator(this.languageToggle)
    return await toggle.textContent() || 'EN'
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    await this.clickElement(this.themeToggle)
  }

  /**
   * Check if dark mode is active
   */
  async isDarkMode(): Promise<boolean> {
    const html = this.page.locator('html')
    const classes = await html.getAttribute('class') || ''
    return classes.includes('dark')
  }

  /**
   * Open notifications
   */
  async openNotifications() {
    await this.clickElement(this.notificationBell)
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    const badge = this.page.locator(`${this.notificationBell} [data-testid="notification-count"]`)
    if (await badge.count() === 0) {
      return 0
    }
    const text = await badge.textContent() || '0'
    return parseInt(text, 10)
  }

  /**
   * Assert user is logged in
   */
  async assertLoggedIn(userName?: string) {
    await this.assertElementVisible(this.profileMenu)
    if (userName) {
      await this.assertElementContainsText(this.profileMenu, userName)
    }
  }

  /**
   * Assert user is logged out
   */
  async assertLoggedOut() {
    // Should redirect to login page
    await this.assertURL('/login')
  }

  /**
   * Get current page from navigation
   */
  async getCurrentPage(): Promise<string> {
    // Check which nav link is active
    const activeLink = this.page.locator('nav a[aria-current="page"], nav a.active')
    if (await activeLink.count() > 0) {
      return await activeLink.getAttribute('href') || ''
    }
    return ''
  }

  /**
   * Assert navigation item is active
   */
  async assertNavItemActive(href: string) {
    const link = this.page.locator(`nav a[href="${href}"]`)
    const isActive = await link.evaluate(el => {
      return el.classList.contains('active') || el.getAttribute('aria-current') === 'page'
    })
    if (!isActive) {
      throw new Error(`Navigation item ${href} is not active`)
    }
  }
}