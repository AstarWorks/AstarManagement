/**
 * Integration Test Setup
 * Provides test utilities and environment configuration for integration tests
 */

import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

// Global test configuration
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
})

// Vue Test Utils global configuration will be handled per test
// to avoid plugin conflicts

// Mock global components that are auto-imported
config.global.stubs = {
  NuxtLink: {
    template: '<a><slot /></a>',
    props: ['to']
  },
  NuxtPage: {
    template: '<div><slot /></div>'
  },
  ClientOnly: {
    template: '<div><slot /></div>'
  }
}

// Setup Pinia for each test
export const setupTestPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// Mock server state for consistent testing
export const mockServerState = {
  matters: [
    {
      id: '1',
      title: 'Contract Review',
      description: 'Review client contract terms',
      status: 'draft',
      priority: 'medium',
      assigneeId: 'user-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2', 
      title: 'Legal Research',
      description: 'Research precedent cases',
      status: 'in-progress',
      priority: 'high',
      assigneeId: 'user-2',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    }
  ],
  users: [
    {
      id: 'user-1',
      name: 'John Lawyer',
      email: 'john@law.com',
      role: 'lawyer'
    },
    {
      id: 'user-2',
      name: 'Jane Clerk',
      email: 'jane@law.com', 
      role: 'clerk'
    }
  ]
}

// API Mock utilities
export const createApiMock = () => {
  const apiMock = vi.fn()
  
  // Mock successful responses by default
  apiMock.mockImplementation((endpoint: string, options: any = {}) => {
    const method = options.method || 'GET'
    const path = endpoint.replace('/api', '')
    
    switch (true) {
      case path === '/matters' && method === 'GET':
        return Promise.resolve(mockServerState.matters)
        
      case path === '/matters' && method === 'POST':
        const newMatter = {
          id: Date.now().toString(),
          ...options.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockServerState.matters.push(newMatter)
        return Promise.resolve(newMatter)
        
      case path.match(/\/matters\/(\d+)/) && method === 'PATCH':
        const matterId = path.split('/')[2]
        const matterIndex = mockServerState.matters.findIndex(m => m.id === matterId)
        if (matterIndex !== -1) {
          mockServerState.matters[matterIndex] = {
            ...mockServerState.matters[matterIndex],
            ...options.body,
            updatedAt: new Date(),
          }
          return Promise.resolve(mockServerState.matters[matterIndex])
        }
        return Promise.reject(new Error('Matter not found'))
        
      default:
        return Promise.reject(new Error(`Unhandled API call: ${method} ${path}`))
    }
  })
  
  return apiMock
}

// WebSocket mock for real-time testing
export const createWebSocketMock = () => {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    isConnected: vi.fn(() => true),
  }
}

// Drag and drop testing utilities
export const createDragEvent = (type: string, dataTransfer?: any) => {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: dataTransfer || {
      setData: vi.fn(),
      getData: vi.fn(),
      types: [],
    }
  })
  return event
}

// Animation frame mock for drag/drop testing
export const mockAnimationFrame = () => {
  const originalRAF = global.requestAnimationFrame
  const originalCAF = global.cancelAnimationFrame
  
  global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16) as any
  })
  
  global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id)
  })
  
  return () => {
    global.requestAnimationFrame = originalRAF
    global.cancelAnimationFrame = originalCAF
  }
}

// Local storage mock
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  const localStorageMock = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length
    }
  }
  
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
  })
  
  return localStorageMock
}