<!--
  Performance Indicator Component
  
  @description Real-time performance monitoring for drag-drop operations
  with visual feedback and optimization suggestions.
  
  @author Claude
  @created 2025-06-26
  @task T12_S08 - Drag & Drop Mutations
-->

<template>
  <div class="performance-indicator" :class="performanceClasses">
    <!-- Performance status icon -->
    <div class="performance-status">
      <Icon 
        :name="statusIcon" 
        :class="statusIconClasses"
        class="w-4 h-4"
      />
    </div>

    <!-- Performance metrics -->
    <div class="performance-metrics">
      <div class="metric-item">
        <span class="metric-label">Ops:</span>
        <span class="metric-value">{{ metrics.operationCount }}</span>
      </div>
      
      <div v-if="showDetailedMetrics" class="metric-item">
        <span class="metric-label">Avg:</span>
        <span class="metric-value">{{ formattedLatency }}ms</span>
      </div>
      
      <div v-if="isMoving" class="metric-item">
        <span class="metric-label">Status:</span>
        <span class="metric-value moving">Moving</span>
      </div>
    </div>

    <!-- Performance details (expanded) -->
    <div v-if="showExpanded" class="performance-details">
      <div class="details-header">
        <h4>Performance Metrics</h4>
        <Button
          variant="ghost"
          size="sm"
          @click="toggleExpanded"
        >
          <Icon name="x" class="w-4 h-4" />
        </Button>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-title">Drag Operations</div>
          <div class="metric-large">{{ metrics.operationCount }}</div>
          <div class="metric-subtitle">Total completed</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-title">Average Latency</div>
          <div class="metric-large" :class="latencyClass">
            {{ formattedLatency }}ms
          </div>
          <div class="metric-subtitle">Response time</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-title">Optimistic Updates</div>
          <div class="metric-large">
            {{ formatDuration(metrics.optimisticUpdateTime) }}ms
          </div>
          <div class="metric-subtitle">UI responsiveness</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-title">Server Response</div>
          <div class="metric-large">
            {{ formatDuration(metrics.serverResponseTime) }}ms
          </div>
          <div class="metric-subtitle">Backend latency</div>
        </div>
      </div>
      
      <!-- Performance chart -->
      <div v-if="showChart" class="performance-chart">
        <PerformanceChart :data="chartData" />
      </div>
      
      <!-- Optimization suggestions -->
      <div v-if="suggestions.length > 0" class="optimization-suggestions">
        <h5>Optimization Suggestions</h5>
        <ul class="suggestions-list">
          <li
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="suggestion-item"
            :class="`suggestion-${suggestion.severity}`"
          >
            <Icon :name="suggestion.icon" class="w-4 h-4" />
            <span>{{ suggestion.message }}</span>
            <Button
              v-if="suggestion.action"
              variant="outline"
              size="sm"
              @click="suggestion.action"
            >
              {{ suggestion.actionLabel }}
            </Button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Toggle button -->
    <Button
      v-if="!showExpanded"
      variant="ghost"
      size="sm"
      @click="toggleExpanded"
      class="toggle-button"
    >
      <Icon name="activity" class="w-4 h-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  metrics: {
    dragStartTime: number
    optimisticUpdateTime: number
    serverResponseTime: number
    totalOperationTime: number
    operationCount: number
  }
  isMoving?: boolean
  showDetailedMetrics?: boolean
  showChart?: boolean
  autoOptimize?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isMoving: false,
  showDetailedMetrics: true,
  showChart: false,
  autoOptimize: true
})

// Emits
const emit = defineEmits<{
  'optimize': [type: string]
  'reset-metrics': []
}>()

// Local state
const showExpanded = ref(false)
const chartData = ref<Array<{ timestamp: number; latency: number }>>([])
const lastMetricsUpdate = ref(Date.now())

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 50,
  GOOD: 100,
  AVERAGE: 200,
  POOR: 500
} as const

// Computed properties
const performanceClasses = computed(() => [
  'performance-indicator',
  performanceStatus.value,
  {
    'is-moving': props.isMoving,
    'expanded': showExpanded.value
  }
])

const performanceStatus = computed(() => {
  const avgLatency = averageLatency.value
  
  if (avgLatency <= PERFORMANCE_THRESHOLDS.EXCELLENT) return 'excellent'
  if (avgLatency <= PERFORMANCE_THRESHOLDS.GOOD) return 'good'
  if (avgLatency <= PERFORMANCE_THRESHOLDS.AVERAGE) return 'average'
  return 'poor'
})

const statusIcon = computed(() => {
  if (props.isMoving) return 'loader'
  
  switch (performanceStatus.value) {
    case 'excellent': return 'zap'
    case 'good': return 'check-circle'
    case 'average': return 'alert-circle'
    case 'poor': return 'alert-triangle'
    default: return 'activity'
  }
})

const statusIconClasses = computed(() => [
  'status-icon',
  {
    'animate-spin': props.isMoving,
    'text-green-500': performanceStatus.value === 'excellent',
    'text-blue-500': performanceStatus.value === 'good',
    'text-yellow-500': performanceStatus.value === 'average',
    'text-red-500': performanceStatus.value === 'poor'
  }
])

const averageLatency = computed(() => {
  if (props.metrics.operationCount === 0) return 0
  
  const totalTime = props.metrics.optimisticUpdateTime + props.metrics.serverResponseTime
  return Math.round(totalTime / Math.max(props.metrics.operationCount, 1))
})

const formattedLatency = computed(() => {
  return averageLatency.value.toFixed(0)
})

const latencyClass = computed(() => ({
  'text-green-600': performanceStatus.value === 'excellent',
  'text-blue-600': performanceStatus.value === 'good',
  'text-yellow-600': performanceStatus.value === 'average',
  'text-red-600': performanceStatus.value === 'poor'
}))

// Optimization suggestions
const suggestions = computed(() => {
  const suggestions: Array<{
    id: string
    message: string
    severity: 'info' | 'warning' | 'error'
    icon: string
    action?: () => void
    actionLabel?: string
  }> = []

  const avgLatency = averageLatency.value
  const operationCount = props.metrics.operationCount

  // High latency suggestions
  if (avgLatency > PERFORMANCE_THRESHOLDS.POOR) {
    suggestions.push({
      id: 'high-latency',
      message: 'High latency detected. Consider optimizing server performance or reducing payload size.',
      severity: 'error',
      icon: 'alert-triangle',
      action: () => emit('optimize', 'latency'),
      actionLabel: 'Optimize'
    })
  }

  // Frequent operations suggestion
  if (operationCount > 50) {
    suggestions.push({
      id: 'frequent-ops',
      message: 'Many operations detected. Consider batch operations or debouncing.',
      severity: 'warning',
      icon: 'trending-up',
      action: () => emit('optimize', 'batching'),
      actionLabel: 'Enable Batching'
    })
  }

  // Optimization success
  if (avgLatency <= PERFORMANCE_THRESHOLDS.EXCELLENT && operationCount > 10) {
    suggestions.push({
      id: 'excellent',
      message: 'Excellent performance! Drag operations are highly optimized.',
      severity: 'info',
      icon: 'check-circle'
    })
  }

  return suggestions
})

// Methods
const toggleExpanded = () => {
  showExpanded.value = !showExpanded.value
}

const formatDuration = (ms: number): string => {
  return ms.toFixed(0)
}

const updateChart = () => {
  if (!props.showChart) return
  
  const now = Date.now()
  chartData.value.push({
    timestamp: now,
    latency: averageLatency.value
  })
  
  // Keep only last 50 data points
  if (chartData.value.length > 50) {
    chartData.value = chartData.value.slice(-50)
  }
}

const handleAutoOptimize = () => {
  if (!props.autoOptimize) return
  
  const avgLatency = averageLatency.value
  
  // Auto-suggest optimization for poor performance
  if (avgLatency > PERFORMANCE_THRESHOLDS.POOR) {
    emit('optimize', 'auto-latency')
  }
  
  // Auto-suggest batching for frequent operations
  if (props.metrics.operationCount > 100) {
    emit('optimize', 'auto-batching')
  }
}

// Watch for metrics changes
watch(() => props.metrics, (newMetrics, oldMetrics) => {
  if (newMetrics.operationCount > (oldMetrics?.operationCount || 0)) {
    updateChart()
    lastMetricsUpdate.value = Date.now()
    
    // Auto-optimization check
    if (props.autoOptimize) {
      setTimeout(handleAutoOptimize, 100)
    }
  }
}, { deep: true })

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'p' && event.ctrlKey) {
    event.preventDefault()
    toggleExpanded()
  }
  
  if (event.key === 'r' && event.ctrlKey && event.shiftKey) {
    event.preventDefault()
    emit('reset-metrics')
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.performance-indicator {
  @apply flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm;
  transition: all 0.2s ease;
}

.performance-indicator.excellent {
  @apply border-green-200 bg-green-50;
}

.performance-indicator.good {
  @apply border-blue-200 bg-blue-50;
}

.performance-indicator.average {
  @apply border-yellow-200 bg-yellow-50;
}

.performance-indicator.poor {
  @apply border-red-200 bg-red-50;
}

.performance-indicator.is-moving {
  @apply animate-pulse;
}

.performance-indicator.expanded {
  @apply flex-col items-start w-96 max-w-full;
}

.performance-status {
  @apply flex items-center;
}

.performance-metrics {
  @apply flex items-center gap-3;
}

.metric-item {
  @apply flex items-center gap-1;
}

.metric-label {
  @apply text-muted-foreground;
}

.metric-value {
  @apply font-medium;
}

.metric-value.moving {
  @apply text-blue-600 animate-pulse;
}

.performance-details {
  @apply w-full mt-4 space-y-4;
}

.details-header {
  @apply flex items-center justify-between;
}

.details-header h4 {
  @apply font-semibold;
}

.metrics-grid {
  @apply grid grid-cols-2 gap-3;
}

.metric-card {
  @apply bg-background border rounded-lg p-3 text-center;
}

.metric-title {
  @apply text-xs text-muted-foreground uppercase tracking-wide;
}

.metric-large {
  @apply text-2xl font-bold my-1;
}

.metric-subtitle {
  @apply text-xs text-muted-foreground;
}

.performance-chart {
  @apply bg-background border rounded-lg p-4;
}

.optimization-suggestions {
  @apply space-y-2;
}

.optimization-suggestions h5 {
  @apply font-medium text-sm;
}

.suggestions-list {
  @apply space-y-2;
}

.suggestion-item {
  @apply flex items-center gap-2 p-2 rounded-lg text-sm;
}

.suggestion-item.suggestion-info {
  @apply bg-blue-50 text-blue-800 border border-blue-200;
}

.suggestion-item.suggestion-warning {
  @apply bg-yellow-50 text-yellow-800 border border-yellow-200;
}

.suggestion-item.suggestion-error {
  @apply bg-red-50 text-red-800 border border-red-200;
}

.toggle-button {
  @apply ml-auto;
}

/* Responsive design */
@media (max-width: 768px) {
  .performance-indicator.expanded {
    @apply w-full;
  }
  
  .metrics-grid {
    @apply grid-cols-1;
  }
  
  .performance-metrics {
    @apply flex-wrap;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .performance-indicator.is-moving {
    @apply animate-none;
  }
  
  .status-icon.animate-spin {
    @apply animate-none;
  }
  
  .metric-value.moving {
    @apply animate-none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .performance-indicator {
    @apply border-2;
  }
  
  .suggestion-item {
    @apply border-2;
  }
}
</style>