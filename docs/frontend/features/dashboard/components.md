# ダッシュボード - コンポーネント設計

## コンポーネント階層

```
dashboard/
├── containers/               # コンテナコンポーネント
│   ├── DashboardLayout.vue
│   ├── DashboardWidget.vue
│   └── WidgetWrapper.vue
├── widgets/                  # ウィジェット種別
│   ├── DataWidget.vue       # テーブルデータ表示
│   ├── StatsWidget.vue      # 統計表示
│   ├── ActivityWidget.vue   # アクティビティ
│   └── QuickActionsWidget.vue
├── config/                   # 設定UI
│   ├── DashboardSettings.vue
│   ├── WidgetSelector.vue
│   └── WidgetConfig.vue
└── shared/                   # 共通コンポーネント
    ├── WidgetHeader.vue
    ├── WidgetLoading.vue
    └── EmptyWidget.vue
```

## コンテナコンポーネント

### DashboardLayout.vue
グリッドレイアウト全体を管理

```vue
<template>
  <div class="dashboard-layout">
    <!-- ツールバー -->
    <div class="dashboard-toolbar">
      <h1 class="text-2xl font-bold">{{ $t('dashboard.title') }}</h1>
      <div class="flex gap-2">
        <Button @click="openWidgetSelector">
          <Icon name="lucide:plus" />
          {{ $t('dashboard.addWidget') }}
        </Button>
        <Button variant="outline" @click="openSettings">
          <Icon name="lucide:settings" />
        </Button>
      </div>
    </div>

    <!-- グリッドレイアウト -->
    <GridLayout
      v-model:layout="layout"
      :col-num="12"
      :row-height="60"
      :is-draggable="isEditMode"
      :is-resizable="isEditMode"
      :responsive="true"
      :breakpoints="{ lg: 1200, md: 996, sm: 768 }"
      @layout-updated="saveLayout"
    >
      <GridItem
        v-for="widget in widgets"
        :key="widget.id"
        :x="widget.x"
        :y="widget.y"
        :w="widget.w"
        :h="widget.h"
        :i="widget.id"
        :min-w="widget.minW"
        :min-h="widget.minH"
      >
        <DashboardWidget
          :widget="widget"
          :is-edit-mode="isEditMode"
          @remove="removeWidget"
          @configure="configureWidget"
        />
      </GridItem>
    </GridLayout>
  </div>
</template>

<script setup lang="ts">
import { GridLayout, GridItem } from 'vue-grid-layout'
import { useDashboardLayout } from '~/composables/useDashboardLayout'

const {
  layout,
  widgets,
  isEditMode,
  addWidget,
  removeWidget,
  saveLayout
} = useDashboardLayout()
</script>
```

### DashboardWidget.vue
個別ウィジェットのコンテナ

```vue
<template>
  <Card class="dashboard-widget h-full flex flex-col">
    <!-- ウィジェットヘッダー -->
    <WidgetHeader
      :title="widget.title"
      :is-edit-mode="isEditMode"
      :is-loading="isLoading"
      :is-minimized="isMinimized"
      @configure="$emit('configure', widget)"
      @remove="$emit('remove', widget.id)"
      @toggle-minimize="toggleMinimize"
      @refresh="refreshData"
    />

    <!-- ウィジェットコンテンツ -->
    <CardContent 
      v-show="!isMinimized"
      class="flex-1 overflow-auto p-4"
    >
      <WidgetLoading v-if="isLoading" />
      <EmptyWidget v-else-if="!hasData" />
      <component
        v-else
        :is="widgetComponent"
        :config="widget.config"
        :data="widgetData"
      />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DataWidget from './widgets/DataWidget.vue'
import StatsWidget from './widgets/StatsWidget.vue'
import ActivityWidget from './widgets/ActivityWidget.vue'
import QuickActionsWidget from './widgets/QuickActionsWidget.vue'

const props = defineProps<{
  widget: Widget
  isEditMode: boolean
}>()

const widgetComponents = {
  data: DataWidget,
  stats: StatsWidget,
  activity: ActivityWidget,
  quickActions: QuickActionsWidget
}

const widgetComponent = computed(() => 
  widgetComponents[props.widget.type] || DataWidget
)

const { 
  widgetData, 
  isLoading, 
  hasData, 
  refreshData 
} = useWidgetData(props.widget)
</script>
```

## ウィジェットコンポーネント

### DataWidget.vue
テーブルデータを表示（テーブル機能のビューを利用）

```vue
<template>
  <div class="data-widget">
    <!-- ビュー切り替えタブ -->
    <Tabs v-model="viewType" class="mb-4">
      <TabsList>
        <TabsTrigger value="table">
          <Icon name="lucide:table" />
        </TabsTrigger>
        <TabsTrigger value="kanban">
          <Icon name="lucide:columns" />
        </TabsTrigger>
        <TabsTrigger value="chart">
          <Icon name="lucide:bar-chart" />
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <!-- テーブルビュー（table機能から） -->
    <TableView
      v-if="viewType === 'table'"
      :table-id="config.tableId"
      :filters="config.filters"
      :columns="config.columns"
      :sort="config.sort"
      :compact="true"
      :show-toolbar="false"
      :max-rows="config.maxRows || 10"
    />

    <!-- カンバンビュー（table機能から） -->
    <KanbanView
      v-else-if="viewType === 'kanban'"
      :table-id="config.tableId"
      :filters="config.filters"
      :group-by="config.groupBy"
      :compact="true"
      :max-cards="config.maxRows || 10"
    />

    <!-- チャートビュー -->
    <ChartView
      v-else-if="viewType === 'chart'"
      :data="chartData"
      :type="config.chartType"
      :options="config.chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { TableView, KanbanView } from '~/modules/table/components'
import ChartView from './ChartView.vue'

const props = defineProps<{
  config: DataWidgetConfig
  data: any
}>()

const viewType = ref(props.config.defaultView || 'table')

const chartData = computed(() => 
  transformToChartData(props.data, props.config)
)
</script>
```

### StatsWidget.vue
KPI統計カード表示

```vue
<template>
  <div class="stats-widget grid gap-4">
    <div
      v-for="stat in stats"
      :key="stat.key"
      class="stat-card"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">
            {{ stat.label }}
          </p>
          <p class="text-2xl font-bold">
            {{ formatValue(stat.value, stat.format) }}
          </p>
        </div>
        <div class="text-right">
          <Icon 
            :name="stat.icon" 
            class="h-8 w-8 text-muted-foreground"
          />
          <Badge 
            :variant="getTrendVariant(stat.trend)"
            v-if="stat.trend"
          >
            {{ formatTrend(stat.trend) }}
          </Badge>
        </div>
      </div>
      
      <!-- ミニチャート（オプション） -->
      <div v-if="stat.sparkline" class="mt-2">
        <Sparkline :data="stat.sparkline" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StatItem {
  key: string
  label: string
  value: number
  format?: 'number' | 'currency' | 'percent'
  icon: string
  trend?: number
  sparkline?: number[]
}

const props = defineProps<{
  config: StatsWidgetConfig
  data: StatItem[]
}>()

const stats = computed(() => props.data)

const formatValue = (value: number, format?: string) => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
      }).format(value)
    case 'percent':
      return `${value}%`
    default:
      return new Intl.NumberFormat('ja-JP').format(value)
  }
}

const getTrendVariant = (trend: number) => {
  if (trend > 0) return 'success'
  if (trend < 0) return 'destructive'
  return 'secondary'
}

const formatTrend = (trend: number) => {
  const prefix = trend > 0 ? '+' : ''
  return `${prefix}${trend}%`
}
</script>
```

### ActivityWidget.vue
最近のアクティビティ表示

```vue
<template>
  <div class="activity-widget">
    <ScrollArea class="h-full">
      <div class="space-y-4">
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="flex gap-3"
        >
          <!-- アクティビティアイコン -->
          <div 
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            :class="getActivityColor(activity.type)"
          >
            <Icon 
              :name="getActivityIcon(activity.type)" 
              class="h-4 w-4 text-white"
            />
          </div>

          <!-- アクティビティ内容 -->
          <div class="flex-1 space-y-1">
            <p class="text-sm">
              <span class="font-medium">{{ activity.user }}</span>
              {{ activity.action }}
              <span class="font-medium">{{ activity.target }}</span>
            </p>
            <p class="text-xs text-muted-foreground">
              {{ formatRelativeTime(activity.timestamp) }}
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { formatRelative } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Activity {
  id: string
  type: 'create' | 'update' | 'delete' | 'comment'
  user: string
  action: string
  target: string
  timestamp: Date
}

const props = defineProps<{
  config: ActivityWidgetConfig
  data: Activity[]
}>()

const activities = computed(() => props.data)

const getActivityIcon = (type: string) => {
  const icons = {
    create: 'lucide:plus',
    update: 'lucide:edit',
    delete: 'lucide:trash',
    comment: 'lucide:message-circle'
  }
  return icons[type] || 'lucide:activity'
}

const getActivityColor = (type: string) => {
  const colors = {
    create: 'bg-green-500',
    update: 'bg-blue-500',
    delete: 'bg-red-500',
    comment: 'bg-purple-500'
  }
  return colors[type] || 'bg-gray-500'
}

const formatRelativeTime = (date: Date) => {
  return formatRelative(date, new Date(), { locale: ja })
}
</script>
```

## 設定コンポーネント

### WidgetConfig.vue
ウィジェット設定ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ $t('dashboard.widgetConfig.title') }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-6">
        <!-- 基本設定 -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium">{{ $t('dashboard.widgetConfig.basic') }}</h3>
          
          <div>
            <Label>{{ $t('dashboard.widgetConfig.widgetTitle') }}</Label>
            <Input v-model="config.title" />
          </div>

          <div v-if="widget.type === 'data'">
            <Label>{{ $t('dashboard.widgetConfig.dataSource') }}</Label>
            <TableSelector v-model="config.tableId" />
          </div>
        </div>

        <!-- 表示設定 -->
        <div class="space-y-4" v-if="widget.type === 'data'">
          <h3 class="text-sm font-medium">{{ $t('dashboard.widgetConfig.display') }}</h3>
          
          <div>
            <Label>{{ $t('dashboard.widgetConfig.columns') }}</Label>
            <ColumnSelector 
              :table-id="config.tableId"
              v-model="config.columns"
            />
          </div>

          <div>
            <Label>{{ $t('dashboard.widgetConfig.maxRows') }}</Label>
            <Select v-model="config.maxRows">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="5">5行</SelectItem>
                <SelectItem :value="10">10行</SelectItem>
                <SelectItem :value="20">20行</SelectItem>
                <SelectItem :value="50">50行</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- フィルター設定 -->
        <div class="space-y-4" v-if="widget.type === 'data'">
          <h3 class="text-sm font-medium">{{ $t('dashboard.widgetConfig.filters') }}</h3>
          
          <FilterBuilder
            :table-id="config.tableId"
            v-model="config.filters"
          />
        </div>

        <!-- 更新設定 -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium">{{ $t('dashboard.widgetConfig.refresh') }}</h3>
          
          <div>
            <Label>{{ $t('dashboard.widgetConfig.refreshInterval') }}</Label>
            <Select v-model="config.refreshInterval">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="0">手動</SelectItem>
                <SelectItem :value="30">30秒</SelectItem>
                <SelectItem :value="60">1分</SelectItem>
                <SelectItem :value="300">5分</SelectItem>
                <SelectItem :value="600">10分</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ $t('common.cancel') }}
        </Button>
        <Button @click="save">
          {{ $t('common.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  widget: Widget
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'save': [WidgetConfig]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const config = ref<WidgetConfig>({
  ...props.widget.config
})

const save = () => {
  emit('save', config.value)
  isOpen.value = false
}

const cancel = () => {
  config.value = { ...props.widget.config }
  isOpen.value = false
}
</script>
```

## 共通コンポーネント

### WidgetHeader.vue
ウィジェットヘッダー

```vue
<template>
  <CardHeader class="widget-header flex flex-row items-center justify-between p-3">
    <h3 class="text-sm font-medium">{{ title }}</h3>
    
    <div class="flex items-center gap-1">
      <!-- 更新インジケーター -->
      <Loader2 
        v-if="isLoading"
        class="h-3 w-3 animate-spin text-muted-foreground"
      />
      
      <!-- アクションボタン -->
      <Button
        v-if="!isEditMode"
        size="icon"
        variant="ghost"
        class="h-6 w-6"
        @click="$emit('refresh')"
      >
        <Icon name="lucide:refresh-cw" class="h-3 w-3" />
      </Button>
      
      <Button
        size="icon"
        variant="ghost"
        class="h-6 w-6"
        @click="$emit('toggle-minimize')"
      >
        <Icon 
          :name="isMinimized ? 'lucide:maximize-2' : 'lucide:minimize-2'" 
          class="h-3 w-3"
        />
      </Button>
      
      <DropdownMenu v-if="isEditMode">
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" class="h-6 w-6">
            <Icon name="lucide:more-vertical" class="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="$emit('configure')">
            <Icon name="lucide:settings" class="h-4 w-4 mr-2" />
            設定
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            @click="$emit('remove')"
            class="text-destructive"
          >
            <Icon name="lucide:trash" class="h-4 w-4 mr-2" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </CardHeader>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  isEditMode: boolean
  isLoading: boolean
  isMinimized: boolean
}>()

defineEmits<{
  configure: []
  remove: []
  'toggle-minimize': []
  refresh: []
}>()
</script>
```