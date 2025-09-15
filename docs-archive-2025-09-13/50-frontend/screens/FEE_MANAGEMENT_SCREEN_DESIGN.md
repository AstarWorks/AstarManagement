# 報酬管理画面設計

## 概要

スマホでの実費記録を最優先に、経費管理、請求書作成まで一貫して管理できる画面設計。会計士とのやり取りをスムーズにすることを第一目的とします。

## 画面構成

### 1. メインダッシュボード

```
┌─────────────────────────────────────────────────┐
│ 報酬・経費管理                                   │
├─────────────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┬──────────┐    │
│ │ 実費記録 │ 経費一覧 │ 請求書  │ レポート │    │
│ └─────────┴─────────┴─────────┴──────────┘    │
│                                                 │
│ 📱 クイック入力（よく使う項目）                 │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│ │ 🚕 │ │ 📮 │ │ 📄 │ │ 🚃 │ │ ☕ │ │ ➕ │  │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘  │
│                                                 │
│ 今月の集計                                      │
│ ┌───────────────────────────────────────────┐ │
│ │ 収入: ¥1,234,567  支出: ¥456,789          │ │
│ │ 差額: ¥777,778                            │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ 最近の記録                                      │
│ ┌───────────────────────────────────────────┐ │
│ │ 1/20 タクシー代       ¥1,200  案件:2024-001│ │
│ │ 1/20 収入印紙代      ¥10,000  案件:2024-002│ │
│ │ 1/19 交通費（電車）    ¥540  案件:2024-001│ │
│ └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 使用ライブラリ

### コアライブラリ
- **VueUse**: カメラ制御、ローカルストレージ管理
- **@tanstack/vue-query**: APIキャッシング
- **floating-vue**: ツールチップ、ポップオーバー

### UIコンポーネント
- **shadcn-vue**: ベースUIコンポーネント
- **vue-sonner**: トースト通知（スマホ対応）
- **vue-number-format**: 金額入力フォーマット

### ファイル処理
- **compressorjs**: 画像圧縮
- **vue-cropperjs**: 画像クロップ（領収書整形）

### グラフ・レポート
- **@vue-echarts**: 集計グラフ
- **jspdf**: PDF生成
- **xlsx**: Excel出力

## タブ別画面設計

### 1. 実費記録タブ（モバイルファースト）

```vue
<!-- pages/expenses/index.vue -->
<template>
  <div class="expense-page">
    <!-- タブナビゲーション -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-4">
        <TabsTrigger value="quick">実費記録</TabsTrigger>
        <TabsTrigger value="list">経費一覧</TabsTrigger>
        <TabsTrigger value="invoice">請求書</TabsTrigger>
        <TabsTrigger value="report">レポート</TabsTrigger>
      </TabsList>
      
      <!-- 実費記録タブ -->
      <TabsContent value="quick" class="space-y-6">
        <!-- クイック入力ボタン -->
        <div class="quick-input-section">
          <h3 class="text-sm font-medium mb-3">よく使う項目</h3>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <QuickExpenseButton
              v-for="template in frequentTemplates"
              :key="template.id"
              :template="template"
              @click="openQuickInput(template)"
            />
            <button
              class="quick-button add-new"
              @click="openNewExpense"
            >
              <Plus class="h-8 w-8" />
              <span>新規</span>
            </button>
          </div>
        </div>
        
        <!-- 今月のサマリー -->
        <ExpenseSummaryCard :month="currentMonth" />
        
        <!-- 最近の記録 -->
        <div class="recent-expenses">
          <h3 class="text-sm font-medium mb-3">最近の記録</h3>
          <TransitionGroup name="list" tag="div" class="space-y-2">
            <ExpenseListItem
              v-for="expense in recentExpenses"
              :key="expense.id"
              :expense="expense"
              @click="editExpense(expense)"
              @delete="deleteExpense(expense)"
            />
          </TransitionGroup>
        </div>
      </TabsContent>
      
      <!-- 他のタブ -->
      <TabsContent value="list">
        <ExpenseListView />
      </TabsContent>
      
      <TabsContent value="invoice">
        <InvoiceManagementView />
      </TabsContent>
      
      <TabsContent value="report">
        <ExpenseReportView />
      </TabsContent>
    </Tabs>
    
    <!-- モバイル用フローティングボタン -->
    <Transition name="fab">
      <button
        v-if="isMobile && activeTab !== 'quick'"
        class="fab"
        @click="openCameraCapture"
      >
        <Camera class="h-6 w-6" />
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { useExpensesStore } from '~/stores/expenses'

const store = useExpensesStore()
const { frequentTemplates, recentExpenses, currentMonth } = storeToRefs(store)

const activeTab = ref('quick')
const isMobile = useMediaQuery('(max-width: 640px)')

// クイック入力
const openQuickInput = (template: ExpenseTemplate) => {
  const { openModal } = useUIStore()
  openModal('quick-expense-input', { template })
}

// 新規入力
const openNewExpense = () => {
  const { openModal } = useUIStore()
  openModal('expense-input')
}

// カメラ撮影（モバイル）
const openCameraCapture = () => {
  const { openModal } = useUIStore()
  openModal('camera-capture')
}

// 初期化
onMounted(() => {
  store.fetchTemplates()
  store.fetchExpenses()
})
</script>

<style scoped>
.quick-button {
  @apply flex flex-col items-center justify-center p-4 
         border-2 border-dashed rounded-lg
         hover:bg-accent transition-colors cursor-pointer;
  
  span {
    @apply text-xs mt-2;
  }
}

.quick-button.add-new {
  @apply border-primary/50 text-primary;
}

.fab {
  @apply fixed bottom-6 right-6 w-14 h-14 
         bg-primary text-primary-foreground
         rounded-full shadow-lg
         flex items-center justify-center
         hover:scale-110 transition-transform;
  z-index: 100;
}

/* リストアニメーション */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
  right: 0;
  left: 0;
}

/* FABアニメーション */
.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0) rotate(180deg);
}
</style>
```

### 2. 実費入力モーダル（スマホ最適化）

```vue
<!-- components/expenses/ExpenseInputModal.vue -->
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="expense-input-modal">
      <DialogHeader>
        <DialogTitle>{{ mode === 'edit' ? '実費編集' : '実費記録' }}</DialogTitle>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- 金額（大きく表示） -->
        <div class="amount-input-group">
          <label class="text-sm text-muted-foreground">金額</label>
          <div class="amount-input">
            <span class="currency">¥</span>
            <input
              v-model="form.amount"
              type="tel"
              inputmode="numeric"
              pattern="[0-9]*"
              class="amount-field"
              placeholder="0"
              @input="formatAmount"
            />
          </div>
        </div>
        
        <!-- 日付 -->
        <div class="form-group">
          <Label for="date">日付</Label>
          <Input
            id="date"
            v-model="form.date"
            type="date"
            :max="today"
          />
        </div>
        
        <!-- 摘要 -->
        <div class="form-group">
          <Label for="description">摘要</Label>
          <Input
            id="description"
            v-model="form.description"
            placeholder="タクシー代、印紙代など"
            @focus="showSuggestions = true"
          />
          
          <!-- サジェスト -->
          <Transition name="slide-down">
            <div v-if="showSuggestions && suggestions.length" class="suggestions">
              <button
                v-for="suggestion in suggestions"
                :key="suggestion"
                type="button"
                class="suggestion-item"
                @click="selectSuggestion(suggestion)"
              >
                {{ suggestion }}
              </button>
            </div>
          </Transition>
        </div>
        
        <!-- 案件選択 -->
        <div class="form-group">
          <Label for="case">案件</Label>
          <CaseCombobox
            v-model="form.caseId"
            placeholder="案件を選択"
          />
        </div>
        
        <!-- 領収書 -->
        <div class="form-group">
          <Label>領収書</Label>
          <div class="receipt-area">
            <div v-if="receiptPreview" class="receipt-preview">
              <img :src="receiptPreview" alt="領収書" />
              <button
                type="button"
                class="remove-receipt"
                @click="removeReceipt"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
            <div v-else class="receipt-buttons">
              <button
                type="button"
                class="receipt-button"
                @click="openCamera"
              >
                <Camera class="h-5 w-5" />
                <span>撮影</span>
              </button>
              <button
                type="button"
                class="receipt-button"
                @click="selectFile"
              >
                <Upload class="h-5 w-5" />
                <span>選択</span>
              </button>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>
        
        <!-- 詳細オプション（折りたたみ） -->
        <Collapsible v-model:open="showAdvanced">
          <CollapsibleTrigger class="text-sm text-muted-foreground">
            詳細オプション
            <ChevronDown class="h-4 w-4 ml-1 inline" />
          </CollapsibleTrigger>
          <CollapsibleContent class="space-y-4 pt-4">
            <!-- 支払方法 -->
            <div class="form-group">
              <Label>支払方法</Label>
              <RadioGroup v-model="form.paymentMethod">
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label for="cash">現金</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label for="credit">クレジット</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="advance" id="advance" />
                  <Label for="advance">立替</Label>
                </div>
              </RadioGroup>
            </div>
            
            <!-- メモ -->
            <div class="form-group">
              <Label for="memo">メモ</Label>
              <Textarea
                id="memo"
                v-model="form.memo"
                rows="2"
                placeholder="追加情報があれば"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <!-- アクションボタン -->
        <div class="flex gap-2">
          <Button
            type="submit"
            class="flex-1"
            :disabled="!isValid || isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
            {{ mode === 'edit' ? '更新' : '保存' }}
          </Button>
          <Button
            type="button"
            variant="outline"
            @click="close"
          >
            キャンセル
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { useCamera } from '~/composables/useCamera'
import { useImageCompression } from '~/composables/useImageCompression'

const props = defineProps<{
  modelValue: boolean
  expense?: Expense
  template?: ExpenseTemplate
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: ExpenseFormData]
}>()

const isOpen = useVModel(props, 'modelValue', emit)
const mode = computed(() => props.expense ? 'edit' : 'create')

// フォーム
const form = reactive({
  amount: props.expense?.amount || props.template?.amount || '',
  date: props.expense?.date || new Date().toISOString().split('T')[0],
  description: props.expense?.description || props.template?.description || '',
  caseId: props.expense?.caseId || '',
  paymentMethod: props.expense?.paymentMethod || 'cash',
  memo: props.expense?.memo || '',
  receiptFile: null as File | null
})

// 金額フォーマット
const formatAmount = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = input.value.replace(/[^\d]/g, '')
  const formatted = Number(value).toLocaleString()
  form.amount = value
  input.value = formatted
}

// サジェスト
const showSuggestions = ref(false)
const suggestions = computed(() => {
  if (!form.description) return []
  
  const common = [
    'タクシー代',
    '収入印紙代',
    '交通費（電車）',
    '交通費（バス）',
    'コピー代',
    '書籍代',
    '会議費',
    '郵送料'
  ]
  
  return common.filter(s => 
    s.includes(form.description)
  ).slice(0, 5)
})

const selectSuggestion = (suggestion: string) => {
  form.description = suggestion
  showSuggestions.value = false
}

// 領収書処理
const receiptPreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()

const { openCamera: startCamera } = useCamera({
  onCapture: async (blob) => {
    const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' })
    await processReceiptFile(file)
  }
})

const selectFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await processReceiptFile(file)
  }
}

const processReceiptFile = async (file: File) => {
  // 画像圧縮
  const { compress } = useImageCompression()
  const compressed = await compress(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8
  })
  
  form.receiptFile = compressed
  
  // プレビュー生成
  const reader = new FileReader()
  reader.onload = (e) => {
    receiptPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(compressed)
}

const removeReceipt = () => {
  form.receiptFile = null
  receiptPreview.value = null
}

// バリデーション
const isValid = computed(() => {
  return form.amount && form.description && form.caseId
})

// 送信
const isSubmitting = ref(false)
const handleSubmit = async () => {
  if (!isValid.value) return
  
  isSubmitting.value = true
  try {
    emit('submit', {
      ...form,
      amount: Number(form.amount)
    })
    close()
  } finally {
    isSubmitting.value = false
  }
}

const close = () => {
  isOpen.value = false
}

// その他の設定
const today = new Date().toISOString().split('T')[0]
const showAdvanced = ref(false)
</script>

<style scoped>
.expense-input-modal {
  @apply max-w-md;
}

.amount-input-group {
  @apply space-y-2;
}

.amount-input {
  @apply flex items-center gap-2 text-3xl font-bold;
}

.currency {
  @apply text-muted-foreground;
}

.amount-field {
  @apply flex-1 bg-transparent border-0 outline-none text-right;
}

.form-group {
  @apply space-y-2;
}

.suggestions {
  @apply absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md;
}

.suggestion-item {
  @apply w-full px-3 py-2 text-left hover:bg-accent
         transition-colors text-sm;
}

.receipt-area {
  @apply border-2 border-dashed rounded-lg p-4;
}

.receipt-preview {
  @apply relative;
  
  img {
    @apply w-full h-auto rounded;
  }
}

.remove-receipt {
  @apply absolute top-2 right-2 p-1 bg-background/80 
         rounded-full border shadow-sm;
}

.receipt-buttons {
  @apply flex gap-3;
}

.receipt-button {
  @apply flex-1 flex flex-col items-center gap-2 py-4
         border rounded-lg hover:bg-accent transition-colors;
  
  span {
    @apply text-sm text-muted-foreground;
  }
}

/* アニメーション */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
```

### 3. 経費一覧画面

```vue
<!-- components/expenses/ExpenseListView.vue -->
<template>
  <div class="expense-list-view">
    <!-- フィルター -->
    <div class="filters">
      <div class="filter-row">
        <!-- 月選択 -->
        <MonthPicker
          v-model="selectedMonth"
          :max="currentMonth"
        />
        
        <!-- 種別フィルター -->
        <Select v-model="filters.type">
          <SelectTrigger class="w-32">
            <SelectValue placeholder="種別" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="office">事務所経費</SelectItem>
            <SelectItem value="personal">個人経費</SelectItem>
            <SelectItem value="case">案件実費</SelectItem>
          </SelectContent>
        </Select>
        
        <!-- エクスポート -->
        <Button
          variant="outline"
          size="sm"
          @click="exportExpenses"
        >
          <Download class="h-4 w-4 mr-2" />
          CSV出力
        </Button>
      </div>
      
      <!-- 集計表示 -->
      <div class="summary-cards">
        <SummaryCard
          label="収入"
          :value="summary.income"
          trend="+12%"
          color="green"
        />
        <SummaryCard
          label="支出"
          :value="summary.expense"
          trend="-5%"
          color="red"
        />
        <SummaryCard
          label="差額"
          :value="summary.balance"
          :trend="summary.balanceTrend"
          :color="summary.balance >= 0 ? 'blue' : 'red'"
        />
      </div>
    </div>
    
    <!-- 経費テーブル（デスクトップ） -->
    <div v-if="!isMobile" class="expense-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-24">日付</TableHead>
            <TableHead>摘要</TableHead>
            <TableHead>案件</TableHead>
            <TableHead>勘定科目</TableHead>
            <TableHead class="text-right">金額</TableHead>
            <TableHead class="w-20">領収書</TableHead>
            <TableHead class="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="expense in paginatedExpenses"
            :key="expense.id"
            class="cursor-pointer hover:bg-muted/50"
            @click="editExpense(expense)"
          >
            <TableCell>{{ formatDate(expense.date) }}</TableCell>
            <TableCell>{{ expense.description }}</TableCell>
            <TableCell>
              <span class="text-sm text-muted-foreground">
                {{ expense.caseNumber }}
              </span>
            </TableCell>
            <TableCell>{{ expense.accountName }}</TableCell>
            <TableCell class="text-right font-mono">
              ¥{{ expense.amount.toLocaleString() }}
            </TableCell>
            <TableCell>
              <Paperclip 
                v-if="expense.hasReceipt" 
                class="h-4 w-4 text-muted-foreground" 
              />
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click.stop="editExpense(expense)">
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuItem @click.stop="duplicateExpense(expense)">
                    複製
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    @click.stop="deleteExpense(expense)"
                    class="text-destructive"
                  >
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <!-- ページネーション -->
      <Pagination
        v-model:page="currentPage"
        :total="filteredExpenses.length"
        :per-page="perPage"
      />
    </div>
    
    <!-- 経費リスト（モバイル） -->
    <div v-else class="expense-cards">
      <ExpenseCard
        v-for="expense in paginatedExpenses"
        :key="expense.id"
        :expense="expense"
        @click="editExpense(expense)"
        @delete="deleteExpense(expense)"
      />
      
      <!-- もっと見る -->
      <Button
        v-if="hasMore"
        variant="outline"
        class="w-full"
        @click="loadMore"
      >
        もっと見る
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const store = useExpensesStore()
const { filteredExpenses, monthlyTotal, byCategory } = storeToRefs(store)

const isMobile = useMediaQuery('(max-width: 768px)')
const selectedMonth = ref(store.currentMonth)
const filters = reactive({
  type: 'all',
  accountCode: null,
  search: ''
})

// 月変更時
watch(selectedMonth, (month) => {
  store.setCurrentMonth(month)
})

// 集計
const summary = computed(() => {
  const income = filteredExpenses.value
    .filter(e => e.accountCode === 'sales')
    .reduce((sum, e) => sum + e.amount, 0)
    
  const expense = filteredExpenses.value
    .filter(e => e.accountCode !== 'sales')
    .reduce((sum, e) => sum + e.amount, 0)
    
  const balance = income - expense
  
  return {
    income,
    expense,
    balance,
    balanceTrend: balance >= 0 ? '+' : '-'
  }
})

// ページネーション
const currentPage = ref(1)
const perPage = 20
const mobileLimit = ref(10)

const paginatedExpenses = computed(() => {
  if (isMobile.value) {
    return filteredExpenses.value.slice(0, mobileLimit.value)
  }
  
  const start = (currentPage.value - 1) * perPage
  return filteredExpenses.value.slice(start, start + perPage)
})

const hasMore = computed(() => 
  isMobile.value && mobileLimit.value < filteredExpenses.value.length
)

const loadMore = () => {
  mobileLimit.value += 10
}

// 日付フォーマット
const formatDate = (date: string) => {
  return format(new Date(date), 'M/d(E)', { locale: ja })
}

// エクスポート
const exportExpenses = async () => {
  const { exportToCSV } = useExpenseExport()
  await exportToCSV(filteredExpenses.value, selectedMonth.value)
}

// 編集・削除
const editExpense = (expense: Expense) => {
  const { openModal } = useUIStore()
  openModal('expense-input', { expense })
}

const duplicateExpense = (expense: Expense) => {
  const { openModal } = useUIStore()
  const duplicate = { ...expense, id: undefined, date: new Date().toISOString().split('T')[0] }
  openModal('expense-input', { expense: duplicate })
}

const deleteExpense = async (expense: Expense) => {
  if (await confirm('この経費を削除しますか？')) {
    await store.deleteExpense(expense.id)
  }
}
</script>
```

### 4. 請求書作成画面

```vue
<!-- components/expenses/InvoiceManagementView.vue -->
<template>
  <div class="invoice-management">
    <!-- ツールバー -->
    <div class="toolbar">
      <h2 class="text-lg font-semibold">請求書管理</h2>
      <Button @click="createInvoice">
        <Plus class="h-4 w-4 mr-2" />
        請求書作成
      </Button>
    </div>
    
    <!-- 請求書一覧 -->
    <div class="invoice-list">
      <div
        v-for="invoice in invoices"
        :key="invoice.id"
        class="invoice-card"
        @click="openInvoice(invoice)"
      >
        <div class="invoice-header">
          <div>
            <div class="invoice-number">{{ invoice.invoiceNumber }}</div>
            <div class="invoice-client">{{ invoice.clientName }}</div>
          </div>
          <Badge :variant="getStatusVariant(invoice.status)">
            {{ getStatusLabel(invoice.status) }}
          </Badge>
        </div>
        
        <div class="invoice-details">
          <div class="detail-item">
            <span class="label">発行日</span>
            <span>{{ formatDate(invoice.issueDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">支払期限</span>
            <span>{{ formatDate(invoice.dueDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">金額</span>
            <span class="amount">¥{{ invoice.totalAmount.toLocaleString() }}</span>
          </div>
        </div>
        
        <div class="invoice-actions">
          <Button
            variant="outline"
            size="sm"
            @click.stop="downloadPDF(invoice)"
          >
            <FileText class="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            v-if="invoice.status === 'draft'"
            size="sm"
            @click.stop="sendInvoice(invoice)"
          >
            送信
          </Button>
          <Button
            v-else-if="invoice.status === 'sent'"
            variant="outline"
            size="sm"
            @click.stop="recordPayment(invoice)"
          >
            入金記録
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
```

## カスタムコンポーザブル

```typescript
// composables/useCamera.ts
export const useCamera = (options: {
  onCapture: (blob: Blob) => void
}) => {
  const { isSupported, stream } = useUserMedia({
    constraints: {
      video: {
        facingMode: 'environment' // 背面カメラ
      }
    }
  })
  
  const videoRef = ref<HTMLVideoElement>()
  const canvasRef = ref<HTMLCanvasElement>()
  
  const openCamera = () => {
    const { openModal } = useUIStore()
    openModal('camera-capture', {
      onCapture: capture
    })
  }
  
  const capture = () => {
    if (!videoRef.value || !canvasRef.value) return
    
    const video = videoRef.value
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')!
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      if (blob) {
        options.onCapture(blob)
      }
    }, 'image/jpeg', 0.9)
  }
  
  return {
    isSupported,
    openCamera,
    videoRef,
    canvasRef,
    capture
  }
}

// composables/useExpenseExport.ts
export const useExpenseExport = () => {
  const exportToCSV = async (expenses: Expense[], month: string) => {
    const headers = [
      '日付',
      '摘要',
      '案件番号',
      '勘定科目',
      '金額',
      '消費税',
      '源泉徴収',
      '支払方法',
      'メモ'
    ]
    
    const rows = expenses.map(e => [
      e.date,
      e.description,
      e.caseNumber || '',
      e.accountName,
      e.amount,
      e.taxAmount || 0,
      e.withholdingAmount || 0,
      e.paymentMethod,
      e.memo || ''
    ])
    
    // CSV生成
    const csv = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : cell
        ).join(',')
      )
    ].join('\n')
    
    // BOM付きUTF-8で出力（Excel対応）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8' })
    
    // ダウンロード
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `経費明細_${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    // 通知
    const { showToast } = useUIStore()
    showToast({
      type: 'success',
      title: 'エクスポート完了',
      description: 'CSVファイルをダウンロードしました'
    })
  }
  
  const exportToExcel = async (month: string) => {
    // Excel形式でのエクスポート
    const { data } = await $fetch('/api/v1/reports/monthly-export', {
      method: 'POST',
      body: {
        year: parseInt(month.split('-')[0]),
        month: parseInt(month.split('-')[1]),
        format: 'excel'
      }
    })
    
    // ダウンロード処理
    window.location.href = data.downloadUrl
  }
  
  return {
    exportToCSV,
    exportToExcel
  }
}
```

## モバイル最適化

### 1. タッチ操作最適化
```typescript
// スワイプで削除
const { lengthX } = useSwipe(elementRef, {
  onSwipeEnd() {
    if (lengthX.value < -100) {
      deleteExpense()
    }
  }
})
```

### 2. オフライン対応
```typescript
// 一時保存機能
const { save, restore } = useLocalStorage('expense_draft', {})

// 入力中の自動保存
watchDebounced(
  form,
  () => save(form),
  { debounce: 1000 }
)
```

### 3. プログレッシブエンハンスメント
```vue
<!-- 段階的な機能追加 -->
<div class="receipt-input">
  <!-- 基本: ファイル選択 -->
  <input type="file" accept="image/*" />
  
  <!-- 拡張: カメラ撮影 -->
  <button v-if="isCameraSupported" @click="openCamera">
    カメラで撮影
  </button>
  
  <!-- 高度: OCR機能 -->
  <button v-if="isOCREnabled" @click="scanReceipt">
    領収書をスキャン
  </button>
</div>
```

## まとめ

この報酬管理画面設計により：

1. **モバイルファースト**: スマホでの実費記録を最優先
2. **効率的な入力**: クイック入力とテンプレート機能
3. **会計連携**: CSV/Excel出力で会計士との連携
4. **視覚的な管理**: グラフと集計で収支を把握
5. **シームレスな請求**: 実費から請求書作成まで一貫管理