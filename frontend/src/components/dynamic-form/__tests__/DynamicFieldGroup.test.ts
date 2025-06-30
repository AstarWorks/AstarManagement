/**
 * Dynamic Field Group Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DynamicFieldGroup from '../DynamicFieldGroup.vue'
import type { FieldGroup } from '../types'
import type { ParsedTemplateVariable } from '~/composables/form/types'

// Mock child components
vi.mock('../DynamicField.vue', () => ({
  default: {
    name: 'DynamicField',
    template: '<div class="mock-dynamic-field">{{ variable.name }}</div>',
    props: ['variable', 'modelValue', 'errors', 'disabled', 'readonly', 'size']
  }
}))

describe('DynamicFieldGroup', () => {
  const createTestVariable = (name: string): ParsedTemplateVariable => ({
    name,
    path: [name],
    type: { base: 'text' },
    label: `${name} Label`,
    placeholder: `Enter ${name}`,
    required: false
  })

  const createTestGroup = (overrides: Partial<FieldGroup> = {}): FieldGroup => ({
    id: 'test-group',
    section: 'client',
    title: 'Client Information',
    description: 'Basic client details',
    fields: [
      createTestVariable('firstName'),
      createTestVariable('lastName')
    ],
    columns: 2,
    collapsible: false,
    collapsed: false,
    ...overrides
  })

  it('renders group with header and fields', () => {
    const group = createTestGroup()
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: { firstName: 'John', lastName: 'Doe' }
      }
    })

    expect(wrapper.find('.group-title').text()).toBe('Client Information')
    expect(wrapper.find('.group-description').text()).toBe('Basic client details')
    expect(wrapper.findAll('.mock-dynamic-field')).toHaveLength(2)
  })

  it('applies correct grid classes based on columns', () => {
    const group = createTestGroup({ columns: 3 })
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: {}
      }
    })

    const fieldsContainer = wrapper.find('.group-fields')
    expect(fieldsContainer.classes()).toContain('lg:grid-cols-3')
  })

  it('handles collapsible groups correctly', async () => {
    const group = createTestGroup({ 
      collapsible: true,
      collapsed: false 
    })
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: {}
      }
    })

    // Initially expanded
    expect(wrapper.find('.group-fields').isVisible()).toBe(true)
    expect(wrapper.find('.collapse-icon').classes()).not.toContain('rotate-180')

    // Click header to collapse
    await wrapper.find('.group-header').trigger('click')

    // Should emit groupToggle event
    expect(wrapper.emitted('groupToggle')).toEqual([['test-group', true]])
  })

  it('starts collapsed when specified', () => {
    const group = createTestGroup({ 
      collapsible: true,
      collapsed: true 
    })
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: {}
      }
    })

    // Fields should be hidden
    expect(wrapper.find('.group-fields').isVisible()).toBe(false)
    expect(wrapper.find('.collapse-icon').classes()).toContain('rotate-180')
  })

  it('does not render header when no title or description', () => {
    const group = createTestGroup({ 
      title: '',
      description: undefined,
      collapsible: false 
    })
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: {}
      }
    })

    expect(wrapper.find('.group-header').exists()).toBe(false)
  })

  it('passes form data to child fields correctly', () => {
    const group = createTestGroup()
    const formData = { firstName: 'John', lastName: 'Doe' }
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData
      }
    })

    const dynamicFields = wrapper.findAllComponents({ name: 'DynamicField' })
    expect(dynamicFields[0].props('modelValue')).toBe('John')
    expect(dynamicFields[1].props('modelValue')).toBe('Doe')
  })

  it('emits update event when field changes', async () => {
    const group = createTestGroup()
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: {}
      }
    })

    // Simulate field update
    await wrapper.vm.handleFieldUpdate('firstName', 'John')

    expect(wrapper.emitted('update')).toEqual([['firstName', 'John']])
  })

  it('passes disabled and readonly props to fields', () => {
    const group = createTestGroup()
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: {},
        disabled: true,
        readonly: true,
        size: 'lg'
      }
    })

    const dynamicFields = wrapper.findAllComponents({ name: 'DynamicField' })
    dynamicFields.forEach(field => {
      expect(field.props('disabled')).toBe(true)
      expect(field.props('readonly')).toBe(true)
      expect(field.props('size')).toBe('lg')
    })
  })

  it('applies correct CSS classes', () => {
    const group = createTestGroup({ 
      section: 'matter',
      collapsible: true,
      collapsed: true 
    })
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: {}
      }
    })

    const groupElement = wrapper.find('.dynamic-field-group')
    expect(groupElement.classes()).toContain('dynamic-field-group--matter')
    expect(groupElement.classes()).toContain('dynamic-field-group--collapsible')
    expect(groupElement.classes()).toContain('dynamic-field-group--collapsed')
  })

  it('handles groups with many columns correctly', () => {
    const group = createTestGroup({ columns: 4 })
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: {}
      }
    })

    const fieldsContainer = wrapper.find('.group-fields')
    expect(fieldsContainer.classes()).toContain('xl:grid-cols-4')
  })

  it('does not allow header click when not collapsible', async () => {
    const group = createTestGroup({ collapsible: false })
    
    const wrapper = mount(DynamicFieldGroup, {
      props: {
        group,
        formData: {}
      }
    })

    const header = wrapper.find('.group-header')
    expect(header.classes()).not.toContain('cursor-pointer')

    await header.trigger('click')
    expect(wrapper.emitted('groupToggle')).toBeUndefined()
  })
})