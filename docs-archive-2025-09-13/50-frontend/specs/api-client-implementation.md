# API Client Implementation Specification

## 概要

本仕様書は、Frontend API Client Designに基づく具体的な実装仕様を定義します。型定義、インターフェース、実装例を含む技術仕様書です。

## インターフェース定義

### Core Types

```typescript
// shared/api/types/index.ts

export interface RequestOptions {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: Record<string, any>
  body?: any
  headers?: Record<string, string>
  retryCount?: number
  timeout?: number
}

export interface ApiConfig {
  mode: 'mock' | 'real'
  baseUrl: string
  timeout: number
  retryCount: number
  cacheEnabled: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiErrorDetails {
  message: string
  statusCode: number
  code: string
  details?: any
  timestamp?: string
  path?: string
}

export interface CacheOptions {
  ttl?: number
  lazy?: boolean
  forceRefresh?: boolean
  transform?: (data: any) => any
}
```

### Repository Interface

```typescript
// shared/api/repositories/interfaces/IRepository.ts

export interface IRepository<T, CreateDto, UpdateDto> {
  list(params?: any): Promise<PaginatedResponse<T>>
  get(id: string): Promise<T>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}

// modules/expense/repositories/IExpenseRepository.ts

export interface IExpenseRepository extends IRepository<
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto
> {
  // 追加の専用メソッド
  bulkCreate(data: CreateExpenseDto[]): Promise<Expense[]>
  getSummary(params: ExpenseSummaryParams): Promise<ExpenseSummary>
  getByCategory(categoryId: string): Promise<Expense[]>
}
```

## 実装詳細

### BaseApiClient

```typescript
// shared/api/core/BaseApiClient.ts

export abstract class BaseApiClient {
  protected baseURL: string
  protected timeout: number
  protected retryCount: number
  
  constructor(config: ApiConfig) {
    this.baseURL = config.baseUrl
    this.timeout = config.timeout
    this.retryCount = config.retryCount
  }
  
  protected async handleRequest<T>(
    fn: () => Promise<T>,
    options?: RequestOptions
  ): Promise<T> {
    try {
      return await this.withRetry(
        fn,
        options?.retryCount || this.retryCount
      )
    } catch (error) {
      throw this.transformError(error)
    }
  }
  
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0 && this.isRetryable(error)) {
        await this.delay(this.getBackoffDelay(this.retryCount - retries))
        return this.withRetry(fn, retries - 1)
      }
      throw error
    }
  }
  
  private getBackoffDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s...
    return Math.min(1000 * Math.pow(2, attempt), 10000)
  }
  
  private isRetryable(error: any): boolean {
    const retryableCodes = [408, 429, 500, 502, 503, 504]
    return error?.statusCode && retryableCodes.includes(error.statusCode)
  }
  
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  private transformError(error: any): ApiError {
    if (error instanceof ApiError) return error
    
    const details: ApiErrorDetails = {
      message: error?.data?.message || error?.message || 'Unknown error occurred',
      statusCode: error?.statusCode || error?.status || 500,
      code: error?.data?.code || error?.code || 'UNKNOWN_ERROR',
      details: error?.data?.details || error?.data,
      timestamp: new Date().toISOString(),
      path: error?.url
    }
    
    return new ApiError(details)
  }
  
  abstract request<T>(options: RequestOptions): Promise<T>
}
```

### MockApiClient

```typescript
// shared/api/clients/MockApiClient.ts

export type MockHandler = (options: RequestOptions) => any

export class MockApiClient extends BaseApiClient {
  private handlers = new Map<string, MockHandler>()
  private mockDelay = { min: 100, max: 300 }
  
  constructor(config: ApiConfig) {
    super(config)
    this.registerHandlers()
  }
  
  private registerHandlers() {
    // Viteのglob importでハンドラーを自動登録
    const modules = import.meta.glob<{ default: MockHandler }>(
      '../mock/handlers/*.ts',
      { eager: true }
    )
    
    for (const [path, module] of Object.entries(modules)) {
      const name = this.extractHandlerName(path)
      if (name && module.default) {
        this.handlers.set(name, module.default)
      }
    }
  }
  
  private extractHandlerName(path: string): string {
    const match = path.match(/\/([^/]+)\.ts$/)
    return match ? match[1] : ''
  }
  
  async request<T>(options: RequestOptions): Promise<T> {
    return this.handleRequest(async () => {
      // API遅延をシミュレート
      const delay = this.mockDelay.min + 
        Math.random() * (this.mockDelay.max - this.mockDelay.min)
      await this.delay(delay)
      
      // ランダムエラーシミュレーション（1%の確率）
      if (Math.random() < 0.01) {
        throw new Error('Random mock error for testing')
      }
      
      // エンドポイントからハンドラーを特定
      const handlerKey = this.getHandlerKey(options.endpoint)
      const handler = this.handlers.get(handlerKey)
      
      if (!handler) {
        throw new ApiError({
          message: `Mock handler not found for: ${handlerKey}`,
          statusCode: 404,
          code: 'MOCK_NOT_FOUND',
          details: { endpoint: options.endpoint }
        })
      }
      
      // モックハンドラーを実行
      const result = handler(options)
      
      // Promiseでない場合はPromiseでラップ
      return Promise.resolve(result) as Promise<T>
    }, options)
  }
  
  private getHandlerKey(endpoint: string): string {
    // /api/v1/expenses/123 -> expenses
    const segments = endpoint.split('/').filter(Boolean)
    
    // ID付きエンドポイントの処理
    if (segments.length > 0) {
      // 数値またはUUIDパターンを除外
      const filtered = segments.filter(
        s => !(/^\d+$/.test(s) || /^[0-9a-f-]{36}$/i.test(s))
      )
      return filtered[filtered.length - 1] || segments[0]
    }
    
    return ''
  }
}
```

### RealApiClient

```typescript
// shared/api/clients/RealApiClient.ts

export class RealApiClient extends BaseApiClient {
  private client: typeof $fetch
  
  constructor(config: ApiConfig) {
    super(config)
    this.client = this.createClient()
  }
  
  private createClient() {
    return $fetch.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      
      onRequest({ options }) {
        // 認証トークンの付与
        const { $auth } = useNuxtApp()
        const token = $auth?.token || useAuthStore()?.token
        
        if (token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`
          }
        }
        
        // デフォルトヘッダー
        options.headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Client-Version': '1.0.0',
          ...options.headers
        }
      },
      
      onRequestError({ error }) {
        console.error('Request error:', error)
      },
      
      onResponse({ response }) {
        // レスポンスログ（開発環境のみ）
        if (process.env.NODE_ENV === 'development') {
          console.log('API Response:', {
            url: response.url,
            status: response.status,
            headers: response.headers
          })
        }
      },
      
      onResponseError({ response }) {
        // エラーレスポンスの処理
        if (response.status === 401) {
          // 認証エラー処理
          const authStore = useAuthStore()
          authStore.logout()
          navigateTo('/signin')
        }
      }
    })
  }
  
  async request<T>(options: RequestOptions): Promise<T> {
    return this.handleRequest(async () => {
      const fetchOptions: any = {
        method: options.method,
        params: options.params,
        body: options.body,
        headers: options.headers
      }
      
      // GETリクエストではbodyを送信しない
      if (options.method === 'GET') {
        delete fetchOptions.body
      }
      
      return await this.client<T>(options.endpoint, fetchOptions)
    }, options)
  }
}
```

### BaseRepository

```typescript
// shared/api/core/BaseRepository.ts

export abstract class BaseRepository {
  constructor(protected client: BaseApiClient) {}
  
  protected cacheKey(...parts: (string | number | undefined)[]): string {
    const validParts = parts.filter(p => p !== undefined)
    return `${this.constructor.name}:${validParts.join(':')}`
  }
  
  protected async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      await clearNuxtData(pattern)
    } else {
      // このリポジトリの全キャッシュをクリア
      const basePattern = this.constructor.name
      await clearNuxtData(basePattern)
    }
  }
  
  protected async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // サーバーサイドではキャッシュを使用しない
    if (process.server) {
      return await fetcher()
    }
    
    const { data, refresh, error } = await useAsyncData(
      key,
      fetcher,
      {
        server: false,
        lazy: options?.lazy ?? true,
        transform: options?.transform,
        getCachedData(key) {
          // TTL チェック
          if (options?.ttl) {
            const nuxtApp = useNuxtApp()
            const cachedData = nuxtApp.payload.data[key]
            const cacheTime = nuxtApp.payload._cacheTime?.[key]
            
            if (cachedData && cacheTime) {
              const age = Date.now() - cacheTime
              if (age > options.ttl) {
                // キャッシュ期限切れ
                return undefined
              }
            }
          }
          return nuxtApp.payload.data[key]
        }
      }
    )
    
    if (options?.forceRefresh) {
      await refresh()
    }
    
    if (error.value) {
      throw error.value
    }
    
    // キャッシュ時刻を記録
    if (options?.ttl) {
      const nuxtApp = useNuxtApp()
      if (!nuxtApp.payload._cacheTime) {
        nuxtApp.payload._cacheTime = {}
      }
      nuxtApp.payload._cacheTime[key] = Date.now()
    }
    
    return data.value as T
  }
  
  protected async batchInvalidate(patterns: string[]): Promise<void> {
    await Promise.all(patterns.map(p => this.invalidateCache(p)))
  }
}
```

## 実装例

### ExpenseRepository

```typescript
// modules/expense/repositories/ExpenseApiRepository.ts

export class ExpenseApiRepository extends BaseRepository implements IExpenseRepository {
  async list(params?: ExpenseListParams): Promise<PaginatedResponse<Expense>> {
    const cacheKey = this.cacheKey('list', JSON.stringify(params))
    
    return this.withCache(
      cacheKey,
      () => this.client.request<PaginatedResponse<Expense>>({
        endpoint: '/expenses',
        method: 'GET',
        params
      }),
      { 
        ttl: 5000, // 5秒キャッシュ
        transform: (data) => ({
          ...data,
          data: data.data.map(this.transformExpense)
        })
      }
    )
  }
  
  async get(id: string): Promise<Expense> {
    const cacheKey = this.cacheKey('get', id)
    
    return this.withCache(
      cacheKey,
      () => this.client.request<Expense>({
        endpoint: `/expenses/${id}`,
        method: 'GET'
      }),
      { 
        ttl: 10000,
        transform: this.transformExpense
      }
    )
  }
  
  async create(data: CreateExpenseDto): Promise<Expense> {
    const result = await this.client.request<Expense>({
      endpoint: '/expenses',
      method: 'POST',
      body: data
    })
    
    // キャッシュの無効化
    await this.batchInvalidate([
      'ExpenseApiRepository:list',
      'ExpenseApiRepository:summary'
    ])
    
    return this.transformExpense(result)
  }
  
  async update(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const result = await this.client.request<Expense>({
      endpoint: `/expenses/${id}`,
      method: 'PUT',
      body: data
    })
    
    // 特定のキャッシュを無効化
    await this.batchInvalidate([
      `ExpenseApiRepository:get:${id}`,
      'ExpenseApiRepository:list',
      'ExpenseApiRepository:summary'
    ])
    
    return this.transformExpense(result)
  }
  
  async delete(id: string): Promise<void> {
    await this.client.request<void>({
      endpoint: `/expenses/${id}`,
      method: 'DELETE'
    })
    
    // キャッシュの無効化
    await this.batchInvalidate([
      `ExpenseApiRepository:get:${id}`,
      'ExpenseApiRepository:list',
      'ExpenseApiRepository:summary'
    ])
  }
  
  async bulkCreate(data: CreateExpenseDto[]): Promise<Expense[]> {
    const result = await this.client.request<Expense[]>({
      endpoint: '/expenses/bulk',
      method: 'POST',
      body: { expenses: data }
    })
    
    await this.invalidateCache()
    
    return result.map(this.transformExpense)
  }
  
  async getSummary(params: ExpenseSummaryParams): Promise<ExpenseSummary> {
    const cacheKey = this.cacheKey('summary', JSON.stringify(params))
    
    return this.withCache(
      cacheKey,
      () => this.client.request<ExpenseSummary>({
        endpoint: '/expenses/summary',
        method: 'GET',
        params
      }),
      { ttl: 30000 } // 30秒キャッシュ
    )
  }
  
  async getByCategory(categoryId: string): Promise<Expense[]> {
    const cacheKey = this.cacheKey('category', categoryId)
    
    return this.withCache(
      cacheKey,
      () => this.client.request<Expense[]>({
        endpoint: `/expenses/category/${categoryId}`,
        method: 'GET'
      }),
      { 
        ttl: 10000,
        transform: (data) => data.map(this.transformExpense)
      }
    )
  }
  
  private transformExpense(expense: any): Expense {
    return {
      ...expense,
      date: new Date(expense.date),
      createdAt: new Date(expense.createdAt),
      updatedAt: new Date(expense.updatedAt)
    }
  }
}
```

### ExpenseMockRepository

```typescript
// modules/expense/repositories/ExpenseMockRepository.ts

export class ExpenseMockRepository extends BaseRepository implements IExpenseRepository {
  // MockApiClientを使用するため、実装はApiRepositoryとほぼ同じ
  // 違いはコンストラクタでMockApiClientを受け取ること
  
  async list(params?: ExpenseListParams): Promise<PaginatedResponse<Expense>> {
    // MockApiClientがモックデータを返す
    return this.client.request<PaginatedResponse<Expense>>({
      endpoint: '/expenses',
      method: 'GET',
      params
    })
  }
  
  // 他のメソッドも同様...
}
```

### Mock Handler

```typescript
// shared/api/mock/handlers/expenses.ts

import { faker } from '@faker-js/faker'

// モックデータストア（メモリ内）
let mockExpenses: Expense[] = generateMockExpenses(50)

export default function expensesHandler(options: RequestOptions) {
  const { method, endpoint, params, body } = options
  
  switch (method) {
    case 'GET':
      if (endpoint.includes('/expenses/summary')) {
        return handleGetSummary(params)
      }
      if (endpoint.match(/\/expenses\/[^/]+$/)) {
        const id = endpoint.split('/').pop()!
        return handleGetById(id)
      }
      return handleList(params)
      
    case 'POST':
      if (endpoint.includes('/bulk')) {
        return handleBulkCreate(body)
      }
      return handleCreate(body)
      
    case 'PUT':
      const id = endpoint.split('/').pop()!
      return handleUpdate(id, body)
      
    case 'DELETE':
      const deleteId = endpoint.split('/').pop()!
      return handleDelete(deleteId)
      
    default:
      throw new ApiError({
        message: 'Method not allowed',
        statusCode: 405,
        code: 'METHOD_NOT_ALLOWED'
      })
  }
}

function handleList(params: any): PaginatedResponse<Expense> {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  
  // フィルタリング
  let filtered = [...mockExpenses]
  
  if (params?.categoryId) {
    filtered = filtered.filter(e => e.categoryId === params.categoryId)
  }
  
  if (params?.startDate) {
    const start = new Date(params.startDate)
    filtered = filtered.filter(e => e.date >= start)
  }
  
  if (params?.endDate) {
    const end = new Date(params.endDate)
    filtered = filtered.filter(e => e.date <= end)
  }
  
  // ソート
  if (params?.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[params.sortBy]
      const bVal = b[params.sortBy]
      const order = params.sortOrder === 'desc' ? -1 : 1
      return aVal > bVal ? order : -order
    })
  }
  
  const paginatedData = filtered.slice(startIndex, endIndex)
  
  return {
    data: paginatedData,
    total: filtered.length,
    page,
    pageSize,
    hasNext: endIndex < filtered.length,
    hasPrev: page > 1
  }
}

function handleGetById(id: string): Expense {
  const expense = mockExpenses.find(e => e.id === id)
  
  if (!expense) {
    throw new ApiError({
      message: 'Expense not found',
      statusCode: 404,
      code: 'NOT_FOUND'
    })
  }
  
  return expense
}

function handleCreate(data: CreateExpenseDto): Expense {
  const newExpense: Expense = {
    id: faker.string.uuid(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'current-user',
    updatedBy: 'current-user'
  }
  
  mockExpenses.unshift(newExpense)
  
  return newExpense
}

function handleUpdate(id: string, data: UpdateExpenseDto): Expense {
  const index = mockExpenses.findIndex(e => e.id === id)
  
  if (index === -1) {
    throw new ApiError({
      message: 'Expense not found',
      statusCode: 404,
      code: 'NOT_FOUND'
    })
  }
  
  mockExpenses[index] = {
    ...mockExpenses[index],
    ...data,
    updatedAt: new Date(),
    updatedBy: 'current-user'
  }
  
  return mockExpenses[index]
}

function handleDelete(id: string): void {
  const index = mockExpenses.findIndex(e => e.id === id)
  
  if (index === -1) {
    throw new ApiError({
      message: 'Expense not found',
      statusCode: 404,
      code: 'NOT_FOUND'
    })
  }
  
  mockExpenses.splice(index, 1)
}

function handleGetSummary(params: any): ExpenseSummary {
  // 集計ロジック
  const total = mockExpenses.reduce((sum, e) => sum + e.amount, 0)
  const count = mockExpenses.length
  const average = count > 0 ? total / count : 0
  
  return {
    total,
    count,
    average,
    byCategory: {},
    byMonth: {}
  }
}

function handleBulkCreate(body: any): Expense[] {
  const expenses = body.expenses as CreateExpenseDto[]
  
  const created = expenses.map(data => ({
    id: faker.string.uuid(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'current-user',
    updatedBy: 'current-user'
  }))
  
  mockExpenses.push(...created)
  
  return created
}

function generateMockExpenses(count: number): Expense[] {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    date: faker.date.recent({ days: 30 }),
    amount: faker.number.int({ min: 1000, max: 100000 }),
    categoryId: faker.helpers.arrayElement(['cat-1', 'cat-2', 'cat-3']),
    description: faker.commerce.productDescription(),
    memo: faker.lorem.sentence(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  }))
}
```

### useExpense Composable

```typescript
// modules/expense/composables/useExpense.ts

export const useExpense = () => {
  const client = useApiClient()
  const config = useRuntimeConfig()
  
  // Repository のインスタンス化（キャッシュ付き）
  const repository = useState<IExpenseRepository>(
    'expense-repository',
    () => {
      if (config.public.apiMode === 'mock') {
        return new ExpenseMockRepository(client)
      }
      return new ExpenseApiRepository(client)
    }
  )
  
  // リスト取得
  const list = (params?: ExpenseListParams) => {
    return useAsyncData(
      ['expenses', params],
      () => repository.value.list(params),
      {
        server: false,
        lazy: true
      }
    )
  }
  
  // 詳細取得
  const get = (id: string) => {
    return useAsyncData(
      `expense-${id}`,
      () => repository.value.get(id),
      {
        server: false,
        lazy: true
      }
    )
  }
  
  // 作成
  const create = async (data: CreateExpenseDto) => {
    const { $toast } = useNuxtApp()
    
    try {
      const result = await repository.value.create(data)
      $toast.success('経費を登録しました')
      
      // リストを再取得
      await refreshNuxtData('expenses')
      
      return result
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.isValidationError()) {
          $toast.error('入力内容に誤りがあります')
        } else {
          $toast.error('登録に失敗しました')
        }
      }
      throw error
    }
  }
  
  // 更新
  const update = async (id: string, data: UpdateExpenseDto) => {
    const { $toast } = useNuxtApp()
    
    try {
      const result = await repository.value.update(id, data)
      $toast.success('経費を更新しました')
      
      // 詳細とリストを再取得
      await Promise.all([
        refreshNuxtData(`expense-${id}`),
        refreshNuxtData('expenses')
      ])
      
      return result
    } catch (error) {
      if (error instanceof ApiError) {
        $toast.error('更新に失敗しました')
      }
      throw error
    }
  }
  
  // 削除
  const remove = async (id: string) => {
    const { $toast } = useNuxtApp()
    
    try {
      await repository.value.delete(id)
      $toast.success('経費を削除しました')
      
      // リストを再取得
      await refreshNuxtData('expenses')
    } catch (error) {
      if (error instanceof ApiError) {
        $toast.error('削除に失敗しました')
      }
      throw error
    }
  }
  
  // 一括作成
  const bulkCreate = async (data: CreateExpenseDto[]) => {
    const { $toast } = useNuxtApp()
    
    try {
      const result = await repository.value.bulkCreate(data)
      $toast.success(`${result.length}件の経費を登録しました`)
      
      await refreshNuxtData('expenses')
      
      return result
    } catch (error) {
      $toast.error('一括登録に失敗しました')
      throw error
    }
  }
  
  // サマリー取得
  const getSummary = (params: ExpenseSummaryParams) => {
    return useAsyncData(
      ['expense-summary', params],
      () => repository.value.getSummary(params),
      {
        server: false,
        lazy: true
      }
    )
  }
  
  return {
    list,
    get,
    create,
    update,
    remove,
    bulkCreate,
    getSummary
  }
}
```

## 環境設定

### 環境変数

```bash
# .env.frontend-only (モック環境)
NUXT_PUBLIC_API_MODE=mock
NUXT_PUBLIC_API_CACHE_ENABLED=true
NUXT_PUBLIC_API_TIMEOUT=30000
NUXT_PUBLIC_API_RETRY_COUNT=3

# .env.development (統合環境)
NUXT_PUBLIC_API_MODE=real
NUXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NUXT_PUBLIC_API_TIMEOUT=30000
NUXT_PUBLIC_API_RETRY_COUNT=3
NUXT_PUBLIC_API_CACHE_ENABLED=false

# .env.production (本番環境)
NUXT_PUBLIC_API_MODE=real
NUXT_PUBLIC_API_BASE_URL=https://api.astar-management.com/v1
NUXT_PUBLIC_API_TIMEOUT=15000
NUXT_PUBLIC_API_RETRY_COUNT=2
NUXT_PUBLIC_API_CACHE_ENABLED=true
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "dev:frontend": "nuxt dev --dotenv .env.frontend-only",
    "dev:integrated": "nuxt dev --dotenv .env.development",
    "build": "nuxt build",
    "build:production": "nuxt build --dotenv .env.production"
  }
}
```

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiMode: process.env.NUXT_PUBLIC_API_MODE || 'real',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
      apiTimeout: process.env.NUXT_PUBLIC_API_TIMEOUT || '30000',
      apiRetryCount: process.env.NUXT_PUBLIC_API_RETRY_COUNT || '3',
      apiCacheEnabled: process.env.NUXT_PUBLIC_API_CACHE_ENABLED || 'true'
    }
  }
})
```

## エラーハンドリング

### ApiError クラス

```typescript
// shared/api/core/ApiError.ts

export class ApiError extends Error {
  public readonly details: ApiErrorDetails
  
  constructor(details: ApiErrorDetails) {
    super(details.message)
    this.name = 'ApiError'
    this.details = details
    
    // スタックトレースを保持
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
  
  get statusCode(): number {
    return this.details.statusCode
  }
  
  get code(): string {
    return this.details.code
  }
  
  isAuthError(): boolean {
    return [401, 403].includes(this.statusCode)
  }
  
  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' || 
           this.code === 'TIMEOUT_ERROR' || 
           this.statusCode === 0
  }
  
  isValidationError(): boolean {
    return this.statusCode === 422 || 
           this.code === 'VALIDATION_ERROR'
  }
  
  isNotFoundError(): boolean {
    return this.statusCode === 404 || 
           this.code === 'NOT_FOUND'
  }
  
  isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600
  }
  
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500
  }
  
  getFieldErrors(): Record<string, string[]> | null {
    if (!this.isValidationError()) return null
    
    return this.details.details?.errors || null
  }
  
  toJSON(): ApiErrorDetails {
    return this.details
  }
}
```

### グローバルエラーハンドラー

```typescript
// plugins/error-handler.client.ts

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    if (error instanceof ApiError) {
      handleApiError(error)
    } else {
      console.error('Unhandled error:', error)
    }
  }
  
  // エラーハンドリング関数
  function handleApiError(error: ApiError) {
    const { $toast } = useNuxtApp()
    
    if (error.isNetworkError()) {
      $toast.error('ネットワークエラーが発生しました')
    } else if (error.isAuthError()) {
      $toast.error('認証が必要です')
      navigateTo('/signin')
    } else if (error.isValidationError()) {
      // フォームエラーは個別に処理
    } else if (error.isServerError()) {
      $toast.error('サーバーエラーが発生しました')
    }
  }
})
```

## テスト

### Repository テスト

```typescript
// modules/expense/repositories/__tests__/ExpenseRepository.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExpenseApiRepository } from '../ExpenseApiRepository'
import { MockApiClient } from '~/shared/api/clients/MockApiClient'

describe('ExpenseApiRepository', () => {
  let repository: ExpenseApiRepository
  let mockClient: MockApiClient
  
  beforeEach(() => {
    mockClient = new MockApiClient({
      mode: 'mock',
      baseUrl: 'http://localhost',
      timeout: 5000,
      retryCount: 1,
      cacheEnabled: false
    })
    
    repository = new ExpenseApiRepository(mockClient)
  })
  
  it('should list expenses', async () => {
    const result = await repository.list()
    
    expect(result).toBeDefined()
    expect(result.data).toBeInstanceOf(Array)
    expect(result.total).toBeGreaterThan(0)
  })
  
  it('should create expense', async () => {
    const data = {
      date: new Date(),
      amount: 10000,
      categoryId: 'cat-1',
      description: 'Test expense'
    }
    
    const result = await repository.create(data)
    
    expect(result).toBeDefined()
    expect(result.id).toBeDefined()
    expect(result.amount).toBe(data.amount)
  })
  
  it('should handle errors', async () => {
    // 不正なIDでエラーを発生させる
    await expect(
      repository.get('invalid-id')
    ).rejects.toThrow(ApiError)
  })
})
```

## ベストプラクティス

### 1. 型安全性の確保

- すべてのAPIレスポンスに型定義を作成
- `any`型の使用を禁止
- Zodによるランタイム検証の追加を検討

### 2. エラーハンドリング

- ApiErrorクラスを使用した統一的なエラー処理
- ユーザーフレンドリーなエラーメッセージ
- 開発環境では詳細なエラー情報を表示

### 3. パフォーマンス最適化

- 適切なキャッシュ戦略
- 並列リクエストの活用
- 不要なリクエストの削減

### 4. セキュリティ

- トークンの安全な管理
- XSS対策
- CORS設定の適切な管理

### 5. テスタビリティ

- Repositoryパターンによるテストの容易化
- モックデータの充実
- E2Eテストでのモック/実APIの切り替え

## 移行ガイド

### Phase 1: 基盤の構築（1週間）

1. API Client基盤の実装
2. エラーハンドリングの実装
3. 環境設定の整備

### Phase 2: モジュール移行（2-3週間）

1. 1つのモジュール（例：Expense）で実装
2. テストの作成
3. 既存コードからの移行

### Phase 3: 全体展開（3-4週間）

1. 他のモジュールへの展開
2. 共通パターンの抽出
3. ドキュメントの更新

### 移行チェックリスト

- [ ] BaseApiClient, MockApiClient, RealApiClientの実装
- [ ] BaseRepositoryの実装
- [ ] ApiErrorクラスの実装
- [ ] 環境変数の設定
- [ ] 最初のRepositoryの実装
- [ ] Composableの更新
- [ ] テストの作成
- [ ] 既存APIコールの置き換え
- [ ] エラーハンドリングの統一
- [ ] キャッシュ戦略の適用

## トラブルシューティング

### よくある問題と解決方法

#### 1. モックデータが見つからない

```
Error: Mock handler not found for: expenses
```

**解決方法**: 
- `shared/api/mock/handlers/`にハンドラーファイルが存在するか確認
- ファイル名とエンドポイント名が一致しているか確認

#### 2. キャッシュが更新されない

**解決方法**:
- `clearNuxtData()`でキャッシュをクリア
- TTL設定を確認
- `forceRefresh: true`オプションを使用

#### 3. 認証エラーが発生する

**解決方法**:
- トークンが正しく設定されているか確認
- `useAuthStore()`が正しく動作しているか確認
- CORSヘッダーを確認

## 関連ドキュメント

- [Frontend API Client Design](../../20-architecture/frontend/API_CLIENT_DESIGN.md)
- [Frontend Architecture](../../20-architecture/frontend/FRONTEND_ARCHITECTURE.md)
- [API Configuration](../../../frontend/app/foundation/config/apiConfig.ts)