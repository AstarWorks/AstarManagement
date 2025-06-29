# T10C_S13: Conditional Logic and Validation - Advanced Form Behavior

**Status**: TODO
**Priority**: High
**Complexity**: Medium
**Estimated Hours**: 6-8

## Overview

Implement advanced conditional logic and dynamic validation for the dynamic form builder. This system will handle show/hide conditions, field dependencies, dynamic validation rules, data pre-filling from external sources, and complex form state management including auto-save and undo/redo functionality.

## Requirements

### Core Features

1. **Conditional Field Logic**
   - Show/hide fields based on other field values
   - Enable/disable fields conditionally
   - Dynamic required field conditions
   - Cascading field dependencies
   - Complex condition evaluation (AND/OR logic)

2. **Dynamic Validation**
   - Generate Zod schemas from template metadata
   - Field-level validation with real-time feedback
   - Cross-field validation support
   - Async validation for uniqueness checks
   - Custom validation rules for legal requirements

3. **Data Pre-filling**
   - Load data from matter records
   - Load data from client records
   - Support for computed/derived values
   - Default value resolution with priority system
   - Data transformation and formatting

4. **Advanced Form State**
   - Auto-save functionality with debouncing
   - Undo/redo support for form changes
   - Form progress tracking
   - Dirty state management
   - Change history and audit trail

5. **Field Dependencies**
   - Parent-child field relationships
   - Dependent field updates
   - Cascade value propagation
   - Validation dependency chains

### Technical Architecture

#### Component Structure
```
components/
├── dynamic-form/
│   ├── ConditionalFieldWrapper.vue  # Conditional logic wrapper
│   ├── ValidationRuleBuilder.vue    # Dynamic validation rules  
│   ├── PreFillManager.vue          # Data pre-filling component
│   └── FormStateManager.vue        # Advanced state management
```

#### Composable Structure
```
composables/
├── form/
│   ├── useConditionalLogic.ts      # Conditional field logic
│   ├── useSchemaGeneration.ts      # Dynamic Zod schema generation
│   ├── useFieldDependencies.ts     # Field dependency management
│   ├── useDataPreFill.ts          # External data loading
│   └── useFormStateManager.ts      # Advanced state management
```

## Implementation Details

### 1. Conditional Field Logic

```typescript
interface FieldCondition {
  type: 'show' | 'hide' | 'enable' | 'disable' | 'require'
  when: {
    field: string
    operator: 'equals' | 'notEquals' | 'contains' | 'gt' | 'lt' | 'isEmpty' | 'isNotEmpty'
    value: any
  }
  // Support for complex conditions
  and?: FieldCondition[]
  or?: FieldCondition[]
}

export function useConditionalLogic(
  variables: TemplateVariable[],
  formData: Ref<Record<string, any>>
) {
  const fieldVisibility = ref<Record<string, boolean>>({})
  const fieldEnabled = ref<Record<string, boolean>>({})
  const fieldRequired = ref<Record<string, boolean>>({})
  
  const evaluateCondition = (condition: FieldCondition): boolean => {
    const fieldValue = formData.value[condition.when.field]
    
    switch (condition.when.operator) {
      case 'equals':
        return fieldValue === condition.when.value
      case 'notEquals':
        return fieldValue !== condition.when.value
      case 'contains':
        return String(fieldValue).includes(String(condition.when.value))
      case 'gt':
        return Number(fieldValue) > Number(condition.when.value)
      case 'lt':
        return Number(fieldValue) < Number(condition.when.value)
      case 'isEmpty':
        return !fieldValue || fieldValue === ''
      case 'isNotEmpty':
        return fieldValue && fieldValue !== ''
      default:
        return false
    }
  }
  
  const evaluateComplexCondition = (condition: FieldCondition): boolean => {
    let result = evaluateCondition(condition)
    
    if (condition.and) {
      result = condition.and.every(c => evaluateComplexCondition(c)) && result
    }
    
    if (condition.or) {
      result = condition.or.some(c => evaluateComplexCondition(c)) || result
    }
    
    return result
  }
  
  const updateFieldStates = () => {
    variables.forEach(variable => {
      if (variable.conditions) {
        variable.conditions.forEach(condition => {
          const shouldApply = evaluateComplexCondition(condition)
          
          switch (condition.type) {
            case 'show':
              fieldVisibility.value[variable.name] = shouldApply
              break
            case 'hide':
              fieldVisibility.value[variable.name] = !shouldApply
              break
            case 'enable':
              fieldEnabled.value[variable.name] = shouldApply
              break
            case 'disable':
              fieldEnabled.value[variable.name] = !shouldApply
              break
            case 'require':
              fieldRequired.value[variable.name] = shouldApply
              break
          }
        })
      }
    })
  }
  
  // Watch form data changes and update field states
  watch(formData, updateFieldStates, { deep: true })
  
  // Initialize field states
  onMounted(updateFieldStates)
  
  return {
    fieldVisibility: readonly(fieldVisibility),
    fieldEnabled: readonly(fieldEnabled),
    fieldRequired: readonly(fieldRequired),
    evaluateCondition,
    updateFieldStates
  }
}
```

### 2. Dynamic Schema Generation

```typescript
export function useSchemaGeneration(
  variables: TemplateVariable[],
  conditionalLogic: ReturnType<typeof useConditionalLogic>
) {
  const generateZodSchema = computed(() => {
    const shape: Record<string, z.ZodType> = {}
    
    variables.forEach(variable => {
      // Skip hidden fields
      if (conditionalLogic.fieldVisibility.value[variable.name] === false) {
        return
      }
      
      let schema = getBaseSchema(variable.type)
      
      // Apply conditional required state
      const isRequired = conditionalLogic.fieldRequired.value[variable.name] ?? variable.required
      if (isRequired) {
        schema = schema.min(1, `${variable.label} is required`)
      } else {
        schema = schema.optional()
      }
      
      // Apply validation rules
      variable.validation?.forEach(rule => {
        schema = applyValidationRule(schema, rule)
      })
      
      shape[variable.name] = schema
    })
    
    return z.object(shape)
  })
  
  const getBaseSchema = (type: FieldType): z.ZodType => {
    switch (type.base) {
      case 'text':
        return z.string()
      case 'number':
        return z.number()
      case 'date':
        return z.date()
      case 'checkbox':
        return z.boolean()
      case 'select':
        return z.string()
      default:
        return z.string()
    }
  }
  
  const applyValidationRule = (schema: z.ZodType, rule: ValidationRule): z.ZodType => {
    switch (rule.type) {
      case 'minLength':
        return (schema as z.ZodString).min(rule.value, rule.message)
      case 'maxLength':
        return (schema as z.ZodString).max(rule.value, rule.message)
      case 'pattern':
        return (schema as z.ZodString).regex(new RegExp(rule.value), rule.message)
      case 'email':
        return (schema as z.ZodString).email(rule.message)
      case 'min':
        return (schema as z.ZodNumber).min(rule.value, rule.message)
      case 'max':
        return (schema as z.ZodNumber).max(rule.value, rule.message)
      default:
        return schema
    }
  }
  
  return {
    schema: generateZodSchema,
    getBaseSchema,
    applyValidationRule
  }
}
```

### 3. Data Pre-filling Service

```typescript
export function useDataPreFill() {
  const prefillFormData = async (
    variables: TemplateVariable[],
    context: { matterId?: string, clientId?: string }
  ): Promise<Record<string, any>> => {
    const data: Record<string, any> = {}
    const loadPromises: Promise<void>[] = []
    
    variables.forEach(variable => {
      if (variable.dataSource) {
        loadPromises.push(loadFieldData(variable, context, data))
      } else if (variable.defaultValue !== undefined) {
        data[variable.name] = variable.defaultValue
      }
    })
    
    await Promise.all(loadPromises)
    return data
  }
  
  const loadFieldData = async (
    variable: TemplateVariable,
    context: { matterId?: string, clientId?: string },
    data: Record<string, any>
  ): Promise<void> => {
    try {
      switch (variable.dataSource) {
        case 'matter':
          if (context.matterId) {
            const value = await fetchMatterField(context.matterId, variable.name)
            if (value !== null) {
              data[variable.name] = transformValue(value, variable.type)
            }
          }
          break
        case 'client':
          if (context.clientId) {
            const value = await fetchClientField(context.clientId, variable.name)
            if (value !== null) {
              data[variable.name] = transformValue(value, variable.type)
            }
          }
          break
        case 'user':
          const userValue = await fetchUserField(variable.name)
          if (userValue !== null) {
            data[variable.name] = transformValue(userValue, variable.type)
          }
          break
      }
    } catch (error) {
      console.warn(`Failed to load data for field ${variable.name}:`, error)
    }
  }
  
  const transformValue = (value: any, type: FieldType): any => {
    switch (type.base) {
      case 'date':
        return value instanceof Date ? value : new Date(value)
      case 'number':
        return typeof value === 'number' ? value : Number(value)
      case 'checkbox':
        return Boolean(value)
      default:
        return String(value)
    }
  }
  
  return {
    prefillFormData,
    loadFieldData,
    transformValue
  }
}
```

### 4. Advanced Form State Management

```typescript
export function useFormStateManager(initialData: Record<string, any>) {
  const formData = ref({ ...initialData })
  const history = ref<Array<{ data: Record<string, any>, timestamp: number }>>([])
  const historyIndex = ref(-1)
  const isDirty = ref(false)
  const lastSaved = ref<Date | null>(null)
  
  // Auto-save functionality
  const { pause: pauseAutoSave, resume: resumeAutoSave } = watchDebounced(
    formData,
    async (newData) => {
      if (isDirty.value) {
        await saveFormData(newData)
        lastSaved.value = new Date()
        isDirty.value = false
      }
    },
    { debounce: 2000, deep: true }
  )
  
  const saveToHistory = (data: Record<string, any>) => {
    const newEntry = {
      data: { ...data },
      timestamp: Date.now()
    }
    
    // Remove any entries after current index (when undoing then making changes)
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(newEntry)
    historyIndex.value = history.value.length - 1
    
    // Limit history size
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }
  
  const updateField = (fieldName: string, value: any) => {
    const oldData = { ...formData.value }
    formData.value[fieldName] = value
    isDirty.value = true
    
    // Save to history
    saveToHistory(oldData)
  }
  
  const undo = () => {
    if (canUndo.value) {
      historyIndex.value--
      formData.value = { ...history.value[historyIndex.value].data }
      isDirty.value = true
    }
  }
  
  const redo = () => {
    if (canRedo.value) {
      historyIndex.value++
      formData.value = { ...history.value[historyIndex.value].data }
      isDirty.value = true
    }
  }
  
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  
  const reset = () => {
    formData.value = { ...initialData }
    isDirty.value = false
    history.value = []
    historyIndex.value = -1
  }
  
  // Initialize history
  saveToHistory(initialData)
  
  return {
    formData,
    isDirty: readonly(isDirty),
    lastSaved: readonly(lastSaved),
    canUndo,
    canRedo,
    updateField,
    undo,
    redo,
    reset,
    pauseAutoSave,
    resumeAutoSave
  }
}
```

### 5. Field Dependencies Manager

```typescript
export function useFieldDependencies(variables: TemplateVariable[]) {
  const dependencies = computed(() => {
    const deps: Record<string, string[]> = {}
    
    variables.forEach(variable => {
      if (variable.conditions) {
        variable.conditions.forEach(condition => {
          const dependentField = condition.when.field
          if (!deps[dependentField]) {
            deps[dependentField] = []
          }
          deps[dependentField].push(variable.name)
        })
      }
    })
    
    return deps
  })
  
  const updateDependentFields = (
    changedField: string,
    newValue: any,
    formData: Record<string, any>
  ) => {
    const dependentFields = dependencies.value[changedField] || []
    
    dependentFields.forEach(fieldName => {
      const variable = variables.find(v => v.name === fieldName)
      if (variable?.derivedValue) {
        formData[fieldName] = calculateDerivedValue(variable.derivedValue, formData)
      }
    })
  }
  
  const calculateDerivedValue = (
    derivedRule: DerivedValueRule,
    formData: Record<string, any>
  ): any => {
    // Simple derived value calculation
    // This could be expanded to support complex expressions
    switch (derivedRule.type) {
      case 'concat':
        return derivedRule.fields.map(field => formData[field] || '').join(derivedRule.separator || ' ')
      case 'sum':
        return derivedRule.fields.reduce((sum, field) => sum + (Number(formData[field]) || 0), 0)
      case 'copy':
        return formData[derivedRule.sourceField]
      default:
        return ''
    }
  }
  
  return {
    dependencies,
    updateDependentFields,
    calculateDerivedValue
  }
}
```

## Integration Points

### 1. Form Rendering Integration
- Seamless integration with T10B_S13_Dynamic_Form_Rendering
- Conditional wrapper components
- Dynamic validation feedback display

### 2. Data Sources
- Matter API for matter data pre-filling
- Client API for client data retrieval  
- User preferences for default values
- System configuration for field options

### 3. External Services
- Auto-save to backend services
- Async validation endpoints
- Audit logging for form changes

## Testing Requirements

### Unit Tests
- Condition evaluation logic
- Schema generation correctness
- Data pre-filling accuracy
- State management operations
- Field dependency calculations

### Integration Tests
- Complex conditional logic scenarios
- Cross-field validation
- Auto-save functionality
- Undo/redo operations
- Performance with large forms

## Performance Considerations

1. **Optimization**
   - Debounce validation triggers
   - Memoize condition evaluations
   - Cache schema generation
   - Batch dependent field updates

2. **Memory Management**
   - Limit history size
   - Clean up watchers
   - Optimize deep object watching

## Dependencies

- Vue 3 composition API and reactivity
- Zod for schema validation
- VeeValidate for form validation
- T10A_S13_Field_Type_Detection (template variables)
- T10B_S13_Dynamic_Form_Rendering (form components)

## Acceptance Criteria

1. [ ] Complex conditional logic with AND/OR support
2. [ ] Dynamic validation schema generation
3. [ ] Data pre-filling from multiple sources
4. [ ] Auto-save with debouncing
5. [ ] Undo/redo functionality (50 operations)
6. [ ] Field dependency cascade updates
7. [ ] Performance: Condition evaluation < 5ms per field
8. [ ] Error handling for failed pre-fills
9. [ ] Comprehensive test coverage (>90%)

## Related Tasks

- **Depends on**: T10A_S13_Field_Type_Detection, T10B_S13_Dynamic_Form_Rendering
- **Enables**: T11_S13_Document_Generation_Engine
- **Related**: T08_S13_Document_Generation_Engine

## Notes

This task implements the most complex aspects of the dynamic form system. Consider implementing the features incrementally:
1. Basic conditional logic
2. Dynamic validation
3. Data pre-filling
4. Advanced state management

The conditional logic system should be designed to be easily extensible for future requirements.