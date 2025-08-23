# 報酬管理画面 - 消費税・源泉徴収設計

## 1. 消費税の扱い

### 基本方針
- **税込み入力方式**を採用
- レシートや請求書の金額をそのまま入力できる
- 内税として自動計算し、仕訳時に税抜き金額と消費税を分離

### 消費税率の設定

#### システム設定
```typescript
interface TaxSettings {
  defaultTaxRate: number         // デフォルト税率（10%）
  reducedTaxRate: number         // 軽減税率（8%）
  effectiveDate: string          // 適用開始日
  accountCodeTaxRates: Map<string, number>  // 勘定科目別の税率設定
}

// デフォルト設定
const defaultTaxSettings: TaxSettings = {
  defaultTaxRate: 0.10,
  reducedTaxRate: 0.08,
  effectiveDate: '2019-10-01',
  accountCodeTaxRates: new Map([
    ['food_expense', 0.08],      // 飲食費は軽減税率
    ['newspaper', 0.08],         // 新聞代は軽減税率
    ['rental', 0],               // 地代家賃は非課税
    ['insurance', 0],            // 保険料は非課税
    ['tax_payment', 0],          // 租税公課は非課税
  ])
}
```

#### 勘定科目マスタでの税率設定
```typescript
interface AccountCode {
  id: string
  code: string
  name: string
  category: 'income' | 'expense'
  taxType: 'taxable' | 'non-taxable' | 'tax-exempt'  // 課税区分
  defaultTaxRate?: number      // この勘定科目のデフォルト税率
  // ... 他のフィールド
}
```

### 経費入力時の処理

#### UI表示
```vue
<template>
  <div class="expense-form">
    <!-- 金額入力（税込み） -->
    <div class="form-group">
      <Label>金額（税込）</Label>
      <AmountInput v-model="expense.totalAmount" />
    </div>
    
    <!-- 税率選択（自動設定される） -->
    <div class="form-group">
      <Label>消費税率</Label>
      <Select v-model="expense.taxRate" :disabled="isNonTaxable">
        <SelectTrigger>
          <SelectValue :placeholder="taxRateDisplay" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.10">10%（標準税率）</SelectItem>
          <SelectItem value="0.08">8%（軽減税率）</SelectItem>
          <SelectItem value="0">非課税</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <!-- 内訳表示（参考） -->
    <div v-if="expense.taxRate > 0" class="tax-breakdown">
      <div class="text-sm text-muted-foreground">
        <div>税抜金額: ¥{{ taxExcludedAmount.toLocaleString() }}</div>
        <div>消費税額: ¥{{ taxAmount.toLocaleString() }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 勘定科目選択時に税率を自動設定
watch(() => expense.accountCode, (newCode) => {
  const accountCode = accountCodes.find(ac => ac.code === newCode)
  if (accountCode) {
    // 勘定科目のデフォルト税率を設定
    expense.taxRate = accountCode.defaultTaxRate ?? settings.defaultTaxRate
  }
})

// 税額計算
const taxExcludedAmount = computed(() => {
  if (expense.taxRate === 0) return expense.totalAmount
  return Math.floor(expense.totalAmount / (1 + expense.taxRate))
})

const taxAmount = computed(() => {
  return expense.totalAmount - taxExcludedAmount.value
})
</script>
```

### データ保存形式
```typescript
interface Expense {
  id: string
  date: string
  description: string
  accountCode: string
  totalAmount: number        // 税込金額
  taxRate: number           // 適用税率（0.10, 0.08, 0）
  taxAmount: number         // 消費税額（自動計算）
  taxExcludedAmount: number // 税抜金額（自動計算）
  // ... 他のフィールド
}
```

## 2. 源泉徴収の扱い

### 基本方針
- **自動計算方式**を採用
- 報酬額から源泉徴収税率を自動計算
- 必要に応じて手動調整可能

### 源泉徴収税率
```typescript
interface WithholdingTaxRates {
  standard: number           // 標準税率（10.21%）
  highAmount: number         // 高額報酬税率（20.42%）
  threshold: number          // 閾値（100万円）
}

const withhholdingTaxRates: WithholdingTaxRates = {
  standard: 0.1021,
  highAmount: 0.2042,
  threshold: 1000000
}
```

### 報酬入力時の処理

#### UI表示
```vue
<template>
  <div class="income-form">
    <!-- 報酬額入力 -->
    <div class="form-group">
      <Label>報酬額（税込）</Label>
      <AmountInput v-model="income.grossAmount" />
    </div>
    
    <!-- 源泉徴収の有無 -->
    <div class="form-group">
      <Checkbox 
        v-model="income.hasWithholding" 
        id="withholding"
      />
      <Label for="withholding" class="ml-2">
        源泉徴収あり
      </Label>
    </div>
    
    <!-- 源泉徴収額（自動計算＋編集可能） -->
    <div v-if="income.hasWithholding" class="form-group">
      <Label>源泉徴収額</Label>
      <div class="flex gap-2">
        <AmountInput 
          v-model="income.withholdingAmount"
          :disabled="!isManualMode"
        />
        <Button
          variant="outline"
          size="sm"
          @click="toggleManualMode"
        >
          {{ isManualMode ? '自動計算' : '手動入力' }}
        </Button>
      </div>
      
      <!-- 計算詳細 -->
      <div class="text-sm text-muted-foreground mt-1">
        <div v-if="!isManualMode">
          税率: {{ withholdingRate }}% 
          ({{ income.grossAmount > 1000000 ? '100万円超' : '100万円以下' }})
        </div>
      </div>
    </div>
    
    <!-- 手取り額表示 -->
    <div v-if="income.hasWithholding" class="income-breakdown">
      <Card>
        <CardContent class="p-3">
          <div class="text-sm">
            <div>報酬額: ¥{{ income.grossAmount.toLocaleString() }}</div>
            <div>源泉徴収: -¥{{ income.withholdingAmount.toLocaleString() }}</div>
            <Separator class="my-2" />
            <div class="font-medium">
              手取額: ¥{{ netAmount.toLocaleString() }}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
const isManualMode = ref(false)

// 源泉徴収率の計算
const withholdingRate = computed(() => {
  if (income.grossAmount <= 1000000) {
    return 10.21
  } else {
    // 100万円超の部分は20.42%
    return 20.42
  }
})

// 源泉徴収額の自動計算
const calculateWithholding = (amount: number): number => {
  if (amount <= 1000000) {
    return Math.floor(amount * 0.1021)
  } else {
    // 100万円までは10.21%、超過分は20.42%
    const base = Math.floor(1000000 * 0.1021)
    const excess = Math.floor((amount - 1000000) * 0.2042)
    return base + excess
  }
}

// 報酬額変更時に源泉徴収額を再計算
watch(() => income.grossAmount, (newAmount) => {
  if (!isManualMode.value && income.hasWithholding) {
    income.withholdingAmount = calculateWithholding(newAmount)
  }
})

// 手取額の計算
const netAmount = computed(() => {
  return income.grossAmount - (income.withholdingAmount || 0)
})

// 手動/自動モード切替
const toggleManualMode = () => {
  isManualMode.value = !isManualMode.value
  if (!isManualMode.value) {
    // 自動モードに戻したら再計算
    income.withholdingAmount = calculateWithholding(income.grossAmount)
  }
}
</script>
```

### データ保存形式
```typescript
interface Income {
  id: string
  date: string
  description: string
  clientId: string
  caseId?: string
  grossAmount: number          // 報酬総額
  hasWithholding: boolean      // 源泉徴収の有無
  withholdingAmount: number    // 源泉徴収額
  withholdingRate: number      // 適用税率（0.1021 or 0.2042）
  netAmount: number            // 手取額
  isManualWithholding: boolean // 手動入力フラグ
  // ... 他のフィールド
}
```

## 3. 会計処理への連携

### 仕訳データの生成
```typescript
// 経費の仕訳（税込み入力から税抜き仕訳を生成）
function createExpenseJournalEntry(expense: Expense): JournalEntry {
  if (expense.taxRate > 0) {
    // 消費税ありの場合
    return {
      date: expense.date,
      entries: [
        {
          accountCode: expense.accountCode,
          debit: expense.taxExcludedAmount,
          credit: 0
        },
        {
          accountCode: 'tax_receivable',  // 仮払消費税
          debit: expense.taxAmount,
          credit: 0
        },
        {
          accountCode: 'cash',  // 現金など
          debit: 0,
          credit: expense.totalAmount
        }
      ]
    }
  } else {
    // 非課税の場合
    return {
      date: expense.date,
      entries: [
        {
          accountCode: expense.accountCode,
          debit: expense.totalAmount,
          credit: 0
        },
        {
          accountCode: 'cash',
          debit: 0,
          credit: expense.totalAmount
        }
      ]
    }
  }
}

// 報酬の仕訳（源泉徴収対応）
function createIncomeJournalEntry(income: Income): JournalEntry {
  const entries = []
  
  // 売掛金（手取額）
  entries.push({
    accountCode: 'accounts_receivable',
    debit: income.netAmount,
    credit: 0
  })
  
  // 源泉徴収税
  if (income.hasWithholding) {
    entries.push({
      accountCode: 'withholding_tax',
      debit: income.withholdingAmount,
      credit: 0
    })
  }
  
  // 売上高
  entries.push({
    accountCode: 'sales',
    debit: 0,
    credit: income.grossAmount
  })
  
  return {
    date: income.date,
    entries
  }
}
```

## 4. レポート表示

### 消費税集計
```typescript
// 月次消費税レポート
interface TaxReport {
  period: string
  taxableExpenses: number      // 課税対象経費
  taxAmount: number            // 消費税額合計
  byRate: {
    standard: number           // 10%対象
    reduced: number            // 8%対象
    nonTaxable: number         // 非課税
  }
}
```

### 源泉徴収集計
```typescript
// 源泉徴収レポート（支払調書作成用）
interface WithholdingReport {
  period: string
  totalIncome: number          // 報酬総額
  totalWithholding: number     // 源泉徴収総額
  byClient: Array<{
    clientId: string
    clientName: string
    totalAmount: number
    withholdingAmount: number
  }>
}
```