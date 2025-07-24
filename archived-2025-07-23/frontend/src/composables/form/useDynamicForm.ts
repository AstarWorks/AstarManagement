/**
 * Dynamic Form Composable
 * Main composable for handling dynamic form state, validation, and submission
 */

import { ref, computed, reactive, watch, nextTick } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import type { ParsedTemplateVariable } from './types'
import type { 
  FieldGroup, 
  FormLayout, 
  DynamicFormState,
  FormValidationState,
  FormSubmissionState
} from '~/components/dynamic-form/types'
import { useFormLayout } from './useFormLayout'
import { generateValidationSchema } from './useFormValidation'

export interface DynamicFormOptions {
  layout?: FormLayout
  validateOnMount?: boolean
  onSubmit?: (data: Record<string, any>) => void | Promise<void>
  onChange?: (data: Record<string, any>) => void
  onReset?: () => void
  onFieldChange?: (fieldName: string, value: any) => void
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void
}

export function useDynamicForm(
  variables: ParsedTemplateVariable[],
  initialData: Record<string, any> = {},
  options: DynamicFormOptions = {}
) {
  // Form layout
  const { groupFieldsBySection } = useFormLayout()
  
  // Local form data
  const formData = ref<Record<string, any>>({ ...initialData })
  const isLoading = ref(false)
  
  // Generate field groups
  const fieldGroups = computed((): FieldGroup[] => {
    return groupFieldsBySection(variables, options.layout)
  })
  
  // Generate validation schema
  const validationSchema = computed(() => {
    return generateValidationSchema(variables)
  })
  
  // VeeValidate form setup
  const {
    handleSubmit: veeValidateHandleSubmit,
    setValues,
    resetForm,
    validate,
    values: formValues,
    errors: formErrors,
    meta: formMeta
  } = useForm({
    validationSchema: toTypedSchema(validationSchema.value),
    initialValues: formData.value
  })
  
  // Form state
  const formState = reactive<DynamicFormState>({
    validation: {
      isValid: false,
      errors: {},
      touched: {},
      isDirty: false
    },
    submission: {
      isSubmitting: false,
      isSubmitted: false,
      submitCount: 0
    },
    formData: formData.value,
    fieldGroups: fieldGroups.value
  })
  
  // Computed properties
  const isValid = computed(() => formMeta.value.valid)
  const isDirty = computed(() => formMeta.value.dirty)
  const isSubmitting = computed(() => formState.submission.isSubmitting)
  const globalErrors = computed(() => formErrors.value)
  
  // Field update handler
  const handleFieldUpdate = (fieldName: string, value: any) => {
    formData.value[fieldName] = value
    
    // Update VeeValidate values
    setValues({
      ...formValues.value,
      [fieldName]: value
    })
    
    // Emit field change
    options.onFieldChange?.(fieldName, value)
    options.onChange?.(formData.value)
  }
  
  // Form submission handler
  const handleSubmit = veeValidateHandleSubmit(async (values) => {
    formState.submission.isSubmitting = true
    formState.submission.submitCount++
    
    try {
      await options.onSubmit?.(values)
      formState.submission.isSubmitted = true
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    } finally {
      formState.submission.isSubmitting = false
      formState.submission.lastSubmittedAt = new Date()
    }
  })
  
  // Form reset handler
  const handleReset = () => {
    formData.value = { ...initialData }
    resetForm({
      values: initialData
    })
    
    // Reset form state
    formState.submission.isSubmitted = false
    formState.submission.submitCount = 0
    formState.submission.lastSubmittedAt = undefined
    
    options.onReset?.()
  }
  
  // Validate form manually
  const validateForm = async () => {
    const result = await validate()
    return result.valid
  }
  
  // Get field label helper
  const getFieldLabel = (fieldName: string): string => {
    const field = variables.find(v => v.name === fieldName)
    return field?.label || fieldName
  }
  
  // Watch for validation changes
  watch([isValid, globalErrors], ([valid, errors]) => {
    formState.validation.isValid = valid
    formState.validation.errors = (errors || {}) as Record<string, string>
    
    options.onValidationChange?.(valid, (errors || {}) as Record<string, string>)
  }, { deep: true })
  
  // Watch for form data changes
  watch(formData, (newData) => {
    formState.formData = newData
  }, { deep: true })
  
  // Initialize validation on mount if requested
  if (options.validateOnMount) {
    nextTick(() => {
      validateForm()
    })
  }
  
  return {
    // State
    formData: computed(() => formData.value),
    fieldGroups,
    isValid,
    isDirty,
    isSubmitting,
    isLoading,
    globalErrors,
    formState,
    
    // Actions
    handleSubmit,
    handleFieldUpdate,
    handleReset,
    validateForm,
    
    // Utilities
    getFieldLabel,
    setValues,
    resetForm
  }
}

/**
 * Form field grouping helper
 */
export function useFormFieldGrouping(variables: ParsedTemplateVariable[]) {
  const groupedFields = computed(() => {
    const groups = new Map<string, ParsedTemplateVariable[]>()
    
    variables.forEach(variable => {
      const section = variable.path[0] || 'general'
      
      if (!groups.has(section)) {
        groups.set(section, [])
      }
      
      groups.get(section)!.push(variable)
    })
    
    return Array.from(groups.entries()).map(([section, fields]) => ({
      section,
      fields,
      title: formatSectionTitle(section),
      id: `group-${section}`
    }))
  })
  
  return {
    groupedFields
  }
}

/**
 * Format section title helper
 */
function formatSectionTitle(section: string): string {
  return section
    .charAt(0).toUpperCase() + 
    section.slice(1).replace(/([A-Z])/g, ' $1').trim()
}