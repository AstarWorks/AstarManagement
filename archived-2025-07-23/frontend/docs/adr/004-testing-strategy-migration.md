# ADR-004: Testing Strategy Migration from Jest/React Testing Library to Vitest/Vue Test Utils

## Status
Accepted

## Context
With the migration to Vue 3/Nuxt.js, we need to establish a comprehensive testing strategy that:
- Maintains or improves upon the current test coverage
- Integrates well with Vue 3 and Nuxt 3
- Supports TypeScript
- Provides fast test execution
- Enables component, integration, and E2E testing
- Offers good developer experience with hot reload and debugging

The React implementation used Jest + React Testing Library + Playwright. For Vue, we need equivalent tools.

## Decision
We will adopt the following testing stack:
- **Unit/Component Testing**: Vitest + Vue Test Utils + Testing Library Vue
- **E2E Testing**: Playwright (continuing from React setup)
- **Visual Regression**: Histoire (Storybook alternative for Vue)
- **API Mocking**: Mock Service Worker (MSW)

## Consequences

### Positive
- Vitest is significantly faster than Jest (using Vite's transform pipeline)
- Native ESM support without configuration
- Compatible with Jest's API (easier migration)
- Better TypeScript support out of the box
- Hot Module Replacement (HMR) for tests
- Built-in coverage with c8
- Vue Test Utils is the official testing utility
- Testing Library Vue promotes good testing practices
- Playwright experience transfers directly

### Negative
- Team needs to learn Vue Test Utils API
- Some Jest-specific features may need alternatives
- Histoire is less mature than Storybook
- Need to rewrite all existing tests

### Neutral
- Both Jest and Vitest use similar assertion APIs
- Testing philosophy remains the same (test behavior, not implementation)
- E2E tests remain largely unchanged

## Alternatives Considered

### Alternative 1: Jest + Vue Test Utils
- **Pros**: Familiar to React developers, mature ecosystem
- **Cons**: Slower, requires extensive configuration for ESM/TypeScript
- **Reason for rejection**: Vitest offers better DX and performance

### Alternative 2: Cypress Component Testing
- **Pros**: Real browser testing, same tool for E2E and components
- **Cons**: Slower than Vitest, different API, resource intensive
- **Reason for rejection**: Vitest better for rapid unit testing

### Alternative 3: WebdriverIO
- **Pros**: Comprehensive testing solution, good Vue support
- **Cons**: More complex setup, slower execution
- **Reason for rejection**: Overkill for component testing

### Alternative 4: Storybook + Chromatic
- **Pros**: Mature ecosystem, visual testing included
- **Cons**: Vue 3 support still catching up, heavier setup
- **Reason for rejection**: Histoire is lighter and Vue-focused

## Implementation Notes

### Test Structure
```typescript
// components/ui/button/button.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Button } from './button.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })
    expect(wrapper.text()).toContain('Click me')
  })

  it('emits click event', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })
})
```

### Testing Categories
1. **Unit Tests**: Business logic, utilities, composables
2. **Component Tests**: UI components in isolation
3. **Integration Tests**: Component interactions, store integration
4. **E2E Tests**: Full user workflows with Playwright

### Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### Migration Strategy
1. Set up Vitest configuration
2. Create test helpers and utilities
3. Migrate unit tests (usually easiest)
4. Migrate component tests with Vue Test Utils
5. Update E2E tests for Vue-specific selectors
6. Add Histoire stories for component documentation

## References
- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils Documentation](https://test-utils.vuejs.org/)
- [Testing Library Vue](https://testing-library.com/docs/vue-testing-library/intro/)
- [Histoire Documentation](https://histoire.dev/)
- ADR-001: Frontend Framework Migration

## History
- **2025-01-02**: Initial draft created
- **2025-01-02**: Decision accepted for modern testing stack