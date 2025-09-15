# 実費入力画面 UIライブラリ活用仕様書

## 1. shadcn/ui の活用

### 1.1 使用するコンポーネント

#### 基本コンポーネント
```typescript
// 実費入力画面で使用するshadcn/uiコンポーネント
- Button          // すべてのボタン
- Card            // カード表示
- Dialog          // モーダルダイアログ
- Input           // テキスト入力
- Select          // ドロップダウン選択
- Table           // データテーブル
- Tabs            // タブ切り替え（テーブル/カードモード）
- Badge           // ステータス表示
- Toast           // 通知メッセージ
- Skeleton        // ローディング表示
- AlertDialog     // 削除確認など
- DropdownMenu    // アクションメニュー
- Sheet           // モバイルでのサイドパネル
- ScrollArea      // スクロール領域
- Separator       // 区切り線
```

#### フォーム関連
```typescript
- Form            // react-hook-form統合
- FormField       // フィールドラッパー
- FormItem        // フォームアイテム
- FormLabel       // ラベル
- FormControl     // コントロール
- FormMessage     // エラーメッセージ
```

### 1.2 カスタマイズが必要な部分

#### スワイプ対応テーブル行
```vue
<!-- ExpenseTableRow.vue -->
<template>
  <div 
    ref="rowRef"
    class="relative"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- shadcn/ui の TableRow をベースに拡張 -->
    <TableRow :class="{ 'translate-x-0': !isSwipeActive }">
      <TableCell>{{ expense.date }}</TableCell>
      <TableCell>{{ expense.category }}</TableCell>
      <TableCell>{{ expense.description }}</TableCell>
      <TableCell class="text-right">{{ expense.expenseAmount }}</TableCell>
    </TableRow>
    
    <!-- スワイプアクション -->
    <div 
      v-if="isSwipeActive"
      class="absolute right-0 top-0 h-full flex items-center gap-2 px-2"
    >
      <Button size="sm" variant="ghost" @click="handleEdit">
        <Edit class="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" @click="handleDelete">
        <Trash class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
```

## 2. 追加で必要なライブラリ

### 2.1 チャート機能について

**MVPでの必要性の検討：**
- **不要派の理由**: 
  - 実装コストが高い
  - 数値の表だけでも十分
  - エクスポート機能があれば Excel で分析可能
  
- **必要派の理由**:
  - 視覚的な把握が法律事務所の経営判断に有効
  - 競合製品との差別化
  - シンプルな円グラフ程度なら実装コスト低

**推奨**: MVPでは**シンプルな集計表のみ**実装し、Phase 2でチャート追加

もしチャートを実装する場合の推奨ライブラリ：
```json
{
  "name": "vue-chartjs",
  "reason": "Chart.jsのVueラッパー。軽量で使いやすい",
  "alternative": "apexcharts-vue3"
}
```

### 2.2 その他の推奨ライブラリ

#### 日付処理
```json
{
  "name": "dayjs",
  "version": "^1.11.10",
  "reason": "moment.jsより軽量。日付フォーマットや計算に必須",
  "usage": "実費の日付処理、期間計算、フォーマット表示"
}
```

#### CSVパース
```json
{
  "name": "papaparse",
  "version": "^5.4.1",
  "reason": "高速で信頼性の高いCSVパーサー",
  "usage": "銀行明細CSVの解析"
}
```

#### ファイルアップロード
```json
{
  "name": "@vueuse/core",
  "version": "^10.7.0",
  "reason": "useDropZone等の便利なComposables",
  "usage": "ドラッグ&ドロップ、ファイル選択"
}
```

#### PDFエクスポート
```json
{
  "name": "jspdf",
  "version": "^2.5.1",
  "reason": "クライアントサイドPDF生成",
  "usage": "実費一覧のPDFエクスポート",
  "with": "jspdf-autotable（テーブル生成用）"
}
```

#### 数値フォーマット
```json
{
  "name": "vue-currency-input",
  "version": "^3.1.0",
  "reason": "金額入力の自動フォーマット",
  "usage": "金額入力フィールド"
}
```

#### モバイルジェスチャー
```json
{
  "name": "@vueuse/gesture",
  "version": "^2.0.0",
  "reason": "スワイプ検出の実装",
  "usage": "テーブル行のスワイプ、カードスワイプ"
}
```

### 2.3 開発効率化ライブラリ

#### バリデーション
```json
{
  "name": "zod",
  "version": "^3.22.0",
  "reason": "TypeScript-firstなスキーマバリデーション",
  "usage": "フォームバリデーション、APIレスポンス検証"
}
```

#### 状態管理デバッグ
```json
{
  "name": "pinia-plugin-persistedstate",
  "version": "^3.2.0",
  "reason": "Pinia状態の永続化",
  "usage": "フィルター設定の保存"
}
```

## 3. 実装例

### 3.1 shadcn/ui + 追加ライブラリの組み合わせ

#### 日付選択コンポーネント
```vue
<!-- ExpenseDatePicker.vue -->
<template>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" class="justify-start text-left font-normal">
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ formattedDate || '日付を選択' }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar 
        v-model="selectedDate"
        :min-date="minDate"
        :max-date="maxDate"
      />
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const formattedDate = computed(() => {
  return selectedDate.value 
    ? dayjs(selectedDate.value).format('YYYY年MM月DD日')
    : null
})
</script>
```

#### 金額入力コンポーネント
```vue
<!-- ExpenseAmountInput.vue -->
<template>
  <div class="relative">
    <CurrencyInput
      v-model="amount"
      :options="currencyOptions"
      class="[&>input]:h-10 [&>input]:rounded-md [&>input]:border"
    />
    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
      円
    </span>
  </div>
</template>

<script setup lang="ts">
import { CurrencyInput } from 'vue-currency-input'

const currencyOptions = {
  currency: 'JPY',
  currencyDisplay: 'hidden',
  precision: 0,
  autoDecimalDigits: false,
  valueRange: { min: 0 }
}
</script>
```

### 3.2 CSVインポートの実装例

```typescript
// composables/useCSVImport.ts
import Papa from 'papaparse'
import dayjs from 'dayjs'

export function useCSVImport() {
  const parseCSV = (file: File): Promise<ParsedCSVRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        encoding: 'Shift-JIS', // 日本の銀行CSVはShift-JISが多い
        complete: (results) => {
          const parsed = results.data.map((row, index) => ({
            rowNumber: index + 1,
            raw: row,
            parsed: {
              date: detectDateField(row),
              description: detectDescriptionField(row),
              amount: detectAmountField(row)
            }
          }))
          resolve(parsed)
        },
        error: reject
      })
    })
  }
}
```

## 4. パフォーマンス考慮事項

### 4.1 バンドルサイズ最適化
```javascript
// vite.config.ts
export default {
  optimizeDeps: {
    include: [
      'dayjs',
      'dayjs/locale/ja'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'csv-import': ['papaparse'],
          'pdf-export': ['jspdf', 'jspdf-autotable'],
          'charts': ['chart.js', 'vue-chartjs'] // Phase 2
        }
      }
    }
  }
}
```

### 4.2 遅延ロード
```typescript
// CSVインポート機能は必要時のみロード
const ImportWizard = defineAsyncComponent(() => 
  import('@/components/expense/import/ImportWizard.vue')
)

// PDFエクスポートも遅延ロード
const exportToPDF = async () => {
  const { jsPDF } = await import('jspdf')
  await import('jspdf-autotable')
  // エクスポート処理
}
```

## 5. ライブラリ選定基準

1. **軽量性**: バンドルサイズへの影響を最小限に
2. **TypeScript対応**: 型定義が充実している
3. **メンテナンス**: 活発に開発されている
4. **Vue 3対応**: Composition APIに対応
5. **日本語対応**: 日本の業務要件に対応可能

## 6. MVPで実装を見送るもの

- **複雑なチャート**: 棒グラフ、折れ線グラフなど
- **OCR機能**: 領収書の自動読み取り
- **AIによる自動仕分け**: CSVデータの自動カテゴライズ
- **リアルタイム同期**: 複数ユーザーの同時編集

これらはPhase 2以降で検討します。