<!--
  Matter Form Steps Component
  
  Multi-step form workflow for creating and editing legal matters.
  Provides guided creation process with auto-save and validation.
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

// Components
import MultiStepForm from '~/components/forms/MultiStepForm.vue'
import BasicInfoStep from './steps/BasicInfoStep.vue'
import ClientDetailsStep from './steps/ClientDetailsStep.vue'
import AssignmentStep from './steps/AssignmentStep.vue'
import ReviewStep from './steps/ReviewStep.vue'

// Schemas and Types
import { createMatterSchema, updateMatterSchema } from '~/schemas/matter'
import type { CreateMatterForm, UpdateMatterForm } from '~/schemas/matter'

// Composables
import { useForm } from '~/composables/form/useForm'
import { useAutoSave } from '~/composables/form/useAutoSave'
import { useFormNavigationGuard } from '~/composables/form/useFormNavigationGuard'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'

interface Props {
  /** Mode - create or edit */
  mode?: 'create' | 'edit'
  /** Initial values for editing */
  initialValues?: Partial<CreateMatterForm | UpdateMatterForm>
  /** Matter ID for editing */
  matterId?: string
  /** Show step progress indicator */
  showProgress?: boolean
  /** Allow navigation to incomplete steps */
  allowIncompleteSteps?: boolean
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number
  /** Custom redirect path after completion */
  redirectTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  showProgress: true,
  allowIncompleteSteps: false,
  autoSaveInterval: 5000, // 5 seconds as per requirement
  redirectTo: '/matters'
})

// Emits
const emit = defineEmits<{
  /** Fired when matter is successfully created/updated */
  completed: [matter: any]
  /** Fired when form is cancelled */
  cancelled: []
  /** Fired when step changes */
  stepChange: [step: number]
}>()

// Composables
const router = useRouter()
const { hasPermission } = useAuth()
const { showToast } = useToast()

// Form setup
const schema = computed(() => props.mode === 'create' ? createMatterSchema : updateMatterSchema)
const form = useForm(schema.value, {
  initialValues: props.initialValues,
  onError: (errors) => {
    showToast('Please fix form errors before continuing', 'error')
  }
})

// Auto-save setup
const autoSave = useAutoSave(form, {
  key: `matter_form_${props.mode}_${props.matterId || 'new'}`,
  debounce: props.autoSaveInterval,
  storage: 'localStorage',
  onSaveSuccess: () => {
    console.log('Form auto-saved successfully')
  },
  onSaveError: (error) => {
    console.error('Auto-save failed:', error)
    showToast('Failed to auto-save form data', 'error')
  }
})

// Navigation guard setup
const navigationGuard = useFormNavigationGuard(form, {
  message: 'You have unsaved changes to this matter. Are you sure you want to leave?',
  onNavigationAttempt: () => {
    // Show toast notification when user tries to navigate away
    if (form.isDirty.value) {
      showToast('You have unsaved changes', 'warning')
    }
    return true // Allow confirmation dialog
  }
})

// Step configuration
const stepConfigs = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter the basic details for this matter',
    component: BasicInfoStep,
    schema: schema.value,
    icon: 'FileText',
    fields: ['title', 'description', 'type', 'status', 'priority']
  },
  {
    id: 'client-details',
    title: 'Client Details',
    description: 'Select and configure client information',
    component: ClientDetailsStep,
    schema: schema.value,
    icon: 'Users',
    fields: ['clientId', 'openDate', 'closeDate']
  },
  {
    id: 'assignment',
    title: 'Team Assignment',
    description: 'Assign lawyers and staff to this matter',
    component: AssignmentStep,
    schema: schema.value,
    icon: 'UserPlus',
    fields: ['assignedLawyerIds']
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review all information and submit the matter',
    component: ReviewStep,
    schema: schema.value,
    icon: 'Check',
    fields: []
  }
]

// State
const currentStep = ref(0)
const isSubmitting = ref(false)
const completedSteps = ref<number[]>([])

// Computed properties
const totalSteps = computed(() => stepConfigs.length)
const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)
const canCreateMatter = computed(() => hasPermission('MATTER_CREATE'))
const canEditMatter = computed(() => hasPermission('MATTER_UPDATE'))

const canProceed = computed(() => {
  if (props.mode === 'create') return canCreateMatter.value
  return canEditMatter.value
})

// Navigation methods
const nextStep = () => {
  if (currentStep.value < totalSteps.value - 1) {
    if (!completedSteps.value.includes(currentStep.value)) {
      completedSteps.value.push(currentStep.value)
    }
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

const goToStep = (step: number) => {
  if (step >= 0 && step < totalSteps.value) {
    if (props.allowIncompleteSteps || step <= Math.max(...completedSteps.value, currentStep.value)) {
      currentStep.value = step
      emit('stepChange', currentStep.value)
    }
  }
}

// Step data management
const stepData = ref<Record<string, any>>({})

const getStepData = (step: number) => {
  const stepId = stepConfigs[step]?.id
  return stepId ? stepData.value[stepId] || {} : {}
}

const updateStepData = (step: number, data: any) => {
  const stepId = stepConfigs[step]?.id
  if (stepId) {
    stepData.value[stepId] = { ...stepData.value[stepId], ...data }
    
    // Update form values
    form.setValues({ ...form.values.value, ...data })
  }
}

// Form submission handlers
const handleStepSubmit = async (stepFormData: any) => {
  // Update current step data
  updateStepData(currentStep.value, stepFormData)
  
  if (isLastStep.value) {
    // Final submission
    await handleFinalSubmit()
  } else {
    // Move to next step
    nextStep()
  }
}

const handleFinalSubmit = async () => {
  if (!canProceed.value) {
    showToast('You do not have permission to perform this action', 'error')
    return
  }

  isSubmitting.value = true
  
  try {
    // Validate complete form
    const result = await form.submit(async (formData) => {
      // Transform and submit data
      const apiData = transformFormData(formData)
      
      if (props.mode === 'create') {
        const response = await $fetch<any>('/api/v1/matters', {
          method: 'POST',
          body: apiData
        })
        
        showToast('Matter created successfully', 'success')
        emit('completed', response)
        
        // Clear auto-save data on success
        await autoSave.clear()
        
        // Navigate to matter detail
        setTimeout(() => {
          if (response?.id) {
            router.push(`/matters/${response.id}`)
          }
        }, 1500)
        
      } else if (props.matterId) {
        const response = await $fetch<any>(`/api/v1/matters/${props.matterId}`, {
          method: 'PUT',
          body: apiData
        })
        
        showToast('Matter updated successfully', 'success')
        emit('completed', response)
        
        // Clear auto-save data on success
        await autoSave.clear()
        
        // Navigate to matter detail
        setTimeout(() => {
          if (response?.id) {
            router.push(`/matters/${response.id}`)
          }
        }, 1500)
      }
    })
    
    if (!result?.success) {
      // Handle validation errors
      showToast('Please fix all form errors before submitting', 'error')
    }
    
  } catch (error: any) {
    console.error('Failed to submit matter:', error)
    
    let errorMessage = 'Failed to save matter. Please try again.'
    
    if (error.status === 400) {
      errorMessage = 'Invalid form data. Please check your inputs.'
    } else if (error.status === 401) {
      errorMessage = 'You are not authorized. Please log in again.'
      router.push('/login')
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.'
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.'
    }
    
    showToast(errorMessage, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const transformFormData = (formData: any) => {
  return {
    ...formData,
    title: formData.title?.trim(),
    description: formData.description?.trim() || '',
    assignedLawyerIds: formData.assignedLawyerIds || [],
    openDate: formData.openDate ? new Date(formData.openDate).toISOString() : new Date().toISOString(),
    closeDate: formData.closeDate ? new Date(formData.closeDate).toISOString() : null,
    tags: formData.tags || [],
    estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : null,
    billableHours: formData.billableHours ? Number(formData.billableHours) : null
  }
}

// Cancel handler
const handleCancel = () => {
  if (form.isDirty.value) {
    if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      emit('cancelled')
      router.push('/matters')
    }
  } else {
    emit('cancelled')
    router.push('/matters')
  }
}

// Load saved data on mount
const loadSavedData = async () => {
  if (autoSave.hasSavedData.value) {
    const shouldRestore = confirm('Found previously saved form data. Would you like to restore it?')
    if (shouldRestore) {
      const restored = await autoSave.restore()
      if (restored) {
        showToast('Form data restored successfully', 'success')
      }
    } else {
      await autoSave.clear()
    }
  }
}


// Watchers
watch(() => form.values.value, (newValues) => {
  // Update step data when form values change
  const stepId = stepConfigs[currentStep.value]?.id
  if (stepId) {
    stepData.value[stepId] = { ...stepData.value[stepId], ...newValues }
  }
}, { deep: true })

// Initialize
onMounted(async () => {
  if (!canProceed.value) {
    showToast('You do not have permission to access this form', 'error')
    router.push('/matters')
    return
  }
  
  // Enable auto-save
  autoSave.enable()
  
  // Enable navigation guard
  navigationGuard.enable()
  
  // Load saved data if available
  await loadSavedData()
})

// Cleanup on unmount
onUnmounted(() => {
  autoSave.disable()
  navigationGuard.disable()
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Form Header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold tracking-tight">
        {{ mode === 'create' ? 'Create New Matter' : 'Edit Matter' }}
      </h1>
      <p class="text-muted-foreground mt-2">
        {{ mode === 'create' 
          ? 'Follow the steps below to create a new legal matter' 
          : 'Update the matter information using the guided workflow' 
        }}
      </p>
    </div>

    <!-- Auto-save Status -->
    <div v-if="autoSave.isEnabled.value" class="mb-4">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <div 
          class="h-2 w-2 rounded-full"
          :class="{
            'bg-green-500': autoSave.lastSave.value && !autoSave.isSaving.value,
            'bg-yellow-500': autoSave.isSaving.value,
            'bg-red-500': autoSave.lastError.value,
            'bg-gray-400': !autoSave.lastSave.value
          }"
        ></div>
        <span v-if="autoSave.isSaving.value">Saving...</span>
        <span v-else-if="autoSave.lastSave.value">
          Last saved: {{ autoSave.lastSave.value.toLocaleTimeString() }}
        </span>
        <span v-else-if="autoSave.lastError.value">Save failed</span>
        <span v-else>Auto-save enabled</span>
      </div>
    </div>

    <!-- Multi-step Form -->
    <MultiStepForm
      :steps="stepConfigs"
      :current-step="currentStep"
      :completed-steps="completedSteps"
      :show-progress-indicator="showProgress"
      :allow-incomplete-steps="allowIncompleteSteps"
      :is-submitting="isSubmitting"
      @step-click="goToStep"
      @next="nextStep"
      @previous="previousStep"
      @submit="handleStepSubmit"
      @cancel="handleCancel"
    >
      <!-- Step slots will be handled by the step components -->
      <template #step-0="{ form: stepForm }">
        <BasicInfoStep 
          :form="stepForm"
          :step-data="getStepData(0)"
          @update="(data) => updateStepData(0, data)"
        />
      </template>
      
      <template #step-1="{ form: stepForm }">
        <ClientDetailsStep 
          :form="stepForm"
          :step-data="getStepData(1)"
          @update="(data) => updateStepData(1, data)"
        />
      </template>
      
      <template #step-2="{ form: stepForm }">
        <AssignmentStep 
          :form="stepForm"
          :step-data="getStepData(2)"
          @update="(data) => updateStepData(2, data)"
        />
      </template>
      
      <template #step-3="{ form: stepForm }">
        <ReviewStep 
          :form="stepForm"
          :step-data="getStepData(3)"
          :form-data="form.values.value"
          :mode="mode"
          @update="(data) => updateStepData(3, data)"
        />
      </template>
    </MultiStepForm>
  </div>
</template>

<style scoped>
/* Form container styling */
.max-w-4xl {
  min-height: calc(100vh - 4rem);
}

/* Auto-save indicator animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.bg-yellow-500 {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .max-w-4xl {
    @apply px-4;
  }
  
  .text-3xl {
    @apply text-2xl;
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  .bg-green-500 {
    @apply bg-green-700;
  }
  
  .bg-yellow-500 {
    @apply bg-yellow-700;
  }
  
  .bg-red-500 {
    @apply bg-red-700;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .bg-yellow-500 {
    animation: none;
  }
}
</style>