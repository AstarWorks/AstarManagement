<template>
  <FormFieldWrapper
    :name="name"
    :label="label"
    :description="description"
    :help-text="helpText"
    :warning="warning"
    :required="required"
    :class="fieldClass"
  >
    <template #default="{ field, fieldId, hasError, errorMessage, isRequired, describedBy }">
      <!-- Single Checkbox -->
      <div v-if="!isGroup" class="flex items-center space-x-2">
        <Checkbox
          :id="fieldId"
          :name="field.name"
          :checked="isChecked"
          :disabled="disabled"
          :required="isRequired"
          :class="cn(
            hasError && 'border-destructive data-[state=checked]:bg-destructive',
            props.class
          )"
          :aria-describedby="describedBy"
          :aria-invalid="hasError"
          @update:checked="handleSingleChange"
        />
        <Label
          :for="fieldId"
          :class="cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            hasError && 'text-destructive'
          )"
        >
          {{ checkboxLabel }}
          <span v-if="isRequired" class="text-destructive ml-1">*</span>
        </Label>
      </div>

      <!-- Checkbox Group -->
      <div v-else class="space-y-3">
        <div
          v-if="groupLabel"
          class="text-sm font-medium leading-none"
          :class="hasError && 'text-destructive'"
        >
          {{ groupLabel }}
          <span v-if="isRequired" class="text-destructive ml-1">*</span>
        </div>

        <div :class="groupLayout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'">
          <div
            v-for="option in normalizedOptions"
            :key="option.value"
            class="flex items-center space-x-2"
          >
            <Checkbox
              :id="`${fieldId}-${option.value}`"
              :name="`${field.name}[]`"
              :checked="isOptionChecked(option.value)"
              :disabled="disabled || option.disabled"
              :value="option.value"
              :class="cn(
                hasError && 'border-destructive data-[state=checked]:bg-destructive'
              )"
              @update:checked="(checked: boolean) => handleGroupChange(option.value, checked)"
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
                <!-- Option label -->
                <span>{{ option.label }}</span>
                <!-- Option description -->
                <span
                  v-if="option.description"
                  class="text-xs text-muted-foreground"
                >
                  ({{ option.description }})
                </span>
              </div>
            </Label>
          </div>
        </div>

        <!-- Group helpers -->
        <div v-if="showGroupHelpers" class="flex gap-2 text-xs">
          <button
            type="button"
            class="text-primary hover:underline"
            :disabled="disabled"
            @click="selectAll"
          >
            Select All
          </button>
          <button
            type="button"
            class="text-primary hover:underline"
            :disabled="disabled"
            @click="selectNone"
          >
            Select None
          </button>
          <button
            v-if="allowInvert"
            type="button"
            class="text-primary hover:underline"
            :disabled="disabled"
            @click="invertSelection"
          >
            Invert Selection
          </button>
        </div>

        <!-- Selection summary -->
        <div
          v-if="showSelectionSummary && isGroup"
          class="text-xs text-muted-foreground"
        >
          {{ selectedCount }} of {{ normalizedOptions.length }} selected
          <span v-if="minSelections || maxSelections">
            ({{ selectionRequirement }})
          </span>
        </div>
      </div>
    </template>
  </FormFieldWrapper>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useField } from '~/composables/form/useField'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'
import type { FormFieldSlotProps } from './FormFieldWrapper.vue'

/**
 * Checkbox option interface
 */
export interface CheckboxOption {
  value: string | number
  label: string
  description?: string
  disabled?: boolean
  icon?: Component
}

/**
 * FormCheckbox component props
 */
export interface FormCheckboxProps {
  /** Field name for validation */
  name: string
  /** Field label (for single checkbox) */
  label?: string
  /** Group label (for checkbox group) */
  groupLabel?: string
  /** Checkbox label (for single checkbox) */
  checkboxLabel?: string
  /** Field description/hint */
  description?: string
  /** Help text */
  helpText?: string
  /** Warning message (non-blocking) */
  warning?: string
  /** Whether field is required */
  required?: boolean
  /** Whether checkbox is disabled */
  disabled?: boolean
  /** Options for checkbox group */
  options?: CheckboxOption[]
  /** Value when checkbox is checked (single mode) */
  checkedValue?: any
  /** Value when checkbox is unchecked (single mode) */
  uncheckedValue?: any
  /** Group layout orientation */
  groupLayout?: 'vertical' | 'horizontal'
  /** Whether to show group helper buttons */
  showGroupHelpers?: boolean
  /** Whether to allow invert selection */
  allowInvert?: boolean
  /** Whether to show selection summary */
  showSelectionSummary?: boolean
  /** Minimum number of selections required */
  minSelections?: number
  /** Maximum number of selections allowed */
  maxSelections?: number
  /** Custom CSS classes for the field wrapper */
  fieldClass?: string
  /** Custom CSS classes for the checkbox */
  class?: string
}

const props = withDefaults(defineProps<FormCheckboxProps>(), {
  checkedValue: true,
  uncheckedValue: false,
  groupLayout: 'vertical',
  showGroupHelpers: false,
  allowInvert: false,
  showSelectionSummary: false,
  options: () => []
})

// Field management
const field = useField(props.name)

// Determine if this is a group or single checkbox
const isGroup = computed(() => props.options && props.options.length > 0)

// Normalize options
const normalizedOptions = computed((): CheckboxOption[] => {
  return props.options.map(option => ({
    value: option.value,
    label: option.label,
    description: option.description,
    disabled: option.disabled || false,
    icon: option.icon
  }))
})

// Single checkbox logic
const isChecked = computed(() => {
  if (isGroup.value) return false
  return field.value.value === props.checkedValue
})

const handleSingleChange = (checked: boolean) => {
  field.handleChange(checked ? props.checkedValue : props.uncheckedValue)
}

// Group checkbox logic
const currentGroupValue = computed(() => {
  const value = field.value.value
  if (Array.isArray(value)) return value
  return []
})

const isOptionChecked = (optionValue: string | number): boolean => {
  return currentGroupValue.value.includes(optionValue)
}

const handleGroupChange = (optionValue: string | number, checked: boolean) => {
  const currentValues = [...currentGroupValue.value]
  
  if (checked) {
    // Add to selection if not already present
    if (!currentValues.includes(optionValue)) {
      // Check max selections limit
      if (props.maxSelections && currentValues.length >= props.maxSelections) {
        return // Don't add if at max limit
      }
      currentValues.push(optionValue)
    }
  } else {
    // Remove from selection
    const index = currentValues.indexOf(optionValue)
    if (index > -1) {
      currentValues.splice(index, 1)
    }
  }
  
  field.handleChange(currentValues)
}

// Group helpers
const selectAll = () => {
  const allValues = normalizedOptions.value
    .filter(option => !option.disabled)
    .map(option => option.value)
  
  // Respect max selections limit
  const valuesToSelect = props.maxSelections 
    ? allValues.slice(0, props.maxSelections)
    : allValues
  
  field.handleChange(valuesToSelect)
}

const selectNone = () => {
  field.handleChange([])
}

const invertSelection = () => {
  const allValues = normalizedOptions.value
    .filter(option => !option.disabled)
    .map(option => option.value)
  
  const currentValues = currentGroupValue.value
  const invertedValues = allValues.filter(value => !currentValues.includes(value))
  
  // Respect max selections limit
  const valuesToSelect = props.maxSelections 
    ? invertedValues.slice(0, props.maxSelections)
    : invertedValues
  
  field.handleChange(valuesToSelect)
}

// Selection summary
const selectedCount = computed(() => currentGroupValue.value.length)

const selectionRequirement = computed(() => {
  const parts = []
  
  if (props.minSelections) {
    parts.push(`min ${props.minSelections}`)
  }
  
  if (props.maxSelections) {
    parts.push(`max ${props.maxSelections}`)
  }
  
  return parts.join(', ')
})

// Expose field for template refs
defineExpose({
  field,
  selectAll,
  selectNone,
  invertSelection,
  isChecked: isGroup.value ? undefined : isChecked,
  selectedValues: isGroup.value ? currentGroupValue : undefined,
  selectedCount: isGroup.value ? selectedCount : undefined
})
</script>