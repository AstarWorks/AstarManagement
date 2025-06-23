<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRealTimeStore } from '~/stores/kanban/real-time'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { Separator } from '~/components/ui/separator'
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle, 
  XCircle,
  Settings,
  Activity,
  AlertCircle
} from 'lucide-vue-next'

interface Props {
  /**
   * Show the panel automatically when errors occur
   */
  autoShow?: boolean
  
  /**
   * Panel visibility (controlled mode)
   */
  visible?: boolean
  
  /**
   * Maximum number of failed operations to display
   */
  maxFailedOperations?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoShow: true,
  visible: true,
  maxFailedOperations: 10
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'recovery-started': []
  'recovery-completed': [success: boolean]
}>()

const realTimeStore = useRealTimeStore()
const { 
  syncStatus, 
  connectionQuality,
  recentEvents
} = storeToRefs(realTimeStore)

const isRecovering = ref(false)
const recoveryProgress = ref(0)
const lastRecoveryAttempt = ref<Date | null>(null)

// Computed properties for UI state
const hasErrors = computed(() => 
  syncStatus.value.status === 'error'
)

const isOffline = computed(() => 
  syncStatus.value.status === 'offline'
)

const connectionStatus = computed(() => {
  if (isOffline.value) return 'offline'
  if (syncStatus.value.status === 'error') return 'error'
  if (syncStatus.value.status === 'syncing') return 'syncing'
  return 'connected'
})

const connectionIcon = computed(() => {
  switch (connectionStatus.value) {
    case 'offline':
      return WifiOff
    case 'error':
      return AlertTriangle
    case 'syncing':
      return RefreshCw
    default:
      return Wifi
  }
})

const connectionColor = computed(() => {
  switch (connectionStatus.value) {
    case 'offline':
      return 'text-red-500'
    case 'error':
      return 'text-destructive'
    case 'syncing':
      return 'text-blue-500'
    default:
      return 'text-green-500'
  }
})

const failedOperationsList = computed(() => {
  // Mock failed operations for demo - in real implementation this would come from store
  return []
})

const pendingOperationsCount = computed(() => 0) // Mock - would come from store

const shouldShowPanel = computed(() => 
  props.autoShow ? hasErrors.value : props.visible
)

// Recovery actions
const retryConnection = async () => {
  isRecovering.value = true
  recoveryProgress.value = 0
  lastRecoveryAttempt.value = new Date()
  
  emit('recovery-started')
  
  try {
    // Simulate recovery progress
    const progressInterval = setInterval(() => {
      recoveryProgress.value += 10
      if (recoveryProgress.value >= 90) {
        clearInterval(progressInterval)
      }
    }, 200)
    
    await realTimeStore.forceSyncNow()
    
    recoveryProgress.value = 100
    
    setTimeout(() => {
      isRecovering.value = false
      recoveryProgress.value = 0
      emit('recovery-completed', true)
    }, 500)
    
  } catch (error) {
    console.error('Recovery failed:', error)
    isRecovering.value = false
    recoveryProgress.value = 0
    emit('recovery-completed', false)
  }
}

const retryFailedOperations = async () => {
  // Mock implementation - would retry actual failed operations
  isRecovering.value = true
  recoveryProgress.value = 0
  
  try {
    // Simulate retry process
    for (let i = 0; i < 100; i += 20) {
      recoveryProgress.value = i
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setTimeout(() => {
      isRecovering.value = false
      recoveryProgress.value = 0
    }, 500)
    
  } catch (error) {
    console.error('Failed operation retry failed:', error)
    isRecovering.value = false
    recoveryProgress.value = 0
  }
}

const clearFailedOperations = () => {
  realTimeStore.clearConflictQueue()
}

const forceFullSync = async () => {
  isRecovering.value = true
  recoveryProgress.value = 0
  
  try {
    await realTimeStore.forceSyncNow()
    
    // Simulate sync progress
    const progressInterval = setInterval(() => {
      recoveryProgress.value += 15
      if (recoveryProgress.value >= 100) {
        clearInterval(progressInterval)
        setTimeout(() => {
          isRecovering.value = false
          recoveryProgress.value = 0
        }, 500)
      }
    }, 300)
    
  } catch (error) {
    console.error('Force sync failed:', error)
    isRecovering.value = false
    recoveryProgress.value = 0
  }
}

const formatErrorTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) { // Less than 1 minute
    return 'just now'
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  } else {
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  }
}

const getOperationIcon = (type: string) => {
  switch (type) {
    case 'create':
      return CheckCircle
    case 'update':
      return Settings
    case 'delete':
      return XCircle
    case 'move':
      return Activity
    default:
      return AlertCircle
  }
}

const getOperationDescription = (operation: any) => {
  switch (operation.type) {
    case 'create':
      return `Create matter: ${operation.data?.title || 'Unknown'}`
    case 'update':
      return `Update matter: ${operation.data?.title || 'Unknown'}`
    case 'delete':
      return `Delete matter: ${operation.data?.title || 'Unknown'}`
    case 'move':
      return `Move matter: ${operation.data?.title || 'Unknown'}`
    default:
      return `Unknown operation: ${operation.type}`
  }
}

// Auto-hide panel when errors are resolved
watch([hasErrors, isOffline], ([errors, offline]) => {
  if (!errors && !offline && props.autoShow) {
    setTimeout(() => {
      emit('update:visible', false)
    }, 2000) // Hide after 2 seconds when resolved
  }
})
</script>

<template>
  <div v-if="shouldShowPanel" class="error-recovery-panel">
    <Card :class="[
      'w-full max-w-md mx-auto shadow-lg border-l-4',
      {
        'border-l-red-500': connectionStatus === 'error',
        'border-l-yellow-500': connectionStatus === 'offline',
        'border-l-blue-500': connectionStatus === 'syncing',
        'border-l-green-500': connectionStatus === 'connected'
      }
    ]">
      <CardHeader class="pb-3">
        <div class="flex items-center gap-3">
          <component 
            :is="connectionIcon" 
            :class="['h-5 w-5', connectionColor, { 'animate-spin': connectionStatus === 'syncing' }]"
          />
          <div class="flex-1">
            <CardTitle class="text-base">
              {{ connectionStatus === 'offline' ? 'Connection Lost' : 
                 connectionStatus === 'error' ? 'Sync Error' :
                 connectionStatus === 'syncing' ? 'Syncing...' : 'Connected' }}
            </CardTitle>
            <CardDescription class="text-sm mt-1">
              {{ connectionStatus === 'offline' ? 'You are currently offline' :
                 connectionStatus === 'error' ? 'Failed to sync some changes' :
                 connectionStatus === 'syncing' ? 'Synchronizing data...' :
                 'Connection is stable' }}
            </CardDescription>
          </div>
          <Badge 
            :variant="connectionStatus === 'connected' ? 'default' : 'destructive'"
            class="text-xs"
          >
            {{ connectionStatus }}
          </Badge>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Recovery Progress -->
        <div v-if="isRecovering" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span>Recovery in progress...</span>
            <span>{{ Math.round(recoveryProgress) }}%</span>
          </div>
          <Progress :value="recoveryProgress" class="h-2" />
        </div>

        <!-- Connection Quality -->
        <div v-if="connectionQuality" class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Connection Quality</span>
          <Badge 
            :variant="connectionQuality === 'good' || connectionQuality === 'excellent' ? 'default' : 
                     connectionQuality === 'poor' ? 'destructive' : 'secondary'"
            class="text-xs"
          >
            {{ connectionQuality }}
          </Badge>
        </div>

        <!-- Pending Operations -->
        <div v-if="pendingOperationsCount > 0" class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Pending Operations</span>
          <Badge variant="secondary" class="text-xs">
            {{ pendingOperationsCount }}
          </Badge>
        </div>

        <!-- Error Details -->
        <Alert v-if="syncStatus.errorMessage" variant="destructive" class="text-sm">
          <AlertTriangle class="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription>
            {{ syncStatus.errorMessage }}
          </AlertDescription>
        </Alert>

        <!-- Failed Operations List -->
        <div v-if="failedOperationsList.length > 0" class="space-y-2">
          <Separator />
          <div class="text-sm font-medium">Failed Operations</div>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            <div 
              v-for="operation in failedOperationsList" 
              :key="operation.id"
              class="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs"
            >
              <component 
                :is="getOperationIcon(operation.type)" 
                class="h-3 w-3 text-muted-foreground" 
              />
              <span class="flex-1">{{ getOperationDescription(operation) }}</span>
              <span class="text-muted-foreground">
                {{ formatErrorTime(operation.failedAt) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Last Recovery Attempt -->
        <div v-if="lastRecoveryAttempt" class="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock class="h-3 w-3" />
          <span>Last attempt: {{ formatErrorTime(lastRecoveryAttempt) }}</span>
        </div>
      </CardContent>

      <CardFooter class="pt-3 gap-2 flex-wrap">
        <!-- Primary Actions -->
        <Button
          v-if="connectionStatus === 'offline' || connectionStatus === 'error'"
          @click="retryConnection"
          :disabled="isRecovering"
          size="sm"
          class="flex-1"
        >
          <RefreshCw :class="['h-3 w-3 mr-1', { 'animate-spin': isRecovering }]" />
          {{ isRecovering ? 'Retrying...' : 'Retry Connection' }}
        </Button>

        <Button
          v-if="failedOperationsList.length > 0"
          @click="retryFailedOperations"
          :disabled="isRecovering"
          size="sm"
          variant="outline"
          class="flex-1"
        >
          <RefreshCw :class="['h-3 w-3 mr-1', { 'animate-spin': isRecovering }]" />
          Retry Failed ({{ failedOperationsList.length }})
        </Button>

        <!-- Secondary Actions -->
        <div class="w-full flex gap-2">
          <Button
            @click="forceFullSync"
            :disabled="isRecovering"
            size="sm"
            variant="outline"
            class="flex-1"
          >
            Force Sync
          </Button>

          <Button
            v-if="failedOperationsList.length > 0"
            @click="clearFailedOperations"
            :disabled="isRecovering"
            size="sm"
            variant="ghost"
            class="flex-1"
          >
            Clear Failed
          </Button>
        </div>

        <!-- Dismiss Button -->
        <Button
          @click="emit('update:visible', false)"
          size="sm"
          variant="ghost"
          class="w-full mt-2"
        >
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped>
.error-recovery-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  width: 90%;
  max-width: 400px;
}

/* Animation classes */
.error-recovery-panel {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border-l-4 {
    border-left-width: 6px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-spin,
  .error-recovery-panel {
    animation: none;
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .error-recovery-panel {
    width: 95%;
    top: auto;
    bottom: 20px;
    transform: translateX(-50%);
  }
}
</style>