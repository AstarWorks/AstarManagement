<template>
  <div class="expense-form">
    <!-- Step Progress Indicator -->
    <StepProgressIndicator
      :steps="steps.steps"
      :current-step="steps.currentStep.value"
      :completed-steps="steps.stepValidation.value.completedSteps"
      :allow-step-navigation="false"
      @step-click="steps.goToStep"
    />

    <!-- Form Content -->
    <Form v-slot="{ handleSubmit: formHandleSubmit }" :validation-schema="validationSchema">
      <form class="space-y-6" @submit="formHandleSubmit(onSubmit)">
        <!-- Step 1: Basic Information -->
        <div v-if="steps.currentStep.value === 0" class="step-content">
          <ExpenseBasicInfoStep />
        </div>

        <!-- Step 2: Amount Information -->
        <div v-else-if="steps.currentStep.value === 1" class="step-content">
          <ExpenseAmountStep />
        </div>

        <!-- Step 3: Additional Information -->
        <div v-else-if="steps.currentStep.value === 2" class="step-content">
          <ExpenseAdditionalInfoStep />
        </div>

        <!-- Navigation Buttons -->
        <ExpenseFormNavigation
          :is-first-step="steps.isFirstStep.value"
          :is-last-step="steps.isLastStep.value"
          :can-proceed="steps.stepValidation.value.canProceed"
          :is-submitting="isSubmitting"
          :is-edit="isEdit"
          :show-reset="!isEdit"
          :show-save-draft="!isEdit && draft.hasDraft.value"
          :can-save-draft="isDirty"
          :is-saving-draft="false"
          @previous="steps.previousStep"
          @next="steps.nextStep"
          @reset="resetForm"
          @save-draft="saveDraft"
        />
      </form>
    </Form>

    <!-- Error Display -->
    <ExpenseFormErrorDisplay
      :current-error="errorHandling.currentError.value"
      :draft-error="draft.draftError.value"
      :validation-errors="validationErrors"
      :recovery-actions="errorHandling.getRecoveryActions()"
      :is-recovering="errorHandling.isRecovering.value"
      :has-unsaved-changes="hasUnsavedChanges"
      :show-error-details="false"
      class="mt-4"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { ExpenseFormData } from '~/schemas/expense'
import { useExpenseForm } from '@expense/composables/form/useExpenseForm'
import { Form } from '@ui/form'
import ExpenseBasicInfoStep from './ExpenseBasicInfoStep.vue'
import ExpenseAmountStep from './ExpenseAmountStep.vue'
import ExpenseAdditionalInfoStep from './ExpenseAdditionalInfoStep.vue'
import StepProgressIndicator from './StepProgressIndicator.vue'
import ExpenseFormErrorDisplay from './ExpenseFormErrorDisplay.vue'
import ExpenseFormNavigation from './ExpenseFormNavigation.vue'

interface Props {
  initialData?: Partial<ExpenseFormData>
  isEdit?: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'submit', data: ExpenseFormData): void
  (e: 'cancel'): void
  (e: 'stepChange', step: number): void
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
  isLoading: false
})

const emit = defineEmits<Emits>()

// Composablesused in this component

// Initialize the form composable without emit proxy
const expenseForm = useExpenseForm(props.initialData)

// Extract commonly used properties for easier template access
const { 
  formValues, 
  validationSchema, 
  isSubmitting: formIsSubmitting,
  steps,
  draft,
  errorHandling,
  isDirty,
  validationState
} = expenseForm

// Form management with vee-validate integration
const { resetForm: resetVeeValidateForm } = useForm({
  validationSchema: toTypedSchema(validationSchema.value)
})

// Computed properties for template
const isSubmitting = computed(() => formIsSubmitting.value || props.isLoading)
const hasUnsavedChanges = computed(() => isDirty.value || draft.hasDraft.value)
const validationErrors = computed(() => validationState.value.errors)

// Watch for step changes and emit events
if (steps.currentStep) {
  watch(steps.currentStep, (newStep) => {
    emit('stepChange', newStep)
  })
}

// Form submission handler with proper type safety
const onSubmit = async (data: Record<string, unknown>) => {
  try {
    // Validate form data
    const isValid = await expenseForm.validateForm(data as Partial<ExpenseFormData>)
    
    if (isValid) {
      // Type-safe submission
      const formData = data as ExpenseFormData
      emit('submit', formData)
      
      // Clear draft on successful submission for new forms
      if (!props.isEdit) {
        await draft.clearDraft()
      }
    }
  } catch (error) {
    // Use error handling composable instead of console.error
    errorHandling.handleError(error, 'form_submission')
  }
}

// Form reset handler
const resetForm = () => {
  expenseForm.resetForm()
  resetVeeValidateForm()
  errorHandling.clearAllErrors()
}

// Save draft handler
const saveDraft = async () => {
  try {
    const result = await draft.saveDraft(formValues.value)
    if (!result.success && result.error) {
      errorHandling.handleStorageError(new Error(result.error), 'save')
    }
  } catch (error) {
    errorHandling.handleStorageError(error, 'save')
  }
}

// Auto-restore draft on mount for new forms
onMounted(async () => {
  if (!props.isEdit && !props.initialData) {
    try {
      const result = await draft.restoreDraft(expenseForm.setFieldValue)
      if (!result.success && result.error) {
        // Use error handling composable instead of console.warn
        errorHandling.handleStorageError(new Error(result.error), 'load')
      }
    } catch (error) {
      errorHandling.handleStorageError(error, 'load')
    }
  }
})

// Expose methods to parent component
defineExpose({
  resetForm,
  saveDraft,
  clearDraft: draft.clearDraft,
  goToStep: steps.goToStep
})
</script>
