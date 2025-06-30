/**
 * Form Validation Composable
 * Generates Zod validation schemas from template variables
 */

import { z } from 'zod'
import type { ParsedTemplateVariable, ValidationRule } from './types'

/**
 * Generate a Zod validation schema from template variables
 */
export function generateValidationSchema(variables: ParsedTemplateVariable[]): z.ZodObject<any> {
  const schemaShape: Record<string, z.ZodTypeAny> = {}
  
  variables.forEach(variable => {
    const fieldSchema = createFieldSchema(variable)
    schemaShape[variable.name] = fieldSchema
  })
  
  return z.object(schemaShape)
}

/**
 * Create Zod schema for a single field
 */
function createFieldSchema(variable: ParsedTemplateVariable): z.ZodTypeAny {
  const { type, required, validation, metadata } = variable
  
  let schema: z.ZodTypeAny
  
  // Base schema based on field type
  switch (type.base) {
    case 'text':
      schema = createTextSchema(type.variant, validation, metadata)
      break
    
    case 'number':
      schema = createNumberSchema(type.variant, validation, metadata)
      break
    
    case 'date':
      schema = createDateSchema(type.variant, validation, metadata)
      break
    
    case 'checkbox':
      schema = z.boolean()
      break
    
    case 'select':
      schema = createSelectSchema(type.variant, validation, metadata)
      break
    
    case 'custom':
      schema = createCustomSchema(type.variant, validation, metadata)
      break
    
    default:
      schema = z.string()
  }
  
  // Apply required/optional
  if (!required) {
    schema = schema.optional()
  } else {
    // Ensure required fields don't accept empty strings
    if (schema instanceof z.ZodString) {
      schema = schema.min(1, 'This field is required')
    }
  }
  
  // Apply custom validation rules
  if (validation) {
    schema = applyValidationRules(schema, validation)
  }
  
  return schema
}

/**
 * Create text field schema
 */
function createTextSchema(
  variant?: string,
  validation?: ValidationRule[],
  metadata?: any
): z.ZodString {
  let schema = z.string({
    required_error: 'This field is required'
  })
  
  // Apply variant-specific validation
  switch (variant) {
    case 'email':
      schema = schema.email('Please enter a valid email address')
      break
    
    case 'phone':
      schema = schema.regex(
        /^[\d\s\-\(\)\+]+$/,
        'Please enter a valid phone number'
      )
      break
    
    case 'url':
      schema = schema.url('Please enter a valid URL')
      break
    
    case 'textarea':
      // Text areas typically have longer content
      break
  }
  
  // Apply length constraints
  if (metadata?.minLength) {
    schema = schema.min(metadata.minLength, `Must be at least ${metadata.minLength} characters`)
  }
  
  if (metadata?.maxLength) {
    schema = schema.max(metadata.maxLength, `Must be no more than ${metadata.maxLength} characters`)
  }
  
  return schema
}

/**
 * Create number field schema
 */
function createNumberSchema(
  variant?: string,
  validation?: ValidationRule[],
  metadata?: any
): z.ZodNumber | z.ZodString | z.ZodEffects<any> {
  // Currency fields are handled as strings that can be coerced to numbers
  if (variant === 'currency') {
    return z.string()
      .min(1, 'Amount is required')
      .regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid amount')
      .transform(val => parseFloat(val))
      .refine(val => val >= 0, 'Amount cannot be negative')
  }
  
  let schema = z.number({
    invalid_type_error: 'Please enter a valid number'
  })
  
  // Apply variant-specific validation
  switch (variant) {
    
    case 'percentage':
      schema = schema.min(0, 'Percentage cannot be negative')
                   .max(100, 'Percentage cannot exceed 100')
      break
    
    case 'integer':
      schema = schema.int('Must be a whole number')
      break
  }
  
  // Apply range constraints
  if (metadata?.min !== undefined) {
    schema = schema.min(metadata.min, `Must be at least ${metadata.min}`)
  }
  
  if (metadata?.max !== undefined) {
    schema = schema.max(metadata.max, `Must be no more than ${metadata.max}`)
  }
  
  return schema
}

/**
 * Create date field schema
 */
function createDateSchema(
  variant?: string,
  validation?: ValidationRule[],
  metadata?: any
): z.ZodDate {
  let schema = z.date({
    invalid_type_error: 'Please enter a valid date'
  })
  
  // Apply date range constraints
  if (metadata?.minDate) {
    const minDate = new Date(metadata.minDate)
    schema = schema.min(minDate, `Date must be after ${minDate.toLocaleDateString()}`)
  }
  
  if (metadata?.maxDate) {
    const maxDate = new Date(metadata.maxDate)
    schema = schema.max(maxDate, `Date must be before ${maxDate.toLocaleDateString()}`)
  }
  
  return schema
}

/**
 * Create select field schema
 */
function createSelectSchema(
  variant?: string,
  validation?: ValidationRule[],
  metadata?: any
): z.ZodString | z.ZodArray<any> | z.ZodEnum<any> {
  const options = metadata?.options || []
  const validValues = options.map((opt: any) => 
    typeof opt === 'string' ? opt : opt.value
  )
  
  if (variant === 'multi-select' || metadata?.multiple) {
    return z.array(z.enum(validValues as [string, ...string[]])).min(1, 'Please select at least one option')
  }
  
  if (validValues.length > 0) {
    return z.enum(validValues as [string, ...string[]], {
      required_error: 'Please select an option'
    })
  }
  
  return z.string().min(1, 'Please select an option')
}

/**
 * Create custom field schema
 */
function createCustomSchema(
  variant?: string,
  validation?: ValidationRule[],
  metadata?: any
): z.ZodString {
  let schema = z.string()
  
  switch (variant) {
    case 'case-number':
      schema = schema.regex(
        /^[0-9]{4}-[A-Z]{2}-[0-9]{5}$/,
        'Please enter a valid case number (e.g., 2024-CV-12345)'
      )
      break
    
    case 'attorney-name':
      schema = schema.min(2, 'Name must be at least 2 characters')
                   .max(100, 'Name must be less than 100 characters')
      break
    
    case 'court-list':
      // This would typically be handled as a select field
      schema = z.string().min(1, 'Please select a court')
      break
  }
  
  return schema
}

/**
 * Apply custom validation rules to schema
 */
function applyValidationRules(
  schema: z.ZodTypeAny,
  rules: ValidationRule[]
): z.ZodTypeAny {
  let result = schema
  
  rules.forEach(rule => {
    switch (rule.type) {
      case 'required':
        // Required is handled at the field level
        break
      
      case 'pattern':
        if (result instanceof z.ZodString && rule.value instanceof RegExp) {
          result = result.regex(rule.value, rule.message)
        }
        break
      
      case 'min':
        if (result instanceof z.ZodString && typeof rule.value === 'number') {
          result = result.min(rule.value, rule.message)
        } else if (result instanceof z.ZodNumber && typeof rule.value === 'number') {
          result = result.min(rule.value, rule.message)
        }
        break
      
      case 'max':
        if (result instanceof z.ZodString && typeof rule.value === 'number') {
          result = result.max(rule.value, rule.message)
        } else if (result instanceof z.ZodNumber && typeof rule.value === 'number') {
          result = result.max(rule.value, rule.message)
        }
        break
      
      case 'custom':
        if (typeof rule.value === 'function') {
          result = result.refine(rule.value, { message: rule.message })
        }
        break
    }
  })
  
  return result
}

/**
 * Validate a single field value
 */
export function validateField(
  variable: ParsedTemplateVariable,
  value: any
): { isValid: boolean; errors: string[] } {
  const schema = createFieldSchema(variable)
  
  try {
    schema.parse(value)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message)
      }
    }
    
    return {
      isValid: false,
      errors: ['Validation error occurred']
    }
  }
}

/**
 * Get field validation schema for a specific field
 */
export function getFieldValidationSchema(variable: ParsedTemplateVariable): z.ZodTypeAny {
  return createFieldSchema(variable)
}

/**
 * Create a partial validation schema for form sections
 */
export function createPartialValidationSchema(
  variables: ParsedTemplateVariable[],
  fieldNames: string[]
): z.ZodObject<any> {
  const schemaShape: Record<string, z.ZodTypeAny> = {}
  
  variables
    .filter(variable => fieldNames.includes(variable.name))
    .forEach(variable => {
      schemaShape[variable.name] = createFieldSchema(variable)
    })
  
  return z.object(schemaShape)
}