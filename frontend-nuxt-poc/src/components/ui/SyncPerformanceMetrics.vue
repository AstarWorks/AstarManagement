<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSyncPerformanceMonitor } from '~/composables/useSyncPerformanceMonitor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { 
  Activity, 
  Wifi, 
  Database, 
  Zap, 
  Battery, 
  Cpu,
  Download,
  Upload,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-vue-next'
import { formatBytes, formatDuration } from '~/utils/formatters'
import { SYNC_MODE_DESCRIPTIONS } from '~/config/background-sync'

const props = defineProps<{
  /**
   * Whether to show detailed metrics
   */
  detailed?: boolean
  
  /**
   * Whether to show export button
   */
  showExport?: boolean
}>()

const {
  syncMetrics,
  networkMetrics,
  resourceMetrics,
  cacheMetrics,
  websocketMetrics,
  currentPerformance,
  isPerformanceOptimal,
  performanceScore,
  performanceHistory,
  exportMetrics,
  clearMetrics
} = useSyncPerformanceMonitor()

// Active tab
const activeTab = ref('overview')

// Computed properties for UI
const networkStatusColor = computed(() => {
  switch (networkMetrics.value.quality) {
    case 'excellent': return 'text-green-500'
    case 'good': return 'text-blue-500'
    case 'fair': return 'text-yellow-500'
    case 'poor': return 'text-orange-500'
    case 'offline': return 'text-red-500'
    default: return 'text-gray-500'
  }
})

const performanceScoreColor = computed(() => {
  if (performanceScore.value >= 80) return 'text-green-500'
  if (performanceScore.value >= 60) return 'text-yellow-500'
  return 'text-red-500'
})

const recentOperations = computed(() => {
  return syncMetrics.value
    .slice(-10)
    .reverse()
    .map(op => ({
      ...op,
      durationFormatted: op.duration ? formatDuration(op.duration) : 'N/A',
      timeAgo: formatTimeAgo(op.startTime)
    }))
})

const syncStats = computed(() => {
  if (!currentPerformance.value) {
    return {
      successRate: 0,
      averageDuration: 'N/A',
      totalOperations: 0
    }
  }
  
  const { sync } = currentPerformance.value.metrics
  const successRate = sync.total > 0 
    ? Math.round((sync.successful / sync.total) * 100) 
    : 0
    
  return {
    successRate,
    averageDuration: formatDuration(sync.averageDuration),
    totalOperations: sync.total
  }
})

// Format time ago
const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

// Format bytes (placeholder - implement in utils)
const formatBytesLocal = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format duration (placeholder - implement in utils)
const formatDurationLocal = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

// Handle export
const handleExport = () => {
  exportMetrics()
}

// Handle clear
const handleClear = () => {
  if (confirm('Are you sure you want to clear all performance metrics?')) {
    clearMetrics()
  }
}
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2">
            <Activity class="h-5 w-5" />
            Sync Performance Metrics
          </CardTitle>
          <CardDescription>
            Real-time monitoring of background synchronization
          </CardDescription>
        </div>
        <div class="flex items-center gap-2">
          <Badge 
            :variant="isPerformanceOptimal ? 'default' : 'destructive'"
            class="flex items-center gap-1"
          >
            <span :class="performanceScoreColor" class="font-bold">
              {{ performanceScore }}%
            </span>
            Performance Score
          </Badge>
          <div v-if="showExport" class="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              @click="handleExport"
            >
              <Download class="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              @click="handleClear"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </CardHeader>
    
    <CardContent>
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <!-- Overview Tab -->
        <TabsContent value="overview" class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <!-- Sync Status -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap class="h-4 w-4" />
                Sync Status
              </div>
              <div class="text-2xl font-bold">
                {{ currentPerformance?.syncMode || 'balanced' }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ SYNC_MODE_DESCRIPTIONS[currentPerformance?.syncMode || 'balanced'].description }}
              </div>
            </div>
            
            <!-- Success Rate -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle class="h-4 w-4" />
                Success Rate
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold">{{ syncStats.successRate }}%</span>
                <span class="text-xs text-muted-foreground">
                  ({{ syncStats.totalOperations }} ops)
                </span>
              </div>
              <Progress :value="syncStats.successRate" class="h-1" />
            </div>
            
            <!-- Average Duration -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock class="h-4 w-4" />
                Avg Duration
              </div>
              <div class="text-2xl font-bold">
                {{ syncStats.averageDuration }}
              </div>
              <div class="text-xs text-muted-foreground">
                per operation
              </div>
            </div>
            
            <!-- Cache Hit Rate -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Database class="h-4 w-4" />
                Cache Hit Rate
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold">{{ cacheMetrics.hitRate }}%</span>
                <span class="text-xs text-muted-foreground">
                  ({{ cacheMetrics.hits }}/{{ cacheMetrics.hits + cacheMetrics.misses }})
                </span>
              </div>
              <Progress :value="cacheMetrics.hitRate" class="h-1" />
            </div>
          </div>
          
          <!-- Recent Operations -->
          <div v-if="detailed" class="space-y-2">
            <h4 class="font-medium text-sm">Recent Operations</h4>
            <div class="space-y-1 max-h-48 overflow-y-auto">
              <div
                v-for="op in recentOperations"
                :key="op.operationId"
                class="flex items-center justify-between p-2 rounded-md bg-muted/50 text-xs"
              >
                <div class="flex items-center gap-2">
                  <Badge 
                    :variant="op.success ? 'default' : 'destructive'" 
                    class="h-5"
                  >
                    {{ op.type }}
                  </Badge>
                  <span class="font-mono truncate max-w-xs">{{ op.operation }}</span>
                </div>
                <div class="flex items-center gap-4 text-muted-foreground">
                  <span>{{ op.durationFormatted }}</span>
                  <span>{{ op.timeAgo }}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <!-- Network Tab -->
        <TabsContent value="network" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Network Quality -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Wifi class="h-4 w-4" />
                Network Quality
              </div>
              <div class="flex items-center gap-2">
                <span class="text-2xl font-bold" :class="networkStatusColor">
                  {{ networkMetrics.quality }}
                </span>
                <Badge v-if="!networkMetrics.isOnline" variant="destructive">
                  Offline
                </Badge>
              </div>
            </div>
            
            <!-- Connection Info -->
            <div class="space-y-2">
              <div class="text-sm text-muted-foreground">Connection Info</div>
              <div class="space-y-1 text-sm">
                <div v-if="networkMetrics.effectiveType">
                  Type: <span class="font-medium">{{ networkMetrics.effectiveType }}</span>
                </div>
                <div v-if="networkMetrics.downlink">
                  Speed: <span class="font-medium">{{ networkMetrics.downlink }} Mbps</span>
                </div>
                <div v-if="networkMetrics.rtt">
                  Latency: <span class="font-medium">{{ networkMetrics.rtt }}ms</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- WebSocket Metrics -->
          <div class="space-y-2">
            <h4 class="font-medium text-sm">WebSocket Connection</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="space-y-1">
                <div class="text-sm text-muted-foreground">Status</div>
                <Badge :variant="websocketMetrics.connected ? 'default' : 'secondary'">
                  {{ websocketMetrics.connected ? 'Connected' : 'Disconnected' }}
                </Badge>
              </div>
              <div class="space-y-1">
                <div class="text-sm text-muted-foreground">Latency</div>
                <div class="font-medium">
                  {{ websocketMetrics.latency ? `${websocketMetrics.latency}ms` : 'N/A' }}
                </div>
              </div>
              <div class="space-y-1">
                <div class="text-sm text-muted-foreground">Messages</div>
                <div class="flex items-center gap-2 text-sm">
                  <Upload class="h-3 w-3" />
                  {{ websocketMetrics.messagesSent }}
                  <Download class="h-3 w-3" />
                  {{ websocketMetrics.messagesReceived }}
                </div>
              </div>
              <div class="space-y-1">
                <div class="text-sm text-muted-foreground">Data Transfer</div>
                <div class="font-medium">
                  {{ formatBytesLocal(websocketMetrics.dataTransferred) }}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <!-- Performance Tab -->
        <TabsContent value="performance" class="space-y-4">
          <div v-if="currentPerformance" class="space-y-4">
            <!-- Performance Metrics -->
            <div class="grid grid-cols-3 gap-4">
              <div class="space-y-2">
                <div class="text-sm text-muted-foreground">P95 Duration</div>
                <div class="text-xl font-bold">
                  {{ formatDurationLocal(currentPerformance.metrics.sync.p95Duration) }}
                </div>
              </div>
              <div class="space-y-2">
                <div class="text-sm text-muted-foreground">P99 Duration</div>
                <div class="text-xl font-bold">
                  {{ formatDurationLocal(currentPerformance.metrics.sync.p99Duration) }}
                </div>
              </div>
              <div class="space-y-2">
                <div class="text-sm text-muted-foreground">Failed Ops</div>
                <div class="text-xl font-bold text-red-500">
                  {{ currentPerformance.metrics.sync.failed }}
                </div>
              </div>
            </div>
            
            <!-- Cache Performance -->
            <div class="space-y-2">
              <h4 class="font-medium text-sm">Cache Performance</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="space-y-1">
                  <div class="text-sm text-muted-foreground">Cache Size</div>
                  <div class="font-medium">{{ cacheMetrics.size }} MB</div>
                </div>
                <div class="space-y-1">
                  <div class="text-sm text-muted-foreground">Queries</div>
                  <div class="font-medium">{{ cacheMetrics.queryCount }}</div>
                </div>
                <div class="space-y-1">
                  <div class="text-sm text-muted-foreground">Mutations</div>
                  <div class="font-medium">{{ cacheMetrics.mutationCount }}</div>
                </div>
                <div class="space-y-1">
                  <div class="text-sm text-muted-foreground">Evictions</div>
                  <div class="font-medium">{{ cacheMetrics.evictions }}</div>
                </div>
              </div>
            </div>
            
            <!-- Performance History Chart (placeholder) -->
            <div v-if="detailed && performanceHistory.length > 0" class="space-y-2">
              <h4 class="font-medium text-sm">Performance Trend</h4>
              <div class="h-32 bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground">
                <span class="text-sm">Performance chart would be rendered here</span>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <!-- Resources Tab -->
        <TabsContent value="resources" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Memory Usage -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Cpu class="h-4 w-4" />
                Memory Usage
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xl font-bold">
                    {{ resourceMetrics.memory.percentage }}%
                  </span>
                  <span class="text-sm text-muted-foreground">
                    {{ resourceMetrics.memory.used }} / {{ resourceMetrics.memory.limit }} MB
                  </span>
                </div>
                <Progress :value="resourceMetrics.memory.percentage" class="h-2" />
                <div v-if="resourceMetrics.memory.percentage > 80" class="flex items-center gap-1 text-xs text-yellow-500">
                  <AlertCircle class="h-3 w-3" />
                  High memory usage detected
                </div>
              </div>
            </div>
            
            <!-- Battery Status -->
            <div v-if="resourceMetrics.battery" class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Battery class="h-4 w-4" />
                Battery Status
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xl font-bold">
                    {{ resourceMetrics.battery.level }}%
                  </span>
                  <Badge :variant="resourceMetrics.battery.charging ? 'default' : 'secondary'">
                    {{ resourceMetrics.battery.charging ? 'Charging' : 'Discharging' }}
                  </Badge>
                </div>
                <Progress :value="resourceMetrics.battery.level" class="h-2" />
                <div v-if="resourceMetrics.battery.dischargingTime" class="text-xs text-muted-foreground">
                  {{ resourceMetrics.battery.dischargingTime }} minutes remaining
                </div>
                <div v-if="!resourceMetrics.battery.charging && resourceMetrics.battery.level < 20" 
                     class="flex items-center gap-1 text-xs text-orange-500">
                  <AlertCircle class="h-3 w-3" />
                  Low battery - sync may be reduced
                </div>
              </div>
            </div>
          </div>
          
          <!-- CPU Usage -->
          <div v-if="resourceMetrics.cpu" class="space-y-2">
            <div class="text-sm text-muted-foreground">
              CPU: {{ resourceMetrics.cpu.cores }} cores, ~{{ resourceMetrics.cpu.usage }}% usage
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</template>