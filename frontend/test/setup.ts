/**
 * Vitest Test Setup
 * テスト環境のセットアップファイル
 */

import { vi } from 'vitest'
import { config } from '@nuxt/test-utils/runtime'

// Vue Test Utils のグローバル設定
config.global.stubs = {
  // Nuxt コンポーネントのスタブ
  NuxtLink: {
    template: '<a href="#"><slot /></a>',
    props: ['to']
  },
  Icon: {
    template: '<span data-testid="icon"><slot /></span>',
    props: ['name']
  },
  ClientOnly: {
    template: '<div><slot /></div>'
  }
}

// グローバルモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// localStorage のモック
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
  writable: true,
})

// sessionStorage のモック
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
  writable: true,
})

// IntersectionObserver のモック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// ResizeObserver のモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Nuxt 関数のモック
vi.mock('#app', () => ({
  navigateTo: vi.fn(),
  useRoute: () => ({
    path: '/test',
    query: {},
    params: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useHead: vi.fn(),
  useCookie: vi.fn(() => ({
    value: null,
  })),
  useRuntimeConfig: () => ({
    public: {
      apiBase: 'http://localhost:8080/api',
      showDebugInfo: false,
    },
  }),
  defineNuxtRouteMiddleware: vi.fn((middleware) => middleware),
}))

// Global Nuxt functions
global.defineNuxtRouteMiddleware = vi.fn((middleware) => middleware)
global.navigateTo = vi.fn()
global.useAuthStore = vi.fn(() => ({
  user: null,
  isAuthenticated: false,
  roles: [],
  permissions: [],
  status: 'idle',
  login: vi.fn(),
  logout: vi.fn(),
  hasPermission: vi.fn(() => false),
  hasRole: vi.fn(() => false),
  hasAnyRole: vi.fn(() => false),
  initialize: vi.fn(),
  refreshToken: vi.fn(),
  fetchUser: vi.fn(),
}))

// Pinia のモック
vi.mock('pinia', () => ({
  defineStore: vi.fn(),
  createPinia: vi.fn(),
  setActivePinia: vi.fn(),
}))

// Auth Store のモック
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    roles: [],
    permissions: [],
    login: vi.fn(),
    logout: vi.fn(),
    hasPermission: vi.fn(() => false),
    hasRole: vi.fn(() => false),
    hasAnyRole: vi.fn(() => false),
  }),
}))

// Navigation Store のモック
vi.mock('~/stores/navigation', () => ({
  useNavigationStore: () => ({
    isSidebarOpen: true,
    isMobileMenuOpen: false,
    breadcrumbs: [],
    toggleSidebar: vi.fn(),
    toggleMobileMenu: vi.fn(),
    closeMobileMenu: vi.fn(),
    setBreadcrumbs: vi.fn(),
    generateBreadcrumbs: vi.fn(),
    restoreSettings: vi.fn(),
    setCurrentPath: vi.fn(),
    addRecentlyVisited: vi.fn(),
    mainNavigationItems: [],
    adminNavigationItems: [],
    userMenuItems: [],
    filteredMainNavigation: [],
    filteredAdminNavigation: [],
    recentPages: [],
  }),
}))

// UI Store のモック
vi.mock('~/stores/ui', () => ({
  useUIStore: () => ({
    theme: 'light',
    initializeTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
}))

// MSW のモック
vi.mock('../app/utils/msw', () => ({
  setupMSW: vi.fn(),
}))

// shadcn-vue コンポーネントのモック
vi.mock('@/components/ui/button', () => ({
  Button: {
    template: '<button><slot /></button>',
    props: ['variant', 'size', 'disabled', 'class'],
  },
}))

vi.mock('@/components/ui/card', () => ({
  Card: {
    template: '<div class="card"><slot /></div>',
    props: ['class'],
  },
  CardHeader: {
    template: '<div class="card-header"><slot /></div>',
    props: ['class'],
  },
  CardTitle: {
    template: '<h3 class="card-title"><slot /></h3>',
    props: ['class'],
  },
  CardContent: {
    template: '<div class="card-content"><slot /></div>',
    props: ['class'],
  },
}))

vi.mock('@/components/ui/input', () => ({
  Input: {
    template: '<input />',
    props: ['type', 'placeholder', 'disabled', 'class', 'modelValue'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('@/components/ui/label', () => ({
  Label: {
    template: '<label><slot /></label>',
    props: ['for', 'class'],
  },
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: {
    template: '<span class="badge"><slot /></span>',
    props: ['variant', 'class'],
  },
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: {
    template: '<div class="avatar"><slot /></div>',
    props: ['class'],
  },
  AvatarImage: {
    template: '<img />',
    props: ['src', 'alt', 'class'],
  },
  AvatarFallback: {
    template: '<div class="avatar-fallback"><slot /></div>',
    props: ['class'],
  },
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: {
    template: '<div class="tooltip"><slot /></div>',
    props: ['content'],
  },
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: {
    template: '<div class="popover"><slot /></div>',
  },
  PopoverTrigger: {
    template: '<div class="popover-trigger"><slot /></div>',
    props: ['asChild'],
  },
  PopoverContent: {
    template: '<div class="popover-content"><slot /></div>',
    props: ['side', 'class'],
  },
}))

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: {
    template: '<div class="collapsible"><slot /></div>',
    props: ['open'],
    emits: ['update:open'],
  },
  CollapsibleContent: {
    template: '<div class="collapsible-content"><slot /></div>',
    props: ['class'],
  },
}))

// Console をクリーンに保つため、テスト中の console.warn を抑制
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('[Vue warn]')
    ) {
      return
    }
    originalWarn(...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})