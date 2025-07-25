# T07_S02 - E2E Integration Tests

## Task Overview
**Duration**: 4 hours  
**Priority**: Medium  
**Dependencies**: T01_S02_AuthStore_API_Integration, T04_S02_Route_Protection_Verification  
**Sprint**: S02_M001_INTEGRATION  

## Objective
Create comprehensive end-to-end integration tests using Playwright to verify the complete authentication flow works correctly with real backend integration.

## Background
E2E tests ensure the entire authentication system works as expected from the user's perspective, including:
- Full login flow with real API calls
- 2FA verification process
- Route protection and redirects
- Token refresh during navigation
- Error handling and user feedback
- Cross-browser compatibility

## Technical Requirements

### 1. Test Configuration and Setup
Configure Playwright for the authentication testing:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      command: 'bun run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'bun run backend:dev',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
```

### 2. Test Utilities and Fixtures
Create reusable test utilities:

```typescript
// tests/e2e/utils/auth-helpers.ts
import { Page, expect } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  name: string
  role: string
  twoFactorEnabled: boolean
}

export const testUsers: Record<string, TestUser> = {
  lawyer: {
    email: 'lawyer@test.com',
    password: 'Password123!',
    name: '田中 太郎',
    role: '弁護士',
    twoFactorEnabled: false
  },
  clerk: {
    email: 'clerk@test.com',
    password: 'Password123!',
    name: '佐藤 花子',
    role: '事務員',
    twoFactorEnabled: true
  },
  client: {
    email: 'client@test.com',
    password: 'Password123!',
    name: '鈴木 一郎',
    role: '依頼者',
    twoFactorEnabled: false
  }
}

export class AuthPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(user: TestUser) {
    await this.page.fill('[data-testid="email-input"]', user.email)
    await this.page.fill('[data-testid="password-input"]', user.password)
    await this.page.click('[data-testid="login-button"]')
  }

  async loginWithRememberMe(user: TestUser) {
    await this.page.fill('[data-testid="email-input"]', user.email)
    await this.page.fill('[data-testid="password-input"]', user.password)
    await this.page.check('[data-testid="remember-me-checkbox"]')
    await this.page.click('[data-testid="login-button"]')
  }

  async verify2FA(token: string) {
    await this.page.fill('[data-testid="2fa-token-input"]', token)
    await this.page.click('[data-testid="verify-2fa-button"]')
  }

  async requestPasswordReset(email: string) {
    await this.page.click('[data-testid="forgot-password-link"]')
    await this.page.fill('[data-testid="reset-email-input"]', email)
    await this.page.click('[data-testid="reset-password-button"]')
  }

  async expectLoginError(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message)
  }

  async expectValidationError(field: string, message: string) {
    await expect(this.page.locator(`[data-testid="${field}-error"]`)).toContainText(message)
  }

  async expectLoadingState() {
    await expect(this.page.locator('[data-testid="login-button"]')).toBeDisabled()
    await expect(this.page.locator('[data-testid="loading-spinner"]')).toBeVisible()
  }
}

export class DashboardPage {
  constructor(private page: Page) {}

  async expectUserLoggedIn(user: TestUser) {
    await expect(this.page.locator('[data-testid="user-name"]')).toContainText(user.name)
    await expect(this.page.locator('[data-testid="user-role"]')).toContainText(user.role)
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]')
    await this.page.click('[data-testid="logout-button"]')
  }

  async navigateToProtectedRoute(route: string) {
    await this.page.goto(route)
  }
}

export async function setupTestData(page: Page) {
  // Set up test database state
  await page.request.post('/api/test/setup', {
    data: { action: 'reset' }
  })
}

export async function cleanupTestData(page: Page) {
  // Clean up test database state
  await page.request.post('/api/test/cleanup', {
    data: { action: 'cleanup' }
  })
}
```

### 3. Authentication Flow Tests
Test complete authentication workflows:

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test'
import { AuthPage, DashboardPage, testUsers, setupTestData, cleanupTestData } from '../utils/auth-helpers'

test.describe('Authentication Flow', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    await setupTestData(page)
    await authPage.goto()
  })

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page)
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    const user = testUsers.lawyer
    
    await authPage.login(user)
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await dashboardPage.expectUserLoggedIn(user)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await authPage.login({
      email: 'invalid@example.com',
      password: 'wrongpassword',
      name: '',
      role: '',
      twoFactorEnabled: false
    })

    await authPage.expectLoginError('メールアドレスまたはパスワードが正しくありません')
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should handle 2FA flow correctly', async ({ page }) => {
    const user = testUsers.clerk
    
    await authPage.login(user)
    
    // Should show 2FA form
    await expect(page.locator('[data-testid="2fa-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="2fa-instruction"]')).toContainText('認証コードを入力してください')
    
    // Enter valid 2FA token
    await authPage.verify2FA('123456')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await dashboardPage.expectUserLoggedIn(user)
  })

  test('should show error for invalid 2FA token', async ({ page }) => {
    const user = testUsers.clerk
    
    await authPage.login(user)
    await authPage.verify2FA('000000')
    
    await authPage.expectLoginError('認証コードが正しくありません')
    
    // Should stay on 2FA form
    await expect(page.locator('[data-testid="2fa-form"]')).toBeVisible()
  })

  test('should validate form fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="login-button"]')
    
    await authPage.expectValidationError('email', 'メールアドレスを入力してください')
    await authPage.expectValidationError('password', 'パスワードを入力してください')
  })

  test('should validate email format', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    await authPage.expectValidationError('email', '有効なメールアドレスを入力してください')
  })

  test('should validate password length', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'user@example.com')
    await page.fill('[data-testid="password-input"]', '123')
    await page.click('[data-testid="login-button"]')
    
    await authPage.expectValidationError('password', 'パスワードは8文字以上で入力してください')
  })

  test('should show loading state during login', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('/api/v1/auth/login', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })

    const user = testUsers.lawyer
    await authPage.login(user)
    
    await authPage.expectLoadingState()
  })
})
```

### 4. Route Protection Tests
Test route protection and authorization:

```typescript
// tests/e2e/auth/route-protection.spec.ts
import { test, expect } from '@playwright/test'
import { AuthPage, DashboardPage, testUsers, setupTestData } from '../utils/auth-helpers'

test.describe('Route Protection', () => {
  let authPage: AuthPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    await setupTestData(page)
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should allow access to protected routes after login', async ({ page }) => {
    await authPage.goto()
    await authPage.login(testUsers.lawyer)
    
    // Should be able to access dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Should be able to navigate to other protected routes
    await page.goto('/matters')
    await expect(page).toHaveURL('/matters')
    
    await page.goto('/clients')
    await expect(page).toHaveURL('/clients')
  })

  test('should enforce role-based access control', async ({ page }) => {
    // Login as client (limited permissions)
    await authPage.goto()
    await authPage.login(testUsers.client)
    
    // Should be able to access dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Should not be able to access admin routes
    await page.goto('/admin')
    await expect(page.locator('[data-testid="error-403"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('この機能にアクセスする権限がありません')
  })

  test('should redirect authenticated users away from login page', async ({ page }) => {
    // Login first
    await authPage.goto()
    await authPage.login(testUsers.lawyer)
    await expect(page).toHaveURL('/dashboard')
    
    // Try to visit login page
    await page.goto('/login')
    
    // Should redirect back to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle session expiry during navigation', async ({ page }) => {
    // Login first
    await authPage.goto()
    await authPage.login(testUsers.lawyer)
    await expect(page).toHaveURL('/dashboard')
    
    // Mock session expiry
    await page.evaluate(() => {
      sessionStorage.clear()
    })
    
    // Try to navigate to protected route
    await page.goto('/matters')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})
```

### 5. Token Refresh Tests
Test automatic token refresh functionality:

```typescript
// tests/e2e/auth/token-refresh.spec.ts
import { test, expect } from '@playwright/test'
import { AuthPage, DashboardPage, testUsers, setupTestData } from '../utils/auth-helpers'

test.describe('Token Refresh', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestData(page)
  })

  test('should refresh token automatically before expiry', async ({ page }) => {
    const authPage = new AuthPage(page)
    const dashboardPage = new DashboardPage(page)
    
    // Mock short token expiry (30 seconds)
    await page.addInitScript(() => {
      const originalFetch = window.fetch
      window.fetch = function(...args) {
        const [url, options] = args
        if (url.includes('/auth/login')) {
          return originalFetch(...args).then(response => {
            return response.json().then(data => {
              if (data.tokens) {
                data.tokens.expiresIn = 30 // 30 seconds
              }
              return new Response(JSON.stringify(data), {
                status: response.status,
                headers: response.headers
              })
            })
          })
        }
        return originalFetch(...args)
      }
    })
    
    await authPage.goto()
    await authPage.login(testUsers.lawyer)
    await expect(page).toHaveURL('/dashboard')
    
    // Wait for token refresh (should happen after ~25 seconds)
    await page.waitForTimeout(26000)
    
    // Should still be authenticated and able to make API calls
    await page.goto('/matters')
    await expect(page).toHaveURL('/matters')
    
    // Check that no login redirect occurred
    await expect(page.locator('[data-testid="matters-list"]')).toBeVisible()
  })

  test('should logout when refresh fails', async ({ page }) => {
    const authPage = new AuthPage(page)
    
    await authPage.goto()
    await authPage.login(testUsers.lawyer)
    await expect(page).toHaveURL('/dashboard')
    
    // Mock refresh endpoint to fail
    await page.route('/api/v1/auth/refresh', route => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Refresh token is invalid'
          }
        })
      })
    })
    
    // Trigger refresh by navigating
    await page.evaluate(() => {
      // Clear access token to force refresh
      sessionStorage.removeItem('access_token')
    })
    
    await page.goto('/matters')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})
```

### 6. Cross-Browser and Mobile Tests
Test compatibility across different browsers and devices:

```typescript
// tests/e2e/auth/cross-browser.spec.ts
import { test, expect, devices } from '@playwright/test'
import { AuthPage, testUsers, setupTestData } from '../utils/auth-helpers'

// Test on different browsers
const browsers = ['chromium', 'firefox', 'webkit']

browsers.forEach(browserName => {
  test.describe(`Authentication on ${browserName}`, () => {
    test.use({ ...devices[browserName === 'webkit' ? 'Desktop Safari' : `Desktop ${browserName === 'chromium' ? 'Chrome' : 'Firefox'}`] })
    
    test(`should login successfully on ${browserName}`, async ({ page }) => {
      await setupTestData(page)
      
      const authPage = new AuthPage(page)
      await authPage.goto()
      await authPage.login(testUsers.lawyer)
      
      await expect(page).toHaveURL('/dashboard')
    })
  })
})

// Mobile-specific tests
test.describe('Mobile Authentication', () => {
  test.use({ ...devices['iPhone 12'] })
  
  test('should login on mobile device', async ({ page }) => {
    await setupTestData(page)
    
    const authPage = new AuthPage(page)
    await authPage.goto()
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible()
    
    await authPage.login(testUsers.lawyer)
    await expect(page).toHaveURL('/dashboard')
  })
  
  test('should handle mobile keyboard interactions', async ({ page }) => {
    await setupTestData(page)
    
    const authPage = new AuthPage(page)
    await authPage.goto()
    
    // Test mobile-specific interactions
    await page.locator('[data-testid="email-input"]').tap()
    await page.keyboard.type(testUsers.lawyer.email)
    
    await page.locator('[data-testid="password-input"]').tap()
    await page.keyboard.type(testUsers.lawyer.password)
    
    await page.locator('[data-testid="login-button"]').tap()
    
    await expect(page).toHaveURL('/dashboard')
  })
})
```

### 7. Performance and Load Tests
Test authentication performance under load:

```typescript
// tests/e2e/auth/performance.spec.ts
import { test, expect } from '@playwright/test'
import { AuthPage, testUsers, setupTestData } from '../utils/auth-helpers'

test.describe('Authentication Performance', () => {
  test('should login within acceptable time limits', async ({ page }) => {
    await setupTestData(page)
    
    const authPage = new AuthPage(page)
    await authPage.goto()
    
    const startTime = Date.now()
    await authPage.login(testUsers.lawyer)
    await expect(page).toHaveURL('/dashboard')
    const endTime = Date.now()
    
    const loginTime = endTime - startTime
    expect(loginTime).toBeLessThan(3000) // Should complete within 3 seconds
  })

  test('should handle multiple simultaneous login attempts', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ])
    
    const pages = await Promise.all(contexts.map(context => context.newPage()))
    
    // Setup test data for all pages
    await Promise.all(pages.map(page => setupTestData(page)))
    
    // Perform simultaneous logins
    const loginPromises = pages.map(async (page, index) => {
      const authPage = new AuthPage(page)
      await authPage.goto()
      await authPage.login(testUsers.lawyer)
      await expect(page).toHaveURL('/dashboard')
    })
    
    await Promise.all(loginPromises)
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()))
  })
})
```

## Implementation Steps

1. **Test configuration and utilities** (1 hour)
   - Set up Playwright configuration
   - Create test utilities and page objects
   - Set up test data management

2. **Core authentication tests** (1.5 hours)
   - Login flow tests
   - 2FA verification tests
   - Form validation tests
   - Error handling tests

3. **Route protection and integration tests** (1 hour)
   - Route protection tests
   - Token refresh tests
   - Session management tests

4. **Cross-browser and performance tests** (0.5 hours)
   - Cross-browser compatibility
   - Mobile device testing
   - Performance benchmarks

## Success Criteria

- [ ] All authentication flows work end-to-end
- [ ] Route protection enforced correctly
- [ ] Token refresh works seamlessly
- [ ] Cross-browser compatibility verified
- [ ] Mobile experience tested
- [ ] Performance meets targets (<3s login)
- [ ] Error scenarios handled properly
- [ ] Tests are reliable and maintainable

## Files to Create

- `tests/e2e/utils/auth-helpers.ts` - Test utilities and page objects
- `tests/e2e/auth/login.spec.ts` - Core authentication tests
- `tests/e2e/auth/route-protection.spec.ts` - Route protection tests
- `tests/e2e/auth/token-refresh.spec.ts` - Token refresh tests
- `tests/e2e/auth/cross-browser.spec.ts` - Cross-browser tests
- `tests/e2e/auth/performance.spec.ts` - Performance tests
- `playwright.config.ts` - Playwright configuration

## Technical References

### Architecture Guidelines
- Reference: `/archived-2025-07-23/frontend/docs/developer-guide/architecture.md` - E2E testing strategies and cross-browser compatibility requirements
- Reference: `/archived-2025-07-23/frontend/CLAUDE.md` - Playwright integration patterns and testing best practices
- Reference: `frontend/app/mocks/handlers/auth.ts` - Test user data and authentication flow patterns
- Reference: `frontend/app/schemas/auth.ts` - Form validation patterns for E2E testing

### Design Patterns
- Use Playwright with page object pattern for maintainable tests
- Follow the established test user patterns from mock handlers
- Implement cross-browser testing strategies from architecture documentation
- Use the authentication flow patterns for complete user journey testing

## Related Tasks

- T01_S02_AuthStore_API_Integration
- T04_S02_Route_Protection_Verification
- T08_S02_Security_Production_Readiness

---

**Note**: E2E tests provide confidence that the entire authentication system works correctly. Run these tests regularly and maintain them as the application evolves.