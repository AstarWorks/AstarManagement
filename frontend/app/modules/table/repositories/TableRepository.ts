/**
 * TableRepository
 * 薄いプロキシとして実装、将来の拡張に備える
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

export class TableRepository implements ITableRepository {
  private api = useApi()
  
  // ===========================
  // Table Operations
  // ===========================
  
  async listTables(workspaceId: string): Promise<TableListResponse> {
    const { data, error } = await this.api.GET('/api/v1/tables/workspace/{workspaceId}', {
      params: { path: { workspaceId } }
    })
    if (error) throw error
    return data as TableListResponse
  }
  
  async getTable(id: string): Promise<TableResponse> {
    const { data, error } = await this.api.GET('/api/v1/tables/{id}', {
      params: { path: { id } }
    })
    if (error) throw error
    return data as TableResponse
  }
  
  async createTable(tableData: TableCreateRequest): Promise<TableResponse> {
    const { data, error } = await this.api.POST('/api/v1/tables', {
      body: tableData
    })
    if (error) throw error
    return data as TableResponse
  }
  
  async updateTable(id: string, updates: TableUpdateRequest): Promise<TableResponse> {
    const { data, error } = await this.api.PUT('/api/v1/tables/{id}', {
      params: { path: { id } },
      body: updates
    })
    if (error) throw error
    return data as TableResponse
  }
  
  async deleteTable(id: string): Promise<void> {
    const { error } = await this.api.DELETE('/api/v1/tables/{id}', {
      params: { path: { id } }
    })
    if (error) throw error
  }
  
  // ===========================
  // Property Operations
  // ===========================
  
  async addProperty(tableId: string, property: PropertyAddRequest): Promise<TableResponse> {
    const { data, error } = await this.api.POST('/api/v1/tables/{id}/properties', {
      params: { path: { id: tableId } },
      body: property
    })
    if (error) throw error
    return data as TableResponse
  }
  
  async updateProperty(
    tableId: string, 
    propertyKey: string, 
    propertyData: PropertyUpdateRequest
  ): Promise<TableResponse> {
    const { data, error } = await this.api.PUT('/api/v1/tables/{id}/properties/{key}', {
      params: { path: { id: tableId, key: propertyKey } },
      body: propertyData
    })
    if (error) throw error
    return data as TableResponse
  }
  
  async removeProperty(tableId: string, propertyKey: string): Promise<TableResponse> {
    const { data, error } = await this.api.DELETE('/api/v1/tables/{id}/properties/{key}', {
      params: { path: { id: tableId, key: propertyKey } }
    })
    if (error) throw error
    return data as TableResponse
  }
  
  // ===========================
  // Record Operations
  // ===========================
  
  async listRecords(tableId: string, params?: RecordListParams): Promise<RecordListResponse> {
    const { data, error } = await this.api.GET('/api/v1/records/table/{tableId}', {
      params: { 
        path: { tableId },
        query: params
      }
    })
    if (error) throw error
    return this.transformPageResponse(data, tableId)
  }
  
  async getRecord(id: string): Promise<RecordResponse> {
    const { data, error } = await this.api.GET('/api/v1/records/{id}', {
      params: { path: { id } }
    })
    if (error) throw error
    return data as RecordResponse
  }
  
  async createRecord(recordData: RecordCreateRequest): Promise<RecordResponse> {
    const { data, error } = await this.api.POST('/api/v1/records', {
      body: recordData
    })
    if (error) throw error
    return data as RecordResponse
  }
  
  async updateRecord(id: string, updates: RecordUpdateRequest): Promise<RecordResponse> {
    const { data, error } = await this.api.PUT('/api/v1/records/{id}', {
      params: { path: { id } },
      body: updates
    })
    if (error) throw error
    return data as RecordResponse
  }
  
  async deleteRecord(id: string): Promise<void> {
    const { error } = await this.api.DELETE('/api/v1/records/{id}', {
      params: { path: { id } }
    })
    if (error) throw error
  }
  
  // ===========================
  // Batch Operations
  // ===========================
  
  async createRecordsBatch(records: RecordCreateRequest[]): Promise<RecordResponse[]> {
  const { data, error } = await this.api.POST('/api/v1/records/batch', {
    body: { 
      tableId: records[0]?.tableId || '',
      records: records.map(r => r.data),
      batchSize: records.length,
      isWithinSizeLimit: records.length <= 100
    }
  })
  if (error) throw error
  // Check if data is a page response and extract records
  if (data && typeof data === 'object' && 'records' in data) {
    return ((data as Record<string, unknown>).records as RecordResponse[]) || []
  }
  return (data as RecordResponse[]) || []
}
  
  async updateRecordsBatch(
  updates: Array<{ id: string; data: RecordUpdateRequest }>
): Promise<RecordResponse[]> {
  const updateMap = updates.reduce((acc, update) => {
    acc[update.id] = update.data
    return acc
  }, {} as { [key: string]: { [key: string]: unknown } })
  
  const { data, error } = await this.api.PUT('/api/v1/records/batch', {
    body: {
      updates: updateMap,
      merge: true,
      batchSize: updates.length,
      recordIds: updates.map(u => u.id)
    }
  })
  if (error) throw error
  // Check if data is a page response and extract records
  if (data && typeof data === 'object' && 'records' in data) {
    return ((data as Record<string, unknown>).records as RecordResponse[]) || []
  }
  return (data as RecordResponse[]) || []
}
  
  async deleteRecordsBatch(recordIds: string[]): Promise<void> {
    const { error } = await this.api.DELETE('/api/v1/records/batch', {
      body: { recordIds, batchSize: recordIds.length }
    })
    if (error) throw error
  }
  
  // Helper method to transform Spring Boot Page response to RecordListResponse
  private transformPageResponse(springPageResponse: Record<string, unknown>, tableId?: string): RecordListResponse {
    return {
      records: (springPageResponse.content as RecordResponse[]) || [],
      totalCount: (springPageResponse.totalElements as number) || 0,
      tableId
    }
  }
}