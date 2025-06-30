import { computed, type ComputedRef } from 'vue'
import type { ParsedTemplateVariable, DerivedValueRule } from './types'

export interface FieldDependency {
  dependentField: string
  dependsOn: string[]
  rule?: DerivedValueRule
}

export interface DependencyUpdateResult {
  field: string
  oldValue: any
  newValue: any
  reason: string
}

export interface FieldDependenciesOptions {
  onDependencyUpdate?: (result: DependencyUpdateResult) => void
  enableDeepDependencies?: boolean
}

/**
 * Composable for managing field dependencies and derived values
 */
export function useFieldDependencies(
  variables: ComputedRef<ParsedTemplateVariable[]>,
  options: FieldDependenciesOptions = {}
) {
  const { onDependencyUpdate, enableDeepDependencies = true } = options

  /**
   * Calculate field dependencies based on conditions and derived values
   */
  const dependencies = computed<FieldDependency[]>(() => {
    const deps: FieldDependency[] = []
    
    variables.value.forEach(variable => {
      const dependsOn: string[] = []
      
      // Check conditional dependencies
      if (variable.conditions) {
        variable.conditions.forEach(condition => {
          const field = condition.when.field
          if (!dependsOn.includes(field)) {
            dependsOn.push(field)
          }
          
          // Add nested dependencies from AND/OR conditions
          if (enableDeepDependencies) {
            const nestedFields = extractNestedConditionFields(condition)
            nestedFields.forEach(field => {
              if (!dependsOn.includes(field)) {
                dependsOn.push(field)
              }
            })
          }
        })
      }
      
      // Check derived value dependencies
      if (variable.derivedValue) {
        if (variable.derivedValue.fields) {
          variable.derivedValue.fields.forEach(field => {
            if (!dependsOn.includes(field)) {
              dependsOn.push(field)
            }
          })
        }
        if (variable.derivedValue.sourceField && !dependsOn.includes(variable.derivedValue.sourceField)) {
          dependsOn.push(variable.derivedValue.sourceField)
        }
      }
      
      if (dependsOn.length > 0) {
        deps.push({
          dependentField: variable.name,
          dependsOn,
          rule: variable.derivedValue
        })
      }
    })
    
    return deps
  })

  /**
   * Extract fields from nested AND/OR conditions
   */
  const extractNestedConditionFields = (condition: any): string[] => {
    const fields: string[] = []
    
    if (condition.and) {
      condition.and.forEach((nestedCondition: any) => {
        if (nestedCondition.when?.field) {
          fields.push(nestedCondition.when.field)
        }
        fields.push(...extractNestedConditionFields(nestedCondition))
      })
    }
    
    if (condition.or) {
      condition.or.forEach((nestedCondition: any) => {
        if (nestedCondition.when?.field) {
          fields.push(nestedCondition.when.field)
        }
        fields.push(...extractNestedConditionFields(nestedCondition))
      })
    }
    
    return fields
  }

  /**
   * Get reverse dependency map (field -> list of fields that depend on it)
   */
  const reverseDependencies = computed<Record<string, string[]>>(() => {
    const reverseMap: Record<string, string[]> = {}
    
    dependencies.value.forEach(dep => {
      dep.dependsOn.forEach(sourceField => {
        if (!reverseMap[sourceField]) {
          reverseMap[sourceField] = []
        }
        if (!reverseMap[sourceField].includes(dep.dependentField)) {
          reverseMap[sourceField].push(dep.dependentField)
        }
      })
    })
    
    return reverseMap
  })

  /**
   * Calculate derived value based on rule
   */
  const calculateDerivedValue = (
    rule: DerivedValueRule,
    formData: Record<string, any>
  ): any => {
    try {
      switch (rule.type) {
        case 'concat':
          if (!rule.fields) return ''
          const values = rule.fields.map(field => {
            const value = formData[field]
            return value != null ? String(value) : ''
          }).filter(v => v !== '')
          return values.join(rule.separator || ' ')

        case 'sum':
          if (!rule.fields) return 0
          return rule.fields.reduce((sum, field) => {
            const value = formData[field]
            const num = typeof value === 'number' ? value : parseFloat(String(value))
            return sum + (isNaN(num) ? 0 : num)
          }, 0)

        case 'copy':
          if (!rule.sourceField) return null
          return formData[rule.sourceField] ?? null

        case 'custom':
          if (rule.compute && typeof rule.compute === 'function') {
            return rule.compute(formData)
          }
          return null

        default:
          console.warn(`Unknown derived value rule type: ${rule.type}`)
          return null
      }
    } catch (error) {
      console.error('Error calculating derived value:', error)
      return null
    }
  }

  /**
   * Update dependent fields when a source field changes
   */
  const updateDependentFields = (
    changedField: string,
    newValue: any,
    formData: Record<string, any>
  ): DependencyUpdateResult[] => {
    const results: DependencyUpdateResult[] = []
    const dependentFields = reverseDependencies.value[changedField] || []
    
    dependentFields.forEach(fieldName => {
      const dependency = dependencies.value.find(d => d.dependentField === fieldName)
      if (!dependency?.rule) return
      
      const oldValue = formData[fieldName]
      const newDerivedValue = calculateDerivedValue(dependency.rule, formData)
      
      if (newDerivedValue !== oldValue) {
        formData[fieldName] = newDerivedValue
        
        const result: DependencyUpdateResult = {
          field: fieldName,
          oldValue,
          newValue: newDerivedValue,
          reason: `Derived from ${changedField} change`
        }
        
        results.push(result)
        onDependencyUpdate?.(result)
        
        // Recursively update fields that depend on this derived field
        const cascadeResults = updateDependentFields(fieldName, newDerivedValue, formData)
        results.push(...cascadeResults)
      }
    })
    
    return results
  }

  /**
   * Get all fields that depend on a given field
   */
  const getDependentFields = (fieldName: string): string[] => {
    return reverseDependencies.value[fieldName] || []
  }

  /**
   * Get all fields that a given field depends on
   */
  const getFieldDependencies = (fieldName: string): string[] => {
    const dependency = dependencies.value.find(d => d.dependentField === fieldName)
    return dependency?.dependsOn || []
  }

  /**
   * Check if a field has dependencies
   */
  const hasFieldDependencies = (fieldName: string): boolean => {
    return getFieldDependencies(fieldName).length > 0
  }

  /**
   * Check if a field is depended upon by others
   */
  const isFieldDependedUpon = (fieldName: string): boolean => {
    return getDependentFields(fieldName).length > 0
  }

  /**
   * Get dependency chain for a field (what it depends on transitively)
   */
  const getDependencyChain = (fieldName: string, visited: Set<string> = new Set()): string[] => {
    if (visited.has(fieldName)) {
      // Circular dependency detected
      console.warn(`Circular dependency detected for field: ${fieldName}`)
      return []
    }
    
    visited.add(fieldName)
    const chain: string[] = []
    
    const directDeps = getFieldDependencies(fieldName)
    directDeps.forEach(dep => {
      chain.push(dep)
      const subChain = getDependencyChain(dep, new Set(visited))
      chain.push(...subChain)
    })
    
    return Array.from(new Set(chain)) // Remove duplicates
  }

  /**
   * Get affected fields when a field changes
   */
  const getAffectedFields = (fieldName: string, visited: Set<string> = new Set()): string[] => {
    if (visited.has(fieldName)) {
      return []
    }
    
    visited.add(fieldName)
    const affected: string[] = []
    
    const directDependents = getDependentFields(fieldName)
    directDependents.forEach(dep => {
      affected.push(dep)
      const subAffected = getAffectedFields(dep, new Set(visited))
      affected.push(...subAffected)
    })
    
    return Array.from(new Set(affected))
  }

  /**
   * Validate dependency graph for circular dependencies
   */
  const validateDependencies = (): { valid: boolean; cycles: string[][] } => {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const detectCycle = (field: string, path: string[]): boolean => {
      if (recursionStack.has(field)) {
        // Found cycle
        const cycleStart = path.indexOf(field)
        cycles.push(path.slice(cycleStart))
        return true
      }
      
      if (visited.has(field)) {
        return false
      }
      
      visited.add(field)
      recursionStack.add(field)
      
      const deps = getFieldDependencies(field)
      for (const dep of deps) {
        if (detectCycle(dep, [...path, field])) {
          return true
        }
      }
      
      recursionStack.delete(field)
      return false
    }
    
    // Check all fields
    variables.value.forEach(variable => {
      if (!visited.has(variable.name)) {
        detectCycle(variable.name, [])
      }
    })
    
    return {
      valid: cycles.length === 0,
      cycles
    }
  }

  /**
   * Get dependency summary
   */
  const dependencySummary = computed(() => {
    const summary = {
      totalDependencies: dependencies.value.length,
      fieldsWithDependencies: dependencies.value.map(d => d.dependentField),
      sourceFields: Object.keys(reverseDependencies.value),
      maxDependencyDepth: 0,
      circularDependencies: validateDependencies().cycles
    }
    
    // Calculate max dependency depth
    variables.value.forEach(variable => {
      const chain = getDependencyChain(variable.name)
      summary.maxDependencyDepth = Math.max(summary.maxDependencyDepth, chain.length)
    })
    
    return summary
  })

  return {
    // Computed
    dependencies,
    reverseDependencies,
    dependencySummary,

    // Methods
    calculateDerivedValue,
    updateDependentFields,
    getDependentFields,
    getFieldDependencies,
    hasFieldDependencies,
    isFieldDependedUpon,
    getDependencyChain,
    getAffectedFields,
    validateDependencies
  }
}