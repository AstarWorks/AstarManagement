<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface Props {
  error: Error | null
  onRetry?: () => void
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  className: ''
})

const emit = defineEmits<{
  retry: []
}>()

const handleRetry = () => {
  if (props.onRetry) {
    props.onRetry()
  }
  emit('retry')
}

// Get user-friendly error message
const getErrorMessage = (error: Error | null): string => {
  if (!error) return 'An unexpected error occurred'
  
  // Check for common error types
  if (error.message.includes('Network')) {
    return 'Network error. Please check your connection and try again.'
  }
  
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    return 'You are not authorized to view this data. Please log in again.'
  }
  
  if (error.message.includes('403') || error.message.includes('Forbidden')) {
    return 'You do not have permission to access this data.'
  }
  
  if (error.message.includes('404') || error.message.includes('Not found')) {
    return 'The requested data could not be found.'
  }
  
  if (error.message.includes('500') || error.message.includes('Server error')) {
    return 'Server error. Please try again later.'
  }
  
  // Default to the error message
  return error.message || 'An unexpected error occurred'
}
</script>

<template>
  <div :class="cn('data-table-error', className)">
    <div class="error-container">
      <div class="error-icon">
        <Icon name="lucide:alert-triangle" class="h-12 w-12 text-destructive" />
      </div>
      
      <div class="error-content">
        <h3 class="error-title">Unable to load data</h3>
        <p class="error-message">{{ getErrorMessage(error) }}</p>
      </div>
      
      <div class="error-actions">
        <Button
          variant="outline"
          size="sm"
          @click="handleRetry"
        >
          <Icon name="lucide:rotate-cw" class="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
      
      <!-- Developer details (only shown in development) -->
      <details v-if="import.meta.dev && error" class="error-details">
        <summary class="error-summary">
          <Icon name="lucide:code" class="h-4 w-4" />
          Technical Details
        </summary>
        <div class="error-stack">
          <div class="error-name">{{ error.name }}</div>
          <div class="error-message-full">{{ error.message }}</div>
          <pre v-if="error.stack" class="error-stacktrace">{{ error.stack }}</pre>
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.data-table-error {
  @apply rounded-lg border bg-card;
}

.error-container {
  @apply flex flex-col items-center justify-center py-12 px-4 text-center;
}

.error-icon {
  @apply mb-4;
}

.error-content {
  @apply mb-6 max-w-md;
}

.error-title {
  @apply text-lg font-semibold mb-2;
}

.error-message {
  @apply text-sm text-muted-foreground;
}

.error-actions {
  @apply flex gap-2;
}

.error-details {
  @apply mt-8 w-full max-w-2xl text-left;
}

.error-summary {
  @apply cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors;
  @apply flex items-center gap-2 py-2;
}

.error-stack {
  @apply mt-4 p-4 bg-muted rounded-md text-xs;
}

.error-name {
  @apply font-bold text-destructive mb-1;
}

.error-message-full {
  @apply mb-2 text-foreground;
}

.error-stacktrace {
  @apply overflow-x-auto whitespace-pre-wrap break-words text-muted-foreground;
  @apply mt-2 p-2 bg-background rounded;
}

/* Alternative error styles for inline usage */
.data-table-error--inline {
  @apply border-0 bg-destructive/10;
  
  .error-container {
    @apply py-6;
  }
  
  .error-icon {
    @apply mb-2;
    
    svg {
      @apply h-8 w-8;
    }
  }
}

/* Compact error style */
.data-table-error--compact {
  .error-container {
    @apply py-4 flex-row gap-4 text-left;
  }
  
  .error-icon {
    @apply mb-0;
    
    svg {
      @apply h-6 w-6;
    }
  }
  
  .error-content {
    @apply mb-0 flex-1;
  }
  
  .error-title {
    @apply text-sm mb-0;
  }
  
  .error-message {
    @apply text-xs;
  }
  
  .error-actions {
    @apply ml-auto;
  }
}
</style>