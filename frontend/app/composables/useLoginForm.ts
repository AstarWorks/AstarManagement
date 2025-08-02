/**
 * Login Form Composable
 * Simple over Easy: Encapsulates form state, validation, and submission logic
 * Following the "Single Responsibility Principle"
 */

import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { loginSchema } from '~/schemas/auth'
import type { ILoginCredentials } from '~/types/auth'

export interface UseLoginFormOptions {
  /** Initial form values */
  initialValues?: Partial<ILoginCredentials>
  /** Whether to enable auto-fill for development */
  enableDebugFill?: boolean
  /** Custom validation schema override */
  validationSchema?: any
}

export interface UseLoginFormReturn {
  /** VeeValidate form instance */
  form: ReturnType<typeof useForm>
  /** Computed form validity state */
  isValid: ComputedRef<boolean>
  /** Form submission handler */
  onSubmit: (callback: (values: ILoginCredentials) => void) => (e?: Event) => void
  /** Fill form with credentials (for development) */
  fillCredentials: (credentials: ILoginCredentials) => void
  /** Reset form to initial state */
  resetForm: () => void
  /** Get current form values */
  getValues: () => ILoginCredentials
  /** Set specific field value */
  setFieldValue: (field: keyof ILoginCredentials, value: any) => void
}

/**
 * Login form composable with enhanced functionality
 */
export const useLoginForm = (options: UseLoginFormOptions = {}): UseLoginFormReturn => {
  const {
    initialValues = {
      email: '',
      password: '',
      rememberMe: false,
    },
    enableDebugFill = false,
    validationSchema = toTypedSchema(loginSchema)
  } = options

  // Form setup with VeeValidate
  const form = useForm({
    validationSchema,
    initialValues,
  })

  // Computed form validity
  const isValid = computed(() => form.meta.value.valid)

  // Type-safe submission handler
  const onSubmit = (callback: (values: ILoginCredentials) => void) => {
    return form.handleSubmit((values) => {
      callback({
        email: values.email || '',
        password: values.password || '',
        rememberMe: values.rememberMe || false,
      })
    })
  }

  // Fill credentials (development/testing)
  const fillCredentials = (credentials: ILoginCredentials) => {
    if (enableDebugFill || process.env.NODE_ENV === 'development') {
      form.setValues(credentials)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    form.resetForm()
  }

  // Get current form values
  const getValues = (): ILoginCredentials => {
    const values = form.values
    return {
      email: values.email ?? '',
      password: values.password ?? '',
      rememberMe: values.rememberMe ?? false,
    }
  }

  // Set specific field value
  const setFieldValue = (field: keyof ILoginCredentials, value: any) => {
    form.setFieldValue(field, value)
  }

  return {
    form,
    isValid,
    onSubmit,
    fillCredentials,
    resetForm,
    getValues,
    setFieldValue,
  }
}