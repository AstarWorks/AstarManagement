# 実費入力画面 TypeScript型定義仕様書

## 1. 型定義ファイルの構成

### 1.1 ディレクトリ構造
```
types/
├── expense/
│   ├── index.ts              # エクスポートのバレルファイル
│   ├── expense.ts            # 基本的な実費エンティティ
│   ├── expense-dto.ts        # API通信用のDTO
│   ├── expense-filter.ts     # フィルター関連の型
│   ├── expense-import.ts     # CSVインポート関連の型
│   └── expense-report.ts     # レポート関連の型
├── common/
│   ├── api.ts               # API共通の型
│   ├── pagination.ts        # ページネーション
│   └── validation.ts        # バリデーション関連
└── ui/
    └── expense-ui.ts        # UI状態関連の型
```

## 2. 基本エンティティ型定義

### 2.1 expense.ts
```typescript
// types/expense/expense.ts

/**
 * 実費エンティティ
 */
export interface Expense {
  /** 一意識別子 */
  id: string
  
  /** 発生日 */
  date: string // ISO 8601形式 (YYYY-MM-DD)
  
  /** 科目 */
  category: ExpenseCategory
  
  /** 摘要 */
  description: string
  
  /** 収入金額 */
  incomeAmount: number
  
  /** 支出金額 */
  expenseAmount: number
  
  /** 差引残高（自動計算） */
  balance: number
  
  /** 紐付け案件ID（オプション） */
  caseId?: string
  
  /** 案件名（リレーション展開用） */
  caseName?: string
  
  /** メモ（オプション） */
  memo?: string
  
  /** 裏付け資料 */
  attachments: Attachment[]
  
  /** 作成日時 */
  createdAt: string // ISO 8601形式
  
  /** 更新日時 */
  updatedAt: string // ISO 8601形式
  
  /** 作成者ID */
  createdBy: string
  
  /** テナントID */
  tenantId: string
}

/**
 * 実費科目
 */
export enum ExpenseCategory {
  /** 交通費 */
  TRANSPORTATION = 'transportation',
  /** 印紙代 */
  STAMP_FEE = 'stamp_fee',
  /** コピー代 */
  COPY_FEE = 'copy_fee',
  /** 郵送費 */
  POSTAGE = 'postage',
  /** その他 */
  OTHER = 'other'
}

/**
 * 科目の表示名マッピング
 */
export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  [ExpenseCategory.TRANSPORTATION]: '交通費',
  [ExpenseCategory.STAMP_FEE]: '印紙代',
  [ExpenseCategory.COPY_FEE]: 'コピー代',
  [ExpenseCategory.POSTAGE]: '郵送費',
  [ExpenseCategory.OTHER]: 'その他'
}

/**
 * 添付ファイル
 */
export interface Attachment {
  /** ファイルID */
  id: string
  
  /** ファイル名 */
  fileName: string
  
  /** ファイルサイズ（バイト） */
  fileSize: number
  
  /** MIMEタイプ */
  mimeType: string
  
  /** ファイルURL */
  url: string
  
  /** アップロード日時 */
  uploadedAt: string
}

/**
 * 科目の使用頻度情報
 */
export interface CategoryUsage {
  category: ExpenseCategory
  count: number
  lastUsedAt: string
}
```

### 2.2 expense-dto.ts
```typescript
// types/expense/expense-dto.ts

import { ExpenseCategory } from './expense'

/**
 * 実費作成DTO
 */
export interface CreateExpenseDto {
  date: string
  category: ExpenseCategory
  description: string
  incomeAmount: number
  expenseAmount: number
  caseId?: string
  memo?: string
  attachmentIds?: string[]
}

/**
 * 実費更新DTO
 */
export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {
  // 全てのフィールドがオプション
}

/**
 * 実費一括削除DTO
 */
export interface DeleteExpensesDto {
  ids: string[]
}

/**
 * 実費リスト取得パラメータ
 */
export interface ListExpensesParams {
  /** ページ番号（1始まり） */
  page?: number
  
  /** 1ページあたりの件数 */
  limit?: number
  
  /** ソート順 */
  sortBy?: 'date' | 'amount' | 'category'
  
  /** ソート方向 */
  sortOrder?: 'asc' | 'desc'
  
  /** フィルター */
  filters?: ExpenseFilterParams
}

/**
 * フィルターパラメータ（API用）
 */
export interface ExpenseFilterParams {
  dateFrom?: string
  dateTo?: string
  caseId?: string
  category?: ExpenseCategory
  amountMin?: number
  amountMax?: number
  searchText?: string
}

/**
 * 実費リストレスポンス
 */
export interface ListExpensesResponse {
  data: Expense[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
```

### 2.3 expense-filter.ts
```typescript
// types/expense/expense-filter.ts

import { ExpenseCategory } from './expense'

/**
 * フロントエンド用フィルター状態
 */
export interface ExpenseFilters {
  /** 日付範囲 */
  dateRange: DateRange | null
  
  /** 案件ID */
  caseId: string | null
  
  /** 科目 */
  category: ExpenseCategory | null
  
  /** 金額範囲 */
  amountRange: AmountRange | null
  
  /** 検索テキスト */
  searchText: string
}

/**
 * 日付範囲
 */
export interface DateRange {
  start: Date
  end: Date
}

/**
 * 金額範囲
 */
export interface AmountRange {
  min: number
  max: number
}

/**
 * フィルターチップ表示用
 */
export interface FilterChip {
  id: string
  type: keyof ExpenseFilters
  label: string
  value: any
}
```

### 2.4 expense-import.ts
```typescript
// types/expense/expense-import.ts

/**
 * インポートステップ
 */
export type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

/**
 * パースされたCSV行
 */
export interface ParsedCSVRow {
  /** 行番号（エラー表示用） */
  rowNumber: number
  
  /** 元データ */
  raw: Record<string, string>
  
  /** パース結果 */
  parsed: {
    date?: string
    description?: string
    amount?: number
    [key: string]: any
  }
}

/**
 * カラムマッピング
 */
export interface ColumnMapping {
  date: string
  description: string
  amount: string
  incomeAmount?: string
  expenseAmount?: string
  memo?: string
}

/**
 * 銀行フォーマット定義
 */
export interface BankFormat {
  /** 銀行名 */
  name: string
  
  /** 識別パターン */
  identifyPattern: RegExp
  
  /** デフォルトマッピング */
  defaultMapping: ColumnMapping
  
  /** 日付フォーマット */
  dateFormat: string
}

/**
 * インポートエラー
 */
export interface ImportError {
  rowNumber: number
  field: string
  message: string
  value?: any
}

/**
 * インポート結果
 */
export interface ImportResult {
  success: number
  failed: number
  errors: ImportError[]
  importedIds: string[]
}

/**
 * 事前定義された銀行フォーマット
 */
export const BANK_FORMATS: BankFormat[] = [
  {
    name: '三菱UFJ銀行',
    identifyPattern: /三菱UFJ/,
    defaultMapping: {
      date: '日付',
      description: '摘要',
      amount: '金額',
      expenseAmount: '出金額',
      incomeAmount: '入金額'
    },
    dateFormat: 'YYYY/MM/DD'
  },
  {
    name: '楽天カード',
    identifyPattern: /楽天カード/,
    defaultMapping: {
      date: '利用日',
      description: '利用店舗',
      amount: '利用金額'
    },
    dateFormat: 'YYYY/MM/DD'
  }
  // 他の銀行フォーマット...
]
```

### 2.5 expense-report.ts
```typescript
// types/expense/expense-report.ts

/**
 * レポートタイプ
 */
export type ReportType = 'case' | 'lawyer' | 'category' | 'office'

/**
 * レポート期間タイプ
 */
export type PeriodType = 'month' | 'quarter' | 'year' | 'custom'

/**
 * レポートリクエスト
 */
export interface ReportRequest {
  type: ReportType
  periodType: PeriodType
  startDate: string
  endDate: string
  groupBy?: string
}

/**
 * レポートサマリー
 */
export interface ReportSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  count: number
  period: {
    start: string
    end: string
  }
}

/**
 * レポート明細行
 */
export interface ReportBreakdownItem {
  /** グループ名（案件名、弁護士名など） */
  label: string
  
  /** グループID */
  id: string
  
  /** 収入合計 */
  income: number
  
  /** 支出合計 */
  expense: number
  
  /** 件数 */
  count: number
  
  /** 全体に対する割合 */
  percentage: number
}

/**
 * レポートレスポンス
 */
export interface ReportResponse {
  summary: ReportSummary
  breakdown: ReportBreakdownItem[]
  chartData: {
    labels: string[]
    datasets: ChartDataset[]
  }
}

/**
 * グラフデータセット
 */
export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string[]
  borderColor?: string
}
```

## 3. 共通型定義

### 3.1 api.ts
```typescript
// types/common/api.ts

/**
 * APIエラーレスポンス
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

/**
 * APIレスポンスラッパー
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

/**
 * フェッチオプション
 */
export interface FetchOptions {
  page?: number
  append?: boolean
  filters?: Record<string, any>
}
```

### 3.2 pagination.ts
```typescript
// types/common/pagination.ts

/**
 * ページネーション状態
 */
export interface PaginationState {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/**
 * ページネーションパラメータ
 */
export interface PaginationParams {
  page: number
  limit: number
}
```

## 4. UI状態型定義

### 4.1 expense-ui.ts
```typescript
// types/ui/expense-ui.ts

/**
 * 列表示設定
 */
export interface ColumnVisibility {
  date: boolean
  category: boolean
  description: boolean
  income: boolean
  expense: boolean
  balance: boolean
  case: boolean
  memo: boolean
}

/**
 * モーダル状態
 */
export interface ModalState {
  isOpen: boolean
  type: 'create' | 'edit' | 'delete' | 'import' | null
  data?: any
}

/**
 * トースト通知
 */
export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}
```

## 5. 型ガード関数

```typescript
// types/expense/guards.ts

import { Expense, ExpenseCategory } from './expense'

/**
 * Expense型ガード
 */
export function isExpense(value: any): value is Expense {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    Object.values(ExpenseCategory).includes(value.category) &&
    typeof value.description === 'string' &&
    typeof value.incomeAmount === 'number' &&
    typeof value.expenseAmount === 'number'
  )
}

/**
 * 有効な日付文字列かチェック
 */
export function isValidDateString(value: string): boolean {
  const date = new Date(value)
  return !isNaN(date.getTime())
}

/**
 * 有効な金額かチェック
 */
export function isValidAmount(value: any): value is number {
  return typeof value === 'number' && value >= 0 && isFinite(value)
}
```

## 6. 使用例

```typescript
// コンポーネントでの使用例
import type { Expense, CreateExpenseDto } from '@/types/expense'
import { ExpenseCategory, ExpenseCategoryLabels } from '@/types/expense'

// ストアでの使用例
import type { PaginationState } from '@/types/common'
import type { ExpenseFilters } from '@/types/expense'

// API呼び出しでの使用例
import type { ApiResponse, ListExpensesResponse } from '@/types'
```