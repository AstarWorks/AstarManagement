/**
 * Table Module Type Definitions
 * ドメイン固有の型定義とインターフェース
 */

import type { components } from '~/types/api'

// OpenAPI生成型のエイリアス
export type TableResponse = components['schemas']['TableResponse']
export type TableCreateRequest = components['schemas']['TableCreateRequest']
export type TableUpdateRequest = components['schemas']['TableUpdateRequest']
export type TableListResponse = components['schemas']['TableListResponse']

export type RecordResponse = components['schemas']['RecordResponse']
export type RecordCreateRequest = components['schemas']['RecordCreateRequest']
export type RecordUpdateRequest = components['schemas']['RecordUpdateRequest']
export type RecordListResponse = components['schemas']['RecordListResponse']

export type PropertyDefinitionDto = components['schemas']['PropertyDefinitionDto']
export type PropertyAddRequest = components['schemas']['PropertyAddRequest']
export type PropertyUpdateRequest = components['schemas']['PropertyUpdateRequest']

// ドメイン固有の拡張型
export interface TableWithRecords extends TableResponse {
  records: RecordResponse[]
  recordCount: number
}

export interface TableWithStats extends TableResponse {
  stats: {
    totalRecords: number
    createdToday: number
    updatedToday: number
    activeUsers: number
  }
}

// Repository インターフェース
export interface ITableRepository {
  // Table operations
  listTables(workspaceId: string): Promise<TableListResponse>
  getTable(id: string): Promise<TableResponse>
  createTable(data: TableCreateRequest): Promise<TableResponse>
  updateTable(id: string, data: TableUpdateRequest): Promise<TableResponse>
  deleteTable(id: string): Promise<void>
  
  // Property operations
  addProperty(tableId: string, property: PropertyAddRequest): Promise<TableResponse>
  updateProperty(tableId: string, propertyKey: string, data: PropertyUpdateRequest): Promise<TableResponse>
  removeProperty(tableId: string, propertyKey: string): Promise<TableResponse>
  
  // Record operations
  listRecords(tableId: string, params?: RecordListParams): Promise<RecordListResponse>
  getRecord(id: string): Promise<RecordResponse>
  createRecord(data: RecordCreateRequest): Promise<RecordResponse>
  updateRecord(id: string, data: RecordUpdateRequest): Promise<RecordResponse>
  deleteRecord(id: string): Promise<void>
  
  // Batch operations
  createRecordsBatch(records: RecordCreateRequest[]): Promise<RecordResponse[]>
  updateRecordsBatch(updates: Array<{ id: string; data: RecordUpdateRequest }>): Promise<RecordResponse[]>
  deleteRecordsBatch(ids: string[]): Promise<void>
}

// パラメータ型
export interface RecordListParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: Record<string, unknown>
}