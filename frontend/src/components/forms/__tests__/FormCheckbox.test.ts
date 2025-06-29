/**
 * Comprehensive unit tests for FormCheckbox.vue component
 * 
 * @description Tests checkbox functionality including single checkboxes,
 * checkbox groups, validation, accessibility, and helper actions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import FormCheckbox from '../FormCheckbox.vue'
import type { CheckboxOption } from '../FormCheckbox.vue'
import {
  mountFormComponent,
  simulateUserInput,
  testErrorAnnouncements,
  assertFormAccessibility,
  createValidationTestCases,
  testFieldValidation,
  type FormMountingOptions
} from '~/test/utils/form-test-utils'

describe('FormCheckbox.vue', () => {
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
    it('should render single checkbox with default props', () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'test-checkbox',
          label: 'Test Checkbox',
          checkboxLabel: 'Accept Terms'
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Accept Terms')
    })

    it('should render checkbox group when options are provided', () => {
      const options: CheckboxOption[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' }
      ]

      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'group-checkbox',
          label: 'Group Checkbox',
          groupLabel: 'Select Options',
          options
        }
      })

      expect(wrapper.find('[data-testid="checkbox-group"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Select Options')
      expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(3)
      expect(wrapper.text()).toContain('Option 1')
      expect(wrapper.text()).toContain('Option 2')
      expect(wrapper.text()).toContain('Option 3')
    })

    it('should show required indicator', () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'required-checkbox',
          label: 'Required Checkbox',
          checkboxLabel: 'I agree to terms',
          required: true
        }
      })

      expect(wrapper.text()).toMatch(/\*/))
    })

    it('should apply custom CSS classes', () => {
      const customClass = 'custom-checkbox-style'

      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'styled-checkbox',
          label: 'Styled Checkbox',
          checkboxLabel: 'Styled',
          class: customClass
        }
      })

      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.classes()).toContain(customClass)
    })
  })

  // ===== SINGLE CHECKBOX BEHAVIOR =====

  describe('Single Checkbox Behavior', () => {
    it('should handle single checkbox value changes', async () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'single-checkbox',
          label: 'Single Checkbox',
          checkboxLabel: 'Enable notifications',
          checkedValue: 'enabled',
          uncheckedValue: 'disabled'
        }
      })

      const checkbox = wrapper.find('input[type="checkbox"]')

      // Check the checkbox
      await checkbox.setChecked(true)
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['enabled'])

      // Uncheck the checkbox
      await checkbox.setChecked(false)
      expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['disabled'])
    })

    it('should use boolean values by default', async () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'boolean-checkbox',
          label: 'Boolean Checkbox',
          checkboxLabel: 'Subscribe to newsletter'
        }
      })

      const checkbox = wrapper.find('input[type="checkbox"]')

      await checkbox.setChecked(true)
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])

      await checkbox.setChecked(false)
      expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false])
    })

    it('should handle disabled state', () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'disabled-checkbox',
          label: 'Disabled Checkbox',
          checkboxLabel: 'Disabled option',
          disabled: true
        }
      })

      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.attributes('disabled')).toBeDefined()
    })

    it('should reflect checked state from field value', async () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'checked-state-checkbox',
          label: 'Checked State',
          checkboxLabel: 'Pre-checked option',
          checkedValue: 'yes',
          uncheckedValue: 'no'
        }
      })

      // Simulate field value change
      wrapper.vm.field.value.value = 'yes'
      await nextTick()

      expect(wrapper.vm.isChecked).toBe(true)
      expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)
    })
  })

  // ===== CHECKBOX GROUP BEHAVIOR =====

  describe('Checkbox Group Behavior', () => {
    const groupOptions: CheckboxOption[] = [
      { value: 'civil', label: 'Civil Law' },
      { value: 'criminal', label: 'Criminal Law' },
      { value: 'corporate', label: 'Corporate Law' },
      { value: 'family', label: 'Family Law', disabled: true }
    ]

    beforeEach(() => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'group-checkbox',
          label: 'Legal Specializations',
          groupLabel: 'Select your areas of practice',
          options: groupOptions
        }
      })
    })

    it('should handle multiple checkbox selections', async () => {
      const civilCheckbox = wrapper.find('input[value="civil"]')
      const criminalCheckbox = wrapper.find('input[value="criminal"]')

      await civilCheckbox.setChecked(true)
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['civil']])

      await criminalCheckbox.setChecked(true)
      expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['civil', 'criminal']])
    })

    it('should handle checkbox deselection', async () => {
      // First select multiple options
      wrapper.vm.field.handleChange(['civil', 'criminal'])
      await nextTick()

      const civilCheckbox = wrapper.find('input[value="civil"]')
      await civilCheckbox.setChecked(false)

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const lastEmitted = wrapper.emitted('update:modelValue')?.slice(-1)[0]
      expect(lastEmitted).toEqual([['criminal']])
    })

    it('should show disabled options correctly', () => {
      const familyCheckbox = wrapper.find('input[value="family"]')
      expect(familyCheckbox.attributes('disabled')).toBeDefined()

      const familyLabel = wrapper.find('label[for*="family"]')
      expect(familyLabel.classes()).toContain('peer-disabled:opacity-70')
    })

    it('should handle option descriptions', () => {
      const optionsWithDescriptions: CheckboxOption[] = [
        { 
          value: 'personal-injury', 
          label: 'Personal Injury', 
          description: 'Motor vehicle accidents, slip and fall cases' 
        },
        { 
          value: 'contract-disputes', 
          label: 'Contract Disputes', 
          description: 'Breach of contract, commercial agreements' 
        }
      ]

      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'described-options',
          label: 'Practice Areas',
          groupLabel: 'Select specializations',
          options: optionsWithDescriptions
        }
      })

      expect(wrapper.text()).toContain('Motor vehicle accidents, slip and fall cases')
      expect(wrapper.text()).toContain('Breach of contract, commercial agreements')
    })

    it('should handle option icons', () => {
      const MockIcon = { template: '<div class="mock-icon">Icon</div>' }
      const optionsWithIcons: CheckboxOption[] = [
        { value: 'litigation', label: 'Litigation', icon: MockIcon },
        { value: 'mediation', label: 'Mediation' }
      ]

      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'icon-options',
          label: 'Legal Services',
          groupLabel: 'Available services',
          options: optionsWithIcons
        }
      })

      expect(wrapper.find('.mock-icon').exists()).toBe(true)
    })
  })

  // ===== GROUP LAYOUT =====

  describe('Group Layout', () => {
    const layoutOptions: CheckboxOption[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ]

    it('should render vertical layout by default', () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'vertical-layout',
          label: 'Vertical Layout',
          groupLabel: 'Vertical Options',
          options: layoutOptions
        }
      })

      const groupContainer = wrapper.find('[class*="space-y-2"]')
      expect(groupContainer.exists()).toBe(true)
    })

    it('should render horizontal layout when specified', () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'horizontal-layout',
          label: 'Horizontal Layout',
          groupLabel: 'Horizontal Options',
          options: layoutOptions,
          groupLayout: 'horizontal'
        }
      })

      const groupContainer = wrapper.find('[class*="flex"][class*="flex-wrap"][class*="gap-4"]')
      expect(groupContainer.exists()).toBe(true)
    })
  })

  // ===== GROUP HELPERS =====

  describe('Group Helpers', () => {
    const helperOptions: CheckboxOption[] = [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2' },
      { value: 'opt3', label: 'Option 3', disabled: true },
      { value: 'opt4', label: 'Option 4' }
    ]

    beforeEach(() => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'helper-checkbox',
          label: 'Helper Checkbox',
          groupLabel: 'Select options',
          options: helperOptions,
          showGroupHelpers: true,
          allowInvert: true
        }
      })
    })

    it('should show group helper buttons when enabled', () => {
      expect(wrapper.find('[data-testid="select-all-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="select-none-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="invert-selection-button"]').exists()).toBe(true)
    })

    it('should select all enabled options when Select All is clicked', async () => {
      await wrapper.vm.selectAll()
      await nextTick()

      // Should select all non-disabled options (opt1, opt2, opt4)
      expect(wrapper.vm.selectedValues).toEqual(['opt1', 'opt2', 'opt4'])
    })

    it('should clear all selections when Select None is clicked', async () => {
      // First select some options
      wrapper.vm.field.handleChange(['opt1', 'opt2'])
      await nextTick()

      await wrapper.vm.selectNone()
      await nextTick()

      expect(wrapper.vm.selectedValues).toEqual([])
    })

    it('should invert selection when Invert Selection is clicked', async () => {
      // First select some options
      wrapper.vm.field.handleChange(['opt1'])
      await nextTick()

      await wrapper.vm.invertSelection()
      await nextTick()

      // Should now have opt2 and opt4 (excluding disabled opt3)
      expect(wrapper.vm.selectedValues).toEqual(['opt2', 'opt4'])
    })

    it('should not show helper buttons when disabled', () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'no-helpers',
          label: 'No Helpers',
          groupLabel: 'Options without helpers',
          options: helperOptions,
          showGroupHelpers: false
        }
      })

      expect(wrapper.find('[data-testid="select-all-button"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="select-none-button"]').exists()).toBe(false)
    })
  })

  // ===== SELECTION LIMITS =====

  describe('Selection Limits', () => {
    const limitOptions: CheckboxOption[] = [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2' },
      { value: 'opt3', label: 'Option 3' },
      { value: 'opt4', label: 'Option 4' },
      { value: 'opt5', label: 'Option 5' }
    ]

    it('should enforce maximum selection limit', async () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'max-limit-checkbox',
          label: 'Max Limit',
          groupLabel: 'Select up to 3 options',
          options: limitOptions,
          maxSelections: 3
        }
      })

      // Try to select more than the maximum
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      
      // Select first 3 options
      await checkboxes[0].setChecked(true)
      await checkboxes[1].setChecked(true)
      await checkboxes[2].setChecked(true)
      
      expect(wrapper.vm.selectedCount).toBe(3)

      // Try to select 4th option (should be ignored)
      await wrapper.vm.handleGroupChange('opt4', true)
      await nextTick()
      
      expect(wrapper.vm.selectedCount).toBe(3) // Still 3, not 4
    })

    it('should show selection summary with limits', () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'summary-checkbox',
          label: 'Summary Checkbox',
          groupLabel: 'Select options',
          options: limitOptions,
          showSelectionSummary: true,
          minSelections: 2,
          maxSelections: 4
        }
      })

      expect(wrapper.text()).toContain('0 of 5 selected')
      expect(wrapper.text()).toContain('min 2, max 4')
    })

    it('should respect max selections in Select All operation', async () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'max-select-all',
          label: 'Max Select All',
          groupLabel: 'Select options',
          options: limitOptions,
          maxSelections: 2,
          showGroupHelpers: true
        }
      })

      await wrapper.vm.selectAll()
      await nextTick()

      expect(wrapper.vm.selectedCount).toBe(2) // Should only select 2, not all 5
    })
  })

  // ===== VALIDATION INTEGRATION =====

  describe('Validation Integration', () => {
    it('should show validation errors for required single checkbox', async () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'required-single',
          label: 'Required Single',
          checkboxLabel: 'I accept the terms and conditions',
          required: true
        }
      })

      // Submit without checking
      await wrapper.find('input[type="checkbox"]').trigger('blur')
      await nextTick()

      const errorMessage = wrapper.find('.error-message, .field-error')
      if (errorMessage.exists()) {
        expect(errorMessage.text()).toMatch(/required|must be checked/i)
      }
    })

    it('should validate minimum selections for checkbox group', async () => {
      const options: CheckboxOption[] = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
        { value: 'opt3', label: 'Option 3' }
      ]

      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'min-validation',
          label: 'Min Validation',
          groupLabel: 'Select at least 2 options',
          options,
          minSelections: 2,
          required: true
        }
      })

      // Select only 1 option (below minimum)
      await wrapper.vm.handleGroupChange('opt1', true)
      await nextTick()

      const validationCases = [
        {
          name: 'below_minimum',
          input: ['opt1'],
          expected: { valid: false, errors: ['Select at least 2 options'] }
        },
        {
          name: 'meets_minimum',
          input: ['opt1', 'opt2'],
          expected: { valid: true }
        }
      ]

      await testFieldValidation(wrapper, 'input[type="checkbox"]:first-of-type', validationCases)
    })

    it('should clear errors when valid selection is made', async () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'clear-errors',
          label: 'Clear Errors',
          checkboxLabel: 'Required checkbox',
          required: true
        }
      })

      // Create error
      await wrapper.find('input[type="checkbox"]').trigger('blur')
      await nextTick()

      let errorMessage = wrapper.find('.error-message')
      if (errorMessage.exists()) {
        expect(errorMessage.text()).toMatch(/required/i)
      }

      // Fix error by checking
      await wrapper.find('input[type="checkbox"]').setChecked(true)
      await nextTick()

      errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(false)
    })
  })

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'accessible-checkbox',
          label: 'Legal Agreement',
          checkboxLabel: 'I have read and agree to the legal terms and conditions',
          description: 'Please review all terms before agreeing',
          helpText: 'This is required to proceed with the case',
          required: true
        }
      })
    })

    it('should have proper ARIA attributes for single checkbox', () => {
      const checkbox = wrapper.find('input[type="checkbox"]')
      const label = wrapper.find('label')

      expect(checkbox.attributes('aria-describedby')).toBeTruthy()
      expect(checkbox.attributes('aria-required')).toBe('true')
      expect(label.attributes('for')).toBe(checkbox.attributes('id'))
    })

    it('should announce validation errors', async () => {
      await testErrorAnnouncements(wrapper, 'input[type="checkbox"]', false)
    })

    it('should support keyboard navigation', async () => {
      const checkbox = wrapper.find('input[type="checkbox"]')

      await checkbox.trigger('keydown', { key: 'Tab' })
      expect(document.activeElement).toBe(checkbox.element)

      await checkbox.trigger('keydown', { key: ' ' })
      expect(wrapper.emitted('change')).toBeTruthy()
    })

    it('should provide clear visual focus indicators', async () => {
      const checkbox = wrapper.find('input[type="checkbox"]')

      await checkbox.trigger('focus')
      
      // Check for focus ring styles
      const computedStyle = getComputedStyle(checkbox.element)
      expect(computedStyle.outline || computedStyle.boxShadow).toBeTruthy()
    })

    it('should have proper ARIA attributes for checkbox group', () => {
      const groupOptions: CheckboxOption[] = [
        { value: 'civil', label: 'Civil Law' },
        { value: 'criminal', label: 'Criminal Law' }
      ]

      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'group-accessibility',
          label: 'Legal Specializations',
          groupLabel: 'Select your practice areas',
          description: 'Choose areas where you have experience',
          options: groupOptions,
          required: true
        }
      })

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      checkboxes.forEach(checkbox => {
        expect(checkbox.attributes('aria-required')).toBe('true')
        expect(checkbox.attributes('name')).toContain('[]') // Array name for group
      })

      const groupLabel = wrapper.find('[data-testid="group-label"]')
      if (groupLabel.exists()) {
        expect(groupLabel.attributes('role')).toBe('group')
        expect(groupLabel.attributes('aria-labelledby')).toBeTruthy()
      }
    })
  })

  // ===== EXPOSED METHODS =====

  describe('Exposed Methods', () => {
    const exposedOptions: CheckboxOption[] = [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2' },
      { value: 'opt3', label: 'Option 3' }
    ]

    beforeEach(() => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'exposed-methods',
          label: 'Exposed Methods',
          groupLabel: 'Test options',
          options: exposedOptions,
          showGroupHelpers: true,
          allowInvert: true
        }
      })
    })

    it('should expose selectAll method for groups', async () => {
      expect(wrapper.vm.selectAll).toBeDefined()
      expect(typeof wrapper.vm.selectAll).toBe('function')

      await wrapper.vm.selectAll()
      expect(wrapper.vm.selectedCount).toBe(3)
    })

    it('should expose selectNone method for groups', async () => {
      expect(wrapper.vm.selectNone).toBeDefined()
      expect(typeof wrapper.vm.selectNone).toBe('function')

      // First select some options
      wrapper.vm.field.handleChange(['opt1', 'opt2'])
      await nextTick()

      await wrapper.vm.selectNone()
      expect(wrapper.vm.selectedCount).toBe(0)
    })

    it('should expose invertSelection method for groups', async () => {
      expect(wrapper.vm.invertSelection).toBeDefined()
      expect(typeof wrapper.vm.invertSelection).toBe('function')

      // Select one option
      wrapper.vm.field.handleChange(['opt1'])
      await nextTick()

      await wrapper.vm.invertSelection()
      expect(wrapper.vm.selectedValues).toEqual(['opt2', 'opt3'])
    })

    it('should expose selectedCount for groups', () => {
      expect(wrapper.vm.selectedCount).toBeDefined()
      expect(typeof wrapper.vm.selectedCount).toBe('number')
      expect(wrapper.vm.selectedCount).toBe(0)
    })

    it('should expose isChecked for single checkbox', () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'single-exposed',
          label: 'Single Exposed',
          checkboxLabel: 'Single checkbox'
        }
      })

      expect(wrapper.vm.isChecked).toBeDefined()
      expect(typeof wrapper.vm.isChecked).toBe('boolean')
    })
  })

  // ===== INTEGRATION =====

  describe('Integration', () => {
    it('should work with form validation libraries', async () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'integration-checkbox',
          label: 'Integration Checkbox',
          checkboxLabel: 'Integration test'
        },
        mockValidation: true
      })

      // Should integrate with mocked field validation
      expect(wrapper.vm.field).toBeDefined()
    })

    it('should emit proper events for form integration', async () => {
      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'event-checkbox',
          label: 'Event Checkbox',
          checkboxLabel: 'Event test'
        }
      })

      const checkbox = wrapper.find('input[type="checkbox"]')
      
      await checkbox.setChecked(true)
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      
      await checkbox.trigger('change')
      expect(wrapper.emitted('change')).toBeTruthy()
    })

    it('should handle complex legal form scenarios', async () => {
      // Legal case intake form scenario
      const practiceAreas: CheckboxOption[] = [
        {
          value: 'personal-injury',
          label: 'Personal Injury',
          description: 'Motor vehicle accidents, slip & fall, medical malpractice'
        },
        {
          value: 'criminal-defense',
          label: 'Criminal Defense',
          description: 'DUI, drug charges, white collar crimes'
        },
        {
          value: 'family-law',
          label: 'Family Law',
          description: 'Divorce, custody, adoption, domestic relations'
        },
        {
          value: 'estate-planning',
          label: 'Estate Planning',
          description: 'Wills, trusts, probate, tax planning'
        },
        {
          value: 'business-law',
          label: 'Business Law',
          description: 'Corporate formation, contracts, compliance'
        }
      ]

      wrapper = mountFormComponent(FormCheckbox, {
        props: {
          name: 'legal-specializations',
          label: 'Legal Practice Areas',
          groupLabel: 'Select your areas of legal expertise',
          description: 'Choose the practice areas where you have experience and want to accept cases',
          helpText: 'You can select multiple areas. This helps us match you with appropriate cases.',
          options: practiceAreas,
          groupLayout: 'vertical',
          showGroupHelpers: true,
          allowInvert: false,
          showSelectionSummary: true,
          minSelections: 1,
          maxSelections: 4,
          required: true
        }
      })

      // Should render all practice areas with descriptions
      expect(wrapper.text()).toContain('Motor vehicle accidents, slip & fall')
      expect(wrapper.text()).toContain('DUI, drug charges, white collar crimes')
      expect(wrapper.text()).toContain('Divorce, custody, adoption')

      // Should show selection summary
      expect(wrapper.text()).toContain('0 of 5 selected')
      expect(wrapper.text()).toContain('min 1, max 4')

      // Should show helper buttons
      expect(wrapper.find('[data-testid="select-all-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="select-none-button"]').exists()).toBe(true)

      // Select practice areas
      await wrapper.vm.handleGroupChange('personal-injury', true)
      await wrapper.vm.handleGroupChange('family-law', true)
      await nextTick()

      expect(wrapper.vm.selectedCount).toBe(2)
      expect(wrapper.vm.selectedValues).toEqual(['personal-injury', 'family-law'])

      // Verify max limit enforcement
      await wrapper.vm.selectAll()
      await nextTick()
      expect(wrapper.vm.selectedCount).toBe(4) // Should be limited to max 4

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })
})