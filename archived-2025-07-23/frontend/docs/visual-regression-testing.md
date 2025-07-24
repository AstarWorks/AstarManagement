# Visual Regression Testing Guide

Complete guide for visual regression testing in the Aster Management Nuxt.js POC, covering setup, configuration, best practices, and maintenance workflows.

## Overview

Visual regression testing automatically captures screenshots of UI components and compares them against baseline images to detect unintended visual changes. This system provides comprehensive coverage across themes, breakpoints, and component states.

## Quick Start

### Prerequisites

```bash
# Ensure all dependencies are installed
bun install

# Install Playwright browsers if not already done
bunx playwright install --with-deps
```

### Basic Workflow

```bash
# 1. Initialize visual testing infrastructure
bun run visual:init

# 2. Build Storybook for testing
bun run build-storybook

# 3. Generate initial baselines
bun run visual:generate

# 4. Run visual regression tests
bun run visual:test:comprehensive

# 5. Review any differences
bun run visual:baseline:review
```

## Architecture

### Directory Structure

```
visual-tests/
├── config/
│   └── visual-config.ts          # Centralized configuration
├── scripts/
│   └── baseline-manager.ts       # Baseline management utility
├── baselines/                    # Reference screenshots (committed)
│   ├── components/
│   ├── pages/
│   ├── responsive/
│   └── themes/
├── current/                      # Current test run screenshots
├── diff/                         # Difference images
└── README.md                     # Visual testing documentation
```

### Configuration System

Visual regression testing is configured through multiple layers:

#### 1. Global Configuration (`visual-config.ts`)

```typescript
export const visualConfig = {
  global: {
    defaultViewport: { width: 1200, height: 800 },
    animations: 'disabled',
    threshold: 0.1, // 10% difference threshold
    maxDiffPixels: 100
  },
  
  breakpoints: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1024, height: 768 }
  },
  
  themes: ['light', 'dark', 'high-contrast'],
  
  componentOverrides: {
    'kanban-board': {
      timeout: 45000,
      threshold: 0.15
    }
  }
}
```

#### 2. Story-Level Configuration

```typescript
// In component stories
export const MyStory: Story = {
  parameters: {
    screenshot: true,
    visualRegression: {
      themes: ['light', 'dark'],
      breakpoints: ['mobile', 'desktop'],
      maskSelectors: ['[data-testid="dynamic-content"]']
    }
  },
  tags: ['visual', 'regression']
}
```

## Testing Categories

### 1. Component Visual Tests

Test individual components across different states:

```typescript
// Form component testing
export const FormValidationStates: Story = {
  parameters: {
    visualRegression: {
      themes: ['light', 'dark'],
      breakpoints: ['mobile', 'desktop']
    }
  }
}
```

**Coverage includes:**
- All shadcn-vue UI components
- Form components with validation states
- Kanban components in different configurations
- Legal-specific components

### 2. Layout Visual Tests

Test page layouts and navigation:

```typescript
// Layout testing
export const ApplicationHeader: Story = {
  parameters: {
    visualRegression: {
      breakpoints: ['mobile', 'tablet', 'desktop'],
      maskSelectors: ['[data-testid="user-avatar"]']
    }
  }
}
```

**Coverage includes:**
- Application header and navigation
- Sidebar and mobile navigation
- Footer and breadcrumb components
- Responsive layout breakpoints

### 3. Theme Variation Tests

Test components across different themes:

```typescript
// Dark theme testing
export const DarkThemeShowcase: Story = {
  parameters: {
    theme: 'dark',
    visualRegression: {
      themes: ['dark']
    }
  }
}
```

**Coverage includes:**
- Light and dark themes
- High contrast mode
- Legal-specific color schemes

### 4. State-Based Tests

Test components in different states:

```typescript
// Error and loading states
export const ErrorAndLoadingStates: Story = {
  parameters: {
    visualRegression: {
      themes: ['light'],
      breakpoints: ['desktop']
    }
  }
}
```

**Coverage includes:**
- Loading and skeleton states
- Error and validation states
- Empty states and success confirmations
- Hover, focus, and active states

## Commands Reference

### Initialization and Setup

```bash
# Initialize directory structure
bun run visual:init

# Build Storybook for testing
bun run build-storybook
```

### Baseline Management

```bash
# Generate baselines from current screenshots
bun run visual:generate

# Force overwrite existing baselines
bun run visual:generate:force

# Generate comprehensive report
bun run visual:report
```

### Testing and Comparison

```bash
# Run comprehensive visual tests
bun run visual:test:comprehensive

# Compare current with baselines
bun run visual:compare

# Compare with strict threshold
bun run visual:compare:strict

# Development mode with relaxed threshold
bun run visual:dev
```

### Review and Maintenance

```bash
# Open visual approval interface
bun run visual:baseline:review

# Clean up old artifacts
bun run visual:cleanup

# View current baselines report
bun run visual:report
```

## Baseline Management

### When to Update Baselines

**✅ Update baselines when:**
- Intentional UI changes (new features, design updates)
- Component library updates (shadcn-vue, Tailwind)
- Typography or spacing improvements
- Approved design system changes

**❌ Investigate before updating:**
- Unexpected visual differences
- Cross-browser rendering issues
- Performance-related visual changes
- Accessibility-related modifications

### Baseline Update Process

1. **Review Differences**
   ```bash
   bun run visual:compare
   bun run visual:baseline:review
   ```

2. **Validate Changes**
   - Check diff images in `visual-tests/diff/`
   - Verify changes are intentional
   - Test across different browsers/devices

3. **Update Baselines**
   ```bash
   bun run visual:generate:force
   ```

4. **Commit Changes**
   ```bash
   git add visual-tests/baselines/
   git commit -m "Update visual regression baselines for component updates"
   ```

## Story Development Guidelines

### Story Structure for Visual Testing

```typescript
import type { Meta, StoryObj } from '@storybook/vue3'

const meta: Meta<typeof Component> = {
  title: 'Visual Regression/Category',
  component: Component,
  parameters: {
    layout: 'padded',
    screenshot: true,
    visualRegression: {
      themes: ['light', 'dark'],
      breakpoints: ['mobile', 'desktop'],
      maskSelectors: ['[data-testid="dynamic-content"]']
    }
  },
  tags: ['visual', 'regression', 'test']
}

export const VisualTest: Story = {
  args: {
    // Use deterministic data
    title: 'Visual Test Title',
    date: new Date('2024-01-15T10:00:00Z'),
    id: 'visual-test-001'
  },
  play: async ({ canvasElement }) => {
    // Verify component is rendered correctly
    const canvas = within(canvasElement)
    expect(canvas.getByText('Visual Test Title')).toBeInTheDocument()
  }
}
```

### Best Practices for Stories

1. **Deterministic Data**
   ```typescript
   // ✅ Good - Fixed data
   const testData = {
     title: 'Test Matter',
     date: new Date('2024-01-15T10:00:00Z'),
     id: 'TEST-001'
   }

   // ❌ Bad - Dynamic data
   const testData = {
     title: `Matter ${Math.random()}`,
     date: new Date(),
     id: crypto.randomUUID()
   }
   ```

2. **Comprehensive State Coverage**
   ```typescript
   // Cover all important visual states
   export const AllStates: Story = {
     render: () => ({
       template: `
         <div class="space-y-4">
           <Component state="default" />
           <Component state="loading" />
           <Component state="error" />
           <Component state="success" />
         </div>
       `
     })
   }
   ```

3. **Responsive Testing**
   ```typescript
   // Test key breakpoints
   export const ResponsiveLayout: Story = {
     parameters: {
       visualRegression: {
         breakpoints: ['mobile', 'tablet', 'desktop']
       }
     }
   }
   ```

## CI/CD Integration

### GitHub Actions Workflow

The visual regression tests integrate with the existing Storybook GitHub Actions workflow:

```yaml
# .github/workflows/nuxt-storybook.yml
- name: Run Visual Regression Tests
  run: |
    bun run build-storybook
    bun run test-storybook:visual
    bun run visual:compare

- name: Upload Visual Artifacts
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: visual-regression-diffs
    path: visual-tests/diff/
```

### Automated Baseline Updates

On main branch merges, baselines are automatically updated:

```yaml
- name: Update Baselines on Main
  if: github.ref == 'refs/heads/main'
  run: |
    bun run visual:generate:force
    git config --global user.name 'Visual Test Bot'
    git config --global user.email 'visual-tests@aster.com'
    git add visual-tests/baselines/
    git commit -m "Auto-update visual regression baselines [skip ci]" || exit 0
    git push
```

## Performance Optimization

### Test Execution Performance

```bash
# Metrics tracking
bun run visual:test:comprehensive  # Includes performance metrics

# Parallel execution (CI)
test-storybook --shard 1/4  # Run 1/4 of tests
test-storybook --shard 2/4  # Run 2/4 of tests
```

### Baseline Storage Optimization

```bash
# Clean up old artifacts
bun run visual:cleanup --days=7

# Optimize baseline images
bun run visual:optimize-images
```

### Smart Test Selection

The system automatically skips unchanged components:

```typescript
// Only test changed components
const shouldTest = await hasComponentChanged(componentName)
if (!shouldTest) {
  console.log(`Skipping ${componentName} - no changes detected`)
  return
}
```

## Troubleshooting

### Common Issues

**Tests Failing Unexpectedly**
```bash
# Check Storybook server
curl http://localhost:6006

# Debug specific story
bun run test-storybook --stories="**/Button.stories.*"

# Run with verbose output
DEBUG=pw:test bun test-storybook
```

**Visual Differences on CI**
```bash
# Download CI artifacts
gh run download --name visual-regression-diffs

# Compare local vs CI
bun run visual:compare --ci-mode
```

**Flaky Visual Tests**
1. Check for animations not being disabled
2. Verify font loading consistency
3. Review network timing issues
4. Add appropriate wait conditions

**Memory Issues**
```bash
# Reduce concurrent tests
test-storybook --maxWorkers=2

# Clean up between tests
bun run visual:cleanup
```

### Debug Commands

```bash
# Run single story test
bun run test-storybook --stories="**/VisualRegression.stories.*"

# Debug mode with verbose output
DEBUG=1 bun run visual:test

# Check baseline integrity
bun run visual:validate-baselines

# Generate detailed performance report
bun run visual:performance-report
```

## Coverage and Metrics

### Component Coverage

Track visual test coverage across components:

```bash
# Generate coverage report
bun run visual:report

# View coverage by category
bun run visual:coverage --by-category
```

**Target Coverage:**
- Basic UI Components: 100%
- Form Components: 100%
- Layout Components: 90%
- Complex Components: 85%
- Legal-Specific Components: 80%

### Performance Metrics

Monitor test execution performance:

```bash
# View performance metrics
bun run visual:metrics

# Slowest tests
bun run visual:metrics --slowest

# Performance trends
bun run visual:metrics --trends
```

**Performance Targets:**
- Individual test: <30 seconds
- Full suite: <10 minutes
- Baseline generation: <5 minutes
- Coverage report: <1 minute

## Integration with Other Tests

### Relationship to Other Test Types

- **Visual Regression**: UI appearance, layout, styling consistency
- **E2E Tests**: Full user workflows and integration testing
- **Unit Tests**: Component logic and behavior
- **Accessibility Tests**: WCAG compliance and screen reader compatibility

### Combined Testing Strategy

```bash
# Run all test types
bun run test:all

# Visual + E2E for complete coverage
bun run test:visual && bun run test:e2e

# Quick visual check during development
bun run visual:dev
```

## Maintenance

### Regular Tasks

1. **Weekly Baseline Review**
   ```bash
   bun run visual:report
   bun run visual:cleanup
   ```

2. **Monthly Performance Audit**
   ```bash
   bun run visual:metrics --trends
   bun run visual:optimize
   ```

3. **Quarterly Coverage Review**
   ```bash
   bun run visual:coverage --detailed
   bun run visual:gaps-analysis
   ```

### Team Workflows

1. **Feature Development**
   - Add visual regression stories for new components
   - Test across required themes and breakpoints
   - Update baselines before merging

2. **Design System Updates**
   - Run comprehensive visual tests
   - Review all visual differences
   - Update baselines systematically

3. **Release Preparation**
   - Full visual regression test suite
   - Performance metrics review
   - Baseline optimization

This comprehensive visual regression testing system ensures UI consistency and quality across the entire Aster Management application, providing confidence in visual changes and preventing regression bugs from reaching production.