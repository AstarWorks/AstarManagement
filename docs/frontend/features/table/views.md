# テーブル機能 - ビュー表示

## サポートするビュー

### 1. テーブルビュー（実装済み）
従来のスプレッドシート形式の表示

```vue
<template>
  <div class="table-view">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            v-for="column in columns"
            :key="column.id"
            @click="toggleSort(column)"
          >
            {{ column.name }}
            <SortIndicator :direction="getSortDirection(column)" />
          </TableHead>
        </TableRow>
      </TableHeader>
      
      <TableBody>
        <TableRow v-for="record in records" :key="record.id">
          <TableCell
            v-for="column in columns"
            :key="column.id"
          >
            <EditableCell
              :value="record.data[column.key]"
              :type="column.type"
              @update="updateCell(record.id, column.key, $event)"
            />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
```

**特徴**:
- インライン編集
- ソート機能
- 列のリサイズ
- 列のピン留め
- フィルタリング

### 2. カンバンビュー（実装済み）
Trelloスタイルのカード表示

```vue
<template>
  <div class="kanban-view">
    <div class="flex gap-4 overflow-x-auto p-4">
      <!-- カンバン列 -->
      <div
        v-for="column in kanbanColumns"
        :key="column.id"
        class="kanban-column"
        @drop="handleDrop($event, column.id)"
        @dragover.prevent
      >
        <!-- 列ヘッダー -->
        <div class="column-header">
          <h3 class="font-medium">{{ column.title }}</h3>
          <Badge variant="secondary">{{ column.cards.length }}</Badge>
        </div>
        
        <!-- カード -->
        <div class="column-cards">
          <KanbanCard
            v-for="card in column.cards"
            :key="card.id"
            :card="card"
            :draggable="true"
            @dragstart="handleDragStart($event, card)"
          />
        </div>
        
        <!-- カード追加ボタン -->
        <Button
          variant="ghost"
          class="w-full"
          @click="addCard(column.id)"
        >
          <Plus class="h-4 w-4 mr-2" />
          カードを追加
        </Button>
      </div>
      
      <!-- 列追加ボタン -->
      <Button
        variant="outline"
        class="min-w-[250px]"
        @click="addColumn"
      >
        <Plus class="h-4 w-4 mr-2" />
        列を追加
      </Button>
    </div>
  </div>
</template>
```

**機能**:
- ドラッグ&ドロップ
- グループフィールド選択
- カード追加・編集
- 列の追加・削除

### 3. ギャラリービュー（計画中）
カード形式のグリッド表示

```vue
<template>
  <div class="gallery-view">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <GalleryCard
        v-for="record in records"
        :key="record.id"
        :record="record"
        :image-field="imageField"
        :title-field="titleField"
        @click="openDetail(record)"
      />
    </div>
  </div>
</template>
```

**予定機能**:
- 画像フィールド選択
- カード表示カスタマイズ
- グリッドサイズ調整

## ビュー切り替えコンポーネント

### ViewSwitcher.vue
```vue
<template>
  <Tabs v-model="currentView" @update:model-value="onViewChange">
    <TabsList>
      <TabsTrigger value="table">
        <Icon name="lucide:table" class="h-4 w-4 mr-2" />
        テーブル
      </TabsTrigger>
      
      <TabsTrigger value="kanban">
        <Icon name="lucide:columns" class="h-4 w-4 mr-2" />
        カンバン
      </TabsTrigger>
      
      <TabsTrigger value="gallery" :disabled="!hasImageField">
        <Icon name="lucide:grid" class="h-4 w-4 mr-2" />
        ギャラリー
      </TabsTrigger>
    </TabsList>
    
    <TabsContent value="table">
      <slot name="table" />
    </TabsContent>
    
    <TabsContent value="kanban">
      <KanbanSettings
        v-model:group-by="kanbanGroupBy"
        :properties="selectProperties"
      />
      <slot name="kanban" />
    </TabsContent>
    
    <TabsContent value="gallery">
      <GallerySettings
        v-model:image-field="galleryImageField"
        :properties="imageProperties"
      />
      <slot name="gallery" />
    </TabsContent>
  </Tabs>
</template>

<script setup lang="ts">
const props = defineProps<{
  table: Table
  records: Record[]
}>()

const currentView = ref<'table' | 'kanban' | 'gallery'>('table')
const kanbanGroupBy = ref<string>('status')
const galleryImageField = ref<string | null>(null)

// SELECT/MULTI_SELECT プロパティを取得
const selectProperties = computed(() => 
  Object.entries(props.table.properties)
    .filter(([_, def]) => def.type === 'SELECT' || def.type === 'MULTI_SELECT')
    .map(([key, def]) => ({ key, ...def }))
)

// 画像系プロパティを取得
const imageProperties = computed(() =>
  Object.entries(props.table.properties)
    .filter(([_, def]) => def.type === 'URL' || def.type === 'IMAGE')
    .map(([key, def]) => ({ key, ...def }))
)

const hasImageField = computed(() => imageProperties.value.length > 0)

function onViewChange(view: string) {
  emit('view-change', view)
}
</script>
```

## カンバンカードコンポーネント

### KanbanCard.vue
```vue
<template>
  <Card
    class="kanban-card cursor-move hover:shadow-md transition-shadow"
    :draggable="draggable"
    @dragstart="$emit('dragstart', $event)"
  >
    <CardContent class="p-3">
      <!-- タイトル -->
      <h4 class="font-medium mb-2">
        {{ getFieldValue('title') || 'Untitled' }}
      </h4>
      
      <!-- 説明 -->
      <p
        v-if="getFieldValue('description')"
        class="text-sm text-muted-foreground mb-3 line-clamp-2"
      >
        {{ getFieldValue('description') }}
      </p>
      
      <!-- メタデータ -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- 担当者 -->
        <Avatar
          v-if="getFieldValue('assignee')"
          class="h-6 w-6"
        >
          <AvatarImage :src="getAssigneeAvatar()" />
          <AvatarFallback>{{ getAssigneeInitials() }}</AvatarFallback>
        </Avatar>
        
        <!-- 優先度 -->
        <Badge
          v-if="getFieldValue('priority')"
          :variant="getPriorityVariant()"
        >
          {{ getFieldValue('priority') }}
        </Badge>
        
        <!-- 期限 -->
        <span
          v-if="getFieldValue('dueDate')"
          class="text-xs text-muted-foreground flex items-center gap-1"
        >
          <Icon name="lucide:calendar" class="h-3 w-3" />
          {{ formatDate(getFieldValue('dueDate')) }}
        </span>
        
        <!-- タグ -->
        <Badge
          v-for="tag in getTags()"
          :key="tag"
          variant="outline"
          class="text-xs"
        >
          {{ tag }}
        </Badge>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
const props = defineProps<{
  card: Record
  draggable?: boolean
}>()

function getFieldValue(field: string) {
  return props.card.data[field]
}

function getPriorityVariant() {
  const priority = getFieldValue('priority')
  switch (priority) {
    case '高': return 'destructive'
    case '中': return 'default'
    case '低': return 'secondary'
    default: return 'outline'
  }
}

function getTags() {
  const tags = getFieldValue('tags')
  if (Array.isArray(tags)) return tags
  return []
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ja-JP')
}
</script>

<style scoped>
.kanban-card {
  @apply bg-background border;
}

.kanban-column {
  @apply bg-muted/50 rounded-lg p-3 min-w-[300px] max-w-[300px];
}

.column-header {
  @apply flex items-center justify-between mb-3 px-2;
}

.column-cards {
  @apply space-y-2 min-h-[100px] mb-3;
}
</style>
```

## ビュー設定

### KanbanSettings.vue
```vue
<template>
  <div class="kanban-settings flex items-center gap-4 p-4 border-b">
    <Label>グループ化:</Label>
    <Select v-model="localGroupBy">
      <SelectTrigger class="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="prop in properties"
          :key="prop.key"
          :value="prop.key"
        >
          {{ prop.name }}
        </SelectItem>
      </SelectContent>
    </Select>
    
    <div class="flex-1" />
    
    <Button variant="outline" size="sm" @click="collapseAll">
      すべて折りたたむ
    </Button>
    
    <Button variant="outline" size="sm" @click="expandAll">
      すべて展開
    </Button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  properties: PropertyDefinition[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localGroupBy = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>
```