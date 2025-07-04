<template>
  <div class="query-performance-panel">
    <!-- Performance Summary -->
    <div class="performance-summary">
      <h3 class="panel-title">Performance Overview</h3>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Active Queries</div>
          <div class="metric-value">{{ metrics.activeQueries }}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Active Mutations</div>
          <div class="metric-value">{{ metrics.activeMutations }}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Cache Hit Rate</div>
          <div class="metric-value">{{ metrics.performanceSummary.value.cacheHitRate.toFixed(1) }}%</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Avg Query Time</div>
          <div class="metric-value" :class="getTimeClass(metrics.performanceSummary.value.averageQueryTime)">
            {{ metrics.performanceSummary.value.averageQueryTime.toFixed(0) }}ms
          </div>
        </div>
      </div>
    </div>
    
    <!-- Query Timing Distribution -->
    <div class="timing-section">
      <h4 class="section-title">Query Timing Distribution</h4>
      
      <div class="timing-stats">
        <div class="timing-stat">
          <span class="timing-label">P50:</span>
          <span class="timing-value">{{ metrics.performanceSummary.value.p50QueryTime.toFixed(0) }}ms</span>
        </div>
        <div class="timing-stat">
          <span class="timing-label">P95:</span>
          <span class="timing-value" :class="getTimeClass(metrics.performanceSummary.value.p95QueryTime)">
            {{ metrics.performanceSummary.value.p95QueryTime.toFixed(0) }}ms
          </span>
        </div>
        <div class="timing-stat">
          <span class="timing-label">P99:</span>
          <span class="timing-value" :class="getTimeClass(metrics.performanceSummary.value.p99QueryTime)">
            {{ metrics.performanceSummary.value.p99QueryTime.toFixed(0) }}ms
          </span>
        </div>
      </div>
      
      <!-- Mini histogram -->
      <div class="timing-histogram">
        <div 
          v-for="(bucket, index) in timingBuckets" 
          :key="index"
          class="histogram-bar"
          :style="{ height: `${bucket.percentage}%` }"
          :title="`${bucket.label}: ${bucket.count} queries`"
        >
          <span class="histogram-label">{{ bucket.label }}</span>
        </div>
      </div>
    </div>
    
    <!-- Performance Alerts -->
    <div v-if="recentAlerts.length > 0" class="alerts-section">
      <h4 class="section-title">Performance Alerts</h4>
      
      <div class="alerts-list">
        <div 
          v-for="alert in recentAlerts" 
          :key="alert.id"
          class="alert-item"
          :class="`alert-${alert.type}`"
        >
          <Icon :name="getAlertIcon(alert.type)" class="alert-icon" />
          <div class="alert-content">
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-time">{{ formatRelativeTime(alert.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Recent Queries -->
    <div class="recent-queries-section">
      <h4 class="section-title">Recent Queries</h4>
      
      <div class="queries-list">
        <div 
          v-for="query in recentQueries" 
          :key="query.queryHash"
          class="query-item"
        >
          <div class="query-info">
            <span class="query-key">{{ formatQueryKey(query.queryKey) }}</span>
            <span class="query-status" :class="`status-${query.status}`">
              {{ query.status }}
            </span>
          </div>
          
          <div class="query-metrics">
            <span v-if="query.duration" class="query-duration" :class="getTimeClass(query.duration)">
              {{ query.duration.toFixed(0) }}ms
            </span>
            <span v-if="query.cacheHit" class="cache-hit">
              <Icon name="zap" :size="12" /> Cached
            </span>
            <span v-if="query.size" class="query-size">
              {{ formatBytes(query.size) }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Memory Usage Chart -->
    <div v-if="memoryHistory.length > 0" class="memory-section">
      <h4 class="section-title">Memory Usage</h4>
      
      <div class="memory-chart">
        <canvas ref="memoryCanvas" width="300" height="100"></canvas>
      </div>
      
      <div class="memory-stats">
        <span class="memory-current">
          Current: {{ formatMB(currentMemory?.usedJSHeapSize || 0) }}
        </span>
        <span class="memory-percent">
          {{ (currentMemory?.percentUsed || 0).toFixed(1) }}% of limit
        </span>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="panel-actions">
      <button @click="clearMetrics" class="action-button">
        Clear Metrics
      </button>
      <button @click="exportMetrics" class="action-button">
        Export Data
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getGlobalQueryPerformanceMonitor } from '~/composables/useQueryPerformanceMonitor'
import { LucideZap as Icon } from 'lucide-vue-next'

const monitor = getGlobalQueryPerformanceMonitor()
const metrics = monitor.getMetrics()

const memoryCanvas = ref<HTMLCanvasElement>()

// Computed values
const recentAlerts = computed(() => 
  metrics.performanceAlerts.value.slice(-5).reverse()
)

const recentQueries = computed(() => 
  metrics.getRecentQueries(10)
)

const memoryHistory = computed(() => 
  metrics.memoryHistory.value.slice(-50)
)

const currentMemory = computed(() => 
  memoryHistory.value[memoryHistory.value.length - 1]
)

// Calculate timing buckets for histogram
const timingBuckets = computed(() => {
  const queries = metrics.getRecentQueries(100)
  const buckets = [
    { label: '<50ms', min: 0, max: 50, count: 0 },
    { label: '50-200ms', min: 50, max: 200, count: 0 },
    { label: '200-500ms', min: 200, max: 500, count: 0 },
    { label: '>500ms', min: 500, max: Infinity, count: 0 }
  ]
  
  queries.forEach(query => {
    if (query.duration) {
      const bucket = buckets.find(b => query.duration! >= b.min && query.duration! < b.max)
      if (bucket) bucket.count++
    }
  })
  
  const maxCount = Math.max(...buckets.map(b => b.count), 1)
  
  return buckets.map(bucket => ({
    ...bucket,
    percentage: (bucket.count / maxCount) * 100
  }))
})

// Helper functions
const getTimeClass = (time: number) => {
  if (time < 50) return 'time-good'
  if (time < 200) return 'time-warning'
  return 'time-critical'
}

const getAlertIcon = (type: string) => {
  return type === 'critical' ? 'alert-triangle' : 'alert-circle'
}

const formatQueryKey = (key: unknown[]) => {
  if (!key || key.length === 0) return 'Unknown'
  return key.map(k => typeof k === 'object' ? JSON.stringify(k) : k).join(' / ')
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

const formatMB = (bytes: number) => {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

const formatRelativeTime = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

// Draw memory chart
const drawMemoryChart = () => {
  if (!memoryCanvas.value) return
  
  const ctx = memoryCanvas.value.getContext('2d')
  if (!ctx) return
  
  const width = memoryCanvas.value.width
  const height = memoryCanvas.value.height
  const data = memoryHistory.value
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  if (data.length < 2) return
  
  // Find min/max values
  const values = data.map(d => d.usedJSHeapSize)
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1
  
  // Draw grid lines
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 0.5
  
  for (let i = 0; i <= 4; i++) {
    const y = (i / 4) * height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  // Draw memory usage line
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  data.forEach((point, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((point.usedJSHeapSize - minValue) / range) * height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
  
  // Draw warning threshold
  const warningBytes = 50 * 1024 * 1024 // 50MB
  if (warningBytes >= minValue && warningBytes <= maxValue) {
    const warningY = height - ((warningBytes - minValue) / range) * height
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, warningY)
    ctx.lineTo(width, warningY)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

// Actions
const clearMetrics = () => {
  metrics.clearMetrics()
}

const exportMetrics = () => {
  const data = metrics.exportMetrics()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `query-performance-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Update chart when memory data changes
watch(memoryHistory, () => {
  drawMemoryChart()
})

onMounted(() => {
  drawMemoryChart()
})
</script>

<style scoped>
.query-performance-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--tsqd-text, #1f2937);
  background: var(--tsqd-background, #ffffff);
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 24px 0 12px 0;
  color: var(--tsqd-text, #6b7280);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.metric-card {
  background: var(--tsqd-background, #f9fafb);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: var(--tsqd-text, #6b7280);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--tsqd-text, #1f2937);
}

/* Timing Stats */
.timing-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.timing-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.timing-label {
  font-size: 12px;
  color: var(--tsqd-text, #6b7280);
}

.timing-value {
  font-size: 16px;
  font-weight: 600;
}

/* Timing Histogram */
.timing-histogram {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 80px;
  margin-bottom: 24px;
}

.histogram-bar {
  flex: 1;
  background: var(--tsqd-accent, #3b82f6);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 4px;
  transition: height 0.3s ease;
}

.histogram-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--tsqd-text, #6b7280);
  white-space: nowrap;
}

/* Alerts */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.alert-warning {
  background: #fef3c7;
  color: #92400e;
}

.alert-critical {
  background: #fee2e2;
  color: #991b1b;
}

.alert-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-message {
  margin-bottom: 2px;
}

.alert-time {
  font-size: 11px;
  opacity: 0.7;
}

/* Recent Queries */
.queries-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.query-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--tsqd-background, #f9fafb);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
}

.query-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.query-key {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 11px;
}

.query-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
}

.status-pending {
  background: #e0e7ff;
  color: #3730a3;
}

.query-metrics {
  display: flex;
  align-items: center;
  gap: 12px;
}

.query-duration {
  font-weight: 600;
}

.cache-hit {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #059669;
  font-size: 11px;
}

.query-size {
  color: var(--tsqd-text, #6b7280);
  font-size: 11px;
}

/* Time classes */
.time-good {
  color: #059669;
}

.time-warning {
  color: #d97706;
}

.time-critical {
  color: #dc2626;
}

/* Memory Chart */
.memory-chart {
  margin-bottom: 12px;
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 6px;
  padding: 8px;
}

.memory-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--tsqd-text, #6b7280);
}

/* Actions */
.panel-actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--tsqd-border, #e5e7eb);
}

.action-button {
  padding: 6px 12px;
  background: var(--tsqd-background, #ffffff);
  border: 1px solid var(--tsqd-border, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-button:hover {
  background: var(--tsqd-background, #f9fafb);
}
</style>