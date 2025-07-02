# Integration Testing Patterns for Aster Management

This directory contains comprehensive integration tests for the Nuxt.js frontend, focusing on testing complete workflows that involve multiple components, stores, and external dependencies.

## Test Architecture

### Overview
Integration tests verify that different parts of the application work together correctly:
- **Store Integration**: Pinia stores with TanStack Query
- **Component Workflows**: Multi-component interactions
- **API Integration**: Server state synchronization
- **Real-time Updates**: WebSocket integration
- **Form Workflows**: Complete form submission cycles

### Test Structure
```
tests/integration/
├── setup.ts                           # Global test configuration and utilities
├── stores/
│   └── matter.integration.test.ts     # Store-to-store and store-to-component integration
├── kanban/
│   └── drag-drop-workflow.test.ts     # Complex drag-and-drop workflows
├── forms/
│   └── matter-form-workflow.test.ts   # Form validation and submission workflows
├── realtime/
│   └── websocket-updates.test.ts      # Real-time update integration
├── queries/
│   └── tanstack-integration.test.ts   # TanStack Query cache and mutation integration
└── README.md                          # This documentation
```

## Test Setup and Utilities

### Global Configuration (`setup.ts`)
Provides shared test utilities and configuration:

```typescript
import { setupTestPinia, createApiMock, mockServerState } from '@/test/integration/setup'

// Creates isolated test environment
const pinia = setupTestPinia()

// Mocks API calls with configurable responses
const apiMock = createApiMock()

// Provides consistent test data
const testData = mockServerState
```

### Key Utilities

#### `setupTestPinia()`
- Creates fresh Pinia instance for each test
- Isolates store state between tests
- Provides proper TypeScript support

#### `createApiMock()`
- Mocks `$fetch` with configurable responses
- Supports CRUD operations
- Handles error scenarios
- Maintains mock data state

#### `createWebSocketMock()`
- Mocks WebSocket connections
- Supports event-based messaging
- Handles connection state management
- Provides test triggers for events

#### `createDragEvent()`
- Creates properly structured drag events
- Supports dataTransfer mocking
- Enables drag-and-drop testing

#### `mockAnimationFrame()`
- Mocks requestAnimationFrame for predictable timing
- Essential for drag-and-drop animations
- Provides cleanup function

## Test Patterns

### 1. Store Integration Testing

Tests interactions between Pinia stores and components, ensuring data flows correctly through the application.

**Key Scenarios:**
- Store state updates reflecting in components
- Component actions triggering store mutations
- Error handling across store boundaries
- Cross-store communication patterns

**Example:**
```typescript
it('should update matter status and reflect in UI', async () => {
  const wrapper = mount(TestComponent)
  
  const updateButton = wrapper.find('[data-testid="update-1"]')
  await updateButton.trigger('click')
  await flushPromises()
  
  // Verify API was called
  expect(apiMock).toHaveBeenCalledWith('/api/matters/1', {
    method: 'PATCH',
    body: { status: 'completed' }
  })
  
  // Verify UI updated
  const status = wrapper.find('[data-testid="status-1"]')
  expect(status.text()).toBe('completed')
})
```

### 2. Drag-and-Drop Workflow Testing

Tests complex Kanban board interactions including drag-and-drop with API updates.

**Key Scenarios:**
- Drag start/end event handling
- Column-to-column matter movement
- Optimistic UI updates
- API synchronization
- Error handling and rollback

**Example:**
```typescript
it('should handle drag and drop with API integration', async () => {
  const wrapper = mount(KanbanBoard)
  
  // Simulate drag start
  const matter = wrapper.find('[data-testid="matter-card-1"]')
  await matter.trigger('dragstart')
  
  // Simulate drop on different column
  const column = wrapper.find('[data-testid="column-in-progress"]')
  await column.trigger('drop')
  await flushPromises()
  
  // Verify API call and UI update
  expect(apiMock).toHaveBeenCalledWith('/api/matters/1', {
    method: 'PATCH',
    body: { status: 'in-progress' }
  })
})
```

### 3. Form Workflow Testing

Tests complete form submission cycles including validation, API calls, and error handling.

**Key Scenarios:**
- Client-side validation
- Form submission with API integration
- Loading states during submission
- Error handling and display
- Success state management

**Example:**
```typescript
it('should validate and submit form with API integration', async () => {
  const wrapper = mount(MatterForm)
  
  // Fill form
  await wrapper.find('[data-testid="title-input"]').setValue('New Matter')
  
  // Submit
  await wrapper.find('[data-testid="submit-button"]').trigger('click')
  await flushPromises()
  
  // Verify API call
  expect(apiMock).toHaveBeenCalledWith('/api/matters', {
    method: 'POST',
    body: expect.objectContaining({ title: 'New Matter' })
  })
})
```

### 4. Real-time Update Testing

Tests WebSocket integration with component state synchronization.

**Key Scenarios:**
- WebSocket connection establishment
- Real-time message handling
- Component state updates
- Connection error handling
- Update queuing and batching

**Example:**
```typescript
it('should handle real-time updates via WebSocket', async () => {
  const wrapper = mount(RealTimeComponent)
  await flushPromises()
  
  // Trigger WebSocket update
  window._triggerMatterUpdate({
    matterId: '1',
    updates: { status: 'completed' }
  })
  
  await wrapper.vm.$nextTick()
  
  // Verify UI updated
  const status = wrapper.find('[data-testid="status-1"]')
  expect(status.text()).toBe('completed')
})
```

### 5. TanStack Query Integration

Tests query cache management, mutations, and optimistic updates.

**Key Scenarios:**
- Query data fetching and caching
- Mutation optimistic updates
- Error rollback mechanisms
- Query invalidation
- Background refetching

**Example:**
```typescript
it('should handle optimistic updates with rollback on error', async () => {
  // Make update fail
  apiMock.mockRejectedValue(new Error('Update failed'))
  
  const wrapper = mount(QueryComponent)
  await flushPromises()
  
  const originalStatus = wrapper.find('[data-testid="status-1"]').text()
  
  // Trigger update
  await wrapper.find('[data-testid="complete-1"]').trigger('click')
  
  // Should optimistically update
  expect(wrapper.find('[data-testid="status-1"]').text()).toBe('completed')
  
  await flushPromises()
  
  // Should rollback on error
  expect(wrapper.find('[data-testid="status-1"]').text()).toBe(originalStatus)
})
```

## Testing Best Practices

### 1. Test Isolation
- Each test gets fresh store state
- API mocks are reset between tests
- No shared state between test cases
- Proper cleanup in afterEach hooks

### 2. Realistic Scenarios
- Test complete user workflows
- Include error conditions
- Test edge cases and race conditions
- Verify both happy path and error paths

### 3. Comprehensive Coverage
- Test all critical user journeys
- Include accessibility testing
- Test responsive behavior
- Verify loading and error states

### 4. Maintainable Tests
- Use descriptive test names
- Clear arrange/act/assert structure
- Shared utilities for common operations
- Regular test refactoring

## Running Integration Tests

### Command Line
```bash
# Run all integration tests
bun test tests/integration

# Run specific test file
bun test tests/integration/stores/matter.integration.test.ts

# Run with coverage
bun test --coverage tests/integration

# Run in watch mode
bun test --watch tests/integration
```

### IDE Integration
Tests are compatible with VS Code Jest extension for:
- Inline test running
- Debug support
- Test discovery
- Coverage reporting

## Mock Data Management

### Consistent Test Data
All tests use the same mock data structure from `mockServerState`:

```typescript
export const mockServerState = {
  matters: [
    {
      id: '1',
      title: 'Contract Review',
      status: 'draft',
      priority: 'medium',
      // ... other fields
    }
  ],
  users: [
    // User data
  ]
}
```

### Dynamic Mock Responses
API mock supports dynamic responses based on request parameters:

```typescript
const apiMock = createApiMock()
apiMock.mockImplementation((endpoint, options) => {
  // Custom response logic
  if (endpoint === '/api/matters' && options.method === 'POST') {
    return Promise.resolve(newMatter)
  }
})
```

## Debugging Integration Tests

### Common Issues
1. **Timing Issues**: Use `flushPromises()` after async operations
2. **State Isolation**: Ensure proper test cleanup
3. **Mock Configuration**: Verify mock setup before assertions
4. **Event Handling**: Check event listener registration

### Debug Utilities
```typescript
// Debug component state
console.log(wrapper.vm.$data)

// Debug API calls
console.log(apiMock.mock.calls)

// Debug DOM state
console.log(wrapper.html())
```

## Performance Considerations

### Test Speed
- Use minimal mock data
- Avoid unnecessary DOM rendering
- Batch related assertions
- Use `vi.hoisted()` for expensive setup

### Memory Management
- Cleanup event listeners
- Reset global state
- Unmount components properly
- Clear timers and intervals

## Extension Points

### Adding New Test Types
1. Create new directory under `tests/integration/`
2. Follow existing naming patterns
3. Use shared utilities from `setup.ts`
4. Document new patterns in this README

### Custom Utilities
Add project-specific test utilities to `setup.ts`:

```typescript
export const createCustomMock = () => {
  // Custom mock implementation
}

export const simulateUserWorkflow = async (wrapper) => {
  // Common user interaction patterns
}
```

This integration testing framework provides comprehensive coverage of the Aster Management frontend's critical workflows while maintaining good performance and developer experience.