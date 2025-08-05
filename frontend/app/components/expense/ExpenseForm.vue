<template>
  <div class="expense-form">
    <!-- Step Progress Indicator -->
    <div class="step-progress mb-8">
      <div class="flex items-center justify-between">
        <div 
          v-for="(step, index) in steps" 
          :key="step.id"
          class="flex items-center"
          :class="{ 'flex-1': index < steps.length - 1 }"
        >
          <div 
            class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors"
            :class="getStepClass(index)"
          >
            <Icon 
              v-if="currentStep > index" 
              name="lucide:check" 
              class="w-5 h-5"
            />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div 
            v-if="index < steps.length - 1" 
            class="flex-1 h-0.5 mx-4 transition-colors"
            :class="currentStep > index ? 'bg-primary' : 'bg-muted'"
          />
        </div>
      </div>
      <div class="flex justify-between mt-2">
        <div 
          v-for="(step, index) in steps" 
          :key="`label-${step.id}`"
          class="text-center flex-1"
        >
          <p 
            class="text-sm transition-colors"
            :class="currentStep >= index ? 'text-foreground' : 'text-muted-foreground'"
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
        <div v-if="currentStep === 0" class="step-content">
          <ExpenseBasicInfoStep />
        </div>

        <!-- Step 2: Amount Information -->
        <div v-else-if="currentStep === 1" class="step-content">
          <ExpenseAmountStep />
        </div>

        <!-- Step 3: Additional Information -->
        <div v-else-if="currentStep === 2" class="step-content">
          <ExpenseAdditionalInfoStep />
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between">
          <Button 
            type="button"
            variant="outline"
            :disabled="currentStep === 0 || isSubmitting"
            @click="previousStep"
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
              :type="currentStep === steps.length - 1 ? 'submit' : 'button'"
              :disabled="!canProceed || isSubmitting"
              @click="currentStep < steps.length - 1 && nextStep()"
            >
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
              {{ currentStep === steps.length - 1 
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
  </div>
</template>

<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { createExpenseSchema, type ExpenseFormData } from '~/schemas/expense'
import type { IExpenseFormData } from '~/types/expense'
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

// Form steps configuration
const steps = [
  { id: 'basic', label: 'expense.form.steps.basic' },
  { id: 'amount', label: 'expense.form.steps.amount' },
  { id: 'additional', label: 'expense.form.steps.additional' }
]

// Form state
const currentStep = ref(0)
const isSubmitting = ref(false)
const hasUnsavedChanges = ref(false)

// Validation schema
const validationSchema = toTypedSchema(createExpenseSchema(t))

// Form management
const { meta, setFieldValue, values, resetForm: resetVeeValidateForm } = useForm({
  validationSchema,
  initialValues: {
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    incomeAmount: 0,
    expenseAmount: 0,
    caseId: undefined,
    memo: '',
    tagIds: [],
    attachmentIds: [],
    ...props.initialData
  }
})

// Step validation and navigation
const canProceed = computed(() => {
  if (!meta.value.valid && currentStep.value === steps.length - 1) return false
  
  switch (currentStep.value) {
    case 0:
      return Boolean(values.date && values.category && values.description)
    case 1:
      return Boolean((values.incomeAmount as number) > 0 || (values.expenseAmount as number) > 0)
    case 2:
      return true
    default:
      return false
  }
})

const getStepClass = (index: number) => {
  if (currentStep.value > index) {
    return 'bg-primary border-primary text-primary-foreground'
  } else if (currentStep.value === index) {
    return 'bg-background border-primary text-primary'
  } else {
    return 'bg-background border-muted text-muted-foreground'
  }
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
    emit('stepChange', currentStep.value)
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    emit('stepChange', currentStep.value)
  }
}

const resetForm = () => {
  resetVeeValidateForm()
  currentStep.value = 0
  hasUnsavedChanges.value = false
  emit('stepChange', currentStep.value)
}

const onSubmit = async (data: Record<string, unknown>) => {
  isSubmitting.value = true
  try {
    emit('submit', data as ExpenseFormData)
    hasUnsavedChanges.value = false
  } finally {
    isSubmitting.value = false
  }
}

// Track unsaved changes
watch(values, () => {
  hasUnsavedChanges.value = true
}, { deep: true })

// Auto-save to localStorage for draft functionality
const STORAGE_KEY = 'expense-form-draft'

watch(values, (newValues) => {
  if (Object.keys(newValues).length > 0 && !props.isEdit) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newValues))
  }
}, { deep: true })

// Restore from localStorage on mount
onMounted(() => {
  if (!props.isEdit && !props.initialData) {
    const draft = localStorage.getItem(STORAGE_KEY)
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft)
        Object.keys(parsedDraft).forEach(key => {
          if (parsedDraft[key] !== undefined && parsedDraft[key] !== null) {
            setFieldValue(key as keyof ExpenseFormData, parsedDraft[key])
          }
        })
      } catch (error) {
        console.warn('Failed to restore expense form draft:', error)
      }
    }
  }
})

// Clear draft when form is submitted successfully
const clearDraft = () => {
  localStorage.removeItem(STORAGE_KEY)
}

// Expose methods to parent
defineExpose({
  resetForm,
  clearDraft,
  goToStep: (step: number) => {
    if (step >= 0 && step < steps.length) {
      currentStep.value = step
      emit('stepChange', step)
    }
  }
})
</script>