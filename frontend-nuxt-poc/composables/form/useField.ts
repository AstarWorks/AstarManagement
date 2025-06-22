import { useField as useVeeField, type FieldOptions } from 'vee-validate'
import { computed, inject, type Ref } from 'vue'
import type { z } from 'zod'

/**
 * Field context for form integration
 */
export interface FormFieldContext {
  /** Field name */
  name: string
  /** Field label for display */
  label?: string
  /** Field description/hint */
  description?: string
  /** Whether field is required */
  required?: boolean
  /** Additional field metadata */
  meta?: Record<string, any>
}

/**
 * Enhanced field composable that wraps VeeValidate's useField
 * 
 * Provides type-safe field handling with form context integration,
 * validation state management, and consistent error handling.
 * 
 * @param name - Field name
 * @param options - Field configuration options
 * @returns Field management interface
 */
export function useField<TValue = any>(
  name: string,
  options?: FieldOptions<TValue>
) {
  // Try to get form context if available
  const formContext = inject<FormFieldContext | null>('formField', null)
  
  // Initialize VeeValidate field
  const field = useVeeField<TValue>(name, options)
  
  // Enhanced computed properties
  const hasError = computed(() => !!field.errorMessage.value)
  const isRequired = computed(() => formContext?.required ?? false)
  const fieldLabel = computed(() => formContext?.label ?? name)
  const fieldDescription = computed(() => formContext?.description)
  
  // Field state helpers
  const isValid = computed(() => field.meta.valid)
  const isDirty = computed(() => field.meta.dirty)
  const isTouched = computed(() => field.meta.touched)
  const isPending = computed(() => field.meta.pending)
  
  /**
   * Clear field error
   */
  const clearError = () => {
    field.setErrors([])
  }
  
  /**
   * Set field error
   */
  const setError = (error: string) => {
    field.setErrors([error])
  }
  
  /**
   * Validate field manually
   */
  const validate = async () => {
    return await field.validate()
  }
  
  /**
   * Reset field to initial state
   */
  const reset = () => {
    field.resetField()
  }
  
  /**
   * Focus field (for input elements)
   */
  const focus = () => {
    // This will be used by form components to focus invalid fields
    if (field.meta.touched && !field.meta.valid) {
      // Field should be focused by the component using this composable
      return true
    }
    return false
  }

  return {
    // Core VeeValidate field
    ...field,
    
    // Enhanced state
    hasError: readonly(hasError),
    isRequired: readonly(isRequired),
    isValid: readonly(isValid),
    isDirty: readonly(isDirty),
    isTouched: readonly(isTouched),
    isPending: readonly(isPending),
    
    // Field metadata
    fieldLabel: readonly(fieldLabel),
    fieldDescription: readonly(fieldDescription),
    
    // Field actions
    clearError,
    setError,
    validate,
    reset,
    focus
  }
}

/**
 * Composable for creating field context providers
 * 
 * Used by form field wrapper components to provide context
 * to nested input components.
 */
export function useFieldContext(context: FormFieldContext) {
  const { provide } = inject('vue') || { provide: () => {} }
  
  // Provide field context to children
  provide('formField', context)
  
  return {
    context: readonly(ref(context))
  }
}

/**
 * Composable for accessing form field context
 * 
 * Used by input components to access field metadata
 * provided by parent field wrapper components.
 */
export function useFieldContext_access() {
  const context = inject<FormFieldContext | null>('formField', null)
  
  return {
    context: readonly(ref(context)),
    hasContext: computed(() => !!context)
  }
}

/**
 * Validation trigger controls for fine-grained validation timing
 */
export interface ValidationTriggers {
  /** Validate on field blur */
  onBlur?: boolean
  /** Validate on field input */
  onInput?: boolean
  /** Validate on value change */
  onChange?: boolean
  /** Debounce validation (ms) */
  debounce?: number
}

/**
 * Enhanced field composable with custom validation triggers
 * 
 * Provides more control over when validation occurs for better UX.
 */
export function useFieldWithTriggers<TValue = any>(
  name: string,
  triggers: ValidationTriggers = {},
  options?: FieldOptions<TValue>
) {
  const {
    onBlur = true,
    onInput = false,
    onChange = true,
    debounce = 0
  } = triggers
  
  const field = useField<TValue>(name, {
    ...options,
    validateOnBlur: onBlur,
    validateOnInput: onInput,
    validateOnValueUpdate: onChange
  })
  
  // Add debounced validation if specified
  let validationTimeout: NodeJS.Timeout | null = null
  
  const debouncedValidate = async () => {
    if (debounce > 0) {
      if (validationTimeout) {
        clearTimeout(validationTimeout)
      }
      
      return new Promise<void>((resolve) => {
        validationTimeout = setTimeout(async () => {
          await field.validate()
          resolve()
        }, debounce)
      })
    } else {
      return await field.validate()
    }
  }
  
  return {
    ...field,
    debouncedValidate
  }
}

/**
 * Type for the return value of useField
 */
export type FieldInstance<TValue = any> = ReturnType<typeof useField<TValue>>