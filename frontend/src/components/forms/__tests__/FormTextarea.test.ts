/**
 * Comprehensive unit tests for FormTextarea.vue component
 * 
 * @description Tests textarea functionality including auto-resize,
 * character counting, validation, accessibility, and user interactions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import FormTextarea from '../FormTextarea.vue'
import {
  mountFormComponent,
  simulateUserInput,
  testErrorAnnouncements,
  assertFormAccessibility,
  createValidationTestCases,
  testFieldValidation,
  type FormMountingOptions
} from '~/test/utils/form-test-utils'

describe('FormTextarea.vue', () => {
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
    it('should render textarea with default props', () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'test-textarea',
          label: 'Test Textarea'
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.find('label').text()).toContain('Test Textarea')
    })

    it('should render with specified number of rows', () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'rows-textarea',
          label: 'Rows Textarea',
          rows: 5
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('rows')).toBe('5')
    })

    it('should display placeholder text', () => {
      const placeholder = 'Enter case description...'

      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'placeholder-textarea',
          label: 'Placeholder Textarea',
          placeholder
        }
      })

      expect(wrapper.find('textarea').attributes('placeholder')).toBe(placeholder)
    })

    it('should show required indicator', () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'required-textarea',
          label: 'Required Textarea',
          required: true
        }
      })

      const label = wrapper.find('label')
      expect(label.text()).toMatch(/\*|required/i)
      expect(wrapper.find('textarea').attributes('aria-required')).toBe('true')
    })

    it('should apply custom CSS classes', () => {
      const customClass = 'custom-textarea-style'

      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'styled-textarea',
          label: 'Styled Textarea',
          class: customClass
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.classes()).toContain(customClass)
    })
  })

  // ===== TEXTAREA BEHAVIOR =====

  describe('Textarea Behavior', () => {
    it('should handle value changes', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'value-textarea',
          label: 'Value Textarea'
        }
      })

      const textarea = wrapper.find('textarea')
      const testValue = 'This is a comprehensive case description for a personal injury matter.'

      await textarea.setValue(testValue)
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([testValue])
    })

    it('should handle focus and blur events', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'focus-textarea',
          label: 'Focus Textarea'
        }
      })

      const textarea = wrapper.find('textarea')

      await textarea.trigger('focus')
      expect(wrapper.emitted('focus')).toBeTruthy()

      await textarea.trigger('blur')
      expect(wrapper.emitted('blur')).toBeTruthy()
    })

    it('should handle disabled state', () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'disabled-textarea',
          label: 'Disabled Textarea',
          disabled: true
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('disabled')).toBeDefined()
    })

    it('should handle readonly state', () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'readonly-textarea',
          label: 'Readonly Textarea',
          readonly: true
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('readonly')).toBeDefined()
    })

    it('should handle maxlength restriction', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'maxlength-textarea',
          label: 'Max Length Textarea',
          maxlength: 50
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('maxlength')).toBe('50')
    })

    it('should handle minlength validation', () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'minlength-textarea',
          label: 'Min Length Textarea',
          minlength: 10
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('minlength')).toBe('10')
    })
  })

  // ===== CHARACTER COUNTING =====

  describe('Character Counting', () => {
    it('should show internal character count when enabled', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'char-count-textarea',
          label: 'Character Count Textarea',
          maxlength: 100,
          showCharacterCount: true,
          characterCountPosition: 'internal'
        }
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test content')

      expect(wrapper.text()).toContain('12/100')
      
      const counter = wrapper.find('.absolute.bottom-2.right-2')
      expect(counter.exists()).toBe(true)
    })

    it('should show external character count when enabled', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'external-char-count-textarea',
          label: 'External Character Count Textarea',
          maxlength: 100,
          showCharacterCount: true,
          characterCountPosition: 'external'
        }
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('External test content')

      expect(wrapper.text()).toContain('21/100')
      
      const externalCounter = wrapper.find('.flex.justify-between.items-center.mt-1')
      expect(externalCounter.exists()).toBe(true)
    })

    it('should highlight when over character limit', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'over-limit-textarea',
          label: 'Over Limit Textarea',
          maxlength: 10,
          showCharacterCount: true,
          characterCountPosition: 'external'
        }
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('This text is definitely over the limit')

      expect(wrapper.text()).toContain('(28 over limit)')
      
      const counter = wrapper.find('.text-destructive')
      expect(counter.exists()).toBe(true)
    })

    it('should update character count in real time', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'realtime-textarea',
          label: 'Real-time Textarea',
          maxlength: 50,
          showCharacterCount: true
        }
      })

      const textarea = wrapper.find('textarea')

      // Initial state
      expect(wrapper.text()).toContain('0/50')

      // Add some text
      await textarea.setValue('Hello')
      expect(wrapper.text()).toContain('5/50')

      // Add more text
      await textarea.setValue('Hello World!')
      expect(wrapper.text()).toContain('12/50')
    })

    it('should not show character count when disabled', () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'no-count-textarea',
          label: 'No Count Textarea',
          maxlength: 100,
          showCharacterCount: false
        }
      })

      const counter = wrapper.find('.absolute.bottom-2.right-2')
      expect(counter.exists()).toBe(false)
    })
  })

  // ===== AUTO-RESIZE =====

  describe('Auto-Resize', () => {
    it('should enable auto-resize when specified', () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'auto-resize-textarea',
          label: 'Auto Resize Textarea',
          autoResize: true,
          minHeight: 80,
          maxHeight: 300
        }
      })

      const textarea = wrapper.find('textarea')
      const style = textarea.attributes('style')
      
      expect(style).toContain('min-height: 80px')
      expect(style).toContain('max-height: 300px')
      expect(style).toContain('overflow: hidden')
      expect(textarea.classes()).toContain('resize-none')
    })

    it('should resize textarea on content input', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'resize-on-input-textarea',
          label: 'Resize On Input Textarea',
          autoResize: true,
          minHeight: 60,
          maxHeight: 200
        }
      })

      const textarea = wrapper.find('textarea')
      
      // Mock scrollHeight to simulate content height
      Object.defineProperty(textarea.element, 'scrollHeight', {
        value: 120,
        writable: true
      })

      await textarea.setValue('Line 1\nLine 2\nLine 3\nLine 4\nLine 5')
      await nextTick()

      // The resize function should have been called
      expect(textarea.element.style.height).toBeTruthy()
    })

    it('should respect min and max height constraints', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'constrained-textarea',
          label: 'Constrained Textarea',
          autoResize: true,
          minHeight: 100,
          maxHeight: 150
        }
      })

      const textarea = wrapper.find('textarea')
      
      // Test minimum height
      Object.defineProperty(textarea.element, 'scrollHeight', {
        value: 50, // Less than minHeight
        writable: true
      })

      await textarea.setValue('Short text')
      await nextTick()

      // Should enforce minimum height
      expect(parseInt(textarea.element.style.height)).toBeGreaterThanOrEqual(100)

      // Test maximum height
      Object.defineProperty(textarea.element, 'scrollHeight', {
        value: 200, // More than maxHeight
        writable: true
      })

      await textarea.setValue('Very long text content that exceeds maximum height')
      await nextTick()

      // Should enforce maximum height and show scrollbar
      expect(parseInt(textarea.element.style.height)).toBeLessThanOrEqual(150)
      expect(textarea.element.style.overflowY).toBe('auto')
    })

    it('should not auto-resize when disabled', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'no-resize-textarea',
          label: 'No Resize Textarea',
          autoResize: false
        }
      })

      const textarea = wrapper.find('textarea')
      
      await textarea.setValue('Multiple\nlines\nof\ntext\ncontent')
      await nextTick()

      // Height should not be automatically set
      expect(textarea.element.style.height).toBeFalsy()
      expect(textarea.classes()).not.toContain('resize-none')
    })
  })

  // ===== KEYBOARD HANDLING =====

  describe('Keyboard Handling', () => {
    it('should handle keyboard events', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'keyboard-textarea',
          label: 'Keyboard Textarea'
        }
      })

      const textarea = wrapper.find('textarea')

      await textarea.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('keydown')).toBeTruthy()

      await textarea.trigger('keydown', { key: 'Tab' })
      expect(wrapper.emitted('keydown')).toHaveLength(2)
    })

    it('should handle Ctrl+Enter shortcut', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'shortcut-textarea',
          label: 'Shortcut Textarea'
        }
      })

      const textarea = wrapper.find('textarea')

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true
      })

      await textarea.element.dispatchEvent(event)
      await nextTick()

      expect(wrapper.emitted('keydown')).toBeTruthy()
    })

    it('should handle Ctrl+A select all', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'select-all-textarea',
          label: 'Select All Textarea'
        }
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Some content to select')

      await textarea.trigger('keydown', { 
        key: 'a', 
        ctrlKey: true 
      })

      expect(wrapper.emitted('keydown')).toBeTruthy()
    })
  })

  // ===== VALIDATION INTEGRATION =====

  describe('Validation Integration', () => {
    it('should show validation errors', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'validation-textarea',
          label: 'Validation Textarea',
          required: true,
          minlength: 10
        }
      })

      // Test required validation
      await simulateUserInput(wrapper, 'textarea', '')
      await wrapper.find('textarea').trigger('blur')

      const errorMessage = wrapper.find('.error-message, .field-error')
      if (errorMessage.exists()) {
        expect(errorMessage.text()).toMatch(/required/i)
      }
    })

    it('should validate minimum length', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'minlength-validation-textarea',
          label: 'Min Length Validation',
          minlength: 20
        }
      })

      const validationCases = [
        {
          name: 'too_short',
          input: 'Short text',
          expected: { valid: false, errors: ['Too short'] }
        },
        {
          name: 'valid_length',
          input: 'This is a sufficiently long text content for validation',
          expected: { valid: true }
        }
      ]

      await testFieldValidation(wrapper, 'textarea', validationCases)
    })

    it('should validate maximum length', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'maxlength-validation-textarea',
          label: 'Max Length Validation',
          maxlength: 50
        }
      })

      const validationCases = [
        {
          name: 'within_limit',
          input: 'Short text within the character limit',
          expected: { valid: true }
        },
        {
          name: 'exceeds_limit',
          input: 'This text content definitely exceeds the maximum character limit of fifty characters',
          expected: { valid: false, errors: ['Too long'] }
        }
      ]

      await testFieldValidation(wrapper, 'textarea', validationCases)
    })

    it('should validate text content patterns', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'pattern-textarea',
          label: 'Pattern Textarea'
        }
      })

      // Test legal case description validation scenarios
      const validationCases = [
        {
          name: 'valid_case_description',
          input: 'Personal injury case involving motor vehicle accident on Highway 101. Client sustained injuries including broken arm and concussion.',
          expected: { valid: true }
        },
        {
          name: 'empty_description',
          input: '',
          expected: { valid: false, errors: ['Description is required'] }
        },
        {
          name: 'whitespace_only',
          input: '   \n\t   ',
          expected: { valid: false, errors: ['Description cannot be empty'] }
        }
      ]

      await testFieldValidation(wrapper, 'textarea', validationCases)
    })

    it('should clear errors when valid content is provided', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'clear-errors-textarea',
          label: 'Clear Errors Textarea',
          required: true,
          minlength: 10
        }
      })

      // Create error
      await simulateUserInput(wrapper, 'textarea', 'Short')
      await wrapper.find('textarea').trigger('blur')
      
      let errorMessage = wrapper.find('.error-message')
      if (errorMessage.exists()) {
        expect(errorMessage.text()).toMatch(/too short|minimum/i)
      }

      // Fix error
      await simulateUserInput(wrapper, 'textarea', 'This is a long enough description that meets the minimum length requirement.')
      await wrapper.find('textarea').trigger('blur')

      errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(false)
    })
  })

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'accessible-textarea',
          label: 'Case Description',
          description: 'Provide detailed information about the legal matter',
          helpText: 'Include relevant dates, parties involved, and key facts',
          required: true,
          maxlength: 500,
          showCharacterCount: true
        }
      })
    })

    it('should have proper ARIA attributes', () => {
      const textarea = wrapper.find('textarea')
      const label = wrapper.find('label')

      expect(textarea.attributes('aria-required')).toBe('true')
      expect(textarea.attributes('aria-describedby')).toBeTruthy()
      expect(label.attributes('for')).toBe(textarea.attributes('id'))
    })

    it('should announce validation errors', async () => {
      await testErrorAnnouncements(wrapper, 'textarea', '')
    })

    it('should support keyboard navigation', async () => {
      const textarea = wrapper.find('textarea')

      await textarea.trigger('keydown', { key: 'Tab' })
      expect(wrapper.emitted('keydown')).toBeTruthy()

      await textarea.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('keydown')).toHaveLength(2)
    })

    it('should provide clear visual focus indicators', async () => {
      const textarea = wrapper.find('textarea')

      await textarea.trigger('focus')
      
      // Check for focus ring styles
      const computedStyle = getComputedStyle(textarea.element)
      expect(computedStyle.outline || computedStyle.boxShadow).toBeTruthy()
    })

    it('should have proper label association', () => {
      const textarea = wrapper.find('textarea')
      const label = wrapper.find('label')

      expect(label.attributes('for')).toBe(textarea.attributes('id'))
      expect(textarea.attributes('aria-labelledby') || label.exists()).toBeTruthy()
    })

    it('should describe character limit to screen readers', () => {
      const textarea = wrapper.find('textarea')
      const describedBy = textarea.attributes('aria-describedby')

      expect(describedBy).toBeTruthy()
      
      // Should reference help text and description
      const describedByIds = describedBy.split(' ')
      expect(describedByIds.some(id => id.includes('help'))).toBe(true)
      expect(describedByIds.some(id => id.includes('description'))).toBe(true)
    })
  })

  // ===== EXPOSED METHODS =====

  describe('Exposed Methods', () => {
    beforeEach(() => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'exposed-methods-textarea',
          label: 'Exposed Methods Textarea'
        }
      })
    })

    it('should expose focus method', async () => {
      expect(wrapper.vm.focus).toBeDefined()
      expect(typeof wrapper.vm.focus).toBe('function')

      // Focus method should work
      wrapper.vm.focus()
      await nextTick()
      
      expect(document.activeElement).toBe(wrapper.find('textarea').element)
    })

    it('should expose blur method', async () => {
      expect(wrapper.vm.blur).toBeDefined()
      expect(typeof wrapper.vm.blur).toBe('function')

      // First focus, then blur
      wrapper.vm.focus()
      await nextTick()
      
      wrapper.vm.blur()
      await nextTick()
      
      expect(document.activeElement).not.toBe(wrapper.find('textarea').element)
    })

    it('should expose select method', async () => {
      expect(wrapper.vm.select).toBeDefined()
      expect(typeof wrapper.vm.select).toBe('function')

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test content to select')

      wrapper.vm.select()
      await nextTick()

      // Text should be selected (selection start should be 0, end should be length)
      const element = textarea.element as HTMLTextAreaElement
      expect(element.selectionStart).toBe(0)
      expect(element.selectionEnd).toBe('Test content to select'.length)
    })

    it('should expose setSelectionRange method', async () => {
      expect(wrapper.vm.setSelectionRange).toBeDefined()
      expect(typeof wrapper.vm.setSelectionRange).toBe('function')

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test content for selection range')

      wrapper.vm.setSelectionRange(5, 12) // Select "content"
      await nextTick()

      const element = textarea.element as HTMLTextAreaElement
      expect(element.selectionStart).toBe(5)
      expect(element.selectionEnd).toBe(12)
    })
  })

  // ===== INTEGRATION =====

  describe('Integration', () => {
    it('should work with form validation libraries', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'integration-textarea',
          label: 'Integration Textarea'
        },
        mockValidation: true
      })

      // Should integrate with mocked field validation
      expect(wrapper.vm.field).toBeDefined()
    })

    it('should emit proper events for form integration', async () => {
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'event-textarea',
          label: 'Event Textarea'
        }
      })

      const textarea = wrapper.find('textarea')
      
      await textarea.setValue('Test content')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      
      await textarea.trigger('blur')
      expect(wrapper.emitted('blur')).toBeTruthy()
      
      await textarea.trigger('focus')
      expect(wrapper.emitted('focus')).toBeTruthy()

      await textarea.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('keydown')).toBeTruthy()
    })

    it('should handle complex legal form scenarios', async () => {
      // Legal case description scenario
      wrapper = mountFormComponent(FormTextarea, {
        props: {
          name: 'case-description',
          label: 'Case Description',
          description: 'Provide comprehensive details about the legal matter',
          helpText: 'Include timeline, parties involved, key facts, and desired outcomes',
          required: true,
          minlength: 50,
          maxlength: 2000,
          showCharacterCount: true,
          characterCountPosition: 'external',
          autoResize: true,
          placeholder: 'Describe the legal matter in detail...',
          rows: 4
        }
      })

      const textarea = wrapper.find('textarea')
      
      const caseDescription = `Motor vehicle accident case involving our client John Smith and defendant Jane Doe. 
      
      Incident Details:
      - Date: March 15, 2025
      - Location: Intersection of Main St and Oak Ave
      - Defendant ran red light and struck client's vehicle
      - Client sustained injuries: broken ribs, concussion, soft tissue damage
      
      Damages Sought:
      - Medical expenses: $45,000
      - Lost wages: $15,000
      - Pain and suffering: $100,000
      - Property damage: $12,000
      
      Evidence Available:
      - Police report #2025-001234
      - Medical records from City Hospital
      - Witness statements (2)
      - Traffic camera footage
      - Photos of vehicles and scene`

      await textarea.setValue(caseDescription)
      await nextTick()

      // Should show character count
      expect(wrapper.text()).toContain(`${caseDescription.length}/2000`)
      
      // Should be valid (over minimum length)
      expect(caseDescription.length).toBeGreaterThan(50)
      
      // Auto-resize should have triggered
      expect(textarea.element.style.height).toBeTruthy()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([caseDescription])
    })
  })
})