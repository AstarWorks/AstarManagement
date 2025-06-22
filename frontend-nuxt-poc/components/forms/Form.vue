<template>
  <form
    :class="cn(formClasses, props.class)"
    @submit="onSubmit"
    novalidate
  >
    <slot
      :form="form"
      :isValid="form.isValid"
      :isDirty="form.isDirty"
      :isSubmitting="form.isSubmitting"
      :errors="form.errors"
      :values="form.values"
      :reset="form.reset"
      :setFieldValue="form.setFieldValue"
      :setFieldError="form.setFieldError"
      :validateField="form.validateField"
    />
  </form>
</template>

<script setup lang="ts" generic="TSchema extends z.ZodSchema">
import { provide, computed, type HTMLAttributes } from 'vue'
import type { z } from 'zod'
import { useForm, type UseFormOptions } from '~/composables/form/useForm'
import { cn } from '~/lib/utils'

/**
 * Form component props
 */
export interface FormProps<TSchema extends z.ZodSchema> extends /* @vue-ignore */ HTMLAttributes {
  /** Zod validation schema */
  schema: TSchema
  /** Initial form values */
  initialValues?: Partial<z.infer<TSchema>>
  /** Form submission handler */
  onSubmit?: (values: z.infer<TSchema>) => void | Promise<void>
  /** Error handler */
  onError?: (errors: Record<string, string>) => void
  /** Success handler */
  onSuccess?: (values: z.infer<TSchema>) => void
  /** Whether to validate on mount */
  validateOnMount?: boolean
  /** Whether to reset form after successful submission */
  resetOnSuccess?: boolean
  /** Custom CSS classes */
  class?: string
  /** Form layout variant */
  variant?: 'default' | 'inline' | 'floating'
  /** Form size */
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<FormProps<TSchema>>(), {
  validateOnMount: false,
  resetOnSuccess: false,
  variant: 'default',
  size: 'md'
})

const emit = defineEmits<{
  /** Emitted when form is submitted successfully */
  'submit:success': [values: z.infer<TSchema>]
  /** Emitted when form submission fails */
  'submit:error': [errors: Record<string, string>]
  /** Emitted when form values change */
  'values:change': [values: z.infer<TSchema>]
  /** Emitted when form validation state changes */
  'validation:change': [isValid: boolean]
}>()

// Initialize form with VeeValidate and Zod
const formOptions: UseFormOptions<TSchema> = {
  initialValues: props.initialValues,
  validateOnMount: props.validateOnMount,
  onError: (errors) => {
    if (props.onError) {
      props.onError(errors)
    }
    emit('submit:error', errors)
  },
  onSuccess: (values) => {
    if (props.onSuccess) {
      props.onSuccess(values)
    }
    
    if (props.resetOnSuccess) {
      form.reset()
    }
    
    emit('submit:success', values)
  }
}

const form = useForm(props.schema, formOptions)

// Provide form context to child components
provide('form', form)
provide('formSchema', props.schema)

// Form styling classes
const formClasses = computed(() => {
  const baseClasses = 'w-full'
  
  const variantClasses = {
    default: 'space-y-4',
    inline: 'flex flex-wrap gap-4 items-end',
    floating: 'space-y-6'
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

// Form submission handler
const onSubmit = async (event: Event) => {
  event.preventDefault()
  
  if (props.onSubmit) {
    await form.handleSubmit(props.onSubmit)(event)
  } else {
    // Just validate if no submit handler provided
    await form.validate()
  }
}

// Watch for form changes and emit events
watch(
  () => form.values.value,
  (newValues) => {
    emit('values:change', newValues)
  },
  { deep: true }
)

watch(
  () => form.isValid.value,
  (isValid) => {
    emit('validation:change', isValid)
  }
)

// Expose form instance for template refs
defineExpose({
  form,
  submit: () => onSubmit(new Event('submit')),
  reset: form.reset,
  validate: form.validate,
  setValues: form.setValues,
  setFieldValue: form.setFieldValue,
  setFieldError: form.setFieldError,
  clearErrors: form.clearErrors
})
</script>