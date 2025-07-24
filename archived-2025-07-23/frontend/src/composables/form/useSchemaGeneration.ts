import { computed, type ComputedRef } from 'vue'
import { z, type ZodType, type ZodObject } from 'zod'
import type { ParsedTemplateVariable, FieldType, ValidationRule } from './types'
import type { useConditionalLogic } from './useConditionalLogic'

export interface SchemaGenerationOptions {
  includeHidden?: boolean
  includeDisabled?: boolean
  customValidators?: Record<string, (schema: ZodType) => ZodType>
}

/**
 * Composable for generating dynamic Zod validation schemas based on conditional logic
 */
export function useSchemaGeneration(
  variables: ComputedRef<ParsedTemplateVariable[]>,
  conditionalLogic: ReturnType<typeof useConditionalLogic>,
  options: SchemaGenerationOptions = {}
) {
  /**
   * Get base Zod schema for a field type
   */
  const getBaseSchema = (type: FieldType): ZodType => {
    const { base, variant } = type
    
    switch (base) {
      case 'text':
        if (variant === 'email') {
          return z.string().email('Please enter a valid email address')
        }
        if (variant === 'phone') {
          return z.string().regex(
            /^[\d\s\-\+\(\)]+$/,
            'Please enter a valid phone number'
          )
        }
        if (variant === 'url') {
          return z.string().url('Please enter a valid URL')
        }
        if (variant === 'textarea') {
          return z.string()
        }
        return z.string()
        
      case 'number':
        if (variant === 'currency') {
          // Handle currency as string that can be converted to number
          return z.string()
            .regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid amount')
            .transform(val => parseFloat(val))
            .refine(val => !isNaN(val), 'Invalid number')
        }
        if (variant === 'percentage') {
          return z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100')
        }
        if (variant === 'integer') {
          return z.number().int('Please enter a whole number')
        }
        return z.number()
        
      case 'date':
        if (variant === 'datetime') {
          return z.string().datetime()
        }
        if (variant === 'time') {
          return z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please enter a valid time (HH:MM)')
        }
        return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)')
        
      case 'checkbox':
        return z.boolean()
        
      case 'select':
        // Will be refined with options later
        return z.string()
        
      case 'email':
        return z.string().email('Please enter a valid email address')
        
      case 'phone':
        return z.string().regex(
          /^[\d\s\-\+\(\)]+$/,
          'Please enter a valid phone number'
        )
        
      case 'custom':
        // Default to string for custom types
        return z.string()
        
      default:
        return z.string()
    }
  }

  /**
   * Apply validation rules to a schema
   */
  const applyValidationRule = (schema: ZodType, rule: ValidationRule): ZodType => {
    try {
      switch (rule.type) {
        case 'required':
          // This is handled separately
          return schema
          
        case 'minLength':
          if (schema instanceof z.ZodString) {
            return schema.min(rule.value, rule.message)
          }
          break
          
        case 'maxLength':
          if (schema instanceof z.ZodString) {
            return schema.max(rule.value, rule.message)
          }
          break
          
        case 'pattern':
          if (schema instanceof z.ZodString) {
            return schema.regex(new RegExp(rule.value), rule.message)
          }
          break
          
        case 'min':
          if (schema instanceof z.ZodNumber) {
            return schema.min(rule.value, rule.message)
          }
          break
          
        case 'max':
          if (schema instanceof z.ZodNumber) {
            return schema.max(rule.value, rule.message)
          }
          break
          
        case 'custom':
          // Apply custom validation if provided
          if (rule.value && typeof rule.value === 'function') {
            return schema.refine(rule.value, rule.message)
          }
          break
      }
    } catch (error) {
      console.warn(`Failed to apply validation rule ${rule.type}:`, error)
    }
    
    return schema
  }

  /**
   * Apply field options to select/radio schemas
   */
  const applyFieldOptions = (schema: ZodType, variable: ParsedTemplateVariable): ZodType => {
    if (variable.type.base === 'select' && variable.options && variable.options.length > 0) {
      const validValues = variable.options
        .filter(opt => !opt.disabled)
        .map(opt => String(opt.value))
      
      if (validValues.length > 0) {
        return z.enum(validValues as [string, ...string[]], {
          errorMap: () => ({ message: 'Please select a valid option' })
        })
      }
    }
    
    return schema
  }

  /**
   * Generate Zod schema based on current field states
   */
  const schema = computed<ZodObject<any>>(() => {
    const shape: Record<string, ZodType> = {}
    
    variables.value.forEach(variable => {
      // Skip hidden fields unless explicitly included
      if (!options.includeHidden && conditionalLogic.fieldVisibility.value[variable.name] === false) {
        return
      }
      
      // Skip disabled fields unless explicitly included
      if (!options.includeDisabled && conditionalLogic.fieldEnabled.value[variable.name] === false) {
        return
      }
      
      // Get base schema for field type
      let fieldSchema = getBaseSchema(variable.type)
      
      // Apply field options (for select/radio)
      fieldSchema = applyFieldOptions(fieldSchema, variable)
      
      // Apply validation rules
      if (variable.validation) {
        variable.validation.forEach(rule => {
          fieldSchema = applyValidationRule(fieldSchema, rule)
        })
      }
      
      // Apply conditional required state
      const isRequired = conditionalLogic.fieldRequired.value[variable.name] ?? variable.required
      if (!isRequired && 'optional' in fieldSchema) {
        fieldSchema = (fieldSchema as any).optional()
      }
      
      // Apply custom validators if provided
      const customValidator = options.customValidators?.[variable.name]
      if (customValidator) {
        fieldSchema = customValidator(fieldSchema)
      }
      
      // Handle array fields
      if (variable.isArray) {
        fieldSchema = z.array(fieldSchema)
        if (isRequired) {
          fieldSchema = (fieldSchema as any).min(1, `At least one ${variable.label} is required`)
        }
      }
      
      shape[variable.name] = fieldSchema
    })
    
    return z.object(shape)
  })

  /**
   * Validate a single field
   */
  const validateField = async (fieldName: string, value: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const fieldSchema = schema.value.shape[fieldName]
      if (!fieldSchema) {
        return { success: true }
      }
      
      await fieldSchema.parseAsync(value)
      return { success: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0]?.message || 'Invalid value' }
      }
      return { success: false, error: 'Validation failed' }
    }
  }

  /**
   * Validate all fields
   */
  const validateAll = async (data: Record<string, any>): Promise<{ success: boolean; errors?: Record<string, string> }> => {
    try {
      await schema.value.parseAsync(data)
      return { success: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          if (path && !errors[path]) {
            errors[path] = err.message
          }
        })
        return { success: false, errors }
      }
      return { success: false, errors: { _error: 'Validation failed' } }
    }
  }

  /**
   * Get schema for a specific field
   */
  const getFieldSchema = (fieldName: string): ZodType | undefined => {
    return schema.value.shape[fieldName]
  }

  /**
   * Check if a field is required
   */
  const isFieldRequired = (fieldName: string): boolean => {
    const fieldSchema = getFieldSchema(fieldName)
    if (!fieldSchema) return false
    
    // Check if schema is optional
    return !(fieldSchema as any).isOptional?.()
  }

  /**
   * Get all required fields
   */
  const requiredFields = computed(() => {
    return Object.keys(schema.value.shape).filter(fieldName => isFieldRequired(fieldName))
  })

  /**
   * Get validation rules for a field
   */
  const getFieldValidation = (fieldName: string): ValidationRule[] => {
    const variable = variables.value.find(v => v.name === fieldName)
    return variable?.validation || []
  }

  return {
    // Main schema
    schema,
    
    // Methods
    getBaseSchema,
    applyValidationRule,
    validateField,
    validateAll,
    getFieldSchema,
    isFieldRequired,
    getFieldValidation,
    
    // Computed
    requiredFields
  }
}