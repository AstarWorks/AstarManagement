# テーブル機能 - 状態管理

## Composables構成

テーブル機能はComposablesパターンで状態管理を行います。

## 主要Composables

### useTableList
テーブル一覧の状態管理

```typescript
// composables/useTableList.ts
export function useTableList(workspaceId: Ref<string>) {
  const tables = ref<Table[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const searchQuery = ref('')
  const viewMode = ref<'grid' | 'table'>('grid')
  const selectedTables = ref<Set<string>>(new Set())
  
  // テーブル一覧取得
  async function fetchTables() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch(`/api/v1/workspaces/${workspaceId.value}/tables`)
      tables.value = response.tables
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }
  
  // テーブル作成
  async function createTable(data: CreateTableDto) {
    const response = await $fetch(`/api/v1/workspaces/${workspaceId.value}/tables`, {
      method: 'POST',
      body: data
    })
    tables.value.push(response)
    return response
  }
  
  // テーブル削除
  async function deleteTable(tableId: string) {
    await $fetch(`/api/v1/tables/${tableId}`, {
      method: 'DELETE'
    })
    tables.value = tables.value.filter(t => t.id !== tableId)
  }
  
  // フィルタリング
  const filteredTables = computed(() => {
    if (!searchQuery.value) return tables.value
    
    const query = searchQuery.value.toLowerCase()
    return tables.value.filter(table =>
      table.name.toLowerCase().includes(query) ||
      table.description?.toLowerCase().includes(query)
    )
  })
  
  // 選択管理
  function toggleSelection(tableId: string) {
    if (selectedTables.value.has(tableId)) {
      selectedTables.value.delete(tableId)
    } else {
      selectedTables.value.add(tableId)
    }
  }
  
  return {
    tables: readonly(tables),
    loading: readonly(loading),
    error: readonly(error),
    searchQuery,
    viewMode,
    selectedTables: readonly(selectedTables),
    filteredTables,
    fetchTables,
    createTable,
    deleteTable,
    toggleSelection
  }
}
```

### useRecordList
レコード一覧の状態管理

```typescript
// composables/useRecordList.ts
export function useRecordList(tableId: Ref<string>) {
  const records = ref<Record[]>([])
  const loading = ref(false)
  const totalElements = ref(0)
  const currentPage = ref(0)
  const pageSize = ref(20)
  const sortField = ref<string | null>(null)
  const sortDirection = ref<'asc' | 'desc'>('asc')
  const filters = ref<RecordFilter[]>([])
  const selectedRecords = ref<Set<string>>(new Set())
  
  // レコード取得
  async function fetchRecords() {
    loading.value = true
    try {
      const params = new URLSearchParams({
        page: currentPage.value.toString(),
        size: pageSize.value.toString()
      })
      
      if (sortField.value) {
        params.append('sort', `${sortField.value},${sortDirection.value}`)
      }
      
      if (filters.value.length > 0) {
        params.append('filter', JSON.stringify(filters.value))
      }
      
      const response = await $fetch(`/api/v1/tables/${tableId.value}/records?${params}`)
      records.value = response.content
      totalElements.value = response.totalElements
    } finally {
      loading.value = false
    }
  }
  
  // レコード作成
  async function createRecord(data: any) {
    const response = await $fetch(`/api/v1/tables/${tableId.value}/records`, {
      method: 'POST',
      body: { data }
    })
    records.value.unshift(response)
    return response
  }
  
  // レコード更新
  async function updateRecord(recordId: string, data: any) {
    const response = await $fetch(`/api/v1/records/${recordId}`, {
      method: 'PUT',
      body: { data }
    })
    
    const index = records.value.findIndex(r => r.id === recordId)
    if (index !== -1) {
      records.value[index] = response
    }
    return response
  }
  
  // セル更新（インライン編集）
  async function updateCell(recordId: string, field: string, value: any) {
    const record = records.value.find(r => r.id === recordId)
    if (!record) return
    
    const updatedData = { ...record.data, [field]: value }
    return updateRecord(recordId, updatedData)
  }
  
  // フィルター追加
  function addFilter(filter: RecordFilter) {
    filters.value.push(filter)
    fetchRecords()
  }
  
  // ソート切り替え
  function toggleSort(field: string) {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortDirection.value = 'asc'
    }
    fetchRecords()
  }
  
  return {
    records: readonly(records),
    loading: readonly(loading),
    totalElements: readonly(totalElements),
    currentPage,
    pageSize,
    sortField: readonly(sortField),
    sortDirection: readonly(sortDirection),
    filters: readonly(filters),
    selectedRecords: readonly(selectedRecords),
    fetchRecords,
    createRecord,
    updateRecord,
    updateCell,
    addFilter,
    toggleSort
  }
}
```

### useTableDetail
単一テーブルの詳細管理

```typescript
// composables/useTableDetail.ts
export function useTableDetail(tableId: string) {
  const table = ref<Table | null>(null)
  const loading = ref(false)
  
  // テーブル詳細取得
  async function fetchTable() {
    loading.value = true
    try {
      table.value = await $fetch(`/api/v1/tables/${tableId}`)
    } finally {
      loading.value = false
    }
  }
  
  // プロパティ追加
  async function addProperty(key: string, definition: PropertyDefinition) {
    const response = await $fetch(`/api/v1/tables/${tableId}/properties`, {
      method: 'POST',
      body: { key, definition }
    })
    
    if (table.value) {
      table.value.properties[key] = definition
      table.value.propertyOrder.push(key)
    }
    
    return response
  }
  
  // プロパティ更新
  async function updateProperty(key: string, definition: PropertyDefinition) {
    const response = await $fetch(`/api/v1/tables/${tableId}/properties/${key}`, {
      method: 'PUT',
      body: { definition }
    })
    
    if (table.value) {
      table.value.properties[key] = definition
    }
    
    return response
  }
  
  // プロパティ削除
  async function deleteProperty(key: string) {
    await $fetch(`/api/v1/tables/${tableId}/properties/${key}`, {
      method: 'DELETE'
    })
    
    if (table.value) {
      delete table.value.properties[key]
      table.value.propertyOrder = table.value.propertyOrder.filter(k => k !== key)
    }
  }
  
  // プロパティ順序変更
  async function reorderProperties(newOrder: string[]) {
    const response = await $fetch(`/api/v1/tables/${tableId}/property-order`, {
      method: 'PUT',
      body: { propertyOrder: newOrder }
    })
    
    if (table.value) {
      table.value.propertyOrder = newOrder
    }
    
    return response
  }
  
  return {
    table: readonly(table),
    loading: readonly(loading),
    fetchTable,
    addProperty,
    updateProperty,
    deleteProperty,
    reorderProperties
  }
}
```

### useTableViewMode
ビューモード管理

```typescript
// composables/table/useTableViewMode.ts
export function useTableViewMode() {
  const viewMode = ref<'table' | 'kanban' | 'gallery'>('table')
  const kanbanGroupBy = ref<string>('status')
  const galleryImageField = ref<string | null>(null)
  
  // ビューモード切り替え
  function switchView(mode: 'table' | 'kanban' | 'gallery') {
    viewMode.value = mode
    
    // ビューモードをローカルストレージに保存
    localStorage.setItem('tableViewMode', mode)
  }
  
  // カンバンのグループフィールド変更
  function setKanbanGroupBy(field: string) {
    kanbanGroupBy.value = field
    localStorage.setItem('kanbanGroupBy', field)
  }
  
  // ギャラリーの画像フィールド設定
  function setGalleryImageField(field: string | null) {
    galleryImageField.value = field
    localStorage.setItem('galleryImageField', field || '')
  }
  
  // 初期化
  onMounted(() => {
    const savedViewMode = localStorage.getItem('tableViewMode')
    if (savedViewMode) {
      viewMode.value = savedViewMode as any
    }
    
    const savedGroupBy = localStorage.getItem('kanbanGroupBy')
    if (savedGroupBy) {
      kanbanGroupBy.value = savedGroupBy
    }
    
    const savedImageField = localStorage.getItem('galleryImageField')
    if (savedImageField) {
      galleryImageField.value = savedImageField
    }
  })
  
  return {
    viewMode: readonly(viewMode),
    kanbanGroupBy: readonly(kanbanGroupBy),
    galleryImageField: readonly(galleryImageField),
    switchView,
    setKanbanGroupBy,
    setGalleryImageField
  }
}
```

## 型定義

```typescript
// types/index.ts
export interface Table {
  id: string
  workspaceId: string
  name: string
  description?: string
  properties: Record<string, PropertyDefinition>
  propertyOrder: string[]
  createdAt: string
  updatedAt: string
}

export interface PropertyDefinition {
  type: PropertyType
  name: string
  description?: string
  required?: boolean
  defaultValue?: any
  options?: string[]
  relationTableId?: string
  format?: string
}

export type PropertyType = 
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'CHECKBOX'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'USER'
  | 'RELATION'
  | 'URL'
  | 'EMAIL'
  | 'PHONE'

export interface Record {
  id: string
  tableId: string
  data: Record<string, any>
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface RecordFilter {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'in'
  value: any
}
```