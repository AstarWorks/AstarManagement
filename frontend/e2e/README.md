# E2E Testing Documentation

This directory contains end-to-end tests for the Nuxt.js frontend using Playwright.

## Structure

```
e2e/
├── fixtures/           # Test data factories and mock responses
├── pages/             # Page Object Model classes
├── tests/             # Test specifications
├── utils/             # Helper functions and utilities
└── README.md          # This file
```

## Test Suites

### Authentication Tests (`auth.spec.ts`)
- Login/logout flows
- Session management
- Token refresh
- Role-based access
- Error scenarios

### Kanban Board Tests (`kanban.spec.ts`)
- Board rendering and layout
- Drag and drop functionality
- Column operations
- Matter card interactions
- Real-time updates

### Matter CRUD Tests (`matter-crud.spec.ts`)
- Create new matters
- Edit existing matters
- Delete matters
- Form validation
- Data persistence

### Mobile Tests (`mobile.spec.ts`)
- Touch gestures
- Responsive design
- Mobile navigation
- Performance on mobile devices

### Visual Regression Tests (`visual.spec.ts`)
- Screenshot comparisons
- Theme variations (light/dark)
- Responsive breakpoints
- Component states
- Error states

## Page Object Model

The tests use the Page Object Model pattern for maintainability:

- `BasePage.ts` - Common functionality for all pages
- `LoginPage.ts` - Authentication flows
- `KanbanPage.ts` - Kanban board interactions
- `MatterPage.ts` - Matter detail and form pages
- `NavigationComponent.ts` - Shared navigation elements

## Running Tests

### Local Development

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI mode for debugging
bun run test:e2e:ui

# Run in headed mode (see browser)
bun run test:e2e:headed

# Debug specific test
bun run test:e2e:debug

# Show test report
bun run test:e2e:report
```

### Visual Regression Tests

```bash
# Run visual tests
bun run test:visual

# Update visual baselines
bun run test:visual:update

# Run visual tests with UI
bun run test:visual:ui
```

### Specific Test Files

```bash
# Run specific test file
bunx playwright test e2e/tests/auth.spec.ts

# Run specific test case
bunx playwright test e2e/tests/auth.spec.ts --grep "should login successfully"

# Run on specific browser
bunx playwright test --project=chromium
```

## CI/CD Integration

Tests run automatically on GitHub Actions:

- **Push to main/develop**: Full test suite
- **Pull requests**: Full test suite with results in PR comments
- **Manual trigger**: Includes visual baseline updates

### Browser Matrix

Tests run across multiple browsers and devices:

- **Desktop**: Chromium, Firefox, WebKit
- **Mobile**: Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)

## Test Data and Fixtures

### Test Data Factories

Located in `fixtures/test-data.ts`:

```typescript
// Create test matter
const matter = matterFactory.create({
  title: "Custom Test Matter",
  status: "intake"
})

// Create batch of matters
const matters = matterFactory.createBatch(5)
```

### Mock Responses

```typescript
// Mock successful API response
await mockAPI(page, {
  '**/api/matters': mockResponses.matters.success(),
  '**/api/auth/login': mockResponses.auth.success()
})
```

## Visual Testing

### Screenshot Comparisons

Visual tests capture and compare screenshots to detect UI regressions:

- **Threshold**: 0.1 (10% pixel difference allowed)
- **Mode**: Pixel-based comparison
- **Artifacts**: Stored for 14 days in CI

### Updating Baselines

When intentional UI changes are made:

```bash
# Update all visual baselines
bun run test:visual:update

# Update specific test baselines
bunx playwright test e2e/tests/visual.spec.ts --update-snapshots --grep "login page"
```

## Performance Testing

E2E tests include basic performance checks:

- Page load times
- Component rendering speed
- Memory usage monitoring
- Network request optimization

## Debugging

### Common Issues

1. **Flaky Tests**: Use `test.retry()` or add proper wait conditions
2. **Slow Tests**: Check for unnecessary `waitForTimeout()` calls
3. **Visual Differences**: Review screenshots in test artifacts

### Debug Tools

```bash
# Run with debug flag
bunx playwright test --debug

# Use UI mode for step-by-step debugging
bun run test:e2e:ui

# Generate trace files
bunx playwright test --trace on
```

### Debugging in CI

Check test artifacts uploaded to GitHub Actions:

- Test results and reports
- Screenshots on failure
- Video recordings
- Trace files

## Best Practices

### Writing Tests

1. **Use Page Objects**: Encapsulate page interactions
2. **Wait Appropriately**: Use `waitFor()` methods instead of `setTimeout()`
3. **Test Data Isolation**: Use factories for consistent test data
4. **Descriptive Names**: Clear test and step descriptions

### Performance

1. **Parallel Execution**: Tests run in parallel by default
2. **Resource Cleanup**: Clear state between tests
3. **Efficient Selectors**: Use data-testid attributes
4. **Minimize Network**: Mock external API calls

### Maintenance

1. **Regular Updates**: Keep Playwright and dependencies updated
2. **Review Failures**: Investigate and fix flaky tests promptly
3. **Visual Baselines**: Update when UI changes are intentional
4. **Documentation**: Keep this README updated with changes

## Configuration

### Playwright Config

Key settings in `playwright.config.ts`:

- **Timeout**: 60 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Workers**: 1 on CI, unlimited locally
- **Base URL**: http://localhost:3000

### Environment Variables

- `CI`: Enables CI-specific settings
- `BASE_URL`: Override default base URL
- `PLAYWRIGHT_BROWSERS_PATH`: Custom browser install path

## Troubleshooting

### Common Error Messages

**"Target page, context or browser has been closed"**
- Check for proper test cleanup
- Ensure tests don't leave hanging promises

**"Timeout waiting for selector"**
- Verify element exists in DOM
- Check for proper wait conditions
- Review loading states

**"Visual comparison failed"**
- Review diff images in test artifacts
- Update baselines if changes are intentional
- Check for dynamic content that should be masked

### Getting Help

1. Check Playwright documentation: https://playwright.dev/
2. Review test artifacts in CI for detailed error information
3. Use debug mode locally to step through tests
4. Check existing issues in project repository