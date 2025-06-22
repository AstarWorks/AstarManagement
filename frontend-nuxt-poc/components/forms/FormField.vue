<template>
  <div :class="cn(fieldWrapperClasses, props.class)">
    <!-- Field Label -->
    <div v-if="hasLabel" class="mb-2">
      <Label
        :for="fieldId"
        :class="labelClasses"
      >
        {{ fieldLabel }}
        <span v-if="isRequired" class="text-destructive ml-1" aria-label="required">*</span>
      </Label>
      
      <!-- Field Description -->
      <div
        v-if="description"
        :id="`${fieldId}-description`"
        class="text-sm text-muted-foreground mt-1"
      >
        {{ description }}
      </div>
    </div>

    <!-- Field Input Slot -->
    <div class="relative">
      <slot
        :field="field"
        :fieldId="fieldId"
        :hasError="field.hasError"
        :errorMessage="field.errorMessage.value"
        :isRequired="isRequired"
        :describedBy="describedByIds"
      />
      
      <!-- Required Indicator (for fields without labels) -->
      <div
        v-if="isRequired && !hasLabel && showRequiredIndicator"
        class="absolute -top-1 -right-1 text-destructive text-xs"
        aria-hidden="true"
      >
        *
      </div>
    </div>

    <!-- Error Message -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="field.hasError.value && showError"
        :id="`${fieldId}-error`"
        class="mt-2 text-sm text-destructive flex items-start gap-1"
        role="alert"
        aria-live="polite"
      >
        <AlertCircle class="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{{ field.errorMessage.value }}</span>
      </div>
    </Transition>

    <!-- Warning Message -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="warning && !field.hasError.value"
        :id="`${fieldId}-warning`"
        class="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-1"
        role="alert"
        aria-live="polite"
      >
        <AlertTriangle class="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{{ warning }}</span>
      </div>
    </Transition>

    <!-- Help Text -->
    <div
      v-if="helpText && !field.hasError.value && !warning"
      :id="`${fieldId}-help`"
      class="mt-2 text-sm text-muted-foreground"
    >
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, inject, type HTMLAttributes } from 'vue'
import { useField, type FormFieldContext } from '~/composables/form/useField'
import { Label } from '~/components/ui/label'
import { AlertCircle, AlertTriangle } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

/**
 * FormField component props
 */
export interface FormFieldProps extends /* @vue-ignore */ HTMLAttributes {
  /** Field name for validation */
  name: string
  /** Field label */
  label?: string
  /** Field description/hint */
  description?: string
  /** Help text */
  helpText?: string
  /** Warning message (non-blocking) */
  warning?: string
  /** Whether field is required */
  required?: boolean
  /** Whether to show error messages */
  showError?: boolean
  /** Whether to show required indicator for unlabeled fields */
  showRequiredIndicator?: boolean
  /** Custom CSS classes */
  class?: string
  /** Field layout variant */
  variant?: 'default' | 'floating' | 'inline'
  /** Field size */
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<FormFieldProps>(), {
  showError: true,
  showRequiredIndicator: true,
  variant: 'default',
  size: 'md'
})

// Initialize field with VeeValidate
const field = useField(props.name)

// Generate unique field ID
const fieldId = computed(() => `field-${props.name}-${Math.random().toString(36).substr(2, 9)}`)

// Field metadata
const hasLabel = computed(() => !!props.label)
const fieldLabel = computed(() => props.label || props.name)
const isRequired = computed(() => props.required ?? false)

// Create field context for child components
const fieldContext: FormFieldContext = {
  name: props.name,
  label: props.label,
  description: props.description,
  required: isRequired.value,
  meta: {
    variant: props.variant,
    size: props.size
  }
}

// Provide field context to child input components
provide('formField', fieldContext)

// Accessibility attributes
const describedByIds = computed(() => {
  const ids: string[] = []
  
  if (props.description) {
    ids.push(`${fieldId.value}-description`)
  }
  
  if (field.hasError.value && props.showError) {
    ids.push(`${fieldId.value}-error`)
  } else if (props.warning) {
    ids.push(`${fieldId.value}-warning`)
  } else if (props.helpText) {
    ids.push(`${fieldId.value}-help`)
  }
  
  return ids.join(' ')
})

// Styling classes
const fieldWrapperClasses = computed(() => {
  const baseClasses = 'w-full'
  
  const variantClasses = {
    default: '',
    floating: 'relative',
    inline: 'flex flex-col'
  }
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  return [
    baseClasses,
    variantClasses[props.variant],
    sizeClasses[props.size]
  ].join(' ')
})

const labelClasses = computed(() => {
  const baseClasses = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
  
  const errorClasses = field.hasError.value
    ? 'text-destructive'
    : 'text-foreground'
    
  const variantClasses = {
    default: '',
    floating: 'absolute -top-2 left-2 bg-background px-1 text-xs transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs z-10',
    inline: 'mb-1'
  }
  
  return [
    baseClasses,
    errorClasses,
    variantClasses[props.variant]
  ].join(' ')
})

// Expose field for template refs
defineExpose({
  field,
  fieldId,
  validate: field.validate,
  reset: field.reset,
  focus: field.focus,
  clearError: field.clearError,
  setError: field.setError
})
</script>