<template>
  <div class="expense-form">
    <!-- Step Progress Indicator -->
    <div class="step-progress mb-8">
      <div class="flex items-center justify-between">
        <div 
          v-for="(step, index) in steps.steps" 
          :key="step.id"
          class="flex items-center"
          :class="{ 'flex-1': index < steps.steps.length - 1 }"
        >
          <div 
            class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors"
            :class="steps.getStepClass(index)"
          >
            <Icon 
              v-if="steps.currentStep.value > index" 
              name="lucide:check" 
              class="w-5 h-5"
            />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div 
            v-if="index < steps.steps.length - 1" 
            class="flex-1 h-0.5 mx-4 transition-colors"
            :class="steps.currentStep.value > index ? 'bg-primary' : 'bg-muted'"
          />
        </div>
      </div>
      <div class="flex justify-between mt-2">
        <div 
          v-for="(step, index) in steps.steps" 
          :key="`label-${step.id}`"
          class="text-center flex-1"
        >
          <p 
            class="text-sm transition-colors"
            :class="steps.currentStep.value >= index ? 'text-foreground' : 'text-muted-foreground'"
          >
            {{ t(step.label) }}
          </p>
        </div>
      </div>
    </div>

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
        <div class="flex justify-between">
          <Button 
            type="button"
            variant="outline"
            :disabled="steps.isFirstStep || isSubmitting"
            @click="steps.previousStep"
          >
            {{ t('common.previous') }}
          </Button>
          
          <div class="flex gap-2">
            <Button 
              v-if="!isEdit"
              type="button"
              variant="ghost"
              :disabled="isSubmitting"
              @click="resetForm"
            >
              {{ t('expense.actions.reset') }}
            </Button>
            
            <Button 
              :type="steps.isLastStep ? 'submit' : 'button'"
              :disabled="!steps.stepValidation.value.canProceed || isSubmitting"
              @click="!steps.isLastStep && steps.nextStep()"
            >
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
              {{ steps.isLastStep 
                ? (isEdit ? t('expense.actions.update') : t('expense.actions.save')) 
                : t('common.next') 
              }}
            </Button>
          </div>
        </div>
      </form>
    </Form>

    <!-- Unsaved Changes Warning -->
    <div v-if="hasUnsavedChanges" class="mt-4">
      <Alert>
        <Icon name="lucide:alert-triangle" class="h-4 w-4" />
        <AlertDescription>
          {{ t('expense.confirmations.unsavedChanges') }}
        </AlertDescription>
      </Alert>
    </div>

    <!-- Draft Error Display -->
    <div v-if="draft.draftError" class="mt-4">
      <Alert variant="destructive">
        <Icon name="lucide:alert-circle" class="h-4 w-4" />
        <AlertDescription>
          {{ t('expense.errors.draftSaveFailed') }}: {{ draft.draftError }}
        </AlertDescription>
      </Alert>
    </div>

    <!-- Comprehensive Error Display -->
    <div v-if="errorHandling.hasError.value && errorHandling.currentError.value" class="mt-4">
      <Alert :variant="errorHandling.currentError.value.type === 'validation' ? 'default' : 'destructive'">
        <Icon 
          :name="errorHandling.currentError.value.type === 'validation' ? 'lucide:alert-triangle' : 'lucide:alert-circle'" 
          class="h-4 w-4" 
        />
        <AlertDescription class="flex flex-col gap-2">
          <span>{{ errorHandling.currentError.value.message }}</span>
          
          <!-- Recovery Actions -->
          <div v-if="errorHandling.getRecoveryActions().length > 0" class="flex gap-2">
            <Button
              v-for="action in errorHandling.getRecoveryActions()"
              :key="action.label"
              :variant="action.variant || 'secondary'"
              size="sm"
              :disabled="errorHandling.isRecovering"
              @click="action.action"
            >
              <Icon
v-if="errorHandling.isRecovering.value && action.variant === 'default'" 
                name="lucide:loader-2" 
                class="w-3 h-3 mr-1 animate-spin" 
              />
              {{ action.label }}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { ExpenseFormData } from '~/schemas/expense'
import type { IExpenseFormData } from '~/types/expense'
import { useExpenseForm } from '~/composables/useExpenseForm'
import { Form } from '~/components/ui/form'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription } from '~/components/ui/alert'
import ExpenseBasicInfoStep from './ExpenseBasicInfoStep.vue'
import ExpenseAmountStep from './ExpenseAmountStep.vue'
import ExpenseAdditionalInfoStep from './ExpenseAdditionalInfoStep.vue'

interface Props {
  initialData?: Partial<IExpenseFormData>
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

// Composables
const { t } = useI18n()

// Initialize the enhanced form composable
const expenseForm = useExpenseForm(props.initialData, (event: string, ...args: unknown[]) => {
  if (event === 'stepChange') {
    emit('stepChange', args[0] as number)
  } else if (event === 'submit') {
    emit('submit', args[0] as ExpenseFormData)
  } else if (event === 'cancel') {
    emit('cancel')
  }
})

// Extract commonly used properties for easier template access
const { 
  formValues: _formValues, 
  validationSchema, 
  isSubmitting: _isSubmitting,
  steps,
  draft,
  errorHandling
} = expenseForm

// Form management with vee-validate integration
const { meta: _meta, resetForm: resetVeeValidateForm } = useForm({
  validationSchema: toTypedSchema(validationSchema.value)
})

// Computed properties for template
const isSubmitting = computed(() => _isSubmitting.value || props.isLoading)
const hasUnsavedChanges = computed(() => expenseForm.isDirty.value || draft.hasDraft.value)

// Form submission handler
const onSubmit = async (data: Record<string, unknown>) => {
  try {
    await expenseForm.validateForm(data as Partial<ExpenseFormData>)
    emit('submit', data as ExpenseFormData)
    
    // Clear draft on successful submission
    if (!props.isEdit) {
      await draft.clearDraft()
    }
  } catch (error) {
    console.error('Form submission validation failed:', error)
  }
}

// Form reset handler
const resetForm = () => {
  expenseForm.resetForm()
  resetVeeValidateForm()
}

// Auto-restore draft on mount for new forms
onMounted(async () => {
  if (!props.isEdit && !props.initialData) {
    try {
      await draft.restoreDraft(expenseForm.setFieldValue)
    } catch (error) {
      console.warn('Failed to restore draft:', error)
    }
  }
})

// Expose methods to parent component
defineExpose({
  resetForm,
  clearDraft: draft.clearDraft,
  goToStep: steps.goToStep
})
</script>