<!--
  Dynamic Form Builder Component
  Main form builder that takes template variables and generates a complete form
-->
<template>
  <form 
    @submit.prevent="handleSubmit"
    class="dynamic-form-builder"
    :class="formClasses"
    novalidate
  >
    <!-- Form header -->
    <div v-if="$slots.header" class="form-header">
      <slot name="header" :form-state="formState" />
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="form-loading">
      <div class="animate-pulse space-y-4">
        <div v-for="i in 3" :key="i" class="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="hasGlobalErrors" class="form-errors" role="alert">
      <h3 class="error-title">Please fix the following errors:</h3>
      <ul class="error-list">
        <li v-for="(error, field) in globalErrors" :key="field" class="error-item">
          <strong>{{ getFieldLabel(field) }}:</strong> {{ error }}
        </li>
      </ul>
    </div>
    
    <!-- Form sections -->
    <div v-else class="form-sections">
      <DynamicFieldGroup
        v-for="group in fieldGroups"
        :key="group.id"
        :group="group"
        :form-data="formData"
        :disabled="readonly || isSubmitting"
        :readonly="readonly"
        :size="formSize"
        @update="handleFieldUpdate"
        @group-toggle="handleGroupToggle"
      />
    </div>
    
    <!-- Form actions -->
    <div v-if="!readonly" class="form-actions">
      <slot name="actions" :form-state="formState" :submit="handleSubmit" :reset="handleReset">
        <div class="flex gap-3 justify-end">
          <Button
            v-if="showResetButton"
            type="button"
            variant="outline"
            :disabled="isSubmitting || !isDirty"
            @click="handleReset"
          >
            {{ resetButtonText }}
          </Button>
          <Button
            type="submit"
            :disabled="!isValid || isSubmitting"
            :loading="isSubmitting"
          >
            {{ submitButtonText }}
          </Button>
        </div>
      </slot>
    </div>
    
    <!-- Form footer -->
    <div v-if="$slots.footer" class="form-footer">
      <slot name="footer" :form-state="formState" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import type { DynamicFormProps, DynamicFormEmits } from './types'
import { useDynamicForm } from '~/composables/form/useDynamicForm'
import { useResponsive } from '~/composables/useResponsive'
import DynamicFieldGroup from './DynamicFieldGroup.vue'
import { Button } from '~/components/ui/button'

const props = withDefaults(defineProps<DynamicFormProps>(), {
  initialData: () => ({}),
  layout: () => ({ type: 'auto' }),
  readonly: false,
  showSectionTitles: true,
  enableCollapsibleSections: true,
  submitButtonText: 'Generate Document',
  resetButtonText: 'Reset Form',
  showResetButton: true,
  validateOnMount: false
})

const emit = defineEmits<DynamicFormEmits>()

// Responsive handling
const { isMobile } = useResponsive()

// Dynamic form logic
const {
  formData,
  fieldGroups,
  isValid,
  isDirty,
  isSubmitting,
  globalErrors,
  isLoading,
  handleSubmit: submitForm,
  handleFieldUpdate,
  handleReset: resetForm,
  validateForm,
  getFieldLabel
} = useDynamicForm(props.variables, props.initialData, {
  layout: props.layout,
  validateOnMount: props.validateOnMount,
  onSubmit: (data) => emit('submit', data),
  onChange: (data) => emit('change', data),
  onReset: () => emit('reset'),
  onFieldChange: (fieldName, value) => emit('fieldChange', fieldName, value),
  onValidationChange: (valid, errors) => emit('validationChange', valid, errors)
})

// Provide form context for child components
provide('dynamicFormContext', {
  formData,
  isValid,
  isDirty,
  isSubmitting,
  readonly: props.readonly
})

// Computed properties
const formClasses = computed(() => [
  'dynamic-form-builder',
  {
    'dynamic-form-builder--mobile': isMobile.value,
    'dynamic-form-builder--readonly': props.readonly,
    'dynamic-form-builder--submitting': isSubmitting.value
  }
])

const hasGlobalErrors = computed(() => 
  globalErrors.value && Object.keys(globalErrors.value).length > 0
)

const formSize = computed(() => 
  isMobile.value ? 'sm' : 'md'
)

const formState = computed(() => ({
  formData: formData.value,
  isValid: isValid.value,
  isDirty: isDirty.value,
  isSubmitting: isSubmitting.value,
  errors: globalErrors.value
}))

// Event handlers
const handleSubmit = () => {
  submitForm(formData.value)
}

const handleReset = () => {
  resetForm()
}

const handleGroupToggle = (groupId: string, collapsed: boolean) => {
  // Update group collapsed state
  const group = fieldGroups.value.find(g => g.id === groupId)
  if (group) {
    group.collapsed = collapsed
  }
}
</script>

<style scoped>
.dynamic-form-builder {
  @apply w-full max-w-4xl mx-auto space-y-6;
}

.dynamic-form-builder--mobile {
  @apply max-w-none mx-0 space-y-4;
}

.dynamic-form-builder--readonly {
  @apply bg-gray-50 dark:bg-gray-900 p-4 rounded-lg;
}

.dynamic-form-builder--submitting {
  @apply pointer-events-none;
}

.form-header {
  @apply mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.form-loading {
  @apply p-4;
}

.form-errors {
  @apply mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg;
}

.error-title {
  @apply text-lg font-semibold text-red-900 dark:text-red-100 mb-3;
}

.error-list {
  @apply space-y-2 list-none p-0 m-0;
}

.error-item {
  @apply text-sm text-red-800 dark:text-red-200;
}

.form-sections {
  @apply space-y-6;
}

.form-actions {
  @apply pt-6 mt-6 border-t border-gray-200 dark:border-gray-700;
}

.form-footer {
  @apply mt-6 pt-4 border-t border-gray-200 dark:border-gray-700;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .dynamic-form-builder {
    @apply px-2 space-y-4;
  }
  
  .form-actions {
    @apply pt-4 mt-4;
  }
  
  .form-actions .flex {
    @apply flex-col gap-2;
  }
  
  .form-actions .flex button {
    @apply w-full;
  }
}
</style>