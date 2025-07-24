/**
 * Dynamic Field Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DynamicField from '../DynamicField.vue'
import type { ParsedTemplateVariable } from '~/composables/form/types'

// Mock the field mapping composable
vi.mock('~/composables/form/useFieldMapping', () => ({
  useFieldMapping: vi.fn(() => ({
    fieldComponent: { template: '<input v-bind="$attrs" />' },
    fieldProps: {
      id: 'test-field',
      name: 'test-field',
      label: 'Test Field',
      placeholder: 'Enter test value'
    }
  }))
}))

describe('DynamicField', () => {
  const createTestVariable = (overrides: Partial<ParsedTemplateVariable> = {}): ParsedTemplateVariable => ({
    name: 'test-field',
    path: ['test'],
    type: { base: 'text' },
    label: 'Test Field',
    placeholder: 'Enter test value',
    required: false,
    ...overrides
  })

  it('renders field component correctly', () => {
    const variable = createTestVariable()
    
    const wrapper = mount(DynamicField, {
      props: {
        variable,
        modelValue: 'test value'
      }
    })

    expect(wrapper.find('.dynamic-field').exists()).toBe(true)
  })

  it('applies correct CSS classes', () => {
    const variable = createTestVariable({ type: { base: 'email' } })
    
    const wrapper = mount(DynamicField, {
      props: {
        variable,
        errors: ['Error message'],
        disabled: true,
        size: 'lg'
      }
    })

    const fieldElement = wrapper.find('.dynamic-field')
    expect(fieldElement.classes()).toContain('dynamic-field--email')
    expect(fieldElement.classes()).toContain('dynamic-field--error')
    expect(fieldElement.classes()).toContain('dynamic-field--disabled')
    expect(fieldElement.classes()).toContain('dynamic-field--lg')
  })

  it('displays error messages when present', () => {
    const variable = createTestVariable()
    const errors = ['Field is required', 'Invalid format']
    
    const wrapper = mount(DynamicField, {
      props: {
        variable,
        errors
      }
    })

    const errorMessages = wrapper.findAll('.error-message')
    expect(errorMessages).toHaveLength(2)
    expect(errorMessages[0].text()).toBe('Field is required')
    expect(errorMessages[1].text()).toBe('Invalid format')
  })

  it('displays help text when available', () => {
    const variable = createTestVariable({
      metadata: {
        helpText: 'This is help text'
      }
    })
    
    const wrapper = mount(DynamicField, {
      props: { variable }
    })

    expect(wrapper.find('.field-help').text()).toBe('This is help text')
  })

  it('emits update:modelValue when field value changes', async () => {
    const variable = createTestVariable()
    
    const wrapper = mount(DynamicField, {
      props: {
        variable,
        modelValue: ''
      }
    })

    // Simulate field component emitting update:modelValue
    await wrapper.vm.$emit('update:modelValue', 'new value')

    expect(wrapper.emitted('update:modelValue')).toEqual([['new value']])
    expect(wrapper.emitted('change')).toEqual([['new value']])
  })

  it('emits blur and focus events', async () => {
    const variable = createTestVariable()
    const mockBlurEvent = new FocusEvent('blur')
    const mockFocusEvent = new FocusEvent('focus')
    
    const wrapper = mount(DynamicField, {
      props: { variable }
    })

    await wrapper.vm.$emit('blur', mockBlurEvent)
    await wrapper.vm.$emit('focus', mockFocusEvent)

    expect(wrapper.emitted('blur')).toEqual([[mockBlurEvent]])
    expect(wrapper.emitted('focus')).toEqual([[mockFocusEvent]])
  })

  it('handles readonly state correctly', () => {
    const variable = createTestVariable()
    
    const wrapper = mount(DynamicField, {
      props: {
        variable,
        readonly: true
      }
    })

    expect(wrapper.find('.dynamic-field').classes()).toContain('dynamic-field--readonly')
  })

  it('does not display errors when none provided', () => {
    const variable = createTestVariable()
    
    const wrapper = mount(DynamicField, {
      props: { variable }
    })

    expect(wrapper.find('.field-errors').exists()).toBe(false)
  })

  it('handles different field sizes', () => {
    const variable = createTestVariable()
    
    const wrapperSm = mount(DynamicField, {
      props: { variable, size: 'sm' }
    })
    
    const wrapperLg = mount(DynamicField, {
      props: { variable, size: 'lg' }
    })

    expect(wrapperSm.find('.dynamic-field').classes()).toContain('dynamic-field--sm')
    expect(wrapperLg.find('.dynamic-field').classes()).toContain('dynamic-field--lg')
  })
})