# Testing Guide for Nuxt 3 Legal Case Management System

This guide provides comprehensive testing patterns and best practices for the Nuxt 3 frontend of the Aster Management legal case management system.

## Table of Contents

- [Quick Start](#quick-start)
- [Testing Infrastructure](#testing-infrastructure)
- [Component Testing](#component-testing)
- [Store Testing](#store-testing)
- [Composable Testing](#composable-testing)
- [Integration Testing](#integration-testing)
- [Performance Testing](#performance-testing)
- [Accessibility Testing](#accessibility-testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with UI
bun test:ui

# Run specific test file
bun test src/components/kanban/MatterCard.test.ts

# Run tests with coverage
bun test --coverage

# Run tests matching pattern
bun test --grep "Kanban"
```

### Writing Your First Test

```typescript
// src/components/example/MyComponent.test.ts
import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/utils'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mountComponent(MyComponent, {
      props: { title: 'Test Title' }
    })
    
    expect(wrapper.text()).toContain('Test Title')
  })
})
```

## Testing Infrastructure

### Configuration

The testing setup uses:
- **Vitest**: Fast test runner with native Vite support
- **Vue Test Utils**: Official Vue.js testing utility library
- **Happy DOM**: Lightweight DOM implementation for testing
- **Custom Test Utilities**: Enhanced mounting and mocking utilities

### Project Structure

```
test/
├── setup.ts           # Global test configuration
├── utils.ts           # Testing utilities and helpers
└── fixtures/          # Mock data and test fixtures

src/
├── components/
│   └── **/__tests__/  # Component tests
├── composables/
│   └── **/__tests__/  # Composable tests
├── stores/
│   └── **/__tests__/  # Store tests
└── test/
    ├── integration/   # Integration tests
    └── performance/   # Performance tests
```

### Environment Setup

The test environment includes comprehensive mocking for:
- Nuxt auto-imports and composables
- TanStack Query hooks
- Pinia stores
- VueUse utilities
- Web APIs (WebSocket, ResizeObserver, etc.)
- Fetch and HTTP requests

## Component Testing

### Basic Component Test

```typescript
import { describe, it, expect } from 'vitest'
import { mountComponent, findByTestId } from '@/test/utils'
import MatterCard from './MatterCard.vue'
import { createMockMatter } from '@/test/utils'

describe('MatterCard', () => {
  const mockMatter = createMockMatter({
    title: 'Contract Review',
    status: 'investigation',
    priority: 'HIGH'
  })

  it('displays matter information correctly', () => {
    const wrapper = mountComponent(MatterCard, {
      props: { matter: mockMatter }
    })

    expect(wrapper.text()).toContain('Contract Review')
    expect(findByTestId(wrapper, 'matter-status')).toBeTruthy()
  })

  it('emits events on interaction', async () => {
    const wrapper = mountComponent(MatterCard, {
      props: { matter: mockMatter }
    })

    await findByTestId(wrapper, 'edit-button').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })
})
```

### Testing with Props and Events

```typescript
describe('MatterCard Props and Events', () => {
  it('handles props validation', () => {
    const wrapper = mountComponent(MatterCard, {
      props: {
        matter: null // Test invalid prop
      }
    })

    // Component should handle null gracefully
    expect(wrapper.text()).toContain('No matter data')
  })

  it('emits all required events', async () => {
    const wrapper = mountComponent(MatterCard, {
      props: { matter: mockMatter }
    })

    // Test drag events
    await wrapper.trigger('dragstart')
    expect(wrapper.emitted('dragstart')).toBeTruthy()

    // Test click events
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
  })
})
```

### Testing Conditional Rendering

```typescript
describe('MatterCard Conditional Rendering', () => {
  it('shows edit button for authorized users', () => {
    const wrapper = mountComponent(MatterCard, {
      props: { 
        matter: mockMatter,
        canEdit: true 
      }
    })

    expect(findByTestId(wrapper, 'edit-button').exists()).toBe(true)
  })

  it('hides edit button for unauthorized users', () => {
    const wrapper = mountComponent(MatterCard, {
      props: { 
        matter: mockMatter,
        canEdit: false 
      }
    })

    expect(findByTestId(wrapper, 'edit-button').exists()).toBe(false)
  })
})
```

## Store Testing

### Testing Pinia Stores

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMattersStore } from '@/stores/kanban/matters'

describe('Matters Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with correct default state', () => {
    const store = useMattersStore()
    
    expect(store.matters).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('updates matters correctly', () => {
    const store = useMattersStore()
    const mockMatters = [createMockMatter()]
    
    store.setMatters(mockMatters)
    
    expect(store.matters).toEqual(mockMatters)
    expect(store.totalMatters).toBe(1)
  })

  it('handles async actions', async () => {
    const store = useMattersStore()
    
    // Mock the fetch call
    global.$fetch = vi.fn().mockResolvedValue([createMockMatter()])
    
    await store.fetchMatters()
    
    expect(store.loading).toBe(false)
    expect(store.matters).toHaveLength(1)
  })
})
```

### Testing Store Integration

```typescript
describe('Store Integration', () => {
  it('integrates with components correctly', () => {
    const wrapper = mountWithPinia(KanbanBoard, {
      piniaInitialState: {
        matters: {
          matters: [createMockMatter()],
          loading: false
        }
      }
    })

    expect(wrapper.text()).toContain('Test Matter')
  })
})
```

## Composable Testing

### Testing Vue Composables

```typescript
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useKanbanDragDrop } from '@/composables/useKanbanDragDrop'

describe('useKanbanDragDrop', () => {
  it('initializes with correct default state', () => {
    const matters = ref([])
    const { isDragging, draggedMatter } = useKanbanDragDrop(matters)

    expect(isDragging.value).toBe(false)
    expect(draggedMatter.value).toBeNull()
  })

  it('handles drag start correctly', () => {
    const matters = ref([createMockMatter()])
    const { startDrag, isDragging, draggedMatter } = useKanbanDragDrop(matters)

    startDrag(matters.value[0])

    expect(isDragging.value).toBe(true)
    expect(draggedMatter.value).toEqual(matters.value[0])
  })
})
```

### Testing TanStack Query Integration

```typescript
import { describe, it, expect } from 'vitest'
import { mountWithQuery, mockQueryHooks } from '@/test/utils'
import { useMattersQuery } from '@/composables/useMattersQuery'

describe('useMattersQuery', () => {
  it('fetches matters successfully', () => {
    mockQueryHooks({
      'matters:list': [createMockMatter()]
    })

    const TestComponent = {
      setup() {
        return useMattersQuery()
      },
      template: '<div>{{ data }}</div>'
    }

    const wrapper = mountWithQuery(TestComponent)
    
    expect(wrapper.vm.data).toBeDefined()
  })
})
```

## Integration Testing

Integration testing verifies that multiple components work together correctly. This includes testing interactions between components, stores, external services, real-time updates, and offline/online state transitions.

### Store and Query Integration Testing

Test how Pinia stores interact with TanStack Query cache synchronization:

```typescript
// src/test/integration/store-query-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { QueryClient } from '@tanstack/vue-query'
import { mountWithQuery } from '@/test/utils'
import { useMatterStore } from '@/stores/kanban/matters'

describe('Store Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    setActivePinia(createPinia())
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })

  it('should sync store state with query cache', async () => {
    const store = useMatterStore()
    const matter = createMockMatter({ id: 'matter-1' })

    // Add matter to store
    store.addMatter(matter)

    // Verify query cache is updated
    const cachedData = queryClient.getQueryData(['matters'])
    expect(cachedData).toContain(matter)
  })

  it('should handle optimistic updates with rollback', async () => {
    const store = useMatterStore()
    const matter = createMockMatter({ id: 'matter-1', status: 'INTAKE' })
    
    store.setMatters([matter])

    // Mock API failure
    global.$fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    // Attempt optimistic update
    const updatePromise = store.updateMatterOptimistic('matter-1', { status: 'COMPLETED' })

    // Verify optimistic update applied immediately
    expect(store.getMatterById('matter-1')?.status).toBe('COMPLETED')

    // Wait for promise to resolve/reject
    await expect(updatePromise).rejects.toThrow('Network error')

    // Verify rollback occurred
    expect(store.getMatterById('matter-1')?.status).toBe('INTAKE')
  })
})
```

### Complex Workflow Integration Testing

Test complete user workflows with drag-and-drop, state synchronization, and error handling:

```typescript
// src/test/integration/kanban-workflow-integration.test.ts
import { describe, it, expect } from 'vitest'
import { mountWithQuery, findByTestId, waitForAsync } from '@/test/utils'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'

describe('Kanban Workflow Integration', () => {
  it('should complete full drag-and-drop workflow', async () => {
    const matters = [
      createMockMatter({ 
        id: 'matter-1', 
        status: 'INTAKE',
        position: 1000
      })
    ]

    const wrapper = mountWithQuery(KanbanBoard, {
      piniaInitialState: {
        matters: { matters, isLoading: false }
      }
    })

    await waitForAsync(wrapper)

    const kanbanStore = useKanbanStore()
    
    // Find source matter card
    const matterCard = findByTestId(wrapper, 'matter-card-matter-1')
    const targetColumn = findByTestId(wrapper, 'column-IN_PROGRESS')

    // Simulate drag and drop
    await matterCard.trigger('dragstart', {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue('matter-1')
      }
    })

    await targetColumn.trigger('drop', {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue('matter-1')
      }
    })

    await waitForAsync(wrapper)

    // Verify matter was moved
    const updatedMatter = kanbanStore.getMatterById('matter-1')
    expect(updatedMatter?.status).toBe('IN_PROGRESS')
  })

  it('should handle drag-and-drop API failures with rollback', async () => {
    const matters = [createMockMatter({ id: 'matter-1', status: 'INTAKE' })]
    
    const wrapper = mountWithQuery(KanbanBoard, {
      piniaInitialState: {
        matters: { matters, isLoading: false }
      }
    })

    const kanbanStore = useKanbanStore()

    // Mock API failure
    global.$fetch = vi.fn().mockRejectedValue(new Error('API Error'))

    // Attempt move operation
    const movePromise = kanbanStore.moveMatter('matter-1', 'INTAKE', 'IN_PROGRESS', 0)

    // Verify optimistic update occurs
    let matter = kanbanStore.getMatterById('matter-1')
    expect(matter?.status).toBe('IN_PROGRESS')

    // Wait for API failure and rollback
    await expect(movePromise).rejects.toThrow('API Error')

    // Verify rollback occurred
    matter = kanbanStore.getMatterById('matter-1')
    expect(matter?.status).toBe('INTAKE')
  })
})
```

### Real-Time Integration Testing

Test WebSocket connections, live updates, and collaborative features:

```typescript
// src/test/integration/realtime-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mountWithQuery, waitForAsync } from '@/test/utils'
import { useWebSocketStore } from '@/stores/websocket'

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = []
  
  constructor(url: string) {
    MockWebSocket.instances.push(this)
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 0)
  }

  simulateMessage(data: any) {
    this.onmessage?.(new MessageEvent('message', { 
      data: JSON.stringify(data) 
    }))
  }
}

global.WebSocket = MockWebSocket as any

describe('Real-Time Integration', () => {
  it('should update matter in real-time when received from server', async () => {
    const matters = [
      createMockMatter({ 
        id: 'matter-1', 
        title: 'Original Title',
        status: 'INTAKE'
      })
    ]

    const wrapper = mountWithQuery(KanbanBoard, {
      piniaInitialState: {
        matters: { matters, isLoading: false }
      }
    })

    await waitForAsync(wrapper)

    const matterStore = useMatterStore()

    // Simulate real-time update from server
    const mockWs = MockWebSocket.instances[0]
    mockWs.simulateMessage({
      type: 'matter_updated',
      data: {
        id: 'matter-1',
        title: 'Updated Title',
        status: 'IN_PROGRESS'
      }
    })

    await nextTick()

    // Verify matter was updated
    const updatedMatter = matterStore.getMatterById('matter-1')
    expect(updatedMatter?.title).toBe('Updated Title')
    expect(updatedMatter?.status).toBe('IN_PROGRESS')
  })

  it('should handle collaborative drag operations', async () => {
    const wrapper = mountWithQuery(KanbanBoard)
    const kanbanStore = useKanbanStore()

    // Simulate another user starting a drag operation
    const mockWs = MockWebSocket.instances[0]
    mockWs.simulateMessage({
      type: 'drag_started',
      data: {
        matterId: 'matter-1',
        userId: 'other-user',
        userName: 'John Doe'
      }
    })

    await nextTick()

    // Verify drag state shows other user's operation
    expect(kanbanStore.collaborativeDragState.isOtherUserDragging).toBe(true)
    expect(kanbanStore.collaborativeDragState.draggedBy).toBe('John Doe')
  })
})
```

### Offline/Online Integration Testing

Test application behavior during network state transitions and offline data persistence:

```typescript
// src/test/integration/offline-online-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mountWithQuery, waitForAsync } from '@/test/utils'
import { useOfflineStore } from '@/stores/offline'

// Mock network state
let mockOnlineState = true
const mockNavigator = { onLine: mockOnlineState }
Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
})

describe('Offline/Online Integration', () => {
  const setNetworkState = (online: boolean) => {
    mockOnlineState = online
    mockNavigator.onLine = online
    const event = new Event(online ? 'online' : 'offline')
    window.dispatchEvent(event)
  }

  it('should persist data when offline and sync when online', async () => {
    const wrapper = mountWithQuery(KanbanBoard)
    const offlineStore = useOfflineStore()
    const matterStore = useMatterStore()

    // Go offline
    setNetworkState(false)
    await nextTick()

    // Create matter while offline
    const newMatter = createMockMatter({ id: 'offline-matter' })
    await matterStore.createMatterOffline(newMatter)

    // Verify operation queued
    expect(offlineStore.pendingOperations).toHaveLength(1)

    // Mock successful sync API
    global.$fetch = vi.fn().mockResolvedValueOnce(newMatter)

    // Go back online
    setNetworkState(true)
    await nextTick()

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify operation synced
    expect(offlineStore.pendingOperations).toHaveLength(0)
    expect(global.$fetch).toHaveBeenCalledWith('/api/matters', {
      method: 'POST',
      body: newMatter
    })
  })

  it('should handle sync conflicts gracefully', async () => {
    const wrapper = mountWithQuery(KanbanBoard)
    const offlineStore = useOfflineStore()

    // Mock conflict response
    global.$fetch = vi.fn().mockRejectedValueOnce({
      status: 409,
      data: { conflict: true }
    })

    // Go back online with pending operation
    setNetworkState(true)
    await nextTick()

    // Verify conflict handling
    expect(offlineStore.conflictedOperations).toHaveLength(1)
  })
})
```

### Integration Test Best Practices

1. **Test User Workflows**: Focus on complete user journeys rather than isolated functionality
2. **Mock External Dependencies**: Mock APIs, WebSockets, and third-party services while testing integration points
3. **Test Error Scenarios**: Verify error propagation and recovery across component boundaries
4. **Real-Time Testing**: Test collaborative features and live updates with mock WebSocket connections
5. **Offline Scenarios**: Verify offline functionality and synchronization behavior
6. **Performance Testing**: Include performance assertions for complex workflows
7. **State Management**: Test cross-store interactions and cache synchronization
8. **Cleanup**: Properly cleanup resources (WebSockets, timers, etc.) in afterEach hooks

### Advanced Integration Testing Utilities

Essential utilities for integration testing:

```typescript
// src/test/utils.ts - Integration Testing Utilities

// Mount component with TanStack Query and Pinia
export function mountWithQuery<T extends Component>(
  component: T,
  options: TestMountOptions<T> = {}
): TestWrapper<T> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  const pinia = createPinia()
  
  // Apply initial state if provided
  if (options.piniaInitialState) {
    setActivePinia(pinia)
    Object.entries(options.piniaInitialState).forEach(([storeName, state]) => {
      const store = getStore(storeName)
      if (store) {
        Object.assign(store, state)
      }
    })
  }

  return mount(component, {
    global: {
      plugins: [
        [VueQueryPlugin, { queryClient }],
        pinia
      ],
      ...options.global
    },
    ...options
  })
}

// Wait for async operations to complete
export async function waitForAsync(wrapper: TestWrapper, timeout = 1000) {
  await new Promise(resolve => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
  
  // Wait for any pending timers
  vi.advanceTimersByTime(timeout)
  await flushPromises()
}
```

## Performance Testing

### Component Render Performance

```typescript
import { describe, it, expect } from 'vitest'
import { measureRenderTime, stressTest } from '@/test/utils'
import MatterCard from '@/components/kanban/MatterCard.vue'

describe('MatterCard Performance', () => {
  it('renders within acceptable time', async () => {
    const { renderTime } = await measureRenderTime(MatterCard, {
      props: { matter: createMockMatter() }
    })

    expect(renderTime).toBeLessThan(50) // 50ms threshold
  })

  it('handles multiple renders efficiently', async () => {
    const results = await stressTest(MatterCard, {
      props: { matter: createMockMatter() },
      iterations: 100
    })

    expect(results.average).toBeLessThan(10) // 10ms average
    expect(results.max).toBeLessThan(100) // 100ms max
  })
})
```

## Accessibility Testing

### Basic A11y Testing

```typescript
import { describe, it, expect } from 'vitest'
import { mountComponent, checkA11y, testKeyboardNavigation } from '@/test/utils'
import MatterCard from '@/components/kanban/MatterCard.vue'

describe('MatterCard Accessibility', () => {
  it('meets basic accessibility requirements', () => {
    const wrapper = mountComponent(MatterCard, {
      props: { matter: createMockMatter() }
    })

    expect(() => checkA11y(wrapper)).not.toThrow()
  })

  it('supports keyboard navigation', async () => {
    const wrapper = mountComponent(MatterCard, {
      props: { matter: createMockMatter() }
    })

    const results = await testKeyboardNavigation(wrapper, [
      'Tab', 'Enter', 'Escape'
    ])

    expect(results.every(Boolean)).toBe(true)
  })

  it('has proper ARIA attributes', () => {
    const wrapper = mountComponent(MatterCard, {
      props: { matter: createMockMatter() }
    })

    const card = wrapper.find('[role="button"]')
    expect(card.attributes('aria-label')).toBeDefined()
    expect(card.attributes('tabindex')).toBe('0')
  })
})
```

## Best Practices

### 1. Test Organization

- Keep tests close to the code they test (`__tests__` directories)
- Use descriptive test names that explain the behavior
- Group related tests using `describe` blocks
- Use `beforeEach` and `afterEach` for setup and cleanup

### 2. Test Isolation

- Each test should be independent and not rely on other tests
- Clean up after each test (mocks, DOM, state)
- Use fresh component instances for each test
- Reset global state between tests

### 3. Mocking Strategy

- Mock external dependencies (APIs, third-party libraries)
- Keep mocks simple and focused
- Use real implementations when possible for integration tests
- Mock only what you need to isolate the unit under test

### 4. Assertion Patterns

```typescript
// Good: Specific assertions
expect(wrapper.text()).toContain('Expected text')
expect(wrapper.classes()).toContain('active')
expect(wrapper.emitted('event')).toHaveLength(1)

// Avoid: Vague assertions
expect(wrapper.html()).toMatchSnapshot() // Use sparingly
expect(wrapper.exists()).toBe(true) // Usually redundant
```

### 5. Async Testing

```typescript
// Good: Proper async handling
await wrapper.trigger('click')
await wrapper.vm.$nextTick()
await waitForAsync(wrapper)

// Good: Testing async composables
await nextTick()
await vi.waitFor(() => {
  expect(result.value).toBeDefined()
})

// Avoid: Not waiting for async operations
wrapper.trigger('click') // Missing await
expect(wrapper.text()).toContain('Updated') // May fail
```

## Troubleshooting

### Common Issues

#### Vue Lifecycle Warnings

```typescript
// Problem: onMounted called outside component
[Vue warn]: onMounted is called when there is no active component instance

// Solution: Use proper component mounting
const wrapper = mountComponent(Component, {
  // Provide proper context
})
```

#### Test Timeouts

```typescript
// Problem: Tests timing out
Test timed out in 5000ms

// Solution: Increase timeout or fix async handling
it('async test', async () => {
  // Ensure all promises are awaited
  await wrapper.trigger('click')
  await waitForAsync(wrapper)
}, 10000) // Increase timeout if needed
```

#### Mock Issues

```typescript
// Problem: Mocks not working
TypeError: Cannot read property 'mockImplementation' of undefined

// Solution: Ensure proper mock setup
vi.mock('#app', () => ({
  useRoute: vi.fn(() => ({ /* mock data */ }))
}))
```

### Debugging Tips

1. Use `console.log` sparingly in tests
2. Use `wrapper.html()` to inspect component output
3. Use `vi.fn().mockImplementation()` to debug mock calls
4. Check test setup files for global configuration issues
5. Use `--reporter=verbose` for detailed test output

### Performance Issues

1. Use `vi.clearAllMocks()` between tests
2. Avoid creating large datasets in tests
3. Use `vi.useFakeTimers()` for time-dependent tests
4. Mock heavy dependencies

## Coverage Goals

- **Unit Tests**: >80% line coverage for components and composables
- **Integration Tests**: Critical user paths covered
- **E2E Tests**: Main business workflows
- **Accessibility**: All interactive components tested

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Vue 3 Testing Guide](https://vuejs.org/guide/scaling-up/testing.html)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)