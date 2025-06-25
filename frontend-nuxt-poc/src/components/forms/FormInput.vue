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
      <!-- Input with Prefix/Suffix -->
      <div class="relative">
        <!-- Prefix -->
        <div
          v-if="prefix || $slots.prefix"
          class="absolute left-0 top-0 h-full flex items-center pl-3 text-muted-foreground"
        >
          <slot name="prefix">
            <span class="text-sm">{{ prefix }}</span>
          </slot>
        </div>

        <!-- Main Input -->
        <Input
          :id="fieldId"
          :name="field.name"
          :value="field.value"
          :type="type"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :maxlength="maxlength"
          :minlength="minlength"
          :pattern="pattern"
          :step="step"
          :min="min"
          :max="max"
          :class="cn(
            inputClasses,
            hasError && 'border-destructive focus-visible:ring-destructive',
            prefix && 'pl-12',
            suffix && 'pr-12',
            props.class
          )"
          :aria-describedby="describedBy"
          :aria-required="isRequired"
          :aria-invalid="hasError"
          @input="handleInput"
          @blur="field.handleBlur"
          @focus="$emit('focus', $event)"
          @keydown="$emit('keydown', $event)"
          @keyup="$emit('keyup', $event)"
        />

        <!-- Suffix -->
        <div
          v-if="suffix || $slots.suffix"
          class="absolute right-0 top-0 h-full flex items-center pr-3 text-muted-foreground"
        >
          <slot name="suffix">
            <span class="text-sm">{{ suffix }}</span>
          </slot>
        </div>

        <!-- Show/Hide Password Toggle -->
        <button
          v-if="type === 'password' && showPasswordToggle"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          @click="togglePasswordVisibility"
        >
          <Eye v-if="showPassword" class="h-4 w-4" />
          <EyeOff v-else class="h-4 w-4" />
        </button>
      </div>
    </template>
  </FormFieldWrapper>
</template>

<script setup lang="ts">
import { computed, ref, type HTMLAttributes } from 'vue'
import { useField } from '~/composables/form/useField'
import { Input } from '~/components/ui/input'
import { Eye, EyeOff } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import type { FormFieldSlotProps } from './FormFieldWrapper.vue'

/**
 * FormInput component props
 */
export interface FormInputProps extends /* @vue-ignore */ HTMLAttributes {
  /** Field name for validation */
  name: string
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'number'
  /** Field label */
  label?: string
  /** Field description/hint */
  description?: string
  /** Help text */
  helpText?: string
  /** Warning message (non-blocking) */
  warning?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is readonly */
  readonly?: boolean
  /** Maximum length */
  maxlength?: number
  /** Minimum length */
  minlength?: number
  /** Input pattern (regex) */
  pattern?: string
  /** Step for number inputs */
  step?: string | number
  /** Minimum value for number inputs */
  min?: string | number
  /** Maximum value for number inputs */
  max?: string | number
  /** Prefix text or icon */
  prefix?: string
  /** Suffix text or icon */
  suffix?: string
  /** Whether to show password toggle for password inputs */
  showPasswordToggle?: boolean
  /** Custom CSS classes for the field wrapper */
  fieldClass?: string
  /** Custom CSS classes for the input */
  class?: string
  /** Input mask pattern */
  mask?: string
}

const props = withDefaults(defineProps<FormInputProps>(), {
  type: 'text',
  showPasswordToggle: true
})

const emit = defineEmits<{
  focus: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
  keyup: [event: KeyboardEvent]
}>()

// Field management
const field = useField(props.name)
const showPassword = ref(false)

// Password visibility toggle
const actualType = computed(() => {
  if (props.type === 'password' && showPassword.value) {
    return 'text'
  }
  return props.type
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Input masking and formatting
const applyMask = (value: string): string => {
  if (!props.mask) return value
  
  // Simple mask implementation for common patterns
  switch (props.mask) {
    case 'phone':
      // Format as XXX-XXXX-XXXX for Japanese phone numbers
      return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    case 'postal':
      // Format as XXX-XXXX for Japanese postal codes
      return value.replace(/(\d{3})(\d{4})/, '$1-$2')
    case 'credit-card':
      // Format as XXXX XXXX XXXX XXXX
      return value.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4')
    default:
      return value
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value

  // Apply masking if specified
  if (props.mask) {
    value = applyMask(value)
    target.value = value
  }

  // Update field value
  field.handleChange(value)
}

// Styling
const inputClasses = computed(() => {
  const classes = []
  
  if (props.type === 'number') {
    classes.push('text-right')
  }
  
  return classes.join(' ')
})

// Expose field for template refs
defineExpose({
  field,
  focus: () => {
    // Focus logic would need DOM ref
  },
  blur: () => {
    // Blur logic would need DOM ref
  }
})
</script>