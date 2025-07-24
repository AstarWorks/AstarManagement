import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class LoginPage extends BasePage {
  // Selectors
  private readonly emailInput = 'input[name="email"]'
  private readonly passwordInput = 'input[name="password"]'
  private readonly loginButton = 'button[type="submit"]'
  private readonly errorMessage = '[role="alert"]'
  private readonly forgotPasswordLink = 'a:has-text("Forgot password?")'
  private readonly rememberMeCheckbox = 'input[name="remember"]'

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to login page
   */
  override async goto() {
    await super.goto('/login')
    await this.assertElementVisible(this.emailInput)
  }

  /**
   * Fill login form
   */
  async fillLoginForm(email: string, password: string, rememberMe: boolean = false) {
    await this.fillInput(this.emailInput, email)
    await this.fillInput(this.passwordInput, password)
    
    if (rememberMe) {
      await this.clickElement(this.rememberMeCheckbox)
    }
  }

  /**
   * Submit login form
   */
  async submitLogin() {
    await this.clickElement(this.loginButton)
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.fillLoginForm(email, password, rememberMe)
    await this.submitLogin()
    
    // Wait for either navigation or error
    await Promise.race([
      this.waitForNavigation('/'),
      this.waitForElement(this.errorMessage, 5000).catch(() => {})
    ])
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    if (await this.elementExists(this.errorMessage)) {
      return await this.getElementText(this.errorMessage)
    }
    return ''
  }

  /**
   * Assert login success
   */
  async assertLoginSuccess() {
    await this.assertURL('/')
    // Check for auth token in localStorage
    const token = await this.getLocalStorageItem('auth-token')
    if (!token) {
      throw new Error('Auth token not found in localStorage')
    }
  }

  /**
   * Assert login failure
   */
  async assertLoginFailure(expectedError?: string) {
    await this.assertURL('/login')
    await this.assertElementVisible(this.errorMessage)
    
    if (expectedError) {
      await this.assertElementContainsText(this.errorMessage, expectedError)
    }
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.clickElement(this.forgotPasswordLink)
  }

  /**
   * Check if user is already logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.getLocalStorageItem('auth-token')
    return token !== null
  }

  /**
   * Logout
   */
  async logout() {
    await this.clearLocalStorage()
    await this.goto()
  }

  /**
   * Enter credentials (alias for fillLoginForm)
   */
  async enterCredentials(email: string, password: string) {
    await this.fillLoginForm(email, password)
  }

  /**
   * Submit form (alias for submitLogin)
   */
  async submit() {
    await this.submitLogin()
  }
}