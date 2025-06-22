import { computed, ref } from 'vue'
import type { Ref } from 'vue'

export interface FormFieldOptions {
  initialValue?: any
  required?: boolean
  validate?: (value: any) => string | null
}

export interface FormField {
  value: Ref<any>
  error: Ref<string | null>
  isDirty: Ref<boolean>
  isValid: Ref<boolean>
  required: boolean
  touch: () => void
  validate: () => boolean
  reset: () => void
}

export const useFormField = (options: FormFieldOptions = {}): FormField => {
  const {
    initialValue = '',
    required = false,
    validate
  } = options

  const value = ref(initialValue)
  const error = ref<string | null>(null)
  const isDirty = ref(false)

  const isValid = computed(() => error.value === null)

  const touch = () => {
    isDirty.value = true
  }

  const validateField = (): boolean => {
    // Clear previous error
    error.value = null

    // Check required
    if (required && (!value.value || value.value === '')) {
      error.value = 'This field is required'
      return false
    }

    // Custom validation
    if (validate && value.value) {
      const validationError = validate(value.value)
      if (validationError) {
        error.value = validationError
        return false
      }
    }

    return true
  }

  const reset = () => {
    value.value = initialValue
    error.value = null
    isDirty.value = false
  }

  return {
    value,
    error,
    isDirty,
    isValid,
    required,
    touch,
    validate: validateField,
    reset
  }
}