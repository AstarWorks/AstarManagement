# Testing Guide - Aster Management

This guide covers testing strategies, patterns, and best practices for the Nuxt.js frontend application.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Testing with Vitest](#unit-testing-with-vitest)
3. [Component Testing](#component-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing with Playwright](#end-to-end-testing-with-playwright)
6. [Testing Patterns](#testing-patterns)
7. [Mocking Strategies](#mocking-strategies)
8. [Performance Testing](#performance-testing)

## Testing Strategy

### Testing Pyramid

Our testing strategy follows the testing pyramid approach:

```
        ┌─────────────────┐
        │   E2E Tests     │  ← Few, slow, high confidence
        │    (10%)        │
        ├─────────────────┤
        │ Integration     │  ← Some, medium speed
        │ Tests (20%)     │
        ├─────────────────┤
        │   Unit Tests    │  ← Many, fast, focused
        │    (70%)        │
        └─────────────────┘
```

### Test Types

#### 1. Unit Tests (70%)
- **Purpose**: Test individual functions and composables
- **Tools**: Vitest
- **Scope**: Pure functions, utility functions, composables
- **Speed**: Very fast (< 1ms per test)

#### 2. Component Tests (Integration - 20%)
- **Purpose**: Test Vue components in isolation
- **Tools**: Vitest + Vue Test Utils
- **Scope**: Component behavior, props, events, user interactions
- **Speed**: Fast (< 100ms per test)

#### 3. E2E Tests (10%)
- **Purpose**: Test complete user workflows
- **Tools**: Playwright
- **Scope**: Critical user journeys, cross-browser compatibility
- **Speed**: Slow (1-10s per test)

### Test Configuration

#### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.')
    }
  }
})
```

## Unit Testing with Vitest

### Testing Utilities

Test pure utility functions:

```typescript
// utils/formatDate.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate, formatRelativeTime, parseDate } from './formatDate'

describe('formatDate', () => {
  it('should format date in default locale', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    expect(formatDate(date)).toBe('January 15, 2024')
  })
  
  it('should format date with custom format', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    expect(formatDate(date, 'short')).toBe('1/15/24')
  })
  
  it('should handle invalid dates', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('invalid')).toBe('Invalid Date')
  })
  
  it('should format dates in Japanese locale', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    expect(formatDate(date, 'long', 'ja-JP')).toBe('2024年1月15日')
  })
})

describe('formatRelativeTime', () => {
  it('should format relative time correctly', () => {
    const now = new Date('2024-01-15T10:30:00Z')
    const oneHourAgo = new Date('2024-01-15T09:30:00Z')
    
    expect(formatRelativeTime(oneHourAgo, now)).toBe('1 hour ago')
  })
  
  it('should handle future dates', () => {
    const now = new Date('2024-01-15T10:30:00Z')
    const oneHourLater = new Date('2024-01-15T11:30:00Z')
    
    expect(formatRelativeTime(oneHourLater, now)).toBe('in 1 hour')
  })
})
```

### Testing Composables

Test Vue 3 composables:

```typescript
// composables/useApi.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useApi } from './useApi'

// Mock $fetch
const mockFetch = vi.fn()
vi.mock('#app', () => ({
  $fetch: mockFetch
}))

describe('useApi', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  it('should fetch data successfully', async () => {
    const mockData = { id: '1', title: 'Test Case' }
    mockFetch.mockResolvedValue(mockData)
    
    const { data, loading, error, execute } = useApi('/api/cases/1')
    
    expect(loading.value).toBe(false)
    expect(data.value).toBe(null)
    expect(error.value).toBe(null)
    
    await execute()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/cases/1')
    expect(data.value).toEqual(mockData)
    expect(loading.value).toBe(false)
    expect(error.value).toBe(null)
  })
  
  it('should handle fetch errors', async () => {
    const mockError = new Error('Network error')
    mockFetch.mockRejectedValue(mockError)
    
    const { data, loading, error, execute } = useApi('/api/cases/1')
    
    await execute()
    
    expect(data.value).toBe(null)
    expect(loading.value).toBe(false)
    expect(error.value).toBe('Network error')
  })
  
  it('should set loading state during fetch', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    mockFetch.mockReturnValue(promise)
    
    const { loading, execute } = useApi('/api/cases/1')
    
    const executePromise = execute()
    expect(loading.value).toBe(true)
    
    resolvePromise({ id: '1' })
    await executePromise
    
    expect(loading.value).toBe(false)
  })
})
```

### Testing Stores

Test Pinia stores:

```typescript
// stores/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

// Mock $fetch and navigation
const mockFetch = vi.fn()
const mockNavigateTo = vi.fn()

vi.mock('#app', () => ({
  $fetch: mockFetch,
  navigateTo: mockNavigateTo,
  useCookie: vi.fn(() => ({ value: null }))
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockClear()
    mockNavigateTo.mockClear()
  })
  
  it('should initialize with default state', () => {
    const store = useAuthStore()
    
    expect(store.user).toBe(null)
    expect(store.token).toBe(null)
    expect(store.isAuthenticated).toBe(false)
    expect(store.isLoading).toBe(false)
  })
  
  it('should login successfully', async () => {
    const mockResponse = {
      user: { id: '1', name: 'John Doe', email: 'john@example.com' },
      token: 'mock-token',
      permissions: ['read', 'write']
    }
    mockFetch.mockResolvedValue(mockResponse)
    
    const store = useAuthStore()
    const credentials = { email: 'john@example.com', password: 'password' }
    
    await store.login(credentials)
    
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    expect(store.user).toEqual(mockResponse.user)
    expect(store.token).toBe(mockResponse.token)
    expect(store.isAuthenticated).toBe(true)
  })
  
  it('should handle login errors', async () => {
    mockFetch.mockRejectedValue(new Error('Invalid credentials'))
    
    const store = useAuthStore()
    const credentials = { email: 'john@example.com', password: 'wrong' }
    
    await expect(store.login(credentials)).rejects.toThrow('Login failed')
    expect(store.user).toBe(null)
    expect(store.token).toBe(null)
    expect(store.isAuthenticated).toBe(false)
  })
  
  it('should logout successfully', async () => {
    const store = useAuthStore()
    
    // Set initial authenticated state
    store.$patch({
      user: { id: '1', name: 'John Doe' },
      token: 'mock-token'
    })
    
    expect(store.isAuthenticated).toBe(true)
    
    await store.logout()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST'
    })
    expect(store.user).toBe(null)
    expect(store.token).toBe(null)
    expect(store.isAuthenticated).toBe(false)
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/login')
  })
})
```

## Component Testing

### Testing UI Components

Test Vue components with Vue Test Utils:

```typescript
// components/ui/Button.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
  it('should render with default props', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('bg-primary')
    expect(wrapper.classes()).toContain('h-10')
  })
  
  it('should apply variant classes', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'destructive'
      },
      slots: {
        default: 'Delete'
      }
    })
    
    expect(wrapper.classes()).toContain('bg-destructive')
    expect(wrapper.classes()).not.toContain('bg-primary')
  })
  
  it('should apply size classes', () => {
    const wrapper = mount(Button, {
      props: {
        size: 'lg'
      },
      slots: {
        default: 'Large Button'
      }
    })
    
    expect(wrapper.classes()).toContain('h-11')
    expect(wrapper.classes()).not.toContain('h-10')
  })
  
  it('should emit click event', async () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('click')?.[0]).toEqual([expect.any(MouseEvent)])
  })
  
  it('should not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Disabled'
      }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.find('button').element.disabled).toBe(true)
  })
  
  it('should show loading state', () => {
    const wrapper = mount(Button, {
      props: {
        loading: true
      },
      slots: {
        default: 'Loading'
      }
    })
    
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
    expect(wrapper.find('button').element.disabled).toBe(true)
  })
})
```

### Testing Form Components

Test form components with validation:

```typescript
// components/forms/CaseForm.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CaseForm from './CaseForm.vue'

// Mock the validation schema
vi.mock('~/schemas/case', () => ({
  caseSchema: {
    safeParse: vi.fn()
  }
}))

describe('CaseForm', () => {
  it('should render all form fields', () => {
    const wrapper = mount(CaseForm)
    
    expect(wrapper.find('[data-testid="case-title"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="case-description"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="case-status"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="submit-button"]').exists()).toBe(true)
  })
  
  it('should populate fields with initial values', () => {
    const initialCase = {
      title: 'Test Case',
      description: 'Test Description',
      status: 'active'
    }
    
    const wrapper = mount(CaseForm, {
      props: {
        initialValues: initialCase
      }
    })
    
    expect(wrapper.find('[data-testid="case-title"]').element.value).toBe('Test Case')
    expect(wrapper.find('[data-testid="case-description"]').element.value).toBe('Test Description')
    expect(wrapper.find('[data-testid="case-status"]').element.value).toBe('active')
  })
  
  it('should emit submit event with form data', async () => {
    const wrapper = mount(CaseForm)
    
    // Fill form
    await wrapper.find('[data-testid="case-title"]').setValue('New Case')
    await wrapper.find('[data-testid="case-description"]').setValue('New Description')
    await wrapper.find('[data-testid="case-status"]').setValue('draft')
    
    // Submit form
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')?.[0]).toEqual([{
      title: 'New Case',
      description: 'New Description',
      status: 'draft'
    }])
  })
  
  it('should show validation errors', async () => {
    const wrapper = mount(CaseForm)
    
    // Submit form without filling required fields
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    
    expect(wrapper.find('[data-testid="title-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="title-error"]').text()).toContain('required')
  })
  
  it('should disable submit button when form is invalid', async () => {
    const wrapper = mount(CaseForm)
    
    const submitButton = wrapper.find('[data-testid="submit-button"]')
    expect(submitButton.element.disabled).toBe(true)
    
    // Fill required fields
    await wrapper.find('[data-testid="case-title"]').setValue('Valid Title')
    await wrapper.find('[data-testid="case-description"]').setValue('Valid Description')
    await nextTick()
    
    expect(submitButton.element.disabled).toBe(false)
  })
})
```

## Integration Testing

### Testing API Integration

Test components with API calls:

```typescript
// components/legal/CaseList.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CaseList from './CaseList.vue'

const mockCases = [
  {
    id: '1',
    title: 'Case 1',
    description: 'Description 1',
    status: 'active',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    title: 'Case 2',
    description: 'Description 2',
    status: 'completed',
    createdAt: '2024-01-02'
  }
]

const mockFetch = vi.fn()
vi.mock('#app', () => ({
  $fetch: mockFetch
}))

describe('CaseList', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })
  
  it('should display loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    const wrapper = mount(CaseList, {
      global: {
        plugins: [createTestingPinia()]
      }
    })
    
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="case-card"]').exists()).toBe(false)
  })
  
  it('should display cases when loaded', async () => {
    mockFetch.mockResolvedValue({ data: mockCases })
    
    const wrapper = mount(CaseList, {
      global: {
        plugins: [createTestingPinia()]
      }
    })
    
    // Wait for async operations
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
    })
    
    expect(wrapper.findAll('[data-testid="case-card"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Case 1')
    expect(wrapper.text()).toContain('Case 2')
  })
  
  it('should display error message on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    
    const wrapper = mount(CaseList, {
      global: {
        plugins: [createTestingPinia()]
      }
    })
    
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
    })
    
    expect(wrapper.find('[data-testid="error"]').text()).toContain('Network error')
  })
  
  it('should emit case-selected event when case is clicked', async () => {
    mockFetch.mockResolvedValue({ data: mockCases })
    
    const wrapper = mount(CaseList, {
      global: {
        plugins: [createTestingPinia()]
      }
    })
    
    await vi.waitFor(() => {
      expect(wrapper.findAll('[data-testid="case-card"]')).toHaveLength(2)
    })
    
    await wrapper.find('[data-testid="case-card"]').trigger('click')
    
    expect(wrapper.emitted('case-selected')).toHaveLength(1)
    expect(wrapper.emitted('case-selected')?.[0]).toEqual([mockCases[0]])
  })
})
```

## End-to-End Testing with Playwright

### E2E Test Setup

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
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'bun dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

### E2E Test Examples

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Fill login form
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })
  
  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Fill form with invalid credentials
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })
  
  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Click logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login')
  })
})
```

### Testing User Workflows

```typescript
// tests/e2e/case-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Case Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
  })
  
  test('should create a new case', async ({ page }) => {
    await page.goto('/cases')
    
    // Click new case button
    await page.click('[data-testid="new-case-button"]')
    await expect(page).toHaveURL('/cases/new')
    
    // Fill case form
    await page.fill('[data-testid="case-title"]', 'Test Case E2E')
    await page.fill('[data-testid="case-description"]', 'This is a test case created via E2E test')
    await page.selectOption('[data-testid="case-status"]', 'active')
    await page.selectOption('[data-testid="case-priority"]', 'high')
    
    // Submit form
    await page.click('[data-testid="submit-button"]')
    
    // Should redirect to case details
    await expect(page).toHaveURL(/\/cases\/\w+/)
    await expect(page.locator('h1')).toContainText('Test Case E2E')
  })
  
  test('should filter cases by status', async ({ page }) => {
    await page.goto('/cases')
    
    // Wait for cases to load
    await expect(page.locator('[data-testid="case-card"]').first()).toBeVisible()
    
    // Count initial cases
    const initialCount = await page.locator('[data-testid="case-card"]').count()
    
    // Apply status filter
    await page.click('[data-testid="filter-button"]')
    await page.check('[data-testid="status-filter-active"]')
    await page.click('[data-testid="apply-filters"]')
    
    // Should show filtered results
    const filteredCount = await page.locator('[data-testid="case-card"]').count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
    
    // All visible cases should have active status
    const activeStatuses = await page.locator('[data-testid="case-status"]:has-text("Active")').count()
    expect(activeStatuses).toBe(filteredCount)
  })
  
  test('should drag and drop case between columns in kanban view', async ({ page }) => {
    await page.goto('/cases')
    
    // Switch to kanban view
    await page.click('[data-testid="view-kanban"]')
    
    // Wait for kanban board to load
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible()
    
    // Find a case in draft column
    const draftCase = page.locator('[data-testid="kanban-column-draft"] [data-testid="case-card"]').first()
    await expect(draftCase).toBeVisible()
    
    // Get case title for verification
    const caseTitle = await draftCase.locator('[data-testid="case-title"]').textContent()
    
    // Drag case to active column
    const activeColumn = page.locator('[data-testid="kanban-column-active"]')
    await draftCase.dragTo(activeColumn)
    
    // Verify case moved to active column
    const activeCase = activeColumn.locator(`[data-testid="case-card"]:has-text("${caseTitle}")`)
    await expect(activeCase).toBeVisible()
  })
})
```

## Testing Patterns

### Test Utilities

Create reusable test utilities:

```typescript
// tests/utils/test-utils.ts
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'

export function createWrapper(component: any, options: any = {}) {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {}
    }
  })
  
  return mount(component, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn
        }),
        i18n
      ],
      stubs: {
        Teleport: true,
        Transition: false
      },
      ...options.global
    },
    ...options
  })
}

export function mockUser(overrides = {}) {
  return {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'lawyer',
    ...overrides
  }
}

export function mockCase(overrides = {}) {
  return {
    id: '1',
    title: 'Test Case',
    description: 'Test Description',
    status: 'active',
    priority: 'medium',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides
  }
}

export async function waitForElement(page: any, selector: string) {
  return page.waitForSelector(selector, { state: 'visible' })
}

export async function loginUser(page: any, email = 'test@example.com', password = 'password123') {
  await page.goto('/auth/login')
  await page.fill('[data-testid="email"]', email)
  await page.fill('[data-testid="password"]', password)
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('/dashboard')
}
```

### Custom Matchers

Create custom Jest/Vitest matchers:

```typescript
// tests/setup.ts
import { expect } from 'vitest'

// Extend expect with custom matchers
expect.extend({
  toBeVisible(received) {
    const pass = received && received.style.display !== 'none'
    return {
      message: () => `expected element to ${pass ? 'not ' : ''}be visible`,
      pass
    }
  },
  
  toHaveClass(received, className) {
    const pass = received.classList.contains(className)
    return {
      message: () => `expected element to ${pass ? 'not ' : ''}have class "${className}"`,
      pass
    }
  }
})

// Global test setup
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = ''
  
  // Clear local storage
  localStorage.clear()
  sessionStorage.clear()
})
```

## Mocking Strategies

### API Mocking

Mock API calls consistently:

```typescript
// tests/mocks/api.ts
import { vi } from 'vitest'

export const mockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (message: string, status = 500, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message)
      ;(error as any).status = status
      reject(error)
    }, delay)
  })
}

export const createApiMock = () => {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
}
```

### WebSocket Mocking

Mock WebSocket connections:

```typescript
// tests/mocks/websocket.ts
import { vi } from 'vitest'

export class MockWebSocket {
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  
  readyState = WebSocket.CONNECTING
  
  constructor(public url: string) {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 10)
  }
  
  send = vi.fn((data: string) => {
    // Simulate echo
    setTimeout(() => {
      this.onmessage?.(new MessageEvent('message', { data }))
    }, 10)
  })
  
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  })
  
  // Helper methods for testing
  simulateMessage(data: any) {
    this.onmessage?.(new MessageEvent('message', { 
      data: JSON.stringify(data) 
    }))
  }
  
  simulateError() {
    this.onerror?.(new Event('error'))
  }
}

// Mock WebSocket globally
global.WebSocket = MockWebSocket as any
```

## Performance Testing

### Bundle Size Testing

Test bundle size impact:

```typescript
// tests/performance/bundle-size.test.ts
import { describe, it, expect } from 'vitest'
import { build } from 'vite'
import { resolve } from 'path'

describe('Bundle Size', () => {
  it('should not exceed size limits', async () => {
    const result = await build({
      root: resolve(__dirname, '../..'),
      build: {
        write: false,
        minify: true,
        rollupOptions: {
          output: {
            manualChunks: undefined
          }
        }
      }
    })
    
    if ('output' in result) {
      const mainChunk = result.output.find(chunk => 
        chunk.type === 'chunk' && chunk.isEntry
      )
      
      if (mainChunk && 'code' in mainChunk) {
        const size = Buffer.byteLength(mainChunk.code, 'utf8')
        expect(size).toBeLessThan(250 * 1024) // 250KB limit
      }
    }
  })
})
```

### Component Performance Testing

Test component rendering performance:

```typescript
// tests/performance/component-performance.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { performance } from 'perf_hooks'
import CaseList from '~/components/legal/CaseList.vue'

describe('Component Performance', () => {
  it('should render large lists efficiently', async () => {
    const largeCaseList = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      title: `Case ${i}`,
      description: `Description ${i}`,
      status: 'active'
    }))
    
    const start = performance.now()
    
    const wrapper = mount(CaseList, {
      props: {
        cases: largeCaseList
      }
    })
    
    const end = performance.now()
    const renderTime = end - start
    
    expect(renderTime).toBeLessThan(100) // Should render in under 100ms
    expect(wrapper.findAll('[data-testid="case-card"]')).toHaveLength(1000)
  })
})
```

This comprehensive testing guide provides the foundation for building a robust, well-tested application with confidence in code quality and user experience.