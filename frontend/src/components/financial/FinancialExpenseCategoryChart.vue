<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale)

/**
 * Financial Expense Category Chart Component
 * 
 * Displays expense distribution by category using a pie chart.
 * Supports interactive features and responsive design.
 */

interface Props {
  /** Expense data by category */
  data: Record<string, number>
  /** Chart title */
  title?: string
  /** Show legend */
  showLegend?: boolean
  /** Chart height */
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Expense Distribution by Category',
  showLegend: true,
  height: 300
})

// Color palette for categories
const categoryColors = [
  'hsl(220, 70%, 50%)',  // Blue
  'hsl(25, 95%, 53%)',   // Orange
  'hsl(142, 76%, 36%)',  // Green
  'hsl(271, 81%, 56%)',  // Purple
  'hsl(346, 77%, 49%)',  // Red
  'hsl(45, 93%, 47%)',   // Yellow
  'hsl(197, 71%, 52%)',  // Cyan
  'hsl(15, 86%, 54%)',   // Red-Orange
]

// Chart data
const chartData = computed(() => {
  const categories = Object.keys(props.data)
  const amounts = Object.values(props.data)
  
  return {
    labels: categories,
    datasets: [{
      label: 'Expense Amount',
      data: amounts,
      backgroundColor: categoryColors.slice(0, categories.length),
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverOffset: 10
    }]
  }
})

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: props.showLegend,
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 12
        },
        generateLabels: (chart: any) => {
          const data = chart.data
          return data.labels.map((label: string, index: number) => ({
            text: label,
            fillStyle: data.datasets[0].backgroundColor[index],
            strokeStyle: data.datasets[0].borderColor,
            lineWidth: data.datasets[0].borderWidth,
            pointStyle: 'circle',
            index: index
          }))
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
        label: (context: any) => {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          
          return [
            `${label}`,
            `¥${value.toLocaleString('ja-JP')}`,
            `${percentage}% of total`
          ]
        }
      }
    }
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 1000,
    easing: 'easeOutQuart'
  },
  elements: {
    arc: {
      borderAlign: 'center' as const
    }
  }
}))

// Total expense calculation
const totalExpenses = computed(() => {
  return Object.values(props.data).reduce((sum, value) => sum + value, 0)
})

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(amount)
}

// Loading state
const loading = ref(false)
</script>

<template>
  <Card class="financial-chart-card">
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        <span>{{ title }}</span>
        <Badge variant="secondary" class="text-xs">
          Total: {{ formatCurrency(totalExpenses) }}
        </Badge>
      </CardTitle>
      <CardDescription>
        Breakdown of expenses across different categories for the selected period
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      <div class="chart-container" :style="{ height: `${height}px` }">
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        
        <div v-else-if="totalExpenses === 0" class="flex items-center justify-center h-full text-muted-foreground">
          <div class="text-center">
            <PieChart class="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No expense data available</p>
          </div>
        </div>
        
        <Pie
          v-else
          :data="chartData"
          :options="chartOptions"
          class="chart-canvas"
        />
      </div>
      
      <!-- Category breakdown table -->
      <div v-if="totalExpenses > 0" class="mt-6">
        <h4 class="text-sm font-medium mb-3">Category Breakdown</h4>
        <div class="space-y-2">
          <div 
            v-for="(amount, category, index) in data" 
            :key="category"
            class="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: categoryColors[index] }"
              ></div>
              <span class="text-sm font-medium">{{ category }}</span>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold">{{ formatCurrency(amount) }}</div>
              <div class="text-xs text-muted-foreground">
                {{ ((amount / totalExpenses) * 100).toFixed(1) }}%
              </div>
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
    height: 250px !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .financial-chart-card {
    border-width: 2px;
  }
  
  .w-3.h-3 {
    border: 1px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
}

/* Dark mode adjustments */
.dark .financial-chart-card {
  background: hsl(var(--card));
  border-color: hsl(var(--border));
}
</style>