# 報酬管理画面 - 勘定科目設計

## 勘定科目の運用方針

### 1. 勘定科目の種類

#### システムプリセット勘定科目
弁護士事務所でよく使う勘定科目を事前定義します。これらは削除・編集不可とします。

**収入系：**
- 売上高（報酬）
- 雑収入

**経費系：**
- 旅費交通費
- 通信費
- 接待交際費
- 会議費
- 消耗品費
- 事務用品費
- 図書新聞費
- 支払手数料
- 租税公課
- 地代家賃
- 水道光熱費
- 保険料
- 修繕費
- 減価償却費
- 雑費

#### カスタム勘定科目
- 事務所独自の勘定科目を追加可能
- **全員が追加・編集・削除可能**（権限制限なし）
- 使用中の勘定科目は削除不可（参照整合性）

### 2. 実費入力時の勘定科目選択

#### UI設計
```typescript
interface AccountCodeSelectorProps {
  modelValue: string  // 選択中の勘定科目コード
  category?: 'income' | 'expense'  // 収入/経費でフィルタ
  showCode?: boolean  // コードも表示するか
}
```

#### 表示順序
1. よく使う順（使用回数でソート）
2. システムプリセット → カスタムの順
3. 同じ使用回数の場合は名前順

#### 選択UI
- ドロップダウン形式
- 検索機能付き（名前で部分一致検索）
- 最近使った5件を上部に表示

### 3. 勘定科目管理画面

別途、勘定科目を管理する画面を用意します。

#### 機能
- 一覧表示（システム/カスタムの区別付き）
- カスタム勘定科目の追加
- カスタム勘定科目の編集・削除
- 使用回数の表示
- CSVインポート/エクスポート

#### 画面遷移
- 設定メニュー → 勘定科目管理
- 実費入力画面から「勘定科目を管理」リンク

### 4. データ構造

```typescript
interface AccountCode {
  id: string
  code: string  // 勘定科目コード
  name: string  // 勘定科目名
  category: 'income' | 'expense'  // 収入/経費
  isSystem: boolean  // システムプリセットか
  isActive: boolean  // 有効/無効
  displayOrder: number  // 表示順
  usageCount: number  // 使用回数
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string
}
```

### 5. コンポーネント設計

#### AccountCodeSelector（勘定科目選択）
```vue
<template>
  <div class="account-code-selector">
    <Label>勘定科目</Label>
    <Select v-model="selectedCode" @update:modelValue="handleSelect">
      <SelectTrigger>
        <SelectValue :placeholder="placeholder" />
      </SelectTrigger>
      <SelectContent>
        <!-- 検索ボックス -->
        <div class="p-2">
          <Input 
            v-model="searchQuery" 
            placeholder="勘定科目を検索..."
            class="h-8"
          />
        </div>
        
        <!-- 最近使った項目 -->
        <SelectGroup v-if="recentCodes.length">
          <SelectLabel>最近使った項目</SelectLabel>
          <SelectItem 
            v-for="code in recentCodes"
            :key="code.id"
            :value="code.code"
          >
            {{ code.name }}
            <span v-if="showCode" class="text-muted-foreground ml-2">
              ({{ code.code }})
            </span>
          </SelectItem>
        </SelectGroup>
        
        <SelectSeparator v-if="recentCodes.length" />
        
        <!-- すべての項目 -->
        <SelectGroup>
          <SelectLabel>すべての勘定科目</SelectLabel>
          <SelectItem 
            v-for="code in filteredCodes"
            :key="code.id"
            :value="code.code"
          >
            {{ code.name }}
            <span v-if="showCode" class="text-muted-foreground ml-2">
              ({{ code.code }})
            </span>
          </SelectItem>
        </SelectGroup>
        
        <!-- 管理画面へのリンク -->
        <SelectSeparator />
        <div class="p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            class="w-full justify-start"
            @click="openAccountCodeManager"
          >
            <Settings class="h-4 w-4 mr-2" />
            勘定科目を管理
          </Button>
        </div>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
// 実装省略
</script>
```

#### AccountCodeManager（勘定科目管理）
- 一覧表示（DataTable使用）
- 追加・編集・削除モーダル
- インポート/エクスポート機能

### 6. API設計

```typescript
// 勘定科目一覧取得
GET /api/v1/account-codes

// 勘定科目作成
POST /api/v1/account-codes
{
  "code": "custom_001",
  "name": "カスタム勘定科目",
  "category": "expense"
}

// 勘定科目更新
PUT /api/v1/account-codes/{id}

// 勘定科目削除
DELETE /api/v1/account-codes/{id}

// 使用回数インクリメント（内部API）
POST /api/v1/account-codes/{id}/increment-usage
```