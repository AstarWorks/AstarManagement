# ダッシュボード カスタマイゼーションガイド

## 概要

ダッシュボードを組織のニーズに合わせてカスタマイズする方法を説明します。**汎用プラットフォーム**の上に**業界テンプレート**を適用し、さらに**組織固有の設定**を加える3層構造でカスタマイズが可能です。

## カスタマイゼーション階層

```
┌─────────────────────────────────┐
│   組織固有カスタマイズ（最上位）   │ ← ユーザー/管理者が設定
├─────────────────────────────────┤
│     業界テンプレート（中間層）     │ ← テンプレートで提供
├─────────────────────────────────┤
│   汎用プラットフォーム（基盤）     │ ← システムコア機能
└─────────────────────────────────┘
```

## 1. テンプレートによるカスタマイズ

### テンプレート構造

```typescript
// templates/{industry}/dashboard/index.ts
export interface DashboardTemplate {
  // 基本設定
  metadata: {
    id: string
    name: string
    description: string
    version: string
    industry: string
  }
  
  // ロール定義
  roles: RoleDefinition[]
  
  // デフォルトウィジェット
  widgets: WidgetPreset[]
  
  // レイアウトプリセット
  layouts: LayoutPreset[]
  
  // i18n翻訳
  translations: TranslationSet
  
  // スタイル設定
  styles?: StyleOverrides
}
```

### 法律事務所テンプレート例

```typescript
// templates/legal-firm/dashboard/template.ts
export const legalFirmDashboardTemplate: DashboardTemplate = {
  metadata: {
    id: 'legal-firm-dashboard',
    name: '法律事務所向けダッシュボード',
    description: '法律事務所の業務に最適化されたダッシュボード設定',
    version: '1.0.0',
    industry: 'legal'
  },
  
  roles: [
    {
      id: 'managing_partner',
      name: '経営弁護士',
      permissions: ['dashboard.all'],
      defaultLayout: 'executive'
    },
    {
      id: 'associate',
      name: '担当弁護士',
      permissions: ['dashboard.personal', 'dashboard.team'],
      defaultLayout: 'operational'
    },
    {
      id: 'staff',
      name: '事務員',
      permissions: ['dashboard.tasks'],
      defaultLayout: 'support'
    }
  ],
  
  widgets: [
    // 経営者向けウィジェット
    {
      roleId: 'managing_partner',
      widgets: [
        {
          type: 'stats',
          title: 'legal.dashboard.firmMetrics',
          config: {
            metrics: [
              { key: 'totalCases', source: { tableId: 'cases', aggregation: 'count' }},
              { key: 'monthlyRevenue', source: { tableId: 'billing', aggregation: 'sum', field: 'amount' }},
              { key: 'teamUtilization', source: { custom: 'calculateUtilization' }},
              { key: 'clientSatisfaction', source: { tableId: 'feedback', aggregation: 'avg', field: 'rating' }}
            ]
          }
        },
        {
          type: 'chart',
          title: 'legal.dashboard.revenuetrend',
          config: {
            chartType: 'line',
            data: {
              source: {
                tableId: 'billing',
                xAxis: 'date',
                yAxis: 'amount',
                aggregation: 'sum',
                period: 'month'
              }
            }
          }
        }
      ]
    }
  ],
  
  translations: {
    ja: {
      'legal.dashboard.firmMetrics': '事務所指標',
      'legal.dashboard.revenuetrend': '売上推移',
      'legal.metrics.totalCases': '総案件数',
      'legal.metrics.monthlyRevenue': '月間売上'
    },
    en: {
      'legal.dashboard.firmMetrics': 'Firm Metrics',
      'legal.dashboard.revenuetrend': 'Revenue Trend',
      'legal.metrics.totalCases': 'Total Cases',
      'legal.metrics.monthlyRevenue': 'Monthly Revenue'
    }
  }
}
```

### テンプレート適用方法

```typescript
// plugins/dashboard-template.ts
export default defineNuxtPlugin(async (nuxtApp) => {
  // 組織の業界設定を取得
  const { industry } = await useOrganizationSettings()
  
  // 対応するテンプレートをロード
  const template = await loadDashboardTemplate(industry)
  
  // テンプレートを適用
  const dashboardStore = useDashboardStore()
  dashboardStore.applyTemplate(template)
})
```

## 2. ロールベースカスタマイズ

### ロールプリセット定義

```typescript
interface RolePreset {
  roleId: string
  layout: {
    columns: number
    gap: number
    padding: number
  }
  defaultWidgets: WidgetConfig[]
  permissions: string[]
  preferences: {
    refreshInterval?: number
    theme?: 'light' | 'dark' | 'auto'
    density?: 'compact' | 'comfortable' | 'spacious'
  }
}
```

### 動的ロール割り当て

```typescript
// composables/useDashboardRole.ts
export function useDashboardRole() {
  const user = useCurrentUser()
  const template = useDashboardTemplate()
  
  // ユーザーのロールに基づいてプリセットを取得
  const rolePreset = computed(() => {
    const userRoles = user.value?.roles || []
    return template.findBestMatchingPreset(userRoles)
  })
  
  // プリセットを適用
  const applyRolePreset = () => {
    const preset = rolePreset.value
    if (preset) {
      dashboardStore.setLayout(preset.layout)
      dashboardStore.setWidgets(preset.defaultWidgets)
    }
  }
  
  return { rolePreset, applyRolePreset }
}
```

## 3. ユーザーレベルカスタマイズ

### 個人設定の保存

```typescript
interface UserDashboardSettings {
  userId: string
  settings: {
    layout: LayoutConfig
    widgets: WidgetConfig[]
    preferences: UserPreferences
  }
  savedAt: string
}

// composables/useUserDashboard.ts
export function useUserDashboard() {
  const savePersonalSettings = async (settings: UserDashboardSettings) => {
    // バックエンドに保存
    await $fetch('/api/dashboard/user-settings', {
      method: 'POST',
      body: settings
    })
    
    // ローカルストレージにもキャッシュ
    localStorage.setItem('dashboard-settings', JSON.stringify(settings))
  }
  
  const loadPersonalSettings = async () => {
    try {
      // バックエンドから取得
      return await $fetch('/api/dashboard/user-settings')
    } catch (error) {
      // フォールバック: ローカルストレージ
      const cached = localStorage.getItem('dashboard-settings')
      return cached ? JSON.parse(cached) : null
    }
  }
}
```

### ウィジェット個別設定

```vue
<!-- components/DashboardWidgetSettings.vue -->
<template>
  <VDialog v-model="isOpen">
    <VCard>
      <VCardTitle>{{ $t('dashboard.widgetSettings') }}</VCardTitle>
      
      <VCardText>
        <!-- データソース設定 -->
        <VSelect
          v-model="settings.tableId"
          :items="availableTables"
          :label="$t('dashboard.dataSource')"
        />
        
        <!-- 表示カラム選択 -->
        <VCheckboxGroup
          v-model="settings.columns"
          :items="tableColumns"
          :label="$t('dashboard.displayColumns')"
        />
        
        <!-- フィルター設定 -->
        <FilterBuilder
          v-model="settings.filters"
          :table="settings.tableId"
        />
        
        <!-- 更新間隔 -->
        <VSlider
          v-model="settings.refreshInterval"
          :min="0"
          :max="300000"
          :step="5000"
          :label="$t('dashboard.refreshInterval')"
        />
      </VCardText>
      
      <VCardActions>
        <VBtn @click="saveSettings">{{ $t('common.save') }}</VBtn>
        <VBtn @click="isOpen = false">{{ $t('common.cancel') }}</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
```

## 4. レイアウトカスタマイズ

### グリッドレイアウト設定

```typescript
interface GridLayoutConfig {
  // グリッド設定
  cols: number           // カラム数（デフォルト: 12）
  rowHeight: number      // 行の高さ（px）
  margin: [number, number]  // マージン [x, y]
  
  // レスポンシブ設定
  breakpoints: {
    lg: number  // 大画面
    md: number  // 中画面
    sm: number  // 小画面
    xs: number  // 極小画面
  }
  
  // カラム数のブレークポイント
  cols: {
    lg: number
    md: number
    sm: number
    xs: number
  }
}
```

### ドラッグ&ドロップ実装

```vue
<!-- components/DashboardGrid.vue -->
<template>
  <GridLayout
    v-model:layout="layout"
    :col-num="12"
    :row-height="60"
    :is-draggable="editMode"
    :is-resizable="editMode"
    :margin="[10, 10]"
    :use-css-transforms="true"
    @layout-updated="onLayoutUpdate"
  >
    <GridItem
      v-for="widget in widgets"
      :key="widget.id"
      :x="widget.position.x"
      :y="widget.position.y"
      :w="widget.size.w"
      :h="widget.size.h"
      :i="widget.id"
      :min-w="widget.size.minW || 2"
      :min-h="widget.size.minH || 2"
    >
      <DashboardWidget :widget="widget" />
    </GridItem>
  </GridLayout>
</template>
```

## 5. スタイルカスタマイズ

### テーマ変数

```scss
// styles/dashboard-theme.scss
:root {
  // 基本カラー
  --dashboard-bg: var(--color-background);
  --dashboard-widget-bg: var(--color-surface);
  --dashboard-widget-border: var(--color-border);
  
  // ウィジェット設定
  --dashboard-widget-radius: 8px;
  --dashboard-widget-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --dashboard-widget-padding: 16px;
  
  // グリッド設定
  --dashboard-grid-gap: 16px;
  --dashboard-grid-margin: 20px;
}

// ダークモード
[data-theme="dark"] {
  --dashboard-bg: #1a1a1a;
  --dashboard-widget-bg: #2a2a2a;
  --dashboard-widget-border: #3a3a3a;
}
```

### カスタムウィジェットスタイル

```vue
<style scoped>
.custom-widget {
  background: var(--dashboard-widget-bg);
  border: 1px solid var(--dashboard-widget-border);
  border-radius: var(--dashboard-widget-radius);
  padding: var(--dashboard-widget-padding);
  
  &.highlight {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-alpha);
  }
}
</style>
```

## 6. データソース設定

### 動的テーブル接続

```typescript
// テーブルとウィジェットのマッピング
interface TableWidgetMapping {
  tableId: string
  supportedWidgets: string[]
  defaultWidget: string
  fieldMappings: {
    title?: string
    description?: string
    status?: string
    date?: string
    amount?: string
  }
}

// 自動検出
export function detectTableWidgets(table: TableSchema): string[] {
  const widgets = ['table'] // 基本はテーブル表示
  
  // ステータスフィールドがあればカンバン可能
  if (table.fields.some(f => f.type === 'status')) {
    widgets.push('kanban')
  }
  
  // 数値フィールドがあればチャート可能
  if (table.fields.some(f => f.type === 'number')) {
    widgets.push('chart', 'stats')
  }
  
  // 日付フィールドがあればカレンダー可能
  if (table.fields.some(f => f.type === 'date')) {
    widgets.push('calendar', 'timeline')
  }
  
  return widgets
}
```

## 7. 高度なカスタマイズ

### カスタムウィジェット開発

```typescript
// widgets/CustomAnalyticsWidget.vue
export default defineComponent({
  name: 'CustomAnalyticsWidget',
  props: {
    config: {
      type: Object as PropType<AnalyticsConfig>,
      required: true
    }
  },
  setup(props) {
    // カスタムロジック
    const analytics = useAnalytics(props.config)
    
    // カスタムレンダリング
    return () => h('div', {
      class: 'analytics-widget'
    }, [
      h(AnalyticsChart, { data: analytics.data }),
      h(AnalyticsTable, { rows: analytics.rows })
    ])
  }
})
```

### API拡張

```typescript
// カスタムデータソース
export class CustomDataSource implements DataSource {
  async getData(params: DataParams): Promise<any> {
    // 外部APIや特殊な計算
    const externalData = await fetch('https://api.example.com/data')
    return this.transform(externalData)
  }
}
```

## 8. エクスポート/インポート

### 設定のエクスポート

```typescript
export function exportDashboardConfig(): DashboardExport {
  const store = useDashboardStore()
  
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    layout: store.layout,
    widgets: store.widgets,
    preferences: store.preferences,
    customStyles: store.customStyles
  }
}
```

### 設定のインポート

```typescript
export async function importDashboardConfig(config: DashboardExport) {
  // バージョン互換性チェック
  if (!isCompatibleVersion(config.version)) {
    throw new Error('Incompatible configuration version')
  }
  
  // 検証
  const validation = validateDashboardConfig(config)
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
  }
  
  // 適用
  const store = useDashboardStore()
  await store.importConfig(config)
}
```

## まとめ

ダッシュボードのカスタマイズは：

1. **階層的**: プラットフォーム → テンプレート → 組織 → ユーザー
2. **柔軟**: あらゆるレベルでカスタマイズ可能
3. **永続的**: 設定の保存と共有が可能
4. **拡張可能**: カスタムウィジェットの追加が容易
5. **メンテナブル**: 設定のエクスポート/インポート対応

これにより、どの業界・組織でも最適なダッシュボードを構築できます。