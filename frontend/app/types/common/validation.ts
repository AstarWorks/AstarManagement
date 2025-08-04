/**
 * Validation rule function type
 */
export type ValidationRule<T = any> = (value: T) => string | boolean

/**
 * Validation rules collection for a form field
 */
export interface FieldValidationRules<T = any> {
  /** Field is required */
  required?: boolean | string
  /** Minimum length for strings */
  minLength?: number | [number, string]
  /** Maximum length for strings */
  maxLength?: number | [number, string]
  /** Minimum value for numbers */
  min?: number | [number, string]
  /** Maximum value for numbers */
  max?: number | [number, string]
  /** Regular expression pattern */
  pattern?: RegExp | [RegExp, string]
  /** Email validation */
  email?: boolean | string
  /** URL validation */
  url?: boolean | string
  /** Custom validation functions */
  custom?: ValidationRule<T>[]
}

/**
 * Form validation schema
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: FieldValidationRules<T[K]>
}

/**
 * Field validation result
 */
export interface FieldValidationResult {
  /** Whether the field is valid */
  isValid: boolean
  /** Validation error message */
  error?: string
  /** Error code for programmatic handling */
  code?: string
}

/**
 * Form validation result
 */
export interface FormValidationResult<T> {
  /** Whether the entire form is valid */
  isValid: boolean
  /** Field-specific validation results */
  fields: {
    [K in keyof T]?: FieldValidationResult
  }
  /** Global form errors */
  globalErrors: string[]
}

/**
 * Expense form validation schema
 */
export interface ExpenseValidationRules {
  date: FieldValidationRules<string>
  category: FieldValidationRules<string>
  description: FieldValidationRules<string>
  incomeAmount: FieldValidationRules<number>
  expenseAmount: FieldValidationRules<number>
  caseId: FieldValidationRules<string>
  memo: FieldValidationRules<string>
  tagIds: FieldValidationRules<string[]>
  attachmentIds: FieldValidationRules<string[]>
}

/**
 * Tag form validation schema
 */
export interface TagValidationRules {
  name: FieldValidationRules<string>
  color: FieldValidationRules<string>
  scope: FieldValidationRules<string>
}

/**
 * Common validation error codes
 */
export enum ValidationErrorCode {
  REQUIRED = 'REQUIRED',
  MIN_LENGTH = 'MIN_LENGTH',
  MAX_LENGTH = 'MAX_LENGTH',
  MIN_VALUE = 'MIN_VALUE',
  MAX_VALUE = 'MAX_VALUE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_URL = 'INVALID_URL',
  INVALID_DATE = 'INVALID_DATE',
  INVALID_COLOR = 'INVALID_COLOR',
  DUPLICATE_VALUE = 'DUPLICATE_VALUE',
  CUSTOM_ERROR = 'CUSTOM_ERROR'
}

/**
 * Validation configuration options
 */
export interface ValidationConfig {
  /** Whether to validate on field blur */
  validateOnBlur: boolean
  /** Whether to validate on field change */
  validateOnChange: boolean
  /** Whether to validate on form submit */
  validateOnSubmit: boolean
  /** Debounce delay for validation in milliseconds */
  debounceDelay: number
  /** Whether to stop validation on first error */
  stopOnFirstError: boolean
}

/**
 * Async validation function type
 */
export type AsyncValidationRule<T = any> = (value: T) => Promise<string | boolean>

/**
 * Async validation result
 */
export interface AsyncValidationResult {
  /** Whether the validation is complete */
  isComplete: boolean
  /** Whether the field is valid */
  isValid: boolean
  /** Validation error message */
  error?: string
  /** Error code */
  code?: string
  /** Whether validation is currently running */
  isValidating: boolean
}

/**
 * Cross-field validation rule
 */
export interface CrossFieldValidationRule<T> {
  /** Fields that this rule depends on */
  dependencies: (keyof T)[]
  /** Validation function */
  validator: (values: Partial<T>) => string | boolean
  /** Error message or message generator */
  message: string | ((values: Partial<T>) => string)
}

/**
 * Conditional validation rule
 */
export interface ConditionalValidationRule<T> {
  /** Condition function to determine if validation should run */
  condition: (value: T, formData: any) => boolean
  /** Validation rules to apply when condition is true */
  rules: FieldValidationRules<T>
}

/**
 * Dynamic validation schema that can change based on form state
 */
export type DynamicValidationSchema<T> = (formData: Partial<T>) => ValidationSchema<T>

/**
 * Validation event types
 */
export type ValidationEvent = 'blur' | 'change' | 'submit' | 'focus' | 'manual'

/**
 * Validation context for custom rules
 */
export interface ValidationContext<T> {
  /** Current field value */
  value: any
  /** All form data */
  formData: Partial<T>
  /** Field name being validated */
  fieldName: keyof T
  /** Validation event that triggered this validation */
  event: ValidationEvent
  /** Previous validation result */
  previousResult?: FieldValidationResult
}

/**
 * Server-side validation error format
 */
export interface ServerValidationError {
  /** Field path (supports nested fields with dot notation) */
  field: string
  /** Error message */
  message: string
  /** Error code */
  code: string
  /** Additional error context */
  context?: Record<string, any>
}

/**
 * Validation state for reactive forms
 */
export interface ReactiveValidationState<T> {
  /** Current validation results for each field */
  results: {
    [K in keyof T]?: FieldValidationResult
  }
  /** Whether form is currently being validated */
  isValidating: boolean
  /** Async validation states */
  asyncResults: {
    [K in keyof T]?: AsyncValidationResult
  }
  /** Cross-field validation errors */
  crossFieldErrors: string[]
  /** Server validation errors */
  serverErrors: ServerValidationError[]
  /** Last validation timestamp */
  lastValidated?: Date
}