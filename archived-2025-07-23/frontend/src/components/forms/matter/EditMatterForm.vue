<!--
  Edit Matter Form Component
  
  Specialized form for editing existing legal matters with partial update support,
  pre-populated fields, and optimistic updates.
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

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

// UI Components
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

// Schemas and Types
import { updateMatterSchema } from '~/schemas/matter'
import type { UpdateMatterForm } from '~/schemas/matter'

// Composables
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'

interface Props {
  /** Matter ID to edit */
  matterId?: string
  /** Pre-loaded matter data */
  matterData?: any
  /** Show form header */
  showHeader?: boolean
  /** Custom form class */
  formClass?: string
  /** Enable auto-save */
  autoSave?: boolean
  /** Auto-save delay in milliseconds */
  autoSaveDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  formClass: '',
  autoSave: false,
  autoSaveDelay: 3000
})

// Emits
const emit = defineEmits<{
  /** Fired when matter is successfully updated */
  updated: [matter: any]
  /** Fired when form is cancelled */
  cancelled: []
  /** Fired during auto-save */
  autoSaved: [matter: any]
}>()

// Composables
const router = useRouter()
const route = useRoute()
const { hasPermission } = useAuth()
const { showToast } = useToast()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const saveSuccess = ref(false)
const matterFormRef = ref<InstanceType<typeof MatterForm>>()
const originalMatter = ref<any>(null)
const currentMatter = ref<any>(null)
const autoSaveTimer = ref<NodeJS.Timeout>()
const lastSaved = ref<Date>()
const hasUnsavedChanges = ref(false)

// Get matter ID from props or route
const matterId = computed(() => props.matterId || route.params.id as string)

// Computed properties
const canEditMatter = computed(() => hasPermission('MATTER_UPDATE'))
const isLoading = computed(() => loading.value)

const matterTitle = computed(() => {
  return currentMatter.value?.title || 'Loading...'
})

const matterNumber = computed(() => {
  return currentMatter.value?.matterNumber || ''
})

const autoSaveStatus = computed(() => {
  if (!props.autoSave) return null
  if (loading.value) return 'saving'
  if (!hasUnsavedChanges.value) return 'saved'
  return 'pending'
})

// Load matter data
const loadMatter = async () => {
  if (props.matterData) {
    originalMatter.value = props.matterData
    currentMatter.value = { ...props.matterData }
    return
  }

  loading.value = true
  try {
    const matter = await $fetch<any>(`/api/v1/matters/${matterId.value}`)
    originalMatter.value = matter
    currentMatter.value = { ...matter }
  } catch (error: any) {
    console.error('Failed to load matter:', error)
    showToast('Failed to load matter data', 'error')
    router.push('/matters')
  } finally {
    loading.value = false
  }
}

// Form submission handler
const handleSubmit = async (formData: UpdateMatterForm) => {
  if (!canEditMatter.value) {
    showToast('You do not have permission to edit this matter', 'error')
    return
  }

  loading.value = true
  error.value = null
  saveSuccess.value = false

  try {
    // Validate required fields that can't be empty
    if (formData.title && !formData.title.trim()) {
      throw new Error('Matter title cannot be empty')
    }

    // Transform form data for API
    const updateData = {
      ...formData,
      id: matterId.value,
      title: formData.title?.trim(),
      description: formData.description?.trim() || '',
      assignedLawyerIds: formData.assignedLawyerIds || [],
      openDate: formData.openDate ? new Date(formData.openDate).toISOString() : null,
      closeDate: formData.closeDate ? new Date(formData.closeDate).toISOString() : null,
      estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : null,
      billableHours: formData.billableHours ? Number(formData.billableHours) : null,
      tags: formData.tags || []
    }

    // Validate date logic
    if (updateData.closeDate && updateData.openDate) {
      const openDate = new Date(updateData.openDate)
      const closeDate = new Date(updateData.closeDate)
      if (closeDate <= openDate) {
        throw new Error('Close date must be after open date')
      }
    }

    // Submit to API with enhanced error handling
    const response = await $fetch<any>(`/api/v1/matters/${matterId.value}`, {
      method: 'PUT',
      body: updateData,
      timeout: 15000, // 15 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response || !response.id) {
      throw new Error('Invalid response from server')
    }

    showToast('Matter updated successfully', 'success')
    saveSuccess.value = true
    emit('updated', response)

    // Update local state
    originalMatter.value = response
    currentMatter.value = { ...response }
    hasUnsavedChanges.value = false
    lastSaved.value = new Date()

    // Reset success state after a brief moment
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
    
  } catch (err: any) {
    console.error('Failed to update matter:', err)
    
    // Handle different error types with user-friendly messages
    let errorMessage = 'Failed to update matter. Please try again.'
    
    if (err.name === 'AbortError' || err.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please check your connection and try again.'
    } else if (err.status === 400) {
      if (err.data?.validationErrors) {
        // Handle field-specific validation errors
        const errorMessages = Object.values(err.data.validationErrors).flat()
        errorMessage = `Validation errors: ${errorMessages.join(', ')}`
      } else {
        errorMessage = err.data?.message || 'Invalid form data. Please check your inputs.'
      }
    } else if (err.status === 401) {
      errorMessage = 'You are not authorized to update this matter. Please log in again.'
      await router.push('/login')
    } else if (err.status === 403) {
      errorMessage = 'You do not have permission to update this matter.'
    } else if (err.status === 404) {
      errorMessage = 'Matter not found. It may have been deleted.'
      await router.push('/matters')
    } else if (err.status === 409) {
      errorMessage = 'This matter has been modified by another user. Please refresh and try again.'
    } else if (err.status === 422) {
      errorMessage = 'The submitted data could not be processed. Please check your inputs.'
    } else if (err.status >= 500) {
      errorMessage = 'Server error. Please try again later or contact support.'
    } else {
      errorMessage = err.message || 'Failed to update matter. Please try again.'
    }
    
    error.value = errorMessage
    showToast(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

// Auto-save handler
const handleAutoSave = async (formData: UpdateMatterForm) => {
  if (!props.autoSave || !hasUnsavedChanges.value) return

  try {
    const updateData = {
      ...formData,
      id: matterId.value
    }

    const response = await $fetch<any>(`/api/v1/matters/${matterId.value}`, {
      method: 'PATCH',
      body: updateData
    })

    emit('autoSaved', response)
    hasUnsavedChanges.value = false
    lastSaved.value = new Date()
    
  } catch (error: any) {
    console.error('Auto-save failed:', error)
    // Don't show error toast for auto-save failures
  }
}

// Form cancellation handler
const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      emit('cancelled')
      router.push(`/matters/${matterId.value}`)
    }
  } else {
    emit('cancelled')
    router.push(`/matters/${matterId.value}`)
  }
}

// Watch for form changes for auto-save
const handleValidationChange = (isValid: boolean) => {
  if (props.autoSave && isValid && hasUnsavedChanges.value) {
    // Clear existing timer
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value)
    }
    
    // Set new timer
    autoSaveTimer.value = setTimeout(() => {
      if (matterFormRef.value) {
        handleAutoSave(matterFormRef.value.values)
      }
    }, props.autoSaveDelay)
  }
}

// Permission check
if (!canEditMatter.value) {
  showToast('You do not have permission to edit matters', 'error')
  router.push('/matters')
}

// Load matter on mount
onMounted(() => {
  loadMatter()
})

// Cleanup auto-save timer
onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
})
</script>

<template>
  <div class="edit-matter-form">
    <!-- Error Alert -->
    <div v-if="error" class="error-alert mb-6" role="alert">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-text">
          <h4>Error Updating Matter</h4>
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

    <!-- Success Alert -->
    <div v-if="saveSuccess" class="success-alert mb-6" role="alert">
      <div class="success-content">
        <div class="success-icon">✓</div>
        <div class="success-text">
          <h4>Matter Updated Successfully</h4>
          <p>Your changes have been saved to the database.</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !currentMatter" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Loading matter data...</p>
      </div>
    </div>

    <!-- Form -->
    <MatterForm
      v-else-if="currentMatter"
      ref="matterFormRef"
      mode="edit"
      :schema="updateMatterSchema"
      :initial-values="currentMatter"
      :loading="loading"
      :show-header="showHeader"
      :form-class="formClass"
      :title="`Edit Matter: ${matterTitle}`"
      description="Update the matter information below. Changes will be saved to the database."
      @submit="handleSubmit"
      @cancel="handleCancel"
      @validation-change="handleValidationChange"
    >
      <template #fields="{ values, errors, meta }">
        <!-- Auto-save Status -->
        <div v-if="autoSave" class="mb-4">
          <Alert>
            <AlertDescription class="flex items-center justify-between">
              <span>Auto-save is enabled</span>
              <div class="flex items-center gap-2">
                <Badge 
                  :variant="autoSaveStatus === 'saved' ? 'secondary' : autoSaveStatus === 'saving' ? 'secondary' : 'outline'"
                  class="text-xs"
                >
                  <div v-if="autoSaveStatus === 'saving'" class="animate-spin rounded-full h-3 w-3 border-b border-current mr-1"></div>
                  {{ autoSaveStatus === 'saved' ? 'Saved' : autoSaveStatus === 'saving' ? 'Saving...' : 'Pending' }}
                </Badge>
                <span v-if="lastSaved" class="text-xs text-muted-foreground">
                  Last saved: {{ lastSaved.toLocaleTimeString() }}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <!-- Matter Header Info -->
        <Card class="mb-6">
          <CardHeader>
            <CardTitle class="text-sm">Matter Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Matter Number:</span>
                <span class="ml-2 font-mono">{{ matterNumber }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Current Status:</span>
                <span class="ml-2 font-medium">{{ originalMatter?.status }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Created:</span>
                <span class="ml-2">{{ new Date(originalMatter?.createdAt).toLocaleDateString() }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Last Modified:</span>
                <span class="ml-2">{{ new Date(originalMatter?.updatedAt).toLocaleDateString() }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
        <!-- Change Summary -->
        <div v-if="isDirty" class="mt-6">
          <Card>
            <CardHeader>
              <CardTitle class="text-sm">Pending Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-sm text-muted-foreground">
                You have unsaved changes. Click "Update Matter" to save your changes.
              </div>
            </CardContent>
          </Card>
        </div>
      </template>
    </MatterForm>
  </div>
</template>

<style scoped>
.edit-matter-form {
  @apply w-full;
}

/* Error Alert */
.error-alert {
  @apply bg-destructive/10 border border-destructive/20 rounded-lg p-4;
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

/* Success Alert */
.success-alert {
  @apply bg-green-50 border border-green-200 rounded-lg p-4;
}

.success-content {
  @apply flex items-start gap-3;
}

.success-icon {
  @apply text-xl text-green-600;
}

.success-text {
  @apply flex-1;
}

.success-text h4 {
  @apply font-semibold text-green-700 mb-1;
}

.success-text p {
  @apply text-sm text-green-600;
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
}

/* Form section styling */
h3 {
  @apply text-foreground;
}

.space-y-4 > h3 {
  @apply mb-4;
}

/* Loading state */
.edit-matter-form[data-loading="true"] {
  @apply opacity-75 pointer-events-none;
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

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>