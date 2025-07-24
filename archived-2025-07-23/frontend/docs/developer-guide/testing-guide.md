# Testing Guide

This guide covers testing strategies and patterns for the Aster Management application, including unit tests, integration tests, and end-to-end tests.

## Testing Overview

### Testing Stack

- **Unit Testing**: Vitest + Vue Test Utils
- **Component Testing**: Storybook + Vitest
- **Integration Testing**: Vitest + MSW
- **E2E Testing**: Playwright
- **Visual Testing**: Percy/Chromatic

### Testing Philosophy

1. **Test Behavior, Not Implementation**
2. **Write Tests First (TDD)**
3. **Keep Tests Simple and Focused**
4. **Mock External Dependencies**
5. **Test User Interactions**

## Unit Testing

### Component Testing

```typescript
// tests/components/MatterCard.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import MatterCard from '~/components/matters/MatterCard.vue'
import type { Matter } from '~/types/matter'

describe('MatterCard', () => {
  const mockMatter: Matter = {
    id: '123',
    title: 'Test Matter',
    description: 'Test description',
    status: 'ACTIVE',
    priority: 'HIGH',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  it('renders matter information correctly', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter
      }
    })

    expect(wrapper.find('[data-testid="matter-title"]').text())
      .toBe('Test Matter')
    expect(wrapper.find('[data-testid="matter-status"]').text())
      .toBe('ACTIVE')
    expect(wrapper.find('[data-testid="matter-priority"]').classes())
      .toContain('priority-high')
  })

  it('emits select event when clicked', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter
      }
    })

    await wrapper.trigger('click')
    
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual([mockMatter])
  })

  it('shows edit button for editable matters', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        editable: true
      }
    })

    const editButton = wrapper.find('[data-testid="edit-button"]')
    expect(editButton.exists()).toBe(true)
    
    await editButton.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })

  it('applies correct styling for different statuses', () => {
    const statuses = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']
    
    statuses.forEach(status => {
      const wrapper = mount(MatterCard, {
        props: {
          matter: { ...mockMatter, status }
        }
      })
      
      expect(wrapper.classes()).toContain(`matter-card--${status.toLowerCase()}`)
    })
  })
})
```

### Composable Testing

```typescript
// tests/composables/useMatter.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMatter } from '~/composables/useMatter'

// Mock API
vi.mock('~/utils/api', () => ({
  $api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

describe('useMatter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches matter by ID', async () => {
    const mockMatter = { id: '123', title: 'Test Matter' }
    
    vi.mocked($api.get).mockResolvedValue({ data: mockMatter })
    
    const { matter, loading, fetchMatter } = useMatter('123')
    
    expect(loading.value).toBe(true)
    
    await fetchMatter()
    
    expect(loading.value).toBe(false)
    expect(matter.value).toEqual(mockMatter)
    expect($api.get).toHaveBeenCalledWith('/matters/123')
  })

  it('handles fetch errors', async () => {
    const error = new Error('Network error')
    vi.mocked($api.get).mockRejectedValue(error)
    
    const { matter, error: errorRef, fetchMatter } = useMatter('123')
    
    await fetchMatter()
    
    expect(matter.value).toBeNull()
    expect(errorRef.value).toBe('Failed to fetch matter')
  })

  it('updates matter optimistically', async () => {
    const { matter, updateMatter } = useMatter('123')
    matter.value = { id: '123', title: 'Original' }
    
    const updates = { title: 'Updated' }
    
    // Start update
    const promise = updateMatter(updates)
    
    // Check optimistic update
    expect(matter.value.title).toBe('Updated')
    
    // Resolve promise
    vi.mocked($api.patch).mockResolvedValue({ 
      data: { id: '123', title: 'Updated' } 
    })
    
    await promise
    
    expect($api.patch).toHaveBeenCalledWith('/matters/123', updates)
  })
})
```

### Store Testing

```typescript
// tests/stores/matter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMatterStore } from '~/stores/matter'

describe('MatterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('filters matters by status', () => {
    const store = useMatterStore()
    
    // Add test data
    store.matters = [
      { id: '1', status: 'ACTIVE' },
      { id: '2', status: 'COMPLETED' },
      { id: '3', status: 'ACTIVE' }
    ]
    
    // Apply filter
    store.setFilter('status', 'ACTIVE')
    
    expect(store.filteredMatters).toHaveLength(2)
    expect(store.filteredMatters.every(m => m.status === 'ACTIVE')).toBe(true)
  })

  it('selects and deselects matters', () => {
    const store = useMatterStore()
    const matter = { id: '1', title: 'Test' }
    
    // Select matter
    store.selectMatter(matter.id)
    expect(store.selectedMatterId).toBe('1')
    
    // Deselect
    store.selectMatter(null)
    expect(store.selectedMatterId).toBeNull()
  })

  it('calculates statistics correctly', () => {
    const store = useMatterStore()
    
    store.matters = [
      { id: '1', status: 'ACTIVE', priority: 'HIGH' },
      { id: '2', status: 'ACTIVE', priority: 'LOW' },
      { id: '3', status: 'COMPLETED', priority: 'HIGH' }
    ]
    
    expect(store.statistics).toEqual({
      total: 3,
      active: 2,
      completed: 1,
      highPriority: 2
    })
  })
})
```

## Integration Testing

### API Integration Tests

```typescript
// tests/integration/api/matters.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { $fetch } from '@nuxt/test-utils'

const server = setupServer(
  rest.get('/api/matters', (req, res, ctx) => {
    const status = req.url.searchParams.get('status')
    
    const matters = [
      { id: '1', title: 'Matter 1', status: 'ACTIVE' },
      { id: '2', title: 'Matter 2', status: 'COMPLETED' }
    ]
    
    const filtered = status 
      ? matters.filter(m => m.status === status)
      : matters
    
    return res(ctx.json(filtered))
  }),
  
  rest.post('/api/matters', async (req, res, ctx) => {
    const body = await req.json()
    
    if (!body.title) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Title is required' })
      )
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        id: '3',
        ...body,
        createdAt: new Date().toISOString()
      })
    )
  })
)

beforeAll(() => server.listen())
afterAll(() => server.close())

describe('Matters API Integration', () => {
  it('fetches all matters', async () => {
    const matters = await $fetch('/api/matters')
    
    expect(matters).toHaveLength(2)
    expect(matters[0]).toHaveProperty('id')
    expect(matters[0]).toHaveProperty('title')
  })
  
  it('filters matters by status', async () => {
    const activeMatters = await $fetch('/api/matters?status=ACTIVE')
    
    expect(activeMatters).toHaveLength(1)
    expect(activeMatters[0].status).toBe('ACTIVE')
  })
  
  it('creates new matter', async () => {
    const newMatter = {
      title: 'New Matter',
      description: 'Test description',
      priority: 'HIGH'
    }
    
    const created = await $fetch('/api/matters', {
      method: 'POST',
      body: newMatter
    })
    
    expect(created.id).toBeDefined()
    expect(created.title).toBe('New Matter')
    expect(created.createdAt).toBeDefined()
  })
  
  it('handles validation errors', async () => {
    await expect(
      $fetch('/api/matters', {
        method: 'POST',
        body: { description: 'No title' }
      })
    ).rejects.toThrow('Title is required')
  })
})
```

### Form Integration Tests

```typescript
// tests/integration/forms/MatterForm.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useForm } from 'vee-validate'
import MatterForm from '~/components/forms/MatterForm.vue'
import { waitFor } from '@testing-library/vue'

describe('MatterForm Integration', () => {
  it('validates and submits form correctly', async () => {
    const onSubmit = vi.fn()
    
    const wrapper = mount(MatterForm, {
      props: { onSubmit }
    })
    
    // Fill form fields
    await wrapper.find('input[name="title"]').setValue('Test Matter')
    await wrapper.find('textarea[name="description"]').setValue('Description')
    await wrapper.find('select[name="priority"]').setValue('HIGH')
    
    // Submit form
    await wrapper.find('form').trigger('submit')
    
    // Wait for async validation
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Matter',
        description: 'Description',
        priority: 'HIGH'
      })
    })
  })
  
  it('shows validation errors', async () => {
    const wrapper = mount(MatterForm)
    
    // Submit empty form
    await wrapper.find('form').trigger('submit')
    
    // Check for error messages
    await waitFor(() => {
      expect(wrapper.text()).toContain('Title is required')
      expect(wrapper.text()).toContain('Please select a priority')
    })
    
    // Verify form not submitted
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
  
  it('handles server errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      response: {
        data: {
          errors: {
            title: 'Title already exists'
          }
        }
      }
    })
    
    const wrapper = mount(MatterForm, {
      props: { onSubmit }
    })
    
    // Fill and submit
    await wrapper.find('input[name="title"]').setValue('Duplicate')
    await wrapper.find('form').trigger('submit')
    
    // Check for server error
    await waitFor(() => {
      expect(wrapper.text()).toContain('Title already exists')
    })
  })
})
```

## E2E Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
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
    command: 'bun run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
})
```

### E2E Test Examples

```typescript
// e2e/matters/create-matter.spec.ts
import { test, expect } from '@playwright/test'
import { login } from '../helpers/auth'

test.describe('Create Matter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'lawyer@example.com', 'password')
    await page.goto('/matters/new')
  })

  test('creates new matter successfully', async ({ page }) => {
    // Fill form
    await page.fill('[name="title"]', 'Contract Review - ABC Corp')
    await page.fill('[name="description"]', 'Review service agreement')
    await page.selectOption('[name="priority"]', 'HIGH')
    await page.selectOption('[name="clientId"]', 'client-123')
    
    // Submit
    await page.click('button[type="submit"]')
    
    // Verify redirect
    await expect(page).toHaveURL(/\/matters\/[\w-]+/)
    
    // Verify matter created
    await expect(page.locator('h1')).toContainText('Contract Review - ABC Corp')
    await expect(page.locator('[data-testid="matter-status"]')).toContainText('DRAFT')
  })

  test('validates required fields', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Check validation messages
    await expect(page.locator('text=Title is required')).toBeVisible()
    await expect(page.locator('text=Please select a priority')).toBeVisible()
    
    // Verify still on create page
    await expect(page).toHaveURL('/matters/new')
  })

  test('saves draft and continues later', async ({ page }) => {
    // Start filling form
    await page.fill('[name="title"]', 'Incomplete Matter')
    
    // Save draft
    await page.click('button[data-action="save-draft"]')
    
    // Verify draft saved
    await expect(page.locator('.toast')).toContainText('Draft saved')
    
    // Navigate away and come back
    await page.goto('/matters')
    await page.goto('/matters/new')
    
    // Verify form restored
    await expect(page.locator('[name="title"]')).toHaveValue('Incomplete Matter')
  })
})
```

### Visual Regression Testing

```typescript
// e2e/visual/matter-card.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Matter Card Visual Tests', () => {
  test('matter card states', async ({ page }) => {
    await page.goto('/styleguide/matter-card')
    
    // Capture different states
    await expect(page.locator('[data-state="default"]')).toHaveScreenshot('matter-card-default.png')
    await expect(page.locator('[data-state="hover"]')).toHaveScreenshot('matter-card-hover.png')
    await expect(page.locator('[data-state="selected"]')).toHaveScreenshot('matter-card-selected.png')
    
    // Different statuses
    const statuses = ['draft', 'active', 'completed', 'archived']
    for (const status of statuses) {
      await expect(
        page.locator(`[data-status="${status}"]`)
      ).toHaveScreenshot(`matter-card-${status}.png`)
    }
  })

  test('responsive layouts', async ({ page }) => {
    await page.goto('/matters')
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page).toHaveScreenshot('matters-desktop.png')
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page).toHaveScreenshot('matters-tablet.png')
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page).toHaveScreenshot('matters-mobile.png')
  })
})
```

## Testing Utilities

### Test Helpers

```typescript
// tests/helpers/test-utils.ts
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { vi } from 'vitest'
import type { ComponentMountingOptions } from '@vue/test-utils'

export function mountWithDefaults(
  component: any,
  options: ComponentMountingOptions<any> = {}
): VueWrapper {
  return mount(component, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false
        })
      ],
      stubs: {
        NuxtLink: {
          template: '<a><slot /></a>'
        },
        ClientOnly: {
          template: '<div><slot /></div>'
        }
      }
    },
    ...options
  })
}

// Wait for async updates
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Mock router
export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: {
      value: {
        path: '/',
        params: {},
        query: {}
      }
    }
  }
}
```

### Test Data Factories

```typescript
// tests/factories/matter.ts
import { faker } from '@faker-js/faker'
import type { Matter } from '~/types/matter'

export const createMatter = (overrides: Partial<Matter> = {}): Matter => ({
  id: faker.string.uuid(),
  title: faker.company.catchPhrase(),
  description: faker.lorem.paragraph(),
  status: faker.helpers.arrayElement(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
  priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
  assigneeId: faker.string.uuid(),
  clientId: faker.string.uuid(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides
})

export const createMatters = (count: number = 5): Matter[] => {
  return Array.from({ length: count }, () => createMatter())
}
```

## Test Coverage

### Coverage Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockServiceWorker.js'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
})
```

### Running Coverage

```bash
# Run tests with coverage
bun test:coverage

# Open coverage report
bun test:coverage:ui

# Check coverage thresholds
bun test:coverage:check
```

## Best Practices

### 1. Test Structure

```typescript
// Follow AAA pattern
test('should update matter status', async () => {
  // Arrange
  const matter = createMatter({ status: 'DRAFT' })
  const store = useMatterStore()
  store.addMatter(matter)
  
  // Act
  await store.updateStatus(matter.id, 'ACTIVE')
  
  // Assert
  expect(store.getMatter(matter.id)?.status).toBe('ACTIVE')
})
```

### 2. Test Naming

```typescript
// Use descriptive test names
describe('MatterCard', () => {
  describe('when matter is editable', () => {
    it('should display edit button', () => { ... })
    it('should emit edit event when edit button is clicked', () => { ... })
  })
  
  describe('when matter is readonly', () => {
    it('should not display edit button', () => { ... })
    it('should not allow status changes', () => { ... })
  })
})
```

### 3. Mock Appropriately

```typescript
// Mock external dependencies
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: ref({ id: '1', role: 'lawyer' }),
    isAuthenticated: ref(true)
  })
}))

// Don't mock what you're testing
```

### 4. Test User Behavior

```typescript
// Test from user perspective
test('user can filter matters by status', async () => {
  const { getByRole, getByText } = render(MatterList)
  
  // User clicks filter dropdown
  await userEvent.click(getByRole('button', { name: 'Filter' }))
  
  // User selects active status
  await userEvent.click(getByText('Active Only'))
  
  // Verify filtered results
  expect(getByText('Showing 3 active matters')).toBeInTheDocument()
})
```

### 5. Avoid Implementation Details

```typescript
// ❌ Bad: Testing implementation
expect(wrapper.vm.internalState).toBe('loading')

// ✅ Good: Testing behavior
expect(wrapper.find('.loading-spinner').exists()).toBe(true)
```