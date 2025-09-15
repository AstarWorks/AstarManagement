# テーブル機能 - フロントエンドコンポーネント

## コンポーネント階層

```
TableList.vue                    # テーブル一覧のメインコンポーネント
├── list/
│   ├── TableListHeader.vue      # ヘッダー（タイトル、作成ボタン）
│   ├── TableListToolbar.vue     # ツールバー（検索、フィルター）
│   ├── TableListGrid.vue        # グリッド表示
│   ├── TableListTable.vue       # テーブル表示
│   └── TableBatchActions.vue    # 一括操作
├── CreateTableDialog.vue         # テーブル作成ダイアログ
└── dialogs/
    └── DeleteTableDialog.vue     # テーブル削除確認

RecordList.vue                    # レコード一覧のメインコンポーネント
├── record/
│   ├── RecordCell.vue           # セル表示
│   ├── EditableCell.vue         # 編集可能セル
│   ├── RecordActionsCell.vue    # アクション列
│   ├── RecordCreateDialog.vue   # レコード作成
│   ├── RecordEditDialog.vue     # レコード編集
│   └── RecordViewDialog.vue     # レコード詳細表示
├── toolbar/
│   ├── SearchBar.vue            # 検索バー
│   ├── FilterDropdown.vue       # フィルタードロップダウン
│   ├── ColumnSelector.vue       # 列選択
│   ├── ViewSettings.vue         # ビュー設定
│   └── BatchActions.vue         # 一括操作
└── list/
    ├── RecordListContainer.vue   # コンテナ
    ├── RecordListTable.vue       # テーブル表示
    ├── RecordListToolbar.vue     # ツールバー
    └── RecordListEmpty.vue       # 空状態

property/
├── PropertyInput.vue             # プロパティ入力コンポーネント
├── PropertyTypeSelector.vue     # プロパティタイプ選択
├── PropertyList.vue             # プロパティ一覧
├── PropertyCreateDialog.vue     # プロパティ作成
├── PropertyEditDialog.vue       # プロパティ編集
└── RelationSelect.vue           # リレーション選択
```

## 主要コンポーネント

### TableList.vue
```vue
<template>
  <div class="space-y-4">
    <TableListHeader @create="openCreateDialog" />
    
    <TableListToolbar
      v-model:search="searchQuery"
      v-model:view="viewMode"
      @refresh="fetchTables"
    />
    
    <TableListGrid 
      v-if="viewMode === 'grid'"
      :tables="filteredTables"
      @edit="editTable"
      @delete="confirmDelete"
    />
    
    <TableListTable
      v-else
      :tables="filteredTables"
      :selected="selectedTables"
      @select="toggleSelection"
      @edit="editTable"
      @delete="confirmDelete"
    />
    
    <CreateTableDialog
      v-model:open="createDialogOpen"
      @created="handleTableCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { useTableList } from '../composables/useTableList'

const {
  tables,
  filteredTables,
  searchQuery,
  viewMode,
  selectedTables,
  fetchTables,
  createTable,
  editTable,
  deleteTable
} = useTableList()
</script>
```

### RecordListTable.vue
```vue
<template>
  <div class="w-full" :style="columnSizeVars">
    <StickyTable>
      <Table>
        <StickyTableHeader>
          <TableRow>
            <!-- 選択列 -->
            <TableHead v-if="selectable" class="w-12">
              <Checkbox
                :checked="allSelected"
                @update:checked="toggleAllSelection"
              />
            </TableHead>
            
            <!-- データ列 -->
            <TableHead
              v-for="column in visibleColumns"
              :key="column.id"
              :class="getColumnClasses(column)"
              @click="toggleSort(column)"
            >
              <div class="flex items-center justify-between">
                {{ column.name }}
                <SortIndicator
                  v-if="column.sortable"
                  :direction="getSortDirection(column)"
                />
              </div>
            </TableHead>
            
            <!-- アクション列 -->
            <TableHead class="w-20">操作</TableHead>
          </TableRow>
        </StickyTableHeader>
        
        <TableBody>
          <TableRow
            v-for="record in records"
            :key="record.id"
            :class="{ 'bg-muted/50': isSelected(record.id) }"
          >
            <!-- 選択セル -->
            <TableCell v-if="selectable">
              <Checkbox
                :checked="isSelected(record.id)"
                @update:checked="toggleSelection(record.id)"
              />
            </TableCell>
            
            <!-- データセル -->
            <TableCell
              v-for="column in visibleColumns"
              :key="column.id"
            >
              <EditableCell
                :value="record.data[column.key]"
                :type="column.type"
                :options="column.options"
                :editable="column.editable"
                @update="updateCell(record.id, column.key, $event)"
              />
            </TableCell>
            
            <!-- アクションセル -->
            <TableCell>
              <RecordActionsCell
                :record="record"
                @edit="editRecord"
                @delete="deleteRecord"
                @duplicate="duplicateRecord"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </StickyTable>
  </div>
</template>
```

### EditableCell.vue
```vue
<template>
  <div class="editable-cell" @click="startEdit">
    <!-- 編集モード -->
    <template v-if="editing">
      <component
        :is="getInputComponent(type)"
        v-model="localValue"
        v-bind="inputProps"
        @blur="saveValue"
        @keydown.enter="saveValue"
        @keydown.escape="cancelEdit"
        autofocus
      />
    </template>
    
    <!-- 表示モード -->
    <template v-else>
      <component
        :is="getDisplayComponent(type)"
        :value="value"
        :options="options"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import TextDisplay from './displays/TextDisplay.vue'
import NumberDisplay from './displays/NumberDisplay.vue'
import SelectDisplay from './displays/SelectDisplay.vue'
import DateDisplay from './displays/DateDisplay.vue'
import UserDisplay from './displays/UserDisplay.vue'

const props = defineProps<{
  value: any
  type: PropertyType
  options?: any
  editable?: boolean
}>()

const emit = defineEmits<{
  update: [value: any]
}>()

const editing = ref(false)
const localValue = ref(props.value)

const displayComponents = {
  TEXT: TextDisplay,
  NUMBER: NumberDisplay,
  SELECT: SelectDisplay,
  DATE: DateDisplay,
  USER: UserDisplay
}

const inputComponents = {
  TEXT: 'input',
  NUMBER: 'input',
  SELECT: 'select',
  DATE: 'input',
  USER: UserSelect
}

function getDisplayComponent(type: PropertyType) {
  return displayComponents[type] || TextDisplay
}

function getInputComponent(type: PropertyType) {
  return inputComponents[type] || 'input'
}

function startEdit() {
  if (!props.editable) return
  editing.value = true
  localValue.value = props.value
}

function saveValue() {
  editing.value = false
  if (localValue.value !== props.value) {
    emit('update', localValue.value)
  }
}

function cancelEdit() {
  editing.value = false
  localValue.value = props.value
}
</script>
```

### PropertyInput.vue
```vue
<template>
  <div class="property-input">
    <!-- テキスト -->
    <Input
      v-if="type === 'TEXT'"
      v-model="localValue"
      :placeholder="placeholder"
    />
    
    <!-- 数値 -->
    <Input
      v-else-if="type === 'NUMBER'"
      v-model.number="localValue"
      type="number"
      :placeholder="placeholder"
    />
    
    <!-- 日付 -->
    <DatePicker
      v-else-if="type === 'DATE'"
      v-model="localValue"
    />
    
    <!-- 選択 -->
    <Select
      v-else-if="type === 'SELECT'"
      v-model="localValue"
    >
      <SelectTrigger>
        <SelectValue :placeholder="placeholder" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in options"
          :key="option"
          :value="option"
        >
          {{ option }}
        </SelectItem>
      </SelectContent>
    </Select>
    
    <!-- 複数選択 -->
    <MultiSelect
      v-else-if="type === 'MULTI_SELECT'"
      v-model="localValue"
      :options="options"
    />
    
    <!-- チェックボックス -->
    <Checkbox
      v-else-if="type === 'CHECKBOX'"
      v-model="localValue"
    />
    
    <!-- ユーザー -->
    <UserSelect
      v-else-if="type === 'USER'"
      v-model="localValue"
    />
    
    <!-- リレーション -->
    <RelationSelect
      v-else-if="type === 'RELATION'"
      v-model="localValue"
      :table-id="relationTableId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropertyType } from '../types'

const props = defineProps<{
  modelValue: any
  type: PropertyType
  options?: string[]
  placeholder?: string
  relationTableId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>
```

## スタイリング

### Tailwind CSS クラス
```css
/* テーブルヘッダー */
.table-header {
  @apply bg-gray-100/95 backdrop-blur-sm border-b-2 border-gray-500;
  @apply text-gray-700 font-semibold uppercase text-xs;
}

/* 編集可能セル */
.editable-cell {
  @apply cursor-pointer hover:bg-accent/50 rounded px-2 py-1;
}

/* ピン留め列 */
.pinned-column {
  @apply sticky shadow-md bg-background/95 backdrop-blur-sm;
}

/* ソート可能列 */
.sortable-column {
  @apply cursor-pointer select-none hover:bg-accent/50;
}
```