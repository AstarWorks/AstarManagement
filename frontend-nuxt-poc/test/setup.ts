import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Global test setup
config.global.stubs = {
  // Stub Nuxt auto-imports
  NuxtLink: true,
  NuxtPage: true,
  ClientOnly: true
}

// Mock Nuxt composables to avoid conflicts
vi.mock('#app', () => ({
  definePageMeta: () => {},
  defineNuxtConfig: (config: any) => config,
  defineNuxtPlugin: (plugin: any) => plugin,
  navigateTo: vi.fn(),
  useRoute: vi.fn(() => ({
    path: '/',
    params: {},
    query: {}
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  })),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      apiUrl: 'http://localhost:8080'
    }
  }))
}))

// Mock $fetch and other server composables
vi.mock('#imports', () => ({
  $fetch: vi.fn(() => Promise.resolve([])),
  useFetch: vi.fn(() => ({
    data: { value: null },
    pending: { value: false },
    error: { value: null },
    refresh: vi.fn()
  })),
  useAsyncData: vi.fn(() => ({
    data: { value: null },
    pending: { value: false },
    error: { value: null },
    refresh: vi.fn()
  })),
  useState: vi.fn((key: string, init?: any) => {
    return { value: typeof init === 'function' ? init() : init }
  }),
  useNuxtData: vi.fn(() => ({}))
}))