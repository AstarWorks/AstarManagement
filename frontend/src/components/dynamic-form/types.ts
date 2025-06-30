/**
 * Type definitions for dynamic form components
 */

import type { ParsedTemplateVariable, FieldType } from '~/composables/form/types'

export interface FieldGroup {
  id: string
  section: string
  title: string
  description?: string
  fields: ParsedTemplateVariable[]
  columns: number
  collapsible?: boolean
  collapsed?: boolean
}

export interface FormLayout {
  type: 'auto' | 'manual' | 'grid' | 'single-column'
  columns?: number
  maxColumns?: number
  breakpoints?: {
    sm: number
    md: number
    lg: number
  }
}

export interface DynamicFormProps {
  variables: ParsedTemplateVariable[]
  initialData?: Record<string, any>
  layout?: FormLayout
  readonly?: boolean
  showSectionTitles?: boolean
  enableCollapsibleSections?: boolean
  submitButtonText?: string
  resetButtonText?: string
  showResetButton?: boolean
  validateOnMount?: boolean
}

export interface DynamicFormEmits {
  submit: [data: Record<string, any>]
  change: [data: Record<string, any>]
  reset: []
  fieldChange: [fieldName: string, value: any]
  validationChange: [isValid: boolean, errors: Record<string, string>]
}

export interface FieldComponentMapping {
  [key: string]: () => Promise<any>
}

export interface FieldProps {
  id: string
  name: string
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  variant?: string
  size?: 'sm' | 'md' | 'lg'
  description?: string
  helpText?: string
}

export interface DynamicFieldProps {
  variable: ParsedTemplateVariable
  modelValue?: any
  errors?: string[]
  disabled?: boolean
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export interface DynamicFieldEmits {
  'update:modelValue': [value: any]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  change: [value: any]
}

export interface FieldGroupProps {
  group: FieldGroup
  formData: Record<string, any>
  disabled?: boolean
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export interface FieldGroupEmits {
  update: [fieldName: string, value: any]
  groupToggle: [groupId: string, collapsed: boolean]
}

export interface FormValidationState {
  isValid: boolean
  errors: Record<string, string>
  touched: Record<string, boolean>
  isDirty: boolean
}

export interface FormSubmissionState {
  isSubmitting: boolean
  isSubmitted: boolean
  submitCount: number
  lastSubmittedAt?: Date
}

export interface DynamicFormState {
  validation: FormValidationState
  submission: FormSubmissionState
  formData: Record<string, any>
  fieldGroups: FieldGroup[]
}