<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, RefreshCw, Mail } from 'lucide-vue-next'
import { Button } from '~/foundation/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '~/foundation/components/ui/alert'
import LoadingButton from './LoadingButton.vue'

const { t } = useI18n()

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
  showRetry: true,
  showSupport: false
})

const emit = defineEmits<{
  retry: []
}>()

const isRetrying = ref(false)

const displayTitle = computed(() => {
  return props.title || t('foundation.messages.error.default')
})

const displayRetryLabel = computed(() => {
  return props.retryLabel || t('foundation.actions.system.retry')
})

const errorMessage = computed(() => {
  if (typeof props.error === 'string') {
    return props.error
  }
  return props.error?.message || t('foundation.messages.info.unknownError')
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
    <AlertTitle>{{ displayTitle }}</AlertTitle>
    <AlertDescription class="mt-2">
      <p class="mb-4">{{ errorMessage }}</p>
      
      <div class="flex flex-wrap gap-2">
        <LoadingButton
          v-if="showRetry"
          :loading="isRetrying"
          variant="outline"
          size="sm"
          :loading-text="t('foundation.messages.info.retrying')"
          @click="handleRetry"
        >
          <RefreshCw class="mr-2 h-4 w-4" />
          {{ displayRetryLabel }}
        </LoadingButton>
        
        <Button
          variant="outline"
          size="sm"
          @click="handleReload"
        >
          <RefreshCw class="mr-2 h-4 w-4" />
          {{ t('foundation.actions.system.reload') }}
        </Button>
        
        <Button
          v-if="showSupport"
          variant="ghost"
          size="sm"
          @click="handleSupport"
        >
          <Mail class="mr-2 h-4 w-4" />
          {{ t('foundation.common.app.support') }}
        </Button>
      </div>
    </AlertDescription>
  </Alert>
</template>