import { ref, computed, readonly } from 'vue'
import { useI18n } from 'vue-i18n'
import { createExpenseSchema, type ExpenseFormData } from '~/modules/expense/schemas/expense'
import type { ZodError, z as _z } from 'zod'
import { useExpenseFormSteps, type IExpenseFormStepsReturn } from './useExpenseFormSteps'
import { useExpenseFormDraft, type IExpenseFormDraftReturn } from './useExpenseFormDraft'
import { useExpenseFormErrorHandling, type IExpenseFormErrorHandlingReturn } from './useExpenseFormErrorHandling'

/**
 * Form field state interface with explicit modeling
 */
interface IFormFieldState<T> {
  value: T
  isDirty: boolean
  isTouched: boolean
  error: string | null
}

/**
 * Form validation state interface
 */
interface IFormValidationState {
  isValid: boolean
  isValidating: boolean
  errors: Record<string, string>
  touchedFields: Set<string>
}

/**
 * Amount input configuration
 */
interface IAmountInputConfig {
  currency: string
  locale: string
  minimumFractionDigits: number
  maximumFractionDigits: number
}

/**
 * Enhanced expense form return type
 */
export interface IExpenseFormReturn {
  // State (readonly to prevent direct mutation)
  validationState: Readonly<Ref<IFormValidationState>>
  isDirty: Readonly<Ref<boolean>>
  isSubmitting: Readonly<Ref<boolean>>
  formValues: Ref<Partial<ExpenseFormData>>
  
  // Computed
  hasErrors: ComputedRef<boolean>
  canSubmit: ComputedRef<boolean>
  validationSchema: ComputedRef<ReturnType<typeof createExpenseSchema>>
  
  // Amount formatting
  formatAmountDisplay: (value: number) => string
  formatAmountInput: (value: string) => number
  validateAmountInput: (value: string | number) => { isValid: boolean; value: number; error?: string }
  handleAmountInput: (event: Event, fieldName: 'incomeAmount' | 'expenseAmount', onFieldChange: (field: 'incomeAmount' | 'expenseAmount', value: number) => void) => void
  
  // Field management
  markFieldAsTouched: (fieldName: string) => void
  setFieldError: (fieldName: string, error: string | null) => void
  clearFieldError: (fieldName: string) => void
  clearAllErrors: () => void
  setFieldValue: (key: keyof ExpenseFormData, value: unknown) => void
  
  // Validation
  validateField: (fieldName: keyof ExpenseFormData, value: unknown) => Promise<boolean>
  validateForm: (formData: Partial<ExpenseFormData>) => Promise<boolean>
  debouncedValidateField: (fieldName: keyof ExpenseFormData, value: unknown, delay?: number) => void
  
  // Form control
  resetForm: () => void
  
  // Integration points
  steps: IExpenseFormStepsReturn
  draft: IExpenseFormDraftReturn
  errorHandling: IExpenseFormErrorHandlingReturn
}

/**
 * Enhanced composable for expense form management
 * Integrates step management, draft functionality, and validation
 * Handles form state, validation, and formatting logic with type safety
 */
export function useExpenseForm(
  initialData?: Partial<ExpenseFormData>,
  emit?: (event: string, ...args: unknown[]) => void
): IExpenseFormReturn {
  const { t } = useI18n()

  // Form values state
  const formValues = ref<Partial<ExpenseFormData>>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    incomeAmount: 0,
    expenseAmount: 0,
    caseId: undefined,
    memo: '',
    tagIds: [],
    attachmentIds: [],
    ...initialData
  })

  // Form validation state with explicit modeling
  const validationState = ref<IFormValidationState>({
    isValid: false,
    isValidating: false,
    errors: {},
    touchedFields: new Set()
  })

  // Amount formatting configuration
  const amountConfig: IAmountInputConfig = {
    currency: 'JPY',
    locale: 'ja-JP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }

  // Get validation schema with i18n
  const validationSchema = computed(() => createExpenseSchema(t))

  // Form state management
  const isDirty = ref(false)
  const isSubmitting = ref(false)

  // Computed properties
  const hasErrors = computed(() => Object.keys(validationState.value.errors).length > 0)
  const canSubmit = computed(() => 
    validationState.value.isValid && 
    !validationState.value.isValidating && 
    !isSubmitting.value
  )

  // Amount formatting methods
  const formatAmountDisplay = (value: number): string => {
    if (isNaN(value) || value === 0) return ''
    
    return new Intl.NumberFormat(amountConfig.locale, {
      style: 'currency',
      currency: amountConfig.currency,
      minimumFractionDigits: amountConfig.minimumFractionDigits,
      maximumFractionDigits: amountConfig.maximumFractionDigits
    }).format(value)
  }

  const formatAmountInput = (value: string): number => {
    // Remove currency symbols and spaces, parse as number
    const cleanValue = value.replace(/[^\d.-]/g, '')
    const numericValue = parseFloat(cleanValue)
    return isNaN(numericValue) ? 0 : numericValue
  }

  const validateAmountInput = (value: string | number): { isValid: boolean; value: number; error?: string } => {
    const numericValue = typeof value === 'string' ? formatAmountInput(value) : value
    
    if (numericValue < 0) {
      return {
        isValid: false,
        value: numericValue,
        error: t('expense.form.validation.minAmount')
      }
    }
    
    if (numericValue > 999999999) {
      return {
        isValid: false,
        value: numericValue,
        error: t('expense.form.validation.maxAmount')
      }
    }
    
    return {
      isValid: true,
      value: numericValue
    }
  }

  // Integrate error handling
  const errorHandling = useExpenseFormErrorHandling({
    showToast: true,
    logToConsole: true,
    autoRetry: true,
    maxRetries: 3
  })

  // Integrate step management
  const steps = useExpenseFormSteps(formValues, emit)
  
  // Integrate draft functionality
  const draft = useExpenseFormDraft(formValues, { 
    enableAutoSave: !initialData, // Only auto-save for new forms, not edits
    excludeFields: ['attachmentIds'] // Don't save attachment IDs in draft
  })

  // Form field management
  const setFieldValue = (key: keyof ExpenseFormData, value: unknown): void => {
    if (key in formValues.value) {
      ;(formValues.value as Record<string, unknown>)[key] = value
      isDirty.value = true
    }
  }

  const markFieldAsTouched = (fieldName: string): void => {
    validationState.value.touchedFields.add(fieldName)
  }

  const setFieldError = (fieldName: string, error: string | null): void => {
    if (error) {
      validationState.value.errors[fieldName] = error
    } else {
      const { [fieldName]: _, ...remainingErrors } = validationState.value.errors
      validationState.value.errors = remainingErrors
    }
    updateValidationState()
  }

  const clearFieldError = (fieldName: string): void => {
    const { [fieldName]: _, ...remainingErrors } = validationState.value.errors
    validationState.value.errors = remainingErrors
    updateValidationState()
  }

  const clearAllErrors = (): void => {
    validationState.value.errors = {}
    updateValidationState()
  }

  const updateValidationState = (): void => {
    validationState.value.isValid = Object.keys(validationState.value.errors).length === 0
  }

  // Form validation methods
  const validateField = async (fieldName: keyof ExpenseFormData, value: unknown): Promise<boolean> => {
    try {
      validationState.value.isValidating = true
      errorHandling.clearError() // Clear previous errors
      
      // Create partial form data for validation
      const formData = { [fieldName]: value }
      
      // Validate single field using schema
      const fieldSchema = validationSchema.value.pick({ [fieldName]: true } as Record<keyof ExpenseFormData, true>)
      await fieldSchema.parseAsync(formData)
      
      // If validation passes, clear any existing error
      clearFieldError(fieldName)
      return true
      
    } catch (error) {
      // Handle validation error with error handling composable
      errorHandling.handleValidationError(error, fieldName)
      
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as ZodError
        const fieldError = zodError.issues.find(issue => issue.path[0] === fieldName)
        if (fieldError) {
          setFieldError(fieldName, fieldError.message)
        }
      }
      return false
    } finally {
      validationState.value.isValidating = false
    }
  }

  const validateForm = async (formData: Partial<ExpenseFormData>): Promise<boolean> => {
    try {
      validationState.value.isValidating = true
      clearAllErrors()
      errorHandling.clearError()
      
      await validationSchema.value.parseAsync(formData)
      return true
      
    } catch (error) {
      // Handle validation error with error handling composable
      errorHandling.handleValidationError(error)
      
      if (error instanceof Error && 'issues' in error) {
        const zodError = error as ZodError
        zodError.issues.forEach(issue => {
          const fieldName = issue.path[0] as string
          setFieldError(fieldName, issue.message)
        })
      }
      return false
    } finally {
      validationState.value.isValidating = false
    }
  }

  // Handle amount input changes with validation and formatting
  const handleAmountInput = (
    event: Event, 
    fieldName: 'incomeAmount' | 'expenseAmount',
    onFieldChange?: (field: 'incomeAmount' | 'expenseAmount', value: number) => void
  ): void => {
    const target = event.target as HTMLInputElement
    const validation = validateAmountInput(target.value)
    
    if (validation.isValid) {
      clearFieldError(fieldName)
      setFieldValue(fieldName, validation.value)
      // Call external handler if provided (for backward compatibility)
      onFieldChange?.(fieldName, validation.value)
    } else {
      setFieldError(fieldName, validation.error || '')
    }
    
    markFieldAsTouched(fieldName)
  }

  // Debounced validation for better UX
  let validationTimeout: NodeJS.Timeout | null = null
  
  const debouncedValidateField = (
    fieldName: keyof ExpenseFormData, 
    value: unknown, 
    delay: number = 300
  ): void => {
    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }
    
    validationTimeout = setTimeout(() => {
      validateField(fieldName, value)
    }, delay)
  }

  // Form reset
  const resetForm = (): void => {
    // Reset form values to initial state
    formValues.value = {
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      incomeAmount: 0,
      expenseAmount: 0,
      caseId: undefined,
      memo: '',
      tagIds: [],
      attachmentIds: [],
      ...initialData
    }
    
    // Reset validation state
    validationState.value = {
      isValid: false,
      isValidating: false,
      errors: {},
      touchedFields: new Set()
    }
    
    // Reset form state
    isDirty.value = false
    isSubmitting.value = false
    
    // Reset steps
    steps.resetSteps()
  }

  // Initialize form if initial data provided
  if (initialData) {
    // Could validate initial data here
    validateForm(initialData)
  }

  return {
    // State (readonly to prevent direct mutation)
    validationState: computed(() => ({
      isValid: validationState.value.isValid,
      isValidating: validationState.value.isValidating,
      errors: { ...validationState.value.errors },
      touchedFields: new Set(validationState.value.touchedFields)
    })),
    isDirty: readonly(isDirty),
    isSubmitting: readonly(isSubmitting),
    formValues,
    
    // Computed
    hasErrors,
    canSubmit,
    validationSchema,
    
    // Amount formatting
    formatAmountDisplay,
    formatAmountInput,
    validateAmountInput,
    handleAmountInput,
    
    // Field management
    markFieldAsTouched,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setFieldValue,
    
    // Validation
    validateField,
    validateForm,
    debouncedValidateField,
    
    // Form control
    resetForm,
    
    // Integration points
    steps,
    draft,
    errorHandling
  }
}

// Export types for better type safety
export type { IFormFieldState, IFormValidationState, IAmountInputConfig }