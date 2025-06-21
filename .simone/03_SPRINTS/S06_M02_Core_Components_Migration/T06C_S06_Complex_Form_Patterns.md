---
task_id: T06C_S06
sprint_sequence_id: S06
status: open
complexity: Low
last_updated: 2025-06-21T00:00:00Z
---

# Task: Complex Form Patterns and Examples

## Description
Implement complex form patterns including multi-step forms, conditional validation, form persistence, and real-world form examples. This task completes the form infrastructure by providing advanced patterns and comprehensive examples that demonstrate the full capabilities of the VeeValidate integration.

## Goal / Objectives
- Create multi-step form components
- Implement conditional validation patterns
- Add form state persistence
- Build real-world form examples
- Document best practices and patterns

## Acceptance Criteria
- [ ] Multi-step forms with validation per step
- [ ] Conditional fields show/hide with validation
- [ ] Form state persists across page refreshes
- [ ] Complex business forms are implemented
- [ ] Auto-save functionality works reliably
- [ ] Form patterns are well documented
- [ ] Examples cover common use cases

## Subtasks
- [ ] Create multi-step form system
  - [ ] Build step navigation component
  - [ ] Implement per-step validation
  - [ ] Add progress indicator
  - [ ] Handle step transitions
  - [ ] Support dynamic step generation

- [ ] Implement conditional validation
  - [ ] Create conditional field wrapper
  - [ ] Add dynamic validation rules
  - [ ] Handle dependent field validation
  - [ ] Implement show/hide logic
  - [ ] Support complex conditions

- [ ] Add form persistence
  - [ ] Create auto-save composable
  - [ ] Implement localStorage adapter
  - [ ] Add session recovery
  - [ ] Handle form versioning
  - [ ] Clean up old form data

- [ ] Build example forms
  - [ ] User registration form
  - [ ] Matter creation form
  - [ ] Document upload form
  - [ ] Settings form with tabs
  - [ ] Search form with filters

- [ ] Create form utilities
  - [ ] Form reset with confirmation
  - [ ] Dirty state tracking
  - [ ] Submission state management
  - [ ] Error recovery patterns
  - [ ] Form analytics hooks

- [ ] Write documentation
  - [ ] Form patterns guide
  - [ ] Validation cookbook
  - [ ] Performance tips
  - [ ] Migration from React Hook Form
  - [ ] Troubleshooting guide

## Technical Notes

### Multi-Step Form Pattern
```vue
<!-- components/forms/MultiStepForm.vue -->
<template>
  <div class="space-y-6">
    <StepIndicator :steps="steps" :current="currentStep" />
    
    <Form
      :key="currentStep"
      :schema="currentSchema"
      :initial-values="formData[currentStep]"
      @submit="handleStepSubmit"
    >
      <template #default="{ form }">
        <component :is="currentStepComponent" />
        
        <div class="flex justify-between pt-6">
          <Button
            v-if="currentStep > 0"
            variant="outline"
            @click="previousStep"
          >
            Previous
          </Button>
          
          <Button
            type="submit"
            :disabled="form.isSubmitting"
          >
            {{ isLastStep ? 'Submit' : 'Next' }}
          </Button>
        </div>
      </template>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { z } from 'zod'

const props = defineProps<{
  steps: StepConfig[]
}>()

const currentStep = ref(0)
const formData = ref<Record<number, any>>({})

const currentSchema = computed(() => 
  props.steps[currentStep.value].schema
)

const handleStepSubmit = async (values: any) => {
  formData.value[currentStep.value] = values
  
  if (isLastStep.value) {
    await submitForm()
  } else {
    currentStep.value++
  }
}
</script>
```

### Auto-Save Composable
```typescript
// composables/useAutoSave.ts
import { watchDebounced } from '@vueuse/core'
import { useForm } from 'vee-validate'

export function useAutoSave(
  form: ReturnType<typeof useForm>,
  options: {
    key: string
    debounce?: number
    onSave?: (values: any) => Promise<void>
  }
) {
  const { key, debounce = 1000, onSave } = options
  
  // Watch form values and save
  watchDebounced(
    () => form.values,
    async (values) => {
      if (form.meta.value.dirty) {
        if (onSave) {
          await onSave(values)
        } else {
          localStorage.setItem(key, JSON.stringify(values))
        }
      }
    },
    { debounce, deep: true }
  )
  
  // Restore on mount
  onMounted(() => {
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const values = JSON.parse(saved)
        form.setValues(values)
      } catch (e) {
        console.error('Failed to restore form:', e)
      }
    }
  })
  
  // Clear on successful submit
  const clearSaved = () => {
    localStorage.removeItem(key)
  }
  
  return { clearSaved }
}
```

### Conditional Validation Example
```vue
<script setup>
const schema = computed(() => {
  return z.object({
    accountType: z.enum(['personal', 'business']),
    // Conditional fields based on account type
    ...(form.values.accountType === 'business' && {
      companyName: z.string().min(2),
      taxId: z.string().regex(/^\d{2}-\d{7}$/)
    }),
    email: z.string().email(),
    password: z.string().min(8)
  })
})
</script>
```

### Dependencies
- Requires T06A_S06 and T06B_S06 to be completed
- Uses all form components created in previous tasks
- Builds on VeeValidate infrastructure

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-21 00:00:00] Task created by splitting T06_S06