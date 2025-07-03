<!--
  Matter Date Fields Component
  
  Specialized date picker fields for matter open and close dates
  with validation and business rule enforcement.
-->

<script setup lang="ts">
import { computed } from 'vue'
import { FormFieldWrapper } from '~/components/forms'
import { FormDatePicker } from '~/components/forms'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { useField } from 'vee-validate'
import { Calendar, AlertTriangle, Info } from 'lucide-vue-next'

interface Props {
  /** Error message for open date field */
  openDateError?: string
  /** Error message for close date field */
  closeDateError?: string
  /** Field names for form binding */
  openDateName?: string
  closeDateName?: string
  /** Whether dates are required */
  required?: boolean
  /** Show date validation warnings */
  showWarnings?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  openDateName: 'openDate',
  closeDateName: 'closeDate',
  required: true,
  showWarnings: true
})

// Field bindings
const { value: openDate } = useField(props.openDateName)
const { value: closeDate } = useField(props.closeDateName)

// Computed properties
const today = computed(() => new Date().toISOString().split('T')[0])

const openDateObj = computed(() => {
  return openDate.value ? new Date(openDate.value as string) : null
})

const closeDateObj = computed(() => {
  return closeDate.value ? new Date(closeDate.value as string) : null
})

const matterDuration = computed(() => {
  if (!openDateObj.value || !closeDateObj.value) return null
  
  const diffTime = closeDateObj.value.getTime() - openDateObj.value.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return {
    days: diffDays,
    months: Math.floor(diffDays / 30),
    years: Math.floor(diffDays / 365)
  }
})

const dateValidationWarnings = computed(() => {
  const warnings = []
  
  // Future open date warning
  if (openDateObj.value && openDateObj.value > new Date()) {
    warnings.push({
      type: 'info',
      message: 'Matter open date is in the future'
    })
  }
  
  // Close date before open date
  if (openDateObj.value && closeDateObj.value && closeDateObj.value <= openDateObj.value) {
    warnings.push({
      type: 'error',
      message: 'Close date must be after open date'
    })
  }
  
  // Very long matter duration
  if (matterDuration.value && matterDuration.value.days > 1095) { // 3 years
    warnings.push({
      type: 'warning',
      message: 'Matter duration exceeds 3 years - this is unusually long'
    })
  }
  
  // Very short matter duration
  if (matterDuration.value && matterDuration.value.days < 1) {
    warnings.push({
      type: 'warning',
      message: 'Matter duration is less than 1 day - this is unusually short'
    })
  }
  
  return warnings
})

const formatDuration = (duration: any) => {
  if (!duration) return ''
  
  if (duration.years > 0) {
    return `${duration.years} year${duration.years > 1 ? 's' : ''}, ${duration.months % 12} month${(duration.months % 12) !== 1 ? 's' : ''}`
  } else if (duration.months > 0) {
    return `${duration.months} month${duration.months > 1 ? 's' : ''}`
  } else {
    return `${duration.days} day${duration.days > 1 ? 's' : ''}`
  }
}

// Date constraints
const maxOpenDate = computed(() => {
  // Open date can be up to today (or close date if set)
  if (closeDate.value) {
    const closeDateStr = closeDate.value
    return closeDateStr < today.value ? closeDateStr : today.value
  }
  return today.value
})

const minCloseDate = computed(() => {
  // Close date must be after open date
  return openDate.value || today.value
})
</script>

<template>
  <div class="matter-date-fields space-y-4">
    <!-- Open Date Field -->
    <FormFieldWrapper
      name="open-date"
      :label="'Matter Open Date'"
      :description="'The date when this matter was opened'"
      :required="required"
    >
      <FormDatePicker
        :name="openDateName"
        :error="openDateError"
        :max="maxOpenDate"
        placeholder="Select open date..."
      />
    </FormFieldWrapper>

    <!-- Close Date Field -->
    <FormFieldWrapper
      name="close-date"
      :label="'Matter Close Date'"
      :description="'The date when this matter was or will be closed (optional)'"
    >
      <FormDatePicker
        :name="closeDateName"
        :error="closeDateError"
        :min="minCloseDate"
        placeholder="Select close date (optional)..."
      />
    </FormFieldWrapper>

    <!-- Duration Display -->
    <div v-if="matterDuration" class="p-3 bg-muted/30 rounded-md">
      <div class="flex items-center gap-2 mb-2">
        <Calendar class="h-4 w-4 text-muted-foreground" />
        <span class="text-sm font-medium">Matter Duration</span>
      </div>
      <div class="text-sm text-muted-foreground">
        {{ formatDuration(matterDuration) }}
        <Badge variant="outline" class="ml-2 text-xs">
          {{ matterDuration.days }} day{{ matterDuration.days !== 1 ? 's' : '' }}
        </Badge>
      </div>
    </div>

    <!-- Validation Warnings -->
    <div v-if="showWarnings && dateValidationWarnings.length > 0" class="space-y-2">
      <Alert 
        v-for="(warning, index) in dateValidationWarnings" 
        :key="index"
        :variant="warning.type === 'error' ? 'destructive' : warning.type === 'warning' ? 'default' : 'default'"
      >
        <AlertTriangle v-if="warning.type === 'error'" class="h-4 w-4" />
        <AlertTriangle v-else-if="warning.type === 'warning'" class="h-4 w-4" />
        <Info v-else class="h-4 w-4" />
        <AlertDescription>
          {{ warning.message }}
        </AlertDescription>
      </Alert>
    </div>

    <!-- Date Guidelines -->
    <details class="cursor-pointer">
      <summary class="text-xs text-muted-foreground hover:text-foreground">
        Date field guidelines
      </summary>
      <div class="mt-2 text-xs text-muted-foreground space-y-2 pl-4 border-l-2 border-muted">
        <div>
          <span class="font-medium">Open Date:</span>
          <ul class="mt-1 space-y-1 list-disc list-inside ml-2">
            <li>Usually the date the matter was initiated</li>
            <li>Cannot be in the future for active matters</li>
            <li>Required for all matters</li>
          </ul>
        </div>
        <div>
          <span class="font-medium">Close Date:</span>
          <ul class="mt-1 space-y-1 list-disc list-inside ml-2">
            <li>Optional field for ongoing matters</li>
            <li>Must be after the open date</li>
            <li>Automatically set when matter status changes to "CLOSED"</li>
            <li>Can be a future date for planned closure</li>
          </ul>
        </div>
        <div class="p-2 bg-muted rounded-sm">
          <span class="font-medium">Business Rules:</span>
          <ul class="mt-1 space-y-1 list-disc list-inside ml-2">
            <li>Matters lasting more than 3 years require review</li>
            <li>Same-day matters require special justification</li>
            <li>Future open dates are allowed for scheduled matters</li>
          </ul>
        </div>
      </div>
    </details>
  </div>
</template>

<style scoped>
/* Details element styling */
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

/* Duration display styling */
.matter-duration {
  @apply bg-gradient-to-r from-muted/30 to-muted/10 border border-muted;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .flex.items-center.gap-2 {
    @apply gap-1;
  }
  
  .text-sm {
    font-size: 0.75rem; line-height: 1rem;
  }
}

/* Animation for duration changes */
.matter-duration {
  transition: all 0.2s ease-in-out;
}

.matter-duration:hover {
  @apply bg-muted/50;
}
</style>