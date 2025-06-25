import { test, expect } from '@playwright/test'
import { LoginPage, NavigationComponent } from '../pages'

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage
  let navigation: NavigationComponent

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    navigation = new NavigationComponent(page)
    
    // Clear any existing auth state
    await page.context().clearCookies()
    await loginPage.clearLocalStorage()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.goto()
    
    // Fill login form
    await loginPage.login('lawyer@example.com', 'password123')
    
    // Assert successful login
    await loginPage.assertLoginSuccess()
    await navigation.assertLoggedIn()
    
    // Check auth token exists
    const token = await loginPage.getLocalStorageItem('auth-token')
    expect(token).toBeTruthy()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.goto()
    
    // Try to login with invalid credentials
    await loginPage.login('invalid@example.com', 'wrongpassword')
    
    // Assert login failure
    await loginPage.assertLoginFailure()
    const errorMessage = await loginPage.getErrorMessage()
    expect(errorMessage).toContain('Invalid credentials')
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await loginPage.goto()
    
    // Try to submit empty form
    await loginPage.submitLogin()
    
    // Should show validation errors
    await loginPage.assertElementVisible('[role="alert"]')
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await loginPage.goto()
    await loginPage.login('lawyer@example.com', 'password123')
    await loginPage.assertLoginSuccess()
    
    // Then logout
    await navigation.logout()
    
    // Assert logged out
    await navigation.assertLoggedOut()
    const token = await loginPage.getLocalStorageItem('auth-token')
    expect(token).toBeNull()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access kanban without login
    await page.goto('/kanban')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should persist login with remember me', async ({ page }) => {
    await loginPage.goto()
    
    // Login with remember me
    await loginPage.login('lawyer@example.com', 'password123', true)
    await loginPage.assertLoginSuccess()
    
    // Check remember me token
    const rememberToken = await loginPage.getLocalStorageItem('remember-token')
    expect(rememberToken).toBeTruthy()
  })

  test('should handle session expiry gracefully', async ({ page }) => {
    // Login first
    await loginPage.goto()
    await loginPage.login('lawyer@example.com', 'password123')
    await loginPage.assertLoginSuccess()
    
    // Simulate token expiry by removing it
    await page.evaluate(() => {
      localStorage.removeItem('auth-token')
    })
    
    // Try to navigate
    await page.goto('/kanban')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should work with different user roles', async ({ page }) => {
    const roles = [
      { email: 'lawyer@example.com', password: 'password123', role: 'lawyer' },
      { email: 'clerk@example.com', password: 'password123', role: 'clerk' },
      { email: 'client@example.com', password: 'password123', role: 'client' }
    ]
    
    for (const user of roles) {
      // Clear previous session
      await loginPage.clearLocalStorage()
      
      // Login with different role
      await loginPage.goto()
      await loginPage.login(user.email, user.password)
      await loginPage.assertLoginSuccess()
      
      // Check role is stored
      const userInfo = await loginPage.getLocalStorageItem('user-info')
      expect(userInfo).toContain(user.role)
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    await loginPage.goto()
    
    // Mock network failure
    await page.route('**/api/auth/login', route => {
      route.abort('failed')
    })
    
    // Try to login
    await loginPage.login('lawyer@example.com', 'password123')
    
    // Should show error
    const errorMessage = await loginPage.getErrorMessage()
    expect(errorMessage).toContain('Network error')
  })

  test('should navigate to forgot password', async ({ page }) => {
    await loginPage.goto()
    
    // Click forgot password link
    await loginPage.clickForgotPassword()
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL('/forgot-password')
  })
})