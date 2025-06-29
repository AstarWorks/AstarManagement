import { useForm as useVeeForm, type BaseFieldProps, type FormActions } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { z } from 'zod'
import { ref, computed, type Ref } from 'vue'

/**
 * Options for the useForm composable
 */
export interface UseFormOptions<TSchema extends z.ZodSchema> {
  /** Initial values for the form */
  initialValues?: Partial<z.infer<TSchema>>
  /** Whether to validate on mount */
  validateOnMount?: boolean
  /** Custom error handler */
  onError?: (errors: Record<string, string>) => void
  /** Custom success handler */
  onSuccess?: (values: z.infer<TSchema>) => void
}

/**
 * Enhanced form composable that wraps VeeValidate with Zod schema integration
 * 
 * Provides type-safe form handling with comprehensive validation, state management,
 * and integration with the application's form infrastructure.
 * 
 * @param schema - Zod schema for form validation
 * @param options - Configuration options
 * @returns Form management interface
 */
export function useForm<TSchema extends z.ZodSchema>(
  schema: TSchema,
  options: UseFormOptions<TSchema> = {}
) {
  const {
    initialValues,
    validateOnMount = false,
    onError,
    onSuccess
  } = options

  // Convert Zod schema to VeeValidate schema
  const validationSchema = toTypedSchema(schema)
  
  // Track submission state
  const isSubmitting = ref(false)
  const submitCount = ref(0)
  
  // Initialize VeeValidate form
  const form = useVeeForm({
    validationSchema,
    validateOnMount
  })

  // Enhanced computed properties
  const isValid = computed(() => form.meta.value.valid)
  const isDirty = computed(() => form.meta.value.dirty)
  const isTouched = computed(() => form.meta.value.touched)
  const hasErrors = computed(() => !form.meta.value.valid && form.meta.value.touched)
  
  // Get form values with proper typing
  const values = computed((): z.infer<TSchema> => form.values as z.infer<TSchema>)
  
  // Get form errors
  const errors = computed(() => form.errors.value)
  const errorMessages = computed(() => Object.values(form.errors.value))

  /**
   * Submit the form with error handling and loading states
   */
  const submit = async (onSubmit: (values: z.infer<TSchema>) => void | Promise<void>) => {
    if (isSubmitting.value) return

    isSubmitting.value = true
    submitCount.value++

    try {
      const isFormValid = await form.validate()
      
      if (!isFormValid.valid) {
        const errorRecord: Record<string, string> = {}
        const formErrors = form.errors.value
        
        if (formErrors && typeof formErrors === 'object') {
          Object.entries(formErrors).forEach(([key, value]) => {
            if (typeof value === 'string') {
              errorRecord[key] = value
            }
          })
        }
        
        if (onError) {
          onError(errorRecord)
        }
        return { success: false, errors: errorRecord }
      }

      await onSubmit(values.value)
      
      if (onSuccess) {
        onSuccess(values.value)
      }

      return { success: true, data: values.value }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      
      if (onError) {
        onError({ submit: errorMessage })
      }
      
      return { success: false, errors: { submit: errorMessage } }
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Handle form submission with VeeValidate integration
   */
  const handleSubmit = (onSubmit: (values: z.infer<TSchema>) => void | Promise<void>) => {
    return form.handleSubmit(async (formValues) => {
      await submit(onSubmit)
    })
  }

  /**
   * Reset form to initial state
   */
  const reset = (newValues?: Record<string, unknown>) => {
    form.resetForm()
    if (newValues) {
      form.setValues(newValues as Parameters<typeof form.setValues>[0])
    }
    submitCount.value = 0
  }

  /**
   * Set form values programmatically
   */
  const setValues = (newValues: Record<string, unknown>) => {
    form.setValues(newValues as Parameters<typeof form.setValues>[0])
  }

  /**
   * Set field value
   */
  const setFieldValue = (
    field: string,
    value: unknown
  ) => {
    form.setFieldValue(field as never, value as Parameters<typeof form.setFieldValue>[1])
  }

  /**
   * Set field error
   */
  const setFieldError = (field: string, error: string) => {
    form.setFieldError(field as never, error)
  }

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    form.setErrors({})
  }

  /**
   * Validate specific field
   */
  const validateField = async (field: string) => {
    return await form.validateField(field as never)
  }

  /**
   * Check if specific field has error
   */
  const hasFieldError = (field: string) => {
    const errors = form.errors.value as Record<string, string | undefined>
    return !!errors[field]
  }

  /**
   * Get field error message
   */
  const getFieldError = (field: string) => {
    const errors = form.errors.value as Record<string, string | undefined>
    return errors[field]
  }

  /**
   * Get field value
   */
  const getFieldValue = <K extends keyof z.infer<TSchema>>(field: K): z.infer<TSchema>[K] => {
    return form.values[field as string] as z.infer<TSchema>[K]
  }

  return {
    // Core VeeValidate form
    ...form,
    
    // Enhanced state
    isValid: readonly(isValid),
    isDirty: readonly(isDirty),
    isTouched: readonly(isTouched),
    hasErrors: readonly(hasErrors),
    isSubmitting: readonly(isSubmitting),
    submitCount: readonly(submitCount),
    
    // Typed values and errors
    values: readonly(values),
    errors: readonly(errors),
    errorMessages: readonly(errorMessages),
    
    // Form actions
    submit,
    handleSubmit,
    reset,
    setValues,
    setFieldValue,
    setFieldError,
    clearErrors,
    validateField,
    
    // Field utilities
    hasFieldError,
    getFieldError,
    getFieldValue,
    
    // Schema
    schema: readonly(ref(schema))
  }
}

/**
 * Type for the return value of useForm
 */
export type FormInstance<TSchema extends z.ZodSchema> = ReturnType<typeof useForm<TSchema>>