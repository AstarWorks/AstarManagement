/**
 * Dynamic Form Builder Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DynamicFormBuilder from '../DynamicFormBuilder.vue'
import type { ParsedTemplateVariable } from '~/composables/form/types'

// Mock dependencies
vi.mock('~/composables/form/useDynamicForm', () => ({
  useDynamicForm: vi.fn(() => ({
    formData: { value: { firstName: 'John', lastName: 'Doe' } },
    fieldGroups: { 
      value: [
        {
          id: 'group-client',
          section: 'client',
          title: 'Client Information',
          fields: [],
          columns: 2
        }
      ] 
    },
    isValid: { value: true },
    isDirty: { value: false },
    isSubmitting: { value: false },
    globalErrors: { value: {} },
    isLoading: { value: false },
    handleSubmit: vi.fn(),
    handleFieldUpdate: vi.fn(),
    handleReset: vi.fn(),
    validateForm: vi.fn(),
    getFieldLabel: vi.fn(name => name)
  }))
}))

vi.mock('~/composables/useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    isMobile: { value: false }
  }))
}))

// Mock child components
vi.mock('../DynamicFieldGroup.vue', () => ({
  default: {
    name: 'DynamicFieldGroup',
    template: '<div class="mock-field-group">{{ group.title }}</div>',
    props: ['group', 'formData', 'disabled', 'readonly', 'size']
  }
}))

vi.mock('~/components/ui/button', () => ({
  Button: {
    name: 'Button',
    template: '<button class="mock-button" v-bind="$attrs"><slot /></button>',
    props: ['type', 'variant', 'disabled', 'loading']
  }
}))

describe('DynamicFormBuilder', () => {
  const createTestVariable = (name: string): ParsedTemplateVariable => ({
    name,
    path: [name],
    type: { base: 'text' },
    label: `${name} Label`,
    placeholder: `Enter ${name}`,
    required: false
  })

  const defaultProps = {
    variables: [
      createTestVariable('firstName'),
      createTestVariable('lastName')
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form with field groups', () => {
    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps
    })

    expect(wrapper.find('form.dynamic-form-builder').exists()).toBe(true)
    expect(wrapper.find('.mock-field-group').text()).toBe('Client Information')
  })

  it('displays loading state correctly', async () => {
    // Mock loading state
    const { useDynamicForm } = await import('~/composables/form/useDynamicForm')
    vi.mocked(useDynamicForm).mockReturnValue({
      ...vi.mocked(useDynamicForm)(),
      isLoading: { value: true }
    } as any)

    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps
    })

    expect(wrapper.find('.form-loading').exists()).toBe(true)
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('displays error state when global errors exist', async () => {
    const { useDynamicForm } = await import('~/composables/form/useDynamicForm')
    vi.mocked(useDynamicForm).mockReturnValue({
      ...vi.mocked(useDynamicForm)(),
      globalErrors: { value: { firstName: 'Required field' } },
      isLoading: { value: false }
    } as any)

    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps
    })

    expect(wrapper.find('.form-errors').exists()).toBe(true)
    expect(wrapper.find('.error-title').text()).toBe('Please fix the following errors:')
  })

  it('handles form submission correctly', async () => {
    const mockHandleSubmit = vi.fn()
    const { useDynamicForm } = await import('~/composables/form/useDynamicForm')
    vi.mocked(useDynamicForm).mockReturnValue({
      ...vi.mocked(useDynamicForm)(),
      handleSubmit: mockHandleSubmit
    } as any)

    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps
    })

    await wrapper.find('form').trigger('submit')

    expect(mockHandleSubmit).toHaveBeenCalled()
  })

  it('shows submit and reset buttons when not readonly', () => {
    const wrapper = mount(DynamicFormBuilder, {
      props: {
        ...defaultProps,
        readonly: false
      }
    })

    const buttons = wrapper.findAll('.mock-button')
    expect(buttons).toHaveLength(2)
    expect(buttons[1].text()).toBe('Generate Document')
  })

  it('hides form actions when readonly', () => {
    const wrapper = mount(DynamicFormBuilder, {
      props: {
        ...defaultProps,
        readonly: true
      }
    })

    expect(wrapper.find('.form-actions').exists()).toBe(false)
  })

  it('customizes button text correctly', () => {
    const wrapper = mount(DynamicFormBuilder, {
      props: {
        ...defaultProps,
        submitButtonText: 'Create Document',
        resetButtonText: 'Clear Form'
      }
    })

    const buttons = wrapper.findAll('.mock-button')
    expect(buttons[0].text()).toBe('Clear Form')
    expect(buttons[1].text()).toBe('Create Document')
  })

  it('disables submit button when form is invalid', async () => {
    const { useDynamicForm } = await import('~/composables/form/useDynamicForm')
    vi.mocked(useDynamicForm).mockReturnValue({
      ...vi.mocked(useDynamicForm)(),
      isValid: { value: false }
    } as any)

    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps
    })

    const submitButton = wrapper.findAll('.mock-button')[1]
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('disables reset button when form is not dirty', async () => {
    const { useDynamicForm } = await import('~/composables/form/useDynamicForm')
    vi.mocked(useDynamicForm).mockReturnValue({
      ...vi.mocked(useDynamicForm)(),
      isDirty: { value: false }
    } as any)

    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps
    })

    const resetButton = wrapper.findAll('.mock-button')[0]
    expect(resetButton.attributes('disabled')).toBeDefined()
  })

  it('applies mobile classes when on mobile', async () => {
    const { useResponsive } = await import('~/composables/useResponsive')
    vi.mocked(useResponsive).mockReturnValue({
      isMobile: { value: true }
    } as any)

    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps
    })

    expect(wrapper.find('.dynamic-form-builder').classes()).toContain('dynamic-form-builder--mobile')
  })

  it('applies readonly classes when readonly', () => {
    const wrapper = mount(DynamicFormBuilder, {
      props: {
        ...defaultProps,
        readonly: true
      }
    })

    expect(wrapper.find('.dynamic-form-builder').classes()).toContain('dynamic-form-builder--readonly')
  })

  it('handles reset button click', async () => {
    const mockHandleReset = vi.fn()
    const { useDynamicForm } = await import('~/composables/form/useDynamicForm')
    vi.mocked(useDynamicForm).mockReturnValue({
      ...vi.mocked(useDynamicForm)(),
      handleReset: mockHandleReset,
      isDirty: { value: true }
    } as any)

    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps
    })

    await wrapper.findAll('.mock-button')[0].trigger('click')

    expect(mockHandleReset).toHaveBeenCalled()
  })

  it('renders header and footer slots', () => {
    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps,
      slots: {
        header: '<div class="custom-header">Custom Header</div>',
        footer: '<div class="custom-footer">Custom Footer</div>'
      }
    })

    expect(wrapper.find('.custom-header').text()).toBe('Custom Header')
    expect(wrapper.find('.custom-footer').text()).toBe('Custom Footer')
  })

  it('renders custom actions slot', () => {
    const wrapper = mount(DynamicFormBuilder, {
      props: defaultProps,
      slots: {
        actions: '<div class="custom-actions">Custom Actions</div>'
      }
    })

    expect(wrapper.find('.custom-actions').text()).toBe('Custom Actions')
  })

  it('hides reset button when showResetButton is false', () => {
    const wrapper = mount(DynamicFormBuilder, {
      props: {
        ...defaultProps,
        showResetButton: false
      }
    })

    const buttons = wrapper.findAll('.mock-button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].text()).toBe('Generate Document')
  })
})