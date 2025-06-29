// Global type augmentation for Vue template slot props
import type { FieldInstance } from '~/composables/form/useField'

declare global {
  interface FormFieldSlotProps {
    field: FieldInstance
    fieldId: string
    hasError: boolean
    errorMessage: string
    isRequired: boolean
    describedBy: string
  }
}

export {}