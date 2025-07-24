import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MatterTypeField from '../MatterTypeField.vue'

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

// Mock vee-validate
vi.mock('vee-validate', () => ({
  useField: vi.fn(() => ({
    value: '',
    setValue: vi.fn(),
    errorMessage: '',
    meta: { touched: false, dirty: false, valid: true }
  }))
}))

describe('MatterTypeField', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props', () => {
    const wrapper = mount(MatterTypeField)
    
    expect(wrapper.find('.form-wrapper').exists()).toBe(true)
    expect(wrapper.find('label').text()).toContain('Matter Type')
    expect(wrapper.find('.description').text()).toContain('Select the type of legal matter')
  })

  it('passes correct props to FormSelect', () => {
    const wrapper = mount(MatterTypeField, {
      props: {
        name: 'customType',
        placeholder: 'Custom placeholder',
        error: 'Test error'
      }
    })

    const formSelect = wrapper.findComponent({ name: 'FormSelect' })
    expect(formSelect.props('name')).toBe('customType')
    expect(formSelect.props('placeholder')).toBe('Custom placeholder')
    expect(formSelect.props('error')).toBe('Test error')
  })

  it('displays all matter type options', () => {
    const wrapper = mount(MatterTypeField)
    
    // Check that the component has the expected matter type options
    const component = wrapper.vm as any
    const options = component.selectOptions
    
    expect(options).toEqual([
      { value: 'CIVIL', label: 'Civil Litigation' },
      { value: 'CRIMINAL', label: 'Criminal Defense' },
      { value: 'CORPORATE', label: 'Corporate Law' },
      { value: 'FAMILY', label: 'Family Law' },
      { value: 'IMMIGRATION', label: 'Immigration' },
      { value: 'INTELLECTUAL_PROPERTY', label: 'Intellectual Property' },
      { value: 'LABOR', label: 'Labor & Employment' },
      { value: 'REAL_ESTATE', label: 'Real Estate' },
      { value: 'TAX', label: 'Tax Law' },
      { value: 'OTHER', label: 'Other' }
    ])
  })

  it('shows matter type descriptions when details are expanded', async () => {
    const wrapper = mount(MatterTypeField)
    
    const details = wrapper.find('details')
    expect(details.exists()).toBe(true)
    
    const summary = wrapper.find('summary')
    expect(summary.text()).toContain('View matter type descriptions')
    
    // Simulate clicking the summary to expand details
    await summary.trigger('click')
    await nextTick()
    
    // Check that all matter types are shown with descriptions
    const descriptions = wrapper.findAll('.flex.justify-between')
    expect(descriptions.length).toBe(10) // Number of matter types
    
    // Check specific matter type descriptions
    expect(wrapper.text()).toContain('Civil Litigation: Civil disputes between parties')
    expect(wrapper.text()).toContain('Corporate Law: Business and corporate legal matters')
    expect(wrapper.text()).toContain('Family Law: Divorce, custody, and family matters')
  })

  it('applies required styling when required prop is true', () => {
    const wrapper = mount(MatterTypeField, {
      props: {
        required: true
      }
    })

    const formWrapper = wrapper.findComponent({ name: 'FormFieldWrapper' })
    expect(formWrapper.props('required')).toBe(true)
  })

  it('uses default field name when not provided', () => {
    const wrapper = mount(MatterTypeField)
    const formSelect = wrapper.findComponent({ name: 'FormSelect' })
    expect(formSelect.props('name')).toBe('type')
  })

  it('uses default placeholder when not provided', () => {
    const wrapper = mount(MatterTypeField)
    const formSelect = wrapper.findComponent({ name: 'FormSelect' })
    expect(formSelect.props('placeholder')).toBe('Select matter type...')
  })

  it('handles error prop correctly', () => {
    const errorMessage = 'This field is required'
    const wrapper = mount(MatterTypeField, {
      props: {
        error: errorMessage
      }
    })

    const formSelect = wrapper.findComponent({ name: 'FormSelect' })
    expect(formSelect.props('error')).toBe(errorMessage)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(MatterTypeField)
    
    const details = wrapper.find('details')
    expect(details.exists()).toBe(true)
    expect(details.classes()).toContain('cursor-pointer')
    
    const summary = wrapper.find('summary')
    expect(summary.classes()).toContain('hover:text-foreground')
  })

  it('matches snapshot', () => {
    const wrapper = mount(MatterTypeField, {
      props: {
        name: 'type',
        required: true,
        placeholder: 'Select matter type...'
      }
    })
    
    expect(wrapper.html()).toMatchSnapshot()
  })
})