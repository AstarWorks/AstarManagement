<template>
  <div class="template-variables">
    <div v-if="!readonly" class="variables-header">
      <h4 class="variables-title">Template Variables</h4>
      <p class="variables-description">
        Configure the variables below to customize your template.
        Required fields are marked with an asterisk (*).
      </p>
    </div>
    
    <div class="variables-list">
      <div
        v-for="variable in variables"
        :key="variable.key"
        class="variable-item"
        :class="{ 'has-error': errors[variable.key] }"
      >
        <!-- Variable Label -->
        <label 
          :for="`var-${variable.key}`"
          class="variable-label"
        >
          {{ variable.label }}
          <span v-if="variable.required" class="required-marker">*</span>
        </label>
        
        <!-- Variable Description -->
        <p v-if="variable.description" class="variable-description">
          {{ variable.description }}
        </p>
        
        <!-- Variable Input -->
        <div class="variable-input">
          <!-- Text Input -->
          <Input
            v-if="variable.type === 'text'"
            :id="`var-${variable.key}`"
            v-model="values[variable.key]"
            type="text"
            :placeholder="variable.placeholder || `Enter ${variable.label.toLowerCase()}`"
            :required="variable.required"
            :readonly="readonly"
            @blur="validateField(variable.key)"
          />
          
          <!-- Number Input -->
          <Input
            v-else-if="variable.type === 'number'"
            :id="`var-${variable.key}`"
            v-model.number="values[variable.key]"
            type="number"
            :placeholder="variable.placeholder || `Enter ${variable.label.toLowerCase()}`"
            :required="variable.required"
            :readonly="readonly"
            @blur="validateField(variable.key)"
          />
          
          <!-- Date Input -->
          <Input
            v-else-if="variable.type === 'date'"
            :id="`var-${variable.key}`"
            v-model="values[variable.key]"
            type="date"
            :required="variable.required"
            :readonly="readonly"
            @blur="validateField(variable.key)"
          />
          
          <!-- Select Input -->
          <Select
            v-else-if="variable.type === 'select'"
            v-model="values[variable.key]"
            :disabled="readonly"
            @value-change="handleSelectChange(variable.key, $event)"
          >
            <SelectTrigger :id="`var-${variable.key}`">
              <SelectValue 
                :placeholder="variable.placeholder || `Select ${variable.label.toLowerCase()}`" 
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in variable.options"
                :key="option"
                :value="option"
              >
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
          
          <!-- Boolean (Checkbox) Input -->
          <div v-else-if="variable.type === 'boolean'" class="checkbox-wrapper">
            <Checkbox
              :id="`var-${variable.key}`"
              :checked="values[variable.key]"
              :disabled="readonly"
              @update:checked="values[variable.key] = $event"
            />
            <label 
              :for="`var-${variable.key}`"
              class="checkbox-label"
            >
              {{ variable.placeholder || variable.label }}
            </label>
          </div>
        </div>
        
        <!-- Error Message -->
        <p v-if="errors[variable.key]" class="error-message">
          {{ errors[variable.key] }}
        </p>
        
        <!-- Variable Info -->
        <div v-if="readonly" class="variable-info">
          <div class="info-item">
            <span class="info-label">Type:</span>
            <Badge variant="outline" class="type-badge">
              {{ getTypeLabel(variable.type) }}
            </Badge>
          </div>
          <div v-if="variable.required" class="info-item">
            <span class="info-label">Required:</span>
            <Badge variant="default" class="required-badge">
              Yes
            </Badge>
          </div>
          <div v-if="variable.defaultValue !== undefined" class="info-item">
            <span class="info-label">Default:</span>
            <code class="default-value">{{ variable.defaultValue }}</code>
          </div>
          <div v-if="variable.options?.length" class="info-item">
            <span class="info-label">Options:</span>
            <div class="options-list">
              <Badge 
                v-for="option in variable.options" 
                :key="option"
                variant="outline"
                class="option-badge"
              >
                {{ option }}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Summary (for readonly mode) -->
    <div v-if="readonly && variables.length > 0" class="variables-summary">
      <h5 class="summary-title">Summary</h5>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">{{ variables.length }}</span>
          <span class="stat-label">Total Variables</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ requiredCount }}</span>
          <span class="stat-label">Required</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ optionalCount }}</span>
          <span class="stat-label">Optional</span>
        </div>
      </div>
    </div>
    
    <!-- Actions (for editable mode) -->
    <div v-if="!readonly" class="variables-actions">
      <Button 
        variant="outline" 
        @click="resetValues"
      >
        Reset to Defaults
      </Button>
      <Button 
        @click="validateAll"
        :disabled="!isValid"
      >
        Validate All
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { TemplateVariable } from '~/types/template'

interface Props {
  variables: TemplateVariable[]
  readonly?: boolean
  initialValues?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  initialValues: () => ({})
})

const emit = defineEmits<{
  'update:values': [values: Record<string, any>]
  'validation-change': [isValid: boolean]
}>()

// State
const values = ref<Record<string, any>>({})
const errors = ref<Record<string, string>>({})

// Computed
const requiredCount = computed(() => 
  props.variables.filter(v => v.required).length
)

const optionalCount = computed(() => 
  props.variables.length - requiredCount.value
)

const isValid = computed(() => {
  return props.variables.every(variable => {
    if (variable.required) {
      const value = values.value[variable.key]
      return value !== undefined && value !== null && value !== ''
    }
    return true
  })
})

// Initialize values
const initializeValues = () => {
  const initialValues: Record<string, any> = {}
  
  props.variables.forEach(variable => {
    // Use provided initial values first
    if (props.initialValues[variable.key] !== undefined) {
      initialValues[variable.key] = props.initialValues[variable.key]
    }
    // Then use variable default values
    else if (variable.defaultValue !== undefined) {
      initialValues[variable.key] = variable.defaultValue
    }
    // Finally set appropriate empty values
    else {
      switch (variable.type) {
        case 'boolean':
          initialValues[variable.key] = false
          break
        case 'number':
          initialValues[variable.key] = undefined
          break
        default:
          initialValues[variable.key] = ''
      }
    }
  })
  
  values.value = initialValues
}

// Methods
const validateField = (key: string) => {
  const variable = props.variables.find(v => v.key === key)
  if (!variable) return
  
  const value = values.value[key]
  
  // Required field validation
  if (variable.required && (value === undefined || value === null || value === '')) {
    errors.value[key] = `${variable.label} is required`
    return
  }
  
  // Type-specific validation
  if (value !== undefined && value !== null && value !== '') {
    switch (variable.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.value[key] = `${variable.label} must be a valid number`
          return
        }
        break
      case 'date':
        if (new Date(value).toString() === 'Invalid Date') {
          errors.value[key] = `${variable.label} must be a valid date`
          return
        }
        break
      case 'select':
        if (variable.options && !variable.options.includes(value)) {
          errors.value[key] = `${variable.label} must be one of the available options`
          return
        }
        break
    }
  }
  
  // Clear error if validation passes
  delete errors.value[key]
}

const validateAll = () => {
  props.variables.forEach(variable => {
    validateField(variable.key)
  })
}

const resetValues = () => {
  initializeValues()
  errors.value = {}
}

const handleSelectChange = (key: string, value: string) => {
  values.value[key] = value
  validateField(key)
}

const getTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    select: 'Selection',
    boolean: 'Yes/No'
  }
  return typeLabels[type] || type
}

// Watch for changes
watch(values, (newValues) => {
  emit('update:values', newValues)
}, { deep: true })

watch(isValid, (valid) => {
  emit('validation-change', valid)
})

// Initialize on mount
onMounted(() => {
  initializeValues()
})

// Watch for prop changes
watch(() => props.variables, () => {
  initializeValues()
}, { deep: true })

watch(() => props.initialValues, () => {
  initializeValues()
}, { deep: true })
</script>

<style scoped>
.template-variables {
  @apply space-y-6;
}

.variables-header {
  @apply space-y-2;
}

.variables-title {
  @apply text-lg font-semibold;
}

.variables-description {
  @apply text-sm text-muted-foreground;
}

.variables-list {
  @apply space-y-6;
}

.variable-item {
  @apply space-y-3 p-4 rounded-lg border border-border bg-card;
}

.variable-item.has-error {
  @apply border-destructive bg-destructive/5;
}

.variable-label {
  @apply block text-sm font-medium text-foreground;
}

.required-marker {
  @apply text-destructive ml-1;
}

.variable-description {
  @apply text-xs text-muted-foreground italic;
}

.variable-input {
  @apply space-y-2;
}

.checkbox-wrapper {
  @apply flex items-center space-x-2;
}

.checkbox-label {
  @apply text-sm text-foreground cursor-pointer;
}

.error-message {
  @apply text-xs text-destructive;
}

.variable-info {
  @apply space-y-2 pt-2 border-t border-border;
}

.info-item {
  @apply flex items-center gap-2 text-xs;
}

.info-label {
  @apply font-medium text-muted-foreground;
}

.type-badge,
.required-badge {
  @apply text-xs;
}

.default-value {
  @apply px-1.5 py-0.5 bg-muted rounded text-xs font-mono;
}

.options-list {
  @apply flex flex-wrap gap-1;
}

.option-badge {
  @apply text-xs;
}

.variables-summary {
  @apply pt-4 border-t border-border;
}

.summary-title {
  @apply text-base font-semibold mb-3;
}

.summary-stats {
  @apply grid grid-cols-3 gap-4;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply block text-lg font-bold text-primary;
}

.stat-label {
  @apply text-xs text-muted-foreground;
}

.variables-actions {
  @apply flex justify-end gap-3 pt-4 border-t border-border;
}

/* Responsive design */
@media (max-width: 640px) {
  .variable-item {
    @apply p-3;
  }
  
  .summary-stats {
    @apply grid-cols-1 gap-2;
  }
  
  .variables-actions {
    @apply flex-col;
  }
  
  .variables-actions .button {
    @apply w-full;
  }
}

/* Enhanced focus styles */
.variable-input input:focus,
.variable-input select:focus {
  @apply ring-2 ring-primary ring-offset-2;
}

/* Animation for error states */
.variable-item.has-error {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* Improved visual hierarchy */
.variable-label {
  @apply mb-1;
}

.variable-description {
  @apply mb-2;
}

/* Loading state for readonly mode */
.template-variables[data-loading="true"] .variable-item {
  @apply animate-pulse;
}

/* Enhanced badge styling */
.type-badge {
  @apply bg-blue-50 text-blue-700 border-blue-200;
}

.required-badge {
  @apply bg-red-50 text-red-700 border-red-200;
}

.option-badge {
  @apply bg-gray-50 text-gray-700 border-gray-200;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .type-badge {
    @apply bg-blue-950 text-blue-300 border-blue-800;
  }
  
  .required-badge {
    @apply bg-red-950 text-red-300 border-red-800;
  }
  
  .option-badge {
    @apply bg-gray-800 text-gray-300 border-gray-700;
  }
}
</style>