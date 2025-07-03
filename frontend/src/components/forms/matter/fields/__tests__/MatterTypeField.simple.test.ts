import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, config } from '@vue/test-utils'

// Mock the dependencies before importing the component
vi.mock('~/components/forms', () => ({
  FormSelect: {
    template: '<select data-testid="form-select"><slot /></select>',
    props: ['name', 'placeholder', 'options', 'error']
  },
  FormFieldWrapper: {
    template: '<div data-testid="form-wrapper"><slot /></div>',
    props: ['label', 'description', 'required']
  }
}))

vi.mock('vee-validate', () => ({
  useField: vi.fn(() => ({
    value: '',
    setValue: vi.fn(),
    errorMessage: '',
    meta: { touched: false, dirty: false, valid: true }
  }))
}))

// Set up global stubs for testing
config.global.stubs = {
  'FormSelect': true,
  'FormFieldWrapper': true
}

// Now import the component after mocks are set up
const MatterTypeField = () => import('../MatterTypeField.vue')

describe('MatterTypeField (Simple)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render successfully', async () => {
    const component = await MatterTypeField()
    const wrapper = mount(component.default)
    
    expect(wrapper.exists()).toBe(true)
  })

  it('should have matter type options', async () => {
    const component = await MatterTypeField()
    const wrapper = mount(component.default)
    
    const vm = wrapper.vm as any
    expect(vm.selectOptions).toBeDefined()
    expect(Array.isArray(vm.selectOptions)).toBe(true)
    expect(vm.selectOptions.length).toBeGreaterThan(0)
  })

  it('should include expected matter types', async () => {
    const component = await MatterTypeField()
    const wrapper = mount(component.default)
    
    const vm = wrapper.vm as any
    const matterTypes = vm.selectOptions.map((opt: any) => opt.value)
    
    expect(matterTypes).toContain('CIVIL')
    expect(matterTypes).toContain('CRIMINAL')
    expect(matterTypes).toContain('CORPORATE')
    expect(matterTypes).toContain('FAMILY')
  })

  it('should accept error prop', async () => {
    const component = await MatterTypeField()
    const wrapper = mount(component.default, {
      props: {
        error: 'Test error message'
      }
    })
    
    expect(wrapper.props('error')).toBe('Test error message')
  })

  it('should use default name prop', async () => {
    const component = await MatterTypeField()
    const wrapper = mount(component.default)
    
    expect(wrapper.props('name')).toBe('type')
  })

  it('should accept custom name prop', async () => {
    const component = await MatterTypeField()
    const wrapper = mount(component.default, {
      props: {
        name: 'customType'
      }
    })
    
    expect(wrapper.props('name')).toBe('customType')
  })
})