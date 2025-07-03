<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

/**
 * Financial Budget Progress Chart Component
 * 
 * Displays budget utilization by category using a horizontal bar chart.
 * Shows allocated vs spent amounts with progress indicators.
 */

interface BudgetData {
  allocated: number
  spent: number
  remaining: number
}

interface Props {
  /** Budget data by category */
  data: Record<string, BudgetData>
  /** Chart title */
  title?: string
  /** Chart height */
  height?: number
  /** Show horizontal bars */
  horizontal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Budget Utilization by Category',
  height: 300,
  horizontal: true
})

// Chart data
const chartData = computed(() => {
  const categories = Object.keys(props.data)
  const allocated = categories.map(cat => props.data[cat].allocated)
  const spent = categories.map(cat => props.data[cat].spent)
  const remaining = categories.map(cat => props.data[cat].remaining)

  return {
    labels: categories,
    datasets: [
      {
        label: 'Spent',
        data: spent,
        backgroundColor: 'hsl(346, 77%, 49%)',
        borderColor: 'hsl(346, 77%, 49%)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: 'Remaining',
        data: remaining,
        backgroundColor: 'hsl(142, 76%, 36%)',
        borderColor: 'hsl(142, 76%, 36%)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  }
})

// Chart options
const chartOptions = computed(() => ({
  indexAxis: props.horizontal ? 'y' as const : 'x' as const,
  responsive: true,
  maintainAspectRatio: false,
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
        weight: 'bold'
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
          return context[0].label
        },
        afterTitle: (context: any) => {
          const categoryName = context[0].label
          const budgetData = props.data[categoryName]
          const utilization = ((budgetData.spent / budgetData.allocated) * 100).toFixed(1)
          return `Utilization: ${utilization}%`
        },
        label: (context: any) => {
          const label = context.dataset.label || ''
          const value = context.parsed.x || context.parsed.y || 0
          return `${label}: ¥${value.toLocaleString('ja-JP')}`
        },
        afterBody: (context: any) => {
          const categoryName = context[0].label
          const budgetData = props.data[categoryName]
          return [
            '',
            `Total Allocated: ¥${budgetData.allocated.toLocaleString('ja-JP')}`
          ]
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      display: true,
      title: {
        display: true,
        text: props.horizontal ? 'Amount (¥)' : 'Category',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      grid: {
        display: props.horizontal
      },
      ticks: props.horizontal ? {
        callback: (value: any) => {
          return '¥' + Number(value).toLocaleString('ja-JP')
        }
      } : {}
    },
    y: {
      stacked: true,
      display: true,
      title: {
        display: true,
        text: props.horizontal ? 'Category' : 'Amount (¥)',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      grid: {
        display: !props.horizontal
      },
      ticks: !props.horizontal ? {
        callback: (value: any) => {
          return '¥' + Number(value).toLocaleString('ja-JP')
        }
      } : {}
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeOutQuart'
  }
}))

// Budget summary
const budgetSummary = computed(() => {
  const categories = Object.keys(props.data)
  
  let totalAllocated = 0
  let totalSpent = 0
  let totalRemaining = 0
  let overBudgetCount = 0
  
  categories.forEach(category => {
    const budget = props.data[category]
    totalAllocated += budget.allocated
    totalSpent += budget.spent
    totalRemaining += budget.remaining
    
    if (budget.spent > budget.allocated) {
      overBudgetCount++
    }
  })
  
  const overallUtilization = (totalSpent / totalAllocated) * 100
  
  return {
    totalAllocated,
    totalSpent,
    totalRemaining,
    overallUtilization,
    overBudgetCount,
    categoriesCount: categories.length
  }
})

// Get budget status for a category
const getBudgetStatus = (categoryData: BudgetData) => {
  const utilization = (categoryData.spent / categoryData.allocated) * 100
  
  if (utilization > 100) return { status: 'over', color: 'text-red-600', text: 'Over Budget' }
  if (utilization > 90) return { status: 'warning', color: 'text-yellow-600', text: 'Near Limit' }
  if (utilization > 75) return { status: 'high', color: 'text-orange-600', text: 'High Usage' }
  return { status: 'good', color: 'text-green-600', text: 'On Track' }
}

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
  return `${value.toFixed(1)}%`
}
</script>

<template>
  <Card class="financial-chart-card">
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        <span>{{ title }}</span>
        <Badge 
          :variant="budgetSummary.overallUtilization > 100 ? 'destructive' : budgetSummary.overallUtilization > 90 ? 'secondary' : 'default'"
          class="text-xs"
        >
          {{ formatPercentage(budgetSummary.overallUtilization) }} Used
        </Badge>
      </CardTitle>
      <CardDescription>
        Budget allocation vs actual spending across categories
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      <div class="chart-container" :style="{ height: `${height}px` }">
        <div v-if="Object.keys(data).length === 0" class="flex items-center justify-center h-full text-muted-foreground">
          <div class="text-center">
            <BarChart3 class="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No budget data available</p>
          </div>
        </div>
        
        <Bar
          v-else
          :data="chartData"
          :options="chartOptions"
          class="chart-canvas"
        />
      </div>
      
      <!-- Budget Summary -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center p-3 rounded-lg bg-muted/50">
          <div class="text-xs text-muted-foreground mb-1">Total Allocated</div>
          <div class="text-lg font-semibold">
            {{ formatCurrency(budgetSummary.totalAllocated) }}
          </div>
        </div>
        
        <div class="text-center p-3 rounded-lg bg-muted/50">
          <div class="text-xs text-muted-foreground mb-1">Total Spent</div>
          <div class="text-lg font-semibold" :class="budgetSummary.totalSpent > budgetSummary.totalAllocated ? 'text-red-600' : 'text-green-600'">
            {{ formatCurrency(budgetSummary.totalSpent) }}
          </div>
        </div>
        
        <div class="text-center p-3 rounded-lg bg-muted/50">
          <div class="text-xs text-muted-foreground mb-1">Remaining</div>
          <div class="text-lg font-semibold" :class="budgetSummary.totalRemaining < 0 ? 'text-red-600' : 'text-green-600'">
            {{ formatCurrency(budgetSummary.totalRemaining) }}
          </div>
        </div>
      </div>
      
      <!-- Category Status List -->
      <div class="mt-6">
        <h4 class="text-sm font-medium mb-3">Category Status</h4>
        <div class="space-y-2">
          <div 
            v-for="(budgetData, category) in data" 
            :key="category"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
          >
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium">{{ category }}</span>
              <Badge 
                :variant="getBudgetStatus(budgetData).status === 'over' ? 'destructive' : 'secondary'"
                class="text-xs"
              >
                {{ getBudgetStatus(budgetData).text }}
              </Badge>
            </div>
            <div class="text-right">
              <div class="text-sm">
                {{ formatCurrency(budgetData.spent) }} / {{ formatCurrency(budgetData.allocated) }}
              </div>
              <div class="text-xs" :class="getBudgetStatus(budgetData).color">
                {{ formatPercentage((budgetData.spent / budgetData.allocated) * 100) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Alert for over budget categories -->
      <Alert v-if="budgetSummary.overBudgetCount > 0" variant="destructive" class="mt-4">
        <AlertTriangle class="h-4 w-4" />
        <AlertTitle>Budget Alert</AlertTitle>
        <AlertDescription>
          {{ budgetSummary.overBudgetCount }} of {{ budgetSummary.categoriesCount }} categories are over budget.
          Consider reviewing spending or adjusting allocations.
        </AlertDescription>
      </Alert>
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
  
  .grid-cols-3 {
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