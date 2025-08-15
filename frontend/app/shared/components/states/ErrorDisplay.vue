<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, RefreshCw, Mail } from 'lucide-vue-next'
import { Button } from '@ui/button/index'
import { Alert, AlertDescription, AlertTitle } from '@ui/alert'
import LoadingButton from './LoadingButton.vue'

interface ErrorDisplayProps {
  error: Error | string
  title?: string
  showRetry?: boolean
  showSupport?: boolean
  retryLabel?: string
  onRetry?: () => void | Promise<void>
  supportEmail?: string
  class?: string
}

const props = withDefaults(defineProps<ErrorDisplayProps>(), {
  title: 'エラーが発生しました',
  showRetry: true,
  showSupport: false,
  retryLabel: '再試行'
})

const emit = defineEmits<{
  retry: []
}>()

const isRetrying = ref(false)

const errorMessage = computed(() => {
  if (typeof props.error === 'string') {
    return props.error
  }
  return props.error?.message || 'Unknown error occurred'
})

const handleRetry = async () => {
  if (props.onRetry) {
    try {
      isRetrying.value = true
      await props.onRetry()
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      isRetrying.value = false
    }
  }
  emit('retry')
}

const handleSupport = () => {
  if (props.supportEmail) {
    const subject = encodeURIComponent('Application Error Report')
    const body = encodeURIComponent(`Error: ${errorMessage.value}\nTimestamp: ${new Date().toISOString()}`)
    window.open(`mailto:${props.supportEmail}?subject=${subject}&body=${body}`)
  }
}

const handleReload = () => {
  window.location.reload()
}
</script>

<template>
  <Alert variant="destructive" :class="props.class">
    <AlertTriangle class="h-4 w-4" />
    <AlertTitle>{{ title }}</AlertTitle>
    <AlertDescription class="mt-2">
      <p class="mb-4">{{ errorMessage }}</p>
      
      <div class="flex flex-wrap gap-2">
        <LoadingButton
          v-if="showRetry"
          :loading="isRetrying"
          variant="outline"
          size="sm"
          :loading-text="'再試行中...'"
          @click="handleRetry"
        >
          <RefreshCw class="mr-2 h-4 w-4" />
          {{ retryLabel }}
        </LoadingButton>
        
        <Button
          variant="outline"
          size="sm"
          @click="handleReload"
        >
          <RefreshCw class="mr-2 h-4 w-4" />
          ページを再読み込み
        </Button>
        
        <Button
          v-if="showSupport"
          variant="ghost"
          size="sm"
          @click="handleSupport"
        >
          <Mail class="mr-2 h-4 w-4" />
          サポートに連絡
        </Button>
      </div>
    </AlertDescription>
  </Alert>
</template>