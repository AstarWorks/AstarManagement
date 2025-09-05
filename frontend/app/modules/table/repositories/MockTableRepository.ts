/**
 * MockTableRepository
 * 開発・テスト用のモック実装
 */

import type {
  ITableRepository,
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

// モックデータ
const mockTables: TableResponse[] = [
  {
    id: '1',
    workspaceId: 'workspace-1',
    name: 'タスク管理',
    description: 'プロジェクトのタスク管理テーブル',
    properties: {},
    propertyOrder: ['title', 'status', 'assignee', 'dueDate'],
    icon: '📋',
    color: '#3B82F6',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    orderedProperties: [
      {
        key: 'title',
        typeId: 'text',
        displayName: 'タイトル',
        config: {},
        required: true
      },
      {
        key: 'status',
        typeId: 'select',
        displayName: 'ステータス',
        config: { options: ['未着手', '進行中', '完了'] },
        required: true
      }
    ]
  }
]

const mockRecords: RecordResponse[] = [
  {
    id: 'record-1',
    tableId: '1',
    data: {
      title: 'API設計',
      status: '進行中',
      assignee: 'user-1',
      dueDate: '2024-12-31'
    },
    position: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

export class MockTableRepository implements ITableRepository {
  
  // Simulate network delay
  private async delay(ms: number = 200): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // ===========================
  // Table Operations
  // ===========================
  
  async listTables(workspaceId: string): Promise<TableListResponse> {
    await this.delay()
    const tables = mockTables.filter(t => t.workspaceId === workspaceId)
    return {
      tables,
      totalCount: tables.length
    } as TableListResponse
  }
  
  async getTable(id: string): Promise<TableResponse> {
    await this.delay()
    const table = mockTables.find(t => t.id === id)
    if (!table) throw new Error(`Table ${id} not found`)
    return table
  }
  
  async createTable(data: TableCreateRequest): Promise<TableResponse> {
    await this.delay()
    const newTable: TableResponse = {
      id: `table-${Date.now()}`,
      workspaceId: data.workspaceId,
      name: data.name,
      description: data.description,
      properties: {},
      propertyOrder: [],
      icon: data.icon,
      color: data.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderedProperties: data.properties || []
    }
    mockTables.push(newTable)
    return newTable
  }
  
  async updateTable(id: string, data: TableUpdateRequest): Promise<TableResponse> {
    await this.delay()
    const index = mockTables.findIndex(t => t.id === id)
    if (index === -1) throw new Error(`Table ${id} not found`)
    
    const existingTable = mockTables[index]
    if (!existingTable) throw new Error(`Table ${id} not found`)
    
    const updatedTable: TableResponse = {
      ...existingTable,
      ...data,
      id: existingTable.id, // 必須プロパティを明示的に保持
      workspaceId: existingTable.workspaceId,
      name: data.name ?? existingTable.name,
      properties: existingTable.properties,
      propertyOrder: existingTable.propertyOrder,
      orderedProperties: existingTable.orderedProperties,
      createdAt: existingTable.createdAt, // createdAt も必須
      updatedAt: new Date().toISOString()
    }
    mockTables[index] = updatedTable
    return updatedTable
  }
  
  async deleteTable(id: string): Promise<void> {
    await this.delay()
    const index = mockTables.findIndex(t => t.id === id)
    if (index === -1) throw new Error(`Table ${id} not found`)
    mockTables.splice(index, 1)
  }
  
  // ===========================
  // Property Operations
  // ===========================
  
  async addProperty(tableId: string, property: PropertyAddRequest): Promise<TableResponse> {
    await this.delay()
    const table = mockTables.find(t => t.id === tableId)
    if (!table) throw new Error(`Table ${tableId} not found`)
    
    table.orderedProperties.push(property.definition)
    table.propertyOrder.push(property.definition.key)
    table.updatedAt = new Date().toISOString()
    
    return table
  }
  
  async updateProperty(
    tableId: string,
    propertyKey: string,
    data: PropertyUpdateRequest
  ): Promise<TableResponse> {
    await this.delay()
    const table = mockTables.find(t => t.id === tableId)
    if (!table) throw new Error(`Table ${tableId} not found`)
    
    const propIndex = table.orderedProperties.findIndex(p => p.key === propertyKey)
    if (propIndex === -1) throw new Error(`Property ${propertyKey} not found`)
    
    const existingProperty = table.orderedProperties[propIndex]
    if (!existingProperty) throw new Error(`Property ${propertyKey} not found in ordered properties`)
    
    table.orderedProperties[propIndex] = {
      key: existingProperty.key,
      typeId: existingProperty.typeId,
      displayName: data.displayName ?? existingProperty.displayName,
      config: { ...existingProperty.config, ...(data.config || {}) },
      required: data.required ?? existingProperty.required,
      defaultValue: data.defaultValue ?? existingProperty.defaultValue,
      description: data.description ?? existingProperty.description
    }
    table.updatedAt = new Date().toISOString()
    
    return table
  }
  
  async removeProperty(tableId: string, propertyKey: string): Promise<TableResponse> {
    await this.delay()
    const table = mockTables.find(t => t.id === tableId)
    if (!table) throw new Error(`Table ${tableId} not found`)
    
    table.orderedProperties = table.orderedProperties.filter(p => p.key !== propertyKey)
    table.propertyOrder = table.propertyOrder.filter(key => key !== propertyKey)
    table.updatedAt = new Date().toISOString()
    
    return table
  }
  
  // ===========================
  // Record Operations
  // ===========================
  
  async listRecords(tableId: string, params?: RecordListParams): Promise<RecordListResponse> {
    await this.delay()
    const records = mockRecords.filter(r => r.tableId === tableId)
    
    // Apply pagination
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const start = (page - 1) * pageSize
    const paginatedRecords = records.slice(start, start + pageSize)
    
    return {
      records: paginatedRecords,
      totalCount: records.length,
      tableId
    }
  }
  
  async getRecord(id: string): Promise<RecordResponse> {
    await this.delay()
    const record = mockRecords.find(r => r.id === id)
    if (!record) throw new Error(`Record ${id} not found`)
    return record
  }
  
  async createRecord(data: RecordCreateRequest): Promise<RecordResponse> {
    await this.delay()
    const newRecord: RecordResponse = {
      id: `record-${Date.now()}`,
      tableId: data.tableId,
      data: data.data,
      position: mockRecords.filter(r => r.tableId === data.tableId).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockRecords.push(newRecord)
    return newRecord
  }
  
  async updateRecord(id: string, data: RecordUpdateRequest): Promise<RecordResponse> {
    await this.delay()
    const index = mockRecords.findIndex(r => r.id === id)
    if (index === -1) throw new Error(`Record ${id} not found`)
    
    const existingRecord = mockRecords[index]
    if (!existingRecord) throw new Error(`Record ${id} not found`)
    
    const updatedRecord: RecordResponse = {
      ...existingRecord,
      data: { ...existingRecord.data, ...data.data },
      id: existingRecord.id,
      tableId: existingRecord.tableId,
      position: existingRecord.position,
      createdAt: existingRecord.createdAt,
      updatedAt: new Date().toISOString()
    }
    mockRecords[index] = updatedRecord
    return updatedRecord
  }
  
  async deleteRecord(id: string): Promise<void> {
    await this.delay()
    const index = mockRecords.findIndex(r => r.id === id)
    if (index === -1) throw new Error(`Record ${id} not found`)
    mockRecords.splice(index, 1)
  }
  
  // ===========================
  // Batch Operations
  // ===========================
  
  async createRecordsBatch(records: RecordCreateRequest[]): Promise<RecordResponse[]> {
    await this.delay(300)
    const created: RecordResponse[] = []
    
    for (const record of records) {
      const newRecord = await this.createRecord(record)
      created.push(newRecord)
    }
    
    return created
  }
  
  async updateRecordsBatch(
    updates: Array<{ id: string; data: RecordUpdateRequest }>
  ): Promise<RecordResponse[]> {
    await this.delay(300)
    const updated: RecordResponse[] = []
    
    for (const update of updates) {
      const record = await this.updateRecord(update.id, update.data)
      updated.push(record)
    }
    
    return updated
  }
  
  async deleteRecordsBatch(ids: string[]): Promise<void> {
    await this.delay(300)
    for (const id of ids) {
      await this.deleteRecord(id)
    }
  }
}