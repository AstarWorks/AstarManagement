/**
 * API Client Type Definitions
 * Provides core type definitions for the API client infrastructure
 */

export interface IRequestOptions {
    endpoint: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    params?: Record<string, unknown>
    body?: unknown
    headers?: Record<string, string>
    retryCount?: number
    timeout?: number
}

export interface IApiConfig {
    mode: 'mock' | 'real'
    baseUrl: string
    timeout: number
    retryCount: number
    headers?: Record<string, string>
    cacheEnabled: boolean
    mockDelay?: number
    mockDelayVariance?: number
}

export interface IPaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    hasNext: boolean
    hasPrev: boolean
}

export interface IApiErrorDetails {
    message: string
    statusCode: number
    code: string
    details?: unknown
    timestamp?: string
    path?: string
}

export interface ICacheOptions {
    lazy?: boolean
    ttl?: number
    forceRefresh?: boolean
    transform?: (data: unknown) => unknown
}

export type MockHandler = (options: IRequestOptions) => unknown | Promise<unknown>

export interface IRepository<T> {
    list(params?: Record<string, unknown>): Promise<IPaginatedResponse<T>>

    get(id: string): Promise<T>

    create(data: Partial<T>): Promise<T>

    update(id: string, data: Partial<T>): Promise<T>

    delete(id: string): Promise<void>
}