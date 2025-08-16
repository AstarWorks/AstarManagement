<script setup lang="ts">
import { computed } from 'vue'
import { WifiOff, RefreshCw } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '~/foundation/components/ui/alert'
import LoadingButton from './LoadingButton.vue'

interface NetworkErrorProps {
  error?: Error | string
  onRetry?: () => void | Promise<void>
  retryDelay?: number
  maxRetries?: number
  class?: string
}

const props = withDefaults(defineProps<NetworkErrorProps>(), {
  retryDelay: 1000,
  maxRetries: 3
})

const emit = defineEmits<{
  retry: []
}>()

const isRetrying = ref(false)
const retryCount = ref(0)
const isOnline = ref(navigator.onLine)

// Monitor network status
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

const errorMessage = computed(() => {
  if (!isOnline.value) {
    return 'インターネット接続が切断されています。接続を確認してください。'
  }
  
  if (typeof props.error === 'string') {
    return props.error
  }
  
  if (props.error?.message) {
    // Check for common network error patterns
    const message = props.error.message.toLowerCase()
    if (message.includes('network') || message.includes('fetch')) {
      return 'ネットワークエラーが発生しました。接続を確認してください。'
    }
    if (message.includes('timeout')) {
      return 'リクエストがタイムアウトしました。しばらく待ってから再試行してください。'
    }
    return props.error.message
  }
  
  return 'ネットワークエラーが発生しました。'
})

const canRetry = computed(() => {
  return retryCount.value < props.maxRetries && isOnline.value
})

const handleRetry = async () => {
  if (!canRetry.value) return
  
  try {
    isRetrying.value = true
    retryCount.value++
    
    // Add exponential backoff delay
    if (retryCount.value > 1) {
      const delay = props.retryDelay * Math.pow(2, retryCount.value - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    if (props.onRetry) {
      await props.onRetry()
    }
    
    emit('retry')
    
    // Reset retry count on success
    retryCount.value = 0
  } catch (error) {
    console.error('Network retry failed:', error)
  } finally {
    isRetrying.value = false
  }
}

// Auto-retry when coming back online
watch(isOnline, (online) => {
  if (online && retryCount.value > 0) {
    handleRetry()
  }
})
</script>

<template>
  <Alert variant="destructive" :class="props.class">
    <WifiOff class="h-4 w-4" />
    <AlertTitle>ネットワークエラー</AlertTitle>
    <AlertDescription class="mt-2">
      <p class="mb-4">{{ errorMessage }}</p>
      
      <div v-if="!isOnline" class="mb-4 text-sm text-muted-foreground">
        <p>オフライン状態です。インターネット接続が復旧すると自動的に再試行します。</p>
      </div>
      
      <div class="flex flex-wrap gap-2 items-center">
        <LoadingButton
          v-if="canRetry"
          :loading="isRetrying"
          variant="outline"
          size="sm"
          :loading-text="'再試行中...'"
          @click="handleRetry"
        >
          <RefreshCw class="mr-2 h-4 w-4" />
          再試行 ({{ retryCount }}/{{ maxRetries }})
        </LoadingButton>
        
        <span v-else-if="retryCount >= maxRetries" class="text-sm text-muted-foreground">
          最大再試行回数に達しました
        </span>
        
        <div v-if="!isOnline" class="flex items-center gap-1 text-sm text-muted-foreground">
          <div class="h-2 w-2 rounded-full bg-red-500" />
          オフライン
        </div>
        
        <div v-else class="flex items-center gap-1 text-sm text-muted-foreground">
          <div class="h-2 w-2 rounded-full bg-green-500" />
          オンライン
        </div>
      </div>
    </AlertDescription>
  </Alert>
</template>