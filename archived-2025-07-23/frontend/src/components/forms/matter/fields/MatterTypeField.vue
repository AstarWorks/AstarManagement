<!--
  Matter Type Field Component
  
  Specialized dropdown for selecting matter types with descriptions
  and proper validation integration.
-->

<script setup lang="ts">
import { computed } from 'vue'
import { FormSelect } from '~/components/forms'
import { FormFieldWrapper } from '~/components/forms'

interface Props {
  /** Error message from form validation */
  error?: string
  /** Field name for form binding */
  name?: string
  /** Whether field is required */
  required?: boolean
  /** Placeholder text */
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  name: 'type',
  required: true,
  placeholder: 'Select matter type...'
})

// Matter type options with descriptions
const matterTypeOptions = [
  {
    value: 'CIVIL',
    label: 'Civil Litigation',
    description: 'Civil disputes between parties'
  },
  {
    value: 'CRIMINAL',
    label: 'Criminal Defense',
    description: 'Criminal defense and prosecution'
  },
  {
    value: 'CORPORATE',
    label: 'Corporate Law',
    description: 'Business and corporate legal matters'
  },
  {
    value: 'FAMILY',
    label: 'Family Law',
    description: 'Divorce, custody, and family matters'
  },
  {
    value: 'IMMIGRATION',
    label: 'Immigration',
    description: 'Immigration and visa matters'
  },
  {
    value: 'INTELLECTUAL_PROPERTY',
    label: 'Intellectual Property',
    description: 'Patents, trademarks, and copyrights'
  },
  {
    value: 'LABOR',
    label: 'Labor & Employment',
    description: 'Employment and labor law matters'
  },
  {
    value: 'REAL_ESTATE',
    label: 'Real Estate',
    description: 'Property and real estate transactions'
  },
  {
    value: 'TAX',
    label: 'Tax Law',
    description: 'Tax planning and disputes'
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other legal matters not listed above'
  }
]

// Format options for FormSelect
const selectOptions = computed(() => 
  matterTypeOptions.map(option => ({
    value: option.value,
    label: option.label
  }))
)
</script>

<template>
  <FormFieldWrapper
    name="matter-type"
    :label="'Matter Type'"
    :description="'Select the type of legal matter'"
    :required="required"
  >
    <FormSelect
      :name="name"
      :placeholder="placeholder"
      :options="selectOptions"
      :error="error"
    />
    
    <!-- Type descriptions -->
    <div class="mt-2 text-xs text-muted-foreground">
      <details class="cursor-pointer">
        <summary class="hover:text-foreground">View matter type descriptions</summary>
        <div class="mt-2 space-y-1 pl-4 border-l-2 border-muted">
          <div 
            v-for="option in matterTypeOptions" 
            :key="option.value"
            class="flex justify-between"
          >
            <span class="font-medium">{{ option.label }}:</span>
            <span class="text-muted-foreground">{{ option.description }}</span>
          </div>
        </div>
      </details>
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
</style>