<!--
  Create Matter Form Component
  
  Specialized form for creating new legal matters with comprehensive validation,
  client selection, lawyer assignment, and all required matter fields.
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// Form Components
import MatterForm from './MatterForm.vue'
import { FormInput, FormTextarea, FormSelect, FormDatePicker } from '~/components/forms'
import { FormFieldWrapper } from '~/components/forms'

// Field Components
import MatterTypeField from './fields/MatterTypeField.vue'
import MatterStatusField from './fields/MatterStatusField.vue'
import ClientSelectionField from './fields/ClientSelectionField.vue'
import LawyerAssignmentField from './fields/LawyerAssignmentField.vue'
import MatterDateFields from './fields/MatterDateFields.vue'

// Schemas and Types
import { createMatterSchema } from '~/schemas/matter'
import type { CreateMatterForm } from '~/schemas/matter'

// Composables
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'

interface Props {
  /** Initial values for the form */
  initialValues?: Partial<CreateMatterForm>
  /** Show form header */
  showHeader?: boolean
  /** Custom form class */
  formClass?: string
  /** Redirect path after successful creation */
  redirectTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  formClass: '',
  redirectTo: '/matters'
})

// Emits
const emit = defineEmits<{
  /** Fired when matter is successfully created */
  created: [matter: any]
  /** Fired when form is cancelled */
  cancelled: []
}>()

// Composables
const router = useRouter()
const { hasPermission } = useAuth()
const { showToast } = useToast()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const matterFormRef = ref<InstanceType<typeof MatterForm>>()

// Default initial values
const defaultValues: Partial<CreateMatterForm> = {
  priority: 'MEDIUM',
  status: 'INVESTIGATION',
  openDate: new Date().toISOString().split('T')[0],
  tags: [],
  customFields: {},
  ...props.initialValues
}

// Computed properties
const canCreateMatter = computed(() => hasPermission('MATTER_CREATE'))

// Form submission handler
const handleSubmit = async (formData: CreateMatterForm) => {
  if (!canCreateMatter.value) {
    showToast('You do not have permission to create matters', 'error')
    return
  }

  loading.value = true

  try {
    // Clear previous errors
    error.value = null
    
    // Validate required fields
    if (!formData.title?.trim()) {
      throw new Error('Matter title is required')
    }
    if (!formData.clientId) {
      throw new Error('Client selection is required')
    }
    if (!formData.assignedLawyerIds?.length) {
      throw new Error('At least one lawyer must be assigned')
    }

    // Transform form data for API
    const apiData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      assignedLawyerIds: formData.assignedLawyerIds || [],
      openDate: formData.openDate ? new Date(formData.openDate).toISOString() : new Date().toISOString(),
      closeDate: formData.closeDate ? new Date(formData.closeDate).toISOString() : null,
      status: formData.status || 'INVESTIGATION',
      type: formData.type,
      priority: formData.priority || 'MEDIUM',
      estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : null,
      billableHours: formData.billableHours ? Number(formData.billableHours) : null,
      tags: formData.tags || []
    }

    // Validate date logic
    if (apiData.closeDate && apiData.openDate) {
      const openDate = new Date(apiData.openDate)
      const closeDate = new Date(apiData.closeDate)
      if (closeDate <= openDate) {
        throw new Error('Close date must be after open date')
      }
    }

    // Submit to API with timeout and proper error handling
    const response = await $fetch<any>('/api/v1/matters', {
      method: 'POST',
      body: apiData,
      timeout: 15000, // 15 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response || !response.id) {
      throw new Error('Invalid response from server')
    }

    showToast('Matter created successfully', 'success')
    showSuccess.value = true
    emit('created', response)

    // Brief delay to show success state before redirecting
    setTimeout(async () => {
      const redirectPath = props.redirectTo === '/matters' 
        ? `/matters/${response.id}` 
        : props.redirectTo
      
      await router.push(redirectPath)
    }, 1500)
    
  } catch (error: any) {
    console.error('Failed to create matter:', error)
    
    // Handle different error types with user-friendly messages
    let errorMessage = 'Failed to create matter. Please try again.'
    
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please check your connection and try again.'
    } else if (error.status === 400) {
      if (error.data?.validationErrors) {
        // Handle field-specific validation errors
        const errorMessages = Object.values(error.data.validationErrors).flat()
        errorMessage = `Validation errors: ${errorMessages.join(', ')}`
      } else {
        errorMessage = error.data?.message || 'Invalid form data. Please check your inputs.'
      }
    } else if (error.status === 401) {
      errorMessage = 'You are not authorized to create matters. Please log in again.'
      await router.push('/login')
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to create matters.'
    } else if (error.status === 409) {
      errorMessage = 'A matter with this information already exists.'
    } else if (error.status === 422) {
      errorMessage = 'The submitted data could not be processed. Please check your inputs.'
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later or contact support.'
    } else {
      errorMessage = error.message || 'Failed to create matter. Please try again.'
    }
    
    error.value = errorMessage
    showToast(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

// Form cancellation handler
const handleCancel = () => {
  emit('cancelled')
  router.push('/matters')
}

// Permission check
if (!canCreateMatter.value) {
  showToast('You do not have permission to create matters', 'error')
  router.push('/matters')
}
</script>

<template>
  <div class="create-matter-form" :data-loading="loading" :data-success="showSuccess">
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">Creating matter...</p>
      </div>
    </div>
    
    <!-- Success Overlay -->
    <div v-if="showSuccess" class="success-overlay">
      <div class="success-content">
        <div class="success-icon">✓</div>
        <p class="success-text">Matter created successfully!</p>
        <p class="success-subtext">Redirecting to matter details...</p>
      </div>
    </div>
    
    <!-- Error Alert -->
    <div v-if="error" class="error-alert" role="alert">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-text">
          <h4>Error Creating Matter</h4>
          <p>{{ error }}</p>
        </div>
        <button
          type="button"
          @click="error = null"
          class="error-dismiss"
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>

    <MatterForm
      ref="matterFormRef"
      mode="create"
      :schema="createMatterSchema"
      :initial-values="defaultValues"
      :loading="loading"
      :show-header="showHeader"
      :form-class="formClass"
      title="Create New Matter"
      description="Fill in the details below to create a new legal matter. All required fields must be completed."
      @submit="handleSubmit"
      @cancel="handleCancel"
    >
      <template #fields="{ values, errors, meta }">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column -->
          <div class="space-y-6">
            <!-- Basic Information -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium border-b pb-2">Basic Information</h3>
              
              <FormFieldWrapper
                name="matter-title"
                label="Matter Title"
                description="A clear, descriptive title for this legal matter"
                required
              >
                <FormInput
                  name="title"
                  placeholder="Enter matter title..."
                  :error="errors.title"
                />
              </FormFieldWrapper>

              <FormFieldWrapper
                name="description"
                label="Description"
                description="Detailed description of the matter"
              >
                <FormTextarea
                  name="description"
                  placeholder="Enter matter description..."
                  :rows="4"
                  :error="errors.description"
                />
              </FormFieldWrapper>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MatterTypeField :error="errors.type" />
                <MatterStatusField :error="errors.status" />
              </div>

              <FormFieldWrapper
                name="priority"
                label="Priority"
                description="Priority level for this matter"
                required
              >
                <FormSelect
                  name="priority"
                  :error="errors.priority"
                  :options="[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'URGENT', label: 'Urgent' }
                  ]"
                />
              </FormFieldWrapper>
            </div>

            <!-- Financial Information -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium border-b pb-2">Financial Information</h3>
              
              <FormFieldWrapper
                name="estimated-value"
                label="Estimated Value"
                description="Estimated monetary value of the matter"
              >
                <FormInput
                  name="estimatedValue"
                  type="number"
                  placeholder="0.00"
                  :error="errors.estimatedValue"
                />
              </FormFieldWrapper>

              <FormFieldWrapper
                name="billable-hours"
                label="Estimated Billable Hours"
                description="Estimated total billable hours for this matter"
              >
                <FormInput
                  name="billableHours"
                  type="number"
                  placeholder="0"
                  :error="errors.billableHours"
                />
              </FormFieldWrapper>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Client Information -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium border-b pb-2">Client & Assignment</h3>
              
              <ClientSelectionField :error="errors.clientId" />
              <LawyerAssignmentField :error="errors.assignedLawyerIds" />
            </div>

            <!-- Dates -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium border-b pb-2">Important Dates</h3>
              <MatterDateFields 
                :open-date-error="errors.openDate"
                :close-date-error="errors.closeDate"
              />
            </div>

            <!-- Additional Information -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium border-b pb-2">Additional Information</h3>
              
              <FormFieldWrapper
                name="tags"
                label="Tags"
                description="Add tags to help categorize and search for this matter"
              >
                <FormInput
                  name="tags"
                  placeholder="Enter tags separated by commas..."
                  :error="errors.tags"
                />
              </FormFieldWrapper>
            </div>
          </div>
        </div>
      </template>

      <template #additional="{ values, isValid, isDirty }">
        <!-- Form Summary Card -->
        <div v-if="isDirty" class="mt-6">
          <Card>
            <CardHeader>
              <CardTitle class="text-sm">Form Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-muted-foreground">Status:</span>
                  <span class="ml-2 font-medium">{{ values.status || 'Not set' }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Type:</span>
                  <span class="ml-2 font-medium">{{ values.type || 'Not set' }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Priority:</span>
                  <span class="ml-2 font-medium">{{ values.priority || 'Not set' }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Valid:</span>
                  <span class="ml-2" :class="isValid ? 'text-green-600' : 'text-red-600'">
                    {{ isValid ? 'Yes' : 'No' }}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </template>
    </MatterForm>
  </div>
</template>

<style scoped>
.create-matter-form {
  @apply w-full relative;
}

/* Loading Overlay */
.loading-overlay {
  @apply absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg;
}

.loading-content {
  @apply text-center;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4;
  animation: spin 1s linear infinite;
}

.loading-text {
  @apply text-sm text-muted-foreground font-medium;
}

/* Success Overlay */
.success-overlay {
  @apply absolute inset-0 bg-green-50/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg;
}

.success-content {
  @apply text-center;
}

.success-icon {
  @apply w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4;
}

.success-text {
  @apply text-lg font-semibold text-green-700 mb-2;
}

.success-subtext {
  @apply text-sm text-green-600;
}

/* Error Alert */
.error-alert {
  @apply mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4;
}

.error-content {
  @apply flex items-start gap-3;
}

.error-icon {
  @apply text-xl;
}

.error-text {
  @apply flex-1;
}

.error-text h4 {
  @apply font-semibold text-destructive mb-1;
}

.error-text p {
  @apply text-sm text-destructive/80;
}

.error-dismiss {
  @apply w-6 h-6 text-destructive/60 hover:text-destructive text-lg leading-none flex items-center justify-center rounded transition-colors;
}

/* Loading state for form */
.create-matter-form[data-loading="true"] {
  @apply pointer-events-none;
}

.create-matter-form[data-loading="true"] > :not(.loading-overlay) {
  @apply opacity-50;
}

/* Success state for form */
.create-matter-form[data-success="true"] {
  @apply pointer-events-none;
}

.create-matter-form[data-success="true"] > :not(.success-overlay) {
  @apply opacity-30;
}

/* Mobile responsive adjustments */
@media (max-width: 1024px) {
  .grid-cols-1.lg\\:grid-cols-2 {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-2 {
    @apply grid-cols-1;
  }
  
  .grid-cols-2.md\\:grid-cols-4 {
    @apply grid-cols-1;
  }
  
  .loading-content,
  .success-content {
    @apply px-4;
  }
  
  .error-alert {
    @apply mx-2;
  }
}

/* Form section styling */
h3 {
  @apply text-foreground;
}

.space-y-4 > h3 {
  @apply mb-4;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Focus management during loading/success states */
.create-matter-form[data-loading="true"] *,
.create-matter-form[data-success="true"] * {
  @apply focus:outline-none;
}

/* High contrast support */
@media (prefers-contrast: high) {
  .loading-overlay,
  .success-overlay {
    @apply bg-background/95;
  }
  
  .error-alert {
    @apply border-2;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .loading-overlay,
  .success-overlay {
    @apply transition-none;
  }
}
</style>