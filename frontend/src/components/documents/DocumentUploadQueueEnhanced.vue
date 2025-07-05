<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  X,
  RotateCw,
  Trash2,
  Pause,
  Play,
  Wifi,
  WifiOff,
  TrendingUp,
  Clock
} from 'lucide-vue-next'
import { useDocumentUploadStore } from '~/stores/documentUpload'
import { useUploadProgress } from '~/composables/useUploadProgress'
import { useAccessibility } from '~/composables/useAccessibility'
import DocumentUploadItem from './DocumentUploadItem.vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'

interface Props {
  showGlobalStats?: boolean
  enableBatchControls?: boolean
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  showGlobalStats: true,
  enableBatchControls: true,
  maxHeight: '500px'
})

const uploadStore = useDocumentUploadStore()
const {
  uploadProgress,
  globalStats,
  activeUploads,
  completedUploads,
  failedUploads,
  hasActiveUploads,
  hasFailedUploads,
  overallProgress,
  pauseUpload,
  resumeUpload,
  cancelUpload,
  retryUpload,
  clearCompleted,
  clearAll,
  formatSpeed,
  formatTimeRemaining,
  isConnected
} = useUploadProgress()

const { announceToScreenReader, announceBatchOperation } = useAccessibility()

// Local state
const showStatsDetails = ref(false)
const autoScrollEnabled = ref(true)

// Computed properties
const hasItems = computed(() => uploadStore.queue.length > 0)
const isPaused = ref(false)

const queueTitle = computed(() => {
  if (!hasItems.value) return 'Upload Queue'
  
  const { uploading, pending, total } = uploadStore.stats
  if (uploading > 0) {
    return `Uploading ${uploading} of ${total} files`
  } else if (pending > 0) {
    return `${pending} files waiting`
  } else {
    return `${total} files processed`
  }
})

const connectionStatus = computed(() => ({
  connected: isConnected.value,
  text: isConnected.value ? 'Real-time updates active' : 'Offline mode - updates delayed',
  icon: isConnected.value ? Wifi : WifiOff,
  class: isConnected.value ? 'text-green-600' : 'text-yellow-600'
}))

const globalStatsDisplay = computed(() => {
  const stats = globalStats.value
  return {
    speed: formatSpeed(stats.averageSpeed),
    timeRemaining: formatTimeRemaining(stats.estimatedTimeRemaining),
    filesCompleted: `${stats.completedFiles}/${stats.totalFiles}`,
    dataTransferred: `${formatSize(stats.uploadedBytes)} / ${formatSize(stats.totalBytes)}`
  }
})

const sortedQueue = computed(() => {
  // Sort queue items by priority: uploading > pending > paused > failed > completed
  const statusPriority: Record<string, number> = {
    uploading: 1,
    pending: 2,
    paused: 3,
    failed: 4,
    completed: 5,
    cancelled: 6,
    error: 7
  }
  
  return [...uploadStore.queue].sort((a, b) => {
    return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99)
  })
})

const showClearCompleted = computed(() => uploadStore.stats.completed > 0)
const showRetryFailed = computed(() => uploadStore.stats.failed > 0)
const showPauseAll = computed(() => uploadStore.stats.uploading > 0)

// Methods
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const handlePause = (id: string) => {
  pauseUpload(id)
  const item = uploadStore.queue.find(i => i.id === id)
  if (item) {
    announceToScreenReader(`Paused upload of ${item.file.name}`)
  }
}

const handleResume = (id: string) => {
  resumeUpload(id)
  const item = uploadStore.queue.find(i => i.id === id)
  if (item) {
    announceToScreenReader(`Resumed upload of ${item.file.name}`)
  }
}

const handleRetry = (id: string) => {
  retryUpload(id)
  const item = uploadStore.queue.find(i => i.id === id)
  if (item) {
    announceToScreenReader(`Retrying upload of ${item.file.name}`)
  }
}

const handleCancel = (id: string) => {
  cancelUpload(id)
  const item = uploadStore.queue.find(i => i.id === id)
  if (item) {
    announceToScreenReader(`Cancelled upload of ${item.file.name}`)
  }
}

const handleRemove = (id: string) => {
  uploadStore.removeFromQueue(id)
  announceToScreenReader('Removed file from upload queue')
}

const pauseAllUploads = () => {
  const activeCount = activeUploads.value.length
  activeUploads.value.forEach(upload => pauseUpload(upload.fileId))
  isPaused.value = true
  announceBatchOperation('pause', activeCount)
}

const resumeAllUploads = () => {
  const pausedUploads = Array.from(uploadProgress.value.values()).filter(p => p.status === 'paused')
  pausedUploads.forEach(upload => resumeUpload(upload.fileId))
  isPaused.value = false
  announceBatchOperation('resume', pausedUploads.length)
}

const retryAllFailed = () => {
  const failedCount = failedUploads.value.length
  failedUploads.value.forEach(upload => retryUpload(upload.fileId))
  announceBatchOperation('retry', failedCount)
}

const handleClearCompleted = () => {
  const completedCount = completedUploads.value.length
  clearCompleted()
  announceBatchOperation('clear completed', completedCount)
}

const handleClearAll = () => {
  const totalCount = uploadStore.queue.length
  clearAll()
  announceBatchOperation('clear all', totalCount)
}

const toggleStatsDetails = () => {
  showStatsDetails.value = !showStatsDetails.value
  announceToScreenReader(showStatsDetails.value ? 'Showing detailed statistics' : 'Hiding detailed statistics')
}

// Auto-scroll to new uploads when enabled
const queueContainer = ref<HTMLElement>()
watch(() => uploadStore.queue.length, (newLength, oldLength) => {
  if (autoScrollEnabled.value && newLength > oldLength && queueContainer.value) {
    queueContainer.value.scrollTop = queueContainer.value.scrollHeight
  }
})

// Announce significant milestones
watch(() => globalStats.value.completedFiles, (completed, previousCompleted) => {
  if (completed > previousCompleted && completed > 0) {
    const remaining = globalStats.value.totalFiles - completed
    if (remaining === 0) {
      announceToScreenReader('All uploads completed successfully', 'assertive')
    } else if (completed % 5 === 0) { // Announce every 5 completions
      announceToScreenReader(`${completed} files uploaded, ${remaining} remaining`)
    }
  }
})
</script>

<template>
  <Card class="enhanced-upload-queue">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
      <div class="flex items-center gap-3">
        <CardTitle class="text-base font-medium flex items-center gap-2">
          <Upload class="w-4 h-4" />
          {{ queueTitle }}
        </CardTitle>
        
        <!-- Connection status indicator -->
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div class="flex items-center gap-1">
                <component :is="connectionStatus.icon" :class="['w-3 h-3', connectionStatus.class]" />
                <span :class="['text-xs', connectionStatus.class]">
                  {{ isConnected ? 'Live' : 'Offline' }}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ connectionStatus.text }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Queue stats badges -->
        <Badge v-if="uploadStore.stats.uploading > 0" variant="default" class="animate-pulse">
          {{ uploadStore.stats.uploading }} uploading
        </Badge>
        <Badge v-if="uploadStore.stats.pending > 0" variant="secondary">
          {{ uploadStore.stats.pending }} pending
        </Badge>
        <Badge v-if="uploadStore.stats.failed > 0" variant="destructive">
          {{ uploadStore.stats.failed }} failed
        </Badge>
        <Badge v-if="uploadStore.stats.completed > 0" variant="outline" class="text-green-600">
          {{ uploadStore.stats.completed }} completed
        </Badge>
      </div>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <!-- Global progress stats -->
      <div v-if="showGlobalStats && hasActiveUploads" class="p-4 bg-muted/30 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-medium">Global Progress</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            @click="toggleStatsDetails"
            class="text-xs"
          >
            {{ showStatsDetails ? 'Hide' : 'Details' }}
          </Button>
        </div>
        
        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Overall Progress</span>
            <span class="font-medium">{{ overallProgress }}%</span>
          </div>
          <Progress :value="overallProgress" class="h-2" />
          
          <div v-if="showStatsDetails" class="grid grid-cols-2 gap-4 text-xs">
            <div class="flex items-center gap-2">
              <TrendingUp class="w-3 h-3 text-muted-foreground" />
              <span class="text-muted-foreground">Speed:</span>
              <span class="font-medium">{{ globalStatsDisplay.speed }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Clock class="w-3 h-3 text-muted-foreground" />
              <span class="text-muted-foreground">Remaining:</span>
              <span class="font-medium">{{ globalStatsDisplay.timeRemaining }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Files:</span>
              <span class="font-medium ml-1">{{ globalStatsDisplay.filesCompleted }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Data:</span>
              <span class="font-medium ml-1">{{ globalStatsDisplay.dataTransferred }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Batch controls -->
      <div v-if="enableBatchControls && hasItems" class="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
        <div class="flex items-center gap-2">
          <Button
            v-if="showPauseAll && !isPaused"
            size="sm"
            variant="outline"
            @click="pauseAllUploads"
          >
            <Pause class="w-4 h-4 mr-2" />
            Pause All
          </Button>
          
          <Button
            v-if="isPaused"
            size="sm"
            variant="outline"
            @click="resumeAllUploads"
          >
            <Play class="w-4 h-4 mr-2" />
            Resume All
          </Button>
          
          <Button
            v-if="showRetryFailed"
            size="sm"
            variant="outline"
            @click="retryAllFailed"
          >
            <RotateCw class="w-4 h-4 mr-2" />
            Retry Failed ({{ uploadStore.stats.failed }})
          </Button>
        </div>
        
        <div class="flex items-center gap-2">
          <Button
            v-if="showClearCompleted"
            size="sm"
            variant="ghost"
            @click="handleClearCompleted"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Clear Completed
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" class="text-destructive">
                <Trash2 class="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear upload queue?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel all active uploads and clear the entire queue. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction @click="handleClearAll" class="bg-destructive text-destructive-foreground">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!hasItems" class="text-center py-8">
        <Upload class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p class="text-sm text-muted-foreground">
          No files in upload queue
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          Drag and drop files or use the browse button to add files
        </p>
      </div>
      
      <!-- Upload items -->
      <div 
        v-else 
        ref="queueContainer"
        class="space-y-3 overflow-y-auto"
        :style="{ maxHeight: maxHeight }"
        role="list"
        aria-label="Upload queue"
      >
        <TransitionGroup name="queue-list" tag="div" class="space-y-3">
          <DocumentUploadItem
            v-for="item in sortedQueue"
            :key="item.id"
            :item="item"
            role="listitem"
            @pause="handlePause"
            @resume="handleResume"
            @retry="handleRetry"
            @cancel="handleCancel"
            @remove="handleRemove"
          />
        </TransitionGroup>
      </div>
      
      <!-- Queue settings -->
      <div v-if="hasItems" class="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t">
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              v-model="autoScrollEnabled"
              class="w-3 h-3"
            />
            Auto-scroll
          </label>
          <span>{{ uploadStore.queue.length }} items total</span>
        </div>
        
        <div v-if="isConnected" class="flex items-center gap-1 text-green-600">
          <Wifi class="w-3 h-3" />
          <span>Real-time updates</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.enhanced-upload-queue {
  @apply w-full;
}

/* Enhanced queue list transitions */
.queue-list-move,
.queue-list-enter-active,
.queue-list-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.queue-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.queue-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.queue-list-leave-active {
  position: absolute;
  width: 100%;
  z-index: -1;
}

/* Smooth scroll behavior */
.enhanced-upload-queue [ref="queueContainer"] {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.enhanced-upload-queue [ref="queueContainer"]::-webkit-scrollbar {
  width: 6px;
}

.enhanced-upload-queue [ref="queueContainer"]::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 3px;
}

.enhanced-upload-queue [ref="queueContainer"]::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.enhanced-upload-queue [ref="queueContainer"]::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

/* Pulse animation for active uploads */
@keyframes pulse-border {
  0%, 100% {
    border-color: hsl(var(--primary) / 0.3);
  }
  50% {
    border-color: hsl(var(--primary) / 0.6);
  }
}

.enhanced-upload-queue .animate-pulse {
  animation: pulse-border 2s ease-in-out infinite;
}
</style>