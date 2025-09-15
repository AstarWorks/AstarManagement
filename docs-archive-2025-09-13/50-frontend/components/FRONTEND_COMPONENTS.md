# フロントエンドコンポーネント設計

## 1. 案件一覧画面

### 1.1 設計方針
- VueUseを活用したシンプルな実装
- フロントエンドフィルタリング（リアルタイム）とバックエンド検索の使い分け
- 表示モード切り替え（テーブル/カード/リスト）

### 1.2 主要コンポーネント

#### メインページ（Simple over Easy版）
```vue
<!-- pages/cases/index.vue -->
<template>
  <div class="cases-page">
    <!-- シンプルな検索バー -->
    <div class="flex gap-4 mb-6">
      <Input 
        v-model="filters.search" 
        placeholder="検索..."
        class="max-w-sm"
      />
      
      <!-- タグ選択をシンプルに -->
      <Select v-model="filters.tags" multiple>
        <SelectTrigger>
          <SelectValue>
            タグ{{ filters.tags.length ? ` (${filters.tags.length})` : '' }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup v-for="category in tagCategories" :key="category.id">
            <SelectLabel>{{ category.name }}</SelectLabel>
            <SelectItem 
              v-for="tag in category.tags" 
              :key="tag.id"
              :value="tag"
            >
              <TagBadge :tag="tag" />
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      
      <!-- AND/ORトグル -->
      <ToggleGroup v-model="filters.mode" type="single">
        <ToggleGroupItem value="and">AND</ToggleGroupItem>
        <ToggleGroupItem value="or">OR</ToggleGroupItem>
      </ToggleGroup>
    </div>
    
    <!-- データ表示（viewModeで切り替え） -->
    <component 
      :is="viewComponents[viewMode]"
      :cases="filteredCases"
      @select="router.push(`/cases/${$event}`)"
    />
    
    <!-- VueUseのusePaginationでシンプルに -->
    <Pagination v-bind="{ currentPage, pageSize, total }" />
  </div>
</template>

<script setup lang="ts">
// 最小限のimport
const router = useRouter()
const viewMode = useCookie('caseViewMode', { default: () => 'table' })

// VueUseでシンプルな状態管理
const filters = useLocalStorage('caseFilters', {
  search: '',
  tags: [] as Tag[],
  mode: 'and' as 'and' | 'or'
})

// データ取得もシンプルに
const { data: cases } = await useFetch('/api/cases')
const { data: tagCategories } = await useFetch('/api/tag-categories')

// フィルタリングはcomputed一つで
const filteredCases = computed(() => {
  if (!cases.value) return []
  
  return cases.value.filter(case => {
    // テキスト検索
    const matchesSearch = !filters.value.search || 
      case.title.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      formatCaseNumber(case.caseNumber).includes(filters.value.search)
    
    // タグフィルター
    const tagIds = filters.value.tags.map(t => t.id)
    const matchesTags = tagIds.length === 0 || (
      filters.value.mode === 'and' 
        ? tagIds.every(id => case.tags.some(t => t.id === id))
        : tagIds.some(id => case.tags.some(t => t.id === id))
    )
    
    return matchesSearch && matchesTags
  })
})

// コンポーネントマップ
const viewComponents = {
  table: resolveComponent('CaseTable'),
  card: resolveComponent('CaseGrid'),
  list: resolveComponent('CaseList')
}
</script>
```

## 2. カンバンボード画面

### 2.1 設計方針
- @vueuse/draggableでドラッグ&ドロップ実装
- プレースホルダー表示でユーザビリティ向上
- 権限チェックで不可のカードは鍵アイコン表示
- モバイルは長押しでドラッグ開始

### 2.2 カンバン列コンポーネント（プレースホルダー対応）

```vue
<!-- components/case/KanbanColumn.vue -->
<template>
  <div class="kanban-column">
    <div class="column-header">
      <div class="flex items-center gap-2">
        <div 
          class="w-3 h-3 rounded-full" 
          :style="{ backgroundColor: column.color }"
        />
        <h3 class="font-medium">{{ column.name }}</h3>
        <Badge variant="secondary">{{ displayCases.length }}</Badge>
      </div>
    </div>
    
    <div 
      ref="dropZoneEl" 
      class="column-cards"
      :class="{
        'drag-over': isOverDropZone && canDropHere,
        'drag-over-invalid': isOverDropZone && !canDropHere
      }"
    >
      <TransitionGroup name="kanban-card" tag="div">
        <template v-for="(item, index) in displayCases" :key="item.id">
          <!-- プレースホルダー -->
          <div 
            v-if="item.isPlaceholder" 
            class="kanban-placeholder"
            :style="{ height: `${placeholderHeight}px` }"
          >
            <div class="placeholder-inner">
              ここに移動
            </div>
          </div>
          
          <!-- 実際のカード -->
          <KanbanCard
            v-else
            :case="item"
            :class="{ 'dragging-card': draggingCaseId === item.id }"
            @dragstart="handleDragStart(item, index)"
            @dragend="handleDragEnd"
          />
        </template>
      </TransitionGroup>
      
      <!-- 空状態 -->
      <div v-if="cases.length === 0 && !showPlaceholder" class="empty-state">
        <LucideInbox class="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">案件がありません</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDropZone } from '@vueuse/core'

interface Props {
  column: StatusColumn
  cases: Case[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  drop: [caseId: string, fromStatusId: string, toStatusId: string]
}>()

// ドラッグ状態管理
const draggingCaseId = ref<string | null>(null)
const placeholderHeight = ref(120)
const showPlaceholder = ref(false)
const placeholderIndex = ref(0)

// 表示用のケース（プレースホルダーを含む）
const displayCases = computed(() => {
  const result = [...props.cases]
  
  if (showPlaceholder.value && isOverDropZone.value) {
    // プレースホルダーを挿入
    result.splice(placeholderIndex.value, 0, {
      id: 'placeholder',
      isPlaceholder: true
    } as any)
  }
  
  return result
})

// ドロップゾーン設定
const dropZoneEl = ref<HTMLElement>()
const canDropHere = ref(false)

const { isOverDropZone } = useDropZone(dropZoneEl, {
  onDrop: async (files, event) => {
    const caseId = event.dataTransfer?.getData('caseId')
    const fromStatusId = event.dataTransfer?.getData('currentStatusId')
    
    if (caseId && fromStatusId !== props.column.id && canDropHere.value) {
      emit('drop', caseId, fromStatusId, props.column.id)
    }
    
    // リセット
    showPlaceholder.value = false
    canDropHere.value = false
  },
  onEnter: (event) => {
    const caseId = event.dataTransfer?.getData('caseId')
    if (caseId) {
      canDropHere.value = hasPermission('case.status.change')
      showPlaceholder.value = canDropHere.value
    }
  },
  onOver: (event) => {
    if (!showPlaceholder.value || !dropZoneEl.value) return
    
    // マウス位置からプレースホルダーの位置を計算
    const rect = dropZoneEl.value.getBoundingClientRect()
    const y = event.clientY - rect.top
    
    // どのカードの位置にプレースホルダーを表示するか計算
    const cards = dropZoneEl.value.querySelectorAll('.kanban-card:not(.dragging-card)')
    let newIndex = 0
    
    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect()
      const cardMiddle = cardRect.top + cardRect.height / 2 - rect.top
      
      if (y > cardMiddle) {
        newIndex = index + 1
      }
    })
    
    placeholderIndex.value = newIndex
  },
  onLeave: () => {
    showPlaceholder.value = false
    canDropHere.value = false
  }
})

// ドラッグ開始時の処理
const handleDragStart = (case: Case, index: number) => {
  draggingCaseId.value = case.id
  
  // カードの高さを記録（プレースホルダー用）
  const cardEl = event.target as HTMLElement
  placeholderHeight.value = cardEl.offsetHeight
}

const handleDragEnd = () => {
  draggingCaseId.value = null
}
</script>

<style scoped>
/* プレースホルダーのスタイル */
.kanban-placeholder {
  @apply border-2 border-dashed border-primary/50 rounded-lg 
         bg-primary/5 transition-all duration-200;
}

.placeholder-inner {
  @apply h-full flex items-center justify-center
         text-sm text-primary/60 font-medium;
}

/* ドラッグ中のカード */
.dragging-card {
  @apply opacity-30 pointer-events-none;
}

/* ドロップ可能/不可の視覚表現 */
.column-cards.drag-over {
  @apply bg-primary/5 border-2 border-dashed border-primary;
}

.column-cards.drag-over-invalid {
  @apply bg-destructive/5 border-2 border-dashed border-destructive;
}

/* トランジション */
.kanban-card-move,
.kanban-card-enter-active,
.kanban-card-leave-active {
  transition: all 0.3s ease;
}

.kanban-card-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.kanban-card-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
```

### 2.3 カンバンカード（権限チェック対応）

```vue
<!-- components/case/KanbanCard.vue -->
<template>
  <div ref="cardEl">
    <Card 
      class="kanban-card"
      :class="{
        'cursor-move': canDrag,
        'opacity-50 cursor-not-allowed': !canDrag,
        'opacity-60': isDragging
      }"
      @click="handleClick"
    >
      <CardContent class="p-4">
        <!-- 権限がない場合の表示 -->
        <div v-if="!canDrag" class="absolute -top-2 -right-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <LucideLock class="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                ステータス変更権限がありません
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <!-- カード内容 -->
        <div class="font-mono text-sm text-muted-foreground mb-1">
          {{ formatCaseNumber(case.caseNumber) }}
        </div>
        
        <h4 class="font-medium mb-2 line-clamp-2">
          {{ case.title }}
        </h4>
        
        <!-- 優先度とタグ -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <TagBadge 
              v-if="priorityTag"
              :tag="priorityTag"
              size="sm"
            />
            <Badge 
              v-if="deadline && isDeadlineNear"
              variant="destructive"
              size="sm"
            >
              <LucideClock class="h-3 w-3 mr-1" />
              {{ formatDeadline(deadline) }}
            </Badge>
          </div>
          
          <div class="flex items-center justify-between">
            <AvatarGroup :users="case.assignees" :max="3" size="xs" />
            <div class="flex gap-1">
              <TagBadge
                v-for="tag in otherTags.slice(0, 2)"
                :key="tag.id"
                :tag="tag"
                size="xs"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useDraggable } from '@vueuse/core'
import { usePermissions } from '~/composables/usePermissions'

interface Props {
  case: Case
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: [id: string]
}>()

// 権限チェック
const { hasPermission } = usePermissions()
const canDrag = computed(() => hasPermission('case.status.change'))

// VueUseのuseDraggableを使用
const cardEl = ref<HTMLElement>()
const { isDragging } = useDraggable(cardEl, {
  disabled: !canDrag.value,
  onStart: (position, event) => {
    if (!canDrag.value) return false
    
    // ドラッグデータの設定
    event.dataTransfer?.setData('caseId', props.case.id)
    event.dataTransfer?.setData('currentStatusId', currentStatusId.value)
    event.dataTransfer!.effectAllowed = 'move'
  }
})
</script>
```

## 3. 案件詳細画面

### 3.1 設計方針
- インライン編集（Notion風）
- 自動保存（デバウンス付き）
- Optimistic UI（即座にUI更新、バックグラウンドで保存）
- タブ構成で情報を整理

### 3.2 メインコンポーネント

```vue
<!-- pages/cases/[id].vue -->
<template>
  <div class="case-detail-page">
    <!-- ヘッダー -->
    <div class="case-header">
      <div class="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" @click="router.back()">
          <LucideArrowLeft class="h-4 w-4" />
        </Button>
        
        <div class="flex-1">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <span class="font-mono">{{ formattedCaseNumber }}</span>
            <SaveStatus :status="saveStatus" />
          </div>
          
          <!-- タイトル（インライン編集可能） -->
          <h1 
            class="text-2xl font-bold"
            contenteditable="true"
            @input="updateField('title', $event)"
            @blur="saveChanges"
          >
            {{ caseData.title }}
          </h1>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              アクション
              <LucideChevronDown class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="duplicateCase">
              <LucideCopy class="mr-2 h-4 w-4" />
              複製
            </DropdownMenuItem>
            <DropdownMenuItem @click="archiveCase">
              <LucideArchive class="mr-2 h-4 w-4" />
              アーカイブ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive" @click="deleteCase">
              <LucideTrash class="mr-2 h-4 w-4" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <!-- タグ表示・編集 -->
      <div class="flex flex-wrap gap-2">
        <TagSelector
          v-model="caseData.tags"
          :categories="tagCategories"
          @change="saveChanges"
        />
      </div>
    </div>
    
    <!-- タブ -->
    <Tabs v-model="activeTab" class="mt-6">
      <TabsList>
        <TabsTrigger value="basic">基本情報</TabsTrigger>
        <TabsTrigger value="timeline">タイムライン</TabsTrigger>
        <TabsTrigger value="documents">書類</TabsTrigger>
        <TabsTrigger value="assignees">担当者</TabsTrigger>
        <TabsTrigger value="memos">メモ</TabsTrigger>
        <TabsTrigger value="related">関連案件</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" class="mt-6">
        <CaseBasicInfo 
          v-model="caseData" 
          @update="handleFieldUpdate"
        />
      </TabsContent>
      
      <TabsContent value="timeline">
        <CaseTimeline :case-id="caseId" />
      </TabsContent>
      
      <TabsContent value="documents">
        <CaseDocuments :case-id="caseId" />
      </TabsContent>
      
      <TabsContent value="assignees">
        <CaseAssignees 
          v-model="caseData.assignees"
          @update="saveChanges"
        />
      </TabsContent>
      
      <TabsContent value="memos">
        <CaseMemos :case-id="caseId" />
      </TabsContent>
      
      <TabsContent value="related">
        <RelatedCases 
          v-model="caseData.relatedCases"
          @update="saveChanges"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
// Notion風の自動保存実装
const route = useRoute()
const router = useRouter()
const caseId = route.params.id as string

// 保存状態の管理
const saveStatus = ref<'saved' | 'saving' | 'error'>('saved')

// データ取得
const { data: caseData, refresh } = await useFetch(`/api/cases/${caseId}`)
const { data: tagCategories } = await useFetch('/api/tag-categories')

// デバウンス付き保存（500ms）
const { pause, resume } = useIntervalFn(() => {
  if (pendingChanges.value.size > 0) {
    saveChanges()
  }
}, 500)

// 変更管理
const pendingChanges = ref(new Map<string, any>())

const updateField = (field: string, event: Event | any) => {
  const value = event.target ? event.target.textContent : event
  
  // Optimistic UI: 即座にローカルデータを更新
  if (caseData.value) {
    caseData.value[field] = value
  }
  
  // 保存待ちリストに追加
  pendingChanges.value.set(field, value)
  saveStatus.value = 'saving'
}

// バックグラウンド保存
const saveChanges = useDebounceFn(async () => {
  if (pendingChanges.value.size === 0) return
  
  try {
    const updates = Object.fromEntries(pendingChanges.value)
    await $fetch(`/api/cases/${caseId}`, {
      method: 'PATCH',
      body: updates
    })
    
    pendingChanges.value.clear()
    saveStatus.value = 'saved'
  } catch (error) {
    saveStatus.value = 'error'
    // エラー時はデータを再取得して整合性を保つ
    await refresh()
  }
}, 500)

// タブの永続化
const activeTab = useCookie(`case-detail-tab-${caseId}`, {
  default: () => 'basic'
})
</script>
```

### 3.3 基本情報タブ（インライン編集）

```vue
<!-- components/case/CaseBasicInfo.vue -->
<template>
  <div class="case-basic-info grid gap-6">
    <!-- 依頼者情報 -->
    <Card>
      <CardHeader>
        <CardTitle>依頼者情報</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>依頼者</Label>
            <Select 
              v-model="modelValue.clientId"
              @update:modelValue="update('clientId', $event)"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="client in clients" 
                  :key="client.id"
                  :value="client.id"
                >
                  {{ client.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>相手方</Label>
            <EditableText
              :value="modelValue.opponentName"
              placeholder="相手方名を入力"
              @update="update('opponentName', $event)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
    
    <!-- 案件詳細 -->
    <Card>
      <CardHeader>
        <CardTitle>案件詳細</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label>概要</Label>
          <EditableTextarea
            :value="modelValue.summary"
            placeholder="案件の概要を入力"
            :rows="4"
            @update="update('summary', $event)"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>受任日</Label>
            <DatePicker
              v-model="modelValue.acceptedDate"
              @update:modelValue="update('acceptedDate', $event)"
            />
          </div>
          
          <div>
            <Label>裁判所</Label>
            <EditableText
              :value="modelValue.courtName"
              placeholder="裁判所名"
              @update="update('courtName', $event)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
    
    <!-- 報酬情報 -->
    <Card>
      <CardHeader>
        <CardTitle>報酬情報</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>着手金</Label>
            <EditableNumber
              :value="modelValue.retainerFee"
              :format="formatCurrency"
              @update="update('retainerFee', $event)"
            />
          </div>
          
          <div>
            <Label>成功報酬率</Label>
            <EditableNumber
              :value="modelValue.successFeeRate"
              :suffix="%"
              :min="0"
              :max="100"
              @update="update('successFeeRate', $event)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: Case
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: Case]
  'update': [updates: Partial<Case>]
}>()

// 依頼者リスト取得
const { data: clients } = await useFetch('/api/clients')

// フィールド更新
const update = (field: string, value: any) => {
  emit('update', { [field]: value })
}
</script>
```

### 3.4 インライン編集コンポーネント

```vue
<!-- components/ui/EditableText.vue -->
<template>
  <div class="editable-text">
    <div
      ref="editableEl"
      class="editable-content"
      :class="{ 'is-editing': isEditing }"
      contenteditable="true"
      @focus="handleFocus"
      @blur="handleBlur"
      @input="handleInput"
      @keydown.enter.prevent="commitEdit"
      @keydown.escape="cancelEdit"
    >
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  value: string
  placeholder?: string
  multiline?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [value: string]
}>()

const editableEl = ref<HTMLElement>()
const isEditing = ref(false)
const tempValue = ref(props.value)

const displayValue = computed(() => 
  props.value || props.placeholder || ''
)

const handleFocus = () => {
  isEditing.value = true
  tempValue.value = props.value
  
  // テキスト全選択
  nextTick(() => {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(editableEl.value!)
    selection?.removeAllRanges()
    selection?.addRange(range)
  })
}

const handleBlur = () => {
  commitEdit()
}

const handleInput = (event: Event) => {
  tempValue.value = (event.target as HTMLElement).textContent || ''
}

const commitEdit = () => {
  isEditing.value = false
  if (tempValue.value !== props.value) {
    emit('update', tempValue.value)
  }
}

const cancelEdit = () => {
  isEditing.value = false
  if (editableEl.value) {
    editableEl.value.textContent = props.value
  }
}
</script>

<style scoped>
.editable-content {
  @apply px-3 py-2 rounded-md border border-transparent
         hover:border-border hover:bg-muted/50
         focus:outline-none focus:ring-2 focus:ring-ring
         transition-colors cursor-text;
}

.editable-content.is-editing {
  @apply bg-background border-input;
}

.editable-content:empty:before {
  content: attr(placeholder);
  @apply text-muted-foreground;
}
</style>
```

### 3.5 保存状態表示コンポーネント

```vue
<!-- components/ui/SaveStatus.vue -->
<template>
  <div class="save-status flex items-center gap-1.5 text-xs">
    <div 
      class="status-dot"
      :class="{
        'bg-green-500': status === 'saved',
        'bg-yellow-500 animate-pulse': status === 'saving',
        'bg-red-500': status === 'error'
      }"
    />
    <span class="text-muted-foreground">
      {{ statusText }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  status: 'saved' | 'saving' | 'error'
}

const props = defineProps<Props>()

const statusText = computed(() => {
  switch (props.status) {
    case 'saved': return '保存済み'
    case 'saving': return '保存中...'
    case 'error': return '保存エラー'
  }
})
</script>

<style scoped>
.status-dot {
  @apply w-1.5 h-1.5 rounded-full;
}
</style>
```

## 4. タグ管理画面

### 4.1 設計方針
- タグカテゴリー別の表示・管理
- ドラッグ&ドロップでの優先順位変更
- タグの色をインライン編集
- 使用状況の可視化（使用案件数表示）
- 検索・フィルタリング機能

### 4.2 メインコンポーネント

```vue
<!-- pages/admin/tags.vue -->
<template>
  <div class="tags-management-page">
    <!-- ヘッダー -->
    <div class="page-header">
      <h1 class="text-2xl font-bold">タグ管理</h1>
      
      <Button @click="showCreateDialog = true">
        <LucidePlus class="h-4 w-4 mr-2" />
        新規タグ
      </Button>
    </div>
    
    <!-- 検索・フィルター -->
    <div class="flex gap-4 mb-6">
      <Input 
        v-model="searchQuery" 
        placeholder="タグを検索..."
        class="max-w-sm"
      />
      
      <Select v-model="selectedCategory">
        <SelectTrigger class="w-48">
          <SelectValue placeholder="カテゴリー絞り込み" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">すべて</SelectItem>
          <SelectItem 
            v-for="category in categories" 
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <!-- タグカテゴリー別表示 -->
    <div class="space-y-6">
      <TagCategorySection
        v-for="category in filteredCategories"
        :key="category.id"
        :category="category"
        :tags="getTagsForCategory(category.id)"
        @update-tag="handleTagUpdate"
        @delete-tag="handleTagDelete"
        @reorder="handleReorder"
      />
    </div>
    
    <!-- タグ作成ダイアログ -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規タグ作成</DialogTitle>
        </DialogHeader>
        <CreateTagForm 
          :categories="categories"
          @create="handleTagCreate"
          @cancel="showCreateDialog = false"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
// 権限チェック
const { hasPermission } = usePermissions()
if (!hasPermission('tag.manage')) {
  throw createError({
    statusCode: 403,
    statusMessage: 'タグ管理権限がありません'
  })
}

// データ取得
const { data: categories } = await useFetch('/api/tag-categories')
const { data: tags, refresh: refreshTags } = await useFetch('/api/tags')

// 検索・フィルター
const searchQuery = ref('')
const selectedCategory = ref('')
const showCreateDialog = ref(false)

// フィルタリング
const filteredCategories = computed(() => {
  if (!selectedCategory.value) {
    return categories.value
  }
  return categories.value?.filter(c => c.id === selectedCategory.value)
})

const getTagsForCategory = (categoryId: string) => {
  return tags.value?.filter(tag => {
    const matchesCategory = tag.categoryId === categoryId
    const matchesSearch = !searchQuery.value || 
      tag.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesSearch
  }) || []
}

// タグ操作
const handleTagUpdate = async (tagId: string, updates: Partial<Tag>) => {
  await $fetch(`/api/tags/${tagId}`, {
    method: 'PATCH',
    body: updates
  })
  await refreshTags()
}

const handleTagDelete = async (tagId: string) => {
  const confirmed = await useConfirm({
    title: 'タグを削除しますか？',
    description: 'このタグを使用している案件からも削除されます。',
    confirmText: '削除',
    variant: 'destructive'
  })
  
  if (confirmed) {
    await $fetch(`/api/tags/${tagId}`, { method: 'DELETE' })
    await refreshTags()
  }
}

const handleReorder = async (categoryId: string, reorderedTags: Tag[]) => {
  // 並び順更新
  await $fetch(`/api/tag-categories/${categoryId}/reorder`, {
    method: 'POST',
    body: {
      tagIds: reorderedTags.map(t => t.id)
    }
  })
  await refreshTags()
}

const handleTagCreate = async (newTag: CreateTagInput) => {
  await $fetch('/api/tags', {
    method: 'POST',
    body: newTag
  })
  showCreateDialog.value = false
  await refreshTags()
}
</script>
```

### 4.3 タグカテゴリーセクション（ドラッグ&ドロップ対応）

```vue
<!-- components/admin/TagCategorySection.vue -->
<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold">{{ category.name }}</h3>
          <Badge variant="secondary">{{ tags.length }}</Badge>
          <TooltipProvider v-if="category.isExclusive">
            <Tooltip>
              <TooltipTrigger>
                <LucideToggleLeft class="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                排他的カテゴリー（1つのみ選択可）
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <LucideMoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="editCategory">
              <LucideEdit class="mr-2 h-4 w-4" />
              カテゴリー編集
            </DropdownMenuItem>
            <DropdownMenuItem 
              v-if="tags.length === 0"
              class="text-destructive" 
              @click="deleteCategory"
            >
              <LucideTrash class="mr-2 h-4 w-4" />
              カテゴリー削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    
    <CardContent>
      <div v-if="tags.length === 0" class="text-center py-8 text-muted-foreground">
        このカテゴリーにタグはありません
      </div>
      
      <!-- ドラッグ可能なタグリスト -->
      <div 
        v-else
        ref="tagListEl"
        class="space-y-2"
      >
        <TransitionGroup name="tag-list">
          <TagItem
            v-for="(tag, index) in sortedTags"
            :key="tag.id"
            :tag="tag"
            :index="index"
            :draggable="canReorder"
            @update="(updates) => emit('updateTag', tag.id, updates)"
            @delete="() => emit('deleteTag', tag.id)"
            @dragstart="handleDragStart"
            @dragend="handleDragEnd"
            @dragover="handleDragOver"
            @drop="handleDrop"
          />
        </TransitionGroup>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'

interface Props {
  category: TagCategory
  tags: Tag[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  updateTag: [tagId: string, updates: Partial<Tag>]
  deleteTag: [tagId: string]
  reorder: [categoryId: string, tags: Tag[]]
}>()

// 権限チェック
const { hasPermission } = usePermissions()
const canReorder = computed(() => hasPermission('tag.reorder'))

// ドラッグ&ドロップ（VueUse）
const tagListEl = ref<HTMLElement>()
const sortedTags = ref([...props.tags])

// タグが更新されたら並び順も更新
watch(() => props.tags, (newTags) => {
  sortedTags.value = [...newTags]
})

// VueUseのuseSortableを使用
const { option } = useSortable(tagListEl, sortedTags, {
  animation: 200,
  disabled: !canReorder.value,
  onEnd: () => {
    emit('reorder', props.category.id, sortedTags.value)
  }
})
</script>

<style scoped>
/* トランジション */
.tag-list-move,
.tag-list-enter-active,
.tag-list-leave-active {
  transition: all 0.2s ease;
}

.tag-list-enter-from,
.tag-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.tag-list-leave-active {
  position: absolute;
  right: 0;
  left: 0;
}
</style>
```

### 4.4 タグアイテム（インライン色編集）

```vue
<!-- components/admin/TagItem.vue -->
<template>
  <div 
    class="tag-item"
    :class="{ 'cursor-move': draggable }"
    :draggable="draggable"
    @dragstart="$emit('dragstart', $event, tag)"
    @dragend="$emit('dragend', $event)"
    @dragover.prevent="$emit('dragover', $event, index)"
    @drop="$emit('drop', $event, index)"
  >
    <div class="flex items-center gap-3">
      <!-- ドラッグハンドル -->
      <div v-if="draggable" class="drag-handle">
        <LucideGripVertical class="h-4 w-4 text-muted-foreground" />
      </div>
      
      <!-- カラーピッカー -->
      <div class="relative">
        <button
          class="color-picker"
          :style="{ backgroundColor: tag.color }"
          @click="showColorPicker = !showColorPicker"
        />
        
        <!-- シンプルなカラーピッカー -->
        <div 
          v-if="showColorPicker" 
          class="color-picker-popover"
          v-click-outside="() => showColorPicker = false"
        >
          <div class="color-grid">
            <button
              v-for="color in presetColors"
              :key="color"
              type="button"
              class="color-option"
              :style="{ backgroundColor: color }"
              @click="updateColor(color)"
            />
          </div>
          <Input
            v-model="customColor"
            placeholder="#000000"
            class="mt-2"
            @keydown.enter="updateColor(customColor)"
          />
        </div>
      </div>
      
      <!-- タグ名（インライン編集） -->
      <EditableText
        :value="tag.name"
        class="flex-1 font-medium"
        @update="updateName"
      />
      
      <!-- 使用状況 -->
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline">
              {{ tag.usageCount || 0 }}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {{ tag.usageCount || 0 }}件の案件で使用中
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <!-- 操作 -->
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" class="h-8 w-8">
            <LucideMoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="duplicateTag">
            <LucideCopy class="mr-2 h-4 w-4" />
            複製
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            class="text-destructive"
            :disabled="tag.usageCount > 0"
            @click="$emit('delete')"
          >
            <LucideTrash class="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  tag: Tag
  index: number
  draggable?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [updates: Partial<Tag>]
  delete: []
  dragstart: [event: DragEvent, tag: Tag]
  dragend: [event: DragEvent]
  dragover: [event: DragEvent, index: number]
  drop: [event: DragEvent, index: number]
}>()

// カラーピッカー
const showColorPicker = ref(false)
const customColor = ref(props.tag.color)

const presetColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#64748b', '#475569', '#1e293b'
]

const updateColor = (color: string) => {
  emit('update', { color })
  showColorPicker.value = false
  customColor.value = color
}

const updateName = (name: string) => {
  emit('update', { name })
}

const duplicateTag = () => {
  // 複製ロジック
  emit('update', { 
    name: `${props.tag.name} (コピー)`,
    id: undefined // 新規作成をトリガー
  })
}
</script>

<style scoped>
.tag-item {
  @apply flex items-center p-3 bg-background border rounded-lg
         hover:shadow-sm transition-shadow;
}

.drag-handle {
  @apply cursor-move opacity-50 hover:opacity-100 transition-opacity;
}

.color-picker {
  @apply w-8 h-8 rounded-md border-2 border-border
         hover:scale-110 transition-transform cursor-pointer;
}

.color-picker-popover {
  @apply absolute top-10 left-0 z-50 p-3 bg-popover 
         border rounded-lg shadow-lg;
}

.color-grid {
  @apply grid grid-cols-5 gap-2;
}

.color-option {
  @apply w-8 h-8 rounded-md border border-border
         hover:scale-110 transition-transform cursor-pointer;
}
</style>
```

### 4.5 タグ作成フォーム

```vue
<!-- components/admin/CreateTagForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <Label for="tag-name">タグ名</Label>
      <Input
        id="tag-name"
        v-model="formData.name"
        placeholder="新しいタグ"
        required
      />
    </div>
    
    <div>
      <Label for="tag-category">カテゴリー</Label>
      <Select v-model="formData.categoryId" required>
        <SelectTrigger id="tag-category">
          <SelectValue placeholder="カテゴリーを選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem 
            v-for="category in categories" 
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
            <span v-if="category.isExclusive" class="text-muted-foreground ml-2">
              (排他的)
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div>
      <Label>色</Label>
      <div class="flex gap-2 items-center">
        <div class="color-selection">
          <button
            v-for="color in presetColors"
            :key="color"
            type="button"
            class="color-button"
            :class="{ 'selected': formData.color === color }"
            :style="{ backgroundColor: color }"
            @click="formData.color = color"
          />
        </div>
        <Input
          v-model="formData.color"
          placeholder="#000000"
          class="w-32"
        />
      </div>
    </div>
    
    <div class="flex justify-end gap-2">
      <Button type="button" variant="outline" @click="$emit('cancel')">
        キャンセル
      </Button>
      <Button type="submit">
        作成
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
interface Props {
  categories: TagCategory[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  create: [tag: CreateTagInput]
  cancel: []
}>()

const formData = reactive({
  name: '',
  categoryId: '',
  color: '#3b82f6'
})

const presetColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
]

const handleSubmit = () => {
  emit('create', { ...formData })
}
</script>

<style scoped>
.color-selection {
  @apply flex gap-1;
}

.color-button {
  @apply w-8 h-8 rounded-md border-2 transition-all;
  border-color: transparent;
}

.color-button:hover {
  @apply scale-110;
}

.color-button.selected {
  @apply border-primary ring-2 ring-primary/20;
}
</style>
```

### 4.6 タグ使用状況ダッシュボード

```vue
<!-- components/admin/TagUsageStats.vue -->
<template>
  <Card>
    <CardHeader>
      <CardTitle>タグ使用統計</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <!-- 最も使用されているタグ -->
        <div>
          <h4 class="text-sm font-medium mb-2">人気のタグ TOP10</h4>
          <div class="space-y-2">
            <div 
              v-for="tag in topTags" 
              :key="tag.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <div 
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: tag.color }"
                />
                <span class="text-sm">{{ tag.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Progress 
                  :value="(tag.usageCount / maxUsage) * 100" 
                  class="w-24 h-2"
                />
                <span class="text-sm text-muted-foreground w-12 text-right">
                  {{ tag.usageCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 未使用タグ -->
        <div>
          <h4 class="text-sm font-medium mb-2">未使用のタグ</h4>
          <div class="flex flex-wrap gap-2">
            <Badge 
              v-for="tag in unusedTags" 
              :key="tag.id"
              variant="outline"
            >
              <div 
                class="w-2 h-2 rounded-full mr-1"
                :style="{ backgroundColor: tag.color }"
              />
              {{ tag.name }}
            </Badge>
          </div>
          <p v-if="unusedTags.length === 0" class="text-sm text-muted-foreground">
            すべてのタグが使用されています
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
const { data: tagStats } = await useFetch('/api/tags/stats')

const topTags = computed(() => 
  tagStats.value?.tags
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10) || []
)

const unusedTags = computed(() =>
  tagStats.value?.tags.filter(t => t.usageCount === 0) || []
)

const maxUsage = computed(() =>
  Math.max(...(tagStats.value?.tags.map(t => t.usageCount) || [1]))
)
</script>
```