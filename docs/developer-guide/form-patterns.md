# Form Patterns Guide - Aster Management

This guide covers form handling patterns using VeeValidate and Zod in the Nuxt.js application.

## Table of Contents

1. [Form Architecture](#form-architecture)
2. [Schema Validation with Zod](#schema-validation-with-zod)
3. [VeeValidate Integration](#veevalidate-integration)
4. [Form Components](#form-components)
5. [Advanced Patterns](#advanced-patterns)
6. [Form State Management](#form-state-management)
7. [Accessibility](#accessibility)
8. [Testing Forms](#testing-forms)

## Form Architecture

### Overview

Our form handling strategy uses:

- **Zod**: Runtime schema validation and TypeScript type generation
- **VeeValidate**: Vue-native form validation and state management
- **Composition API**: Reactive form logic and reusable patterns
- **TypeScript**: End-to-end type safety from schema to UI

```
┌─────────────────────────────────────────────────────────────┐
│                    Form Architecture                        │
├─────────────────────────────────────────────────────────────┤
│  Schema Layer (Zod)                                        │
│  ├── Validation Rules                                      │
│  ├── Type Generation                                       │
│  └── Runtime Validation                                    │
├─────────────────────────────────────────────────────────────┤
│  Form Logic Layer (VeeValidate)                           │
│  ├── Field State Management                               │
│  ├── Validation Orchestration                             │
│  ├── Error Handling                                       │
│  └── Submission Logic                                     │
├─────────────────────────────────────────────────────────────┤
│  Component Layer (Vue)                                    │
│  ├── Form Controls                                        │
│  ├── Error Display                                        │
│  ├── Loading States                                       │
│  └── User Feedback                                        │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Schema-First**: Define validation rules in Zod schemas
2. **Type Safety**: Generate TypeScript types from schemas
3. **Reusability**: Create composable form logic
4. **Accessibility**: Build forms that work for everyone
5. **Performance**: Optimize for speed and responsiveness

## Schema Validation with Zod

### Basic Schema Patterns

Define validation schemas with Zod:

```typescript
// schemas/case.ts
import { z } from 'zod'

export const caseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  
  status: z.enum(['draft', 'active', 'on-hold', 'completed', 'archived'], {
    errorMap: () => ({ message: 'Please select a valid status' })
  }),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  clientId: z
    .string()
    .uuid('Please select a valid client'),
  
  assigneeId: z
    .string()
    .uuid('Please select a valid assignee')
    .optional(),
  
  dueDate: z
    .date()
    .min(new Date(), 'Due date must be in the future')
    .optional(),
  
  tags: z
    .array(z.string())
    .max(5, 'Maximum 5 tags allowed')
    .default([]),
  
  isPublic: z
    .boolean()
    .default(false),
  
  budget: z
    .number()
    .positive('Budget must be positive')
    .max(1000000, 'Budget cannot exceed $1,000,000')
    .optional()
})

// Generate TypeScript types
export type Case = z.infer<typeof caseSchema>
export type CreateCaseRequest = z.infer<typeof caseSchema>
export type UpdateCaseRequest = Partial<Case>

// Validation functions
export const validateCase = (data: unknown) => caseSchema.safeParse(data)
export const validateCaseStrict = (data: unknown) => caseSchema.parse(data)
```

### Advanced Schema Patterns

#### Conditional Validation

```typescript
// schemas/legal-document.ts
import { z } from 'zod'

const baseDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['contract', 'brief', 'memo', 'filing']),
  content: z.string().min(1, 'Content is required')
})

export const documentSchema = baseDocumentSchema.extend({
  // Conditional validation based on document type
  deadline: z.date().optional(),
  courtId: z.string().uuid().optional(),
  caseId: z.string().uuid().optional()
}).refine((data) => {
  // Filing documents must have a deadline
  if (data.type === 'filing' && !data.deadline) {
    return false
  }
  return true
}, {
  message: 'Filing documents must have a deadline',
  path: ['deadline']
}).refine((data) => {
  // Court filings must specify a court
  if (data.type === 'filing' && !data.courtId) {
    return false
  }
  return true
}, {
  message: 'Court filings must specify a court',
  path: ['courtId']
})
```

#### Array Validation

```typescript
// schemas/contact.ts
import { z } from 'zod'

const phoneSchema = z.object({
  type: z.enum(['mobile', 'home', 'work', 'fax']),
  number: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  isPrimary: z.boolean().default(false)
})

const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  country: z.string().default('US')
})

export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  
  phones: z
    .array(phoneSchema)
    .min(1, 'At least one phone number is required')
    .refine((phones) => phones.filter(p => p.isPrimary).length === 1, {
      message: 'Exactly one phone number must be marked as primary'
    }),
  
  addresses: z
    .array(addressSchema)
    .max(3, 'Maximum 3 addresses allowed')
})
```

#### Transform and Preprocess

```typescript
// schemas/case-with-transforms.ts
import { z } from 'zod'

export const caseFormSchema = z.object({
  title: z
    .string()
    .transform(str => str.trim())
    .pipe(z.string().min(1, 'Title is required')),
  
  budget: z
    .string()
    .optional()
    .transform(str => str ? parseFloat(str.replace(/[,$]/g, '')) : undefined)
    .pipe(z.number().positive().optional()),
  
  tags: z
    .string()
    .transform(str => str.split(',').map(tag => tag.trim()).filter(Boolean))
    .pipe(z.array(z.string()).max(5)),
  
  dueDate: z
    .string()
    .optional()
    .transform(str => str ? new Date(str) : undefined)
    .pipe(z.date().min(new Date()).optional())
})
```

## VeeValidate Integration

### Basic Form Setup

Integrate VeeValidate with Zod schemas:

```vue
<!-- components/forms/CaseForm.vue -->
<template>
  <form @submit="onSubmit" class="space-y-6">
    <div class="form-group">
      <Label for="title">Case Title *</Label>
      <Input
        id="title"
        v-model="title"
        name="title"
        :class="{ 'border-red-500': errors.title }"
        placeholder="Enter case title"
      />
      <span v-if="errors.title" class="text-sm text-red-500">
        {{ errors.title }}
      </span>
    </div>
    
    <div class="form-group">
      <Label for="description">Description *</Label>
      <Textarea
        id="description"
        v-model="description"
        name="description"
        :class="{ 'border-red-500': errors.description }"
        placeholder="Enter case description"
        rows="4"
      />
      <span v-if="errors.description" class="text-sm text-red-500">
        {{ errors.description }}
      </span>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-group">
        <Label for="status">Status *</Label>
        <Select v-model="status" name="status">
          <SelectTrigger :class="{ 'border-red-500': errors.status }">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <span v-if="errors.status" class="text-sm text-red-500">
          {{ errors.status }}
        </span>
      </div>
      
      <div class="form-group">
        <Label for="priority">Priority</Label>
        <Select v-model="priority" name="priority">
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <div class="form-group">
      <Label for="dueDate">Due Date</Label>
      <Input
        id="dueDate"
        v-model="dueDate"
        name="dueDate"
        type="date"
        :min="minDate"
      />
      <span v-if="errors.dueDate" class="text-sm text-red-500">
        {{ errors.dueDate }}
      </span>
    </div>
    
    <div class="form-group">
      <Label>
        <Checkbox v-model="isPublic" name="isPublic" />
        Public case (visible to clients)
      </Label>
    </div>
    
    <div class="flex justify-end space-x-2">
      <Button type="button" variant="outline" @click="$emit('cancel')">
        Cancel
      </Button>
      <Button 
        type="submit" 
        :disabled="!meta.valid || isSubmitting"
        :loading="isSubmitting"
      >
        {{ submitText }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { caseSchema, type Case } from '~/schemas/case'

interface Props {
  initialValues?: Partial<Case>
  submitText?: string
}

const props = withDefaults(defineProps<Props>(), {
  submitText: 'Create Case'
})

const emit = defineEmits<{
  submit: [values: Case]
  cancel: []
}>()

// Form setup with Zod schema
const { handleSubmit, errors, meta, isSubmitting, defineField } = useForm({
  validationSchema: toTypedSchema(caseSchema),
  initialValues: props.initialValues
})

// Define reactive form fields
const [title] = defineField('title')
const [description] = defineField('description')
const [status] = defineField('status')
const [priority] = defineField('priority', { initialValue: 'medium' })
const [dueDate] = defineField('dueDate')
const [isPublic] = defineField('isPublic')

// Computed values
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Form submission
const onSubmit = handleSubmit(async (values) => {
  try {
    emit('submit', values as Case)
  } catch (error) {
    console.error('Form submission error:', error)
  }
})
</script>
```

### Custom Field Components

Create reusable field components:

```vue
<!-- components/forms/FormField.vue -->
<template>
  <div class="form-field">
    <Label v-if="label" :for="name" :class="{ 'required': required }">
      {{ label }}
    </Label>
    
    <div class="field-container">
      <slot 
        :field="field"
        :error="errorMessage"
        :hasError="!!errorMessage"
        :meta="meta"
      />
    </div>
    
    <div v-if="errorMessage || hint" class="field-message">
      <span v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </span>
      <span v-else-if="hint" class="hint-message">
        {{ hint }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useField } from 'vee-validate'

interface Props {
  name: string
  label?: string
  hint?: string
  required?: boolean
  rules?: any
}

const props = defineProps<Props>()

const { value: field, errorMessage, meta } = useField(
  props.name,
  props.rules,
  {
    validateOnValueUpdate: false
  }
)
</script>

<style scoped>
.form-field {
  @apply space-y-1;
}

.required::after {
  content: ' *';
  @apply text-red-500;
}

.field-container {
  @apply relative;
}

.field-message {
  @apply min-h-[1.25rem];
}

.error-message {
  @apply text-sm text-red-500;
}

.hint-message {
  @apply text-sm text-gray-500;
}
</style>
```

### Array Field Handling

Handle dynamic arrays in forms:

```vue
<!-- components/forms/ContactPhoneList.vue -->
<template>
  <div class="phone-list">
    <div class="flex items-center justify-between mb-4">
      <Label class="text-base font-medium">Phone Numbers</Label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        @click="addPhone"
        :disabled="phones.length >= 5"
      >
        <Plus class="w-4 h-4 mr-1" />
        Add Phone
      </Button>
    </div>
    
    <div class="space-y-4">
      <div
        v-for="(phone, index) in phones"
        :key="phone.key"
        class="phone-entry border rounded-lg p-4"
      >
        <div class="flex items-start justify-between mb-2">
          <span class="text-sm font-medium">Phone {{ index + 1 }}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="removePhone(index)"
            :disabled="phones.length <= 1"
          >
            <X class="w-4 h-4" />
          </Button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField :name="`phones.${index}.type`" label="Type">
            <template #default="{ field, hasError }">
              <Select v-model="field.value" :class="{ 'border-red-500': hasError }">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="fax">Fax</SelectItem>
                </SelectContent>
              </Select>
            </template>
          </FormField>
          
          <FormField :name="`phones.${index}.number`" label="Number">
            <template #default="{ field, hasError }">
              <Input
                v-model="field.value"
                type="tel"
                placeholder="(555) 123-4567"
                :class="{ 'border-red-500': hasError }"
              />
            </template>
          </FormField>
          
          <FormField :name="`phones.${index}.isPrimary`">
            <template #default="{ field }">
              <div class="flex items-center space-x-2 pt-6">
                <Checkbox
                  :id="`phone-primary-${index}`"
                  v-model="field.value"
                  @change="handlePrimaryChange(index, $event)"
                />
                <Label :for="`phone-primary-${index}`">Primary</Label>
              </div>
            </template>
          </FormField>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFieldArray } from 'vee-validate'

const { fields: phones, push, remove } = useFieldArray('phones')

// Initialize with one phone if empty
if (phones.value.length === 0) {
  push({ type: 'mobile', number: '', isPrimary: true })
}

const addPhone = () => {
  push({ type: 'mobile', number: '', isPrimary: false })
}

const removePhone = (index: number) => {
  // If removing primary phone, make first remaining phone primary
  const removedPhone = phones.value[index]
  remove(index)
  
  if (removedPhone.isPrimary && phones.value.length > 0) {
    phones.value[0].isPrimary = true
  }
}

const handlePrimaryChange = (index: number, isPrimary: boolean) => {
  if (isPrimary) {
    // Ensure only one phone is primary
    phones.value.forEach((phone, i) => {
      if (i !== index) {
        phone.isPrimary = false
      }
    })
  }
}
</script>
```

## Advanced Patterns

### Multi-Step Forms

Create wizard-style forms:

```vue
<!-- components/forms/CaseWizard.vue -->
<template>
  <div class="case-wizard">
    <!-- Progress indicator -->
    <div class="wizard-progress mb-8">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="step"
          :class="{
            'active': currentStep === index,
            'completed': index < currentStep,
            'disabled': index > currentStep
          }"
        >
          <div class="step-indicator">
            <CheckCircle v-if="index < currentStep" class="w-5 h-5" />
            <span v-else class="step-number">{{ index + 1 }}</span>
          </div>
          <span class="step-title">{{ step.title }}</span>
        </div>
      </div>
    </div>
    
    <!-- Step content -->
    <div class="wizard-content">
      <component
        :is="currentStepComponent"
        v-model="formData"
        @next="handleNext"
        @previous="handlePrevious"
        @submit="handleSubmit"
        :errors="stepErrors"
        :is-last-step="isLastStep"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CaseBasicInfo from './steps/CaseBasicInfo.vue'
import CaseDetails from './steps/CaseDetails.vue'
import CaseReview from './steps/CaseReview.vue'

const steps = [
  { id: 'basic', title: 'Basic Information', component: CaseBasicInfo },
  { id: 'details', title: 'Case Details', component: CaseDetails },
  { id: 'review', title: 'Review & Submit', component: CaseReview }
]

const currentStep = ref(0)
const formData = ref({})
const stepErrors = ref<Record<string, string>>({})

const currentStepComponent = computed(() => steps[currentStep.value].component)
const isLastStep = computed(() => currentStep.value === steps.length - 1)

const handleNext = async () => {
  const isValid = await validateCurrentStep()
  if (isValid && currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const handlePrevious = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const validateCurrentStep = async () => {
  // Validate current step data
  const stepId = steps[currentStep.value].id
  try {
    // Implement step-specific validation
    return true
  } catch (error) {
    stepErrors.value[stepId] = error.message
    return false
  }
}

const handleSubmit = async () => {
  // Final validation and submission
  try {
    await submitCase(formData.value)
    // Handle success
  } catch (error) {
    // Handle error
  }
}
</script>
```

### Conditional Fields

Implement dynamic form fields:

```vue
<!-- components/forms/ConditionalForm.vue -->
<template>
  <form @submit="onSubmit" class="space-y-6">
    <FormField name="documentType" label="Document Type" required>
      <template #default="{ field, hasError }">
        <Select v-model="field.value" :class="{ 'border-red-500': hasError }">
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="brief">Legal Brief</SelectItem>
            <SelectItem value="filing">Court Filing</SelectItem>
            <SelectItem value="memo">Internal Memo</SelectItem>
          </SelectContent>
        </Select>
      </template>
    </FormField>
    
    <!-- Conditional fields based on document type -->
    <div v-if="documentType === 'contract'">
      <FormField name="contractValue" label="Contract Value">
        <template #default="{ field, hasError }">
          <Input
            v-model="field.value"
            type="number"
            placeholder="0.00"
            :class="{ 'border-red-500': hasError }"
          />
        </template>
      </FormField>
      
      <FormField name="parties" label="Parties Involved">
        <template #default="{ field, hasError }">
          <Textarea
            v-model="field.value"
            placeholder="List all parties to the contract"
            :class="{ 'border-red-500': hasError }"
          />
        </template>
      </FormField>
    </div>
    
    <div v-if="documentType === 'filing'">
      <FormField name="courtId" label="Court" required>
        <template #default="{ field, hasError }">
          <Select v-model="field.value" :class="{ 'border-red-500': hasError }">
            <SelectTrigger>
              <SelectValue placeholder="Select court" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="court in courts" 
                :key="court.id" 
                :value="court.id"
              >
                {{ court.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </template>
      </FormField>
      
      <FormField name="filingDeadline" label="Filing Deadline" required>
        <template #default="{ field, hasError }">
          <Input
            v-model="field.value"
            type="datetime-local"
            :min="minDateTime"
            :class="{ 'border-red-500': hasError }"
          />
        </template>
      </FormField>
    </div>
    
    <div v-if="documentType === 'brief'">
      <FormField name="caseNumber" label="Case Number">
        <template #default="{ field, hasError }">
          <Input
            v-model="field.value"
            placeholder="Enter case number"
            :class="{ 'border-red-500': hasError }"
          />
        </template>
      </FormField>
      
      <FormField name="briefType" label="Brief Type">
        <template #default="{ field, hasError }">
          <Select v-model="field.value">
            <SelectTrigger>
              <SelectValue placeholder="Select brief type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="motion">Motion</SelectItem>
              <SelectItem value="response">Response</SelectItem>
              <SelectItem value="reply">Reply</SelectItem>
              <SelectItem value="appellate">Appellate Brief</SelectItem>
            </SelectContent>
          </Select>
        </template>
      </FormField>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { documentSchema } from '~/schemas/document'

const { handleSubmit, values: formValues } = useForm({
  validationSchema: toTypedSchema(documentSchema)
})

// Reactive access to form values
const documentType = computed(() => formValues.documentType)

// Computed values
const minDateTime = computed(() => {
  const now = new Date()
  return now.toISOString().slice(0, 16)
})

// Data fetching
const { data: courts } = await useFetch('/api/courts')

const onSubmit = handleSubmit(async (values) => {
  // Handle form submission
})
</script>
```

### Form Composition

Break complex forms into composable pieces:

```typescript
// composables/forms/useFormValidation.ts
export function useFormValidation<T>(schema: ZodSchema<T>) {
  const { handleSubmit, errors, meta, isSubmitting, setFieldError, resetForm } = useForm({
    validationSchema: toTypedSchema(schema)
  })
  
  const submitWithErrorHandling = (
    onSubmit: (values: T) => Promise<void>,
    onError?: (error: Error) => void
  ) => {
    return handleSubmit(async (values) => {
      try {
        await onSubmit(values as T)
      } catch (error) {
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, message]) => {
            setFieldError(field, message as string)
          })
        } else {
          onError?.(error as Error)
        }
      }
    })
  }
  
  return {
    errors: readonly(errors),
    meta: readonly(meta),
    isSubmitting: readonly(isSubmitting),
    submitWithErrorHandling,
    resetForm
  }
}

// composables/forms/useFormPersistence.ts
export function useFormPersistence(formId: string) {
  const storageKey = `form-draft-${formId}`
  
  const saveDraft = (values: Record<string, any>) => {
    localStorage.setItem(storageKey, JSON.stringify({
      values,
      timestamp: Date.now()
    }))
  }
  
  const loadDraft = () => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const { values, timestamp } = JSON.parse(saved)
        // Only load drafts from the last 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return values
        }
      } catch (error) {
        console.warn('Failed to load form draft:', error)
      }
    }
    return null
  }
  
  const clearDraft = () => {
    localStorage.removeItem(storageKey)
  }
  
  return {
    saveDraft,
    loadDraft,
    clearDraft
  }
}
```

## Form State Management

### Global Form State

Manage form state across components:

```typescript
// stores/forms.ts
export const useFormsStore = defineStore('forms', () => {
  const drafts = ref<Record<string, any>>({})
  const submissionStates = ref<Record<string, boolean>>({})
  
  const saveDraft = (formId: string, values: any) => {
    drafts.value[formId] = {
      values,
      timestamp: Date.now()
    }
    // Persist to localStorage
    localStorage.setItem('form-drafts', JSON.stringify(drafts.value))
  }
  
  const loadDraft = (formId: string) => {
    const draft = drafts.value[formId]
    if (draft && Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
      return draft.values
    }
    return null
  }
  
  const clearDraft = (formId: string) => {
    delete drafts.value[formId]
    localStorage.setItem('form-drafts', JSON.stringify(drafts.value))
  }
  
  const setSubmitting = (formId: string, isSubmitting: boolean) => {
    submissionStates.value[formId] = isSubmitting
  }
  
  const isSubmitting = (formId: string) => {
    return submissionStates.value[formId] || false
  }
  
  // Initialize from localStorage
  const initialize = () => {
    const saved = localStorage.getItem('form-drafts')
    if (saved) {
      try {
        drafts.value = JSON.parse(saved)
      } catch (error) {
        console.warn('Failed to load form drafts:', error)
      }
    }
  }
  
  return {
    drafts: readonly(drafts),
    saveDraft,
    loadDraft,
    clearDraft,
    setSubmitting,
    isSubmitting,
    initialize
  }
})
```

## Accessibility

### Form Accessibility Patterns

Ensure forms are accessible to all users:

```vue
<!-- components/forms/AccessibleForm.vue -->
<template>
  <form @submit="onSubmit" novalidate>
    <!-- Form title and description -->
    <div class="form-header" role="group" aria-labelledby="form-title">
      <h2 id="form-title">Create New Case</h2>
      <p id="form-description">
        Fill out the form below to create a new legal case.
        Fields marked with * are required.
      </p>
    </div>
    
    <!-- Live region for announcements -->
    <div
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
      role="status"
    >
      {{ announcements }}
    </div>
    
    <!-- Form fields with proper ARIA attributes -->
    <fieldset class="form-section">
      <legend>Basic Information</legend>
      
      <div class="form-group">
        <label for="case-title" class="required">
          Case Title
        </label>
        <input
          id="case-title"
          v-model="title"
          type="text"
          required
          aria-required="true"
          aria-describedby="title-error title-hint"
          :aria-invalid="!!errors.title"
          :class="{ 'error': errors.title }"
        />
        <div id="title-hint" class="field-hint">
          Enter a descriptive title for the case (3-100 characters)
        </div>
        <div
          v-if="errors.title"
          id="title-error"
          class="field-error"
          role="alert"
        >
          {{ errors.title }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="case-description" class="required">
          Description
        </label>
        <textarea
          id="case-description"
          v-model="description"
          required
          aria-required="true"
          aria-describedby="description-error description-hint"
          :aria-invalid="!!errors.description"
          rows="4"
          :class="{ 'error': errors.description }"
        />
        <div id="description-hint" class="field-hint">
          Provide a detailed description of the case (10-1000 characters)
        </div>
        <div
          v-if="errors.description"
          id="description-error"
          class="field-error"
          role="alert"
        >
          {{ errors.description }}
        </div>
      </div>
    </fieldset>
    
    <!-- Form actions -->
    <div class="form-actions">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn btn-secondary"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="!meta.valid || isSubmitting"
        :aria-describedby="!meta.valid ? 'submit-error' : undefined"
        class="btn btn-primary"
      >
        <span v-if="isSubmitting">Creating Case...</span>
        <span v-else>Create Case</span>
      </button>
      
      <div
        v-if="!meta.valid && meta.touched"
        id="submit-error"
        class="field-error"
        role="alert"
      >
        Please fix the errors above before submitting
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { caseSchema } from '~/schemas/case'

const { handleSubmit, errors, meta, isSubmitting, defineField } = useForm({
  validationSchema: toTypedSchema(caseSchema)
})

const [title] = defineField('title')
const [description] = defineField('description')

const announcements = ref('')

// Announce form state changes
watch(errors, (newErrors, oldErrors) => {
  const errorCount = Object.keys(newErrors).length
  const oldErrorCount = Object.keys(oldErrors || {}).length
  
  if (errorCount > oldErrorCount) {
    announcements.value = `${errorCount} validation error${errorCount === 1 ? '' : 's'} found`
  } else if (errorCount === 0 && oldErrorCount > 0) {
    announcements.value = 'All validation errors resolved'
  }
})

const onSubmit = handleSubmit(async (values) => {
  announcements.value = 'Submitting form...'
  try {
    // Handle submission
    announcements.value = 'Case created successfully'
  } catch (error) {
    announcements.value = 'Failed to create case. Please try again.'
  }
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: red;
}

.error {
  border-color: red;
}

.field-error {
  color: red;
  font-size: 0.875rem;
}

.field-hint {
  color: #666;
  font-size: 0.875rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
```

## Testing Forms

### Form Validation Testing

Test form validation logic:

```typescript
// components/forms/CaseForm.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CaseForm from './CaseForm.vue'

describe('CaseForm Validation', () => {
  it('should show required field errors', async () => {
    const wrapper = mount(CaseForm)
    
    // Submit empty form
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    
    expect(wrapper.find('[id="title-error"]').text()).toContain('Title is required')
    expect(wrapper.find('[id="description-error"]').text()).toContain('Description is required')
  })
  
  it('should validate field lengths', async () => {
    const wrapper = mount(CaseForm)
    
    // Set field values that are too short
    await wrapper.find('#case-title').setValue('ab')
    await wrapper.find('#case-description').setValue('short')
    
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    
    expect(wrapper.find('[id="title-error"]').text()).toContain('at least 3 characters')
    expect(wrapper.find('[id="description-error"]').text()).toContain('at least 10 characters')
  })
  
  it('should submit valid form', async () => {
    const wrapper = mount(CaseForm)
    
    // Fill valid data
    await wrapper.find('#case-title').setValue('Valid Case Title')
    await wrapper.find('#case-description').setValue('This is a valid case description with enough characters')
    await wrapper.find('#case-status').setValue('active')
    
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      title: 'Valid Case Title',
      description: 'This is a valid case description with enough characters',
      status: 'active'
    })
  })
})
```

This comprehensive form patterns guide provides the foundation for building robust, accessible, and user-friendly forms in the Aster Management application.