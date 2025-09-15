# 会計画面 - 月次レポート設計

## 1. 月次レポートの概要

小中規模法律事務所向けに、収支バランスを中心としたシンプルな月次レポートを提供します。
ダッシュボード形式とレポート形式を切り替えて表示できます。

## 2. 画面構成

### 2.1 月次レポートタブのレイアウト

```
┌─────────────────────────────────────────────────┐
│ 月次レポート                                    │
├─────────────────────────────────────────────────┤
│ [2024年1月 ▼] [ダッシュボード/レポート] [PDF]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  （ダッシュボード or レポート表示）             │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2.2 表示切り替えヘッダー

```vue
<template>
  <div class="monthly-report">
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>月次レポート</CardTitle>
          <div class="flex items-center gap-2">
            <!-- 月選択 -->
            <MonthPicker v-model="selectedMonth" />
            
            <!-- 表示切替 -->
            <ToggleGroup v-model="viewMode" type="single">
              <ToggleGroupItem value="dashboard">
                <LayoutDashboard class="h-4 w-4 mr-1" />
                ダッシュボード
              </ToggleGroupItem>
              <ToggleGroupItem value="report">
                <FileText class="h-4 w-4 mr-1" />
                レポート
              </ToggleGroupItem>
            </ToggleGroup>
            
            <!-- PDF出力 -->
            <Button variant="outline" size="sm" @click="exportPDF">
              <Download class="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- ダッシュボード表示 -->
        <MonthlyDashboard 
          v-if="viewMode === 'dashboard'"
          :data="reportData"
        />
        
        <!-- レポート表示 -->
        <MonthlyReport 
          v-else
          :data="reportData"
        />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
const selectedMonth = ref(getCurrentMonth())
const viewMode = ref<'dashboard' | 'report'>('dashboard')

const { reportData } = useMonthlyReport(selectedMonth)

const exportPDF = async () => {
  await generateMonthlyReportPDF(selectedMonth.value, reportData.value)
}
</script>
```

## 3. ダッシュボード形式

### 3.1 ダッシュボードレイアウト

```vue
<template>
  <div class="monthly-dashboard grid gap-4">
    <!-- 収支サマリー -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="収入"
        :value="data.income"
        :trend="data.incomeTrend"
        icon="TrendingUp"
        color="green"
      />
      <MetricCard
        title="支出"
        :value="data.expense"
        :trend="data.expenseTrend"
        icon="TrendingDown"
        color="red"
      />
      <MetricCard
        title="収支"
        :value="data.balance"
        :trend="data.balanceTrend"
        icon="DollarSign"
        :color="data.balance >= 0 ? 'blue' : 'orange'"
      />
    </div>
    
    <!-- グラフエリア -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 収支推移グラフ -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">収支推移（6ヶ月）</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceChart :data="data.monthlyTrend" />
        </CardContent>
      </Card>
      
      <!-- 売掛金・預り金状況 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">資産状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <div class="text-sm text-muted-foreground">売掛金残高</div>
                <div class="text-2xl font-semibold">
                  ¥{{ data.receivables.toLocaleString() }}
                </div>
              </div>
              <Badge variant="outline">
                {{ data.receivableCount }}件
              </Badge>
            </div>
            <Separator />
            <div class="flex justify-between items-center">
              <div>
                <div class="text-sm text-muted-foreground">預り金残高</div>
                <div class="text-2xl font-semibold">
                  ¥{{ data.deposits.toLocaleString() }}
                </div>
              </div>
              <Badge variant="outline">
                {{ data.depositCount }}件
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- 詳細情報 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 主要収入源 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">収入内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div v-for="item in data.incomeBreakdown" :key="item.category"
                 class="flex justify-between items-center">
              <span class="text-sm">{{ item.label }}</span>
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm">
                  ¥{{ item.amount.toLocaleString() }}
                </span>
                <span class="text-xs text-muted-foreground">
                  ({{ item.percentage }}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <!-- 主要経費 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">経費内訳（上位5項目）</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div v-for="item in data.expenseBreakdown.slice(0, 5)" 
                 :key="item.accountCode"
                 class="flex justify-between items-center">
              <span class="text-sm">{{ item.accountName }}</span>
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm">
                  ¥{{ item.amount.toLocaleString() }}
                </span>
                <span class="text-xs text-muted-foreground">
                  ({{ item.percentage }}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
```

### 3.2 メトリクスカード

```vue
<template>
  <Card>
    <CardContent class="p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">{{ title }}</p>
          <p class="text-2xl font-bold mt-1">
            ¥{{ value.toLocaleString() }}
          </p>
          <div class="flex items-center gap-1 mt-2">
            <TrendIcon :trend="trend" />
            <span 
              class="text-sm"
              :class="getTrendClass(trend)"
            >
              {{ Math.abs(trend.percentage) }}%
              <span class="text-muted-foreground">
                前月比
              </span>
            </span>
          </div>
        </div>
        <div :class="`text-${color}-500 bg-${color}-50 p-3 rounded-lg`">
          <component :is="icon" class="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: number
  trend: {
    direction: 'up' | 'down' | 'flat'
    percentage: number
  }
  icon: string
  color: string
}

const props = defineProps<Props>()

const TrendIcon = ({ trend }) => {
  if (trend.direction === 'up') return h(TrendingUp, { class: 'h-4 w-4 text-green-600' })
  if (trend.direction === 'down') return h(TrendingDown, { class: 'h-4 w-4 text-red-600' })
  return h(Minus, { class: 'h-4 w-4 text-gray-400' })
}

const getTrendClass = (trend) => {
  if (props.title === '支出') {
    // 支出は減少が良い
    return trend.direction === 'down' ? 'text-green-600' : 'text-red-600'
  }
  // 収入・収支は増加が良い
  return trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
}
</script>
```

### 3.3 収支推移グラフ

```vue
<template>
  <div class="balance-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps<{
  data: MonthlyTrend[]
}>()

const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

onMounted(() => {
  if (!chartCanvas.value) return
  
  chart = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: props.data.map(d => d.month),
      datasets: [
        {
          label: '収入',
          data: props.data.map(d => d.income),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3
        },
        {
          label: '支出',
          data: props.data.map(d => d.expense),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3
        },
        {
          label: '収支',
          data: props.data.map(d => d.balance),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              return `${label}: ¥${value.toLocaleString()}`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `¥${value.toLocaleString()}`
          }
        }
      }
    }
  })
})

onUnmounted(() => {
  chart?.destroy()
})
</script>

<style scoped>
.balance-chart {
  position: relative;
  height: 300px;
}
</style>
```

## 4. レポート形式

### 4.1 印刷用レポートレイアウト

```vue
<template>
  <div class="monthly-report-document">
    <!-- ヘッダー -->
    <div class="report-header">
      <h1 class="text-2xl font-bold">月次会計レポート</h1>
      <p class="text-muted-foreground">{{ formatMonth(data.month) }}</p>
    </div>
    
    <!-- 収支サマリー -->
    <section class="report-section">
      <h2 class="section-title">収支サマリー</h2>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>収入合計</TableCell>
            <TableCell class="text-right font-mono">
              ¥{{ data.income.toLocaleString() }}
            </TableCell>
            <TableCell class="text-right">
              <TrendBadge :trend="data.incomeTrend" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>支出合計</TableCell>
            <TableCell class="text-right font-mono">
              ¥{{ data.expense.toLocaleString() }}
            </TableCell>
            <TableCell class="text-right">
              <TrendBadge :trend="data.expenseTrend" />
            </TableCell>
          </TableRow>
          <TableRow class="font-semibold">
            <TableCell>収支差額</TableCell>
            <TableCell class="text-right font-mono">
              <span :class="data.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                ¥{{ data.balance.toLocaleString() }}
              </span>
            </TableCell>
            <TableCell class="text-right">
              <TrendBadge :trend="data.balanceTrend" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>
    
    <!-- 収入明細 -->
    <section class="report-section">
      <h2 class="section-title">収入明細</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>項目</TableHead>
            <TableHead class="text-right">金額</TableHead>
            <TableHead class="text-right">構成比</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in data.incomeDetails" :key="item.id">
            <TableCell>{{ item.description }}</TableCell>
            <TableCell class="text-right font-mono">
              ¥{{ item.amount.toLocaleString() }}
            </TableCell>
            <TableCell class="text-right">
              {{ item.percentage }}%
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>
    
    <!-- 支出明細 -->
    <section class="report-section">
      <h2 class="section-title">支出明細（勘定科目別）</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>勘定科目</TableHead>
            <TableHead class="text-right">金額</TableHead>
            <TableHead class="text-right">構成比</TableHead>
            <TableHead class="text-right">前月比</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in data.expenseByAccount" :key="item.accountCode">
            <TableCell>{{ item.accountName }}</TableCell>
            <TableCell class="text-right font-mono">
              ¥{{ item.amount.toLocaleString() }}
            </TableCell>
            <TableCell class="text-right">
              {{ item.percentage }}%
            </TableCell>
            <TableCell class="text-right">
              <span :class="item.change > 0 ? 'text-red-600' : 'text-green-600'">
                {{ item.change > 0 ? '+' : '' }}{{ item.change }}%
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>
    
    <!-- 資産状況 -->
    <section class="report-section">
      <h2 class="section-title">資産状況</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium mb-2">売掛金</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>月初残高</TableCell>
                <TableCell class="text-right font-mono">
                  ¥{{ data.receivables.beginning.toLocaleString() }}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>当月発生</TableCell>
                <TableCell class="text-right font-mono">
                  ¥{{ data.receivables.increased.toLocaleString() }}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>当月回収</TableCell>
                <TableCell class="text-right font-mono">
                  ¥{{ data.receivables.collected.toLocaleString() }}
                </TableCell>
              </TableRow>
              <TableRow class="font-semibold">
                <TableCell>月末残高</TableCell>
                <TableCell class="text-right font-mono">
                  ¥{{ data.receivables.ending.toLocaleString() }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 class="font-medium mb-2">預り金</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>月初残高</TableCell>
                <TableCell class="text-right font-mono">
                  ¥{{ data.deposits.beginning.toLocaleString() }}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>当月受領</TableCell>
                <TableCell class="text-right font-mono">
                  ¥{{ data.deposits.received.toLocaleString() }}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>当月使用</TableCell>
                <TableCell class="text-right font-mono">
                  ¥{{ data.deposits.used.toLocaleString() }}
                </TableCell>
              </TableRow>
              <TableRow class="font-semibold">
                <TableCell>月末残高</TableCell>
                <TableCell class="text-right font-mono">
                  ¥{{ data.deposits.ending.toLocaleString() }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.monthly-report-document {
  @apply space-y-6 max-w-4xl mx-auto;
}

.report-header {
  @apply text-center pb-6 border-b;
}

.report-section {
  @apply space-y-3;
}

.section-title {
  @apply text-lg font-semibold;
}

@media print {
  .report-section {
    break-inside: avoid;
  }
}
</style>
```

## 5. データモデル

### 5.1 月次レポートデータ

```typescript
interface MonthlyReportData {
  month: string  // YYYY-MM
  
  // 収支サマリー
  income: number
  expense: number
  balance: number
  
  // 前月比較
  incomeTrend: Trend
  expenseTrend: Trend
  balanceTrend: Trend
  
  // 6ヶ月推移
  monthlyTrend: MonthlyTrend[]
  
  // 内訳
  incomeBreakdown: IncomeBreakdown[]
  expenseBreakdown: ExpenseBreakdown[]
  
  // 資産状況
  receivables: AssetMovement
  deposits: AssetMovement
  receivableCount: number
  depositCount: number
}

interface Trend {
  direction: 'up' | 'down' | 'flat'
  percentage: number
  amount: number
}

interface MonthlyTrend {
  month: string
  income: number
  expense: number
  balance: number
}

interface IncomeBreakdown {
  category: string
  label: string
  amount: number
  percentage: number
}

interface ExpenseBreakdown {
  accountCode: string
  accountName: string
  amount: number
  percentage: number
  change: number  // 前月比
}

interface AssetMovement {
  beginning: number  // 月初残高
  increased: number  // 増加額
  decreased: number  // 減少額
  ending: number     // 月末残高
}
```

### 5.2 API設計

```typescript
// 月次レポートデータ取得
GET /api/v1/reports/monthly/{month}

// 収支推移データ取得（6ヶ月分）
GET /api/v1/reports/balance-trend?months=6

// PDF生成
POST /api/v1/reports/monthly/{month}/pdf
{
  format: 'dashboard' | 'report'
}
```

## 6. PDF出力

### 6.1 PDF生成機能

```typescript
// composables/useMonthlyReportPDF.ts
export const useMonthlyReportPDF = () => {
  const generatePDF = async (month: string, data: MonthlyReportData) => {
    // サーバーサイドでPDF生成
    const { data: pdfUrl } = await $fetch('/api/v1/reports/monthly/pdf', {
      method: 'POST',
      body: {
        month,
        data,
        format: 'report'  // PDF出力は常にレポート形式
      }
    })
    
    // ダウンロード
    window.open(pdfUrl, '_blank')
  }
  
  return {
    generatePDF
  }
}
```

## 7. 状態管理

```typescript
// stores/accounting.ts に追加
export const useAccountingStore = defineStore('accounting', () => {
  // ... 既存のコード
  
  // 月次レポート関連
  const currentMonthReport = ref<MonthlyReportData | null>(null)
  const monthlyTrends = ref<MonthlyTrend[]>([])
  
  // 月次レポート取得
  const fetchMonthlyReport = async (month: string) => {
    const { data } = await $fetch(`/api/v1/reports/monthly/${month}`)
    currentMonthReport.value = data
    return data
  }
  
  // 収支推移取得
  const fetchBalanceTrend = async (months: number = 6) => {
    const { data } = await $fetch('/api/v1/reports/balance-trend', {
      params: { months }
    })
    monthlyTrends.value = data
    return data
  }
  
  return {
    // ... 既存のエクスポート
    currentMonthReport: readonly(currentMonthReport),
    monthlyTrends: readonly(monthlyTrends),
    fetchMonthlyReport,
    fetchBalanceTrend
  }
})
```