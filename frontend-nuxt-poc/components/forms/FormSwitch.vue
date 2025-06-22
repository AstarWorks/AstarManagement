<template>
  <FormField
    :name="name"
    :label="label"
    :description="description"
    :help-text="helpText"
    :warning="warning"
    :required="required"
    :class="fieldClass"
  >
    <template #default="{ field, fieldId, hasError, isRequired, describedBy }">
      <div :class="cn('flex items-center justify-between gap-4', containerClass)">
        <!-- Switch Content -->
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <!-- Switch Component -->
            <Switch
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
              @update:checked="handleChange"
            />

            <!-- Switch Label and Description -->
            <div class="flex-1">
              <Label
                :for="fieldId"
                :class="cn(
                  'text-sm font-medium leading-none cursor-pointer',
                  hasError && 'text-destructive',
                  disabled && 'cursor-not-allowed opacity-50'
                )"
              >
                {{ switchLabel }}
                <span v-if="isRequired" class="text-destructive ml-1">*</span>
              </Label>
              
              <!-- Inline description -->
              <div
                v-if="inlineDescription"
                class="text-sm text-muted-foreground mt-1"
              >
                {{ inlineDescription }}
              </div>
            </div>
          </div>
        </div>

        <!-- Switch Status Indicator -->
        <div
          v-if="showStatus"
          :class="cn(
            'text-sm font-medium px-2 py-1 rounded-full transition-colors',
            isChecked 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          )"
        >
          {{ statusText }}
        </div>

        <!-- Custom status content -->
        <div v-if="$slots.status" class="flex items-center">
          <slot name="status" :checked="isChecked" :field="field" />
        </div>
      </div>

      <!-- Switch Group (Multiple switches) -->
      <div
        v-if="isGroup"
        class="space-y-3 mt-4"
      >
        <div
          v-for="option in normalizedOptions"
          :key="option.key"
          class="flex items-center justify-between gap-4 p-3 border rounded-lg"
        >
          <div class="flex items-center gap-3 flex-1">
            <Switch
              :id="`${fieldId}-${option.key}`"
              :name="`${field.name}[${option.key}]`"
              :checked="isOptionChecked(option.key)"
              :disabled="disabled || option.disabled"
              @update:checked="(checked) => handleGroupChange(option.key, checked)"
            />
            
            <div class="flex-1">
              <Label
                :for="`${fieldId}-${option.key}`"
                class="text-sm font-medium leading-none cursor-pointer"
              >
                {{ option.label }}
              </Label>
              
              <div
                v-if="option.description"
                class="text-sm text-muted-foreground mt-1"
              >
                {{ option.description }}
              </div>
            </div>
          </div>

          <!-- Option status -->
          <div
            v-if="option.showStatus"
            :class="cn(
              'text-xs px-2 py-1 rounded-full',
              isOptionChecked(option.key)
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            )"
          >
            {{ isOptionChecked(option.key) ? (option.onText || 'On') : (option.offText || 'Off') }}
          </div>
        </div>
      </div>
    </template>
  </FormField>
</template>

<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { useField } from '~/composables/form/useField'
import { Switch } from '~/components/ui/switch'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'

/**
 * Switch option interface for group mode
 */
export interface SwitchOption {
  key: string
  label: string
  description?: string
  disabled?: boolean
  showStatus?: boolean
  onText?: string
  offText?: string
}

/**
 * FormSwitch component props
 */
export interface FormSwitchProps extends /* @vue-ignore */ HTMLAttributes {
  /** Field name for validation */
  name: string
  /** Field label */
  label?: string
  /** Switch label (appears next to switch) */
  switchLabel?: string
  /** Inline description (appears under switch label) */
  inlineDescription?: string
  /** Field description/hint */
  description?: string
  /** Help text */
  helpText?: string
  /** Warning message (non-blocking) */
  warning?: string
  /** Whether field is required */
  required?: boolean
  /** Whether switch is disabled */
  disabled?: boolean
  /** Value when switch is on */
  checkedValue?: any
  /** Value when switch is off */
  uncheckedValue?: any
  /** Whether to show status indicator */
  showStatus?: boolean
  /** Text to show when switch is on */
  onText?: string
  /** Text to show when switch is off */
  offText?: string
  /** Switch group options (for multiple switches) */
  options?: SwitchOption[]
  /** Custom CSS classes for the field wrapper */
  fieldClass?: string
  /** Custom CSS classes for the switch container */
  containerClass?: string
  /** Custom CSS classes for the switch */
  class?: string
}

const props = withDefaults(defineProps<FormSwitchProps>(), {
  checkedValue: true,
  uncheckedValue: false,
  onText: 'On',
  offText: 'Off',
  options: () => []
})

// Field management
const field = useField(props.name)

// Determine if this is a group of switches
const isGroup = computed(() => props.options && props.options.length > 0)

// Single switch logic
const isChecked = computed(() => {
  if (isGroup.value) return false
  return field.value.value === props.checkedValue
})

const handleChange = (checked: boolean) => {
  field.handleChange(checked ? props.checkedValue : props.uncheckedValue)
}

// Status text for single switch
const statusText = computed(() => {
  return isChecked.value ? props.onText : props.offText
})

// Group switch logic
const normalizedOptions = computed((): SwitchOption[] => {
  return props.options.map(option => ({
    key: option.key,
    label: option.label,
    description: option.description,
    disabled: option.disabled || false,
    showStatus: option.showStatus || false,
    onText: option.onText || props.onText,
    offText: option.offText || props.offText
  }))
})

const currentGroupValue = computed(() => {
  const value = field.value.value
  if (typeof value === 'object' && value !== null) return value
  return {}
})

const isOptionChecked = (optionKey: string): boolean => {
  return currentGroupValue.value[optionKey] === true
}

const handleGroupChange = (optionKey: string, checked: boolean) => {
  const currentValues = { ...currentGroupValue.value }
  currentValues[optionKey] = checked
  field.handleChange(currentValues)
}

// Expose field for template refs
defineExpose({
  field,
  toggle: () => {
    if (!isGroup.value) {
      handleChange(!isChecked.value)
    }
  },
  turnOn: () => {
    if (!isGroup.value) {
      handleChange(true)
    }
  },
  turnOff: () => {
    if (!isGroup.value) {
      handleChange(false)
    }
  },
  isChecked: isGroup.value ? undefined : isChecked,
  groupValues: isGroup.value ? currentGroupValue : undefined
})
</script>