# ダッシュボード データソース統合

## 概要

ダッシュボードが**任意のテーブルデータ**と連携し、**既存のビューコンポーネント**を再利用して表示する仕組みを説明します。これにより、車輪の再発明を避け、統一的なユーザー体験を提供します。

## アーキテクチャ概要

```
┌─────────────────────┐
│   Dashboard Layer   │
├─────────────────────┤
│  Integration Layer  │ ← データソース統合層
├─────────────────────┤
│    Table Feature    │ ← 既存のテーブル機能
├─────────────────────┤
│    Data Layer       │ ← 汎用データモデル
└─────────────────────┘
```

## 1. データソースの抽象化

### DataSource インターフェース

```typescript
export interface DataSource {
  id: string
  type: 'table' | 'view' | 'aggregation' | 'external'
  getName(): string
  getSchema(): Promise<DataSchema>
  getData(params: DataParams): Promise<DataResult>
  subscribe?(callback: DataChangeCallback): Unsubscribe
}

export interface DataSchema {
  fields: Field[]
  relations?: Relation[]
  indexes?: Index[]
  permissions?: Permission[]
}

export interface DataParams {
  select?: string[]         // 取得フィールド
  where?: FilterCondition[] // フィルター条件
  orderBy?: SortOrder[]     // ソート
  limit?: number            // 件数制限
  offset?: number           // オフセット
  include?: string[]        // リレーション展開
}
```

### テーブルデータソース実装

```typescript
export class TableDataSource implements DataSource {
  constructor(
    private tableId: string,
    private repository: TableRepository
  ) {}
  
  async getSchema(): Promise<DataSchema> {
    const table = await this.repository.getTable(this.tableId)
    return {
      fields: table.fields,
      relations: table.relations,
      permissions: table.permissions
    }
  }
  
  async getData(params: DataParams): Promise<DataResult> {
    const records = await this.repository.getRecords(this.tableId, {
      filters: params.where,
      sort: params.orderBy,
      pagination: {
        limit: params.limit,
        offset: params.offset
      }
    })
    
    return {
      data: records.items,
      total: records.total,
      schema: await this.getSchema()
    }
  }
}
```

## 2. ビューコンポーネントの再利用

### 既存ビューの活用

```typescript
// ダッシュボードは既存のテーブルビューを再利用
import { TableView } from '@/modules/table/components/views/TableView.vue'
import { KanbanView } from '@/modules/table/components/views/KanbanView.vue'
import { ChartView } from '@/modules/table/components/views/ChartView.vue'

export const viewComponents = {
  table: TableView,
  kanban: KanbanView,
  chart: ChartView,
  // 他のビュー
}
```

### ビューアダプター

```vue
<!-- components/DashboardViewAdapter.vue -->
<template>
  <component
    :is="viewComponent"
    :data-source="dataSource"
    :config="viewConfig"
    :readonly="!hasEditPermission"
    @action="handleAction"
  />
</template>

<script setup lang="ts">
interface Props {
  widgetConfig: WidgetConfig
  viewType: ViewType
}

const props = defineProps<Props>()

// データソースを作成
const dataSource = computed(() => {
  return new TableDataSource(
    props.widgetConfig.tableId,
    useTableRepository()
  )
})

// 適切なビューコンポーネントを選択
const viewComponent = computed(() => {
  return viewComponents[props.viewType] || viewComponents.table
})

// ビュー設定を変換
const viewConfig = computed(() => {
  return {
    columns: props.widgetConfig.columns,
    filters: props.widgetConfig.filters,
    sort: props.widgetConfig.sort,
    // ダッシュボード特有の設定
    compact: true,
    showToolbar: false,
    maxRows: props.widgetConfig.limit
  }
})
</script>
```

## 3. データ連携パターン

### 単一テーブル連携

```typescript
// 最もシンプルなパターン
const widgetConfig: TableWidgetConfig = {
  type: 'table',
  dataSource: {
    type: 'single',
    tableId: 'projects',
    filters: [
      { field: 'status', operator: 'eq', value: 'active' }
    ]
  },
  view: {
    type: 'table',
    columns: ['name', 'status', 'deadline', 'assignee']
  }
}
```

### 複数テーブル結合

```typescript
// リレーションを活用した結合
const widgetConfig: JoinedWidgetConfig = {
  type: 'joined',
  dataSource: {
    type: 'joined',
    primary: {
      tableId: 'tasks',
      alias: 't'
    },
    joins: [
      {
        tableId: 'projects',
        alias: 'p',
        on: 't.project_id = p.id',
        type: 'left'
      },
      {
        tableId: 'users',
        alias: 'u',
        on: 't.assignee_id = u.id',
        type: 'left'
      }
    ],
    select: [
      't.title as task_title',
      'p.name as project_name',
      'u.name as assignee_name'
    ]
  }
}
```

### 集計データ

```typescript
// 統計やグラフ用の集計
const statsConfig: AggregationConfig = {
  type: 'aggregation',
  dataSource: {
    type: 'aggregation',
    tableId: 'sales',
    groupBy: ['month'],
    aggregations: [
      { field: 'amount', function: 'sum', alias: 'total_sales' },
      { field: 'id', function: 'count', alias: 'transaction_count' }
    ],
    having: [
      { field: 'total_sales', operator: 'gt', value: 1000000 }
    ]
  }
}
```

## 4. リアルタイム更新

### WebSocket統合

```typescript
export class RealtimeDataSource extends TableDataSource {
  private ws?: WebSocket
  private subscribers = new Set<DataChangeCallback>()
  
  connect() {
    this.ws = new WebSocket(this.getWebSocketUrl())
    
    this.ws.onmessage = (event) => {
      const change = JSON.parse(event.data)
      this.handleDataChange(change)
    }
  }
  
  private handleDataChange(change: DataChange) {
    // 変更をサブスクライバーに通知
    this.subscribers.forEach(callback => {
      callback(change)
    })
  }
  
  subscribe(callback: DataChangeCallback): Unsubscribe {
    this.subscribers.add(callback)
    
    // 初回接続
    if (!this.ws) {
      this.connect()
    }
    
    return () => {
      this.subscribers.delete(callback)
      if (this.subscribers.size === 0) {
        this.disconnect()
      }
    }
  }
}
```

### ウィジェットでのリアルタイム対応

```vue
<script setup lang="ts">
// リアルタイムデータソース
const dataSource = new RealtimeDataSource(props.tableId)

// データの監視
const { data, refresh } = useAsyncData(
  () => dataSource.getData(props.params)
)

// リアルタイム更新の購読
onMounted(() => {
  const unsubscribe = dataSource.subscribe((change) => {
    // 部分更新または全体更新
    if (change.type === 'update') {
      updateRecord(change.record)
    } else {
      refresh()
    }
  })
  
  onUnmounted(unsubscribe)
})
</script>
```

## 5. パフォーマンス最適化

### データのキャッシュ戦略

```typescript
export class CachedDataSource implements DataSource {
  private cache = new Map<string, CacheEntry>()
  private ttl = 60000 // 1分
  
  async getData(params: DataParams): Promise<DataResult> {
    const cacheKey = this.getCacheKey(params)
    const cached = this.cache.get(cacheKey)
    
    if (cached && !this.isExpired(cached)) {
      return cached.data
    }
    
    // キャッシュミス時は取得
    const data = await this.fetchData(params)
    
    // キャッシュに保存
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    
    return data
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttl
  }
}
```

### 仮想スクロール対応

```typescript
export class VirtualizedDataSource extends TableDataSource {
  private pageSize = 50
  private pages = new Map<number, DataPage>()
  
  async getPage(pageIndex: number): Promise<DataPage> {
    if (this.pages.has(pageIndex)) {
      return this.pages.get(pageIndex)!
    }
    
    const data = await this.getData({
      limit: this.pageSize,
      offset: pageIndex * this.pageSize
    })
    
    const page = {
      index: pageIndex,
      items: data.data,
      loaded: true
    }
    
    this.pages.set(pageIndex, page)
    return page
  }
}
```

## 6. フィルターとクエリ

### 動的フィルター構築

```typescript
export class FilterBuilder {
  private filters: FilterCondition[] = []
  
  where(field: string, operator: Operator, value: any): this {
    this.filters.push({ field, operator, value })
    return this
  }
  
  whereIn(field: string, values: any[]): this {
    this.filters.push({ field, operator: 'in', value: values })
    return this
  }
  
  whereBetween(field: string, start: any, end: any): this {
    this.filters.push({
      field,
      operator: 'between',
      value: [start, end]
    })
    return this
  }
  
  build(): FilterCondition[] {
    return this.filters
  }
}

// 使用例
const filters = new FilterBuilder()
  .where('status', 'eq', 'active')
  .whereBetween('created_at', startDate, endDate)
  .build()
```

### コンテキスト依存フィルター

```typescript
export function useContextualFilters() {
  const user = useCurrentUser()
  const workspace = useCurrentWorkspace()
  
  // ユーザーコンテキストに基づくフィルター
  const userFilters = computed(() => {
    const filters: FilterCondition[] = []
    
    // 自分のデータのみ
    if (!user.value?.hasPermission('view_all')) {
      filters.push({
        field: 'owner_id',
        operator: 'eq',
        value: user.value?.id
      })
    }
    
    // ワークスペースフィルター
    filters.push({
      field: 'workspace_id',
      operator: 'eq',
      value: workspace.value?.id
    })
    
    return filters
  })
  
  return { userFilters }
}
```

## 7. データ変換とマッピング

### フィールドマッピング

```typescript
export interface FieldMapping {
  source: string        // ソースフィールド
  target: string        // 表示用フィールド
  transform?: (value: any) => any  // 変換関数
}

export class MappedDataSource extends TableDataSource {
  constructor(
    tableId: string,
    private mappings: FieldMapping[]
  ) {
    super(tableId)
  }
  
  async getData(params: DataParams): Promise<DataResult> {
    const result = await super.getData(params)
    
    // データ変換
    const mappedData = result.data.map(record => {
      const mapped: Record<string, any> = {}
      
      this.mappings.forEach(mapping => {
        const value = record[mapping.source]
        mapped[mapping.target] = mapping.transform
          ? mapping.transform(value)
          : value
      })
      
      return mapped
    })
    
    return { ...result, data: mappedData }
  }
}
```

### 計算フィールド

```typescript
export interface ComputedField {
  name: string
  compute: (record: any) => any
  dependencies: string[]
}

export function addComputedFields(
  data: any[],
  computedFields: ComputedField[]
): any[] {
  return data.map(record => {
    const enhanced = { ...record }
    
    computedFields.forEach(field => {
      enhanced[field.name] = field.compute(record)
    })
    
    return enhanced
  })
}

// 使用例
const computedFields: ComputedField[] = [
  {
    name: 'fullName',
    dependencies: ['firstName', 'lastName'],
    compute: (r) => `${r.firstName} ${r.lastName}`
  },
  {
    name: 'daysUntilDeadline',
    dependencies: ['deadline'],
    compute: (r) => {
      const days = differenceInDays(new Date(r.deadline), new Date())
      return Math.max(0, days)
    }
  }
]
```

## 8. エラーハンドリング

### データソースエラー処理

```typescript
export class ResilientDataSource implements DataSource {
  private retryCount = 3
  private retryDelay = 1000
  
  async getData(params: DataParams): Promise<DataResult> {
    let lastError: Error | null = null
    
    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await this.fetchData(params)
      } catch (error) {
        lastError = error as Error
        console.warn(`Data fetch attempt ${i + 1} failed:`, error)
        
        if (i < this.retryCount - 1) {
          await this.delay(this.retryDelay * Math.pow(2, i))
        }
      }
    }
    
    // すべての試行が失敗
    return this.getFallbackData(params, lastError!)
  }
  
  private async getFallbackData(
    params: DataParams,
    error: Error
  ): Promise<DataResult> {
    // キャッシュから取得を試みる
    const cached = await this.getCachedData(params)
    if (cached) {
      console.info('Using cached data as fallback')
      return cached
    }
    
    // 空のデータを返す
    return {
      data: [],
      total: 0,
      error: error.message
    }
  }
}
```

## 9. 権限とセキュリティ

### データレベルセキュリティ

```typescript
export class SecureDataSource extends TableDataSource {
  async getData(params: DataParams): Promise<DataResult> {
    const user = useCurrentUser()
    
    // 権限チェック
    const permissions = await this.checkPermissions(user.value)
    
    // 権限に基づくフィルター追加
    const secureParams = {
      ...params,
      where: [
        ...(params.where || []),
        ...this.getSecurityFilters(permissions)
      ]
    }
    
    // フィールドレベルのセキュリティ
    const data = await super.getData(secureParams)
    return this.filterFields(data, permissions)
  }
  
  private filterFields(
    data: DataResult,
    permissions: Permission[]
  ): DataResult {
    const allowedFields = this.getAllowedFields(permissions)
    
    const filtered = data.data.map(record => {
      const filtered: Record<string, any> = {}
      
      Object.keys(record).forEach(key => {
        if (allowedFields.includes(key)) {
          filtered[key] = record[key]
        }
      })
      
      return filtered
    })
    
    return { ...data, data: filtered }
  }
}
```

## まとめ

データソース統合により：

1. **統一的**: すべてのテーブルデータを同じ方法で扱える
2. **再利用可能**: 既存のビューコンポーネントをそのまま活用
3. **拡張可能**: カスタムデータソースの追加が容易
4. **パフォーマンス**: キャッシュと最適化戦略
5. **セキュア**: データレベルの権限制御

これにより、ダッシュボードは任意のデータを柔軟に表示できる強力なツールとなります。