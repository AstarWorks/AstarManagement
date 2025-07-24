# Storybook Testing Documentation

Comprehensive guide for Storybook UI testing in the Nuxt 3 POC, covering interaction testing, visual regression, and accessibility validation.

## Overview

The Storybook testing suite provides automated testing for all UI components through three main categories:

- **Interaction Tests**: Component behavior, user interactions, and state changes
- **Visual Regression**: Screenshot-based UI change detection
- **Accessibility Tests**: WCAG compliance and screen reader compatibility

## Quick Start

### Prerequisites

```bash
# Install dependencies with Bun
bun install

# Ensure Playwright browsers are installed
bunx playwright install --with-deps
```

### Basic Commands

```bash
# Start Storybook development server
bun storybook

# Run all interaction tests
bun test-storybook

# Run visual regression tests
bun run visual:test

# Update visual baselines (when UI changes are intentional)
bun run visual:update-baselines

# Run tests in CI mode
bun run test-storybook:ci
```

## Testing Architecture

### Component Story Structure

Each component follows this testing pattern:

```typescript
// Button.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within, userEvent, fn } from '@storybook/test'
import Button from './Button.vue'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and accessibility features.'
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic story with interaction test
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Click me',
    onClick: fn()
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /click me/i })
    
    // Test initial state
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
    
    // Test click interaction
    await userEvent.click(button)
    expect(args.onClick).toHaveBeenCalled()
    
    // Test keyboard navigation
    await userEvent.tab()
    expect(button).toHaveFocus()
  }
}
```

### Test Categories

#### 1. Interaction Tests

Test component behavior and user interactions:

```typescript
// Testing form interactions
export const FormValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test email validation
    const emailInput = canvas.getByLabelText('Email Input')
    await userEvent.type(emailInput, 'invalid-email')
    await userEvent.tab()
    
    const errorMessage = await canvas.findByText('Please enter a valid email')
    expect(errorMessage).toBeInTheDocument()
    
    // Test valid input
    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'test@example.com')
    expect(canvas.queryByText('Please enter a valid email')).not.toBeInTheDocument()
  }
}
```

#### 2. Visual Regression Tests

Automated screenshot comparison:

```typescript
// VisualRegression.stories.ts
export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex gap-4">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    `
  }),
  parameters: {
    screenshot: true,
    viewport: { width: 800, height: 400 }
  }
}
```

#### 3. Accessibility Tests

WCAG compliance validation:

```typescript
// Automatic accessibility testing via test runner
// All stories are tested for:
// - ARIA labels and roles
// - Keyboard navigation
// - Color contrast
// - Screen reader compatibility
```

## Advanced Testing Patterns

### Complex Component Testing

For complex components like KanbanBoard:

```typescript
export const DragDropSimulation: Story = {
  args: {
    columns: DEFAULT_KANBAN_COLUMNS,
    matters: [
      { id: '1', title: 'Test Matter', status: 'INTAKE', priority: 'HIGH' }
    ],
    onMatterMove: fn()
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    
    // Find matter card
    const matterCard = canvas.getByText('Test Matter')
    expect(matterCard).toBeInTheDocument()
    
    // Find status buttons
    const investigationButton = canvas.getByRole('button', { name: /investigation/i })
    
    // Simulate drag-drop by clicking status button
    await userEvent.click(investigationButton)
    
    // Verify move callback was called
    expect(args.onMatterMove).toHaveBeenCalledWith(
      expect.objectContaining({
        matterId: '1',
        fromStatus: 'INTAKE',
        toStatus: 'INVESTIGATION'
      })
    )
  }
}
```

### Responsive Testing

Test components across viewport sizes:

```typescript
export const MobileLayout: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify mobile-specific layout
    const button = canvas.getByRole('button')
    expect(button).toHaveClass('w-full') // Full width on mobile
  }
}
```

### State Management Testing

Test Pinia store integration:

```typescript
export const WithStoreState: Story = {
  decorators: [
    () => ({
      template: '<div><story /></div>',
      setup() {
        // Mock store state for testing
        const store = useExampleStore()
        store.$patch({
          items: [
            { id: '1', name: 'Test Item' }
          ]
        })
      }
    })
  ]
}
```

## Test Configuration

### Test Runner Configuration

The test runner (`.storybook/test-runner.ts`) provides:

- **Screenshot capture** with consistent viewport and animation disabling
- **Accessibility testing** using axe-playwright
- **Performance optimization** with proper wait conditions
- **Error handling** with detailed reporting

### Visual Regression Setup

Visual tests use the following configuration:

```typescript
// Visual test parameters
const visualConfig = {
  viewport: { width: 1200, height: 800 },
  animations: 'disabled',
  fullPage: false,
  threshold: 0.2 // 20% difference threshold
}
```

### Coverage Reporting

Test coverage includes:

- **Interaction Coverage**: Percentage of interactive elements tested
- **Visual Coverage**: Components with visual regression tests
- **Accessibility Coverage**: WCAG compliance percentage

## CI/CD Integration

### GitHub Actions Workflow

The Storybook testing workflow (`nuxt-storybook.yml`) includes:

1. **Build Phase**: Compile Storybook for testing
2. **Interaction Tests**: Run across multiple shards for performance
3. **Visual Regression**: Compare against baseline screenshots
4. **Accessibility Tests**: WCAG compliance validation
5. **Deployment**: Deploy to GitHub Pages on main branch

### Test Artifacts

CI preserves the following artifacts:

- **Test Results**: JSON and JUnit format reports
- **Screenshots**: Visual regression images and diffs
- **Coverage Reports**: HTML and LCOV format
- **Accessibility Reports**: Detailed WCAG violation reports

## Troubleshooting

### Common Issues

**Tests failing unexpectedly**
```bash
# Check Storybook server is running
curl http://localhost:6006

# Debug specific story
bun run test:storybook:debug --stories="**/Button.stories.*"

# Run with verbose output
DEBUG=pw:test bun test-storybook
```

**Visual tests showing differences**
```bash
# Review visual diffs
open visual-tests/diff/

# Update baselines if changes are intentional
bun run visual:update-baselines

# Run single visual story
bun test-storybook --stories="**/VisualRegression.stories.*"
```

**Accessibility issues**
```bash
# Run accessibility tests only
TEST_RUNNER_OPTIONS='--accessibility' bun test-storybook

# Debug specific accessibility issues
bunx axe-core-cli http://localhost:6006/iframe.html?id=ui-button--default
```

### Performance Optimization

**Slow test execution**
- Use test sharding in CI (already configured)
- Run specific test suites: `bun test-storybook --stories="ui/**"`
- Optimize story loading with lazy imports

**Large screenshot files**
- Reduce viewport sizes for visual tests
- Use component-level screenshots instead of full page
- Compress images in post-processing

## Best Practices

### Story Development

1. **Comprehensive Coverage**: Test all component variants and states
2. **Realistic Data**: Use representative test data that matches production
3. **Error States**: Include error and loading states in stories
4. **Accessibility**: Ensure all interactive elements have proper labels

### Test Organization

1. **Descriptive Names**: Use clear, descriptive story names
2. **Grouped Tests**: Organize related tests in story groups
3. **Documentation**: Include descriptions for complex interactions
4. **Maintainability**: Keep tests focused and avoid over-testing implementation details

### Visual Testing

1. **Stable Content**: Use fixed dates, IDs, and content to avoid flaky tests
2. **Representative States**: Test key visual states and variations
3. **Mobile Coverage**: Include responsive breakpoint testing
4. **Theme Testing**: Test both light and dark mode variants

### Performance

1. **Selective Testing**: Tag stories appropriately for different test suites
2. **Parallel Execution**: Leverage CI sharding for large test suites
3. **Caching**: Use proper dependency caching in CI
4. **Incremental Testing**: Run only affected tests when possible

## Integration with Other Tests

### Relationship to E2E Tests

- **Storybook Tests**: Component behavior and UI consistency
- **E2E Tests**: Full user workflows and integration testing
- **Unit Tests**: Business logic and utility functions

### Coverage Strategy

```bash
# Component-level testing (Storybook)
bun test-storybook            # UI behavior and interactions

# Integration testing (E2E)  
bun run test:e2e             # Full user workflows

# Logic testing (Unit)
bun test                     # Business logic and utilities

# All tests together
bun run test:all             # Complete test suite
```

## Maintenance

### Regular Tasks

1. **Baseline Updates**: Review and update visual baselines monthly
2. **Story Audits**: Ensure all new components have comprehensive stories
3. **Accessibility Reviews**: Regular WCAG compliance audits
4. **Performance Monitoring**: Track test execution times and optimize

### Documentation Updates

1. **Story Documentation**: Keep component descriptions current
2. **Test Patterns**: Document new testing patterns for team use
3. **CI Updates**: Maintain workflow documentation
4. **Troubleshooting**: Update common issues and solutions

This comprehensive testing setup ensures component reliability, visual consistency, and accessibility compliance across the entire Nuxt 3 POC.