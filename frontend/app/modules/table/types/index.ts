/**
 * Table Module Type Definitions
 * ドメイン固有の型定義とインターフェース
 */

// OpenAPI型は中央集約型からインポート
import type {
  TableResponse,
  TableCreateRequest,
  TableUpdateRequest,
  TableListResponse,
  RecordResponse,
  RecordCreateRequest,
  RecordUpdateRequest,
  RecordListResponse,
  PropertyDefinitionDto,
  PropertyAddRequest,
  PropertyUpdateRequest
} from '~/types'

// OpenAPI型を再エクスポート（互換性のため）
export type {
  TableResponse,
  TableCreateRequest,
  TableUpdateRequest,
  TableListResponse,
  RecordResponse,
  RecordCreateRequest,
  RecordUpdateRequest,
  RecordListResponse,
  PropertyDefinitionDto,
  PropertyAddRequest,
  PropertyUpdateRequest
}

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

// ビュー設定の型定義 (Zodスキーマから自動推論)
export type { 
  DefaultViewSettings, 
  ViewPreferences,
  TableSettings,
  SavedView,
  FilterCondition,
  FilterGroup,
  ColumnWidth,
  Density,
  SortOrder
} from '../ui-types/settings'

// Repository インターフェース
export interface TableRepository {
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
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: Record<string, unknown>
}

// Pinning機能の型をエクスポート
export * from './pinning'

// Inline editing機能の型をエクスポート
export * from './inline-editing'

// RecordListコンポーネントのプロパティ型
export interface RecordListProps {
  // 必須プロパティ
  tableId: string
  properties: Record<string, PropertyDefinitionDto>
  
  // オプション：固定機能
  enablePinning?: boolean
  initialPinning?: {
    columns?: { left?: string[], right?: string[] }
    rows?: { top?: string[], bottom?: string[] }
  }
  
  // イベントハンドラー
  onUpdateRecordCount?: (count: number) => void
}