<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 -translate-y-2 scale-95"
  >
    <div
      v-if="shouldShow"
      :class="cn(summaryClasses, props.class)"
      role="alert"
      aria-live="polite"
      :aria-labelledby="titleId"
    >
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-start gap-2">
          <AlertCircle :class="iconClasses" aria-hidden="true" />
          <div>
            <h3 :id="titleId" :class="titleClasses">
              {{ title }}
            </h3>
            <p v-if="description" :class="descriptionClasses">
              {{ description }}
            </p>
          </div>
        </div>
        
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

      <!-- Error List -->
      <div v-if="showErrorList && errorList.length > 0" class="mt-3">
        <ul :class="errorListClasses" role="list">
          <li
            v-for="(error, index) in errorList"
            :key="`error-${index}`"
            class="flex items-start gap-2"
          >
            <span class="text-destructive mt-1.5">•</span>
            <div class="flex-1 min-w-0">
              <button
                v-if="error.fieldName && scrollToField"
                type="button"
                class="text-left underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                @click="scrollToError(error.fieldName)"
              >
                <span class="font-medium">{{ error.fieldLabel || error.fieldName }}:</span>
                {{ error.message }}
              </button>
              <div v-else>
                <span v-if="error.fieldLabel || error.fieldName" class="font-medium">
                  {{ error.fieldLabel || error.fieldName }}:
                </span>
                {{ error.message }}
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Custom Content Slot -->
      <div v-if="$slots.default" class="mt-3">
        <slot />
      </div>

      <!-- Actions -->
      <div v-if="$slots.actions || showRetryButton" class="mt-4 flex gap-2">
        <slot name="actions">
          <Button
            v-if="showRetryButton"
            variant="outline"
            size="sm"
            @click="handleRetry"
          >
            Try Again
          </Button>
        </slot>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, inject, type HTMLAttributes } from 'vue'
import { AlertCircle, X } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import type { FormInstance } from '~/composables/form/useForm'

/**
 * Form error information
 */
export interface FormError {
  /** Field name */
  fieldName?: string
  /** Field label for display */
  fieldLabel?: string
  /** Error message */
  message: string
  /** Error code */
  code?: string
}

/**
 * FormErrorSummary component props
 */
export interface FormErrorSummaryProps extends /* @vue-ignore */ HTMLAttributes {
  /** Array of form errors */
  errors?: FormError[]
  /** Summary title */
  title?: string
  /** Summary description */
  description?: string
  /** Whether to show the summary */
  show?: boolean
  /** Whether to show individual error list */
  showErrorList?: boolean
  /** Whether to show retry button */
  showRetryButton?: boolean
  /** Whether summary can be dismissed */
  dismissible?: boolean
  /** Whether to scroll to field when error is clicked */
  scrollToField?: boolean
  /** Accessibility label for dismiss button */
  dismissLabel?: string
  /** Custom CSS classes */
  class?: string
  /** Component size */
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<FormErrorSummaryProps>(), {
  title: 'There are errors in your form',
  description: 'Please correct the following errors and try again.',
  show: true,
  showErrorList: true,
  showRetryButton: false,
  dismissible: false,
  scrollToField: true,
  dismissLabel: 'Dismiss errors',
  size: 'md'
})

const emit = defineEmits<{
  /** Emitted when summary is dismissed */
  dismiss: []
  /** Emitted when retry button is clicked */
  retry: []
  /** Emitted when error field link is clicked */
  'field:focus': [fieldName: string]
}>()

// Try to get form context
const form = inject<FormInstance<any> | null>('form', null)

// Generate unique ID for accessibility
const titleId = computed(() => 
  `error-summary-title-${Math.random().toString(36).substr(2, 9)}`
)

// Process errors from props or form context
const errorList = computed((): FormError[] => {
  if (props.errors) {
    return props.errors
  }
  
  if (form?.errors.value) {
    return Object.entries(form.errors.value).map(([fieldName, message]) => ({
      fieldName,
      message: String(message),
      fieldLabel: fieldName // Could be enhanced with field label mapping
    }))
  }
  
  return []
})

// Determine if summary should be shown
const shouldShow = computed(() => 
  props.show && errorList.value.length > 0
)

// Styling classes
const summaryClasses = computed(() => {
  const baseClasses = 'rounded-lg border border-destructive/20 bg-destructive/10 p-4'
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  return [
    baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const iconClasses = computed(() => {
  const baseClasses = 'text-destructive flex-shrink-0 mt-0.5'
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }
  
  return [
    baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const titleClasses = computed(() => {
  const baseClasses = 'font-semibold text-destructive'
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  return [
    baseClasses,
    sizeClasses[props.size]
  ].join(' ')
})

const descriptionClasses = computed(() => {
  const baseClasses = 'text-destructive/80 mt-1'
  
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

const errorListClasses = computed(() => {
  const baseClasses = 'space-y-2 text-destructive/90'
  
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

const dismissButtonClasses = computed(() => {
  return 'rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
})

// Handle dismiss action
const handleDismiss = () => {
  emit('dismiss')
}

// Handle retry action
const handleRetry = () => {
  emit('retry')
}

// Scroll to error field
const scrollToError = (fieldName: string) => {
  emit('field:focus', fieldName)
  
  // Try to find and focus the field element
  const fieldElement = document.querySelector(`[name="${fieldName}"]`) as HTMLElement
  if (fieldElement) {
    fieldElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    })
    
    // Focus the field after scroll
    setTimeout(() => {
      fieldElement.focus()
    }, 300)
  }
}

// Expose methods for programmatic control
defineExpose({
  titleId,
  errorList,
  dismiss: handleDismiss,
  retry: handleRetry,
  scrollToError
})
</script>