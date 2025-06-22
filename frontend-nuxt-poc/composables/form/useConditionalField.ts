import { computed, watch } from 'vue'
import { useField } from './useField'
import type { z } from 'zod'

/**
 * Condition function type
 */
export type ConditionFunction<T = any> = (values: T) => boolean

/**
 * Conditional field rule interface
 */
export interface ConditionalRule<T = any> {
  /** Condition that must be met */
  condition: ConditionFunction<T>
  /** Whether the field should be visible */
  visible?: boolean
  /** Whether the field should be required */
  required?: boolean
  /** Whether the field should be disabled */
  disabled?: boolean
  /** Whether the field should be readonly */
  readonly?: boolean
  /** Custom validation schema to apply */
  schema?: z.ZodSchema
  /** Default value to set when condition becomes true */
  defaultValue?: any
  /** Whether to clear value when condition becomes false */
  clearOnHide?: boolean
}

/**
 * Options for the useConditionalField composable
 */
export interface UseConditionalFieldOptions<T = any> {
  /** Form values to watch for changes */
  formValues: () => T
  /** Array of conditional rules */
  rules: ConditionalRule<T>[]
  /** Whether to apply rules immediately */
  immediate?: boolean
}

/**
 * Conditional field composable for managing field visibility and behavior based on form state
 * 
 * Provides reactive field properties that change based on form values,
 * enabling complex conditional logic in forms.
 * 
 * @param name - Field name
 * @param options - Configuration options
 * @returns Conditional field state and utilities
 */
export function useConditionalField<T = any>(
  name: string,
  options: UseConditionalFieldOptions<T>
) {
  const {
    formValues,
    rules,
    immediate = true
  } = options

  // Main field
  const field = useField(name)

  // Current form values
  const currentValues = computed(() => formValues())

  // Evaluate all conditions
  const evaluatedRules = computed(() => {
    const values = currentValues.value
    return rules.map(rule => ({
      ...rule,
      isActive: rule.condition(values)
    }))
  })

  // Computed field states based on active rules
  const isVisible = computed(() => {
    const visibilityRules = evaluatedRules.value.filter(rule => 
      rule.isActive && rule.visible !== undefined
    )
    
    if (visibilityRules.length === 0) return true
    
    // If any active rule sets visible to false, field is hidden
    return !visibilityRules.some(rule => rule.visible === false)
  })

  const isRequired = computed(() => {
    const requiredRules = evaluatedRules.value.filter(rule => 
      rule.isActive && rule.required !== undefined
    )
    
    if (requiredRules.length === 0) return false
    
    // If any active rule sets required to true, field is required
    return requiredRules.some(rule => rule.required === true)
  })

  const isDisabled = computed(() => {
    const disabledRules = evaluatedRules.value.filter(rule => 
      rule.isActive && rule.disabled !== undefined
    )
    
    if (disabledRules.length === 0) return false
    
    // If any active rule sets disabled to true, field is disabled
    return disabledRules.some(rule => rule.disabled === true)
  })

  const isReadonly = computed(() => {
    const readonlyRules = evaluatedRules.value.filter(rule => 
      rule.isActive && rule.readonly !== undefined
    )
    
    if (readonlyRules.length === 0) return false
    
    // If any active rule sets readonly to true, field is readonly
    return readonlyRules.some(rule => rule.readonly === true)
  })

  // Get the current validation schema
  const currentSchema = computed(() => {
    const schemaRules = evaluatedRules.value.filter(rule => 
      rule.isActive && rule.schema
    )
    
    // Return the last active schema (rules applied in order)
    return schemaRules.length > 0 ? schemaRules[schemaRules.length - 1].schema : null
  })

  // Watch for rule changes and apply side effects
  watch(
    evaluatedRules,
    (newRules, oldRules) => {
      const wasVisible = oldRules ? 
        oldRules.some(rule => rule.isActive && rule.visible !== false) : true
      
      const nowVisible = newRules.some(rule => rule.isActive && rule.visible !== false)

      // Handle visibility changes
      if (wasVisible && !nowVisible) {
        // Field became hidden
        const clearRule = newRules.find(rule => rule.isActive && rule.clearOnHide)
        if (clearRule) {
          field.handleChange(null)
        }
      } else if (!wasVisible && nowVisible) {
        // Field became visible
        const defaultRule = newRules.find(rule => rule.isActive && rule.defaultValue !== undefined)
        if (defaultRule && !field.value.value) {
          field.handleChange(defaultRule.defaultValue)
        }
      }

      // Handle requirement changes
      const newlyRequired = newRules.some(rule => rule.isActive && rule.required === true)
      const wasRequired = oldRules ? 
        oldRules.some(rule => rule.isActive && rule.required === true) : false

      if (newlyRequired && !wasRequired) {
        // Field became required - trigger validation
        field.validate()
      }
    },
    { immediate, deep: true }
  )

  /**
   * Check if a specific condition is currently active
   */
  const isConditionActive = (conditionFn: ConditionFunction<T>): boolean => {
    return conditionFn(currentValues.value)
  }

  /**
   * Get all currently active rules
   */
  const getActiveRules = () => {
    return evaluatedRules.value.filter(rule => rule.isActive)
  }

  /**
   * Manually trigger rule evaluation
   */
  const evaluate = () => {
    // Force re-evaluation by accessing the computed property
    return evaluatedRules.value
  }

  /**
   * Add a new conditional rule
   */
  const addRule = (rule: ConditionalRule<T>) => {
    rules.push(rule)
  }

  /**
   * Remove a conditional rule
   */
  const removeRule = (index: number) => {
    if (index >= 0 && index < rules.length) {
      rules.splice(index, 1)
    }
  }

  /**
   * Clear all rules
   */
  const clearRules = () => {
    rules.splice(0, rules.length)
  }

  return {
    // Field reference
    field,
    
    // Computed states
    isVisible: readonly(isVisible),
    isRequired: readonly(isRequired),
    isDisabled: readonly(isDisabled),
    isReadonly: readonly(isReadonly),
    currentSchema: readonly(currentSchema),
    
    // Rule information
    evaluatedRules: readonly(evaluatedRules),
    activeRules: computed(() => getActiveRules()),
    
    // Utilities
    isConditionActive,
    getActiveRules,
    evaluate,
    addRule,
    removeRule,
    clearRules
  }
}

/**
 * Helper function to create common condition functions
 */
export const createConditions = {
  /**
   * Field equals specific value
   */
  fieldEquals: <T>(fieldName: keyof T, value: any): ConditionFunction<T> => {
    return (values: T) => values[fieldName] === value
  },

  /**
   * Field is not empty
   */
  fieldNotEmpty: <T>(fieldName: keyof T): ConditionFunction<T> => {
    return (values: T) => {
      const value = values[fieldName]
      return value !== null && value !== undefined && value !== ''
    }
  },

  /**
   * Field is empty
   */
  fieldEmpty: <T>(fieldName: keyof T): ConditionFunction<T> => {
    return (values: T) => {
      const value = values[fieldName]
      return value === null || value === undefined || value === ''
    }
  },

  /**
   * Field value is in array
   */
  fieldIn: <T>(fieldName: keyof T, values: any[]): ConditionFunction<T> => {
    return (formValues: T) => values.includes(formValues[fieldName])
  },

  /**
   * Field value is greater than
   */
  fieldGreaterThan: <T>(fieldName: keyof T, threshold: number): ConditionFunction<T> => {
    return (values: T) => {
      const value = values[fieldName]
      return typeof value === 'number' && value > threshold
    }
  },

  /**
   * Field value is less than
   */
  fieldLessThan: <T>(fieldName: keyof T, threshold: number): ConditionFunction<T> => {
    return (values: T) => {
      const value = values[fieldName]
      return typeof value === 'number' && value < threshold
    }
  },

  /**
   * Combine conditions with AND logic
   */
  and: <T>(...conditions: ConditionFunction<T>[]): ConditionFunction<T> => {
    return (values: T) => conditions.every(condition => condition(values))
  },

  /**
   * Combine conditions with OR logic
   */
  or: <T>(...conditions: ConditionFunction<T>[]): ConditionFunction<T> => {
    return (values: T) => conditions.some(condition => condition(values))
  },

  /**
   * Negate a condition
   */
  not: <T>(condition: ConditionFunction<T>): ConditionFunction<T> => {
    return (values: T) => !condition(values)
  }
}

/**
 * Type for the return value of useConditionalField
 */
export type ConditionalFieldInstance<T = any> = ReturnType<typeof useConditionalField<T>>