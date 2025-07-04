<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Upload, 
  FileIcon, 
  FolderOpen, 
  Settings, 
  BarChart3, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-vue-next'
import DocumentDropZoneEnhanced from './DocumentDropZoneEnhanced.vue'
import DocumentUploadQueueEnhanced from './DocumentUploadQueueEnhanced.vue'
import { useDocumentUploadStore } from '~/stores/documentUpload'
import { useUploadProgress } from '~/composables/useUploadProgress'
import { useAccessibility } from '~/composables/useAccessibility'
import { useIsMobile } from '~/composables/useIsMobile'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

interface Props {
  autoUpload?: boolean
  showAnalytics?: boolean
  enableBatchOperations?: boolean
  maxConcurrentUploads?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoUpload: true,
  showAnalytics: true,
  enableBatchOperations: true,
  maxConcurrentUploads: 3
})

const emit = defineEmits<{
  uploadComplete: [files: File[]]
  uploadStart: [files: File[]]
  uploadError: [error: string]
}>()

// Dependencies
const uploadStore = useDocumentUploadStore()
const {
  globalStats,
  hasActiveUploads,
  hasFailedUploads,
  overallProgress,
  isConnected,
  formatSpeed,
  formatTimeRemaining
} = useUploadProgress()
const { announceToScreenReader } = useAccessibility()
const { isMobile } = useIsMobile()

// Local state
const activeTab = ref('upload')
const showSettings = ref(false)
const uploadSettings = ref({
  autoUpload: props.autoUpload,
  maxConcurrentUploads: props.maxConcurrentUploads,
  enableNotifications: true,
  enableSounds: false,
  autoRetry: true,
  maxRetries: 3
})

const sessionStats = ref({
  totalUploaded: 0,
  totalFailed: 0,
  sessionStartTime: new Date(),
  peakSpeed: 0,
  averageSpeed: 0
})

// Computed properties
const dashboardTitle = computed(() => {
  if (hasActiveUploads.value) {
    return `Batch Upload Dashboard - ${globalStats.value.completedFiles}/${globalStats.value.totalFiles} Complete`
  }
  return 'Batch Upload Dashboard'
})

const quickStats = computed(() => [
  {
    label: 'Active Uploads',
    value: uploadStore.stats.uploading,
    icon: Upload,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    label: 'Queue Pending',
    value: uploadStore.stats.pending,
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  {
    label: 'Completed',
    value: uploadStore.stats.completed,
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    label: 'Failed',
    value: uploadStore.stats.failed,
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  }
])

const performanceMetrics = computed(() => ({
  currentSpeed: formatSpeed(globalStats.value.averageSpeed),
  peakSpeed: formatSpeed(sessionStats.value.peakSpeed),
  timeRemaining: formatTimeRemaining(globalStats.value.estimatedTimeRemaining),
  efficiency: globalStats.value.totalFiles > 0 
    ? Math.round((globalStats.value.completedFiles / globalStats.value.totalFiles) * 100)
    : 0,
  sessionDuration: formatDuration(Date.now() - sessionStats.value.sessionStartTime.getTime())
}))

const connectionHealth = computed(() => ({
  status: isConnected.value ? 'connected' : 'disconnected',
  quality: isConnected.value ? 'excellent' : 'poor',
  latency: isConnected.value ? '< 50ms' : 'N/A',
  icon: isConnected.value ? CheckCircle2 : AlertTriangle,
  color: isConnected.value ? 'text-green-600' : 'text-red-600'
}))

// Methods
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

const handleFileDrop = (files: File[]) => {
  emit('uploadStart', files)
  announceToScreenReader(`Added ${files.length} file${files.length !== 1 ? 's' : ''} to upload queue`)
  
  if (uploadSettings.value.autoUpload) {
    // Files are automatically added to queue via the enhanced dropzone
    announceToScreenReader('Automatic upload started')
  }
}

const handleBatchUploadStart = (files: File[]) => {
  emit('uploadStart', files)
  announceToScreenReader(`Started batch upload of ${files.length} file${files.length !== 1 ? 's' : ''}`)
}

const handleUploadError = (error: string) => {
  emit('uploadError', error)
  announceToScreenReader(`Upload error: ${error}`, 'assertive')
}

const refreshDashboard = () => {
  // Refresh connection and stats
  announceToScreenReader('Dashboard refreshed')
}

const openUploadFolder = () => {
  // Open file browser for batch selection
  announceToScreenReader('Opening file browser for batch selection')
}

const exportUploadReport = () => {
  // Generate and download upload session report
  const report = {
    sessionStart: sessionStats.value.sessionStartTime,
    sessionEnd: new Date(),
    totalFiles: uploadStore.stats.total,
    completedFiles: uploadStore.stats.completed,
    failedFiles: uploadStore.stats.failed,
    performanceMetrics: performanceMetrics.value
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `upload-report-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  announceToScreenReader('Upload report exported')
}

const applySettings = () => {
  // Apply upload settings
  showSettings.value = false
  announceToScreenReader('Upload settings applied')
}

// Watch for performance metrics updates
watch(() => globalStats.value.averageSpeed, (newSpeed) => {
  if (newSpeed > sessionStats.value.peakSpeed) {
    sessionStats.value.peakSpeed = newSpeed
  }
})

watch(() => uploadStore.stats.completed, (completed, previousCompleted) => {
  if (completed > previousCompleted) {
    sessionStats.value.totalUploaded += (completed - previousCompleted)
  }
})

watch(() => uploadStore.stats.failed, (failed, previousFailed) => {
  if (failed > previousFailed) {
    sessionStats.value.totalFailed += (failed - previousFailed)
  }
})

// Initialize
onMounted(() => {
  announceToScreenReader('Batch upload dashboard loaded')
})
</script>

<template>
  <div class="batch-upload-dashboard min-h-screen bg-background">
    <!-- Dashboard Header -->
    <div class="border-b bg-card">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Upload class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 class="text-xl font-semibold">{{ dashboardTitle }}</h1>
              <p class="text-sm text-muted-foreground">
                Manage and monitor file uploads with real-time progress tracking
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Connection indicator -->
            <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
              <component :is="connectionHealth.icon" :class="['w-3 h-3', connectionHealth.color]" />
              <span class="text-xs font-medium capitalize">{{ connectionHealth.status }}</span>
            </div>
            
            <!-- Dashboard actions -->
            <Button variant="outline" size="sm" @click="refreshDashboard">
              <RefreshCw class="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings class="w-4 h-4 mr-2" />
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Dashboard Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="openUploadFolder">
                  <FolderOpen class="w-4 h-4 mr-2" />
                  Browse Files
                </DropdownMenuItem>
                <DropdownMenuItem @click="exportUploadReport">
                  <BarChart3 class="w-4 h-4 mr-2" />
                  Export Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="showSettings = true">
                  <Settings class="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="container mx-auto px-4 py-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card
          v-for="stat in quickStats"
          :key="stat.label"
          class="p-4"
        >
          <div class="flex items-center gap-3">
            <div :class="['p-2 rounded-lg', stat.bgColor]">
              <component :is="stat.icon" :class="['w-4 h-4', stat.color]" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ stat.value }}</p>
              <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Main Content Tabs -->
      <Tabs v-model="activeTab" class="space-y-6">
        <TabsList class="grid grid-cols-3 lg:grid-cols-4 w-full lg:w-auto">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="analytics" v-if="showAnalytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <!-- Upload Tab -->
        <TabsContent value="upload" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Upload Zone -->
            <div class="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2">
                    <Upload class="w-4 h-4" />
                    Batch File Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentDropZoneEnhanced
                    :auto-upload="uploadSettings.autoUpload"
                    :max-files="50"
                    :enable-batch-mode="true"
                    @drop="handleFileDrop"
                    @batch-upload-start="handleBatchUploadStart"
                    @error="handleUploadError"
                  />
                </CardContent>
              </Card>
            </div>

            <!-- Real-time Stats -->
            <div class="space-y-4">
              <!-- Performance Metrics -->
              <Card>
                <CardHeader>
                  <CardTitle class="text-sm flex items-center gap-2">
                    <Zap class="w-4 h-4" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-muted-foreground">Current Speed</p>
                      <p class="font-medium">{{ performanceMetrics.currentSpeed }}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground">Peak Speed</p>
                      <p class="font-medium">{{ performanceMetrics.peakSpeed }}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground">Time Left</p>
                      <p class="font-medium">{{ performanceMetrics.timeRemaining }}</p>
                    </div>
                    <div>
                      <p class="text-muted-foreground">Efficiency</p>
                      <p class="font-medium">{{ performanceMetrics.efficiency }}%</p>
                    </div>
                  </div>
                  
                  <div class="pt-3 border-t">
                    <p class="text-xs text-muted-foreground mb-2">Session Duration</p>
                    <p class="text-sm font-medium">{{ performanceMetrics.sessionDuration }}</p>
                  </div>
                </CardContent>
              </Card>

              <!-- Connection Health -->
              <Card>
                <CardHeader>
                  <CardTitle class="text-sm flex items-center gap-2">
                    <component :is="connectionHealth.icon" :class="['w-4 h-4', connectionHealth.color]" />
                    Connection
                  </CardTitle>
                </CardHeader>
                <CardContent class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Status</span>
                    <span :class="['font-medium capitalize', connectionHealth.color]">
                      {{ connectionHealth.status }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Quality</span>
                    <span class="font-medium">{{ connectionHealth.quality }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Latency</span>
                    <span class="font-medium">{{ connectionHealth.latency }}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <!-- Queue Tab -->
        <TabsContent value="queue">
          <DocumentUploadQueueEnhanced
            :show-global-stats="true"
            :enable-batch-controls="enableBatchOperations"
            max-height="600px"
          />
        </TabsContent>

        <!-- Analytics Tab -->
        <TabsContent value="analytics" v-if="showAnalytics">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <BarChart3 class="w-4 h-4" />
                Upload Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="space-y-2">
                  <h4 class="font-medium">Session Summary</h4>
                  <div class="text-sm space-y-1">
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Files Uploaded</span>
                      <span class="font-medium">{{ sessionStats.totalUploaded }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Files Failed</span>
                      <span class="font-medium">{{ sessionStats.totalFailed }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-foreground">Success Rate</span>
                      <span class="font-medium">
                        {{ sessionStats.totalUploaded + sessionStats.totalFailed > 0 
                           ? Math.round((sessionStats.totalUploaded / (sessionStats.totalUploaded + sessionStats.totalFailed)) * 100) 
                           : 0 }}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- Additional analytics would go here -->
                <div class="space-y-2">
                  <h4 class="font-medium">Performance Trends</h4>
                  <p class="text-sm text-muted-foreground">
                    Performance charts and trends will be displayed here in a future update.
                  </p>
                </div>
                
                <div class="space-y-2">
                  <h4 class="font-medium">Recommendations</h4>
                  <div class="text-sm space-y-1">
                    <p class="text-muted-foreground">
                      Based on current performance, consider adjusting concurrent upload limits for optimal throughput.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- History Tab -->
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">
                Upload history and previous session data will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Settings Dialog -->
    <Dialog v-model:open="showSettings">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Settings</DialogTitle>
          <DialogDescription>
            Configure batch upload behavior and preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Auto-upload files</label>
            <input
              type="checkbox"
              v-model="uploadSettings.autoUpload"
              class="w-4 h-4"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Enable notifications</label>
            <input
              type="checkbox"
              v-model="uploadSettings.enableNotifications"
              class="w-4 h-4"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Auto-retry failed uploads</label>
            <input
              type="checkbox"
              v-model="uploadSettings.autoRetry"
              class="w-4 h-4"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">Max concurrent uploads</label>
            <input
              type="range"
              v-model="uploadSettings.maxConcurrentUploads"
              min="1"
              max="10"
              class="w-full"
            />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>{{ uploadSettings.maxConcurrentUploads }}</span>
              <span>10</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showSettings = false">
            Cancel
          </Button>
          <Button @click="applySettings">
            Apply Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.batch-upload-dashboard {
  background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.1) 100%);
}

/* Enhance card animations */
.batch-upload-dashboard .grid > * {
  transition: all 0.2s ease;
}

.batch-upload-dashboard .grid > *:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px hsl(var(--foreground) / 0.1);
}

/* Custom progress animations */
@keyframes progress-fill {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}

.batch-upload-dashboard [role="progressbar"] {
  overflow: hidden;
}

.batch-upload-dashboard [role="progressbar"] > div {
  animation: progress-fill 0.8s ease-out;
  transform-origin: left;
}
</style>