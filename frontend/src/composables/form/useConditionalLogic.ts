import { ref, computed, watch, readonly, type Ref } from 'vue'
import type { ParsedTemplateVariable, FieldCondition } from './types'

export interface ConditionalLogicOptions {
  onVisibilityChange?: (fieldName: string, visible: boolean) => void
  onEnabledChange?: (fieldName: string, enabled: boolean) => void
  onRequiredChange?: (fieldName: string, required: boolean) => void
}

export interface ConditionalLogicState {
  fieldVisibility: Record<string, boolean>
  fieldEnabled: Record<string, boolean>
  fieldRequired: Record<string, boolean>
}

/**
 * Composable for managing conditional field logic in dynamic forms
 * Handles show/hide, enable/disable, and required field conditions
 */
export function useConditionalLogic(
  variables: Ref<ParsedTemplateVariable[]>,
  formData: Ref<Record<string, any>>,
  options: ConditionalLogicOptions = {}
) {
  // Field state tracking
  const fieldVisibility = ref<Record<string, boolean>>({})
  const fieldEnabled = ref<Record<string, boolean>>({})
  const fieldRequired = ref<Record<string, boolean>>({})

  /**
   * Evaluate a simple condition
   */
  const evaluateCondition = (condition: FieldCondition): boolean => {
    const fieldValue = formData.value[condition.when.field]
    
    switch (condition.when.operator) {
      case 'equals':
        return fieldValue === condition.when.value
      case 'notEquals':
        return fieldValue !== condition.when.value
      case 'contains':
        return String(fieldValue || '').includes(String(condition.when.value))
      case 'notContains':
        return !String(fieldValue || '').includes(String(condition.when.value))
      case 'gt':
        return Number(fieldValue) > Number(condition.when.value)
      case 'gte':
        return Number(fieldValue) >= Number(condition.when.value)
      case 'lt':
        return Number(fieldValue) < Number(condition.when.value)
      case 'lte':
        return Number(fieldValue) <= Number(condition.when.value)
      case 'isEmpty':
        return !fieldValue || fieldValue === '' || fieldValue === null || fieldValue === undefined
      case 'isNotEmpty':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
      case 'in':
        return Array.isArray(condition.when.value) && condition.when.value.includes(fieldValue)
      case 'notIn':
        return Array.isArray(condition.when.value) && !condition.when.value.includes(fieldValue)
      case 'matches':
        return new RegExp(String(condition.when.value)).test(String(fieldValue || ''))
      case 'notMatches':
        return !new RegExp(String(condition.when.value)).test(String(fieldValue || ''))
      default:
        console.warn(`Unknown operator: ${condition.when.operator}`)
        return false
    }
  }

  /**
   * Evaluate complex conditions with AND/OR logic
   */
  const evaluateComplexCondition = (condition: FieldCondition): boolean => {
    let result = evaluateCondition(condition)
    
    // Evaluate AND conditions
    if (condition.and && condition.and.length > 0) {
      result = result && condition.and.every(c => evaluateComplexCondition(c))
    }
    
    // Evaluate OR conditions
    if (condition.or && condition.or.length > 0) {
      result = result || condition.or.some(c => evaluateComplexCondition(c))
    }
    
    return result
  }

  /**
   * Update field states based on conditions
   */
  const updateFieldStates = () => {
    variables.value.forEach(variable => {
      const fieldName = variable.name
      
      // Initialize field states with defaults
      if (fieldVisibility.value[fieldName] === undefined) {
        fieldVisibility.value[fieldName] = true
      }
      if (fieldEnabled.value[fieldName] === undefined) {
        fieldEnabled.value[fieldName] = !variable.disabled
      }
      if (fieldRequired.value[fieldName] === undefined) {
        fieldRequired.value[fieldName] = variable.required || false
      }
      
      // Process conditions - each condition can override the defaults
      if (variable.conditions && variable.conditions.length > 0) {
        variable.conditions.forEach(condition => {
          const shouldApply = evaluateComplexCondition(condition)
          const previousVisibility = fieldVisibility.value[fieldName]
          const previousEnabled = fieldEnabled.value[fieldName]
          const previousRequired = fieldRequired.value[fieldName]
          
          switch (condition.type) {
            case 'show':
              fieldVisibility.value[fieldName] = shouldApply
              if (previousVisibility !== shouldApply) {
                options.onVisibilityChange?.(fieldName, shouldApply)
              }
              break
            case 'hide':
              fieldVisibility.value[fieldName] = !shouldApply
              if (previousVisibility !== !shouldApply) {
                options.onVisibilityChange?.(fieldName, !shouldApply)
              }
              break
            case 'enable':
              fieldEnabled.value[fieldName] = shouldApply
              if (previousEnabled !== shouldApply) {
                options.onEnabledChange?.(fieldName, shouldApply)
              }
              break
            case 'disable':
              fieldEnabled.value[fieldName] = !shouldApply
              if (previousEnabled !== !shouldApply) {
                options.onEnabledChange?.(fieldName, !shouldApply)
              }
              break
            case 'require':
              fieldRequired.value[fieldName] = shouldApply
              if (previousRequired !== shouldApply) {
                options.onRequiredChange?.(fieldName, shouldApply)
              }
              break
          }
        })
      }
    })
  }

  /**
   * Get current field state
   */
  const getFieldState = (fieldName: string, type: FieldCondition['type']): boolean => {
    switch (type) {
      case 'show':
      case 'hide':
        return fieldVisibility.value[fieldName] ?? true
      case 'enable':
      case 'disable':
        return fieldEnabled.value[fieldName] ?? true
      case 'require':
        return fieldRequired.value[fieldName] ?? false
    }
  }

  /**
   * Check if a field is visible
   */
  const isFieldVisible = (fieldName: string): boolean => {
    return fieldVisibility.value[fieldName] ?? true
  }

  /**
   * Check if a field is enabled
   */
  const isFieldEnabled = (fieldName: string): boolean => {
    return fieldEnabled.value[fieldName] ?? true
  }

  /**
   * Check if a field is required
   */
  const isFieldRequired = (fieldName: string): boolean => {
    return fieldRequired.value[fieldName] ?? false
  }

  /**
   * Get all visible fields
   */
  const visibleFields = computed(() => {
    return variables.value.filter(v => isFieldVisible(v.name))
  })

  /**
   * Get all enabled fields
   */
  const enabledFields = computed(() => {
    return variables.value.filter(v => isFieldEnabled(v.name))
  })

  /**
   * Get all required fields
   */
  const requiredFields = computed(() => {
    return variables.value.filter(v => isFieldRequired(v.name))
  })

  /**
   * Get conditional logic state summary
   */
  const state = computed<ConditionalLogicState>(() => ({
    fieldVisibility: { ...fieldVisibility.value },
    fieldEnabled: { ...fieldEnabled.value },
    fieldRequired: { ...fieldRequired.value }
  }))

  /**
   * Reset all field states to defaults
   */
  const reset = () => {
    variables.value.forEach(variable => {
      fieldVisibility.value[variable.name] = true
      fieldEnabled.value[variable.name] = !variable.disabled
      fieldRequired.value[variable.name] = variable.required || false
    })
  }

  // Watch for form data changes
  watch(formData, updateFieldStates, { deep: true })

  // Watch for variable changes
  watch(variables, updateFieldStates, { deep: true })

  // Initialize field states immediately
  updateFieldStates()

  return {
    // State
    fieldVisibility: readonly(fieldVisibility),
    fieldEnabled: readonly(fieldEnabled),
    fieldRequired: readonly(fieldRequired),
    state: readonly(state),
    
    // Computed
    visibleFields,
    enabledFields,
    requiredFields,
    
    // Methods
    evaluateCondition,
    evaluateComplexCondition,
    updateFieldStates,
    isFieldVisible,
    isFieldEnabled,
    isFieldRequired,
    reset
  }
}