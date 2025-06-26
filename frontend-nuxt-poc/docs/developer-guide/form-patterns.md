# Form Patterns Guide

This guide covers form development patterns in Aster Management using VeeValidate with Zod for type-safe form validation.

## Form Architecture Overview

Our form system is built on three pillars:

1. **Zod Schemas** - Runtime type validation
2. **VeeValidate** - Form state management
3. **shadcn-vue Components** - UI components

## Basic Form Pattern

### Schema Definition

```typescript
// schemas/forms/matter.ts
import { z } from 'zod'

export const matterFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    required_error: 'Please select a priority'
  }),
  
  assigneeId: z.string().uuid('Invalid assignee ID').optional(),
  
  dueDate: z.date({
    required_error: 'Due date is required',
    invalid_type_error: 'Invalid date format'
  }),
  
  tags: z.array(z.string()).default([]),
  
  clientInfo: z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
  })
})

export type MatterFormData = z.infer<typeof matterFormSchema>
```

### Form Component

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { matterFormSchema, type MatterFormData } from '~/schemas/forms/matter'

interface Props {
  initialValues?: Partial<MatterFormData>
  onSubmit: (data: MatterFormData) => void | Promise<void>
}

const props = defineProps<Props>()

// Form setup
const { handleSubmit, errors, meta, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(matterFormSchema),
  initialValues: props.initialValues
})

// Define fields
const [title, titleAttrs] = defineField('title')
const [description, descriptionAttrs] = defineField('description')
const [priority, priorityAttrs] = defineField('priority')
const [dueDate, dueDateAttrs] = defineField('dueDate')

// Submit handler
const onSubmit = handleSubmit(async (values) => {
  try {
    await props.onSubmit(values)
    resetForm()
  } catch (error) {
    console.error('Form submission error:', error)
  }
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <FormField>
      <FormLabel for="title">Title</FormLabel>
      <FormControl>
        <Input 
          id="title"
          v-model="title" 
          v-bind="titleAttrs"
          :class="{ 'border-destructive': errors.title }"
        />
      </FormControl>
      <FormMessage v-if="errors.title">{{ errors.title }}</FormMessage>
    </FormField>

    <FormField>
      <FormLabel for="priority">Priority</FormLabel>
      <FormControl>
        <Select v-model="priority" v-bind="priorityAttrs">
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage v-if="errors.priority">{{ errors.priority }}</FormMessage>
    </FormField>

    <div class="flex gap-4">
      <Button type="button" variant="outline" @click="resetForm">
        Reset
      </Button>
      <Button type="submit" :disabled="!meta.valid || meta.pending">
        {{ meta.pending ? 'Submitting...' : 'Submit' }}
      </Button>
    </div>
  </form>
</template>
```

## Advanced Form Patterns

### Dynamic Form Arrays

```vue
<script setup lang="ts">
import { useFieldArray } from 'vee-validate'

const schema = z.object({
  documents: z.array(z.object({
    name: z.string().min(1, 'Document name is required'),
    type: z.enum(['PDF', 'DOCX', 'IMAGE']),
    file: z.instanceof(File).optional()
  })).min(1, 'At least one document is required')
})

const { fields, push, remove, move } = useFieldArray('documents')

const addDocument = () => {
  push({ name: '', type: 'PDF', file: undefined })
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="(field, idx) in fields" :key="field.key" class="border p-4 rounded">
      <div class="flex justify-between mb-4">
        <h4>Document {{ idx + 1 }}</h4>
        <Button @click="remove(idx)" size="sm" variant="ghost">
          Remove
        </Button>
      </div>
      
      <FormField>
        <FormLabel>Name</FormLabel>
        <FormControl>
          <Input v-model="field.value.name" />
        </FormControl>
        <FormMessage :name="`documents[${idx}].name`" />
      </FormField>
      
      <FormField>
        <FormLabel>Type</FormLabel>
        <FormControl>
          <Select v-model="field.value.type">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="DOCX">Word Document</SelectItem>
              <SelectItem value="IMAGE">Image</SelectItem>
            </SelectContent>
          </Select>
        </FormControl>
      </FormField>
    </div>
    
    <Button @click="addDocument" variant="outline">
      Add Document
    </Button>
  </div>
</template>
```

### Conditional Form Fields

```vue
<script setup lang="ts">
const schema = z.object({
  matterType: z.enum(['LITIGATION', 'CONTRACT', 'CORPORATE']),
  
  // Conditional fields based on matter type
  courtName: z.string().optional(),
  caseNumber: z.string().optional(),
  contractValue: z.number().optional(),
  parties: z.array(z.string()).optional()
}).refine((data) => {
  if (data.matterType === 'LITIGATION') {
    return !!data.courtName && !!data.caseNumber
  }
  if (data.matterType === 'CONTRACT') {
    return !!data.contractValue && data.contractValue > 0
  }
  return true
}, {
  message: 'Please fill in all required fields for the selected matter type',
  path: ['matterType']
})

const [matterType] = defineField('matterType')
const showLitigationFields = computed(() => matterType.value === 'LITIGATION')
const showContractFields = computed(() => matterType.value === 'CONTRACT')
</script>

<template>
  <div class="space-y-4">
    <FormField>
      <FormLabel>Matter Type</FormLabel>
      <FormControl>
        <Select v-model="matterType">
          <SelectTrigger>
            <SelectValue placeholder="Select matter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LITIGATION">Litigation</SelectItem>
            <SelectItem value="CONTRACT">Contract</SelectItem>
            <SelectItem value="CORPORATE">Corporate</SelectItem>
          </SelectContent>
        </Select>
      </FormControl>
    </FormField>

    <!-- Litigation fields -->
    <template v-if="showLitigationFields">
      <FormField>
        <FormLabel>Court Name</FormLabel>
        <FormControl>
          <Input v-model="courtName" placeholder="Enter court name" />
        </FormControl>
        <FormMessage name="courtName" />
      </FormField>
      
      <FormField>
        <FormLabel>Case Number</FormLabel>
        <FormControl>
          <Input v-model="caseNumber" placeholder="Enter case number" />
        </FormControl>
        <FormMessage name="caseNumber" />
      </FormField>
    </template>

    <!-- Contract fields -->
    <template v-if="showContractFields">
      <FormField>
        <FormLabel>Contract Value</FormLabel>
        <FormControl>
          <Input 
            v-model.number="contractValue" 
            type="number" 
            placeholder="Enter contract value"
          />
        </FormControl>
        <FormMessage name="contractValue" />
      </FormField>
    </template>
  </div>
</template>
```

### Multi-Step Forms

```vue
<script setup lang="ts">
import { useMultiStepForm } from '~/composables/useMultiStepForm'

// Schema for each step
const step1Schema = z.object({
  title: z.string().min(1),
  description: z.string().optional()
})

const step2Schema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  assigneeId: z.string().uuid()
})

const step3Schema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  budget: z.number().positive()
})

// Combine schemas
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema)

// Multi-step form setup
const {
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  isFirstStep,
  isLastStep,
  currentStepValid
} = useMultiStepForm({
  steps: [
    { name: 'Basic Info', schema: step1Schema },
    { name: 'Assignment', schema: step2Schema },
    { name: 'Timeline', schema: step3Schema }
  ]
})
</script>

<template>
  <div class="multi-step-form">
    <!-- Progress indicator -->
    <div class="mb-8">
      <div class="flex justify-between mb-2">
        <span>Step {{ currentStep + 1 }} of {{ totalSteps }}</span>
        <span>{{ steps[currentStep].name }}</span>
      </div>
      <Progress :value="((currentStep + 1) / totalSteps) * 100" />
    </div>

    <!-- Form steps -->
    <form @submit.prevent="handleSubmit">
      <!-- Step 1: Basic Info -->
      <div v-show="currentStep === 0" class="space-y-4">
        <FormField>
          <FormLabel>Title</FormLabel>
          <FormControl>
            <Input v-model="title" />
          </FormControl>
          <FormMessage name="title" />
        </FormField>
        
        <FormField>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea v-model="description" />
          </FormControl>
        </FormField>
      </div>

      <!-- Step 2: Assignment -->
      <div v-show="currentStep === 1" class="space-y-4">
        <FormField>
          <FormLabel>Priority</FormLabel>
          <FormControl>
            <Select v-model="priority">
              <!-- Priority options -->
            </Select>
          </FormControl>
        </FormField>
      </div>

      <!-- Step 3: Timeline -->
      <div v-show="currentStep === 2" class="space-y-4">
        <FormField>
          <FormLabel>Start Date</FormLabel>
          <FormControl>
            <DatePicker v-model="startDate" />
          </FormControl>
        </FormField>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between mt-8">
        <Button 
          type="button" 
          variant="outline" 
          @click="prevStep"
          :disabled="isFirstStep"
        >
          Previous
        </Button>
        
        <Button 
          v-if="!isLastStep"
          type="button" 
          @click="nextStep"
          :disabled="!currentStepValid"
        >
          Next
        </Button>
        
        <Button 
          v-else
          type="submit"
          :disabled="!meta.valid"
        >
          Submit
        </Button>
      </div>
    </form>
  </div>
</template>
```

## Form Validation Patterns

### Custom Validation Rules

```typescript
// schemas/validators/custom.ts
import { z } from 'zod'

// Japanese phone number validation
export const jpPhoneNumber = z.string().regex(
  /^(0[5-9]0[0-9]{8}|0[1-9][1-9][0-9]{7})$/,
  'Invalid Japanese phone number'
)

// Business registration number
export const businessRegistrationNumber = z.string().regex(
  /^\d{12}$/,
  'Business registration number must be 12 digits'
)

// Date range validation
export const dateRange = z.object({
  startDate: z.date(),
  endDate: z.date()
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate']
})

// File validation
export const fileUpload = z.custom<File>((file) => {
  if (!(file instanceof File)) return false
  
  // Max size: 10MB
  if (file.size > 10 * 1024 * 1024) return false
  
  // Allowed types
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
  return allowedTypes.includes(file.type)
}, {
  message: 'File must be PDF, JPEG, or PNG and less than 10MB'
})
```

### Async Validation

```typescript
// composables/useAsyncValidation.ts
export const useAsyncValidation = () => {
  const checkEmailAvailability = async (email: string) => {
    const { data } = await $fetch('/api/check-email', {
      params: { email }
    })
    return data.available
  }

  const emailSchema = z.string()
    .email('Invalid email')
    .refine(async (email) => {
      return await checkEmailAvailability(email)
    }, 'Email is already in use')

  return { emailSchema }
}
```

### Cross-Field Validation

```typescript
const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})
```

## Form State Management

### Form Composable

```typescript
// composables/useFormState.ts
export const useFormState = <T extends z.ZodType>(
  schema: T,
  options?: {
    autosave?: boolean
    storageKey?: string
  }
) => {
  type FormData = z.infer<T>
  
  const form = useForm({
    validationSchema: toTypedSchema(schema)
  })
  
  // Auto-save to localStorage
  if (options?.autosave && options?.storageKey) {
    const savedData = useLocalStorage<Partial<FormData>>(options.storageKey, {})
    
    // Load saved data
    onMounted(() => {
      if (savedData.value) {
        form.setValues(savedData.value)
      }
    })
    
    // Save on change
    watch(
      () => form.values,
      (values) => {
        savedData.value = values
      },
      { deep: true, debounce: 1000 }
    )
  }
  
  // Form state
  const isDirty = computed(() => form.meta.value.dirty)
  const isValid = computed(() => form.meta.value.valid)
  const isPending = ref(false)
  
  // Submit handler
  const submit = async (onSuccess: (data: FormData) => Promise<void>) => {
    isPending.value = true
    
    try {
      await form.handleSubmit(onSuccess)()
    } finally {
      isPending.value = false
    }
  }
  
  // Reset with confirmation
  const reset = () => {
    if (isDirty.value) {
      if (confirm('You have unsaved changes. Reset form?')) {
        form.resetForm()
      }
    } else {
      form.resetForm()
    }
  }
  
  return {
    ...form,
    isDirty,
    isValid,
    isPending,
    submit,
    reset
  }
}
```

### Global Form Configuration

```typescript
// plugins/vee-validate.client.ts
import { configure } from 'vee-validate'

export default defineNuxtPlugin(() => {
  configure({
    // Global validation behavior
    validateOnBlur: true,
    validateOnChange: true,
    validateOnInput: false,
    validateOnModelUpdate: true,
    
    // Global error messages
    generateMessage: (context) => {
      const messages: Record<string, string> = {
        required: `${context.field} is required`,
        email: `${context.field} must be a valid email`,
        min: `${context.field} must be at least ${context.rule?.params} characters`,
        max: `${context.field} must be less than ${context.rule?.params} characters`
      }
      
      return messages[context.rule?.name || ''] || `${context.field} is invalid`
    }
  })
})
```

## Form UI Components

### Custom Form Field Component

```vue
<!-- components/forms/FormField.vue -->
<script setup lang="ts">
import { useField } from 'vee-validate'

interface Props {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  placeholder?: string
  hint?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false
})

const { value, errorMessage, handleBlur, handleChange } = useField(
  () => props.name
)
</script>

<template>
  <div class="form-field">
    <label :for="name" class="form-label">
      {{ label }}
      <span v-if="required" class="text-destructive">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="name"
        v-model="value"
        :type="type"
        :placeholder="placeholder"
        :aria-invalid="!!errorMessage"
        :aria-describedby="`${name}-error ${name}-hint`"
        class="form-input"
        :class="{ 'border-destructive': errorMessage }"
        @blur="handleBlur"
        @change="handleChange"
      />
      
      <span v-if="errorMessage" class="absolute right-2 top-2">
        <AlertCircle class="h-5 w-5 text-destructive" />
      </span>
    </div>
    
    <p v-if="hint && !errorMessage" :id="`${name}-hint`" class="form-hint">
      {{ hint }}
    </p>
    
    <p v-if="errorMessage" :id="`${name}-error`" class="form-error">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.form-field {
  @apply space-y-2;
}

.form-label {
  @apply text-sm font-medium text-foreground;
}

.form-input {
  @apply w-full px-3 py-2 border rounded-md;
  @apply bg-background text-foreground;
  @apply focus:ring-2 focus:ring-primary focus:border-transparent;
  @apply placeholder:text-muted-foreground;
}

.form-hint {
  @apply text-sm text-muted-foreground;
}

.form-error {
  @apply text-sm text-destructive;
}
</style>
```

### Date Picker Integration

```vue
<!-- components/forms/DateField.vue -->
<script setup lang="ts">
import { CalendarIcon } from 'lucide-vue-next'
import { format } from 'date-fns'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

interface Props {
  name: string
  label: string
  placeholder?: string
}

const props = defineProps<Props>()

const { value, setValue, errorMessage } = useField<Date>(() => props.name)

const formattedDate = computed(() => {
  return value.value ? format(value.value, 'PPP') : ''
})
</script>

<template>
  <FormField>
    <FormLabel>{{ label }}</FormLabel>
    <Popover>
      <PopoverTrigger as-child>
        <FormControl>
          <Button
            variant="outline"
            :class="['w-full justify-start text-left font-normal', 
                     !value && 'text-muted-foreground']"
          >
            <CalendarIcon class="mr-2 h-4 w-4" />
            {{ formattedDate || placeholder || 'Pick a date' }}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0">
        <Calendar v-model="value" />
      </PopoverContent>
    </Popover>
    <FormMessage v-if="errorMessage">{{ errorMessage }}</FormMessage>
  </FormField>
</template>
```

## Form Testing

### Unit Testing Forms

```typescript
// tests/forms/MatterForm.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import MatterForm from '~/components/forms/MatterForm.vue'

describe('MatterForm', () => {
  it('validates required fields', async () => {
    const wrapper = mount(MatterForm)
    
    // Submit without filling fields
    await wrapper.find('form').trigger('submit')
    
    // Check for error messages
    expect(wrapper.text()).toContain('Title is required')
    expect(wrapper.text()).toContain('Please select a priority')
  })
  
  it('submits valid form data', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(MatterForm, {
      props: { onSubmit }
    })
    
    // Fill form fields
    await wrapper.find('input[name="title"]').setValue('Test Matter')
    await wrapper.find('select[name="priority"]').setValue('HIGH')
    
    // Submit form
    await wrapper.find('form').trigger('submit')
    
    // Verify submission
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Test Matter',
      priority: 'HIGH'
    })
  })
})
```

## Best Practices

### 1. Schema Organization

```typescript
// schemas/index.ts
export * from './forms/matter'
export * from './forms/client'
export * from './forms/document'
export * from './validators/custom'

// Use centralized schemas
import { matterFormSchema } from '~/schemas'
```

### 2. Error Handling

```vue
<script setup>
const { showError } = useToast()

const handleSubmit = async (data) => {
  try {
    await submitForm(data)
  } catch (error) {
    if (error.response?.data?.errors) {
      // Set field-specific errors
      setErrors(error.response.data.errors)
    } else {
      // Show general error
      showError('Failed to submit form. Please try again.')
    }
  }
}
</script>
```

### 3. Accessibility

- Always use proper labels
- Include error messages with aria-describedby
- Provide helpful hints
- Ensure keyboard navigation
- Test with screen readers

### 4. Performance

- Use lazy validation for large forms
- Debounce async validations
- Memoize expensive computations
- Split large forms into steps

### 5. User Experience

- Show validation on blur, not on type
- Provide clear error messages
- Indicate required fields
- Save form progress
- Confirm before resetting