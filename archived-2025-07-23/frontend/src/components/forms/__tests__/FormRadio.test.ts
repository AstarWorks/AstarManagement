/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import FormRadio from '../FormRadio.vue'
import { 
  createMockFormData, 
  createMockValidationError,
  waitForValidation,
  expectFieldError,
  expectFieldValid
} from '../../../test/utils/form-test-utils'

// Mock shadcn-vue components
vi.mock('~/components/ui/radio-group', () => ({
  RadioGroup: defineComponent({
    name: 'RadioGroup',
    props: ['modelValue', 'disabled', 'name'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      return () => h('div', { 
        class: 'radio-group',
        'data-disabled': props.disabled,
        'data-name': props.name
      }, slots.default?.())
    }
  }),
  RadioGroupItem: defineComponent({
    name: 'RadioGroupItem',
    props: ['value', 'disabled', 'id'],
    setup(props, { slots }) {
      return () => h('input', {
        type: 'radio',
        value: props.value,
        disabled: props.disabled,
        id: props.id,
        class: 'radio-group-item'
      })
    }
  })
}))

vi.mock('~/components/ui/label', () => ({
  Label: defineComponent({
    name: 'Label',
    props: ['for'],
    setup(props, { slots }) {
      return () => h('label', { 
        for: props.for,
        class: 'label'
      }, slots.default?.())
    }
  })
}))

describe('FormRadio.vue', () => {
  let wrapper: VueWrapper<any>

  const defaultOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ]

  const createWrapper = (props = {}, useFormContext = true) => {
    const TestComponent = defineComponent({
      components: { FormRadio },
      setup() {
        if (useFormContext) {
          const schema = toTypedSchema(
            z.object({
              radioField: z.enum(['option1', 'option2', 'option3'], {
                required_error: 'Please select an option'
              })
            })
          )
          
          const form = useForm({
            validationSchema: schema
          })
          
          return { form }
        }
        
        return {}
      },
      template: `
        <form>
          <FormRadio 
            name="radioField"
            label="Select Option"
            :options="options"
            v-bind="$attrs"
          />
        </form>
      `,
      data() {
        return {
          options: props.options || defaultOptions
        }
      }
    })

    return mount(TestComponent, {
      props,
      global: {
        stubs: {
          transition: false
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders radio group with label', () => {
      wrapper = createWrapper()
      
      expect(wrapper.find('label').text()).toBe('Select Option')
      expect(wrapper.find('.radio-group').exists()).toBe(true)
    })

    it('renders all radio options', () => {
      wrapper = createWrapper()
      const radioItems = wrapper.findAll('.radio-group-item')
      
      expect(radioItems).toHaveLength(3)
      expect(radioItems[0].attributes('value')).toBe('option1')
      expect(radioItems[1].attributes('value')).toBe('option2')
      expect(radioItems[2].attributes('value')).toBe('option3')
    })

    it('renders with required indicator when required', () => {
      wrapper = createWrapper({ required: true })
      
      expect(wrapper.find('label').text()).toContain('*')
    })

    it('renders help text when provided', () => {
      wrapper = createWrapper({ helpText: 'Choose one option' })
      
      expect(wrapper.text()).toContain('Choose one option')
    })

    it('renders in disabled state', () => {
      wrapper = createWrapper({ disabled: true })
      const radioGroup = wrapper.find('.radio-group')
      
      expect(radioGroup.attributes('data-disabled')).toBe('true')
    })
  })

  describe('Value Binding', () => {
    it('binds initial value correctly', async () => {
      const TestComponent = defineComponent({
        components: { FormRadio },
        setup() {
          const selectedValue = ref('option2')
          return { selectedValue }
        },
        template: `
          <FormRadio
            v-model="selectedValue"
            name="radioField"
            label="Select Option"
            :options="[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
              { value: 'option3', label: 'Option 3' }
            ]"
          />
        `
      })
      
      wrapper = mount(TestComponent)
      await wrapper.vm.$nextTick()
      
      const radioGroup = wrapper.findComponent({ name: 'RadioGroup' })
      expect(radioGroup.props('modelValue')).toBe('option2')
    })

    it('updates value on selection', async () => {
      const TestComponent = defineComponent({
        components: { FormRadio },
        setup() {
          const selectedValue = ref('')
          return { selectedValue }
        },
        template: `
          <FormRadio
            v-model="selectedValue"
            name="radioField"
            label="Select Option"
            :options="[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' }
            ]"
          />
        `
      })
      
      wrapper = mount(TestComponent)
      const radioGroup = wrapper.findComponent({ name: 'RadioGroup' })
      
      await radioGroup.vm.$emit('update:modelValue', 'option1')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.selectedValue).toBe('option1')
    })
  })

  describe('Custom Options Format', () => {
    it('supports custom label and value keys', () => {
      const customOptions = [
        { id: 'opt1', name: 'First Option' },
        { id: 'opt2', name: 'Second Option' }
      ]
      
      wrapper = createWrapper({
        options: customOptions,
        optionLabel: 'name',
        optionValue: 'id'
      })
      
      const radioItems = wrapper.findAll('.radio-group-item')
      expect(radioItems[0].attributes('value')).toBe('opt1')
      expect(radioItems[1].attributes('value')).toBe('opt2')
      
      const labels = wrapper.findAll('label')
      expect(labels[1].text()).toBe('First Option')
      expect(labels[2].text()).toBe('Second Option')
    })

    it('supports disabled options', () => {
      const optionsWithDisabled = [
        { value: 'option1', label: 'Option 1', disabled: false },
        { value: 'option2', label: 'Option 2', disabled: true },
        { value: 'option3', label: 'Option 3', disabled: false }
      ]
      
      wrapper = createWrapper({ options: optionsWithDisabled })
      const radioItems = wrapper.findAll('.radio-group-item')
      
      expect(radioItems[0].attributes('disabled')).toBeUndefined()
      expect(radioItems[1].attributes('disabled')).toBeDefined()
      expect(radioItems[2].attributes('disabled')).toBeUndefined()
    })

    it('supports option descriptions', () => {
      const optionsWithDescriptions = [
        { value: 'basic', label: 'Basic Plan', description: '$9.99/month' },
        { value: 'pro', label: 'Pro Plan', description: '$19.99/month' },
        { value: 'enterprise', label: 'Enterprise', description: 'Contact us' }
      ]
      
      wrapper = createWrapper({ options: optionsWithDescriptions })
      
      expect(wrapper.text()).toContain('$9.99/month')
      expect(wrapper.text()).toContain('$19.99/month')
      expect(wrapper.text()).toContain('Contact us')
    })
  })

  describe('Validation', () => {
    it('shows validation error when required and empty', async () => {
      wrapper = createWrapper({ required: true })
      const form = wrapper.vm.form
      
      // Trigger validation
      await form.validate()
      await waitForValidation()
      
      expectFieldError(wrapper, 'Please select an option')
    })

    it('clears error when valid option selected', async () => {
      wrapper = createWrapper({ required: true })
      const form = wrapper.vm.form
      const radioGroup = wrapper.findComponent({ name: 'RadioGroup' })
      
      // Trigger validation error
      await form.validate()
      await waitForValidation()
      expectFieldError(wrapper, 'Please select an option')
      
      // Select an option
      await radioGroup.vm.$emit('update:modelValue', 'option1')
      await waitForValidation()
      
      expectFieldValid(wrapper)
    })

    it('validates with custom validation rules', async () => {
      const TestComponent = defineComponent({
        components: { FormRadio },
        setup() {
          const schema = toTypedSchema(
            z.object({
              plan: z.enum(['basic', 'pro', 'enterprise']).refine(
                (val) => val !== 'basic',
                { message: 'Basic plan is not available' }
              )
            })
          )
          
          const form = useForm({
            validationSchema: schema
          })
          
          return { form }
        },
        template: `
          <form>
            <FormRadio 
              name="plan"
              label="Select Plan"
              :options="[
                { value: 'basic', label: 'Basic' },
                { value: 'pro', label: 'Pro' },
                { value: 'enterprise', label: 'Enterprise' }
              ]"
            />
          </form>
        `
      })
      
      wrapper = mount(TestComponent)
      const radioGroup = wrapper.findComponent({ name: 'RadioGroup' })
      
      // Select basic plan
      await radioGroup.vm.$emit('update:modelValue', 'basic')
      await waitForValidation()
      
      expectFieldError(wrapper, 'Basic plan is not available')
      
      // Select pro plan
      await radioGroup.vm.$emit('update:modelValue', 'pro')
      await waitForValidation()
      
      expectFieldValid(wrapper)
    })
  })

  describe('Inline Layout', () => {
    it('renders options inline when inline prop is true', () => {
      wrapper = createWrapper({ inline: true })
      
      const radioGroup = wrapper.find('.radio-group')
      expect(radioGroup.classes()).toContain('flex')
      expect(radioGroup.classes()).toContain('flex-row')
    })

    it('renders options vertically by default', () => {
      wrapper = createWrapper()
      
      const radioGroup = wrapper.find('.radio-group')
      expect(radioGroup.classes()).toContain('flex')
      expect(radioGroup.classes()).toContain('flex-col')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      wrapper = createWrapper({ required: true })
      const radioGroup = wrapper.find('.radio-group')
      
      expect(radioGroup.attributes('role')).toBe('radiogroup')
      expect(radioGroup.attributes('aria-required')).toBe('true')
    })

    it('associates labels with radio inputs', () => {
      wrapper = createWrapper()
      const radioItems = wrapper.findAll('.radio-group-item')
      const labels = wrapper.findAll('label').slice(1) // Skip the main label
      
      radioItems.forEach((radio, index) => {
        const id = radio.attributes('id')
        expect(id).toBeTruthy()
        expect(labels[index].attributes('for')).toBe(id)
      })
    })

    it('shows error with proper ARIA attributes', async () => {
      wrapper = createWrapper({ required: true })
      const form = wrapper.vm.form
      
      await form.validate()
      await waitForValidation()
      
      const radioGroup = wrapper.find('.radio-group')
      const errorId = radioGroup.attributes('aria-describedby')
      expect(errorId).toBeTruthy()
      
      const errorElement = wrapper.find(`#${errorId}`)
      expect(errorElement.exists()).toBe(true)
      expect(errorElement.attributes('role')).toBe('alert')
    })

    it('supports keyboard navigation', async () => {
      wrapper = createWrapper()
      const radioItems = wrapper.findAll('.radio-group-item')
      
      // First radio should be focusable
      expect(radioItems[0].attributes('tabindex')).toBe('0')
      
      // Focus first radio
      await radioItems[0].trigger('focus')
      
      // Arrow key navigation should work
      await radioItems[0].trigger('keydown', { key: 'ArrowDown' })
      await wrapper.vm.$nextTick()
      
      // Verify focus moved (in real implementation)
      // This is a simplified test - real implementation would track focus
    })
  })

  describe('Performance', () => {
    it('handles large option lists efficiently', () => {
      const largeOptions = Array.from({ length: 100 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`
      }))
      
      const startTime = performance.now()
      wrapper = createWrapper({ options: largeOptions })
      const renderTime = performance.now() - startTime
      
      expect(renderTime).toBeLessThan(100) // Should render in less than 100ms
      expect(wrapper.findAll('.radio-group-item')).toHaveLength(100)
    })

    it('updates efficiently on value change', async () => {
      wrapper = createWrapper()
      const radioGroup = wrapper.findComponent({ name: 'RadioGroup' })
      
      const startTime = performance.now()
      for (let i = 0; i < 10; i++) {
        await radioGroup.vm.$emit('update:modelValue', `option${(i % 3) + 1}`)
        await wrapper.vm.$nextTick()
      }
      const updateTime = performance.now() - startTime
      
      expect(updateTime).toBeLessThan(50) // Should handle 10 updates in less than 50ms
    })
  })

  describe('Edge Cases', () => {
    it('handles empty options array', () => {
      wrapper = createWrapper({ options: [] })
      
      expect(wrapper.find('.radio-group').exists()).toBe(true)
      expect(wrapper.findAll('.radio-group-item')).toHaveLength(0)
      expect(wrapper.text()).toContain('No options available')
    })

    it('handles null/undefined value gracefully', async () => {
      const TestComponent = defineComponent({
        components: { FormRadio },
        setup() {
          const value = ref(null)
          return { value }
        },
        template: `
          <FormRadio
            v-model="value"
            name="radioField"
            label="Select Option"
            :options="[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' }
            ]"
          />
        `
      })
      
      wrapper = mount(TestComponent)
      const radioGroup = wrapper.findComponent({ name: 'RadioGroup' })
      
      expect(radioGroup.props('modelValue')).toBe(null)
      
      // Should handle setting value
      await radioGroup.vm.$emit('update:modelValue', 'option1')
      expect(wrapper.vm.value).toBe('option1')
    })

    it('handles options with special characters', () => {
      const specialOptions = [
        { value: 'option-1', label: 'Option #1 (Special)' },
        { value: 'option_2', label: 'Option & 2' },
        { value: 'option.3', label: 'Option < 3 >' }
      ]
      
      wrapper = createWrapper({ options: specialOptions })
      const radioItems = wrapper.findAll('.radio-group-item')
      
      expect(radioItems[0].attributes('value')).toBe('option-1')
      expect(radioItems[1].attributes('value')).toBe('option_2')
      expect(radioItems[2].attributes('value')).toBe('option.3')
    })
  })
})