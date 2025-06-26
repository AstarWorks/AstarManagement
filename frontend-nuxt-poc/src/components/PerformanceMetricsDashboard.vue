<template>
  <div class="performance-dashboard" :class="{ 'minimized': isMinimized }">
    <!-- Dashboard Header -->
    <div class="dashboard-header" @click="toggleMinimize">
      <div class="header-title">
        <Icon name="activity" :size="16" />
        <span>Performance Monitor</span>
      </div>
      <div class="header-actions">
        <button 
          v-if="!isMinimized" 
          @click.stop="toggleAutoRefresh" 
          class="action-btn"
          :class="{ active: autoRefresh }"
          title="Auto-refresh"
        >
          <Icon name="refresh-cw" :size="14" />
        </button>
        <button @click.stop="toggleMinimize" class="action-btn">
          <Icon :name="isMinimized ? 'maximize-2' : 'minimize-2'" :size="14" />
        </button>
      </div>
    </div>
    
    <!-- Dashboard Content -->
    <div v-if="!isMinimized" class="dashboard-content">
      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="stat-item" :class="getPerformanceClass(metrics.performanceSummary.averageQueryTime)">
          <div class="stat-value">{{ metrics.performanceSummary.averageQueryTime.toFixed(0) }}ms</div>
          <div class="stat-label">Avg Response</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{{ metrics.performanceSummary.cacheHitRate.toFixed(0) }}%</div>
          <div class="stat-label">Cache Hit Rate</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-value">{{ metrics.activeQueries }}</div>
          <div class="stat-label">Active Queries</div>
        </div>
        
        <div class="stat-item" :class="{ 'has-errors': metrics.performanceSummary.failedQueries > 0 }">
          <div class="stat-value">{{ metrics.performanceSummary.failedQueries }}</div>
          <div class="stat-label">Errors</div>
        </div>
      </div>
      
      <!-- Performance Score -->
      <div class="performance-score">
        <div class="score-header">
          <span>Performance Score</span>
          <span class="score-value" :class="getScoreClass(performanceScore)">
            {{ performanceScore }}/100
          </span>
        </div>
        <div class="score-bar">
          <div 
            class="score-fill" 
            :style="{ width: `${performanceScore}%` }"
            :class="getScoreClass(performanceScore)"
          ></div>
        </div>
        <div class="score-details">
          <div class="score-item">
            <span>P95: {{ metrics.performanceSummary.p95QueryTime.toFixed(0) }}ms</span>
            <span :class="getPerformanceClass(metrics.performanceSummary.p95QueryTime)">
              {{ getPerformanceStatus(metrics.performanceSummary.p95QueryTime) }}
            </span>
          </div>
          <div class="score-item">
            <span>Memory: {{ formatMB(currentMemory?.usedJSHeapSize || 0) }}</span>
            <span :class="getMemoryClass(currentMemory?.usedJSHeapSize || 0)">
              {{ getMemoryStatus(currentMemory?.usedJSHeapSize || 0) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Real-time Metrics -->
      <div class="realtime-metrics">
        <h4>Real-time Activity</h4>
        <div class="metrics-grid">
          <div class="metric-card">
            <canvas ref="queryCanvas" width="120" height="60"></canvas>
            <div class="metric-label">Query Rate</div>
          </div>
          
          <div class="metric-card">
            <canvas ref="latencyCanvas" width="120" height="60"></canvas>
            <div class="metric-label">Latency Trend</div>
          </div>
        </div>
      </div>
      
      <!-- Recent Alerts -->
      <div v-if="recentAlerts.length > 0" class="recent-alerts">
        <h4>Performance Alerts</h4>
        <div class="alert-list">
          <div 
            v-for="alert in recentAlerts" 
            :key="alert.id"
            class="alert-item"
            :class="`alert-${alert.type}`"
          >
            <Icon :name="alert.type === 'critical' ? 'alert-circle' : 'alert-triangle'" :size="14" />
            <span class="alert-text">{{ alert.message }}</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="dashboard-actions">
        <button @click="showDetailedMetrics" class="action-button primary">
          <Icon name="bar-chart-2" :size="14" />
          Detailed Metrics
        </button>
        <button @click="exportMetrics" class="action-button">
          <Icon name="download" :size="14" />
          Export
        </button>
      </div>
    </div>
    
    <!-- Minimized View -->
    <div v-else class="minimized-content">
      <div class="mini-stat" :class="getPerformanceClass(metrics.performanceSummary.averageQueryTime)">
        <Icon name="activity" :size="14" />
        <span>{{ metrics.performanceSummary.averageQueryTime.toFixed(0) }}ms</span>
      </div>
      <div class="mini-stat">
        <Icon name="database" :size="14" />
        <span>{{ metrics.performanceSummary.cacheHitRate.toFixed(0) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  LucideActivity as Activity,
  LucideRefreshCw as RefreshCw,
  LucideMaximize2 as Maximize2,
  LucideMinimize2 as Minimize2,
  LucideAlertCircle as AlertCircle,
  LucideAlertTriangle as AlertTriangle,
  LucideBarChart2 as BarChart2,
  LucideDownload as Download,
  LucideDatabase as Database
} from 'lucide-vue-next'
import { getGlobalQueryPerformanceMonitor } from '~/composables/useQueryPerformanceMonitor'
import { useLocalStorage } from '@vueuse/core'

// Icon component mapping
const Icon = defineComponent({
  props: {
    name: String,
    size: { type: Number, default: 16 }
  },
  setup(props) {
    const icons = {
      'activity': Activity,
      'refresh-cw': RefreshCw,
      'maximize-2': Maximize2,
      'minimize-2': Minimize2,
      'alert-circle': AlertCircle,
      'alert-triangle': AlertTriangle,
      'bar-chart-2': BarChart2,
      'download': Download,
      'database': Database
    }
    
    return () => h(icons[props.name] || Activity, { size: props.size })
  }
})

const emit = defineEmits<{
  showDetails: []
}>()

// State
const monitor = getGlobalQueryPerformanceMonitor()
const metrics = monitor.getMetrics()

const isMinimized = useLocalStorage('performance-dashboard-minimized', false)
const autoRefresh = ref(true)

const queryCanvas = ref<HTMLCanvasElement>()
const latencyCanvas = ref<HTMLCanvasElement>()

// Data for charts
const queryRateHistory = ref<number[]>([])
const latencyHistory = ref<number[]>([])

// Computed
const recentAlerts = computed(() => 
  metrics.performanceAlerts.value
    .filter(a => Date.now() - a.timestamp < 300000) // Last 5 minutes
    .slice(-3)
    .reverse()
)

const currentMemory = computed(() => {
  const history = metrics.memoryHistory.value
  return history[history.length - 1]
})

const performanceScore = computed(() => {
  let score = 100
  
  // Response time scoring (40% weight)
  const avgTime = metrics.performanceSummary.value.averageQueryTime
  if (avgTime > 500) score -= 40
  else if (avgTime > 200) score -= 20
  else if (avgTime > 100) score -= 10
  
  // Cache hit rate scoring (30% weight)
  const cacheRate = metrics.performanceSummary.value.cacheHitRate
  score -= (100 - cacheRate) * 0.3
  
  // Error rate scoring (20% weight)
  const errorRate = metrics.performanceSummary.value.totalQueries > 0
    ? (metrics.performanceSummary.value.failedQueries / metrics.performanceSummary.value.totalQueries) * 100
    : 0
  score -= errorRate * 2
  
  // Memory usage scoring (10% weight)
  const memoryMB = (currentMemory.value?.usedJSHeapSize || 0) / 1024 / 1024
  if (memoryMB > 100) score -= 10
  else if (memoryMB > 50) score -= 5
  
  return Math.max(0, Math.min(100, Math.round(score)))
})

// Helper functions
const getPerformanceClass = (time: number) => {
  if (time < 100) return 'good'
  if (time < 200) return 'warning'
  return 'critical'
}

const getPerformanceStatus = (time: number) => {
  if (time < 100) return 'Excellent'
  if (time < 200) return 'Good'
  if (time < 500) return 'Fair'
  return 'Poor'
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

const getMemoryClass = (bytes: number) => {
  const mb = bytes / 1024 / 1024
  if (mb < 50) return 'good'
  if (mb < 100) return 'warning'
  return 'critical'
}

const getMemoryStatus = (bytes: number) => {
  const mb = bytes / 1024 / 1024
  if (mb < 50) return 'Normal'
  if (mb < 100) return 'High'
  return 'Critical'
}

const formatMB = (bytes: number) => {
  return `${(bytes / 1024 / 1024).toFixed(0)}MB`
}

// Actions
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
}

const showDetailedMetrics = () => {
  emit('showDetails')
}

const exportMetrics = () => {
  const data = metrics.exportMetrics()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-metrics-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Chart drawing functions
const drawQueryRateChart = () => {
  if (!queryCanvas.value) return
  
  const ctx = queryCanvas.value.getContext('2d')
  if (!ctx) return
  
  const width = queryCanvas.value.width
  const height = queryCanvas.value.height
  const data = queryRateHistory.value
  
  ctx.clearRect(0, 0, width, height)
  
  if (data.length < 2) return
  
  const maxValue = Math.max(...data, 1)
  
  // Draw line
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - (value / maxValue) * height * 0.8 - height * 0.1
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
}

const drawLatencyChart = () => {
  if (!latencyCanvas.value) return
  
  const ctx = latencyCanvas.value.getContext('2d')
  if (!ctx) return
  
  const width = latencyCanvas.value.width
  const height = latencyCanvas.value.height
  const data = latencyHistory.value
  
  ctx.clearRect(0, 0, width, height)
  
  if (data.length < 2) return
  
  const maxValue = Math.max(...data, 200)
  
  // Draw threshold line
  const thresholdY = height - (200 / maxValue) * height * 0.8 - height * 0.1
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(0, thresholdY)
  ctx.lineTo(width, thresholdY)
  ctx.stroke()
  ctx.setLineDash([])
  
  // Draw line
  ctx.strokeStyle = data[data.length - 1] > 200 ? '#ef4444' : '#10b981'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - (value / maxValue) * height * 0.8 - height * 0.1
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
}

// Update chart data
const updateChartData = () => {
  // Update query rate
  const recentQueries = metrics.getRecentQueries(20)
  const now = performance.now()
  const oneSecondAgo = now - 1000
  const queryRate = recentQueries.filter(q => q.startTime > oneSecondAgo).length
  
  queryRateHistory.value.push(queryRate)
  if (queryRateHistory.value.length > 30) {
    queryRateHistory.value.shift()
  }
  
  // Update latency
  const latency = metrics.performanceSummary.value.averageQueryTime
  latencyHistory.value.push(latency)
  if (latencyHistory.value.length > 30) {
    latencyHistory.value.shift()
  }
  
  // Redraw charts
  drawQueryRateChart()
  drawLatencyChart()
}

// Lifecycle
let updateInterval: NodeJS.Timeout | null = null

onMounted(() => {
  monitor.initializeMonitoring()
  
  // Initial chart draw
  updateChartData()
  
  // Set up auto-refresh
  updateInterval = setInterval(() => {
    if (autoRefresh.value && !isMinimized.value) {
      updateChartData()
    }
  }, 1000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})

// Watch for minimize state changes
watch(isMinimized, (minimized) => {
  if (!minimized) {
    // Redraw charts when expanding
    setTimeout(() => {
      updateChartData()
    }, 100)
  }
})
</script>

<style scoped>
.performance-dashboard {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: all 0.3s ease;
}

.performance-dashboard.minimized {
  width: auto;
}

/* Dashboard Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid hsl(var(--border));
  cursor: pointer;
  user-select: none;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: hsl(var(--foreground));
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.action-btn.active {
  color: hsl(var(--primary));
}

/* Dashboard Content */
.dashboard-content {
  padding: 16px;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: hsl(var(--muted));
  border-radius: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.stat-label {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  margin-top: 2px;
}

.stat-item.good .stat-value {
  color: hsl(var(--success));
}

.stat-item.warning .stat-value {
  color: hsl(var(--warning));
}

.stat-item.critical .stat-value {
  color: hsl(var(--destructive));
}

.stat-item.has-errors .stat-value {
  color: hsl(var(--destructive));
}

/* Performance Score */
.performance-score {
  background: hsl(var(--muted));
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.score-value {
  font-weight: 600;
}

.score-value.excellent {
  color: #10b981;
}

.score-value.good {
  color: #3b82f6;
}

.score-value.fair {
  color: #f59e0b;
}

.score-value.poor {
  color: #ef4444;
}

.score-bar {
  height: 6px;
  background: hsl(var(--border));
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.score-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.score-fill.excellent {
  background: #10b981;
}

.score-fill.good {
  background: #3b82f6;
}

.score-fill.fair {
  background: #f59e0b;
}

.score-fill.poor {
  background: #ef4444;
}

.score-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  color: hsl(var(--muted-foreground));
}

.score-item .good {
  color: #10b981;
}

.score-item .warning {
  color: #f59e0b;
}

.score-item .critical {
  color: #ef4444;
}

/* Real-time Metrics */
.realtime-metrics {
  margin-bottom: 16px;
}

.realtime-metrics h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: hsl(var(--foreground));
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.metric-card {
  background: hsl(var(--muted));
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.metric-card canvas {
  display: block;
  margin: 0 auto 4px;
}

.metric-label {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

/* Recent Alerts */
.recent-alerts {
  margin-bottom: 16px;
}

.recent-alerts h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: hsl(var(--foreground));
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 11px;
}

.alert-warning {
  background: hsl(var(--warning) / 0.1);
  color: hsl(var(--warning));
}

.alert-critical {
  background: hsl(var(--destructive) / 0.1);
  color: hsl(var(--destructive));
}

.alert-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dashboard Actions */
.dashboard-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: hsl(var(--foreground));
}

.action-button:hover {
  background: hsl(var(--muted) / 0.8);
}

.action-button.primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.action-button.primary:hover {
  background: hsl(var(--primary) / 0.9);
}

/* Minimized Content */
.minimized-content {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.mini-stat.good {
  color: hsl(var(--success));
}

.mini-stat.warning {
  color: hsl(var(--warning));
}

.mini-stat.critical {
  color: hsl(var(--destructive));
}
</style>