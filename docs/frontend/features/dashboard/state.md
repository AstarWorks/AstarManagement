# ダッシュボード - 状態管理

## Composables構成

```
composables/
├── useDashboardLayout.ts    # レイアウト管理
├── useDashboardWidgets.ts   # ウィジェット管理
├── useDashboardPresets.ts   # プリセット管理
├── useWidgetData.ts         # 個別ウィジェットデータ
└── useWidgetConfig.ts       # ウィジェット設定
```

## レイアウト管理

### useDashboardLayout
グリッドレイアウトとウィジェット配置を管理

```typescript
// composables/useDashboardLayout.ts
import type { Layout, LayoutItem } from 'vue-grid-layout'

interface DashboardWidget {
  id: string
  type: 'data' | 'stats' | 'activity' | 'quickActions'
  title: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  config: WidgetConfig
}

export function useDashboardLayout() {
  const STORAGE_KEY = 'dashboard-layout'
  
  // 状態
  const widgets = ref<DashboardWidget[]>([])
  const layout = ref<Layout>([])
  const isEditMode = ref(false)
  const isDragging = ref(false)
  
  // レイアウトの初期化
  const initializeLayout = async () => {
    // ローカルストレージから読み込み
    const savedLayout = localStorage.getItem(STORAGE_KEY)
    if (savedLayout) {
      const parsed = JSON.parse(savedLayout)
      widgets.value = parsed.widgets
      layout.value = parsed.layout
      return
    }
    
    // デフォルトレイアウトを適用
    const preset = await getDefaultPreset()
    applyPreset(preset)
  }
  
  // レイアウトの保存
  const saveLayout = debounce(() => {
    const data = {
      widgets: widgets.value,
      layout: layout.value,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    
    // サーバーにも保存（オプション）
    if (useAuth().isAuthenticated) {
      $fetch('/api/v1/dashboard/layout', {
        method: 'PUT',
        body: data
      })
    }
  }, 1000)
  
  // ウィジェットの追加
  const addWidget = (type: DashboardWidget['type'], config?: Partial<WidgetConfig>) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: getDefaultTitle(type),
      x: 0,
      y: findLowestAvailableY(),
      w: getDefaultWidth(type),
      h: getDefaultHeight(type),
      minW: 2,
      minH: 2,
      config: {
        ...getDefaultConfig(type),
        ...config
      }
    }
    
    widgets.value.push(newWidget)
    layout.value.push({
      i: newWidget.id,
      x: newWidget.x,
      y: newWidget.y,
      w: newWidget.w,
      h: newWidget.h
    })
    
    saveLayout()
    return newWidget
  }
  
  // ウィジェットの削除
  const removeWidget = (widgetId: string) => {
    const index = widgets.value.findIndex(w => w.id === widgetId)
    if (index > -1) {
      widgets.value.splice(index, 1)
      layout.value = layout.value.filter(item => item.i !== widgetId)
      saveLayout()
    }
  }
  
  // ウィジェットの更新
  const updateWidget = (widgetId: string, updates: Partial<DashboardWidget>) => {
    const widget = widgets.value.find(w => w.id === widgetId)
    if (widget) {
      Object.assign(widget, updates)
      saveLayout()
    }
  }
  
  // レイアウトのリセット
  const resetLayout = async () => {
    const preset = await getDefaultPreset()
    applyPreset(preset)
    saveLayout()
  }
  
  // ヘルパー関数
  const findLowestAvailableY = () => {
    if (layout.value.length === 0) return 0
    return Math.max(...layout.value.map(item => item.y + item.h))
  }
  
  const getDefaultWidth = (type: string) => {
    const widths = {
      data: 6,
      stats: 3,
      activity: 4,
      quickActions: 3
    }
    return widths[type] || 4
  }
  
  const getDefaultHeight = (type: string) => {
    const heights = {
      data: 6,
      stats: 2,
      activity: 5,
      quickActions: 3
    }
    return heights[type] || 4
  }
  
  return {
    widgets: readonly(widgets),
    layout,
    isEditMode,
    isDragging,
    initializeLayout,
    saveLayout,
    addWidget,
    removeWidget,
    updateWidget,
    resetLayout
  }
}
```

## ウィジェット管理

### useDashboardWidgets
ウィジェットの設定と状態を管理

```typescript
// composables/useDashboardWidgets.ts
export function useDashboardWidgets() {
  const { widgets, updateWidget } = useDashboardLayout()
  
  // ウィジェット設定の管理
  const widgetConfigs = ref<Map<string, WidgetConfig>>(new Map())
  
  // ウィジェット設定の取得
  const getWidgetConfig = (widgetId: string): WidgetConfig | undefined => {
    return widgetConfigs.value.get(widgetId)
  }
  
  // ウィジェット設定の更新
  const updateWidgetConfig = (widgetId: string, config: Partial<WidgetConfig>) => {
    const current = widgetConfigs.value.get(widgetId) || {}
    const updated = { ...current, ...config }
    widgetConfigs.value.set(widgetId, updated)
    
    // レイアウトも更新
    updateWidget(widgetId, { config: updated })
  }
  
  // ウィジェットタイプごとの設定検証
  const validateConfig = (type: string, config: WidgetConfig): boolean => {
    switch (type) {
      case 'data':
        return !!(config.tableId && config.columns?.length)
      case 'stats':
        return !!(config.metrics?.length)
      case 'activity':
        return !!(config.activityTypes?.length)
      default:
        return true
    }
  }
  
  // ウィジェットのエクスポート
  const exportWidget = (widgetId: string) => {
    const widget = widgets.value.find(w => w.id === widgetId)
    if (!widget) return null
    
    return {
      type: widget.type,
      title: widget.title,
      config: widget.config,
      size: { w: widget.w, h: widget.h }
    }
  }
  
  // ウィジェットのインポート
  const importWidget = (widgetData: any) => {
    const { addWidget } = useDashboardLayout()
    return addWidget(widgetData.type, {
      title: widgetData.title,
      config: widgetData.config,
      w: widgetData.size?.w,
      h: widgetData.size?.h
    })
  }
  
  return {
    widgetConfigs: readonly(widgetConfigs),
    getWidgetConfig,
    updateWidgetConfig,
    validateConfig,
    exportWidget,
    importWidget
  }
}
```

## プリセット管理

### useDashboardPresets
ロールベースのプリセットとカスタムレイアウト

```typescript
// composables/useDashboardPresets.ts
interface DashboardPreset {
  id: string
  name: string
  description?: string
  role?: string
  widgets: PresetWidget[]
  isDefault?: boolean
  isShared?: boolean
}

interface PresetWidget {
  type: string
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: WidgetConfig
}

export function useDashboardPresets() {
  const presets = ref<DashboardPreset[]>([])
  const currentPreset = ref<DashboardPreset | null>(null)
  
  // プリセット一覧の取得
  const fetchPresets = async () => {
    const { data } = await $fetch('/api/v1/dashboard/presets')
    presets.value = data
  }
  
  // ロールベースのデフォルトプリセット取得
  const getDefaultPreset = async (): Promise<DashboardPreset> => {
    const { user } = useAuth()
    const userRole = user.value?.roles?.[0]
    
    // ロール用プリセットを探す
    let preset = presets.value.find(p => 
      p.role === userRole && p.isDefault
    )
    
    // なければ汎用デフォルト
    if (!preset) {
      preset = presets.value.find(p => p.isDefault && !p.role)
    }
    
    // それもなければ基本レイアウト
    if (!preset) {
      preset = createBasicPreset()
    }
    
    return preset
  }
  
  // 基本プリセットの生成
  const createBasicPreset = (): DashboardPreset => {
    return {
      id: 'basic',
      name: '基本レイアウト',
      widgets: [
        {
          type: 'stats',
          title: '統計情報',
          position: { x: 0, y: 0, w: 12, h: 2 },
          config: {
            metrics: ['totalCases', 'activeCases', 'revenue', 'tasks']
          }
        },
        {
          type: 'data',
          title: '最近の案件',
          position: { x: 0, y: 2, w: 6, h: 6 },
          config: {
            tableId: 'cases',
            columns: ['title', 'client', 'status', 'deadline'],
            maxRows: 10,
            filters: [
              { field: 'status', operator: 'not_equals', value: 'closed' }
            ]
          }
        },
        {
          type: 'activity',
          title: 'アクティビティ',
          position: { x: 6, y: 2, w: 6, h: 6 },
          config: {
            activityTypes: ['case', 'document', 'task'],
            maxItems: 15
          }
        }
      ]
    }
  }
  
  // プリセットの適用
  const applyPreset = (preset: DashboardPreset) => {
    const { widgets, layout } = useDashboardLayout()
    
    // 既存のウィジェットをクリア
    widgets.value = []
    layout.value = []
    
    // プリセットのウィジェットを追加
    preset.widgets.forEach(presetWidget => {
      const widget: DashboardWidget = {
        id: `widget-${Date.now()}-${Math.random()}`,
        type: presetWidget.type as any,
        title: presetWidget.title,
        ...presetWidget.position,
        config: presetWidget.config
      }
      
      widgets.value.push(widget)
      layout.value.push({
        i: widget.id,
        ...presetWidget.position
      })
    })
    
    currentPreset.value = preset
  }
  
  // カスタムプリセットの保存
  const saveAsPreset = async (name: string, description?: string) => {
    const { widgets } = useDashboardLayout()
    
    const preset: DashboardPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      widgets: widgets.value.map(w => ({
        type: w.type,
        title: w.title,
        position: { x: w.x, y: w.y, w: w.w, h: w.h },
        config: w.config
      }))
    }
    
    // サーバーに保存
    const { data } = await $fetch('/api/v1/dashboard/presets', {
      method: 'POST',
      body: preset
    })
    
    presets.value.push(data)
    return data
  }
  
  // プリセットの削除
  const deletePreset = async (presetId: string) => {
    await $fetch(`/api/v1/dashboard/presets/${presetId}`, {
      method: 'DELETE'
    })
    
    const index = presets.value.findIndex(p => p.id === presetId)
    if (index > -1) {
      presets.value.splice(index, 1)
    }
  }
  
  // プリセットの共有
  const sharePreset = async (presetId: string) => {
    const { data } = await $fetch(`/api/v1/dashboard/presets/${presetId}/share`, {
      method: 'POST'
    })
    
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      preset.isShared = true
    }
    
    return data.shareUrl
  }
  
  return {
    presets: readonly(presets),
    currentPreset: readonly(currentPreset),
    fetchPresets,
    getDefaultPreset,
    applyPreset,
    saveAsPreset,
    deletePreset,
    sharePreset
  }
}
```

## 個別ウィジェットデータ管理

### useWidgetData
ウィジェットごとのデータ取得と更新

```typescript
// composables/useWidgetData.ts
export function useWidgetData(widget: Ref<DashboardWidget>) {
  const widgetData = ref<any>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const lastUpdated = ref<Date | null>(null)
  
  let refreshInterval: NodeJS.Timeout | null = null
  
  // データ取得
  const fetchData = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      switch (widget.value.type) {
        case 'data':
          widgetData.value = await fetchTableData(widget.value.config)
          break
        case 'stats':
          widgetData.value = await fetchStatsData(widget.value.config)
          break
        case 'activity':
          widgetData.value = await fetchActivityData(widget.value.config)
          break
        case 'quickActions':
          widgetData.value = widget.value.config.actions
          break
      }
      
      lastUpdated.value = new Date()
    } catch (e) {
      error.value = e as Error
      console.error(`Widget ${widget.value.id} data fetch error:`, e)
    } finally {
      isLoading.value = false
    }
  }
  
  // テーブルデータ取得
  const fetchTableData = async (config: WidgetConfig) => {
    const { data } = await $fetch(`/api/v1/tables/${config.tableId}/records`, {
      query: {
        filters: JSON.stringify(config.filters || []),
        sort: JSON.stringify(config.sort || {}),
        columns: config.columns?.join(','),
        limit: config.maxRows || 10
      }
    })
    return data
  }
  
  // 統計データ取得
  const fetchStatsData = async (config: WidgetConfig) => {
    const metrics = config.metrics || []
    const promises = metrics.map(metric => 
      $fetch(`/api/v1/dashboard/stats/${metric}`)
    )
    
    const results = await Promise.all(promises)
    return results.map((result, index) => ({
      key: metrics[index],
      ...result.data
    }))
  }
  
  // アクティビティデータ取得
  const fetchActivityData = async (config: WidgetConfig) => {
    const { data } = await $fetch('/api/v1/activities', {
      query: {
        types: config.activityTypes?.join(','),
        limit: config.maxItems || 20
      }
    })
    return data
  }
  
  // 自動更新の設定
  const setupAutoRefresh = () => {
    const interval = widget.value.config.refreshInterval
    if (interval && interval > 0) {
      refreshInterval = setInterval(() => {
        fetchData()
      }, interval * 1000)
    }
  }
  
  // クリーンアップ
  const cleanup = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }
  
  // リアクティブな更新
  watch(() => widget.value.config, () => {
    cleanup()
    fetchData()
    setupAutoRefresh()
  }, { deep: true })
  
  // 初期化
  onMounted(() => {
    fetchData()
    setupAutoRefresh()
  })
  
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    widgetData: readonly(widgetData),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),
    hasData: computed(() => !!widgetData.value),
    refreshData: fetchData
  }
}
```

## ウィジェット設定管理

### useWidgetConfig
ウィジェット設定の検証とデフォルト値

```typescript
// composables/useWidgetConfig.ts
export function useWidgetConfig() {
  // デフォルト設定の取得
  const getDefaultConfig = (type: string): WidgetConfig => {
    switch (type) {
      case 'data':
        return {
          tableId: '',
          columns: [],
          filters: [],
          sort: { field: 'created_at', order: 'desc' },
          maxRows: 10,
          defaultView: 'table',
          refreshInterval: 60
        }
      
      case 'stats':
        return {
          metrics: ['totalCases', 'activeCases', 'revenue'],
          format: 'number',
          showTrend: true,
          showSparkline: false,
          refreshInterval: 300
        }
      
      case 'activity':
        return {
          activityTypes: ['case', 'document', 'task'],
          maxItems: 20,
          showUser: true,
          showTimestamp: true,
          refreshInterval: 30
        }
      
      case 'quickActions':
        return {
          actions: [
            { id: 'new-case', label: '新規案件', icon: 'plus', route: '/cases/new' },
            { id: 'new-client', label: '新規顧客', icon: 'user-plus', route: '/clients/new' }
          ]
        }
      
      default:
        return {}
    }
  }
  
  // 設定のマージ
  const mergeConfig = (defaults: WidgetConfig, custom: Partial<WidgetConfig>): WidgetConfig => {
    return {
      ...defaults,
      ...custom,
      // 配列は置き換え（マージしない）
      ...(custom.columns && { columns: custom.columns }),
      ...(custom.filters && { filters: custom.filters }),
      ...(custom.metrics && { metrics: custom.metrics })
    }
  }
  
  // タイトルのデフォルト
  const getDefaultTitle = (type: string): string => {
    const titles = {
      data: 'データ',
      stats: '統計情報',
      activity: 'アクティビティ',
      quickActions: 'クイックアクション'
    }
    return titles[type] || 'ウィジェット'
  }
  
  return {
    getDefaultConfig,
    mergeConfig,
    getDefaultTitle
  }
}
```

## 型定義

```typescript
// types/dashboard.ts
export interface WidgetConfig {
  // データウィジェット用
  tableId?: string
  columns?: string[]
  filters?: Filter[]
  sort?: Sort
  maxRows?: number
  defaultView?: 'table' | 'kanban' | 'chart'
  groupBy?: string
  
  // 統計ウィジェット用
  metrics?: string[]
  format?: 'number' | 'currency' | 'percent'
  showTrend?: boolean
  showSparkline?: boolean
  
  // アクティビティウィジェット用
  activityTypes?: string[]
  maxItems?: number
  showUser?: boolean
  showTimestamp?: boolean
  
  // クイックアクション用
  actions?: QuickAction[]
  
  // 共通
  refreshInterval?: number // 秒単位
}

export interface Filter {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface Sort {
  field: string
  order: 'asc' | 'desc'
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  route?: string
  action?: () => void
}
```