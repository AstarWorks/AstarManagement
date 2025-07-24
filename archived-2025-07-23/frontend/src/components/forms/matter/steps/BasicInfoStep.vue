<!--
  Basic Information Step Component
  
  First step in the matter creation workflow.
  Handles basic matter details like title, description, type, status, and priority.
-->

<script setup lang="ts">
import { computed } from 'vue'

// Form Components
import { FormInput, FormTextarea, FormSelect } from '~/components/forms'
import { FormFieldWrapper } from '~/components/forms'
import MatterTypeField from '../fields/MatterTypeField.vue'
import MatterStatusField from '../fields/MatterStatusField.vue'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface Props {
  /** Form instance from parent */
  form: any
  /** Step-specific data */
  stepData: any
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [data: any]
}>()

// Priority options
const priorityOptions = [
  { value: 'LOW', label: 'Low Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'URGENT', label: 'Urgent' }
]

// Financial fields for more advanced matters
const showFinancialFields = computed(() => {
  // Show financial fields for certain matter types or if user has permissions
  return true // For now, always show
})
</script>

<template>
  <div class="space-y-6">
    <!-- Basic Information Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <FileText class="h-5 w-5" />
          Matter Details
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Matter Title -->
        <FormFieldWrapper
          name="matter-title"
          label="Matter Title"
          description="A clear, descriptive title for this legal matter"
          required
        >
          <FormInput
            name="title"
            placeholder="Enter matter title..."
            autocomplete="off"
          />
        </FormFieldWrapper>

        <!-- Matter Description -->
        <FormFieldWrapper
          name="description"
          label="Description"
          description="Detailed description of the matter (optional)"
        >
          <FormTextarea
            name="description"
            placeholder="Enter matter description..."
            :rows="4"
          />
        </FormFieldWrapper>

        <!-- Matter Type and Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MatterTypeField />
          <MatterStatusField />
        </div>

        <!-- Priority -->
        <FormFieldWrapper
          name="priority"
          label="Priority Level"
          description="Set the priority level for this matter"
          required
        >
          <FormSelect
            name="priority"
            placeholder="Select priority..."
            :options="priorityOptions"
          />
        </FormFieldWrapper>
      </CardContent>
    </Card>

    <!-- Financial Information Section -->
    <Card v-if="showFinancialFields">
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <DollarSign class="h-5 w-5" />
          Financial Information
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Estimated Value -->
          <FormFieldWrapper
            name="estimated-value"
            label="Estimated Value"
            description="Estimated monetary value of the matter"
          >
            <FormInput
              name="estimatedValue"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </FormFieldWrapper>

          <!-- Billable Hours -->
          <FormFieldWrapper
            name="billable-hours"
            label="Estimated Billable Hours"
            description="Estimated total billable hours"
          >
            <FormInput
              name="billableHours"
              type="number"
              placeholder="0"
              min="0"
              step="0.5"
            />
          </FormFieldWrapper>
        </div>
      </CardContent>
    </Card>

    <!-- Additional Information Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <Tag class="h-5 w-5" />
          Additional Information
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Tags -->
        <FormFieldWrapper
          name="tags"
          label="Tags"
          description="Add tags to help categorize and search for this matter"
        >
          <FormInput
            name="tags"
            placeholder="Enter tags separated by commas..."
          />
        </FormFieldWrapper>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { FileText, DollarSign, Tag } from 'lucide-vue-next'
</script>

<style scoped>
/* Grid responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* Focus improvements for accessibility */
:deep(.form-input:focus),
:deep(.form-textarea:focus),
:deep(.form-select:focus) {
  @apply ring-2 ring-primary ring-offset-2;
}

/* Card hover effects */
.card {
  @apply transition-shadow duration-200;
}

.card:hover {
  @apply shadow-md;
}
</style>