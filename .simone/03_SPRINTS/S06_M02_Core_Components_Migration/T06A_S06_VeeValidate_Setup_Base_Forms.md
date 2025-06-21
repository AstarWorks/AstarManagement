---
task_id: T06A_S06
sprint_sequence_id: S06
status: open
complexity: Medium
last_updated: 2025-06-21T00:00:00Z
---

# Task: VeeValidate Setup and Base Form Components

## Description
Set up VeeValidate v4 with Zod schema integration and create the foundational form components. This task establishes the form validation infrastructure and basic form wrapper components that will be used throughout the application.

## Goal / Objectives
- Install and configure VeeValidate v4
- Set up Zod adapter for schema validation
- Create base Form component with validation context
- Implement FormField wrapper for field-level validation
- Establish form composables and utilities

## Acceptance Criteria
- [ ] VeeValidate is properly configured with Nuxt
- [ ] Zod schemas can be used for form validation
- [ ] Base Form component provides validation context
- [ ] FormField component handles field-level errors
- [ ] useForm composable provides type-safe form handling
- [ ] Error messages display correctly
- [ ] Form submission handling works with async validation

## Subtasks
- [ ] Install and configure dependencies
  - [ ] Add vee-validate and @vee-validate/zod
  - [ ] Configure auto-imports for VeeValidate
  - [ ] Set up global validation rules
  - [ ] Configure error message templates

- [ ] Create form composables
  - [ ] Implement useForm wrapper with Zod support
  - [ ] Create useField composable helpers
  - [ ] Add form state management utilities
  - [ ] Implement validation trigger controls

- [ ] Build base Form component
  - [ ] Create Form.vue wrapper component
  - [ ] Implement validation schema prop
  - [ ] Add form submission handling
  - [ ] Support initial values and reset
  - [ ] Provide form context via slots

- [ ] Create FormField component
  - [ ] Implement field wrapper with validation
  - [ ] Handle error message display
  - [ ] Support touched/dirty states
  - [ ] Add required field indicators
  - [ ] Integrate with form context

- [ ] Set up error handling
  - [ ] Create ErrorMessage component
  - [ ] Implement field-level error display
  - [ ] Add form-level error summary
  - [ ] Support custom error messages
  - [ ] Handle server-side errors

- [ ] Create validation schemas
  - [ ] Port common schemas from React
  - [ ] Create shared validation rules
  - [ ] Add custom Zod refinements
  - [ ] Document schema patterns

## Technical Notes

### VeeValidate Setup
```typescript
// composables/useForm.ts
import { useForm as useVeeForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { z } from 'zod'

export function useForm<TSchema extends z.ZodSchema>(
  schema: TSchema,
  options?: {
    initialValues?: z.infer<TSchema>
    onSubmit?: (values: z.infer<TSchema>) => void | Promise<void>
  }
) {
  const validationSchema = toTypedSchema(schema)
  
  const form = useVeeForm({
    validationSchema,
    initialValues: options?.initialValues
  })
  
  const handleSubmit = form.handleSubmit(async (values) => {
    if (options?.onSubmit) {
      await options.onSubmit(values)
    }
  })
  
  return {
    ...form,
    handleSubmit
  }
}
```

### Form Component
```vue
<!-- components/forms/Form.vue -->
<template>
  <form @submit="onSubmit">
    <slot :form="form" />
  </form>
</template>

<script setup lang="ts" generic="TSchema extends z.ZodSchema">
import { provide } from 'vue'
import type { z } from 'zod'
import { useForm } from '@/composables/useForm'

const props = defineProps<{
  schema: TSchema
  initialValues?: z.infer<TSchema>
  onSubmit?: (values: z.infer<TSchema>) => void | Promise<void>
}>()

const form = useForm(props.schema, {
  initialValues: props.initialValues,
  onSubmit: props.onSubmit
})

provide('form', form)

const onSubmit = (e: Event) => {
  e.preventDefault()
  form.handleSubmit()
}
</script>
```

### Dependencies
- Requires T03_S06 (Shadcn-vue Setup)
- Will be used by T06B_S06 and T06C_S06

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-21 00:00:00] Task created by splitting T06_S06