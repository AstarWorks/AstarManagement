<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 -translate-y-1 scale-95"
  >
    <div
      v-if="shouldShow"
      :id="errorId"
      :class="cn(errorClasses, props.class)"
      role="alert"
      aria-live="polite"
    >
      <!-- Error Icon -->
      <component
        :is="iconComponent"
        :class="iconClasses"
        aria-hidden="true"
      />
      
      <!-- Error Message -->
      <div class="flex-1 min-w-0">
        <div v-if="title" :class="titleClasses">
          {{ title }}
        </div>
        <div :class="messageClasses">
          <slot>{{ message }}</slot>
        </div>
      </div>
      
      <!-- Dismiss Button -->
      <button
        v-if="dismissible"
        type="button"
        :class="dismissButtonClasses"
        @click="handleDismiss"
        :aria-label="dismissLabel"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

/**
 * Error message component props
 */
export interface ErrorMessageProps extends /* @vue-ignore */ HTMLAttributes {
  /** Error message text */
  message?: string
  /** Optional title for the error */
  title?: string
  /** Error severity level */
  variant?: 'error' | 'warning' | 'info'
  /** Error size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the error */
  show?: boolean
  /** Whether the error can be dismissed */
  dismissible?: boolean
  /** Accessibility label for dismiss button */
  dismissLabel?: string
  /** Custom CSS classes */
  class?: string
  /** Whether to show icon */
  showIcon?: boolean
  /** Custom icon component */
  icon?: any
}

const props = withDefaults(defineProps<ErrorMessageProps>(), {
  variant: 'error',
  size: 'md',
  show: true,
  dismissible: false,
  dismissLabel: 'Dismiss error',
  showIcon: true
})

const emit = defineEmits<{
  /** Emitted when error is dismissed */
  dismiss: []
}>()

// Generate unique ID for accessibility
const errorId = computed(() => 
  `error-${Math.random().toString(36).substr(2, 9)}`
)

// Determine if error should be shown
const shouldShow = computed(() => 
  props.show && (props.message || $slots.default)
)

// Icon selection based on variant
const iconComponent = computed(() => {
  if (props.icon) return props.icon
  
  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }
  
  return icons[props.variant]
})

// Styling classes
const errorClasses = computed(() => {
  const baseClasses = 'flex items-start gap-2 p-3 rounded-md border'
  
  const variantClasses = {
    error: 'bg-destructive/10 border-destructive/20 text-destructive',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400'
  }
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  return [
    baseClasses,
    variantClasses[props.variant],
    sizeClasses[props.size]
  ].join(' ')
})

const iconClasses = computed(() => {
  const baseClasses = 'flex-shrink-0 mt-0.5'
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }
  
  return [
    baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const titleClasses = computed(() => {
  const baseClasses = 'font-medium'
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  return [
    baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const messageClasses = computed(() => {
  const baseClasses = 'leading-relaxed'
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  const spacingClasses = props.title ? 'mt-1' : ''
  
  return [
    baseClasses,
    sizeClasses[props.size],
    spacingClasses
  ].join(' ')
})

const dismissButtonClasses = computed(() => {
  const baseClasses = 'flex-shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
  
  return baseClasses
})

// Handle dismiss action
const handleDismiss = () => {
  emit('dismiss')
}

// Expose methods for programmatic control
defineExpose({
  errorId,
  dismiss: handleDismiss
})
</script>