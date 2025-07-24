/**
 * Field Component Mapping Composable
 * Maps field types to appropriate Vue components and props
 */

import { computed, type Component } from 'vue'
import type { ParsedTemplateVariable, FieldType } from './types'
import type { FieldProps } from '~/components/dynamic-form/types'

export interface FieldMappingOptions {
  disabled?: boolean
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function useFieldMapping(
  variable: ParsedTemplateVariable,
  options: FieldMappingOptions = {}
) {
  // Component mapping with lazy loading
  const fieldComponentMap: Record<string, () => Promise<Component>> = {
    // Text-based inputs
    text: () => import('~/components/forms/FormInput.vue'),
    textarea: () => import('~/components/forms/FormTextarea.vue'),
    email: () => import('~/components/forms/FormInput.vue'),
    phone: () => import('~/components/forms/FormInput.vue'),
    url: () => import('~/components/forms/FormInput.vue'),
    
    // Number inputs
    number: () => import('~/components/forms/FormInput.vue'),
    currency: () => import('~/components/forms/FormInput.vue'),
    percentage: () => import('~/components/forms/FormInput.vue'),
    
    // Date/time inputs
    date: () => import('~/components/forms/FormDatePicker.vue'),
    time: () => import('~/components/forms/FormInput.vue'),
    datetime: () => import('~/components/forms/FormDatePicker.vue'),
    
    // Selection inputs
    select: () => import('~/components/forms/FormSelect.vue'),
    radio: () => import('~/components/forms/FormRadio.vue'),
    checkbox: () => import('~/components/forms/FormCheckbox.vue'),
    switch: () => import('~/components/forms/FormSwitch.vue'),
    
    // File inputs
    file: () => import('~/components/forms/FormInput.vue'),
    
    // Custom legal field types
    'case-number': () => import('~/components/forms/FormInput.vue'),
    'court-list': () => import('~/components/forms/FormSelect.vue'),
    'attorney-name': () => import('~/components/forms/FormInput.vue'),
    'legal-status': () => import('~/components/forms/FormSelect.vue')
  }

  // Determine component based on field type
  const fieldComponent = computed(() => {
    const { base, variant } = variable.type
    
    // Try variant first, then base type
    const componentKey = variant || base
    const componentLoader = fieldComponentMap[componentKey]
    
    // Fallback to text input if no mapping found
    return componentLoader || fieldComponentMap.text
  })

  // Generate props for the field component
  const fieldProps = computed((): FieldProps & Record<string, any> => {
    const baseProps: FieldProps = {
      id: variable.name,
      name: variable.name,
      label: variable.label,
      placeholder: variable.placeholder,
      required: variable.required ?? false,
      disabled: options.disabled ?? false,
      readonly: options.readonly ?? false,
      size: options.size ?? 'md',
      description: variable.metadata?.description,
      helpText: variable.metadata?.helpText
    }

    // Add type-specific props
    const typeSpecificProps = getTypeSpecificProps(variable.type, variable)
    
    return {
      ...baseProps,
      ...typeSpecificProps
    }
  })

  return {
    fieldComponent,
    fieldProps
  }
}

/**
 * Get props specific to field type
 */
function getTypeSpecificProps(
  fieldType: FieldType, 
  variable: ParsedTemplateVariable
): Record<string, any> {
  const { base, variant, format } = fieldType

  switch (base) {
    case 'text':
      return getTextProps(variant, variable)
    
    case 'number':
      return getNumberProps(variant, format, variable)
    
    case 'date':
      return getDateProps(variant, format, variable)
    
    case 'select':
      return getSelectProps(variant, variable)
    
    case 'checkbox':
      return getCheckboxProps(variable)
    
    case 'custom':
      return getCustomProps(variant, variable)
    
    default:
      return {}
  }
}

/**
 * Text field specific props
 */
function getTextProps(variant?: string, variable?: ParsedTemplateVariable): Record<string, any> {
  const props: Record<string, any> = {}

  switch (variant) {
    case 'email':
      props.type = 'email'
      props.autocomplete = 'email'
      props.inputmode = 'email'
      break
    
    case 'phone':
      props.type = 'tel'
      props.autocomplete = 'tel'
      props.inputmode = 'tel'
      break
    
    case 'url':
      props.type = 'url'
      props.autocomplete = 'url'
      props.inputmode = 'url'
      break
    
    case 'textarea':
      props.rows = variable?.metadata?.rows || 4
      props.resize = variable?.metadata?.resize !== false
      break
    
    case 'password':
      props.type = 'password'
      props.autocomplete = 'current-password'
      break
    
    default:
      props.type = 'text'
  }

  // Add character limits
  if (variable?.metadata?.maxLength) {
    props.maxlength = variable.metadata.maxLength
  }

  return props
}

/**
 * Number field specific props
 */
function getNumberProps(
  variant?: string, 
  format?: string, 
  variable?: ParsedTemplateVariable
): Record<string, any> {
  const props: Record<string, any> = {
    type: 'number',
    inputmode: 'numeric'
  }

  switch (variant) {
    case 'currency':
      props.step = '0.01'
      props.min = '0'
      props.prefix = '¥'
      break
    
    case 'percentage':
      props.step = '0.1'
      props.min = '0'
      props.max = '100'
      props.suffix = '%'
      break
    
    case 'integer':
      props.step = '1'
      break
    
    default:
      props.step = format === 'integer' ? '1' : '0.01'
  }

  // Add min/max from metadata
  if (variable?.metadata?.min !== undefined) {
    props.min = variable.metadata.min
  }
  if (variable?.metadata?.max !== undefined) {
    props.max = variable.metadata.max
  }

  return props
}

/**
 * Date field specific props
 */
function getDateProps(
  variant?: string, 
  format?: string, 
  variable?: ParsedTemplateVariable
): Record<string, any> {
  const props: Record<string, any> = {}

  switch (variant) {
    case 'datetime':
      props.showTime = true
      props.format = format || 'yyyy-MM-dd HH:mm'
      break
    
    case 'time':
      props.timeOnly = true
      props.format = format || 'HH:mm'
      break
    
    default:
      props.format = format || 'yyyy-MM-dd'
  }

  // Add date constraints from metadata
  if (variable?.metadata?.minDate) {
    props.minDate = variable.metadata.minDate
  }
  if (variable?.metadata?.maxDate) {
    props.maxDate = variable.metadata.maxDate
  }

  return props
}

/**
 * Select field specific props
 */
function getSelectProps(variant?: string, variable?: ParsedTemplateVariable): Record<string, any> {
  const props: Record<string, any> = {
    options: variable?.metadata?.options || []
  }

  switch (variant) {
    case 'court-list':
      props.options = getCourtOptions()
      props.searchable = true
      break
    
    case 'legal-status':
      props.options = getLegalStatusOptions()
      break
    
    case 'multi-select':
      props.multiple = true
      break
  }

  // Add searchable option for large lists
  if (props.options.length > 10) {
    props.searchable = true
  }

  return props
}

/**
 * Checkbox field specific props
 */
function getCheckboxProps(variable?: ParsedTemplateVariable): Record<string, any> {
  return {
    checked: variable?.defaultValue === true
  }
}

/**
 * Custom field specific props
 */
function getCustomProps(variant?: string, variable?: ParsedTemplateVariable): Record<string, any> {
  switch (variant) {
    case 'case-number':
      return {
        pattern: '[0-9]{4}-[A-Z]{2}-[0-9]{5}',
        placeholder: '2024-CV-12345'
      }
    
    case 'attorney-name':
      return {
        autocomplete: 'name',
        capitalize: true
      }
    
    default:
      return {}
  }
}

/**
 * Get Japanese court options
 */
function getCourtOptions() {
  return [
    { value: 'tokyo-dc', label: '東京地方裁判所 (Tokyo District Court)' },
    { value: 'osaka-dc', label: '大阪地方裁判所 (Osaka District Court)' },
    { value: 'nagoya-dc', label: '名古屋地方裁判所 (Nagoya District Court)' },
    { value: 'fukuoka-dc', label: '福岡地方裁判所 (Fukuoka District Court)' },
    { value: 'sendai-dc', label: '仙台地方裁判所 (Sendai District Court)' },
    { value: 'sapporo-dc', label: '札幌地方裁判所 (Sapporo District Court)' },
    { value: 'hiroshima-dc', label: '広島地方裁判所 (Hiroshima District Court)' },
    { value: 'takamatsu-dc', label: '高松地方裁判所 (Takamatsu District Court)' }
  ]
}

/**
 * Get legal status options
 */
function getLegalStatusOptions() {
  return [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'archived', label: 'Archived' }
  ]
}