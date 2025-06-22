import { computed, reactive } from 'vue'
import type { FormField } from './useFormField'

export interface FormOptions {
  onSubmit?: (data: Record<string, any>) => void | Promise<void>
}

export interface Form {
  fields: Record<string, FormField>
  isValid: ComputedRef<boolean>
  isDirty: ComputedRef<boolean>
  errors: ComputedRef<Record<string, string | null>>
  values: ComputedRef<Record<string, any>>
  addField: (name: string, field: FormField) => void
  removeField: (name: string) => void
  validate: () => boolean
  reset: () => void
  submit: () => Promise<void>
  setFieldError: (name: string, error: string) => void
  clearFieldError: (name: string) => void
}

export const useForm = (options: FormOptions = {}): Form => {
  const { onSubmit } = options
  const fields = reactive<Record<string, FormField>>({})

  const isValid = computed(() => {
    return Object.values(fields).every(field => field.isValid.value)
  })

  const isDirty = computed(() => {
    return Object.values(fields).some(field => field.isDirty.value)
  })

  const errors = computed(() => {
    const result: Record<string, string | null> = {}
    Object.entries(fields).forEach(([name, field]) => {
      result[name] = field.error.value
    })
    return result
  })

  const values = computed(() => {
    const result: Record<string, any> = {}
    Object.entries(fields).forEach(([name, field]) => {
      result[name] = field.value.value
    })
    return result
  })

  const addField = (name: string, field: FormField) => {
    fields[name] = field
  }

  const removeField = (name: string) => {
    delete fields[name]
  }

  const validate = (): boolean => {
    let isFormValid = true
    
    Object.values(fields).forEach(field => {
      field.touch()
      const fieldValid = field.validate()
      if (!fieldValid) {
        isFormValid = false
      }
    })

    return isFormValid
  }

  const reset = () => {
    Object.values(fields).forEach(field => {
      field.reset()
    })
  }

  const submit = async () => {
    if (!validate()) {
      return
    }

    if (onSubmit) {
      await onSubmit(values.value)
    }
  }

  const setFieldError = (name: string, error: string) => {
    if (fields[name]) {
      fields[name].error.value = error
    }
  }

  const clearFieldError = (name: string) => {
    if (fields[name]) {
      fields[name].error.value = null
    }
  }

  return {
    fields,
    isValid,
    isDirty,
    errors,
    values,
    addField,
    removeField,
    validate,
    reset,
    submit,
    setFieldError,
    clearFieldError
  }
}