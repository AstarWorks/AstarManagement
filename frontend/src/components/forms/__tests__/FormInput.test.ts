/**
 * Comprehensive unit tests for FormInput.vue component
 * 
 * @description Tests input field functionality including validation,
 * accessibility, masking, and various input types.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import FormInput from '../FormInput.vue'
import {
  mountFormComponent,
  simulateUserInput,
  testErrorAnnouncements,
  assertFormAccessibility,
  createValidationTestCases,
  type FormMountingOptions
} from '~/test/utils/form-test-utils'

describe('FormInput.vue', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ===== BASIC RENDERING =====

  describe('Basic Rendering', () => {
    it('should render input with default props', () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'test-input',
          label: 'Test Input'
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('input').exists()).toBe(true)
      expect(wrapper.find('label').text()).toContain('Test Input')
    })

    it('should render different input types', () => {
      const inputTypes = ['text', 'email', 'password', 'tel', 'url', 'number']
      
      inputTypes.forEach(type => {
        wrapper = mountFormComponent(FormInput, {
          props: {
            name: `test-${type}`,
            type,
            label: `${type} Input`
          }
        })

        const input = wrapper.find('input')
        expect(input.attributes('type')).toBe(type)
        wrapper.unmount()
      })
    })

    it('should display placeholder text', () => {
      const placeholder = 'Enter your email address'
      
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'email',
          placeholder,
          label: 'Email'
        }
      })

      expect(wrapper.find('input').attributes('placeholder')).toBe(placeholder)
    })

    it('should show required indicator', () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'required-field',
          label: 'Required Field',
          required: true
        }
      })

      const label = wrapper.find('label')
      expect(label.text()).toMatch(/\*|required/i)
      expect(wrapper.find('input').attributes('required')).toBeDefined()
    })

    it('should apply custom CSS classes', () => {
      const customClass = 'custom-input-style'
      
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'styled-input',
          label: 'Styled Input',
          class: customClass
        }
      })

      expect(wrapper.classes()).toContain(customClass)
    })
  })

  // ===== INPUT BEHAVIOR =====

  describe('Input Behavior', () => {
    it('should handle value changes', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'test-input',
          label: 'Test Input',
          modelValue: 'initial value'
        }
      })

      const input = wrapper.find('input')
      expect(input.element.value).toBe('initial value')

      await input.setValue('new value')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value'])
    })

    it('should handle focus and blur events', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'focus-input',
          label: 'Focus Input'
        }
      })

      const input = wrapper.find('input')
      
      await input.trigger('focus')
      expect(wrapper.emitted('focus')).toBeTruthy()
      expect(wrapper.classes()).toContain('focused')

      await input.trigger('blur')
      expect(wrapper.emitted('blur')).toBeTruthy()
      expect(wrapper.classes()).not.toContain('focused')
    })

    it('should handle disabled state', () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'disabled-input',
          label: 'Disabled Input',
          disabled: true
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('disabled')).toBeDefined()
      expect(wrapper.classes()).toContain('disabled')
    })

    it('should handle readonly state', () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'readonly-input',
          label: 'Readonly Input',
          readonly: true
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('readonly')).toBeDefined()
      expect(wrapper.classes()).toContain('readonly')
    })

    it('should handle maxlength restriction', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'maxlength-input',
          label: 'Max Length Input',
          maxlength: 10
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('maxlength')).toBe('10')

      // Test character counter if present
      const counter = wrapper.find('.character-counter')
      if (counter.exists()) {
        await input.setValue('test')
        expect(counter.text()).toContain('4/10')
      }
    })
  })

  // ===== INPUT MASKING =====

  describe('Input Masking', () => {
    it('should apply phone number mask', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'phone',
          label: 'Phone Number',
          type: 'tel',
          mask: 'phone'
        }
      })

      const input = wrapper.find('input')
      await input.setValue('5551234567')
      
      // Should format as (555) 123-4567 or similar
      expect(input.element.value).toMatch(/\(\d{3}\)\s?\d{3}-?\d{4}/)
    })

    it('should apply credit card mask', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'credit-card',
          label: 'Credit Card',
          mask: 'credit-card'
        }
      })

      const input = wrapper.find('input')
      await input.setValue('1234567890123456')
      
      // Should format as 1234 5678 9012 3456
      expect(input.element.value).toMatch(/\d{4}\s\d{4}\s\d{4}\s\d{4}/)
    })

    it('should apply date mask', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'date',
          label: 'Date',
          mask: 'date'
        }
      })

      const input = wrapper.find('input')
      await input.setValue('01152025')
      
      // Should format as 01/15/2025 or similar
      expect(input.element.value).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('should apply custom mask pattern', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'custom-mask',
          label: 'Custom Mask',
          mask: '###-##-####' // SSN format
        }
      })

      const input = wrapper.find('input')
      await input.setValue('123456789')
      
      // Should format as 123-45-6789
      expect(input.element.value).toBe('123-45-6789')
    })
  })

  // ===== VALIDATION INTEGRATION =====

  describe('Validation Integration', () => {
    it('should show validation errors', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true
        }
      })

      // Invalid email
      await simulateUserInput(wrapper, 'input', 'invalid-email')
      await wrapper.find('input').trigger('blur')

      const errorMessage = wrapper.find('.error-message, .field-error')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toMatch(/email|invalid/i)
    })

    it('should validate required fields', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'required-field',
          label: 'Required Field',
          required: true
        }
      })

      // Empty required field
      await wrapper.find('input').trigger('blur')

      const errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toMatch(/required/i)
    })

    it('should validate email format', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'email',
          label: 'Email',
          type: 'email'
        }
      })

      const validationCases = createValidationTestCases()
      
      for (const testCase of validationCases.email) {
        await simulateUserInput(wrapper, 'input', testCase.input)
        await wrapper.find('input').trigger('blur')
        await nextTick()

        const hasError = wrapper.find('.error-message').exists()
        expect(hasError).toBe(!testCase.expected.valid)
      }
    })

    it('should validate minimum and maximum length', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'username',
          label: 'Username',
          minlength: 3,
          maxlength: 20
        }
      })

      // Too short
      await simulateUserInput(wrapper, 'input', 'ab')
      await wrapper.find('input').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(true)

      // Valid length
      await simulateUserInput(wrapper, 'input', 'validusername')
      await wrapper.find('input').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(false)

      // Too long
      await simulateUserInput(wrapper, 'input', 'thisusernameiswaytolong')
      await wrapper.find('input').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(true)
    })

    it('should validate custom patterns', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'zip-code',
          label: 'ZIP Code',
          pattern: '^\\d{5}(-\\d{4})?$' // US ZIP code pattern
        }
      })

      // Invalid ZIP
      await simulateUserInput(wrapper, 'input', '123')
      await wrapper.find('input').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(true)

      // Valid ZIP
      await simulateUserInput(wrapper, 'input', '12345')
      await wrapper.find('input').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(false)

      // Valid ZIP+4
      await simulateUserInput(wrapper, 'input', '12345-6789')
      await wrapper.find('input').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(false)
    })
  })

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'accessible-input',
          label: 'Accessible Input',
          required: true,
          helpText: 'Enter a valid value'
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('aria-required')).toBe('true')
      expect(input.attributes('aria-describedby')).toBeTruthy()
      
      const label = wrapper.find('label')
      expect(label.attributes('for')).toBe(input.attributes('id'))
    })

    it('should announce validation errors', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'error-input',
          label: 'Error Input',
          type: 'email'
        }
      })

      await testErrorAnnouncements(wrapper, 'input', 'invalid-email')
    })

    it('should support keyboard navigation', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'keyboard-input',
          label: 'Keyboard Input'
        }
      })

      const input = wrapper.find('input')
      
      await input.trigger('keydown', { key: 'Tab' })
      expect(input.element).toBe(document.activeElement)

      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('keydown.enter')).toBeTruthy()
    })

    it('should provide clear visual focus indicators', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'focus-indicator',
          label: 'Focus Indicator'
        }
      })

      const input = wrapper.find('input')
      
      await input.trigger('focus')
      expect(wrapper.classes()).toContain('focused')
      
      // Check for focus ring styles
      const computedStyle = getComputedStyle(input.element)
      expect(computedStyle.outline || computedStyle.boxShadow).toBeTruthy()
    })

    it('should have proper label association', () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'labeled-input',
          label: 'Properly Labeled Input'
        }
      })

      const input = wrapper.find('input')
      const label = wrapper.find('label')
      
      expect(label.attributes('for')).toBe(input.attributes('id'))
      expect(input.attributes('aria-labelledby') || label.exists()).toBeTruthy()
    })
  })

  // ===== PASSWORD INPUT SPECIFICS =====

  describe('Password Input', () => {
    it('should toggle password visibility', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'password',
          label: 'Password',
          type: 'password',
          showPasswordToggle: true
        }
      })

      const input = wrapper.find('input')
      const toggleButton = wrapper.find('[data-testid="password-toggle"]')
      
      expect(input.attributes('type')).toBe('password')
      
      await toggleButton.trigger('click')
      expect(input.attributes('type')).toBe('text')
      
      await toggleButton.trigger('click')
      expect(input.attributes('type')).toBe('password')
    })

    it('should show password strength indicator', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'password',
          label: 'Password',
          type: 'password',
          showStrengthIndicator: true
        }
      })

      const input = wrapper.find('input')
      
      // Weak password
      await input.setValue('weak')
      const weakIndicator = wrapper.find('.strength-weak')
      expect(weakIndicator.exists()).toBe(true)

      // Strong password
      await input.setValue('StrongPassword123!')
      const strongIndicator = wrapper.find('.strength-strong')
      expect(strongIndicator.exists()).toBe(true)
    })

    it('should validate password requirements', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'password',
          label: 'Password',
          type: 'password',
          passwordRequirements: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
          }
        }
      })

      const validationCases = createValidationTestCases()
      
      for (const testCase of validationCases.password) {
        await simulateUserInput(wrapper, 'input', testCase.input)
        await wrapper.find('input').trigger('blur')
        await nextTick()

        const hasError = wrapper.find('.error-message').exists()
        expect(hasError).toBe(!testCase.expected.valid)
      }
    })
  })

  // ===== NUMBER INPUT SPECIFICS =====

  describe('Number Input', () => {
    it('should handle numeric input with min/max validation', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'age',
          label: 'Age',
          type: 'number',
          min: 18,
          max: 120
        }
      })

      const input = wrapper.find('input')
      
      // Below minimum
      await input.setValue('10')
      await input.trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(true)

      // Valid range
      await input.setValue('25')
      await input.trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(false)

      // Above maximum
      await input.setValue('150')
      await input.trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(true)
    })

    it('should handle step validation', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'price',
          label: 'Price',
          type: 'number',
          step: 0.01,
          min: 0
        }
      })

      const input = wrapper.find('input')
      
      // Valid step
      await input.setValue('10.50')
      await input.trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(false)

      // Invalid step (too many decimals)
      await input.setValue('10.555')
      await input.trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(true)
    })
  })

  // ===== ERROR RECOVERY =====

  describe('Error Recovery', () => {
    it('should clear errors when valid input is provided', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true
        }
      })

      // Create error
      await simulateUserInput(wrapper, 'input', 'invalid')
      await wrapper.find('input').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(true)

      // Fix error
      await simulateUserInput(wrapper, 'input', 'valid@example.com')
      await wrapper.find('input').trigger('blur')
      expect(wrapper.find('.error-message').exists()).toBe(false)
    })

    it('should handle rapid input changes without error state confusion', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'rapid-input',
          label: 'Rapid Input',
          type: 'email'
        }
      })

      const input = wrapper.find('input')
      
      // Rapid changes
      await input.setValue('a')
      await input.setValue('ab')
      await input.setValue('abc@')
      await input.setValue('abc@example')
      await input.setValue('abc@example.com')
      await input.trigger('blur')

      // Should end up with valid state
      expect(wrapper.find('.error-message').exists()).toBe(false)
    })
  })

  // ===== INTEGRATION =====

  describe('Integration', () => {
    it('should work with form validation libraries', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'integration-field',
          label: 'Integration Field',
          type: 'email'
        },
        mockValidation: true
      })

      // Should integrate with mocked VeeValidate
      expect(wrapper.vm.fieldState).toBeDefined()
      expect(wrapper.vm.errorMessage).toBeDefined()
    })

    it('should emit proper events for form integration', async () => {
      wrapper = mountFormComponent(FormInput, {
        props: {
          name: 'event-field',
          label: 'Event Field'
        }
      })

      const input = wrapper.find('input')
      
      await input.setValue('test value')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      
      await input.trigger('blur')
      expect(wrapper.emitted('blur')).toBeTruthy()
      
      await input.trigger('focus')
      expect(wrapper.emitted('focus')).toBeTruthy()
    })
  })
})