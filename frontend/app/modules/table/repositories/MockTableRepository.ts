/**
 * MockTableRepository
 * 開発・テスト用のモック実装（静的データ使用）
 */

import type {
  TableRepository,
  TableResponse,
  TableCreateRequest,
  TableUpdateRequest,
  TableListResponse,
  RecordResponse,
  RecordCreateRequest,
  RecordUpdateRequest,
  RecordListResponse,
  RecordListParams,
  PropertyAddRequest,
  PropertyUpdateRequest
} from '../types'
// OpenAPIから自動生成されたZodスキーマを使用
import { schemas } from '~/shared/api/zod-client'
import { 
  MOCK_WORKSPACE_IDS, 
  getTableId, 
  getRecordId 
} from '~/modules/mock/constants/mockIds'
import { generateSampleTables, generateRecords } from '../utils/mockDataGenerator'
import { generateLegalExpenseRecords } from '../scenarios/legalOfficeExpenses'

const {
  TableResponse: TableResponseSchema,
  RecordResponse: RecordResponseSchema,
  TableListResponse: TableListResponseSchema,
  RecordListResponse: RecordListResponseSchema
} = schemas

export class MockTableRepository implements TableRepository {
  private tables: Map<string, TableResponse> = new Map()
  private records: Map<string, RecordResponse[]> = new Map()
  private initialized = false

  constructor() {
    this.initialize()
  }

  /**
   * データストアの初期化（静的データで初期化）
   */
  private initialize(): void {
    if (this.initialized) return

    // ワークスペースごとにテーブルを生成（固定UUIDを使用）
    const workspaceConfigs = [
      { workspaceId: MOCK_WORKSPACE_IDS.LEGAL_1, scenario: 'legal' as const },
      { workspaceId: MOCK_WORKSPACE_IDS.LEGAL_2, scenario: 'legal' as const }
    ]

    workspaceConfigs.forEach(({ workspaceId, scenario }) => {
      // 各ワークスペース用のテーブルを生成
      const tables = generateSampleTables(workspaceId)
      
      tables.forEach(table => {
        // 固定UUID形式のテーブルIDを生成
        const uniqueId = getTableId(workspaceId, table.name ?? 'default-table')
        const tableWithUniqueId = { 
          ...table, 
          id: uniqueId,
          workspaceId 
        }
        
        // Zodでバリデーション
        const validated = TableResponseSchema.parse(tableWithUniqueId)
        this.tables.set(uniqueId, validated)
        
        // レコードも生成
        if (validated.properties) {
          const recordCount = scenario === 'legal' ? 30 : scenario === 'tech' ? 50 : 20
          
          // 法律事務所の経費テーブルの場合は専用のレコード生成を使用
          let records: RecordResponse[]
          if (scenario === 'legal' && table.id === 'table-legal-expenses') {
            records = generateLegalExpenseRecords(uniqueId, recordCount)
          } else {
            records = generateRecords(uniqueId, validated.properties, recordCount)
          }
          
          this.records.set(uniqueId, records)
        }
      })
    })

    this.initialized = true
    console.log('[MockTableRepository] Initialized with static data')
  }

  /**
   * ネットワーク遅延のシミュレーション
   */
  private async delay(ms: number = 200): Promise<void> {
    const variance = 100
    const actualDelay = ms + Math.random() * variance - variance / 2
    await new Promise(resolve => setTimeout(resolve, actualDelay))
  }

  /**
   * フィルタリング処理
   */
  private applyFilters(records: RecordResponse[], filters: Record<string, unknown>): RecordResponse[] {
    if (!filters || Object.keys(filters).length === 0) {
      return records
    }

    return records.filter(record => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (filterValue === null || filterValue === undefined || filterValue === '') {
          return true
        }

        const recordValue = record.data?.[key]
        
        // 配列の場合（multiselect等）
        if (Array.isArray(filterValue)) {
          if (Array.isArray(recordValue)) {
            return filterValue.some(v => recordValue.includes(v))
          }
          return filterValue.includes(recordValue)
        }

        // 文字列の場合（部分一致）
        if (typeof filterValue === 'string' && typeof recordValue === 'string') {
          return recordValue.toLowerCase().includes(filterValue.toLowerCase())
        }

        // その他（完全一致）
        return recordValue === filterValue
      })
    })
  }

  // ===== Table Operations =====

  async listTables(workspaceId: string): Promise<TableListResponse> {
    console.log('[MockTableRepository] listTables called with:', workspaceId)
    await this.delay()
    
    const tables = Array.from(this.tables.values())
      .filter(t => t.workspaceId === workspaceId)
    
    console.log('[MockTableRepository] Found tables:', tables.length, 'for workspace:', workspaceId)
    
    return TableListResponseSchema.parse({
      tables,
      totalCount: tables.length
    })
  }

  async getTable(id: string): Promise<TableResponse> {
    await this.delay()
    
    const table = this.tables.get(id)
    if (!table) {
      throw new Error(`Table not found: ${id}`)
    }
    
    return TableResponseSchema.parse(table)
  }

  async createTable(data: TableCreateRequest): Promise<TableResponse> {
    await this.delay()
    
    const id = getTableId(data.workspaceId, data.name)
    const now = new Date().toISOString()
    
    const properties: TableResponse['properties'] = {}
    if (data.properties) {
      data.properties.forEach(prop => {
        properties[prop.key] = prop
      })
    }
    
    const newTable: TableResponse = {
      id,
      workspaceId: data.workspaceId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      properties,
      propertyOrder: data.properties?.map(p => p.key),
      createdAt: now,
      updatedAt: now
    }
    
    const validated = TableResponseSchema.parse(newTable)
    this.tables.set(id, validated)
    this.records.set(id, [])
    
    return validated
  }

  async updateTable(id: string, data: TableUpdateRequest): Promise<TableResponse> {
    await this.delay()
    
    const table = this.tables.get(id)
    if (!table) {
      throw new Error(`Table not found: ${id}`)
    }
    
    const updated = {
      ...table,
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    const validated = TableResponseSchema.parse(updated)
    this.tables.set(id, validated)
    
    return validated
  }

  async deleteTable(id: string): Promise<void> {
    await this.delay()
    
    if (!this.tables.has(id)) {
      throw new Error(`Table not found: ${id}`)
    }
    
    this.tables.delete(id)
    this.records.delete(id)
  }

  // ===== Property Operations =====

  async addProperty(tableId: string, property: PropertyAddRequest): Promise<TableResponse> {
    await this.delay()
    
    const table = this.tables.get(tableId)
    if (!table) {
      throw new Error(`Table not found: ${tableId}`)
    }
    
    const key = property.definition.key
    const updatedProperties = {
      ...table.properties,
      [key]: {
        key,
        type: property.definition.type,
        displayName: property.definition.displayName,
        required: property.definition.required,
        config: property.definition.config
      }
    }
    
    const updatedOrder = [...(table.propertyOrder || [])]
    // PropertyAddRequestには position があるが afterKey はない
    // positionが指定されていればその位置に挿入
    if (property.position !== undefined && property.position >= 0 && property.position <= updatedOrder.length) {
      updatedOrder.splice(property.position, 0, key)
    } else {
      updatedOrder.push(key)
    }
    
    const updated = {
      ...table,
      properties: updatedProperties,
      propertyOrder: updatedOrder,
      updatedAt: new Date().toISOString()
    }
    
    const validated = TableResponseSchema.parse(updated)
    this.tables.set(tableId, validated)
    
    return validated
  }

  async updateProperty(tableId: string, key: string, data: PropertyUpdateRequest): Promise<TableResponse> {
    await this.delay()
    
    const table = this.tables.get(tableId)
    if (!table) {
      throw new Error(`Table not found: ${tableId}`)
    }
    
    const property = table.properties?.[key]
    if (!property) {
      throw new Error(`Property not found: ${key}`)
    }
    
    const updatedProperties = {
      ...table.properties,
      [key]: {
        ...property,
        ...data
      }
    }
    
    const updated = {
      ...table,
      properties: updatedProperties,
      updatedAt: new Date().toISOString()
    }
    
    const validated = TableResponseSchema.parse(updated)
    this.tables.set(tableId, validated)
    
    return validated
  }

  async removeProperty(tableId: string, key: string): Promise<TableResponse> {
    await this.delay()
    
    const table = this.tables.get(tableId)
    if (!table) {
      throw new Error(`Table not found: ${tableId}`)
    }
    
    const properties = table.properties || {}
    const { [key]: _removed, ...remainingProperties } = properties
    const updatedOrder = table.propertyOrder?.filter(k => k !== key)
    
    const updated = {
      ...table,
      properties: remainingProperties,
      propertyOrder: updatedOrder,
      updatedAt: new Date().toISOString()
    }
    
    const validated = TableResponseSchema.parse(updated)
    this.tables.set(tableId, validated)
    
    return validated
  }

  // ===== Record Operations =====

  async listRecords(tableId: string, params?: RecordListParams): Promise<RecordListResponse> {
    await this.delay()
    
    let records = this.records.get(tableId) || []
    
    // フィルタリング
    if (params?.filter) {
      records = this.applyFilters(records, params.filter)
    }
    
    // ソート
    if (params?.sortBy) {
      records = [...records].sort((a, b) => {
        const aVal = (a.data?.[params.sortBy!] ?? '') as string | number
        const bVal = (b.data?.[params.sortBy!] ?? '') as string | number
        
        if (aVal < bVal) return params.sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return params.sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }
    
    // ページネーション
    const limit = params?.limit || 100
    const offset = params?.offset || 0
    const paginatedRecords = records.slice(offset, offset + limit)
    
    return RecordListResponseSchema.parse({
      records: paginatedRecords,
      totalCount: records.length,
      hasMore: offset + limit < records.length
    })
  }

  async getRecord(id: string): Promise<RecordResponse> {
    await this.delay()
    
    for (const records of this.records.values()) {
      const record = records.find(r => r.id === id)
      if (record) {
        return RecordResponseSchema.parse(record)
      }
    }
    
    throw new Error(`Record not found: ${id}`)
  }

  async createRecord(data: RecordCreateRequest): Promise<RecordResponse> {
    await this.delay()
    
    const records = this.records.get(data.tableId) || []
    const id = getRecordId(data.tableId, records.length)
    const now = new Date().toISOString()
    
    const newRecord: RecordResponse = {
      id,
      tableId: data.tableId,
      data: data.data,
      createdAt: now,
      updatedAt: now
    }
    
    const validated = RecordResponseSchema.parse(newRecord)
    records.push(validated)
    this.records.set(data.tableId, records)
    
    return validated
  }

  async updateRecord(id: string, data: RecordUpdateRequest): Promise<RecordResponse> {
    await this.delay()
    
    for (const [tableId, records] of this.records.entries()) {
      const index = records.findIndex(r => r.id === id)
      if (index !== -1) {
        const updated = {
          ...records[index],
          data: { ...records[index]?.data, ...data.data },
          updatedAt: new Date().toISOString()
        }
        
        const validated = RecordResponseSchema.parse(updated)
        records[index] = validated
        this.records.set(tableId, records)
        
        return validated
      }
    }
    
    throw new Error(`Record not found: ${id}`)
  }

  async deleteRecord(id: string): Promise<void> {
    await this.delay()
    
    for (const [tableId, records] of this.records.entries()) {
      const index = records.findIndex(r => r.id === id)
      if (index !== -1) {
        records.splice(index, 1)
        this.records.set(tableId, records)
        return
      }
    }
    
    throw new Error(`Record not found: ${id}`)
  }

  // ===== Batch Operations =====

  async createRecordsBatch(records: RecordCreateRequest[]): Promise<RecordResponse[]> {
    await this.delay(500)
    
    const results: RecordResponse[] = []
    
    for (const record of records) {
      const result = await this.createRecord(record)
      results.push(result)
    }
    
    return results
  }

  async updateRecordsBatch(updates: Array<{ id: string; data: RecordUpdateRequest }>): Promise<RecordResponse[]> {
    await this.delay(500)
    
    const results: RecordResponse[] = []
    
    for (const update of updates) {
      const result = await this.updateRecord(update.id, update.data)
      results.push(result)
    }
    
    return results
  }

  async deleteRecordsBatch(ids: string[]): Promise<void> {
    await this.delay(500)
    
    for (const id of ids) {
      await this.deleteRecord(id)
    }
  }

  // Reset mock data to initial state
  resetMockData(): void {
    this.tables.clear()
    this.records.clear()
    this.initialized = false
    this.initialize()
  }

  // Get data statistics
  getDataStats(): { tables: number; records: number } {
    return {
      tables: this.tables.size,
      records: this.records.size
    }
  }
}