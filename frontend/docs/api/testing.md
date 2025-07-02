# API Testing Guide

This guide covers testing strategies and utilities for the Aster Management API, including unit tests, integration tests, and mock utilities.

## Testing Setup

### Test Environment Configuration

```typescript
// test/setup.ts
import { config } from '@vue/test-utils'
import { vi } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

// Mock server setup
export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())

// Global test utilities
global.mockApi = (endpoint: string, response: any, options?: MockOptions) => {
  server.use(
    rest[options?.method || 'get'](endpoint, (req, res, ctx) => {
      if (options?.delay) {
        return res(ctx.delay(options.delay), ctx.json(response))
      }
      return res(ctx.json(response))
    })
  )
}
```

## Mock Service Worker (MSW) Setup

### API Handlers

```typescript
// test/mocks/handlers.ts
import { rest } from 'msw'
import type { Matter, User, Document } from '~/types/api'

export const handlers = [
  // Authentication
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    const { email, password } = req.body as any
    
    if (email === 'test@example.com' && password === 'password') {
      return res(
        ctx.json({
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          user: mockUser()
        })
      )
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      })
    )
  }),
  
  // Matters
  rest.get('/api/v1/matters', (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || '0'
    const size = req.url.searchParams.get('size') || '20'
    
    return res(
      ctx.json({
        content: mockMatters(parseInt(size)),
        totalElements: 42,
        totalPages: 3,
        size: parseInt(size),
        number: parseInt(page)
      })
    )
  }),
  
  rest.get('/api/v1/matters/:id', (req, res, ctx) => {
    const { id } = req.params
    
    if (id === 'not-found') {
      return res(
        ctx.status(404),
        ctx.json({
          error: {
            code: 'NOT_FOUND',
            message: `Matter not found with id: ${id}`
          }
        })
      )
    }
    
    return res(ctx.json(mockMatter({ id: id as string })))
  }),
  
  rest.post('/api/v1/matters', async (req, res, ctx) => {
    const body = await req.json()
    
    // Validate required fields
    if (!body.title) {
      return res(
        ctx.status(400),
        ctx.json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [
              {
                field: 'title',
                message: 'Title is required'
              }
            ]
          }
        })
      )
    }
    
    return res(
      ctx.status(201),
      ctx.json(mockMatter({
        ...body,
        id: 'new-matter-123',
        status: 'DRAFT'
      }))
    )
  })
]
```

### Mock Data Factories

```typescript
// test/mocks/factories.ts
import { faker } from '@faker-js/faker'
import type { Matter, User, Document } from '~/types/api'

export const mockUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: {
    id: 'role-lawyer',
    name: 'lawyer',
    displayName: 'Lawyer',
    permissions: []
  },
  status: 'ACTIVE',
  permissions: [],
  twoFactorEnabled: false,
  emailVerified: true,
  phoneVerified: false,
  preferredLanguage: 'en',
  timezone: 'America/New_York',
  notificationPreferences: [],
  createdDate: faker.date.past().toISOString(),
  deleted: false,
  ...overrides
})

export const mockMatter = (overrides?: Partial<Matter>): Matter => ({
  id: faker.string.uuid(),
  caseNumber: `2024-${faker.number.int({ min: 1000, max: 9999 })}`,
  title: faker.company.catchPhrase(),
  description: faker.lorem.paragraph(),
  status: faker.helpers.arrayElement(['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED']),
  type: faker.helpers.arrayElement(['CIVIL_LITIGATION', 'CONTRACT_REVIEW', 'CORPORATE_LAW']),
  priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assignedTo: mockUser(),
  client: {
    id: faker.string.uuid(),
    name: faker.company.name(),
    email: faker.internet.email(),
    type: 'CORPORATION'
  },
  tags: faker.lorem.words(3).split(' '),
  createdDate: faker.date.past().toISOString(),
  deleted: false,
  ...overrides
})

export const mockMatters = (count: number = 10): Matter[] => 
  Array.from({ length: count }, () => mockMatter())

export const mockDocument = (overrides?: Partial<Document>): Document => ({
  id: faker.string.uuid(),
  title: faker.system.fileName(),
  filename: faker.system.fileName({ extensionCount: 1 }),
  originalName: faker.system.fileName({ extensionCount: 1 }),
  contentType: faker.helpers.arrayElement(['application/pdf', 'image/png', 'application/msword']),
  size: faker.number.int({ min: 1024, max: 10485760 }),
  category: faker.helpers.arrayElement(['CONTRACT', 'PLEADING', 'EVIDENCE']),
  status: 'READY',
  uploadedBy: mockUser(),
  storageUrl: faker.internet.url(),
  downloadUrl: faker.internet.url(),
  version: 1,
  isLatest: true,
  accessLevel: 'PRIVATE',
  tags: faker.lorem.words(2).split(' '),
  createdDate: faker.date.past().toISOString(),
  deleted: false,
  ...overrides
})
```

## Testing API Composables

### Basic API Composable Test

```typescript
// test/composables/useMatters.test.ts
import { describe, it, expect, vi } from 'vitest'
import { useMatters } from '~/composables/api/useMatters'
import { mockMatter, mockMatters } from '../mocks/factories'

describe('useMatters', () => {
  it('should fetch matters', async () => {
    const { fetchMatters } = useMatters()
    
    const result = await fetchMatters({ page: 0, size: 10 })
    
    expect(result.content).toHaveLength(10)
    expect(result.totalElements).toBe(42)
    expect(result.content[0]).toHaveProperty('id')
    expect(result.content[0]).toHaveProperty('title')
  })
  
  it('should handle fetch errors', async () => {
    // Mock network error
    server.use(
      rest.get('/api/v1/matters', (req, res) => 
        res.networkError('Failed to connect')
      )
    )
    
    const { fetchMatters } = useMatters()
    
    await expect(fetchMatters()).rejects.toThrow('Failed to connect')
  })
  
  it('should create a matter', async () => {
    const { createMatter } = useMatters()
    
    const newMatter = {
      title: 'Test Matter',
      type: 'CONTRACT_REVIEW' as const,
      priority: 'HIGH' as const,
      clientId: 'client-123'
    }
    
    const result = await createMatter(newMatter)
    
    expect(result.id).toBe('new-matter-123')
    expect(result.title).toBe('Test Matter')
    expect(result.status).toBe('DRAFT')
  })
  
  it('should handle validation errors', async () => {
    const { createMatter } = useMatters()
    
    const invalidMatter = {
      // Missing required title
      type: 'CONTRACT_REVIEW' as const,
      priority: 'HIGH' as const,
      clientId: 'client-123'
    }
    
    try {
      await createMatter(invalidMatter as any)
      expect.fail('Should have thrown error')
    } catch (error) {
      expect(error).toHaveProperty('code', 'VALIDATION_ERROR')
      expect(error).toHaveProperty('details')
      expect(error.details[0]).toMatchObject({
        field: 'title',
        message: 'Title is required'
      })
    }
  })
})
```

### Testing with TanStack Query

```typescript
// test/composables/useMattersQuery.test.ts
import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/vue-query'
import { useMattersQuery } from '~/composables/useMattersQuery'
import { renderComposable } from '../utils/render-composable'

describe('useMattersQuery', () => {
  it('should fetch and cache matters', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    })
    
    const { result, waitFor } = renderComposable(
      () => useMattersQuery(),
      { queryClient }
    )
    
    // Initially loading
    expect(result.value.isPending).toBe(true)
    expect(result.value.data).toBeUndefined()
    
    // Wait for success
    await waitFor(() => !result.value.isPending)
    
    expect(result.value.data).toBeDefined()
    expect(result.value.data.content).toHaveLength(20)
    expect(result.value.error).toBeNull()
    
    // Check cache
    const cachedData = queryClient.getQueryData(['matters'])
    expect(cachedData).toEqual(result.value.data)
  })
  
  it('should handle query parameters', async () => {
    const { result, waitFor } = renderComposable(() => 
      useMattersQuery({
        status: ['ACTIVE', 'ON_HOLD'],
        priority: 'HIGH'
      })
    )
    
    await waitFor(() => !result.value.isPending)
    
    // Verify the correct query key was used
    expect(result.value.queryKey).toEqual([
      'matters',
      {
        status: ['ACTIVE', 'ON_HOLD'],
        priority: 'HIGH'
      }
    ])
  })
})
```

## Testing Mutations

```typescript
// test/composables/useMatterMutations.test.ts
import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/vue-query'
import { useMatterMutations } from '~/composables/useMatterMutations'
import { renderComposable } from '../utils/render-composable'

describe('useMatterMutations', () => {
  it('should optimistically update matter', async () => {
    const queryClient = new QueryClient()
    const existingMatter = mockMatter({ id: 'matter-123', status: 'ACTIVE' })
    
    // Seed cache
    queryClient.setQueryData(['matter', 'matter-123'], existingMatter)
    
    const { result } = renderComposable(
      () => useMatterMutations(),
      { queryClient }
    )
    
    // Start mutation
    result.value.updateMatter.mutate({
      id: 'matter-123',
      data: { status: 'COMPLETED' }
    })
    
    // Check optimistic update
    const cachedMatter = queryClient.getQueryData(['matter', 'matter-123'])
    expect(cachedMatter.status).toBe('COMPLETED')
    
    // Wait for mutation to complete
    await vi.waitFor(() => result.value.updateMatter.isSuccess)
    
    // Verify final state
    expect(result.value.updateMatter.data.status).toBe('COMPLETED')
  })
  
  it('should rollback on error', async () => {
    const queryClient = new QueryClient()
    const existingMatter = mockMatter({ id: 'matter-123', status: 'ACTIVE' })
    
    queryClient.setQueryData(['matter', 'matter-123'], existingMatter)
    
    // Mock error response
    server.use(
      rest.patch('/api/v1/matters/:id', (req, res, ctx) => 
        res(
          ctx.status(422),
          ctx.json({
            error: {
              code: 'INVALID_STATE_TRANSITION',
              message: 'Cannot transition from ACTIVE to ARCHIVED'
            }
          })
        )
      )
    )
    
    const { result } = renderComposable(
      () => useMatterMutations(),
      { queryClient }
    )
    
    // Attempt invalid update
    result.value.updateMatter.mutate({
      id: 'matter-123',
      data: { status: 'ARCHIVED' }
    })
    
    await vi.waitFor(() => result.value.updateMatter.isError)
    
    // Check rollback
    const cachedMatter = queryClient.getQueryData(['matter', 'matter-123'])
    expect(cachedMatter.status).toBe('ACTIVE') // Rolled back
  })
})
```

## Testing Error Scenarios

```typescript
// test/api/error-handling.test.ts
import { describe, it, expect } from 'vitest'
import { ApiError, isApiError, hasErrorCode } from '~/utils/api-error'

describe('API Error Handling', () => {
  it('should handle 401 unauthorized', async () => {
    server.use(
      rest.get('/api/v1/matters', (req, res, ctx) => 
        res(
          ctx.status(401),
          ctx.json({
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Access token has expired'
            }
          })
        )
      )
    )
    
    try {
      await $fetch('/api/v1/matters')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(isApiError(error)).toBe(true)
      expect(hasErrorCode(error, 'TOKEN_EXPIRED')).toBe(true)
      expect(error.statusCode).toBe(401)
    }
  })
  
  it('should handle 422 business errors', async () => {
    server.use(
      rest.post('/api/v1/matters/:id/status', (req, res, ctx) => 
        res(
          ctx.status(422),
          ctx.json({
            error: {
              code: 'INVALID_STATE_TRANSITION',
              message: 'Cannot transition from COMPLETED to ACTIVE'
            }
          })
        )
      )
    )
    
    try {
      await $fetch('/api/v1/matters/123/status', {
        method: 'POST',
        body: { status: 'ACTIVE' }
      })
      expect.fail('Should have thrown')
    } catch (error) {
      expect(hasErrorCode(error, 'INVALID_STATE_TRANSITION')).toBe(true)
      expect(error.message).toContain('Cannot transition')
    }
  })
})
```

## Testing File Uploads

```typescript
// test/api/file-upload.test.ts
import { describe, it, expect } from 'vitest'
import { useDocuments } from '~/composables/api/useDocuments'

describe('Document Upload', () => {
  it('should upload a file', async () => {
    const { uploadDocument } = useDocuments()
    
    // Create mock file
    const file = new File(['test content'], 'test.pdf', {
      type: 'application/pdf'
    })
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'CONTRACT')
    
    const result = await uploadDocument(formData)
    
    expect(result.document.filename).toBe('test.pdf')
    expect(result.document.contentType).toBe('application/pdf')
    expect(result.processingJobs).toHaveLength(1)
    expect(result.processingJobs[0].type).toBe('OCR')
  })
  
  it('should handle file too large', async () => {
    server.use(
      rest.post('/api/v1/documents', (req, res, ctx) => 
        res(
          ctx.status(413),
          ctx.json({
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'File size exceeds maximum allowed size of 50MB'
            }
          })
        )
      )
    )
    
    const { uploadDocument } = useDocuments()
    const largeFile = new File(['x'.repeat(100_000_000)], 'large.pdf')
    
    const formData = new FormData()
    formData.append('file', largeFile)
    
    await expect(uploadDocument(formData)).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE'
    })
  })
})
```

## Testing WebSocket Connections

```typescript
// test/websocket/websocket.test.ts
import { describe, it, expect, vi } from 'vitest'
import WS from 'jest-websocket-mock'
import { WebSocketManager } from '~/utils/websocket-manager'

describe('WebSocket Integration', () => {
  let server: WS
  let client: WebSocketManager
  
  beforeEach(async () => {
    server = new WS('ws://localhost:8080/ws')
    client = new WebSocketManager({
      url: 'ws://localhost:8080/ws',
      token: 'test-token',
      reconnect: false
    })
    
    await server.connected
  })
  
  afterEach(() => {
    client.disconnect()
    WS.clean()
  })
  
  it('should handle matter updates', async () => {
    const callback = vi.fn()
    
    // Subscribe to matter channel
    client.subscribe('matter:123', callback)
    
    // Simulate server message
    server.send(JSON.stringify({
      id: 'msg-1',
      type: 'MATTER_UPDATED',
      timestamp: new Date().toISOString(),
      payload: {
        matterId: '123',
        changes: {
          status: { old: 'ACTIVE', new: 'COMPLETED' }
        }
      }
    }))
    
    await vi.waitFor(() => expect(callback).toHaveBeenCalled())
    
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MATTER_UPDATED',
        payload: expect.objectContaining({
          matterId: '123'
        })
      })
    )
  })
  
  it('should reconnect on disconnect', async () => {
    const client = new WebSocketManager({
      url: 'ws://localhost:8080/ws',
      token: 'test-token',
      reconnect: true,
      reconnectInterval: 100,
      maxReconnectAttempts: 3
    })
    
    await server.connected
    
    // Simulate disconnect
    server.close()
    
    // Wait for reconnect attempt
    await vi.waitFor(() => {
      expect(server).toHaveReceivedMessages(
        expect.arrayContaining([
          expect.stringContaining('AUTH')
        ])
      )
    }, { timeout: 500 })
  })
})
```

## Test Utilities

### Render Composable Helper

```typescript
// test/utils/render-composable.ts
import { createApp, h } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export function renderComposable<T>(
  composable: () => T,
  options?: {
    queryClient?: QueryClient
    plugins?: any[]
  }
) {
  let result: T
  
  const app = createApp({
    setup() {
      result = composable()
      return () => h('div')
    }
  })
  
  // Add plugins
  if (options?.queryClient) {
    app.use(VueQueryPlugin, {
      queryClient: options.queryClient
    })
  }
  
  options?.plugins?.forEach(plugin => app.use(plugin))
  
  app.mount(document.createElement('div'))
  
  return {
    result: result!,
    app,
    waitFor: vi.waitFor
  }
}
```

### API Mock Utilities

```typescript
// test/utils/api-mocks.ts
export const mockSuccessResponse = <T>(data: T, delay?: number) => {
  return delay 
    ? new Promise<T>(resolve => setTimeout(() => resolve(data), delay))
    : Promise.resolve(data)
}

export const mockErrorResponse = (
  code: string,
  message: string,
  statusCode: number = 400
) => {
  const error = new ApiError(code, statusCode, message)
  return Promise.reject(error)
}

export const mockPaginatedResponse = <T>(
  items: T[],
  page: number = 0,
  size: number = 20
) => ({
  content: items.slice(page * size, (page + 1) * size),
  totalElements: items.length,
  totalPages: Math.ceil(items.length / size),
  size,
  number: page,
  first: page === 0,
  last: page === Math.ceil(items.length / size) - 1,
  empty: items.length === 0
})
```

## Performance Testing

```typescript
// test/performance/api-performance.test.ts
import { describe, it, expect } from 'vitest'
import { measureTime } from '../utils/performance'

describe('API Performance', () => {
  it('should fetch matters within performance budget', async () => {
    const { duration, result } = await measureTime(
      () => $fetch('/api/v1/matters')
    )
    
    expect(duration).toBeLessThan(200) // 200ms budget
    expect(result.content).toHaveLength(20)
  })
  
  it('should handle concurrent requests efficiently', async () => {
    const start = performance.now()
    
    // Make 10 concurrent requests
    const promises = Array.from({ length: 10 }, (_, i) => 
      $fetch(`/api/v1/matters?page=${i}`)
    )
    
    const results = await Promise.all(promises)
    const duration = performance.now() - start
    
    expect(results).toHaveLength(10)
    expect(duration).toBeLessThan(500) // Should benefit from connection pooling
  })
})
```

## E2E API Testing

```typescript
// test/e2e/api-flow.test.ts
import { test, expect } from '@playwright/test'

test.describe('Matter API Flow', () => {
  test('complete matter lifecycle', async ({ request }) => {
    // 1. Login
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password'
      }
    })
    
    const { accessToken } = await loginResponse.json()
    
    // 2. Create matter
    const createResponse = await request.post('/api/v1/matters', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      data: {
        title: 'E2E Test Matter',
        type: 'CONTRACT_REVIEW',
        priority: 'HIGH',
        clientId: 'client-123'
      }
    })
    
    expect(createResponse.ok()).toBeTruthy()
    const matter = await createResponse.json()
    
    // 3. Upload document
    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.pdf'))
    formData.append('category', 'CONTRACT')
    formData.append('matterId', matter.id)
    
    const uploadResponse = await request.post('/api/v1/documents', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      multipart: formData
    })
    
    expect(uploadResponse.ok()).toBeTruthy()
    
    // 4. Update status
    const statusResponse = await request.patch(
      `/api/v1/matters/${matter.id}/status`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        data: {
          status: 'COMPLETED',
          completionNotes: 'E2E test completed'
        }
      }
    )
    
    expect(statusResponse.ok()).toBeTruthy()
  })
})
```

## Best Practices

1. **Use Mock Service Worker (MSW)**
   - Intercept at the network level
   - Share mocks between tests and development
   - Test error scenarios easily

2. **Test Data Factories**
   - Use faker for realistic data
   - Create composable factories
   - Maintain consistency

3. **Test Composables in Isolation**
   - Mock external dependencies
   - Test success and error paths
   - Verify caching behavior

4. **Performance Testing**
   - Set performance budgets
   - Test concurrent requests
   - Monitor bundle size impact

5. **E2E Testing**
   - Test complete user flows
   - Verify API contracts
   - Test authentication flows