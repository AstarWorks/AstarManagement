/**
 * Test Utilities for Nuxt 3 Vue Components
 * 
 * @description Comprehensive testing utilities for component testing,
 * store testing, and API mocking in the Nuxt 3 environment
 * @author Claude
 * @created 2025-06-26
 * @task T01_S09 - Unit Testing Setup
 */

import { mount, VueWrapper, ComponentMountingOptions } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { vi, type Mock } from 'vitest'
import { ref, reactive, App, Component } from 'vue'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TestMountOptions<T = any> extends ComponentMountingOptions<T> {
  withPinia?: boolean
  withQueryClient?: boolean
  piniaInitialState?: Record<string, any>
  queryClientOptions?: any
  mockRoutes?: Record<string, any>
  mockFetch?: boolean | Record<string, any>
}

export interface MockFetchOptions {
  delay?: number
  status?: number
  response?: any
  error?: Error | string
}

export interface TestWrapper<T = any> extends VueWrapper<T> {
  pinia?: Pinia
  queryClient?: QueryClient
  unmount: () => void
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

/**
 * Create mock matter data for testing
 */
export const createMockMatter = (overrides: Partial<any> = {}) => ({
  id: 'matter-1',
  title: 'Test Matter',
  description: 'Test description',
  status: 'investigation',
  priority: 'HIGH',
  clientName: 'Test Client',
  assignedLawyer: {
    id: 'lawyer-1',
    name: 'Test Lawyer',
    initials: 'TL'
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  dueDate: '2025-12-31',
  tags: ['test'],
  relatedDocuments: 5,
  statusDuration: 30,
  ...overrides
})

/**
 * Create mock paginated response
 */
export const createMockPaginatedResponse = <T>(
  items: T[] = [],
  overrides: Partial<any> = {}
) => ({
  data: items,
  pagination: {
    page: 1,
    limit: 10,
    total: items.length,
    hasNext: false,
    hasPrev: false,
    totalPages: 1
  },
  ...overrides
})

/**
 * Create mock query response
 */
export const createMockQueryResponse = <T>(
  data: T,
  options: {
    isLoading?: boolean
    isError?: boolean
    error?: Error | null
  } = {}
) => ({
  data: ref(data),
  isLoading: ref(options.isLoading || false),
  isPending: ref(options.isLoading || false),
  isError: ref(options.isError || false),
  error: ref(options.error || null),
  refetch: vi.fn(),
  fetchStatus: ref('idle'),
  status: ref(options.isError ? 'error' : 'success')
})

// ============================================================================
// COMPONENT MOUNTING UTILITIES
// ============================================================================

/**
 * Enhanced component mounting with automatic setup
 */
export function mountComponent<T extends Component>(
  component: T,
  options: TestMountOptions<T> = {}
): TestWrapper<T> {
  const {
    withPinia = false,
    withQueryClient = false,
    piniaInitialState = {},
    queryClientOptions = {},
    mockRoutes = {},
    mockFetch = true,
    ...mountOptions
  } = options

  let pinia: Pinia | undefined
  let queryClient: QueryClient | undefined
  const plugins: any[] = []

  // Setup Pinia if requested
  if (withPinia) {
    pinia = createPinia()
    setActivePinia(pinia)
    plugins.push(pinia)
    
    // Apply initial state if provided
    Object.entries(piniaInitialState).forEach(([storeId, state]) => {
      pinia!.state.value[storeId] = state
    })
  }

  // Setup TanStack Query if requested
  if (withQueryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      },
      ...queryClientOptions
    })
    plugins.push([VueQueryPlugin, { queryClient }])
  }

  // Setup fetch mocking
  if (mockFetch) {
    const fetchMock = createFetchMock(
      typeof mockFetch === 'object' ? mockFetch : {}
    )
    global.$fetch = fetchMock
    global.fetch = fetchMock
  }

  // Setup route mocking
  if (Object.keys(mockRoutes).length > 0) {
    setupRouteMocks(mockRoutes)
  }

  // Mount component with all plugins
  const wrapper = mount(component, {
    global: {
      plugins,
      stubs: {
        // Common stubs - use component-like stubs
        Teleport: {
          template: '<div><slot /></div>',
          props: ['to']
        },
        Transition: {
          template: '<div><slot /></div>',
          props: ['name', 'mode']
        },
        TransitionGroup: {
          template: '<div><slot /></div>',
          props: ['name', 'tag']
        },
        NuxtLink: {
          template: '<a><slot /></a>',
          props: ['to', 'href']
        },
        NuxtPage: {
          template: '<div><slot /></div>'
        },
        ClientOnly: {
          template: '<div><slot /></div>'
        },
        ...mountOptions.global?.stubs
      },
      mocks: {
        $t: (key: string) => key, // i18n mock
        ...mountOptions.global?.mocks
      }
    },
    ...mountOptions
  }) as TestWrapper<T>

  // Attach helper properties
  wrapper.pinia = pinia
  wrapper.queryClient = queryClient

  // Enhanced unmount that cleans up everything
  const originalUnmount = wrapper.unmount
  wrapper.unmount = () => {
    originalUnmount.call(wrapper)
    if (pinia) {
      setActivePinia(undefined as any)
    }
    if (queryClient) {
      queryClient.clear()
    }
    vi.clearAllMocks()
  }

  return wrapper
}

/**
 * Mount component with Pinia store setup
 */
export function mountWithPinia<T extends Component>(
  component: T,
  options: TestMountOptions<T> = {}
) {
  return mountComponent(component, { ...options, withPinia: true })
}

/**
 * Mount component with TanStack Query setup
 */
export function mountWithQuery<T extends Component>(
  component: T,
  options: TestMountOptions<T> = {}
) {
  return mountComponent(component, { 
    ...options, 
    withPinia: true, 
    withQueryClient: true 
  })
}

// ============================================================================
// MOCK UTILITIES
// ============================================================================

/**
 * Create a mock fetch function with customizable responses
 */
export function createFetchMock(
  responses: Record<string, MockFetchOptions> = {}
): Mock {
  return vi.fn().mockImplementation((url: string, options?: any) => {
    const config = responses[url] || responses['*'] || {}
    const {
      delay = 0,
      status = 200,
      response = [],
      error
    } = config

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (error) {
          reject(typeof error === 'string' ? new Error(error) : error)
        } else {
          resolve({
            ok: status >= 200 && status < 300,
            status,
            statusText: status === 200 ? 'OK' : 'Error',
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response)),
            headers: new Headers(),
            url
          })
        }
      }, delay)
    })
  })
}

/**
 * Setup route mocks for navigation testing
 */
export function setupRouteMocks(routes: Record<string, any>) {
  const mockRoute = reactive({
    path: '/',
    params: {},
    query: {},
    meta: {},
    ...routes.current
  })

  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    currentRoute: mockRoute,
    ...routes.router
  }

  vi.mocked(require('#app').useRoute).mockReturnValue(mockRoute)
  vi.mocked(require('#app').useRouter).mockReturnValue(mockRouter)

  return { mockRoute, mockRouter }
}

/**
 * Mock TanStack Query hooks with custom responses
 */
export function mockQueryHooks(responses: Record<string, any> = {}) {
  const mockQuery = (key: string) => createMockQueryResponse(
    responses[key] || null
  )

  vi.mocked(require('@tanstack/vue-query').useQuery).mockImplementation(
    ({ queryKey }: any) => mockQuery(Array.isArray(queryKey) ? queryKey.join(':') : queryKey)
  )

  vi.mocked(require('@tanstack/vue-query').useInfiniteQuery).mockImplementation(
    ({ queryKey }: any) => ({
      ...mockQuery(Array.isArray(queryKey) ? queryKey.join(':') : queryKey),
      fetchNextPage: vi.fn(),
      fetchPreviousPage: vi.fn(),
      hasNextPage: ref(false),
      hasPreviousPage: ref(false)
    })
  )

  vi.mocked(require('@tanstack/vue-query').useMutation).mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(() => Promise.resolve()),
    isLoading: ref(false),
    isPending: ref(false),
    isError: ref(false),
    error: ref(null),
    data: ref(null),
    variables: ref(null),
    status: ref('idle')
  })
}

/**
 * Mock WebSocket for real-time testing
 */
export function createMockWebSocket(options: {
  autoConnect?: boolean
  messages?: any[]
  delay?: number
} = {}) {
  const { autoConnect = true, messages = [], delay = 0 } = options

  const mockWs = {
    readyState: autoConnect ? 1 : 0, // OPEN : CONNECTING
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onopen: null as any,
    onclose: null as any,
    onmessage: null as any,
    onerror: null as any,
    
    // Test helpers
    simulateMessage: (message: any) => {
      if (mockWs.onmessage) {
        mockWs.onmessage({ data: JSON.stringify(message) })
      }
    },
    simulateOpen: () => {
      mockWs.readyState = 1
      if (mockWs.onopen) mockWs.onopen({})
    },
    simulateClose: () => {
      mockWs.readyState = 3
      if (mockWs.onclose) mockWs.onclose({})
    },
    simulateError: (error: any) => {
      if (mockWs.onerror) mockWs.onerror(error)
    }
  }

  // Auto-send messages if provided
  if (messages.length > 0) {
    setTimeout(() => {
      messages.forEach((message, index) => {
        setTimeout(() => mockWs.simulateMessage(message), index * 100)
      })
    }, delay)
  }

  return mockWs
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Wait for DOM updates and async operations
 */
export async function waitForAsync(wrapper: VueWrapper, timeout = 1000) {
  await wrapper.vm.$nextTick()
  await new Promise(resolve => setTimeout(resolve, 10))
  
  // Wait for any pending promises
  let remaining = timeout / 10
  while (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()
    remaining--
  }
}

/**
 * Find element by test ID
 */
export function findByTestId(wrapper: VueWrapper, testId: string) {
  return wrapper.find(`[data-testid="${testId}"]`)
}

/**
 * Find all elements by test ID
 */
export function findAllByTestId(wrapper: VueWrapper, testId: string) {
  return wrapper.findAll(`[data-testid="${testId}"]`)
}

/**
 * Assert element has specific text content
 */
export function expectTextContent(element: any, expected: string) {
  expect(element.text()).toBe(expected)
}

/**
 * Assert element has specific class
 */
export function expectHasClass(element: any, className: string) {
  expect(element.classes()).toContain(className)
}

/**
 * Assert element is visible
 */
export function expectVisible(element: any) {
  expect(element.isVisible()).toBe(true)
}

/**
 * Assert element is hidden
 */
export function expectHidden(element: any) {
  expect(element.isVisible()).toBe(false)
}

// ============================================================================
// ACCESSIBILITY TESTING HELPERS
// ============================================================================

/**
 * Check basic accessibility requirements
 */
export function checkA11y(wrapper: VueWrapper) {
  const element = wrapper.element

  // Check for basic ARIA attributes
  const interactiveElements = element.querySelectorAll(
    'button, input, select, textarea, [role="button"], [role="link"]'
  )

  interactiveElements.forEach((el) => {
    const tagName = el.tagName.toLowerCase()
    
    if (tagName === 'button' || el.getAttribute('role') === 'button') {
      // Buttons should have accessible names
      const hasLabel = el.getAttribute('aria-label') || 
                      el.getAttribute('aria-labelledby') ||
                      el.textContent?.trim()
      expect(hasLabel).toBeTruthy()
    }
    
    if (tagName === 'input') {
      // Inputs should have labels
      const hasLabel = el.getAttribute('aria-label') || 
                      el.getAttribute('aria-labelledby') ||
                      document.querySelector(`label[for="${el.id}"]`)
      expect(hasLabel).toBeTruthy()
    }
  })

  return true
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(wrapper: VueWrapper, keys: string[]) {
  const results: boolean[] = []
  
  for (const key of keys) {
    await wrapper.trigger('keydown', { key })
    await wrapper.vm.$nextTick()
    
    // Check if focus moved or action occurred
    const activeElement = document.activeElement
    results.push(activeElement !== null)
  }
  
  return results
}

// ============================================================================
// PERFORMANCE TESTING HELPERS
// ============================================================================

/**
 * Measure component render time
 */
export async function measureRenderTime<T extends Component>(
  component: T,
  options: TestMountOptions<T> = {}
) {
  const start = performance.now()
  const wrapper = mountComponent(component, options)
  await wrapper.vm.$nextTick()
  const end = performance.now()
  
  return {
    renderTime: end - start,
    wrapper
  }
}

/**
 * Test component under load
 */
export async function stressTest<T extends Component>(
  component: T,
  options: TestMountOptions<T> & { iterations?: number } = {}
) {
  const { iterations = 100, ...mountOptions } = options
  const times: number[] = []
  
  for (let i = 0; i < iterations; i++) {
    const { renderTime, wrapper } = await measureRenderTime(component, mountOptions)
    times.push(renderTime)
    wrapper.unmount()
  }
  
  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times
  }
}

// ============================================================================
// DEBUGGING UTILITIES
// ============================================================================

/**
 * Log component state for debugging
 */
export function logComponentState(wrapper: VueWrapper) {
  console.log('Component HTML:', wrapper.html())
  console.log('Component Props:', wrapper.props())
  console.log('Component Data:', wrapper.vm.$data)
  console.log('Component Computed:', wrapper.vm.$options.computed)
}

/**
 * Take snapshot of component for visual regression testing
 */
export function takeSnapshot(wrapper: VueWrapper, name?: string) {
  expect(wrapper.html()).toMatchSnapshot(name)
}