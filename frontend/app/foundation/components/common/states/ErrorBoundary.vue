<script setup lang="ts">
import { ref, onErrorCaptured, provide, watchEffect, toValue, type Component } from 'vue'
import ErrorDisplay from './ErrorDisplay.vue'

interface ErrorBoundaryProps {
  fallback?: Component
  onError?: (error: Error, instance: unknown) => void
  resetKeys?: unknown[]
  resetOnPropsChange?: boolean
}

const props = withDefaults(defineProps<ErrorBoundaryProps>(), {
  resetOnPropsChange: true
})

const hasError = ref(false)
const error = ref<Error | null>(null)
const errorInfo = ref<string | null>(null)

// Reset error state when resetKeys change
if (props.resetKeys) {
  watchEffect(() => {
    // Watch resetKeys and reset error state when they change
    const keys = toValue(props.resetKeys)
    if (keys && !hasError.value) return
    
    resetError()
  })
}

// Reset error state when any prop changes (if enabled)
if (props.resetOnPropsChange) {
  watchEffect(() => {
    if (!hasError.value) return
    resetError()
  })
}

function resetError() {
  hasError.value = false
  error.value = null
  errorInfo.value = null
}

function handleRetry() {
  resetError()
}

// Vue 3's error boundary implementation
onErrorCaptured((err: Error, instance, info: string) => {
  console.error('[ErrorBoundary] Caught error:', { error: err, instance, info })
  
  hasError.value = true
  error.value = err
  errorInfo.value = info
  
  // Call the onError callback if provided
  props.onError?.(err, instance)
  
  // Return false to prevent the error from propagating further
  return false
})

// Provide reset function to child components
provide('errorBoundaryReset', resetError)
</script>

<template>
  <div>
    <!-- Error state -->
    <div v-if="hasError">
      <!-- Custom fallback component -->
      <component
        :is="fallback"
        v-if="fallback"
        :error="error"
        :error-info="errorInfo"
        :retry="handleRetry"
      />
      
      <!-- Default error display -->
      <ErrorDisplay
        v-else
        :error="error?.message || 'An unexpected error occurred'"
        title="Something went wrong"
        show-retry
        :on-retry="handleRetry"
      />
    </div>
    
    <!-- Normal content -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>