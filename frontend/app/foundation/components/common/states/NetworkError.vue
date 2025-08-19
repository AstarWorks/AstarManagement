<script setup lang="ts">
import { computed } from 'vue'
import { WifiOff, RefreshCw } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '~/foundation/components/ui/alert'
import LoadingButton from './LoadingButton.vue'

const { t } = useI18n()

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
    return t('foundation.messages.error.network.disconnected')
  }
  
  if (typeof props.error === 'string') {
    return props.error
  }
  
  if (props.error?.message) {
    // Check for common network error patterns
    const message = props.error.message.toLowerCase()
    if (message.includes('network') || message.includes('fetch')) {
      return t('foundation.messages.error.network.checkConnection')
    }
    if (message.includes('timeout')) {
      return t('foundation.messages.error.timeout.retry')
    }
    return props.error.message
  }
  
  return t('foundation.messages.error.network.default')
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
    <AlertTitle>{{ t('foundation.messages.error.network.default') }}</AlertTitle>
    <AlertDescription class="mt-2">
      <p class="mb-4">{{ errorMessage }}</p>
      
      <div v-if="!isOnline" class="mb-4 text-sm text-muted-foreground">
        <p>{{ t('foundation.messages.error.network.offlineAutoRetry') }}</p>
      </div>
      
      <div class="flex flex-wrap gap-2 items-center">
        <LoadingButton
          v-if="canRetry"
          :loading="isRetrying"
          variant="outline"
          size="sm"
          :loading-text="t('foundation.messages.info.retrying')"
          @click="handleRetry"
        >
          <RefreshCw class="mr-2 h-4 w-4" />
          {{ t('foundation.actions.system.retry') }} {{ `(${retryCount}/${maxRetries})` }}
        </LoadingButton>
        
        <span v-else-if="retryCount >= maxRetries" class="text-sm text-muted-foreground">
          {{ t('foundation.messages.error.network.maxRetriesReached') }}
        </span>
        
        <div v-if="!isOnline" class="flex items-center gap-1 text-sm text-muted-foreground">
          <div class="h-2 w-2 rounded-full bg-red-500" />
          {{ t('foundation.common.status.offline') }}
        </div>
        
        <div v-else class="flex items-center gap-1 text-sm text-muted-foreground">
          <div class="h-2 w-2 rounded-full bg-green-500" />
          {{ t('foundation.common.status.online') }}
        </div>
      </div>
    </AlertDescription>
  </Alert>
</template>