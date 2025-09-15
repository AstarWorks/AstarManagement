# ダッシュボード ウィジェットカタログ

## 概要

ダッシュボードで利用可能な**汎用ウィジェット**の一覧と設定方法。すべてのウィジェットは業界に依存しない設計で、テンプレートによってカスタマイズされます。

## ウィジェット基本構造

### ウィジェットインターフェース

```typescript
export interface DashboardWidget {
  id: string                    // 一意識別子
  type: WidgetType              // ウィジェットタイプ
  title: string                 // 表示タイトル（i18nキー可）
  position: GridPosition        // グリッド上の位置
  size: WidgetSize             // サイズ設定
  config: WidgetConfig         // ウィジェット固有の設定
  permissions?: string[]        // 表示権限
  refreshInterval?: number      // 自動更新間隔（ms）
}

export interface GridPosition {
  x: number      // 横位置（0-11）
  y: number      // 縦位置
}

export interface WidgetSize {
  w: number      // 幅（1-12）
  h: number      // 高さ
  minW?: number  // 最小幅
  minH?: number  // 最小高さ
  maxW?: number  // 最大幅
  maxH?: number  // 最大高さ
}
```

## コアウィジェット

### 1. テーブルウィジェット (TableWidget)

**任意のテーブルデータを表示**

```typescript
interface TableWidgetConfig {
  tableId: string               // 対象テーブルID
  viewType: 'table' | 'list'    // 表示形式
  columns?: string[]             // 表示カラム
  filters?: FilterConfig[]       // フィルター設定
  sortBy?: string               // ソートキー
  sortOrder?: 'asc' | 'desc'    // ソート順
  limit?: number                // 表示件数
  actions?: ActionConfig[]       // アクション設定
}
```

**使用例**:
```json
{
  "type": "table",
  "title": "dashboard.widgets.recentRecords",
  "config": {
    "tableId": "dynamic-table-id",
    "viewType": "table",
    "columns": ["name", "status", "updatedAt"],
    "limit": 10,
    "sortBy": "updatedAt",
    "sortOrder": "desc"
  }
}
```

### 2. カンバンウィジェット (KanbanWidget)

**ステータス管理をビジュアル化**

```typescript
interface KanbanWidgetConfig {
  tableId: string               // 対象テーブルID
  groupBy: string               // グループ化フィールド
  cardFields: string[]          // カード表示フィールド
  columnOrder?: string[]        // カラム順序
  filters?: FilterConfig[]
  limit?: number                // カラムあたりの最大表示数
}
```

### 3. 統計ウィジェット (StatsWidget)

**KPIや集計値を表示**

```typescript
interface StatsWidgetConfig {
  metrics: MetricConfig[]       // 表示する指標
  period?: 'day' | 'week' | 'month' | 'year'
  compareWith?: 'previous' | 'average'  // 比較対象
  format?: 'card' | 'list' | 'grid'     // 表示形式
}

interface MetricConfig {
  key: string                   // メトリクスキー
  label: string                 // 表示ラベル（i18n）
  source: {
    tableId?: string            // データソーステーブル
    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max'
    field?: string              // 集計フィールド
    filters?: FilterConfig[]
  }
  format: 'number' | 'currency' | 'percent'
  icon?: string
  color?: string
}
```

### 4. チャートウィジェット (ChartWidget)

**データの視覚化**

```typescript
interface ChartWidgetConfig {
  chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
  data: ChartDataConfig
  options?: ChartOptions        // Chart.js オプション
}

interface ChartDataConfig {
  source: {
    tableId: string
    xAxis: string               // X軸フィールド
    yAxis: string | string[]    // Y軸フィールド
    groupBy?: string            // グループ化
    aggregation?: string
    filters?: FilterConfig[]
  }
  period?: string
}
```

### 5. アクティビティウィジェット (ActivityWidget)

**タイムライン形式のイベント表示**

```typescript
interface ActivityWidgetConfig {
  sources: ActivitySource[]     // 複数ソース対応
  limit?: number
  groupByDate?: boolean         // 日付でグループ化
  showIcons?: boolean
}

interface ActivitySource {
  tableId: string
  eventField: string            // イベント名フィールド
  timestampField: string        // タイムスタンプフィールド
  actorField?: string           // 実行者フィールド
  filters?: FilterConfig[]
}
```

### 6. カレンダーウィジェット (CalendarWidget)

**日程・スケジュール表示**

```typescript
interface CalendarWidgetConfig {
  source: {
    tableId: string
    titleField: string
    startField: string
    endField?: string
    colorField?: string
  }
  view: 'month' | 'week' | 'day' | 'agenda'
  filters?: FilterConfig[]
}
```

### 7. クイックアクションウィジェット (QuickActionWidget)

**頻出操作へのショートカット**

```typescript
interface QuickActionWidgetConfig {
  actions: QuickAction[]
  layout: 'grid' | 'list'
  columns?: number              // グリッドレイアウト時のカラム数
}

interface QuickAction {
  id: string
  label: string                 // i18nキー
  icon: string
  color?: string
  action: {
    type: 'navigate' | 'create' | 'custom'
    target?: string             // URLまたはルート
    params?: Record<string, any>
  }
}
```

## 複合ウィジェット

### 8. リストチャートウィジェット (ListChartWidget)

**リストとチャートの組み合わせ**

```typescript
interface ListChartWidgetConfig {
  list: TableWidgetConfig
  chart: ChartWidgetConfig
  layout: 'horizontal' | 'vertical'
  ratio?: [number, number]      // 表示比率
}
```

### 9. 比較ウィジェット (ComparisonWidget)

**複数期間やカテゴリの比較**

```typescript
interface ComparisonWidgetConfig {
  items: ComparisonItem[]
  displayType: 'cards' | 'table' | 'chart'
}
```

## カスタムウィジェット

### カスタムウィジェット作成

```typescript
// components/widgets/CustomWidget.vue
export default defineWidget({
  name: 'custom-widget',
  props: {
    config: {
      type: Object as PropType<CustomWidgetConfig>,
      required: true
    }
  },
  setup(props) {
    // ウィジェットロジック
    const data = useWidgetData(props.config)
    
    return { data }
  }
})
```

### 登録方法

```typescript
// widgets/index.ts
import CustomWidget from './CustomWidget.vue'

export const widgetRegistry = {
  'custom': CustomWidget,
  // 他のウィジェット
}
```

## ウィジェット設定UI

### 設定ダイアログ

各ウィジェットは設定ダイアログを持ち、ユーザーが以下を設定可能：

- **データソース**: テーブル選択
- **表示設定**: カラム、フィルター、ソート
- **外観**: タイトル、色、アイコン
- **更新**: 自動更新間隔
- **権限**: 表示可能なロール

### 設定の永続化

```typescript
// ユーザーごとのウィジェット設定を保存
interface UserDashboardConfig {
  userId: string
  widgets: DashboardWidget[]
  layout: LayoutConfig
  lastModified: string
}
```

## テンプレート統合

### テンプレートでのウィジェット定義

```typescript
// templates/legal-firm/widgets.ts
export const legalFirmWidgets: TemplateWidgets = {
  defaults: [
    {
      type: 'stats',
      title: 'legal.widgets.caseStats',
      config: {
        metrics: [
          { key: 'activeCases', label: 'legal.metrics.activeCases', ... },
          { key: 'billableHours', label: 'legal.metrics.billableHours', ... }
        ]
      }
    },
    // 他のデフォルトウィジェット
  ],
  rolePresets: {
    'managing_partner': [...],
    'associate': [...],
    'staff': [...]
  }
}
```

## パフォーマンス最適化

### 遅延ローディング

```typescript
// ウィジェットの動的インポート
const WidgetComponent = defineAsyncComponent(() => 
  import(`./widgets/${widgetType}.vue`)
)
```

### データキャッシュ

```typescript
// ウィジェットごとのキャッシュ戦略
const widgetCache = new Map<string, CachedData>()

function getCachedWidgetData(widgetId: string) {
  const cached = widgetCache.get(widgetId)
  if (cached && !isExpired(cached)) {
    return cached.data
  }
  return null
}
```

## アクセシビリティ

### ARIA属性

```vue
<template>
  <div 
    role="region"
    :aria-label="widgetTitle"
    :aria-live="isRealtime ? 'polite' : 'off'"
  >
    <!-- ウィジェットコンテンツ -->
  </div>
</template>
```

### キーボード操作

- `Tab`: ウィジェット間の移動
- `Enter`: ウィジェットの展開/折りたたみ
- `Space`: アクションの実行
- `Esc`: 設定ダイアログを閉じる

## まとめ

ダッシュボードウィジェットは：

1. **汎用的**: 業界に依存しない基本機能
2. **柔軟**: 設定により様々な用途に対応
3. **拡張可能**: カスタムウィジェットの追加が容易
4. **テンプレート対応**: 業界別のプリセット提供
5. **ユーザーフレンドリー**: 直感的な設定UI

これにより、どの業界でも必要な情報を最適な形で表示できます。