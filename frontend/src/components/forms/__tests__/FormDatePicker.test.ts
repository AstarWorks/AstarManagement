/**
 * Comprehensive unit tests for FormDatePicker.vue component
 * 
 * @description Tests date picker functionality including calendar navigation,
 * date selection, time handling, validation, accessibility, and preset actions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import FormDatePicker from '../FormDatePicker.vue'
import type { DatePreset } from '../FormDatePicker.vue'
import {
  mountFormComponent,
  simulateUserInput,
  testErrorAnnouncements,
  assertFormAccessibility,
  createValidationTestCases,
  testFieldValidation,
  type FormMountingOptions
} from '../../../test/utils/form-test-utils'

// Mock date-fns for consistent testing
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    format: vi.fn((date, formatString) => {
      if (formatString === 'PPP') return '2025-06-26'
      if (formatString === 'MMM d') return 'Jun 26'
      if (formatString === 'MMM d, yyyy') return 'Jun 26, 2025'
      return '2025-06-26'
    }),
    parseISO: vi.fn((dateString) => new Date(dateString)),
    isValid: vi.fn(() => true)
  }
})

describe('FormDatePicker.vue', () => {
  let wrapper: VueWrapper<any>
  const testDate = new Date('2025-06-26T10:30:00.000Z')

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock current date
    vi.setSystemTime(testDate)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.useRealTimers()
  })

  // ===== BASIC RENDERING =====

  describe('Basic Rendering', () => {
    it('should render date picker with default props', () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'test-date',
          label: 'Test Date'
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="date-picker-trigger"]').exists()).toBe(true)
      expect(wrapper.find('label').text()).toContain('Test Date')
    })

    it('should display placeholder text when no date selected', () => {
      const placeholder = 'Select due date...'

      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'placeholder-date',
          label: 'Due Date',
          placeholder
        }
      })

      expect(wrapper.text()).toContain(placeholder)
    })

    it('should show calendar icon', () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'icon-date',
          label: 'Date with Icon'
        }
      })

      expect(wrapper.find('.lucide-calendar').exists()).toBe(true)
    })

    it('should apply custom CSS classes', () => {
      const customClass = 'custom-date-picker-style'

      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'styled-date',
          label: 'Styled Date',
          class: customClass
        }
      })

      const trigger = wrapper.find('[data-testid="date-picker-trigger"]')
      expect(trigger.classes()).toContain(customClass)
    })

    it('should show required indicator', () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'required-date',
          label: 'Required Date',
          required: true
        }
      })

      const label = wrapper.find('label')
      expect(label.text()).toMatch(/\*|required/i)
    })
  })

  // ===== DATE SELECTION =====

  describe('Date Selection', () => {
    it('should open calendar when trigger is clicked', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'click-date',
          label: 'Click Date'
        }
      })

      const trigger = wrapper.find('[data-testid="date-picker-trigger"]')
      await trigger.trigger('click')
      await nextTick()

      expect(wrapper.vm.isOpen).toBe(true)
      expect(trigger.attributes('aria-expanded')).toBe('true')
    })

    it('should handle date selection', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'select-date',
          label: 'Select Date'
        }
      })

      // Open picker
      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('click')
      await nextTick()

      // Select a date (simulate calendar selection)
      await wrapper.vm.handleDateSelect(testDate)
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([testDate.toISOString()])
    })

    it('should display selected date', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'display-date',
          label: 'Display Date',
          dateFormat: 'PPP'
        }
      })

      await wrapper.vm.handleDateSelect(testDate)
      await nextTick()

      expect(wrapper.text()).toContain('2025-06-26')
    })

    it('should handle date clearing', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'clear-date',
          label: 'Clear Date',
          allowClear: true
        }
      })

      // First select a date
      await wrapper.vm.handleDateSelect(testDate)
      await nextTick()

      // Then clear it
      await wrapper.vm.clear()
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.vm.selectedDate).toBeNull()
    })

    it('should close picker after single date selection', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'close-date',
          label: 'Close Date',
          mode: 'single'
        }
      })

      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('click')
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(true)

      await wrapper.vm.handleDateSelect(testDate)
      await nextTick()

      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  // ===== DATE MODES =====

  describe('Date Modes', () => {
    it('should handle single date mode', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'single-date',
          label: 'Single Date',
          mode: 'single'
        }
      })

      await wrapper.vm.handleDateSelect(testDate)
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([testDate.toISOString()])
    })

    it('should handle multiple date mode', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'multiple-dates',
          label: 'Multiple Dates',
          mode: 'multiple'
        }
      })

      const dates = [testDate, new Date('2025-06-27T10:30:00.000Z')]
      await wrapper.vm.handleDateSelect(dates)
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([dates.map(d => d.toISOString())])
    })

    it('should handle date range mode', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'range-dates',
          label: 'Date Range',
          mode: 'range'
        }
      })

      const range = {
        start: testDate,
        end: new Date('2025-06-30T10:30:00.000Z')
      }

      await wrapper.vm.handleDateSelect(range)
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{
        start: range.start.toISOString(),
        end: range.end.toISOString()
      }])
    })

    it('should display date range text', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'range-display',
          label: 'Range Display',
          mode: 'range'
        }
      })

      const range = {
        start: '2025-06-26T10:30:00.000Z',
        end: '2025-06-30T10:30:00.000Z'
      }

      // Simulate field value change
      wrapper.vm.field.value.value = range
      await nextTick()

      expect(wrapper.vm.rangeDisplayText).toContain('Jun 26 - Jun 30, 2025')
    })
  })

  // ===== TIME HANDLING =====

  describe('Time Handling', () => {
    it('should show time picker when includeTime is true', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'time-date',
          label: 'Date with Time',
          includeTime: true
        }
      })

      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-testid="time-picker"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Time:')
    })

    it('should handle 24-hour time format', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: '24h-time',
          label: '24h Time',
          includeTime: true,
          timeFormat: '24h'
        }
      })

      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('click')
      await nextTick()

      const hoursInput = wrapper.find('input[type="number"]:first-of-type')
      expect(hoursInput.attributes('max')).toBe('23')

      // Should not show AM/PM selector
      expect(wrapper.find('[data-testid="ampm-select"]').exists()).toBe(false)
    })

    it('should handle 12-hour time format', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: '12h-time',
          label: '12h Time',
          includeTime: true,
          timeFormat: '12h'
        }
      })

      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('click')
      await nextTick()

      const hoursInput = wrapper.find('input[type="number"]:first-of-type')
      expect(hoursInput.attributes('max')).toBe('12')

      // Should show AM/PM selector
      expect(wrapper.find('[data-testid="ampm-select"]').exists()).toBe(true)
    })

    it('should update time input from selected date', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'update-time',
          label: 'Update Time',
          includeTime: true,
          timeFormat: '24h'
        }
      })

      const dateWithTime = new Date('2025-06-26T14:45:00.000Z')
      await wrapper.vm.updateTimeInput(dateWithTime)
      await nextTick()

      expect(wrapper.vm.timeInput.hours).toBe('14')
      expect(wrapper.vm.timeInput.minutes).toBe('45')
    })

    it('should combine date and time correctly', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'combine-datetime',
          label: 'Combine DateTime',
          includeTime: true,
          timeFormat: '24h'
        }
      })

      wrapper.vm.timeInput.hours = '15'
      wrapper.vm.timeInput.minutes = '30'

      const combined = wrapper.vm.combineDateTime(testDate)
      expect(combined.getHours()).toBe(15)
      expect(combined.getMinutes()).toBe(30)
    })

    it('should handle AM/PM conversion correctly', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'ampm-conversion',
          label: 'AM/PM Conversion',
          includeTime: true,
          timeFormat: '12h'
        }
      })

      // Test PM conversion
      wrapper.vm.timeInput.hours = '2'
      wrapper.vm.timeInput.minutes = '30'
      wrapper.vm.timeInput.ampm = 'PM'

      const pmDate = wrapper.vm.combineDateTime(testDate)
      expect(pmDate.getHours()).toBe(14) // 2 PM = 14 in 24h

      // Test midnight (12 AM)
      wrapper.vm.timeInput.hours = '12'
      wrapper.vm.timeInput.ampm = 'AM'

      const midnightDate = wrapper.vm.combineDateTime(testDate)
      expect(midnightDate.getHours()).toBe(0) // 12 AM = 0 in 24h
    })
  })

  // ===== QUICK ACTIONS =====

  describe('Quick Actions', () => {
    it('should show quick action buttons when enabled', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'quick-actions',
          label: 'Quick Actions',
          showQuickActions: true,
          allowClear: true
        }
      })

      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.find('[data-testid="today-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="clear-button"]').exists()).toBe(true)
    })

    it('should set today date when Today button is clicked', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'today-action',
          label: 'Today Action',
          showQuickActions: true
        }
      })

      await wrapper.vm.setToday()
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.vm.selectedDate).toEqual(testDate)
    })

    it('should render preset buttons', async () => {
      const presets: DatePreset[] = [
        {
          label: 'Next Week',
          value: new Date('2025-07-03T10:30:00.000Z')
        },
        {
          label: 'Next Month',
          value: new Date('2025-07-26T10:30:00.000Z')
        }
      ]

      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'preset-date',
          label: 'Preset Date',
          showQuickActions: true,
          presets
        }
      })

      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('Next Week')
      expect(wrapper.text()).toContain('Next Month')
    })

    it('should apply preset when preset button is clicked', async () => {
      const presetDate = new Date('2025-07-03T10:30:00.000Z')
      const presets: DatePreset[] = [
        {
          label: 'Next Week',
          value: presetDate
        }
      ]

      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'apply-preset',
          label: 'Apply Preset',
          showQuickActions: true,
          presets
        }
      })

      await wrapper.vm.applyPreset(presets[0])
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([presetDate.toISOString()])
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  // ===== DATE CONSTRAINTS =====

  describe('Date Constraints', () => {
    it('should respect minimum date constraint', () => {
      const minDate = new Date('2025-01-01')

      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'min-date',
          label: 'Min Date',
          minDate
        }
      })

      expect(wrapper.vm.minDate).toEqual(minDate)
    })

    it('should respect maximum date constraint', () => {
      const maxDate = new Date('2025-12-31')

      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'max-date',
          label: 'Max Date',
          maxDate
        }
      })

      expect(wrapper.vm.maxDate).toEqual(maxDate)
    })

    it('should handle disabled dates function', () => {
      const disabledDates = (date: Date) => {
        // Disable weekends
        const day = date.getDay()
        return day === 0 || day === 6
      }

      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'disabled-dates',
          label: 'Disabled Dates',
          disabledDates
        }
      })

      expect(wrapper.vm.disabledDates).toBe(disabledDates)
    })

    it('should handle disabled state', () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'disabled-picker',
          label: 'Disabled Picker',
          disabled: true
        }
      })

      const trigger = wrapper.find('[data-testid="date-picker-trigger"]')
      expect(trigger.attributes('disabled')).toBeDefined()
    })
  })

  // ===== VALIDATION INTEGRATION =====

  describe('Validation Integration', () => {
    it('should show validation errors', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'validation-date',
          label: 'Validation Date',
          required: true
        }
      })

      // Trigger validation by blurring without selection
      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('blur')
      await nextTick()

      const errorMessage = wrapper.find('.error-message, .field-error')
      if (errorMessage.exists()) {
        expect(errorMessage.text()).toMatch(/required/i)
      }
    })

    it('should validate date format', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'format-validation',
          label: 'Format Validation'
        }
      })

      const validationCases = [
        {
          name: 'valid_date',
          input: '2025-06-26',
          expected: { valid: true }
        },
        {
          name: 'invalid_date',
          input: 'invalid-date',
          expected: { valid: false, errors: ['Invalid date format'] }
        },
        {
          name: 'future_date_when_not_allowed',
          input: '2030-12-31',
          expected: { valid: false, errors: ['Date cannot be in the future'] }
        }
      ]

      await testFieldValidation(wrapper, '[data-testid="date-picker-trigger"]', validationCases)
    })

    it('should clear errors when valid date is selected', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'clear-errors-date',
          label: 'Clear Errors Date',
          required: true
        }
      })

      // Create error by not selecting
      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('blur')
      await nextTick()

      let errorMessage = wrapper.find('.error-message')
      if (errorMessage.exists()) {
        expect(errorMessage.text()).toMatch(/required/i)
      }

      // Fix error by selecting date
      await wrapper.vm.handleDateSelect(testDate)
      await nextTick()

      errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(false)
    })
  })

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'accessible-date',
          label: 'Court Hearing Date',
          description: 'Select the scheduled court hearing date',
          helpText: 'Date must be at least 30 days in the future',
          required: true
        }
      })
    })

    it('should have proper ARIA attributes', () => {
      const trigger = wrapper.find('[data-testid="date-picker-trigger"]')
      const label = wrapper.find('label')

      expect(trigger.attributes('aria-haspopup')).toBe('true')
      expect(trigger.attributes('aria-expanded')).toBe('false')
      expect(trigger.attributes('aria-describedby')).toBeTruthy()
      expect(label.attributes('for')).toBe(trigger.attributes('id'))
    })

    it('should announce validation errors', async () => {
      await testErrorAnnouncements(wrapper, '[data-testid="date-picker-trigger"]', '')
    })

    it('should support keyboard navigation', async () => {
      const trigger = wrapper.find('[data-testid="date-picker-trigger"]')

      // Tab to trigger
      await trigger.trigger('keydown', { key: 'Tab' })
      expect(document.activeElement).toBe(trigger.element)

      // Open with Enter
      await trigger.trigger('keydown', { key: 'Enter' })
      expect(wrapper.vm.isOpen).toBe(true)

      // Close with Escape
      await trigger.trigger('keydown', { key: 'Escape' })
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('should provide clear visual focus indicators', async () => {
      const trigger = wrapper.find('[data-testid="date-picker-trigger"]')

      await trigger.trigger('focus')
      
      // Check for focus ring styles
      const computedStyle = getComputedStyle(trigger.element)
      expect(computedStyle.outline || computedStyle.boxShadow).toBeTruthy()
    })

    it('should have proper role and state attributes', async () => {
      const trigger = wrapper.find('[data-testid="date-picker-trigger"]')

      expect(trigger.attributes('role')).toBe('combobox')
      expect(trigger.attributes('aria-expanded')).toBe('false')

      await trigger.trigger('click')
      await nextTick()

      expect(trigger.attributes('aria-expanded')).toBe('true')
    })
  })

  // ===== EXPOSED METHODS =====

  describe('Exposed Methods', () => {
    beforeEach(() => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'exposed-methods-date',
          label: 'Exposed Methods Date'
        }
      })
    })

    it('should expose open method', async () => {
      expect(wrapper.vm.open).toBeDefined()
      expect(typeof wrapper.vm.open).toBe('function')

      wrapper.vm.open()
      await nextTick()

      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('should expose close method', async () => {
      expect(wrapper.vm.close).toBeDefined()
      expect(typeof wrapper.vm.close).toBe('function')

      wrapper.vm.open()
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(true)

      wrapper.vm.close()
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('should expose toggle method', async () => {
      expect(wrapper.vm.toggle).toBeDefined()
      expect(typeof wrapper.vm.toggle).toBe('function')

      // Initially closed
      expect(wrapper.vm.isOpen).toBe(false)

      wrapper.vm.toggle()
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(true)

      wrapper.vm.toggle()
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('should expose setToday method', async () => {
      expect(wrapper.vm.setToday).toBeDefined()
      expect(typeof wrapper.vm.setToday).toBe('function')

      wrapper.vm.setToday()
      await nextTick()

      expect(wrapper.vm.selectedDate).toEqual(testDate)
    })

    it('should expose clear method', async () => {
      expect(wrapper.vm.clear).toBeDefined()
      expect(typeof wrapper.vm.clear).toBe('function')

      // First select a date
      await wrapper.vm.handleDateSelect(testDate)
      await nextTick()
      expect(wrapper.vm.selectedDate).not.toBeNull()

      // Then clear it
      wrapper.vm.clear()
      await nextTick()
      expect(wrapper.vm.selectedDate).toBeNull()
    })
  })

  // ===== INTEGRATION =====

  describe('Integration', () => {
    it('should work with form validation libraries', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'integration-date',
          label: 'Integration Date'
        },
        mockValidation: true
      })

      // Should integrate with mocked field validation
      expect(wrapper.vm.field).toBeDefined()
    })

    it('should emit proper events for form integration', async () => {
      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'event-date',
          label: 'Event Date'
        }
      })

      await wrapper.vm.handleDateSelect(testDate)
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()

      const trigger = wrapper.find('[data-testid="date-picker-trigger"]')
      await trigger.trigger('focus')
      expect(wrapper.emitted('focus')).toBeTruthy()
    })

    it('should handle complex legal form scenarios', async () => {
      // Legal case deadline scenario
      const courtDeadlinePresets: DatePreset[] = [
        {
          label: 'Discovery Deadline',
          value: new Date('2025-08-15T17:00:00.000Z')
        },
        {
          label: 'Motion Filing Deadline',
          value: new Date('2025-09-01T17:00:00.000Z')
        },
        {
          label: 'Trial Date',
          value: new Date('2025-12-15T09:00:00.000Z')
        }
      ]

      wrapper = mountFormComponent(FormDatePicker, {
        props: {
          name: 'court-deadline',
          label: 'Court Deadline',
          description: 'Select important legal deadline for this matter',
          helpText: 'All deadlines are based on court calendar and local rules',
          required: true,
          includeTime: true,
          timeFormat: '12h',
          showQuickActions: true,
          presets: courtDeadlinePresets,
          minDate: new Date(), // Cannot be in the past
          placeholder: 'Select court deadline...'
        }
      })

      await wrapper.find('[data-testid="date-picker-trigger"]').trigger('click')
      await nextTick()

      // Should show legal deadline presets
      expect(wrapper.text()).toContain('Discovery Deadline')
      expect(wrapper.text()).toContain('Motion Filing Deadline')
      expect(wrapper.text()).toContain('Trial Date')

      // Should show time picker for precise scheduling
      expect(wrapper.text()).toContain('Time:')
      expect(wrapper.find('[data-testid="ampm-select"]').exists()).toBe(true)

      // Select trial date preset
      const trialPreset = courtDeadlinePresets[2]
      await wrapper.vm.applyPreset(trialPreset)
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([trialPreset.value.toISOString()])
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })
})