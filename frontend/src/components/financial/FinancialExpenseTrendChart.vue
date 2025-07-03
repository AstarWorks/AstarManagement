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
 * Financial Expense Trend Chart Component
 * 
 * Displays monthly expense trends with revenue and profit analysis.
 * Full-width chart with comprehensive financial insights.
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
  /** Show projection data */
  showProjections?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Monthly Financial Trends',
  height: 400,
  showProjections: false
})

// Chart data with multiple datasets
const chartData = computed(() => {
  const labels = props.data.map(item => item.month)
  const expenses = props.data.map(item => item.expenses)
  const revenue = props.data.map(item => item.revenue)
  const profit = props.data.map(item => item.profit)

  return {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: revenue,
        borderColor: 'hsl(142, 76%, 36%)',
        backgroundColor: 'hsla(142, 76%, 36%, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'hsl(142, 76%, 36%)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: '+1'
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
        fill: 'origin'
      },
      {
        label: 'Profit',
        data: profit,
        borderColor: 'hsl(220, 70%, 50%)',
        backgroundColor: 'hsla(220, 70%, 50%, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: 'hsl(220, 70%, 50%)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: false,
        borderDash: [5, 5]
      }
    ]
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
          size: 13
        }
      }
    },
    title: {
      display: !!props.title,
      text: props.title,
      font: {
        size: 16,
        weight: 'bold'
      },
      padding: {
        bottom: 30
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 16,
      displayColors: true,
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
          const expenseRatio = ((monthData.expenses / monthData.revenue) * 100).toFixed(1)
          
          return [
            '',
            `Profit Margin: ${profitMargin}%`,
            `Expense Ratio: ${expenseRatio}%`,
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
          size: 14,
          weight: 'bold'
        }
      },
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 12
        }
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Amount (¥)',
        font: {
          size: 14,
          weight: 'bold'
        }
      },
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        font: {
          size: 12
        },
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

// Financial analysis
const analysis = computed(() => {
  if (props.data.length < 2) return null

  const latest = props.data[props.data.length - 1]
  const previous = props.data[props.data.length - 2]
  
  const revenueGrowth = ((latest.revenue - previous.revenue) / previous.revenue) * 100
  const expenseGrowth = ((latest.expenses - previous.expenses) / previous.expenses) * 100
  const profitGrowth = ((latest.profit - previous.profit) / previous.profit) * 100
  
  // Calculate trends over the full period
  const firstMonth = props.data[0]
  const totalRevenueGrowth = ((latest.revenue - firstMonth.revenue) / firstMonth.revenue) * 100
  const totalExpenseGrowth = ((latest.expenses - firstMonth.expenses) / firstMonth.expenses) * 100
  
  // Calculate average monthly profit margin
  const avgProfitMargin = props.data.reduce((sum, month) => 
    sum + (month.profit / month.revenue), 0) / props.data.length * 100
  
  return {
    revenueGrowth,
    expenseGrowth,
    profitGrowth,
    totalRevenueGrowth,
    totalExpenseGrowth,
    avgProfitMargin,
    currentProfitMargin: (latest.profit / latest.revenue) * 100
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

// Format percentage with color
const formatPercentageWithColor = (value: number): { text: string; color: string } => {
  const sign = value > 0 ? '+' : ''
  const text = `${sign}${value.toFixed(1)}%`
  const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
  
  return { text, color }
}
</script>

<template>
  <Card class="financial-chart-card">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription>
        Comprehensive view of revenue, expenses, and profit trends over time
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      <div class="chart-container" :style="{ height: `${height}px` }">
        <div v-if="data.length === 0" class="flex items-center justify-center h-full text-muted-foreground">
          <div class="text-center">
            <TrendingUp class="mx-auto h-12 w-12 mb-2 opacity-50" />
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
      
      <!-- Growth Analysis -->
      <div v-if="analysis" class="mt-8">
        <h4 class="text-lg font-semibold mb-4">Financial Analysis</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <!-- Month-over-Month Growth -->
          <div class="p-4 rounded-lg bg-muted/50">
            <h5 class="text-sm font-medium text-muted-foreground mb-2">Revenue Growth (MoM)</h5>
            <div class="flex items-center gap-2">
              <TrendingUp v-if="analysis.revenueGrowth > 0" class="w-4 h-4 text-green-500" />
              <TrendingDown v-else-if="analysis.revenueGrowth < 0" class="w-4 h-4 text-red-500" />
              <Minus v-else class="w-4 h-4 text-gray-500" />
              <span class="font-semibold" :class="formatPercentageWithColor(analysis.revenueGrowth).color">
                {{ formatPercentageWithColor(analysis.revenueGrowth).text }}
              </span>
            </div>
          </div>
          
          <div class="p-4 rounded-lg bg-muted/50">
            <h5 class="text-sm font-medium text-muted-foreground mb-2">Expense Growth (MoM)</h5>
            <div class="flex items-center gap-2">
              <TrendingUp v-if="analysis.expenseGrowth > 0" class="w-4 h-4 text-red-500" />
              <TrendingDown v-else-if="analysis.expenseGrowth < 0" class="w-4 h-4 text-green-500" />
              <Minus v-else class="w-4 h-4 text-gray-500" />
              <span class="font-semibold" :class="analysis.expenseGrowth > 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatPercentageWithColor(Math.abs(analysis.expenseGrowth)).text }}
              </span>
            </div>
          </div>
          
          <div class="p-4 rounded-lg bg-muted/50">
            <h5 class="text-sm font-medium text-muted-foreground mb-2">Profit Growth (MoM)</h5>
            <div class="flex items-center gap-2">
              <TrendingUp v-if="analysis.profitGrowth > 0" class="w-4 h-4 text-green-500" />
              <TrendingDown v-else-if="analysis.profitGrowth < 0" class="w-4 h-4 text-red-500" />
              <Minus v-else class="w-4 h-4 text-gray-500" />
              <span class="font-semibold" :class="formatPercentageWithColor(analysis.profitGrowth).color">
                {{ formatPercentageWithColor(analysis.profitGrowth).text }}
              </span>
            </div>
          </div>
          
          <div class="p-4 rounded-lg bg-muted/50">
            <h5 class="text-sm font-medium text-muted-foreground mb-2">Avg Profit Margin</h5>
            <div class="flex items-center gap-2">
              <Target class="w-4 h-4 text-blue-500" />
              <span class="font-semibold text-blue-600">
                {{ analysis.avgProfitMargin.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
        
        <!-- Period Summary -->
        <div class="p-4 rounded-lg bg-muted/20 border border-muted">
          <h5 class="font-medium mb-3">Period Summary</h5>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">Total Revenue Growth:</span>
              <span class="ml-2 font-medium" :class="formatPercentageWithColor(analysis.totalRevenueGrowth).color">
                {{ formatPercentageWithColor(analysis.totalRevenueGrowth).text }}
              </span>
            </div>
            <div>
              <span class="text-muted-foreground">Total Expense Growth:</span>
              <span class="ml-2 font-medium" :class="analysis.totalExpenseGrowth > 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatPercentageWithColor(Math.abs(analysis.totalExpenseGrowth)).text }}
              </span>
            </div>
            <div>
              <span class="text-muted-foreground">Current Profit Margin:</span>
              <span class="ml-2 font-medium text-blue-600">
                {{ analysis.currentProfitMargin.toFixed(1) }}%
              </span>
            </div>
            <div>
              <span class="text-muted-foreground">Data Period:</span>
              <span class="ml-2 font-medium">{{ data.length }} months</span>
            </div>
          </div>
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
    height: 300px !important;
  }
  
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .grid-cols-4 {
    grid-template-columns: repeat(1, 1fr);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .financial-chart-card {
    border-width: 2px;
  }
}
</style>