<!--
  Matter Status Field Component
  
  Specialized dropdown for selecting matter status with visual indicators
  and workflow guidance.
-->

<script setup lang="ts">
import { computed } from 'vue'
import { FormSelect } from '~/components/forms'
import { FormFieldWrapper } from '~/components/forms'
import { Badge } from '~/components/ui/badge'

interface Props {
  /** Error message from form validation */
  error?: string
  /** Field name for form binding */
  name?: string
  /** Whether field is required */
  required?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Current status (for transition validation) */
  currentStatus?: string
}

const props = withDefaults(defineProps<Props>(), {
  name: 'status',
  required: true,
  placeholder: 'Select matter status...'
})

// Matter status options with metadata
const matterStatusOptions = [
  {
    value: 'INVESTIGATION',
    label: 'Investigation',
    description: 'Initial fact-finding and case assessment',
    color: 'blue',
    order: 1
  },
  {
    value: 'RESEARCH',
    label: 'Research',
    description: 'Legal research and case preparation',
    color: 'yellow',
    order: 2
  },
  {
    value: 'MEDIATION',
    label: 'Mediation',
    description: 'Alternative dispute resolution',
    color: 'purple',
    order: 3
  },
  {
    value: 'TRIAL',
    label: 'Trial',
    description: 'Active litigation or trial proceedings',
    color: 'red',
    order: 4
  },
  {
    value: 'SETTLEMENT',
    label: 'Settlement',
    description: 'Settlement negotiations and agreements',
    color: 'green',
    order: 5
  },
  {
    value: 'CLOSED',
    label: 'Closed',
    description: 'Matter completed and closed',
    color: 'gray',
    order: 6
  }
]

// Format options for FormSelect
const selectOptions = computed(() => 
  matterStatusOptions.map(option => ({
    value: option.value,
    label: option.label
  }))
)

// Get status metadata
const getStatusMeta = (status: string) => {
  return matterStatusOptions.find(opt => opt.value === status)
}

// Determine valid transitions
const getValidTransitions = (fromStatus: string) => {
  const current = getStatusMeta(fromStatus)
  if (!current) return matterStatusOptions

  // Business rules for status transitions
  switch (fromStatus) {
    case 'INVESTIGATION':
      return matterStatusOptions.filter(s => 
        ['RESEARCH', 'MEDIATION', 'CLOSED'].includes(s.value)
      )
    case 'RESEARCH':
      return matterStatusOptions.filter(s => 
        ['MEDIATION', 'TRIAL', 'SETTLEMENT', 'CLOSED'].includes(s.value)
      )
    case 'MEDIATION':
      return matterStatusOptions.filter(s => 
        ['TRIAL', 'SETTLEMENT', 'CLOSED'].includes(s.value)
      )
    case 'TRIAL':
      return matterStatusOptions.filter(s => 
        ['SETTLEMENT', 'CLOSED'].includes(s.value)
      )
    case 'SETTLEMENT':
      return matterStatusOptions.filter(s => 
        ['CLOSED'].includes(s.value)
      )
    case 'CLOSED':
      return [] // Cannot transition from closed
    default:
      return matterStatusOptions
  }
}

// Available options based on current status
const availableOptions = computed(() => {
  if (!props.currentStatus) return selectOptions.value
  
  const validTransitions = getValidTransitions(props.currentStatus)
  return validTransitions.map(option => ({
    value: option.value,
    label: option.label
  }))
})

// Show transition guidance
const showTransitionGuidance = computed(() => {
  return !!props.currentStatus && props.currentStatus !== 'CLOSED'
})
</script>

<template>
  <FormFieldWrapper
    name="matter-status"
    :label="'Matter Status'"
    :description="'Current status of the legal matter'"
    :required="required"
  >
    <FormSelect
      :name="name"
      :placeholder="placeholder"
      :options="availableOptions"
      :error="error"
    />
    
    <!-- Current Status Display -->
    <div v-if="currentStatus" class="mt-2 flex items-center gap-2">
      <span class="text-xs text-muted-foreground">Current Status:</span>
      <Badge 
        :variant="currentStatus === 'CLOSED' ? 'secondary' : 'outline'"
        class="text-xs"
      >
        {{ getStatusMeta(currentStatus)?.label }}
      </Badge>
    </div>

    <!-- Transition Guidance -->
    <div v-if="showTransitionGuidance" class="mt-2">
      <details class="cursor-pointer">
        <summary class="text-xs text-muted-foreground hover:text-foreground">
          View status workflow guidance
        </summary>
        <div class="mt-2 text-xs text-muted-foreground space-y-2">
          <div class="p-2 bg-muted rounded-sm">
            <p class="font-medium mb-1">Typical workflow progression:</p>
            <div class="flex flex-wrap items-center gap-1">
              <template v-for="(status, index) in matterStatusOptions.slice(0, -1)" :key="status.value">
                <Badge 
                  variant="outline" 
                  class="text-xs"
                >
                  {{ status.label }}
                </Badge>
                <span v-if="index < matterStatusOptions.length - 2" class="text-muted-foreground">→</span>
              </template>
            </div>
          </div>
          
          <!-- Status Descriptions -->
          <div class="space-y-1 pl-2 border-l-2 border-muted">
            <div 
              v-for="option in matterStatusOptions" 
              :key="option.value"
              class="text-xs"
            >
              <span class="font-medium">{{ option.label }}:</span>
              <span class="text-muted-foreground ml-1">{{ option.description }}</span>
            </div>
          </div>
        </div>
      </details>
    </div>

    <!-- Transition Restrictions -->
    <div v-if="currentStatus === 'CLOSED'" class="mt-2">
      <div class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
        ⚠️ This matter is closed. Status cannot be changed once a matter is closed.
      </div>
    </div>
  </FormFieldWrapper>
</template>

<style scoped>
details[open] summary {
  @apply text-foreground font-medium;
}

details summary::-webkit-details-marker {
  @apply text-muted-foreground;
}

/* Focus states for accessibility */
details summary:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring rounded;
}

/* Badge spacing in workflow */
.flex.flex-wrap .badge + span {
  @apply mx-1;
}
</style>