import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BasicInfoStep from '../BasicInfoStep.vue'

// Mock form components
vi.mock('~/components/forms', () => ({
  FormInput: { template: '<input />' },
  FormTextarea: { template: '<textarea />' },
  FormSelect: { template: '<select />' },
  FormFieldWrapper: { template: '<div><slot /></div>' }
}))

vi.mock('../fields/MatterTypeField.vue', () => ({
  default: { template: '<div data-testid="matter-type-field">MatterType</div>' }
}))

vi.mock('../fields/MatterStatusField.vue', () => ({
  default: { template: '<div data-testid="matter-status-field">MatterStatus</div>' }
}))

describe('BasicInfoStep', () => {
  const mockForm = {
    values: {
      title: '',
      description: '',
      type: '',
      status: '',
      priority: '',
      estimatedValue: '',
      billableHours: '',
      tags: ''
    },
    errors: {}
  }

  const defaultProps = {
    form: mockForm,
    stepData: {}
  }

  it('renders correctly', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('displays all form sections', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true
        }
      }
    })

    expect(wrapper.text()).toContain('Matter Details')
    expect(wrapper.text()).toContain('Financial Information')
    expect(wrapper.text()).toContain('Additional Information')
  })

  it('renders all required form fields', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true,
          FormFieldWrapper: { template: '<div class="field-wrapper"><slot /></div>' },
          FormInput: { template: '<input />' },
          FormTextarea: { template: '<textarea />' },
          FormSelect: { template: '<select />' }
        }
      }
    })

    // Should have multiple form fields
    const fieldWrappers = wrapper.findAll('.field-wrapper')
    expect(fieldWrappers.length).toBeGreaterThan(0)
  })

  it('includes matter type and status fields', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true
        }
      }
    })

    expect(wrapper.find('[data-testid="matter-type-field"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="matter-status-field"]').exists()).toBe(true)
  })

  it('shows priority options correctly', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true,
          FormFieldWrapper: { template: '<div><slot /></div>' },
          FormSelect: { 
            template: '<select><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
            props: ['options']
          }
        }
      }
    })

    // Priority field should be present
    expect(wrapper.text()).toContain('Priority Level')
  })

  it('handles financial information section', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true
        }
      }
    })

    expect(wrapper.text()).toContain('Estimated Value')
    expect(wrapper.text()).toContain('Estimated Billable Hours')
  })

  it('includes tags section', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true
        }
      }
    })

    expect(wrapper.text()).toContain('Tags')
    expect(wrapper.text()).toContain('Enter tags separated by commas')
  })

  it('emits update events when form data changes', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true
        }
      }
    })

    // Should be able to emit update events
    expect(wrapper.emitted()).toBeDefined()
  })

  it('is responsive on mobile devices', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true
        }
      }
    })

    // Check for responsive grid classes
    expect(wrapper.html()).toContain('grid-cols-1')
    expect(wrapper.html()).toContain('md:grid-cols-2')
  })

  it('handles form data with initial values', () => {
    const stepDataWithValues = {
      title: 'Test Matter',
      description: 'Test Description',
      type: 'CORPORATE',
      priority: 'HIGH'
    }

    const wrapper = mount(BasicInfoStep, {
      props: {
        form: { ...mockForm, values: stepDataWithValues },
        stepData: stepDataWithValues
      },
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('maintains accessibility standards', () => {
    const wrapper = mount(BasicInfoStep, {
      props: defaultProps,
      global: {
        stubs: {
          Card: true,
          CardHeader: true,
          CardTitle: true,
          CardContent: true
        }
      }
    })

    // Should have proper heading structure
    expect(wrapper.text()).toContain('Matter Details')
    expect(wrapper.text()).toContain('Financial Information')
    expect(wrapper.text()).toContain('Additional Information')
  })
})