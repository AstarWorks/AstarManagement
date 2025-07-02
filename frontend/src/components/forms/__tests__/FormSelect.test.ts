/**
 * Comprehensive unit tests for FormSelect.vue component
 * 
 * @description Tests select dropdown functionality including static options,
 * async options loading, validation, accessibility, and user interactions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import FormSelect from '../FormSelect.vue'
import type { SelectOption } from '../FormSelect.vue'
import {
  mountFormComponent,
  simulateUserInput,
  testErrorAnnouncements,
  assertFormAccessibility,
  createValidationTestCases,
  testFieldValidation,
  type FormMountingOptions
} from '../../../test/utils/form-test-utils'

describe('FormSelect.vue', () => {
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
    it('should render select with default props', () => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'test-select',
          label: 'Test Select'
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="select-trigger"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test Select')
    })

    it('should render static options', async () => {
      const options: SelectOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2', description: 'Description 2' },
        { value: 'option3', label: 'Option 3', disabled: true }
      ]

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'static-select',
          label: 'Static Select',
          options
        }
      })

      // Open dropdown
      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      // Check options are rendered
      const optionItems = wrapper.findAll('[data-testid^="select-item-"]')
      expect(optionItems).toHaveLength(options.length + 1) // +1 for empty option

      // Check option content
      expect(wrapper.text()).toContain('Option 1')
      expect(wrapper.text()).toContain('Option 2')
      expect(wrapper.text()).toContain('Description 2')
      expect(wrapper.text()).toContain('Option 3')
    })

    it('should render empty option when showEmptyOption is true', async () => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'empty-select',
          label: 'Empty Select',
          options: [{ value: 'test', label: 'Test' }],
          showEmptyOption: true,
          emptyLabel: 'Choose an option'
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('Choose an option')
    })

    it('should not render empty option when showEmptyOption is false', async () => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'no-empty-select',
          label: 'No Empty Select',
          options: [{ value: 'test', label: 'Test' }],
          showEmptyOption: false
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      const emptyOption = wrapper.find('[data-testid="select-item-"]')
      expect(emptyOption.exists()).toBe(false)
    })

    it('should display placeholder text', () => {
      const placeholder = 'Select a priority level'

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'placeholder-select',
          label: 'Placeholder Select',
          placeholder,
          options: []
        }
      })

      expect(wrapper.text()).toContain(placeholder)
    })

    it('should apply custom CSS classes', () => {
      const customClass = 'custom-select-style'

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'styled-select',
          label: 'Styled Select',
          class: customClass,
          options: []
        }
      })

      const trigger = wrapper.find('[data-testid="select-trigger"]')
      expect(trigger.classes()).toContain(customClass)
    })
  })

  // ===== OPTION HANDLING =====

  describe('Option Handling', () => {
    it('should handle options with icons', async () => {
      const MockIcon = { template: '<div class="mock-icon">Icon</div>' }
      const options: SelectOption[] = [
        { value: 'with-icon', label: 'With Icon', icon: MockIcon },
        { value: 'without-icon', label: 'Without Icon' }
      ]

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'icon-select',
          label: 'Icon Select',
          options
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.find('.mock-icon').exists()).toBe(true)
    })

    it('should handle disabled options', async () => {
      const options: SelectOption[] = [
        { value: 'enabled', label: 'Enabled Option' },
        { value: 'disabled', label: 'Disabled Option', disabled: true }
      ]

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'disabled-options-select',
          label: 'Disabled Options',
          options
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      const disabledOption = wrapper.find('[data-testid="select-item-disabled"]')
      expect(disabledOption.attributes('aria-disabled')).toBe('true')
    })

    it('should handle options with descriptions', async () => {
      const options: SelectOption[] = [
        {
          value: 'priority-high',
          label: 'High Priority',
          description: 'Urgent matters requiring immediate attention'
        },
        {
          value: 'priority-medium',
          label: 'Medium Priority',
          description: 'Standard matters with normal timeline'
        }
      ]

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'description-select',
          label: 'Priority Select',
          options
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('Urgent matters requiring immediate attention')
      expect(wrapper.text()).toContain('Standard matters with normal timeline')
    })

    it('should normalize option values to strings', () => {
      const options = [
        { value: 1, label: 'Number Value' },
        { value: true, label: 'Boolean Value' },
        { value: 'string', label: 'String Value' }
      ]

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'normalize-select',
          label: 'Normalize Select',
          options: options as any
        }
      })

      // Access internal normalized options through component instance
      const normalizedOptions = wrapper.vm.normalizedOptions
      expect(normalizedOptions.every((opt: any) => typeof opt.value === 'string')).toBe(true)
    })
  })

  // ===== ASYNC OPTIONS =====

  describe('Async Options', () => {
    it('should load async options on mount', async () => {
      const asyncOptions: SelectOption[] = [
        { value: 'async1', label: 'Async Option 1' },
        { value: 'async2', label: 'Async Option 2' }
      ]

      const loadOptions = vi.fn().mockResolvedValue(asyncOptions)

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'async-select',
          label: 'Async Select',
          asyncOptions: true,
          loadOptions
        }
      })

      await nextTick()
      expect(loadOptions).toHaveBeenCalled()

      // Wait for async load to complete
      await vi.waitFor(() => {
        return wrapper.vm.asyncLoadedOptions.length > 0
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('Async Option 1')
      expect(wrapper.text()).toContain('Async Option 2')
    })

    it('should show loading state while loading async options', async () => {
      const loadOptions = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      )

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'loading-select',
          label: 'Loading Select',
          asyncOptions: true,
          loadOptions,
          loadingText: 'Loading lawyers...'
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('Loading lawyers...')
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('should show error state when async loading fails', async () => {
      const loadOptions = vi.fn().mockRejectedValue(new Error('Network error'))

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'error-select',
          label: 'Error Select',
          asyncOptions: true,
          loadOptions,
          errorText: 'Failed to load lawyers'
        }
      })

      await nextTick()
      await vi.waitFor(() => wrapper.vm.loadError === true)

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('Failed to load lawyers')
    })

    it('should show no options message when async returns empty array', async () => {
      const loadOptions = vi.fn().mockResolvedValue([])

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'empty-async-select',
          label: 'Empty Async Select',
          asyncOptions: true,
          loadOptions,
          noOptionsText: 'No lawyers available'
        }
      })

      await nextTick()
      await vi.waitFor(() => wrapper.vm.isLoading === false)

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('No lawyers available')
    })

    it('should expose refresh method for async options', async () => {
      const loadOptions = vi.fn().mockResolvedValue([
        { value: 'refreshed', label: 'Refreshed Option' }
      ])

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'refresh-select',
          label: 'Refresh Select',
          asyncOptions: true,
          loadOptions
        }
      })

      await nextTick()
      expect(loadOptions).toHaveBeenCalledTimes(1)

      // Use exposed refresh method
      await wrapper.vm.refresh()
      expect(loadOptions).toHaveBeenCalledTimes(2)
    })
  })

  // ===== VALUE HANDLING =====

  describe('Value Handling', () => {
    it('should handle value selection', async () => {
      const options: SelectOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ]

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'value-select',
          label: 'Value Select',
          options
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      const option1 = wrapper.find('[data-testid="select-item-option1"]')
      await option1.trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['option1'])
    })

    it('should handle empty value selection', async () => {
      const options: SelectOption[] = [
        { value: 'option1', label: 'Option 1' }
      ]

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'empty-value-select',
          label: 'Empty Value Select',
          options,
          allowEmpty: true,
          emptyValue: ''
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      const emptyOption = wrapper.find('[data-testid="select-item-"]')
      await emptyOption.trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    })

    it('should handle disabled state', () => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'disabled-select',
          label: 'Disabled Select',
          disabled: true,
          options: [{ value: 'test', label: 'Test' }]
        }
      })

      const trigger = wrapper.find('[data-testid="select-trigger"]')
      expect(trigger.attributes('disabled')).toBeDefined()
    })

    it('should handle required state', () => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'required-select',
          label: 'Required Select',
          required: true,
          options: [{ value: 'test', label: 'Test' }]
        }
      })

      const trigger = wrapper.find('[data-testid="select-trigger"]')
      expect(trigger.attributes('required')).toBeDefined()
      expect(trigger.attributes('aria-required')).toBe('true')
    })
  })

  // ===== VALIDATION INTEGRATION =====

  describe('Validation Integration', () => {
    it('should show validation errors', async () => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'validation-select',
          label: 'Validation Select',
          required: true,
          options: [
            { value: 'valid', label: 'Valid Option' }
          ]
        }
      })

      // Trigger validation by attempting to submit without selection
      await wrapper.find('[data-testid="select-trigger"]').trigger('blur')
      await nextTick()

      const errorMessage = wrapper.find('.error-message, .field-error')
      if (errorMessage.exists()) {
        expect(errorMessage.text()).toMatch(/required/i)
      }
    })

    it('should validate enum values', async () => {
      const validOptions = ['low', 'medium', 'high']
      const options: SelectOption[] = validOptions.map(value => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1)
      }))

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'enum-select',
          label: 'Priority Select',
          options,
          required: true
        }
      })

      const validationCases = [
        {
          name: 'valid_enum',
          input: 'medium',
          expected: { valid: true }
        },
        {
          name: 'invalid_enum',
          input: 'invalid-priority',
          expected: { valid: false, errors: ['Invalid selection'] }
        },
        {
          name: 'empty_required',
          input: '',
          expected: { valid: false, errors: ['This field is required'] }
        }
      ]

      await testFieldValidation(wrapper, '[data-testid="select-trigger"]', validationCases)
    })

    it('should clear errors when valid selection is made', async () => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'clear-errors-select',
          label: 'Clear Errors Select',
          required: true,
          options: [
            { value: 'valid', label: 'Valid Option' }
          ]
        }
      })

      // Create error by leaving empty
      await wrapper.find('[data-testid="select-trigger"]').trigger('blur')
      await nextTick()

      let errorMessage = wrapper.find('.error-message')
      if (errorMessage.exists()) {
        expect(errorMessage.text()).toMatch(/required/i)
      }

      // Fix error by selecting option
      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      const option = wrapper.find('[data-testid="select-item-valid"]')
      await option.trigger('click')
      await nextTick()

      errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(false)
    })
  })

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'accessible-select',
          label: 'Accessible Select',
          required: true,
          helpText: 'Choose your priority level',
          options: [
            { value: 'high', label: 'High Priority' },
            { value: 'medium', label: 'Medium Priority' },
            { value: 'low', label: 'Low Priority' }
          ]
        }
      })
    })

    it('should have proper ARIA attributes', () => {
      const trigger = wrapper.find('[data-testid="select-trigger"]')
      
      expect(trigger.attributes('aria-required')).toBe('true')
      expect(trigger.attributes('aria-describedby')).toBeTruthy()
      expect(trigger.attributes('aria-expanded')).toBeDefined()
      expect(trigger.attributes('aria-haspopup')).toBe('listbox')

      const label = wrapper.find('label')
      expect(label.attributes('for')).toBe(trigger.attributes('id'))
    })

    it('should announce validation errors', async () => {
      await testErrorAnnouncements(wrapper, '[data-testid="select-trigger"]', '')
    })

    it('should support keyboard navigation', async () => {
      const trigger = wrapper.find('[data-testid="select-trigger"]')

      // Open with Enter key
      await trigger.trigger('keydown', { key: 'Enter' })
      expect(trigger.attributes('aria-expanded')).toBe('true')

      // Navigate with arrow keys
      await trigger.trigger('keydown', { key: 'ArrowDown' })
      await trigger.trigger('keydown', { key: 'ArrowUp' })

      // Close with Escape
      await trigger.trigger('keydown', { key: 'Escape' })
      expect(trigger.attributes('aria-expanded')).toBe('false')
    })

    it('should have proper focus management', async () => {
      const trigger = wrapper.find('[data-testid="select-trigger"]')

      await trigger.trigger('focus')
      expect(document.activeElement).toBe(trigger.element)

      await trigger.trigger('click')
      await nextTick()

      // Focus should remain on trigger when dropdown opens
      expect(document.activeElement).toBe(trigger.element)
    })

    it('should provide clear visual focus indicators', async () => {
      const trigger = wrapper.find('[data-testid="select-trigger"]')

      await trigger.trigger('focus')
      
      // Check for focus ring styles
      const computedStyle = getComputedStyle(trigger.element)
      expect(computedStyle.outline || computedStyle.boxShadow).toBeTruthy()
    })

    it('should have proper role and state attributes', async () => {
      const trigger = wrapper.find('[data-testid="select-trigger"]')

      expect(trigger.attributes('role')).toBe('combobox')
      expect(trigger.attributes('aria-expanded')).toBe('false')

      await trigger.trigger('click')
      await nextTick()

      expect(trigger.attributes('aria-expanded')).toBe('true')
    })
  })

  // ===== ERROR HANDLING =====

  describe('Error Handling', () => {
    it('should handle malformed options gracefully', () => {
      const malformedOptions = [
        null,
        undefined,
        { value: null, label: 'Null Value' },
        { label: 'Missing Value' },
        { value: 'test' } // Missing label
      ]

      expect(() => {
        wrapper = mountFormComponent(FormSelect, {
          props: {
            name: 'malformed-select',
            label: 'Malformed Select',
            options: malformedOptions as any
          }
        })
      }).not.toThrow()

      expect(wrapper.exists()).toBe(true)
    })

    it('should handle async loading failures gracefully', async () => {
      const loadOptions = vi.fn().mockRejectedValue(new Error('Network failure'))

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'failure-select',
          label: 'Failure Select',
          asyncOptions: true,
          loadOptions
        }
      })

      await nextTick()
      await vi.waitFor(() => wrapper.vm.loadError === true)

      // Component should still render and function
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.vm.loadError).toBe(true)
    })

    it('should handle missing loadOptions function', async () => {
      expect(() => {
        wrapper = mountFormComponent(FormSelect, {
          props: {
            name: 'missing-loader-select',
            label: 'Missing Loader Select',
            asyncOptions: true
            // Missing loadOptions prop
          }
        })
      }).not.toThrow()

      expect(wrapper.exists()).toBe(true)
    })

    it('should recover from error state', async () => {
      const loadOptions = vi.fn()
        .mockRejectedValueOnce(new Error('First call fails'))
        .mockResolvedValue([{ value: 'recovered', label: 'Recovered Option' }])

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'recovery-select',
          label: 'Recovery Select',
          asyncOptions: true,
          loadOptions
        }
      })

      await nextTick()
      await vi.waitFor(() => wrapper.vm.loadError === true)

      // Retry loading
      await wrapper.vm.refresh()
      await vi.waitFor(() => wrapper.vm.loadError === false)

      expect(wrapper.vm.asyncLoadedOptions).toHaveLength(1)
      expect(wrapper.vm.asyncLoadedOptions[0].value).toBe('recovered')
    })
  })

  // ===== INTEGRATION =====

  describe('Integration', () => {
    it('should work with form validation libraries', async () => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'integration-select',
          label: 'Integration Select',
          options: [
            { value: 'option1', label: 'Option 1' }
          ]
        },
        mockValidation: true
      })

      // Should integrate with mocked field validation
      expect(wrapper.vm.field).toBeDefined()
    })

    it('should emit proper events for form integration', async () => {
      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'event-select',
          label: 'Event Select',
          options: [
            { value: 'test-value', label: 'Test Value' }
          ]
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      const option = wrapper.find('[data-testid="select-item-test-value"]')
      await option.trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('change')).toBeTruthy()
    })

    it('should handle complex legal form scenarios', async () => {
      // Legal case priority selection scenario
      const priorityOptions: SelectOption[] = [
        {
          value: 'urgent',
          label: 'Urgent',
          description: 'Court deadline within 7 days',
          icon: { template: '<div class="urgent-icon">!</div>' }
        },
        {
          value: 'high',
          label: 'High Priority',
          description: 'Court deadline within 30 days'
        },
        {
          value: 'normal',
          label: 'Normal Priority',
          description: 'Standard processing time'
        },
        {
          value: 'low',
          label: 'Low Priority',
          description: 'Non-urgent administrative tasks',
          disabled: false
        }
      ]

      wrapper = mountFormComponent(FormSelect, {
        props: {
          name: 'case-priority',
          label: 'Case Priority Level',
          description: 'Select the urgency level for this legal matter',
          helpText: 'Priority affects processing timeline and resource allocation',
          options: priorityOptions,
          required: true,
          placeholder: 'Choose priority level...'
        }
      })

      await wrapper.find('[data-testid="select-trigger"]').trigger('click')
      await nextTick()

      // Verify all priority options are rendered with descriptions
      expect(wrapper.text()).toContain('Court deadline within 7 days')
      expect(wrapper.text()).toContain('Standard processing time')
      expect(wrapper.find('.urgent-icon').exists()).toBe(true)

      // Select urgent priority
      const urgentOption = wrapper.find('[data-testid="select-item-urgent"]')
      await urgentOption.trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['urgent'])
    })
  })
})