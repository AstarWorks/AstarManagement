<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
)

/**
 * Financial Revenue Chart Component
 * 
 * Displays revenue vs expenses trends using a line chart.
 * Shows monthly trends with profit/loss indicators.
 */

interface MonthlyTrend {
  month: string
  date: string
  expenses: number
  revenue: number
  profit: number
}

interface Props {
  /** Monthly trend data */
  data: MonthlyTrend[]
  /** Chart title */
  title?: string
  /** Chart height */
  height?: number
  /** Show profit area */
  showProfitArea?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Revenue vs Expenses Trend',
  height: 300,
  showProfitArea: true
})

// Chart data
const chartData = computed(() => {
  const labels = props.data.map(item => item.month)
  const revenues = props.data.map(item => item.revenue)
  const expenses = props.data.map(item => item.expenses)
  const profits = props.data.map(item => item.profit)

  const datasets = [
    {
      label: 'Revenue',
      data: revenues,
      borderColor: 'hsl(142, 76%, 36%)',
      backgroundColor: 'hsla(142, 76%, 36%, 0.1)',
      borderWidth: 3,
      pointBackgroundColor: 'hsl(142, 76%, 36%)',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.4,
      fill: false as const
    },
    {
      label: 'Expenses',
      data: expenses,
      borderColor: 'hsl(346, 77%, 49%)',
      backgroundColor: 'hsla(346, 77%, 49%, 0.1)',
      borderWidth: 3,
      pointBackgroundColor: 'hsl(346, 77%, 49%)',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.4,
      fill: false as const
    }
  ]

  // Add profit area if enabled
  if (props.showProfitArea) {
    datasets.push({
      label: 'Profit',
      data: profits,
      borderColor: 'hsl(220, 70%, 50%)',
      backgroundColor: 'hsla(220, 70%, 50%, 0.2)',
      borderWidth: 2,
      pointBackgroundColor: 'hsl(220, 70%, 50%)',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: 'origin' as const
    })
  }

  return {
    labels,
    datasets
  }
})

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    title: {
      display: !!props.title,
      text: props.title,
      font: {
        size: 14,
        weight: 'bold' as const
      },
      padding: {
        bottom: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      callbacks: {
        title: (context: any) => {
          const dataIndex = context[0].dataIndex
          const monthData = props.data[dataIndex]
          return `${monthData.month} ${new Date(monthData.date).getFullYear()}`
        },
        label: (context: any) => {
          const label = context.dataset.label || ''
          const value = context.parsed.y || 0
          return `${label}: ¥${value.toLocaleString('ja-JP')}`
        },
        afterBody: (context: any) => {
          const dataIndex = context[0].dataIndex
          const monthData = props.data[dataIndex]
          const profitMargin = ((monthData.profit / monthData.revenue) * 100).toFixed(1)
          return [
            '',
            `Profit Margin: ${profitMargin}%`,
            `Net Profit: ¥${monthData.profit.toLocaleString('ja-JP')}`
          ]
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Month',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      grid: {
        display: false
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Amount (¥)',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        callback: (value: any) => {
          return '¥' + Number(value).toLocaleString('ja-JP')
        }
      }
    }
  },
  animation: {
    duration: 1500,
    easing: 'easeInOutQuart' as const
  },
  elements: {
    point: {
      hoverBackgroundColor: '#ffffff'
    }
  }
}))

// Summary calculations
const summary = computed(() => {
  if (props.data.length === 0) return null

  const totalRevenue = props.data.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = props.data.reduce((sum, item) => sum + item.expenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const averageProfit = totalProfit / props.data.length
  const profitMargin = (totalProfit / totalRevenue) * 100

  const currentMonth = props.data[props.data.length - 1]
  const previousMonth = props.data[props.data.length - 2]
  
  let revenueGrowth = 0
  let expenseGrowth = 0
  
  if (previousMonth) {
    revenueGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    expenseGrowth = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
  }

  return {
    totalRevenue,
    totalExpenses,
    totalProfit,
    averageProfit,
    profitMargin,
    revenueGrowth,
    expenseGrowth
  }
})

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(amount)
}

// Format percentage
const formatPercentage = (value: number): string => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
</script>

<template>
  <Card class="financial-chart-card">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription>
        Monthly revenue and expense trends with profit analysis
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      <div class="chart-container" :style="{ height: `${height}px` }">
        <div v-if="data.length === 0" class="flex items-center justify-center h-full text-muted-foreground">
          <div class="text-center">
            <LineChart class="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No trend data available</p>
          </div>
        </div>
        
        <Line
          v-else
          :data="chartData"
          :options="chartOptions"
          class="chart-canvas"
        />
      </div>
      
      <!-- Summary Statistics -->
      <div v-if="summary" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-3 rounded-lg bg-muted/50">
          <div class="text-xs text-muted-foreground mb-1">Total Revenue</div>
          <div class="text-lg font-semibold text-green-600">
            {{ formatCurrency(summary.totalRevenue) }}
          </div>
        </div>
        
        <div class="text-center p-3 rounded-lg bg-muted/50">
          <div class="text-xs text-muted-foreground mb-1">Total Expenses</div>
          <div class="text-lg font-semibold text-red-600">
            {{ formatCurrency(summary.totalExpenses) }}
          </div>
        </div>
        
        <div class="text-center p-3 rounded-lg bg-muted/50">
          <div class="text-xs text-muted-foreground mb-1">Net Profit</div>
          <div class="text-lg font-semibold" :class="summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(summary.totalProfit) }}
          </div>
        </div>
        
        <div class="text-center p-3 rounded-lg bg-muted/50">
          <div class="text-xs text-muted-foreground mb-1">Profit Margin</div>
          <div class="text-lg font-semibold" :class="summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatPercentage(summary.profitMargin) }}
          </div>
        </div>
      </div>
      
      <!-- Growth indicators -->
      <div v-if="summary" class="mt-4 flex justify-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <TrendingUp v-if="summary.revenueGrowth > 0" class="w-4 h-4 text-green-500" />
          <TrendingDown v-else class="w-4 h-4 text-red-500" />
          <span>Revenue Growth: {{ formatPercentage(summary.revenueGrowth) }}</span>
        </div>
        
        <div class="flex items-center gap-2">
          <TrendingUp v-if="summary.expenseGrowth > 0" class="w-4 h-4 text-red-500" />
          <TrendingDown v-else class="w-4 h-4 text-green-500" />
          <span>Expense Growth: {{ formatPercentage(summary.expenseGrowth) }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.financial-chart-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.chart-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.chart-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .chart-container {
    height: 250px !important;
  }
  
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .financial-chart-card {
    border-width: 2px;
  }
}
</style>