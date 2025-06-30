<template>
  <div class="batch-generation-manager">
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Package class="h-5 w-5" />
          Batch Operations Queue
          <Badge v-if="operations.length > 0" variant="outline">
            {{ operations.length }} operations
          </Badge>
        </CardTitle>
        
        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            Manage and monitor batch document generation operations
          </div>
          
          <div class="queue-controls">
            <Button
              @click="pauseAllOperations"
              size="sm"
              variant="outline"
              :disabled="!hasActiveOperations"
            >
              <Pause class="h-3 w-3 mr-2" />
              Pause All
            </Button>
            
            <Button
              @click="clearCompletedOperations"
              size="sm"
              variant="outline"
              :disabled="!hasCompletedOperations"
            >
              <Trash2 class="h-3 w-3 mr-2" />
              Clear Completed
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div class="space-y-4">
          <!-- Queue Summary -->
          <div class="queue-summary">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div class="stat">
                <div class="text-2xl font-bold text-blue-600">{{ queueStats.queued }}</div>
                <div class="text-xs text-muted-foreground">Queued</div>
              </div>
              <div class="stat">
                <div class="text-2xl font-bold text-yellow-600">{{ queueStats.processing }}</div>
                <div class="text-xs text-muted-foreground">Processing</div>
              </div>
              <div class="stat">
                <div class="text-2xl font-bold text-green-600">{{ queueStats.completed }}</div>
                <div class="text-xs text-muted-foreground">Completed</div>
              </div>
              <div class="stat">
                <div class="text-2xl font-bold text-red-600">{{ queueStats.failed }}</div>
                <div class="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          </div>

          <!-- Operations List -->
          <div class="operations-list">
            <div v-if="operations.length === 0" class="empty-state">
              <div class="text-center py-12">
                <Package class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 class="text-lg font-medium mb-2">No Batch Operations</h3>
                <p class="text-muted-foreground mb-4">
                  Batch operations will appear here when you start generating multiple documents
                </p>
              </div>
            </div>
            
            <div v-else class="space-y-3">
              <div 
                v-for="operation in sortedOperations"
                :key="operation.id"
                class="operation-item"
              >
                <Card class="operation-card">
                  <CardContent class="p-4">
                    <div class="flex items-start gap-4">
                      <!-- Status Icon -->
                      <div class="status-icon mt-1">
                        <Loader2 
                          v-if="operation.status === 'processing'" 
                          class="h-5 w-5 animate-spin text-blue-500" 
                        />
                        <CheckCircle 
                          v-else-if="operation.status === 'completed'" 
                          class="h-5 w-5 text-green-500" 
                        />
                        <XCircle 
                          v-else-if="operation.status === 'failed'" 
                          class="h-5 w-5 text-red-500" 
                        />
                        <Pause 
                          v-else-if="operation.status === 'paused'" 
                          class="h-5 w-5 text-yellow-500" 
                        />
                        <Clock 
                          v-else 
                          class="h-5 w-5 text-gray-500" 
                        />
                      </div>
                      
                      <!-- Operation Details -->
                      <div class="flex-1 min-w-0">
                        <div class="operation-header">
                          <div class="flex items-center gap-2 mb-1">
                            <h4 class="font-medium text-sm">{{ operation.name }}</h4>
                            <Badge :variant="getStatusVariant(operation.status)">
                              {{ operation.status }}
                            </Badge>
                          </div>
                          
                          <div class="text-xs text-muted-foreground mb-2">
                            {{ operation.totalItems }} documents • 
                            {{ operation.templateIds?.length || 0 }} templates • 
                            {{ operation.matterIds?.length || 0 }} matters
                          </div>
                        </div>
                        
                        <!-- Progress Bar -->
                        <div class="operation-progress mb-3">
                          <div class="flex items-center justify-between text-xs mb-1">
                            <span>
                              {{ operation.completedItems }}/{{ operation.totalItems }}
                              <span v-if="operation.failedItems > 0" class="text-red-500">
                                ({{ operation.failedItems }} failed)
                              </span>
                            </span>
                            <span class="text-muted-foreground">
                              {{ Math.round((operation.completedItems / operation.totalItems) * 100) }}%
                            </span>
                          </div>
                          
                          <Progress 
                            :value="(operation.completedItems / operation.totalItems) * 100"
                            :class="getProgressClass(operation.status)"
                            class="h-2"
                          />
                        </div>
                        
                        <!-- Timing Information -->
                        <div class="operation-timing">
                          <div class="grid grid-cols-2 gap-4 text-xs">
                            <div v-if="operation.startedAt">
                              <span class="text-muted-foreground">Started:</span>
                              <span class="ml-1">{{ formatDateTime(operation.startedAt) }}</span>
                            </div>
                            
                            <div v-if="operation.estimatedCompletion">
                              <span class="text-muted-foreground">ETA:</span>
                              <span class="ml-1">{{ formatDateTime(operation.estimatedCompletion) }}</span>
                            </div>
                            
                            <div v-if="operation.completedAt">
                              <span class="text-muted-foreground">Completed:</span>
                              <span class="ml-1">{{ formatDateTime(operation.completedAt) }}</span>
                            </div>
                            
                            <div v-if="operation.duration">
                              <span class="text-muted-foreground">Duration:</span>
                              <span class="ml-1">{{ formatDuration(operation.duration) }}</span>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Error Message -->
                        <Alert 
                          v-if="operation.error" 
                          variant="destructive" 
                          class="mt-3"
                        >
                          <AlertTriangle class="h-4 w-4" />
                          <AlertTitle>Operation Failed</AlertTitle>
                          <AlertDescription>
                            {{ operation.error }}
                          </AlertDescription>
                        </Alert>
                      </div>
                      
                      <!-- Action Buttons -->
                      <div class="operation-actions">
                        <div class="flex flex-col gap-2">
                          <!-- Primary Actions -->
                          <Button
                            v-if="operation.status === 'processing'"
                            @click="pauseOperation(operation.id)"
                            size="sm"
                            variant="outline"
                          >
                            <Pause class="h-3 w-3 mr-2" />
                            Pause
                          </Button>
                          
                          <Button
                            v-else-if="operation.status === 'paused'"
                            @click="resumeOperation(operation.id)"
                            size="sm"
                            variant="outline"
                          >
                            <Play class="h-3 w-3 mr-2" />
                            Resume
                          </Button>
                          
                          <Button
                            v-else-if="operation.status === 'failed'"
                            @click="retryOperation(operation.id)"
                            size="sm"
                            variant="outline"
                          >
                            <RotateCcw class="h-3 w-3 mr-2" />
                            Retry
                          </Button>
                          
                          <Button
                            v-else-if="operation.status === 'completed'"
                            @click="downloadResults(operation.id)"
                            size="sm"
                            variant="outline"
                          >
                            <Download class="h-3 w-3 mr-2" />
                            Download All
                          </Button>
                          
                          <!-- Secondary Actions -->
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal class="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem @click="viewOperationDetails(operation.id)">
                                <Eye class="h-3 w-3 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem @click="duplicateOperation(operation.id)">
                                <Copy class="h-3 w-3 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                @click="cancelOperation(operation.id)"
                                class="text-red-600"
                                :disabled="operation.status === 'completed'"
                              >
                                <X class="h-3 w-3 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Package, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Pause,
  Play,
  RotateCcw,
  Download,
  MoreHorizontal,
  Eye,
  Copy,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-vue-next'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

// Utils
import { formatDateTime } from '~/utils/helpers'
import { formatDuration } from '~/utils/formatters'

// Types
interface BatchOperation {
  id: string
  name: string
  templateIds: string[]
  matterIds: string[]
  format: string
  totalItems: number
  completedItems: number
  failedItems: number
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused'
  startedAt?: Date
  completedAt?: Date
  estimatedCompletion?: Date
  duration?: number
  error?: string
}

// Props
interface Props {
  operations: BatchOperation[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  cancel: [operationId: string]
  retry: [operationId: string]
  pause: [operationId: string]
  resume: [operationId: string]
  duplicate: [operationId: string]
  download: [operationId: string]
  viewDetails: [operationId: string]
}>()

// Computed
const sortedOperations = computed(() => {
  return [...props.operations].sort((a, b) => {
    // Sort by status priority: processing > queued > failed > paused > completed > cancelled
    const statusPriority = {
      processing: 1,
      queued: 2,
      failed: 3,
      paused: 4,
      completed: 5,
      cancelled: 6
    }
    
    const aPriority = statusPriority[a.status] || 7
    const bPriority = statusPriority[b.status] || 7
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    // Within same status, sort by start time (newest first)
    const aTime = a.startedAt?.getTime() || 0
    const bTime = b.startedAt?.getTime() || 0
    return bTime - aTime
  })
})

const queueStats = computed(() => {
  return props.operations.reduce((stats, op) => {
    switch (op.status) {
      case 'queued':
        stats.queued++
        break
      case 'processing':
        stats.processing++
        break
      case 'completed':
        stats.completed++
        break
      case 'failed':
        stats.failed++
        break
    }
    return stats
  }, { queued: 0, processing: 0, completed: 0, failed: 0 })
})

const hasActiveOperations = computed(() => {
  return props.operations.some(op => 
    op.status === 'processing' || op.status === 'queued'
  )
})

const hasCompletedOperations = computed(() => {
  return props.operations.some(op => 
    op.status === 'completed' || op.status === 'cancelled'
  )
})

// Methods
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'processing': return 'default'
    case 'completed': return 'default' // success variant doesn't exist
    case 'failed': return 'destructive'
    case 'paused': return 'secondary' // warning variant doesn't exist
    case 'cancelled': return 'secondary'
    default: return 'outline'
  }
}

const getProgressClass = (status: string) => {
  switch (status) {
    case 'completed': return 'progress-success'
    case 'failed': return 'progress-error'
    case 'paused': return 'progress-warning'
    default: return ''
  }
}

const pauseOperation = (operationId: string) => {
  emit('pause', operationId)
}

const resumeOperation = (operationId: string) => {
  emit('resume', operationId)
}

const retryOperation = (operationId: string) => {
  emit('retry', operationId)
}

const cancelOperation = (operationId: string) => {
  emit('cancel', operationId)
}

const duplicateOperation = (operationId: string) => {
  emit('duplicate', operationId)
}

const downloadResults = (operationId: string) => {
  emit('download', operationId)
}

const viewOperationDetails = (operationId: string) => {
  emit('viewDetails', operationId)
}

const pauseAllOperations = () => {
  props.operations
    .filter(op => op.status === 'processing' || op.status === 'queued')
    .forEach(op => pauseOperation(op.id))
}

const clearCompletedOperations = () => {
  // This would typically call a parent method to remove completed operations
  console.log('Clear completed operations')
}
</script>

<style scoped>
.batch-generation-manager {
  @apply w-full;
}

.queue-controls {
  @apply flex items-center gap-2;
}

.queue-summary .stat {
  @apply text-center;
}

.operations-list {
  @apply space-y-3;
}

.operation-item {
  @apply relative;
}

.operation-card {
  @apply border-l-4 border-l-transparent transition-all duration-200;
}

.operation-card:has(.status-icon .animate-spin) {
  @apply border-l-blue-500;
}

.operation-card:has(.text-green-500) {
  @apply border-l-green-500;
}

.operation-card:has(.text-red-500) {
  @apply border-l-red-500;
}

.operation-card:has(.text-yellow-500) {
  @apply border-l-yellow-500;
}

.status-icon {
  @apply flex-shrink-0;
}

.operation-header {
  @apply space-y-1;
}

.operation-progress {
  @apply space-y-1;
}

.operation-timing {
  @apply space-y-2;
}

.operation-actions {
  @apply flex-shrink-0;
}

.empty-state {
  @apply border-2 border-dashed border-muted-foreground/25 rounded-lg;
}

/* Progress bar variants */
:deep(.progress-success .progress-indicator) {
  @apply bg-green-500;
}

:deep(.progress-error .progress-indicator) {
  @apply bg-red-500;
}

:deep(.progress-warning .progress-indicator) {
  @apply bg-yellow-500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .queue-summary .grid {
    @apply grid-cols-2;
  }
  
  .operation-card .flex {
    @apply flex-col gap-3;
  }
  
  .operation-actions {
    @apply w-full;
  }
  
  .operation-actions .flex {
    @apply flex-row justify-end;
  }
  
  .queue-controls {
    @apply flex-col gap-1;
  }
}

/* Animation for status changes */
.operation-card {
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.operation-card:hover {
  @apply shadow-md;
}

/* Print styles */
@media print {
  .operation-actions,
  .queue-controls {
    @apply hidden;
  }
}
</style>