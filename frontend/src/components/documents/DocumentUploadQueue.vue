<script setup lang="ts">
import { computed } from 'vue'
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  X,
  RotateCw,
  Trash2
} from 'lucide-vue-next'
import { useDocumentUploadStore } from '~/stores/documentUpload'
import DocumentUploadItem from './DocumentUploadItem.vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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

const uploadStore = useDocumentUploadStore()

// Computed properties
const hasItems = computed(() => uploadStore.queue.length > 0)

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

const showClearCompleted = computed(() => 
  uploadStore.stats.completed > 0
)

const showRetryFailed = computed(() => 
  uploadStore.stats.failed > 0
)

const overallProgress = computed(() => {
  const { total, completed } = uploadStore.stats
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
})

// Handlers
const handlePause = (id: string) => {
  uploadStore.pauseUpload(id)
}

const handleResume = (id: string) => {
  uploadStore.resumeUpload(id)
}

const handleRetry = (id: string) => {
  uploadStore.retryUpload(id)
}

const handleCancel = (id: string) => {
  uploadStore.cancelUpload(id)
}

const handleRemove = (id: string) => {
  uploadStore.removeFromQueue(id)
}

const retryAllFailed = () => {
  const failedItems = uploadStore.queue.filter(item => item.status === 'failed')
  failedItems.forEach(item => uploadStore.retryUpload(item.id))
}

const clearCompleted = () => {
  uploadStore.clearCompleted()
}

const clearAll = () => {
  uploadStore.clearAll()
}
</script>

<template>
  <Card class="upload-queue">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle class="text-base font-medium flex items-center gap-2">
        <Upload class="w-4 h-4" />
        {{ queueTitle }}
      </CardTitle>
      
      <div class="flex items-center gap-2">
        <!-- Queue stats badges -->
        <Badge v-if="uploadStore.stats.uploading > 0" variant="default">
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
      <!-- Empty state -->
      <div v-if="!hasItems" class="text-center py-8">
        <Upload class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p class="text-sm text-muted-foreground">
          No files in upload queue
        </p>
      </div>
      
      <!-- Upload items -->
      <div v-else class="space-y-3">
        <!-- Active uploads first, then pending, then completed/failed -->
        <TransitionGroup name="queue-list" tag="div" class="space-y-3">
          <DocumentUploadItem
            v-for="item in uploadStore.queue"
            :key="item.id"
            :item="item"
            @pause="handlePause"
            @resume="handleResume"
            @retry="handleRetry"
            @cancel="handleCancel"
            @remove="handleRemove"
          />
        </TransitionGroup>
      </div>
      
      <!-- Queue actions -->
      <div v-if="hasItems" class="flex items-center justify-between pt-4 border-t">
        <div class="flex items-center gap-2">
          <Button
            v-if="showRetryFailed"
            size="sm"
            variant="outline"
            @click="retryAllFailed"
          >
            <RotateCw class="w-4 h-4 mr-2" />
            Retry Failed
          </Button>
          
          <Button
            v-if="showClearCompleted"
            size="sm"
            variant="outline"
            @click="clearCompleted"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Clear Completed
          </Button>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" class="text-destructive">
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
              <AlertDialogAction @click="clearAll" class="bg-destructive text-destructive-foreground">
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <!-- Overall progress -->
      <div v-if="uploadStore.hasActiveUploads || uploadStore.hasPendingUploads" class="pt-4 border-t">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-muted-foreground">Overall Progress</span>
          <span class="font-medium">{{ overallProgress }}%</span>
        </div>
        <Progress :value="overallProgress" class="h-2" />
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Queue list transitions */
.queue-list-move,
.queue-list-enter-active,
.queue-list-leave-active {
  transition: all 0.3s ease;
}

.queue-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.queue-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.queue-list-leave-active {
  position: absolute;
  width: 100%;
}
</style>