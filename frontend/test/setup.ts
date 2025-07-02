import { config } from '@vue/test-utils'
import { vi, beforeEach, afterEach } from 'vitest'
import { createApp } from 'vue'

// Global test setup
config.global.stubs = {
  // Stub Nuxt auto-imports - use component-like stubs instead of boolean
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
  // Stub common UI components that might cause issues
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
  }
}

// Create a test app instance for lifecycle management
let testApp: any = null

beforeEach(() => {
  // Create a new app instance for each test to provide Vue context
  testApp = createApp({})
  vi.clearAllMocks()
  vi.clearAllTimers()
})

afterEach(() => {
  // Clean up app instance
  if (testApp) {
    testApp.unmount?.()
    testApp = null
  }
  vi.clearAllMocks()
  vi.clearAllTimers()
  vi.resetAllMocks()
})

// Mock window APIs that might not be available in test environment
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
    userAgent: 'test'
  },
  writable: true
})

Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
})

// Mock Web APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock WebSocket for real-time tests
global.WebSocket = vi.fn().mockImplementation(() => ({
  readyState: 1, // OPEN
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null
}))

// Mock Nuxt composables to avoid conflicts
vi.mock('#app', () => ({
  definePageMeta: () => {},
  defineNuxtConfig: (config: any) => config,
  defineNuxtPlugin: (plugin: any) => plugin,
  navigateTo: vi.fn(),
  useRoute: vi.fn(() => ({
    path: '/',
    params: {},
    query: {},
    meta: {}
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn()
  })),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      apiUrl: 'http://localhost:8080'
    }
  })),
  useHead: vi.fn(),
  useSeoMeta: vi.fn(),
  useNuxtApp: vi.fn(() => ({
    $fetch: vi.fn(() => Promise.resolve([])),
    ssrContext: undefined,
    isHydrating: false
  }))
}))

// Mock $fetch and other server composables
vi.mock('#imports', () => ({
  $fetch: vi.fn(() => Promise.resolve([])),
  useFetch: vi.fn(() => ({
    data: { value: null },
    pending: { value: false },
    error: { value: null },
    refresh: vi.fn(),
    execute: vi.fn()
  })),
  useAsyncData: vi.fn(() => ({
    data: { value: null },
    pending: { value: false },
    error: { value: null },
    refresh: vi.fn(),
    execute: vi.fn()
  })),
  useState: vi.fn((key: string, init?: any) => {
    return { value: typeof init === 'function' ? init() : init }
  }),
  useNuxtData: vi.fn(() => ({})),
  useLazyFetch: vi.fn(() => ({
    data: { value: null },
    pending: { value: false },
    error: { value: null },
    refresh: vi.fn()
  })),
  useLazyAsyncData: vi.fn(() => ({
    data: { value: null },
    pending: { value: false },
    error: { value: null },
    refresh: vi.fn()
  }))
}))

// Mock TanStack Query
vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(() => ({
    data: { value: null },
    isLoading: { value: false },
    isError: { value: false },
    error: { value: null },
    refetch: vi.fn()
  })),
  useInfiniteQuery: vi.fn(() => ({
    data: { value: null },
    isLoading: { value: false },
    isError: { value: false },
    error: { value: null },
    fetchNextPage: vi.fn(),
    hasNextPage: { value: false }
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: { value: false },
    isError: { value: false },
    error: { value: null }
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    prefetchQuery: vi.fn()
  })),
  VueQueryPlugin: {},
  QueryClient: vi.fn().mockImplementation(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    prefetchQuery: vi.fn()
  }))
}))

// Enhanced fetch mock with better error handling
const createMockFetch = () => {
  return vi.fn().mockImplementation((url: string, options?: any) => {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
          text: () => Promise.resolve(''),
          blob: () => Promise.resolve(new Blob()),
          headers: new Headers(),
          url,
          statusText: 'OK'
        })
      }, 10) // Very short delay for tests
    })
  })
}

global.fetch = createMockFetch()
global.$fetch = createMockFetch()

// Mock Pinia for store tests
vi.mock('pinia', () => ({
  defineStore: vi.fn(() => vi.fn()),
  createPinia: vi.fn(() => ({})),
  setActivePinia: vi.fn(),
  getActivePinia: vi.fn(() => ({})),
  storeToRefs: vi.fn((store) => store)
}))

// Mock VueUse composables - use partial mock approach to avoid missing exports
vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // Override only the ones that need mocking
    useEventListener: vi.fn(),
    useWebSocket: vi.fn(() => ({
      status: { value: 'CLOSED' },
      data: { value: null },
      send: vi.fn(),
      close: vi.fn(),
      open: vi.fn()
    })),
    useNetwork: vi.fn(() => ({
      isOnline: { value: true },
      effectiveType: { value: '4g' }
    })),
    useTimestamp: vi.fn(() => ({ timestamp: { value: Date.now() } })),
    useLocalStorage: vi.fn((key, defaultValue) => ({
      value: defaultValue
    })),
    useSessionStorage: vi.fn((key, defaultValue) => ({
      value: defaultValue
    })),
    useDebounceFn: vi.fn((fn) => fn),
    useThrottleFn: vi.fn((fn) => fn),
    useBreakpoints: vi.fn(() => ({
      smaller: vi.fn(() => ({ value: false })),
      between: vi.fn(() => ({ value: false })),
      greaterOrEqual: vi.fn(() => ({ value: true })),
      active: vi.fn(() => ({ value: 'lg' })),
      md: { value: false },
      lg: { value: true },
      xl: { value: false }
    })),
    useWindowSize: vi.fn(() => ({
      width: { value: 1024 },
      height: { value: 768 }
    })),
    useElementSize: vi.fn(() => ({
      width: { value: 0 },
      height: { value: 0 }
    })),
    useClickOutside: vi.fn(),
    useFocus: vi.fn(() => ({ focused: { value: false } })),
    useSwipe: vi.fn(() => ({
      direction: { value: null },
      lengthX: { value: 0 },
      lengthY: { value: 0 },
      isSwiping: { value: false }
    })),
    whenever: vi.fn(),
    until: vi.fn(() => ({
      toBe: vi.fn(() => Promise.resolve())
    }))
  }
})

// Mock performance APIs
if (typeof performance === 'undefined') {
  global.performance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  } as any
}