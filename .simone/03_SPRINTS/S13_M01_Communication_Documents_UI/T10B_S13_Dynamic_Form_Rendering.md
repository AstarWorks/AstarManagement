# T10B_S13: Dynamic Form Rendering - Component Generation and Form Assembly

**Status**: TODO
**Priority**: High
**Complexity**: Medium
**Estimated Hours**: 6-8

## Overview

Implement the dynamic form rendering system that takes parsed template variables and generates a complete, interactive form using Vue 3 dynamic components. This system will handle component resolution, form layout, field registration with VeeValidate, and basic validation integration.

## Requirements

### Core Features

1. **Dynamic Component Resolution**
   - Map field types to appropriate Vue components
   - Support for custom component registration
   - Fallback component handling for unknown types
   - Lazy loading of complex components

2. **Form Layout Generation**
   - Automatic grid layout based on field types
   - Responsive column management
   - Field grouping and sections
   - Mobile-optimized rendering

3. **VeeValidate Integration**
   - Dynamic field registration with VeeValidate
   - Real-time validation feedback
   - Error message display
   - Form submission handling

4. **Data Binding**
   - Two-way data binding for all field types
   - Initial value setting from pre-fill data
   - Form state management integration
   - Change tracking and dirty state

5. **Accessibility Support**
   - Proper ARIA labels and descriptions
   - Keyboard navigation support
   - Screen reader compatibility
   - Focus management

### Technical Architecture

#### Component Structure
```
components/
├── dynamic-form/
│   ├── DynamicFormBuilder.vue       # Main form builder component
│   ├── DynamicField.vue             # Individual field renderer
│   ├── DynamicFieldGroup.vue        # Field grouping component
│   ├── FormLayout.vue               # Layout management
│   └── types.ts                     # Component interfaces
```

#### Composable Structure
```
composables/
├── form/
│   ├── useDynamicForm.ts           # Main form rendering composable
│   ├── useFieldMapping.ts          # Component mapping logic
│   └── useFormLayout.ts            # Layout calculation logic
```

## Implementation Details

### 1. Dynamic Form Builder Component

```vue
<template>
  <form 
    @submit.prevent="handleSubmit"
    class="dynamic-form"
    :class="{ 'mobile': isMobile }"
  >
    <div class="form-sections">
      <DynamicFieldGroup
        v-for="group in fieldGroups"
        :key="group.id"
        :group="group"
        :form-data="formData"
        @update="handleFieldUpdate"
      />
    </div>
    
    <div class="form-actions">
      <Button 
        type="submit" 
        :disabled="!isValid || isSubmitting"
        :loading="isSubmitting"
      >
        Generate Document
      </Button>
      <Button 
        type="button" 
        variant="outline"
        @click="handleReset"
      >
        Reset Form
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
interface Props {
  variables: TemplateVariable[]
  initialData?: Record<string, any>
  layout?: FormLayout
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
  layout: 'auto'
})

const emit = defineEmits<{
  submit: [data: Record<string, any>]
  change: [data: Record<string, any>]
  reset: []
}>()

const { 
  formData, 
  fieldGroups, 
  isValid, 
  isSubmitting,
  handleSubmit,
  handleFieldUpdate,
  handleReset 
} = useDynamicForm(props.variables, props.initialData)

const { isMobile } = useResponsive()
</script>
```

### 2. Dynamic Field Component

```vue
<template>
  <component
    :is="fieldComponent"
    v-bind="fieldProps"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="handleBlur"
    @focus="handleFocus"
  />
</template>

<script setup lang="ts">
interface Props {
  variable: TemplateVariable
  modelValue?: any
  errors?: string[]
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const { fieldComponent, fieldProps } = useFieldMapping(props.variable)

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>
```

### 3. Dynamic Form Composable

```typescript
export function useDynamicForm(
  variables: TemplateVariable[],
  initialData: Record<string, any> = {}
) {
  const formData = ref<Record<string, any>>({ ...initialData })
  const isSubmitting = ref(false)
  
  // Generate field groups for layout
  const fieldGroups = computed(() => {
    return groupFieldsBySection(variables.value)
  })
  
  // VeeValidate integration
  const { handleSubmit, isValid, errors } = useForm({
    validationSchema: computed(() => generateValidationSchema(variables.value)),
    initialValues: formData.value
  })
  
  const handleFieldUpdate = (fieldName: string, value: any) => {
    formData.value[fieldName] = value
  }
  
  const handleFormSubmit = handleSubmit(async (values) => {
    isSubmitting.value = true
    try {
      emit('submit', values)
    } finally {
      isSubmitting.value = false
    }
  })
  
  const handleReset = () => {
    formData.value = { ...initialData }
    emit('reset')
  }
  
  return {
    formData: readonly(formData),
    fieldGroups,
    isValid,
    isSubmitting: readonly(isSubmitting),
    errors,
    handleSubmit: handleFormSubmit,
    handleFieldUpdate,
    handleReset
  }
}
```

### 4. Field Component Mapping

```typescript
export function useFieldMapping(variable: TemplateVariable) {
  const fieldComponentMap = {
    text: () => import('@/components/forms/FormInput.vue'),
    textarea: () => import('@/components/forms/FormTextarea.vue'),
    number: () => import('@/components/forms/FormInput.vue'),
    date: () => import('@/components/forms/FormDatePicker.vue'),
    select: () => import('@/components/forms/FormSelect.vue'),
    checkbox: () => import('@/components/forms/FormCheckbox.vue'),
    radio: () => import('@/components/forms/FormRadio.vue'),
    email: () => import('@/components/forms/FormInput.vue'),
    phone: () => import('@/components/forms/FormInput.vue')
  }
  
  const fieldComponent = computed(() => {
    const componentLoader = fieldComponentMap[variable.type.base]
    return componentLoader || fieldComponentMap.text
  })
  
  const fieldProps = computed(() => {
    const baseProps = {
      id: variable.name,
      name: variable.name,
      label: variable.label,
      placeholder: variable.placeholder,
      required: variable.required,
      disabled: variable.disabled
    }
    
    // Add type-specific props
    switch (variable.type.base) {
      case 'number':
        return {
          ...baseProps,
          type: 'number',
          step: variable.type.format === 'integer' ? '1' : '0.01'
        }
      case 'email':
        return {
          ...baseProps,
          type: 'email'
        }
      case 'date':
        return {
          ...baseProps,
          format: variable.type.format || 'yyyy-MM-dd'
        }
      case 'select':
        return {
          ...baseProps,
          options: variable.options || []
        }
      default:
        return baseProps
    }
  })
  
  return {
    fieldComponent,
    fieldProps
  }
}
```

### 5. Form Layout Logic

```typescript
export function useFormLayout(variables: TemplateVariable[]) {
  const groupFieldsBySection = (fields: TemplateVariable[]) => {
    const groups: FieldGroup[] = []
    const currentGroup: TemplateVariable[] = []
    
    fields.forEach(field => {
      // Group fields by path prefix (e.g., 'client.*', 'matter.*')
      const section = field.path[0] || 'general'
      
      const existingGroup = groups.find(g => g.section === section)
      if (existingGroup) {
        existingGroup.fields.push(field)
      } else {
        groups.push({
          id: `group-${section}`,
          section,
          title: formatSectionTitle(section),
          fields: [field],
          columns: calculateColumns(section)
        })
      }
    })
    
    return groups
  }
  
  const calculateColumns = (section: string): number => {
    // Simple heuristic for column layout
    switch (section) {
      case 'client':
      case 'matter':
        return 2
      case 'address':
        return 1
      default:
        return 2
    }
  }
  
  const formatSectionTitle = (section: string): string => {
    return section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')
  }
  
  return {
    groupFieldsBySection,
    calculateColumns,
    formatSectionTitle
  }
}
```

## Integration Points

### 1. Existing Form Components
- Reuse all existing form components (FormInput, FormSelect, etc.)
- Maintain compatibility with current styling and behavior
- Extend components with dynamic props support

### 2. VeeValidate Integration
- Register dynamic fields with VeeValidate
- Support for field-level and form-level validation
- Error handling and display

### 3. Responsive Design
- Mobile-first layout approach
- Adaptive column layouts
- Touch-friendly interactions

## Testing Requirements

### Unit Tests
- Component resolution for all field types
- Props passing and data binding
- Form submission handling
- Error state management
- Layout calculations

### Integration Tests
- Complete form rendering with various templates
- VeeValidate integration
- Responsive layout behavior
- Accessibility compliance

## Performance Considerations

1. **Lazy Loading**
   - Load field components on demand
   - Progressive form rendering
   - Virtual scrolling for large forms

2. **Memoization**
   - Cache component mappings
   - Memoize layout calculations
   - Optimize re-renders

## Dependencies

- Vue 3 dynamic components
- VeeValidate form validation
- Existing form components
- T10A_S13_Field_Type_Detection (template variables)

## Acceptance Criteria

1. [ ] Dynamic form generation from template variables
2. [ ] All field types render with correct components
3. [ ] VeeValidate integration with real-time validation
4. [ ] Responsive layout on mobile and desktop
5. [ ] Accessibility compliance (WCAG 2.1 AA)
6. [ ] Performance: Render 50 fields in < 100ms
7. [ ] Error handling and recovery
8. [ ] Form submission and reset functionality

## Related Tasks

- **Depends on**: T10A_S13_Field_Type_Detection
- **Enables**: T10C_S13_Conditional_Logic_Validation
- **Related**: T08_S13_Document_Generation_Engine

## Notes

Focus on creating a solid foundation for dynamic form rendering. The component mapping system should be extensible to support new field types. Consider using Vue's `<Suspense>` for handling async component loading gracefully.