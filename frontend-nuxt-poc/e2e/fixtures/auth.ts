import { test as base, type Page } from '@playwright/test'
import { LoginPage } from '../pages'

// Define user roles
export const users = {
  lawyer: {
    email: 'lawyer@example.com',
    password: 'password123',
    role: 'lawyer',
    name: 'John Lawyer'
  },
  clerk: {
    email: 'clerk@example.com',
    password: 'password123',
    role: 'clerk',
    name: 'Jane Clerk'
  },
  client: {
    email: 'client@example.com',
    password: 'password123',
    role: 'client',
    name: 'ABC Company'
  }
} as const

type UserRole = keyof typeof users

// Extend test with authenticated page
export const test = base.extend<{
  authenticatedPage: Page
  userRole: UserRole
}>({
  userRole: ['lawyer', { option: true }],
  
  authenticatedPage: async ({ page, userRole }, use: (page: Page) => Promise<void>) => {
    // Login before test
    const loginPage = new LoginPage(page)
    const user = users[userRole]
    
    await loginPage.goto()
    await loginPage.login(user.email, user.password)
    await loginPage.assertLoginSuccess()
    
    // Use authenticated page in test
    await use(page)
    
    // Cleanup after test
    await loginPage.clearLocalStorage()
  }
})

export { expect } from '@playwright/test'