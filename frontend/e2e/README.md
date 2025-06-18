# E2E Testing with Playwright

This directory contains comprehensive end-to-end tests for the Aster Management application using Playwright, covering all MVP features.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Install Playwright browsers:
   ```bash
   bunx playwright install
   ```

3. Install system dependencies (if needed):
   ```bash
   bunx playwright install-deps
   ```

## Test Categories

### Core User Flows
- **Authentication** (`auth.spec.ts`) - Login, 2FA, logout, session management
- **Matter CRUD** (`matters-crud.spec.ts`) - Create, read, update, delete operations
- **Kanban Board** (`kanban-board.spec.ts`) - Drag & drop, status transitions

### Advanced Features
- **Search** (`search-advanced.spec.ts`) - Multi-criteria, full-text with OCR, performance
- **Permissions** (`permissions-mvp.spec.ts`) - RBAC with Lawyer, Clerk, Client roles
- **Mobile** (`mobile-responsive.spec.ts`) - Touch interactions, responsive layouts
- **Accessibility** (`accessibility.spec.ts`) - WCAG 2.1 AA compliance
- **Performance** (`performance.spec.ts`) - Load times, API response benchmarks

## Running Tests

### Run all tests
```bash
bun run test:e2e
```

### Run specific test category
```bash
# Authentication tests
bun playwright test auth.spec.ts

# Mobile tests on specific device
bun playwright test mobile-responsive.spec.ts --project="Mobile Chrome"

# Accessibility tests
bun playwright test accessibility.spec.ts

# Performance benchmarks
bun playwright test performance.spec.ts
```

### Run tests in UI mode (recommended for development)
```bash
bun run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
bun run test:e2e:headed
```

### Debug tests
```bash
bun run test:e2e:debug
```

### Generate test code using Codegen
```bash
bun run test:e2e:codegen
```

### View test report
```bash
bun run test:e2e:report
```

## Project Structure

```
e2e/
├── fixtures/       # Test fixtures (authentication, data setup)
├── pages/          # Page Object Models
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── MattersPage.ts
│   ├── MatterDetailPage.ts
│   ├── KanbanPage.ts
│   ├── SearchPage.ts
│   ├── MobileKanbanPage.ts
│   └── MobileMatterPage.ts
├── tests/          # Test specifications
│   ├── auth.spec.ts
│   ├── matters-crud.spec.ts
│   ├── kanban-board.spec.ts
│   ├── search-advanced.spec.ts
│   ├── permissions-mvp.spec.ts
│   ├── mobile-responsive.spec.ts
│   ├── accessibility.spec.ts
│   └── performance.spec.ts
├── utils/          # Utility functions and helpers
│   ├── test-data.ts
│   ├── performance.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
└── README.md       # This file
```

## Writing Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('test description', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Aster Management/);
});
```

### Using Authentication Fixtures
```typescript
import { test, expect } from '../fixtures/auth';

test('authenticated test', async ({ authenticatedPage }) => {
  // Already logged in as lawyer
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage).toHaveURL('/dashboard');
});
```

### Using Page Objects
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

## Test Data Management

Test data is managed through the `TestDataManager` class:

```typescript
import { test } from '@playwright/test';
import { TestDataManager } from '../utils/test-data';

test('create test matter', async ({ request }) => {
  const testData = new TestDataManager(request);
  const matter = await testData.createTestMatter({
    title: 'Test Matter',
    clientName: 'Test Client'
  });
  
  // Test with the created matter
  
  // Cleanup is handled automatically
});
```

## Environment Variables

Create a `.env.test` file for test-specific environment variables:

```env
BASE_URL=http://localhost:3000
API_URL=http://localhost:8080
TEST_API_TOKEN=your-test-token
TEST_ADMIN_TOKEN=your-admin-token
```

## Best Practices

1. **Use Page Objects**: Encapsulate page-specific logic in page objects
2. **Use Test IDs**: Add `data-testid` attributes to elements for reliable selection
3. **Avoid Hard Waits**: Use Playwright's built-in waiting mechanisms
4. **Clean Up Test Data**: Ensure tests clean up after themselves
5. **Keep Tests Independent**: Each test should be able to run in isolation
6. **Use Fixtures**: Leverage fixtures for common setup/teardown logic

## Debugging

1. Use `--debug` flag to step through tests
2. Use `page.pause()` to pause execution at a specific point
3. Use VS Code's Playwright extension for better debugging experience
4. Check test reports for screenshots and videos on failure

## CI/CD Integration

Tests are configured to run in CI with:
- Retries on failure (2 attempts)
- JUnit and JSON reporters for CI integration
- Parallel execution disabled to ensure stability
- Screenshots and videos on failure