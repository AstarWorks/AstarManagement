<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement)

/**
 * Financial Billable Hours Chart Component
 * 
 * Displays billable vs non-billable hours breakdown using a doughnut chart.
 * Shows utilization rates and revenue potential.
 */

interface Props {
  /** Billable hours */
  billable: number
  /** Non-billable hours */
  nonBillable: number
  /** Chart title */
  title?: string
  /** Chart height */
  height?: number
  /** Average hourly rate for calculations */
  hourlyRate?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Billable vs Non-Billable Hours',
  height: 300,
  hourlyRate: 18500 // Default rate in JPY
})

// Calculations
const totalHours = computed(() => props.billable + props.nonBillable)
const billablePercentage = computed(() => (props.billable / totalHours.value) * 100)
const billableRevenue = computed(() => props.billable * props.hourlyRate)

// Chart data
const chartData = computed(() => ({
  labels: ['Billable Hours', 'Non-Billable Hours'],
  datasets: [{
    data: [props.billable, props.nonBillable],
    backgroundColor: [
      'hsl(142, 76%, 36%)',  // Green for billable
      'hsl(346, 77%, 49%)'   // Red for non-billable
    ],
    borderColor: '#ffffff',
    borderWidth: 3,
    hoverBorderWidth: 4,
    hoverOffset: 8,
    cutout: '60%'
  }]
}))

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
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
        label: (context: any) => {
          const label = context.label || ''
          const value = context.parsed || 0
          const percentage = ((value / totalHours.value) * 100).toFixed(1)
          const revenue = label.includes('Billable') ? value * props.hourlyRate : 0
          
          const lines = [
            `${label}: ${value} hours`,
            `${percentage}% of total`
          ]
          
          if (revenue > 0) {
            lines.push(`Revenue: ¥${revenue.toLocaleString('ja-JP')}`)
          }
          
          return lines
        }
      }
    }
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 1000,
    easing: 'easeOutQuart'
  }
}))

// Utilization metrics
const utilizationMetrics = computed(() => {
  const utilizationRate = billablePercentage.value
  const targetUtilization = 75 // Target 75% billable hours
  const efficiency = Math.min((utilizationRate / targetUtilization) * 100, 100)
  
  let status = 'good'
  let statusColor = 'text-green-600'
  let statusText = 'Excellent'
  
  if (utilizationRate < 50) {
    status = 'poor'
    statusColor = 'text-red-600'
    statusText = 'Needs Improvement'
  } else if (utilizationRate < 65) {
    status = 'fair'
    statusColor = 'text-yellow-600'
    statusText = 'Below Target'
  } else if (utilizationRate < 75) {
    status = 'good'
    statusColor = 'text-blue-600'
    statusText = 'Good'
  }
  
  return {
    utilizationRate,
    targetUtilization,
    efficiency,
    status,
    statusColor,
    statusText
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

// Format hours
const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)}h`
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
          :variant="utilizationMetrics.status === 'poor' ? 'destructive' : utilizationMetrics.status === 'fair' ? 'secondary' : 'default'"
          class="text-xs"
        >
          {{ formatPercentage(billablePercentage) }} Billable
        </Badge>
      </CardTitle>
      <CardDescription>
        Time allocation and revenue analysis for the current period
      </CardDescription>
    </CardHeader>
    
    <CardContent>
      <div class="chart-container" :style="{ height: `${height}px` }">
        <div v-if="totalHours === 0" class="flex items-center justify-center h-full text-muted-foreground">
          <div class="text-center">
            <Clock class="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No hours data available</p>
          </div>
        </div>
        
        <div v-else class="relative">
          <Doughnut
            :data="chartData"
            :options="chartOptions"
            class="chart-canvas"
          />
          
          <!-- Center content -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-2xl font-bold">{{ formatHours(totalHours) }}</div>
              <div class="text-xs text-muted-foreground">Total Hours</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Hours Breakdown -->
      <div class="mt-6 grid grid-cols-2 gap-4">
        <div class="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
          <div class="text-2xl font-bold text-green-600">{{ formatHours(billable) }}</div>
          <div class="text-sm text-green-600 mb-2">Billable Hours</div>
          <div class="text-xs text-muted-foreground">
            Revenue: {{ formatCurrency(billableRevenue) }}
          </div>
        </div>
        
        <div class="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
          <div class="text-2xl font-bold text-red-600">{{ formatHours(nonBillable) }}</div>
          <div class="text-sm text-red-600 mb-2">Non-Billable Hours</div>
          <div class="text-xs text-muted-foreground">
            {{ formatPercentage((nonBillable / totalHours) * 100) }} of total
          </div>
        </div>
      </div>
      
      <!-- Utilization Analysis -->
      <div class="mt-6 p-4 rounded-lg bg-muted/50">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium">Utilization Analysis</h4>
          <Badge 
            :variant="utilizationMetrics.status === 'poor' ? 'destructive' : utilizationMetrics.status === 'fair' ? 'secondary' : 'default'"
            class="text-xs"
          >
            {{ utilizationMetrics.statusText }}
          </Badge>
        </div>
        
        <div class="space-y-3">
          <!-- Utilization Rate -->
          <div class="flex items-center justify-between">
            <span class="text-sm">Utilization Rate:</span>
            <span class="font-medium" :class="utilizationMetrics.statusColor">
              {{ formatPercentage(utilizationMetrics.utilizationRate) }}
            </span>
          </div>
          
          <!-- Target vs Actual -->
          <div class="flex items-center justify-between">
            <span class="text-sm">Target Rate:</span>
            <span class="text-muted-foreground">{{ formatPercentage(utilizationMetrics.targetUtilization) }}</span>
          </div>
          
          <!-- Efficiency Score -->
          <div class="flex items-center justify-between">
            <span class="text-sm">Efficiency Score:</span>
            <span class="font-medium" :class="utilizationMetrics.statusColor">
              {{ formatPercentage(utilizationMetrics.efficiency) }}
            </span>
          </div>
          
          <!-- Progress bar -->
          <div class="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              class="h-2 rounded-full transition-all duration-300"
              :class="utilizationMetrics.status === 'poor' ? 'bg-red-500' : utilizationMetrics.status === 'fair' ? 'bg-yellow-500' : 'bg-green-500'"
              :style="{ width: `${Math.min(utilizationMetrics.utilizationRate, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Recommendations -->
      <div v-if="utilizationMetrics.utilizationRate < utilizationMetrics.targetUtilization" class="mt-4">
        <Alert>
          <TrendingUp class="h-4 w-4" />
          <AlertTitle>Optimization Opportunity</AlertTitle>
          <AlertDescription>
            Your billable hours are {{ formatPercentage(utilizationMetrics.targetUtilization - utilizationMetrics.utilizationRate) }} 
            below target. Consider optimizing non-billable activities to increase revenue potential.
          </AlertDescription>
        </Alert>
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
  
  .grid-cols-2 {
    grid-template-columns: repeat(1, 1fr);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .financial-chart-card {
    border-width: 2px;
  }
  
  .bg-green-50,
  .bg-red-50 {
    border: 1px solid currentColor;
  }
}
</style>