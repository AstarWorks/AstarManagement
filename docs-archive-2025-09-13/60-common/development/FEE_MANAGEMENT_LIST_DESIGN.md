# 報酬管理画面 - 経費一覧表示設計

## 経費一覧のデフォルト表示（統合ビュー）

### 1. 表示構成

経費一覧画面では、弁護士が最も必要とする情報を1画面で確認できる統合ビューを採用します。

```
┌─────────────────────────────────────────────────┐
│ 経費一覧                                [月選択] │
├─────────────────────────────────────────────────┤
│ 📊 今月のサマリー                               │
│ ┌───────────────────────────────────────────┐ │
│ │ 収入: ¥1,234,567  支出: ¥456,789          │ │
│ │ 差額: ¥777,778 (前月比 +12.5%)             │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│ 📝 今日入力した実費                             │
│ ┌───────────────────────────────────────────┐ │
│ │ 14:30 タクシー代      ¥1,200  案件:2024-001│ │
│ │ 11:20 収入印紙代    ¥10,000  案件:2024-002│ │
│ │ 09:15 交通費          ¥540   案件:2024-001│ │
│ └───────────────────────────────────────────┘ │
│                        もっと見る →              │
│                                                 │
│ ⚠️ 未請求の実費                                 │
│ ┌───────────────────────────────────────────┐ │
│ │ 案件:2024-001 〇〇商事 vs △△工業          │ │
│ │   実費合計: ¥35,740 (5件)                  │ │
│ │   最古: 2024/01/05 (15日経過)              │ │
│ │                                            │ │
│ │ 案件:2024-002 労働審判事件                  │ │
│ │   実費合計: ¥52,000 (3件)                  │ │
│ │   最古: 2024/01/10 (10日経過)              │ │
│ └───────────────────────────────────────────┘ │
│                 すべての未請求を見る →           │
└─────────────────────────────────────────────────┘
```

### 2. 各セクションの詳細

#### 2.1 今月のサマリー
```typescript
interface MonthlySummary {
  income: number          // 収入合計
  expense: number         // 支出合計
  balance: number         // 差額
  previousBalance: number // 前月の差額
  trend: {
    value: number         // 前月比（％）
    direction: 'up' | 'down' | 'flat'
  }
}
```

**表示内容：**
- 大きく見やすい金額表示
- 前月比をパーセンテージで表示
- トレンドアイコン（↑↓→）

#### 2.2 今日入力した実費
```typescript
interface TodayExpenses {
  expenses: Expense[]     // 今日の実費（最新5件）
  totalCount: number      // 今日の総件数
  totalAmount: number     // 今日の合計金額
}
```

**表示内容：**
- 時刻・摘要・金額・案件番号
- 最新5件まで表示
- それ以上ある場合は「もっと見る」リンク
- 空の場合は「今日はまだ実費が記録されていません」

#### 2.3 未請求の実費
```typescript
interface UnbilledExpenses {
  byCase: Array<{
    caseId: string
    caseNumber: string
    caseTitle: string
    clientName: string
    expenses: Expense[]
    totalAmount: number
    oldestDate: string
    daysElapsed: number
  }>
}
```

**表示内容：**
- 案件ごとにグループ化
- 合計金額の多い順に上位3案件を表示
- 最古の実費からの経過日数を表示（請求漏れ防止）
- クリックで該当案件の実費一覧へ

### 3. コンポーネント設計

#### ExpenseListView（メインビュー）
```vue
<template>
  <div class="expense-list-view">
    <!-- ヘッダー -->
    <div class="list-header">
      <h2 class="text-lg font-semibold">経費一覧</h2>
      <MonthPicker v-model="selectedMonth" />
    </div>
    
    <!-- 今月のサマリー -->
    <section class="summary-section">
      <h3 class="section-title">
        <TrendingUp class="h-4 w-4" />
        今月のサマリー
      </h3>
      <MonthlySummaryCard :data="monthlySummary" />
    </section>
    
    <!-- 今日入力した実費 -->
    <section class="today-section">
      <h3 class="section-title">
        <FileText class="h-4 w-4" />
        今日入力した実費
      </h3>
      <div v-if="todayExpenses.expenses.length" class="expense-list">
        <TodayExpenseItem
          v-for="expense in todayExpenses.expenses"
          :key="expense.id"
          :expense="expense"
          @click="editExpense(expense)"
        />
        <Button
          v-if="todayExpenses.totalCount > 5"
          variant="ghost"
          class="w-full"
          @click="showAllToday"
        >
          もっと見る（残り{{ todayExpenses.totalCount - 5 }}件）
          <ChevronRight class="h-4 w-4 ml-1" />
        </Button>
      </div>
      <EmptyState v-else>
        今日はまだ実費が記録されていません
      </EmptyState>
    </section>
    
    <!-- 未請求の実費 -->
    <section class="unbilled-section">
      <h3 class="section-title">
        <AlertCircle class="h-4 w-4 text-warning" />
        未請求の実費
      </h3>
      <div v-if="unbilledExpenses.byCase.length" class="unbilled-list">
        <UnbilledCaseCard
          v-for="caseData in unbilledExpenses.byCase.slice(0, 3)"
          :key="caseData.caseId"
          :data="caseData"
          @click="showCaseExpenses(caseData.caseId)"
          @create-invoice="createInvoiceForCase(caseData.caseId)"
        />
        <Button
          v-if="unbilledExpenses.byCase.length > 3"
          variant="outline"
          class="w-full"
          @click="showAllUnbilled"
        >
          すべての未請求を見る（{{ unbilledExpenses.byCase.length }}案件）
          <ChevronRight class="h-4 w-4 ml-1" />
        </Button>
      </div>
      <EmptyState v-else variant="success">
        <CheckCircle class="h-8 w-8 text-green-600 mb-2" />
        すべての実費が請求済みです
      </EmptyState>
    </section>
  </div>
</template>

<script setup lang="ts">
// 実装
const selectedMonth = ref(getCurrentMonth())
const { monthlySummary, todayExpenses, unbilledExpenses } = useExpenseListData(selectedMonth)

// アクション
const showAllToday = () => {
  // フィルターを「今日」に設定して詳細画面へ
  navigateTo('/expenses/list?filter=today')
}

const showAllUnbilled = () => {
  // フィルターを「未請求」に設定して詳細画面へ
  navigateTo('/expenses/list?filter=unbilled')
}

const showCaseExpenses = (caseId: string) => {
  // 特定案件の実費一覧へ
  navigateTo(`/expenses/list?caseId=${caseId}`)
}

const createInvoiceForCase = (caseId: string) => {
  // 請求書作成画面へ遷移
  navigateTo(`/invoices/new?caseId=${caseId}&type=expenses`)
}
</script>

<style scoped>
.expense-list-view {
  @apply space-y-6;
}

.list-header {
  @apply flex items-center justify-between;
}

.section-title {
  @apply flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3;
}

.summary-section {
  @apply bg-muted/30 rounded-lg p-4;
}

.expense-list {
  @apply space-y-2;
}

.unbilled-list {
  @apply space-y-3;
}
</style>
```

#### TodayExpenseItem（今日の実費アイテム）
```vue
<template>
  <div class="today-expense-item">
    <span class="time">{{ formatTime(expense.createdAt) }}</span>
    <span class="description">{{ expense.description }}</span>
    <span class="amount">¥{{ expense.amount.toLocaleString() }}</span>
    <span class="case-number">{{ expense.caseNumber }}</span>
  </div>
</template>

<style scoped>
.today-expense-item {
  @apply flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer;
}

.time {
  @apply text-sm text-muted-foreground w-12;
}

.description {
  @apply flex-1 truncate;
}

.amount {
  @apply font-mono font-medium;
}

.case-number {
  @apply text-sm text-muted-foreground;
}
</style>
```

#### UnbilledCaseCard（未請求案件カード）
```vue
<template>
  <Card class="unbilled-case-card">
    <CardContent class="p-4">
      <div class="case-header">
        <div>
          <div class="case-number">{{ data.caseNumber }}</div>
          <div class="case-title">{{ data.caseTitle }}</div>
        </div>
        <Button
          size="sm"
          variant="outline"
          @click.stop="$emit('create-invoice')"
        >
          請求書作成
        </Button>
      </div>
      
      <div class="case-stats">
        <div class="stat">
          <span class="label">実費合計</span>
          <span class="value">¥{{ data.totalAmount.toLocaleString() }}</span>
          <span class="count">({{ data.expenses.length }}件)</span>
        </div>
        <div class="stat">
          <span class="label">最古</span>
          <span class="value">{{ formatDate(data.oldestDate) }}</span>
          <span class="days text-warning">{{ data.daysElapsed }}日経過</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.unbilled-case-card {
  @apply cursor-pointer hover:shadow-md transition-shadow;
}

.case-header {
  @apply flex items-start justify-between mb-3;
}

.case-number {
  @apply font-medium;
}

.case-title {
  @apply text-sm text-muted-foreground;
}

.case-stats {
  @apply flex gap-6;
}

.stat {
  @apply flex items-baseline gap-1;
}

.label {
  @apply text-xs text-muted-foreground;
}

.value {
  @apply font-medium;
}

.count, .days {
  @apply text-xs;
}

.text-warning {
  @apply text-orange-600 dark:text-orange-400;
}
</style>
```

### 4. データ取得ロジック

```typescript
// composables/useExpenseListData.ts
export const useExpenseListData = (month: Ref<string>) => {
  const { expenses } = useExpensesStore()
  
  // 今月のサマリー
  const monthlySummary = computed(() => {
    const filtered = expenses.value.filter(e => 
      e.date.startsWith(month.value)
    )
    
    const income = filtered
      .filter(e => e.accountCode === 'sales')
      .reduce((sum, e) => sum + e.amount, 0)
      
    const expense = filtered
      .filter(e => e.accountCode !== 'sales')
      .reduce((sum, e) => sum + e.amount, 0)
      
    // 前月のデータと比較
    // ...
    
    return {
      income,
      expense,
      balance: income - expense,
      trend: calculateTrend(currentBalance, previousBalance)
    }
  })
  
  // 今日入力した実費
  const todayExpenses = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    const filtered = expenses.value.filter(e => 
      e.createdAt.startsWith(today)
    )
    
    return {
      expenses: filtered.slice(0, 5),
      totalCount: filtered.length,
      totalAmount: filtered.reduce((sum, e) => sum + e.amount, 0)
    }
  })
  
  // 未請求の実費
  const unbilledExpenses = computed(() => {
    const unbilled = expenses.value.filter(e => 
      !e.invoiceId && e.expenseType === 'case'
    )
    
    // 案件ごとにグループ化
    const grouped = groupBy(unbilled, 'caseId')
    
    // 各案件の集計
    const byCase = Object.entries(grouped).map(([caseId, expenses]) => {
      const oldestDate = min(expenses.map(e => e.date))
      const daysElapsed = differenceInDays(new Date(), new Date(oldestDate))
      
      return {
        caseId,
        caseNumber: expenses[0].caseNumber,
        caseTitle: expenses[0].caseTitle,
        clientName: expenses[0].clientName,
        expenses,
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        oldestDate,
        daysElapsed
      }
    })
    
    // 金額の多い順にソート
    return {
      byCase: byCase.sort((a, b) => b.totalAmount - a.totalAmount)
    }
  })
  
  return {
    monthlySummary,
    todayExpenses,
    unbilledExpenses
  }
}
```