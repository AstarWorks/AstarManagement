<template>
  <Card class="generation-progress-tracker">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <component 
          :is="statusIcon" 
          :class="['h-5 w-5', statusIconClass]" 
        />
        Generation Progress
        <Badge v-if="jobProgress?.status" :variant="statusVariant">
          {{ jobProgress.status }}
        </Badge>
      </CardTitle>
      
      <div class="text-sm text-muted-foreground">
        Job ID: {{ jobId }}
      </div>
    </CardHeader>
    
    <CardContent>
      <div class="space-y-4">
        <!-- Overall Progress -->
        <div class="overall-progress">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">Overall Progress</span>
            <span class="text-sm text-muted-foreground">
              {{ jobProgress?.completedSteps || 0 }}/{{ jobProgress?.totalSteps || 0 }}
            </span>
          </div>
          <Progress 
            :value="jobProgress?.overallProgress || 0" 
            class="h-3"
            :class="progressClass"
          />
          <div class="text-xs text-muted-foreground mt-1">
            {{ Math.round(jobProgress?.overallProgress || 0) }}% complete
          </div>
        </div>
        
        <!-- Current Step -->
        <div v-if="jobProgress?.currentStep" class="current-step">
          <div class="flex items-center gap-2 mb-2">
            <Loader2 
              v-if="jobProgress.status === 'processing'"
              class="h-4 w-4 animate-spin text-blue-500" 
            />
            <CheckCircle
              v-else-if="jobProgress.status === 'completed'"
              class="h-4 w-4 text-green-500"
            />
            <XCircle
              v-else-if="jobProgress.status === 'failed'"
              class="h-4 w-4 text-red-500"
            />
            <Clock
              v-else
              class="h-4 w-4 text-gray-500"
            />
            <span class="text-sm font-medium">{{ jobProgress.currentStep.name }}</span>
          </div>
          
          <Progress 
            :value="jobProgress.currentStep.progress || 0" 
            class="h-2" 
          />
          
          <div class="text-xs text-muted-foreground mt-1">
            {{ jobProgress.currentStep.description || 'Processing...' }}
          </div>
        </div>
        
        <!-- Step Details -->
        <div v-if="showDetails && jobProgress?.steps" class="step-details">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">Step Details</span>
            <Button
              @click="toggleDetailsExpanded"
              size="sm"
              variant="ghost"
            >
              <ChevronDown 
                :class="['h-3 w-3', { 'rotate-180': detailsExpanded }]" 
              />
            </Button>
          </div>
          
          <div 
            v-if="detailsExpanded"
            class="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3"
          >
            <div 
              v-for="step in jobProgress.steps"
              :key="step.id"
              class="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded"
            >
              <CheckCircle 
                v-if="step.status === 'completed'" 
                class="h-3 w-3 text-green-500 flex-shrink-0" 
              />
              <Loader2 
                v-else-if="step.status === 'processing'" 
                class="h-3 w-3 animate-spin text-blue-500 flex-shrink-0" 
              />
              <XCircle 
                v-else-if="step.status === 'failed'" 
                class="h-3 w-3 text-red-500 flex-shrink-0" 
              />
              <Clock 
                v-else 
                class="h-3 w-3 text-gray-500 flex-shrink-0" 
              />
              
              <span class="flex-1 font-medium">{{ step.name }}</span>
              
              <div class="text-right">
                <div class="text-muted-foreground">
                  {{ step.duration || '-' }}
                </div>
                <div v-if="step.progress !== undefined" class="text-blue-600">
                  {{ step.progress }}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- ETA and Performance Stats -->
        <div class="eta-stats">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div v-if="jobProgress?.estimatedCompletion">
              <div class="text-muted-foreground">ETA</div>
              <div class="font-medium">
                {{ formatDateTime(jobProgress.estimatedCompletion) }}
              </div>
            </div>
            
            <div v-if="jobProgress?.elapsedTime">
              <div class="text-muted-foreground">Elapsed</div>
              <div class="font-medium">
                {{ formatDuration(jobProgress.elapsedTime) }}
              </div>
            </div>
            
            <div v-if="jobProgress?.documentsProcessed !== undefined">
              <div class="text-muted-foreground">Documents</div>
              <div class="font-medium">
                {{ jobProgress.documentsProcessed }}/{{ jobProgress.totalDocuments || 1 }}
              </div>
            </div>
            
            <div v-if="jobProgress?.averageTimePerDocument">
              <div class="text-muted-foreground">Avg Time</div>
              <div class="font-medium">
                {{ formatDuration(jobProgress.averageTimePerDocument) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Error Details -->
        <Alert v-if="jobProgress?.error" variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription>
            {{ jobProgress.error }}
            <div class="mt-2 space-x-2">
              <Button
                @click="retryJob"
                size="sm"
                variant="outline"
              >
                <RotateCcw class="h-3 w-3 mr-2" />
                Retry
              </Button>
              <Button
                @click="showErrorDetails = !showErrorDetails"
                size="sm"
                variant="ghost"
              >
                {{ showErrorDetails ? 'Hide' : 'Show' }} Details
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        
        <!-- Error Details Expanded -->
        <div v-if="showErrorDetails && jobProgress?.errorDetails" class="error-details">
          <pre class="text-xs bg-muted p-3 rounded overflow-auto max-h-32">{{ jobProgress.errorDetails }}</pre>
        </div>
        
        <!-- Action Buttons -->
        <div v-if="!jobProgress?.error" class="action-buttons">
          <div class="flex items-center gap-2">
            <Button
              v-if="jobProgress?.status === 'processing'"
              @click="cancelJob"
              size="sm"
              variant="outline"
            >
              <X class="h-3 w-3 mr-2" />
              Cancel
            </Button>
            
            <Button
              v-if="jobProgress?.status === 'completed'"
              @click="downloadResult"
              size="sm"
              variant="outline"
            >
              <Download class="h-3 w-3 mr-2" />
              Download
            </Button>
            
            <Button
              v-if="jobProgress?.status === 'completed'"
              @click="viewResult"
              size="sm"
            >
              <Eye class="h-3 w-3 mr-2" />
              View
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Activity,
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  X,
  Download,
  Eye
} from 'lucide-vue-next'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

// Composables
import { useDocumentGeneration, trackJobProgress } from '~/composables/document-generation/useDocumentGeneration'
import { formatDateTime } from '~/utils/helpers'
import { formatDuration } from '~/utils/formatters'

// Props
interface Props {
  jobId: string
  showDetails?: boolean
  autoUpdate?: boolean
  updateInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  autoUpdate: true,
  updateInterval: 1000
})

// Emits
const emit = defineEmits<{
  completed: [jobId: string]
  failed: [jobId: string, error: string]
  cancelled: [jobId: string]
  progress: [jobId: string, progress: number]
}>()

// State
const detailsExpanded = ref(false)
const showErrorDetails = ref(false)

// Progress tracking
const { 
  cancelGenerationJob, 
  retryGenerationJob,
  downloadGenerationResult
} = useDocumentGeneration()

const {
  jobProgress,
  isConnected,
  error: trackingError,
  connect,
  disconnect
} = trackJobProgress(props.jobId)

// Real-time updates via Server-Sent Events (mocked)
let eventSource: EventSource | null = null

// Computed
const statusIcon = computed(() => {
  switch (jobProgress.value?.status) {
    case 'processing': return Loader2
    case 'completed': return CheckCircle
    case 'failed': return XCircle
    case 'cancelled': return X
    default: return Clock
  }
})

const statusIconClass = computed(() => {
  switch (jobProgress.value?.status) {
    case 'processing': return 'animate-spin text-blue-500'
    case 'completed': return 'text-green-500'
    case 'failed': return 'text-red-500'
    case 'cancelled': return 'text-gray-500'
    default: return 'text-gray-500'
  }
})

const statusVariant = computed(() => {
  switch (jobProgress.value?.status) {
    case 'processing': return 'default'
    case 'completed': return 'default' // success variant doesn't exist
    case 'failed': return 'destructive'
    case 'cancelled': return 'secondary'
    default: return 'outline'
  }
})

const progressClass = computed(() => {
  switch (jobProgress.value?.status) {
    case 'completed': return 'progress-success'
    case 'failed': return 'progress-error'
    default: return ''
  }
})

// Methods
const toggleDetailsExpanded = () => {
  detailsExpanded.value = !detailsExpanded.value
}

const retryJob = async () => {
  try {
    await retryGenerationJob(props.jobId)
    showErrorDetails.value = false
  } catch (error) {
    console.error('Failed to retry job:', error)
  }
}

const cancelJob = async () => {
  try {
    await cancelGenerationJob(props.jobId)
    emit('cancelled', props.jobId)
  } catch (error) {
    console.error('Failed to cancel job:', error)
  }
}

const downloadResult = async () => {
  try {
    await downloadGenerationResult(props.jobId)
  } catch (error) {
    console.error('Failed to download result:', error)
  }
}

const viewResult = () => {
  // Open result in new tab or modal
  window.open(`/documents/generated/${props.jobId}`, '_blank')
}

const startSSEConnection = () => {
  if (typeof EventSource === 'undefined') {
    console.warn('Server-Sent Events not supported')
    return
  }

  // Mock SSE connection - in real implementation, this would connect to backend
  eventSource = new EventSource(`/api/generation/${props.jobId}/progress`)
  
  eventSource.onmessage = (event) => {
    try {
      const progressData = JSON.parse(event.data)
      
      // Update progress state
      if (jobProgress.value) {
        Object.assign(jobProgress.value, progressData)
      }
      
      emit('progress', props.jobId, progressData.overallProgress || 0)
      
      // Check for completion
      if (progressData.status === 'completed') {
        emit('completed', props.jobId)
        stopSSEConnection()
      } else if (progressData.status === 'failed') {
        emit('failed', props.jobId, progressData.error || 'Generation failed')
        stopSSEConnection()
      }
    } catch (error) {
      console.error('Failed to parse SSE data:', error)
    }
  }
  
  eventSource.onerror = (event) => {
    console.error('SSE connection error:', event)
    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        startSSEConnection()
      }
    }, 5000)
  }
}

const stopSSEConnection = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

// Lifecycle
onMounted(() => {
  connect()
  
  if (props.autoUpdate) {
    startSSEConnection()
  }
})

onUnmounted(() => {
  disconnect()
  stopSSEConnection()
})
</script>

<style scoped>
.generation-progress-tracker {
  @apply w-full;
}

.overall-progress {
  @apply space-y-2;
}

.current-step {
  @apply space-y-2 p-3 bg-muted/30 rounded-lg;
}

.step-details {
  @apply space-y-2;
}

.eta-stats {
  @apply p-3 bg-muted/30 rounded-lg;
}

.error-details {
  @apply space-y-2;
}

.action-buttons {
  @apply pt-2 border-t;
}

/* Progress bar variants */
:deep(.progress-success .progress-indicator) {
  @apply bg-green-500;
}

:deep(.progress-error .progress-indicator) {
  @apply bg-red-500;
}

/* Animation for status changes */
.status-icon {
  transition: all 0.2s ease-in-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .eta-stats .grid {
    @apply grid-cols-1;
  }
  
  .action-buttons .flex {
    @apply flex-col gap-2;
  }
  
  .action-buttons .btn {
    @apply w-full;
  }
}

/* Print styles */
@media print {
  .action-buttons {
    @apply hidden;
  }
}
</style>