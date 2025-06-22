<template>
  <FormFieldWrapper
    :name="name"
    :label="groupLabel"
    :description="description"
    :help-text="helpText"
    :warning="warning"
    :required="required"
    :class="fieldClass"
  >
    <template #default="{ field, fieldId, hasError, errorMessage, isRequired, describedBy }">
      <RadioGroup
        :value="field.value.value"
        :name="toValue(field.name)"
        :disabled="disabled"
        :required="isRequired"
        :class="cn(
          'grid gap-2',
          layout === 'horizontal' && 'grid-flow-col auto-cols-max',
          layout === 'grid' && gridCols,
          props.class
        )"
        :aria-describedby="describedBy"
        :aria-invalid="hasError"
        @update:value="handleValueChange"
      >
        <div
          v-for="option in normalizedOptions"
          :key="option.value"
          class="flex items-center space-x-2"
        >
          <RadioGroupItem
            :id="`${fieldId}-${option.value}`"
            :value="String(option.value)"
            :disabled="disabled || option.disabled"
            :class="cn(
              hasError && 'border-destructive text-destructive'
            )"
          />
          <Label
            :for="`${fieldId}-${option.value}`"
            :class="cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              hasError && 'text-destructive'
            )"
          >
            <div class="flex items-center gap-2">
              <!-- Option icon -->
              <component
                v-if="option.icon"
                :is="option.icon"
                class="h-4 w-4"
              />
              
              <!-- Option content -->
              <div class="flex flex-col">
                <span>{{ option.label }}</span>
                <span
                  v-if="option.description"
                  class="text-xs text-muted-foreground font-normal"
                >
                  {{ option.description }}
                </span>
              </div>
              
              <!-- Option badge -->
              <span
                v-if="option.badge"
                class="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
              >
                {{ option.badge }}
              </span>
            </div>
          </Label>
        </div>

        <!-- Custom option slot -->
        <div
          v-if="allowCustom && showCustomInput"
          class="flex items-center space-x-2"
        >
          <RadioGroupItem
            :id="`${fieldId}-custom`"
            :value="customValue"
            :disabled="disabled"
            :class="cn(
              hasError && 'border-destructive text-destructive'
            )"
          />
          <div class="flex-1 flex items-center gap-2">
            <Label
              :for="`${fieldId}-custom`"
              class="text-sm font-medium leading-none"
            >
              {{ customLabel }}:
            </Label>
            <Input
              v-model="customInputValue"
              :placeholder="customPlaceholder"
              :disabled="disabled || field.value.value !== customValue"
              class="h-8 text-sm"
              @input="handleCustomInput"
              @focus="selectCustomOption"
            />
          </div>
        </div>

        <!-- Add custom option button -->
        <button
          v-if="allowCustom && !showCustomInput"
          type="button"
          class="flex items-center gap-2 text-sm text-primary hover:underline"
          :disabled="disabled"
          @click="showCustomInput = true"
        >
          <Plus class="h-4 w-4" />
          {{ addCustomText }}
        </button>
      </RadioGroup>

      <!-- Selection summary -->
      <div
        v-if="showSelectionSummary && field.value"
        class="mt-2 text-xs text-muted-foreground"
      >
        Selected: {{ getSelectedOptionLabel() }}
      </div>
    </template>
  </FormFieldWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch, toValue, type Component } from 'vue'
import { useField } from '~/composables/form/useField'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Plus } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

/**
 * Radio option interface
 */
export interface RadioOption {
  value: string | number
  label: string
  description?: string
  disabled?: boolean
  icon?: Component
  badge?: string
}

/**
 * FormRadio component props
 */
export interface FormRadioProps {
  /** Field name for validation */
  name: string
  /** Group label */
  groupLabel?: string
  /** Field description/hint */
  description?: string
  /** Help text */
  helpText?: string
  /** Warning message (non-blocking) */
  warning?: string
  /** Whether field is required */
  required?: boolean
  /** Whether radio group is disabled */
  disabled?: boolean
  /** Radio options */
  options: RadioOption[]
  /** Layout orientation */
  layout?: 'vertical' | 'horizontal' | 'grid'
  /** Grid columns for grid layout */
  columns?: number
  /** Whether to allow custom option input */
  allowCustom?: boolean
  /** Custom option value identifier */
  customValue?: string
  /** Custom option label */
  customLabel?: string
  /** Custom input placeholder */
  customPlaceholder?: string
  /** Add custom option button text */
  addCustomText?: string
  /** Whether to show selection summary */
  showSelectionSummary?: boolean
  /** Custom CSS classes for the field wrapper */
  fieldClass?: string
  /** Custom CSS classes for the radio group */
  class?: string
}

const props = withDefaults(defineProps<FormRadioProps>(), {
  layout: 'vertical',
  columns: 2,
  customValue: '__custom__',
  customLabel: 'Other',
  customPlaceholder: 'Enter custom value...',
  addCustomText: 'Add custom option',
  showSelectionSummary: false,
  options: () => []
})

// Field management
const field = useField(props.name)

// Custom input handling
const showCustomInput = ref(false)
const customInputValue = ref('')

// Normalize options
const normalizedOptions = computed((): RadioOption[] => {
  return props.options.map(option => ({
    value: option.value,
    label: option.label,
    description: option.description,
    disabled: option.disabled || false,
    icon: option.icon,
    badge: option.badge
  }))
})

// Grid columns class
const gridCols = computed(() => {
  const colsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }
  return colsMap[props.columns] || 'grid-cols-2'
})

// Handle value changes
const handleValueChange = (value: string | number) => {
  if (value === props.customValue) {
    // When custom option is selected, use custom input value
    field.handleChange(customInputValue.value || value)
  } else {
    field.handleChange(value)
    // Hide custom input if another option is selected
    if (showCustomInput.value) {
      showCustomInput.value = false
    }
  }
}

// Handle custom input
const handleCustomInput = () => {
  if (field.value.value === props.customValue) {
    field.handleChange(customInputValue.value)
  }
}

const selectCustomOption = () => {
  field.handleChange(props.customValue)
}

// Get selected option label for summary
const getSelectedOptionLabel = (): string => {
  const currentValue = field.value.value
  
  if (currentValue === props.customValue) {
    return customInputValue.value || props.customLabel
  }
  
  const option = normalizedOptions.value.find(opt => opt.value === currentValue)
  return option?.label || String(currentValue)
}

// Watch for external value changes to sync custom input
watch(
  () => field.value.value,
  (newValue) => {
    if (typeof newValue === 'string' && 
        newValue !== props.customValue && 
        !normalizedOptions.value.find(opt => opt.value === newValue)) {
      // Value appears to be a custom value, show custom input
      customInputValue.value = newValue
      showCustomInput.value = true
      field.handleChange(props.customValue)
    }
  }
)

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  const options = normalizedOptions.value.filter(opt => !opt.disabled)
  const currentIndex = options.findIndex(opt => opt.value === field.value.value)
  
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      if (currentIndex < options.length - 1) {
        handleValueChange(options[currentIndex + 1].value)
      } else if (props.allowCustom) {
        showCustomInput.value = true
      }
      break
      
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      if (currentIndex > 0) {
        handleValueChange(options[currentIndex - 1].value)
      }
      break
      
    case 'Home':
      event.preventDefault()
      if (options.length > 0) {
        handleValueChange(options[0].value)
      }
      break
      
    case 'End':
      event.preventDefault()
      if (options.length > 0) {
        if (props.allowCustom) {
          showCustomInput.value = true
        } else {
          handleValueChange(options[options.length - 1].value)
        }
      }
      break
  }
}

// Expose field for template refs
defineExpose({
  field,
  getSelectedOption: () => {
    const currentValue = field.value.value
    return normalizedOptions.value.find(opt => opt.value === currentValue)
  },
  selectedLabel: computed(() => getSelectedOptionLabel()),
  showCustomInput: () => {
    showCustomInput.value = true
  },
  hideCustomInput: () => {
    showCustomInput.value = false
  }
})
</script>