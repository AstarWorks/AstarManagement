import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MatterStatusField from '../MatterStatusField.vue'

// Mock the form components
vi.mock('~/components/forms', () => ({
  FormSelect: {
    template: '<select v-model="modelValue" @update:modelValue="$emit(\'update:modelValue\', $event)"><slot /></select>',
    props: ['name', 'placeholder', 'options', 'error', 'modelValue'],
    emits: ['update:modelValue']
  },
  FormFieldWrapper: {
    template: '<div class="form-wrapper"><label v-if="label">{{ label }}<span v-if="required"> *</span></label><div class="description" v-if="description">{{ description }}</div><slot /></div>',
    props: ['label', 'description', 'required']
  }
}))

// Mock UI components
vi.mock('~/components/ui/badge', () => ({
  Badge: {
    template: '<span class="badge" :class="variant"><slot /></span>',
    props: ['variant']
  }
}))

// Mock vee-validate
vi.mock('vee-validate', () => ({
  useField: vi.fn(() => ({
    value: '',
    setValue: vi.fn(),
    errorMessage: '',
    meta: { touched: false, dirty: false, valid: true }
  }))
}))

describe('MatterStatusField', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props', () => {
    const wrapper = mount(MatterStatusField)
    
    expect(wrapper.find('.form-wrapper').exists()).toBe(true)
    expect(wrapper.find('label').text()).toContain('Matter Status')
    expect(wrapper.find('.description').text()).toContain('Current status of the legal matter')
  })

  it('passes correct props to FormSelect', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        name: 'customStatus',
        placeholder: 'Custom placeholder',
        error: 'Test error'
      }
    })

    const formSelect = wrapper.findComponent({ name: 'FormSelect' })
    expect(formSelect.props('name')).toBe('customStatus')
    expect(formSelect.props('placeholder')).toBe('Custom placeholder')
    expect(formSelect.props('error')).toBe('Test error')
  })

  it('displays all status options when no current status is provided', () => {
    const wrapper = mount(MatterStatusField)
    
    const component = wrapper.vm as any
    const options = component.availableOptions
    
    expect(options).toEqual([
      { value: 'INVESTIGATION', label: 'Investigation' },
      { value: 'RESEARCH', label: 'Research' },
      { value: 'MEDIATION', label: 'Mediation' },
      { value: 'TRIAL', label: 'Trial' },
      { value: 'SETTLEMENT', label: 'Settlement' },
      { value: 'CLOSED', label: 'Closed' }
    ])
  })

  it('shows current status badge when currentStatus prop is provided', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        currentStatus: 'INVESTIGATION'
      }
    })

    expect(wrapper.text()).toContain('Current Status:')
    const badge = wrapper.findComponent({ name: 'Badge' })
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Investigation')
  })

  it('restricts transitions based on current status', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        currentStatus: 'INVESTIGATION'
      }
    })

    const component = wrapper.vm as any
    const availableOptions = component.availableOptions

    // From INVESTIGATION, should only allow RESEARCH, MEDIATION, CLOSED
    const expectedValues = ['RESEARCH', 'MEDIATION', 'CLOSED']
    const actualValues = availableOptions.map((opt: any) => opt.value)
    
    expect(actualValues).toEqual(expectedValues)
  })

  it('shows no transitions from CLOSED status', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        currentStatus: 'CLOSED'
      }
    })

    const component = wrapper.vm as any
    const availableOptions = component.availableOptions
    
    expect(availableOptions).toEqual([])
  })

  it('shows workflow guidance when current status is provided and not closed', async () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        currentStatus: 'INVESTIGATION'
      }
    })

    const details = wrapper.find('details')
    expect(details.exists()).toBe(true)
    
    const summary = wrapper.find('summary')
    expect(summary.text()).toContain('View status workflow guidance')
    
    // Simulate clicking to expand
    await summary.trigger('click')
    await nextTick()
    
    expect(wrapper.text()).toContain('Typical workflow progression')
    expect(wrapper.text()).toContain('Investigation: Initial fact-finding and case assessment')
    expect(wrapper.text()).toContain('Research: Legal research and case preparation')
  })

  it('shows warning when matter is closed', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        currentStatus: 'CLOSED'
      }
    })

    expect(wrapper.text()).toContain('This matter is closed. Status cannot be changed once a matter is closed.')
    expect(wrapper.find('.text-amber-600').exists()).toBe(true)
  })

  it('validates status transitions correctly', () => {
    const wrapper = mount(MatterStatusField)
    const component = wrapper.vm as any

    // Test RESEARCH transitions
    const researchTransitions = component.getValidTransitions('RESEARCH')
    const researchValues = researchTransitions.map((opt: any) => opt.value)
    expect(researchValues).toEqual(['MEDIATION', 'TRIAL', 'SETTLEMENT', 'CLOSED'])

    // Test TRIAL transitions
    const trialTransitions = component.getValidTransitions('TRIAL')
    const trialValues = trialTransitions.map((opt: any) => opt.value)
    expect(trialValues).toEqual(['SETTLEMENT', 'CLOSED'])

    // Test SETTLEMENT transitions
    const settlementTransitions = component.getValidTransitions('SETTLEMENT')
    const settlementValues = settlementTransitions.map((opt: any) => opt.value)
    expect(settlementValues).toEqual(['CLOSED'])
  })

  it('gets status metadata correctly', () => {
    const wrapper = mount(MatterStatusField)
    const component = wrapper.vm as any

    const investigationMeta = component.getStatusMeta('INVESTIGATION')
    expect(investigationMeta).toEqual({
      value: 'INVESTIGATION',
      label: 'Investigation',
      description: 'Initial fact-finding and case assessment',
      color: 'blue',
      order: 1
    })

    const trialMeta = component.getStatusMeta('TRIAL')
    expect(trialMeta).toEqual({
      value: 'TRIAL',
      label: 'Trial',
      description: 'Active litigation or trial proceedings',
      color: 'red',
      order: 4
    })
  })

  it('hides transition guidance when current status is CLOSED', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        currentStatus: 'CLOSED'
      }
    })

    const component = wrapper.vm as any
    expect(component.showTransitionGuidance).toBe(false)
    expect(wrapper.find('details').exists()).toBe(false)
  })

  it('applies required styling when required prop is true', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        required: true
      }
    })

    const formWrapper = wrapper.findComponent({ name: 'FormFieldWrapper' })
    expect(formWrapper.props('required')).toBe(true)
  })

  it('uses default field name when not provided', () => {
    const wrapper = mount(MatterStatusField)
    const formSelect = wrapper.findComponent({ name: 'FormSelect' })
    expect(formSelect.props('name')).toBe('status')
  })

  it('handles error prop correctly', () => {
    const errorMessage = 'Invalid status'
    const wrapper = mount(MatterStatusField, {
      props: {
        error: errorMessage
      }
    })

    const formSelect = wrapper.findComponent({ name: 'FormSelect' })
    expect(formSelect.props('error')).toBe(errorMessage)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        currentStatus: 'INVESTIGATION'
      }
    })
    
    const details = wrapper.find('details')
    expect(details.exists()).toBe(true)
    expect(details.classes()).toContain('cursor-pointer')
    
    const summary = wrapper.find('summary')
    expect(summary.classes()).toContain('hover:text-foreground')
  })

  it('matches snapshot for normal state', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        name: 'status',
        required: true,
        currentStatus: 'INVESTIGATION'
      }
    })
    
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches snapshot for closed state', () => {
    const wrapper = mount(MatterStatusField, {
      props: {
        name: 'status',
        required: true,
        currentStatus: 'CLOSED'
      }
    })
    
    expect(wrapper.html()).toMatchSnapshot()
  })
})