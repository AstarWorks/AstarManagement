/**
 * Form Testing Utilities
 * 
 * Comprehensive testing utilities for form components, validation scenarios, and form workflows.
 * Provides mock data, mounting helpers, validation testing, and accessibility utilities.
 */

/// <reference types="vitest/globals" />

// Import vi explicitly for better TypeScript support
import { vi } from 'vitest'
import { mount, shallowMount, type VueWrapper, type MountingOptions } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ref } from 'vue'
import type { App } from 'vue'

// ===== FORM DATA FACTORIES =====

/**
 * Interface for form test data
 */
export interface FormTestData {
  id: string
  values: Record<string, any>
  errors?: Record<string, string[]>
  isValid?: boolean
  isDirty?: boolean
  isSubmitting?: boolean
}

/**
 * Interface for validation test case
 */
export interface ValidationTestCase {
  name: string
  input: any
  expected: {
    valid: boolean
    errors?: string[]
  }
  description?: string
}

/**
 * Creates mock form data for testing
 */
export function createMockFormData(overrides: Partial<FormTestData> = {}): FormTestData {
  const baseId = Math.random().toString(36).substr(2, 9)
  
  return {
    id: `form-${baseId}`,
    values: {
      title: 'Test Form Title',
      description: 'Test form description content',
      email: 'test@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15',
      phone: '+1-555-123-4567',
      address: '123 Test Street',
      city: 'Test City',
      country: 'United States',
      termsAccepted: true,
      newsletter: false,
      priority: 'medium',
      status: 'draft'
    },
    errors: {},
    isValid: true,
    isDirty: false,
    isSubmitting: false,
    ...overrides
  }
}

/**
 * Creates mock legal matter form data
 */
export function createMockMatterFormData(overrides: Partial<any> = {}) {
  return {
    id: `matter-form-${Math.random().toString(36).substr(2, 9)}`,
    values: {
      caseNumber: 'CASE-2025-001',
      title: 'Personal Injury Case',
      titleJa: '人身傷害事件',
      clientName: 'John Smith',
      clientNameJa: 'ジョン・スミス',
      clientEmail: 'john.smith@example.com',
      clientPhone: '+1-555-123-4567',
      description: 'Motor vehicle accident resulting in personal injury',
      descriptionJa: '人身傷害を伴う自動車事故',
      priority: 'HIGH',
      status: 'intake',
      assignedTo: 'lawyer-001',
      dueDate: '2025-07-15',
      estimatedHours: 40,
      billableRate: 350,
      tags: ['motor-vehicle', 'personal-injury'],
      documents: [],
      notes: 'Initial consultation completed'
    },
    ...overrides
  }
}

/**
 * Creates mock user registration form data
 */
export function createMockUserRegistrationData(overrides: Partial<any> = {}) {
  return {
    id: `user-registration-${Math.random().toString(36).substr(2, 9)}`,
    values: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      role: 'lawyer',
      department: 'litigation',
      phone: '+1-555-987-6543',
      licenseNumber: 'LAW-12345',
      barAdmission: '2020-05-15',
      specializations: ['personal-injury', 'corporate-law'],
      languagesSpoken: ['en', 'ja'],
      officeLocation: 'tokyo-main',
      emergencyContact: {
        name: 'John Smith',
        relationship: 'spouse',
        phone: '+1-555-123-4567'
      },
      twoFactorEnabled: true,
      termsAccepted: true,
      privacyPolicyAccepted: true,
      marketingOptIn: false
    },
    ...overrides
  }
}

/**
 * Creates validation test cases for different scenarios
 */
export function createValidationTestCases(): Record<string, ValidationTestCase[]> {
  return {
    email: [
      {
        name: 'valid_email',
        input: 'test@example.com',
        expected: { valid: true },
        description: 'Valid email format'
      },
      {
        name: 'invalid_email_no_at',
        input: 'testexample.com',
        expected: { valid: false, errors: ['Invalid email format'] },
        description: 'Email missing @ symbol'
      },
      {
        name: 'invalid_email_no_domain',
        input: 'test@',
        expected: { valid: false, errors: ['Invalid email format'] },
        description: 'Email missing domain'
      },
      {
        name: 'empty_email',
        input: '',
        expected: { valid: false, errors: ['Email is required'] },
        description: 'Empty email field'
      }
    ],
    password: [
      {
        name: 'valid_password',
        input: 'SecurePassword123!',
        expected: { valid: true },
        description: 'Valid password with requirements'
      },
      {
        name: 'too_short',
        input: 'Weak1!',
        expected: { valid: false, errors: ['Password must be at least 8 characters'] },
        description: 'Password too short'
      },
      {
        name: 'no_uppercase',
        input: 'securepassword123!',
        expected: { valid: false, errors: ['Password must contain uppercase letter'] },
        description: 'Password missing uppercase letter'
      },
      {
        name: 'no_lowercase',
        input: 'SECUREPASSWORD123!',
        expected: { valid: false, errors: ['Password must contain lowercase letter'] },
        description: 'Password missing lowercase letter'
      },
      {
        name: 'no_number',
        input: 'SecurePassword!',
        expected: { valid: false, errors: ['Password must contain a number'] },
        description: 'Password missing number'
      },
      {
        name: 'no_special_char',
        input: 'SecurePassword123',
        expected: { valid: false, errors: ['Password must contain special character'] },
        description: 'Password missing special character'
      }
    ],
    phone: [
      {
        name: 'valid_phone_us',
        input: '+1-555-123-4567',
        expected: { valid: true },
        description: 'Valid US phone number'
      },
      {
        name: 'valid_phone_japan',
        input: '+81-3-1234-5678',
        expected: { valid: true },
        description: 'Valid Japan phone number'
      },
      {
        name: 'invalid_phone_format',
        input: '123-abc-defg',
        expected: { valid: false, errors: ['Invalid phone number format'] },
        description: 'Invalid phone number with letters'
      },
      {
        name: 'invalid_phone_short',
        input: '123',
        expected: { valid: false, errors: ['Phone number too short'] },
        description: 'Phone number too short'
      }
    ],
    date: [
      {
        name: 'valid_date',
        input: '2025-06-15',
        expected: { valid: true },
        description: 'Valid date format'
      },
      {
        name: 'invalid_date_format',
        input: '06/15/2025',
        expected: { valid: false, errors: ['Invalid date format'] },
        description: 'Invalid date format'
      },
      {
        name: 'invalid_date_future',
        input: '2030-12-31',
        expected: { valid: false, errors: ['Date cannot be in the future'] },
        description: 'Date in the future when not allowed'
      }
    ],
    required: [
      {
        name: 'field_present',
        input: 'Test Value',
        expected: { valid: true },
        description: 'Required field with value'
      },
      {
        name: 'field_empty_string',
        input: '',
        expected: { valid: false, errors: ['This field is required'] },
        description: 'Required field empty string'
      },
      {
        name: 'field_whitespace',
        input: '   ',
        expected: { valid: false, errors: ['This field is required'] },
        description: 'Required field with only whitespace'
      },
      {
        name: 'field_null',
        input: null,
        expected: { valid: false, errors: ['This field is required'] },
        description: 'Required field with null value'
      },
      {
        name: 'field_undefined',
        input: undefined,
        expected: { valid: false, errors: ['This field is required'] },
        description: 'Required field with undefined value'
      }
    ]
  }
}

// ===== MOCK COMPOSABLES =====

/**
 * Creates mock VeeValidate form
 */
export function createMockVeeValidateForm(overrides: Record<string, any> = {}) {
  const mockField = () => ({
    value: ref(''),
    errorMessage: ref(''),
    meta: ref({ valid: true, dirty: false, touched: false }),
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    resetField: vi.fn(),
    setValue: vi.fn(),
    setTouched: vi.fn(),
    ...overrides.field
  })

  const mockForm = () => ({
    handleSubmit: vi.fn((fn) => vi.fn(fn)),
    resetForm: vi.fn(),
    setFieldValue: vi.fn(),
    setFieldError: vi.fn(),
    defineField: vi.fn(() => [ref(''), {}]),
    errors: ref({}),
    meta: ref({ valid: true, dirty: false }),
    values: ref({}),
    isSubmitting: ref(false),
    validate: vi.fn(),
    validateField: vi.fn(),
    setErrors: vi.fn(),
    setValues: vi.fn(),
    ...overrides.form
  })

  return {
    useForm: vi.fn(mockForm),
    useField: vi.fn(mockField),
    useFormContext: vi.fn(() => mockForm()),
    useFormValues: vi.fn(() => ref({})),
    useFormErrors: vi.fn(() => ref({})),
    useIsFormValid: vi.fn(() => ref(true))
  }
}

/**
 * Creates mock form utilities
 */
export function createMockFormUtilities(overrides: Record<string, any> = {}) {
  return {
    useFormState: vi.fn(() => ({
      isDirty: ref(false),
      isValid: ref(true),
      isSubmitting: ref(false),
      canSubmit: ref(true),
      resetState: vi.fn(),
      ...overrides.state
    })),
    useAutoSave: vi.fn(() => ({
      isAutoSaving: ref(false),
      lastSaved: ref(null),
      autoSaveEnabled: ref(true),
      saveNow: vi.fn(),
      enableAutoSave: vi.fn(),
      disableAutoSave: vi.fn(),
      ...overrides.autoSave
    })),
    useConditionalField: vi.fn(() => ({
      isVisible: ref(true),
      isRequired: ref(false),
      conditions: ref([]),
      evaluateConditions: vi.fn(),
      ...overrides.conditional
    }))
  }
}

/**
 * Creates mock Zod schemas
 */
export function createMockZodSchemas() {
  return {
    matterSchema: z.object({
      title: z.string().min(1, 'Title is required').max(100),
      description: z.string().optional(),
      clientEmail: z.string().email('Invalid email format'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      dueDate: z.date().optional(),
      assignedTo: z.string().uuid().optional()
    }),
    userRegistrationSchema: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email format'),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain uppercase letter')
        .regex(/[a-z]/, 'Password must contain lowercase letter')
        .regex(/[0-9]/, 'Password must contain a number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
      confirmPassword: z.string(),
      phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
      termsAccepted: z.literal(true, { 
        errorMap: () => ({ message: 'You must accept the terms and conditions' })
      })
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword']
    })
  }
}

// ===== COMPONENT MOUNTING HELPERS =====

/**
 * Configuration for form component mounting
 */
export interface FormMountingOptions extends Partial<MountingOptions<any>> {
  pinia?: Pinia
  formData?: FormTestData
  validationSchema?: any
  mockComposables?: Record<string, any>
  mockValidation?: boolean
  shallow?: boolean
}

/**
 * Creates test Pinia instance for forms
 */
export function createFormTestPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * Mounts a form component with all necessary providers and mocks
 */
export function mountFormComponent(
  component: any,
  options: FormMountingOptions = {}
): VueWrapper<any> {
  const {
    pinia = createFormTestPinia(),
    formData = createMockFormData(),
    validationSchema,
    mockComposables = {},
    mockValidation = true,
    shallow = false,
    ...mountingOptions
  } = options

  // Set up global mocks for form components
  const globalMocks: Record<string, any> = {
    $t: (key: string) => key, // Mock i18n
    $route: { params: {}, query: {} },
    $router: { push: vi.fn(), replace: vi.fn() }
  }

  if (mockValidation) {
    // Add VeeValidate mocks to global mocks
    const mockField = {
      value: ref(''),
      errorMessage: ref(''),
      meta: ref({ valid: true, dirty: false, touched: false }),
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
      resetField: vi.fn(),
      setValue: vi.fn(),
      setTouched: vi.fn(),
      ...mockComposables.field
    }

    globalMocks.field = mockField
    globalMocks.useField = vi.fn(() => mockField)
    globalMocks.useForm = vi.fn(() => ({
      handleSubmit: vi.fn((fn) => vi.fn(fn)),
      resetForm: vi.fn(),
      setFieldValue: vi.fn(),
      setFieldError: vi.fn(),
      defineField: vi.fn(() => [ref(''), {}]),
      errors: ref({}),
      meta: ref({ valid: true, dirty: false }),
      values: ref({}),
      isSubmitting: ref(false),
      validate: vi.fn(),
      validateField: vi.fn(),
      setErrors: vi.fn(),
      setValues: vi.fn(),
      ...mockComposables.form
    }))
  }

  const mountFunction = shallow ? shallowMount : mount

  return mountFunction(component, {
    global: {
      plugins: [pinia],
      stubs: {
        Transition: false,
        TransitionGroup: false,
        NuxtLink: {
          template: '<a><slot /></a>',
          props: ['to', 'href']
        },
        RouterLink: {
          template: '<a><slot /></a>',
          props: ['to']
        },
        // Stub Form components
        FormFieldWrapper: {
          template: '<div class="form-field-wrapper-stub"><slot /></div>',
          props: ['label', 'name', 'required', 'error', 'description', 'hint']
        },
        ErrorMessage: {
          template: '<div class="error-message-stub">{{ error }}</div>',
          props: ['error', 'name']
        },
        // Stub shadcn-vue components
        Button: {
          template: '<button class="button-stub"><slot /></button>',
          props: ['variant', 'size', 'disabled']
        },
        Input: {
          template: '<input class="input-stub" v-bind="$attrs" />',
          props: ['type', 'placeholder', 'disabled', 'modelValue']
        },
        Textarea: {
          template: '<textarea class="textarea-stub" v-bind="$attrs"><slot /></textarea>',
          props: ['placeholder', 'disabled', 'rows', 'modelValue']
        },
        Select: {
          template: '<select class="select-stub" v-bind="$attrs"><slot /></select>',
          props: ['disabled', 'modelValue']
        },
        Checkbox: {
          template: '<input type="checkbox" class="checkbox-stub" v-bind="$attrs" />',
          props: ['checked', 'disabled', 'modelValue']
        }
      },
      mocks: globalMocks,
      ...mountingOptions.global
    },
    props: {
      modelValue: formData.values,
      ...mountingOptions.props
    },
    ...mountingOptions
  })
}

// ===== FORM INTERACTION HELPERS =====

/**
 * Simulates user input in a form field
 */
export async function simulateUserInput(
  wrapper: VueWrapper<any>,
  fieldSelector: string,
  value: any,
  eventType: 'input' | 'change' = 'input'
): Promise<void> {
  const field = wrapper.find(fieldSelector)
  
  if (!field.exists()) {
    throw new Error(`Field with selector "${fieldSelector}" not found`)
  }

  await field.setValue(value)
  await field.trigger(eventType)
  await wrapper.vm.$nextTick()
}

/**
 * Simulates form submission
 */
export async function simulateFormSubmit(
  wrapper: VueWrapper<any>,
  formSelector: string = 'form'
): Promise<void> {
  const form = wrapper.find(formSelector)
  
  if (!form.exists()) {
    throw new Error(`Form with selector "${formSelector}" not found`)
  }

  await form.trigger('submit.prevent')
  await wrapper.vm.$nextTick()
}

/**
 * Simulates multi-step form navigation
 */
export async function simulateMultiStepNavigation(
  wrapper: VueWrapper<any>,
  direction: 'next' | 'prev' | 'step',
  stepIndex?: number
): Promise<void> {
  let buttonSelector: string

  switch (direction) {
    case 'next':
      buttonSelector = '[data-testid="next-step"], .next-button'
      break
    case 'prev':
      buttonSelector = '[data-testid="prev-step"], .prev-button'
      break
    case 'step':
      buttonSelector = `[data-testid="step-${stepIndex}"], .step-button[data-step="${stepIndex}"]`
      break
  }

  const button = wrapper.find(buttonSelector)
  if (button.exists()) {
    await button.trigger('click')
    await wrapper.vm.$nextTick()
  }
}

/**
 * Fills out a complete form with test data
 */
export async function fillFormWithData(
  wrapper: VueWrapper<any>,
  formData: Record<string, any>
): Promise<void> {
  for (const [fieldName, value] of Object.entries(formData)) {
    const selectors = [
      `[name="${fieldName}"]`,
      `[data-testid="${fieldName}"]`,
      `#${fieldName}`,
      `.field-${fieldName} input`,
      `.field-${fieldName} textarea`,
      `.field-${fieldName} select`
    ]

    for (const selector of selectors) {
      const field = wrapper.find(selector)
      if (field.exists()) {
        await simulateUserInput(wrapper, selector, value)
        break
      }
    }
  }
}

// ===== VALIDATION TESTING HELPERS =====

/**
 * Tests field validation with multiple scenarios
 */
export async function testFieldValidation(
  wrapper: VueWrapper<any>,
  fieldSelector: string,
  testCases: ValidationTestCase[]
): Promise<void> {
  for (const testCase of testCases) {
    // Clear field first
    await simulateUserInput(wrapper, fieldSelector, '')
    
    // Set test value
    await simulateUserInput(wrapper, fieldSelector, testCase.input)
    
    // Trigger blur to activate validation
    const field = wrapper.find(fieldSelector)
    await field.trigger('blur')
    await wrapper.vm.$nextTick()

    // Check validation result
    const errorElements = wrapper.findAll('.error-message, .field-error, [role="alert"]')
    const hasErrors = errorElements.length > 0

    if (testCase.expected.valid) {
      expect(hasErrors).toBe(false)
    } else {
      expect(hasErrors).toBe(true)
      if (testCase.expected.errors) {
        const errorTexts = errorElements.map(el => el.text())
        testCase.expected.errors.forEach(expectedError => {
          expect(errorTexts.some(text => text.includes(expectedError))).toBe(true)
        })
      }
    }
  }
}

/**
 * Tests cross-field validation scenarios
 */
export async function testCrossFieldValidation(
  wrapper: VueWrapper<any>,
  fieldPairs: Array<{
    field1: { selector: string; value: any }
    field2: { selector: string; value: any }
    expectedValid: boolean
    expectedError?: string
  }>
): Promise<void> {
  for (const pair of fieldPairs) {
    // Fill both fields
    await simulateUserInput(wrapper, pair.field1.selector, pair.field1.value)
    await simulateUserInput(wrapper, pair.field2.selector, pair.field2.value)

    // Trigger validation
    await wrapper.find(pair.field2.selector).trigger('blur')
    await wrapper.vm.$nextTick()

    // Check validation result
    const errorElements = wrapper.findAll('.error-message, .field-error, [role="alert"]')
    const hasErrors = errorElements.length > 0

    expect(hasErrors).toBe(!pair.expectedValid)

    if (!pair.expectedValid && pair.expectedError) {
      const errorTexts = errorElements.map(el => el.text())
      expect(errorTexts.some(text => text.includes(pair.expectedError!))).toBe(true)
    }
  }
}

// ===== ACCESSIBILITY TESTING HELPERS =====

/**
 * Asserts form accessibility attributes
 */
export function assertFormAccessibility(
  wrapper: VueWrapper<any>,
  formSelector: string = 'form'
): void {
  const form = wrapper.find(formSelector)
  expect(form.exists()).toBe(true)

  // Check form has proper role and labeling
  expect(form.attributes('role')).toBeTruthy()
  expect(form.attributes('aria-label') || form.attributes('aria-labelledby')).toBeTruthy()

  // Check all form fields have labels
  const inputs = form.findAll('input, textarea, select')
  inputs.forEach((input, index) => {
    const inputElement = input.element as HTMLElement
    const id = inputElement.id
    const name = inputElement.getAttribute('name')
    
    // Should have associated label
    const labelByFor = wrapper.find(`label[for="${id}"]`)
    const labelByWrapping = input.element.closest('label')
    const ariaLabel = inputElement.getAttribute('aria-label')
    const ariaLabelledBy = inputElement.getAttribute('aria-labelledby')

    const hasLabel = labelByFor.exists() || labelByWrapping || ariaLabel || ariaLabelledBy
    expect(hasLabel).toBe(true)
  })
}

/**
 * Tests keyboard navigation in forms
 */
export async function testFormKeyboardNavigation(
  wrapper: VueWrapper<any>,
  expectedTabOrder: string[]
): Promise<void> {
  // Focus first element
  const firstElement = wrapper.find(expectedTabOrder[0])
  await firstElement.trigger('focus')

  // Test tab order
  for (let i = 0; i < expectedTabOrder.length - 1; i++) {
    const currentElement = wrapper.find(expectedTabOrder[i])
    await currentElement.trigger('keydown', { key: 'Tab' })
    await wrapper.vm.$nextTick()

    const nextElement = wrapper.find(expectedTabOrder[i + 1])
    expect(nextElement.element).toBe(document.activeElement)
  }
}

/**
 * Tests form error announcements for screen readers
 */
export async function testErrorAnnouncements(
  wrapper: VueWrapper<any>,
  fieldSelector: string,
  invalidValue: any
): Promise<void> {
  await simulateUserInput(wrapper, fieldSelector, invalidValue)
  
  const field = wrapper.find(fieldSelector)
  await field.trigger('blur')
  await wrapper.vm.$nextTick()

  // Check for aria-live regions
  const liveRegions = wrapper.findAll('[aria-live]')
  expect(liveRegions.length).toBeGreaterThan(0)

  // Check error messages have proper ARIA attributes
  const errorElements = wrapper.findAll('.error-message, .field-error, [role="alert"]')
  errorElements.forEach(error => {
    expect(['alert', 'status']).toContain(error.attributes('role'))
  })
}

// ===== PERFORMANCE TESTING HELPERS =====

/**
 * Measures form render time
 */
export async function measureFormRenderTime(
  component: any,
  props: Record<string, any> = {},
  iterations: number = 10
): Promise<{ average: number; min: number; max: number }> {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    const wrapper = mountFormComponent(component, { props })
    await wrapper.vm.$nextTick()
    const end = performance.now()
    times.push(end - start)
    wrapper.unmount()
  }

  return {
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times)
  }
}

/**
 * Tests form memory usage and cleanup
 */
export async function testFormMemoryLeaks(
  component: any,
  iterations: number = 50
): Promise<void> {
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

  for (let i = 0; i < iterations; i++) {
    const wrapper = mountFormComponent(component)
    await wrapper.vm.$nextTick()
    wrapper.unmount()
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }

  const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
  const memoryIncrease = finalMemory - initialMemory

  // Memory should not increase significantly (more than 5MB)
  expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
}

// ===== EXPORT ALL UTILITIES =====

export {
  // Re-export common testing functions
  mount,
  shallowMount,
  type VueWrapper,
  type MountingOptions
}

// Export vi from global scope
export { vi }