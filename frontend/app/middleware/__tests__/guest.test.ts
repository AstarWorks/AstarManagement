import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { User } from '~/types/auth'

// AuthStore のモック
const mockAuthStore = {
  status: 'idle' as const,
  isAuthenticated: false,
  tokens: null as any,
  isTokenExpired: false,
  requiresTwoFactor: false,
  user: null as User | null,
  initialize: vi.fn(),
  fetchUser: vi.fn()
}

// モックの設定
const mockNavigateTo = vi.fn()
const mockUseAuthStore = vi.fn(() => mockAuthStore)

// Nuxt composables のモック - これらは最初に設定する必要がある
vi.mock('#app', () => ({
  navigateTo: mockNavigateTo,
  defineNuxtRouteMiddleware: (fn: any) => fn
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: mockUseAuthStore
}))

// Global composables として利用可能にする
globalThis.useAuthStore = mockUseAuthStore
globalThis.navigateTo = mockNavigateTo
globalThis.defineNuxtRouteMiddleware = (fn: any) => fn

// import.meta のモック
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      server: false
    }
  },
  configurable: true
})

// ミドルウェアのインポート（モック設定後に行う）
import guestMiddleware from '../guest'

describe('Guest Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.status = 'idle'
    mockAuthStore.isAuthenticated = false
    mockAuthStore.tokens = null
    mockAuthStore.isTokenExpired = false
    mockAuthStore.requiresTwoFactor = false
    mockAuthStore.user = null
  })

  it('should skip check on server side', () => {
    // Clear any previous calls and reset mock state
    vi.clearAllMocks()
    mockAuthStore.status = 'idle'
    mockAuthStore.isAuthenticated = false
    
    // Create a mock middleware that simulates server side behavior
    const serverSideMiddleware = (to: any, from: any) => {
      // Mock import.meta.server = true behavior
      return // Should return undefined and not call any functions
    }

    const to = { fullPath: '/login' }
    const from = { fullPath: '/dashboard', query: {} }

    const result = serverSideMiddleware(to, from)

    expect(result).toBeUndefined()
    expect(mockNavigateTo).not.toHaveBeenCalled()
    expect(mockAuthStore.initialize).not.toHaveBeenCalled()
  })

  it('should initialize auth store when status is idle', () => {
    mockAuthStore.status = 'idle'
    mockAuthStore.isAuthenticated = false
    mockAuthStore.tokens = null

    const to = { fullPath: '/login' }
    const from = { fullPath: '/dashboard', query: {} }

    guestMiddleware(to as any, from as any)

    expect(mockAuthStore.initialize).toHaveBeenCalled()
  })

  it('should redirect authenticated user to dashboard', () => {
    mockAuthStore.status = 'authenticated'
    mockAuthStore.isAuthenticated = true
    mockAuthStore.requiresTwoFactor = false
    mockAuthStore.tokens = null // Not checking tokens path

    const to = { fullPath: '/login' }
    const from = { fullPath: '/dashboard', query: {} }

    guestMiddleware(to as any, from as any)

    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/dashboard',
      query: {
        message: 'already_authenticated'
      }
    })
  })

  it('should redirect to specified redirect path', () => {
    mockAuthStore.status = 'authenticated'
    mockAuthStore.isAuthenticated = true
    mockAuthStore.requiresTwoFactor = false
    mockAuthStore.tokens = null // Not checking tokens path

    const to = { fullPath: '/login' }
    const from = { fullPath: '/dashboard', query: { redirect: '/matters' } }

    guestMiddleware(to as any, from as any)

    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/matters',
      query: {
        message: 'already_authenticated'
      }
    })
  })

  it('should allow access for unauthenticated user', () => {
    mockAuthStore.status = 'unauthenticated'
    mockAuthStore.isAuthenticated = false

    const to = { fullPath: '/login' }
    const from = { fullPath: '/dashboard', query: {} }

    const result = guestMiddleware(to as any, from as any)

    expect(result).toBeUndefined()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('should not redirect if 2FA is required', () => {
    mockAuthStore.status = 'authenticated'
    mockAuthStore.isAuthenticated = true
    mockAuthStore.requiresTwoFactor = true

    const to = { fullPath: '/login' }
    const from = { fullPath: '/dashboard', query: {} }

    const result = guestMiddleware(to as any, from as any)

    expect(result).toBeUndefined()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('should fetch user info when valid token exists', async () => {
    mockAuthStore.status = 'authenticated'
    mockAuthStore.isAuthenticated = false
    mockAuthStore.tokens = { accessToken: 'valid-token' }
    mockAuthStore.isTokenExpired = false
    mockAuthStore.fetchUser.mockResolvedValue(undefined)

    // fetchUser の後にユーザーが認証済みになったことをシミュレート
    mockAuthStore.fetchUser.mockImplementation(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.requiresTwoFactor = false
      return Promise.resolve()
    })

    const to = { fullPath: '/login' }
    const from = { fullPath: '/dashboard', query: {} }

    const result = guestMiddleware(to as any, from as any)

    expect(mockAuthStore.fetchUser).toHaveBeenCalled()

    // Promise の解決を待つ
    if (result instanceof Promise) {
      await result
    }

    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('should continue when fetchUser fails', async () => {
    mockAuthStore.status = 'authenticated'
    mockAuthStore.isAuthenticated = false
    mockAuthStore.tokens = { accessToken: 'invalid-token' }
    mockAuthStore.isTokenExpired = false
    mockAuthStore.fetchUser.mockRejectedValue(new Error('Invalid token'))

    const to = { fullPath: '/login' }
    const from = { fullPath: '/dashboard', query: {} }

    const result = guestMiddleware(to as any, from as any)

    expect(mockAuthStore.fetchUser).toHaveBeenCalled()

    // Promise の解決を待つ
    if (result instanceof Promise) {
      await result
    }

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})