/**
 * Comprehensive unit tests for Form.vue component
 * 
 * @description Tests core form functionality including VeeValidate integration,
 * Zod schema validation, form state management, and accessibility features.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import Form from '../Form.vue'
import {
  mountFormComponent,
  createMockFormData,
  createMockMatterFormData,
  createValidationTestCases,
  simulateUserInput,
  simulateFormSubmit,
  fillFormWithData,
  testFieldValidation,
  testCrossFieldValidation,
  assertFormAccessibility,
  testFormKeyboardNavigation,
  testErrorAnnouncements,
  type FormMountingOptions
} from '~/test/utils/form-test-utils'

// Mock composables
vi.mock('vee-validate')
vi.mock('~/composables/form/useForm')
vi.mock('~/composables/form/useFormState')

// Mock Nuxt composables
const mockNavigateTo = vi.fn()
vi.mock('#app', () => ({
  navigateTo: mockNavigateTo,
  useNuxtApp: () => ({
    $toast: {
      success: vi.fn(),
      error: vi.fn()
    }
  })
}))

describe('Form.vue', () => {
  let wrapper: VueWrapper<any>
  let mockFormData: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFormData = createMockFormData()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ===== BASIC RENDERING =====

  describe('Basic Rendering', () => {
    it('should render form component with default props', () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string' },
            description: { type: 'string' }
          }
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('[data-testid="form-container"]').exists()).toBe(true)
    })

    it('should render with custom title and description', () => {
      const title = 'Legal Matter Form'
      const description = 'Complete all required fields to create a new matter'

      wrapper = mountFormComponent(Form, {
        props: {
          title,
          description,
          schema: {}
        }
      })

      expect(wrapper.text()).toContain(title)
      expect(wrapper.text()).toContain(description)
    })

    it('should render form fields based on schema', () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string', label: 'Matter Title' },
            email: { required: true, type: 'email', label: 'Client Email' },
            priority: { required: true, type: 'select', label: 'Priority', options: ['LOW', 'MEDIUM', 'HIGH'] }
          }
        }
      })

      expect(wrapper.find('[name="title"]').exists()).toBe(true)
      expect(wrapper.find('[name="email"]').exists()).toBe(true)
      expect(wrapper.find('[name="priority"]').exists()).toBe(true)
    })

    it('should apply custom CSS classes', () => {
      const customClass = 'custom-form-style'
      
      wrapper = mountFormComponent(Form, {
        props: {
          class: customClass,
          schema: {}
        }
      })

      expect(wrapper.classes()).toContain(customClass)
    })

    it('should render submit and cancel buttons', () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {},
          showSubmitButton: true,
          showCancelButton: true
        }
      })

      expect(wrapper.find('[data-testid="submit-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="cancel-button"]').exists()).toBe(true)
    })
  })

  // ===== VEEVALIDATE INTEGRATION =====

  describe('VeeValidate Integration', () => {
    it('should initialize VeeValidate with Zod schema', () => {
      const schema = {
        title: { required: true, type: 'string', validation: 'z.string().min(1)' },
        email: { required: true, type: 'email', validation: 'z.string().email()' }
      }

      wrapper = mountFormComponent(Form, {
        props: { schema }
      })

      // Verify VeeValidate integration
      expect(wrapper.vm.formState).toBeDefined()
      expect(wrapper.vm.handleSubmit).toBeDefined()
    })

    it('should handle form submission with VeeValidate', async () => {
      const onSubmit = vi.fn()
      
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string' }
          }
        },
        attrs: {
          onSubmit
        }
      })

      await fillFormWithData(wrapper, { title: 'Test Matter' })
      await simulateFormSubmit(wrapper)

      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Matter'
      })
    })

    it('should prevent submission with validation errors', async () => {
      const onSubmit = vi.fn()
      
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string', minLength: 5 }
          }
        },
        attrs: {
          onSubmit
        }
      })

      // Submit form with invalid data
      await fillFormWithData(wrapper, { title: 'Ab' }) // Too short
      await simulateFormSubmit(wrapper)

      expect(onSubmit).not.toHaveBeenCalled()
      expect(wrapper.find('.error-message').exists()).toBe(true)
    })

    it('should reset form using VeeValidate reset', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { type: 'string' },
            description: { type: 'string' }
          },
          initialValues: {
            title: 'Initial Title',
            description: 'Initial Description'
          }
        }
      })

      // Change values
      await fillFormWithData(wrapper, {
        title: 'Changed Title',
        description: 'Changed Description'
      })

      // Reset form
      const resetButton = wrapper.find('[data-testid="reset-button"]')
      if (resetButton.exists()) {
        await resetButton.trigger('click')
        await nextTick()

        expect(wrapper.find('[name="title"]').element.value).toBe('Initial Title')
        expect(wrapper.find('[name="description"]').element.value).toBe('Initial Description')
      }
    })

    it('should show validation errors from VeeValidate', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            email: { required: true, type: 'email' }
          }
        }
      })

      await simulateUserInput(wrapper, '[name="email"]', 'invalid-email')
      await wrapper.find('[name="email"]').trigger('blur')
      await nextTick()

      const errorMessage = wrapper.find('.error-message, .field-error')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toMatch(/email|invalid/i)
    })
  })

  // ===== FORM STATE MANAGEMENT =====

  describe('Form State Management', () => {
    it('should track form dirty state', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { type: 'string' }
          }
        }
      })

      // Initially not dirty
      expect(wrapper.vm.isDirty).toBe(false)

      // Become dirty after input
      await simulateUserInput(wrapper, '[name="title"]', 'New Title')
      expect(wrapper.vm.isDirty).toBe(true)
    })

    it('should track form validation state', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            email: { required: true, type: 'email' }
          }
        }
      })

      // Initially valid (empty)
      expect(wrapper.vm.isValid).toBe(true)

      // Invalid after bad input
      await simulateUserInput(wrapper, '[name="email"]', 'invalid')
      await wrapper.find('[name="email"]').trigger('blur')
      expect(wrapper.vm.isValid).toBe(false)

      // Valid after correct input
      await simulateUserInput(wrapper, '[name="email"]', 'test@example.com')
      await wrapper.find('[name="email"]').trigger('blur')
      expect(wrapper.vm.isValid).toBe(true)
    })

    it('should track form submission state', async () => {
      const slowSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string' }
          }
        },
        attrs: {
          onSubmit: slowSubmit
        }
      })

      await fillFormWithData(wrapper, { title: 'Test Matter' })
      
      // Start submission
      simulateFormSubmit(wrapper)
      expect(wrapper.vm.isSubmitting).toBe(true)

      // Wait for completion
      await vi.waitFor(() => expect(wrapper.vm.isSubmitting).toBe(false))
    })

    it('should disable submit button when form is invalid', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            email: { required: true, type: 'email' }
          },
          showSubmitButton: true
        }
      })

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      
      // Disabled with invalid data
      await simulateUserInput(wrapper, '[name="email"]', 'invalid')
      expect(submitButton.attributes('disabled')).toBeDefined()

      // Enabled with valid data
      await simulateUserInput(wrapper, '[name="email"]', 'test@example.com')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })
  })

  // ===== VALIDATION SCENARIOS =====

  describe('Validation Scenarios', () => {
    it('should validate required fields', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string' },
            description: { required: false, type: 'string' }
          }
        }
      })

      // Test required field validation
      await testFieldValidation(wrapper, '[name="title"]', [
        {
          name: 'empty_required',
          input: '',
          expected: { valid: false, errors: ['required'] }
        },
        {
          name: 'filled_required',
          input: 'Valid Title',
          expected: { valid: true }
        }
      ])
    })

    it('should validate email fields', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            email: { required: true, type: 'email' }
          }
        }
      })

      const validationCases = createValidationTestCases()
      await testFieldValidation(wrapper, '[name="email"]', validationCases.email)
    })

    it('should validate phone number fields', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            phone: { required: true, type: 'phone' }
          }
        }
      })

      const validationCases = createValidationTestCases()
      await testFieldValidation(wrapper, '[name="phone"]', validationCases.phone)
    })

    it('should validate date fields', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            dueDate: { required: true, type: 'date' }
          }
        }
      })

      const validationCases = createValidationTestCases()
      await testFieldValidation(wrapper, '[name="dueDate"]', validationCases.date)
    })

    it('should validate cross-field dependencies', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            password: { required: true, type: 'password' },
            confirmPassword: { required: true, type: 'password' }
          }
        }
      })

      await testCrossFieldValidation(wrapper, [
        {
          field1: { selector: '[name="password"]', value: 'Password123!' },
          field2: { selector: '[name="confirmPassword"]', value: 'Password123!' },
          expectedValid: true
        },
        {
          field1: { selector: '[name="password"]', value: 'Password123!' },
          field2: { selector: '[name="confirmPassword"]', value: 'DifferentPassword!' },
          expectedValid: false,
          expectedError: "Passwords don't match"
        }
      ])
    })

    it('should validate conditional fields', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            hasLegalIssue: { type: 'boolean' },
            legalIssueDetails: { 
              type: 'string', 
              conditional: { dependsOn: 'hasLegalIssue', showWhen: true }
            }
          }
        }
      })

      // Legal issue details should be hidden initially
      expect(wrapper.find('[name="legalIssueDetails"]').exists()).toBe(false)

      // Show when condition is met
      await simulateUserInput(wrapper, '[name="hasLegalIssue"]', true)
      await nextTick()
      
      expect(wrapper.find('[name="legalIssueDetails"]').exists()).toBe(true)
    })
  })

  // ===== FORM EVENTS =====

  describe('Form Events', () => {
    it('should emit input events on field changes', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { type: 'string' }
          }
        }
      })

      await simulateUserInput(wrapper, '[name="title"]', 'New Title')

      expect(wrapper.emitted('input')).toBeTruthy()
      expect(wrapper.emitted('input')?.[0]).toEqual([{ title: 'New Title' }])
    })

    it('should emit change events on field blur', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { type: 'string' }
          }
        }
      })

      await simulateUserInput(wrapper, '[name="title"]', 'New Title')
      await wrapper.find('[name="title"]').trigger('blur')

      expect(wrapper.emitted('change')).toBeTruthy()
    })

    it('should emit submit event with form data', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string' },
            description: { type: 'string' }
          }
        }
      })

      const formData = { title: 'Test Matter', description: 'Test Description' }
      await fillFormWithData(wrapper, formData)
      await simulateFormSubmit(wrapper)

      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')?.[0]).toEqual([formData])
    })

    it('should emit cancel event', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {},
          showCancelButton: true
        }
      })

      const cancelButton = wrapper.find('[data-testid="cancel-button"]')
      await cancelButton.trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('should emit validation-error event on validation failure', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            email: { required: true, type: 'email' }
          }
        }
      })

      await simulateUserInput(wrapper, '[name="email"]', 'invalid-email')
      await simulateFormSubmit(wrapper)

      expect(wrapper.emitted('validation-error')).toBeTruthy()
    })
  })

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string', label: 'Matter Title' },
            email: { required: true, type: 'email', label: 'Client Email' },
            description: { type: 'textarea', label: 'Description' }
          }
        }
      })
    })

    it('should have proper form accessibility attributes', () => {
      assertFormAccessibility(wrapper)
    })

    it('should support keyboard navigation', async () => {
      const expectedTabOrder = [
        '[name="title"]',
        '[name="email"]',
        '[name="description"]',
        '[data-testid="submit-button"]'
      ]

      await testFormKeyboardNavigation(wrapper, expectedTabOrder)
    })

    it('should announce validation errors to screen readers', async () => {
      await testErrorAnnouncements(wrapper, '[name="email"]', 'invalid-email')
    })

    it('should have proper ARIA labels for form fields', () => {
      const titleField = wrapper.find('[name="title"]')
      const emailField = wrapper.find('[name="email"]')
      
      expect(titleField.attributes('aria-label') || titleField.attributes('aria-labelledby')).toBeTruthy()
      expect(emailField.attributes('aria-label') || emailField.attributes('aria-labelledby')).toBeTruthy()
    })

    it('should indicate required fields to screen readers', () => {
      const requiredFields = wrapper.findAll('[required]')
      
      requiredFields.forEach(field => {
        expect(
          field.attributes('aria-required') === 'true' ||
          field.attributes('required') !== undefined
        ).toBe(true)
      })
    })

    it('should have proper ARIA live regions for dynamic content', () => {
      const liveRegions = wrapper.findAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThan(0)
      
      liveRegions.forEach(region => {
        expect(['polite', 'assertive']).toContain(region.attributes('aria-live'))
      })
    })
  })

  // ===== ERROR HANDLING =====

  describe('Error Handling', () => {
    it('should handle malformed schema gracefully', () => {
      expect(() => {
        wrapper = mountFormComponent(Form, {
          props: {
            schema: null
          }
        })
      }).not.toThrow()

      expect(wrapper.exists()).toBe(true)
    })

    it('should handle submission errors gracefully', async () => {
      const failingSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'))
      
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string' }
          }
        },
        attrs: {
          onSubmit: failingSubmit
        }
      })

      await fillFormWithData(wrapper, { title: 'Test' })
      await simulateFormSubmit(wrapper)

      // Should show error message
      const errorMessage = wrapper.find('.submission-error, [data-testid="submission-error"]')
      expect(errorMessage.exists()).toBe(true)
    })

    it('should recover from validation errors', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            email: { required: true, type: 'email' }
          }
        }
      })

      // Create error
      await simulateUserInput(wrapper, '[name="email"]', 'invalid')
      await wrapper.find('[name="email"]').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(true)

      // Fix error
      await simulateUserInput(wrapper, '[name="email"]', 'test@example.com')
      await wrapper.find('[name="email"]').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(false)
    })
  })

  // ===== PERFORMANCE =====

  describe('Performance', () => {
    it('should render efficiently with large schemas', () => {
      const largeSchema = {}
      for (let i = 0; i < 50; i++) {
        largeSchema[`field${i}`] = { type: 'string', label: `Field ${i}` }
      }

      const startTime = performance.now()
      wrapper = mountFormComponent(Form, {
        props: { schema: largeSchema }
      })
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should render in under 100ms
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle rapid input changes efficiently', async () => {
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { type: 'string' }
          }
        }
      })

      const field = wrapper.find('[name="title"]')
      
      // Rapid changes
      for (let i = 0; i < 20; i++) {
        await field.setValue(`Value ${i}`)
      }

      // Should complete without performance issues
      expect(wrapper.exists()).toBe(true)
    })
  })

  // ===== INTEGRATION SCENARIOS =====

  describe('Integration Scenarios', () => {
    it('should work with legal matter creation', async () => {
      const matterData = createMockMatterFormData()
      
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string' },
            clientEmail: { required: true, type: 'email' },
            priority: { required: true, type: 'select', options: ['LOW', 'MEDIUM', 'HIGH'] },
            dueDate: { type: 'date' }
          },
          initialValues: matterData.values
        }
      })

      // Verify pre-filled data
      expect(wrapper.find('[name="title"]').element.value).toBe(matterData.values.title)
      expect(wrapper.find('[name="clientEmail"]').element.value).toBe(matterData.values.clientEmail)
    })

    it('should integrate with API submission workflows', async () => {
      const apiSubmit = vi.fn().mockResolvedValue({ success: true, id: 'matter-123' })
      
      wrapper = mountFormComponent(Form, {
        props: {
          schema: {
            title: { required: true, type: 'string' }
          }
        },
        attrs: {
          onSubmit: apiSubmit
        }
      })

      await fillFormWithData(wrapper, { title: 'API Test Matter' })
      await simulateFormSubmit(wrapper)

      expect(apiSubmit).toHaveBeenCalledWith({ title: 'API Test Matter' })
    })
  })
})