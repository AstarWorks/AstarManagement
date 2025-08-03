# 実費入力画面 コンポーネント設計書

## 1. コンポーネント構成概要

### 1.1 ディレクトリ構造
```
components/
├── expense/
│   ├── list/
│   │   ├── ExpenseListPage.vue         # ページコンテナ（状態管理）
│   │   ├── ExpenseListHeader.vue       # ヘッダー（タイトル・アクション）
│   │   ├── ExpenseSummaryBar.vue       # 集計サマリー表示
│   │   ├── ExpenseTable.vue            # テーブル本体
│   │   ├── ExpenseTableRow.vue         # テーブル行
│   │   ├── ExpenseSwipeActions.vue     # スワイプアクション
│   │   ├── ExpenseBulkActions.vue      # 一括操作ボタン
│   │   └── ExpenseColumnSettings.vue   # 列表示設定
│   │
│   ├── form/
│   │   ├── ExpenseFormPage.vue         # フォームページコンテナ
│   │   ├── ExpenseQuickForm.vue        # モバイル用簡易フォーム
│   │   ├── ExpenseDetailForm.vue       # PC用詳細フォーム
│   │   ├── ExpenseFormField.vue        # 個別フィールドラッパー
│   │   ├── ExpenseCategorySelect.vue   # 科目選択（使用頻度順）
│   │   ├── ExpenseCaseSelect.vue       # 案件選択
│   │   └── ExpenseAttachmentArea.vue   # 裏付け資料エリア
│   │
│   ├── import/
│   │   ├── ImportWizard.vue            # インポートウィザードコンテナ
│   │   ├── ImportFileDropzone.vue      # ファイルドロップゾーン
│   │   ├── ImportFormatDetector.vue    # フォーマット自動認識
│   │   ├── ImportColumnMapper.vue      # カラムマッピング設定
│   │   ├── ImportPreviewTable.vue      # テーブルプレビュー
│   │   ├── ImportCardStack.vue         # カードスタック表示
│   │   ├── ImportSwipeCard.vue         # 個別スワイプカード
│   │   ├── ImportProgressBar.vue       # 進捗表示
│   │   └── ImportResultSummary.vue     # インポート結果
│   │
│   ├── report/
│   │   ├── ReportPage.vue              # レポートページコンテナ
│   │   ├── ReportPeriodSelector.vue    # 期間選択
│   │   ├── ReportTypeSelector.vue      # レポート種別選択
│   │   ├── ReportSummaryCard.vue       # サマリーカード
│   │   ├── ReportPieChart.vue          # 円グラフ
│   │   ├── ReportBarChart.vue          # 棒グラフ
│   │   ├── ReportDataTable.vue         # データテーブル
│   │   └── ReportExportMenu.vue        # エクスポートメニュー
│   │
│   ├── filter/
│   │   ├── ExpenseFilterBar.vue        # フィルターバー全体
│   │   ├── ExpenseDateRangePicker.vue  # 期間選択
│   │   ├── ExpenseAmountFilter.vue     # 金額範囲フィルター
│   │   ├── ExpenseSearchInput.vue      # テキスト検索
│   │   └── ExpenseFilterChips.vue      # 適用中フィルター表示
│   │
│   └── shared/
│       ├── ExpenseEmptyState.vue       # 空状態表示
│       ├── ExpenseErrorState.vue       # エラー状態表示
│       ├── ExpenseLoadingState.vue     # ローディング状態
│       └── ExpenseActionButton.vue     # 共通アクションボタン
│
└── ui/ (shadcn/ui components)
    ├── button.vue
    ├── card.vue
    ├── dialog.vue
    ├── input.vue
    ├── select.vue
    ├── table.vue
    └── ...
```

### 1.2 単一責任の原則に基づく設計

各コンポーネントは以下の単一責任を持ちます：

#### リスト系
- **ExpenseListPage**: 一覧画面の状態管理とレイアウト調整のみ
- **ExpenseTable**: テーブルの描画とスクロール管理のみ
- **ExpenseTableRow**: 1行の表示とスワイプジェスチャー検知のみ
- **ExpenseSwipeActions**: スワイプ時のアクションボタン表示のみ

#### フォーム系
- **ExpenseFormField**: フィールドのラベル表示とエラー表示のみ
- **ExpenseCategorySelect**: 科目選択と使用頻度ソートのみ
- **ExpenseAttachmentArea**: ファイル選択とプレビュー表示のみ

#### インポート系
- **ImportWizard**: ステップ管理と画面遷移のみ
- **ImportFormatDetector**: CSVフォーマット認識のみ
- **ImportSwipeCard**: 1枚のカード表示とアニメーションのみ
- **ImportCardStack**: カードの配置とスタック管理のみ

#### レポート系
- **ReportPieChart**: 円グラフの描画のみ
- **ReportDataTable**: 集計データのテーブル表示のみ
- **ReportExportMenu**: エクスポート形式選択のみ

## 2. 主要コンポーネント詳細

### 2.1 ExpenseList.vue

#### 概要
実費データの一覧表示と管理を行うメインコンポーネント

#### Props
```typescript
interface ExpenseListProps {
  // 初期表示する実費データ
  initialExpenses?: Expense[]
  // 1ページあたりの表示件数
  pageSize?: number // default: 30
}
```

#### State
```typescript
interface ExpenseListState {
  expenses: Expense[]
  filteredExpenses: Expense[]
  currentPage: number
  sortOrder: 'asc' | 'desc'
  sortBy: 'date' | 'amount' | 'category'
  selectedExpenses: string[] // 複数選択時のID配列
  isLoading: boolean
  showColumnSettings: boolean
  visibleColumns: {
    date: boolean
    category: boolean
    description: boolean
    income: boolean
    expense: boolean
    balance: boolean
    case: boolean
    memo: boolean
  }
}
```

#### Methods
```typescript
// データ取得
async fetchExpenses(page: number): Promise<void>

// フィルタリング（フロントエンド）
filterExpenses(filters: ExpenseFilters): void

// 並び替え
sortExpenses(column: string): void

// 削除
async deleteExpense(id: string): Promise<void>

// 一括削除
async deleteMultiple(ids: string[]): Promise<void>

// エクスポート
async exportToCSV(): Promise<void>
async exportToPDF(): Promise<void>

// 列の表示/非表示切り替え
toggleColumn(columnName: string): void
```

#### Events
```typescript
// 新規作成
@create-new

// 編集
@edit(expense: Expense)

// 削除完了
@deleted(ids: string[])
```

### 2.2 ExpenseForm.vue

#### 概要
実費の新規入力・編集を行うフォームコンポーネント

#### Props
```typescript
interface ExpenseFormProps {
  // 編集モードの場合の既存データ
  expense?: Expense
  // モバイル最適化モード
  isMobile?: boolean
  // 簡易入力モード
  quickMode?: boolean
}
```

#### State
```typescript
interface ExpenseFormState {
  formData: {
    date: string
    category: string
    description: string
    incomeAmount: number
    expenseAmount: number
    caseId?: string
    memo?: string
    attachments: File[]
  }
  errors: Record<string, string>
  isSubmitting: boolean
  showOptionalFields: boolean
  recentCategories: string[] // 使用頻度順
}
```

#### Validation
```typescript
// バリデーションルール
const validationRules = {
  date: required(),
  category: required(),
  description: required(),
  expenseAmount: required(), min(0),
  incomeAmount: min(0)
}
```

#### Methods
```typescript
// フォーム送信
async submit(): Promise<void>

// 添付ファイルアップロード
async uploadAttachment(file: File): Promise<void>

// テンプレート適用（将来実装）
applyTemplate(template: ExpenseTemplate): void

// リセット
reset(): void
```

### 2.3 ExpenseImport.vue

#### 概要
CSVファイルのインポートと仕分けを行うコンポーネント

#### State
```typescript
interface ExpenseImportState {
  step: 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'
  file: File | null
  parsedData: ParsedCSVRow[]
  columnMapping: Record<string, string>
  viewMode: 'table' | 'card'
  
  // カードモード用
  currentCardIndex: number
  decisions: Record<number, 'accept' | 'reject'>
  
  // テーブルモード用
  selectedRows: number[]
  
  importProgress: number
  errors: ImportError[]
}
```

#### Methods
```typescript
// ファイルパース
async parseCSV(file: File): Promise<void>

// カラムマッピング自動認識
detectColumnMapping(): Record<string, string>

// カードモード: スワイプ判定
swipeCard(direction: 'left' | 'right'): void

// カードモード: やり直し
undoLastDecision(): void

// テーブルモード: 一括選択
selectAll(checked: boolean): void

// インポート実行
async importSelected(): Promise<void>
```

確認事項：
1. コンポーネントの粒度はこれで適切ですか？
2. 状態管理はComposablesとPiniaのどちらを使いますか？
3. TypeScriptの型定義は別ファイルにまとめますか？

### 2.4 ExpenseReport.vue

#### 概要
実費データの集計とレポート表示を行うコンポーネント

#### Props
```typescript
interface ExpenseReportProps {
  // レポートタイプ
  type: 'case' | 'lawyer' | 'category' | 'office'
}
```

#### State
```typescript
interface ExpenseReportState {
  period: {
    type: 'month' | 'quarter' | 'year' | 'custom'
    start: string
    end: string
  }
  reportData: {
    summary: {
      totalIncome: number
      totalExpense: number
      balance: number
      count: number
    }
    breakdown: Array<{
      label: string
      income: number
      expense: number
      count: number
      percentage: number
    }>
  }
  chartType: 'pie' | 'bar'
  isLoading: boolean
}
```

## 3. 共通コンポーネント

### 3.1 ExpenseItem.vue
```typescript
interface ExpenseItemProps {
  expense: Expense
  showBalance: boolean
  isSelected: boolean
  isMobile: boolean
}

// スワイプ操作のサポート
const { isSwipeActive, swipeOffset } = useSwipeGesture()
```

### 3.2 CategorySelect.vue
```typescript
interface CategorySelectProps {
  modelValue: string
  categories: Category[]
  sortByFrequency: boolean
}

// 使用頻度によるソート
const sortedCategories = computed(() => {
  if (!props.sortByFrequency) return props.categories
  return [...props.categories].sort((a, b) => b.usageCount - a.usageCount)
})
```

## 4. Composables

### 4.1 useExpenseData.ts
```typescript
export function useExpenseData() {
  const expenses = ref<Expense[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const fetchExpenses = async (filters?: ExpenseFilters) => {
    // API呼び出し
  }

  const createExpense = async (data: CreateExpenseDto) => {
    // 作成処理
  }

  const updateExpense = async (id: string, data: UpdateExpenseDto) => {
    // 更新処理
  }

  const deleteExpense = async (id: string) => {
    // 削除処理
  }

  return {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  }
}
```

### 4.2 useCSVImport.ts
```typescript
export function useCSVImport() {
  const parseCSV = async (file: File): Promise<ParsedCSVRow[]> => {
    // CSV解析ロジック
  }

  const detectBankFormat = (headers: string[]): BankFormat => {
    // 銀行フォーマット自動認識
  }

  const mapColumns = (data: any[], mapping: ColumnMapping): Expense[] => {
    // カラムマッピング処理
  }

  return {
    parseCSV,
    detectBankFormat,
    mapColumns
  }
}
```

## 5. 型定義

### 5.1 基本型
```typescript
interface Expense {
  id: string
  date: string
  category: string
  description: string
  incomeAmount: number
  expenseAmount: number
  balance: number
  caseId?: string
  caseName?: string
  memo?: string
  attachments?: Attachment[]
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  usageCount: number
}

interface Attachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
}
```

## 6. 状態管理戦略

### 6.1 Pinia Storeの構成

#### 6.1.1 メインストア構造
```
stores/
├── expense/
│   ├── expense.store.ts         # 実費データの基本CRUD
│   ├── expense-filter.store.ts  # フィルター状態管理
│   ├── expense-import.store.ts  # CSVインポート状態
│   └── expense-report.store.ts  # レポート生成状態
├── ui/
│   ├── expense-ui.store.ts      # UI状態（モーダル、ローディング等）
│   └── expense-settings.store.ts # ユーザー設定（列表示等）
└── cache/
    └── expense-cache.store.ts    # キャッシュ管理
```

#### 6.1.2 実費データストア (expense.store.ts)
```typescript
export const useExpenseStore = defineStore('expense', () => {
  // State
  const expenses = ref<Expense[]>([])
  const currentExpense = ref<Expense | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  
  // ページネーション
  const pagination = ref({
    page: 1,
    pageSize: 30,
    total: 0,
    hasMore: true
  })

  // Getters
  const expenseById = computed(() => {
    return (id: string) => expenses.value.find(e => e.id === id)
  })

  const sortedExpenses = computed(() => {
    return [...expenses.value].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  })

  // Actions
  async function fetchExpenses(options?: FetchOptions) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await api.expenses.list({
        page: options?.page || pagination.value.page,
        limit: pagination.value.pageSize,
        ...options?.filters
      })
      
      if (options?.append) {
        expenses.value.push(...response.data)
      } else {
        expenses.value = response.data
      }
      
      pagination.value.total = response.total
      pagination.value.hasMore = response.hasMore
    } catch (e) {
      error.value = e as Error
    } finally {
      isLoading.value = false
    }
  }

  async function createExpense(data: CreateExpenseDto) {
    const response = await api.expenses.create(data)
    expenses.value.unshift(response)
    return response
  }

  async function updateExpense(id: string, data: UpdateExpenseDto) {
    const response = await api.expenses.update(id, data)
    const index = expenses.value.findIndex(e => e.id === id)
    if (index !== -1) {
      expenses.value[index] = response
    }
    return response
  }

  async function deleteExpense(id: string) {
    await api.expenses.delete(id)
    expenses.value = expenses.value.filter(e => e.id !== id)
  }

  async function deleteMultiple(ids: string[]) {
    await api.expenses.deleteMultiple(ids)
    expenses.value = expenses.value.filter(e => !ids.includes(e.id))
  }

  return {
    // State
    expenses: readonly(expenses),
    currentExpense: readonly(currentExpense),
    isLoading: readonly(isLoading),
    error: readonly(error),
    pagination: readonly(pagination),
    
    // Getters
    expenseById,
    sortedExpenses,
    
    // Actions
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    deleteMultiple
  }
})
```

#### 6.1.3 フィルターストア (expense-filter.store.ts)
```typescript
export const useExpenseFilterStore = defineStore('expense-filter', () => {
  // フィルター状態
  const filters = ref<ExpenseFilters>({
    dateRange: null,
    caseId: null,
    category: null,
    amountRange: null,
    searchText: ''
  })

  // アクティブなフィルター数
  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.dateRange) count++
    if (filters.value.caseId) count++
    if (filters.value.category) count++
    if (filters.value.amountRange) count++
    if (filters.value.searchText) count++
    return count
  })

  // フィルター適用
  function applyFilter(filterType: keyof ExpenseFilters, value: any) {
    filters.value[filterType] = value
  }

  // フィルタークリア
  function clearFilter(filterType?: keyof ExpenseFilters) {
    if (filterType) {
      filters.value[filterType] = null
    } else {
      filters.value = {
        dateRange: null,
        caseId: null,
        category: null,
        amountRange: null,
        searchText: ''
      }
    }
  }

  // フロントエンドフィルタリング（MVP用）
  function filterExpenses(expenses: Expense[]): Expense[] {
    return expenses.filter(expense => {
      // 日付範囲
      if (filters.value.dateRange) {
        const date = new Date(expense.date)
        if (date < filters.value.dateRange.start || 
            date > filters.value.dateRange.end) {
          return false
        }
      }

      // 案件
      if (filters.value.caseId && expense.caseId !== filters.value.caseId) {
        return false
      }

      // 科目
      if (filters.value.category && expense.category !== filters.value.category) {
        return false
      }

      // 金額範囲
      if (filters.value.amountRange) {
        const amount = expense.expenseAmount
        if (amount < filters.value.amountRange.min || 
            amount > filters.value.amountRange.max) {
          return false
        }
      }

      // テキスト検索
      if (filters.value.searchText) {
        const searchLower = filters.value.searchText.toLowerCase()
        return expense.description.toLowerCase().includes(searchLower) ||
               expense.memo?.toLowerCase().includes(searchLower)
      }

      return true
    })
  }

  return {
    filters: readonly(filters),
    activeFilterCount,
    applyFilter,
    clearFilter,
    filterExpenses
  }
})
```

#### 6.1.4 インポートストア (expense-import.store.ts)
```typescript
export const useExpenseImportStore = defineStore('expense-import', () => {
  // インポート状態
  const step = ref<ImportStep>('upload')
  const file = ref<File | null>(null)
  const parsedData = ref<ParsedCSVRow[]>([])
  const columnMapping = ref<ColumnMapping>({})
  const viewMode = ref<'table' | 'card'>('table')
  
  // カードモード用
  const currentCardIndex = ref(0)
  const decisions = ref<Map<number, 'accept' | 'reject'>>(new Map())
  
  // テーブルモード用
  const selectedRows = ref<Set<number>>(new Set())
  
  // インポート進捗
  const importProgress = ref({
    current: 0,
    total: 0,
    isImporting: false
  })

  // カード操作
  function swipeCard(direction: 'left' | 'right') {
    const decision = direction === 'right' ? 'accept' : 'reject'
    decisions.value.set(currentCardIndex.value, decision)
    
    if (currentCardIndex.value < parsedData.value.length - 1) {
      currentCardIndex.value++
    }
  }

  function undoLastDecision() {
    if (currentCardIndex.value > 0) {
      currentCardIndex.value--
      decisions.value.delete(currentCardIndex.value)
    }
  }

  // インポート実行
  async function executeImport() {
    importProgress.value.isImporting = true
    const expenseStore = useExpenseStore()
    
    // 選択されたデータを取得
    const selectedData = viewMode.value === 'table' 
      ? parsedData.value.filter((_, index) => selectedRows.value.has(index))
      : parsedData.value.filter((_, index) => decisions.value.get(index) === 'accept')

    importProgress.value.total = selectedData.length

    // バッチ処理
    const batchSize = 10
    for (let i = 0; i < selectedData.length; i += batchSize) {
      const batch = selectedData.slice(i, i + batchSize)
      const mapped = batch.map(row => mapRowToExpense(row, columnMapping.value))
      
      await Promise.all(
        mapped.map(expense => expenseStore.createExpense(expense))
      )
      
      importProgress.value.current = Math.min(i + batchSize, selectedData.length)
    }

    importProgress.value.isImporting = false
    step.value = 'complete'
  }

  function reset() {
    step.value = 'upload'
    file.value = null
    parsedData.value = []
    columnMapping.value = {}
    currentCardIndex.value = 0
    decisions.value.clear()
    selectedRows.value.clear()
    importProgress.value = { current: 0, total: 0, isImporting: false }
  }

  return {
    // State
    step: readonly(step),
    file: readonly(file),
    parsedData: readonly(parsedData),
    columnMapping,
    viewMode,
    currentCardIndex: readonly(currentCardIndex),
    decisions: readonly(decisions),
    selectedRows: readonly(selectedRows),
    importProgress: readonly(importProgress),
    
    // Actions
    setStep: (s: ImportStep) => step.value = s,
    setFile: (f: File) => file.value = f,
    setParsedData: (data: ParsedCSVRow[]) => parsedData.value = data,
    swipeCard,
    undoLastDecision,
    toggleRowSelection: (index: number) => {
      if (selectedRows.value.has(index)) {
        selectedRows.value.delete(index)
      } else {
        selectedRows.value.add(index)
      }
    },
    selectAllRows: () => {
      parsedData.value.forEach((_, index) => selectedRows.value.add(index))
    },
    deselectAllRows: () => selectedRows.value.clear(),
    executeImport,
    reset
  }
})
```

### 6.2 Composablesとの連携

```typescript
// composables/useExpenseList.ts
export function useExpenseList() {
  const expenseStore = useExpenseStore()
  const filterStore = useExpenseFilterStore()
  const router = useRouter()

  // フィルター適用済みデータ
  const filteredExpenses = computed(() => {
    return filterStore.filterExpenses(expenseStore.sortedExpenses)
  })

  // 初期化
  onMounted(async () => {
    if (!expenseStore.expenses.length) {
      await expenseStore.fetchExpenses()
    }
  })

  // ページネーション
  async function loadMore() {
    if (expenseStore.pagination.hasMore && !expenseStore.isLoading) {
      await expenseStore.fetchExpenses({
        page: expenseStore.pagination.page + 1,
        append: true
      })
    }
  }

  // 新規作成
  function createNew() {
    router.push('/expenses/new')
  }

  return {
    expenses: filteredExpenses,
    isLoading: expenseStore.isLoading,
    error: expenseStore.error,
    loadMore,
    createNew
  }
}
```

次は、これらのコンポーネントの実装詳細について掘り下げますか？それとも別の設計書に進みますか？