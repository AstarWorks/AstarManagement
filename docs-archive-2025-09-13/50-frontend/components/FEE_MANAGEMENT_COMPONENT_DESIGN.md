# 報酬管理画面 - コンポーネント詳細設計

## コンポーネント一覧

### 1. クイック入力関連
- QuickExpenseButton - よく使う項目のボタン
- QuickExpenseManager - テンプレート管理

### 2. 金額入力関連
- AmountInput - 金額入力コンポーネント
- CalculatorPad - 電卓風テンキー

### 3. 実費入力フォーム関連
- ExpenseForm - メインの入力フォーム
- DescriptionInput - 摘要入力
- CaseSelector - 案件選択

### 4. 領収書関連
- ReceiptUploader - 領収書アップロード
- CameraCapture - カメラ撮影モーダル

### 5. 一覧表示関連
- ExpenseListItem - 実費リストの1行
- ExpenseGroupHeader - グループヘッダー
- ExpenseSummaryCard - 集計カード

### 6. フィルター・検索関連
- ExpenseFilters - フィルターパネル
- MonthPicker - 月選択

### 7. アクション関連
- ExpenseActions - 一括操作

### 8. レポート関連
- ExpenseChart - 経費グラフ
- ExpenseReportSummary - レポートサマリー
- ReportExporter - レポート出力

### 9. 共通UI部品
- LoadingSpinner - ローディング表示
- EmptyState - データなし表示
- ErrorBoundary - エラー処理
- ConfirmDialog - 確認ダイアログ

### 10. モバイル専用
- SwipeableListItem - スワイプ可能なリストアイテム
- FloatingActionButton - フローティングボタン

## コンポーネント詳細設計

### 1. QuickExpenseButton（クイック入力ボタン）

```typescript
// Props定義
interface QuickExpenseButtonProps {
  template: ExpenseTemplate
  onClick: (template: ExpenseTemplate) => void
  onLongPress?: (template: ExpenseTemplate) => void
  isEditable?: boolean
}

interface ExpenseTemplate {
  id: string
  name: string
  icon: string  // 絵文字
  accountCode: string
  accountName: string
  defaultDescription: string
  displayOrder: number
  usageCount: number
}
```

**機能要件**:
- クリックでテンプレートの内容をフォームに反映
- 長押しで編集モード（全員編集可能）
- 使用回数のカウント

**表示要件**:
- 絵文字を大きく表示
- 項目名は下に小さく
- タップ時のフィードバック

**実装例**:
```vue
<template>
  <button
    class="quick-expense-button"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchCancel"
  >
    <span class="icon">{{ template.icon }}</span>
    <span class="name">{{ template.name }}</span>
  </button>
</template>

<script setup lang="ts">
import { useLongPress } from '@vueuse/core'

const props = defineProps<QuickExpenseButtonProps>()
const emit = defineEmits<{
  click: [template: ExpenseTemplate]
  longPress: [template: ExpenseTemplate]
}>()

const { isPressed } = useLongPress(
  () => emit('longPress', props.template),
  { delay: 500 }
)

const handleClick = () => {
  emit('click', props.template)
}
</script>
```

### 2. AmountInput（金額入力）

```typescript
// Props定義
interface AmountInputProps {
  modelValue: number | string
  mode?: 'normal' | 'calculator'  // 入力モード
  placeholder?: string
  disabled?: boolean
  showTaxToggle?: boolean  // 税込/税抜切り替え表示
  taxRate?: number  // 消費税率（デフォルト10%）
}

// Emits定義
interface AmountInputEmits {
  'update:modelValue': [value: number]
  'update:mode': [mode: 'normal' | 'calculator']
  'change': [value: number]
}

// 内部状態
interface AmountInputState {
  displayValue: string  // 表示用（カンマ付き）
  rawValue: string     // 生の数値
  isTaxIncluded: boolean  // 税込みフラグ
}
```

**機能要件**:
- 通常入力: `<input type="tel">` で数値キーボード表示
- 電卓モード: CalculatorPadコンポーネントを表示
- 3桁カンマの自動挿入
- 税込/税抜の切り替え（オプション）
- モード切り替えボタン

**表示要件**:
- 金額は大きく見やすく
- 円マーク（¥）は左に固定表示
- モード切り替えアイコンは右端

### 3. CalculatorPad（電卓風テンキー）

```typescript
// Props定義
interface CalculatorPadProps {
  modelValue: string | number
  maxLength?: number  // 最大桁数（デフォルト: 10）
  showDecimal?: boolean  // 小数点ボタン表示（デフォルト: false）
}

// Emits定義
interface CalculatorPadEmits {
  'update:modelValue': [value: string]
  'confirm': [value: number]  // 確定ボタン押下時
  'cancel': []  // キャンセル時
}

// ボタン配置
const buttonLayout = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['00', '0', 'backspace']
]
```

**機能要件**:
- 数字ボタン（0-9、00）
- バックスペース（1文字削除）
- クリアボタン（全削除）
- 確定ボタン
- タップ時の振動フィードバック（モバイル）

**表示要件**:
- ボタンは大きめ（親指で押しやすいサイズ）
- 押下時のアニメーション
- 現在の入力値を上部に表示

### 4. ExpenseForm（実費入力フォーム）

```typescript
// Props定義
interface ExpenseFormProps {
  expense?: Expense  // 編集時の既存データ
  template?: ExpenseTemplate  // テンプレートからの初期値
  caseId?: string  // 案件指定時
  onSubmit: (data: ExpenseFormData) => Promise<void>
  onCancel?: () => void
  continuousMode?: boolean  // 連続入力モード
}

// フォームデータ定義
interface ExpenseFormData {
  amount: number
  date: string  // YYYY-MM-DD
  description: string
  caseId: string
  expenseType: 'office' | 'personal' | 'case'
  accountCode: string
  paymentMethod: 'cash' | 'credit' | 'advance'
  memo?: string
  receiptFile?: File
  hasWithholding?: boolean
  withholdingAmount?: number
}

// 内部状態
interface ExpenseFormState {
  isSubmitting: boolean
  errors: Record<string, string>
  showAdvancedOptions: boolean
  receiptPreview: string | null
}
```

**機能要件**:
- バリデーション
  - 金額: 必須、1以上
  - 日付: 必須、未来日は不可
  - 摘要: 必須
  - 案件: 案件実費の場合は必須
- 連続入力モード時
  - 保存後、フォームをリセット
  - 成功トーストを表示
  - 日付と案件は維持（同じ日・同じ案件で複数入力が多いため）
  - リセットボタンで全項目クリア可能

**UI構成**:
1. 金額入力（AmountInput使用）
2. 日付（デフォルト: 今日）
3. 摘要（DescriptionInput使用）
4. 案件選択（CaseSelector使用）
5. 領収書（ReceiptUploader使用）
6. 詳細オプション（折りたたみ）
   - 支払方法
   - メモ
   - 源泉徴収

## 実装における注意点

### パフォーマンス最適化
- リスト表示は仮想スクロールを検討
- 画像は圧縮してからアップロード
- 頻繁に使うデータはキャッシュ

### アクセシビリティ
- キーボード操作対応
- スクリーンリーダー対応
- 適切なARIAラベル

### エラーハンドリング
- ネットワークエラー時の再試行
- 一時保存機能
- わかりやすいエラーメッセージ