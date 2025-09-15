# ダッシュボード - 画面実装

## ページ構成

```
pages/
├── dashboard/
│   ├── index.vue            # メインダッシュボード
│   ├── [role].vue          # ロール別ダッシュボード
│   └── settings.vue        # ダッシュボード設定
```

## メインダッシュボード画面

### pages/dashboard/index.vue
ホーム画面として機能するメインダッシュボード

```vue
<template>
  <div class="dashboard-page">
    <!-- ページヘッダー -->
    <div class="dashboard-header mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">
            {{ greeting }}, {{ userName }}
          </h1>
          <p class="text-muted-foreground mt-1">
            {{ currentDate }}
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- 編集モード切り替え -->
          <Button
            variant="outline"
            @click="toggleEditMode"
            v-if="canEditDashboard"
          >
            <Icon :name="isEditMode ? 'lucide:save' : 'lucide:edit'" class="mr-2" />
            {{ isEditMode ? '完了' : 'カスタマイズ' }}
          </Button>
          
          <!-- プリセット選択 -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Icon name="lucide:layout-dashboard" class="mr-2" />
                レイアウト
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel>プリセット</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                v-for="preset in presets"
                :key="preset.id"
                @click="applyPreset(preset)"
              >
                <Icon name="lucide:layout" class="mr-2" />
                {{ preset.name }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="saveCurrentAsPreset">
                <Icon name="lucide:save" class="mr-2" />
                現在のレイアウトを保存
              </DropdownMenuItem>
              <DropdownMenuItem @click="resetToDefault">
                <Icon name="lucide:rotate-ccw" class="mr-2" />
                デフォルトに戻す
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <!-- ウィジェット追加 -->
          <Button
            @click="openWidgetSelector"
            v-if="isEditMode"
          >
            <Icon name="lucide:plus" class="mr-2" />
            ウィジェット追加
          </Button>
        </div>
      </div>
    </div>
    
    <!-- ダッシュボードレイアウト -->
    <DashboardLayout
      :is-edit-mode="isEditMode"
      @widget-add="handleWidgetAdd"
      @widget-remove="handleWidgetRemove"
      @widget-configure="handleWidgetConfigure"
    />
    
    <!-- ウィジェット追加ダイアログ -->
    <WidgetSelector
      v-model:open="showWidgetSelector"
      @select="addWidget"
    />
    
    <!-- ウィジェット設定ダイアログ -->
    <WidgetConfig
      v-if="configuringWidget"
      v-model:open="showWidgetConfig"
      :widget="configuringWidget"
      @save="updateWidgetConfig"
    />
    
    <!-- プリセット保存ダイアログ -->
    <Dialog v-model:open="showPresetSaveDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>レイアウトを保存</DialogTitle>
          <DialogDescription>
            現在のレイアウトをプリセットとして保存します
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label>プリセット名</Label>
            <Input v-model="presetName" placeholder="例: 営業チーム用" />
          </div>
          <div>
            <Label>説明（任意）</Label>
            <Textarea 
              v-model="presetDescription" 
              placeholder="このレイアウトの用途を説明"
              rows="3"
            />
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox v-model="sharePreset" id="share" />
            <Label for="share">他のユーザーと共有</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showPresetSaveDialog = false">
            キャンセル
          </Button>
          <Button @click="savePreset">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import DashboardLayout from '~/modules/dashboard/components/DashboardLayout.vue'
import WidgetSelector from '~/modules/dashboard/components/WidgetSelector.vue'
import WidgetConfig from '~/modules/dashboard/components/WidgetConfig.vue'

// ページメタデータ
definePageMeta({
  title: 'dashboard.title',
  requiresAuth: true
})

// Composables
const { user } = useAuth()
const { 
  widgets,
  isEditMode,
  initializeLayout,
  addWidget,
  removeWidget,
  updateWidget,
  resetLayout
} = useDashboardLayout()

const {
  presets,
  fetchPresets,
  applyPreset,
  saveAsPreset
} = useDashboardPresets()

// 状態
const showWidgetSelector = ref(false)
const showWidgetConfig = ref(false)
const showPresetSaveDialog = ref(false)
const configuringWidget = ref<Widget | null>(null)
const presetName = ref('')
const presetDescription = ref('')
const sharePreset = ref(false)

// 計算プロパティ
const userName = computed(() => user.value?.name || 'ユーザー')
const currentDate = computed(() => 
  format(new Date(), 'yyyy年M月d日(EEEE)', { locale: ja })
)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'おはようございます'
  if (hour < 18) return 'こんにちは'
  return 'こんばんは'
})

const canEditDashboard = computed(() => {
  // 権限チェック
  return usePermissions().can('dashboard:customize')
})

// メソッド
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (!isEditMode.value) {
    // 編集完了時に保存
    const { saveLayout } = useDashboardLayout()
    saveLayout()
  }
}

const openWidgetSelector = () => {
  showWidgetSelector.value = true
}

const handleWidgetAdd = (type: string) => {
  const widget = addWidget(type)
  // 新規ウィジェットは自動的に設定を開く
  handleWidgetConfigure(widget)
}

const handleWidgetRemove = (widgetId: string) => {
  const confirm = window.confirm('このウィジェットを削除しますか？')
  if (confirm) {
    removeWidget(widgetId)
  }
}

const handleWidgetConfigure = (widget: Widget) => {
  configuringWidget.value = widget
  showWidgetConfig.value = true
}

const updateWidgetConfig = (config: WidgetConfig) => {
  if (configuringWidget.value) {
    updateWidget(configuringWidget.value.id, { config })
  }
}

const saveCurrentAsPreset = () => {
  presetName.value = ''
  presetDescription.value = ''
  sharePreset.value = false
  showPresetSaveDialog.value = true
}

const savePreset = async () => {
  try {
    await saveAsPreset(presetName.value, presetDescription.value)
    
    if (sharePreset.value) {
      // 共有処理
      const { sharePreset } = useDashboardPresets()
      await sharePreset(preset.id)
    }
    
    showPresetSaveDialog.value = false
    
    const { toast } = useToast()
    toast({
      title: 'プリセットを保存しました',
      variant: 'success'
    })
  } catch (error) {
    const { toast } = useToast()
    toast({
      title: 'エラー',
      description: 'プリセットの保存に失敗しました',
      variant: 'destructive'
    })
  }
}

const resetToDefault = async () => {
  const confirm = window.confirm('デフォルトレイアウトに戻しますか？現在の配置は失われます。')
  if (confirm) {
    await resetLayout()
  }
}

// 初期化
onMounted(async () => {
  await initializeLayout()
  await fetchPresets()
})
</script>

<style scoped>
.dashboard-page {
  @apply container mx-auto py-6;
}

.dashboard-header {
  @apply px-4;
}

/* 編集モード時のスタイル */
:deep(.edit-mode) {
  .grid-item {
    @apply border-2 border-dashed border-primary/30;
  }
  
  .widget-header {
    @apply cursor-move;
  }
}
</style>
```

## レイアウトシステム

### グリッドレイアウト実装
Vue Grid Layoutを使用した12列グリッドシステム

```typescript
// レイアウト設定
const layoutConfig = {
  // グリッド設定
  colNum: 12,           // 列数
  rowHeight: 60,        // 行の高さ（px）
  margin: [16, 16],     // マージン [x, y]
  
  // レスポンシブ設定
  breakpoints: {
    lg: 1200,   // デスクトップ
    md: 996,    // タブレット
    sm: 768,    // モバイル
  },
  
  cols: {
    lg: 12,
    md: 8,
    sm: 4,
  },
  
  // ウィジェットサイズ制限
  defaultSizes: {
    data: { w: 6, h: 6, minW: 3, minH: 3, maxW: 12, maxH: 12 },
    stats: { w: 3, h: 2, minW: 2, minH: 2, maxW: 6, maxH: 4 },
    activity: { w: 4, h: 5, minW: 3, minH: 3, maxW: 6, maxH: 10 },
    quickActions: { w: 3, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 4 }
  }
}
```

### ドラッグ&ドロップ実装
```typescript
// ドラッグ&ドロップハンドラー
const handleDragStart = (event: DragEvent, widget: Widget) => {
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('widgetId', widget.id)
  isDragging.value = true
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

const handleDrop = (event: DragEvent, targetPosition: Position) => {
  event.preventDefault()
  const widgetId = event.dataTransfer!.getData('widgetId')
  
  updateWidget(widgetId, {
    x: targetPosition.x,
    y: targetPosition.y
  })
  
  isDragging.value = false
}
```

### リサイズ実装
```typescript
// リサイズハンドラー
const handleResize = (
  widget: Widget,
  newWidth: number,
  newHeight: number
) => {
  // サイズ制限のチェック
  const constraints = layoutConfig.defaultSizes[widget.type]
  const width = Math.max(constraints.minW, Math.min(newWidth, constraints.maxW))
  const height = Math.max(constraints.minH, Math.min(newHeight, constraints.maxH))
  
  updateWidget(widget.id, {
    w: width,
    h: height
  })
}
```

## ウィジェット統合

### テーブルビューの組み込み
```vue
<!-- テーブルウィジェット内でのTableView使用 -->
<template>
  <div class="table-widget">
    <TableView
      :table-id="config.tableId"
      :filters="config.filters"
      :columns="visibleColumns"
      :sort="config.sort"
      :compact="true"
      :show-toolbar="false"
      :show-pagination="false"
      :max-rows="config.maxRows"
      :class="{ 'pointer-events-none': isEditMode }"
      @row-click="handleRowClick"
    />
  </div>
</template>

<script setup lang="ts">
// table機能のコンポーネントをインポート
import { TableView } from '~/modules/table/components'

const props = defineProps<{
  config: DataWidgetConfig
  isEditMode: boolean
}>()

// コンパクト表示用に列を制限
const visibleColumns = computed(() => {
  // ダッシュボードでは最大5列まで
  return props.config.columns?.slice(0, 5) || []
})

const handleRowClick = (row: any) => {
  if (!props.isEditMode) {
    // 詳細ページへ遷移
    navigateTo(`/tables/${props.config.tableId}/records/${row.id}`)
  }
}
</script>
```

## パフォーマンス最適化

### 遅延ローディング
```typescript
// ウィジェットの遅延ローディング
const loadWidget = async (widget: Widget) => {
  // ビューポート内にあるかチェック
  const isInViewport = useIntersectionObserver(
    widgetRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting) {
        // データを取得
        fetchWidgetData(widget)
      }
    }
  )
}
```

### 仮想スクロール
```vue
<!-- 大量のウィジェットがある場合 -->
<template>
  <VirtualList
    :items="widgets"
    :item-height="240"
    :buffer="2"
  >
    <template #default="{ item }">
      <DashboardWidget :widget="item" />
    </template>
  </VirtualList>
</template>
```

### キャッシュ戦略
```typescript
// ウィジェットデータのキャッシュ
const widgetCache = new Map<string, CachedData>()

interface CachedData {
  data: any
  timestamp: number
  ttl: number
}

const getCachedData = (widgetId: string): any | null => {
  const cached = widgetCache.get(widgetId)
  if (!cached) return null
  
  const isExpired = Date.now() - cached.timestamp > cached.ttl * 1000
  if (isExpired) {
    widgetCache.delete(widgetId)
    return null
  }
  
  return cached.data
}

const setCachedData = (widgetId: string, data: any, ttl: number = 60) => {
  widgetCache.set(widgetId, {
    data,
    timestamp: Date.now(),
    ttl
  })
}
```

## アクセシビリティ

### キーボード操作
```typescript
// キーボードショートカット
const keyboardShortcuts = {
  'cmd+e': () => toggleEditMode(),
  'cmd+a': () => openWidgetSelector(),
  'cmd+s': () => saveLayout(),
  'escape': () => {
    if (isEditMode.value) {
      isEditMode.value = false
    }
  }
}

useEventListener('keydown', (event: KeyboardEvent) => {
  const key = getKeyCombo(event)
  const handler = keyboardShortcuts[key]
  if (handler) {
    event.preventDefault()
    handler()
  }
})
```

### ARIA属性
```vue
<template>
  <div
    role="region"
    aria-label="ダッシュボード"
    class="dashboard-layout"
  >
    <div
      v-for="widget in widgets"
      :key="widget.id"
      :role="isEditMode ? 'application' : 'article'"
      :aria-label="`${widget.title}ウィジェット`"
      :tabindex="isEditMode ? 0 : -1"
      @keydown="handleWidgetKeydown($event, widget)"
    >
      <DashboardWidget :widget="widget" />
    </div>
  </div>
</template>
```

## レスポンシブ対応

### ブレークポイント処理
```typescript
// 画面サイズに応じたレイアウト調整
const { width } = useWindowSize()

const currentBreakpoint = computed(() => {
  if (width.value >= 1200) return 'lg'
  if (width.value >= 996) return 'md'
  return 'sm'
})

const adjustedLayout = computed(() => {
  return widgets.value.map(widget => {
    const adjusted = { ...widget }
    
    // モバイルでは全幅表示
    if (currentBreakpoint.value === 'sm') {
      adjusted.w = 4  // 4列グリッド
      adjusted.x = 0
    }
    
    return adjusted
  })
})
```

### モバイル最適化
```vue
<template>
  <!-- モバイル用簡略表示 -->
  <div v-if="isMobile" class="mobile-dashboard">
    <div v-for="widget in priorityWidgets" :key="widget.id">
      <MobileWidget :widget="widget" />
    </div>
    
    <Button
      @click="showAllWidgets = !showAllWidgets"
      class="w-full"
    >
      {{ showAllWidgets ? '折りたたむ' : 'すべて表示' }}
    </Button>
    
    <div v-if="showAllWidgets">
      <div v-for="widget in otherWidgets" :key="widget.id">
        <MobileWidget :widget="widget" />
      </div>
    </div>
  </div>
  
  <!-- デスクトップ用フル表示 -->
  <div v-else>
    <DashboardLayout />
  </div>
</template>

<script setup lang="ts">
const { isMobile } = useDevice()

// モバイルでは重要なウィジェットを優先表示
const priorityWidgets = computed(() => 
  widgets.value
    .filter(w => w.priority === 'high')
    .slice(0, 3)
)

const otherWidgets = computed(() =>
  widgets.value.filter(w => w.priority !== 'high')
)
</script>
```