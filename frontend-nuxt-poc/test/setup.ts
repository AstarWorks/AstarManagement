import { config } from '@vue/test-utils'

// Global test setup
config.global.stubs = {
  // Stub Nuxt auto-imports
  NuxtLink: true,
  NuxtPage: true,
  ClientOnly: true
}

// Mock global functions
global.definePageMeta = () => {}
global.defineNuxtConfig = (config: any) => config
global.defineNuxtPlugin = (plugin: any) => plugin
global.navigateTo = vi.fn()
global.useRoute = vi.fn()
global.useRouter = vi.fn()
global.useRuntimeConfig = vi.fn(() => ({
  public: {
    apiUrl: 'http://localhost:8080'
  }
}))

// Mock readonly utility
global.readonly = (value: any) => value