<template>
  <div class="space-y-6">
    <!-- Step Progress Indicator -->
    <div v-if="showProgressIndicator" class="w-full">
      <StepProgress
        :steps="stepConfigs"
        :current-step="currentStep"
        :completed-steps="completedSteps"
        :variant="progressVariant"
        @step-click="handleStepClick"
      />
    </div>

    <!-- Form Container -->
    <div class="relative">
      <!-- Current Step Form -->
      <Form
        :key="`step-${currentStep}`"
        :schema="currentStepSchema"
        :initial-values="getStepValues(currentStep)"
        @submit="handleStepSubmit"
      >
        <template #default="{ form }">
          <!-- Step Content -->
          <div class="space-y-6">
            <!-- Step Header -->
            <div v-if="currentStepConfig.title || currentStepConfig.description" class="text-center">
              <h2 v-if="currentStepConfig.title" class="text-2xl font-bold text-foreground">
                {{ currentStepConfig.title }}
              </h2>
              <p v-if="currentStepConfig.description" class="text-muted-foreground mt-2">
                {{ currentStepConfig.description }}
              </p>
            </div>

            <!-- Dynamic Step Component -->
            <component
              :is="currentStepConfig.component"
              v-if="currentStepConfig.component"
              :form="form"
              :step-data="getStepValues(currentStep)"
              :form-data="formData"
              @update="handleStepUpdate"
            />

            <!-- Slot for Custom Step Content -->
            <slot
              :name="`step-${currentStep}`"
              :form="form"
              :step-data="getStepValues(currentStep)"
              :form-data="formData"
              :current-step="currentStep"
              :step-config="currentStepConfig"
            />

            <!-- Default Slot -->
            <slot
              v-if="!currentStepConfig.component && !$slots[`step-${currentStep}`]"
              :form="form"
              :step-data="getStepValues(currentStep)"
              :form-data="formData"
              :current-step="currentStep"
              :step-config="currentStepConfig"
            />
          </div>

          <!-- Navigation Controls -->
          <div class="flex justify-between items-center pt-8 border-t">
            <!-- Previous Button -->
            <Button
              v-if="showPreviousButton"
              type="button"
              variant="outline"
              :disabled="isFirstStep || isSubmitting"
              @click="previousStep"
            >
              <ChevronLeft class="h-4 w-4 mr-2" />
              {{ previousButtonText }}
            </Button>
            <div v-else></div>

            <!-- Step Info -->
            <div v-if="showStepInfo" class="text-sm text-muted-foreground">
              Step {{ currentStep + 1 }} of {{ totalSteps }}
            </div>

            <!-- Next/Submit Button -->
            <Button
              type="submit"
              :disabled="isSubmitting || (!allowIncompleteSteps && !isCurrentStepValid)"
              :loading="isSubmitting"
            >
              <span>{{ isLastStep ? submitButtonText : nextButtonText }}</span>
              <ChevronRight v-if="!isLastStep" class="h-4 w-4 ml-2" />
            </Button>
          </div>

          <!-- Step Validation Summary -->
          <div
            v-if="showValidationSummary && form.errors && Object.keys(form.errors).length > 0"
            class="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <h4 class="text-sm font-medium text-destructive mb-2">
              Please fix the following errors:
            </h4>
            <ul class="text-sm text-destructive space-y-1">
              <li v-for="(error, field) in form.errors" :key="field">
                • {{ error }}
              </li>
            </ul>
          </div>
        </template>
      </Form>

      <!-- Loading Overlay -->
      <div
        v-if="isTransitioning"
        class="absolute inset-0 bg-background/50 flex items-center justify-center"
      >
        <div class="flex items-center gap-2 text-muted-foreground">
          <Loader2 class="h-4 w-4 animate-spin" />
          <span>{{ transitionText }}</span>
        </div>
      </div>
    </div>

    <!-- Form Summary (Last Step) -->
    <div v-if="showSummary && isLastStep" class="space-y-4">
      <Separator />
      <FormSummary
        :form-data="formData"
        :step-configs="stepConfigs"
        @edit-step="goToStep"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, type Component } from 'vue'
import { useForm as useVeeForm } from 'vee-validate'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-vue-next'
import type { z } from 'zod'

/**
 * Step configuration interface
 */
export interface StepConfig {
  id: string
  title?: string
  description?: string
  schema: z.ZodSchema
  component?: Component | string
  optional?: boolean
  condition?: (formData: any) => boolean
}

/**
 * MultiStepForm component props
 */
export interface MultiStepFormProps {
  /** Array of step configurations */
  steps: StepConfig[]
  /** Initial form data */
  initialData?: Record<string, any>
  /** Whether to show progress indicator */
  showProgressIndicator?: boolean
  /** Progress indicator variant */
  progressVariant?: 'default' | 'compact' | 'minimal'
  /** Whether to show previous button */
  showPreviousButton?: boolean
  /** Whether to show step info */
  showStepInfo?: boolean
  /** Whether to show validation summary */
  showValidationSummary?: boolean
  /** Whether to show form summary on last step */
  showSummary?: boolean
  /** Whether to allow navigation to incomplete steps */
  allowIncompleteSteps?: boolean
  /** Whether to persist form data */
  persistData?: boolean
  /** Storage key for persistence */
  storageKey?: string
  /** Previous button text */
  previousButtonText?: string
  /** Next button text */
  nextButtonText?: string
  /** Submit button text */
  submitButtonText?: string
  /** Transition text */
  transitionText?: string
  /** Auto-advance after successful validation */
  autoAdvance?: boolean
}

const props = withDefaults(defineProps<MultiStepFormProps>(), {
  showProgressIndicator: true,
  progressVariant: 'default',
  showPreviousButton: true,
  showStepInfo: true,
  showValidationSummary: true,
  showSummary: true,
  allowIncompleteSteps: false,
  persistData: true,
  storageKey: 'multi-step-form',
  previousButtonText: 'Previous',
  nextButtonText: 'Next',
  submitButtonText: 'Submit',
  transitionText: 'Loading...',
  autoAdvance: false
})

const emit = defineEmits<{
  stepChange: [step: number, direction: 'forward' | 'backward']
  stepComplete: [step: number, data: any]
  formSubmit: [data: any]
  formReset: []
}>()

// Form state
const currentStep = ref(0)
const formData = ref<Record<string, any>>(props.initialData || {})
const completedSteps = ref<Set<number>>(new Set())
const isTransitioning = ref(false)
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

// Form object for component usage
const form = computed(() => ({
  isSubmitting: isSubmitting.value,
  errors: errors.value
}))

// Computed properties
const stepConfigs = computed(() => {
  return props.steps.filter(step => {
    if (!step.condition) return true
    return step.condition(formData.value)
  })
})

const totalSteps = computed(() => stepConfigs.value.length)
const isFirstStep = computed(() => currentStep.value === 0)
const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)

const currentStepConfig = computed(() => stepConfigs.value[currentStep.value] || {})
const currentStepSchema = computed(() => currentStepConfig.value.schema)

// Step validation tracking
const isCurrentStepValid = computed(() => {
  const stepData = getStepValues(currentStep.value)
  if (!currentStepSchema.value || !stepData) return false
  
  try {
    currentStepSchema.value.parse(stepData)
    return true
  } catch {
    return false
  }
})

// Step data management
const getStepValues = (stepIndex: number) => {
  const stepConfig = stepConfigs.value[stepIndex]
  if (!stepConfig) return {}
  return formData.value[stepConfig.id] || {}
}

const setStepValues = (stepIndex: number, values: any) => {
  const stepConfig = stepConfigs.value[stepIndex]
  if (!stepConfig) return
  
  formData.value[stepConfig.id] = values
  
  // Persist data if enabled
  if (props.persistData) {
    persistFormData()
  }
}

// Form persistence
const persistFormData = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(props.storageKey, JSON.stringify(formData.value))
    } catch (error) {
      console.warn('Failed to persist form data:', error)
    }
  }
}

const loadPersistedData = () => {
  if (typeof window !== 'undefined' && props.persistData) {
    try {
      const saved = localStorage.getItem(props.storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        formData.value = { ...formData.value, ...data }
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error)
    }
  }
}

// Step navigation
const goToStep = async (stepIndex: number) => {
  if (stepIndex < 0 || stepIndex >= totalSteps.value) return
  
  const direction = stepIndex > currentStep.value ? 'forward' : 'backward'
  
  // Check if we can navigate to this step
  if (!props.allowIncompleteSteps && direction === 'forward') {
    // Validate all previous steps
    for (let i = currentStep.value; i < stepIndex; i++) {
      if (!completedSteps.value.has(i)) {
        console.warn(`Cannot skip to step ${stepIndex}: step ${i} is not completed`)
        return
      }
    }
  }
  
  isTransitioning.value = true
  
  await nextTick()
  
  currentStep.value = stepIndex
  emit('stepChange', stepIndex, direction)
  
  setTimeout(() => {
    isTransitioning.value = false
  }, 300)
}

const nextStep = () => {
  if (!isLastStep.value) {
    goToStep(currentStep.value + 1)
  }
}

const previousStep = () => {
  if (!isFirstStep.value) {
    goToStep(currentStep.value - 1)
  }
}

// Step submission handling
const handleStepSubmit = async (values: any) => {
  setStepValues(currentStep.value, values)
  completedSteps.value.add(currentStep.value)
  
  emit('stepComplete', currentStep.value, values)
  
  if (isLastStep.value) {
    // Final form submission
    emit('formSubmit', formData.value)
    
    // Clear persisted data on successful submission
    if (props.persistData) {
      localStorage.removeItem(props.storageKey)
    }
  } else if (props.autoAdvance) {
    // Auto-advance to next step
    await nextTick()
    nextStep()
  }
}

const handleStepUpdate = (data: any) => {
  setStepValues(currentStep.value, data)
}

// Step click handling (from progress indicator)
const handleStepClick = (stepIndex: number) => {
  goToStep(stepIndex)
}

// Initialize form
onMounted(() => {
  loadPersistedData()
})

// Watch for step configuration changes
watch(
  () => props.steps,
  () => {
    // Reset if step configuration changes significantly
    if (currentStep.value >= totalSteps.value) {
      currentStep.value = 0
    }
  }
)

// Public API
const reset = () => {
  currentStep.value = 0
  formData.value = props.initialData || {}
  completedSteps.value.clear()
  
  if (props.persistData) {
    localStorage.removeItem(props.storageKey)
  }
  
  emit('formReset')
}

const getAllFormData = () => formData.value

// Expose methods
defineExpose({
  currentStep: readonly(currentStep),
  totalSteps: readonly(totalSteps),
  isFirstStep: readonly(isFirstStep),
  isLastStep: readonly(isLastStep),
  formData: readonly(formData),
  completedSteps: readonly(completedSteps),
  goToStep,
  nextStep,
  previousStep,
  reset,
  getAllFormData
})
</script>