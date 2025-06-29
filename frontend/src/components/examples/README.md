# Testing Examples

This directory contains example test files that demonstrate various testing patterns for the Nuxt 3 Legal Case Management System. These examples serve as templates and reference implementations for writing tests across the application.

## Example Test Files

### 1. Component Testing Examples

#### Button.example.test.ts
Demonstrates basic component testing patterns including:
- Rendering and prop validation
- Event handling and emitting
- Slot content testing
- Accessibility attributes
- Dynamic prop updates
- Disabled state handling

#### MatterForm.example.test.ts
Shows advanced form component testing with:
- Form validation with Vee-Validate and Zod
- API mocking and async operations
- Loading and error states
- Form submission and reset
- Edit mode with initial data
- User interaction simulation

### 2. Composable Testing Examples

#### useMatterQuery.example.test.ts
Illustrates testing patterns for TanStack Query composables:
- Query state management (data, loading, error)
- Mocking TanStack Query hooks
- Testing query keys and options
- Mutation testing with optimistic updates
- Cache invalidation patterns
- Error and loading state handling

### 3. Store Testing Examples

#### kanbanStore.example.test.ts
Demonstrates Pinia store testing including:
- State initialization
- Async actions with API calls
- Computed getters with complex logic
- Optimistic updates and rollback
- Error handling
- Filter and selection management

## Running Example Tests

```bash
# Run all example tests
bun test examples

# Run specific example test
bun test Button.example.test.ts

# Run with coverage
bun test examples --coverage
```

## Key Testing Patterns

### 1. Setup and Teardown
- Use `beforeEach` to reset state between tests
- Clear all mocks with `vi.clearAllMocks()`
- Create fresh Pinia instances for store tests

### 2. Mocking Strategies
- Mock API calls with `vi.mocked($fetch)`
- Mock TanStack Query hooks for composable tests
- Use `createTestingPinia` for store integration

### 3. Async Testing
- Use `flushPromises()` to wait for all promises
- Use `nextTick()` for Vue reactivity updates
- Handle loading states explicitly

### 4. Assertion Patterns
- Test both positive and negative cases
- Verify DOM updates and emitted events
- Check for proper error handling
- Validate accessibility attributes

## Creating New Tests

When creating new tests, use these examples as templates:

1. Copy the most relevant example test file
2. Adapt the imports and component/composable references
3. Modify test cases for your specific requirements
4. Follow the same structure and naming conventions
5. Ensure comprehensive coverage of all code paths

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component/composable does, not how it does it
2. **Keep Tests Isolated**: Each test should be independent and not rely on others
3. **Use Descriptive Names**: Test descriptions should clearly state what is being tested
4. **Mock External Dependencies**: Always mock API calls and external services
5. **Test Edge Cases**: Include tests for error states, empty data, and boundary conditions

## Additional Resources

- [Vue Test Utils Documentation](https://test-utils.vuejs.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Guide](../../docs/testing-guide.md)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/vue/guides/testing)