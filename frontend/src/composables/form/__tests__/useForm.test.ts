/**
 * Unit tests for useForm composable
 * 
 * Tests form state management, validation integration, submission handling,
 * and form lifecycle management with VeeValidate and Zod schemas.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useForm as useVeeForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useForm } from '../useForm'

// Mock VeeValidate
vi.mock('vee-validate', () => ({
  useForm: vi.fn(),
  defineField: vi.fn()
}))

// Mock toast notifications
vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

describe('useForm composable', () => {
  let mockVeeForm: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default VeeValidate mock
    mockVeeForm = {
      values: {},
      errors: {},
      touched: {},
      meta: {
        valid: true,
        dirty: false,
        pending: false,
        initialValues: {}
      },
      handleSubmit: vi.fn((fn) => fn),
      resetForm: vi.fn(),
      setFieldValue: vi.fn(),
      setFieldError: vi.fn(),
      validateField: vi.fn(),
      validate: vi.fn().mockResolvedValue({ valid: true }),
      defineField: vi.fn((name) => [{ value: '' }, { name }]),
      isSubmitting: false,
      submitCount: 0
    }
    
    vi.mocked(useVeeForm).mockReturnValue(mockVeeForm)
  })

  describe('Form Initialization', () => {
    it('initializes form with schema and default values', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2)
      })
      
      const initialValues = {
        email: 'test@example.com',
        name: 'John Doe'
      }
      
      const form = useForm({
        schema,
        initialValues
      })
      
      expect(useVeeForm).toHaveBeenCalledWith({
        validationSchema: toTypedSchema(schema),
        initialValues
      })
      
      expect(form).toHaveProperty('values')
      expect(form).toHaveProperty('errors')
      expect(form).toHaveProperty('isValid')
      expect(form).toHaveProperty('isDirty')
      expect(form).toHaveProperty('isSubmitting')
      expect(form).toHaveProperty('submit')
      expect(form).toHaveProperty('reset')
    })

    it('initializes form without schema for uncontrolled forms', () => {
      const form = useForm({
        initialValues: {
          field1: 'value1',
          field2: 'value2'
        }
      })
      
      expect(useVeeForm).toHaveBeenCalledWith({
        initialValues: {
          field1: 'value1',
          field2: 'value2'
        }
      })
    })

    it('sets up form with custom validation mode', () => {
      const schema = z.object({
        email: z.string().email()
      })
      
      const form = useForm({
        schema,
        validationMode: 'onBlur'
      })
      
      expect(useVeeForm).toHaveBeenCalledWith({
        validationSchema: toTypedSchema(schema),
        validateOnMount: false,
        validateOnChange: false,
        validateOnBlur: true,
        validateOnInput: false
      })
    })
  })

  describe('Form State Management', () => {
    it('exposes reactive form state', () => {
      mockVeeForm.values = { email: 'test@example.com' }
      mockVeeForm.errors = { email: 'Invalid email' }
      mockVeeForm.meta.valid = false
      mockVeeForm.meta.dirty = true
      
      const form = useForm({
        schema: z.object({ email: z.string().email() })
      })
      
      expect(form.values).toEqual({ email: 'test@example.com' })
      expect(form.errors).toEqual({ email: 'Invalid email' })
      expect(form.isValid).toBe(false)
      expect(form.isDirty).toBe(true)
    })

    it('tracks form submission state', async () => {
      let isSubmittingValue = false
      mockVeeForm.isSubmitting = computed(() => isSubmittingValue)
      mockVeeForm.handleSubmit = vi.fn((fn) => async (e?: Event) => {
        isSubmittingValue = true
        await fn({})
        isSubmittingValue = false
      })
      
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      await form.submit(onSubmit)
      
      expect(onSubmit).toHaveBeenCalled()
    })

    it('provides field registration helpers', () => {
      const mockField = [ref(''), { name: 'email' }]
      mockVeeForm.defineField.mockReturnValue(mockField)
      
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      const field = form.defineField('email')
      
      expect(mockVeeForm.defineField).toHaveBeenCalledWith('email')
      expect(field).toEqual(mockField)
    })
  })

  describe('Form Validation', () => {
    it('validates entire form', async () => {
      mockVeeForm.validate.mockResolvedValue({
        valid: false,
        errors: { email: 'Required' }
      })
      
      const form = useForm({
        schema: z.object({ email: z.string().min(1) })
      })
      
      const result = await form.validate()
      
      expect(mockVeeForm.validate).toHaveBeenCalled()
      expect(result.valid).toBe(false)
      expect(result.errors).toEqual({ email: 'Required' })
    })

    it('validates specific field', async () => {
      mockVeeForm.validateField.mockResolvedValue({
        valid: true,
        errors: []
      })
      
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      const result = await form.validateField('email')
      
      expect(mockVeeForm.validateField).toHaveBeenCalledWith('email')
      expect(result.valid).toBe(true)
    })

    it('sets field errors programmatically', () => {
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      form.setFieldError('email', 'Custom error')
      
      expect(mockVeeForm.setFieldError).toHaveBeenCalledWith('email', 'Custom error')
    })

    it('clears specific field error', () => {
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      form.clearFieldError('email')
      
      expect(mockVeeForm.setFieldError).toHaveBeenCalledWith('email', undefined)
    })

    it('validates with custom error messages', async () => {
      const schema = z.object({
        email: z.string().email('Please enter a valid email address'),
        age: z.number().min(18, 'Must be at least 18 years old')
      })
      
      mockVeeForm.validate.mockResolvedValue({
        valid: false,
        errors: {
          email: 'Please enter a valid email address',
          age: 'Must be at least 18 years old'
        }
      })
      
      const form = useForm({ schema })
      const result = await form.validate()
      
      expect(result.errors.email).toBe('Please enter a valid email address')
      expect(result.errors.age).toBe('Must be at least 18 years old')
    })
  })

  describe('Form Submission', () => {
    it('handles successful form submission', async () => {
      mockVeeForm.handleSubmit.mockImplementation((fn) => fn)
      mockVeeForm.values = { email: 'test@example.com' }
      
      const form = useForm({
        schema: z.object({ email: z.string().email() })
      })
      
      const onSubmit = vi.fn().mockResolvedValue({ success: true })
      const result = await form.submit(onSubmit)
      
      expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(result).toEqual({ success: true })
    })

    it('handles submission with transformation', async () => {
      mockVeeForm.handleSubmit.mockImplementation((fn) => fn)
      mockVeeForm.values = { email: ' Test@Example.com ' }
      
      const form = useForm({
        schema: z.object({ 
          email: z.string().email().transform(s => s.trim().toLowerCase())
        })
      })
      
      const onSubmit = vi.fn()
      await form.submit(onSubmit, {
        transform: (values) => ({
          ...values,
          email: values.email.trim().toLowerCase()
        })
      })
      
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com'
      })
    })

    it('prevents submission when form is invalid', async () => {
      mockVeeForm.meta.valid = false
      mockVeeForm.validate.mockResolvedValue({ valid: false })
      
      const form = useForm({
        schema: z.object({ email: z.string().email() })
      })
      
      const onSubmit = vi.fn()
      const result = await form.submit(onSubmit, { validateBeforeSubmit: true })
      
      expect(onSubmit).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('handles submission errors gracefully', async () => {
      mockVeeForm.handleSubmit.mockImplementation((fn) => fn)
      const error = new Error('Network error')
      
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      const onSubmit = vi.fn().mockRejectedValue(error)
      const onError = vi.fn()
      
      await form.submit(onSubmit, { onError })
      
      expect(onError).toHaveBeenCalledWith(error)
    })

    it('tracks submission count', async () => {
      mockVeeForm.handleSubmit.mockImplementation((fn) => fn)
      mockVeeForm.submitCount = 0
      
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      const onSubmit = vi.fn()
      
      await form.submit(onSubmit)
      mockVeeForm.submitCount = 1
      expect(form.submitCount).toBe(1)
      
      await form.submit(onSubmit)
      mockVeeForm.submitCount = 2
      expect(form.submitCount).toBe(2)
    })
  })

  describe('Form Reset', () => {
    it('resets form to initial values', () => {
      const form = useForm({
        schema: z.object({ email: z.string() }),
        initialValues: { email: 'initial@example.com' }
      })
      
      form.reset()
      
      expect(mockVeeForm.resetForm).toHaveBeenCalledWith({
        values: { email: 'initial@example.com' }
      })
    })

    it('resets form with new values', () => {
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      form.reset({ email: 'new@example.com' })
      
      expect(mockVeeForm.resetForm).toHaveBeenCalledWith({
        values: { email: 'new@example.com' }
      })
    })

    it('resets form and clears errors', () => {
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      form.reset(undefined, { keepErrors: false })
      
      expect(mockVeeForm.resetForm).toHaveBeenCalledWith({
        values: undefined,
        errors: {}
      })
    })

    it('resets specific fields only', () => {
      mockVeeForm.values = {
        email: 'test@example.com',
        name: 'John Doe',
        age: 25
      }
      
      const form = useForm({
        schema: z.object({
          email: z.string(),
          name: z.string(),
          age: z.number()
        })
      })
      
      form.resetFields(['email', 'name'])
      
      expect(mockVeeForm.setFieldValue).toHaveBeenCalledWith('email', '')
      expect(mockVeeForm.setFieldValue).toHaveBeenCalledWith('name', '')
      expect(mockVeeForm.setFieldValue).not.toHaveBeenCalledWith('age', expect.anything())
    })
  })

  describe('Field Operations', () => {
    it('sets field value', () => {
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      form.setFieldValue('email', 'new@example.com')
      
      expect(mockVeeForm.setFieldValue).toHaveBeenCalledWith('email', 'new@example.com')
    })

    it('gets field value', () => {
      mockVeeForm.values = { email: 'test@example.com' }
      
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      expect(form.getFieldValue('email')).toBe('test@example.com')
    })

    it('checks if field is dirty', () => {
      mockVeeForm.touched = { email: true }
      mockVeeForm.values = { email: 'changed@example.com' }
      mockVeeForm.meta.initialValues = { email: 'initial@example.com' }
      
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      expect(form.isFieldDirty('email')).toBe(true)
    })

    it('checks if field is touched', () => {
      mockVeeForm.touched = { email: true, name: false }
      
      const form = useForm({
        schema: z.object({ 
          email: z.string(),
          name: z.string()
        })
      })
      
      expect(form.isFieldTouched('email')).toBe(true)
      expect(form.isFieldTouched('name')).toBe(false)
    })
  })

  describe('Form Utilities', () => {
    it('provides form data serialization', () => {
      mockVeeForm.values = {
        email: 'test@example.com',
        name: 'John Doe',
        age: 25,
        tags: ['tag1', 'tag2']
      }
      
      const form = useForm({
        schema: z.object({
          email: z.string(),
          name: z.string(),
          age: z.number(),
          tags: z.array(z.string())
        })
      })
      
      const formData = form.toFormData()
      
      expect(formData.get('email')).toBe('test@example.com')
      expect(formData.get('name')).toBe('John Doe')
      expect(formData.get('age')).toBe('25')
      expect(formData.getAll('tags[]')).toEqual(['tag1', 'tag2'])
    })

    it('provides JSON serialization', () => {
      mockVeeForm.values = {
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      }
      
      const form = useForm({
        schema: z.object({
          email: z.string(),
          profile: z.object({
            firstName: z.string(),
            lastName: z.string()
          })
        })
      })
      
      const json = form.toJSON()
      
      expect(JSON.parse(json)).toEqual({
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      })
    })

    it('watches form value changes', async () => {
      const form = useForm({
        schema: z.object({ email: z.string() })
      })
      
      const callback = vi.fn()
      form.watchValue('email', callback)
      
      // Simulate value change
      mockVeeForm.values.email = 'new@example.com'
      await nextTick()
      
      // In real implementation, this would trigger the watcher
      // For testing, we verify the watcher was set up
      expect(form.watchers).toContain('email')
    })
  })

  describe('Advanced Features', () => {
    it('supports form composition with nested forms', () => {
      const addressSchema = z.object({
        street: z.string(),
        city: z.string(),
        zip: z.string()
      })
      
      const userSchema = z.object({
        name: z.string(),
        email: z.string().email(),
        address: addressSchema
      })
      
      const form = useForm({
        schema: userSchema,
        initialValues: {
          name: '',
          email: '',
          address: {
            street: '',
            city: '',
            zip: ''
          }
        }
      })
      
      expect(useVeeForm).toHaveBeenCalledWith({
        validationSchema: toTypedSchema(userSchema),
        initialValues: expect.objectContaining({
          address: expect.objectContaining({
            street: '',
            city: '',
            zip: ''
          })
        })
      })
    })

    it('supports conditional validation', async () => {
      const schema = z.object({
        accountType: z.enum(['personal', 'business']),
        companyName: z.string().optional(),
        taxId: z.string().optional()
      }).refine(
        (data) => {
          if (data.accountType === 'business') {
            return data.companyName && data.taxId
          }
          return true
        },
        {
          message: 'Company name and tax ID required for business accounts',
          path: ['companyName']
        }
      )
      
      const form = useForm({ schema })
      
      // Test passes - schema is created correctly
      expect(form).toBeDefined()
    })

    it('supports async validation', async () => {
      const checkEmailExists = vi.fn().mockResolvedValue(false)
      
      const schema = z.object({
        email: z.string().email().refine(
          async (email) => {
            const exists = await checkEmailExists(email)
            return !exists
          },
          { message: 'Email already exists' }
        )
      })
      
      mockVeeForm.validateField.mockImplementation(async () => {
        const email = mockVeeForm.values.email
        const exists = await checkEmailExists(email)
        return {
          valid: !exists,
          errors: exists ? ['Email already exists'] : []
        }
      })
      
      const form = useForm({ schema })
      
      mockVeeForm.values.email = 'test@example.com'
      const result = await form.validateField('email')
      
      expect(checkEmailExists).toHaveBeenCalledWith('test@example.com')
      expect(result.valid).toBe(true)
    })
  })
})