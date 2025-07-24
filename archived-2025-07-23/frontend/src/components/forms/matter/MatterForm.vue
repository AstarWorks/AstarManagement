<!--
  Base Matter Form Component
  
  Provides the common structure and functionality for matter creation and editing forms.
  Handles form validation, loading states, error handling, and submission logic.
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { z } from 'zod'

// UI Components
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Form } from '~/components/forms'
import { FormErrorSummary } from '~/components/forms'

// Types
import type { CreateMatterForm, UpdateMatterForm } from '~/schemas/matter'

interface Props {
  /** Form mode - create or edit */
  mode: 'create' | 'edit'
  /** Validation schema to use */
  schema: z.ZodSchema
  /** Initial form values */
  initialValues?: Partial<CreateMatterForm | UpdateMatterForm>
  /** Loading state for form submission */
  loading?: boolean
  /** Form title */
  title?: string
  /** Form description */
  description?: string
  /** Show form header */
  showHeader?: boolean
  /** Form class overrides */
  formClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showHeader: true,
  formClass: ''
})

// Emits
const emit = defineEmits<{
  /** Fired when form is submitted with valid data */
  submit: [data: any]
  /** Fired when form is cancelled */
  cancel: []
  /** Fired when form validation state changes */
  validationChange: [isValid: boolean]
}>()

// Form setup with VeeValidate
const { handleSubmit, errors, meta, values, resetForm } = useForm({
  validationSchema: toTypedSchema(props.schema),
  initialValues: props.initialValues
})

// Computed properties
const isValid = computed(() => meta.value.valid)
const isDirty = computed(() => meta.value.dirty)
const hasErrors = computed(() => Object.keys(errors.value).length > 0)

const formTitle = computed(() => {
  if (props.title) return props.title
  return props.mode === 'create' ? 'Create New Matter' : 'Edit Matter'
})

const formDescription = computed(() => {
  if (props.description) return props.description
  return props.mode === 'create' 
    ? 'Fill in the details below to create a new legal matter.'
    : 'Update the matter information below.'
})

const submitButtonText = computed(() => {
  if (props.loading) return props.mode === 'create' ? 'Creating...' : 'Updating...'
  return props.mode === 'create' ? 'Create Matter' : 'Update Matter'
})

const canSubmit = computed(() => isValid.value && !props.loading)

// Transform errors object to FormError array for FormErrorSummary
const formErrors = computed(() => {
  return Object.entries(errors.value).map(([fieldName, message]) => ({
    fieldName,
    message: message || 'This field has an error'
  }))
})

// Watch for validation changes
watch(isValid, (valid) => {
  emit('validationChange', valid)
}, { immediate: true })

// Form submission handler
const onSubmit = handleSubmit((data) => {
  emit('submit', data)
})


// Form cancellation handler
const onCancel = () => {
  if (isDirty.value) {
    if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      emit('cancel')
    }
  } else {
    emit('cancel')
  }
}

// Form reset
const resetFormData = () => {
  resetForm({
    values: props.initialValues
  })
}

// Expose methods for parent components
defineExpose({
  resetForm: resetFormData,
  isValid,
  isDirty,
  values
})
</script>

<template>
  <div class="matter-form-container">
    <!-- Form Header -->
    <div v-if="showHeader" class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-2xl font-semibold tracking-tight">
          {{ formTitle }}
        </h2>
        <Badge 
          v-if="mode === 'edit'" 
          variant="secondary"
          class="text-xs"
        >
          Editing
        </Badge>
      </div>
      <p class="text-muted-foreground">
        {{ formDescription }}
      </p>
    </div>

    <!-- Form Error Summary -->
    <FormErrorSummary 
      v-if="hasErrors && meta.touched"
      :errors="formErrors"
      class="mb-6"
    />

    <!-- Main Form -->
    <form 
      @submit="onSubmit"
      :class="['matter-form', formClass]"
      novalidate
    >
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Matter Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Form Fields Slot -->
          <slot 
            name="fields"
            :values="values"
            :errors="errors"
            :meta="meta"
            :is-valid="isValid"
            :is-dirty="isDirty"
            :loading="loading"
          />
        </CardContent>
      </Card>

      <!-- Form Actions -->
      <div class="flex items-center justify-end gap-4 mt-6">
        <Button
          type="button"
          variant="outline"
          @click="onCancel"
          :disabled="loading"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="!canSubmit"
          :loading="loading"
        >
          {{ submitButtonText }}
        </Button>
      </div>
    </form>

    <!-- Additional Content Slot -->
    <slot 
      name="additional"
      :values="values"
      :errors="errors"
      :meta="meta"
      :is-valid="isValid"
      :is-dirty="isDirty"
      :loading="loading"
    />
  </div>
</template>

<style scoped>
.matter-form-container {
  @apply max-w-4xl mx-auto p-6;
}

.matter-form {
  @apply w-full;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .matter-form-container {
    @apply p-4;
  }
  
  .flex.items-center.justify-end {
    @apply flex-col gap-2;
  }
  
  .flex.items-center.justify-end button {
    @apply w-full;
  }
}

/* Focus states for accessibility */
.matter-form :deep(:focus-visible) {
  @apply outline-2 outline-offset-2 outline-ring;
}

/* Loading state styling */
.matter-form:has([data-loading="true"]) {
  @apply opacity-75 pointer-events-none;
}
</style>