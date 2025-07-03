<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '~/components/ui/dialog'
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent 
} from '~/components/ui/card'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Download, 
  X,
  Pause,
  Play,
  RotateCcw
} from 'lucide-vue-next'

export interface OperationProgress {
  id: string
  type: 'export' | 'bulk_update' | 'bulk_delete' | 'import'
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  currentStep: string
  totalSteps: number
  completedSteps: number
  itemsProcessed: number
  totalItems: number
  startTime: Date
  endTime?: Date
  estimatedTimeRemaining?: number
  errors: Array<{
    itemId: string
    message: string
    timestamp: Date
  }>
  warnings: Array<{
    itemId: string
    message: string
    timestamp: Date
  }>
  result?: {
    downloadUrl?: string
    successCount: number
    errorCount: number
    warningCount: number
    summary: string
  }
}

interface Props {
  operationId?: string
  showDialog?: boolean
  autoClose?: boolean
  allowCancel?: boolean
  allowPause?: boolean
  allowRetry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDialog: false,
  autoClose: true,
  allowCancel: true,
  allowPause: false,
  allowRetry: true
})

const emit = defineEmits<{
  'operation:cancel': [operationId: string]
  'operation:pause': [operationId: string]
  'operation:resume': [operationId: string]
  'operation:retry': [operationId: string]
  'operation:complete': [operation: OperationProgress]
  'close': []
}>()

// State
const isOpen = ref(props.showDialog)
const operation = ref<OperationProgress | null>(null)
const websocket = ref<WebSocket | null>(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const isConnected = ref(false)
const showDetails = ref(false)

// Computed properties
const progressPercentage = computed(() => operation.value?.progress || 0)

const statusIcon = computed(() => {
  switch (operation.value?.status) {
    case 'completed': return CheckCircle
    case 'failed': return XCircle
    case 'cancelled': return XCircle
    case 'paused': return Pause
    case 'running': return Clock
    default: return Clock
  }
})

const statusColor = computed(() => {
  switch (operation.value?.status) {
    case 'completed': return 'text-green-500'
    case 'failed': return 'text-red-500'
    case 'cancelled': return 'text-orange-500'
    case 'paused': return 'text-yellow-500'
    case 'running': return 'text-blue-500'
    default: return 'text-gray-500'
  }
})

const timeElapsed = computed(() => {
  if (!operation.value?.startTime) return ''
  
  const start = new Date(operation.value.startTime)
  const end = operation.value.endTime ? new Date(operation.value.endTime) : new Date()
  const diffMs = end.getTime() - start.getTime()
  
  return formatDuration(diffMs)
})

const estimatedTimeRemaining = computed(() => {
  if (!operation.value?.estimatedTimeRemaining) return ''
  return formatDuration(operation.value.estimatedTimeRemaining)
})

const canCancel = computed(() => 
  props.allowCancel && 
  operation.value?.status === 'running' || operation.value?.status === 'paused'
)

const canPause = computed(() => 
  props.allowPause && operation.value?.status === 'running'
)

const canResume = computed(() => 
  props.allowPause && operation.value?.status === 'paused'
)

const canRetry = computed(() => 
  props.allowRetry && 
  (operation.value?.status === 'failed' || operation.value?.status === 'cancelled')
)

const canDownload = computed(() => 
  operation.value?.status === 'completed' && 
  operation.value?.result?.downloadUrl
)

// WebSocket connection management
const connectWebSocket = () => {
  if (!props.operationId) return

  try {
    const wsUrl = `${process.env.NUXT_WS_URL || 'ws://localhost:8080'}/api/operations/${props.operationId}/progress`
    websocket.value = new WebSocket(wsUrl)

    websocket.value.onopen = () => {
      isConnected.value = true
      reconnectAttempts.value = 0
    }

    websocket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        updateOperation(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    websocket.value.onclose = () => {
      isConnected.value = false
      
      // Attempt to reconnect if operation is still running
      if (operation.value?.status === 'running' && reconnectAttempts.value < maxReconnectAttempts) {
        setTimeout(() => {
          reconnectAttempts.value++
          connectWebSocket()
        }, 2000 * Math.pow(2, reconnectAttempts.value)) // Exponential backoff
      }
    }

    websocket.value.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnected.value = false
    }
  } catch (error) {
    console.error('Failed to connect WebSocket:', error)
  }
}

const disconnectWebSocket = () => {
  if (websocket.value) {
    websocket.value.close()
    websocket.value = null
    isConnected.value = false
  }
}

// Operation management
const updateOperation = (data: Partial<OperationProgress>) => {
  if (operation.value) {
    operation.value = { ...operation.value, ...data }
  } else {
    operation.value = data as OperationProgress
  }

  // Auto-close dialog on completion if enabled
  if (props.autoClose && data.status === 'completed') {
    setTimeout(() => {
      handleClose()
    }, 3000)
  }

  // Emit completion event
  if (data.status === 'completed' && operation.value) {
    emit('operation:complete', operation.value)
  }
}

const fetchOperationStatus = async () => {
  if (!props.operationId) return

  try {
    const response = await $fetch<OperationProgress>(`/api/operations/${props.operationId}`)
    updateOperation(response)
  } catch (error) {
    console.error('Failed to fetch operation status:', error)
  }
}

// Action handlers
const handleCancel = async () => {
  if (!operation.value?.id) return

  try {
    await $fetch(`/api/operations/${operation.value.id}/cancel`, { method: 'POST' })
    emit('operation:cancel', operation.value.id)
  } catch (error) {
    console.error('Failed to cancel operation:', error)
  }
}

const handlePause = async () => {
  if (!operation.value?.id) return

  try {
    await $fetch(`/api/operations/${operation.value.id}/pause`, { method: 'POST' })
    emit('operation:pause', operation.value.id)
  } catch (error) {
    console.error('Failed to pause operation:', error)
  }
}

const handleResume = async () => {
  if (!operation.value?.id) return

  try {
    await $fetch(`/api/operations/${operation.value.id}/resume`, { method: 'POST' })
    emit('operation:resume', operation.value.id)
  } catch (error) {
    console.error('Failed to resume operation:', error)
  }
}

const handleRetry = async () => {
  if (!operation.value?.id) return

  try {
    await $fetch(`/api/operations/${operation.value.id}/retry`, { method: 'POST' })
    emit('operation:retry', operation.value.id)
  } catch (error) {
    console.error('Failed to retry operation:', error)
  }
}

const handleDownload = () => {
  if (operation.value?.result?.downloadUrl) {
    window.open(operation.value.result.downloadUrl, '_blank')
  }
}

const handleClose = () => {
  isOpen.value = false
  emit('close')
}

// Utility functions
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

const getOperationTypeLabel = (type: string): string => {
  switch (type) {
    case 'export': return 'Export'
    case 'bulk_update': return 'Bulk Update'
    case 'bulk_delete': return 'Bulk Delete'
    case 'import': return 'Import'
    default: return type
  }
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending'
    case 'running': return 'Running'
    case 'paused': return 'Paused'
    case 'completed': return 'Completed'
    case 'failed': return 'Failed'
    case 'cancelled': return 'Cancelled'
    default: return status
  }
}

// Lifecycle
onMounted(() => {
  if (props.operationId) {
    fetchOperationStatus()
    connectWebSocket()
  }
})

onUnmounted(() => {
  disconnectWebSocket()
})

// Watch for operation ID changes
watch(() => props.operationId, (newId) => {
  disconnectWebSocket()
  
  if (newId) {
    fetchOperationStatus()
    connectWebSocket()
  }
})

// Watch for showDialog changes
watch(() => props.showDialog, (newValue) => {
  isOpen.value = newValue
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <component 
            :is="statusIcon" 
            :class="['h-5 w-5', statusColor]"
          />
          {{ operation ? getOperationTypeLabel(operation.type) : 'Operation' }} Progress
        </DialogTitle>
        <DialogDescription v-if="operation">
          {{ operation.currentStep }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="operation" class="space-y-4">
        <!-- Progress bar -->
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>{{ operation.itemsProcessed }} of {{ operation.totalItems }} items</span>
            <span>{{ Math.round(progressPercentage) }}%</span>
          </div>
          <Progress :value="progressPercentage" class="h-3" />
        </div>

        <!-- Status and timing -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-muted-foreground">Status:</span>
            <Badge 
              :variant="operation.status === 'completed' ? 'default' : 
                      operation.status === 'failed' ? 'destructive' : 
                      operation.status === 'paused' ? 'secondary' : 'outline'"
              class="ml-2"
            >
              {{ getStatusLabel(operation.status) }}
            </Badge>
          </div>
          <div>
            <span class="text-muted-foreground">Time Elapsed:</span>
            <span class="ml-2">{{ timeElapsed }}</span>
          </div>
          <div v-if="estimatedTimeRemaining">
            <span class="text-muted-foreground">Estimated Remaining:</span>
            <span class="ml-2">{{ estimatedTimeRemaining }}</span>
          </div>
          <div>
            <span class="text-muted-foreground">Connection:</span>
            <Badge 
              :variant="isConnected ? 'default' : 'destructive'"
              class="ml-2"
            >
              {{ isConnected ? 'Connected' : 'Disconnected' }}
            </Badge>
          </div>
        </div>

        <!-- Step progress -->
        <div class="text-sm">
          <span class="text-muted-foreground">Progress:</span>
          <span class="ml-2">
            Step {{ operation.completedSteps }} of {{ operation.totalSteps }}
          </span>
        </div>

        <!-- Errors and warnings -->
        <div v-if="operation.errors.length > 0 || operation.warnings.length > 0" class="space-y-2">
          <Alert v-if="operation.errors.length > 0" variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>
              {{ operation.errors.length }} error{{ operation.errors.length !== 1 ? 's' : '' }} occurred during processing.
              <Button 
                variant="link" 
                size="sm" 
                class="h-auto p-0 ml-2"
                @click="showDetails = true"
              >
                View Details
              </Button>
            </AlertDescription>
          </Alert>

          <Alert v-if="operation.warnings.length > 0">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>
              {{ operation.warnings.length }} warning{{ operation.warnings.length !== 1 ? 's' : '' }} 
              occurred during processing.
              <Button 
                variant="link" 
                size="sm" 
                class="h-auto p-0 ml-2"
                @click="showDetails = true"
              >
                View Details
              </Button>
            </AlertDescription>
          </Alert>
        </div>

        <!-- Result summary -->
        <Card v-if="operation.result" class="bg-muted/50">
          <CardHeader class="pb-3">
            <CardTitle class="text-base">Operation Summary</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div class="text-center">
                <div class="text-lg font-semibold text-green-600">
                  {{ operation.result.successCount }}
                </div>
                <div class="text-muted-foreground">Success</div>
              </div>
              <div class="text-center" v-if="operation.result.errorCount > 0">
                <div class="text-lg font-semibold text-red-600">
                  {{ operation.result.errorCount }}
                </div>
                <div class="text-muted-foreground">Errors</div>
              </div>
              <div class="text-center" v-if="operation.result.warningCount > 0">
                <div class="text-lg font-semibold text-yellow-600">
                  {{ operation.result.warningCount }}
                </div>
                <div class="text-muted-foreground">Warnings</div>
              </div>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ operation.result.summary }}
            </p>
          </CardContent>
        </Card>

        <!-- Details dialog -->
        <Dialog v-model:open="showDetails">
          <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Operation Details</DialogTitle>
            </DialogHeader>
            
            <div class="space-y-4">
              <!-- Errors -->
              <div v-if="operation.errors.length > 0">
                <h3 class="font-semibold text-red-600 mb-2">Errors</h3>
                <div class="space-y-2">
                  <div 
                    v-for="(error, index) in operation.errors" 
                    :key="index"
                    class="p-3 bg-red-50 border border-red-200 rounded"
                  >
                    <div class="font-medium">Item: {{ error.itemId }}</div>
                    <div class="text-sm text-red-700">{{ error.message }}</div>
                    <div class="text-xs text-red-500">
                      {{ new Date(error.timestamp).toLocaleString() }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Warnings -->
              <div v-if="operation.warnings.length > 0">
                <h3 class="font-semibold text-yellow-600 mb-2">Warnings</h3>
                <div class="space-y-2">
                  <div 
                    v-for="(warning, index) in operation.warnings" 
                    :key="index"
                    class="p-3 bg-yellow-50 border border-yellow-200 rounded"
                  >
                    <div class="font-medium">Item: {{ warning.itemId }}</div>
                    <div class="text-sm text-yellow-700">{{ warning.message }}</div>
                    <div class="text-xs text-yellow-500">
                      {{ new Date(warning.timestamp).toLocaleString() }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" @click="showDetails = false">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DialogFooter class="gap-2">
        <!-- Action buttons -->
        <Button 
          v-if="canPause"
          variant="outline"
          size="sm"
          @click="handlePause"
        >
          <Pause class="h-4 w-4 mr-2" />
          Pause
        </Button>

        <Button 
          v-if="canResume"
          variant="outline"
          size="sm"
          @click="handleResume"
        >
          <Play class="h-4 w-4 mr-2" />
          Resume
        </Button>

        <Button 
          v-if="canRetry"
          variant="outline"
          size="sm"
          @click="handleRetry"
        >
          <RotateCcw class="h-4 w-4 mr-2" />
          Retry
        </Button>

        <Button 
          v-if="canDownload"
          variant="default"
          size="sm"
          @click="handleDownload"
        >
          <Download class="h-4 w-4 mr-2" />
          Download
        </Button>

        <Button 
          v-if="canCancel"
          variant="destructive"
          size="sm"
          @click="handleCancel"
        >
          <X class="h-4 w-4 mr-2" />
          Cancel
        </Button>

        <Button variant="outline" @click="handleClose">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-fill {
  transition: stroke-dashoffset 0.3s ease;
}
</style>