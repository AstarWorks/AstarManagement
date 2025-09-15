# 会計画面 - 売掛金管理設計

## 1. 売掛金管理の概要

請求書発行から入金確認までをシンプルに管理します。請求書ベースで入金を記録し、差額がある場合は人間の判断で処理します。

## 2. 画面構成

### 2.1 売掛金タブのレイアウト

```
┌─────────────────────────────────────────────────┐
│ 売掛金管理                                      │
├─────────────────────────────────────────────────┤
│ ▼ 未入金請求書一覧                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ ステータス: [全て▼] 期限: [全て▼]          │ │
│ │                                             │ │
│ │ 請求書番号 | クライアント | 請求額 | 期限   │ │
│ │ INV-2024-001 | 山田太郎 | ¥550,000 | 1/31  │ │
│ │ INV-2024-002 | 田中花子 | ¥330,000 | 2/15  │ │
│ └─────────────────────────────────────────────┘ │
│              未入金合計: ¥880,000               │
└─────────────────────────────────────────────────┘
```

### 2.2 未入金請求書一覧

```vue
<template>
  <div class="receivable-list">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">未入金請求書</CardTitle>
        <div class="flex gap-2">
          <!-- フィルター -->
          <Select v-model="filter.status">
            <SelectTrigger class="w-32">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全て</SelectItem>
              <SelectItem value="overdue">期限超過</SelectItem>
              <SelectItem value="due_soon">期限間近</SelectItem>
              <SelectItem value="partial">一部入金</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            v-model="searchQuery"
            placeholder="請求書番号・クライアント名"
            class="w-64"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>請求書番号</TableHead>
              <TableHead>クライアント</TableHead>
              <TableHead>案件</TableHead>
              <TableHead class="text-right">請求額</TableHead>
              <TableHead class="text-right">入金済</TableHead>
              <TableHead class="text-right">残額</TableHead>
              <TableHead>支払期限</TableHead>
              <TableHead class="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="invoice in filteredInvoices"
              :key="invoice.id"
              class="cursor-pointer hover:bg-accent"
              @click="showInvoiceDetail(invoice)"
            >
              <TableCell>
                <div class="flex items-center gap-2">
                  {{ invoice.invoiceNumber }}
                  <Badge 
                    v-if="isOverdue(invoice)" 
                    variant="destructive"
                    class="text-xs"
                  >
                    期限超過
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{{ invoice.clientName }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ invoice.caseNumber }}
              </TableCell>
              <TableCell class="text-right font-mono">
                ¥{{ invoice.totalAmount.toLocaleString() }}
              </TableCell>
              <TableCell class="text-right font-mono">
                ¥{{ invoice.paidAmount.toLocaleString() }}
              </TableCell>
              <TableCell class="text-right font-mono font-medium">
                ¥{{ invoice.remainingAmount.toLocaleString() }}
              </TableCell>
              <TableCell>
                <span :class="getDueDateClass(invoice)">
                  {{ formatDate(invoice.dueDate) }}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  @click.stop="recordPayment(invoice)"
                >
                  入金記録
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        <!-- 合計表示 -->
        <div class="mt-4 flex justify-between">
          <div class="text-sm text-muted-foreground">
            表示中: {{ filteredInvoices.length }}件
          </div>
          <div>
            <span class="text-muted-foreground">未入金合計: </span>
            <span class="text-xl font-semibold">
              ¥{{ totalUnpaid.toLocaleString() }}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
interface UnpaidInvoice {
  id: string
  invoiceNumber: string
  clientName: string
  caseNumber: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string
  status: 'unpaid' | 'partial' | 'overdue'
}

const filter = reactive({
  status: 'all'
})

const searchQuery = ref('')
const invoices = ref<UnpaidInvoice[]>([])

const isOverdue = (invoice: UnpaidInvoice) => {
  return new Date(invoice.dueDate) < new Date()
}

const getDueDateClass = (invoice: UnpaidInvoice) => {
  const daysUntilDue = Math.ceil(
    (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysUntilDue < 0) return 'text-destructive font-medium'
  if (daysUntilDue <= 7) return 'text-warning'
  return ''
}

const recordPayment = (invoice: UnpaidInvoice) => {
  openPaymentRecordDialog(invoice)
}
</script>
```

### 2.3 入金記録ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="payment-record-dialog">
      <DialogHeader>
        <DialogTitle>入金記録</DialogTitle>
        <DialogDescription>
          {{ invoice.invoiceNumber }} - {{ invoice.clientName }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-4">
        <!-- 請求情報 -->
        <Card>
          <CardContent class="p-4">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-muted-foreground">請求額:</span>
                <span class="ml-2 font-mono">¥{{ invoice.totalAmount.toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">入金済:</span>
                <span class="ml-2 font-mono">¥{{ invoice.paidAmount.toLocaleString() }}</span>
              </div>
              <div class="col-span-2">
                <span class="text-muted-foreground">残額:</span>
                <span class="ml-2 font-mono font-medium">
                  ¥{{ invoice.remainingAmount.toLocaleString() }}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- 入金情報入力 -->
        <div class="space-y-3">
          <div>
            <Label>入金日</Label>
            <DatePicker v-model="payment.date" />
          </div>
          
          <div>
            <Label>入金額</Label>
            <AmountInput 
              v-model="payment.amount"
              :placeholder="`残額: ¥${invoice.remainingAmount.toLocaleString()}`"
            />
          </div>
          
          <div>
            <Label>入金方法</Label>
            <Select v-model="payment.method">
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">銀行振込</SelectItem>
                <SelectItem value="cash">現金</SelectItem>
                <SelectItem value="check">小切手</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>振込元・備考</Label>
            <Input 
              v-model="payment.reference"
              placeholder="振込人名義など"
            />
          </div>
        </div>
        
        <!-- 差額アラート -->
        <Alert v-if="hasDifference" :variant="differenceType">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>{{ differenceTitle }}</AlertTitle>
          <AlertDescription>
            {{ differenceMessage }}
          </AlertDescription>
        </Alert>
        
        <!-- アクションボタン -->
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="close">
            キャンセル
          </Button>
          <Button 
            @click="confirmPayment"
            :disabled="!isValid"
          >
            入金を記録
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  invoice: UnpaidInvoice
}>()

const payment = reactive({
  invoiceId: props.invoice.id,
  date: new Date().toISOString().split('T')[0],
  amount: props.invoice.remainingAmount,
  method: 'transfer',
  reference: ''
})

// 差額チェック
const difference = computed(() => payment.amount - props.invoice.remainingAmount)
const hasDifference = computed(() => Math.abs(difference.value) > 0)

const differenceType = computed(() => {
  if (!hasDifference.value) return 'default'
  return difference.value > 0 ? 'warning' : 'destructive'
})

const differenceTitle = computed(() => {
  if (difference.value > 0) return '過入金'
  if (difference.value < 0) return '入金不足'
  return ''
})

const differenceMessage = computed(() => {
  const abs = Math.abs(difference.value)
  if (difference.value > 0) {
    return `請求額より ¥${abs.toLocaleString()} 多く入金されています。`
  }
  if (difference.value < 0) {
    return `請求額より ¥${abs.toLocaleString()} 少ない入金です。振込手数料の可能性があります。`
  }
  return ''
})

const isValid = computed(() => 
  payment.amount > 0 && payment.method && payment.date
)

const confirmPayment = async () => {
  try {
    await $fetch('/api/v1/payments', {
      method: 'POST',
      body: payment
    })
    
    showToast({
      type: 'success',
      title: '入金を記録しました',
      description: hasDifference.value 
        ? '差額があります。必要に応じて調整してください。'
        : undefined
    })
    
    close()
    await refreshInvoices()
  } catch (error) {
    showToast({
      type: 'error',
      title: 'エラーが発生しました'
    })
  }
}
</script>
```

## 3. 入金履歴表示

### 3.1 入金履歴一覧

```vue
<template>
  <div class="payment-history">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">入金履歴</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>入金日</TableHead>
              <TableHead>請求書番号</TableHead>
              <TableHead>クライアント</TableHead>
              <TableHead class="text-right">請求額</TableHead>
              <TableHead class="text-right">入金額</TableHead>
              <TableHead class="text-right">差額</TableHead>
              <TableHead>方法</TableHead>
              <TableHead>備考</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="payment in payments" :key="payment.id">
              <TableCell>{{ formatDate(payment.date) }}</TableCell>
              <TableCell>{{ payment.invoiceNumber }}</TableCell>
              <TableCell>{{ payment.clientName }}</TableCell>
              <TableCell class="text-right font-mono">
                ¥{{ payment.invoiceAmount.toLocaleString() }}
              </TableCell>
              <TableCell class="text-right font-mono">
                ¥{{ payment.amount.toLocaleString() }}
              </TableCell>
              <TableCell class="text-right font-mono">
                <span v-if="payment.difference !== 0" 
                      :class="payment.difference > 0 ? 'text-blue-600' : 'text-orange-600'">
                  {{ payment.difference > 0 ? '+' : '' }}¥{{ payment.difference.toLocaleString() }}
                </span>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {{ getPaymentMethodLabel(payment.method) }}
                </Badge>
              </TableCell>
              <TableCell class="text-sm">
                {{ payment.reference || '-' }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
```

## 4. データモデル

### 4.1 入金記録

```typescript
interface Payment {
  id: string
  invoiceId: string
  amount: number
  date: string
  method: 'transfer' | 'cash' | 'check'
  reference?: string  // 振込元情報・備考
  difference: number  // 請求額との差額
  createdBy: string
  createdAt: Date
}

interface PaymentWithInvoice extends Payment {
  invoiceNumber: string
  clientName: string
  invoiceAmount: number
}
```

### 4.2 API設計

```typescript
// 未入金請求書一覧
GET /api/v1/invoices/unpaid

// 入金記録
POST /api/v1/payments
{
  invoiceId: string
  amount: number
  date: string
  method: 'transfer' | 'cash' | 'check'
  reference?: string
}

// 入金履歴
GET /api/v1/payments

// 請求書の入金状況確認
GET /api/v1/invoices/{id}/payment-status
```

## 5. 売掛金エージング分析

### 5.1 期間別集計

```vue
<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base">売掛金エージング</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="space-y-3">
        <div v-for="range in agingRanges" :key="range.label" 
             class="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
          <div>
            <div class="font-medium">{{ range.label }}</div>
            <div class="text-sm text-muted-foreground">
              {{ range.count }}件
            </div>
          </div>
          <div class="text-right">
            <div class="font-mono font-medium">
              ¥{{ range.amount.toLocaleString() }}
            </div>
            <div class="text-sm text-muted-foreground">
              {{ range.percentage }}%
            </div>
          </div>
        </div>
      </div>
      
      <!-- 視覚的な表示 -->
      <div class="mt-4 space-y-2">
        <div v-for="range in agingRanges" :key="range.label" class="space-y-1">
          <div class="flex justify-between text-sm">
            <span>{{ range.label }}</span>
            <span>{{ range.percentage }}%</span>
          </div>
          <Progress :value="range.percentage" :class="range.colorClass" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
const agingRanges = computed(() => [
  {
    label: '期限内',
    days: 0,
    count: 12,
    amount: 2500000,
    percentage: 45,
    colorClass: 'bg-green-500'
  },
  {
    label: '1-30日超過',
    days: 30,
    count: 5,
    amount: 1200000,
    percentage: 22,
    colorClass: 'bg-yellow-500'
  },
  {
    label: '31-60日超過',
    days: 60,
    count: 3,
    amount: 800000,
    percentage: 14,
    colorClass: 'bg-orange-500'
  },
  {
    label: '61日以上超過',
    days: 61,
    count: 2,
    amount: 1000000,
    percentage: 19,
    colorClass: 'bg-red-500'
  }
])
</script>
```

## 6. 状態管理

```typescript
// stores/accounting.ts に追加
export const useAccountingStore = defineStore('accounting', () => {
  // ... 既存のコード
  
  // 売掛金関連
  const unpaidInvoices = ref<UnpaidInvoice[]>([])
  const payments = ref<Payment[]>([])
  
  // 未入金請求書取得
  const fetchUnpaidInvoices = async () => {
    const { data } = await $fetch('/api/v1/invoices/unpaid')
    unpaidInvoices.value = data
  }
  
  // 入金記録
  const recordPayment = async (paymentData: PaymentData) => {
    const result = await $fetch('/api/v1/payments', {
      method: 'POST',
      body: paymentData
    })
    
    // リストを更新
    await fetchUnpaidInvoices()
    
    return result
  }
  
  // 売掛金合計
  const totalReceivables = computed(() => 
    unpaidInvoices.value.reduce((sum, inv) => sum + inv.remainingAmount, 0)
  )
  
  return {
    // ... 既存のエクスポート
    unpaidInvoices: readonly(unpaidInvoices),
    payments: readonly(payments),
    totalReceivables,
    fetchUnpaidInvoices,
    recordPayment
  }
})
```