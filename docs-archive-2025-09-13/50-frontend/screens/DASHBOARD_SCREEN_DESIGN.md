# ダッシュボード画面設計

## 概要

ログイン後の最初の画面。各ユーザーの役割に応じた情報を一目で確認でき、カスタマイズ可能なウィジェットシステムを提供します。

## 画面構成

### レイアウト

```
┌──────────────────────────────────────────────────┐
│ ヘッダー（期日アラート・通知アイコン）            │
├──────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌──────────────────────┐ │
│ │ 案件サマリー       │ │ 今日のタスク       │ │
│ └────────────────────┘ └──────────────────────┘ │
│ ┌────────────────────┐ ┌──────────────────────┐ │
│ │ 最近の活動         │ │ 売上グラフ         │ │
│ └────────────────────┘ └──────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ カレンダー（期日・予定）                     │ │
│ └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## 使用ライブラリ

### コアライブラリ
- **VueUse**: リアクティブなユーティリティ
- **vue-grid-layout**: ドラッグ&ドロップ可能なグリッドレイアウト
- **@tanstack/vue-query**: サーバー状態管理とキャッシング

### UIコンポーネント
- **shadcn-vue**: ベースUIコンポーネント
- **v-calendar**: カレンダーウィジェット
- **vue-chartjs**: グラフ表示（Chart.js wrapper）

### アニメーション
- **@vueuse/motion**: スムーズなアニメーション
- **vue-transitions**: ページ遷移効果

## 状態管理

```typescript
// stores/dashboard.ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { Widget, WidgetLayout } from '~/types/dashboard'

interface DashboardState {
  widgets: Widget[]
  layouts: Record<string, WidgetLayout[]>
  currentLayout: string
  isEditMode: boolean
  refreshInterval: number
  lastRefresh: Date | null
}

export const useDashboardStore = defineStore('dashboard', {
  state: (): DashboardState => ({
    widgets: [],
    layouts: useStorage('dashboard_layouts', {
      default: [],
      compact: [],
      custom: []
    }),
    currentLayout: useStorage('dashboard_current_layout', 'default'),
    isEditMode: false,
    refreshInterval: 300000, // 5分
    lastRefresh: null
  }),

  getters: {
    activeWidgets: (state) => {
      const layout = state.layouts[state.currentLayout] || []
      return layout
        .map(l => {
          const widget = state.widgets.find(w => w.id === l.i)
          return widget ? { ...widget, layout: l } : null
        })
        .filter(Boolean)
    },

    availableWidgets: (state) => {
      const activeIds = state.layouts[state.currentLayout]?.map(l => l.i) || []
      return state.widgets.filter(w => !activeIds.includes(w.id))
    }
  },

  actions: {
    async loadWidgets() {
      const { data } = await $fetch('/api/v1/dashboard/widgets')
      this.widgets = data
      
      // デフォルトレイアウトがない場合は作成
      if (!this.layouts.default?.length) {
        this.layouts.default = this.createDefaultLayout()
      }
    },

    updateLayout(layout: WidgetLayout[]) {
      this.layouts[this.currentLayout] = layout
    },

    addWidget(widgetId: string, position?: { x: number, y: number }) {
      const widget = this.widgets.find(w => w.id === widgetId)
      if (!widget) return

      const newLayout: WidgetLayout = {
        i: widgetId,
        x: position?.x || 0,
        y: position?.y || 0,
        w: widget.defaultWidth || 4,
        h: widget.defaultHeight || 4,
        minW: widget.minWidth || 2,
        minH: widget.minHeight || 2
      }

      this.layouts[this.currentLayout].push(newLayout)
    },

    removeWidget(widgetId: string) {
      const index = this.layouts[this.currentLayout].findIndex(l => l.i === widgetId)
      if (index > -1) {
        this.layouts[this.currentLayout].splice(index, 1)
      }
    },

    toggleEditMode() {
      this.isEditMode = !this.isEditMode
    },

    createDefaultLayout(): WidgetLayout[] {
      const { auth } = useStore()
      const role = auth.user?.role || 'lawyer'

      // ロール別デフォルトレイアウト
      const layouts = {
        lawyer: [
          { i: 'case-summary', x: 0, y: 0, w: 6, h: 4 },
          { i: 'today-tasks', x: 6, y: 0, w: 6, h: 4 },
          { i: 'recent-activity', x: 0, y: 4, w: 6, h: 6 },
          { i: 'calendar', x: 6, y: 4, w: 6, h: 6 }
        ],
        clerk: [
          { i: 'case-summary', x: 0, y: 0, w: 4, h: 4 },
          { i: 'document-queue', x: 4, y: 0, w: 4, h: 4 },
          { i: 'expense-summary', x: 8, y: 0, w: 4, h: 4 },
          { i: 'recent-activity', x: 0, y: 4, w: 12, h: 6 }
        ],
        client: [
          { i: 'my-cases', x: 0, y: 0, w: 12, h: 4 },
          { i: 'case-timeline', x: 0, y: 4, w: 8, h: 6 },
          { i: 'next-hearings', x: 8, y: 4, w: 4, h: 6 }
        ]
      }

      return layouts[role] || layouts.lawyer
    }
  }
})
```

## コンポーネント設計

### メインページ

```vue
<!-- pages/dashboard.vue -->
<template>
  <div class="dashboard-page">
    <!-- ヘッダーアラート -->
    <DashboardAlerts />
    
    <!-- ツールバー -->
    <div class="dashboard-toolbar">
      <h1 class="text-2xl font-bold">ダッシュボード</h1>
      
      <div class="flex items-center gap-4">
        <!-- 自動更新インジケーター -->
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw :class="{ 'animate-spin': isRefreshing }" class="h-4 w-4" />
          <span>{{ nextRefreshIn }}</span>
        </div>
        
        <!-- レイアウト切り替え -->
        <Select v-model="currentLayout">
          <SelectTrigger class="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">標準</SelectItem>
            <SelectItem value="compact">コンパクト</SelectItem>
            <SelectItem value="custom">カスタム</SelectItem>
          </SelectContent>
        </Select>
        
        <!-- 編集モード切り替え -->
        <Button
          variant="outline"
          size="sm"
          @click="toggleEditMode"
        >
          <Settings class="h-4 w-4 mr-2" />
          {{ isEditMode ? '完了' : 'カスタマイズ' }}
        </Button>
      </div>
    </div>
    
    <!-- ウィジェットグリッド -->
    <div class="dashboard-grid">
      <grid-layout
        v-model:layout="layout"
        :col-num="12"
        :row-height="60"
        :is-draggable="isEditMode"
        :is-resizable="isEditMode"
        :margin="[16, 16]"
        :use-css-transforms="true"
        @layout-updated="onLayoutUpdate"
      >
        <grid-item
          v-for="widget in activeWidgets"
          :key="widget.id"
          :x="widget.layout.x"
          :y="widget.layout.y"
          :w="widget.layout.w"
          :h="widget.layout.h"
          :i="widget.id"
          :min-w="widget.minWidth || 2"
          :min-h="widget.minHeight || 2"
          class="dashboard-widget"
        >
          <DashboardWidget
            :widget="widget"
            :is-edit-mode="isEditMode"
            @remove="removeWidget(widget.id)"
          />
        </grid-item>
      </grid-layout>
    </div>
    
    <!-- ウィジェット追加パネル（編集モード時） -->
    <Transition name="slide-up">
      <div v-if="isEditMode" class="widget-drawer">
        <h3 class="text-sm font-medium mb-3">ウィジェットを追加</h3>
        <div class="grid grid-cols-4 gap-3">
          <div
            v-for="widget in availableWidgets"
            :key="widget.id"
            class="widget-card"
            @click="addWidget(widget.id)"
          >
            <component :is="widget.icon" class="h-8 w-8 mb-2" />
            <span class="text-xs">{{ widget.name }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { GridLayout, GridItem } from 'vue-grid-layout'
import { useIntervalFn, useNow } from '@vueuse/core'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

const store = useDashboardStore()
const { activeWidgets, availableWidgets, isEditMode, currentLayout } = storeToRefs(store)

// レイアウト管理
const layout = computed({
  get: () => store.layouts[currentLayout.value] || [],
  set: (value) => store.updateLayout(value)
})

// 自動更新
const now = useNow()
const isRefreshing = ref(false)

const nextRefreshIn = computed(() => {
  if (!store.lastRefresh) return '更新待機中'
  const nextRefresh = new Date(store.lastRefresh.getTime() + store.refreshInterval)
  return formatDistanceToNow(nextRefresh, { locale: ja, addSuffix: true })
})

const refresh = async () => {
  isRefreshing.value = true
  try {
    // 各ウィジェットのデータを更新
    await Promise.all(
      activeWidgets.value.map(widget => 
        widget.refresh?.()
      )
    )
    store.lastRefresh = new Date()
  } finally {
    isRefreshing.value = false
  }
}

// 5分ごとに自動更新
useIntervalFn(refresh, store.refreshInterval)

// 初期ロード
onMounted(async () => {
  await store.loadWidgets()
  await refresh()
})

// レイアウト更新
const onLayoutUpdate = (newLayout: any[]) => {
  store.updateLayout(newLayout)
}

// ウィジェット操作
const { toggleEditMode, addWidget, removeWidget } = store
</script>

<style scoped>
.dashboard-page {
  @apply p-6 space-y-6;
}

.dashboard-toolbar {
  @apply flex items-center justify-between;
}

.dashboard-grid {
  @apply relative min-h-[600px];
}

.dashboard-widget {
  @apply bg-card border rounded-lg shadow-sm transition-shadow;
  
  &:hover {
    @apply shadow-md;
  }
}

.widget-drawer {
  @apply fixed bottom-0 left-0 right-0 bg-background border-t p-6 shadow-lg;
  z-index: 100;
}

.widget-card {
  @apply flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer
         hover:bg-accent transition-colors;
}

/* トランジション */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
```

### ウィジェットコンテナ

```vue
<!-- components/dashboard/DashboardWidget.vue -->
<template>
  <Card class="h-full relative">
    <!-- ウィジェットヘッダー -->
    <div class="widget-header">
      <div class="flex items-center gap-2">
        <component :is="widget.icon" class="h-4 w-4 text-muted-foreground" />
        <h3 class="font-semibold">{{ widget.name }}</h3>
      </div>
      
      <div class="flex items-center gap-1">
        <!-- 更新ボタン -->
        <Button
          v-if="widget.refreshable"
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          @click="refresh"
          :disabled="isLoading"
        >
          <RefreshCw :class="{ 'animate-spin': isLoading }" class="h-4 w-4" />
        </Button>
        
        <!-- 設定ボタン -->
        <Button
          v-if="widget.configurable"
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          @click="openConfig"
        >
          <Settings class="h-4 w-4" />
        </Button>
        
        <!-- 削除ボタン（編集モード時） -->
        <Button
          v-if="isEditMode"
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          @click="$emit('remove')"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>
    
    <!-- ウィジェットコンテンツ -->
    <CardContent class="widget-content">
      <Suspense>
        <component
          :is="widgetComponent"
          :config="widget.config"
          @update:config="updateConfig"
        />
        
        <template #fallback>
          <div class="flex items-center justify-center h-full">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </template>
      </Suspense>
    </CardContent>
    
    <!-- エラー表示 -->
    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-background/80">
      <div class="text-center">
        <AlertCircle class="h-8 w-8 text-destructive mx-auto mb-2" />
        <p class="text-sm text-muted-foreground">データの読み込みに失敗しました</p>
        <Button size="sm" variant="outline" class="mt-2" @click="refresh">
          再試行
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { Widget } from '~/types/dashboard'

const props = defineProps<{
  widget: Widget
  isEditMode: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

// 動的コンポーネント読み込み
const widgetComponent = defineAsyncComponent(() => 
  import(`~/components/dashboard/widgets/${props.widget.component}.vue`)
)

// ウィジェットデータ管理
const { isLoading, error, refresh } = useWidget(props.widget.id)

// 設定モーダル
const openConfig = () => {
  const { openModal } = useUIStore()
  openModal(`widget-config-${props.widget.id}`)
}

// 設定更新
const updateConfig = (newConfig: any) => {
  // ウィジェット設定を更新
  props.widget.config = { ...props.widget.config, ...newConfig }
}
</script>

<style scoped>
.widget-header {
  @apply flex items-center justify-between p-4 border-b;
}

.widget-content {
  @apply p-4 h-[calc(100%-64px)] overflow-auto;
}
</style>
```

### 個別ウィジェット例

#### 案件サマリーウィジェット

```vue
<!-- components/dashboard/widgets/CaseSummaryWidget.vue -->
<template>
  <div class="case-summary-widget">
    <div class="grid grid-cols-2 gap-4">
      <div
        v-for="stat in statistics"
        :key="stat.key"
        class="stat-card"
        @click="navigateToCases(stat.filter)"
      >
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-trend" :class="stat.trendClass">
          <component :is="stat.trendIcon" class="h-4 w-4" />
          <span>{{ stat.trend }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { useQuery } from '@tanstack/vue-query'

const props = defineProps<{
  config?: {
    showTrends?: boolean
  }
}>()

// データ取得
const { data: stats } = useQuery({
  queryKey: ['dashboard', 'case-summary'],
  queryFn: () => $fetch('/api/v1/dashboard/statistics/cases'),
  refetchInterval: 5 * 60 * 1000 // 5分
})

const statistics = computed(() => [
  {
    key: 'total',
    label: '総案件数',
    value: stats.value?.total || 0,
    trend: '+3',
    trendIcon: TrendingUp,
    trendClass: 'text-green-600',
    filter: {}
  },
  {
    key: 'active',
    label: '進行中',
    value: stats.value?.active || 0,
    trend: '+1',
    trendIcon: TrendingUp,
    trendClass: 'text-green-600',
    filter: { status: 'active' }
  },
  {
    key: 'pending',
    label: '保留中',
    value: stats.value?.pending || 0,
    trend: '0',
    trendIcon: Minus,
    trendClass: 'text-gray-600',
    filter: { status: 'pending' }
  },
  {
    key: 'urgent',
    label: '要対応',
    value: stats.value?.urgent || 0,
    trend: '-2',
    trendIcon: TrendingDown,
    trendClass: 'text-red-600',
    filter: { priority: 'urgent' }
  }
])

// 案件一覧へ遷移
const navigateToCases = (filter: any) => {
  const { cases } = useStore()
  cases.updateFilters(filter)
  navigateTo('/cases')
}
</script>

<style scoped>
.stat-card {
  @apply p-4 border rounded-lg cursor-pointer transition-colors
         hover:bg-accent;
}

.stat-value {
  @apply text-3xl font-bold;
}

.stat-label {
  @apply text-sm text-muted-foreground mt-1;
}

.stat-trend {
  @apply flex items-center gap-1 text-sm mt-2;
}
</style>
```

#### カレンダーウィジェット

```vue
<!-- components/dashboard/widgets/CalendarWidget.vue -->
<template>
  <div class="calendar-widget">
    <VCalendar
      v-model="selectedDate"
      :attributes="attributes"
      :locale="locale"
      class="w-full"
      @dayclick="onDayClick"
    />
    
    <!-- 選択日のイベント -->
    <div v-if="selectedEvents.length" class="mt-4 space-y-2">
      <h4 class="text-sm font-medium">{{ formatDate(selectedDate) }}の予定</h4>
      <div
        v-for="event in selectedEvents"
        :key="event.id"
        class="event-item"
        @click="navigateToCase(event.caseId)"
      >
        <div class="event-time">{{ event.time }}</div>
        <div class="event-content">
          <div class="event-title">{{ event.title }}</div>
          <div class="event-case">{{ event.caseNumber }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar as VCalendar } from 'v-calendar'
import 'v-calendar/style.css'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

// カレンダーデータ
const { data: events } = useQuery({
  queryKey: ['dashboard', 'calendar-events'],
  queryFn: () => $fetch('/api/v1/dashboard/calendar-events')
})

const selectedDate = ref(new Date())
const locale = ref('ja')

// カレンダー属性
const attributes = computed(() => {
  if (!events.value) return []
  
  return events.value.map(event => ({
    key: event.id,
    dates: new Date(event.date),
    dot: {
      color: event.type === 'hearing' ? 'red' : 'blue'
    },
    popover: {
      label: event.title
    },
    customData: event
  }))
})

// 選択日のイベント
const selectedEvents = computed(() => {
  if (!events.value) return []
  
  const selected = format(selectedDate.value, 'yyyy-MM-dd')
  return events.value.filter(e => e.date === selected)
})

// 日付フォーマット
const formatDate = (date: Date) => {
  return format(date, 'M月d日(E)', { locale: ja })
}

// イベントハンドラー
const onDayClick = (day: any) => {
  selectedDate.value = day.date
}

const navigateToCase = (caseId: string) => {
  navigateTo(`/cases/${caseId}`)
}
</script>

<style scoped>
.event-item {
  @apply flex gap-3 p-3 border rounded-lg cursor-pointer
         hover:bg-accent transition-colors;
}

.event-time {
  @apply text-sm font-medium whitespace-nowrap;
}

.event-content {
  @apply flex-1 min-w-0;
}

.event-title {
  @apply text-sm font-medium truncate;
}

.event-case {
  @apply text-xs text-muted-foreground;
}

/* v-calendarのスタイル調整 */
:deep(.vc-container) {
  --vc-accent-600: hsl(var(--primary));
  --vc-accent-500: hsl(var(--primary));
  --vc-accent-400: hsl(var(--primary));
}
</style>
```

## カスタムコンポーザブル

```typescript
// composables/useWidget.ts
export const useWidget = (widgetId: string) => {
  const queryClient = useQueryClient()
  
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ['widget', widgetId],
    queryFn: () => $fetch(`/api/v1/dashboard/widgets/${widgetId}/data`),
    staleTime: 60 * 1000, // 1分
    cacheTime: 5 * 60 * 1000 // 5分
  })
  
  const refresh = async () => {
    await refetch()
    
    // 関連するクエリも更新
    const relatedKeys = getRelatedQueryKeys(widgetId)
    relatedKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key })
    })
  }
  
  return {
    isLoading,
    error,
    data,
    refresh
  }
}

// composables/useDashboardShortcuts.ts
export const useDashboardShortcuts = () => {
  const { isEditMode } = storeToRefs(useDashboardStore())
  
  // キーボードショートカット
  whenever(
    () => !isEditMode.value,
    () => {
      // R: リフレッシュ
      useEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          // すべてのウィジェットをリフレッシュ
          refreshAllWidgets()
        }
      })
      
      // E: 編集モード
      useEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          toggleEditMode()
        }
      })
    }
  )
}
```

## パフォーマンス最適化

### 1. 遅延読み込み
```typescript
// ウィジェットの動的インポート
const widgetModules = import.meta.glob('~/components/dashboard/widgets/*.vue')
```

### 2. 仮想スクロール
```vue
<!-- 大量データを扱うウィジェット -->
<VirtualList
  :data="items"
  :height="400"
  :item-height="60"
>
  <template #default="{ item }">
    <ListItem :item="item" />
  </template>
</VirtualList>
```

### 3. メモ化
```typescript
// 重い計算のメモ化
const heavyComputation = useMemoize((data: any[]) => {
  // 複雑な集計処理
  return processData(data)
})
```

## レスポンシブ対応

```typescript
// composables/useResponsiveDashboard.ts
export const useResponsiveDashboard = () => {
  const { width } = useWindowSize()
  
  const gridCols = computed(() => {
    if (width.value < 640) return 4  // スマホ
    if (width.value < 1024) return 8  // タブレット
    return 12 // デスクトップ
  })
  
  const compactMode = computed(() => width.value < 768)
  
  return {
    gridCols,
    compactMode
  }
}
```

## まとめ

このダッシュボード設計により：

1. **カスタマイズ性**: ドラッグ&ドロップでレイアウト変更
2. **リアルタイム性**: 自動更新とWebSocket連携
3. **パフォーマンス**: 遅延読み込みとキャッシング
4. **UX**: スムーズなアニメーションと直感的な操作
5. **拡張性**: 新しいウィジェットの追加が容易