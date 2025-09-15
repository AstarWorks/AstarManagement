# 会計画面 - 預り金管理設計

## 1. 預り金管理の概要

小中規模法律事務所向けに、シンプルで使いやすい預り金管理機能を提供します。
案件単位で預り金を管理し、実費との紐付けを明確にします。

## 2. 画面構成

### 2.1 預り金タブのレイアウト

```
┌─────────────────────────────────────────────────┐
│ 預り金管理                                      │
├─────────────────────────────────────────────────┤
│ ▼ クイック入力                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ [案件選択▼] [¥金額] [現金/振込▼] [受領]   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ▼ 預り金残高一覧                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ 案件番号 | 案件名 | クライアント | 残高     │ │
│ │ 2024-001 | 〇〇訴訟 | 山田太郎 | ¥500,000 │ │
│ │ 2024-002 | 労働審判 | 田中花子 | ¥200,000 │ │
│ └─────────────────────────────────────────────┘ │
│                合計残高: ¥700,000               │
└─────────────────────────────────────────────────┘
```

### 2.2 クイック入力フォーム

```vue
<template>
  <Card class="deposit-quick-form">
    <CardHeader>
      <CardTitle class="text-base">預り金受領</CardTitle>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="handleSubmit" class="flex gap-2">
        <!-- 案件選択 -->
        <CaseSelector
          v-model="deposit.caseId"
          placeholder="案件を選択"
          class="flex-1"
          :show-client-name="true"
        />
        
        <!-- 金額入力 -->
        <AmountInput
          v-model="deposit.amount"
          placeholder="金額"
          class="w-32"
        />
        
        <!-- 受領方法 -->
        <Select v-model="deposit.method">
          <SelectTrigger class="w-24">
            <SelectValue placeholder="方法" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">現金</SelectItem>
            <SelectItem value="transfer">振込</SelectItem>
          </SelectContent>
        </Select>
        
        <!-- 受領ボタン -->
        <Button type="submit" :disabled="!isValid">
          受領
        </Button>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
const deposit = reactive({
  caseId: '',
  amount: 0,
  method: 'transfer',
  date: new Date().toISOString().split('T')[0]
})

const isValid = computed(() => 
  deposit.caseId && deposit.amount > 0
)

const handleSubmit = async () => {
  try {
    await $fetch('/api/v1/deposits', {
      method: 'POST',
      body: deposit
    })
    
    // 成功通知
    showToast({
      type: 'success',
      title: '預り金を受領しました',
      description: `¥${deposit.amount.toLocaleString()}`
    })
    
    // フォームリセット
    deposit.amount = 0
    
    // 一覧を更新
    await refreshDeposits()
  } catch (error) {
    showToast({
      type: 'error',
      title: 'エラーが発生しました'
    })
  }
}
</script>
```

### 2.3 預り金残高一覧（テーブル表示）

```vue
<template>
  <div class="deposit-balance-list">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">預り金残高一覧</CardTitle>
        <div class="flex gap-2">
          <Input
            v-model="searchQuery"
            placeholder="検索..."
            class="w-64"
          />
          <Button variant="outline" size="sm" @click="exportCSV">
            <Download class="h-4 w-4 mr-1" />
            CSV出力
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>案件番号</TableHead>
              <TableHead>案件名</TableHead>
              <TableHead>クライアント</TableHead>
              <TableHead class="text-right">預り金残高</TableHead>
              <TableHead class="text-right">最終更新</TableHead>
              <TableHead class="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="balance in filteredBalances"
              :key="balance.caseId"
              class="cursor-pointer hover:bg-accent"
              @click="showDetails(balance)"
            >
              <TableCell>{{ balance.caseNumber }}</TableCell>
              <TableCell>{{ balance.caseTitle }}</TableCell>
              <TableCell>{{ balance.clientName }}</TableCell>
              <TableCell class="text-right font-mono">
                ¥{{ balance.balance.toLocaleString() }}
              </TableCell>
              <TableCell class="text-right text-sm text-muted-foreground">
                {{ formatDate(balance.lastUpdated) }}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="showHistory(balance)"
                >
                  履歴
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        <!-- 合計表示 -->
        <div class="mt-4 text-right">
          <span class="text-muted-foreground">合計残高: </span>
          <span class="text-xl font-semibold">
            ¥{{ totalBalance.toLocaleString() }}
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
interface DepositBalance {
  caseId: string
  caseNumber: string
  caseTitle: string
  clientName: string
  balance: number
  lastUpdated: string
}

const searchQuery = ref('')
const balances = ref<DepositBalance[]>([])

const filteredBalances = computed(() => {
  if (!searchQuery.value) return balances.value
  
  const query = searchQuery.value.toLowerCase()
  return balances.value.filter(b => 
    b.caseNumber.toLowerCase().includes(query) ||
    b.caseTitle.toLowerCase().includes(query) ||
    b.clientName.toLowerCase().includes(query)
  )
})

const totalBalance = computed(() => 
  filteredBalances.value.reduce((sum, b) => sum + b.balance, 0)
)

const showDetails = (balance: DepositBalance) => {
  navigateTo(`/accounting/deposits/${balance.caseId}`)
}

const showHistory = (balance: DepositBalance) => {
  // 履歴モーダルを表示
  openDepositHistoryModal(balance.caseId)
}
</script>
```

## 3. 預り金詳細画面

### 3.1 入出金履歴表示

```vue
<template>
  <div class="deposit-history">
    <Card>
      <CardHeader>
        <CardTitle>
          預り金履歴 - {{ caseInfo.caseNumber }}
        </CardTitle>
        <div class="text-sm text-muted-foreground">
          {{ caseInfo.caseTitle }} / {{ caseInfo.clientName }}
        </div>
      </CardHeader>
      <CardContent>
        <!-- 現在残高 -->
        <div class="mb-6 p-4 bg-accent rounded-lg">
          <div class="text-sm text-muted-foreground">現在の預り金残高</div>
          <div class="text-2xl font-semibold">
            ¥{{ currentBalance.toLocaleString() }}
          </div>
        </div>
        
        <!-- 履歴テーブル -->
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>種別</TableHead>
              <TableHead>摘要</TableHead>
              <TableHead class="text-right">入金</TableHead>
              <TableHead class="text-right">出金</TableHead>
              <TableHead class="text-right">残高</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in history" :key="item.id">
              <TableCell>{{ formatDate(item.date) }}</TableCell>
              <TableCell>
                <Badge :variant="item.type === 'deposit' ? 'default' : 'secondary'">
                  {{ item.type === 'deposit' ? '預り' : '充当' }}
                </Badge>
              </TableCell>
              <TableCell>{{ item.description }}</TableCell>
              <TableCell class="text-right font-mono">
                {{ item.type === 'deposit' ? `¥${item.amount.toLocaleString()}` : '-' }}
              </TableCell>
              <TableCell class="text-right font-mono">
                {{ item.type === 'usage' ? `¥${item.amount.toLocaleString()}` : '-' }}
              </TableCell>
              <TableCell class="text-right font-mono font-medium">
                ¥{{ item.balance.toLocaleString() }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
```

## 4. 実費充当機能

### 4.1 実費入力時の預り金充当

```typescript
// 実費入力時の処理
interface ExpenseWithDeposit {
  expense: Expense
  useDeposit: boolean
  depositAmount?: number
}

// 預り金充当のチェック
const checkDepositAvailability = async (caseId: string, amount: number) => {
  const { data } = await $fetch(`/api/v1/cases/${caseId}/deposit-balance`)
  return {
    available: data.balance >= amount,
    balance: data.balance,
    shortage: Math.max(0, amount - data.balance)
  }
}
```

### 4.2 充当処理のUI

```vue
<!-- 実費入力フォーム内 -->
<div v-if="expense.caseId" class="deposit-usage-option">
  <Card class="mt-4">
    <CardContent class="p-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="useDeposit"
            :disabled="!depositInfo.available"
            id="use-deposit"
          />
          <Label for="use-deposit">
            預り金から充当
            <span class="text-sm text-muted-foreground ml-1">
              (残高: ¥{{ depositInfo.balance.toLocaleString() }})
            </span>
          </Label>
        </div>
        <div v-if="!depositInfo.available && expense.amount > 0" class="text-sm text-destructive">
          残高不足: ¥{{ depositInfo.shortage.toLocaleString() }}
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

## 5. データモデル

### 5.1 預り金トランザクション

```typescript
interface DepositTransaction {
  id: string
  caseId: string
  type: 'deposit' | 'usage' | 'refund'
  amount: number
  balance: number  // トランザクション後の残高
  date: string
  method?: 'cash' | 'transfer'
  description: string
  relatedExpenseId?: string  // 実費充当の場合
  createdBy: string
  createdAt: Date
}
```

### 5.2 API設計

```typescript
// 預り金受領
POST /api/v1/deposits
{
  caseId: string
  amount: number
  method: 'cash' | 'transfer'
  date?: string
  memo?: string
}

// 預り金残高一覧
GET /api/v1/deposits/balances

// 特定案件の預り金履歴
GET /api/v1/cases/{caseId}/deposit-history

// 預り金充当（実費作成時に内部的に呼ばれる）
POST /api/v1/deposits/usage
{
  caseId: string
  amount: number
  expenseId: string
}
```

## 6. 状態管理

```typescript
// stores/accounting.ts
export const useAccountingStore = defineStore('accounting', () => {
  // 預り金残高一覧
  const depositBalances = ref<DepositBalance[]>([])
  
  // 預り金受領
  const receiveDeposit = async (data: DepositReceiveData) => {
    const result = await $fetch('/api/v1/deposits', {
      method: 'POST',
      body: data
    })
    
    // 残高一覧を更新
    await fetchDepositBalances()
    
    return result
  }
  
  // 残高一覧取得
  const fetchDepositBalances = async () => {
    const { data } = await $fetch('/api/v1/deposits/balances')
    depositBalances.value = data
  }
  
  // 案件の預り金残高取得
  const getDepositBalance = (caseId: string) => {
    return depositBalances.value.find(b => b.caseId === caseId)?.balance || 0
  }
  
  return {
    depositBalances: readonly(depositBalances),
    receiveDeposit,
    fetchDepositBalances,
    getDepositBalance
  }
})
```