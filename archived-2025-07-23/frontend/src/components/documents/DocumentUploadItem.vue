<script setup lang="ts">
import { computed } from 'vue'
import { 
  FileText, 
  Image, 
  X, 
  Pause, 
  Play, 
  RotateCw, 
  CheckCircle, 
  AlertCircle,
  File
} from 'lucide-vue-next'
import type { UploadItem } from '~/types/document'
import { 
  formatFileSize, 
  formatUploadSpeed, 
  formatTimeRemaining,
  getFileIcon 
} from '~/schemas/document'
import { Progress } from '~/components/ui/progress'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface Props {
  item: UploadItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  pause: [id: string]
  resume: [id: string]
  retry: [id: string]
  cancel: [id: string]
  remove: [id: string]
}>()

// Computed properties
const fileIcon = computed(() => {
  const iconName = getFileIcon(props.item.file.type)
  
  switch (iconName) {
    case 'FileText':
      return FileText
    case 'Image':
      return Image
    default:
      return File
  }
})

const statusColor = computed(() => {
  switch (props.item.status) {
    case 'completed':
      return 'text-green-600'
    case 'failed':
      return 'text-destructive'
    case 'uploading':
      return 'text-primary'
    case 'paused':
      return 'text-orange-500'
    case 'cancelled':
      return 'text-muted-foreground'
    default:
      return 'text-muted-foreground'
  }
})

const statusText = computed(() => {
  switch (props.item.status) {
    case 'pending':
      return 'Waiting...'
    case 'uploading':
      return `Uploading... ${props.item.progress}%`
    case 'completed':
      return 'Upload complete'
    case 'failed':
      return props.item.error || 'Upload failed'
    case 'paused':
      return 'Paused'
    case 'cancelled':
      return 'Cancelled'
    default:
      return ''
  }
})

const showProgress = computed(() => 
  ['uploading', 'paused'].includes(props.item.status)
)

const canRetry = computed(() => 
  props.item.status === 'failed'
)

const canPause = computed(() => 
  props.item.status === 'uploading'
)

const canResume = computed(() => 
  props.item.status === 'paused'
)

const canRemove = computed(() => 
  ['completed', 'failed', 'cancelled'].includes(props.item.status)
)
</script>

<template>
  <div class="upload-item border rounded-lg p-4 space-y-3 transition-all duration-200 hover:shadow-sm">
    <div class="flex items-start gap-3">
      <!-- File icon -->
      <div class="flex-shrink-0">
        <component 
          :is="fileIcon" 
          class="w-10 h-10 text-muted-foreground"
        />
      </div>
      
      <!-- File info -->
      <div class="flex-1 min-w-0 space-y-1">
        <h4 class="font-medium text-sm truncate" :title="item.file.name">
          {{ item.file.name }}
        </h4>
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{{ formatFileSize(item.file.size) }}</span>
          <span v-if="item.status === 'uploading' && item.speed && item.speed > 0">
            • {{ formatUploadSpeed(item.speed) }}
          </span>
          <span v-if="item.status === 'uploading' && item.timeRemaining">
            • {{ formatTimeRemaining(item.timeRemaining) }} remaining
          </span>
        </div>
        <p :class="[statusColor, 'text-xs font-medium']">
          {{ statusText }}
        </p>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center gap-1">
        <!-- Pause/Resume -->
        <Button
          v-if="canPause"
          size="icon"
          variant="ghost"
          @click="emit('pause', item.id)"
          title="Pause upload"
        >
          <Pause class="w-4 h-4" />
        </Button>
        
        <Button
          v-if="canResume"
          size="icon"
          variant="ghost"
          @click="emit('resume', item.id)"
          title="Resume upload"
        >
          <Play class="w-4 h-4" />
        </Button>
        
        <!-- Retry -->
        <Button
          v-if="canRetry"
          size="icon"
          variant="ghost"
          @click="emit('retry', item.id)"
          title="Retry upload"
        >
          <RotateCw class="w-4 h-4" />
        </Button>
        
        <!-- Cancel/Remove -->
        <Button
          v-if="item.status === 'uploading' || item.status === 'pending'"
          size="icon"
          variant="ghost"
          @click="emit('cancel', item.id)"
          title="Cancel upload"
        >
          <X class="w-4 h-4" />
        </Button>
        
        <Button
          v-else-if="canRemove"
          size="icon"
          variant="ghost"
          @click="emit('remove', item.id)"
          title="Remove from list"
        >
          <X class="w-4 h-4" />
        </Button>
      </div>
    </div>
    
    <!-- Progress bar -->
    <div v-if="showProgress" class="space-y-1">
      <Progress 
        :value="item.progress" 
        :class="cn('h-2', item.status === 'paused' && 'opacity-50')"
      />
      <div class="flex justify-between text-xs text-muted-foreground">
        <span>{{ item.progress }}%</span>
        <span>
          {{ formatFileSize(item.progress * item.file.size / 100) }} / 
          {{ formatFileSize(item.file.size) }}
        </span>
      </div>
    </div>
    
    <!-- Status icons -->
    <div v-if="item.status === 'completed'" class="flex items-center gap-2 text-xs text-green-600">
      <CheckCircle class="w-4 h-4" />
      <span>Upload complete</span>
    </div>
    
    <div v-if="item.status === 'failed'" class="flex items-center gap-2 text-xs text-destructive">
      <AlertCircle class="w-4 h-4" />
      <span>{{ item.error || 'Upload failed' }}</span>
      <span v-if="item.retryCount && item.retryCount > 0" class="text-muted-foreground">
        (Retry {{ item.retryCount }}/3)
      </span>
    </div>
  </div>
</template>

<style scoped>
.upload-item {
  @apply bg-card;
}

.upload-item:hover {
  @apply border-muted-foreground/30;
}

/* Add subtle animation for status changes */
.upload-item {
  transition: all 0.2s ease;
}

/* Pulse animation for uploading items */
.upload-item:has(.text-primary) {
  @apply animate-pulse;
  animation-duration: 3s;
}
</style>