# Visual Regression Testing

This directory contains visual regression test artifacts and configuration for the Nuxt.js POC frontend.

## Overview

Visual regression testing automatically captures screenshots of components in different states and compares them against baseline images to detect visual changes.

## Structure

```
visual-tests/
├── README.md              # This file
├── baselines/             # Reference screenshots (committed)
├── current/               # Current test run screenshots
├── diff/                  # Difference images showing changes
├── config.js              # Visual testing configuration
└── scripts/               # Helper scripts
```

## Running Visual Tests

### Prerequisites

1. **Build Storybook**: Visual tests run against the built Storybook
   ```bash
   bun run build-storybook
   ```

2. **Start Storybook**: Server must be running for tests
   ```bash
   bun run storybook:serve
   ```

### Test Commands

```bash
# Run all visual regression tests
bun run test-storybook:visual

# Run tests with coverage reporting
bun run test-storybook:coverage

# Run tests in CI mode
bun run test-storybook:ci

# Update visual baselines (when UI changes are intentional)
npm run visual:update-baselines
```

## Test Configuration

### Viewport Sizes

Tests run across multiple viewport sizes:
- **Desktop**: 1200x800 (default)
- **Tablet**: 768x1024
- **Mobile**: 375x667

### Story Selection

Visual regression tests automatically run on stories tagged with:
- `['test']` - Include in test runs
- `['visual']` - Visual regression specific
- `['skip-test']` - Exclude from tests (excluded)

### Screenshot Parameters

Stories can configure visual testing with parameters:
```typescript
export const MyStory: Story = {
  parameters: {
    screenshot: true,        // Enable/disable screenshots
    fullPage: false,         // Full page vs component only
    delay: 500,             // Wait time before screenshot
    viewports: ['mobile', 'desktop'] // Custom viewport list
  }
}
```

## Baseline Management

### When to Update Baselines

Update visual baselines when:
- ✅ **Intentional UI changes** - New features, design updates
- ✅ **Component library updates** - shadcn-vue, Tailwind updates
- ✅ **Typography changes** - Font updates, spacing adjustments
- ❌ **Unintentional changes** - Always investigate first

### Update Process

1. **Review Differences**: Check diff images to understand changes
2. **Validate Changes**: Ensure changes are intentional and correct
3. **Update Baselines**: Run update command to accept new visuals
4. **Commit Changes**: Include updated baselines in version control

```bash
# 1. Run tests to see differences
bun run test-storybook:visual

# 2. Review diff images in visual-tests/diff/

# 3. Update baselines if changes are intentional
npm run visual:update-baselines

# 4. Commit updated baselines
git add visual-tests/baselines/
git commit -m "Update visual regression baselines"
```

## CI/CD Integration

### GitHub Actions

Visual tests run automatically in CI:
- **Pull Requests**: Detect visual regressions
- **Main Branch**: Update baselines on approval
- **Scheduled**: Nightly visual health checks

### Artifacts

CI preserves test artifacts:
- Screenshots (current run)
- Diff images (when tests fail)
- Test reports (HTML format)
- Coverage reports

## Component Coverage

### Tested Components

Visual regression covers:
- ✅ **Basic UI**: Button, Input, Card, Badge, Alert
- ✅ **Complex Components**: KanbanBoard, MatterCard
- ✅ **Layout Components**: Navigation, Headers, Sidebars
- ✅ **Theme Variations**: Light/Dark mode
- ✅ **Responsive States**: Mobile/Tablet/Desktop
- ✅ **Error States**: Validation, loading, empty states

### Test Stories

Key visual regression stories:
- `VisualRegression/BasicComponents` - All UI components
- `VisualRegression/KanbanComponents` - Complex kanban widgets
- `VisualRegression/DarkMode` - Dark theme coverage
- `VisualRegression/MobileResponsive` - Mobile layouts
- `VisualRegression/ErrorStates` - Error and validation states

## Troubleshooting

### Common Issues

**Tests failing unexpectedly**
- Check for animations not being disabled
- Verify fonts are loading consistently
- Review network timing issues

**Screenshots inconsistent**
- Ensure deterministic data in stories
- Check for random/time-based content
- Verify viewport size consistency

**Performance issues**
- Reduce screenshot frequency
- Optimize story loading times
- Use story-specific viewports

### Debug Commands

```bash
# Run single story test
npx test-storybook --stories="**/VisualRegression.stories.*"

# Debug mode with verbose output
DEBUG=1 bun run test-storybook:visual

# Check Storybook server
curl http://localhost:6006/iframe.html?id=visual-regression--basic-components
```

## Best Practices

### Story Design

1. **Deterministic Data**: Use fixed timestamps, IDs, names
2. **Stable Layout**: Avoid random or dynamic content
3. **Representative States**: Cover key visual variations
4. **Accessible Design**: Include accessibility attributes

### Performance

1. **Selective Testing**: Tag only critical visual stories
2. **Efficient Viewports**: Test only necessary breakpoints
3. **Batch Updates**: Group related visual changes
4. **Cache Optimization**: Leverage CI caching for screenshots

### Maintenance

1. **Regular Reviews**: Schedule baseline update reviews
2. **Documentation**: Document intentional visual changes
3. **Team Communication**: Share visual change decisions
4. **Monitoring**: Track visual test performance metrics

## Integration with E2E Tests

Visual regression complements E2E tests:
- **E2E**: User flows, interactions, functionality
- **Visual**: UI appearance, layout, styling consistency
- **Unit**: Component logic, state management

Combined testing provides comprehensive coverage of UI quality and functionality.